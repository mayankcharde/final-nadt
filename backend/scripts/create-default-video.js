const fs = require('fs');
const path = require('path');

// Create a simple MP4 file with basic structure
const createDefaultVideo = () => {
    const defaultVideoPath = path.join(__dirname, '../videos/default/placeholder.mp4');
    
    // Basic MP4 file structure (minimal valid MP4)
    const header = Buffer.from('000000206674797069736F6D0000000169736F6D6D6F6F760000000C6D64617400000000', 'hex');
    
    if (!fs.existsSync(path.dirname(defaultVideoPath))) {
        fs.mkdirSync(path.dirname(defaultVideoPath), { recursive: true });
    }
    
    fs.writeFileSync(defaultVideoPath, header);
    console.log('Default video created at:', defaultVideoPath);
};

createDefaultVideo();
