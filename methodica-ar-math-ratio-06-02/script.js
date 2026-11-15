'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-ar-math-ratio-06-02 — component 02 of 2 · יעד 1.6 (יחס)

   CONFIGURATION ONLY. Every behaviour is shared in ../unit-js/.
   The split comes from the deck's own separator slides (2 and 6), which
   print the component folder names.
   ═══════════════════════════════════════════════════════════════════ */
/* next/prev name index.html explicitly: the CDN does not resolve a folder URL (200, 0 bytes).
   Used only by DEV_NAV walkthroughs — in production the platform routes. */
window.PART_CONFIG = { start: 3, end: 13, next: null, prev: "../methodica-ar-math-ratio-06-01/index.html" };

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════
   Data only; the shared layer in ../unit-js/ reads it at CALL time. Ids must match
   ../metadata/methodica-ar-math-ratio-06-02.json byte-for-byte (the loader shouts on a mismatch). */
var XAPI_COMP_SLUG     = 'methodica-ar-math-ratio-06-02';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';
var XAPI_METADATA_FILE = '../metadata/methodica-ar-math-ratio-06-02.json';

/* Screen (this component's own GLOBAL data-screen numbers, 3-13) -> [item suffix, page in item].
   Screen 3 is the transition ("10 שאלות … צריך לענות נכון על 8 שאלות לפחות") — no catalogue item.
   Each practice question is its own item with one question (q1); the order was checked against
   each item's questionText (001 = the bus 4:5 … 010 = the red/green balls 5:7). Keys must be
   exactly this component's screens. */
var SCREEN_TO_SUBCONTENT = {
  3: null,
  4: ['001', 1],
  5: ['002', 1],
  6: ['003', 1],
  7: ['004', 1],
  8: ['005', 1],
  9: ['006', 1],
  10: ['007', 1],
  11: ['008', 1],
  12: ['009', 1],
  13: ['010', 1]
};

/* Items carrying a code-graded question (used as a set) — all ten. */
var XAPI_EVAL_ITEMS = {
  '001': 1, '002': 1, '003': 1, '004': 1, '005': 1,
  '006': 1, '007': 1, '008': 1, '009': 1, '010': 1
};

/* The pass gate promised on screen 3 — PASS_MARK (unit.js) correct of the 10. Below it the
   component still ends and still reports, with success:false. See partResult(). */
var PART_GATED = true;
