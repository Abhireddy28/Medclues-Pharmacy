/**
 * PharmaSync Email Templates
 */

const getAccountApprovalTemplate = (name, email, password, loginUrl, role) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Account Approved - PharmaSync</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding:20px 0;">
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1a73e8; padding:20px; text-align:center; color:#ffffff;">
              <h2 style="margin:0;">PharmaSync</h2>
              <p style="margin:5px 0 0; font-size:14px;">Healthcare Management Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px; color:#333333;">

              <h3 style="margin-top:0;">Account Approved ✅</h3>

              <p>Hello <b>${name}</b>,</p>

              <p>
                Congratulations! Your <b>${role}</b> account has been successfully verified and approved by the PharmaSync Admin team.
              </p>

              <!-- Login Details Box -->
              <div style="background:#f1f5f9; padding:15px; border-radius:6px; margin:20px 0;">
                <p style="margin:0;"><b>Login Credentials:</b></p>
                <p style="margin:5px 0;">Email: ${email}</p>
                <p style="margin:5px 0;">Password: ${password}</p>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center; margin:25px 0;">
                <a href="${loginUrl}" 
                   style="background:#1a73e8; color:#ffffff; padding:12px 25px; text-decoration:none; border-radius:6px; font-weight:bold; display:inline-block;">
                  Login to Dashboard
                </a>
              </div>

              <p>
                🔒 For security reasons, we strongly recommend changing your password after your first login.
              </p>

              <p>
                If you face any issues, feel free to contact our support team.
              </p>

              <p style="margin-top:30px;">
                Regards,<br>
                <b>PharmaSync Team</b>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f1f1f1; padding:15px; text-align:center; font-size:12px; color:#777;">
              © 2026 PharmaSync. All rights reserved.<br>
              Support: support@pharmasync.com
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

const getAccountRejectionTemplate = (name, reason) => `
<div style="font-family: Arial, sans-serif; color: #333;">
  <h2 style="color:#e53e3e;">PharmaSync - Account Rejected</h2>
  <p>Hello ${name},</p>
  <p>We regret to inform you that your registration request has been declined after review.</p>
  <p><b>Reason:</b> ${reason}</p>
  <p>You may contact support for further clarification.</p>
  <p>Regards,<br>PharmaSync Team</p>
</div>
`;

const getNewRegistrationAlertTemplate = (name, email, role) => `
<div style="font-family: Arial, sans-serif; color: #333;">
  <h2>🚨 New User Registration</h2>
  <p>A new user has registered on PharmaSync.</p>
  <ul>
    <li><b>Name:</b> ${name}</li>
    <li><b>Email:</b> ${email}</li>
    <li><b>Role:</b> ${role}</li>
  </ul>
  <p>Please review and approve.</p>
</div>
`;

const getInvoiceTemplate = (customerName, itemsHtml, total) => `
<!DOCTYPE html>
<html>
<body style="font-family:Arial; background:#f9f9f9;">
<div style="max-width:600px; margin:auto; background:#fff; padding:20px; border-radius:8px;">

<h2 style="color:#2f855a;">Invoice - PharmaSync</h2>

<p>Hello ${customerName},</p>
<p>Thank you for your purchase. Here are your bill details:</p>

<table style="width:100%; border-collapse:collapse;">
<tr style="background:#edf2f7;">
  <th style="padding: 10px; text-align: left;">Medicine</th>
  <th style="padding: 10px; text-align: center;">Qty</th>
  <th style="padding: 10px; text-align: right;">Price</th>
</tr>
${itemsHtml}
</table>

<p style="padding-top: 15px; border-top: 1px solid #edf2f7;"><b>Total: ₹${total}</b></p>

<p>We appreciate your trust!</p>

</div>
</body>
</html>
`;

const getPaymentReminderTemplate = (customerName, amount) => `
<div style="font-family: Arial, sans-serif; color: #333;">
  <h2 style="color:#d69e2e;">Payment Reminder</h2>
  <p>Hello ${customerName},</p>
  <p>You have a pending balance of <b>₹${amount}</b>.</p>
  <p>Please clear your dues at the earliest.</p>
  <p>Thank you,<br>Your Pharmacy</p>
</div>
`;

const getLowStockAlertTemplate = (pharmacyName, medicineListHtml) => `
<div style="font-family: Arial, sans-serif; color: #333;">
  <h2 style="color:#e53e3e;">⚠ Low Stock Alert</h2>
  <p>Dear ${pharmacyName},</p>
  <p>The following items are running low:</p>
  <ul>
    ${medicineListHtml}
  </ul>
  <p>Please restock soon.</p>
</div>
`;

