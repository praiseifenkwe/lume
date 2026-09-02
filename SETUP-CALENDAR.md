# Enabling the Google Calendar widget

Everything else in Liquid Tab works out of the box. The calendar is the one
feature that needs ~10 minutes of setup, because Google requires the OAuth
client ID to be tied to *your* Google account, not shipped inside the extension.

You do **not** need to publish the extension or pass Google's app verification.
An unverified app allows up to **100 test users**, which covers you and anyone
you share this with.

---

## 1. Get the extension's ID

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. **Load unpacked** → select this folder
4. Copy the **ID** shown on the Liquid Tab card — a 32-letter string like
   `abcdefghijklmnopabcdefghijklmnop`

> Keep this folder where it is. An unpacked extension's ID is derived from its
> path, so moving or renaming the folder changes the ID and breaks the OAuth
> client you're about to create.

## 2. Create a Google Cloud project

1. Go to <https://console.cloud.google.com/projectcreate>
2. Name it anything (e.g. `liquid-tab`) and create it
3. With that project selected, enable the Calendar API:
   <https://console.cloud.google.com/apis/library/calendar-json.googleapis.com>
   → **Enable**

## 3. Configure the consent screen

1. Go to **APIs & Services → OAuth consent screen**
2. User type: **External** → Create
3. Fill in only what's required: app name, your email for support, your email
   for the developer contact. Save and continue.
4. On the **Scopes** step, click **Add or remove scopes** and add:
   `https://www.googleapis.com/auth/calendar.readonly`
   Save and continue.
5. On the **Test users** step, click **Add users** and add your own Gmail
   address, plus any friend who'll use this. Save.

Leave the app in **Testing** status. Do not click "Publish app" — publishing is
what triggers the verification review, and you don't need it.

## 4. Create the OAuth client ID

1. Go to **APIs & Services → Credentials**
2. **Create credentials → OAuth client ID**
3. Application type: **Chrome Extension**
4. Item ID: paste the extension ID from step 1
5. Create, then copy the client ID — it looks like
   `123456789012-abc123def456.apps.googleusercontent.com`

## 5. Paste it into the manifest

Open `manifest.json` and replace the placeholder:

```json
"oauth2": {
  "client_id": "PASTE-YOUR-CLIENT-ID-HERE.apps.googleusercontent.com",
  "scopes": ["https://www.googleapis.com/auth/calendar.readonly"]
}
```

with your real client ID. Then go back to `chrome://extensions` and hit the
**reload** icon on the Liquid Tab card.

## 6. Connect

Open a new tab → **Settings → Feeds → Google Account → Connect**. Google will
ask you to sign in and approve read-only calendar access. You'll see an
"unverified app" warning — that's expected for a personal app in Testing mode;
click **Advanced → Go to Liquid Tab (unsafe)** to continue.

Turn on **Show Calendar Widget** in the same pane and today's events appear on
the new tab.

---

## Sharing with friends

Each person needs to be added as a **test user** in step 3.5 — otherwise Google
refuses their sign-in. They can use the same client ID; they don't need their
own Cloud project.

If someone loads the extension from a different folder path, their extension ID
will differ and the client ID won't match. Two ways around that:

- Add a second OAuth client ID in the Cloud console for their extension ID, or
- Pin a fixed extension ID by adding a `"key"` field to `manifest.json`
  (see <https://developer.chrome.com/docs/extensions/reference/manifest/key>)

## Troubleshooting

**"Connect" is greyed out** — the manifest still has the placeholder client ID,
or the extension wasn't reloaded after editing it.

**"Authorization page could not be loaded"** — the extension ID in the Cloud
console doesn't match the one in `chrome://extensions`. Usually means the folder
moved.

**"Access blocked: has not completed verification"** — the signing-in account
isn't in the test-users list.

**Events don't refresh** — click the refresh icon on the widget. Liquid Tab
fetches today's events on load, not on a timer.

## What it reads

Only today's events from your primary calendar, read-only, fetched directly from
Google into your browser. Nothing is stored anywhere else and no server sits in
the middle.
