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
  { name: "Drive", url: "https://drive.google.com" },
  { name: "GitHub", url: "https://github.com" },
];

const DEFAULTS = {
  userName: "", greetStyle: "timeofday",
  showIsland: true, islandCycle: true,
  showClock: true, showDate: true, use24hr: false, showSeconds: true,
  showSearch: true, engine: "google",
  showNotes: true,
  showWeather: true, unit: "celsius",
  showNews: true, newsCountry: "US", newsTopic: "TOP",
  showCalendar: false,
  showAnnounce: false, announceUrl: "",
  mode: "system",
  bg: "green", bgType: "gradient", solidColor: "#101418", photoId: null,
  tint: 100, blur: 32, grain: true,
  scale: "default", clockFont: "default", clockColor: "gradient",
  snap: true, positions: {},
  lowPerf: false,
};

let settings  = { ...DEFAULTS };
let SHORTCUTS = DEFAULT_SHORTCUTS.map((s) => ({ ...s }));

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

const NEWS_COUNTRIES = {
  US: ["United States", "en-US", "en"], GB: ["United Kingdom", "en-GB", "en"],
  NG: ["Nigeria", "en-NG", "en"],       CA: ["Canada", "en-CA", "en"],
  AU: ["Australia", "en-AU", "en"],     IN: ["India", "en-IN", "en"],
  ZA: ["South Africa", "en-ZA", "en"],  IE: ["Ireland", "en-IE", "en"],
  KE: ["Kenya", "en-KE", "en"],         GH: ["Ghana", "en-GH", "en"],
  SG: ["Singapore", "en-SG", "en"],     PH: ["Philippines", "en-PH", "en"],
  DE: ["Germany", "de", "de"],          FR: ["France", "fr", "fr"],
  ES: ["Spain", "es", "es"],            BR: ["Brazil", "pt-BR", "pt-419"],
  JP: ["Japan", "ja", "ja"],            IT: ["Italy", "it", "it"],
};

const NEWS_TOPICS = {
  TOP: "Top Stories", WORLD: "World", NATION: "National", BUSINESS: "Business",
  TECHNOLOGY: "Technology", ENTERTAINMENT: "Entertainment", SPORTS: "Sports",
  SCIENCE: "Science", HEALTH: "Health",
};

