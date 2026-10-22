# Block Escape — Prototype 0.5.1

Android-first mobile browser puzzle prototype, no framework or build required.

## Run

Open `index.html` in a modern browser. For Android testing, host the folder using any static HTTPS hosting service (e.g. GitHub Pages) and open its URL in Chrome. Some Android file managers can also open `index.html` locally, but browser restrictions vary.

For local desktop testing: `python -m http.server 8080` in this directory, then visit `http://localhost:8080`.

## Mechanics

Tap an arrow block. It exits the 6x6 board if no other block or wall is in the path between it and the board edge. Clear all blocks to win. Blocked taps do not consume moves. Reset, level select and browser-local progress are included.

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

Blocks slide along their arrows and remain visible until crossing the clipped board edge; blocked moves shake briefly and wins reveal an animated success card. Board input, reset and level selection are locked until the move settles, preventing duplicate moves and stale completion dialogs. Sound remains available during animation. Reduced-motion preferences skip tile movement and disable success animations. Touch controls avoid selection/callout, respect safe-area insets and retain pinch zoom. No animation libraries are used.

Animation tests: with the server on port 8080, run `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/animations.cjs`. Tests include touch input, direction, duplicate input, cancellation, reduced motion and controls after animation. Physical iPhone/Android testing remains manual.

## Board geometry regression (v0.3.1)

Both grid axes use six equal `minmax(0, 1fr)` tracks so empty rows retain square cells. Exiting tiles stay opaque, above neighboring cells and in the DOM until reaching the clipped board edge. Run `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/board-geometry.cjs` with the server on port 8080. This checks all 36 cell rectangles on mobile and desktop before, during and after the first/middle/final move, plus visible travel, duplicate input and reset. Set `ARTIFACT_DIR` to an external output directory to capture midpoint screenshots.

## Mobile containment regression (v0.3.2)

Cells are size-contained and blocks are absolutely positioned within them, so glyphs/native button intrinsic sizing cannot determine grid track sizes. Button appearance, padding, minimum dimensions and line height are explicit. Cells clip normal content but allow overflow only for the exiting cell, preserving directional motion.

Run `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/mobile-grid.cjs` with the server on port 8080. It checks 320/375/390/430px, both normal and oversized content, all 36 cell rectangles and block-to-cell containment across every move in all 10 levels, reset. `ARTIFACT_DIR` captures real browser screenshots outside the checkout. Set `BROWSER=webkit` (and `PLAYWRIGHT_BROWSERS_PATH` if installed separately) to run the same suite in Playwright WebKit; engine startup failure is a failing command, never silently replaced with Chromium.

Observed before the fix: an oversized arrow at 320px produced a 108×133px button inside a 39.17×39.17px cell. Previous tests checked only cell geometry, missing button overflow. This stress reproduction proves intrinsic-content coupling; it does not reproduce or identify an iPhone-specific WebKit defect. Normal Chromium layouts passed before this change. WebKit installation in the current environment was blocked by HTTP 403 from cdn.playwright.dev and playwright.download.prss.microsoft.com; WebKit and physical iPhone behavior remain unverified. MDN/WebKit documentation requests were also blocked by the network policy. Do not report Chromium mobile emulation as Safari validation.

## Main menu (v0.4)

`menu.css` and `menu.js` own the presentation/navigation layer; the existing game retains its levels, moves, storage and exit animations. Sky/background, logo, floating island (`assets/island.svg`), Bloop (`assets/bloop.svg`) and action buttons are independent layers. The current artwork adapts the approved reference supplied in chat; provenance and licence limits are documented in `assets/LICENSES.md`.

OYNA starts the highest unlocked level on the first visit, then resumes the current in-memory game when returning from the game’s Ana menü button. BÖLÜM SEÇ uses existing unlock rules. Reloading preserves the original unlocked-level and sound keys, not an unfinished board (same storage model as before). Decorations honor reduced motion and have a pause control. Native buttons, visible focus, hidden inactive screens, dialog keyboard containment/Escape and safe-area padding support accessible mobile navigation. No external fonts, libraries, network artwork or build step are required; relative assets support GitHub Pages project paths.

