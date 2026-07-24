// Minimal static-site generator: src/ → public/
//
// - Wraps each page in src/pages/ with src/layout.html
// - Renders each Markdown file in src/posts/ into /blog/<slug>/
// - Injects the post list into the home page ({{recent_posts}}, 3 newest)
//   and the blog index ({{all_posts}})
// - Copies src/assets/* to the public/ root
//
// No framework. Run with `npm run build`.

import { marked } from "marked";
import {
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  cpSync,
  existsSync,
} from "node:fs";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const SRC = join(root, "src");
const OUT = join(root, "public");

// Start from a clean output directory.
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const layout = readFileSync(join(SRC, "layout.html"), "utf8");

/** Split `---` frontmatter from body. Returns { meta, body }. */
function frontmatter(text) {
  const meta = {};
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta, body: text };
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > -1) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: m[2] };
}

/** Wrap page content in the shared layout. */
function render({ title, description, content }) {
  return layout
    .replaceAll("{{title}}", title || "Nigel")
    .replaceAll("{{description}}", description || "")
    .replace("{{content}}", () => content); // fn form: avoid `$` being treated specially
}

/**
 * Write `html` to public/<route>/index.html (route "" → public/index.html).
 * Substitutes {{rel}} with the relative path back to the site root for this
 * page's depth ("./", "../", "../../"), so all links/assets are relative and
 * work at any mount point (project subpath or custom-domain root).
 */
function writePage(route, html) {
  const depth = route ? route.split("/").length : 0;
  const rel = depth === 0 ? "./" : "../".repeat(depth);
  const out = html.replaceAll("{{rel}}", rel);
  const dir = route ? join(OUT, route) : OUT;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), out);
}

const monthYear = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

const fullDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// ── 1. Collect & sort posts ────────────────────────────────────────────────
const postsDir = join(SRC, "posts");
const posts = readdirSync(postsDir)
  .filter((f) => f.endsWith(".md"))
  .map((file) => {
    const slug = basename(file, ".md");
    const { meta, body } = frontmatter(readFileSync(join(postsDir, file), "utf8"));
    return { slug, meta, body };
  })
  .sort((a, b) => (a.meta.date < b.meta.date ? 1 : -1));

// ── 2. Render each post page ────────────────────────────────────────────────
for (const post of posts) {
  const article = `
    <article class="section post">
      <p class="eyebrow"><a class="back" href="{{rel}}blog/">← Blog</a></p>
      <h1>${post.meta.title}<span class="period">.</span></h1>
      <time class="post-date">${fullDate(post.meta.date)}</time>
      <div class="post-body">
${marked.parse(post.body)}
      </div>
    </article>`;
  writePage(
    `blog/${post.slug}`,
    render({
      title: `${post.meta.title} — Nigel`,
      description: post.meta.summary || "",
      content: article,
    })
  );
}

// ── 3. Build reusable post-list markup ─────────────────────────────────────
const postListItems = (list) =>
  list
    .map(
      (p) => `
        <li class="entry">
          <a href="{{rel}}blog/${p.slug}/">
            <span class="entry-title">${p.meta.title}</span>
            <time class="entry-meta">${monthYear(p.meta.date)}</time>
          </a>
          <p class="entry-desc">${p.meta.summary || ""}</p>
        </li>`
    )
    .join("");

const recentPosts = `<ul class="entry-list">${postListItems(posts.slice(0, 3))}</ul>`;
const allPosts = `<ul class="entry-list">${postListItems(posts)}</ul>`;

// ── 3b. Papers section (parsed from src/data/papers.md) ─────────────────────
const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Deterministic hue (0–359) from a string, for the cover-tile color.
const hueOf = (s) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 360;
};

// First letter of the title, for the monogram cover.
const monogram = (title) => {
  const m = title.match(/[A-Za-z0-9]/);
  return (m ? m[0] : "#").toUpperCase();
};

const coverTile = (title) =>
  `<span class="paper-thumb" style="--hue:${hueOf(title)}" aria-hidden="true">${monogram(title)}</span>`;