const GOOGLE_MARK = `<svg viewBox="0 0 24 24">
  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
  <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"/>
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/>
</svg>`;
const GLASS_MARK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>`;

// ============================================================
// Persistence
// ============================================================
const saveSettings  = () => chrome.storage.local.set({ settings });
const saveShortcuts = () => chrome.storage.local.set({ shortcuts: SHORTCUTS });

function loadState() {
  chrome.storage.local.get(["settings", "shortcuts", "notes"], (result) => {
    if (result.settings) settings = { ...DEFAULTS, ...result.settings };
    if (Array.isArray(result.shortcuts)) SHORTCUTS = result.shortcuts;
    if (result.notes) { $("notesArea").value = result.notes; updateNotesCount(); }

    buildSelects();
    syncControls();
    applySettings();
    renderShortcuts();
    renderShortcutList();
    layoutWidgets();
    initWeather();
    loadNews();
    initCalendar();
    loadAnnouncements();
    refreshPhotoGrid();
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
  body.dataset.clockFont  = ["default", "wide", "serif", "mono", "outfit", "playfair", "sfpro"].includes(settings.clockFont)
                           ? settings.clockFont : "default";
  body.dataset.clockColor = settings.clockColor;
  body.dataset.grain      = settings.grain ? "on" : "off";
  body.dataset.lowperf    = settings.lowPerf ? "on" : "off";
  body.dataset.hideClock  = settings.showClock ? "" : "1";
  body.dataset.hideDate   = settings.showDate ? "" : "1";
  body.dataset.hideSearch = settings.showSearch ? "" : "1";

  body.style.setProperty("--tint", settings.tint / 100);
  body.style.setProperty("--blur-px", `${settings.blur}px`);

  // background
  if (settings.bgType === "solid") {
    body.style.setProperty("--base", settings.solidColor);
  } else {
    body.style.removeProperty("--base");
  }
  applyPhoto();

  // widget visibility
  const vis = {
    notesCard: settings.showNotes,
    weatherCard: settings.showWeather,
    newsCard: settings.showNews,
    calCard: settings.showCalendar,
    announceCard: settings.showAnnounce && announcements.length > 0,
    island: settings.showIsland,
  };
  Object.entries(vis).forEach(([id, on]) => {
    const el = $(id);
    if (el) el.style.display = on ? "" : "none";
  });

  $("engineIcon").innerHTML = settings.engine === "google" ? GOOGLE_MARK : GLASS_MARK;
  $("searchInput").placeholder = `Search with ${ENGINES[settings.engine].name}`;

  // settings-window reflections
  $("themeName").textContent = settings.bgType === "photo" ? "Custom Photo"
                             : settings.bgType === "solid" ? settings.solidColor.toUpperCase()
                             : THEMES[theme];
  $("themeKind").textContent = settings.bgType === "photo" ? "Your photo"
                             : settings.bgType === "solid" ? "Solid colour" : "Gradient";
  $("optSolidHex").textContent = settings.solidColor.toUpperCase();

  $$("#bgSwatches .dot").forEach((d) => d.classList.toggle("active", d.dataset.bg === theme));
  $$("#clockColors .dot").forEach((d) => d.classList.toggle("active", d.dataset.cc === settings.clockColor));
  $$("#scaleTiles .sw-tile").forEach((t) => t.classList.toggle("active", t.dataset.scale === settings.scale));
  $$("#modeTiles .sw-tile").forEach((t) => t.classList.toggle("active", t.dataset.mode === settings.mode));
  $$("#bgSegment button").forEach((b) => b.classList.toggle("active", b.dataset.bgtype === settings.bgType));
  $$(".bg-tab").forEach((t) => t.classList.toggle("active", t.dataset.bgtype === settings.bgType));

  updateProfile();
  updateClock();
  renderIsland();
}

function syncControls() {
  const set = (id, prop, val) => { const el = $(id); if (el) el[prop] = val; };
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
  set("optNotes", "checked", settings.showNotes);
  set("optWeather", "checked", settings.showWeather);
  set("optUnit", "value", settings.unit);
  set("optNews", "checked", settings.showNews);
  set("optNews2", "checked", settings.showNews);
  set("optNewsCountry", "value", settings.newsCountry);
  set("optNewsTopic", "value", settings.newsTopic);
  set("optCalendar", "checked", settings.showCalendar);
  set("optCalendar2", "checked", settings.showCalendar);
  set("optAnnounce", "checked", settings.showAnnounce);
  set("optAnnounce2", "checked", settings.showAnnounce);
  set("optAnnounceUrl", "value", settings.announceUrl);
  set("optClockFont", "value", ["default", "wide", "serif", "mono", "outfit", "playfair", "sfpro"].includes(settings.clockFont)
                             ? settings.clockFont : "default");
  set("optTint", "value", settings.tint);
  set("optBlur", "value", settings.blur);
  set("optGrain", "checked", settings.grain);
  set("optSnap", "checked", settings.snap);
  set("optSolid", "value", settings.solidColor);
}

function updateProfile() {
  const name = settings.userName.trim();
  const el = $("swProfileName");
  el.textContent = name || "Set your name";
  el.classList.toggle("unset", !name);
  $("swAvatar").textContent = name ? name[0] : "?";
}

function buildSelects() {
  const c = $("optNewsCountry");
  if (!c.options.length) {
    Object.entries(NEWS_COUNTRIES).forEach(([code, [label]]) =>
      c.append(new Option(label, code)));
  }
  const t = $("optNewsTopic");
  if (!t.options.length) {
    Object.entries(NEWS_TOPICS).forEach(([code, label]) =>
      t.append(new Option(label, code)));
  }
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
  let meridiem = "";
  if (!settings.use24hr) {
    meridiem = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
  }
  $("clockMain").textContent = `${String(h).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  $("clockSec").textContent = settings.showSeconds ? String(now.getSeconds()).padStart(2, "0") : "";
  $("clockMeridiem").textContent = meridiem;
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

let islandSlide = 0;
let islandTimer = null;

/** Build the list of slides that currently have something to say. */
function islandSlides() {
  const out = [{ dot: true, icon: "", text: greetingText(), sub: "" }];

  if (settings.showWeather && weatherState.temp !== null) {
    out.push({
      dot: false, icon: weatherState.icon,
      text: `${weatherState.temp}°`,
      sub: `${weatherState.cond}${weatherState.city ? " · " + weatherState.city : ""}`,
    });
  }

  const next = nextEvent();
  if (next) out.push({ dot: false, icon: ISLAND_ICONS.cal, text: next.summary, sub: next.rel });

  out.push({
    dot: false, icon: ISLAND_ICONS.clock,
    text: new Date().toLocaleDateString(undefined, { weekday: "long" }),
    sub: new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" }),
  });

  return out;
}

function renderIsland(animate = false) {
  const island = $("island");
  if (!settings.showIsland) return;

  const slides = islandSlides();
  islandSlide = ((islandSlide % slides.length) + slides.length) % slides.length;
  const s = slides[islandSlide];

  const paint = () => {
    $("islandDot").hidden = !s.dot;
    $("islandIcon").innerHTML = s.icon || "";
    $("islandText").textContent = s.text;
    $("islandSub").textContent = s.sub || "";
    // width has to be an explicit px value for the morph to animate
    island.style.width = `${$("islandInner").scrollWidth}px`;
  };

  if (!animate) { paint(); return; }
  island.classList.add("morphing");
  setTimeout(() => { paint(); island.classList.remove("morphing"); }, 200);
}

function cycleIsland(step = 1) {
  islandSlide += step;
  renderIsland(true);
  restartIslandTimer();
}

function restartIslandTimer() {
  clearInterval(islandTimer);
  if (settings.islandCycle && settings.showIsland) {
    islandTimer = setInterval(() => { islandSlide++; renderIsland(true); }, 8000);
  }
}

$("island").addEventListener("click", () => cycleIsland(1));

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
      const [icon, label] = WX_MAP[data.current.weather_code] || [WX.partly, "Cloudy"];
      weatherState.temp = Math.round(data.current.temperature_2m);
      weatherState.cond = label;
      weatherState.icon = icon;
      // Open-Meteo returns the resolved IANA zone (e.g. "Africa/Lagos") — use it
      // as a city label so we avoid calling a third-party geocoder.
      weatherState.city = (data.timezone || "").split("/").pop().replace(/_/g, " ");

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
    .catch(() => failWeather("Unavailable", "Check connection"));
}

