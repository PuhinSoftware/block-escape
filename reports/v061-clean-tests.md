# v0.6.1 clean main-based branch verification

Date: 2026-10-22. Target branch: `feature/block-escape-v0.6.1-collision-clean`.

## History repair and preservation

- Fetched current `origin/main`: `3a41ee8c05e5b276bd70d318b9e329f3cfe9787f` (v0.6 squash merge).
- Original v0.6.1 work: `2a1b27c425741c978d7a686c48c0479ad6869ec4`, with parent `d4da51f` on the previous non-squashed history.
- Worktree was clean before migration. Created local backup branch `backup/block-escape-v0.6.1-before-clean-2a1b27c` at the original v0.6.1 SHA. The original development branch was not rewritten.
- Verified the entire trees of `d4da51f` and current `origin/main` are identical. Their difference is Git history, not source content.
- Created the clean branch from `origin/main`, then applied **only** the v0.6.1 commit using `git cherry-pick -x`. The application was conflict-free; no whole-file copying, reset, force-push or replay of the v0.6 commit was used.
- The port commit `eefa252` has current main as its direct parent. Its complete tree is byte-for-byte identical to original v0.6.1 `2a1b27c`. The later audit commit adds only this report and fresh execution logs.
- Compared against main: `assets/`, `style.css`, `menu.css`, `gameplay.css`, `art-upgrade.css`, `levels/catalog.json`, `levels/v1/` and `reports/levels-v06.{json,md}` are unchanged. The existing progress key remains `blockEscapeUnlockedV06`, with legacy `blockEscapeUnlocked` preserved and lab progress isolated.
- No merge into main or deployment was performed.

## Revalidation on the clean branch

| Check | Result |
| --- | --- |
| Syntax | `node --check game.js`, `collision.js`, `menu.js`: passed |
| Existing Node rules/data/generator tests | 10 passed, 0 failed — [log](v061-clean-node-levels.txt) |
| Collision/state/preservation Node tests | 6 passed, 0 failed — [log](v061-clean-node-collision.txt) |
| Seed reproduction | `node tools/generate-levels.cjs --check`: passed; all 25 JSON levels and reports reproduce |
| Existing levels | `node tools/validate-levels.cjs`: 25/25 valid, distinct and optimally solved |
| Collision labs | `node tools/validate-collision.cjs`: 5/5 solve with 3 lives, recover after two errors, fail on third |
| Chromium aggregate | **12 passed, 0 failed; complete runner exit code 0** — [fresh log](v061-clean-browser.txt) |
| WebKit/Safari | Could not start: missing WebKit executable — [failure log](v061-clean-webkit.txt) |

The browser runner includes all 12 suites: browser, animations, board-geometry, mobile-grid, menu, reference-menu, settings, gameplay-ui, crystal-mines, art-upgrade, level-system-browser and collision-browser. The mobile suites exercise 320×568, 375×667, 390×844 and 430×932; all 25 normal levels are played at each width (1,500 successful solution taps), plus all five labs through `?lab=collision`. Coverage includes actual full-ray contact/return, lives, failure/retry/menu, audio/reduced motion, locks, geometry, persisted progress and lab isolation.

Fresh screenshots are emitted to `/tmp/block-escape-v061-clean`. Existing committed [v0.6.1 screenshots](screenshots/v061/) and [mechanics report](v061-tests.md) remain available; the old report describes the original branch/run, while this document records the new clean-branch run.

WebKit launch failed before running tests because `/home/agent/.cache/ms-playwright/webkit-2336/pw_run.sh` is absent. No Chromium fallback is claimed as Safari testing. Physical iPhone/Android behavior remains unverified. The earlier environment download restriction is documented in the original report.

## Commands

With the Python static server serving this checkout on port 8080:

```sh
node tests/level-system.test.cjs
node tests/collision.test.cjs
node tools/generate-levels.cjs --check
node tools/validate-levels.cjs
node tools/validate-collision.cjs
NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules ARTIFACT_DIR=/tmp/block-escape-v061-clean node tests/run-browser.cjs
BROWSER=webkit NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/collision-browser.cjs
```

The first browser command must return zero for the Chromium aggregate to pass. The WebKit command is reported separately and failed its environment prerequisite.
