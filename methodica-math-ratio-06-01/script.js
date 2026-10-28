'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-math-ratio-06-01 — component 01 of 2 · יעד 1.6 (יחס)

   CONFIGURATION ONLY. Every behaviour is shared in ../unit-js/.
   The split comes from the deck's own separator slides (2 and 6), which
   print the component folder names.
   ═══════════════════════════════════════════════════════════════════ */
/* next/prev name index.html explicitly: the CDN does not resolve a folder URL (200, 0 bytes).
   Used only by DEV_NAV walkthroughs — in production the platform routes. */
window.PART_CONFIG = { start: 0, end: 2,  next: "../methodica-math-ratio-06-02/index.html", prev: null };

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════
   Data only; the shared layer in ../unit-js/ reads it at CALL time. Ids must match
   ../metadata/methodica-math-ratio-06-01.json byte-for-byte (the loader shouts on a mismatch). */
var XAPI_COMP_SLUG     = 'methodica-math-ratio-06-01';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';
var XAPI_METADATA_FILE = '../metadata/methodica-math-ratio-06-01.json';

/* Screen (this component's own GLOBAL data-screen numbers, 0-2) -> [item suffix, page in item].
   The whole hook is ONE catalogue item (-001, "ארגזי תרומה"): the opener, its question (q1) and
   the closer are its three pages, so walking them emits nothing between the item's
   initialized and completed. Keys must be exactly this component's screens. */
var SCREEN_TO_SUBCONTENT = {
  0: ['001', 1],
  1: ['001', 2],
  2: ['001', 3]
};

/* Items carrying a code-graded question (used as a set). */
var XAPI_EVAL_ITEMS = { '001': 1 };

/* The hook reports success whatever the answer (decision 28.09.26) — scaled carries the one
   question's result. See partResult() in ../unit-js/70-platform.js. */
var PART_GATED = false;
