// Utility to send bulk notifications to all faculty (SMS and Email)
const Faculty = require('./models/Faculty');
const smsService = require('./services/smsService');

const nodemailer = require('nodemailer');
const sendgridTransport = require('@nodemailer/sendgrid').default;
require('dotenv').config();

// Configure nodemailer to use SendGrid
const transporter = nodemailer.createTransport(
  sendgridTransport({
    apiKey: process.env.SENDGRID_API_KEY,
  })
);

async function notifyAllFaculty(subject, message) {
  const facultyList = await Faculty.find();
  let emailResults = [];
  let smsResults = [];

  for (const faculty of facultyList) {
    // Send Email
    if (faculty.email) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: faculty.email,
          subject,
          text: message,
        });
        emailResults.push({ email: faculty.email, status: 'sent' });
      } catch (err) {
        emailResults.push({ email: faculty.email, status: 'failed', error: err.message });
      }
    }
    // Send SMS
    if (faculty.phone) {
      try {
        await smsService.sendSMS(faculty.phone, message);
        smsResults.push({ phone: faculty.phone, status: 'sent' });
      } catch (err) {
        smsResults.push({ phone: faculty.phone, status: 'failed', error: err.message });
      }
    }
  }
  return { emailResults, smsResults };
}

module.exports = notifyAllFaculty;
