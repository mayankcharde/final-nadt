const connectToMongo = require('./database/db');
const express = require('express');
const cors = require('cors');
const payment = require('./routes/payment');
const auth = require('./routes/auth');
const videos = require('./routes/videos');
const path = require('path'); // Import path module


connectToMongo();
const app = express()
const port = 4000

// middleware
app.use(express.json());

// Update middleware configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
}));

// Serve static files with explicit MIME types
app.use('/videos', express.static(path.join(__dirname, 'videos'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.mp4')) {
            res.set('Content-Type', 'video/mp4');
        }
    }
}));
// Serve static files
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/certificates', express.static(path.join(__dirname, 'generated-certificates')));

app.use('/api/payment', payment);
app.use('/api/auth', auth);
app.use('/api/videos', videos);
app.use('/api/certificate', require('./routes/certificate'));

// Error handling middleware should be last
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

//* Available Route 
app.get('/', (req, res) => {
    res.send('Razorpay Payment Gateway Using React And Node Js')
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

setInterval(() => {
    const mem = process.memoryUsage().rss / 1024 / 1024;
    if (mem > 350) {
        console.warn('Memory usage warning:', mem.toFixed(1), 'MB');
    }
}, 60000);