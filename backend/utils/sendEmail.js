const sgMail = require('@sendgrid/mail');
const fs = require('fs').promises;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendReceiptEmail({ to, name, pdfPath }) {
    const pdfBuffer = await fs.readFile(pdfPath);

    const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@nadt.gov.in',
        subject: 'Your NADT Payment Receipt',
        text: `Dear ${name},\n\nThank you for your payment. Please find your receipt attached.\n\nRegards,\nNADT Team`,
        html: `<p>Dear ${name},</p><p>Thank you for your payment. Please find your receipt attached.</p><p>Regards,<br/>NADT Team</p>`,
        attachments: [
            {
                content: pdfBuffer.toString('base64'),
                filename: 'receipt.pdf',
                type: 'application/pdf',
                disposition: 'attachment'
            }
        ]
    };

    await sgMail.send(msg);
}

module.exports = sendReceiptEmail;
module.exports = sendReceiptEmail;
