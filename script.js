/* ============================================================
   Lume 4.1
   ============================================================ */

const $  = (id) => document.getElementById(id);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const cleanEarlyBgStyle = () => {
  const el = document.getElementById("earlyBgStyle");
  if (el) el.remove();
};
cleanEarlyBgStyle();

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

const ALL_CATS = ["Alex Hormozi", "Leila Hormozi"];

const DEFAULTS = {
  userName: "", greetStyle: "timeofday", customGreet: "Rise & Shine",
  showIsland: true, islandCycle: true,
  showClock: true, showDate: true, use24hr: true, showSeconds: true,
  showSearch: true, engine: "google",
  showQuote: true, quoteRotate: "tab", quoteCats: [...ALL_CATS], excludedQuotes: [],
  showWeather: true, unit: "celsius", manualLocation: null,
  mode: "dark",
  bg: "green", bgType: "unsplash", solidColor: "#101418", photoId: null,
  unsplashCat: "all",
  bgRotate: { unsplash: "tab", photo: "never", gradient: "never", solid: "never" }, depth: false, parallax: true,
  tint: 20, blur: 10, grain: true,
  scale: "larger", clockFont: "default", clockColor: "auto", clockCustomColor: "#ffffff",
  recentClockColors: [],
  snap: true, positions: {},
  dockSource: "custom",
  dockLimit: 5,
  showAi: true,
  aiProvider: "gemini",
  aiCustomUrl: "",
  lowPerf: false,
  customGradient: { c1: "#6effbb", c2: "#0a6f8a" },
  recentSolidColors: ["#1b2a4a", "#144234", "#4a1e42", "#8c3b2b", "#2d3748"],
};

let settings  = { ...DEFAULTS };
let SHORTCUTS = DEFAULT_SHORTCUTS.map((s) => ({ ...s }));
let MY_QUOTES = [];

function normalizeAuthorName(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return "Unknown Author";
  if (/^alex\s*hormozi$/i.test(trimmed) || trimmed.toLowerCase() === "alex") return "Alex Hormozi";
  if (/^leila\s*hormozi$/i.test(trimmed) || trimmed.toLowerCase() === "leila") return "Leila Hormozi";
  return trimmed;
}

function normalizeQuoteText(text) {
  return (text || "").trim().toLowerCase().replace(/^["“](.*)["”]$/, "$1").trim();
}

function getAllAuthors() {
  const authorCounts = new Map();
  const excludedSet = new Set(
    (settings.excludedQuotes || []).map(normalizeQuoteText)
  );

  if (typeof QUOTES !== "undefined" && Array.isArray(QUOTES)) {
    QUOTES.forEach((q) => {
      const textNorm = normalizeQuoteText(q[0]);
      if (excludedSet.has(textNorm)) return;
      const author = normalizeAuthorName(q[1]);
      authorCounts.set(author, (authorCounts.get(author) || 0) + 1);
    });
  }

  if (Array.isArray(MY_QUOTES)) {
    MY_QUOTES.forEach((q) => {
      const text = (q.text || "").trim();
      if (!text) return;
      const author = normalizeAuthorName(q.author);
      authorCounts.set(author, (authorCounts.get(author) || 0) + 1);
    });
  }

  // Only include built-in priority authors if they have at least 1 active quote
  const result = [];
  const priority = ["Alex Hormozi", "Leila Hormozi"];
  priority.forEach((p) => {
    const c = authorCounts.get(p) || 0;
    if (c > 0) {
      result.push({ name: p, count: c });
    }
    authorCounts.delete(p);
  });

  const others = [...authorCounts.entries()]
    .filter(([, count]) => count > 0)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return result.concat(others);
}

function updateAuthorDatalist() {
  const dl = $("quoteAuthorList");
  if (!dl) return;
  dl.innerHTML = "";
  const authors = getAllAuthors();
  authors.forEach(({ name }) => {
    if (name !== "Unknown Author") {
      const opt = document.createElement("option");
      opt.value = name;
      dl.appendChild(opt);
    }
  });
}

const SOLID_PRESET_COLORS = [
  // Darks
  "#0d1117", "#111827", "#1a1a2e", "#0f0f23", "#13111c",
  // Blues
  "#0a1628", "#0d2137", "#1b2a4a", "#0c2340", "#071e3d",
  // Greens
  "#0a1f16", "#0d2818", "#144234", "#0f2d20", "#102b1a",
  // Purples / Magentas
  "#1e0a2e", "#2a0a3e", "#4a1e42", "#1f0d38", "#3a1048",
  // Earthy / Warm
  "#1e1008", "#2b1510", "#3d1a0e", "#8c3b2b", "#4a2010",
  // Neutral slates
  "#1c1c24", "#2d3748", "#252836", "#1e2130", "#202633",
];
const GRADIENT_THEMES = ["green", "blue", "purple", "sunset", "rose", "mono", "dark"];

function getBgRotate(type = settings.bgType) {
  if (typeof settings.bgRotate === "object" && settings.bgRotate !== null) {
    return settings.bgRotate[type] || (type === "unsplash" ? "tab" : "never");
  }
  const val = typeof settings.bgRotate === "string" ? settings.bgRotate : "tab";
  return type === "unsplash" ? val : "never";
}

function setBgRotate(mode, type = settings.bgType) {
  if (typeof settings.bgRotate !== "object" || settings.bgRotate === null) {
    const oldVal = typeof settings.bgRotate === "string" ? settings.bgRotate : "tab";
    settings.bgRotate = { unsplash: oldVal, photo: "never", gradient: "never", solid: "never" };
  }
  settings.bgRotate[type] = mode;
  saveSettings();
}

const THEMES = {
  green: "Verdant", blue: "Deep Sea", purple: "Nebula", sunset: "Ember",
  rose: "Blossom", mono: "Graphite", dark: "Midnight", custom: "Custom",
};

const ENGINES = {
  google:     { name: "Google",     url: "https://www.google.com/search?q=" },
  bing:       { name: "Bing",       url: "https://www.bing.com/search?q=" },
  duckduckgo: { name: "DuckDuckGo", url: "https://duckduckgo.com/?q=" },
  yahoo:      { name: "Yahoo",      url: "https://search.yahoo.com/search?p=" },
  ecosia:     { name: "Ecosia",     url: "https://www.ecosia.org/search?q=" },
  brave:      { name: "Brave",      url: "https://search.brave.com/search?q=" },
};

const GOOGLE_MARK = `<svg viewBox="0 0 24 24">
  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
  <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"/>
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/>
</svg>`;

const BING_MARK = `<svg viewBox="120 50 280 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bingA" x2="0" y2="1"><stop offset="0" stop-color="#3bc0f6"/><stop offset=".5" stop-color="#3693fa"/><stop offset="1" stop-color="#1b42d8"/></linearGradient>
    <linearGradient id="bingB"><stop offset="0" stop-color="#5fe9ff"/><stop offset=".5" stop-color="#4bb1f1"/><stop offset="1" stop-color="#1440df"/></linearGradient>
    <radialGradient id="bingC" cx="1" cy=".7" r="1"><stop offset="0" stop-color="#6adfd4"/><stop offset=".5" stop-color="#15d2e5"/><stop offset="1" stop-color="#36befe"/></radialGradient>
  </defs>
  <path d="m143 343c0 72 84 124 147 84l62-39c51-32 23-79-6-88l-115 69" fill="url(#bingB)"/>
  <path d="m167 71c-11-8-24 0-24 11v261c0 38 39 56 67 39l21-13V134q-1-21-22-35" fill="url(#bingA)"/>
  <path d="m279 186c-13-7-26 7-19 20l26 67q5 9 15 13c43 16 58 15 71 35s6 43-5 55c42-44 37-127-30-160" fill="url(#bingC)"/>
</svg>`;

const DUCK_MARK = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="ddgBg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e55225"/><stop offset="1" stop-color="#d14427"/></linearGradient>
    <linearGradient id="ddgBrow" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#6176b9"/><stop offset="1" stop-color="#394a9f"/></linearGradient>
    <clipPath id="ddgClip"><circle cx="256" cy="256" r="224"/></clipPath>
  </defs>
  <circle cx="256" cy="256" r="240" fill="url(#ddgBg)"/>
  <g clip-path="url(#ddgClip)">
    <path d="M355.3 575.7c-7.7-35.6-52.6-116-69.6-150.1-17-34-34-82-26.3-112.9 1.4-5.6 1.5-28.6 6.1-31.7 36.1-23.6 33.5-.8 48-11.3 7.5-5.4 13.4-12 16-21.1 9.3-32.5-12.9-89.1-37.6-113.8-8.1-8.1-20.5-13.1-34.4-15.8-5.4-7.4-14-14.4-26.3-20.9-23.1-12.3-51.8-17.2-78.4-12.4 4.2.4 14 9.2 17.9 9.8-5.9 4-21.7 3.5-21.6 12.4 21.1-2.1 44.2 1.2 63.7 9.9-15.5 1.8-29.8 5.6-40 10.9-29.4 15.5-37.1 46.4-29.4 89.7 7.8 43.3 41.8 201.1 52.6 253.7s-23.2 86.6-44.8 95.9l23.2 1.5-7.7 17c27.8 3.1 58.8-6.2 58.8-6.2-6.2 17-48 23.2-48 23.2s20.1 6.2 52.6-6.2 52.6-20.1 52.6-20.1l15.5 40.2 29.4-29.4 12.4 30.9c-.1.1 23.1-7.6 15.3-43.2" fill="#FFFFFF"/>
    <circle cx="193.6" cy="220.5" r="16.2" fill="#2d4f8e"/>
    <circle cx="200.9" cy="215.1" r="4.2" fill="#FFFFFF"/>
    <circle cx="302.3" cy="210.9" r="14" fill="#2d4f8e"/>
    <circle cx="308.5" cy="206.2" r="3.6" fill="#FFFFFF"/>
    <path d="M198.3 173.4s-12.2-5.5-24.2 1.9c-11.9 7.5-11.4 15.1-11.4 15.1s-6.3-14.1 10.5-21c16.9-6.8 25.1 4 25.1 4" fill="url(#ddgBrow)"/>
    <path d="M310.7 172.3s-8.8-5-15.6-4.9c-14 .2-17.9 6.4-17.9 6.4s2.4-14.8 20.3-11.8c9.8 1.5 13.2 10.3 13.2 10.3" fill="url(#ddgBrow)"/>
  </g>
  <path d="M243.4 283.2c1.6-9.8 27-28.4 45-29.6 18-1.1 23.6-.9 38.7-4.5s53.8-13.3 64.5-18.2c10.7-5 56.2 2.5 24.2 20.3-13.9 7.8-51.3 22-78 30s-42.9-7.6-51.7 5.5c-7.1 10.4-1.4 24.7 30.5 27.7 43.1 4 84.4-19.4 88.9-7 4.6 12.4-37 27.9-62.3 28.4s-76.3-16.7-83.9-22c-7.8-5.3-18-17.7-15.9-30.6" fill="#fdd20a"/>
  <path d="M262.9 417.5s-60.5-32.3-61.5-19.2 0 66.5 7.1 70.6c7.1 4 57.5-26.2 57.5-26.2zm23.2-2.1s41.3-31.3 50.4-29.2 11.1 66.6 3 69.6-55.4-16.4-55.4-16.4z" fill="#65bc46"/>
  <path d="M252.1 416.2c0 21.2-3 30.3 6.1 32.3 9 2 26.2 0 32.3-4s1-31.2-1-36.3c-2.1-5.1-37.4-1.1-37.4 8" fill="#43a244"/>
