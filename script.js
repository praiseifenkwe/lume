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
  showQuote: true, quoteSource: "builtin", quoteRotate: "day", quoteCats: [...ALL_CATS],
  showWeather: true, unit: "celsius", manualLocation: null,
  showCalendar: false,
  mode: "dark",
  bg: "green", bgType: "gradient", solidColor: "#101418", photoId: null,
  unsplashCat: "all",
  bgRotate: "never", depth: false, parallax: true,
  tint: 10, blur: 10, grain: true,
  scale: "default", clockFont: "default", clockColor: "auto", clockCustomColor: "#ffffff",
  snap: true, positions: {},
  lowPerf: false,
};

let settings  = { ...DEFAULTS };
let SHORTCUTS = DEFAULT_SHORTCUTS.map((s) => ({ ...s }));
let MY_QUOTES = [];

const THEMES = {
  green: "Verdant", blue: "Deep Sea", purple: "Nebula", sunset: "Ember",
  rose: "Blossom", mono: "Graphite", dark: "Midnight",
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

// Synchronously prime settings from localStorage cache to prevent flash
try {
  const cached = localStorage.getItem("liquidtab_cached_settings") || localStorage.getItem("liquidtab:settings");
  if (cached) {
    const s = JSON.parse(cached);
    settings = { ...DEFAULTS, ...s };
  }
} catch(e) {}

// ============================================================
// Persistence
// ============================================================
const saveSettings  = () => {
  chrome.storage.local.set({ settings });
  try { localStorage.setItem("liquidtab_cached_settings", JSON.stringify(settings)); } catch(e) {}
};
const saveShortcuts = () => chrome.storage.local.set({ shortcuts: SHORTCUTS });
const saveMyQuotes  = () => chrome.storage.local.set({ myQuotes: MY_QUOTES });

function loadState() {
  chrome.storage.local.get(["settings", "shortcuts", "myQuotes"], (result) => {
    if (result.settings) settings = { ...DEFAULTS, ...result.settings };
    if (!settings.layoutPreset) {
      settings.showQuote = true;
      settings.showCalendar = false;
      settings.positions = {};
      settings.layoutPreset = "clean-default";
      saveSettings();
    }
    if (Array.isArray(result.shortcuts)) SHORTCUTS = result.shortcuts;
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
    initCalendar();
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
  body.dataset.clockFont  = ["default", "wide", "serif", "mono"].includes(settings.clockFont)
                           ? settings.clockFont : "default";
  body.dataset.clockColor = settings.clockColor;
  body.style.setProperty("--clock-custom-color", settings.clockCustomColor);
  body.dataset.grain      = settings.grain ? "on" : "off";
  body.dataset.depth      = settings.depth ? "on" : "off";
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
  } else {
    body.style.removeProperty("--base");
  }
  applyWallpaper();

  // widget visibility
  const vis = {
    quoteCard: settings.showQuote,
    weatherCard: settings.showWeather,
    calCard: settings.showCalendar,
    island: settings.showIsland,
  };
  Object.entries(vis).forEach(([id, on]) => {
    const el = $(id);
    if (el) el.style.display = on ? "" : "none";
  });

  $("engineIcon").innerHTML = settings.engine === "google" ? GOOGLE_MARK : GLASS_MARK;
  $("searchInput").placeholder = `Search ${ENGINES[settings.engine].name}`;

  // settings-window reflections
  $("themeName").textContent = settings.bgType === "photo" ? "Custom Photo"
                             : settings.bgType === "solid" ? settings.solidColor.toUpperCase()
                             : settings.bgType === "unsplash" ? "Unsplash HD"
                             : settings.bgType === "bing" ? "Bing Daily"
                             : THEMES[theme];
  $("themeKind").textContent = settings.bgType === "photo" ? "Your photo"
                             : settings.bgType === "solid" ? "Solid colour"
                             : settings.bgType === "unsplash" ? "Random HD"
                             : settings.bgType === "bing" ? "Daily photo" : "Gradient";
  $("optSolidHex").textContent = settings.solidColor.toUpperCase();

  $$("#bgSwatches .dot").forEach((d) => d.classList.toggle("active", d.dataset.bg === theme));
  $$("#clockColors .dot").forEach((d) => d.classList.toggle("active", d.dataset.cc === settings.clockColor));
  $$("#scaleTiles .sw-tile").forEach((t) => t.classList.toggle("active", t.dataset.scale === settings.scale));
  $$("#modeTiles .sw-tile").forEach((t) => t.classList.toggle("active", t.dataset.mode === settings.mode));
  $$("#bgSegment button").forEach((b) => b.classList.toggle("active", b.dataset.bgtype === settings.bgType));
  $$(".bg-tab").forEach((t) => t.classList.toggle("active", t.dataset.bgtype === settings.bgType));

  updateProfile();
  updateQuoteStats();
  updateDepthUI();
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
  set("optBgRotate", "value", settings.bgRotate);
  set("optDepth", "checked", settings.depth);
  set("optParallax", "checked", settings.parallax);
  $$("#quoteCats input").forEach((cb) => { cb.checked = settings.quoteCats.includes(cb.dataset.cat); });
  set("optWeather", "checked", settings.showWeather);
  set("optUnit", "value", settings.unit);
  syncManualLocationUI();
  set("optCalendar", "checked", settings.showCalendar);
  set("optCalendar2", "checked", settings.showCalendar);
  set("optClockFont", "value", ["default", "wide", "serif", "mono"].includes(settings.clockFont)
                             ? settings.clockFont : "default");
  set("optTint", "value", settings.tint);
  $("optTintValue").textContent = `${settings.tint}%`;
  set("optBlur", "value", settings.blur);
  set("optGrain", "checked", settings.grain);
  set("optSnap", "checked", settings.snap);
  set("optSolid", "value", settings.solidColor);
  set("optUnsplashCat", "value", settings.unsplashCat || "all");
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
    h = h % 12 || 12;
  }
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
  if (!navigator.geolocation) return promptForLocation();
  navigator.geolocation.getCurrentPosition(
    (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude),
    () => promptForLocation()
  );
}

// ============================================================
// Google Calendar
// ============================================================
const CAL_CONFIGURED = HAS_EXT &&
  !(chrome.runtime?.getManifest?.()?.oauth2?.client_id || "").startsWith("PASTE-YOUR-CLIENT-ID");

let calEvents = [];
let calToken = null;

function calSetupMessage() {
  if (!HAS_EXT) return "Calendar needs the installed extension.";
  if (!CAL_CONFIGURED) {
    return "Add your own Google OAuth client ID to <b>manifest.json</b> to enable this. " +
           "See <b>SETUP-CALENDAR.md</b> in the extension folder.";
  }
  return "Only today's events are read, and only into this browser.";
}

function getToken(interactive) {
  return new Promise((resolve, reject) => {
    if (!CAL_CONFIGURED) return reject(new Error("not configured"));
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError || !token) {
        return reject(new Error(chrome.runtime.lastError?.message || "no token"));
      }
      resolve(token);
    });
  });
}

