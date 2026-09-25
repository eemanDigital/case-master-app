const fs = require("fs");
const path = require("path");

// usage: node _splice.js <controllerFile> <marker> <bodyFile>
// Replaces everything from `marker` (the report export start) up to and
// including the report function's closing `});` with the new body from bodyFile.
// The new body file should contain the full function WITHOUT the trailing `});`.

const srcFile = path.resolve(process.argv[2]);
const marker = process.argv[3];
const bodyFile = path.resolve(process.argv[4]);

let src = fs.readFileSync(srcFile, "utf8");
const body = fs.readFileSync(bodyFile, "utf8").trim();

const mi = src.indexOf(marker);
if (mi < 0) {
  console.error("START MARKER NOT FOUND:", marker);
  process.exit(1);
}

// Find the catchAsync wrapper: `exports.xxx = catchAsync(async (req,res,next) => { ... });`
const arrowRel = src.indexOf("(req, res, next) => {", mi);
if (arrowRel < 0) {
  console.error("ARROW NOT FOUND");
  process.exit(1);
}
const open = src.indexOf("{", arrowRel);
if (open < 0) {
  console.error("OPEN NOT FOUND");
  process.exit(1);
}

// Brace matching (naive but fine for code with balanced braces; skip known
// polyfill string that contains unbalanced braces if present).
let depth = 0;
let end = -1;
let i = open;
let quote = null;
const maxDepth = 50000;
while (i < src.length) {
  const ch = src[i];
  if (quote) {
    if (ch === "\\") { i += 2; continue; }
    if (ch === quote) quote = null;
    i++;
    continue;
  }
  if (ch === '"' || ch === "'" || ch === "`") { quote = ch; i++; continue; }
  if (ch === "{") { depth++; i++; continue; }
  if (ch === "}") {
    if (depth === 0) {
      console.error("UNBALANCED at", i);
      process.exit(1);
    }
    depth--;
    if (depth === 0) { end = i; break; }
    i++;
    continue;
  }
  i++;
}
if (end < 0 || depth !== 0) {
  console.error("BRACE MATCH FAILED depth=", depth, "end=", end);
  process.exit(1);
}

// After the body's final `}` there is `;` then likely `\n` + maybe a footer.
// We consume the whole report: from mi to end, then append `}` + `;`.
const afterCloser = src.slice(end + 1);
// afterCloser normally starts with `);` (the catchAsync close). Keep a sane tail:
const tailKeep = afterCloser.startsWith(")") ? afterCloser : afterCloser.replace(/^[^\n]*\n?/, "");

const head = src.slice(0, mi);
const tail = tailKeep; // e.g. ");" + rest

const out = head + body + "\n" + tail;
fs.writeFileSync(srcFile, out);
console.log("SPLICED OK", path.basename(srcFile), "| body bytes:", Buffer.byteLength(body));
