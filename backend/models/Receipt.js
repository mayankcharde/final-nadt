const mongoose = require('mongoose');

const ReceiptSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    paymentId: { type: String, required: true },
    orderId: { type: String, required: true },
    amount: { type: Number, required: true },
    courseId: { type: String, required: true },
    date: { type: Date, default: Date.now },
    pdfPath: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Receipt', ReceiptSchema);
