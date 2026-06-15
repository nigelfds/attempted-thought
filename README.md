# attempted thought

Nigel's personal website — a minimalist, single-page site.

- **Design:** minimalist, content-first, with an icon-rail navigation that sits
  vertically on the left at desktop widths and folds into a horizontal pill at
  the top on small screens (inspired by [sarthakmishra.com](https://sarthakmishra.com/)).
- **Typography:** [Gambetta](https://www.fontshare.com/fonts/gambetta) (serif
  headings) paired with [General Sans](https://www.fontshare.com/fonts/general-sans)
  (sans body), loaded from the Fontshare CDN (inspired by
  [balajmarius.com](https://balajmarius.com/)).
- **Sections:** About · Blog · Projects · Books I like · Papers I've read · Contact.
  No forms anywhere — contact is plain links.
- **Hosting:** static files served by **GitHub Pages** from the `gh-pages` branch.
- **Local dev:** an **Express** server (Node 20+) previews the static site.

## Project layout

```
.
├── public/            # the entire static site — this is what ships to GitHub Pages
│   ├── index.html     # all sections live here (single page + anchor navigation)
│   ├── styles.css     # design system: palette, type, icon-rail responsive rules
│   └── main.js        # scroll-spy that highlights the active nav icon
├── server.js          # Express dev/preview server (NOT used in production)
├── package.json
├── .nvmrc             # pins Node 20 for `nvm use`
└── README.md
```

> **Why Express *and* GitHub Pages?** GitHub Pages can only serve static files —
> it cannot run a Node server. So Express is used **only** for previewing
> `public/` locally; the exact same `public/` folder is what gets published to
> the `gh-pages` branch. Nothing server-side runs in production.

## Getting started

Requires **Node 20 or newer**. With [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install      # reads .nvmrc → installs Node 20 if needed
nvm use          # switches the current shell to Node 20
npm install
npm start        # → http://localhost:3000
```

Use `npm run dev` for an auto-restarting server while editing.

## Editing content

Everything is in `public/index.html`. Each section is a `<section>` with an `id`
that matches a nav icon's `href`:

| Section          | `id`        |
| ---------------- | ----------- |
| About            | `#about`    |
| Blog             | `#blog`     |
| Projects         | `#projects` |
| Books I like     | `#books`    |
| Papers I've read | `#papers`   |
| Contact          | `#contact`  |

Replace the placeholder copy and the `#` links with real content. Update the
social/contact links in the **About** and **Contact** sections (the email is
already set to `nigel@nigel.in`).

To restyle, edit the CSS custom properties at the top of `public/styles.css`
(`--bg`, `--ink`, `--accent`, fonts, `--measure`, etc.). A dark-mode palette is
already wired up via `prefers-color-scheme`.

## Deploying to GitHub Pages

1. Create a repo on GitHub and push this project to its default branch.
2. Publish the static site to the `gh-pages` branch:

   ```bash
   npm run deploy        # runs: gh-pages -d public -b gh-pages
   ```

3. In the repo's **Settings → Pages**, set the source to the **`gh-pages`**
   branch, root (`/`). Your site goes live at
   `https://<username>.github.io/<repo>/` within a minute or two.

### Custom domain (optional)

If you point a domain (e.g. `nigel.in`) at GitHub Pages, add a `public/CNAME`
file containing just the domain:

```
nigel.in
```

Because it lives in `public/`, `npm run deploy` will publish it automatically,
and GitHub Pages will pick it up. Then configure the domain's DNS per
[GitHub's custom-domain docs](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site).

> Note: project-page URLs (`/<repo>/`) serve from a subpath. Because this site
> uses **relative** asset paths (`./styles.css`) and **same-page anchors**
> (`#about`), it works correctly both at a subpath and at a custom-domain root.

## Tech notes

- No build step and no framework — just HTML, CSS, and a small JS file.
- Fonts load over the network from Fontshare. To work fully offline or to avoid
  the third-party request, download the woff2 files into `public/fonts/` and
  swap the `<link>` for local `@font-face` rules.
- Accessibility: nav icons have `aria-label`s, active state is reflected in the
  UI, and `prefers-reduced-motion` disables smooth scrolling and transitions.
