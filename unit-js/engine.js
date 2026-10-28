/* =====================================================================
   720-core — screen engine (shared across all units; vendored per unit)
   Per 720-templates references/_global-components.md.

   The unit must define BEFORE this file runs (js/unit.js):
     TOTAL_SCREENS        — number of screens
     resetScreenState(n)  — per-screen restore hook
   Optional: quizBuildScreens() from quiz-engine.js (auto-called if present).
   ===================================================================== */

'use strict';

let currentScreen = 0;


/* ---------- Canvas scaling (1280×710) ---------- */
function scaleApp() {
  const app = document.getElementById('app');
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 710);
  app.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', scaleApp);


/* ---------- Multi-component boundary hops ----------
   Walking off either end loads the neighbour and carries the query string
   across; `?screen=last` tells the neighbour to open on ITS last screen so Back
   lands where the learner actually left. */
function goToNextPart() {
  const p = window.PART_CONFIG;
  if (!p || !p.next) return;
  window.location.replace(p.next + window.location.search);
}
function goToPrevPart() {
  const p = window.PART_CONFIG;
  if (!p || !p.prev) return;
  const q = window.location.search;
  window.location.replace(p.prev + (q ? q + '&' : '?') + 'screen=last');
}
/* The screen this app opens on: its part's first, or its LAST when the next
   component sent the learner back. Plain units open on 0. */
function firstScreen() {
  const p = window.PART_CONFIG;
  if (!p) return 0;
  /* ?screen=last is only ever written by goToPrevPart(), which the platform layer runs under
     DEV_NAV alone (the platform owns routing) — so it is honoured only there too. */
  const devOk = typeof DEV_NAV === 'undefined' || DEV_NAV;
  return devOk && new URLSearchParams(window.location.search).get('screen') === 'last' ? p.end : p.start;
}

/* ---------- Navigation ---------- */
function goTo(n) {
  /* Part mode (5-component delivery architecture, per approved units):
     window.PART_CONFIG = { start, end, next | (routeByScore + nextPass/nextFail) }.
     Navigating past the part's last screen routes to the next part app. */
  if (window.PART_CONFIG) {
    /* With the platform layer loaded (70-platform.js), leaving the component is partExit()'s call:
       it reports the component 'completed' and moves nowhere unless DEV_NAV. Without it, the
       vendored behaviour — hop to the neighbour — is unchanged. */
    if (n > window.PART_CONFIG.end) { if (typeof partExit === 'function') partExit(+1); else goToNextPart(); return; }
    if (n < window.PART_CONFIG.start) { if (typeof partExit === 'function') partExit(-1); else goToPrevPart(); return; }
  }
  if (n < 0 || n >= TOTAL_SCREENS) return;
  /* 07.09 — a retired screen number (43, folded into 42) must not blank the
     canvas. The teardown below used to run BEFORE the lookup, so navigating to
     a number with no section left every screen deactivated. Resolve the target
     first, and skip a gap in the direction of travel so the DEV bar's numeric
     stepper walks straight over it. */
  let target = document.querySelector(`.screen[data-screen="${n}"]`);
  if (!target) {
    const step = n >= currentScreen ? 1 : -1;
    for (let i = n + step; i >= 0 && i < TOTAL_SCREENS; i += step) {
      target = document.querySelector(`.screen[data-screen="${i}"]`);
      if (target) { n = i; break; }
    }
    if (!target) return;
  }
  // Close all feedback popups and hint overlays before the screen swap
  document.querySelectorAll('[id$="-popup"], [id$="-hint-overlay"]')
    .forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.applet-embed.is-zoomed').forEach(el => el.classList.remove('is-zoomed'));
  const prev = document.querySelector('.screen.active');
  if (window.Motion && prev) Motion.cancel(prev);
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  target.classList.add('active');
  if (window.Motion) Motion.reveal(target);
  currentScreen = n;
  resetScreenState(n);
  /* Platform layer (70-platform.js / 20-xapi.js / 40-resume.js), in this order and after the
     paint: repaint the screen from state (resume §8.4a — every navigation, not only a restore),
     open/close the catalogue item, then arm the debounced save. Each guarded and logged: a
     reporting fault must never stop navigation, and an empty catch would hide a stale-cache
     ReferenceError. */
  if (typeof repaintScreen === 'function') { try { repaintScreen(n); } catch (e) { console.error('[resume] repaint', e); } }
  if (typeof xapiOnScreen === 'function') { try { xapiOnScreen(n); } catch (e) { console.error('[xAPI] onScreen', e); } }
  if (typeof scheduleResumeSave === 'function') { try { scheduleResumeSave(); } catch (e) { console.error('[resume] save', e); } }
  if (typeof decorateBubbles === 'function') decorateBubbles(target);
  // keep the DEV harness in sync when navigation happens INSIDE the lomda
  // (buttons / keyboard), not only via the DEV bar
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'DEV_SCREEN', screen: n }, '*');
  }
}