const getNewOrderReceivedTemplate = (distributorName, orderId, pharmacyName, amount) => `
<div style="font-family: Arial, sans-serif; color: #333;">
  <h2 style="color:#2b6cb0;">New Order Received</h2>
  <p>Hello ${distributorName},</p>
  <p>You have received a new order.</p>
  <ul>
    <li><b>Order ID:</b> ${orderId}</li>
    <li><b>Pharmacy:</b> ${pharmacyName}</li>
    <li><b>Amount:</b> ₹${amount}</li>
  </ul>
  <p>Please process the order.</p>
</div>
`;

const getOrderDispatchedTemplate = (pharmacyName, orderId) => `
<div style="font-family: Arial, sans-serif; color: #333;">
  <h2 style="color:#38a169;">Order Dispatched</h2>
  <p>Hello ${pharmacyName},</p>
  <p>Your order <b>#${orderId}</b> has been dispatched.</p>
  <p>Expected delivery soon.</p>
</div>
`;

const getPaymentDueReminderTemplate = (pharmacyName, amount) => `
<div style="font-family: Arial, sans-serif; color: #333;">
  <h2 style="color:#dd6b20;">Payment Due Reminder</h2>
  <p>Hello ${pharmacyName},</p>
  <p>You have an outstanding payment of <b>₹${amount}</b>.</p>
  <p>Please clear it to continue smooth service.</p>
</div>
`;

const getPasswordResetOTPTemplate = (name, otp) => `
<!DOCTYPE html>
<html>
<body style="font-family:Arial; background:#f4f4f4;">
<div style="max-width:500px; margin:auto; background:#fff; padding:20px; border-radius:8px; border: 1px solid #e2e8f0;">
  <h2 style="color: #1a73e8; margin-top:0;">Password Reset OTP</h2>
  <p>Hello <b>${name}</b>,</p>
  <p>Your 6-digit verification code to reset your password is:</p>
  
  <div style="background:#f1f5f9; padding:20px; text-align:center; border-radius:10px; margin:20px 0;">
    <span style="font-size:32px; font-weight:bold; letter-spacing:8px; color:#1a73e8;">${otp}</span>
  </div>
  
  <p style="font-size:12px; color:#64748b;">This OTP will expire in 10 minutes. <b>Do not share this code with anyone.</b></p>
  <p style="font-size:12px; color:#64748b; margin-top:20px;">If you did not request this, please ignore this email.</p>
</div>
</body>
</html>
`;

const getPasswordChangedTemplate = (name) => `
<div style="font-family: Arial, sans-serif; color: #333;">
  <h2 style="color:#38a169;">Password Updated</h2>
  <p>Hello ${name},</p>
  <p>Your password has been successfully changed.</p>
  <p>If this was not you, contact support immediately.</p>
</div>
`;

const getRegistrationPendingTemplate = (name, role) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Application Received - PharmaSync</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#1a73e8; padding:20px; text-align:center; color:#ffffff;">
              <h2 style="margin:0;">PharmaSync</h2>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px; color:#333333; line-height: 1.6;">
              <h3 style="margin-top:0; color: #1a73e8;">Application Received! 🕒</h3>
              <p>Hello <b>${name}</b>,</p>
              <p>Thank you for choosing PharmaSync. We have successfully received your application for a <b>${role}</b> account.</p>
              <p>Our administration team is currently reviewing your details. This process typically takes 12-24 business hours.</p>
              <div style="background:#fff9eb; border-left: 4px solid #f59e0b; padding:15px; margin:20px 0;">
                <p style="margin:0; color: #92400e;"><b>What happens next?</b></p>
                <p style="margin:5px 0 0; font-size: 14px;">Once approved, you will receive another email containing your <b>secure login credentials</b> and a link to your dashboard.</p>
              </div>
              <p>If you have any questions, feel free to reply to this email.</p>
              <p style="margin-top:30px;">Best Regards,<br><b>The PharmaSync Team</b></p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc; padding:20px; text-align:center; font-size:12px; color:#64748b; border-top: 1px solid #e2e8f0;">
              © 2026 PharmaSync Platform. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const getWelcomeTemplate = (name) => `
... [rest of code]
`;

module.exports = {
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
};
