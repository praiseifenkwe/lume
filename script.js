/* ============================================================
   Liquid Tab 3.0
   ============================================================ */

const $  = (id) => document.getElementById(id);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// Outside an installed extension (e.g. opening index.html directly) the
// chrome.* APIs are absent — fall back to localStorage so the page still runs.
const HAS_EXT = typeof chrome !== "undefined" && !!chrome.storage;
if (!HAS_EXT) {
  window.chrome = {
    storage: {
      local: {
        get(keys, cb) {
          const out = {};
          keys.forEach((k) => {
            const v = localStorage.getItem("liquidtab:" + k);
            if (v !== null) { try { out[k] = JSON.parse(v); } catch { out[k] = v; } }
          });
          cb(out);
        },
        set(obj) {
          Object.entries(obj).forEach(([k, v]) =>
            localStorage.setItem("liquidtab:" + k, JSON.stringify(v)));
        },
      },
    },
  };
}

// ============================================================
// Defaults
// ============================================================
const DEFAULT_SHORTCUTS = [
  { name: "Google", url: "https://google.com" },
  { name: "YouTube", url: "https://youtube.com" },
  { name: "Gmail", url: "https://mail.google.com" },
  { name: "Google Drive", url: "https://drive.google.com" },
];

const ALL_CATS = Object.keys(QUOTE_CATEGORIES);

const DEFAULTS = {
  userName: "", greetStyle: "timeofday",
  showIsland: true, islandCycle: true,
  showClock: true, showDate: true, use24hr: true, showSeconds: true,
  showSearch: true, engine: "google",
  showQuote: true, quoteSource: "builtin", quoteRotate: "tab", quoteCats: [...ALL_CATS],
  showWeather: true, unit: "celsius", manualLocation: null,
  mode: "dark",
  bg: "green", bgType: "unsplash", solidColor: "#101418", photoId: null,
  unsplashCat: "all",
  bgRotate: "tab", depth: false, parallax: true,
  tint: 20, blur: 10, grain: true,
  scale: "larger", clockFont: "default", clockColor: "dark", clockCustomColor: "#ffffff",
  snap: true, positions: {},
  lowPerf: false,
  customGradient: { c1: "#6effbb", c2: "#0a6f8a" },
  recentSolidColors: ["#1b2a4a", "#144234", "#4a1e42", "#8c3b2b", "#2d3748"],
};

let settings  = { ...DEFAULTS };
let SHORTCUTS = DEFAULT_SHORTCUTS.map((s) => ({ ...s }));
let MY_QUOTES = [];

const THEMES = {
  green: "Verdant", blue: "Deep Sea", purple: "Nebula", sunset: "Ember",
  rose: "Blossom", mono: "Graphite", dark: "Midnight", custom: "Custom",
};

const ENGINES = {
  google:     { name: "Google",     url: "https://www.google.com/search?q=" },
  duckduckgo: { name: "DuckDuckGo", url: "https://duckduckgo.com/?q=" },
  bing:       { name: "Bing",       url: "https://www.bing.com/search?q=" },
  ecosia:     { name: "Ecosia",     url: "https://www.ecosia.org/search?q=" },
};


const GOOGLE_MARK = `<svg viewBox="0 0 24 24">
  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
  <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"/>
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/>
</svg>`;
const GLASS_MARK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>`;

// Synchronously prime settings and shortcuts from localStorage cache to prevent flash
try {
  const cached = localStorage.getItem("liquidtab_cached_settings") || localStorage.getItem("liquidtab:settings");
  if (cached) {
    const s = JSON.parse(cached);
    settings = { ...DEFAULTS, ...s };
  }
  const cachedShortcuts = localStorage.getItem("liquidtab_cached_shortcuts");
  if (cachedShortcuts) {
    const sc = JSON.parse(cachedShortcuts);
    if (Array.isArray(sc) && sc.length) SHORTCUTS = sc;
  }
} catch(e) {}

// ============================================================
// Persistence
// ============================================================
const saveSettings  = () => {
  chrome.storage.local.set({ settings });
  try { localStorage.setItem("liquidtab_cached_settings", JSON.stringify(settings)); } catch(e) {}
};
const saveShortcuts = () => {
  chrome.storage.local.set({ shortcuts: SHORTCUTS });
  try { localStorage.setItem("liquidtab_cached_shortcuts", JSON.stringify(SHORTCUTS)); } catch(e) {}
};
const saveMyQuotes  = () => chrome.storage.local.set({ myQuotes: MY_QUOTES });

function loadState() {
  chrome.storage.local.get(["settings", "shortcuts", "myQuotes"], (result) => {
    if (result.settings) settings = { ...DEFAULTS, ...result.settings };
    if (!settings.layoutPreset) {
      settings.showQuote = true;
      settings.positions = {};
      settings.layoutPreset = "clean-default";
      settings.tint = 20;
      settings.clockColor = "dark";
      saveSettings();
    }
    if (settings.tint === 10) {
      settings.tint = 20;
      saveSettings();
    }
    if (settings.clockColor === "auto") {
      settings.clockColor = "dark";
      saveSettings();
    }
    if (!settings.defaultScaleUpgraded) {
      settings.scale = "larger";
      settings.bgType = "unsplash";
      settings.defaultScaleUpgraded = true;
      saveSettings();
    }
    if (!settings.defaultQuoteRotateUpgraded) {
      settings.quoteRotate = "tab";
      settings.defaultQuoteRotateUpgraded = true;
      saveSettings();
    }
    if (!settings.defaultBgRotateUpgraded) {
      settings.bgRotate = "tab";
      settings.defaultBgRotateUpgraded = true;
      saveSettings();
    }
    if (settings.bgType === "bing") {
      settings.bgType = "unsplash";
      saveSettings();
    }
    if (!settings.customGradient) {
      settings.customGradient = { c1: "#6effbb", c2: "#0a6f8a" };
    }
    if (!Array.isArray(settings.recentSolidColors) || !settings.recentSolidColors.length || settings.recentSolidColors.includes("#0b0d11")) {
      settings.recentSolidColors = ["#1b2a4a", "#144234", "#4a1e42", "#8c3b2b", "#2d3748"];
      saveSettings();
    }
    if (Array.isArray(result.shortcuts)) {
      SHORTCUTS = result.shortcuts.filter(s => !(s.url || "").toLowerCase().includes("github.com"));
      saveShortcuts();
    } else {
      SHORTCUTS = [...DEFAULT_SHORTCUTS];
      saveShortcuts();
    }
    if (Array.isArray(result.myQuotes)) MY_QUOTES = result.myQuotes;
    if (!Array.isArray(settings.quoteCats) || !settings.quoteCats.length) {
      settings.quoteCats = [...ALL_CATS];
    } else {
      settings.quoteCats = settings.quoteCats.filter((c) => ALL_CATS.includes(c));
      if (!settings.quoteCats.length) settings.quoteCats = [...ALL_CATS];
    }

    buildCategoryRows();
    syncControls();
    applySettings();
    renderShortcuts();
    renderShortcutList();
    renderMyQuotes();
    newQuote(false);
    layoutWidgets();
    initWeather();
    refreshPhotoGrid();
    initWallpaper();
    requestAnimationFrame(() => {
      document.body.classList.remove("preload");
    });
  });
}

// ============================================================
// Screen mode
// ============================================================
const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

function resolvedMode() {
  if (settings.mode === "light" || settings.mode === "dark") return settings.mode;
  return darkQuery.matches ? "dark" : "light";
}
darkQuery.addEventListener("change", () => {
  if (settings.mode === "system") applySettings();
});

function updateThemePreview(activeUrl, activeTitle, activeKind) {
  const prevHero = $("themePreview");
  const nameEl = $("themeName");
  const kindEl = $("themeKind");
  if (!prevHero) return;

  if (settings.bgType === "unsplash") {
    if (activeUrl) {
      prevHero.style.backgroundImage = `url("${activeUrl}")`;
      prevHero.style.backgroundSize = "cover";
      prevHero.style.backgroundPosition = "center";
      prevHero.style.backgroundColor = "transparent";
      if (nameEl) nameEl.textContent = activeTitle || "Unsplash HD";
      if (kindEl) kindEl.textContent = activeKind || "Unsplash Photo";
    } else {
      const pool = UNSPLASH_COLLECTIONS[settings.unsplashCat] || UNSPLASH_COLLECTIONS.all;
      if (pool && pool.length) {
        const idx = (rotationIndex(pool.length) + currentUnsplashOffset) % pool.length;
        const item = pool[idx];
        const u = `https://images.unsplash.com/${item.id}?auto=format&fit=crop&w=600&q=80`;
        prevHero.style.backgroundImage = `url("${u}")`;
        prevHero.style.backgroundSize = "cover";
        prevHero.style.backgroundPosition = "center";
        prevHero.style.backgroundColor = "transparent";
        if (nameEl) nameEl.textContent = item.author ? `By ${item.author}` : "Unsplash HD";
        if (kindEl) kindEl.textContent = "Unsplash Photo";
      }
    }
  } else if (settings.bgType === "photo") {
    if (activeUrl) {
      prevHero.style.backgroundImage = `url("${activeUrl}")`;
      prevHero.style.backgroundSize = "cover";
      prevHero.style.backgroundPosition = "center";
      prevHero.style.backgroundColor = "transparent";
      if (nameEl) nameEl.textContent = activeTitle || "Custom Photo";
      if (kindEl) kindEl.textContent = activeKind || "Your Photo";
    } else {
      allPhotos().then((photos) => {
        const rec = photos.find((p) => p.id === settings.photoId) || photos[0];
        if (rec) {
          let src = "";
          if (rec.blob instanceof Blob) {
            try { src = trackWallpaperUrl(URL.createObjectURL(rec.blob)); } catch (e) {}
          } else if (rec.url) {
            src = rec.url;
          }
          if (src) {
            prevHero.style.backgroundImage = `url("${src}")`;
            prevHero.style.backgroundSize = "cover";
            prevHero.style.backgroundPosition = "center";
            prevHero.style.backgroundColor = "transparent";
            if (nameEl) nameEl.textContent = rec.name || "Custom Photo";
            if (kindEl) kindEl.textContent = "Your Photo";
            return;
          }
        }
        prevHero.style.backgroundImage = "none";
        prevHero.style.backgroundColor = "#1a1d24";
        if (nameEl) nameEl.textContent = "No Photo Selected";
        if (kindEl) kindEl.textContent = "Your Photo";
      });
    }
  } else if (settings.bgType === "solid") {
    prevHero.style.backgroundImage = "none";
    prevHero.style.backgroundColor = settings.solidColor;
    if (nameEl) nameEl.textContent = settings.solidColor.toUpperCase();
    if (kindEl) kindEl.textContent = "Solid Colour";
  } else if (settings.bgType === "gradient") {
    prevHero.style.backgroundImage = "none";
    if (settings.bg === "custom") {
      const g = settings.customGradient || { c1: "#6effbb", c2: "#0a6f8a" };
      prevHero.style.background = `linear-gradient(140deg, ${g.c1}, ${g.c2} 55%, #050810)`;
      if (nameEl) nameEl.textContent = "Custom Gradient";
      if (kindEl) kindEl.textContent = "Dynamic Gradient";
    } else {
      const themeGradients = {
        green: "linear-gradient(140deg,#8ef0b8,#178a63 55%,#0b4436)",
        blue: "linear-gradient(140deg,#8ed0f0,#1f6fb0 55%,#0c2c52)",
        purple: "linear-gradient(140deg,#d0a5f5,#7b3fd4 55%,#33125e)",
        sunset: "linear-gradient(140deg,#ffc074,#e2603f 55%,#7d1f45)",
        rose: "linear-gradient(140deg,#ffb3cd,#e0537f 55%,#5e1440)",
        mono: "linear-gradient(140deg,#9aa4ad,#3d464e 55%,#12161a)",
        dark: "linear-gradient(140deg,#2c3550,#141a2b 55%,#05070d)",
      };
      const theme = THEMES[settings.bg] ? settings.bg : "green";
      prevHero.style.background = themeGradients[theme] || themeGradients.green;
      if (nameEl) nameEl.textContent = THEMES[theme] || "Gradient";
      if (kindEl) kindEl.textContent = "Dynamic Gradient";
    }
  }
}

