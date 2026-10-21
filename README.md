# Block Escape — Prototype 0.1

Android-first mobile browser puzzle prototype, no framework or build required.

## Run

Open `index.html` in a modern browser. For Android testing, host the folder using any static HTTPS hosting service (e.g. GitHub Pages) and open its URL in Chrome. Some Android file managers can also open `index.html` locally, but browser restrictions vary.

For local desktop testing: `python -m http.server 8080` in this directory, then visit `http://localhost:8080`.

## Mechanics

Tap an arrow block. It exits the 6x6 board if no other block or wall is in the path between it and the board edge. Clear all blocks to win. Blocked taps do not consume moves. Undo, reset, level select and browser-local progress are included.

## Files

- `index.html`: screen structure
- `style.css`: responsive portrait styling
- `game.js`: levels, collision/path checks, progress, interaction

## Next milestones

1. Test on a real Android device and collect usability feedback.
2. Add levels with a verified puzzle generator and more varied obstacles.
3. Add lightweight analytics with consent/privacy design.
4. Decide whether to package as PWA or migrate gameplay to Flutter + Flame for native release.
5. Prepare signed Android builds, Google Play closed testing, and compliant monetization.

No ads, telemetry, accounts, backend, or in-app purchases are included in this prototype.
