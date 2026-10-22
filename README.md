# Block Escape — Prototype 0.6.1

Android-first mobile browser puzzle prototype, no framework or build required.

## Run

Serve the repository over HTTP/HTTPS: the versioned JSON catalog is fetched asynchronously, so opening `index.html` with `file://` is not supported. For device testing use static HTTPS hosting or a reachable development server. GitHub Pages project paths are supported with relative URLs; publishing is a separate action.

For local desktop testing: `python -m http.server 8080` in this directory, then visit `http://localhost:8080`.

## Mechanics

Tap an arrow block. It exits the 6x6 board if no other block or wall is in the path between it and the board edge. Clear all blocks to win. Blocked taps do not consume moves. Reset, level select and browser-local progress are included.

## Files

- `index.html`: screen structure
- `style.css`: responsive portrait styling
- `game.js`: JSON loading, progress, interaction, rendering and audio
- `engine/rules.js`: shared movement/validation API (browser + Node)
- `engine/catalog.js`: catalog/version/world validation
- `levels/`: schema, catalog and published JSON packs
- `tools/`: seeded generation, quality gates, solver and verification
- `reports/`: reproducible solution reports and test evidence

## v0.6.1 collision / lives (current gameplay)

Normal play still uses the exact 25 published v0.6 layouts and `blockEscapeUnlockedV06` progress. All levels now start with **3 lives**. A block travels along its arrow to the first occupied square anywhere on its ray, makes contact, shakes and returns to its original square; every other block stays put. Contact costs one life, no successful-move count, and does not remove the block. A clear ray exits without damage. Input/reset/navigation are locked during travel and return. At zero lives, **LEVEL FAILED** offers **Tekrar Dene** (original board + 3 lives) and **Ana Menü**. Returning to the menu mid-level preserves lives; playing after failure restarts the failed level. The next level always gets 3 fresh lives. Lives are session state, not saved progress.

`engine/rules.js` now exposes `traceMove` (ordered ray/first typed block-or-wall contact), `createState` and immutable `transition` (`exit`, `collision`, `ignored`; state includes blocks/moves/lives/status). Both the UI and solver use `transition`. The previous geometry helpers remain compatible with the v0.6 generator and its reports. `collision.js` / `collision.css` implement bounded contact/shake/return effects, a transient spark, optional 15ms vibration, heart loss and the compact blue/gold life rail. Audio is prepared on the original user gesture and played at contact only if still enabled. Missing/throwing vibration or animation APIs are nonfatal; reduced motion skips movement, particles, heart motion and vibration. No new library, undo, score or game artwork is introduced.

### Separate five-level laboratory

Run the local server and open **`http://127.0.0.1:8080/?lab=collision`** (on a project site append `?lab=collision` to its normal page URL). This loads only `levels/lab/collision-v1.json`, visibly labels TEST mode and unlocks the five laboratory levels without reading or writing normal progress. There is no lab level in the normal 25-item picker. Remove the query parameter to return to the normal catalog. This developer URL is not an authentication boundary and does not publish/deploy anything.

| Test | Name | Blocks | Minimum successful moves | Dependency waves | Initially free |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | Çarpışmayı Öğren | 3 | 3 | 2 | 2 |
| 2 | Doğru Sıra | 5 | 5 | 5 | 1 |
| 3 | Zincirleme Açılma | 6 | 6 | 6 | 1 |
| 4 | Dikkatli Seçim | 6 | 6 | 4 | 2 |
| 5 | Kristal Ustalığı | 12 | 12 | 9 | 2 |

These are hand-designed tests, not 300 generated levels. Levels 3 and 4 deliberately have the same count but different dependency/choice structures. All five solve with all 3 lives, can recover after two deliberate collisions, and fail on a third. See [solution/contact traces](reports/collision-solutions.json) and [technical/test report](reports/v061-tests.md).

**Design limit:** successful removal only opens paths. A legal successful move cannot permanently trap another block; we do not simulate or advertise such a trap. Strategy here is inspecting near/distant blockers and avoiding damage, not choosing between mutually destructive successful actions. The solver skips collision edges because they preserve the board and only reduce lives; complete legal orderings remain optimal with one successful move per original block. A fixed wall directly on a block's ray would make that block permanently unremovable under these rules, so playable laboratory walls are outside solution rays. Separate negative fixtures test wall collision/failure.

For future keys/locks/special obstacles, extend schema validation and `traceMove`'s typed contact resolution, then `transition`/state serialization. Keep visual effects consumers of contact coordinates, never owners of movement rules. If future actions can change directions/locks/inventory, revisit the monotonic proof and solver (e.g. bounded state search); the present greedy optimality claim must not be reused automatically.

