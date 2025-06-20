const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaymentSchema = new Schema({
    razorpay_order_id: {
        type: String,
        required: true,
    },
    razorpay_payment_id: {
        type: String,
        required: true,
    },
    razorpay_signature: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'course',
        required: false  // Make optional since we use courseName
    },
    courseDetails: {
        name: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        image: {
            type: String,
            required: true
        }
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('payment', PaymentSchema);