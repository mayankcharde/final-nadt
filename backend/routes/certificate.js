const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const handlebars = require('handlebars');
const Certificate = require('../models/Certificate');
const UserCourse = require('../models/UserCourse'); // Import UserCourse model
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

// Helper function to generate certificate number
const generateCertNumber = () => {
    return `NADT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`.toUpperCase();
};

router.post('/generate', async (req, res) => {
    try {
        const { name, course, date } = req.body;
        
        // Add input validation
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error('Valid name is required');
        }

        if (!course || typeof course !== 'string' || course.trim() === '') {
            throw new Error('Valid course name is required');
        }

        // Get userId from JWT
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new Error('No auth token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // Verify user exists and has access to the course
        const userCourse = await UserCourse.findOne({
            userId: userId,
            courseName: course,
        });

        if (!userCourse) {
            throw new Error('User does not have access to this course');
        }

        // Generate unique certificate number
        const certNumber = generateCertNumber();
        
        // Create certificate record first to validate
        const certificate = new Certificate({
            userId,
            courseName: course,
            userName: name.trim(), // Ensure name is trimmed
            certificateNumber: certNumber,
            completionDate: new Date(),
            pdfPath: path.join(__dirname, '..', 'generated-certificates', `${certNumber}.pdf`)
        });

        // Validate the certificate document
        const validationError = certificate.validateSync();
        if (validationError) {
            throw validationError;
        }

        // Save the certificate
        await certificate.save();

        // Create PDF directory if it doesn't exist
        const pdfDir = path.join(__dirname, '..', 'generated-certificates');
        await fs.mkdir(pdfDir, { recursive: true });

        // Read template
        const templatePath = path.join(__dirname, '..', 'templates', 'certificate.html');
        const templateContent = await fs.readFile(templatePath, 'utf-8');

        // Get template background path
        const templateBgPath = path.join(__dirname, '..', 'assets', 'certTemplate.png');
        
        // Check if template background exists
        try {
            await fs.access(templateBgPath);
        } catch (error) {
            throw new Error('Certificate template background not found');
        }

        // Convert template background to data URL
        const backgroundImage = await fs.readFile(templateBgPath);
        const backgroundDataUrl = `data:image/png;base64,${backgroundImage.toString('base64')}`;

        // Compile template with background as data URL
        const template = handlebars.compile(templateContent);
        const html = template({
            name,
            course,
            date,
            certNumber,
            templatePath: backgroundDataUrl
        });

        // Launch Puppeteer
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // Set content and wait for images to load
        await page.setContent(html, { 
            waitUntil: ['domcontentloaded', 'networkidle0']
        });
        await page.setViewport({ width: 1120, height: 792 });

        // Generate PDF
        const pdfPath = path.join(pdfDir, `${certNumber}.pdf`);
        await page.pdf({
            path: pdfPath,
            width: '1120px',
            height: '792px',
            printBackground: true,
            preferCSSPageSize: true
        });

        await browser.close();

        // Send PDF as response
        const pdf = await fs.readFile(pdfPath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${certNumber}.pdf`);
        res.send(pdf);

    } catch (error) {
        console.error('Certificate generation error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Certificate generation failed',
            details: error.message 
        });
    }
});

// Add this new route before module.exports
router.get('/user/:userId', async (req, res) => {
    try {
        const certificates = await Certificate.find({ userId: req.params.userId })
            .sort({ createdAt: -1 }); // Most recent first

        res.json({
            success: true,
            certificates
        });
    } catch (error) {
        console.error('Error fetching user certificates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch certificates',
            details: error.message
        });
    }
});

// Download certificate endpoint
router.get('/download/:certificateNumber', async (req, res) => {
    try {
        const certificate = await Certificate.findOne({ 
            certificateNumber: req.params.certificateNumber 
        });

        if (!certificate) {
            return res.status(404).json({
                success: false,
                error: 'Certificate not found'
            });
        }

        const pdfPath = certificate.pdfPath;
        res.download(pdfPath);
    } catch (error) {
        console.error('Certificate download error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download certificate',
            details: error.message
        });
    }
});

module.exports = router;
