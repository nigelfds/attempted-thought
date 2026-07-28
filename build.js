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
    day: "numeric",
    year: "numeric",
  });

const monthYearShort = (iso) =>
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
  const thumb = post.meta.thumb
    ? `\n      <img class="post-thumb" src="{{rel}}posts/${post.meta.thumb}" alt="${escapeHtml(post.meta.title)}" loading="lazy" />`
    : "";
  const article = `
    <article class="section post">
      <p class="eyebrow"><a class="back" href="{{rel}}blog/">← Blog</a></p>
      <h1>${post.meta.title}<span class="period">.</span></h1>
      <time class="post-date">${fullDate(post.meta.date)}</time>${thumb}
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

// ── 3a. Projects (single source of truth) ──────────────────────────────────
// The projects page (via {{projects}}) and the home feed both render from this
// list. `date` is each repo's first commit; `summary` is the short one-liner
// shown in the home feed; `body` is the full write-up on the projects page.
const projects = [
  {
    id: "car-calc",
    title: "CarCalc",
    date: "2026-07-26",
    live: "https://carcalc.nig.fm",
    repo: "https://github.com/nigelfds/car-calc",
    thumb: "car-calc.jpg",
    tags: "Node · Express · Vanilla JS · Australian tax/FBT modelling · Heroku",
    summary: "A Melbourne EV calculator that compares novated lease, loan and cash — no email required.",
    body: `This one started as a chat at football practice. Brad, one of the other dads,
              was in the market for an electric car — and kept hitting calculator sites
              that wanted his email before they'd tell him anything, just so they could
              spam him later. We got talking about how genuinely confusing the Australian
              side of it is: the fringe-benefits-tax changes, and which way of paying — a
              novated lease, a car loan, or cash — actually gets you the most car for your
              budget. It seemed like a fun problem, so I built an app that handles both the
              funding side and the car-selection side in one place. You tell it what you
              earn and what you want in a car, set a monthly budget, and it works out how
              much car each funding method reaches — with the novated-lease line flattening
              dead at the $91,661 FBT threshold — then shows you five real EVs around that
              ceiling, each costed three ways, with running costs, insurance and resale
              baked in. Every rate is editable and sourced, nothing calls a model, and it
              never asks for your email.`,
  },
  {
    id: "songcoach",
    title: "SongCoach",
    date: "2026-07-01",
    live: "https://github.com/nigelfds/songcoach/releases",
    repo: "https://github.com/nigelfds/songcoach",
    thumb: "songcoach.jpg",
    tags: "Python · FastAPI · Demucs · Swift · WaveSurfer.js · macOS",
    summary: "A local macOS app that isolates the drums from any song so you can learn it, then play along.",
    body: `An app to help my son and me get better at drums. We wanted to play along
              to songs we actually like — but to learn a part properly you need to
              <em>hear the drummer</em>, and once you can play it, their drums fight with
              yours. So SongCoach takes any song playing on your Mac — a YouTube tab,
              Spotify, a file — captures the system audio, and runs an AI source-separation
              model (Demucs) to split it into three stems: the full song, drums only, and
              the song with the drums removed. Then it opens a player with three synced
              waveforms, solo switching, A–B looping, and a pitch-preserved slow-down, so
              you can drill four bars until they're yours. Everything runs locally — no
              account, no cloud, nothing uploaded. It was my chance to learn how to embed
              an AI model inside an app, and to build and package a proper desktop app
              again — something I hadn't done in a long time. It ships as a signed,
              notarized macOS app.`,
  },
  {
    id: "drumcoach",
    title: "DrumCoach",
    date: "2026-06-13",
    live: "https://drumcoach.nig.fm/",
    repo: "https://github.com/nigelfds/drumcoach",
    thumb: "drumcoach.jpg",
    tags: "Web Audio API · DSP · JavaScript · Firebase/Firestore · GitHub Pages",
    summary: "An app that listens to you drum and coaches your timing.",
    body: `I've been learning the drums with my son this year, and we both struggle
              with timing — so I built an app that listens to us play and coaches it. The
              goal was something that just works on any phone or laptop, no specialist
              audio gear: you play near the mic and DrumCoach detects and classifies each
              hit, notates it on a live drum staff, and measures your timing with feedback
              ranges tuned to your level. It was great to work with high- and low-pass
              filters, Fourier transforms, and spectral centroids again — DSP concepts I
              hadn't touched since my computer-engineering classes. I also got to play
              with Firestore as a backing store, syncing practice data across devices tied
              to a real Google identity.`,
  },
  {
    id: "spell-to-fly",
    title: "Spell to Fly",
    date: "2026-05-27",
    live: "https://spelltofly.nig.fm/",
    repo: "https://github.com/nigelfds/spell-to-fly",
    thumb: "spell-to-fly.jpg",
    tags: "Rails · D3.js · TopoJSON · Web Speech API · Natural Earth · Heroku",
    summary: "A geography game where you fly the map by spelling city names.",
    body: `A geography-and-spelling game, and my excuse to work with maps again. I've
              loved mapping software ever since my Nokia days in Berlin working on Ovi
              Maps (2009–2010), so I put Claude to the test on map data, pathfinding, and
              spoken audio. You fly across a region — Europe, Africa, Asia, or the
              Americas — hopping from city to city by spelling each country and city name
              hangman-style, guided by text-to-speech pronunciation. Only the territory
              bordering you is revealed, so you're navigating a hidden graph toward a
              ticketed destination. I built it to help my kids learn geography and improve
              their spelling together. Getting the viewport and zoom behaviour right was
              genuinely hard to do with AI. Something like this would have taken me weeks
              of full-time work back in Berlin, but this time I had it running in two
              weekends.`,
  },
  {
    id: "mathgrid",
    title: "MathGrid",
    date: "2026-05-24",
    live: "https://mathgrid.nig.fm",
    repo: "https://github.com/nigelfds/maths",
    thumb: "mathgrid.jpg",
    tags: "Rails · Hotwire · Action Cable · Postgres · Redis · Heroku",
    summary: "A real-time multiplayer arithmetic race on a shared grid.",
    body: `A real-time multiplayer arithmetic game, and my go at a more ambitious
              hands-off Claude Code build. It started as a paper card game I made for my
              kids a year ago; this digital version lets 2+ players race on a shared 6×6
              grid to find three numbers in a line that satisfy a target formula. I built
              it partly to sharpen my kids' mental arithmetic and partly so my wife and I
              could play against them across our own devices. There's a gentler
              <em>No Multiplication</em> mode for younger players, room codes to join a
              game, and a leaderboard. The real-time coordination runs on Rails' Action
              Cable (via Turbo Streams + Redis) — and I made a point of getting it all
              running on a minimum Heroku spec.`,
  },
  {
    id: "spelling-bee",
    title: "Spelling Bee",
    date: "2026-05-23",
    live: "https://spell.nig.fm",
    repo: "https://github.com/nigelfds/spelling-bee",
    thumb: "spelling-bee.jpg",
    tags: "Rails · Ruby · Postgres · Heroku",
    summary: "A hangman-style spelling game for kids, built hands-off with Claude Code.",
    body: `A hands-off experiment in AI-only coding: I let Claude Code build the
              whole thing to see how it handles animation, game rules, DB schema
              design, and deployment. It's a small spelling game aimed at kids aged
              6–10, where an animated bee fills in with each wrong guess. There's a
              typed <em>Classic</em> mode and a spoken <em>Voice</em> mode — the latter
              added to mirror the way my own kids were learning their spelling out loud
              in school. Words come from the Oxford 3000 (with auto-fetched
              definitions), and scores land on a leaderboard.`,
  },
].sort((a, b) => (a.date < b.date ? 1 : -1));

// Full project cards for the projects page (injected as {{projects}}).
const projectsList = `<ul class="project-list">${projects
  .map(
    (p) => `
        <li class="project" id="${p.id}">
          <div class="project-body">
            <p class="project-date">${monthYearShort(p.date)}</p>
            <h2 class="project-title">${p.title}</h2>
            <a class="project-media" href="${p.live}" target="_blank" rel="noopener">
              <img src="{{rel}}projects/${p.thumb}" alt="Screenshot of ${escapeHtml(p.title)}" width="1000" height="625" loading="lazy" />
            </a>
            <p class="project-desc">${p.body}</p>
            <p class="project-tags">${p.tags}</p>
            <p class="project-links">
              <a href="${p.live}" target="_blank" rel="noopener">Live ↗</a>
              <a href="${p.repo}" target="_blank" rel="noopener">GitHub ↗</a>
            </p>
          </div>
        </li>`
  )
  .join("")}</ul>`;

// ── 3a-ii. Home feed: blog posts + projects, newest first ──────────────────
const feed = [
  ...posts.map((p) => ({
    kind: "Post",
    title: p.meta.title,
    date: p.meta.date,
    summary: p.meta.summary || "",
    href: `{{rel}}blog/${p.slug}/`,
    thumb: p.meta.thumb ? `{{rel}}posts/${p.meta.thumb}` : null,
  })),
  ...projects.map((p) => ({
    kind: "Project",
    title: p.title,
    date: p.date,
    summary: p.summary,
    href: `{{rel}}projects/#${p.id}`,
    thumb: `{{rel}}projects/${p.thumb}`,
  })),
].sort((a, b) => (a.date < b.date ? 1 : -1));

