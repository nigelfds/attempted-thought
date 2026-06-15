// Local development / preview server.
//
// NOTE: GitHub Pages serves *static* files only and cannot run this server.
// This Express app exists purely to preview the contents of ./public locally.
// The same ./public directory is what gets published to the gh-pages branch
// (see `npm run deploy`).

import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Serve the static site exactly as GitHub Pages would.
app.use(express.static(join(__dirname, "public"), { extensions: ["html"] }));

app.listen(PORT, () => {
  console.log(`\n  ➜  Local preview:  http://localhost:${PORT}\n`);
});