### Collision verification

```sh
node tests/collision.test.cjs
node tests/level-system.test.cjs
node tools/validate-collision.cjs
# Only after intentionally editing the laboratory data:
node tools/validate-collision.cjs --write
# With the HTTP server running:
NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules ARTIFACT_DIR=/tmp/block-escape-v061 node tests/run-browser.cjs
```

The runner now includes 12 browser suites, adding `tests/collision-browser.cjs`. The new suite covers 320/375/390/430px contact/return frames, actual touch targets, one-life duplicate guard, terminal failure, retry/menu, all five lab solutions, normal save isolation, fixed-wall contact in all directions, mute/reduced motion and unsupported/cancelled/paused APIs. `tests/fixtures/v06-hashes.json` pins the published catalog/25 layouts/old reports to v0.6 commit `d4da51f`. Existing generator reproduction and 25-level verification commands below still apply unchanged. WebKit requires a separately available test engine; use `BROWSER=webkit` with `tests/collision-browser.cjs` to require it without a Chromium fallback.

## v0.6 level data system (retained)



Only **25 new levels** are playable. The previous ten layouts have been replaced, not extended or reused. `levels/retired-signatures.json` excludes their arrangements, including rotations/reflections/translations, without loading old levels into the game. The mine artwork, menu/Bloop, directional exit/blocked/win animations, sound, reset and level picker are retained. Undo and star scoring remain absent.

| World | Planned IDs | Currently playable |
| --- | --- | --- |
| Kristal Madenleri (`crystal-mines`) | 1–75 | 1–25 |
| Mercan Krallığı (`coral-kingdom`) | 76–150 | None |
| Gökyüzü Adaları (`sky-islands`) | 151–225 | None |
| Yıldız Galaksisi (`star-galaxy`) | 226–300 | None |

The catalog separates `plannedCount: 300` from `availableCount: 25`. Only referenced packs appear in the picker. Packs contain at most 25 levels and never cross world boundaries. Future worlds are metadata, not released gameplay/artwork. Do not advertise 300 finished puzzles.

### Actual rules and shortest solutions

`engine/rules.js` is the single rule source for the browser, generator and solver. Coordinates are zero-based (`x` column, `y` row); `U/D/L/R` scan from the adjacent square to the 6×6 boundary. Any block or fixed wall anywhere along that ray prevents removal. A successful move removes exactly one block; a blocked tap costs zero moves. Empty block state wins. `applyMove` does not mutate its inputs.

Deleting a block can only remove obstructions, never create them. Consequently any legal move preserves solvability, and every completed ordering takes exactly the original block count in successful moves. The solver repeatedly removes a legal block; if none exists with blocks remaining, the level is unsolvable. This is a complete optimal solver for these rules, without exponential search. It returns `solved`, `unsolvable`, `invalid` or `limit`; a partial/limited search is never reported as a solution. Independent exhaustive search on 240 small boards cross-checks the implementation.

Difficulty is **visual/path dependency**, not optimal-order strategy. Reported minimum moves therefore equal block counts (3–27). Dependency depth is the number of waves when all currently free blocks are removed together; it rises from 1 to 9. The first five introduce a free exit, blocked paths and multiple directions with 3–7 blocks; 6–10 are easy; 11–25 increase density and dependency depth. These are authored quality targets, not human playtest difficulty ratings.

### Generate and reproduce

Requires Node 18+ for development tools; no packages are required for generator/solver tests.

```sh
# Reproduce the committed 25-level dataset and both solution reports.
node tools/generate-levels.cjs --seed crystal-v06-2026 --count 25
# Read-only deterministic byte comparison (does not overwrite anything).
node tools/generate-levels.cjs --seed crystal-v06-2026 --count 25 --check
# Validate catalog, every level, quality, shortest solutions and saved report.
node tools/validate-levels.cjs
node --test tests/level-system.test.cjs
# Inspect the solution of one standalone level JSON file.
node tools/solver.cjs /path/to/level.json
```

The default seed is `crystal-v06-2026`. Each level uses `${seed}:level:${id}`, so generating a longer catalog preserves its existing prefix for the same generator/quality version. Construction adds blocks in reverse-removal order using the shared rules. Candidates are checked for exact solvability, required density, dependency depth, initially free block limits, direction variety, row/column coverage, retired layouts and pairwise similarity. Canonical signatures ignore block IDs and normalize translation, rotation and reflection with their arrows. Maximum Jaccard overlap above 0.65 rejects near-duplicates. Intentional early sparse tutorials are exempt from later density targets; no one-block puzzle is accepted.

