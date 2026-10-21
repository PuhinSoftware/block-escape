# Block Escape — Prototype 0.3.1

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

## Sound (v0.2)

The 44px sound button supports touch and keyboard input and exposes its state to assistive technology. Move, blocked-move and completion effects use Web Audio with a shared context, created/resumed only after user input. No audio autoplays on page load. Unsupported audio, rejected playback and unavailable storage do not prevent play.

Sound preference uses `blockEscapeSound` (`on` / `off`, enabled by default). Existing progress in `blockEscapeUnlocked` is preserved. No libraries, audio downloads or build step are needed; relative asset paths work on GitHub Pages project sites.

## Validation

Run `node --check game.js`. With the static server running on port 8080, run `node tests/browser.cjs` in an environment providing Playwright and Chromium. On the Codex cloud image use:

```sh
NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/browser.cjs
```

The browser test covers all 10 levels, gameplay controls, saved progress, sound persistence, audio effects and unavailable/rejected audio or storage. Playwright is a development test tool only; it is not shipped with the game. Real Android/iOS audio output remains a manual check.

## Motion and touch (v0.3)

Blocks slide along their arrows and remain visible until crossing the clipped board edge; blocked moves shake briefly and wins reveal an animated success card. Board input, undo/reset and level selection are locked until the move settles, preventing duplicate moves and stale completion dialogs. Sound remains available during animation. Reduced-motion preferences skip tile movement and disable success animations. Touch controls avoid selection/callout, respect safe-area insets and retain pinch zoom. No animation libraries are used.

Animation tests: with the server on port 8080, run `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/animations.cjs`. Tests include touch input, direction, duplicate input, cancellation, reduced motion and controls after animation. Physical iPhone/Android testing remains manual.

## Board geometry regression (v0.3.1)

Both grid axes use six equal `minmax(0, 1fr)` tracks so empty rows retain square cells. Exiting tiles stay opaque, above neighboring cells and in the DOM until reaching the clipped board edge. Run `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/board-geometry.cjs` with the server on port 8080. This checks all 36 cell rectangles on mobile and desktop before, during and after the first/middle/final move, plus visible travel, duplicate input and undo/reset. Set `ARTIFACT_DIR` to an external output directory to capture midpoint screenshots.
