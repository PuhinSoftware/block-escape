# Block Escape development

## Architecture
- Static, dependency-free browser game. `index.html` defines the Turkish UI, `style.css` the responsive layout and `game.js` authored levels, movement, rendering, storage and synthesized audio.
- Preserve the 6×6 rules, all 10 authored levels, blocked taps without move cost, undo/reset and level unlocking.
- `blockEscapeUnlocked` stores existing progress. Never clear storage or rename this key. `blockEscapeSound` independently stores `on` / `off`.

## Coding rules
- Use vanilla JavaScript, CSS and HTML; no framework, build pipeline or runtime dependencies without a concrete need.
- Keep labels accessible and Turkish; interactive touch targets must be at least 44px.
- Handle unavailable storage and Web Audio gracefully. Create/resume the shared audio context only on user gestures; catch rejected promises. Disconnect completed audio nodes.
- Do not alter levels as a workaround for test failures. Keep unrelated changes out of a feature branch; never push directly to main.

## Run and test
- From the repository root: `python3 -m http.server 8080 --bind 127.0.0.1`.
- Syntax: `node --check game.js`.
- Browser: `node tests/browser.cjs` with Playwright available and the server on port 8080. In the cloud image: `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/browser.cjs`. Chromium defaults to `/usr/bin/chromium`; override with `CHROMIUM_PATH` if needed.
- Check all 10 levels, blocked/valid moves, undo/reset, saved unlocking, mute persistence and audio/storage failure fallbacks. Test actual audible output on mobile devices manually.

## GitHub Pages
- All assets must use relative paths so owner/repository project URLs work. No backend, secrets, Node runtime, external CDN or build step is required for deployment.
- Keep the site usable over static HTTPS hosting; browser audio policies still require a user gesture.

## Animations
- Use the shared busy guard for board mutations; keep undo/reset and level selection locked until animation completion. Always release locks on cancellation or unsupported animation APIs.
- Honor `prefers-reduced-motion` in JavaScript and CSS. Preserve pinch zoom and safe-area padding on mobile.
- Run `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/animations.cjs` alongside the existing browser suite.

## Board geometry
- Keep explicit equal grid tracks on both axes; empty cells must not collapse or depend on block content.
- Moving blocks must stay opaque and above adjacent cells until they cross the board edge; retain the DOM node until completion.
- Run `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/board-geometry.cjs` for mobile/desktop rectangle and visible motion regressions.
