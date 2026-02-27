// Dynamic PDF options that can be customized per-firm
module.exports = (firm = {}) => {
  const firmName = firm?.name || "Law Firm";
  const primaryColor = firm?.settings?.primaryColor || "#1a365d";

  return {
    format: "A4",
    orientation: "portrait",
    border: {
      top: "10mm",
      right: "10mm",
      bottom: "10mm",
      left: "10mm",
    },
    header: {
      height: "15mm",
      contents: `
        <div style="text-align: center; font-size: 10pt; color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 8px; font-weight: 600;">
          ${firmName}
        </div>
      `,
    },
    footer: {
      height: "12mm",
      contents: {
        default: `
          <div style="text-align: center; font-size: 9pt; color: #777; border-top: 1px solid #ddd; padding-top: 6px;">
            Page <span style="font-weight: bold;">{{page}}</span> of <span style="font-weight: bold;">{{pages}}</span>
          </div>
        `,
      },
    },
    childProcessOptions: {
      env: {
        OPENSSL_CONF: "/dev/null",
      },
    },
  };
};

// Export default for backward compatibility
module.exports.default = module.exports;
