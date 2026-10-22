# v0.6.1 collision/lives — implementation and verification

Date: 2026-10-22. Branch: `feature/block-escape-v0.6.1-collision-system`, based on the completed v0.6 commit `d4da51fbc5247fdc403e13191d2ca61e55bd76ce`. No main change, merge or deployment is part of this task.

## Implemented behavior

- Shared `traceMove` scans every square from the block toward the boundary and returns the **first** typed block/wall contact. `transition` owns immutable `{blocks, moves, lives, status}` state; the browser and solver both use it. `createState` initializes 3 lives. Legacy pure geometry helpers still support the unchanged generator.
- Clear paths exit, remove one block and increment successful moves without damage. Blocked paths travel to the obstacle's near edge (including a visible gap for adjacent obstacles), shake and return. One life is deducted **at contact**; no block coordinate, other block or successful-move counter changes. Input/reset/home/picker stay locked throughout outward movement, contact and return.
- Contact produces a short spark, existing synthesized collision tone, optional 15ms vibration and a heart-loss animation. Audio context activation starts on the original input gesture; mute is checked again at impact. Reduced motion skips movement, particles, heart animation and vibration. Optional APIs, rejection, cancellation and paused timelines cannot strand the board lock.
- At zero lives, the returned block remains on the board and `LEVEL FAILED` offers `Tekrar Dene` / `Ana Menü`. Terminal states ignore board input. Escape cannot dismiss the failure and expose a live zero-heart board. Retry restores the original layout and 3 lives; playing from the menu after failure restarts that level. Ordinary picker Escape behavior still works after a failure/menu transition. Next levels always start with 3 lives; unfinished menu return retains the current state.
- The life indicator is a separate compact blue/gold rail, preserving all existing counters and six equal grid tracks. Existing Bloop, mine art, block skins and menu design are reused. No undo, stars, score, library or 300-level production is added.

## Five isolated test levels

Open **`http://127.0.0.1:8080/?lab=collision`** with the local server. For another host/project directory, append `?lab=collision` to its normal page URL. This is a developer access route, not a private/authenticated area. No site was published.

The laboratory loads `levels/lab/collision-v1.json`, identifies itself as TEST mode and makes only its five levels selectable. Normal play loads only the original 25-level catalog. Lab progress is never read from or written to `blockEscapeUnlockedV06` or legacy `blockEscapeUnlocked`; sound preferences are intentionally shared. Remove the query parameter to return to normal play.

| Test | Title | Blocks / minimum successful moves | Dependency waves | Initially clear | Solved with |
| --- | --- | ---: | ---: | ---: | --- |
| 1 | Çarpışmayı Öğren | 3 | 2 | 2 | 3 lives |
| 2 | Doğru Sıra | 5 | 5 | 1 | 3 lives |
| 3 | Zincirleme Açılma | 6 | 6 | 1 | 3 lives |
| 4 | Dikkatli Seçim | 6 | 4 | 2 | 3 lives |
| 5 | Kristal Ustalığı | 12 | 9 | 2 | 3 lives |

The same-count third/fourth levels exercise a single dependency chain versus multiple branches and long-ray inspection. The fifth combines crossing paths, near/far blockers and two initially legal choices. These are manually designed mechanic tests, not human-calibrated difficulty claims. The initial design pass deliberately went through the solver; detected cycles and an obstructing fixed wall were corrected before acceptance.

[Machine-readable solution and wrong-move traces](collision-solutions.json) record legal IDs, exact minimum moves, metrics and three repeated collision outcomes. All five also remain winnable with 1 life after two deliberate mistakes. Their third collision fails, and further input cannot decrement below zero.

## Honest strategy limits / extension points

A successful removal can only open paths; it cannot create a permanent trap for another block. Therefore no supposedly harmful successful move or mutually destructive choice is implemented. Strategy here consists of inspecting full rays and avoiding collisions, not choosing an optimal successful ordering. Collisions preserve the board while losing a life, so the solver prunes them as dominated transitions. It uses the same transitions as play, and any complete legal removal ordering remains optimal with one successful move per original block.

A fixed wall directly in a block's only exit ray makes that block permanently stuck under these mechanics. Playable lab walls consequently stay outside solution rays; separate **unsolvable negative fixtures** test wall contact/failure in all four directions. We do not present those fixtures as playable puzzles.

For keys, locked blocks or special obstacles, extend versioned schema validation, typed contact resolution and state transitions first, keeping graphics driven by their results. State fields and serialization need to include new inventory/lock data. If actions cease to be monotonic removal, replace/re-prove the greedy solver (e.g. bounded state search) and add new regression cases. Those future mechanics are not implemented here.

## Latest test results

Environment: Node v24.19.0, Chromium 154.0.8037.57, Playwright supplied by the environment, Python static server on 127.0.0.1:8080.