// ============================================================
// Apply settings
// ============================================================
function applySettings() {
  const body = document.body;
  const theme = THEMES[settings.bg] ? settings.bg : "green";

  body.dataset.theme      = theme;
  body.dataset.mode       = resolvedMode();
  body.dataset.bgtype     = settings.bgType;
  body.dataset.scale      = settings.scale;
  body.dataset.clockFont  = ["default", "outfit", "playfair"].includes(settings.clockFont)
                           ? settings.clockFont : "default";
  body.dataset.clockColor = settings.clockColor;
  body.style.setProperty("--clock-custom-color", settings.clockCustomColor);
  body.dataset.grain      = settings.grain ? "on" : "off";
  body.dataset.parallax   = settings.parallax && !settings.lowPerf ? "on" : "off";
  body.dataset.lowperf    = settings.lowPerf ? "on" : "off";
  body.dataset.hideClock  = settings.showClock ? "" : "1";
  body.dataset.hideDate   = settings.showDate ? "" : "1";
  body.dataset.hideSearch = settings.showSearch ? "" : "1";

  body.style.setProperty("--tint", settings.tint / 100);
  applyAutoClockContrast();

  // background
  if (settings.bgType === "solid") {
    body.style.setProperty("--base", settings.solidColor);
    body.style.removeProperty("--c1");
    body.style.removeProperty("--c2");
    body.style.removeProperty("--c3");
    body.style.removeProperty("--c4");
    body.style.removeProperty("--accent");
  } else if (settings.bgType === "gradient" && settings.bg === "custom") {
    const g = settings.customGradient || { c1: "#6effbb", c2: "#0a6f8a" };
    body.style.setProperty("--c1", g.c1);
    body.style.setProperty("--c2", g.c2);
    body.style.setProperty("--c3", g.c1 + "99");
    body.style.setProperty("--c4", g.c2 + "88");
    body.style.setProperty("--base", "#050810");
    body.style.setProperty("--accent", g.c1);
  } else {
    body.style.removeProperty("--c1");
    body.style.removeProperty("--c2");
    body.style.removeProperty("--c3");
    body.style.removeProperty("--c4");
    body.style.removeProperty("--base");
    body.style.removeProperty("--accent");
  }
  applyWallpaper();

  // widget visibility
  const vis = {
    quoteCard: settings.showQuote,
    weatherCard: settings.showWeather,
    island: settings.showIsland,
  };
  Object.entries(vis).forEach(([id, on]) => {
    const el = $(id);
    if (el) el.style.display = on ? "" : "none";
  });

  $("engineIcon").innerHTML = settings.engine === "google" ? GOOGLE_MARK : GLASS_MARK;
  $("searchInput").placeholder = `Search ${ENGINES[settings.engine].name}`;

  updateThemePreview();
  $("optSolidHex").textContent = settings.solidColor.toUpperCase();
  if ($("optSolid")) $("optSolid").value = settings.solidColor;

  $$("#bgSwatches .dot").forEach((d) => d.classList.toggle("active", settings.bgType === "gradient" && d.dataset.bg === theme));
  $$("#solidPresets .dot").forEach((d) => d.classList.toggle("active", settings.bgType === "solid" && (d.dataset.solid || "").toLowerCase() === settings.solidColor.toLowerCase()));
  $$("#clockColors .dot").forEach((d) => d.classList.toggle("active", d.dataset.cc === settings.clockColor));
  $$("#scaleTiles .sw-tile").forEach((t) => t.classList.toggle("active", t.dataset.scale === settings.scale));
  $$("#modeTiles .sw-tile").forEach((t) => t.classList.toggle("active", t.dataset.mode === settings.mode));
  $$("#bgSegment button").forEach((b) => b.classList.toggle("active", b.dataset.bgtype === settings.bgType));
  $$(".bg-tab").forEach((t) => t.classList.toggle("active", t.dataset.bgtype === settings.bgType));

  renderRecentSolidColors();
  updateProfile();
  updateQuoteStats();
  updateClock();
  renderIsland();
}

function syncControls() {
  const set = (id, prop, val) => { const el = $(id); if (el) el[prop] = val; };
  set("clockCustomColor", "value", settings.clockCustomColor);
  set("optName", "value", settings.userName);
  set("optGreetStyle", "value", settings.greetStyle);
  set("optIsland", "checked", settings.showIsland);
  set("optIslandCycle", "checked", settings.islandCycle);
  set("optClock", "checked", settings.showClock);
  set("opt24hr", "checked", settings.use24hr);
  set("optSeconds", "checked", settings.showSeconds);
  set("optDate", "checked", settings.showDate);
  set("optLowPerf", "checked", settings.lowPerf);
  set("optSearch", "checked", settings.showSearch);
  set("optEngine", "value", settings.engine);
  set("optQuote", "checked", settings.showQuote);
  set("optQuote2", "checked", settings.showQuote);
  set("optQuoteRotate", "value", settings.quoteRotate);
  set("optBgRotate", "value", settings.bgRotate || "tab");
  $$("#quoteCats input").forEach((cb) => { cb.checked = settings.quoteCats.includes(cb.dataset.cat); });
  set("optWeather", "checked", settings.showWeather);
  set("optUnit", "value", settings.unit);
  syncManualLocationUI();
  set("optClockFont", "value", ["default", "outfit", "playfair"].includes(settings.clockFont)
                             ? settings.clockFont : "default");
  set("optTint", "value", settings.tint);
  $("optTintValue").textContent = `${settings.tint}%`;
  set("optBlur", "value", settings.blur);
  set("optGrain", "checked", settings.grain);
  set("optSnap", "checked", settings.snap);
  set("optSolid", "value", settings.solidColor);
  set("optUnsplashCat", "value", settings.unsplashCat || "all");
  if (settings.customGradient) {
    set("optGradColor1", "value", settings.customGradient.c1);
    set("optGradColor2", "value", settings.customGradient.c2);
  }
}

function updateProfile() {
  const name = settings.userName.trim();
  const el = $("swProfileName");
  el.textContent = name || "Set your name";
  el.classList.toggle("unset", !name);
  $("swAvatar").textContent = name ? name[0] : "?";
}


// ============================================================
// Clock + greeting
// ============================================================
function greetingFor(hour) {
  switch (settings.greetStyle) {
    case "hello":   return "Hello";
    case "welcome": return "Welcome Back";
    case "hey":     return "Hey";
    default:
      if (hour < 5)  return "Good Night";
      if (hour < 12) return "Good Morning";
      if (hour < 17) return "Good Afternoon";
      if (hour < 21) return "Good Evening";
      return "Good Night";
  }
}

function greetingText() {
  const name = settings.userName.trim();
  const base = greetingFor(new Date().getHours());
  return name ? `${base}, ${name}` : base;
}

