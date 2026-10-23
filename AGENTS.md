# Block Escape development

## Architecture
- Static, dependency-free browser game. `index.html` defines the Turkish UI, `style.css` the responsive layout and `game.js` catalog loading, rendering, storage and synthesized audio. `engine/rules.js` is the shared Node/browser movement API; `engine/catalog.js` validates the versioned JSON catalog.
- Preserve the 6×6 rules, the 25 published v0.6 levels, collision taps without successful-move cost but with one-life damage, reset and level unlocking.
- `blockEscapeUnlockedV06` stores new-catalog progress. Never read/migrate/delete/overwrite the legacy `blockEscapeUnlocked` key. Never clear storage. `blockEscapeSound` independently stores `on` / `off`.

## Coding rules
- Use vanilla JavaScript, CSS and HTML; no framework, build pipeline or runtime dependencies without a concrete need.
- Keep labels accessible and Turkish; interactive touch targets must be at least 44px.
- Handle unavailable storage and Web Audio gracefully. Create/resume the shared audio context only on user gestures; catch rejected promises. Disconnect completed audio nodes.
- Do not alter levels as a workaround for test failures. Keep unrelated changes out of a feature branch; never push directly to main.

## Run and test
- From the repository root: `python3 -m http.server 8080 --bind 127.0.0.1`.
- Syntax: `node --check game.js`.
- Browser: `node tests/browser.cjs` with Playwright available and the server on port 8080. In the cloud image: `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/browser.cjs`. Chromium defaults to `/usr/bin/chromium`; override with `CHROMIUM_PATH` if needed.
- Check all 25 levels, blocked/valid moves, reset, saved unlocking, mute persistence and audio/storage failure fallbacks. Test actual audible output on mobile devices manually.

## GitHub Pages
- All assets must use relative paths so owner/repository project URLs work. No backend, secrets, Node runtime, external CDN or build step is required for deployment.
- Keep the site usable over static HTTPS hosting; browser audio policies still require a user gesture.

## Animations
- Use the shared busy guard for board mutations; keep reset and level selection locked until animation completion. Always release locks on cancellation or unsupported animation APIs.
- Honor `prefers-reduced-motion` in JavaScript and CSS. Preserve pinch zoom and safe-area padding on mobile.
- Run `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/animations.cjs` alongside the existing browser suite.

## Board geometry
- Keep explicit equal grid tracks on both axes; empty cells must not collapse or depend on block content.
- Moving blocks must stay opaque and above adjacent cells until they cross the board edge; retain the DOM node until completion.
- Run `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/board-geometry.cjs` for mobile/desktop rectangle and visible motion regressions.

## Mobile containment
- Cells must not derive size from glyph/button intrinsic dimensions. Keep buttons out of grid sizing flow, with explicit appearance/padding/minimum dimensions. Clip normal cell content and allow overflow only on the exiting cell.
- Run `tests/mobile-grid.cjs` using the same NODE_PATH as other suites; use `BROWSER=webkit` for a separately installed WebKit engine. It covers 320/375/390/430px, all levels and large-content stress. Never label Chromium emulation as iPhone/Safari testing or silently skip a missing engine.

## Main menu
- `menu.css` / `menu.js` and local SVG assets own independent presentation layers. Do not let menu selectors alter board/cell/block sizing. Preserve gameplay state when returning to the menu.
- Respect reduced motion and the pause control. Keep inactive screens hidden, native buttons, keyboard focus and dialog Escape/Tab behavior.
- Run `tests/menu.cjs` with the documented NODE_PATH alongside all gameplay suites. Existing suites must enter via OYNA after navigation; explicit game fixtures may select their original level.

## Approved artwork
- Menu artwork follows the reference supplied in chat. Keep environment, Bloop, logo, islands and functional buttons separate. See `assets/LICENSES.md` before reusing/distributing assets; do not assert independent rights clearance.
- Run `tests/reference-menu.cjs` alongside existing tests. New screen transitions must cancel when reduced motion changes at runtime. Menu sound must share the game's preference key.