function fetchCalendar(token) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end   = new Date(); end.setHours(23, 59, 59, 999);
  const url = "https://www.googleapis.com/calendar/v3/calendars/primary/events" +
    `?timeMin=${start.toISOString()}&timeMax=${end.toISOString()}` +
    "&singleEvents=true&orderBy=startTime&maxResults=20";

  return fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => {
      calEvents = (data.items || []).map((ev) => ({
        summary: ev.summary || "(no title)",
        start: ev.start?.dateTime ? new Date(ev.start.dateTime) : null,
        allDay: !ev.start?.dateTime,
      }));
      renderCalendar();
      renderIsland();
    });
}

function nextEvent() {
  const now = Date.now();
  const ev = calEvents.find((e) => e.start && e.start.getTime() > now);
  if (!ev) return null;
  const mins = Math.round((ev.start.getTime() - now) / 60000);
  const rel = mins < 60 ? `in ${mins} min`
            : mins < 1440 ? `in ${Math.round(mins / 60)}h`
            : ev.start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return { summary: ev.summary, rel };
}

function renderCalendar() {
  const list = $("calList");
  list.innerHTML = "";

  if (!calToken) {
    const msg = document.createElement("div");
    msg.className = "wx-loading";
    msg.textContent = CAL_CONFIGURED ? "Connect your Google account." : "Calendar not configured.";
    list.appendChild(msg);
    if (CAL_CONFIGURED) {
      const btn = document.createElement("button");
      btn.className = "cal-cta";
      btn.textContent = "Connect Google Calendar";
      btn.onclick = (e) => { e.stopPropagation(); connectCalendar(); };
      list.appendChild(btn);
    }
    return;
  }

  if (!calEvents.length) {
    list.innerHTML = `<div class="wx-loading">Nothing scheduled today.</div>`;
    return;
  }

  const now = Date.now();
  const upNext = calEvents.find((ev) => ev.start && ev.start.getTime() > now);

  calEvents.forEach((ev) => {
    const row = document.createElement("div");
    row.className = "cal-event";
    // dim what has already happened; highlight only the one coming up next
    if (ev.start && ev.start.getTime() <= now) row.classList.add("past");
    else if (ev === upNext) row.classList.add("next");

    const bar = document.createElement("div");
    bar.className = "cal-bar";

    const body = document.createElement("div");
    const when = document.createElement("div");
    when.className = "cal-when";
    when.textContent = ev.allDay ? "ALL DAY"
      : ev.start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toUpperCase();
    const what = document.createElement("div");
    what.className = "cal-what";
    what.textContent = ev.summary;
    body.append(when, what);

    row.append(bar, body);
    list.appendChild(row);
  });
}

