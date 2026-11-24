# LinkedIn Post Preview

A static tool for mocking up how a LinkedIn post looks in the feed before it goes live. Built for ghostwriting: drop in the leader's profile and draft, check where the `...more` fold lands on desktop and mobile, set engagement numbers, and download PNGs to send for approval.

Open `index.html` in a browser, or deploy the folder as a static site (Vercel: Framework Preset "Other", no build command). No server, works offline, nothing leaves the browser.

## Files
- `index.html`: layout and styles
- `app.js`: all app logic
- `vendor/html-to-image.js`: html-to-image 1.11.11 (MIT), used for PNG export

## Features
- **Profiles:** name, headshot, headline, badge, connection degree, call-to-action link. Save several, rename them with your own labels (the label never appears on the post), export/import as JSON.
- **Formats:** Text and Photo (Basic), Video thumbnail and Reshare (Advanced).
- **Views:** desktop (555px card) and mobile (360 / 390 / 430px), in feed or expanded.
- **Fold readout:** measures real line wraps and reports how many characters show above `...more`.
- **Engagement:** reactions, comments and reposts on logarithmic sliders (0 to 100k) with presets.
- **Library:** save mockups into named groups. Open, rename, duplicate, move between groups, delete. "Use" loads a saved post onto the profile you have open, so any mockup doubles as a template.
- **Bulk download:** export a whole group as a ZIP of numbered PNGs, as desktop, mobile or both, in feed, expanded or both, and optionally re-rendered as a different saved profile.
- **Backup:** one JSON file holds all groups, mockups and profiles. Use it to move between browsers or machines.

## Storage
Profiles and the working draft live in `localStorage`; the library lives in IndexedDB. Both are per browser and per domain, and are wiped if site data is cleared. Back up the library regularly.

## Fold rules (caveat)
LinkedIn does not publish its truncation rules. Defaults, calibrated against real screenshots: 3 lines for text-only posts, 2 lines with media or a reshare, and posts of 250 characters or fewer shown in full. All three are editable under Advanced > Fold rules.