function failWeather(cond, city) {
  weatherState.temp = null;
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
// News — Google News RSS (keyless; CORS is waived by host_permissions)
// ============================================================
function newsUrl() {
  const [, hl, ceidLang] = NEWS_COUNTRIES[settings.newsCountry] || NEWS_COUNTRIES.US;
  const gl = settings.newsCountry;
  const tail = `hl=${hl}&gl=${gl}&ceid=${gl}:${ceidLang}`;
  return settings.newsTopic === "TOP"
    ? `https://news.google.com/rss?${tail}`
    : `https://news.google.com/rss/headlines/section/topic/${settings.newsTopic}?${tail}`;
}

function relTime(date) {
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function loadNews() {
  if (!settings.showNews) return;
  const list = $("newsList");
  list.innerHTML = `<div class="wx-loading">Loading headlines&hellip;</div>`;

  fetch(newsUrl())
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then((xml) => {
      const doc = new DOMParser().parseFromString(xml, "text/xml");
      const items = [...doc.querySelectorAll("item")].slice(0, 12);
      if (!items.length) throw new Error("empty");

      list.innerHTML = "";
      items.forEach((item) => {
        const rawTitle = item.querySelector("title")?.textContent || "";
        const source   = item.querySelector("source")?.textContent || "";
        // Google appends " - Source" to every headline; drop it when we have the source
        const title = source && rawTitle.endsWith(` - ${source}`)
          ? rawTitle.slice(0, -(source.length + 3))
          : rawTitle;
        const pub = new Date(item.querySelector("pubDate")?.textContent || Date.now());

        const a = document.createElement("a");
        a.className = "news-item";
        a.href = item.querySelector("link")?.textContent || "#";
        a.target = "_blank";
        a.rel = "noopener";

        const h = document.createElement("div");
        h.className = "h";
        h.textContent = title;

        const m = document.createElement("div");
        m.className = "m";
        const src = document.createElement("span");
        src.textContent = source || "Google News";
        const dot = document.createElement("i");
        const when = document.createElement("span");
        when.textContent = relTime(pub);
        m.append(src, dot, when);

        a.append(h, m);
        list.appendChild(a);
      });
    })
    .catch(() => {
      list.innerHTML = `<div class="news-empty">Couldn't load headlines.${
        HAS_EXT ? "" : "<br>Google News blocks this outside the extension."}</div>`;
    });
}

$("refreshNews").addEventListener("click", (e) => { e.stopPropagation(); loadNews(); });

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
// Announcements
// ============================================================
let announcements = [];
let announceIdx = 0;

const ANNOUNCE_HOSTS = ["raw.githubusercontent.com", "gist.githubusercontent.com"];

function loadAnnouncements() {
  announcements = [];
  const url = settings.announceUrl.trim();
  if (!settings.showAnnounce || !url) { applyAnnounce(); return; }

  let host;
  try { host = new URL(url).hostname; } catch { applyAnnounce(); return; }
  if (!ANNOUNCE_HOSTS.includes(host)) { applyAnnounce(); return; }

  fetch(url)
    .then((r) => r.json())
    .then((data) => {
      announcements = (Array.isArray(data) ? data : []).filter((a) => a && a.title);
      announceIdx = 0;
      applyAnnounce();
    })
    .catch(() => applyAnnounce());
}

function applyAnnounce() {
  const card = $("announceCard");
  const on = settings.showAnnounce && announcements.length > 0;
  card.style.display = on ? "" : "none";
  if (!on) return;

  const a = announcements[announceIdx % announcements.length];
  $("announceTitle").textContent = a.title;
  $("announceText").textContent = a.text || "";
  card.onclick = a.url ? () => window.open(a.url, "_blank", "noopener") : null;
  card.style.cursor = a.url ? "pointer" : "";
  $("announceNext").hidden = announcements.length < 2;
}

$("announceNext").addEventListener("click", (e) => {
  e.stopPropagation();
  announceIdx++;
  applyAnnounce();
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

let photoUrl = null;

function applyPhoto() {
  const layer = $("photoLayer");
  if (settings.bgType !== "photo" || !settings.photoId) {
    layer.style.backgroundImage = "";
    return;
  }
  getPhoto(settings.photoId).then((rec) => {
    if (!rec) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = URL.createObjectURL(rec.blob);
    layer.style.backgroundImage = `url("${photoUrl}")`;
  }).catch(() => {});
}

function refreshPhotoGrid() {
  allPhotos().then((photos) => {
    const grid = $("photoGrid");
    grid.innerHTML = "";
    $("aboutPhotos").textContent = String(photos.length);

    photos.forEach((rec) => {
      const url = URL.createObjectURL(rec.blob);
      const b = document.createElement("button");
      b.className = "photo-thumb";
      b.style.backgroundImage = `url("${url}")`;
      b.classList.toggle("active", settings.photoId === rec.id);
      b.onclick = () => {
        settings.photoId = rec.id;
        settings.bgType = "photo";
        applySettings();
        saveSettings();
        refreshPhotoGrid();
      };

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
        });
      };

      b.appendChild(del);
      grid.appendChild(b);
    });
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
  }).catch(() => {});
});