</svg>`;

const YAHOO_MARK = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="115" fill="#6001D2"/>
  <path d="M198 396h-58l23-55-65-154h59l35 89 35-89h58m54 71h-64l58-138h64" fill="#FFFFFF"/>
  <circle cx="291" cy="306" r="35" fill="#FFFFFF"/>
</svg>`;

const ECOSIA_MARK = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <circle fill="#008060" cx="256" cy="256" r="256"/>
  <path fill="#FFFFFF" d="M388 286c34-5 92 25 45 93-31 45-100 51-131 51H279c-1 31 28 125 31 135H214c0-8 1-94 11-135h-9c-49 0-127-7-148-74-31-99 43-135 74-106c-7-20-46-146 56-181 89-30 174 31 161 112c6-5 34-25 62-3 27 21 18 80-35 107Z"/>
  <path fill="#008060" d="M324 144v71h-85v27h55v27h-55v27h85v71H187V144H324Z"/>
</svg>`;

const BRAVE_MARK = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path fill="#FB542B" d="M15.68 0l2.096 2.38s1.84-.512 2.709.358c.868.87 1.584 1.638 1.584 1.638l-.562 1.381.715 2.047s-2.104 7.98-2.35 8.955c-.486 1.919-.818 2.66-2.198 3.633-1.38.972-3.884 2.66-4.293 2.916-.409.256-.92.692-1.38.692-.46 0-.97-.436-1.38-.692a185.796 185.796 0 01-4.293-2.916c-1.38-.973-1.712-1.714-2.197-3.633-.247-.975-2.351-8.955-2.351-8.955l.715-2.047-.562-1.381s.716-.768 1.585-1.638c.868-.87 2.708-.358 2.708-.358L8.321 0h7.36zm-3.679 14.936c-.14 0-1.038.317-1.758.69-.72.373-1.242.637-1.409.742-.167.104-.065.301.087.409.152.107 2.194 1.69 2.393 1.866.198.175.489.464.687.464.198 0 .49-.29.688-.464.198-.175 2.24-1.759 2.392-1.866.152-.108.254-.305.087-.41-.167-.104-.689-.368-1.41-.741-.72-.373-1.617-.69-1.757-.69zm0-11.278s-.409.001-1.022.206-1.278.46-1.584.46c-.307 0-2.581-.434-2.581-.434S4.119 7.152 4.119 7.849c0 .697.339.881.68 1.243l2.02 2.149c.192.203.59.511.356 1.066-.235.555-.58 1.26-.196 1.977.384.716 1.042 1.194 1.464 1.115.421-.08 1.412-.598 1.776-.834.364-.237 1.518-1.19 1.518-1.554 0-.365-1.193-1.02-1.413-1.168-.22-.15-1.226-.725-1.247-.95-.02-.227-.012-.293.284-.851.297-.559.831-1.304.742-1.8-.089-.495-.95-.753-1.565-.986-.615-.232-1.799-.671-1.947-.74-.148-.068-.11-.133.339-.175.448-.043 1.719-.212 2.292-.052.573.16 1.552.403 1.632.532.079.13.149.134.067.579-.081.445-.5 2.581-.541 2.96-.04.38-.12.63.288.724.409.094 1.097.256 1.333.256s.924-.162 1.333-.256c.408-.093.329-.344.288-.723-.04-.38-.46-2.516-.541-2.961-.082-.445-.012-.45.067-.579.08-.129 1.059-.372 1.632-.532.573-.16 1.845.009 2.292.052.449.042.487.107.339.175-.148.069-1.332.508-1.947.74-.615.233-1.476.49-1.565.986-.09.496.445 1.241.742 1.8.297.558.304.624.284.85-.02.226-1.026.802-1.247.95-.22.15-1.413.804-1.413 1.169 0 .364 1.154 1.317 1.518 1.554.364.236 1.355.755 1.776.834.422.079 1.08-.4 1.464-1.115.384-.716.039-1.422-.195-1.977-.235-.555.163-.863.355-1.066l2.02-2.149c.341-.362.68-.546.68-1.243 0-.697-2.695-3.96-2.695-3.96s-2.274.436-2.58.436c-.307 0-.972-.256-1.585-.461-.613-.205-1.022-.206-1.022-.206z"/>
</svg>`;

