const path = require('path');
const Receipt = require('../models/Receipt');
const generateReceiptPDF = require('../utils/generateReceiptPDF');
const sendReceiptEmail = require('../utils/sendEmail');

exports.createReceiptAndSend = async ({
    name, email, paymentId, orderId, amount, courseId, date
}) => {
    try {
        const pdfFileName = `receipt-${orderId}.pdf`;
        const pdfPath = require('path').join(__dirname, '..', 'receipts', pdfFileName);

        // Defensive: check required fields
        if (!name || !email || !paymentId || !orderId || !amount || !courseId || !date) {
            throw new Error('Missing required receipt fields');
        }

        await generateReceiptPDF({
            name,
            email,
            paymentId,
            orderId,
            amount,
            courseId,
            date,
            logoUrl: process.env.RECEIPT_LOGO_URL || 'https://www.elegantthemes.com/blog/wp-content/uploads/2018/12/top11.png',
            pdfPath
        });

        const receipt = await Receipt.create({
            name,
            email,
            paymentId,
            orderId,
            amount,
            courseId,
            date,
            pdfPath
        });

        await sendReceiptEmail({ to: email, name, pdfPath });

        return receipt;
    } catch (err) {
        console.error('Error in createReceiptAndSend:', err);
        throw err;
    }
};

exports.downloadReceipt = async (req, res) => {
    try {
        const { orderId } = req.params;
        const receipt = await Receipt.findOne({ orderId });
        if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
        res.download(receipt.pdfPath, `receipt-${orderId}.pdf`);
    } catch (err) {
        console.error('Receipt download error:', err);
        res.status(500).json({ error: 'Failed to download receipt' });
    }
};

exports.checkCourseAccess = async (req, res) => {
    try {
        const { email, courseId } = req.query;
        const receipt = await Receipt.findOne({ email, courseId });
        res.json({ access: !!receipt });
    } catch (err) {
        console.error('Course access check error:', err);
        res.status(500).json({ error: 'Failed to check access' });
    }
};


