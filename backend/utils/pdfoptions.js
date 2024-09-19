module.exports = {
  format: "A4",
  orientation: "portrait",
  border: {
    top: "5mm",
    right: "8mm",
    bottom: "10mm",
    left: "8mm",
  },
  header: {
    height: "60mm",
    contents: {
      first: `
        <div style="text-align: center; font-size: 10pt; color: #555;">
          <img src="/images/scale.jpg" alt="A.T Lukman & Co. Logo" style="width: 150px; margin-bottom: 10px;">
          <h1 style="margin: 0;">A.T Lukman & Co.</h1>
          <p style="margin: 5px 0;">Lawyers, Solicitors & Advocates</p>
          <p style="margin: 5px 0;">Website: www.atlukman.com</p>
          <p style="margin: 0;">Address: 123 Business Street, City, Country</p>
          <p style="margin: 5px 0;">Email: asimi@gmail.com</p>
          <p style="margin: 5px 0;">Phone: +234 123 456 789</p>
        </div>
      `,
      other: "", // This ensures no header on subsequent pages
    },
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