const GLASS_MARK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>`;

const ENGINE_ICONS = {
  google: GOOGLE_MARK,
  bing: BING_MARK,
  duckduckgo: DUCK_MARK,
  yahoo: YAHOO_MARK,
  ecosia: ECOSIA_MARK,
  brave: BRAVE_MARK,
};

// Synchronously prime settings and shortcuts from localStorage cache to prevent flash
try {
  const cached = localStorage.getItem("liquidtab_cached_settings") || localStorage.getItem("liquidtab:settings");
  if (cached) {
    const s = JSON.parse(cached);
    if (s.clockColor === "dark") s.clockColor = "auto";
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
    const prevBgType = settings.bgType;
    const prevUnsplashCat = settings.unsplashCat;
    const prevPhotoId = settings.photoId;
    const prevBg = settings.bg;

    if (result.settings) settings = { ...DEFAULTS, ...result.settings };
    if (!settings.layoutPreset) {
      settings.showQuote = true;
      settings.positions = {};
      settings.layoutPreset = "clean-default";
      settings.tint = 20;
      settings.clockColor = "auto";
      saveSettings();
    }
    if (settings.tint === 10) {
      settings.tint = 20;
      saveSettings();
    }
    if (settings.clockColor === "dark") {
      settings.clockColor = "auto";
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
    if (!Array.isArray(settings.recentClockColors)) {
      settings.recentClockColors = [];
    }
    if (typeof settings.bgRotate === "string") {
      settings.bgRotate = { unsplash: settings.bgRotate, photo: "never", gradient: "never", solid: "never" };
      saveSettings();
    } else if (!settings.bgRotate || typeof settings.bgRotate !== "object") {
      settings.bgRotate = { unsplash: "tab", photo: "never", gradient: "never", solid: "never" };
      saveSettings();
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
    if (!Array.isArray(settings.excludedQuotes)) settings.excludedQuotes = [];
    if (!settings.dockLimit) settings.dockLimit = 5;
    if (!Array.isArray(settings.quoteCats) || !settings.quoteCats.length) {
      settings.quoteCats = getAllAuthors().map((a) => a.name);
    } else {
      settings.quoteCats = [...new Set(settings.quoteCats.map(normalizeAuthorName))];
      if (!settings.quoteCats.length) settings.quoteCats = getAllAuthors().map((a) => a.name);
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
    requestAnimationFrame(() => {
      document.body.classList.remove("preload");
    });
    if (settings.bgType !== prevBgType || settings.unsplashCat !== prevUnsplashCat || settings.photoId !== prevPhotoId || settings.bg !== prevBg) {
      applyWallpaper();
    }
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
    const effectiveSolid = getBgRotate("solid") !== "never"
      ? SOLID_PRESET_COLORS[rotationIndex(SOLID_PRESET_COLORS.length, "solid")]
      : settings.solidColor;
    prevHero.style.backgroundColor = effectiveSolid;
    if (nameEl) nameEl.textContent = effectiveSolid.toUpperCase();
    if (kindEl) kindEl.textContent = getBgRotate("solid") !== "never" ? "Rotating Solid" : "Solid Colour";
  } else if (settings.bgType === "gradient") {
    prevHero.style.backgroundImage = "none";
    if (settings.bg === "custom" && getBgRotate("gradient") === "never") {
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
      const activeTheme = getBgRotate("gradient") !== "never"
        ? GRADIENT_THEMES[rotationIndex(GRADIENT_THEMES.length, "gradient")]
        : (THEMES[settings.bg] ? settings.bg : "green");
      prevHero.style.background = themeGradients[activeTheme] || themeGradients.green;
      if (nameEl) nameEl.textContent = THEMES[activeTheme] || "Gradient";
      if (kindEl) kindEl.textContent = getBgRotate("gradient") !== "never" ? "Rotating Gradient" : "Dynamic Gradient";
    }
  }
}

function syncBgRotateUI() {
  const sel = $("optBgRotate");
  if (sel) sel.value = getBgRotate(settings.bgType);
}

function addRecentClockColor(color) {
  if (!color) return;
  const c = color.toLowerCase();
  const recents = (settings.recentClockColors || []).filter((x) => x.toLowerCase() !== c);
  recents.unshift(c);
  settings.recentClockColors = recents.slice(0, 5);
  saveSettings();
  renderRecentClockColors();
}

function renderRecentClockColors() {
  const container = $("clockRecents");
  const row = $("clockRecentRow");
  if (!container || !row) return;
  const list = settings.recentClockColors || [];
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
    if (settings.clockColor === "custom" && (settings.clockCustomColor || "").toLowerCase() === col.toLowerCase()) {
      btn.classList.add("active");
    }
    btn.onclick = () => {
      settings.clockColor = "custom";
      settings.clockCustomColor = col;
      if ($("clockCustomColor")) $("clockCustomColor").value = col;
      applySettings();
      saveSettings();
    };
    container.appendChild(btn);
  });
}

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
      syncBgRotateUI();
      applySettings();
      saveSettings();
      applyWallpaper();
    };
    container.appendChild(btn);
  });
}

// ============================================================
// Apply settings
// ============================================================
function applySettings() {
  cleanEarlyBgStyle();
  const body = document.body;

  let activeTheme = settings.bg;
  let _randomGradient = null; // filled below when rotation is on
  if (settings.bgType === "gradient" && getBgRotate("gradient") !== "never") {
    _randomGradient = randomGradientPair();
    activeTheme = settings.bg; // keep theme for dataset (won't be used for colors)
  }
  const theme = THEMES[activeTheme] ? activeTheme : "green";

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
  let activeSolid = settings.solidColor;
  if (settings.bgType === "solid" && getBgRotate("solid") !== "never") {
    activeSolid = randomDarkSolidColor();
  }

  if (settings.bgType === "solid") {
    body.style.setProperty("--base", activeSolid);
    body.style.removeProperty("--c1");
    body.style.removeProperty("--c2");
    body.style.removeProperty("--c3");
    body.style.removeProperty("--c4");
    body.style.removeProperty("--accent");
  } else if (settings.bgType === "gradient" && _randomGradient) {
    // True random gradient — inject colours directly, bypass theme system
    const { c1, c2 } = _randomGradient;
    body.style.setProperty("--c1", c1);
    body.style.setProperty("--c2", c2);
    body.style.setProperty("--c3", c1);
    body.style.setProperty("--c4", c2);
    body.style.setProperty("--base", "#050810");
    body.style.setProperty("--accent", c1);
  } else if (settings.bgType === "gradient" && settings.bg === "custom" && getBgRotate("gradient") === "never") {
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

  const eng = ENGINES[settings.engine] || ENGINES.google;
  $("engineIcon").innerHTML = ENGINE_ICONS[settings.engine] || GLASS_MARK;
  $("searchInput").placeholder = `Search ${eng.name}`;

  updateThemePreview();
  if ($("optSolidHex")) $("optSolidHex").textContent = settings.solidColor.toUpperCase();
  if ($("optSolid")) $("optSolid").value = settings.solidColor;

  $$("#bgSwatches .dot").forEach((d) => d.classList.toggle("active", settings.bgType === "gradient" && d.dataset.bg === theme));
  $$("#solidPresets .dot").forEach((d) => {
    if (d.dataset.solid) {
      d.classList.toggle("active", settings.bgType === "solid" && (d.dataset.solid || "").toLowerCase() === (getBgRotate("solid") !== "never" ? activeSolid : settings.solidColor).toLowerCase());
    } else if (d.classList.contains("cc-custom")) {
      const isCustom = settings.bgType === "solid" && !SOLID_PRESET_COLORS.includes(settings.solidColor.toLowerCase());
      d.classList.toggle("active", isCustom);
    }
  });
  $$("#clockColors .dot").forEach((d) => d.classList.toggle("active", d.dataset.cc === settings.clockColor));
  $$("#scaleTiles .sw-tile").forEach((t) => t.classList.toggle("active", t.dataset.scale === settings.scale));
  $$("#modeTiles .sw-tile").forEach((t) => t.classList.toggle("active", t.dataset.mode === settings.mode));
  $$("#bgSegment button").forEach((b) => b.classList.toggle("active", b.dataset.bgtype === settings.bgType));
  $$(".bg-tab").forEach((t) => t.classList.toggle("active", t.dataset.bgtype === settings.bgType));

  if (typeof renderRecentSolidColors === "function") renderRecentSolidColors();
  if (typeof renderRecentClockColors === "function") renderRecentClockColors();
  if (typeof syncBgRotateUI === "function") syncBgRotateUI();
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
  set("optCustomGreet", "value", settings.customGreet || "");
  const customGreetRow = $("customGreetRow");
  if (customGreetRow) customGreetRow.style.display = settings.greetStyle === "custom" ? "" : "none";
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
  syncBgRotateUI();
  const enabledAuthorsSet = new Set((settings.quoteCats || []).map(normalizeAuthorName));
  $$("#quoteCats input").forEach((cb) => {
    cb.checked = enabledAuthorsSet.has(normalizeAuthorName(cb.dataset.author || cb.dataset.cat));
  });
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
  set("optDockSource", "value", settings.dockSource || "custom");
  set("optDockLimit", "value", String(settings.dockLimit || 5));
  set("optShowAi", "checked", settings.showAi !== false);
  set("optAiProvider", "value", settings.aiProvider || "gemini");
  set("optAiCustomUrl", "value", settings.aiCustomUrl || "");
  const aiCustomRow = $("aiCustomUrlRow");
  if (aiCustomRow) aiCustomRow.style.display = settings.aiProvider === "custom" ? "" : "none";
  const aiProviderRow = $("aiProviderRow");
  if (aiProviderRow) aiProviderRow.style.display = settings.showAi !== false ? "" : "none";
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
    case "custom":  return (settings.customGreet && settings.customGreet.trim()) ? settings.customGreet.trim() : "Hello";
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
      // zone Open-Meteo resolves until reverse-geocoding finishes.
      const fallbackCity = (data.timezone || "").split("/").pop().replace(/_/g, " ");
      weatherState.city = settings.manualLocation
        ? settings.manualLocation.name
        : fallbackCity;

      $("weatherTemp").innerHTML = `${weatherState.temp}<span class="deg">&deg;</span>`;
      $("weatherIcon").innerHTML = icon;
      $("weatherCond").textContent = label;
      $("weatherCity").textContent = weatherState.city || "Your Location";
      if (data.daily) {
        $("weatherHilo").textContent =
          `H:${Math.round(data.daily.temperature_2m_max[0])}°  L:${Math.round(data.daily.temperature_2m_min[0])}°`;
      }
      renderIsland();

      // If using automatic location, get precise locality / city name via reverse-geocoding
      if (!settings.manualLocation) {
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)
          .then((r) => r.json())
          .then((geo) => {
            const precise = geo.locality || geo.city || geo.principalSubdivision || "";
            if (precise && !settings.manualLocation) {
              weatherState.city = precise;
              $("weatherCity").textContent = precise;
              renderIsland();
            }
          })
          .catch(() => {});
      }
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

  const timer = setTimeout(tryIpFallback, 5000);

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
    { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
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
// ============================================================
// Dock
// ============================================================
function extractCleanDomain(url) {
  if (!url) return "";
  let u = url.trim();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    return new URL(u).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return u.split("/")[0].replace(/^www\./i, "").toLowerCase();
  }
}

const FALLBACK_COLORS = ["#4285F4","#EA4335","#FBBC05","#34A853","#8E44AD","#16A085","#E67E22"];

function getSpecializedIconCandidates(url, name) {
  const u = (url || "").toLowerCase();
  const n = (name || "").toLowerCase();
  const list = [];

  // Google Drive
  if (u.includes("drive.google") || (u.includes("google.com") && n.includes("drive"))) {
    list.push("https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png");
    list.push("https://ssl.gstatic.com/docs/doclist/images/drive_2020q4_32dp.png");
    return list;
  }

  // Gmail
  if (u.includes("mail.google") || u.includes("gmail.com") || (u.includes("google.com") && (n.includes("gmail") || n.includes("mail")))) {
    list.push("https://ssl.gstatic.com/images/branding/product/2x/gmail_2020q4_48dp.png");
    list.push("https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico");
    return list;
  }

  // Google Gemini
  if (u.includes("gemini.google") || (u.includes("google.com") && n.includes("gemini"))) {
    list.push("https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg");
    list.push("https://gstatic.com/lamda/images/favicon_v2_16x16.png");
    return list;
  }

  // Google Calendar
  if (u.includes("calendar.google") || (u.includes("google.com") && n.includes("calendar"))) {
    list.push("https://ssl.gstatic.com/images/branding/product/2x/calendar_2020q4_48dp.png");
    list.push("https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png");
    return list;
  }

  // Google Sheets
  if (u.includes("sheets.google") || u.includes("docs.google.com/spreadsheets") || (u.includes("google.com") && n.includes("sheet"))) {
    list.push("https://ssl.gstatic.com/images/branding/product/2x/sheets_2020q4_48dp.png");
    list.push("https://ssl.gstatic.com/docs/spreadsheets/images/favicon6.ico");
    return list;
  }

  // Google Slides
  if (u.includes("slides.google") || u.includes("docs.google.com/presentation") || (u.includes("google.com") && n.includes("slide"))) {
    list.push("https://ssl.gstatic.com/images/branding/product/2x/slides_2020q4_48dp.png");
    list.push("https://ssl.gstatic.com/docs/presentations/images/favicon5.ico");
    return list;
  }

  // Google Forms
  if (u.includes("forms.google") || u.includes("docs.google.com/forms") || (u.includes("google.com") && n.includes("form"))) {
    list.push("https://ssl.gstatic.com/images/branding/product/2x/forms_2020q4_48dp.png");
    return list;
  }

  // Google Docs
  if (u.includes("docs.google") || (u.includes("google.com") && n.includes("doc"))) {
    list.push("https://ssl.gstatic.com/images/branding/product/2x/docs_2020q4_48dp.png");
    list.push("https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico");
    return list;
  }

  // Google Meet
  if (u.includes("meet.google") || (u.includes("google.com") && n.includes("meet"))) {
    list.push("https://ssl.gstatic.com/images/branding/product/2x/meet_2020q4_48dp.png");
    return list;
  }

  // Google Keep
  if (u.includes("keep.google") || (u.includes("google.com") && n.includes("keep"))) {
    list.push("https://ssl.gstatic.com/images/branding/product/2x/keep_2020q4_48dp.png");
    list.push("https://ssl.gstatic.com/keep/keep_2020q4.ico");
    return list;
  }

  // Google Maps
  if (u.includes("maps.google") || (u.includes("google.com") && n.includes("map"))) {
    list.push("https://ssl.gstatic.com/images/branding/product/2x/maps_48dp.png");
    list.push("https://maps.gstatic.com/favicon3.ico");
    return list;
  }

  // Google Photos
  if (u.includes("photos.google") || (u.includes("google.com") && n.includes("photo"))) {
    list.push("https://ssl.gstatic.com/images/branding/product/2x/photos_48dp.png");
    list.push("https://ssl.gstatic.com/social/photosui/images/favicon/v2/favicon-128.png");
    return list;
  }

  // Google Translate
  if (u.includes("translate.google") || (u.includes("google.com") && n.includes("translate"))) {
    list.push("https://ssl.gstatic.com/images/branding/product/2x/translate_48dp.png");
    return list;
  }

  // Google Classroom
  if (u.includes("classroom.google") || (u.includes("google.com") && n.includes("classroom"))) {
    list.push("https://ssl.gstatic.com/images/branding/product/2x/classroom_48dp.png");
    return list;
  }

  // YouTube
  if (u.includes("youtube.com") || u.includes("youtu.be")) {
    list.push("https://www.youtube.com/favicon.ico");
    return list;
  }

  // Microsoft Outlook
  if (u.includes("outlook.live.com") || u.includes("outlook.office.com") || (u.includes("outlook.com") && !u.includes("onedrive"))) {
    list.push("https://res.cdn.office.net/assets/mail/pwa/v1/pngs/apple-touch-icon.png");
    list.push("https://outlook.live.com/favicon.ico");
    return list;
  }

  // Microsoft OneDrive
  if (u.includes("onedrive.live.com") || (u.includes("microsoft.com") && n.includes("onedrive"))) {
    list.push("https://onedrive.live.com/favicon.ico");
    return list;
  }

  // Microsoft Copilot
  if (u.includes("copilot.microsoft.com") || (u.includes("microsoft.com") && n.includes("copilot"))) {
    list.push("https://copilot.microsoft.com/sa/simg/favicon-trans-bg.ico");
    list.push("https://copilot.microsoft.com/favicon.ico");
    return list;
  }

  // Main Google Search
  if (u.includes("google.com") && (u.endsWith("google.com") || u.endsWith("google.com/") || u.includes("google.com/search") || u.includes("google.com/webhp") || n === "google")) {
    list.push("https://www.google.com/favicon.ico");
    return list;
  }

  return list;
}

function createShortcutIconElement(s, index, isSettings = false) {
  const url = s.url || "";
  const domain = extractCleanDomain(url);
  const name = s.name || domain || "Site";

  // Fallback monogram element
  const fallback = document.createElement("span");
  fallback.className = isSettings ? "sc-fallback" : "fallback";
  fallback.textContent = (name.trim()[0] || "?").toUpperCase();
  fallback.style.background = FALLBACK_COLORS[index % FALLBACK_COLORS.length];

  if (!domain) return fallback;

  // Candidates priority list: specialized product icons first, then dynamic cascade
  const specialized = getSpecializedIconCandidates(url, name);
  const candidates = [...specialized];

  // Browser native favicon (if running in extension context)
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
    try {
      candidates.push(`chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=64`);
    } catch {}
  }

  // High-res Unavatar service
  candidates.push(`https://unavatar.io/${domain}?fallback=false`);

  // Google S2 high-res favicon service
  candidates.push(`https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(url)}`);

  // DuckDuckGo icon service
  candidates.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);

  // Direct domain favicon
  candidates.push(`https://${domain}/favicon.ico`);

  let step = 0;
  const img = document.createElement("img");
  img.alt = name;
  img.src = candidates[0];

  img.onerror = () => {
    step++;
    if (step < candidates.length) {
      img.src = candidates[step];
    } else {
      img.replaceWith(fallback);
    }
  };

  return img;
}


