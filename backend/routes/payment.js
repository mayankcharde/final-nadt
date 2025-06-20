const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();
const Payment = require('../models/Payment');
const UserCourse = require('../models/UserCourse');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Receipt = require('../models/Receipt');
const razorpayController = require('../controllers/razorpayController');

const router = express.Router();

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
});

// ROUTE 1 : Create Order Api Using POST Method http://localhost:4000/api/payment/order
router.post('/order', (req, res) => {
    const { amount } = req.body;

    try {
        const options = {
            amount: Number(amount * 100),
            currency: "INR",
            receipt: crypto.randomBytes(10).toString("hex"),
        }
        
        razorpayInstance.orders.create(options, (error, order) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: "Something Went Wrong!" });
            }
            res.status(200).json({ data: order });
            console.log(order)
        });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error!" });
        console.log(error);
    }
})

// Fix the purchased courses endpoint
router.get('/purchased-courses/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('Fetching courses for userId:', userId);

        // Find user's courses with proper ObjectId creation
        const userCourses = await UserCourse.find({
            userId: new mongoose.Types.ObjectId(userId)
        }).sort({ purchaseDate: -1 });

        console.log('Found userCourses:', userCourses);

        // Get payment details for each course
        const purchasedCourses = await Promise.all(
            userCourses.map(async (course) => {
                const payment = await Payment.findOne({
                    userId: new mongoose.Types.ObjectId(userId),
                    'courseDetails.name': course.courseName
                });

                return {
                    _id: course._id,
                    courseName: course.courseName,
                    purchaseDate: course.purchaseDate,
                    progress: course.progress,
                    courseDetails: {
                        name: course.courseName,
                        image: getDefaultCourseImage(course.courseName),
                        amount: payment?.courseDetails?.amount
                    }
                };
            })
        );

        res.json({
            success: true,
            courses: purchasedCourses
        });
    } catch (error) {
        console.error('Error in purchased-courses:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching purchased courses",
            error: error.message
        });
    }
});

// Helper functions
function calculateCompletionPercentage(progress) {
    if (!progress || progress.length === 0) return 0;
    const watchedVideos = progress.filter(p => p.watched).length;
    return Math.round((watchedVideos / progress.length) * 100);
}

function getLastAccessedDate(progress) {
    if (!progress || progress.length === 0) return null;
    const watchedVideos = progress.filter(p => p.lastWatched);
    if (watchedVideos.length === 0) return null;
    return new Date(Math.max(...watchedVideos.map(v => new Date(v.lastWatched))));
}

function getDefaultCourseImage(courseName) {
    const courseImages = {
        'Python Course': 'https://www.emexotechnologies.com/wp-content/uploads/2021/01/python-training-emexo.png',
        'Java Course': 'https://www.apponix.com/front/images/app-java.jpeg',
        'Web Development Course': 'https://www.elegantthemes.com/blog/wp-content/uploads/2018/12/top11.png'
    };
    return courseImages[courseName] || '';
}

// ROUTE 2 : Create Verify Api Using POST Method http://localhost:4000/api/payment/verify
router.post('/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseDetails } = req.body;
        
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courseDetails) {
            return res.status(400).json({ 
                success: false,
                message: "Missing payment details"
            });
        }

        // Get userId from auth token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: "No auth token"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const authenticatedUserId = decoded.userId;

        // Verify signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }

        // Save payment record
        const payment = new Payment({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            userId: new mongoose.Types.ObjectId(authenticatedUserId),
            courseDetails,
            status: 'completed'
        });

        await payment.save();

        // Grant course access (fix: always upsert and set progress array)
        const getInitialProgress = (courseName) => {
            switch(courseName) {
                case 'Java Course':
                    return [
                        { videoId: "java01.mp4", watched: false },
                        { videoId: "java02.mp4", watched: false },
                        { videoId: "java03.mp4", watched: false },
                        { videoId: "java04.mp4", watched: false },
                        { videoId: "java05.mp4", watched: false }
                    ];
                case 'Web Development Course':
                    return [
                        { videoId: "web01.mp4", watched: false },
                        { videoId: "web02.mp4", watched: false },
                        { videoId: "web03.mp4", watched: false },
                        { videoId: "web04.mp4", watched: false },
                        { videoId: "web05.mp4", watched: false }
                    ];
                default:
                    return [
                        { videoId: "01_setup.mp4", watched: false },
                        { videoId: "02_variables.mp4", watched: false },
                        { videoId: "03_control_flow.mp4", watched: false },
                        { videoId: "04_functions.mp4", watched: false },
                        { videoId: "05_oop.mp4", watched: false }
                    ];
            }
        };

        // Always upsert and set progress array (fix for access issue)
        const userCourse = await UserCourse.findOneAndUpdate(
            { 
                userId: new mongoose.Types.ObjectId(authenticatedUserId),
                courseName: courseDetails.name
            },
            {
                $set: {
                    userId: new mongoose.Types.ObjectId(authenticatedUserId),
                    courseName: courseDetails.name,
                    progress: getInitialProgress(courseDetails.name)
                }
            },
            { 
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            courseAccess: true,
            courseDetails: userCourse
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Payment verification failed"
        });
    }
});