// ============================================================
// Notes
// ============================================================
const notesArea = $("notesArea");
let savedTimer;

function updateNotesCount() {
  const n = notesArea.value.length;
  const label = `${n} character${n === 1 ? "" : "s"}`;
  $("notesCount").textContent = label;
  $("aboutNotes").textContent = label;
}

notesArea.addEventListener("input", () => {
  chrome.storage.local.set({ notes: notesArea.value });
  updateNotesCount();
  const flag = $("notesSaved");
  flag.classList.add("show");
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => flag.classList.remove("show"), 1200);
});

$("clearNotes").addEventListener("click", (e) => {
  e.stopPropagation();
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
// Widget dragging + grid snapping
// ============================================================
const GRID = 20;
const WIDGETS = ["notes", "weather", "news", "calendar", "announce"];
const WIDGET_EL = {
  notes: "notesCard", weather: "weatherCard", news: "newsCard",
  calendar: "calCard", announce: "announceCard",
};

function defaultPosition(id, el) {
  const w = el.offsetWidth || 300;
  const vw = window.innerWidth;
  switch (id) {
    case "notes":    return { x: 28, y: 28 };
    case "calendar": return { x: 28, y: 28 + (($("notesCard").offsetHeight || 372) + 18) };
    case "weather":  return { x: vw - w - 28, y: 28 };
    case "news":     return { x: vw - w - 28, y: 28 + (($("weatherCard").offsetHeight || 164) + 18) };
    case "announce": return { x: Math.round((vw - w) / 2), y: 88 };
    default:         return { x: 28, y: 28 };
  }
}

function clampToViewport(x, y, el) {
  const w = el.offsetWidth, h = el.offsetHeight;
  return {
    x: Math.max(8, Math.min(x, window.innerWidth - w - 8)),
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
    settings[key] = transform(el.value);
    applySettings();
    saveSettings();
    if (after) after();
  });
}

bindToggle("optIsland", "showIsland", restartIslandTimer);
bindToggle("optIslandCycle", "islandCycle", restartIslandTimer);
bindToggle("optClock", "showClock");
bindToggle("opt24hr", "use24hr");
bindToggle("optSeconds", "showSeconds");
bindToggle("optDate", "showDate");
bindToggle("optLowPerf", "lowPerf");
bindToggle("optSearch", "showSearch");
bindToggle("optNotes", "showNotes", layoutWidgets);
bindToggle("optWeather", "showWeather", layoutWidgets);
bindToggle(["optNews", "optNews2"], "showNews", () => { layoutWidgets(); loadNews(); });
bindToggle(["optCalendar", "optCalendar2"], "showCalendar", () => { layoutWidgets(); initCalendar(); });
bindToggle(["optAnnounce", "optAnnounce2"], "showAnnounce", loadAnnouncements);
bindToggle("optGrain", "grain");
bindToggle("optSnap", "snap");

bindValue("optName", "userName", (v) => v, renderIsland);
bindValue("optGreetStyle", "greetStyle", (v) => v, renderIsland);
bindValue("optEngine", "engine");
bindValue("optClockFont", "clockFont");
bindValue("optTint", "tint", Number);
bindValue("optBlur", "blur", Number);
bindValue("optSolid", "solidColor");
bindValue("optNewsCountry", "newsCountry", (v) => v, loadNews);
bindValue("optNewsTopic", "newsTopic", (v) => v, loadNews);
bindValue("optAnnounceUrl", "announceUrl", (v) => v, loadAnnouncements);

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
  });
});
$$("#clockColors .dot").forEach((dot) => {
  dot.addEventListener("click", () => { settings.clockColor = dot.dataset.cc; applySettings(); saveSettings(); });
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
   "engine","showNotes","showWeather","unit","showNews","showCalendar","showAnnounce"]
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
  settings = { ...DEFAULTS, positions: {} };
  SHORTCUTS = DEFAULT_SHORTCUTS.map((s) => ({ ...s }));
  saveSettings();
  saveShortcuts();
  syncControls();
  applySettings();
  renderShortcuts();
  renderShortcutList();
  layoutWidgets();
  restartIslandTimer();
  loadNews();
  loadAnnouncements();
});