function setCalUI(connected) {
  $("calConnect").hidden = connected;
  $("calDisconnect").hidden = !connected;
  $("calStatus").textContent = connected ? "Connected." :
    CAL_CONFIGURED ? "Not connected." : "Needs a Google OAuth client ID.";
  $("calConnect").disabled = !CAL_CONFIGURED;
}

function connectCalendar() {
  getToken(true)
    .then((token) => { calToken = token; setCalUI(true); return fetchCalendar(token); })
    .catch(() => {
      calToken = null;
      setCalUI(false);
      $("calList").innerHTML = `<div class="wx-loading">Couldn't connect.</div>`;
    });
}

function disconnectCalendar() {
  if (calToken && HAS_EXT) chrome.identity.removeCachedAuthToken({ token: calToken }, () => {});
  calToken = null;
  calEvents = [];
  setCalUI(false);
  renderCalendar();
  renderIsland();
}

function syncManualLocationUI() {
  updateLocationUI();
}

function initCalendar() {
  $("calSetupNote").innerHTML = calSetupMessage();
  setCalUI(false);
  renderCalendar();
  if (!settings.showCalendar || !CAL_CONFIGURED) return;
  // silent sign-in: only succeeds if the user already granted access
  getToken(false)
    .then((token) => { calToken = token; setCalUI(true); return fetchCalendar(token); })
    .catch(() => {});
}

$("calConnect").addEventListener("click", connectCalendar);
$("calDisconnect").addEventListener("click", disconnectCalendar);
$("refreshCal").addEventListener("click", (e) => {
  e.stopPropagation();
  if (calToken) fetchCalendar(calToken).catch(() => {});
});

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

function refreshPhotoGrid() {
  allPhotos().then((photos) => {
    const grid = $("photoGrid");
    grid.innerHTML = "";
    $("aboutPhotos").textContent = String(photos.length);

    photos.forEach((rec) => {
      const b = document.createElement("button");
      b.className = "photo-thumb";
      b.style.backgroundImage = `url("${trackUrl(URL.createObjectURL(rec.blob))}")`;
      b.classList.toggle("active", settings.photoId === rec.id);
      b.title = rec.fg ? "Has a depth foreground" : "";
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
      del.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
      del.onclick = (e) => {
        e.stopPropagation();
        delPhoto(rec.id).then(() => {
          if (settings.photoId === rec.id) {
            settings.photoId = null;
            settings.bgType = "gradient";
            applySettings();
            saveSettings();
          }
          refreshPhotoGrid();
          applyWallpaper();
        });
      };

      b.appendChild(del);
      grid.appendChild(b);
    });

    updateDepthUI(photos);
  }).catch(() => {});
}

