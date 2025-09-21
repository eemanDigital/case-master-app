module.exports = {
  format: "A4",
  orientation: "portrait",
  border: {
    top: "20mm", // more breathing space at top
    right: "15mm", // wider content area
    bottom: "20mm",
    left: "15mm",
  },
  header: {
    height: "20mm",
    contents: `
      <div style="text-align: center; font-size: 12pt; font-weight: bold; color: #333;">
        A.T Lukman & Co. — Barristers & Solicitors of the Supreme Court of Nigeria.
     
      </div>
    `,
  },
  footer: {
    height: "15mm",
    contents: {
      default:
        '<div style="text-align: center; font-size: 10pt; color: #777;">Page {{page}} of {{pages}}</div>',
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
        font-size: 14pt;     /* larger default font */
        line-height: 1.6;    /* better readability */
        color: #222;
      }
      h1 {
        font-size: 20pt;
        text-align: center;
        margin-bottom: 10px;
        color: #111;
      }
      h2 {
        font-size: 16pt;
        margin-top: 20px;
        color: #333;
      }
      p {
        font-size: 14pt;
        margin: 8px 0;
      }
    </style>

    <h1>Case Report</h1>
    <p><strong>Client:</strong> John Doe</p>
    <p><strong>Case No:</strong> 12345</p>
    <p><strong>Date:</strong> 14th September 2025</p>
    <hr />

    <h2>Summary</h2>
    <p>
      This is a sample PDF report generated using A.T Lukman & Co. template.
      Replace this section with actual case details.
    </p>

    <h2>Details</h2>
    <p>
      More detailed case information can be placed here...
    </p>
  `,
};
