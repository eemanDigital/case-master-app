// const nodemailer = require("nodemailer");

// const sendMail = (subject, message, sendTo, sentFrom, replyTo) => {
//   //email transporter set up
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: 587,
//     // secure: false,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//     // tls: {
//     //   rejectUnauthorized: false,
//     // },
//   });

//   // email options
//   const options = {
//     from: sentFrom,
//     to: sendTo,
//     replyTo: replyTo,
//     subject: subject,
//     html: message,
//   };

//   // send email
//   transporter.sendMail(options, function (err, info) {
//     if (err) {
//       console.log(err);
//     }
//     {
//       console.log(info);
//     }
//   });
// };

// module.exports = sendMail;

// const nodemailer = require("nodemailer");

// const sendMail = async (subject, message, sendTo, sentFrom, replyTo) => {
//   try {
//     // Email transporter setup
//     const transporter = nodemailer.createTransport({
//       host: process.env.EMAIL_HOST,
//       port: 465,
//       secure: true,
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     // Email options
//     const options = {
//       from: sentFrom,
//       to: sendTo,
//       replyTo: replyTo,
//       subject: subject,
//       html: message,
//     };

//     // Send email
//     const info = await transporter.sendMail(options);
//     console.log("Email sent:", info.response);
//   } catch (error) {
//     console.error("Error sending email:", error);
//     throw new Error("Email not sent, try again");
//   }
// };

// module.exports = sendMail;
const nodemailer = require("nodemailer");
//"Gmail" is not a good idea for this kind of app/or production app generally
//you can only send 500 mail per day using gmail
//your msg could quickly be marked as spam
//gmail may be used for private app which requires sending mail to yourself or few people

const sendMail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    // service:"Gmail",
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  //2) Define email options
  const mailOptions = {
    from: "Lukman Asinmi <user@user.io>",
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html
  };

  //3) Send the email
  await transporter.sendMail(mailOptions);
};
module.exports = sendMail;