$("addPhotoBtn").addEventListener("click", () => $("photoInput").click());
$("photoInput").addEventListener("change", (e) => {
  const files = [...e.target.files];
  if (!files.length) return;
  Promise.all(files.map((file) =>
    putPhoto({ id: `p${Date.now()}${Math.random().toString(36).slice(2, 7)}`, blob: file })
  )).then(() => {
    e.target.value = "";
    refreshPhotoGrid();
    applyWallpaper();
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
const WIDGETS = ["weather", "calendar"];
const WIDGET_EL = {
  weather: "weatherCard",
  calendar: "calCard",
};

function availableViewportWidth() {
  const sidebarOpen = document.body.classList.contains("settings-open");
  const sw = $("settingsWindow");
  const sidebarW = sidebarOpen && sw ? sw.offsetWidth : 0;
  return window.innerWidth - sidebarW;
}

function defaultPosition(id, el) {
  const w = el.offsetWidth || 300;
  const vw = availableViewportWidth();
  switch (id) {
    case "quote":    return { x: 28, y: 28 };
    case "calendar": return { x: 28, y: 28 + (($("quoteCard").offsetHeight || 200) + 18) };
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
const BUILTIN_ICONS = {
  "google.com": `<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>`,
  "youtube.com": `<svg viewBox="0 0 24 24"><path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/><path fill="#FFFFFF" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  "mail.google.com": `<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M1.5 6.5v11A1.5 1.5 0 0 0 3 19h2.5V9.5L1.5 6.5z"/><path fill="#34A853" d="M18.5 19H21a1.5 1.5 0 0 0 1.5-1.5v-11L18.5 9.5V19z"/><path fill="#EA4335" d="M18.5 9.5V5a1 1 0 0 0-1.5-.86L12 7.5 7 4.14A1 1 0 0 0 5.5 5v4.5l6.5 4.5 6.5-4.5z"/><path fill="#FBBC05" d="M5.5 9.5L1.5 6.5 5.5 4.14V9.5z"/><path fill="#C5221F" d="M18.5 9.5V4.14L22.5 6.5l-4 3z"/></svg>`,
  "drive.google.com": `<svg viewBox="0 0 24 24"><path fill="#0066DA" d="M15.42 16.5H23.1L19.26 9.75H11.58L15.42 16.5Z"/><path fill="#00AC47" d="M8.58 16.5L4.74 9.75L8.58 3H16.26L12.42 9.75L8.58 16.5Z"/><path fill="#EA4335" d="M4.74 9.75L0.9 16.5H8.58L12.42 9.75H4.74Z"/><path fill="#FFBA00" d="M8.58 3L0.9 16.5L4.74 16.5L12.42 3H8.58Z"/></svg>`
};

function getBuiltinIcon(url) {
  try {
    const u = url.toLowerCase();
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host === "mail.google.com" || u.includes("mail.google.com") || u.includes("gmail.com")) return BUILTIN_ICONS["mail.google.com"];
    if (host === "drive.google.com" || u.includes("drive.google.com")) return BUILTIN_ICONS["drive.google.com"];
    if (host === "youtube.com" || u.includes("youtube.com") || u.includes("youtu.be")) return BUILTIN_ICONS["youtube.com"];
    if (host === "google.com" || host.endsWith(".google.com")) return BUILTIN_ICONS["google.com"];
  } catch {}
  return null;
}

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

    const builtinSvg = getBuiltinIcon(s.url);
    if (builtinSvg) {
      a.innerHTML = builtinSvg;
    } else {
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
    }

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
  setTimeout(layoutWidgets, 10);
};
const closeSettings = () => {
  overlay.classList.remove("open");
  document.body.classList.remove("settings-open");
  setTimeout(layoutWidgets, 10);
};

$("settingsBtn").addEventListener("click", (e) => { e.preventDefault(); openSettings(); });
$("tlClose").addEventListener("click", closeSettings);
$("tlMin").addEventListener("click", () => $("settingsWindow").classList.toggle("no-sidebar"));
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
    applySettings();
    saveSettings();
    if (settings.bgType === "bing" && !bingImages.length) loadBing().then(applyWallpaper);
    else applyWallpaper();
  });
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
bindToggle("optDepth", "depth");
bindToggle("optParallax", "parallax");
bindToggle("optWeather", "showWeather", layoutWidgets);
bindToggle(["optCalendar", "optCalendar2"], "showCalendar", () => { layoutWidgets(); initCalendar(); });
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
   "engine","showQuote","showWeather","unit","showCalendar"]
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
  general: "General", widgets: "Widgets & Dock", quotes: "Quotes", feeds: "Feeds",
  display: "Display", appearance: "Appearance", about: "About",
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
let objectUrls = [];
const trackUrl = (u) => { objectUrls.push(u); return u; };
function revokeUrls() {
  objectUrls.forEach((u) => URL.revokeObjectURL(u));
  objectUrls = [];
}

const UNSPLASH_COLLECTIONS = {
  nature: [
    { id: "photo-1470071459604-3b5ec3a7fe05", author: "Jerry Zhang", link: "https://unsplash.com/@zlj318" },
    { id: "photo-1506744038136-46273834b3fb", author: "Bailey Zindel", link: "https://unsplash.com/@baileyzindel" },
    { id: "photo-1469474968028-56623f02e42e", author: "David Marcu", link: "https://unsplash.com/@davidmarcu" },
    { id: "photo-1518495973542-4542c06a5843", author: "Luca Bravo", link: "https://unsplash.com/@lucabravo" },
    { id: "photo-1472214103451-9374bd1c798e", author: "Sebastien Gabriel", link: "https://unsplash.com/@sebastien_gabriel" },
    { id: "photo-1426604966848-d7adac402bff", author: "Kalen Emsley", link: "https://unsplash.com/@kalenemsley" },
    { id: "photo-1441974231531-c6227db76b6e", author: "Sascha Bosshard", link: "https://unsplash.com/@bosshardsascha" },
    { id: "photo-1507525428034-b723cf961d3e", author: "Sean Oulashin", link: "https://unsplash.com/@oulashin" },
  ],
  minimal: [
    { id: "photo-1518709268805-4e9042af9f23", author: "Alexander Grey", link: "https://unsplash.com/@sharonmccutcheon" },
    { id: "photo-1550684848-fac1c5b4e853", author: "Joel Filipe", link: "https://unsplash.com/@joelfilip" },
    { id: "photo-1618005182384-a83a8bd57fbe", author: "Milad Fakurian", link: "https://unsplash.com/@fakurian" },
    { id: "photo-1509198397868-475647b2a1e5", author: "Fakurian Design", link: "https://unsplash.com/@fakuriandesign" },
    { id: "photo-1557683316-973673baf926", author: "Gradient Creator", link: "https://unsplash.com" },
    { id: "photo-1579546929518-9e396f3cc809", author: "Pawel Czerwinski", link: "https://unsplash.com/@pawel_czerwinski" },
  ],
  architecture: [
    { id: "photo-1486406146926-c627a92ad1ab", author: "Sean Pollock", link: "https://unsplash.com/@seanpollock" },
    { id: "photo-1477959858617-67f30bc75b82", author: "Sawyer Bengtson", link: "https://unsplash.com/@the_real_bengtson" },
    { id: "photo-1514565131-fce0801e5785", author: "Aleksandar Pasaric", link: "https://unsplash.com/@apasaric" },
    { id: "photo-1449824913935-59a10b8d2000", author: "Matthew Henry", link: "https://unsplash.com/@matthewhenry" },
    { id: "photo-1519501025264-65ba15a82390", author: "Daniel Chen", link: "https://unsplash.com/@danielchen" },
    { id: "photo-1492691527719-9d1e07e534b4", author: "Samson", link: "https://unsplash.com/@samson" },
  ],
  space: [
    { id: "photo-1506703719100-a0f3a48c0f86", author: "NASA", link: "https://unsplash.com/@nasa" },
    { id: "photo-1451187580459-43490279c0fa", author: "NASA", link: "https://unsplash.com/@nasa" },
    { id: "photo-1516339901601-2e1b62dc0c45", author: "Vincentiu Solomon", link: "https://unsplash.com/@vincentiu" },
    { id: "photo-1446776811953-b23d57bd21aa", author: "NASA", link: "https://unsplash.com/@nasa" },
    { id: "photo-1462331940025-496dfbfc7564", author: "Jeremy Thomas", link: "https://unsplash.com/@jeremythomasphoto" },
    { id: "photo-1538370965046-79c0d6907d47", author: "Adrian Pelletier", link: "https://unsplash.com/@adrianpelletier" },
  ],
  cyberpunk: [
    { id: "photo-1542751371-adc38448a05e", author: "Florian Olivo", link: "https://unsplash.com/@florianolivo" },
    { id: "photo-1555680202-c86f0e12f086", author: "Victor Garcia", link: "https://unsplash.com/@victorgarcia" },
    { id: "photo-1578632767115-351597cf2477", author: "Denis Cherkasov", link: "https://unsplash.com/@denischerkasov" },
    { id: "photo-1518709268805-4e9042af9f23", author: "Alexander Grey", link: "https://unsplash.com/@sharonmccutcheon" },
    { id: "photo-1526374965328-7f61d4dc18c5", author: "Markus Spiske", link: "https://unsplash.com/@markusspiske" },
  ],
};

UNSPLASH_COLLECTIONS.all = [
  ...UNSPLASH_COLLECTIONS.nature,
  ...UNSPLASH_COLLECTIONS.minimal,
  ...UNSPLASH_COLLECTIONS.architecture,
  ...UNSPLASH_COLLECTIONS.space,
  ...UNSPLASH_COLLECTIONS.cyberpunk,
];

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
  if (!layer) return;
  const pool = UNSPLASH_COLLECTIONS[settings.unsplashCat] || UNSPLASH_COLLECTIONS.all;
  if (!pool || !pool.length) return;

  if (bump) {
    currentUnsplashOffset = (currentUnsplashOffset + 1) % pool.length;
  }
  const idx = (rotationIndex(pool.length) + currentUnsplashOffset) % pool.length;
  const item = pool[idx];
  const url = `https://images.unsplash.com/${item.id}?auto=format&fit=crop&w=2560&q=85`;

  layer.style.backgroundImage = `url("${url}")`;
  setCredit(`Photo by ${item.author} (Unsplash)`, item.link || "https://unsplash.com");
  applyAutoClockContrast();
}

