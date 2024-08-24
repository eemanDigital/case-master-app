const pdf = require("pdf-creator-node");
const path = require("path");
const pug = require("pug");
const pdfoptions = require("./pdfoptions");

// pdf generator
exports.generatePdf = (dataValue, res, templateFile, fileOutPath) => {
  pug.renderFile(
    // path.join(__dirname, "../views/invoice.pug"),
    path.join(__dirname, templateFile),
    // { invoice: safeInvoice },
    dataValue,
    function (err, html) {
      if (err) {
        console.error(err);
        res.sendStatus(500);
      } else {
        const options = pdfoptions; // assuming pdfoptions is an object with the required options

        const document = {
          html: html,
          data: dataValue,
          //   path: path.join(__dirname, `../output/${Math.random()}_invoice.pdf`),
          path: path.join(__dirname, fileOutPath),
        };

        pdf
          .create(document, options)
          .then((result) => {
            console.log(result);
            // Send the file to the client
            res.sendFile(path.resolve(document.path));
          })
          .catch((error) => {
            console.error(error);
            res.sendStatus(500);
          });
      }
    }
  );
};