function updateClock() {
  const now = new Date();
  let h = now.getHours();

  if (!settings.use24hr) {
    // 12-hour clock: 1 to 12
    h = h % 12 || 12;
  }
  // 24-hour clock: 00 to 23
  $("clockHour").textContent = String(h).padStart(2, "0");
  $("clockMinute").textContent = String(now.getMinutes()).padStart(2, "0");
  $("clockSec").textContent = settings.showSeconds ? String(now.getSeconds()).padStart(2, "0") : "";
  $("date").textContent = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
setInterval(updateClock, 1000);

// ============================================================
// Now Island
// ============================================================
const ISLAND_ICONS = {
  cal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></svg>`,
};

let islandTimer = null;

function islandSlides() {
  return [{ text: greetingText() }];
}

function renderIsland(animate = false) {
  const island = $("island");
  if (!settings.showIsland) return;

  const slides = islandSlides();
  const s = slides[0];

  const paint = () => {
    $("islandText").textContent = s.text;
    // width has to be an explicit px value for the morph to animate
    island.style.width = `${$("islandInner").scrollWidth}px`;
  };

  if (!animate) { paint(); return; }
  island.classList.add("morphing");
  setTimeout(() => { paint(); island.classList.remove("morphing"); }, 200);
}

function restartIslandTimer() {
  clearInterval(islandTimer);
}

// ============================================================
// Weather
// ============================================================
const WX = {
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round">
      <defs>
        <linearGradient id="wxSunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FDE047"/>
          <stop offset="100%" stop-color="#F59E0B"/>
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="4.5" fill="url(#wxSunGrad)" stroke="#F59E0B" stroke-width="0.8"/>
      <g class="wx-spin" stroke="#FBBF24" stroke-width="1.8"><path d="M12 1.8v2.4M12 19.8v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M1.8 12h2.4M19.8 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7"/></g>
    </svg>`,
  partly: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <linearGradient id="wxSunGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FDE047"/>
          <stop offset="100%" stop-color="#F59E0B"/>
        </linearGradient>
        <linearGradient id="wxCloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="100%" stop-color="#BAE6FD"/>
        </linearGradient>
      </defs>
      <circle cx="8.4" cy="8" r="3.2" fill="url(#wxSunGrad2)" stroke="#F59E0B" stroke-width="0.8"/>
      <g class="wx-spin" style="transform-origin:8.4px 8px" stroke="#FBBF24" stroke-width="1.6"><path d="M8.4 2.4v1.4M8.4 12.2v1.4M3.7 3.3l1 1M12.1 11.7l1 1M2 8h1.4M13.4 8h1.4M3.7 12.7l1-1M12.1 4.3l1-1"/></g>
      <path d="M8 19.6h9.2a3.4 3.4 0 0 0 .3-6.8 4.6 4.6 0 0 0-8.9-1.1A3.9 3.9 0 0 0 8 19.6z" fill="url(#wxCloudGrad)" stroke="#7DD3FC" stroke-width="0.9"/>
    </svg>`,
  cloud: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <linearGradient id="wxCloudGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F8FAFC"/>
          <stop offset="100%" stop-color="#94A3B8"/>
        </linearGradient>
      </defs>
      <path d="M6.8 19h10.4a3.8 3.8 0 0 0 .4-7.6 5.2 5.2 0 0 0-10-1.3A4.3 4.3 0 0 0 6.8 19z" fill="url(#wxCloudGrad2)" stroke="#CBD5E1" stroke-width="1"/>
    </svg>`,
  fog: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <linearGradient id="wxCloudGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F8FAFC"/>
          <stop offset="100%" stop-color="#94A3B8"/>
        </linearGradient>
      </defs>
      <path d="M6.8 15.5h10.4a3.8 3.8 0 0 0 .4-7.6 5.2 5.2 0 0 0-10-1.3 4.3 4.3 0 0 0-.8 8.9z" fill="url(#wxCloudGrad3)" stroke="#CBD5E1" stroke-width="1"/>
      <path d="M4 19h16M6.5 22h11" stroke="#38BDF8" stroke-width="1.6" opacity=".8"/>
    </svg>`,
  rain: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <linearGradient id="wxCloudGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F1F5F9"/>
          <stop offset="100%" stop-color="#64748B"/>
        </linearGradient>
      </defs>
      <path d="M6.8 15.2h10.4a3.8 3.8 0 0 0 .4-7.6 5.2 5.2 0 0 0-10-1.3 4.3 4.3 0 0 0-.8 8.9z" fill="url(#wxCloudGrad4)" stroke="#94A3B8" stroke-width="1"/>
      <path class="wx-drop" d="M8.6 18v2.6" stroke="#38BDF8" stroke-width="2"/>
      <path class="wx-drop" d="M12 18.4v3.0" stroke="#0EA5E9" stroke-width="2"/>
      <path class="wx-drop" d="M15.4 18v2.6" stroke="#38BDF8" stroke-width="2"/>
    </svg>`,
  snow: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <linearGradient id="wxCloudGrad5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="100%" stop-color="#E2E8F0"/>
        </linearGradient>
      </defs>
      <path d="M6.8 14.8h10.4a3.8 3.8 0 0 0 .4-7.6 5.2 5.2 0 0 0-10-1.3 4.3 4.3 0 0 0-.8 8.9z" fill="url(#wxCloudGrad5)" stroke="#CBD5E1" stroke-width="1"/>
      <g class="wx-drop" stroke="#BAE6FD" stroke-width="1.8"><path d="M8.6 18.2v2.6M7.5 18.9l2.2 1.2M9.7 18.9l-2.2 1.2"/></g>
      <g class="wx-drop" stroke="#BAE6FD" stroke-width="1.8"><path d="M15.4 18.2v2.6M14.3 18.9l2.2 1.2M16.5 18.9l-2.2 1.2"/></g>
    </svg>`,
  storm: `<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <linearGradient id="wxCloudGrad6" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#475569"/>
          <stop offset="100%" stop-color="#1E293B"/>
        </linearGradient>
      </defs>
      <path d="M6.8 14.6h10.4a3.8 3.8 0 0 0 .4-7.6 5.2 5.2 0 0 0-10-1.3 4.3 4.3 0 0 0-.8 8.9z" fill="url(#wxCloudGrad6)" stroke="#64748B" stroke-width="1"/>
      <path class="wx-bolt" d="M13.2 15.8 10 19.4h3.2l-1.4 3.2" fill="#FACC15" stroke="#FDE047" stroke-width="1.4"/>
    </svg>`,
};

const WX_MAP = {
  0:[WX.sun,"Clear Sky"], 1:[WX.sun,"Mainly Clear"], 2:[WX.partly,"Partly Cloudy"], 3:[WX.cloud,"Overcast"],
  45:[WX.fog,"Foggy"], 48:[WX.fog,"Rime Fog"],
  51:[WX.rain,"Light Drizzle"], 53:[WX.rain,"Drizzle"], 55:[WX.rain,"Heavy Drizzle"],
  61:[WX.rain,"Light Rain"], 63:[WX.rain,"Rain"], 65:[WX.rain,"Heavy Rain"],
  71:[WX.snow,"Light Snow"], 73:[WX.snow,"Snow"], 75:[WX.snow,"Heavy Snow"],
  80:[WX.rain,"Rain Showers"], 81:[WX.rain,"Rain Showers"], 82:[WX.rain,"Heavy Showers"],
  85:[WX.snow,"Snow Showers"], 86:[WX.snow,"Snow Showers"],
  95:[WX.storm,"Thunderstorm"], 96:[WX.storm,"Thunderstorm"], 99:[WX.storm,"Severe Storm"],
};

const weatherState = { temp: null, cond: "", city: "", icon: "" };
let lastCoords = null;

function loadWeather(lat, lon) {
  lastCoords = { lat, lon };
  const unit = settings.unit === "fahrenheit" ? "&temperature_unit=fahrenheit" : "";
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min` +
        `&forecast_days=1&timezone=auto${unit}`)
    .then((r) => r.json())
    .then((data) => {
      $("weatherCard").classList.remove("empty");
      $("weatherCard").dataset.clickable = "";
      const [icon, label] = WX_MAP[data.current.weather_code] || [WX.partly, "Cloudy"];
      weatherState.temp = Math.round(data.current.temperature_2m);
      weatherState.cond = label;
      weatherState.icon = icon;
      // A manual pick names the exact place; otherwise fall back to the IANA
      // zone Open-Meteo resolves (e.g. "Africa/Lagos") so we avoid a second
      // geocoder call just to label the widget.
      weatherState.city = settings.manualLocation
        ? settings.manualLocation.name
        : (data.timezone || "").split("/").pop().replace(/_/g, " ");

      $("weatherTemp").innerHTML = `${weatherState.temp}<span class="deg">&deg;</span>`;
      $("weatherIcon").innerHTML = icon;
      $("weatherCond").textContent = label;
      $("weatherCity").textContent = weatherState.city || "Your Location";
      if (data.daily) {
        $("weatherHilo").textContent =
          `H:${Math.round(data.daily.temperature_2m_max[0])}°  L:${Math.round(data.daily.temperature_2m_min[0])}°`;
      }
      renderIsland();
    })
    .catch(() => { $("weatherCard").dataset.clickable = ""; failWeather("Unavailable", "Check connection"); });
}

function failWeather(cond, city) {
  weatherState.temp = null;
  $("weatherCard").classList.remove("empty");
  $("weatherTemp").innerHTML = "&mdash;";
  $("weatherCond").textContent = cond;
  $("weatherCity").textContent = city;
  $("weatherHilo").textContent = "";
  $("weatherIcon").innerHTML = WX.cloud;
}

/** No coordinates at all yet — offer the one fix that actually works: a manual location. */
function promptForLocation() {
  weatherState.temp = null;
  const card = $("weatherCard");
  card.classList.add("empty");
  card.dataset.clickable = "1";
  $("weatherEmptyIcon").textContent = "🌤";
  $("weatherEmptyCta").textContent = "Set location in Settings";
}