function loadBing() {
  const status = $("bingStatus");
  if (status) status.textContent = "Loading…";
  return fetch("https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=en-US")
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => {
      bingImages = (data.images || []).map((im) => ({
        url: im.url.startsWith("http") ? im.url : `https://www.bing.com${im.url}`,
        title: im.title || "",
        credit: (im.copyright || "").replace(/\s*\(©.*?\)\s*$/, "").trim(),
        link: im.copyrightlink || "",
      }));
      if (status) {
        status.textContent = bingImages.length
          ? `${bingImages.length} recent wallpapers available.`
          : "Nothing returned.";
      }
      return bingImages;
    })
    .catch(() => {
      bingImages = [];
      if (status) {
        status.textContent = HAS_EXT ? "Couldn't reach Bing."
                                     : "Bing blocks this outside the extension.";
      }
      return [];
    });
}

function applyWallpaper() {
  const layer = $("photoLayer");
  const depth = $("depthLayer");
  if (!layer) return;

  setupBgRotateTimer();

  if (settings.bgType === "unsplash") {
    if (depth) depth.style.backgroundImage = "";
    applyUnsplashWallpaper(false);
    return;
  }

  if (settings.bgType === "bing") {
    if (depth) depth.style.backgroundImage = "";
    if (!bingImages.length) { layer.style.backgroundImage = ""; setCredit(""); return; }
    const im = bingImages[rotationIndex(bingImages.length)];
    layer.style.backgroundImage = `url("${im.url}")`;
    setCredit(im.credit || im.title, im.link);
    applyAutoClockContrast();
    return;
  }

  if (settings.bgType !== "photo") {
    layer.style.backgroundImage = "";
    if (depth) depth.style.backgroundImage = "";
    setCredit("");
    return;
  }

  setCredit("");
  allPhotos().then((photos) => {
    if (!photos.length) {
      layer.style.backgroundImage = "";
      if (depth) depth.style.backgroundImage = "";
      return;
    }
    // "never" pins to the chosen photo; any rotation draws across the library
    const rec = settings.bgRotate === "never"
      ? (photos.find((p) => p.id === settings.photoId) || photos[0])
      : photos[rotationIndex(photos.length)];

    revokeUrls();
    layer.style.backgroundImage = `url("${trackUrl(URL.createObjectURL(rec.blob))}")`;
    if (depth) {
      depth.style.backgroundImage = rec.fg
        ? `url("${trackUrl(URL.createObjectURL(rec.fg))}")`
        : "";
    }
    applyAutoClockContrast();
  }).catch(() => {});
}

