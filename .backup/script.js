/* ============================================================
   Liquid Tab
   ============================================================ */

const $ = (id) => document.getElementById(id);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// Outside an installed extension (e.g. opening index.html directly) the
// chrome.storage API is absent — fall back to localStorage so the page still runs.
if (typeof chrome === "undefined" || !chrome.storage) {
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

// ---- Defaults ----
const DEFAULT_SHORTCUTS = [
  { name: "Google", url: "https://google.com" },
  { name: "YouTube", url: "https://youtube.com" },
  { name: "Gmail", url: "https://mail.google.com" },
  { name: "Drive", url: "https://drive.google.com" },
  { name: "GitHub", url: "https://github.com" },
];

const DEFAULTS = {
  userName: "",
  greetStyle: "timeofday",
  showGreeting: true,
  showClock: true,
  showDate: true,
  use24hr: false,
  showSeconds: true,
  showSearch: true,
  engine: "google",
  showNotes: true,
  showWeather: true,
  unit: "celsius",
  bg: "green",
  scale: "default",
  clockFont: "default",
  clockColor: "gradient",
  tint: 100,
  blur: 32,
  grain: true,
  lowPerf: false,
};

let settings = { ...DEFAULTS };
let SHORTCUTS = DEFAULT_SHORTCUTS.map((s) => ({ ...s }));

const THEMES = {
  green:  "Verdant",
  blue:   "Deep Sea",
  purple: "Nebula",
  sunset: "Ember",
  rose:   "Blossom",
  mono:   "Graphite",
  dark:   "Midnight",
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

const GLASS_MARK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
  <circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>
</svg>`;

// ============================================================
// Persistence
// ============================================================
const saveSettings  = () => chrome.storage.local.set({ settings });
const saveShortcuts = () => chrome.storage.local.set({ shortcuts: SHORTCUTS });

function loadState() {
  chrome.storage.local.get(["settings", "shortcuts", "notes"], (result) => {
    if (result.settings) settings = { ...DEFAULTS, ...result.settings };
    if (Array.isArray(result.shortcuts)) SHORTCUTS = result.shortcuts;
    if (result.notes) {
      $("notesArea").value = result.notes;
      updateNotesCount();
    }
    syncControls();
    applySettings();
    renderShortcuts();
    renderShortcutList();
  });
}

// ============================================================
// Apply settings to the page
// ============================================================
function applySettings() {
  const body = document.body;
  const theme = THEMES[settings.bg] ? settings.bg : "green";

  body.dataset.theme      = theme;
  body.dataset.scale      = settings.scale;
  body.dataset.clockFont  = settings.clockFont;
  body.dataset.clockColor = settings.clockColor;
  body.dataset.grain      = settings.grain ? "on" : "off";
  body.dataset.lowperf    = settings.lowPerf ? "on" : "off";

  body.dataset.hideClock  = settings.showClock ? "" : "1";
  body.dataset.hideDate   = settings.showDate ? "" : "1";
  body.dataset.hideSearch = settings.showSearch ? "" : "1";

  body.style.setProperty("--tint", settings.tint / 100);
  body.style.setProperty("--blur-px", `${settings.blur}px`);

  $("weatherCard").style.display = settings.showWeather ? "" : "none";
  $("notesCard").style.display   = settings.showNotes ? "" : "none";
  $("greeting").style.display    = settings.showGreeting ? "" : "none";

  $("engineIcon").innerHTML = settings.engine === "google" ? GOOGLE_MARK : GLASS_MARK;
  $("searchInput").placeholder = `Search with ${ENGINES[settings.engine].name}`;

  $("themeName").textContent = THEMES[theme];
  $$("#bgSwatches .dot").forEach((d) => d.classList.toggle("active", d.dataset.bg === theme));
  $$("#clockColors .dot").forEach((d) => d.classList.toggle("active", d.dataset.cc === settings.clockColor));
  $$("#scaleTiles .sw-tile").forEach((t) => t.classList.toggle("active", t.dataset.scale === settings.scale));

  updateProfile();
  updateClock();
}

/** Push stored values into every settings control. */
function syncControls() {
  const set = (id, prop, val) => { const el = $(id); if (el) el[prop] = val; };
  set("optName", "value", settings.userName);
  set("optGreetStyle", "value", settings.greetStyle);
  set("optGreeting", "checked", settings.showGreeting);
  set("optClock", "checked", settings.showClock);
  set("opt24hr", "checked", settings.use24hr);
  set("optSeconds", "checked", settings.showSeconds);
  set("optDate", "checked", settings.showDate);
  set("optLowPerf", "checked", settings.lowPerf);
  set("optSearch", "checked", settings.showSearch);
  set("optEngine", "value", settings.engine);
  set("optNotes", "checked", settings.showNotes);
  set("optWeather", "checked", settings.showWeather);
  set("optUnit", "value", settings.unit);
  set("optClockFont", "value", settings.clockFont);
  set("optTint", "value", settings.tint);
  set("optBlur", "value", settings.blur);
  set("optGrain", "checked", settings.grain);
}

function updateProfile() {
  const name = settings.userName.trim();
  const nameEl = $("swProfileName");
  nameEl.textContent = name || "Set your name";
  nameEl.classList.toggle("unset", !name);
  $("swAvatar").textContent = name ? name[0] : "?";
}

// ============================================================
// Clock + date + greeting
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

function updateClock() {
  const now = new Date();
  let h = now.getHours();
  let meridiem = "";

  if (!settings.use24hr) {
    meridiem = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
  }

  $("clockMain").textContent = `${String(h).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  $("clockSec").textContent = settings.showSeconds ? String(now.getSeconds()).padStart(2, "0") : "";
  $("clockMeridiem").textContent = meridiem;

  $("date").textContent = now.toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });

  const name = settings.userName.trim();
  const base = greetingFor(now.getHours());
  $("greetingText").textContent = name ? `${base}, ${name}` : base;
}
setInterval(updateClock, 1000);