Run `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/menu.cjs` with the server on port 8080. Set `ARTIFACT_DIR` to save screenshots outside the checkout. Tests cover 320/375/390/430px and desktop, play/resume, level locks, keyboard/dialog focus, reduced motion, pause and storage preservation. Existing gameplay suites enter through the menu before testing their original checks. Chromium mobile emulation is not iPhone Safari validation; WebKit remains unavailable in this environment after its download was blocked by network policy.

## Approved-reference menu redesign

The menu now follows the supplied “Blok Kaçış_ Renkli Macera.png” composition: blue sky, grassy floating rock islands, a glowing portal/stone bridge, crowned white-and-gold logo, glossy cyan cube Bloop, bright blue OYNA and dark BÖLÜM SEÇ. `world.png` is environment-only, `bloop.png` is transparent character artwork, `foreground-island.png` is a separate transparent island, and `logo.svg` is independent vector lettering. Cloud and island DOM layers, native HTML buttons and transitions remain independently animated. The supplied composite is not used as the UI backdrop. Earlier vector assets remain as unused project source artwork.

Only functional controls are shown: play, levels, shared sound preference and animation pause. Reference leaderboard/statistics/settings tiles were omitted because those features do not exist. Bloop jumps, islands sway and clouds drift; press feedback and opacity screen transitions respect reduced motion, including changes during a transition. No external animation libraries or web fonts were added. SVG/system lettering and generated scene/character are visual approximations, not pixel-exact copies of the reference.

With the static server running, run `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/reference-menu.cjs` alongside the five existing suites. This adds 320×568, 375×667, 390×844 and 430×932 checks for rendered motion, press feedback, sound synchronization and reduced-motion changes. Use `BROWSER=webkit` to require WebKit (no fallback). WebKit is unavailable on this machine; previous installation requests were denied by network policy. Chromium mobile emulation does not validate physical iPhone Safari or Android Chrome. Asset provenance is recorded without claiming independent rights clearance for the user-supplied reference.

## Menu polish and settings (v0.4.1)

The existing Bloop/logo/island artwork is unchanged. The responsive scene fills available screen space with a contained character, larger 72px play target, subtle light pulse and press feedback. Matching top-corner settings/sound controls open an independent settings dialog with sound and menu motion controls. The panel traps keyboard focus, supports Escape/backdrop/close/done, restores focus, locks background scrolling and keeps background content inert. The original game sound preference is shared across all controls; progress and board state are unchanged. Reduced motion disables the pulse and decorative animations.

Run `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/settings.cjs` with the server on port 8080, plus existing suites. This checks 320×568, 375×667, 390×844 and 430×932, fitting controls, keyboard/touch interaction, sound persistence and motion controls. `ARTIFACT_DIR` saves menu/settings screenshots outside the checkout. The initial test attempt encountered a stale HTTP server returning empty responses; restarting the prior onboarding server restored the test prerequisite. Chromium results do not establish physical Safari/Android compatibility.

## Fantasy gameplay presentation (v0.5)

`gameplay.css` adds the menu's existing floating-island environment to gameplay, a stone platform frame outside the board, glossy direction-colored tiles, HUD cards, themed reset/home controls, a noninteractive Bloop helper outside the grid and a Bloop/medal/confetti win dialog. Existing menu artwork is reused; no new image downloads, libraries or licence assumptions are added. The home button now lives in the game header. The existing level picker shares the dialog and hides victory-only decorations.

The six equal grid tracks, size-contained cells, absolute zero-padding buttons and exit-animation overflow rules stay in `style.css`; the platform is a pointer-transparent outer pseudo-element and does not change grid dimensions. Game rules, authored levels, storage keys, reset and audio logic in `game.js` remain unchanged. Native touch targets, safe-area spacing, pinch zoom, keyboard focus and reduced-motion fallback are retained. Short phones can scroll vertically to reach controls; horizontal overflow is disallowed.

With the static server on port 8080 run `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/gameplay-ui.cjs` alongside the seven existing suites. Set `ARTIFACT_DIR` to capture gameplay/victory screenshots outside the checkout; use `BROWSER=webkit` to require WebKit without fallback. Tests cover 320×568, 375×667, 390×844 and 430×932, all 36 cell rectangles, first/middle/final removal, block containment/hit testing, nonblocking helper, controls, win/reduced-motion, reset, settings sound sync, menu return and saved unlocking. The existing oversized-content regression now uses `.app .block` specificity to ensure the new theme cannot mask the 96px glyph stress test.