function initWeather() {
  $("weatherIcon").innerHTML = WX.partly;
  if (settings.manualLocation) {
    return loadWeather(settings.manualLocation.lat, settings.manualLocation.lon);
  }

  let resolved = false;
  const tryIpWhoFallback = () => {
    if (resolved) return;
    fetch("https://ipwho.is/")
      .then((r) => r.json())
      .then((data) => {
        if (resolved) return;
        if (data.latitude && data.longitude) {
          resolved = true;
          loadWeather(data.latitude, data.longitude);
        } else {
          promptForLocation();
        }
      })
      .catch(() => {
        if (!resolved) promptForLocation();
      });
  };

  const tryIpFallback = () => {
    if (resolved) return;
    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => {
        if (resolved) return;
        if (data.latitude && data.longitude) {
          resolved = true;
          loadWeather(data.latitude, data.longitude);
        } else {
          tryIpWhoFallback();
        }
      })
      .catch(tryIpWhoFallback);
  };

  if (!navigator.geolocation) {
    tryIpFallback();
    return;
  }

  const timer = setTimeout(tryIpFallback, 2500);

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      clearTimeout(timer);
      if (!resolved) {
        resolved = true;
        loadWeather(pos.coords.latitude, pos.coords.longitude);
      }
    },
    () => {
      clearTimeout(timer);
      tryIpFallback();
    },
    { timeout: 3000 }
  );
}

function syncManualLocationUI() {
  updateLocationUI();
}

// ============================================================
// Photo backgrounds (IndexedDB)
// ============================================================
const DB_NAME = "liquidtab", STORE = "photos";
let dbPromise = null;

function db() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function dbRun(mode, fn) {
  return db().then((d) => new Promise((resolve, reject) => {
    const tx = d.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

const putPhoto  = (rec) => dbRun("readwrite", (s) => s.put(rec));
const getPhoto  = (id)  => dbRun("readonly",  (s) => s.get(id));
const allPhotos = ()    => dbRun("readonly",  (s) => s.getAll());
const delPhoto  = (id)  => dbRun("readwrite", (s) => s.delete(id));

function addPhotoFromUrl(url) {
  if (!url || !url.trim().startsWith("http")) {
    alert("Please enter a valid image URL starting with http:// or https://");
    return;
  }
  const cleanUrl = url.trim();
  const testImg = new Image();
  testImg.onload = () => {
    const rec = { id: "photo_" + Date.now(), url: cleanUrl, name: "Web Photo", created: Date.now() };
    fetch(cleanUrl)
      .then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
      .then((blob) => { rec.blob = blob; return putPhoto(rec); })
      .catch(() => putPhoto(rec))
      .then(() => {
        settings.photoId = rec.id;
        settings.bgType = "photo";
        applySettings();
        saveSettings();
        applyWallpaper();
        refreshPhotoGrid();
        const input = $("photoUrlInput");
        if (input) input.value = "";
        const form = $("photoUrlForm");
        if (form) form.style.display = "none";
      });
  };
  testImg.onerror = () => {
    alert("Could not load image from this URL. Please verify the URL points directly to an image file (.jpg, .png, etc.).");
  };
  testImg.src = cleanUrl;
}

let gridObjectUrls = [];
function clearGridUrls() {
  gridObjectUrls.forEach((u) => {
    try { URL.revokeObjectURL(u); } catch (e) {}
  });
  gridObjectUrls = [];
}

function refreshPhotoGrid() {
  clearGridUrls();
  allPhotos().then((photos) => {
    const grid = $("photoGrid");
    if (!grid) return;
    grid.innerHTML = "";
    const ap = $("aboutPhotos");
    if (ap) ap.textContent = String(photos.length);

    photos.forEach((rec) => {
      const b = document.createElement("button");
      b.className = "photo-thumb";
      b.classList.toggle("active", settings.photoId === rec.id);
      b.title = rec.name || (rec.fg ? "Has a depth foreground" : "");

      let photoSrc = "";
      if (rec.blob instanceof Blob) {
        try {
          photoSrc = URL.createObjectURL(rec.blob);
          gridObjectUrls.push(photoSrc);
        } catch (e) {}
      } else if (rec.url) {
        photoSrc = rec.url;
      }

      if (photoSrc) {
        const img = document.createElement("img");
        img.className = "photo-thumb-img";
        img.src = photoSrc;
        img.alt = rec.name || "Photo";
        img.onerror = () => {
          img.style.display = "none";
          fallback.style.display = "flex";
        };
        b.appendChild(img);
      }

      const fallback = document.createElement("div");
      fallback.className = "photo-thumb-fallback";
      fallback.style.display = photoSrc ? "none" : "flex";
      fallback.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>Invalid</span>`;
      b.appendChild(fallback);

      b.onclick = () => {
        settings.photoId = rec.id;
        settings.bgType = "photo";
        applySettings();
        saveSettings();
        applyWallpaper();
        refreshPhotoGrid();
      };

      if (rec.fg) {
        const dot = document.createElement("span");
        dot.className = "photo-depth-dot";
        dot.title = "Depth foreground attached";
        b.appendChild(dot);
      }

      const del = document.createElement("span");
      del.className = "photo-del";
      del.title = "Remove photo";
      del.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
      del.onclick = (e) => {
        e.stopPropagation();
        delPhoto(rec.id).then(() => {
          if (settings.photoId === rec.id) {
            settings.photoId = null;
            settings.bgType = "unsplash";
            applySettings();
            saveSettings();
            applyWallpaper();
          }
          refreshPhotoGrid();
        });
      };
      b.appendChild(del);
      grid.appendChild(b);
    });
  });
}

$("addPhotoBtn").addEventListener("click", () => $("photoInput").click());
$("photoInput").addEventListener("change", (e) => {
  const files = [...e.target.files];
  if (!files.length) return;
  Promise.all(files.map((file) =>
    putPhoto({
      id: `p${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
      blob: file,
      name: file.name ? file.name.replace(/\.[^/.]+$/, "") : "Uploaded Photo",
      created: Date.now()
    })
  )).then(() => {
    e.target.value = "";
    allPhotos().then((photos) => {
      if (photos.length) {
        settings.photoId = photos[photos.length - 1].id;
        settings.bgType = "photo";
        applySettings();
        saveSettings();
        applyWallpaper();
      }
      refreshPhotoGrid();
    });
  }).catch(() => {});
});

// ============================================================
// Search
// ============================================================
const searchInput = $("searchInput");
const searchForm = $("searchForm");

function updateSearchState() {
  if (!searchInput || !searchForm) return;
  searchForm.classList.toggle("has-value", !!searchInput.value.trim());
}

if (searchInput) {
  searchInput.addEventListener("input", updateSearchState);
  searchInput.addEventListener("focus", updateSearchState);
  searchInput.addEventListener("blur", updateSearchState);
}

if (searchForm) {
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = searchInput.value.trim();
    if (q) window.location.href = ENGINES[settings.engine].url + encodeURIComponent(q);
  });
}

// ============================================================
// Widget dragging + grid snapping
// ============================================================
const GRID = 20;
const WIDGETS = ["weather"];
const WIDGET_EL = {
  weather: "weatherCard",
};

function availableViewportWidth() {
  const sidebarOpen = document.body.classList.contains("settings-open");
  const sw = $("settingsWindow");
  const sidebarW = sidebarOpen && sw ? sw.offsetWidth : 0;
  return window.innerWidth - sidebarW;
}

function defaultPosition(id, el) {
  const w = el.offsetWidth || 168;
  const vw = availableViewportWidth();
  switch (id) {
    case "weather":  return { x: vw - w - 28, y: 28 };
    default:         return { x: 28, y: 28 };
  }
}

function clampToViewport(x, y, el) {
  const w = el.offsetWidth, h = el.offsetHeight;
  const vw = availableViewportWidth();
  return {
    x: Math.max(8, Math.min(x, vw - w - 8)),
    y: Math.max(8, Math.min(y, window.innerHeight - h - 8)),
  };
}

function placeWidget(id, pos) {
  const el = $(WIDGET_EL[id]);
  if (!el) return;
  el.style.setProperty("--wx", `${pos.x}px`);
  el.style.setProperty("--wy", `${pos.y}px`);
}

function layoutWidgets() {
  WIDGETS.forEach((id) => {
    const el = $(WIDGET_EL[id]);
    if (!el) return;
    const stored = settings.positions[id];
    const pos = clampToViewport(...Object.values(stored || defaultPosition(id, el)), el);
    placeWidget(id, pos);
  });
}

function initDrag(id) {
  const el = $(WIDGET_EL[id]);
  if (!el) return;

  el.addEventListener("pointerdown", (e) => {
    // never start a drag from something the user meant to click or type in
    if (e.button !== 0) return;
    if (e.target.closest("input, textarea, button, a, select")) return;

    const rect = el.getBoundingClientRect();
    const offX = e.clientX - rect.left;
    const offY = e.clientY - rect.top;
    let moved = false;

    el.setPointerCapture(e.pointerId);

    const move = (ev) => {
      if (!moved) {
        moved = true;
        el.classList.add("dragging");
        if (settings.snap) $("snapGrid").classList.add("on");
      }
      let x = ev.clientX - offX;
      let y = ev.clientY - offY;
      if (settings.snap) {
        x = Math.round(x / GRID) * GRID;
        y = Math.round(y / GRID) * GRID;
      }
      const p = clampToViewport(x, y, el);
      placeWidget(id, p);
    };

    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      $("snapGrid").classList.remove("on");
      if (!moved) return;

      el.classList.remove("dragging");
      el.classList.add("settling");
      setTimeout(() => el.classList.remove("settling"), 340);

      const x = parseFloat(el.style.getPropertyValue("--wx")) || 0;
      const y = parseFloat(el.style.getPropertyValue("--wy")) || 0;
      settings.positions[id] = { x, y };
      saveSettings();
    };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  });
}

WIDGETS.forEach(initDrag);

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(layoutWidgets, 120);
});

// ============================================================
// Dock
// ============================================================
const BUILTIN_LOCAL_ICONS = {
  "google.com": "icons/google.png",
  "youtube.com": "icons/youtube.png",
  "mail.google.com": "icons/gmail.png",
  "drive.google.com": "icons/drive.png",
};

