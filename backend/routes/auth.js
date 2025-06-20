const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

// Update to use environment variable
const JWT_SECRET = process.env.JWT_SECRET;

// ROUTE 1: Register user POST: /api/auth/register
router.post('/register', async (req, res) => {
    try {
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({ error: "Email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });

        const authtoken = jwt.sign({ userId: user.id }, JWT_SECRET);
        res.json({ authtoken });

    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// ROUTE 2: Login user POST: /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Debug log
        console.log('Login attempt:', { email });

        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide both email and password'
            });
        }

        // Convert email to lowercase and trim whitespace
        const normalizedEmail = email.toLowerCase().trim();

        // Find user
        const user = await User.findOne({ email: normalizedEmail });
        
        if (!user) {
            console.log('User not found:', normalizedEmail);
            return res.status(400).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            console.log('Invalid password for user:', normalizedEmail);
            return res.status(400).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-fallback-secret',
            { expiresIn: '24h' }
        );

        console.log('Login successful:', normalizedEmail);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ROUTE 3: Get User Info GET: /api/auth/user/:userId
router.get('/user/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('-password'); // Exclude password from response
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            name: user.name,
            email: user.email
        });

    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ROUTE 4: Get All Users GET: /api/auth/users
router.get('/users', authMiddleware, async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            users: users.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                joinedDate: user.createdAt
            }))
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;