WebKit is not installed in the current environment and its previous download attempts were denied by network policy. A failing WebKit launch does not validate Safari; Chromium mobile emulation does not replace physical iPhone Safari or Android Chrome tests. An initial stale HTTP server returned empty responses; it was restarted with logs redirected outside the checkout before repeating tests.

## Crystal Mines (current v0.5 gameplay)

The first world is now KRİSTAL MADENLERİ: a separate warm lantern-lit mine backdrop, generated miner-costume Bloop and an original SVG stone/timber frame. The HUD reads Home → Level → Moves → Remaining. The only bottom buttons are YENİDEN BAŞLAT and BÖLÜM SEÇ; sound remains above the board and in the existing menu settings. Tiles use glossy direction colors and noninteractive SVG arrow overlays while retaining their accessible labels. Forced-color mode exposes the original text arrows. No star rating, score, additional level or wide-block mechanic was added. The reference's different-looking board is deliberately adapted to the unchanged 6×6 rules.

The former reversal feature is fully removed: button, handler, function, in-memory snapshots and previous assertions. Ctrl/Command+Z has no game action. Reset, path rules, all 10 authored levels, win detection, exit/blocked animations, sound and both storage keys remain intact. Main menu/settings HTML, CSS, JavaScript and their artwork are unchanged. No new continuous gameplay animation, blur or animation library was added; the existing short victory confetti is disabled for reduced motion. Original PNG sources and provenance are listed in `assets/LICENSES.md`.

Run all nine browser suites with the static server on port 8080 and the documented NODE_PATH. New command: `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/crystal-mines.cjs`. `ARTIFACT_DIR` saves 320/375/390/430px gameplay and win screenshots outside the checkout. The new checks cover absent reversal state/UI/shortcuts, control/HUD order, square-cell stability after each move/reset, tile containment, unlocking, sound/menu return and reduced motion. Existing tests were updated only where the deliberately removed feature was referenced.

Validation: baseline 10-level/audio and mobile containment suites passed before edits; all nine Chromium suites and syntax checks passed after edits. Authored level/vector definitions remain byte-identical (SHA256 `02443742c8071e4eee47eba4ed088767b3b605d1d93e0ee3ceab0c596f1de0c4`). WebKit launch was blocked by its missing executable; previous downloads were denied by network policy. No physical iPhone/Android validation is claimed.

## v0.5.1 art upgrade

Started from main commit `dc5776a9b15254077d8ad1efd0d011135621c62f` on the separate `feature/block-escape-v0.5.1-art-upgrade` branch. `art-upgrade.css` skins the existing DOM with generated, optimized stone cells/enamel block faces and independent embossed arrow/frame/panel/icon SVGs. Bloop is larger, with separate crystal/lantern decorations that cannot intercept taps. No reference screenshot is used as the game UI. The actual first ten levels determine block placement, including the sparse first board.

`game.js`, grid sizing/containment in `style.css`, menu/settings code and original menu assets are unchanged. No reversal or scoring/star system is introduced. The game-specific WebP/SVG package totals 203549 bytes (198.8 KiB), replacing large gameplay PNG requests with a 155082-byte environment/miner pair plus reusable small skins. This is the new gameplay art size, not the size of the unchanged main menu or entire repository. Source/optimization/provenance details are in `assets/gameplay/README.md` and `assets/LICENSES.md`.

With the static server on port 8080, run the nine existing browser suites and `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/art-upgrade.cjs`. Set `ARTIFACT_DIR` for 320/375/390/430px first/second-level screenshots; `BROWSER=webkit` requires WebKit without fallback. The new test checks independent art layers, transparency/opaque faces, the <240KiB art budget, a single shared cell-texture request, no old gameplay PNG requests, four arrow/color skins, unobstructed hit targets and menu return.

Validation: baseline gameplay/10-level/audio and mobile containment checks passed; all ten Chromium suites and JS syntax checks passed. Initial visual review caught panel letterboxing, fixed with SVG scaling. The new alpha check caught slightly translucent generated block faces; normalization restored opaque centers while keeping transparent corners. WebKit launch failed because its executable is absent (earlier installation attempts were blocked by network policy). Chromium mobile emulation is not physical Safari/Android validation.
