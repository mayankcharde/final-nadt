const path = require('path');
const fs = require('fs').promises;

async function generateReceiptPDF({ name, email, paymentId, orderId, amount, courseId, date, logoUrl, pdfPath }) {
    const html = `
    <html>
    <head>
        <style>
            body { font-family: 'Arial', sans-serif; margin: 0; padding: 0; background: #f8f9fa; }
            .container { width: 600px; margin: 40px auto; background: #fff; border: 2px solid #5f63b8; border-radius: 12px; box-shadow: 0 2px 8px #0002; padding: 32px; }
            .logo { text-align: center; margin-bottom: 24px; }
            .logo img { height: 60px; }
            h2 { color: #5f63b8; text-align: center; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            td { padding: 8px 0; }
            .label { color: #888; width: 160px; }
            .value { color: #222; font-weight: 500; }
            .footer { text-align: center; color: #aaa; font-size: 13px; margin-top: 24px; }
            .border { border-top: 1px solid #eee; margin: 24px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <img src="${logoUrl}" alt="NADT Logo" />
            </div>
            <h2>Payment Receipt</h2>
            <div class="border"></div>
            <table>
                <tr><td class="label">Name:</td><td class="value">${name}</td></tr>
                <tr><td class="label">Email:</td><td class="value">${email}</td></tr>
                <tr><td class="label">Course:</td><td class="value">${courseId}</td></tr>
                <tr><td class="label">Amount:</td><td class="value">₹${amount}</td></tr>
                <tr><td class="label">Payment ID:</td><td class="value">${paymentId}</td></tr>
                <tr><td class="label">Order ID:</td><td class="value">${orderId}</td></tr>
                <tr><td class="label">Date:</td><td class="value">${date}</td></tr>
            </table>
            <div class="border"></div>
            <div class="footer">
                Thank you for your payment.<br/>
                National Academy of Direct Taxes
            </div>
        </div>
    </body>
    </html>
    `;

    await fs.mkdir(path.dirname(pdfPath), { recursive: true });

    // Always use system Chromium on Render.com
    const puppeteer = require('puppeteer-core');
    const launchOptions = {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/usr/bin/chromium-browser',
        headless: 'new',
        defaultViewport: { width: 800, height: 1120 },
        timeout: 20000
    };

    let browser = null;
    try {
        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: { top: '40px', bottom: '40px', left: '0', right: '0' }
        });
        await browser.close();
    } catch (err) {
        if (browser) try { await browser.close(); } catch {}
        throw err;
    }
}

module.exports = generateReceiptPDF;
