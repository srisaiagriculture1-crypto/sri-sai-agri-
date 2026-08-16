const nodemailer = require('nodemailer');
require('dotenv').config();

const port = Number(process.env.SMTP_PORT) || 465;

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: port,
    secure: port === 465, // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 4000,
});

const sendEmail = async (to, subject, html, attachments = []) => {
    if (!to || typeof to !== 'string' || !to.includes('@') || to.toLowerCase() === 'null') {
        return false;
    }
    try {
        const mailOptions = {
            from: `"Sri Sai Institute" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'info@srisaiagriculture.com'}>`,
            to,
            subject,
            html,
        };

        if (attachments && attachments.length > 0) {
            mailOptions.attachments = attachments;
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s to %s', info.messageId, to);
        return true;
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error.message);
        return false;
    }
};

module.exports = { sendEmail };
