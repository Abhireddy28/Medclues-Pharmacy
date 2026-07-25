const nodemailer = require('nodemailer');
const { 
  getAccountApprovalTemplate,
  getAccountRejectionTemplate,
  getNewRegistrationAlertTemplate,
  getInvoiceTemplate,
  getPaymentReminderTemplate,
  getLowStockAlertTemplate,
  getNewOrderReceivedTemplate,
  getOrderDispatchedTemplate,
  getPaymentDueReminderTemplate,
  getPasswordResetOTPTemplate,
  getPasswordChangedTemplate,
  getWelcomeTemplate,
  getRegistrationPendingTemplate
} = require('./emailTemplates');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"PharmaSync Admin" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email send failure:', error);
    throw error;
  }
};

/**
 * Service functions for different email types
 */

const emailService = {
  // Admin Service
  sendAccountApproval: async (user, password) => {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth`; 
    const html = getAccountApprovalTemplate(user.name, user.email, password, loginUrl, user.role);
    return sendEmail(user.email, 'PharmaSync - Account Approved', html);
  },

  sendAccountRejection: async (user, reason) => {
    const html = getAccountRejectionTemplate(user.name, reason);
    return sendEmail(user.email, 'PharmaSync - Account Registration Declined', html);
  },

  sendNewRegistrationAlert: async (adminEmail, newUser) => {
    const html = getNewRegistrationAlertTemplate(newUser.name, newUser.email, newUser.role);
    return sendEmail(adminEmail, '🚨 New User Registration Alert', html);
  },

  // Pharmacy Service
  sendInvoice: async (customerEmail, customerName, items, total) => {
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #edf2f7;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: right;">₹${item.total.toFixed(2)}</td>
      </tr>
    `).join('');
    const html = getInvoiceTemplate(customerName, itemsHtml, total);
    return sendEmail(customerEmail, 'Invoice - PharmaSync', html);
  },

  sendPaymentReminder: async (customerEmail, customerName, amount) => {
    const html = getPaymentReminderTemplate(customerName, amount);
    return sendEmail(customerEmail, 'Payment Reminder - PharmaSync', html);
  },

  sendLowStockAlert: async (pharmacyEmail, pharmacyName, lowStockItems) => {
    const medicineListHtml = lowStockItems.map(item => `<li>${item.name} (Only ${item.stock} left)</li>`).join('');
    const html = getLowStockAlertTemplate(pharmacyName, medicineListHtml);
    return sendEmail(pharmacyEmail, '⚠ Low Stock Alert - PharmaSync', html);
  },

  // Distributor Service
  sendNewOrderReceived: async (distributorEmail, distributorName, orderId, pharmacyName, amount) => {
    const html = getNewOrderReceivedTemplate(distributorName, orderId, pharmacyName, amount);
    return sendEmail(distributorEmail, 'New Order Received - PharmaSync', html);
  },

  sendOrderDispatched: async (pharmacyEmail, pharmacyName, orderId) => {
    const html = getOrderDispatchedTemplate(pharmacyName, orderId);
    return sendEmail(pharmacyEmail, 'Order Dispatched - PharmaSync', html);
  },

  sendPaymentDueReminder: async (pharmacyEmail, pharmacyName, amount) => {
    const html = getPaymentDueReminderTemplate(pharmacyName, amount);
    return sendEmail(pharmacyEmail, 'Payment Due Reminder - PharmaSync', html);
  },

  // Auth Service
  sendPasswordResetOTP: async (user, otp) => {
    const html = getPasswordResetOTPTemplate(user.name, otp);
    return sendEmail(user.email, 'Verification Code - PharmaSync', html);
  },

  sendPasswordChanged: async (user) => {
    const html = getPasswordChangedTemplate(user.name);
    return sendEmail(user.email, 'Password Updated - PharmaSync', html);
  },

  sendWelcomeEmail: async (user) => {
    const html = getWelcomeTemplate(user.name);
    return sendEmail(user.email, 'Welcome to PharmaSync', html);
  },

  sendRegistrationPendingEmail: async (user) => {
    const html = getRegistrationPendingTemplate(user.name, user.role);
    return sendEmail(user.email, 'Application Received - PharmaSync', html);
  },

  sendRiderTripDispatch: async (riderEmail, riderName, orderId, tripLink, patientAddress) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0284c7;">🛵 New Medicine Delivery Assigned</h2>
        <p>Hello <strong>${riderName}</strong>,</p>
        <p>You have been assigned to deliver Medicine Order <strong>#${orderId}</strong>.</p>
        <p><strong>Delivery Destination:</strong> ${patientAddress || 'Patient Address'}</p>
        <div style="margin: 20px 0;">
          <a href="${tripLink}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">🚀 START TRIP & STREAM GPS</a>
        </div>
        <p style="font-size: 12px; color: #64748b;">Clicking the button will open your rider mobile interface to start navigation and enter doorstep OTP upon arrival.</p>
      </div>
    `;
    return sendEmail(riderEmail, `🚀 New Medicine Delivery Assigned - Order #${orderId}`, html);
  }
};

module.exports = emailService;
