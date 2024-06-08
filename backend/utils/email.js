const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.firstName.split(" ")[0];
    this.url = url;
    this.from = `Lukman Asinmi <${process.env.EMAIL_FROM}>`;
  }

  createNewTransport() {
    if (process.env.NODE_ENV === "production") {
      // return a transport for production
      // for example, using Sendgrid
      return nodemailer.createTransport({
        service: "Sendgrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
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

  async send(template, subject, attachments = []) {
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.htmlToText(html),
      attachments: attachments.map((attachment) => ({
        filename: attachment.filename,
        path: attachment.path,
      })),
    };

    await this.createNewTransport().sendMail(mailOptions);
  }

  // method to sent welcome email to new user
  async sendWelcome() {
    await this.send("welcome", "Welcome to CaseMaster");
  }

  // method to allow user reset password after forgetting one
  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your Password Reset Token. Valid for 10 minutes"
    );
  }
};
