// module.exports.options = {
//   format: "A4",
//   orientation: "portrait",
//   border: "8mm",
//   header: {
//     height: "40mm",
//     contents: `<div style="text-align: center;"> A.T Lukman & Co.
//                   <p>Address:  In a server-side rendering context, the relative paths to CSS files can sometimes be problematic, especially when generating </p>
//               </div>`,
//   },
//   footer: {
//     height: "25mm",
//     contents: {
//       first: "Invoice",
//       2: "Second page",
//       default:
//         '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
//       last: "Last Page",
//     },
//   },
// };

module.exports = {
  format: "A4", // Paper size
  orientation: "portrait", // Portrait or landscape
  border: "10mm",
  margin: {
    top: "20mm",
    right: "5mm",
    bottom: "10mm",
    left: "5mm",
  },
  header: {
    height: "10mm",
    contents: '<div style="text-align: center;">Author: A.T Lukman & Co.</div>',
  },
  footer: {
    height: "10mm",
    contents: {
      default:
        '<span style="color: #444;">Page {{page}}</span>/<span>{{pages}}</span>', // Place your footer content here
    },
  },
};
