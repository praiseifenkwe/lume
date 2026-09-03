// Liquid Tab - Instant Early Pre-Boot (CSP Compliant)
(function() {
  try {
    const raw = localStorage.getItem("liquidtab_cached_settings") || localStorage.getItem("liquidtab:settings");
    const doc = document.documentElement;

    function applyConfig(target, s) {
      if (!target || !s) return;
      if (s.bg) target.dataset.theme = s.bg;
      const isDark = s.mode === "light" ? false : s.mode === "dark" ? true : window.matchMedia("(prefers-color-scheme: dark)").matches;
      target.dataset.mode = isDark ? "dark" : "light";
      if (s.bgType) target.dataset.bgtype = s.bgType;
      if (s.scale) target.dataset.scale = s.scale;
      if (s.clockFont) target.dataset.clockFont = s.clockFont;
      if (s.clockColor) target.dataset.clockColor = s.clockColor;
      if (s.tint !== undefined) target.style.setProperty("--tint", s.tint / 100);
      if (s.solidColor && s.bgType === "solid") target.style.setProperty("--base", s.solidColor);
      if (s.bgType === "gradient" && s.bg === "custom" && s.customGradient) {
        target.style.setProperty("--c1", s.customGradient.c1);
        target.style.setProperty("--c2", s.customGradient.c2);
        target.style.setProperty("--c3", s.customGradient.c1 + "99");
        target.style.setProperty("--c4", s.customGradient.c2 + "88");
        target.style.setProperty("--base", "#050810");
        target.style.setProperty("--accent", s.customGradient.c1);
      }
    }

    if (raw) {
      const s = JSON.parse(raw);
      applyConfig(doc, s);
      if (document.body) {
        applyConfig(document.body, s);
      } else {
        document.addEventListener("DOMContentLoaded", () => applyConfig(document.body, s), { once: true });
      }
    }

    const cachedBg = localStorage.getItem("liquidtab_cached_bg");
    if (cachedBg && (bgType === "unsplash" || bgType === "photo")) {
      const style = document.createElement("style");
      style.id = "earlyBgStyle";
      style.textContent = `.photo-layer { background-image: url("${cachedBg}"); }`;
      document.head.appendChild(style);
    }
  } catch(e) {}
})();
