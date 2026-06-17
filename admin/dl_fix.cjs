const https = require("https");
const fs = require("fs");
https.get("https://codewords-uploads.s3.amazonaws.com/runtime_v2/93f12c278e98434cb423feb775faf4f94e1228fc731f48318e3c2ffb04d722d0/CmsAdminDashboard_v4.jsx", res => {
  const chunks = [];
  res.on("data", d => chunks.push(d));
  res.on("end", () => {
    let c = Buffer.concat(chunks).toString("utf8");
    if (c.charCodeAt(0) === 0xFEFF) c = c.slice(1);
    c = c.replace(/\\u\{1F50D\}/g, String.fromCodePoint(0x1F50D));
    c = c.replace(/?/g, String.fromCodePoint(0x25A3));
    c = c.replace(/?/g, String.fromCodePoint(0x25A6));
    c = c.replace(/?/g, String.fromCodePoint(0x25A4));
    c = c.replace(/?/g, String.fromCodePoint(0x25B6));
    c = c.replace(/?/g, String.fromCodePoint(0x2261));
    c = c.replace(/?/g, String.fromCodePoint(0x25A5));
    c = c.replace(/?/g, String.fromCodePoint(0x275D));
    c = c.replace(/?/g, String.fromCodePoint(0x2234));
    c = c.replace(/?/g, String.fromCodePoint(0x25CB));
    fs.writeFileSync("src/pages/CmsAdminDashboard.jsx", c, "utf8");
    console.log("Done! Unicode fixed, optional chaining preserved.");
  });
});