function initWallpaper() {
  if (settings.bgType === "bing") loadBing().then(applyWallpaper);
  else applyWallpaper();
}

function updateDepthUI(photos) {
  const status = $("depthStatus");
  const add = $("addDepthBtn");
  const remove = $("removeDepthBtn");
  if (!status || !add || !remove) return;

  const finish = (list) => {
    const rec = list.find((p) => p.id === settings.photoId);
    if (!rec) {
      status.textContent = "Select one of your photos first.";
      add.disabled = true;
      remove.hidden = true;
      return;
    }
    add.disabled = false;
    status.textContent = rec.fg ? "A foreground is attached to this photo."
                                : "No foreground on this photo yet.";
    remove.hidden = !rec.fg;
  };

  if (photos) finish(photos);
  else allPhotos().then(finish).catch(() => {});
}

$("bingRefresh").addEventListener("click", () => loadBing().then(applyWallpaper));

$("addDepthBtn").addEventListener("click", () => $("depthInput").click());
$("depthInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file || !settings.photoId) return;
  getPhoto(settings.photoId).then((rec) => {
    if (!rec) return;
    rec.fg = file;
    return putPhoto(rec);
  }).then(() => {
    e.target.value = "";
    if (!settings.depth) {          // attaching a cut-out means you want it on
      settings.depth = true;
      syncControls();
      saveSettings();
    }
    applySettings();
    refreshPhotoGrid();
    applyWallpaper();
  }).catch(() => {});
});

