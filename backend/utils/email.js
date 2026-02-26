const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const path = require("path");
const handlebars = require("handlebars");
const fs = require("fs").promises;

const getBaseDir = () => {
  return path.resolve(__dirname, "..");
};

// Brevo API method using HTTP API (works on Render)
const sendViaBrevoAPI = async (
  subject,
  send_to,
  send_from,
  reply_to,
  htmlContent,
  attachments = [],
) => {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured in environment variables");
  }

  const payload = {
    sender: { email: send_from },
    to: Array.isArray(send_to)
      ? send_to.map((email) => ({ email }))
      : [{ email: send_to }],
    subject: subject,
    htmlContent: htmlContent,
    replyTo: reply_to ? { email: reply_to } : undefined,
  };

  console.log("Sender email:", send_from);
  console.log("Recipient email:", send_to);

  // Add attachments if provided
  if (attachments.length > 0) {
    payload.attachment = attachments.map((att) => ({
      content: att.content, // Base64 encoded
      name: att.filename,
    }));
  }

  try {
    const fetch = globalThis.fetch || require("node-fetch");

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("Brevo API Response:", responseText);
      throw new Error(`Brevo API Error (${response.status}): ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log("✅ Email sent successfully via Brevo API");
    console.log("Message ID:", data.messageId);
    return data;
  } catch (error) {
    console.error("❌ Brevo API Error:", error.message);
    throw new Error(`Brevo API Error: ${error.message}`);
  }
};

// SMTP method (for local development only)
const sendViaSMTP = async (
  subject,
  send_to,
  send_from,
  reply_to,
  template,
  context,
  attachments = [],
  baseDir = getBaseDir(),
) => {
  console.log("🔧 Using SMTP for email (development mode)");
  console.log("Base directory:", baseDir);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT == 465,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  const handlebarsOptions = {
    viewEngine: {
      extName: ".handlebars",
      partialsDir: path.resolve(baseDir, "views/emails"),
      defaultLayout: false,
    },
    viewPath: path.resolve(baseDir, "views/emails"),
    extName: ".handlebars",
  };

  transporter.use("compile", hbs(handlebarsOptions));

  const mailOptions = {
    from: send_from,
    to: send_to,
    replyTo: reply_to,
    subject,
    attachments: attachments.map((att) => ({
      filename: att.filename,
      content: att.content, // Base64 or buffer
    })),
  };

  // If template provided, use it; otherwise use direct HTML
  if (template) {
    mailOptions.template = template;
    mailOptions.context = context;
  } else {
    mailOptions.html = context?.html || "";
  }

  await transporter.verify();
  console.log("✅ SMTP connection verified");

  const info = await transporter.sendMail(mailOptions);
  console.log("📧 Email sent successfully via SMTP");
  return info;
};

// Main send mail function using template
const sendMail = async (
  subject,
  send_to,
  send_from,
  reply_to,
  template,
  context,
) => {
  console.log("📧 Email Service Called - Template Mode");
  console.log("Environment:", process.env.NODE_ENV);
  console.log("To:", send_to);
  console.log("Template:", template);

  try {
    if (process.env.BREVO_API_KEY) {
      console.log("🚀 Using Brevo API (Render-compatible)");

      const baseDir = getBaseDir();
      console.log("Base directory:", baseDir);
      
      const templatePath = path.resolve(
        baseDir,
        "views/emails",
        `${template}.handlebars`,
      );
      console.log("Template path:", templatePath);
      const templateSource = await fs.readFile(templatePath, "utf8");
      const compiledTemplate = handlebars.compile(templateSource);
      const htmlContent = compiledTemplate({ ...context, year: new Date().getFullYear() });

      console.log("HTML content length:", htmlContent.length);

      return await sendViaBrevoAPI(
        subject,
        send_to,
        send_from,
        reply_to,
        htmlContent,
      );
    }

    console.log("⚠️  BREVO_API_KEY not found, falling back to SMTP");
    const baseDir = getBaseDir();
    return await sendViaSMTP(
      subject,
      send_to,
      send_from,
      reply_to,
      template,
      { ...(context || {}), year: new Date().getFullYear() },
      [],
      baseDir,
    );
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    throw new Error(`Email sending failed: ${err.message}`);
  }
};

// Enhanced send custom email with HTML content and attachments
const sendCustomEmail = async (
  subject,
  send_to,
  send_from,
  reply_to,
  htmlContent,
  attachments = [],
  textContent = "",
) => {
  console.log("📧 Email Service Called - Custom Mode");
  console.log("Environment:", process.env.NODE_ENV);
  console.log("To:", send_to);
  console.log("Attachments:", attachments.length);

  try {
    if (process.env.BREVO_API_KEY) {
      console.log("🚀 Using Brevo API for custom email");

      return await sendViaBrevoAPI(
        subject,
        send_to,
        send_from,
        reply_to,
        htmlContent,
        attachments,
      );
    }

    console.log("⚠️  BREVO_API_KEY not found, falling back to SMTP");
    return await sendViaSMTP(
      subject,
      send_to,
      send_from,
      reply_to,
      null, // No template - using direct HTML
      { html: htmlContent },
      attachments,
    );
  } catch (err) {
    console.error("❌ Custom email sending failed:", err.message);
    throw new Error(`Custom email sending failed: ${err.message}`);
  }
};

// Helper to read file and convert to base64
const getAttachmentContent = async (filePath) => {
  try {
    const buffer = await fs.readFile(filePath);
    return buffer.toString("base64");
  } catch (error) {
    console.error("❌ Error reading attachment file:", error.message);
    return null;
  }
};

module.exports = {
  sendMail,
  sendCustomEmail,
  getAttachmentContent,
};
