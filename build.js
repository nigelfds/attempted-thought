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
  copyFileSync,
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
    .replace("{{content}}", content);
}

/** Write `html` to public/<route>/index.html (route "" → public/index.html). */
function writePage(route, html) {
  const dir = route ? join(OUT, route) : OUT;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
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
      <p class="eyebrow"><a class="back" href="/blog/">← Blog</a></p>
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
          <a href="/blog/${p.slug}/">
            <span class="entry-title">${p.meta.title}</span>
            <time class="entry-meta">${monthYear(p.meta.date)}</time>
          </a>
          <p class="entry-desc">${p.meta.summary || ""}</p>
        </li>`
    )
    .join("");

const recentPosts = `<ul class="entry-list">${postListItems(posts.slice(0, 3))}</ul>`;
const allPosts = `<ul class="entry-list">${postListItems(posts)}</ul>`;

// ── 4. Render pages ─────────────────────────────────────────────────────────
const pagesDir = join(SRC, "pages");
const routeFor = (name) => (name === "index" ? "" : name);

for (const file of readdirSync(pagesDir).filter((f) => f.endsWith(".html"))) {
  const name = basename(file, ".html");
  const { meta, body } = frontmatter(readFileSync(join(pagesDir, file), "utf8"));
  const content = body
    .replaceAll("{{recent_posts}}", recentPosts)
    .replaceAll("{{all_posts}}", allPosts);
  writePage(
    routeFor(name),
    render({ title: meta.title, description: meta.description, content })
  );
}

// ── 5. Copy assets ──────────────────────────────────────────────────────────
const assetsDir = join(SRC, "assets");
for (const file of readdirSync(assetsDir)) {
  copyFileSync(join(assetsDir, file), join(OUT, file));
}

console.log(
  `✓ Built ${readdirSync(pagesDir).length} pages and ${posts.length} posts → public/`
);
