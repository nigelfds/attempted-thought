// Highlight the rail icon for the current page (path-based, multi-page site).
const links = Array.from(document.querySelectorAll(".rail a"));
const here = location.pathname.replace(/index\.html$/, "") || "/";

for (const a of links) {
  const href = new URL(a.href).pathname;
  const active = href === "/" ? here === "/" : here.startsWith(href);
  a.classList.toggle("is-active", active);
}

// Theme toggle: "auto" follows the OS; "light" forces the light palette.
const toggle = document.querySelector(".theme-toggle");
if (toggle) {
  const root = document.documentElement;

  function applyTheme(theme) {
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
      toggle.title = "Theme: light (click to follow system)";
    } else {
      root.removeAttribute("data-theme");
      toggle.title = "Theme: following system (click for light)";
    }
  }

  applyTheme(localStorage.getItem("theme"));

  toggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "auto" : "light";
    localStorage.setItem("theme", next);
    applyTheme(next);
  });
}

// Current year in the footer.
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());
