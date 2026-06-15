# attempted thought

Nigel's personal website — a minimalist, multi-page static site.

- **Design:** minimalist, content-first, with an icon-rail navigation that sits
  vertically on the left at desktop widths and folds into a horizontal pill at
  the top on small screens (inspired by [sarthakmishra.com](https://sarthakmishra.com/)).
- **Typography:** [Gambetta](https://www.fontshare.com/fonts/gambetta) (serif
  headings) paired with [General Sans](https://www.fontshare.com/fonts/general-sans)
  (sans body), loaded from the Fontshare CDN (inspired by
  [balajmarius.com](https://balajmarius.com/)).
- **Pages:** Home (About + 3 latest posts) · Blog · Projects · Books I like ·
  Papers I've read · Contact. Each blog post gets its own route. No forms —
  contact is plain links.
- **Color:** warm off-white, blue accent. Follows the OS light/dark setting with
  a toggle (top-right) to override to light.
- **Hosting:** static files on **GitHub Pages** (`gh-pages` branch).
- **Local dev:** an **Express** server (Node 20+) previews the built site.

## How it works

You edit source in `src/`. A tiny no-framework build step (`build.js`) generates
the static site into `public/`, which is what GitHub Pages serves.

```
.
├── src/
│   ├── layout.html        # shared shell (nav, theme toggle, fonts) — edit once
│   ├── pages/             # one file per route
│   │   ├── index.html     #   /            About + {{recent_posts}}
│   │   ├── blog.html      #   /blog/       {{all_posts}}
│   │   ├── projects.html  #   /projects/
│   │   ├── books.html     #   /books/
│   │   ├── papers.html    #   /papers/
│   │   └── contact.html   #   /contact/
│   ├── posts/             # Markdown blog posts → /blog/<filename>/
│   │   └── *.md
│   └── assets/            # styles.css, main.js (copied verbatim to public/)
├── build.js               # src/ → public/  (npm run build)
├── server.js              # Express preview server (NOT used in production)
├── .githooks/pre-push     # builds + deploys to gh-pages on `git push`
├── public/                # BUILD OUTPUT (git-ignored) → published to gh-pages
├── package.json
├── .nvmrc                 # pins Node 20 for `nvm use`
└── README.md
```

> **Why Express *and* GitHub Pages?** GitHub Pages can only serve static files —
> it cannot run a Node server. Express is used **only** to preview `public/`
> locally; the same `public/` folder is what gets published to the `gh-pages`
> branch. Nothing server-side runs in production.

## Getting started

Requires **Node 20 or newer**. With [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install      # reads .nvmrc → installs Node 20 if needed
nvm use          # switch the current shell to Node 20
npm install
npm start        # builds, then serves → http://localhost:3000
```

`npm start` rebuilds and serves. After editing files in `src/`, re-run it (or
`npm run build`) to regenerate `public/`.

| Command         | What it does                                          |
| --------------- | ----------------------------------------------------- |
| `npm run build` | Generate `public/` from `src/`                        |
| `npm start`     | Build, then serve `public/` at `localhost:3000`       |
| `npm run dev`   | Build, then serve with `node --watch` on the server   |
| `npm run deploy`| Build, then publish `public/` to `gh-pages` manually  |

## Editing content

- **A page's text:** edit the matching file in `src/pages/`. Each starts with a
  small frontmatter block (`title`, `description`) followed by HTML.
- **A new blog post:** add a Markdown file to `src/posts/`, e.g.
  `my-post.md`. The filename becomes the URL slug (`/blog/my-post/`). Start it
  with frontmatter:

  ```markdown
  ---
  title: My post title
  date: 2026-06-15
  summary: One line shown in the blog list and on the home page.
  ---

  Body in **Markdown**…
  ```

  Posts are sorted newest-first; the 3 most recent appear on the home page and
  all of them on `/blog/`.
- **Shared chrome** (nav, fonts, footer, theme toggle): edit `src/layout.html`
  once — it applies to every page.
- **Styling:** edit the CSS custom properties at the top of `src/assets/styles.css`
  (`--bg`, `--ink`, `--accent`, fonts, `--measure`, …). A dark-mode palette is
  wired up via `prefers-color-scheme`.

## Deploying to GitHub Pages

Deployment is automatic via a **`pre-push` git hook** (in `.githooks/`, enabled
through `git config core.hooksPath .githooks`). When you push `main`, the hook:

1. builds `src/` → `public/`, then
2. publishes `public/` to the **`gh-pages`** branch on the remote you pushed to
   (a subtree-style split + force-push, run by the `gh-pages` tool so `main`
   stays free of build artifacts).

```bash
git add -A
git commit -m "…"
git push            # ← builds + deploys to gh-pages automatically
```

The hook only runs when pushing `main`/`master`; pushes of other branches skip
deployment. You can also deploy manually any time with `npm run deploy`.

One-time GitHub setup: in the repo's **Settings → Pages**, set the source to the
**`gh-pages`** branch, root (`/`). The site goes live at
`https://<username>.github.io/<repo>/` (or your custom domain) shortly after.

### Custom domain (optional)

Add `src/assets/CNAME` containing just your domain:

```
nigel.in
```

It gets copied into `public/` on every build and published automatically. Then
point DNS per
[GitHub's custom-domain docs](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site).

> **Paths:** the site uses **root-absolute** URLs (`/styles.css`, `/projects/`),
> which is correct for a custom domain (e.g. `nigel.in`) or a user/org Pages
> site (`<username>.github.io`). If you ever host under a **project** subpath
> (`<username>.github.io/<repo>/`), those paths would need a base-path tweak.

## Tech notes

- Build dependency: [`marked`](https://github.com/markedjs/marked) for Markdown.
  No front-end framework — just HTML, CSS, and a small `main.js`.
- Fonts load from the Fontshare CDN. To work offline or avoid the third-party
  request, drop the woff2 files into `src/assets/fonts/` and swap the `<link>`
  in `src/layout.html` for local `@font-face` rules.
- Accessibility: nav icons have `aria-label`s, the active page is reflected in
  the rail, and `prefers-reduced-motion` disables smooth scroll and transitions.
