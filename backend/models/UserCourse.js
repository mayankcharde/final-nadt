const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserCourseSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    courseName: {
        type: String,
        required: true,
        enum: ['Python Course', 'Java Course', 'Web Development Course']
    },
    progress: [{
        videoId: {
            type: String,
            required: true
        },
        watched: {
            type: Boolean,
            default: false
        },
        lastWatched: {
            type: Date,
            default: null
        },
        watchedDuration: {
            type: Number,
            default: 0
        }
    }],
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    lastAccessed: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    index: [
        { userId: 1, courseName: 1 },
        { userId: 1, active: 1 }
    ]
});

module.exports = mongoose.model('userCourse', UserCourseSchema);