## Settings panel
- Keep settings in the independent menu presentation layer. Shared sound controls must use the existing game sound key; preserve artwork and gameplay state.
- Settings must trap/restore focus, support Escape and touch closing, prevent background interaction and honor reduced motion. Keep menu controls at least 44px and the play target at least 72px.
- Run `tests/settings.cjs` with the documented NODE_PATH alongside other suites. Capture mobile layouts via `ARTIFACT_DIR` outside the checkout.

## Gameplay presentation
- `gameplay.css` is presentation only. Keep stone framing outside the grid, all 36 equal cells independent of contents, and Bloop/decorations pointer-transparent and outside playable tiles. Do not alter game rules or storage for visual changes.
- Reuse existing licensed/provenance-documented artwork. Keep victory decorations hidden in the level picker; reduced motion must disable celebration effects.
- Run `tests/gameplay-ui.cjs` with the documented NODE_PATH plus all existing suites. It supports `BROWSER=webkit` and `ARTIFACT_DIR`. Stress styles in grid tests must match theme specificity to avoid silently weakening overflow coverage.

## Crystal Mines and removed action
- Gameplay's first world is Crystal Mines. Keep the menu unchanged; mine environment, miner Bloop, frame, real board and controls are separate layers. v0.6.2 explicitly adds separate progress and performance stars. v0.6 intentionally replaces the original ten arrangements with 25 newly generated puzzles; exclude retired signatures.
- The reversal action and its in-memory snapshots have been intentionally removed. Do not restore its button, handler, state or shortcuts. Bottom gameplay controls are reset and level select only.
- Run `tests/crystal-mines.cjs` plus the eight existing suites using the documented NODE_PATH. It supports `BROWSER=webkit` and `ARTIFACT_DIR`; do not claim Safari coverage when WebKit is missing.

## v0.5.1 asset skins
- Keep `art-upgrade.css` scoped to gameplay. Actual grid sizing/containment, menu and game logic remain in the existing files; graphics must never determine cell dimensions or intercept taps.
- Artwork/provenance/encoding are documented in `assets/gameplay/README.md` and `assets/LICENSES.md`. Reuse cached small textures and offline color variants; avoid runtime tint filters and new endless gameplay animations.
- Run `tests/art-upgrade.cjs` with the documented NODE_PATH plus all nine prior suites. It validates art/network budgets, texture caching, real hit targets and mobile layout; it supports `ARTIFACT_DIR` and `BROWSER=webkit`.

## v0.6 data pipeline
- `levels/catalog.json` distinguishes planned 300 from available 25. Only referenced packs are playable. Keep schema version 1, unique contiguous IDs, correct 75-level world ranges and 6×6 dimensions.
- Movement is monotonic removal; every completed solution has one move per block. Do not claim strategic order or BFS-derived difficulty. Generator/solver must call the shared rules; quality gates and retired/symmetry/near-duplicate filtering are in `tools/level-quality.cjs`.
- Preserve the accepted seed `crystal-v06-2026`, bounded attempts/time, generation provenance and deterministic reports. Never accept a solver limit as solvable.
- Run `node --test tests/level-system.test.cjs`, `node tools/generate-levels.cjs --check`, `node tools/validate-levels.cjs` and `tests/run-browser.cjs` with the above NODE_PATH/server. The runner fails if any suite fails. Use `ARTIFACT_DIR` outside the checkout.
- Keep JSON fetch failure/retry accessible, prevent play before complete validation, and use relative URLs for static hosting. `file://` is not supported.
- Changing existing puzzle semantics requires an explicit data/progress version decision. Adding future levels must preserve the reviewed prefix, regenerate reports, extend acceptance tests and review difficulty on real boards. Future world art is not delivered by catalog metadata.

