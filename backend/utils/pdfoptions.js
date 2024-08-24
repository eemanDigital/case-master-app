module.exports.options = {
  format: "A4",
  orientation: "portrait",
  border: "8mm",
  header: {
    height: "40mm",
    contents: `<div style="text-align: center;"> A.T Lukman & Co.
                  <p>Address:  In a server-side rendering context, the relative paths to CSS files can sometimes be problematic, especially when generating </p>
              </div>`,
  },
  footer: {
    height: "25mm",
    contents: {
      first: "Invoice",
      2: "Second page",
      default:
        '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
      last: "Last Page",
    },
  },
};