// ---- export / import ----
$("exportBtn").addEventListener("click", () => {
  const payload = { app: "liquid-tab", version: 3, settings, shortcuts: SHORTCUTS, notes: notesArea.value };
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
    if (typeof data.notes === "string") {
      notesArea.value = data.notes;
      chrome.storage.local.set({ notes: data.notes });
      updateNotesCount();
    }
    saveSettings();
    saveShortcuts();
    syncControls();
    applySettings();
    renderShortcuts();
    renderShortcutList();
    layoutWidgets();
    restartIslandTimer();
    loadNews();
    loadAnnouncements();
  }).catch(() => {
    alert("That file isn't a valid Liquid Tab export.");
  }).finally(() => { e.target.value = ""; });
});

// ============================================================
// Settings search
// ============================================================
const PANE_TITLES = {
  general: "General", widgets: "Widgets & Dock", feeds: "Feeds",
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
// Notification bell
// ============================================================
$("notifBtn").addEventListener("click", () => {
  const btn = $("notifBtn");
  btn.classList.remove("ring");
  void btn.offsetWidth;
  btn.classList.add("ring");
});

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
  else if (e.key.toLowerCase() === "n") cycleIsland(1);
});

// ============================================================
// Boot
// ============================================================
updateClock();
loadState();
restartIslandTimer();