Defaults: 300 candidate attempts **per level**, 60,000 ms total generation time; solver 5,000 inspections and 1,000 ms per solve. Override generation bounds with `--max-attempts` / `--timeout-ms`. Exhausting either bound exits nonzero before writing generated files. Identical seed/options/code produce identical accepted data and reports when allowed to finish; elapsed wall time is not included in outputs. A slow machine may hit its time limit instead of producing output. Generating does replace its output files, so run it on a clean development branch and review the diff; use `--check` for read-only verification.

### Add levels safely

1. Keep published IDs contiguous from 1. For the next generated batch, run `node tools/generate-levels.cjs --seed crystal-v06-2026 --count 50`. This is an example for future development, **not** a claim that levels 26–50 are released or reviewed. The tool accepts up to 300; quality/resource limits can reject a requested batch.
2. Review the new JSON, solutions and actual gameplay. `levels/level.schema.json` documents `schemaVersion`, `id`, `worldId`, `difficulty`, `gridSize`, `blocks`, optional `walls` and generation provenance. Runtime semantic validation additionally checks overlap, duplicate IDs and world ranges. Rules must stay shared; adjust `tools/level-quality.cjs` intentionally when designing future difficulty targets.
3. Generation writes the required version-1 packs, catalog counts/references and `reports/levels-v06.{json,md}` together. JSON report entries contain exact solution block IDs, minimum moves and quality metrics. Review old-level diffs; increasing count alone must preserve the prefix. Never silently replace already published puzzles under the same progress namespace. Version schema/catalog, generator quality and progress namespace explicitly when their meaning changes.
4. Run reproducibility, verification, Node tests and **all browser suites**. Current acceptance tests deliberately require exactly 25 published levels; expand those expectations and coverage in the future level-release task. Do not loosen quality gates just to silence a failed candidate or test.
5. Visually review mobile screenshots and human-playtest difficulty before publishing a new batch. The present 25 have automated solvability/quality evidence; future 275 still require design and validation. No deployment is part of generation.

### Progress and loading

New progress uses **`blockEscapeUnlockedV06`**, independently from legacy `blockEscapeUnlocked`. The legacy key is never read for unlocking, migrated, overwritten or deleted. Existing sound uses the unchanged `blockEscapeSound` key. Missing/invalid new progress starts at 1; values beyond the published catalog clamp to 25. Finishing the last available level cannot unlock a nonexistent level. Reload restores the highest unlocked level, not an unfinished board; menu return preserves the in-memory board.

Play and level selection stay disabled until the catalog and all referenced packs are fetched and validated. Network/schema errors show a retry action; no partly loaded catalog is exposed. Fetches use repository-relative URLs and work on GitHub Pages subdirectories. Storage/audio failures remain nonfatal.

### Current validation commands

Start `python3 -m http.server 8080 --bind 127.0.0.1` in another terminal, then:

```sh
node --check game.js
node --check menu.js
node --test tests/level-system.test.cjs
node tools/generate-levels.cjs --check
node tools/validate-levels.cjs
NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules ARTIFACT_DIR=/tmp/block-escape-v06 node tests/run-browser.cjs
```

`tests/run-browser.cjs` runs all twelve suites, reports failures separately and exits nonzero on any failure/timeout. Playwright is a development tool only. Set `CHROMIUM_PATH` if needed. `tests/level-system-browser.cjs` completes all 25 levels using real touch hit targets at 320×568, 375×667, 390×844 and 430×932 (1,500 successful solution taps total, plus reset checks). It compares all 36 cells at first/middle/final moves, checks block containment, legacy/new progress isolation, reload, picker limits, catalog failure/retry and a project subdirectory. Earlier suites retain audio, animations, desktop/mobile geometry, oversized glyphs, menu, settings, art and removed-action coverage. `ARTIFACT_DIR` writes screenshots outside the checkout.

To explicitly require WebKit: `BROWSER=webkit NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/level-system-browser.cjs`. An unavailable engine is a failed prerequisite, never replaced with Chromium. Chromium touch emulation is not physical iPhone Safari or Android device testing. See [solution report](reports/levels-v06.md) and [test report](reports/v06-tests.md) for this revision's actual results.

## Historical implementation notes (v0.2–v0.5.1)

The following sections record earlier releases. Their references to ten levels and the old progress key describe those releases; the v0.6 rules/data/progress/test commands above are current.

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


## v0.6.2 — Countdown Timer & Smooth Star Progress

