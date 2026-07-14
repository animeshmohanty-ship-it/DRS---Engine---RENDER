// Minimal static file server for the DIIP Vision Portal (no dependencies).
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8123;
const ROOT = __dirname;
const TYPES = {
  ".html":"text/html", ".css":"text/css", ".js":"text/javascript",
  ".json":"application/json", ".svg":"image/svg+xml", ".png":"image/png",
  ".jpg":"image/jpeg", ".ico":"image/x-icon"
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(PORT, () => console.log(`DIIP Vision Portal running at http://localhost:${PORT}`));
