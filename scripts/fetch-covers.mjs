// One-time helper: download book cover images into src/assets/covers/.
//
// Strategy per book parsed from src/data/books.md:
//   1. If the Amazon link contains an ISBN-10 (/dp/<isbn>), try Open Library's
//      cover-by-ISBN endpoint.
//   2. Otherwise (or if that misses), search Open Library by title + author and
//      use the returned cover id.
//   3. If nothing is found, leave it — the build falls back to a monogram tile.
//
// Run:  node scripts/fetch-covers.mjs
// Re-run any time; existing covers are skipped unless --force is passed.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const COVERS = join(root, "src", "assets", "covers");
mkdirSync(COVERS, { recursive: true });

const force = process.argv.includes("--force");

// Keep this in sync with slugify() in build.js
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ── Parse books.md into { title, authorGuess, isbn } ────────────────────────
function parseBooks(md) {
  const books = [];
  let last = null;
  for (const raw of md.split("\n")) {
    const line = raw.trim();
    if (/^#{1,2}\s/.test(line) || line === "") continue;
    const bullet = line.match(/^[*-]\s+(.*)$/);
    if (bullet) {
      const m = bullet[1].match(/^\[([^\]]+)\]\(([^)]+)\)\s*([\s\S]*)$/);
      if (!m) continue;
      const [, title, url, rest] = m;
      const dp = url.match(/\/dp\/([0-9]{9}[0-9Xx])/); // ISBN-10 only (skip B0… ASINs)
      last = { title: title.trim(), url, rest: rest.trim(), isbn: dp ? dp[1] : null };
      books.push(last);
    } else if (last && /^by\s/i.test(line)) {
      // author wrapped onto the next line
      last.rest = (last.rest + " " + line).trim();
    }
  }
  // Derive a rough author for search queries.
  for (const b of books) {
    const by = b.rest.match(/^by\s+([^.]+)/i);
    b.author = by ? by[1].replace(/\s+and\s+|,/gi, " ").trim() : "";
  }
  return books;
}

// Accept common image formats (we still save with a .jpg name; browsers sniff).
const isImage = (b) =>
  b.length > 1500 &&
  ((b[0] === 0xff && b[1] === 0xd8) || // jpeg
    (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) || // png
    (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) || // gif
    (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46)); // riff/webp

async function tryUrl(url) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return isImage(buf) ? buf : null;
  } catch {
    return null;
  }
}

async function searchCover(title, author) {
  // Try a couple of query shapes; scan several results for one with a cover.
  const main = title.split(/[:—–―]/)[0].trim();
  const queries = [
    [title, author].filter(Boolean).join(" "),
    [main, author].filter(Boolean).join(" "),
  ];
  for (const query of queries) {
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(
          query
        )}&limit=5&fields=cover_i,isbn`
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const doc of data.docs || []) {
        if (doc.cover_i) {
          const buf = await tryUrl(`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`);
          if (buf) return buf;
        }
        for (const isbn of (doc.isbn || []).slice(0, 3)) {
          const buf = await tryUrl(
            `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`
          );
          if (buf) return buf;
        }
      }
    } catch {
      /* try next query */
    }
  }
  return null;
}

async function googleBooksCover(title, author) {
  const main = title.split(/[:—–―]/)[0].trim(); // drop subtitle
  const parts = [`intitle:${main}`];
  if (author) parts.push(`inauthor:${author}`);
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        parts.join(" ")
      )}&maxResults=4&country=US`
    );
    if (!res.ok) return null;
    const data = await res.json();
    for (const it of data.items || []) {
      let t =
        it.volumeInfo?.imageLinks?.thumbnail ||
        it.volumeInfo?.imageLinks?.smallThumbnail;
      if (!t) continue;
      t = t.replace(/^http:/, "https:").replace("&edge=curl", "").replace("zoom=1", "zoom=2");
      const buf = await tryUrl(t);
      if (buf) return buf;
    }
  } catch {
    /* ignore */
  }
  return null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const books = parseBooks(readFileSync(join(root, "src", "data", "books.md"), "utf8"));
let got = 0;
const missing = [];

for (const b of books) {
  const slug = slugify(b.title);
  const out = join(COVERS, `${slug}.jpg`);
  if (existsSync(out) && !force) {
    got++;
    continue;
  }

  let buf = null;
  if (b.isbn) {
    buf = await tryUrl(`https://covers.openlibrary.org/b/isbn/${b.isbn}-L.jpg?default=false`);
  }
  if (!buf) buf = await searchCover(b.title, b.author);
  if (!buf) buf = await googleBooksCover(b.title, b.author);

  if (buf) {
    writeFileSync(out, buf);
    got++;
    console.log(`✓ ${b.title}`);
  } else {
    missing.push(b.title);
    console.log(`· ${b.title} → monogram fallback`);
  }
  await sleep(300); // be polite to the API
}

console.log(
  `\nDone. ${got}/${books.length} covers saved to src/assets/covers/.` +
    (missing.length ? `\nMonogram fallback (${missing.length}): ${missing.join("; ")}` : "")
);
