# v0.6 verification — 2026-10-22

Branch: `feature/block-escape-v0.6-level-system`. Base: `34b23525613abc0aea7bfd6036554b6cc5487b70` (main). The interrupted worktree was recovered without reset. This report covers the new 25-level catalog, shared rules, generation, solver, storage isolation and preserved presentation. No merge or deployment is part of this work.

## Passed

| Check | Result |
| --- | --- |
| Syntax | All 22 JS/CJS files passed `node --check`, including `game.js` |
| Node rule/data/generator tests | 10 passed, 0 failed; [output](v06-unit-tests.txt) |
| Independent rule/optimality oracle | 240 small boards, including walls/deadlocks, compared with exhaustive shortest-path search |
| Catalog verification | 25/25 valid, distinct, solvable; [solution table](levels-v06.md), [solution IDs/metrics](levels-v06.json) |
| Seed reproducibility | `node tools/generate-levels.cjs --check` matched all committed catalog/pack/report bytes for `crystal-v06-2026` |
| Chromium browser regression suites | 11 passed, 0 failed; [output](v06-browser-tests.txt) |
| Mobile full playthrough | All 25 levels at each of 320×568, 375×667, 390×844, 430×932; 1,500 successful solution taps plus reset probes |
| Geometry | All 36 cell rectangles remain square/equal/stable at first/middle/final moves; normal and 96px glyph stress; block/cell containment |
| Actual viewport overflow | None after correction; screenshots measure exactly 320/375/390/430 px wide |
| Storage | New key `blockEscapeUnlockedV06`; legacy `blockEscapeUnlocked=10` remained unchanged throughout four full playthroughs and reloads; old progress never unlocks new puzzles |
| Catalog/loading | Network, schema version, pack count and overlap failures disable play/picker; retry recovers; no partial playable catalog |
| Hosting | Relative scripts/assets/JSON work from simulated `/block-escape/` static project subdirectory |
| Preserved functionality | Sound synthesis/preferences/failure fallbacks, reset, locks, success/exit/blocked animations, reduced motion, menu resume, focus/settings, existing art and absent undo |

Browser suites: `browser`, `animations`, `board-geometry`, `mobile-grid`, `menu`, `reference-menu`, `settings`, `gameplay-ui`, `crystal-mines`, `art-upgrade`, `level-system-browser`.

The level report gives exact minimum moves: every successful action removes one block, so the minimum is 3–27 for these boards. Difficulty is based on density, direction variety and path dependencies, not optimal-order strategy. Dependency depth increases from 1 to 9. Maximum pairwise normalized Jaccard similarity was 0.30, below the 0.65 rejection threshold. All retired-layout signatures were excluded. These are automated quality measures, not a claim of calibrated human difficulty or 300 completed levels.

## Failures found and resolved

- The first audio/fallback and new catalog-recovery test attempts invoked `tap()` on test contexts without touch support. Those contexts now explicitly enable `hasTouch`; final reruns passed.
- Visual inspection exposed an existing decoration overflow missed by older tests: at 320px, a rotated right crystal with `right:-15px` expanded `scrollWidth` **and** `innerWidth` to 326px. Comparing those two values incorrectly passed. Both crystal offsets now use -8px, keeping their rotated bounds inside the app gutter; actual board sizing/exit clipping are unchanged. Tests compare with the layout/configured viewport and deliberately restore the old offset to prove the regression is reproduced before verifying the fix.

## Unavailable / not passed

**WebKit/Safari is not validated.** `BROWSER=webkit ... node tests/level-system-browser.cjs` failed before any tests because `/home/agent/.cache/ms-playwright/webkit-2336/pw_run.sh` was absent. A fresh installation attempt into `/tmp/block-escape-browsers` failed with HTTP 403 **Domain forbidden** from Playwright download hosts. No Chromium fallback was presented as WebKit coverage. Physical iPhone Safari/Android devices and audible speaker output were not available; audio calls/cleanup/policy failures were instrumented in Chromium.

Thus all executable Chromium and Node acceptance tests passed, but an unrestricted claim that every browser/device test passed would be incorrect.

## Screenshots

These are actual Playwright Chromium screenshots, not mockups or Safari captures. Short viewports scroll vertically to reach the lower controls. No horizontal overflow remains. Artwork/grid/arrow legibility and the 25-item picker were visually reviewed.

- Dense level 25: [320px](screenshots/v06/chromium-level-25-320.png), [375px](screenshots/v06/chromium-level-25-375.png), [390px](screenshots/v06/chromium-level-25-390.png), [430px](screenshots/v06/chromium-level-25-430.png).
- Tutorials: [level 1, 390px](screenshots/v06/chromium-level-1-390.png), [level 5, 390px](screenshots/v06/chromium-level-5-390.png).
- [Only 25 published levels in the picker](screenshots/v06/chromium-picker-390.png).

Additional first/5th/10th/15th/25th-level, menu/settings, victory and animation-midpoint captures were generated at `/tmp/block-escape-v06`; selected delivery images above are committed for durable review. They are reports, not downloaded gameplay assets.

## Reproduce

Use Node v24.19.0 (execution environment) and a static Python HTTP server on 127.0.0.1:8080. Playwright is supplied by the environment; no runtime dependency was added.

```sh
python3 -m http.server 8080 --bind 127.0.0.1
# In another terminal:
node --check game.js
node --check menu.js
node tests/level-system.test.cjs
node tools/generate-levels.cjs --check
node tools/validate-levels.cjs
NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules ARTIFACT_DIR=/tmp/block-escape-v06 node tests/run-browser.cjs
```

See README for schema, limits, generator extension and progress-versioning instructions. `reports/levels-v06.*` are deterministic; the execution logs include measured timings and are evidence of this run.
