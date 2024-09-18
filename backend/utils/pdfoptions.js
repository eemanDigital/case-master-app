// module.exports = {
//   format: "A4",
//   orientation: "portrait",
//   border: {
//     top: "15mm",
//     right: "8mm",
//     bottom: "15mm",
//     left: "8mm",
//   },
//   header: {
//     height: "30mm",
//     contents: `
//       <div style="text-align: center; font-size: 5pt; color: #fff;">
//         <h1 style="margin: 0;">A.T Lukman & Co.</h1>
//         <p style="margin: 5px 0;">Address: 123 Business Street, City, Country</p>
//       </div>
//     `,
//   },
//   footer: {
//     height: "15mm",
//     contents: {
//       default:
//         '<div style="text-align: center; font-size: 9pt; color: #777;">Page {{page}} of {{pages}}</div>',
//       first:
//         '<div style="text-align: center; font-size: 9pt; color: #777;">Page {{page}} of {{pages}} - A.T Lukman & Co.</div>',
//       last: '<div style="text-align: center; font-size: 9pt; color: #777;">Page {{page}} of {{pages}} - Thank you for your business</div>',
//     },
//   },
//   childProcessOptions: {
//     env: {
//       OPENSSL_CONF: "/dev/null",
//     },
//   },
// };

module.exports = {
  format: "A4",
  orientation: "portrait",
  border: {
    top: "15mm",
    right: "8mm",
    bottom: "15mm",
    left: "8mm",
  },
  header: {
    height: "30mm",
    contents: `
      <div style="text-align: center; font-size: 10pt; color: #555;">
        <h1 style="margin: 0;">A.T Lukman & Co.</h1>
        <p style="margin: 5px 0;">Address: 123 Business Street, City, Country</p>
      </div>
    `,
  },
  footer: {
    height: "15mm",
    contents: {
      default:
        '<div style="text-align: center; font-size: 9pt; color: #777;">Page {{page}} of {{pages}}</div>',
      first:
        '<div style="text-align: center; font-size: 9pt; color: #777;">Page {{page}} of {{pages}} - A.T Lukman & Co.</div>',
      last: '<div style="text-align: center; font-size: 9pt; color: #777;">Page {{page}} of {{pages}} - Thank you for your business</div>',
    },
  },
  childProcessOptions: {
    env: {
      OPENSSL_CONF: "/dev/null",
    },
  },
  //  set global styles
  content: `
    <style>
      body {
        font-family: Arial, sans-serif;
        font-size: 12pt;
      }
      /* You can add more global styles here */
    </style>
  `,
};