| Verification | Latest result |
| --- | --- |
| JS/CJS syntax | 26 files parsed; `node --check game.js` and `node --check collision.js` passed |
| Existing Node rules/generator/catalog suite | 10 passed, 0 failed — [log](v061-node-levels.txt) |
| New collision/state/preservation suite | 6 passed, 0 failed — [log](v061-node-collision.txt) |
| Existing v0.6 generation/report verification | Byte-reproducible seed; 25 valid/distinct/optimally solved levels; unchanged reports |
| New lab verification | 5/5 zero-damage solutions; two-error recovery; three-error failure; terminal guard |
| Existing Chromium suites | All 11 passed — [combined run](v061-regression-attempt.txt) |
| New Chromium collision suite | Passed after test-observer correction — [final targeted rerun](v061-collision-tests.txt) |
| Total latest Chromium suite results | **12 passed, no unresolved functional test failures** |
| WebKit | **Could not start** — missing executable; [actual failure](v061-webkit.txt) |

The combined run log retains its historical `FAIL collision-browser` summary: the first-contact test observer continued into later reduced-motion cases and asked for computed style on a deliberately absent animated heart. The corrected observer records only its intended first contact. Only the affected suite was rerun, successfully; product code and the other eleven passing suites were unchanged. The two logs together document the latest per-suite results rather than pretending the original combined process exited successfully.

Other resolved verification issues: viewport-based rectangle comparisons shifted when full-page capture or reaching reset legitimately scrolled the taller HUD page; stable document-coordinate checks now prove return and grid geometry without ignoring scroll. A Node test subprocess was sandbox-restricted; preservation assertions now compare checked-in SHA-256 baselines from the v0.6 commit, avoiding a runtime Git/history dependency. No acceptance assertion was dropped.

### Covered scenarios

- Actual outward contact frame at the first distant obstacle, spark present, heart animation, exact return position and all other coordinates unchanged.
- One-life damage despite same-task duplicate clicks; board/reset/home locking during movement.
- Three-hit failure, disabled terminal board, Escape protection, retry reset, menu restart, dismissible picker after failure.
- Successful solve and fresh next-level lives; normal failure does not unlock progress, retry/win does.
- Mute suppresses collision audio context; existing instrumentation verifies collision/move/win tones and audio lifecycle. Reduced motion suppresses motion/particles/hearts/vibration. Missing/throwing vibration, missing animation, cancellation and paused timelines recover.
- Five lab levels played at **320×568, 375×667, 390×844 and 430×932**. First/contact/returned grid geometry, 36 square cells, block containment and true viewport width checked.
- All **25 unchanged normal levels** also played at all four widths (1,500 successful solution taps), with reset, menu, progress/reload, catalog failure/retry and project-subdirectory checks.
- Lab sessions seeded with legacy progress 10 and v0.6 progress 17 left both values unchanged; returning to normal play opened 17/25. Published catalog/layouts/old solution reports are SHA-256 identical to v0.6.

### Safari / physical-device limitation

`BROWSER=webkit ... node tests/collision-browser.cjs` failed before running tests because `/home/agent/.cache/ms-playwright/webkit-2336/pw_run.sh` is absent. The earlier v0.6 installation attempt in this environment was blocked with HTTP 403 from the browser download host. This task did not replace WebKit with Chromium or claim Safari coverage. Physical iPhone Safari/Android hardware, speaker output and real haptic feel remain untested; Chromium calls/geometry/fallbacks were verified.

## Actual screenshots

These are Chromium screenshots, not mockups or Safari captures. The four-width images have exactly their configured widths; smaller phones scroll vertically to reach lower controls. The HUD, Bloop, arrow clarity and failure screen were visually reviewed.

- Lab 5 / 3-heart HUD: [320px](screenshots/v061/chromium-collision-lab5-320.png), [375px](screenshots/v061/chromium-collision-lab5-375.png), [390px](screenshots/v061/chromium-collision-lab5-390.png), [430px](screenshots/v061/chromium-collision-lab5-430.png).
- [Collision outward travel, 390px](screenshots/v061/chromium-collision-travel-390.png).
- [LEVEL FAILED / retry / menu, 320px](screenshots/v061/chromium-collision-failed-320.png).

## Reproduce

```sh
python3 -m http.server 8080 --bind 127.0.0.1
# In another terminal:
node --check game.js
node --check collision.js
node tests/level-system.test.cjs
node tests/collision.test.cjs
node tools/generate-levels.cjs --check
node tools/validate-levels.cjs
node tools/validate-collision.cjs
NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules ARTIFACT_DIR=/tmp/block-escape-v061 node tests/run-browser.cjs
```

The runner includes all 12 suites and exits nonzero if any fails. `tools/validate-collision.cjs --write` refreshes only the laboratory solution report after intentional data changes. No normal level generation or progress migration is required for laboratory testing.