const AI_SERVICES = {
  gemini: {
    name: "Gemini",
    url: "https://gemini.google.com",
  },
  chatgpt: {
    name: "ChatGPT",
    url: "https://chatgpt.com",
  },
  claude: {
    name: "Claude",
    url: "https://claude.ai",
  },
  copilot: {
    name: "Microsoft Copilot",
    url: "https://copilot.microsoft.com",
  },
  perplexity: {
    name: "Perplexity",
    url: "https://perplexity.ai",
  },
  deepseek: {
    name: "DeepSeek",
    url: "https://deepseek.com",
  },
};

function getActiveAiUrl() {
  if (settings.showAi === false) return null;
  const provider = settings.aiProvider || "gemini";
  if (provider === "custom") {
    let custom = (settings.aiCustomUrl || "").trim();
    if (custom) {
      if (!/^https?:\/\//i.test(custom)) custom = "https://" + custom;
      return custom;
    }
    return "https://gemini.google.com";
  }
  return AI_SERVICES[provider] ? AI_SERVICES[provider].url : "https://gemini.google.com";
}

function isSameAiService(itemUrl, aiUrl) {
  if (!itemUrl || !aiUrl) return false;
  const d1 = extractCleanDomain(itemUrl);
  const d2 = extractCleanDomain(aiUrl);
  if (!d1 || !d2) return false;
  if (d1 === d2) return true;
  if ((d1 === "chatgpt.com" || d1 === "openai.com" || d1.endsWith(".openai.com")) &&
      (d2 === "chatgpt.com" || d2 === "openai.com" || d2.endsWith(".openai.com"))) {
    return true;
  }
  if ((d1 === "claude.ai" || d1 === "anthropic.com") && (d2 === "claude.ai" || d2 === "anthropic.com")) {
    return true;
  }
  if (d1.includes("gemini") && d2.includes("gemini")) {
    return true;
  }
  if (d1.includes("copilot") && d2.includes("copilot")) {
    return true;
  }
  if (d1.includes("perplexity") && d2.includes("perplexity")) {
    return true;
  }
  if (d1.includes("deepseek") && d2.includes("deepseek")) {
    return true;
  }
  return false;
}

function getActiveShortcuts(cb) {
  const source = settings.dockSource || "custom";
  const limit = Math.max(1, Math.min(20, parseInt(settings.dockLimit, 10) || 5));

  if (source === "topsites") {
    if (typeof chrome !== "undefined" && chrome.topSites && chrome.topSites.get) {
      chrome.topSites.get((sites) => {
        if (sites && sites.length) {
          const activeAi = getActiveAiUrl();
          let filtered = sites;
          if (activeAi) {
            filtered = sites.filter((s) => !isSameAiService(s.url, activeAi));
          }
          const mapped = filtered.slice(0, limit).map((s) => ({
            name: s.title || (s.url ? s.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : "Site"),
            url: s.url,
          }));
          return cb(mapped);
        }
        cb(SHORTCUTS.slice(0, limit));
      });
      return;
    }
  } else if (source === "bookmarks") {
    if (typeof chrome !== "undefined" && chrome.bookmarks) {
      const activeAi = getActiveAiUrl();
      const extractBookmarks = (nodes, result = []) => {
        for (const node of nodes) {
          if (node.url && !node.url.startsWith("javascript:")) {
            if (!activeAi || !isSameAiService(node.url, activeAi)) {
              result.push({ name: node.title || node.url, url: node.url });
            }
          }
          if (node.children) extractBookmarks(node.children, result);
        }
        return result;
      };

      chrome.bookmarks.getChildren("1", (children) => {
        if (chrome.runtime?.lastError || !children || !children.length) {
          chrome.bookmarks.getTree((tree) => {
            const all = extractBookmarks(tree || []);
            cb(all.length ? all.slice(0, limit) : SHORTCUTS.slice(0, limit));
          });
        } else {
          const bar = children
            .filter((c) => c.url && !c.url.startsWith("javascript:") && (!activeAi || !isSameAiService(c.url, activeAi)))
            .map((c) => ({
              name: c.title || c.url,
              url: c.url,
            }));
          if (bar.length) {
            cb(bar.slice(0, limit));
          } else {
            chrome.bookmarks.getTree((tree) => {
              const all = extractBookmarks(tree || []);
              cb(all.length ? all.slice(0, limit) : SHORTCUTS.slice(0, limit));
            });
          }
        }
      });
      return;
    }
  }

  cb(SHORTCUTS.slice(0, limit));
}

function renderAiButton() {
  const btn = $("aiBtn") || $("geminiBtn");
  if (!btn) return;

  if (settings.showAi === false) {
    btn.style.display = "none";
    return;
  }
  btn.style.display = "";

  const provider = settings.aiProvider || "gemini";
  let targetUrl = "https://gemini.google.com";
  let targetName = "Gemini";

  if (provider === "custom") {
    let custom = (settings.aiCustomUrl || "").trim();
    if (custom) {
      if (!/^https?:\/\//i.test(custom)) custom = "https://" + custom;
      targetUrl = custom;
      const cleanHost = extractCleanDomain(custom);
      targetName = cleanHost ? cleanHost.replace(/\.(com|ai|io|org|net|co)$/i, "") : "AI Assistant";
      targetName = targetName.charAt(0).toUpperCase() + targetName.slice(1);
    } else {
      targetUrl = "https://gemini.google.com";
      targetName = "AI Assistant";
    }
  } else if (AI_SERVICES[provider]) {
    targetUrl = AI_SERVICES[provider].url;
    targetName = AI_SERVICES[provider].name;
  }

  btn.href = targetUrl;
  btn.dataset.label = targetName;
  btn.setAttribute("title", targetName);
  btn.setAttribute("aria-label", targetName);

  btn.innerHTML = "";
  const iconEl = createShortcutIconElement({ url: targetUrl, name: targetName }, 0, false);
  btn.appendChild(iconEl);
}

function renderShortcuts() {
  const dock = $("dock");
  if (!dock) return;

  renderAiButton();

  getActiveShortcuts((items) => {
    dock.querySelectorAll("a:not(#settingsBtn):not(#aiBtn):not(#geminiBtn)").forEach((el) => el.remove());
    const divider = dock.querySelector(".dock-divider");

    items.forEach((s, i) => {
      const a = document.createElement("a");
      a.href = s.url;
      a.dataset.label = s.name || s.url;

      const icon = createShortcutIconElement(s, i, false);
      a.appendChild(icon);

      dock.insertBefore(a, divider);
    });
  });
}

const TAG_SVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/></svg>`;
const LINK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/></svg>`;
const X_SVG    = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`;

function renderShortcutList() {
  const list = $("shortcutList");
  if (!list) return;
  list.innerHTML = "";

  const source = settings.dockSource || "custom";
  const limit = Math.max(1, Math.min(20, parseInt(settings.dockLimit, 10) || 5));
  const label = $("shortcutListLabel");
  const addBtn = $("addShortcutBtn");

  if (source === "custom") {
    if (label) {
      label.textContent = SHORTCUTS.length > limit
        ? `Shortcuts (First ${limit} shown in dock)`
        : `Shortcuts (${SHORTCUTS.length})`;
    }
    if (addBtn) addBtn.style.display = "";

    if (!SHORTCUTS.length) {
      list.innerHTML = `<div class="sw-empty">No shortcuts yet. Add one below.</div>`;
      return;
    }

    SHORTCUTS.forEach((s, i) => {
      const row = document.createElement("div");
      row.className = "sc-row" + (i >= limit ? " sc-row-overflow" : "");

      let iconEl = createShortcutIconElement(s, i, true);

      const refreshRowIcon = () => {
        const newIcon = createShortcutIconElement(SHORTCUTS[i], i, true);
        if (iconEl && iconEl.parentNode) {
          iconEl.replaceWith(newIcon);
          iconEl = newIcon;
        }
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

      let typingTimer = null;

      const nameField = mkField(TAG_SVG, s.name, "Name", (input) => {
        SHORTCUTS[i].name = input.value;
        saveShortcuts();
        renderShortcuts();
        if (iconEl && (iconEl.classList.contains("sc-fallback") || !s.url)) {
          refreshRowIcon();
        }
      });

      const urlField = mkField(LINK_SVG, s.url, "https://…", (input) => {
        SHORTCUTS[i].url = input.value;
        saveShortcuts();
        renderShortcuts();
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
          refreshRowIcon();
        }, 250);
      }, (input) => {
        const v = input.value.trim();
        if (v && !/^https?:\/\//i.test(v)) {
          SHORTCUTS[i].url = input.value = `https://${v}`;
          saveShortcuts();
          renderShortcuts();
          refreshRowIcon();
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

      if (i >= limit) {
        const overflowBadge = document.createElement("span");
        overflowBadge.className = "sc-overflow-badge";
        overflowBadge.textContent = "Exceeds dock limit";
        overflowBadge.title = `Your dock is limited to ${limit} items. Increase the limit in settings to show this shortcut.`;
        row.append(iconEl, nameField, urlField, overflowBadge, del);
      } else {
        row.append(iconEl, nameField, urlField, del);
      }
      list.appendChild(row);
    });
  } else {
    // Automatic mode: topsites or bookmarks
    if (addBtn) addBtn.style.display = "none";

    if (source === "topsites") {
      if (label) label.textContent = `Most Visited (Top ${limit} shown)`;
    } else {
      if (label) label.textContent = `Favorites / Bookmarks (Top ${limit} shown)`;
    }

    getActiveShortcuts((items) => {
      list.innerHTML = "";
      if (!items.length) {
        list.innerHTML = `<div class="sw-empty quiet">No items found for this source.</div>`;
        return;
      }
      items.forEach((s, i) => {
        const row = document.createElement("div");
        row.className = "sc-row";

        const iconEl = createShortcutIconElement(s, i, true);

        const info = document.createElement("div");
        info.style.flex = "1";
        info.style.minWidth = "0";
        info.style.display = "flex";
        info.style.flexDirection = "column";
        info.style.gap = "2px";

        const nameSpan = document.createElement("span");
        nameSpan.style.fontSize = "13px";
        nameSpan.style.fontWeight = "550";
        nameSpan.style.color = "var(--sw-text)";
        nameSpan.style.overflow = "hidden";
        nameSpan.style.textOverflow = "ellipsis";
        nameSpan.style.whiteSpace = "nowrap";
        nameSpan.textContent = s.name || s.url;

        const urlSpan = document.createElement("span");
        urlSpan.style.fontSize = "11px";
        urlSpan.style.color = "var(--sw-label)";
        urlSpan.style.overflow = "hidden";
        urlSpan.style.textOverflow = "ellipsis";
        urlSpan.style.whiteSpace = "nowrap";
        urlSpan.textContent = s.url;

        info.append(nameSpan, urlSpan);
        row.append(iconEl, info);
        list.appendChild(row);
      });
    });
  }
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



