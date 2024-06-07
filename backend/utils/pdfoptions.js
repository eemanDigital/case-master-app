// module.exports.options = {
//   format: "A3",
//   orientation: "portrait",
//   border: "10mm",
//   header: {
//     height: "45mm",
//     contents: '<div style="text-align: center;">Author: Shyam Hajare</div>',
//   },
//   footer: {
//     height: "28mm",
//     contents: {
//       first: "Cover page",
//       2: "Second page", // Any page number is working. 1-based index
//       default:
//         '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
//       last: "Last Page",
//     },
//   },
// };

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
