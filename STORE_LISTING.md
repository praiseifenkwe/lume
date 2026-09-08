# Microsoft Edge Add-ons — Store Submission Kit

Everything you need to copy and paste into the **Microsoft Partner Center** submission form.

---

## 1. Quick Links & Files Ready On Your Computer
- **Upload Zip Package**: 
  - On your Desktop: `C:\Users\LENOVO\Desktop\lume-v4.1.zip`
  - In project root: [`lume-v4.1.zip`](file:///c:/Users/LENOVO/Desktop/actively-working/liquid%20tab/lume-v4.1.zip)
- **Store Screenshots & Icon**:
  - Located in: [`store-assets/`](file:///c:/Users/LENOVO/Desktop/actively-working/liquid%20tab/store-assets)
    - `store-icon-128.png` (128x128 store logo)
    - `screenshot-1-photo.png` (Unsplash landscape + Now Island)
    - `screenshot-2-gradient.png` (Emerald mesh gradient)
    - `screenshot-3-solid.png` (Obsidian dark minimal)
    - `screenshot-4-light-mode.png` (Clean light mode)
    - `screenshot-5-about.png` (Settings & About modal)

---

## 2. Store Listing Text (Copy & Paste)

### Extension Name:
```text
Lume - Minimalist New Tab & Focus
```

### Short Description (under 100 characters):
```text
A calm new tab with live weather, Now Island, ambient focus soundscapes, and dynamic wallpapers.
```

### Category:
- Primary: **Personalization** (or **Productivity**)

---

### Detailed Description:
```text
Transform every new tab into a calm, radiant space designed for clarity and deep focus.

Lume replaces the default blank page with a lightning-fast dashboard featuring dynamic visual themes, live weather, curated daily wisdom, ambient soundscapes, and an intuitive quick-access dock.

✨ KEY FEATURES:

🌊 Dynamic Wallpapers
• High-resolution curated photography powered by Unsplash
• Smooth animated mesh gradients
• Minimalist obsidian solid black for distraction-free OLED viewing
• Custom local wallpaper upload support

🏝️ Dynamic Now Island & Live Weather
• Real-time local temperatures, daily high/lows, and current conditions
• Automatic location detection via Open-Meteo API
• Dynamic greeting and interactive status indicator

🎧 Ambient Soundscapes
• Built-in background focus sounds: White Noise, Gentle Rain, and Binaural Beats
• Independent volume slider for seamless flow-state sessions

⏱️ Minimalist Clock & Curated Quotes
• 12-hour and 24-hour time formatting with seconds toggle
• Carefully curated library of daily wisdom and timeless quotes
• Automatic contrast switching for dark and light modes

⚡ Smart Dock & Bookmarks
• Quick access to your favorite bookmarks and most visited sites
• Auto-retrieved high-res website icons
• Instant search switcher (Google, DuckDuckGo, Bing, Brave)

🔒 100% PRIVATE & OFFLINE-READY:
• Zero tracking, zero telemetry, zero analytics
• No accounts, sign-ups, or subscriptions required
• Pure Vanilla JavaScript — opens in under 50ms with zero lag

Crafted with care by Praise Ifenkwe.
```

---

## 3. URLs Required by Microsoft

### Privacy Policy URL:
```text
https://github.com/praiseifenkwe/lume/blob/main/PRIVACY.md
```

### Support / Website URL:
```text
https://github.com/praiseifenkwe/lume
```

### Contact Email:
```text
(Your personal email address)
```

---

## 4. Permission Justifications (If Prompted by Reviewer)

If the Partner Center form asks for justification for requested permissions, copy and paste these:

- **`storage`**:
  > Used locally on the user's machine to store their wallpaper preference, clock format, custom dock links, and sound volume via chrome.storage.local.

- **`geolocation`**:
  > Used to detect the user's approximate coordinates to display real-time local weather forecasts via the Open-Meteo API.

- **`bookmarks` & `topSites`**:
  > Used exclusively within the tab UI to display the user's bookmarks or frequently visited sites in the dock. Browsing data is never collected or sent anywhere.

- **`favicon`**:
  > Used to retrieve and display website icons next to links in the user's custom dock.
