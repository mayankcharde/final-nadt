const express = require('express');
const router = express.Router();
let chromium = null;
try {
    chromium = require('chrome-aws-lambda');
} catch (e) {
    // chrome-aws-lambda not available locally, ignore
}
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

const isRender = process.env.RENDER === 'true' || process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.CHROME_AWS_LAMBDA_VERSION;

const CERT_DIR = path.join(__dirname, '..', 'generated-certificates');

// Utility to ensure directory exists
async function ensureCertDir() {
    try {
        await fs.mkdir(CERT_DIR, { recursive: true });
    } catch (err) {
        console.error('Failed to create certificates directory:', err);
        throw err;
    }
}

// Certificate generation endpoint
router.post('/generate', async (req, res) => {
    let browser = null;
    let pdfPath = '';
    const timeoutMs = 25000; // 25s timeout for Chrome
    const startMem = process.memoryUsage().rss;
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

        await ensureCertDir();
        // Generate unique certificate number
        const certNumber = generateCertNumber();
        pdfPath = path.join(CERT_DIR, `${certNumber}.pdf`);
        
        // Create certificate record first to validate
        const certificate = new Certificate({
            userId,
            courseName: course,
            userName: name.trim(), // Ensure name is trimmed
            certificateNumber: certNumber,
            completionDate: new Date(),
            pdfPath
        });

        // Validate the certificate document
        const validationError = certificate.validateSync();
        if (validationError) {
            // Return validation error as 400
            return res.status(400).json({
                success: false,
                error: 'Certificate validation failed',
                details: validationError.message
            });
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

        // Use chrome-aws-lambda's puppeteer and executablePath for maximum compatibility
        const chromium = require('chrome-aws-lambda');
        browser = await chromium.puppeteer.launch({
            args: [...chromium.args, '--no-sandbox'],
            executablePath: await chromium.executablePath,
            headless: true,
            defaultViewport: { width: 1120, height: 792 },
            timeout: timeoutMs
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: ['domcontentloaded', 'networkidle0'] });

        // Always use /tmp for ephemeral storage on Render
        pdfPath = `/tmp/${certNumber}.pdf`;
        await page.pdf({
            path: pdfPath,
            width: '1120px',
            height: '792px',
            printBackground: true,
            preferCSSPageSize: true,
            timeout: timeoutMs
        });

        // Clean up browser
        await browser.close();
        browser = null;

        // Wait for file to exist before sending (stateless: send directly)
        await fs.access(pdfPath);

        // Send PDF directly in response (stateless best practice)
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${certNumber}.pdf`);
        const fileBuffer = await fs.readFile(pdfPath);
        res.send(fileBuffer);

        // Optionally: delete the file after sending if you want to keep storage clean
        // await fs.unlink(pdfPath);

        // Memory monitoring (log if > 350MB)
        const endMem = process.memoryUsage().rss;
        if (endMem - startMem > 350 * 1024 * 1024) {
            console.warn('High memory usage after PDF generation:', (endMem / 1024 / 1024).toFixed(1), 'MB');
        }
    } catch (error) {
        if (browser) try { await browser.close(); } catch {}
        console.error('Certificate generation error:', error);
        if (error.message && error.message.includes('Chrome launch timeout')) {
            return res.status(504).json({ success: false, error: 'PDF generation timed out' });
        }
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
        // Fixed typo: removed stray text and corrected error log
        console.error('Error fetching user certificates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch certificates',
            details: error.message
        });
    }
});

// Download certificate endpoint (stateless: check file existence, send or error)
router.get('/download/:certificateNumber', async (req, res) => {
    try {
        const certNumber = req.params.certificateNumber;
        const pdfPath = path.join(CERT_DIR, `${certNumber}.pdf`);
        try {
            await fs.access(pdfPath);
        } catch (err) {
            return res.status(404).json({ success: false, error: 'Certificate file not found' });
        }
        res.download(pdfPath, `${certNumber}.pdf`, err => {
            if (err) {
                console.error('Download error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, error: 'Failed to download certificate' });
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to download certificate',
            details: error.message
        });
    }
});

module.exports = router;




