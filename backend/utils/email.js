const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const path = require("path");

const sendMail = async (
  subject,
  send_to,
  send_from,
  reply_to,
  template,
  context
) => {
  function createNewTransport() {
    if (process.env.NODE_ENV === "production") {
      // Use SendInBlue API for production
      return nodemailer.createTransport({
        host: "smtp-relay.sendinblue.com",
        port: 587,
        auth: {
          user: process.env.SENDINBLUE_USERNAME,
          pass: process.env.SENDINBLUE_PASSWORD,
        },
      });
    }

    // Use your existing setup for development
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  const handlebarsOptions = {
    viewEngine: {
      extName: ".handlebars",
      partialsDir: path.resolve("./views/emails"),
      defaultLayout: false,
    },
    viewPath: path.resolve("./views/emails"),
    extName: ".handlebars",
  };

  const transporter = createNewTransport();
  transporter.use("compile", hbs(handlebarsOptions));

  // options for sending email
  const mailOptions = {
    from: send_from,
    to: send_to,
    replyTo: reply_to,
    template,
    subject,
    context, // contains all dynamic data
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return info;
  } catch (err) {
    console.error("Error sending email:", err);
    throw err;
  }
};

module.exports = sendMail;