function getBuiltinIcon(url) {
  try {
    const u = url.toLowerCase();
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host === "drive.google.com" || u.includes("drive.google.com")) return BUILTIN_LOCAL_ICONS["drive.google.com"];
    if (host === "mail.google.com" || u.includes("mail.google.com") || u.includes("gmail.com")) return BUILTIN_LOCAL_ICONS["mail.google.com"];
    if (host === "youtube.com" || u.includes("youtube.com") || u.includes("youtu.be")) return BUILTIN_LOCAL_ICONS["youtube.com"];
    if (host === "google.com" || host.endsWith(".google.com")) return BUILTIN_LOCAL_ICONS["google.com"];
  } catch {}
  return null;
}

const FALLBACK_COLORS = ["#4285F4","#EA4335","#FBBC05","#34A853","#8E44AD","#16A085","#E67E22"];
const faviconFor = (url, size = 128) =>
  `https://www.google.com/s2/favicons?sz=${size}&domain_url=${encodeURIComponent(url)}`;

function renderShortcuts() {
  const dock = $("dock");
  dock.querySelectorAll("a:not(#settingsBtn):not(#geminiBtn)").forEach((el) => el.remove());
  const divider = dock.querySelector(".dock-divider");

  SHORTCUTS.forEach((s, i) => {
    const a = document.createElement("a");
    a.href = s.url;
    a.dataset.label = s.name || s.url;

    const localIcon = getBuiltinIcon(s.url);
    const img = document.createElement("img");
    img.src = localIcon || faviconFor(s.url);
    img.alt = s.name || "";
    img.onerror = () => {
      const fb = document.createElement("span");
      fb.className = "fallback";
      fb.textContent = ((s.name || "?").trim()[0] || "?").toUpperCase();
      fb.style.background = FALLBACK_COLORS[i % FALLBACK_COLORS.length];
      img.replaceWith(fb);
    };
    a.appendChild(img);

    dock.insertBefore(a, divider);
  });
}

const TAG_SVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/></svg>`;
const LINK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/></svg>`;
const X_SVG    = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`;

function renderShortcutList() {
  const list = $("shortcutList");
  list.innerHTML = "";

  if (!SHORTCUTS.length) {
    list.innerHTML = `<div class="sw-empty">No shortcuts yet. Add one below.</div>`;
    return;
  }

  SHORTCUTS.forEach((s, i) => {
    const row = document.createElement("div");
    row.className = "sc-row";

    const img = document.createElement("img");
    const localIcon = getBuiltinIcon(s.url);
    img.src = localIcon || faviconFor(s.url, 32);
    img.alt = "";
    img.onerror = () => {
      const fb = document.createElement("span");
      fb.className = "sc-fallback";
      fb.textContent = ((s.name || "?").trim()[0] || "?").toUpperCase();
      fb.style.background = FALLBACK_COLORS[i % FALLBACK_COLORS.length];
      img.replaceWith(fb);
    };

    const mkField = (icon, value, placeholder, onInput, onBlur) => {
      const wrap = document.createElement("label");
      wrap.className = "sc-field";
      wrap.innerHTML = icon;
      const input = document.createElement("input");
      input.type = "text";
      input.value = value;
      input.placeholder = placeholder;
      input.addEventListener("input", () => onInput(input));
      if (onBlur) input.addEventListener("blur", () => onBlur(input));
      wrap.appendChild(input);
      return wrap;
    };

    const nameField = mkField(TAG_SVG, s.name, "Name", (input) => {
      SHORTCUTS[i].name = input.value;
      saveShortcuts();
      renderShortcuts();
    });

    const urlField = mkField(LINK_SVG, s.url, "https://…", (input) => {
      SHORTCUTS[i].url = input.value;
      saveShortcuts();
      renderShortcuts();
    }, (input) => {
      const v = input.value.trim();
      if (v && !/^https?:\/\//i.test(v)) {
        SHORTCUTS[i].url = input.value = `https://${v}`;
        saveShortcuts();
        renderShortcuts();
        renderShortcutList();
      }
    });

    const del = document.createElement("button");
    del.className = "sc-del";
    del.innerHTML = X_SVG;
    del.title = `Remove ${s.name}`;
    del.onclick = () => {
      SHORTCUTS.splice(i, 1);
      saveShortcuts();
      renderShortcuts();
      renderShortcutList();
    };

    row.append(img, nameField, urlField, del);
    list.appendChild(row);
  });
}

$("addShortcutBtn").addEventListener("click", () => {
  SHORTCUTS.push({ name: "New Shortcut", url: "https://" });
  saveShortcuts();
  renderShortcuts();
  renderShortcutList();
  const first = document.querySelector("#shortcutList .sc-row:last-child input");
  if (first) { first.focus(); first.select(); }
});

// ============================================================
// Settings window
// ============================================================
const overlay = $("settingsOverlay");
const openSettings  = () => {
  overlay.classList.add("open");
  document.body.classList.add("settings-open");
  updateThemePreview();
  setTimeout(layoutWidgets, 10);
};
const closeSettings = () => {
  overlay.classList.remove("open");
  document.body.classList.remove("settings-open");
  setTimeout(layoutWidgets, 10);
};

$("settingsBtn").addEventListener("click", (e) => { e.preventDefault(); openSettings(); });
$("tlClose")?.addEventListener("click", closeSettings);
$("tlMin")?.addEventListener("click", () => $("settingsWindow").classList.toggle("no-sidebar"));
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeSettings(); });
window.addEventListener("keydown", (e) => { if (e.key === "Escape" && overlay.classList.contains("open")) closeSettings(); });

function showPane(name) {
  $$(".sw-pane").forEach((p) => p.classList.toggle("active", p.dataset.pane === name));
  $$(".sw-nav-item").forEach((n) => n.classList.toggle("active", n.dataset.pane === name));
  $("swContent").scrollTop = 0;
}

$$(".sw-nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    $("settingsSearch").value = "";
    showPane(item.dataset.pane);
  });
});

$("swProfile").addEventListener("click", () => {
  $("settingsSearch").value = "";
  showPane("general");
  const el = $("optName");
  el.focus();
  el.select();
});

function selectTab(tab) {
  $$("#wdSegment button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  $$('.sw-pane[data-pane="widgets"] .sw-tab').forEach((t) =>
    t.classList.toggle("active", t.dataset.tab === tab));
}
$$("#wdSegment button").forEach((btn) => btn.addEventListener("click", () => selectTab(btn.dataset.tab)));

function addRecentSolidColor(color) {
  if (!color) return;
  const c = color.toLowerCase();
  const recents = (settings.recentSolidColors || []).filter((x) => x.toLowerCase() !== c);
  recents.unshift(c);
  settings.recentSolidColors = recents.slice(0, 7);
  saveSettings();
  renderRecentSolidColors();
}

function renderRecentSolidColors() {
  const container = $("solidRecents");
  const row = $("solidRecentRow");
  if (!container || !row) return;
  const list = settings.recentSolidColors || [];
  if (!list.length) {
    row.style.display = "none";
    return;
  }
  row.style.display = "";
  container.innerHTML = "";
  list.forEach((col) => {
    const btn = document.createElement("button");
    btn.className = "dot";
    btn.style.background = col;
    btn.title = col;
    if (settings.bgType === "solid" && settings.solidColor.toLowerCase() === col.toLowerCase()) {
      btn.classList.add("active");
    }
    btn.onclick = () => {
      settings.solidColor = col;
      settings.bgType = "solid";
      addRecentSolidColor(col);
      applySettings();
      saveSettings();
      applyWallpaper();
    };
    container.appendChild(btn);
  });
}

$$("#bgSegment button").forEach((btn) => {
  btn.addEventListener("click", () => {
    settings.bgType = btn.dataset.bgtype;
    applySettings();
    saveSettings();
    applyWallpaper();
  });
});

$$("#solidPresets .dot").forEach((dot) => {
  dot.addEventListener("click", () => {
    const col = dot.dataset.solid;
    settings.solidColor = col;
    settings.bgType = "solid";
    addRecentSolidColor(col);
    applySettings();
    saveSettings();
    applyWallpaper();
  });
});

$("optSolid")?.addEventListener("input", (e) => {
  settings.solidColor = e.target.value;
  settings.bgType = "solid";
  applySettings();
  saveSettings();
  applyWallpaper();
});

$("optSolid")?.addEventListener("change", (e) => {
  addRecentSolidColor(e.target.value);
});

$("applyCustomGrad")?.addEventListener("click", () => {
  const c1 = $("optGradColor1") ? $("optGradColor1").value : "#6effbb";
  const c2 = $("optGradColor2") ? $("optGradColor2").value : "#0a6f8a";
  settings.customGradient = { c1, c2 };
  settings.bg = "custom";
  settings.bgType = "gradient";
  applySettings();
  saveSettings();
  applyWallpaper();
});

$("optGradColor1")?.addEventListener("change", () => {
  if (settings.bg === "custom" && settings.bgType === "gradient") {
    $("applyCustomGrad")?.click();
  }
});
$("optGradColor2")?.addEventListener("change", () => {
  if (settings.bg === "custom" && settings.bgType === "gradient") {
    $("applyCustomGrad")?.click();
  }
});

$("addPhotoUrlBtn")?.addEventListener("click", () => {
  const form = $("photoUrlForm");
  if (form) {
    const isHidden = form.style.display === "none" || !form.style.display;
    form.style.display = isHidden ? "flex" : "none";
    if (isHidden) $("photoUrlInput")?.focus();
  }
});

$("photoUrlCancel")?.addEventListener("click", () => {
  const form = $("photoUrlForm");
  if (form) form.style.display = "none";
});

$("photoUrlSave")?.addEventListener("click", () => {
  const url = $("photoUrlInput")?.value;
  if (url) addPhotoFromUrl(url);
});