const feedItems = (list) =>
  list
    .map((item) => {
      const thumb = item.thumb
        ? `<img src="${item.thumb}" alt="" loading="lazy" />`
        : `<span class="feed-mono">${monogram(item.title)}</span>`;
      return `
        <li class="feed-item">
          <a class="feed-link" href="${item.href}">
            <span class="feed-thumb">${thumb}</span>
            <span class="feed-text">
              <span class="feed-titlerow">
                <span class="feed-title">${item.title}</span>
                <span class="feed-meta">${monthYear(item.date)}${item.kind ? `<span class="entry-kind">${item.kind}</span>` : ""}</span>
              </span>
              <span class="feed-desc">${item.summary}</span>
            </span>
          </a>
        </li>`;
    })
    .join("");

const recentPosts = `<ul class="feed">${feedItems(feed.slice(0, 15))}</ul>`;

// Blog index: every post, same thumbnail layout as the feed (no kind pill —
// they're all posts here).
const allPosts = `<ul class="feed">${feedItems(
  posts.map((p) => ({
    title: p.meta.title,
    date: p.meta.date,
    summary: p.meta.summary || "",
    href: `{{rel}}blog/${p.slug}/`,
    thumb: p.meta.thumb ? `{{rel}}posts/${p.meta.thumb}` : null,
  }))
)}</ul>`;

// ── 3b. Papers section (parsed from src/data/papers.md) ─────────────────────

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
    .replaceAll("{{projects}}", projectsList)
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

// ── 6. GitHub Pages custom domain ───────────────────────────────────────────
// Each `gh-pages` deploy REPLACES the branch, which wipes the CNAME file GitHub
// Pages uses to remember the custom domain. Emitting it on every build keeps
// the domain from resetting on every push.
writeFileSync(join(OUT, "CNAME"), "www.nigel.in\n");

console.log(
  `✓ Built ${readdirSync(pagesDir).length} pages and ${posts.length} posts → public/`
);
