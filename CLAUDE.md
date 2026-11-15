# Unit: methodica-ar-math-ratio-06 (Arabic twin of methodica-math-ratio-06)

## Arabic twin — read first (2026-11-15)

- **Identity:** slug `methodica-ar-math-ratio-06`, IRI base `…/metodica/720/ar/math/ratio/06/`
  (ids and content both, as ar-ratio-01/04), component folders `methodica-ar-math-ratio-06-0N`,
  keys `methodica_ar_math_ratio_06_selectedCharacter` / `lomda_nav_edges::methodica-ar-math-ratio-06`.
  The `ratio06_c0N_result` keys and the CDN library path (`720active/common/`) are shared with Hebrew.
- **Functionality = the Hebrew twin.** Level with `methodica-math-ratio-06` `2a85a89` (14.11.26:
  resume hardening + leave save, `xapi-720-l.js`). `unit-js/*` and `_test/{harness,xapi-720-l}.js` are
  byte-identical to Hebrew apart from the identity, the two keys and the learner-visible Arabic strings
  in `70-platform.js` / `questions.js` / `quiz-engine.js`. Port every Hebrew change as
  "Same change as the Hebrew twin" (BOOT-AND-RESUME-HARDENING §7.5, §2.9).
- **Learner-visible text is the translator's Arabic** (`methodica-math-ratio-06-ar.xlf`). Comments and
  docs stay Hebrew/English and are not translated. No Hebrew may reach the page (MOE runbook: critical).
- **Metadata:** `metadata/*.json` are placeholders (the Hebrew twin's texts, re-pointed ids) until
  Vadim supplies the real Arabic metadata. Nothing sent to Kata. In Kata the Arabic components live
  **inside the Hebrew unit** (parent-unit mode — port it from ar-ratio-04 `3c028d7` before sending).
  **Do not publish until MOE approves the Arabic version in writing** (`docs-and-tools/SEND-METADATA.md`).
- **Push, PR, merge, package, CDN upload, Kata send: each only with Vadim's explicit approval.**
- **Tests** (from the repo root): jsdom suites with `NODE_PATH=C:\lomda-test\node_modules`;
  `_test/layout.js` with `NODE_PATH=%LOCALAPPDATA%\Temp\lomda-test\node_modules` and a static server on
  the repo root (`..\.claude\launch.json`, `lomda-ar-static`, port 8796). The label assertions read the
  Arabic screens.
- Everything below is the Hebrew unit's record. It still holds: same screens, same rules.

---

Interactive learning unit (לומדה) for Methodica's 720 project. Arabic (translated from Hebrew), RTL, static
HTML/CSS/JS. Built from the extracted spec in `spec/` — read `spec/manifest.md` first;
each screen's full instructions live in `spec/screens/slide-NNN.md` (production notes
from the תסריט, slide text, and reference images in `spec/assets/`).

## Build order

1. `spec/manifest.md` → group slides into screens (consecutive "לא צוין" slides are
   usually feedback/hint states of the preceding question screen, not new screens).
2. For each screen use the template named under **תבנית** via the `720-templates` /
   `figma-lomda-builder` skills. Screens marked CUSTOM — confirm approach before building.
3. Follow `720-design-guidelines` for all styling. Do not invent colors/typography.

## Structure

- `index.html` — the real unit flow (linear, gated navigation per the spec).
- `index_dev.html` — dev harness: free navigation to any screen, any state.
- `media/` — final media assets. Use placeholders until finals arrive; media file
  names in English, no spaces.
- `spec/` — generated, read-only. Regenerate with `tools/pptx_to_spec.py` when the
  client sends a new script version; never hand-edit.

## State rules

- The companion character chosen on the first screen persists across the unit.
  Character asset naming: `character1`, `character1-watching-video`, etc. The code
  must map the chosen character to its state variants on later screens.
- Question screens: respect attempts count, hint (רמז) visibility rules, and feedback
  states exactly as written in that slide's הנחיות הפקה.

## QA before delivery

