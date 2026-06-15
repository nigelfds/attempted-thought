# TODO — attempted thought

Tracking progress on Nigel's personal site.

## ✅ Done — scaffold, build, deploy

- [x] Project scaffold: `package.json`, `.nvmrc` (Node 20), `.gitignore`
- [x] Express local preview server (`server.js`)
- [x] No-framework build step (`build.js`): `src/` → `public/`
- [x] Multi-page layout with shared shell (`src/layout.html`)
- [x] Routes: `/`, `/blog/`, `/projects/`, `/books/`, `/papers/`, `/contact/`
- [x] Home = About + 3 latest posts; `/blog/` lists all
- [x] Markdown blog posts → per-post routes (`/blog/<slug>/`)
- [x] Icon-rail nav: vertical (desktop) ↔ horizontal top pill (mobile)
- [x] Path-based active-state highlighting
- [x] Typography: Gambetta + General Sans via Fontshare
- [x] Color scheme follows OS + toggle to override to light
- [x] Deploy-on-push: `.githooks/pre-push` builds + publishes to `gh-pages`
- [x] README with full dev + deploy docs

## ⏳ Awaiting your feedback (prototype review)

- [x] Single-page vs. multi-page → **multi-page**
- [x] Accent color → **keep blue for now**
- [x] Tooltips on hover → **keep as-is**
- [ ] Icon choices for each section (revisit later)

## 📝 Content (replace placeholders)

- [ ] About: real bio + correct social links
- [ ] Blog: replace the 3 sample posts in `src/posts/` with real ones
- [ ] Projects: real projects, descriptions, links, tags
- [ ] Books I like: real list
- [ ] Papers I've read: real list (+ links)
- [ ] Contact: confirm/extend the links

## 🚀 Launch

- [x] Git repo initialized; `origin` → github.com:nigelfds/attempted-thought
- [ ] First push to `main` (triggers auto-deploy to `gh-pages`)
- [ ] In GitHub **Settings → Pages**, set source to `gh-pages` branch (root)
- [ ] (Optional) custom domain via `src/assets/CNAME` + DNS
- [ ] Add favicon + social preview image (Open Graph / Twitter cards)
- [ ] Final pass: meta descriptions, accessibility check

## 💡 Possible later

- [ ] Self-host fonts for offline / no third-party requests
- [ ] Watch-and-rebuild during `npm run dev` (e.g. chokidar)
- [ ] RSS feed for the blog
- [ ] Syntax highlighting in post code blocks
