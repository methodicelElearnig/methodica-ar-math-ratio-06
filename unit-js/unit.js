/* =====================================================================
   methodica-ar-math-ratio-06 — unit logic (יעד 1.6, יחס).
   Runs on the shared 720-core (engine.js / quiz-engine.js / motion.js).

   14 screens over two components, both numbered globally:
     01 (הוק)            screens 0-2   = deck slides 3, 4, 5
     02 (תרגול סטנדרטי)  screens 3-13  = deck slides 7-17

   Screens 0, 2 and 3 are static in their component's index.html; every
   question screen (1, 4-13) is generated from QUESTIONS by quiz-engine.js.
   ===================================================================== */

'use strict';

const TOTAL_SCREENS = 14;

/* The unit's pass gate: 8 of the 10 practice questions (screens 4-13). The METADATA is the source
   of truth (decision 28.09.26) — metadata/methodica-ar-math-ratio-06-02.json, item 001
   informationToBot: "נדרש לענות נכון על 8 מתוך 10 לפחות", as the deck (slide 7) also says. The
   transition screen (s3) was changed to 7 in 5eaf878 (24.09) and is back to 8. The metadata, the
   screen-3 text, this gate and the reported success (partResult() in 70-platform.js) must agree. */
const PASS_MARK = 8;
const PRACTICE_SCREENS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

function practiceScore() {
  if (typeof quizState === 'undefined') return 0;
  return PRACTICE_SCREENS.filter(n => quizState[n] && quizState[n].wasCorrect).length;
}

/* ═══ Per-screen restore hook (engine.js calls this on every goTo) ═══ */
function resetScreenState(n) {
  if (typeof quizStepperUpdate === 'function') quizStepperUpdate(n);
  /* keep the shared DEV harness in sync (two-way protocol) */
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'DEV_SCREEN', screen: n }, '*');
  }
}

/* ═══ Screen 2 (deck slide 5) ═════════════════════════════════════════
   "דמות עולה 2 שניות אחרי הטקסט" — the character enters two seconds after
   the copy, so it is a delayed reveal rather than part of the normal
   entrance sequence. */
document.addEventListener('DOMContentLoaded', () => {
  const char = document.querySelector('#s2 .hookclose-char');
  if (!char) return;
  const arm = () => {
    char.classList.remove('is-in');
    setTimeout(() => char.classList.add('is-in'), 2000);
  };
  /* re-arm every time the learner lands on the screen, not just at boot */
  const obs = new MutationObserver(() => {
    if (document.getElementById('s2').classList.contains('active')) arm();
  });
  obs.observe(document.getElementById('s2'), { attributes: true, attributeFilter: ['class'] });
  if (document.getElementById('s2').classList.contains('active')) arm();
});

/* every screen carries the report flag — a CLONE of the static one. Clicks are wired by
   delegation on document (report-modal.js), so a clone needs no handler of its own. It must run
   AFTER quizBuildScreens(), or the generated question screens get no flag: partBoot()
   (70-platform.js) calls it there; without the platform layer it runs at DOMContentLoaded. */
function cloneReportFlags() {
  const flag = document.querySelector('.flag-btn');
  if (!flag) return;
  document.querySelectorAll('.screen').forEach(scr => {
    if (scr.querySelector('.flag-btn')) return;
    scr.insertBefore(flag.cloneNode(true), scr.firstChild);
  });
}
document.addEventListener('DOMContentLoaded', () => {
  if (typeof partBoot !== 'function') cloneReportFlags();
});