// Best of the rest — grayscale, varied shade per title (light + dark).
const grayTile = (title) => {
  const h = hueOf(title);
  const gl = 80 + (h % 13); // light-mode bg lightness 80–92%
  const gld = 20 + (h % 12); // dark-mode bg lightness 20–31%
  return `<span class="paper-thumb paper-thumb--gray" style="--gl:${gl}%;--gld:${gld}%" aria-hidden="true">${monogram(
    title
  )}</span>`;
};

// Additional reads — plain white tile with a thin black border.
const plainTile = (title) =>
  `<span class="paper-thumb paper-thumb--plain" aria-hidden="true">${monogram(title)}</span>`;

// Render an inline-markdown note, dropping dead internal /papers/<id> links.
const renderNote = (md) =>
  marked.parseInline(md.replace(/\[([^\]]+)\]\(\/papers\/[^)]*\)/g, "$1"));

// Parse the first markdown link of a list item as the paper; the rest is a note.
function parsePaperItem(text) {
  const m = text.match(/^\[([^\]]+)\]\(([^)]+)\)\s*([\s\S]*)$/);
  if (m) return { title: m[1].trim(), url: m[2].trim(), note: m[3].trim() };
  return { title: text.trim(), url: "", note: "" };
}

function parsePapers(md) {
  const intro = [];
  const groups = [];
  let cur = null;
  for (const raw of md.split("\n")) {
    const line = raw.trim();
    if (/^#\s/.test(line)) continue; // top-level title
    if (/^##\s/.test(line)) {
      cur = { title: line.replace(/^##\s+/, "").replace(/:\s*$/, "").trim(), papers: [] };
      groups.push(cur);
      continue;
    }
    if (/^-{3,}$/.test(line) || line === "") continue;
    const bullet = line.match(/^[*-]\s+(.*)$/);
    if (bullet && cur) {
      cur.papers.push(parsePaperItem(bullet[1]));
    } else if (!cur) {
      intro.push(line);
    }
  }
  return { intro: intro.join(" "), groups };
}

function buildPapers() {
  const md = readFileSync(join(SRC, "data", "papers.md"), "utf8");
  const { intro, groups } = parsePapers(md);
  let html = intro ? `<p class="papers-intro">${renderNote(intro)}</p>` : "";

  for (const g of groups) {
    const linkOnly = g.papers.every((p) => !p.note);
    html += `<h2 class="papers-group">${escapeHtml(g.title)}</h2>`;

    if (linkOnly) {
      html +=
        `<ul class="paper-grid">` +
        g.papers
          .map(
            (p) => `
          <li class="paper-card">
            <a href="${p.url}" target="_blank" rel="noopener">
              ${plainTile(p.title)}
              <span class="paper-card-title">${escapeHtml(p.title)}</span>
            </a>
          </li>`
          )
          .join("") +
        `</ul>`;
    } else {
      html +=
        `<ul class="paper-list">` +
        g.papers
          .map(
            (p) => `
          <li class="paper-row">
            <a class="paper-thumb-link" href="${p.url}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">${grayTile(p.title)}</a>
            <div class="paper-body">
              <a class="paper-title" href="${p.url}" target="_blank" rel="noopener">${escapeHtml(p.title)}</a>
              ${p.note ? `<p class="paper-note">${renderNote(p.note)}</p>` : ""}
            </div>
          </li>`
          )
          .join("") +
        `</ul>`;
    }
  }
  return html;
}

const papers = buildPapers();

// ── 3c. Books section (parsed from src/data/books.md) ───────────────────────
// Keep in sync with slugify() in scripts/fetch-covers.mjs
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const coversDir = join(SRC, "assets", "covers");

function bookCover(title) {
  const slug = slugify(title);
  if (existsSync(join(coversDir, `${slug}.jpg`))) {
    return `<span class="book-thumb"><img src="{{rel}}covers/${slug}.jpg" alt="Cover of ${escapeHtml(
      title
    )}" loading="lazy" /></span>`;
  }
  return `<span class="book-thumb" style="--hue:${hueOf(title)}" aria-hidden="true">${monogram(
    title
  )}</span>`;
}

function parseBooks(md) {
  const groups = [];
  let cur = null;
  let last = null;
  for (const raw of md.split("\n")) {
    const line = raw.trim();
    if (/^#\s/.test(line)) continue;
    if (/^##\s/.test(line)) {
      cur = { title: line.replace(/^##\s+/, "").trim(), books: [] };
      groups.push(cur);
      last = null;
      continue;
    }
    if (line === "") continue;
    const bullet = line.match(/^[*-]\s+(.*)$/);
    if (bullet && cur) {
      const m = bullet[1].match(/^\[([^\]]+)\]\(([^)]+)\)\s*([\s\S]*)$/);
      if (!m) continue;
      last = { title: m[1].trim(), url: m[2].trim(), note: m[3].trim() };
      cur.books.push(last);
    } else if (last && /^by\s/i.test(line)) {
      last.note = (last.note + " " + line).trim(); // author wrapped to next line
    }
  }
  return groups;
}

function buildBooks() {
  const md = readFileSync(join(SRC, "data", "books.md"), "utf8");
  const groups = parseBooks(md);
  let html = "";
  for (const g of groups) {
    html += `<h2 class="papers-group">${escapeHtml(g.title)}</h2>`;
    html +=
      `<ul class="book-list">` +
      g.books
        .map(
          (b) => `
        <li class="book-row">
          <a class="book-cover-link" href="${b.url}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">${bookCover(b.title)}</a>
          <div class="book-body">
            <a class="book-title" href="${b.url}" target="_blank" rel="noopener">${escapeHtml(b.title)}</a>
            ${b.note ? `<p class="book-note">${renderNote(b.note)}</p>` : ""}
          </div>
        </li>`
        )
        .join("") +
      `</ul>`;
  }
  return html;
}

const books = buildBooks();

// ── 3d. Talks section (parsed from src/data/talks.md) ───────────────────────
function buildTalks() {
  const md = readFileSync(join(SRC, "data", "talks.md"), "utf8");
  const intro = [];
  const items = [];
  for (const raw of md.split("\n")) {
    const line = raw.trim();
    if (/^#/.test(line) || line === "") continue;
    const b = line.match(/^[*-]\s+(.*)$/);
    if (b) items.push(parsePaperItem(b[1]));
    else if (items.length === 0) intro.push(line);
  }
  let html = intro.length
    ? `<p class="papers-intro">${renderNote(intro.join(" "))}</p>`
    : "";
  html +=
    `<ul class="paper-list">` +
    items
      .map(
        (t) => `
        <li class="paper-row">
          <a class="paper-thumb-link" href="${t.url}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">${coverTile(t.title)}</a>
          <div class="paper-body">
            <a class="paper-title" href="${t.url}" target="_blank" rel="noopener">${escapeHtml(t.title)}</a>
            ${t.note ? `<p class="paper-note">${renderNote(t.note)}</p>` : ""}
          </div>
        </li>`
      )
      .join("") +
    `</ul>`;
  return html;
}

const talks = buildTalks();

// ── 4. Render pages ─────────────────────────────────────────────────────────
const pagesDir = join(SRC, "pages");
const routeFor = (name) => (name === "index" ? "" : name);

for (const file of readdirSync(pagesDir).filter((f) => f.endsWith(".html"))) {
  const name = basename(file, ".html");
  const { meta, body } = frontmatter(readFileSync(join(pagesDir, file), "utf8"));
  const content = body
    .replaceAll("{{recent_posts}}", recentPosts)
    .replaceAll("{{all_posts}}", allPosts)
    .replaceAll("{{papers}}", papers)
    .replaceAll("{{books}}", books)
    .replaceAll("{{talks}}", talks);
  writePage(
    routeFor(name),
    render({ title: meta.title, description: meta.description, content })
  );
}

// ── 5. Copy assets (recursively, so covers/ ships too) ──────────────────────
cpSync(join(SRC, "assets"), OUT, { recursive: true });

console.log(
  `✓ Built ${readdirSync(pagesDir).length} pages and ${posts.length} posts → public/`
);
