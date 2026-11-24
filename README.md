# LinkedIn Post Preview

A single-file tool for mocking up how a LinkedIn post looks in the feed before it goes live. Built for ghostwriting: drop in the leader's profile and draft, check where the `...more` fold lands on desktop and mobile, set engagement numbers, and download a PNG to send for approval.

Open `index.html` in a browser. No build step, no server, works offline. Nothing leaves the browser.

## Features
- Profile: name, headshot, headline, badge (Premium / Verified / none), connection degree, call-to-action link
- Multiple saved profiles (browser local storage), plus export/import as JSON to move between machines
- Formats: Text and Photo (Basic), Video thumbnail and Reshare (Advanced)
- Desktop (555px feed card) and mobile (360 / 390 / 430px) views
- `...more` fold computed by measuring real line wraps, with a readout of how many characters show above the fold
- "In feed" vs "Expanded" toggle
- Reactions, comments and reposts on logarithmic sliders (0 to 100k) with presets
- Download PNG at 3x resolution

## Fold rules (caveat)
LinkedIn does not publish its truncation rules. Defaults, calibrated against real screenshots: 3 lines for text-only posts, 2 lines when there is media or a reshare, and posts of 250 characters or fewer shown in full. All three are editable under Advanced > Fold rules.
