const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const createTemplate = () => {
    const canvas = createCanvas(1120, 792);
    const ctx = canvas.getContext('2d');

    // Fill background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 1120, 792);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f3f4f6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1120, 792);

    // Add decorative border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 1040, 712);
    
    // Add inner border
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.strokeRect(50, 50, 1020, 692);

    // Add corner decorations
    const cornerSize = 20;
    ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'].forEach((color, index) => {
        const offset = index * 5;
        ctx.fillStyle = color;
        // Top left
        ctx.beginPath();
        ctx.moveTo(40 + offset, 40);
        ctx.lineTo(40 + cornerSize + offset, 40);
        ctx.lineTo(40 + offset, 40 + cornerSize);
        ctx.fill();
        // Top right
        ctx.beginPath();
        ctx.moveTo(1080 - offset, 40);
        ctx.lineTo(1080 - cornerSize - offset, 40);
        ctx.lineTo(1080 - offset, 40 + cornerSize);
        ctx.fill();
        // Bottom left
        ctx.beginPath();
        ctx.moveTo(40 + offset, 752);
        ctx.lineTo(40 + cornerSize + offset, 752);
        ctx.lineTo(40 + offset, 752 - cornerSize);
        ctx.fill();
        // Bottom right
        ctx.beginPath();
        ctx.moveTo(1080 - offset, 752);
        ctx.lineTo(1080 - cornerSize - offset, 752);
        ctx.lineTo(1080 - offset, 752 - cornerSize);
        ctx.fill();
    });

    const buffer = canvas.toBuffer('image/png');
    const templatePath = path.join(__dirname, '..', 'assets', 'certTemplate.png');
    
    if (!fs.existsSync(path.dirname(templatePath))) {
        fs.mkdirSync(path.dirname(templatePath), { recursive: true });
    }
    
    fs.writeFileSync(templatePath, buffer);
    console.log('Certificate template created at:', templatePath);
};

createTemplate();