// ============================================================
// Weather — Open-Meteo (no API key required)
// ============================================================
const WX = {
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
      <circle cx="12" cy="12" r="4.2" fill="rgba(255,255,255,.22)"/>
      <g class="wx-spin"><path d="M12 1.8v2.4M12 19.8v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M1.8 12h2.4M19.8 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7"/></g>
    </svg>`,
  partly: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="8.4" cy="8" r="3.1" fill="rgba(255,255,255,.22)"/>
      <g class="wx-spin" style="transform-origin:8.4px 8px"><path d="M8.4 2.4v1.4M8.4 12.2v1.4M3.7 3.3l1 1M12.1 11.7l1 1M2 8h1.4M13.4 8h1.4M3.7 12.7l1-1M12.1 4.3l1-1"/></g>
      <path d="M8 19.6h9.2a3.4 3.4 0 0 0 .3-6.8 4.6 4.6 0 0 0-8.9-1.1A3.9 3.9 0 0 0 8 19.6z" fill="rgba(255,255,255,.16)"/>
    </svg>`,
  cloud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6.8 19h10.4a3.8 3.8 0 0 0 .4-7.6 5.2 5.2 0 0 0-10-1.3A4.3 4.3 0 0 0 6.8 19z" fill="rgba(255,255,255,.18)"/>
    </svg>`,
  fog: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6.8 15.5h10.4a3.8 3.8 0 0 0 .4-7.6 5.2 5.2 0 0 0-10-1.3 4.3 4.3 0 0 0-.8 8.9z" fill="rgba(255,255,255,.16)"/>
      <path d="M4 19h16M6.5 22h11" opacity=".65"/>
    </svg>`,
  rain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6.8 15.2h10.4a3.8 3.8 0 0 0 .4-7.6 5.2 5.2 0 0 0-10-1.3 4.3 4.3 0 0 0-.8 8.9z" fill="rgba(255,255,255,.18)"/>
      <path class="wx-drop" d="M8.6 18v2.4"/><path class="wx-drop" d="M12 18.4v2.8"/><path class="wx-drop" d="M15.4 18v2.4"/>
    </svg>`,
  snow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6.8 14.8h10.4a3.8 3.8 0 0 0 .4-7.6 5.2 5.2 0 0 0-10-1.3 4.3 4.3 0 0 0-.8 8.9z" fill="rgba(255,255,255,.18)"/>
      <g class="wx-drop"><path d="M8.6 18.2v2.6M7.5 18.9l2.2 1.2M9.7 18.9l-2.2 1.2"/></g>
      <g class="wx-drop"><path d="M15.4 18.2v2.6M14.3 18.9l2.2 1.2M16.5 18.9l-2.2 1.2"/></g>
    </svg>`,
  storm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6.8 14.6h10.4a3.8 3.8 0 0 0 .4-7.6 5.2 5.2 0 0 0-10-1.3 4.3 4.3 0 0 0-.8 8.9z" fill="rgba(255,255,255,.18)"/>
      <path class="wx-bolt" d="M13.2 15.8 10 19.4h3.2l-1.4 3.2" fill="none"/>
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

let lastCoords = null;

function loadWeather(lat, lon) {
  lastCoords = { lat, lon };
  const unit = settings.unit === "fahrenheit" ? "&temperature_unit=fahrenheit" : "";
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min` +
    `&forecast_days=1&timezone=auto${unit}`;

  fetch(url)
    .then((r) => r.json())
    .then((data) => {
      const [icon, label] = WX_MAP[data.current.weather_code] || [WX.partly, "Cloudy"];
      $("weatherTemp").innerHTML = `${Math.round(data.current.temperature_2m)}<span class="deg">&deg;</span>`;
      $("weatherIcon").innerHTML = icon;
      $("weatherCond").textContent = label;

      // Open-Meteo returns the resolved IANA zone (e.g. "Africa/Lagos") — use it
      // as a city label so we avoid calling a third-party geocoder.
      const city = (data.timezone || "").split("/").pop().replace(/_/g, " ");
      $("weatherCity").textContent = city || "Your Location";

      if (data.daily) {
        $("weatherHilo").textContent =
          `H:${Math.round(data.daily.temperature_2m_max[0])}°  L:${Math.round(data.daily.temperature_2m_min[0])}°`;
      }
    })
    .catch(() => failWeather("Unavailable", "Check connection"));
}

function failWeather(cond, city) {
  $("weatherTemp").innerHTML = "&mdash;";
  $("weatherCond").textContent = cond;
  $("weatherCity").textContent = city;
  $("weatherHilo").textContent = "";
  $("weatherIcon").innerHTML = WX.cloud;
}

function initWeather() {
  $("weatherIcon").innerHTML = WX.partly;
  if (!navigator.geolocation) return failWeather("Unsupported", "No geolocation");
  navigator.geolocation.getCurrentPosition(
    (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude),
    () => failWeather("Location off", "Enable location")
  );
}

// ============================================================
// Notes
// ============================================================
const notesArea = $("notesArea");
let savedTimer;

function updateNotesCount() {
  const n = notesArea.value.length;
  $("notesCount").textContent = `${n} character${n === 1 ? "" : "s"}`;
}

notesArea.addEventListener("input", () => {
  chrome.storage.local.set({ notes: notesArea.value });
  updateNotesCount();
  const flag = $("notesSaved");
  flag.classList.add("show");
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => flag.classList.remove("show"), 1200);
});

$("clearNotes").addEventListener("click", () => {
  notesArea.value = "";
  chrome.storage.local.set({ notes: "" });
  updateNotesCount();
  notesArea.focus();
});

// ============================================================
// Search
// ============================================================
$("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = $("searchInput").value.trim();
  if (q) window.location.href = ENGINES[settings.engine].url + encodeURIComponent(q);
});

// ============================================================
// Dock
// ============================================================
const FALLBACK_COLORS = ["#4285F4","#EA4335","#FBBC05","#34A853","#8E44AD","#16A085","#E67E22"];
const faviconFor = (url, size = 64) =>
  `https://www.google.com/s2/favicons?sz=${size}&domain_url=${encodeURIComponent(url)}`;

function renderShortcuts() {
  const dock = $("dock");
  dock.querySelectorAll("a:not(#settingsBtn)").forEach((el) => el.remove());
  const divider = dock.querySelector(".dock-divider");

  SHORTCUTS.forEach((s, i) => {
    const a = document.createElement("a");
    a.href = s.url;
    a.dataset.label = s.name || s.url;

    const img = document.createElement("img");
    img.src = faviconFor(s.url);
    img.alt = s.name;
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
    img.src = faviconFor(s.url, 32);
    img.alt = "";
    img.onerror = () => {
      const fb = document.createElement("span");
      fb.className = "sc-fallback";
      fb.textContent = ((s.name || "?").trim()[0] || "?").toUpperCase();
      fb.style.background = FALLBACK_COLORS[i % FALLBACK_COLORS.length];
      img.replaceWith(fb);
    };

    const nameField = document.createElement("label");
    nameField.className = "sc-field";
    nameField.innerHTML = TAG_SVG;
    const nameIn = document.createElement("input");
    nameIn.type = "text";
    nameIn.value = s.name;
    nameIn.placeholder = "Name";
    nameIn.addEventListener("input", () => {
      SHORTCUTS[i].name = nameIn.value;
      saveShortcuts();
      renderShortcuts();
    });
    nameField.appendChild(nameIn);

    const urlField = document.createElement("label");
    urlField.className = "sc-field";
    urlField.innerHTML = LINK_SVG;
    const urlIn = document.createElement("input");
    urlIn.type = "text";
    urlIn.value = s.url;
    urlIn.placeholder = "https://…";
    urlIn.addEventListener("input", () => {
      SHORTCUTS[i].url = urlIn.value;
      saveShortcuts();
      renderShortcuts();
    });
    urlIn.addEventListener("blur", () => {
      const v = urlIn.value.trim();
      if (v && !/^https?:\/\//i.test(v)) {
        SHORTCUTS[i].url = urlIn.value = `https://${v}`;
        saveShortcuts();
        renderShortcuts();
        renderShortcutList();
      }
    });
    urlField.appendChild(urlIn);

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
const openSettings  = () => overlay.classList.add("open");
const closeSettings = () => overlay.classList.remove("open");

$("settingsBtn").addEventListener("click", (e) => { e.preventDefault(); openSettings(); });
$("tlClose").addEventListener("click", closeSettings);
$("tlMin").addEventListener("click", () => $("settingsWindow").classList.toggle("no-sidebar"));
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeSettings(); });

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

// segmented Widgets / Dock control
function selectTab(tab) {
  $$("#wdSegment button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  $$('.sw-pane[data-pane="widgets"] .sw-tab').forEach((t) =>
    t.classList.toggle("active", t.dataset.tab === tab));
}
$$("#wdSegment button").forEach((btn) => {
  btn.addEventListener("click", () => selectTab(btn.dataset.tab));
});

// ---- generic binding helpers ----
function bindToggle(id, key) {
  const el = $(id);
  if (!el) return;
  el.addEventListener("change", () => { settings[key] = el.checked; applySettings(); saveSettings(); });
}
function bindValue(id, key, transform = (v) => v) {
  const el = $(id);
  if (!el) return;
  el.addEventListener("input", () => { settings[key] = transform(el.value); applySettings(); saveSettings(); });
}

bindToggle("optGreeting", "showGreeting");
bindToggle("optClock", "showClock");
bindToggle("opt24hr", "use24hr");
bindToggle("optSeconds", "showSeconds");
bindToggle("optDate", "showDate");
bindToggle("optLowPerf", "lowPerf");
bindToggle("optSearch", "showSearch");
bindToggle("optNotes", "showNotes");
bindToggle("optWeather", "showWeather");
bindToggle("optGrain", "grain");

bindValue("optName", "userName");
bindValue("optGreetStyle", "greetStyle");
bindValue("optEngine", "engine");
bindValue("optClockFont", "clockFont");
bindValue("optTint", "tint", Number);
bindValue("optBlur", "blur", Number);

// temperature unit needs a weather refetch
$("optUnit").addEventListener("input", () => {
  settings.unit = $("optUnit").value;
  saveSettings();
  if (lastCoords) loadWeather(lastCoords.lat, lastCoords.lon);
});

// theme, clock colour and interface-size pickers
$$("#bgSwatches .dot").forEach((dot) => {
  dot.addEventListener("click", () => { settings.bg = dot.dataset.bg; applySettings(); saveSettings(); });
});
$$("#clockColors .dot").forEach((dot) => {
  dot.addEventListener("click", () => { settings.clockColor = dot.dataset.cc; applySettings(); saveSettings(); });
});
$$("#scaleTiles .sw-tile").forEach((tile) => {
  tile.addEventListener("click", () => { settings.scale = tile.dataset.scale; applySettings(); saveSettings(); });
});

// ---- resets ----
$("resetWidgets").addEventListener("click", () => {
  ["showGreeting","showClock","showDate","use24hr","showSeconds","showSearch",
   "engine","showNotes","showWeather","unit"].forEach((k) => { settings[k] = DEFAULTS[k]; });
  syncControls();
  applySettings();
  saveSettings();
  if (lastCoords) loadWeather(lastCoords.lat, lastCoords.lon);
});

$("resetDock").addEventListener("click", () => {
  SHORTCUTS = DEFAULT_SHORTCUTS.map((s) => ({ ...s }));
  saveShortcuts();
  renderShortcuts();
  renderShortcutList();
});

$("resetAll").addEventListener("click", () => {
  settings = { ...DEFAULTS };
  SHORTCUTS = DEFAULT_SHORTCUTS.map((s) => ({ ...s }));
  saveSettings();
  saveShortcuts();
  syncControls();
  applySettings();
  renderShortcuts();
  renderShortcutList();
  if (lastCoords) loadWeather(lastCoords.lat, lastCoords.lon);
});

// ============================================================
// Settings search
// ============================================================
const PANE_TITLES = {
  general: "General", widgets: "Widgets & Dock", display: "Display",
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
  // a hit inside the Dock tab needs that tab shown before it can scroll into view
  const tab = hit.row.closest(".sw-tab");
  if (tab) selectTab(tab.dataset.tab);
  hit.row.scrollIntoView({ behavior: "smooth", block: "center" });
  hit.row.classList.remove("flash");
  void hit.row.offsetWidth; // restart the highlight animation
  hit.row.classList.add("flash");
}

function runSearch(raw) {
  const q = raw.trim().toLowerCase();
  if (!q) { showPane("general"); return; }

  if (!searchIndex.length) searchIndex = buildSearchIndex();
  const hits = searchIndex.filter((e) => e.label.toLowerCase().includes(q));

  const list = $("resultsList");
  list.innerHTML = "";
  $("resultsTitle").textContent = hits.length
    ? `${hits.length} result${hits.length === 1 ? "" : "s"}`
    : "No results";

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
// Notification bell
// ============================================================
$("notifBtn").addEventListener("click", () => {
  const btn = $("notifBtn");
  btn.classList.remove("ring");
  void btn.offsetWidth; // restart the animation
  btn.classList.add("ring");
});

// ============================================================
// Cursor-tracked specular sheen + background parallax
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
  if (settings.lowPerf) return;
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
  if (e.key === "/" && !typing) {
    e.preventDefault();
    $("searchInput").focus();
    return;
  }
  if (e.key === "," && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    overlay.classList.contains("open") ? closeSettings() : openSettings();
  }
});

// ============================================================
// Boot
// ============================================================
updateClock();
initWeather();
loadState();
