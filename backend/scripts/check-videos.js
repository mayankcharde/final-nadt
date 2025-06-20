const fs = require('fs');
const path = require('path');

const checkVideos = () => {
    const videosDir = path.join(__dirname, '..', 'videos');
    const courses = ['java', 'webdev', 'python'];

    courses.forEach(course => {
        const courseDir = path.join(videosDir, course);
        console.log(`\nChecking ${course} course videos:`);
        
        if (!fs.existsSync(courseDir)) {
            console.log(`- Directory missing: ${courseDir}`);
            return;
        }

        fs.readdirSync(courseDir).forEach(file => {
            const filePath = path.join(courseDir, file);
            const stats = fs.statSync(filePath);
            console.log(`- ${file}: ${Math.round(stats.size / 1024)}KB`);
        });
    });
};

checkVideos();
