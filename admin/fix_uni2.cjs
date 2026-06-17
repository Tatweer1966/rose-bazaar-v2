const fs = require("fs");
let c = fs.readFileSync("src/pages/CmsAdminDashboard.jsx", "utf8");
// Replace all problematic unicode escapes with actual characters
c = c.replace(/\\u\{1F50D\}/g, "??");
c = c.replace(/?/g, "?");
c = c.replace(/?/g, "?");
c = c.replace(/?/g, "?");
c = c.replace(/?/g, "?");
c = c.replace(/?/g, "?");
c = c.replace(/?/g, "?");
c = c.replace(/?/g, "?");
c = c.replace(/?/g, "?");
c = c.replace(/?/g, "?");
fs.writeFileSync("src/pages/CmsAdminDashboard.jsx", c);
console.log("Fixed all unicode escapes!");
