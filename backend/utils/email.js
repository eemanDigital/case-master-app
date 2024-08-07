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
      return nodemailer.createTransport({
        service: "outlook",
        host: process.env.EMAIL_HOST_OUTLOOK,
        port: 587,
        auth: {
          user: process.env.EMAIL_USER_OUTLOOK,
          pass: process.env.OUTLOOK_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }

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
    context, // This now includes all dynamic data
  };

  await transporter.sendMail(mailOptions, function (err, info) {
    if (err) {
      console.error("Error sending email:", err);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

module.exports = sendMail;