## v0.6.1 collision laboratory
- The 25 published v0.6 JSON levels and progress key remain unchanged. `?lab=collision` loads only the five separate `levels/lab/collision-v1.json` levels; never read/write normal progress for lab unlocking. Sound remains shared.
- Route gameplay through shared `traceMove` / `createState` / `transition`. Scan the whole ray and stop at the first typed block/wall contact. Collisions retain every coordinate, cost exactly one life and no successful move. States are playing/won/failed; terminal states reject input. Every restart/next level starts with 3 lives.
- `collision.js` and `collision.css` own effects only. Keep a single busy lock through outward contact, shake and return. Prepare audio on the input gesture; honor mute at impact. Vibration is optional, and reduced motion skips motion/particles/haptics. Release locks on unsupported/cancelled/paused animations.
- Failed dialogs offer retry and menu only; Escape must not resume a zero-life game. Ordinary level-picker dialogs must remain dismissible even after failure/menu return. Preserve focus trapping and touch-sized controls.
- Do not claim permanent traps from legal removals. Collision edges only lose lives; current solver prunes them. Future lock/key mechanics require validating a new schema/state/solver assumption, not merely adding decorative fields.
- Run both Node suites, `tools/validate-collision.cjs`, unchanged v0.6 generation/verification and all 12 browser suites. Use document coordinates for stable geometry across legitimate vertical scrolling; compare horizontal bounds with the actual viewport, not expanded innerWidth.

## v0.6.2 timer laboratory
- Keep the normal 25 levels untimed and collision lab unchanged. Timer lab uses a separate pack. `engine/performance.js` owns active time and scoring; `timer-stars.js` owns presentation and lifecycle. Pause before every animation, dialog, screen transition and hidden page.
- Preserve all older storage keys; best ratings use `blockEscapeBestStarsV062` with separate normal/collision/timer namespaces. Run timer Node and browser suites alongside all existing regressions.

## v0.6.2.1 HUD and reward cues
- Keep completion progress free of stars. Potential rewards delegate to the shared performance scorer; failure is zero, a possible successful completion is at least one. Do not copy threshold rules into UI files.
- Only result stars celebrate. `star-audio.js` reuses the gesture-unlocked shared context, with no delayed context creation/resume. Cancel queued reveals and active voices on dialog dismissal/next; respect mute and reduced motion.
- Run `tests/hud-polish.test.cjs` plus all previous Node tests and the 14-package browser runner. Keep the 28px panel readable and geometry checked at 320/375/390/430px.


## v0.6.3 central audio
- `audio-manager.js` owns the single lazy context, persistent music element, separate gains/settings and bounded effects. Gameplay emits events; never add a second sound engine. `audio-ui.js` owns controls/lifecycle. The game note is music-only.
- Migrate legacy mute to both channels without rewriting the old key. Keep versioned `blockEscapeAudioV063` settings independent from progression and ratings. No automatic playback before a gesture; handle missing/rejected audio and background suppression.
- Preserve normal/lab data and reward scoring. Stars are performance awards, not progression cues. Victory follows star tails. Same-world level changes must not reset music time.
- Run all five Node suites and the 15-package browser runner, including `audio-system-browser.cjs`. Check 320/375/390/430px ranges, independent toggles, media fallback, mute migration and lifecycle. Do not claim Safari hardware/audio listening coverage from Chromium.


## v0.6.3.1 victory lifetime
- Use per-cue native completion, not fixed victory/restoration timeouts. Mastered samples retain their own envelope; only intermediate star windows may be trimmed. A victory is protected and once per attempt on the shared context.
- Explicit cancellation invalidates queued reward audio. Menu/next/mute/hidden page cancels; nonzero gain changes do not. Hold gain automation before retargeting and never pause/restart music for ducking.
- Run all six Node suites and the 16-package browser runner. The victory suite checks actual WAV duration/native ended, offline-rendered sample gain, and cancellation including mute/unmute. Preserve audio settings, data and scoring.