// Add new route to fetch payment history
router.get('/history/:userId', async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.params.userId })
            .sort({ date: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error!" });
    }
});

// Add authentication middleware
const authenticateToken = require('../middleware/auth');

// Update the stats endpoint
router.get('/stats/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user has permission to access these stats
        if (req.user.userId !== userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Unauthorized access to stats' 
            });
        }

        // Get user's course enrollments
        const userCourses = await UserCourse.find({ userId: userId });

        // Calculate active enrollments (enrolled this month)
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const activeEnrollments = userCourses.filter(course => 
            new Date(course.purchaseDate) >= thisMonth
        ).length;

        // Calculate completion rate
        const completedCourses = userCourses.filter(course => {
            const watchedVideos = course.progress.filter(p => p.watched).length;
            return watchedVideos === course.progress.length;
        }).length;

        const completionRate = userCourses.length ? 
            Math.round((completedCourses / userCourses.length) * 100) : 0;

        // Get last month's stats for comparison
        const lastMonth = new Date(thisMonth);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthEnrollments = userCourses.filter(course => 
            new Date(course.purchaseDate) >= lastMonth && 
            new Date(course.purchaseDate) < thisMonth
        ).length;

        // Calculate changes
        const enrollmentsChange = lastMonthEnrollments ? 
            Math.round(((activeEnrollments - lastMonthEnrollments) / lastMonthEnrollments) * 100) : 
            activeEnrollments ? 100 : 0;

        res.json({
            success: true,
            totalCourses: 3, // Total available courses
            activeEnrollments,
            completionRate,
            coursesChange: 0, // Fixed value since total courses doesn't change
            enrollmentsChange,
            completionChange: 5 // Default value, can be calculated based on historical data
        });

    } catch (error) {
        console.error('Stats calculation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating statistics',
            error: error.message
        });
    }
});

// Add new route to check course access
router.get('/check-access/:userId/:courseName', async (req, res) => {
    try {
        const userCourseAccess = await UserCourse.findOne({
            userId: new mongoose.Types.ObjectId(req.params.userId),
            courseName: req.params.courseName
        });

        // Add detailed error logging
        console.log('Access check result:', {
            userId: req.params.userId,
            courseName: req.params.courseName,
            hasAccess: !!userCourseAccess
        });

        res.json({ 
            hasAccess: !!userCourseAccess, 
            progress: userCourseAccess?.progress || [],
            purchaseDate: userCourseAccess?.purchaseDate
        });
    } catch (error) {
        console.error('Access check error:', error);
        res.status(500).json({ message: "Error checking course access" });
    }
});

// Add route to update video progress
router.post('/update-progress', async (req, res) => {
    try {
        const { userId, courseName, videoId, watched } = req.body;
        await UserCourse.findOneAndUpdate(
            { userId, courseName, "progress.videoId": videoId },
            { 
                $set: { 
                    "progress.$.watched": watched,
                    "progress.$.lastWatched": new Date()
                }
            }
        );
        res.json({ message: "Progress updated" });
    } catch (error) {
        res.status(500).json({ message: "Error updating progress" });
    }
});

// Update the course popularity endpoint
router.get('/course-popularity', async (req, res) => {
    try {
        // Aggregate course data
        const courseStats = await Payment.aggregate([
            {
                $group: {
                    _id: '$courseDetails.name',
                    enrollments: { $sum: 1 },
                    revenue: { $sum: '$courseDetails.amount' }
                }
            }
        ]);

        // Format the response
        const courses = courseStats.map(course => ({
            name: course._id,
            enrollments: course.enrollments,
            revenue: course.revenue
        }));

        res.json({
            success: true,
            courses
        });
    } catch (error) {
        console.error('Error fetching course popularity:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch course statistics',
            courses: []
        });
    }
});

// After payment success, generate/send receipt
router.post('/receipt', async (req, res) => {
    try {
        const { name, email, paymentId, orderId, amount, courseId } = req.body;
        const date = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        await razorpayController.createReceiptAndSend({
            name, email, paymentId, orderId, amount, courseId, date
        });

        res.json({ success: true, message: 'Receipt generated and emailed' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Download receipt by orderId
router.get('/receipt/:orderId', razorpayController.downloadReceipt);

// Course access check by email and courseId
router.get('/access', razorpayController.checkCourseAccess);

// Add this route before module.exports
router.get('/receipts', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ success: false, error: 'Email required' });
        const receipts = await Receipt.find({ email }).sort({ date: -1 });
        res.json({ success: true, receipts });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Add new route to fetch receipts by userId
router.get('/receipts/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        // Find user email by userId (assuming you have a User model)
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        const receipts = await Receipt.find({ email: user.email }).sort({ date: -1 });
        res.json({ success: true, receipts });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;