Self-check every screen state, RTL, buttons, media loading, no missing assets, no
broken screens, faithful to spec/Figma. Then run the `lomda-qa-publish` skill.

---

## Unit facts (established at kickoff, 15.09.26 — do not re-derive)

Full kickoff: `docs/KICKOFF.md`. Per-slide build cards: `docs/forensics/`.

- **PDF page = slide number.** 17 pages / 17 slides, **no hidden slides** —
  unlike every other deck so far, slide 1 (פרטי היעד) is not marked hidden. It
  is an internal slide, not a screen. The rendered deck is `spec/deck.pdf`.
  **Layout, line breaks and partial bold come from the rendered page.**
- **Two components, named by the deck's own separator slides** (2 and 6):
  01 = slides 3–5 (הוק) · 02 = slides 7–17 (תרגול סטנדרטי).
  Build straight into this `-main` tree; there is no single-folder copy.
- **ONE hint rule for the whole unit**, stated on slide 8:
  *"הרמז בכל היחידה הזו מגיע אחרי טעות אחת"* — the hint appears only after a
  first wrong answer, everywhere. The single exception is **slide 4** (the hook
  question): one attempt, no hint. Do not copy 4.8's component-03 behaviour
  (hint up front) into this unit.
- **Component 02 is 10 numbered questions, one per slide** (8 = question 1 …
  17 = question 10). The progress strip has **10 stations**.
- **Every template this unit needs already exists and is approved** —
  HookClosingText, MultipleChoiceQuestion, TransitionScreen, ValueInputQuestion,
  SingleChoiceQuestionImage. Nothing new to build, nothing to escalate.
- **No video, and no external asset links** — every image ships inside the pptx.

## The one thing to be careful about here: ratio bidi

This is a ratio unit, so almost every screen carries a ratio in running text.
maven-skills §5 is the law:

- A **spaced** ratio (`3 : 5`) flips visually in an RTL paragraph; write it in
  reading order and wrap it in `<span class="ratio">` whose rule carries
  `direction: ltr; unicode-bidi: isolate` (isolate alone is not enough).
- An **unspaced** ratio (`3:5`) does not flip.
- A number-only answer pill renders **as typed**, even inside `rtl="1"`.
- What the XML stores is not what the page shows — read the ratio off the
  RENDERED page and cross-check it against which quantity the sentence names
  first.

---

## Reporting, issue reporting, resume (added 28.09.26 — read before touching unit-js/)

Unit record: `docs-and-tools/REPORTING-RESUME.md`. Family guide:
`2026/Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md`.

- Platform files `10/20/40/50/90` come from methodica-math-ratio-01; `70-platform.js` is this
  unit's glue onto the 720-core. The core only calls **`typeof`-guarded hooks**
  (`onQuizAnswered`, `onQuizCommitted`, `onQuizHint`, `repaintScreen`, `partExit`, `partBoot`).
- **Bump every `?v=` identically in both `index.html`** whenever any `unit-js/` file or a
  `script.js` changes (a stale cached file against a fresh one breaks resume silently).
- A question answer is persisted by `onQuizCommitted` at the **tail** of `quizCheck` — never add a
  `return` between a commitment and that call. Verdicts go through `setUnitResult` only.
- Any change to a question's type, maxAttempts, screen number or the metadata: re-check
  `SCREEN_TO_SUBCONTENT` / `XAPI_EVAL_ITEMS` in the part's `script.js`, then run `_test/`.
- The pass gate is **8 of 10** and the **metadata is its source of truth** (item 02-001
  `informationToBot`); screen 3's text and `PASS_MARK` follow it. `verify-report.js` asserts all three.
- **A deployment package has nothing at its root** — no root `index.html` (rule 28.09.26): the
  platforms launch the component links only. The root `index.html` in the repo is for local use.
- Every redirect / link names its file (`…/index.html`): the MOE CDN serves a folder URL as 200 with
  0 bytes.
- Run the harness before every commit: `NODE_PATH=<jsdom outside OneDrive>/node_modules node
  _test/{verify-report,statement-flow,retry-gate,write-guard}.js`.