$$("#bgSegment button").forEach((btn) => {
  btn.addEventListener("click", () => {
    settings.bgType = btn.dataset.bgtype;
    syncBgRotateUI();
    applySettings();
    saveSettings();
    applyWallpaper();
  });
});

$$("#solidPresets button.dot").forEach((dot) => {
  dot.addEventListener("click", () => {
    const col = dot.dataset.solid;
    settings.solidColor = col;
    settings.bgType = "solid";
    addRecentSolidColor(col);
    syncBgRotateUI();
    applySettings();
    saveSettings();
    applyWallpaper();
  });
});

$("optSolid")?.addEventListener("input", (e) => {
  settings.solidColor = e.target.value;
  settings.bgType = "solid";
  syncBgRotateUI();
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

const triggerGradUpdate = () => {
  if (settings.bg === "custom" && settings.bgType === "gradient") {
    $("applyCustomGrad")?.click();
  }
};
$("optGradColor1")?.addEventListener("input", triggerGradUpdate);
$("optGradColor1")?.addEventListener("change", triggerGradUpdate);
$("optGradColor2")?.addEventListener("input", triggerGradUpdate);
$("optGradColor2")?.addEventListener("change", triggerGradUpdate);

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
bindValue("optGreetStyle", "greetStyle", (v) => v, (val) => {
  const row = $("customGreetRow");
  if (row) row.style.display = val === "custom" ? "" : "none";
  renderIsland();
});
bindValue("optCustomGreet", "customGreet", (v) => v, renderIsland);
bindValue("optEngine", "engine");
bindValue("optClockFont", "clockFont");
bindValue("optTint", "tint", Number, (value) => { $("optTintValue").textContent = `${value}%`; });
bindValue("optBlur", "blur", Number);

$("optDockSource")?.addEventListener("change", (e) => {
  settings.dockSource = e.target.value;
  saveSettings();
  renderShortcuts();
  renderShortcutList();
});

$("optDockLimit")?.addEventListener("change", (e) => {
  settings.dockLimit = parseInt(e.target.value, 10) || 5;
  saveSettings();
  renderShortcuts();
  renderShortcutList();
});

$("optShowAi")?.addEventListener("change", (e) => {
  settings.showAi = e.target.checked;
  const aiProviderRow = $("aiProviderRow");
  if (aiProviderRow) aiProviderRow.style.display = settings.showAi ? "" : "none";
  const aiCustomRow = $("aiCustomUrlRow");
  if (aiCustomRow) aiCustomRow.style.display = settings.showAi && settings.aiProvider === "custom" ? "" : "none";
  saveSettings();
  renderAiButton();
});

$("optAiProvider")?.addEventListener("change", (e) => {
  settings.aiProvider = e.target.value;
  const aiCustomRow = $("aiCustomUrlRow");
  if (aiCustomRow) aiCustomRow.style.display = settings.aiProvider === "custom" ? "" : "none";
  saveSettings();
  renderAiButton();
});

let aiUrlDebounce = null;
$("optAiCustomUrl")?.addEventListener("input", (e) => {
  clearTimeout(aiUrlDebounce);
  aiUrlDebounce = setTimeout(() => {
    settings.aiCustomUrl = e.target.value.trim();
    saveSettings();
    renderAiButton();
  }, 300);
});

// Real-time synchronization for bookmarks bar changes
if (typeof chrome !== "undefined" && chrome.bookmarks) {
  const handleBookmarkChange = () => {
    if (settings.dockSource === "bookmarks") {
      renderShortcuts();
      renderShortcutList();
    }
  };
  try {
    chrome.bookmarks.onCreated?.addListener(handleBookmarkChange);
    chrome.bookmarks.onRemoved?.addListener(handleBookmarkChange);
    chrome.bookmarks.onChanged?.addListener(handleBookmarkChange);
    chrome.bookmarks.onMoved?.addListener(handleBookmarkChange);
  } catch(e) {}
}

$("optUnit").addEventListener("input", () => {
  settings.unit = $("optUnit").value;
  saveSettings();
  if (lastCoords) loadWeather(lastCoords.lat, lastCoords.lon);
});

$$("#bgSwatches .dot").forEach((dot) => {
  dot.addEventListener("click", () => {
    settings.bg = dot.dataset.bg;
    settings.bgType = "gradient";
    syncBgRotateUI();
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
$("clockCustomColor").addEventListener("change", () => {
  addRecentClockColor($("clockCustomColor").value);
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

// ---- restore quote collections to defaults ----
$("restoreQuoteCollectionsBtn")?.addEventListener("click", () => {
  if (!confirm("Are you sure you want to reset quotes to default? This will restore all built-in collections and remove custom additions.")) return;
  MY_QUOTES = [];
  saveMyQuotes();
  settings.excludedQuotes = [];
  settings.quoteCats = getAllAuthors().map((a) => a.name);
  saveSettings();
  buildCategoryRows();
  updateAuthorDatalist();
  updateQuoteStats();
  newQuote(true);
});

// ---- master reset to defaults ----
$("resetAll")?.addEventListener("click", () => {
  if (!confirm("Are you sure you want to reset all settings, shortcuts, and widgets back to factory defaults?")) return;
  // Clear excludedQuotes FIRST so getAllAuthors() sees all built-in quotes restored
  settings = { ...DEFAULTS, positions: {}, excludedQuotes: [] };
  settings.quoteCats = getAllAuthors().map((a) => a.name);
  SHORTCUTS = DEFAULT_SHORTCUTS.map((s) => ({ ...s }));
  saveSettings();
  saveShortcuts();
  syncControls();
  applySettings();
  renderShortcuts();
  renderShortcutList();
  buildCategoryRows();
  renderMyQuotes();
  updateQuoteStats();
  newQuote(true);
  layoutWidgets();
  restartIslandTimer();
  initWeather();
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
    if (!Array.isArray(settings.excludedQuotes)) settings.excludedQuotes = [];
    if (Array.isArray(data.shortcuts)) SHORTCUTS = data.shortcuts;
    if (Array.isArray(data.myQuotes)) MY_QUOTES = data.myQuotes;
    if (!Array.isArray(settings.quoteCats) || !settings.quoteCats.length) {
      settings.quoteCats = getAllAuthors().map((a) => a.name);
    } else {
      settings.quoteCats = [...new Set(settings.quoteCats.map(normalizeAuthorName))];
      if (!settings.quoteCats.length) settings.quoteCats = getAllAuthors().map((a) => a.name);
    }
    saveSettings();
    saveShortcuts();
    saveMyQuotes();
    syncControls();
    applySettings();
    buildCategoryRows();
    renderMyQuotes();
    updateQuoteStats();
    newQuote(true);
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
  appearance: "Appearance", about: "About",
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

// Stable random seed generated ONCE when this tab is opened
const TAB_ROTATION_SEED = Math.floor(Math.random() * 1000000);

/**
 * Tiny seedable PRNG (mulberry32) — gives the same sequence every tab open
 * for a given TAB_ROTATION_SEED, so solid + gradient stay consistent within
 * a tab session even if applySettings() is called multiple times.
 */
function makePrng(seed) {
  let s = seed >>> 0;
  return function() {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One PRNG instance per tab — call in order so each use gets a different value
const _tabPrng = makePrng(TAB_ROTATION_SEED);
const _TAB_RAND = [_tabPrng(), _tabPrng(), _tabPrng(), _tabPrng(), _tabPrng()];

/** Returns a rich, dark, vivid colour as a hex string — different every tab. */
function randomDarkSolidColor() {
  const hue  = Math.round(_TAB_RAND[0] * 360);        // full hue wheel
  const sat  = 30 + Math.round(_TAB_RAND[1] * 50);    // 30–80% saturation
  const lig  = 8  + Math.round(_TAB_RAND[2] * 14);    // 8–22% lightness (always dark)
  return `hsl(${hue},${sat}%,${lig}%)`;
}

/**
 * Returns { c1, c2 } — two complementary vivid HSL colours for a gradient.
 * c1 is bright/vibrant (light stop), c2 is deeper (mid), base is near-black.
 */
function randomGradientPair() {
  const hue1 = Math.round(_TAB_RAND[3] * 360);
  const hue2 = (hue1 + 140 + Math.round(_TAB_RAND[4] * 80)) % 360;  // offset 140–220°
  const c1   = `hsl(${hue1},80%,72%)`;
  const c2   = `hsl(${hue2},70%,38%)`;
  return { c1, c2 };
}

/** A seed that only changes as often as the chosen rotation. */
function rotationSeed(mode) {
  const d = new Date();
  const day = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  if (mode === "day")  return day;
  if (mode === "hour") return `${day}-${d.getHours()}`;
  return String(TAB_ROTATION_SEED);   // deterministic for this tab session
}

function quotePool() {
  const enabledAuthors = new Set(
    (settings.quoteCats || []).map(normalizeAuthorName)
  );
  const excludedSet = new Set(
    (settings.excludedQuotes || []).map(normalizeQuoteText)
  );

  const pool = [];

  // Built-in quotes
  if (typeof QUOTES !== "undefined" && Array.isArray(QUOTES)) {
    QUOTES.forEach((q) => {
      const textNorm = normalizeQuoteText(q[0]);
      if (excludedSet.has(textNorm)) return;
      const author = normalizeAuthorName(q[1]);
      if (enabledAuthors.has(author)) {
        pool.push([q[0], author]);
      }
    });
  }

  // Custom quotes
  if (Array.isArray(MY_QUOTES)) {
    MY_QUOTES.forEach((q) => {
      const text = (q.text || "").trim();
      if (!text) return;
      const author = normalizeAuthorName(q.author);
      if (enabledAuthors.has(author)) {
        pool.push([text, author]);
      }
    });
  }

  return pool;
}

let quoteOffset = 0;   // bumped by the shuffle button

function newQuote(animate = true) {
  const pool = quotePool();
  const card = $("quoteCard");
  if (!card) return;

  const paint = () => {
    if (!pool.length) {
      $("quoteText").textContent = "No quotes selected. Choose authors or add custom quotes in Settings.";
      $("quoteAuthor").textContent = "";
      if ($("quoteCat")) $("quoteCat").textContent = "";
      return;
    }
    const idx = (hashString(rotationSeed(settings.quoteRotate)) + quoteOffset) % pool.length;
    const [text, author] = pool[idx];
    let cleanText = (text || "").trim().replace(/^["“](.*)["”]$/, "$1").trim();
    const cleanAuthor = author ? author.replace(/^[—–-]\s*/, "").trim() : "";

    if (cleanAuthor) {
      const authorPattern = new RegExp(`[—–-]\\s*${cleanAuthor.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*$`, 'i');
      cleanText = cleanText.replace(authorPattern, "").trim().replace(/^["“](.*)["”]$/, "$1").trim();
    }

    $("quoteText").textContent = cleanText ? `“${cleanText}”` : "";
    $("quoteAuthor").textContent = cleanAuthor ? `— ${cleanAuthor}` : "";
    if ($("quoteCat")) $("quoteCat").textContent = "";
  };

  if (!animate) { paint(); return; }
  card.classList.add("swapping");
  setTimeout(() => { paint(); card.classList.remove("swapping"); }, 240);
}

function shuffleQuote() {
  quoteOffset++;
  newQuote(true);
}

function areQuotesModified() {
  const hasCustom = Array.isArray(MY_QUOTES) && MY_QUOTES.some((q) => (q.text || "").trim());
  const hasExclusions = Array.isArray(settings.excludedQuotes) && settings.excludedQuotes.length > 0;
  const cats = (settings.quoteCats || []).map(normalizeAuthorName);
  const defaultCats = ["Alex Hormozi", "Leila Hormozi"].map(normalizeAuthorName);
  const missingDefaultCat = defaultCats.some((c) => !cats.includes(c));
  const hasNonDefaultCat = cats.some((c) => !defaultCats.includes(c));
  return hasCustom || hasExclusions || missingDefaultCat || hasNonDefaultCat;
}

function syncQuoteResetVisibility() {
  const row = $("resetQuotesRow");
  if (!row) return;
  row.style.display = areQuotesModified() ? "flex" : "none";
}

function updateQuoteStats() {
  const n = quotePool().length;
  const pool = $("quotePoolSize");
  if (pool) pool.textContent = `${n} quote${n === 1 ? "" : "s"}`;
  const about = $("aboutQuotes");
  if (about) {
    const validMine = (MY_QUOTES || []).filter((q) => (q.text || "").trim()).length;
    const excludedSet = new Set((settings.excludedQuotes || []).map(normalizeQuoteText));
    const builtinCount = typeof QUOTES !== "undefined" && Array.isArray(QUOTES)
      ? QUOTES.filter((q) => !excludedSet.has(normalizeQuoteText(q[0]))).length
      : 0;
    about.textContent = `${builtinCount} built-in · ${validMine} custom`;
  }
  syncQuoteResetVisibility();
}

function buildCategoryRows() {
  const wrap = $("quoteCats");
  if (!wrap) return;

  // Remember which author drawers are currently expanded
  const expandedAuthors = new Set(
    $$("#quoteCats .author-row.expanded").map((r) => r.dataset.author)
  );

  wrap.innerHTML = "";

  const allAuthors = getAllAuthors();
  if (!allAuthors.length) {
    wrap.innerHTML = `<div class="sw-empty quiet">No authors available.</div>`;
    return;
  }

  if (!Array.isArray(settings.quoteCats) || !settings.quoteCats.length) {
    settings.quoteCats = allAuthors.map((a) => a.name);
    saveSettings();
  }

  const enabledSet = new Set(settings.quoteCats.map(normalizeAuthorName));
  const excludedSet = new Set((settings.excludedQuotes || []).map(normalizeQuoteText));

  allAuthors.forEach(({ name, count }) => {
    const norm = normalizeAuthorName(name);
    const isBuiltIn = ["Alex Hormozi", "Leila Hormozi"].includes(norm);

    const authorCustomQuotes = (MY_QUOTES || []).filter(
      (q) => (q.text || "").trim() && normalizeAuthorName(q.author) === norm
    );

    const allAuthorBuiltin = (typeof QUOTES !== "undefined" && Array.isArray(QUOTES))
      ? QUOTES.filter((q) => normalizeAuthorName(q[1]) === norm)
      : [];

    const activeBuiltinQuotes = allAuthorBuiltin.filter(
      (q) => !excludedSet.has(normalizeQuoteText(q[0]))
    );

    const excludedCount = allAuthorBuiltin.length - activeBuiltinQuotes.length;

    const row = document.createElement("div");
    row.className = "author-row";
    row.dataset.author = name;
    if (expandedAuthors.has(name)) {
      row.classList.add("expanded");
    }

    const header = document.createElement("div");
    header.className = "author-header";

    const left = document.createElement("div");
    left.className = "author-left";

    const chevron = document.createElement("span");
    chevron.className = "author-chevron";
    chevron.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m9 18 6-6-6-6"/></svg>`;

    const info = document.createElement("div");
    info.className = "author-info";

    const nameEl = document.createElement("span");
    nameEl.className = "author-name";
    nameEl.textContent = name;

    const subEl = document.createElement("span");
    subEl.className = "author-sub";
    subEl.textContent = `${count} quote${count === 1 ? "" : "s"} · ${isBuiltIn ? "Built-in" : "Custom Collection"}`;

    info.append(nameEl, subEl);
    left.append(chevron, info);

    const right = document.createElement("div");
    right.className = "author-right";

    const countBadge = document.createElement("span");
    countBadge.className = "author-count-badge";
    countBadge.textContent = count;
    right.appendChild(countBadge);

    // Delete Collection handler
    const handleDeleteCollection = () => {
      const isCustomOnly = authorCustomQuotes.length > 0 && allAuthorBuiltin.length === 0;
      const promptText = isCustomOnly
        ? `Delete the entire "${name}" collection (${authorCustomQuotes.length} quotes)?`
        : `Remove all ${count} quotes in the "${name}" collection?`;

      if (confirm(promptText)) {
        if (authorCustomQuotes.length > 0) {
          MY_QUOTES = MY_QUOTES.filter((q) => normalizeAuthorName(q.author) !== norm);
          saveMyQuotes();
        }
        if (activeBuiltinQuotes.length > 0) {
          const newExclusions = activeBuiltinQuotes.map((q) => normalizeQuoteText(q[0]));
          settings.excludedQuotes = [...(settings.excludedQuotes || []), ...newExclusions];
        }
        settings.quoteCats = (settings.quoteCats || []).filter((c) => normalizeAuthorName(c) !== norm);
        saveSettings();
        buildCategoryRows();
        updateAuthorDatalist();
        updateQuoteStats();
        newQuote(true);
      }
    };

    // Header trash icon for deleting the collection
    const delAuthorBtn = document.createElement("button");
    delAuthorBtn.className = "author-del-btn";
    delAuthorBtn.title = `Delete "${name}" collection`;
    delAuthorBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
    delAuthorBtn.onclick = (e) => {
      e.stopPropagation();
      handleDeleteCollection();
    };
    right.appendChild(delAuthorBtn);

    // Author toggle switch
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "sw-toggle";
    cb.dataset.author = name;
    cb.checked = enabledSet.has(norm);

    cb.onclick = (e) => e.stopPropagation();
    cb.addEventListener("change", () => {
      const on = $$("#quoteCats input.sw-toggle").filter((i) => i.checked).map((i) => i.dataset.author);
      if (!on.length) {
        cb.checked = true;
        return; // never leave the pool empty
      }
      settings.quoteCats = on;
      saveSettings();
      updateQuoteStats();
      newQuote(true);
    });

    right.appendChild(cb);
    header.append(left, right);
    row.appendChild(header);

    // Expandable quotes drawer
    const drawer = document.createElement("div");
    drawer.className = "author-quotes-list";

    // Drawer toolbar
    const toolbar = document.createElement("div");
    toolbar.className = "author-drawer-toolbar";

    // Search filter input
    const searchWrap = document.createElement("div");
    searchWrap.className = "author-search-wrap";
    searchWrap.innerHTML = `<svg class="author-search-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "author-search-input";
    searchInput.placeholder = `Filter quotes by ${name}...`;
    searchInput.onclick = (e) => e.stopPropagation();
    searchWrap.appendChild(searchInput);
    toolbar.appendChild(searchWrap);

    // Actions toolbar
    const actionsRow = document.createElement("div");
    actionsRow.className = "author-drawer-actions";

    const actionsLeft = document.createElement("div");
    actionsLeft.className = "author-actions-left";

    const selectAllBtn = document.createElement("button");
    selectAllBtn.type = "button";
    selectAllBtn.className = "author-action-btn";
    selectAllBtn.textContent = "Select All";
    actionsLeft.appendChild(selectAllBtn);

    const selCountSpan = document.createElement("span");
    selCountSpan.className = "author-selected-count";
    selCountSpan.style.display = "none";
    actionsLeft.appendChild(selCountSpan);

    const delSelectedBtn = document.createElement("button");
    delSelectedBtn.type = "button";
    delSelectedBtn.className = "author-action-btn danger";
    delSelectedBtn.style.display = "none";
    delSelectedBtn.textContent = "Delete Selected";
    actionsLeft.appendChild(delSelectedBtn);

    const actionsRight = document.createElement("div");
    actionsRight.className = "author-actions-right";

    if (excludedCount > 0) {
      const restoreBtn = document.createElement("button");
      restoreBtn.type = "button";
      restoreBtn.className = "author-action-btn restore";
      restoreBtn.title = "Restore quotes that were previously removed from this built-in collection";
      restoreBtn.textContent = `↺ Restore (${excludedCount})`;
      restoreBtn.onclick = (e) => {
        e.stopPropagation();
        const builtInKeys = new Set(allAuthorBuiltin.map((q) => normalizeQuoteText(q[0])));
        settings.excludedQuotes = (settings.excludedQuotes || []).filter(
          (k) => !builtInKeys.has(normalizeQuoteText(k))
        );
        if (!settings.quoteCats.includes(name)) {
          settings.quoteCats.push(name);
        }
        saveSettings();
        buildCategoryRows();
        updateQuoteStats();
        newQuote(true);
      };
      actionsRight.appendChild(restoreBtn);
    }

    const delColBtn = document.createElement("button");
    delColBtn.type = "button";
    delColBtn.className = "author-action-btn danger";
    delColBtn.textContent = "Delete Collection";
    delColBtn.onclick = (e) => {
      e.stopPropagation();
      handleDeleteCollection();
    };
    actionsRight.appendChild(delColBtn);

    actionsRow.append(actionsLeft, actionsRight);
    toolbar.appendChild(actionsRow);
    drawer.appendChild(toolbar);

    // Quotes container
    const itemsContainer = document.createElement("div");
    itemsContainer.className = "author-quotes-items";

    const emptyFilterMsg = document.createElement("div");
    emptyFilterMsg.className = "author-empty-filter";
    emptyFilterMsg.style.display = "none";
    emptyFilterMsg.textContent = "No matching quotes found.";
    itemsContainer.appendChild(emptyFilterMsg);

    // Selection helper
    const updateSelectionUI = () => {
      const visibleItems = [...itemsContainer.querySelectorAll(".author-quote-item")].filter(
        (it) => it.style.display !== "none"
      );
      const visibleCheckboxes = visibleItems.map((it) => it.querySelector(".author-quote-cb")).filter(Boolean);
      const checkedBoxes = visibleCheckboxes.filter((cb) => cb.checked);

      if (checkedBoxes.length > 0) {
        selCountSpan.textContent = `${checkedBoxes.length} selected`;
        selCountSpan.style.display = "inline";
        delSelectedBtn.textContent = `Delete Selected (${checkedBoxes.length})`;
        delSelectedBtn.style.display = "inline-flex";
        selectAllBtn.textContent = checkedBoxes.length === visibleCheckboxes.length ? "Deselect All" : "Select All";
      } else {
        selCountSpan.style.display = "none";
        delSelectedBtn.style.display = "none";
        selectAllBtn.textContent = "Select All";
      }
    };

    selectAllBtn.onclick = (e) => {
      e.stopPropagation();
      const visibleItems = [...itemsContainer.querySelectorAll(".author-quote-item")].filter(
        (it) => it.style.display !== "none"
      );
      const visibleCheckboxes = visibleItems.map((it) => it.querySelector(".author-quote-cb")).filter(Boolean);
      const allChecked = visibleCheckboxes.length > 0 && visibleCheckboxes.every((cb) => cb.checked);
      visibleCheckboxes.forEach((cb) => (cb.checked = !allChecked));
      updateSelectionUI();
    };

    delSelectedBtn.onclick = (e) => {
      e.stopPropagation();
      const checkedItems = [...itemsContainer.querySelectorAll(".author-quote-item")].filter((item) => {
        const cb = item.querySelector(".author-quote-cb");
        return cb && cb.checked;
      });
      if (!checkedItems.length) return;

      if (confirm(`Delete ${checkedItems.length} selected quote${checkedItems.length === 1 ? "" : "s"}?`)) {
        let myQuotesChanged = false;
        let settingsChanged = false;

        checkedItems.forEach((item) => {
          const type = item.dataset.type;
          const rawText = item.dataset.text;
          if (type === "custom") {
            const idx = MY_QUOTES.findIndex(
              (q) => normalizeAuthorName(q.author) === norm && (q.text || "").trim() === rawText
            );
            if (idx !== -1) {
              MY_QUOTES.splice(idx, 1);
              myQuotesChanged = true;
            }
          } else if (type === "builtin") {
            const normKey = normalizeQuoteText(rawText);
            if (!settings.excludedQuotes.includes(normKey)) {
              settings.excludedQuotes.push(normKey);
              settingsChanged = true;
            }
          }
        });

        if (myQuotesChanged) saveMyQuotes();
        if (settingsChanged) saveSettings();

        buildCategoryRows();
        updateAuthorDatalist();
        updateQuoteStats();
        newQuote(true);
      }
    };

    // Filter listener
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();
      let matchCount = 0;
      const items = itemsContainer.querySelectorAll(".author-quote-item");
      items.forEach((it) => {
        const text = (it.dataset.text || "").toLowerCase();
        const matches = !q || text.includes(q);
        it.style.display = matches ? "flex" : "none";
        if (matches) matchCount++;
      });
      emptyFilterMsg.style.display = (items.length > 0 && matchCount === 0) ? "block" : "none";
      updateSelectionUI();
    });

    // Custom quotes items
    authorCustomQuotes.forEach((q) => {
      const rawText = (q.text || "").trim();
      const item = document.createElement("div");
      item.className = "author-quote-item";
      item.dataset.type = "custom";
      item.dataset.text = rawText;

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "author-quote-cb";
      cb.title = "Select quote";
      cb.onclick = (e) => {
        e.stopPropagation();
        updateSelectionUI();
      };

      const textEl = document.createElement("p");
      textEl.className = "author-quote-text";
      textEl.textContent = `“${rawText}”`;

      const pill = document.createElement("span");
      pill.className = "author-quote-pill";
      pill.textContent = "Custom";

      const delBtn = document.createElement("button");
      delBtn.className = "author-quote-del";
      delBtn.innerHTML = "×";
      delBtn.title = "Delete this quote";
      delBtn.onclick = (e) => {
        e.stopPropagation();
        const idx = MY_QUOTES.indexOf(q);
        if (idx !== -1) {
          MY_QUOTES.splice(idx, 1);
          saveMyQuotes();
          buildCategoryRows();
          updateAuthorDatalist();
          updateQuoteStats();
          newQuote(true);
        }
      };

      item.append(cb, textEl, pill, delBtn);
      itemsContainer.appendChild(item);
    });

    // Built-in quotes items
    activeBuiltinQuotes.forEach((q) => {
      const rawText = String(q[0] || "").trim();
      const item = document.createElement("div");
      item.className = "author-quote-item";
      item.dataset.type = "builtin";
      item.dataset.text = rawText;

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "author-quote-cb";
      cb.title = "Select quote";
      cb.onclick = (e) => {
        e.stopPropagation();
        updateSelectionUI();
      };

      const textEl = document.createElement("p");
      textEl.className = "author-quote-text";
      textEl.textContent = `“${rawText}”`;

      const delBtn = document.createElement("button");
      delBtn.className = "author-quote-del";
      delBtn.innerHTML = "×";
      delBtn.title = "Delete this quote";
      delBtn.onclick = (e) => {
        e.stopPropagation();
        const normKey = normalizeQuoteText(rawText);
        settings.excludedQuotes = [...(settings.excludedQuotes || []), normKey];
        saveSettings();
        buildCategoryRows();
        updateQuoteStats();
        newQuote(true);
      };

      item.append(cb, textEl, delBtn);
      itemsContainer.appendChild(item);
    });

    // Empty notice if all quotes removed
    if (count === 0) {
      const noQuotesMsg = document.createElement("div");
      noQuotesMsg.className = "author-empty-notice";
      noQuotesMsg.textContent = "All quotes in this collection have been removed.";
      itemsContainer.appendChild(noQuotesMsg);
    }

    drawer.appendChild(itemsContainer);
    row.appendChild(drawer);

    // Toggle expand / collapse
    header.addEventListener("click", () => {
      row.classList.toggle("expanded");
    });

    wrap.appendChild(row);
  });
}

function renderMyQuotes() {
  updateAuthorDatalist();
  buildCategoryRows();
  updateQuoteStats();
}

$("quoteShuffle").addEventListener("click", (e) => { e.stopPropagation(); shuffleQuote(); });

// Open inline "+ Add Quote" drawer
$("openAddQuoteBtn")?.addEventListener("click", () => {
  const drawer = $("addQuoteDrawer");
  if (!drawer) return;
  const isHidden = drawer.style.display === "none" || !drawer.style.display;
  drawer.style.display = isHidden ? "block" : "none";
  if (isHidden) {
    const input = $("newQuoteText");
    if (input) {
      input.value = "";
      input.focus();
    }
  }
});

// Cancel inline "+ Add Quote" drawer
$("cancelNewQuoteBtn")?.addEventListener("click", () => {
  const drawer = $("addQuoteDrawer");
  if (drawer) drawer.style.display = "none";
  if ($("newQuoteText")) $("newQuoteText").value = "";
  if ($("newQuoteAuthor")) $("newQuoteAuthor").value = "";
});

// Save from inline "+ Add Quote" drawer
$("saveNewQuoteBtn")?.addEventListener("click", () => {
  const textEl = $("newQuoteText");
  const authorEl = $("newQuoteAuthor");
  const text = textEl ? textEl.value.trim() : "";
  const author = authorEl ? authorEl.value.trim() : "";

  if (!text) {
    alert("Please enter a quote text.");
    if (textEl) textEl.focus();
    return;
  }

  const finalAuthor = author || "Unknown Author";
  MY_QUOTES.push({ text, author: finalAuthor });
  saveMyQuotes();

  const norm = normalizeAuthorName(finalAuthor);
  const currentEnabled = (settings.quoteCats || []).map(normalizeAuthorName);
  if (!currentEnabled.includes(norm)) {
    settings.quoteCats = [...currentEnabled, norm];
    saveSettings();
  }

  buildCategoryRows();
  updateAuthorDatalist();
  updateQuoteStats();
  newQuote(false);

  // Close drawer and reset inputs
  const drawer = $("addQuoteDrawer");
  if (drawer) drawer.style.display = "none";
  if (textEl) textEl.value = "";
  if (authorEl) authorEl.value = "";
});

// Import complete files containing multiple quotes from multiple authors
$("importQuotesBtn")?.addEventListener("click", () => {
  $("quoteFileInput")?.click();
});

$("quoteFileInput")?.addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const raw = (reader.result || "").trim();
      let imported = [];

      // 1. JSON parsing
      if (file.name.endsWith(".json") || raw.startsWith("[") || raw.startsWith("{")) {
        const parsed = JSON.parse(raw);
        let items = [];
        if (Array.isArray(parsed)) {
          items = parsed;
        } else if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.quotes)) items = parsed.quotes;
          else if (Array.isArray(parsed.myQuotes)) items = parsed.myQuotes;
          else {
            // Dictionary where key is author and value is array of quotes
            Object.entries(parsed).forEach(([authorName, quoteList]) => {
              if (Array.isArray(quoteList)) {
                quoteList.forEach((q) => {
                  items.push({ text: typeof q === "string" ? q : q.text || q.quote, author: authorName });
                });
              }
            });
          }
        }

        items.forEach((item) => {
          if (Array.isArray(item) && item.length >= 1) {
            imported.push({
              text: String(item[0] || "").trim(),
              author: String(item[1] || "").trim() || "Unknown Author",
            });
          } else if (item && typeof item === "object" && (item.text || item.quote)) {
            imported.push({
              text: String(item.text || item.quote || "").trim(),
              author: String(item.author || item.by || item.category || "").trim() || "Unknown Author",
            });
          }
        });
      } else {
        // 2. CSV / TSV or Line-based text
        const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        lines.forEach((line, lineIdx) => {
          const delimiter = line.includes("\t") ? "\t" : line.includes(",") ? "," : null;
          if (delimiter) {
            // Simple CSV split with quote stripping
            const parts = line.split(delimiter).map((p) => p.trim().replace(/^["'](.*)["']$/, "$1").trim());
            if (lineIdx === 0 && ["quote", "text"].includes(parts[0].toLowerCase())) return;
            if (parts[0]) {
              imported.push({
                text: parts[0],
                author: parts[1] || parts[2] || "Unknown Author",
              });
            }
          } else {
            // Text matching "Quote" — Author or Quote - Author
            const match = line.match(/^["“]?(.*?)["”]?(?:\s+[—–~-]\s+(.*))?$/);
            if (match && match[1] && match[1].trim()) {
              imported.push({
                text: match[1].trim(),
                author: (match[2] || "").trim() || "Unknown Author",
              });
            }
          }
        });
      }

      if (!imported.length) {
        alert("No valid quotes found in the selected file.");
        return;
      }

      let addedCount = 0;
      const authorSummary = new Map();
      const existingTexts = new Set(MY_QUOTES.map((q) => (q.text || "").toLowerCase().trim()));

      imported.forEach((q) => {
        const key = (q.text || "").toLowerCase().trim();
        if (key && !existingTexts.has(key)) {
          existingTexts.add(key);
          const authorName = (q.author || "").trim() || "Unknown Author";
          const norm = normalizeAuthorName(authorName);

          MY_QUOTES.push({
            text: q.text.trim(),
            author: authorName,
          });
          addedCount++;

          authorSummary.set(norm, (authorSummary.get(norm) || 0) + 1);

          // Automatically enable new author toggle
          const currentEnabled = (settings.quoteCats || []).map(normalizeAuthorName);
          if (!currentEnabled.includes(norm)) {
            settings.quoteCats = [...currentEnabled, norm];
          }
        }
      });

      saveSettings();
      saveMyQuotes();
      buildCategoryRows();
      updateAuthorDatalist();
      updateQuoteStats();
      newQuote(true);

      const authorsListStr = [...authorSummary.entries()]
        .map(([auth, cnt]) => `• ${auth} (${cnt} quote${cnt === 1 ? "" : "s"})`)
        .join("\n");

      alert(`Successfully imported ${addedCount} new quote${addedCount === 1 ? "" : "s"} across ${authorSummary.size} author${authorSummary.size === 1 ? "" : "s"}!\n\n${authorsListStr}`);
    } catch (err) {
      alert("Could not import quotes. Please check that the file is valid JSON, CSV, or text.");
    } finally {
      e.target.value = "";
    }
  };
  reader.readAsText(file);
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
  const rot = getBgRotate(settings.bgType);
  let ms = 0;
  if (rot === "5min") ms = 5 * 60 * 1000;
  else if (rot === "15min") ms = 15 * 60 * 1000;
  else if (rot === "hour") ms = 60 * 60 * 1000;

  if (ms > 0) {
    bgRotateTimer = setInterval(() => {
      if (settings.bgType === "unsplash") {
        applyUnsplashWallpaper(true);
      } else if (settings.bgType === "photo") {
        applyWallpaper();
      } else {
        applySettings();
      }
    }, ms);
  }
}

/** An index that only changes as often as the rotation setting. */
function rotationIndex(count, type = settings.bgType) {
  if (count <= 0) return 0;
  const rot = getBgRotate(type);
  if (rot === "never") return 0;
  if (rot === "tab") {
    return TAB_ROTATION_SEED % count;
  }
  if (rot === "5min") {
    const bucket = Math.floor(Date.now() / (5 * 60 * 1000));
    return bucket % count;
  }
  if (rot === "15min") {
    const bucket = Math.floor(Date.now() / (15 * 60 * 1000));
    return bucket % count;
  }
  return hashString(rotationSeed(rot)) % count;
}

function setCredit(text, url) {
  const el = $("bgCredit");
  if (!el) return;
  el.textContent = text || "";
  if (url) el.href = url; else el.removeAttribute("href");
}

let activeWallpaperUrl = null;
let inFlightWallpaperUrl = null;
let wallpaperLoadSeq = 0;

function applyUnsplashWallpaper(bump = false) {
  const layer = $("photoLayer");
  const layerNext = $("photoLayerNext");
  if (!layer) return;
  const pool = UNSPLASH_COLLECTIONS[settings.unsplashCat] || UNSPLASH_COLLECTIONS.all;
  if (!pool || !pool.length) {
    revealApp();
    return;
  }

  if (bump) {
    currentUnsplashOffset = (currentUnsplashOffset + 1) % pool.length;
  }
  const unsplashRot = getBgRotate("unsplash");
  const idx = unsplashRot === "never"
    ? 0
    : (rotationIndex(pool.length, "unsplash") + currentUnsplashOffset) % pool.length;
  const item = pool[idx];
  const url = `https://images.unsplash.com/${item.id}?auto=format&fit=crop&w=2560&q=85`;

  const currentBg = layer.style.backgroundImage || "";
  const isAlreadySet = (activeWallpaperUrl === url) || (!bump && currentBg.includes(item.id));

  if (isAlreadySet) {
    activeWallpaperUrl = url;
    setCredit(`Photo by ${item.author} (Unsplash)`, item.link || "https://unsplash.com");
    applyAutoClockContrast(url);
    updateThemePreview(url, item.author ? `By ${item.author}` : "Unsplash HD", "Unsplash Photo");
    revealApp();
    return;
  }

  // Prevent duplicate concurrent requests for the same image
  if (!bump && inFlightWallpaperUrl === url) {
    return;
  }

  const thisSeq = ++wallpaperLoadSeq;
  inFlightWallpaperUrl = url;

  // If user explicitly requested next photo, preload and crossfade
  if (bump && layerNext && currentBg) {
    const preloader = new Image();
    preloader.onload = () => {
      if (thisSeq !== wallpaperLoadSeq) return;
      inFlightWallpaperUrl = null;
      activeWallpaperUrl = url;
      layerNext.style.backgroundImage = `url("${url}")`;
      layerNext.style.opacity = "1";
      try { localStorage.setItem("liquidtab_cached_bg", url); } catch (e) {}
      setCredit(`Photo by ${item.author} (Unsplash)`, item.link || "https://unsplash.com");
      applyAutoClockContrast(url);
      updateThemePreview(url, item.author ? `By ${item.author}` : "Unsplash HD", "Unsplash Photo");
      revealApp();

      setTimeout(() => {
        if (thisSeq !== wallpaperLoadSeq) return;
        layer.style.backgroundImage = `url("${url}")`;
        layerNext.style.opacity = "0";
      }, 520);
    };
    preloader.onerror = () => {
      if (thisSeq !== wallpaperLoadSeq) return;
      inFlightWallpaperUrl = null;
      revealApp();
    };
    preloader.src = url;
  } else {
    // Normal page load: keep loading screen up until image is 100% fetched and ready
    const preloader = new Image();
    preloader.onload = () => {
      if (thisSeq !== wallpaperLoadSeq) return;
      inFlightWallpaperUrl = null;
      activeWallpaperUrl = url;
      layer.style.backgroundImage = `url("${url}")`;
      try { localStorage.setItem("liquidtab_cached_bg", url); } catch (e) {}
      setCredit(`Photo by ${item.author} (Unsplash)`, item.link || "https://unsplash.com");
      applyAutoClockContrast(url);
      updateThemePreview(url, item.author ? `By ${item.author}` : "Unsplash HD", "Unsplash Photo");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          revealApp();
        });
      });
    };
    preloader.onerror = () => {
      if (thisSeq !== wallpaperLoadSeq) return;
      inFlightWallpaperUrl = null;
      const cached = localStorage.getItem("liquidtab_cached_bg");
      if (cached && !currentBg) {
        layer.style.backgroundImage = `url("${cached}")`;
        activeWallpaperUrl = cached;
      }
      revealApp();
    };
    preloader.src = url;
  }
}

function applyWallpaper() {
  const layer = $("photoLayer");
  if (!layer) return;

  setupBgRotateTimer();

  cleanEarlyBgStyle();

  if (settings.bgType === "unsplash") {
    applyUnsplashWallpaper(false);
    return;
  }

  if (settings.bgType !== "photo") {
    activeWallpaperUrl = null;
    inFlightWallpaperUrl = null;
    wallpaperLoadSeq++;
    layer.style.backgroundImage = "";
    const layerNext = $("photoLayerNext");
    if (layerNext) {
      layerNext.style.backgroundImage = "";
      layerNext.style.opacity = "0";
    }
    setCredit("");
    revealApp();
    return;
  }

  setCredit("");
  allPhotos().then((photos) => {
    if (!photos.length) {
      activeWallpaperUrl = null;
      inFlightWallpaperUrl = null;
      layer.style.backgroundImage = "";
      revealApp();
      return;
    }
    const rec = getBgRotate("photo") === "never"
      ? (photos.find((p) => p.id === settings.photoId) || photos[0])
      : photos[rotationIndex(photos.length, "photo")];

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
      const thisSeq = ++wallpaperLoadSeq;
      inFlightWallpaperUrl = photoSrc;
      const img = new Image();
      img.onload = img.onerror = () => {
        if (thisSeq !== wallpaperLoadSeq) return;
        inFlightWallpaperUrl = null;
        activeWallpaperUrl = photoSrc;
        layer.style.backgroundImage = `url("${photoSrc}")`;
        applyAutoClockContrast(photoSrc);
        updateThemePreview(photoSrc, rec.name || "Custom Photo", "Your Photo");
        requestAnimationFrame(revealApp);
      };
      img.src = photoSrc;
    } else {
      revealApp();
    }
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
  if (settings.bgType === "solid" || settings.bgType === "gradient") {
    requestAnimationFrame(() => {
      setTimeout(revealApp, 40);
    });
  }
  // Safety timeout only if network completely drops (5 seconds max)
  setTimeout(revealApp, 5000);
}

$("optBgRotate")?.addEventListener("change", (e) => {
  setBgRotate(e.target.value, settings.bgType);
  if (settings.bgType === "unsplash" || settings.bgType === "photo") {
    applyWallpaper();
  } else {
    applySettings();
  }
});
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

    // Fetch as blob to prevent cross-origin canvas security errors (use small thumbnail for instant sampling)
    const fetchUrl = (typeof url === "string" && url.includes("images.unsplash.com"))
      ? url.split("?")[0] + "?w=140&q=50&auto=format&fit=crop"
      : url;

    fetch(fetchUrl)
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
    const activeSolid = getBgRotate("solid") !== "never"
      ? randomDarkSolidColor()
      : settings.solidColor;
    finish(hexLuminance(activeSolid) > 0.45);
    return;
  }

  if (settings.bgType === "photo" || settings.bgType === "bing" || settings.bgType === "unsplash") {
    const url = directUrl || currentWallpaperUrl();
    if (url) {
      sampleImageLuminance(url)
        .then((lum) => finish(lum > 0.65))
        .catch(() => finish(false));
      return;
    }
  }

  // Gradient themes
  if (resolvedMode() === "light") {
    finish(true);
  } else {
    const activeTheme = (settings.bgType === "gradient" && getBgRotate("gradient") !== "never")
      ? GRADIENT_THEMES[rotationIndex(GRADIENT_THEMES.length, "gradient")]
      : (settings.bg || "green");
    const lum = THEME_LUMINANCE[activeTheme] !== undefined ? THEME_LUMINANCE[activeTheme] : 0.2;
    finish(lum > 0.55);
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
