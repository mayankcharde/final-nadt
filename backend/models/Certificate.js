const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: [true, 'User ID is required']
    },
    courseName: {
        type: String,
        required: [true, 'Course name is required'],
        trim: true,
        enum: ['Python Course', 'Java Course', 'Web Development Course']
    },
    userName: {
        type: String,
        required: [true, 'User name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        validate: {
            validator: function(v) {
                return /^[a-zA-Z\s]+$/.test(v);
            },
            message: props => `${props.value} is not a valid name!`
        }
    },
    certificateNumber: {
        type: String,
        required: true,
        unique: true
    },
    completionDate: {
        type: Date,
        default: Date.now
    },
    pdfPath: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Certificate', CertificateSchema);