/* Forward by keyboard is gated like the screen's own forward button (28.09.26): on a question
   screen only once it is answered (quizState done) — the same condition that turns "צדקתי?" into
   "שנמשיך?". Unguarded, ArrowLeft walked past unanswered questions: navigation the spec gates,
   and with reporting on it closed the catalogue item with a non-final result that the ledger then
   keeps for good. A local walkthrough (DEV_NAV, ?dev=1) keeps free navigation. */
function keyboardForwardAllowed() {
  if (typeof DEV_NAV !== 'undefined' && DEV_NAV) return true;
  if (typeof quizState === 'undefined' || !quizState[currentScreen]) return true;  // not a question screen
  if (window.PART_CONFIG && (currentScreen < window.PART_CONFIG.start || currentScreen > window.PART_CONFIG.end)) return true;
  return !!quizState[currentScreen].done;
}
document.addEventListener('keydown', (e) => {
  /* arrows inside an answer box / select / the report textarea move the caret, not the screen */
  const inField = e.target && e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]');
  if (e.key === 'ArrowLeft' && !inField && keyboardForwardAllowed()) goTo(currentScreen + 1);  // RTL: left = forward
  if (e.key === 'ArrowRight' && !inField) goTo(currentScreen - 1);
  if (e.key === 'Escape' && typeof quizCloseHint === 'function') quizCloseHint();
});

/* Dev bridge for index_dev.html — shared 720 protocol (DEV_GOTO / DEV_READY /
   DEV_SCREEN); 'goto' is kept so any older harness still works. */
window.addEventListener('message', (e) => {
  if (!e.data) return;
  if (e.data.type === 'DEV_GOTO' || e.data.type === 'goto') {
    const n = parseInt(e.data.screen, 10);
    if (!isNaN(n)) goTo(n);
  }
});
if (window.parent !== window) {
  // screens are generated at runtime, so count them once the DOM is built
  const announce = () => {
    const built = document.querySelectorAll('.screen[data-screen]').length;
    window.parent.postMessage({
      type: 'DEV_READY',
      total: Math.max(built, typeof TOTAL_SCREENS === 'number' ? TOTAL_SCREENS : 0),
      part: window.PART_CONFIG || null,
    }, '*');
  };
  if (document.readyState === 'complete') announce();
  else window.addEventListener('load', announce, { once: true });
}

/* ---------- Applet fullscreen zoom (in place — state persists) ---------- */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-applet-toggle]');
  if (!btn) return;
  btn.closest('.applet-embed').classList.toggle('is-zoomed', btn.dataset.appletToggle === 'open');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.applet-embed.is-zoomed').forEach(el => el.classList.remove('is-zoomed'));
  }
});

/* ---------- Init ----------
   With the platform layer, 90-boot.js runs the boot (partBoot() in 70-platform.js: build the
   question screens, clone the report flags, scale, land) and then bootXAPI() — in that order, so
   the restore replays onto built screens. Without it, the vendored init below runs as before. */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof partBoot === 'function') return;
  if (typeof quizBuildScreens === 'function') quizBuildScreens();
  scaleApp();
  /* NOT a hard goTo(0): once goTo() hops to the PREVIOUS component for
     n < PART_CONFIG.start, a boot goTo(0) walks every component back to 01. */
  goTo(firstScreen());
});
