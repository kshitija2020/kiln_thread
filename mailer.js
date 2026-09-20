// server/mailer.js
// Sends transactional emails via SMTP (nodemailer). Works with any SMTP
// provider — Gmail (with an app password), SendGrid, Postmark, Resend,
// Mailgun, AWS SES. Fill in the SMTP_* vars in .env.

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.MAIL_FROM || '"Kiln & Thread" <orders@kilnandthread.com>';

function sendMailSafe(mailOptions) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[LOCAL DEV EMAIL] To: ${mailOptions.to} | Subject: ${mailOptions.subject}`);
    return Promise.resolve({ messageId: 'dev-mock-email-id' });
  }
  return transporter.sendMail(mailOptions);
}

function money(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

async function sendOrderConfirmation({ to, orderNumber, items, subtotalCents, shippingCents, totalCents, trackingUrl }) {
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:6px 0;">${i.product_name} × ${i.quantity}</td>
        <td style="padding:6px 0; text-align:right;">${money(i.unit_price_cents * i.quantity)}</td>
      </tr>`
    )
    .join("");

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #211E1B;">
      <h2 style="font-weight: 500;">Thank you for your order</h2>
      <p>Your order <strong>${orderNumber}</strong> has been placed. Here's what you ordered:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        ${rows}
        <tr><td style="padding-top:10px; border-top:1px solid #ddd;">Shipping</td>
            <td style="padding-top:10px; border-top:1px solid #ddd; text-align:right;">${money(shippingCents)}</td></tr>
        <tr><td style="font-weight:600; padding-top:6px;">Total</td>
            <td style="font-weight:600; padding-top:6px; text-align:right;">${money(totalCents)}</td></tr>
      </table>
      <p>We'll email you again once your order ships. You can also track it any time:</p>
      <p><a href="${trackingUrl}" style="background:#2F4A44; color:#fff; padding:10px 18px; text-decoration:none; border-radius:3px; display:inline-block;">Track your order</a></p>
    </div>
  `;

  return sendMailSafe({
    from: FROM,
    to,
    subject: `Order confirmed — ${orderNumber}`,
    html,
    text: `Your order ${orderNumber} has been placed. Total: ${money(totalCents)}. Track it: ${trackingUrl}`,
  });
}

async function sendShippingUpdate({ to, orderNumber, status, trackingNumber, carrier, trackingUrl }) {
  const statusLabel = {
    processing: "is being prepared",
    shipped: "has shipped",
    out_for_delivery: "is out for delivery",
    delivered: "has been delivered",
  }[status] || `is now "${status}"`;

  const trackingLine = trackingNumber
    ? `<p>Tracking number: <strong>${trackingNumber}</strong>${carrier ? ` (${carrier})` : ""}</p>`
    : "";

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #211E1B;">
      <h2 style="font-weight: 500;">Order ${orderNumber} ${statusLabel}</h2>
      ${trackingLine}
      <p><a href="${trackingUrl}" style="background:#2F4A44; color:#fff; padding:10px 18px; text-decoration:none; border-radius:3px; display:inline-block;">View order status</a></p>
    </div>
  `;

  return sendMailSafe({
    from: FROM,
    to,
    subject: `Order ${orderNumber} ${statusLabel}`,
    html,
    text: `Order ${orderNumber} ${statusLabel}. ${trackingNumber ? `Tracking: ${trackingNumber}` : ""} ${trackingUrl}`,
  });
}

module.exports = { sendOrderConfirmation, sendShippingUpdate };