The 25 published puzzles remain **untimed** and byte-identical. `?lab=collision`
keeps its five existing puzzles. Open `?lab=timer` for five experimental timer
puzzles (untimed / 45 / 40 / 35 / 30 seconds). These intentionally reuse the
verified collision layouts to isolate timer behavior, not introduce new puzzle
balancing. Only available levels appear in each picker.

The continuous gold bar measures successful removals / initial blocks; its three
milestones are completion markers, **not the final performance rating**. A 550ms
CSS transform transition retargets from its currently rendered value. Collisions
do not change it; retry resets it. Reduced motion disables the transition and
star effects.

`engine/performance.js` is the shared testable active clock/scoring API.
`timer-stars.js` integrates it with gameplay. One 50ms scheduled update uses
monotonic `performance.now()`, synchronizing at state transitions. Menus, dialogs,
opening transitions, block animations, hidden pages and terminal states pause
the clock. Retry starts a fresh clock and three lives. At zero, TIME'S UP! uses
the same guarded retry/menu flow as LEVEL FAILED. Display rounds remaining time
up; internal milliseconds never go negative.

Optional schema-1 level metadata:

```json
{
  "timeLimitSeconds": 45,
  "starThresholds": { "threeSeconds": 25, "twoSeconds": 40 }
}
```

`timeLimitSeconds` must be positive. Thresholds must be positive, ordered and
within the time limit. Omit the limit for an untimed tutorial. Completed timed
levels award 3 stars for all 3 lives and active time <= threeSeconds; 2 for at
least 2 lives and active time <= twoSeconds; otherwise 1. Default thresholds are
60% / 90% of the limit. Untimed completion uses remaining lives (3 / 2 / 1).
Failed attempts earn no stars. Active time excludes animations on every device.

Best ratings are stored separately in `blockEscapeBestStarsV062` as
`{schemaVersion:1, ratings:{"v06:1":3,"timer:1":2,"collision:1":3}}`.
A lower result never overwrites a higher rating. Lab namespaces cannot replace
normal ratings. No old progress/sound key is migrated, deleted or cleared;
normal unlocking continues to use `blockEscapeUnlockedV06`. Missing/denied
storage does not block play. The menu and artwork remain unchanged.

Verification (serve the repository on port 8080):

```sh
node tests/timer-stars.test.cjs
node tools/validate-timer.cjs
NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/timer-stars-browser.cjs
NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/run-browser.cjs
```

The aggregate runner now includes 13 browser packages. Timer tests use an
injected monotonic clock in Node and Playwright's fake clock in Chromium, plus
real animation interpolation/retargeting and mobile geometry at 320/375/390/430px.
Use `ARTIFACT_DIR=/tmp/block-escape-v062` for screenshots and `BROWSER=webkit`
for a separately installed WebKit engine. Chromium touch emulation is not an
actual iPhone Safari or Android hardware test. Rebuild the timer solution report
with `node tools/validate-timer.cjs --write` after intentional lab changes.


## v0.6.2.1 — Compact Crystal HUD

The previous v0.6.2 progress milestones are replaced by a **star-free crystal
bar**. Its panel is 28px high (previously 48px, 42% smaller), displays removed /
initial blocks, and retains the 550ms continuous fill. A separate **POTANSİYEL
ÖDÜL** indicator shows an upper bound under current conditions, not earned stars.
`BlockEscapePerformance.potential()` delegates to the same `score()` function
used by the results screen. It considers current lives and active elapsed time;
no future move/time prediction is made. Failure/timeout shows zero potential;
a still-winnable attempt retains at least one. No scoring thresholds changed.

Only successful results reveal earned stars, 260ms apart. Empty slots never
celebrate. `star-audio.js` provides original temporary crystal cues (784Hz,
988Hz, then a 1175/1480/1760Hz chord) on the game's existing AudioContext.
The context is prepared on the last input gesture. Delayed cues never create or
resume a context; unavailable/denied audio is skipped. Each 190ms cue ends
before the next, and muting/closing/next level cancels audio or queued reveals.
Reduced motion removes scaling/glints and potential-star fading. These cues
replace the old completion melody, so two reward sequences do not overlap.

Additional verification:

```sh
node tests/hud-polish.test.cjs
NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules ARTIFACT_DIR=/tmp/block-escape-v0621 node tests/hud-polish-browser.cjs
```

`tests/run-browser.cjs` now runs 14 packages. Audio assertions inspect Web Audio
scheduling and cleanup; they do not replace listening on real iPhone/Android
hardware. Existing 25 levels, both labs, storage keys and artwork remain intact.
See [v0.6.2.1 technical report](reports/v0621-technical-report.md) for results and
mobile dimensions. Short screens retain vertical scrolling so tiles and touch
targets need not shrink.