$("photoUrlInput")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    $("photoUrlSave")?.click();
  }
});

// ---- binding helpers ----
function bindToggle(ids, key, after) {
  [].concat(ids).forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("change", () => {
      settings[key] = el.checked;
      syncControls();
      applySettings();
      saveSettings();
      if (after) after();
    });
  });
}
function bindValue(id, key, transform = (v) => v, after) {
  const el = $(id);
  if (!el) return;
  el.addEventListener("input", () => {
    const val = transform(el.value);
    settings[key] = val;
    applySettings();
    saveSettings();
    if (after) after(val);
  });
}

bindToggle("optIsland", "showIsland", restartIslandTimer);
bindToggle("optClock", "showClock");
bindToggle("opt24hr", "use24hr");
bindToggle("optSeconds", "showSeconds");
bindToggle("optDate", "showDate");
bindToggle("optLowPerf", "lowPerf");
bindToggle("optSearch", "showSearch");
bindToggle(["optQuote", "optQuote2"], "showQuote", layoutWidgets);
bindToggle("optWeather", "showWeather", layoutWidgets);
bindToggle("optGrain", "grain");
bindToggle("optSnap", "snap");

bindValue("optName", "userName", (v) => v, renderIsland);
bindValue("optGreetStyle", "greetStyle", (v) => v, renderIsland);
bindValue("optEngine", "engine");
bindValue("optClockFont", "clockFont");
bindValue("optTint", "tint", Number, (value) => { $("optTintValue").textContent = `${value}%`; });
bindValue("optBlur", "blur", Number);
bindValue("optSolid", "solidColor");

$("optUnit").addEventListener("input", () => {
  settings.unit = $("optUnit").value;
  saveSettings();
  if (lastCoords) loadWeather(lastCoords.lat, lastCoords.lon);
});

$$("#bgSwatches .dot").forEach((dot) => {
  dot.addEventListener("click", () => {
    settings.bg = dot.dataset.bg;
    settings.bgType = "gradient";
    applySettings();
    saveSettings();
    applyWallpaper();
  });
});
$$("#clockColors .dot").forEach((dot) => {
  dot.addEventListener("click", () => { settings.clockColor = dot.dataset.cc; applySettings(); saveSettings(); });
});
$("clockCustomColor").addEventListener("input", () => {
  settings.clockColor = "custom";
  settings.clockCustomColor = $("clockCustomColor").value;
  applySettings();
  saveSettings();
});
$$("#scaleTiles .sw-tile").forEach((tile) => {
  tile.addEventListener("click", () => {
    settings.scale = tile.dataset.scale;
    applySettings();
    saveSettings();
    setTimeout(layoutWidgets, 60);
  });
});
$$("#modeTiles .sw-tile").forEach((tile) => {
  tile.addEventListener("click", () => { settings.mode = tile.dataset.mode; applySettings(); saveSettings(); });
});

// ---- resets ----
$("resetPositions").addEventListener("click", () => {
  settings.positions = {};
  saveSettings();
  layoutWidgets();
});

$("resetWidgets").addEventListener("click", () => {
  ["showIsland","islandCycle","showClock","showDate","use24hr","showSeconds","showSearch",
   "engine","showQuote","showWeather","unit"]
    .forEach((k) => { settings[k] = DEFAULTS[k]; });
  settings.positions = {};
  syncControls();
  applySettings();
  saveSettings();
  layoutWidgets();
  restartIslandTimer();
});

$("resetDock").addEventListener("click", () => {
  SHORTCUTS = DEFAULT_SHORTCUTS.map((s) => ({ ...s }));
  saveShortcuts();
  renderShortcuts();
  renderShortcutList();
});

$("resetAll").addEventListener("click", () => {
  settings = { ...DEFAULTS, positions: {}, quoteCats: [...ALL_CATS] };
  SHORTCUTS = DEFAULT_SHORTCUTS.map((s) => ({ ...s }));
  saveSettings();
  saveShortcuts();
  syncControls();
  applySettings();
  renderShortcuts();
  renderShortcutList();
  layoutWidgets();
  restartIslandTimer();
});

// ---- export / import ----
$("exportBtn").addEventListener("click", () => {
  const payload = { app: "liquid-tab", version: 4, settings, shortcuts: SHORTCUTS, myQuotes: MY_QUOTES };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "liquid-tab-settings.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});

$("importBtn").addEventListener("click", () => $("importInput").click());
$("importInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  file.text().then((txt) => {
    const data = JSON.parse(txt);
    if (data.app !== "liquid-tab") throw new Error("not a Liquid Tab export");
    settings = { ...DEFAULTS, ...(data.settings || {}) };
    if (Array.isArray(data.shortcuts)) SHORTCUTS = data.shortcuts;
    if (Array.isArray(data.myQuotes)) MY_QUOTES = data.myQuotes;
    if (!Array.isArray(settings.quoteCats) || !settings.quoteCats.length) {
      settings.quoteCats = [...ALL_CATS];
    }
    saveSettings();
    saveShortcuts();
    saveMyQuotes();
    syncControls();
    applySettings();
    renderShortcuts();
    renderShortcutList();
    renderMyQuotes();
    newQuote(true);
    layoutWidgets();
    restartIslandTimer();
  }).catch(() => {
    alert("That file isn't a valid Liquid Tab export.");
  }).finally(() => { e.target.value = ""; });
});

// ============================================================
// Settings search
// ============================================================
const PANE_TITLES = {
  general: "General", widgets: "Widgets & Dock", quotes: "Quotes",
  display: "Display", appearance: "Appearance",
};

let searchIndex = [];

function buildSearchIndex() {
  const index = [];
  $$(".sw-pane").forEach((pane) => {
    const key = pane.dataset.pane;
    if (!PANE_TITLES[key]) return;
    $$(".sw-row", pane).forEach((row) => {
      const labelEl = row.querySelector(".sw-row-label");
      if (!labelEl) return;
      const lbl = labelEl.querySelector(".lbl");
      const label = ((lbl || labelEl.childNodes[0]).textContent || "").trim();
      if (label) index.push({ label, pane: key, row });
    });
  });
  return index;
}

function jumpTo(hit) {
  $("settingsSearch").value = "";
  showPane(hit.pane);
  const tab = hit.row.closest(".sw-tab");
  if (tab) selectTab(tab.dataset.tab);
  const bgTab = hit.row.closest(".bg-tab");
  if (bgTab) {
    settings.bgType = bgTab.dataset.bgtype;
    applySettings();
    saveSettings();
  }
  hit.row.scrollIntoView({ behavior: "smooth", block: "center" });
  hit.row.classList.remove("flash");
  void hit.row.offsetWidth; // restart the highlight animation
  hit.row.classList.add("flash");
}

function runSearch(raw) {
  const q = raw.trim().toLowerCase();
  if (!q) { showPane("general"); return; }

  if (!searchIndex.length) searchIndex = buildSearchIndex();
  const seen = new Set();
  const hits = searchIndex.filter((e) => {
    if (!e.label.toLowerCase().includes(q)) return false;
    const key = e.pane + "|" + e.label;
    if (seen.has(key)) return false;   // some options appear on two panes
    seen.add(key);
    return true;
  });

  const list = $("resultsList");
  list.innerHTML = "";
  $("resultsTitle").textContent = hits.length
    ? `${hits.length} result${hits.length === 1 ? "" : "s"}` : "No results";

  hits.forEach((hit) => {
    const btn = document.createElement("button");
    btn.className = "res-hit";
    const at = hit.label.toLowerCase().indexOf(q);
    const label = document.createElement("span");
    const mark = document.createElement("mark");
    mark.textContent = hit.label.slice(at, at + q.length);
    label.append(hit.label.slice(0, at), mark, hit.label.slice(at + q.length));
    const where = document.createElement("span");
    where.className = "res-where";
    where.textContent = PANE_TITLES[hit.pane];
    btn.append(label, where);
    btn.onclick = () => jumpTo(hit);
    list.appendChild(btn);
  });

  $$(".sw-pane").forEach((p) => p.classList.toggle("active", p.dataset.pane === "results"));
  $$(".sw-nav-item").forEach((n) => n.classList.remove("active"));
}

$("settingsSearch").addEventListener("input", (e) => runSearch(e.target.value));

// ============================================================
// Sheen + parallax
// ============================================================
$$(".glass").forEach((el) => {
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});

const orbs = $$(".orb");
document.addEventListener("pointermove", (e) => {
  if (settings.lowPerf || settings.bgType !== "gradient") return;
  const dx = (e.clientX / window.innerWidth - 0.5) * 2;
  const dy = (e.clientY / window.innerHeight - 0.5) * 2;
  orbs.forEach((orb, i) => {
    const depth = (i + 1) * 9;
    orb.style.translate = `${dx * depth}px ${dy * depth}px`;
  });
});

// ============================================================
// Keyboard shortcuts
// ============================================================
document.addEventListener("keydown", (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);

  if (e.key === "Escape") {
    if (overlay.classList.contains("open")) closeSettings();
    else document.activeElement.blur();
    return;
  }
  if (typing || e.metaKey || e.ctrlKey || e.altKey) {
    if (e.key === "," && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      overlay.classList.contains("open") ? closeSettings() : openSettings();
    }
    return;
  }
  if (e.key === "/") { e.preventDefault(); $("searchInput").focus(); }
});


// ============================================================
// Quotes
// ============================================================

/** Stable 32-bit hash so "today's quote" is identical all day, in every tab. */
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** A seed that only changes as often as the chosen rotation. */
function rotationSeed(mode) {
  const d = new Date();
  const day = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  if (mode === "day")  return day;
  if (mode === "hour") return `${day}-${d.getHours()}`;
  return String(Math.random());   // every new tab
}