$("removeDepthBtn").addEventListener("click", () => {
  if (!settings.photoId) return;
  getPhoto(settings.photoId).then((rec) => {
    if (!rec) return;
    delete rec.fg;
    return putPhoto(rec);
  }).then(() => {
    refreshPhotoGrid();
    applyWallpaper();
  }).catch(() => {});
});

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

/** Average luminance (0-1) of an image, sampling the center-top quadrant where the clock sits. */
function sampleImageLuminance(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = 64, h = 64;
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        // Sample the region where the clock and date sit (upper center)
        const sx = Math.floor(w * 0.15), sy = Math.floor(h * 0.20);
        const sw = Math.floor(w * 0.70), sh = Math.floor(h * 0.45);
        const { data } = ctx.getImageData(sx, sy, sw, sh);
        let sum = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          sum += relLuminance(data[i], data[i + 1], data[i + 2]);
          count++;
        }
        resolve(sum / count);
      } catch (err) { reject(err); }
    };
    img.onerror = reject;
    img.src = url;
  });
}

function currentWallpaperUrl() {
  const bg = getComputedStyle($("photoLayer")).backgroundImage;
  const m = /url\(["']?(.+?)["']?\)/.exec(bg);
  return m ? m[1] : null;
}

function applyAutoClockContrast() {
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
    finish(hexLuminance(settings.solidColor) > 0.36);
    return;
  }

  if (settings.bgType === "photo" || settings.bgType === "bing") {
    const url = currentWallpaperUrl();
    if (url) {
      sampleImageLuminance(url)
        .then((lum) => finish(lum > 0.36))
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
    finish(lum > 0.36);
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
// Boot
// ============================================================
updateClock();
loadState();
restartIslandTimer();
