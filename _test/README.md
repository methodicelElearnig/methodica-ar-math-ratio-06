# `_test/` — headless harness (never deployed)

| File | What it asserts |
|---|---|
| `harness.js` | Shared jsdom boot: loads a component's **real** `index.html` and runs every local `<script src>` in document order from disk; optional stub library + `finishBoot()` replay of the loader's post-metadata sequence; `reload()` over the same storage. |
| `verify-report.js` | Contracts: script order and `?v=` identical in both components, `-k` inside the `XAPI_USING_G` gate, no top-level name in two files, `script.js` config-only, ids byte-for-byte against `metadata/` (unit, component, items, questionIds), `SCREEN_TO_SUBCONTENT` = the component's screens and = the catalogue items in both directions, flush after the last commitment, verdicts only through `setUnitResult`, `goTo` order (repaint → item scope → save), hops only under `DEV_NAV`, painter sweep (never throws, shows the answer, idempotent, dispatch for every question screen), pending answers across back/forward and reload, the answer-toggle mode, the v6 document shape, issue-report payload on **every** screen of both components, the boot cover. Optional arg: a package folder. |
| `statement-flow.js` | Behaviour: regression gate (no `?slxapi` → no library, no network, scoring still works), both components' statement sequences, hint dedupe across a reload (D-7), Back closes nothing (O-1), B-1 seed after a reload, the pass gate (8/10 → `success:true`, 7/10 → `false`; and it agrees with metadata, screen 3 and `PASS_MARK`), the last click (one component `completed`, button disabled, no navigation, second click silent), ended button after resume and its "answered-not-clicked stays live" control (D-8), re-take, `#screen=N`, `DEV_NAV`, the keyboard forward gate. |
| `retry-gate.js` | The Retry gate (D-14) and "paint only submitted state" (D-15) for all ten two-attempt questions, including a JSON round trip into a fresh page. |
| `layout.js` | In a **real browser** (puppeteer-core + local Chrome; jsdom has no layout): at eight window sizes, both components' canvas is centred, lies inside the window, and every first-screen button is reachable (MOE monday 05.10.26 — below 1280×710 the canvas slid off-screen with its buttons). Serve the repo root (`python -m http.server 8796`) and pass its URL. |
| `xapi-720-k.js` | Local stand-in for the CDN library over `sessionStorage` (from ratio-01, retargeted). Loaded in a browser only via `?xapiLib=../_test/xapi-720-k.js` on `localhost`. Console helpers: `__stmts() __state() __dupes() __reset() __failWrites(bool|status) __setState(doc)`. |

## Running

jsdom must live **outside** the OneDrive tree (ADDING-REPORTING-AND-RESUME.md §10.1). One
`npm install jsdom` into any folder outside OneDrive, then from the repo root:

```bash
NODE_PATH=<that folder>/node_modules node _test/verify-report.js
NODE_PATH=<that folder>/node_modules node _test/statement-flow.js
NODE_PATH=<that folder>/node_modules node _test/retry-gate.js
NODE_PATH=<puppeteer-core folder>/node_modules node _test/layout.js http://127.0.0.1:8796/
```

State on 2026-10-07: 417 + 92 + 175 (jsdom) + 66 (layout) = 750 checks, all green; 30 of the layout
checks fail on the pre-fix CSS.

State on 2026-09-28: **414 + 86 + 175 = 675 checks, all green.** Every assertion group was
mutation-tested — 15 deliberate breaks (no commit flush, no Retry `lw`, no repaint on `goTo`, no
ended-button restore, gate changed to 7, hop without `DEV_NAV`, per-element flag binding, ungated
keyboard, no explicit item result, donor character key, hint before its guard, `onQuizAnswered`
after marking, painter clean-guard on attempts, a missing map key, toggle mode not saved); each one
fails its target group.

## In a browser

```
http://localhost:<port>/methodica-math-ratio-06/methodica-math-ratio-06-02/index.html?xapiLib=../_test/xapi-720-k.js
```

Add `&resetState` for a clean document. Serve from a **subpath** (the folder above the repo), so a
wrong `../` depth fails locally as it would in production.

## Not covered here

A real Kata run (ADDING-REPORTING-AND-RESUME.md §12): stubs prove payload **shape**, not
**arrival**; the real Google Form row in the shared sheet; pixel-level checks.
