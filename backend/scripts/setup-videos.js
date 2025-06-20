const fs = require('fs');
const path = require('path');

const createEmptyMp4 = (filePath) => {
    // Basic MP4 file header (minimal valid MP4)
    const header = Buffer.from('000000206674797069736F6D0000000169736F6D6D6F6F760000000C6D64617400000000', 'hex');
    fs.writeFileSync(filePath, header);
};

const setupVideos = () => {
    const videosDir = path.join(__dirname, '..', 'videos');
    
    // Create directories if they don't exist
    const courses = ['java', 'python', 'webdev', 'default'];
    courses.forEach(course => {
        const courseDir = path.join(videosDir, course);
        if (!fs.existsSync(courseDir)) {
            fs.mkdirSync(courseDir, { recursive: true });
            console.log(`Created directory: ${courseDir}`);
        }
    });

    // Create placeholder videos for each course
    const videos = {
        java: ['java01.mp4', 'java02.mp4', 'java03.mp4', 'java04.mp4', 'java05.mp4'],
        python: ['01_setup.mp4', '02_variables.mp4', '03_control_flow.mp4', '04_functions.mp4', '05_oop.mp4'],
        webdev: ['web01.mp4', 'web02.mp4', 'web03.mp4', 'web04.mp4', 'web05.mp4']
    };

    // Create videos
    Object.entries(videos).forEach(([course, files]) => {
        files.forEach(file => {
            const filePath = path.join(videosDir, course, file);
            if (!fs.existsSync(filePath)) {
                createEmptyMp4(filePath);
                console.log(`Created video placeholder: ${filePath}`);
            }
        });
    });

    // Create default placeholder
    const defaultVideo = path.join(videosDir, 'default', 'placeholder.mp4');
    if (!fs.existsSync(defaultVideo)) {
        createEmptyMp4(defaultVideo);
        console.log(`Created default video: ${defaultVideo}`);
    }
};

setupVideos();