function quotePool() {
  const mine = MY_QUOTES
    .filter((q) => q.text && q.text.trim())
    .map((q) => [q.text.trim(), (q.author || "").trim(), "mine"]);

  if (settings.quoteSource === "mine") return mine;

  const builtin = QUOTES.filter((q) => settings.quoteCats.includes(q[2]));
  return settings.quoteSource === "both" ? builtin.concat(mine) : builtin;
}

let quoteOffset = 0;   // bumped by the shuffle button

function newQuote(animate = true) {
  const pool = quotePool();
  const card = $("quoteCard");
  if (!card) return;

  const paint = () => {
    if (!pool.length) {
      $("quoteText").textContent = settings.quoteSource === "mine"
        ? "No quotes of your own yet — add some in Settings."
        : "No categories selected.";
      $("quoteAuthor").textContent = "";
      $("quoteCat").textContent = "";
      return;
    }
    const idx = (hashString(rotationSeed(settings.quoteRotate)) + quoteOffset) % pool.length;
    const [text, author, cat] = pool[idx];
    $("quoteText").textContent = text;
    $("quoteAuthor").textContent = author || "Unknown";
    $("quoteCat").textContent = cat === "mine" ? "Mine" : (QUOTE_CATEGORIES[cat] || "");
  };

  if (!animate) { paint(); return; }
  card.classList.add("swapping");
  setTimeout(() => { paint(); card.classList.remove("swapping"); }, 240);
}

function shuffleQuote() {
  quoteOffset++;
  newQuote(true);
}

function updateQuoteStats() {
  const n = quotePool().length;
  const pool = $("quotePoolSize");
  if (pool) pool.textContent = `${n} quote${n === 1 ? "" : "s"}`;
  const about = $("aboutQuotes");
  if (about) about.textContent = `${QUOTES.length} built-in · ${MY_QUOTES.length} mine`;
}

function buildCategoryRows() {
  const wrap = $("quoteCats");
  if (!wrap || wrap.children.length) return;

  Object.entries(QUOTE_CATEGORIES).forEach(([key, label]) => {
    const count = QUOTES.filter((q) => q[2] === key).length;
    const row = document.createElement("label");
    row.className = "sw-row cat-row";

    const name = document.createElement("span");
    name.className = "sw-row-label";
    name.textContent = label;

    const right = document.createElement("span");
    right.style.display = "flex";
    right.style.alignItems = "center";

    const cnt = document.createElement("span");
    cnt.className = "cat-count";
    cnt.textContent = count;

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "sw-toggle";
    cb.dataset.cat = key;
    cb.addEventListener("change", () => {
      const on = $$("#quoteCats input").filter((i) => i.checked).map((i) => i.dataset.cat);
      if (!on.length) { cb.checked = true; return; }   // never leave the pool empty
      settings.quoteCats = on;
      saveSettings();
      updateQuoteStats();
      newQuote(true);
    });

    right.append(cnt, cb);
    row.append(name, right);
    wrap.appendChild(row);
  });
}

function renderMyQuotes() {
  const list = $("myQuoteList");
  if (!list) return;
  list.innerHTML = "";

  if (!MY_QUOTES.length) {
    list.innerHTML = `<div class="sw-empty quiet">Nothing here yet. Add a quote you want to see.</div>`;
    updateQuoteStats();
    return;
  }

  MY_QUOTES.forEach((q, i) => {
    const row = document.createElement("div");
    row.className = "mq-row";

    const fields = document.createElement("div");
    fields.className = "mq-fields";

    const text = document.createElement("textarea");
    text.value = q.text || "";
    text.placeholder = "The quote itself…";
    text.rows = 2;
    text.addEventListener("input", () => {
      MY_QUOTES[i].text = text.value;
      saveMyQuotes();
      updateQuoteStats();
    });

    const author = document.createElement("input");
    author.type = "text";
    author.value = q.author || "";
    author.placeholder = "Author (optional)";
    author.addEventListener("input", () => {
      MY_QUOTES[i].author = author.value;
      saveMyQuotes();
    });

    fields.append(text, author);

    const del = document.createElement("button");
    del.className = "sc-del";
    del.innerHTML = X_SVG;
    del.title = "Remove quote";
    del.onclick = () => {
      MY_QUOTES.splice(i, 1);
      saveMyQuotes();
      renderMyQuotes();
      newQuote(true);
    };

    row.append(fields, del);
    list.appendChild(row);
  });

  updateQuoteStats();
}

$("quoteShuffle").addEventListener("click", (e) => { e.stopPropagation(); shuffleQuote(); });

$("addQuoteBtn").addEventListener("click", () => {
  MY_QUOTES.push({ text: "", author: "" });
  saveMyQuotes();
  renderMyQuotes();
  const ta = document.querySelector("#myQuoteList .mq-row:last-child textarea");
  if (ta) ta.focus();
});

$$("#quoteSourceSeg button").forEach((btn) => {
  btn.addEventListener("click", () => {
    settings.quoteSource = btn.dataset.src;
    $$("#quoteSourceSeg button").forEach((b) => b.classList.toggle("active", b === btn));
    saveSettings();
    updateQuoteStats();
    newQuote(true);
  });
});

bindValue("optQuoteRotate", "quoteRotate", (v) => v, () => newQuote(true));

// ============================================================
// Wallpaper — Unsplash, Live Video, Photo library, Bing daily, rotation, depth
// ============================================================
let wallpaperObjectUrls = [];
const trackWallpaperUrl = (u) => { wallpaperObjectUrls.push(u); return u; };
function revokeWallpaperUrls() {
  wallpaperObjectUrls.forEach((u) => {
    try { URL.revokeObjectURL(u); } catch (e) {}
  });
  wallpaperObjectUrls = [];
}

const trackUrl = trackWallpaperUrl;
function revokeUrls() { revokeWallpaperUrls(); }

const UNSPLASH_COLLECTIONS = window.UNSPLASH_WALLPAPERS || {
  nature: [],
  minimal: [],
  architecture: [],
  space: [],
  cyberpunk: [],
  all: [],
};

let bingImages = [];
let currentUnsplashOffset = 0;
let bgRotateTimer = null;

function setupBgRotateTimer() {
  if (bgRotateTimer) {
    clearInterval(bgRotateTimer);
    bgRotateTimer = null;
  }
  let ms = 0;
  if (settings.bgRotate === "5min") ms = 5 * 60 * 1000;
  else if (settings.bgRotate === "15min") ms = 15 * 60 * 1000;
  else if (settings.bgRotate === "hour") ms = 60 * 60 * 1000;

  if (ms > 0) {
    bgRotateTimer = setInterval(() => {
      if (settings.bgType === "unsplash") {
        applyUnsplashWallpaper(true);
      } else {
        applyWallpaper();
      }
    }, ms);
  }
}

/** An index that only changes as often as the rotation setting. */
function rotationIndex(count) {
  if (count <= 0) return 0;
  if (settings.bgRotate === "never") return 0;
  if (settings.bgRotate === "tab" || settings.bgRotate === "5min" || settings.bgRotate === "15min") {
    return Math.floor(Math.random() * count);
  }
  return hashString(rotationSeed(settings.bgRotate)) % count;
}

function setCredit(text, url) {
  const el = $("bgCredit");
  if (!el) return;
  el.textContent = text || "";
  if (url) el.href = url; else el.removeAttribute("href");
}

function applyUnsplashWallpaper(bump = false) {
  const layer = $("photoLayer");
  const layerNext = $("photoLayerNext");
  if (!layer) return;
  const pool = UNSPLASH_COLLECTIONS[settings.unsplashCat] || UNSPLASH_COLLECTIONS.all;
  if (!pool || !pool.length) return;

  if (bump) {
    currentUnsplashOffset = (currentUnsplashOffset + 1) % pool.length;
  }
  const idx = (rotationIndex(pool.length) + currentUnsplashOffset) % pool.length;
  const item = pool[idx];
  const url = `https://images.unsplash.com/${item.id}?auto=format&fit=crop&w=2560&q=85`;

  const currentBg = layer.style.backgroundImage || "";
  const isAlreadySet = currentBg.includes(item.id);

  if (isAlreadySet) {
    setCredit(`Photo by ${item.author} (Unsplash)`, item.link || "https://unsplash.com");
    applyAutoClockContrast(url);
    updateThemePreview(url, item.author ? `By ${item.author}` : "Unsplash HD", "Unsplash Photo");
    revealApp();
    return;
  }

  // If a background is already visible, preload the new image and crossfade seamlessly
  if (layerNext && (currentBg || localStorage.getItem("liquidtab_cached_bg"))) {
    const preloader = new Image();
    preloader.onload = () => {
      layerNext.style.backgroundImage = `url("${url}")`;
      layerNext.style.opacity = "1";
      try { localStorage.setItem("liquidtab_cached_bg", url); } catch (e) {}
      setCredit(`Photo by ${item.author} (Unsplash)`, item.link || "https://unsplash.com");
      applyAutoClockContrast(url);
      updateThemePreview(url, item.author ? `By ${item.author}` : "Unsplash HD", "Unsplash Photo");
      revealApp();

      setTimeout(() => {
        layer.style.backgroundImage = `url("${url}")`;
        layerNext.style.opacity = "0";
      }, 520);
    };
    preloader.onerror = () => revealApp();
    preloader.src = url;
  } else {
    layer.style.backgroundImage = `url("${url}")`;
    try { localStorage.setItem("liquidtab_cached_bg", url); } catch (e) {}
    setCredit(`Photo by ${item.author} (Unsplash)`, item.link || "https://unsplash.com");
    applyAutoClockContrast(url);
    updateThemePreview(url, item.author ? `By ${item.author}` : "Unsplash HD", "Unsplash Photo");
    revealApp();
  }
}

