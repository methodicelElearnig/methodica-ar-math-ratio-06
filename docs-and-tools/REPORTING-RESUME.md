# methodica-math-ratio-06 — xAPI reporting, issue reporting, resume

Unit record. The family guide is
`2026/Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md` (current to 2026-09-24);
this file records only what is specific to this unit and why. Added 2026-09-28.

## 1. Shape of the integration

This unit runs on the vendored **720-core** (`engine.js`, `quiz-engine.js`, `questions.js`,
`unit.js`, `motion.js`, `report-modal.js`). No sibling has that engine *and* reporting, so:

- The platform files come from **methodica-math-ratio-01** (35648a6 — v6 document, B-1, O-1, O-2,
  D-7, D-8, the namespaced character key, the correct stub): `10-identity.js`, `20-xapi.js`,
  `40-resume.js`, `50-loader.js`, `90-boot.js` (rewritten for this engine), `_test/xapi-720-k.js`.
  Not taken: `15-ui`, `25-report`, `28-feedback-drag`, `30-nav`, `60-devbridge` — this engine has
  its own navigation, report dialog and dev bridge (the ratio-02 graft pattern).
- **`unit-js/70-platform.js`** is the glue, written once for both components (the idea of
  ratio-01's `70-screens.js`): part range, the four resume hooks, the painters,
  `applyExecutionState`, `partExit`/`partResult`, the quiz reporting hooks, `partBoot`.
  `quizState` / `QUESTIONS` are top-level `const` in the shared global lexical scope, so one shared
  file reaches them — no per-part hooks are needed.
- The 720-core received **guarded hook calls only** (`typeof … === 'function'`), so it still runs
  unchanged without the platform layer.

Script order in both `index.html` (all `?v=7`):
`10-identity, 20-xapi, 40-resume, 50-loader, script.js, motion, quiz-engine, questions,
report-modal, unit, engine, 70-platform, 90-boot`. `90-boot.js` runs at `DOMContentLoaded`
(registered last, so the core's own DOMContentLoaded work runs first) — unlike ratio-01, whose boot
runs synchronously at the end of `<body>`.

## 2. Identity and maps

| | |
|---|---|
| `XAPI_ID_PREFIX` | `https://lomdot.education.gov.il/metodica/720active/math/ratio/06/` |
| `XAPI_UNIT_ID` | `methodica-math-ratio-06` — **bare slug**, = `metadata/methodica-math-ratio-06_unit.json` `id` (MOE v2.5 §2.7) |
| component ids | `<prefix><slug>/` — IRIs with trailing `/`, = `METADATA.id` |
| 01 | screens 0–2 → item `001` pages 1–3 (the whole hook is one item, `q1` on screen 1) |
| 02 | screen 3 (transition) → `null`; screens 4–13 → items `001`–`010`, one `q1` each |

Screens are numbered **globally** (component 02 starts at 3), so each map is keyed by the
component's own `data-screen` values; the harness checks "exactly this component's screens".
The item order was verified against each item's `questionText`.

## 3. Decisions (2026-09-28)

| Decision | Where |
|---|---|
| Metadata = the repo's `metadata/*.json` as updated on 24.09 (one item per question in 02) | `script.js` maps |
| **Pass gate 8 of 10 — the metadata is the source of truth** (item 001 `informationToBot`, as the deck's slide 7). Screen 3 had been changed to 7 in 5eaf878 and is back to 8; `PASS_MARK = 8`. `verify-report.js` asserts metadata = screen 3 = `PASS_MARK`. Below the gate the component still ends and reports `success:false`; `recommendedAfterFail` is `[]`, the platform routes. | `unit.js`, `partResult()` |
| Component 01 (hook) reports `success:true` always, `scaled` = its one question (1/0) | `PART_GATED = false` |
| Component 02 score = correct / 10 over the final answer of each question (`XAPI_Q_RESULTS`) | `partResult()` |
| Keep this unit's own report dialog; fix its identity (it posted the component as `…-xx`, from another unit's pattern) and wire flags by delegation | `report-modal.js`, `unit.js` |
| **Keyboard forward gated**: ArrowLeft on a question screen moves only once it is answered (as "שנמשיך?"); arrows inside an input never navigate. Free under `DEV_NAV`. Unguarded, ArrowLeft walked past unanswered questions — the spec's gated navigation — and closed the item with a non-final result the ledger then keeps. | `engine.js` |
| Retry gate added (`st.lw`): the same wrong answer can never be attempt 2 (D-14); value boxes compare through `quizNum` | `quiz-engine.js` |

## 4. The component end

- 01: s2 "המשך" → `goTo(3)` → `partExit(+1)`.
- 02: q13 "שנמשיך?" → `goTo(14)` → `partExit(+1)`; only once q13 is answered.

`partExit` = `xapiEndComponent(partResult(), lastScreenButton())` → `setUnitResult('ratio06_c0N_result')`
→ `flushResumeSave()` → navigate **nowhere** (only `DEV_NAV` hops on). After every repaint,
`restoreEndedButton()` keeps a finished component's button disabled (D-8).

## 5. Resume payload (v6 document, one per component)

`payload = { currentScreen, qResults, q: { <screen>: { attempts, done, wasCorrect, hintUsed, selected,
selectedSet, lw, tgl } } }` — this component's questions only. `selectedSet` carries typed values and
pending picks (saved on every keystroke/pick, debounced); `tgl` is the value-input
"התשובה שלי / הנכונה" toggle. `userInputs` / `answerKey` / `slotOk` are **re-derived** by
`quizMarkOutcome` from the same `selectedSet`, so they are not stored.

No character state: the unit has one fixed companion, so `ui.character` stays `null`
(`UI_CHARACTER_KEY` is still namespaced per unit, D-6).

## 6. Tools

- `_test/` — see `_test/README.md` (675 checks, mutation-tested).
- `docs-and-tools/package-allowlist.ps1`, `build-package.ps1`, `verify-package.ps1` — from ratio-01;
  the allowlist ships `metadata/*.json`, `unit-js/*.js` and each component's
  `index.html`, `script.js`, `styles.css`, `assets/`. `spec/`, `docs/`, `tools/`, `media/`,
  `_test/`, `docs-and-tools/`, `index_dev.html`, `*.md` never ship.
- `send-metadata.ps1` / `retrieve-metadata.ps1` (+ `SEND-METADATA.md`) — from ratio-01.
  `$ContentBaseUrl = …/720/math/ratio/06` — confirmed 28.09. The API key goes in `docs-and-tools/kata-api-key.txt`
  (git-ignored) or `KATA_API_KEY`.
- **Nothing at the package root (rule, 28.09.26).** The platforms launch the component links only
  (`hostedContentRef` = `…/methodica-math-ratio-06-0N/index.html`), so the repo's root `index.html` is
  for local use and never ships; `verify-report.js <package>` fails if a package holds a root file.
- `reset-state.html` — QA: inspect/delete one registration's document. ratio-01's
  `save-restore-state.html` was **not** taken: it still validates the pre-v6 shared document.

## 7. Open before release

1. ~~Push the metadata to Kata~~ — **done 28.09.26**: dry run (log archived as
   `send-metadata.2026-09-28-dryrun.log`), then live `created=14 updated=0 failed=0` (all 201).
   Verified by GET, not by the 2xx: unit `methodica-math-ratio-06` (bare key, both target sectors,
   objective `…RATIO.SOLVE-MISSING`), components 01/02 with 1 and 10 items / questions,
   `learningUnitId` = the bare slug, `cognitiveLevels` stored, `hostedContentRef` under `/720/`,
   no `publishBlockers` or `warnings`. Both components are **`draft`** (the sender creates drafts;
   publishing is a separate step in Kata).
   ⚠️ `retrieve-metadata.ps1` (copied from ratio-01) is behind the v2.5 field names: it reads
   `cognitiveLevel` / `targetSector` (singular) and rebuilds `id` / `learningUnitId` as IRIs, so its
   `metadata-from/` diff shows drift that is NOT in Kata. Trust the raw GET, not that diff.
2. ~~Gate mismatch~~ — resolved 28.09: 8 of 10 everywhere, metadata first.
3. Checked 28.09: `questionType` matches the interaction (`choice` for the single-choice items,
   `numeric` for 002/003/005, `fill-in` for 009's two-box ratio) and every `correctAnswers` equals
   the key in `questions.js`. Nothing to fix.
4. Live Kata run (guide §12, probes 1–7) with a test learner, and one QA-marked issue report checked
   in the shared sheet.
5. Deploy both components atomically (guide §11.2).
