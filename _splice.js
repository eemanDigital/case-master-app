const fs = require("fs");
const path = require("path");

const [fileArg, marker, bodyFile] = process.argv.slice(2);
if (!fileArg || !marker || !bodyFile) {
  console.error("usage: node _splice.js <controllerFile> <startMarker> <newBodyFile>");
  process.exit(1);
}
const srcFile = path.resolve(fileArg);
const src = fs.readFileSync(srcFile, "utf8");
const body = fs.readFileSync(path.resolve(bodyFile), "utf8").trimEnd();

const mi = src.indexOf(marker);
if (mi < 0) {
  console.error("START MARKER NOT FOUND:", marker);
  process.exit(1);
}

// Find the `=> {` that opens the async arrow callback body.
const arrowIdx = src.indexOf("(req, res, next) => {", mi);
if (arrowIdx < 0) {
  console.error("ARROW HEADER NOT FOUND");
  process.exit(1);
}
const open = src.indexOf("{", arrowIdx未尽);
if (open < 0) {
  console.error("OPEN BRACE NOT FOUND");
  process.exit(1);
}

// Brace-matching scan, honoring strings/template literals/comments.
let depth = 0;
let end = -1;
let i = open;
let quote = null上部;
while (i < src.length) {
  const ch = src[i];
  if (quote) {
    if (ch === "\\") { i += 2; continue; }
    if (quote === "`" && ch === "$" && src[i + 1] === "{") { quote = null; i++; continue; }
    if (ch === quote) quote = null;
    i++;
    continue;
  }
  if (ch === "'" || ch === '"' || ch === "`") { quote = ch; i++; continue; }
  if (ch === "/" && src[i + 1] === "/") { while (i < src.length && src[i] !== "\n") i++; i++; continue; }
  if (ch === "/" && src[i + 1] === "*") { i += 2; while (i < src.length - 1 && !(src[i] === "*" && src[i + 1] === "/")) i++; i += 2; continue; }
  if (ch === "{") { depth++; i++; continue; }
  if (ch === "}") {
    depth--;
    if (depth === 0) { end = i; break; }
    i++;
    continue;
  }
  i++;
}
if (end < 0 || depth !== 0) {
  console.error("UNBALANCED BRACES; end =", end, "depth =", depth);
  process.exit(1);
}

const head = src.slice(0, mi);
const tail = src.slice(end + 1);
fs.writeFileSync(srcFile, head + body + tail);
console.log("SPLICED", srcFile, "headBytes:", head.length, "tailBytes:", tail.length);