function applyWallpaper() {
  const layer = $("photoLayer");
  if (!layer) return;

  setupBgRotateTimer();

  if (settings.bgType === "unsplash") {
    applyUnsplashWallpaper(false);
    return;
  }

  if (settings.bgType !== "photo") {
    layer.style.backgroundImage = "";
    setCredit("");
    revealApp();
    return;
  }

  setCredit("");
  allPhotos().then((photos) => {
    if (!photos.length) {
      layer.style.backgroundImage = "";
      revealApp();
      return;
    }
    const rec = settings.bgRotate === "never"
      ? (photos.find((p) => p.id === settings.photoId) || photos[0])
      : photos[rotationIndex(photos.length)];

    revokeWallpaperUrls();
    let photoSrc = "";
    if (rec.blob instanceof Blob) {
      try {
        photoSrc = trackWallpaperUrl(URL.createObjectURL(rec.blob));
      } catch (e) {}
    } else if (rec.url) {
      photoSrc = rec.url;
    }
    if (photoSrc) {
      layer.style.backgroundImage = `url("${photoSrc}")`;
      applyAutoClockContrast(photoSrc);
      updateThemePreview(photoSrc, rec.name || "Custom Photo", "Your Photo");
    }
    revealApp();
  }).catch(() => revealApp());
}

let appRevealed = false;
function revealApp() {
  if (appRevealed) return;
  appRevealed = true;
  requestAnimationFrame(() => {
    const curtain = $("appCurtain");
    if (curtain) {
      curtain.classList.add("loaded");
      setTimeout(() => { curtain.style.display = "none"; }, 320);
    }
  });
}

function initWallpaper() {
  applyWallpaper();
  const cached = localStorage.getItem("liquidtab_cached_bg");
  if (settings.bgType === "solid" || settings.bgType === "gradient" || cached) {
    requestAnimationFrame(() => {
      setTimeout(revealApp, 40);
    });
  }
  // Safety timeout: reveal in max 350ms under all conditions
  setTimeout(revealApp, 350);
}

bindValue("optBgRotate", "bgRotate", (v) => v, applyWallpaper);
bindValue("optUnsplashCat", "unsplashCat", (v) => v, () => applyWallpaper());

const unsplashNextBtn = $("unsplashNext");
if (unsplashNextBtn) {
  unsplashNextBtn.addEventListener("click", () => {
    applyUnsplashWallpaper(true);
  });
}


// ============================================================
// Auto clock contrast
// ============================================================
// "Auto" clock colour is supposed to pick whichever of light/dark text stays
// readable against whatever is actually behind it — a solid colour, an
// uploaded photo, today's Bing wallpaper, or a theme gradient. It reads the
// real pixels where it can and falls back to the light/dark screen mode
// where it can't (a hot-linked Bing image with no CORS header taints the
// canvas, so sampling throws and we fall back there).

function relLuminance(r, g, b) {
  const chan = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

function hexLuminance(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
  return relLuminance(r, g, b);
}

const THEME_LUMINANCE = {
  sunset: 0.65, // warm bright sunset sky -> dark text
  green: 0.25,  // dark green -> light text
  blue: 0.22,   // deep blue -> light text
  purple: 0.18, // deep purple -> light text
  rose: 0.32,   // dark rose -> light text
  mono: 0.15,   // dark mono -> light text
  dark: 0.08,   // pure dark -> light text
};

function sampleImageLuminance(url) {
  return new Promise((resolve, reject) => {
    const analyze = (blobOrUrl, shouldRevoke = false) => {
      let sampleUrl = blobOrUrl;
      if (typeof sampleUrl === "string" && sampleUrl.includes("images.unsplash.com")) {
        sampleUrl = sampleUrl.split("?")[0] + "?w=140&q=50&auto=format&fit=crop";
      }
      const img = new Image();
      if (!sampleUrl.startsWith("blob:")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => {
        try {
          const w = 64, h = 64;
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          // Sample the main central quadrant where clock, date, search, and quote sit
          const sx = Math.floor(w * 0.15), sy = Math.floor(h * 0.10);
          const sw = Math.floor(w * 0.70), sh = Math.floor(h * 0.60);
          const { data } = ctx.getImageData(sx, sy, sw, sh);
          let sum = 0, count = 0;
          for (let i = 0; i < data.length; i += 4) {
            sum += relLuminance(data[i], data[i + 1], data[i + 2]);
            count++;
          }
          if (shouldRevoke) URL.revokeObjectURL(blobOrUrl);
          resolve(count > 0 ? sum / count : 0.2);
        } catch (err) {
          if (shouldRevoke) URL.revokeObjectURL(blobOrUrl);
          reject(err);
        }
      };
      img.onerror = (e) => {
        if (shouldRevoke) URL.revokeObjectURL(blobOrUrl);
        reject(e);
      };
      img.src = sampleUrl;
    };

    if (url.startsWith("blob:")) {
      analyze(url, false);
      return;
    }

    // Fetch as blob to prevent cross-origin canvas security errors (e.g. Bing wallpapers)
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.blob();
      })
      .then((blob) => {
        analyze(URL.createObjectURL(blob), true);
      })
      .catch(() => {
        // Fallback to direct URL
        analyze(url, false);
      });
  });
}

function currentWallpaperUrl() {
  const bg = getComputedStyle($("photoLayer")).backgroundImage;
  const m = /url\(["']?(.+?)["']?\)/.exec(bg);
  return m ? m[1] : null;
}

function applyAutoClockContrast(directUrl = null) {
  // "light"/"dark" pin one of auto's own two outcomes instead of detecting it —
  // same rendering either way, just fixed instead of chosen dynamically.
  if (settings.clockColor === "light") { document.body.dataset.autoDark = ""; return; }
  if (settings.clockColor === "dark")  { document.body.dataset.autoDark = "1"; return; }
  if (settings.clockColor !== "auto") {
    delete document.body.dataset.autoDark;
    return;
  }
  const finish = (isLight) => {
    document.body.dataset.autoDark = isLight ? "1" : "";
  };

  if (settings.bgType === "solid") {
    finish(hexLuminance(settings.solidColor) > 0.30);
    return;
  }

  if (settings.bgType === "photo" || settings.bgType === "bing" || settings.bgType === "unsplash") {
    const url = directUrl || currentWallpaperUrl();
    if (url) {
      sampleImageLuminance(url)
        .then((lum) => finish(lum > 0.30))
        .catch(() => finish(resolvedMode() === "light"));
      return;
    }
  }

  // Gradient themes
  if (resolvedMode() === "light") {
    finish(true);
  } else {
    const theme = settings.bg || "green";
    const lum = THEME_LUMINANCE[theme] !== undefined ? THEME_LUMINANCE[theme] : 0.2;
    finish(lum > 0.30);
  }
}

// ============================================================
// Weather: manual location
// ============================================================
// Browser geolocation permission, once denied, usually can't be re-prompted —
// leaving the widget permanently blank with no way out. A manual city search
// (same Open-Meteo family, no new provider or key) is the actual fix, and is
// what the "Set location in Settings" prompt below points people to.

function geocodeCity(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
  return fetch(url).then((r) => r.json()).then((data) => data.results || []);
}

function renderLocationResults(results) {
  const box = $("locResults");
  box.innerHTML = "";
  if (!results.length) {
    box.innerHTML = `<div class="loc-empty">No matches.</div>`;
    return;
  }
  results.forEach((r) => {
    const btn = document.createElement("button");
    btn.className = "loc-result";
    const bits = [r.admin1, r.country].filter(Boolean).join(", ");
    btn.innerHTML = `<span>${r.name}</span><span class="loc-sub">${bits}</span>`;
    btn.onclick = () => selectManualLocation({ name: r.name, lat: r.latitude, lon: r.longitude });
    box.appendChild(btn);
  });
}

let locSearchTimer;
$("locInput").addEventListener("input", () => {
  clearTimeout(locSearchTimer);
  const q = $("locInput").value.trim();
  if (q.length < 2) { $("locResults").innerHTML = ""; return; }
  locSearchTimer = setTimeout(() => {
    geocodeCity(q).then(renderLocationResults).catch(() => {
      $("locResults").innerHTML = `<div class="loc-empty">Couldn't search right now.</div>`;
    });
  }, 350);
});

function selectManualLocation(loc) {
  settings.manualLocation = loc;
  saveSettings();
  updateLocationUI();
  $("locSearch").hidden = true;
  $("locInput").value = "";
  $("locResults").innerHTML = "";
  loadWeather(loc.lat, loc.lon);
}

function updateLocationUI() {
  $("locStatus").textContent = settings.manualLocation
    ? settings.manualLocation.name
    : "Automatic (device location)";
  $("locUseAuto").hidden = !settings.manualLocation;
}

$("locChangeBtn").addEventListener("click", () => {
  $("locSearch").hidden = !$("locSearch").hidden;
  if (!$("locSearch").hidden) $("locInput").focus();
});

$("locUseAuto").addEventListener("click", () => {
  settings.manualLocation = null;
  saveSettings();
  updateLocationUI();
  initWeather();
});

/** Reached from the "Set location in Settings" prompt on the weather widget. */
function openWeatherLocationSettings() {
  openSettings();
  showPane("widgets");
  selectTab("w");
  setTimeout(() => {
    $("locChangeBtn").closest(".sw-row").scrollIntoView({ behavior: "smooth", block: "center" });
    if ($("locSearch").hidden) $("locChangeBtn").click();
  }, 320);
}

$("weatherEmptyCta").addEventListener("click", (e) => {
  e.stopPropagation();
  if ($("weatherCard").dataset.clickable) openWeatherLocationSettings();
});

// ============================================================
// Instant Synchronous Boot (Zero Flash, Zero Lag)
// ============================================================
applySettings();
updateClock();
renderShortcuts();
layoutWidgets();
newQuote(false);
initWallpaper();

// Asynchronous background sync
loadState();
restartIslandTimer();
