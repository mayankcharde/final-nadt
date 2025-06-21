const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const UserCourse = require('../models/UserCourse');
const mongoose = require('mongoose');

// Course folder mapping
const courseNameMap = {
    'python': 'Python Course',
    'java': 'Java Course',
    'webdev': 'Web Development Course',
    'web': 'Web Development Course'
};

// Middleware to verify course access
const verifyCourseAccess = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization required' });
        }

        const token = authHeader.split('Bearer ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const { courseName } = req.params;
        const fullCourseName = courseNameMap[courseName];
        
        if (!fullCourseName) {
            return res.status(400).json({ message: 'Invalid course name' });
        }

        const access = await UserCourse.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            courseName: fullCourseName,
        });

        if (!access) {
            return res.status(403).json({ message: 'No course access' });
        }

        req.userId = userId;
        req.courseAccess = access;
        next();
    } catch (error) {
        console.error('Access verification error:', error);
        res.status(500).json({ message: 'Server error', details: error.message });
    }
};

// Update getVideoPath function for better error handling
const getVideoPath = (courseName, videoId) => {
    const videoPath = path.join(__dirname, '..', 'videos', courseName, videoId);
    console.log('Looking for video at:', videoPath);
    
    if (fs.existsSync(videoPath)) {
        return videoPath;
    }
    
    // Try default video if course video not found
    const defaultPath = path.join(__dirname, '..', 'videos', 'default', 'placeholder.mp4');
    if (fs.existsSync(defaultPath)) {
        console.log('Using default video');
        return defaultPath;
    }
    
    return null;
};

// Update video streaming route
router.get('/:courseName/:videoId', verifyCourseAccess, (req, res) => {
    try {
        const { courseName, videoId } = req.params;
        console.log('Video request:', { courseName, videoId });

        const videoPath = getVideoPath(courseName, videoId);
        if (!videoPath) {
            console.error('Video not found:', { courseName, videoId });
            return res.status(404).json({ 
                error: 'Video not found',
                details: { courseName, videoId }
            });
        }

        const stat = fs.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = end - start + 1;

            const stream = fs.createReadStream(videoPath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            };

            res.writeHead(206, head);
            stream.pipe(res);

            stream.on('error', (streamError) => {
                console.error('Stream error:', streamError);
                if (!res.headersSent) {
                    res.status(500).json({ 
                        error: 'Error streaming video',
                        details: streamError.message 
                    });
                }
            });
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);
            fs.createReadStream(videoPath).pipe(res);
        }
    } catch (error) {
        console.error('Video streaming error:', error);
        if (!res.headersSent) {
            res.status(500).json({ 
                error: 'Error streaming video',
                details: error.message 
            });
        }
    }
});

// Add signed URL generation endpoint
router.get('/signed-url/:courseName/:videoId', verifyCourseAccess, (req, res) => {
    try {
        const { courseName, videoId } = req.params;
        const { userId } = req;

        // Generate short-lived token (5 minutes)
        const videoToken = jwt.sign(
            { 
                userId,
                courseName,
                videoId,
                exp: Math.floor(Date.now() / 1000) + (5 * 60)
            },
            process.env.JWT_SECRET
        );

        // Ensure BASE_URL is properly formatted and uses HTTPS in production
        let baseUrl = process.env.VITE_BACKEND_HOST_URL || 'http://localhost:4000';
        
        // Check if we're in production (Render deployment)
        if (process.env.NODE_ENV === 'production') {
            // Ensure we're using HTTPS for production URLs
            baseUrl = 'https://final-nadt.onrender.com';
        }
        
        const signedUrl = `${baseUrl}/api/videos/stream/${courseName}/${videoId}?token=${videoToken}`;
        
        // Return a more detailed response
        res.json({ 
            success: true,
            signedUrl,
            metadata: {
                courseName,
                videoId,
                expiresIn: '5 minutes'
            }
        });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        res.status(500).json({ 
            success: false,
            error: 'Could not generate video URL',
            details: error.message 
        });
    }
});

// Add streaming endpoint that accepts token in query
router.get('/stream/:courseName/:videoId', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { userId, courseName, videoId } = decoded;

        // Verify course access
        const access = await UserCourse.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            courseName: courseNameMap[courseName],
        });

        if (!access) {
            return res.status(403).json({ error: 'No course access' });
        }

        // Get video path
        const videoPath = getVideoPath(courseName, videoId);
        if (!videoPath) {
            return res.status(404).json({ error: 'Video not found' });
        }

        // Stream video
        const stat = fs.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = end - start + 1;

            const stream = fs.createReadStream(videoPath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
                'Cache-Control': 'private, max-age=300'
            };

            res.writeHead(206, head);
            stream.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
                'Cache-Control': 'private, max-age=300'
            };
            res.writeHead(200, head);
            fs.createReadStream(videoPath).pipe(res);
        }
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Video link expired' });
        }
        console.error('Streaming error:', error);
        res.status(500).json({ error: 'Streaming error' });
    }
});

module.exports = router;


