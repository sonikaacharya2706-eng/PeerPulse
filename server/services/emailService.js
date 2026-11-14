import nodemailer from 'nodemailer';

let transporter = null;

const initTransporter = async () => {
  if (transporter) return transporter;

  // If custom SMTP is configured, initialize standard SMTP transport
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('[Email] Configured custom SMTP transport');
      return transporter;
    } catch (err) {
      console.warn('[Email] SMTP configuration failed, falling back to console logger:', err.message);
    }
  }

  // Fallback: Console logger (Zero external network dependencies, 100% resilient)
  console.log('[Email] No SMTP credentials detected. Using console-logger email service.');
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('====================================================');
      console.log('[CONSOLE EMAIL DISPATCHED]');
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Body: ${mailOptions.text || mailOptions.html}`);
      console.log('====================================================');
      return { messageId: `mock-${Date.now()}` };
    },
  };

  return transporter;
};

/**
 * Send an email notification safely (guaranteed never to crash)
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailer = await initTransporter();
    const info = await mailer.sendMail({
      from: process.env.MAIL_FROM || '"Smart Campus" <no-reply@campus.edu>',
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    });

    return info;
  } catch (error) {
    console.error('[Email Send Error - Non-fatal]:', error.message);
    console.log(`[Email Fallback Log] To: ${to} | Subject: ${subject} | Content: ${text}`);
    return null;
  }
};
