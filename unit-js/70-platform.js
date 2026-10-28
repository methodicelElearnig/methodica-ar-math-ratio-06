'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-math-ratio-06 — platform glue: xAPI reporting + resume on the 720-core engine.

   The platform files (10-identity / 20-xapi / 40-resume / 50-loader / 90-boot) come from
   methodica-math-ratio-01 (35648a6). That unit owns its screens in 70-screens.js; this one runs on
   the vendored 720-core (engine.js / quiz-engine.js), so everything the platform layer expects from
   "the part" is provided HERE, once, for both components — the idea of ratio-01's 70-screens.js.
   quizState / QUESTIONS / TOTAL_SCREENS are top-level const in the shared global lexical scope, so
   this shared file reaches them directly (they are not window properties, but they ARE global).

   Definition-only, like the rest of unit-js/ except 90-boot.js.

   Seams it provides:
     PART_FIRST / PART_LAST     this component's screen range (from PART_CONFIG, script.js)
     lastScreenButton()         the button whose click ends this component (D-8)
     partExit(dir)              engine.js goTo() walking off either end of the component
     partResult()               the component result sent with 'completed'
     capturePartPayload / applyResumeVars / applyResumeDom / restoreScreenUI   the resume hooks
     applyExecutionState(st, n) the restore replay (50-loader.js phase B)
     repaintScreen(n)           engine.js goTo(), after resetScreenState — every navigation (§8.4a)
     onQuizAnswered / onQuizCommitted / onQuizHint   quiz-engine.js call sites
     partBoot()                 90-boot.js — builds the question screens and lands the part
   Design record: docs-and-tools/REPORTING-RESUME.md.
   ═══════════════════════════════════════════════════════════════════ */

var PART_FIRST = (window.PART_CONFIG && typeof window.PART_CONFIG.start === 'number') ? window.PART_CONFIG.start : 0;
var PART_LAST  = (window.PART_CONFIG && typeof window.PART_CONFIG.end === 'number') ? window.PART_CONFIG.end : TOTAL_SCREENS - 1;

/* No field ids to watch (the answer boxes are generated without ids) — the delegated saves in
   initQuizFieldSaves() cover typing and picking instead. Declared so 40-resume.js's O-2 hook
   finds an empty list rather than guessing. */
var RESUME_INPUT_IDS = [];
var RESUME_TEXT_IDS  = [];

function _pq(n) { return QUESTIONS.find(function (x) { return x.screen === n; }) || null; }
function _partQuestions() { return QUESTIONS.filter(function (q) { return inPart(q.screen); }); }
function _itemFor(n) {
  var m = (typeof SCREEN_TO_SUBCONTENT !== 'undefined') ? SCREEN_TO_SUBCONTENT[n] : null;
  return m ? m[0] : null;
}

/* ═══════════════════ Reporting call sites (quiz-engine.js) ═══════════════════ */

/* What the learner answered, as they see it. Single choice: the option's own text (tooltips and
   zoom buttons stripped by xapiAnswerText), else an image's alt, else the option id. Value input:
   the boxes in data-slot order — a ratio row reads "2:11", anything else "a | b". */
function quizAnswerText(screen, q, st) {
  try {
    if (q.type === 'single' || q.type === 'multi') {
      var ids = q.type === 'multi' ? (st.selectedSet || []) : [st.selected];
      return ids.map(function (id) {
        var o = document.querySelector('#q' + screen + ' .scq-opt[data-id="' + id + '"]');
        if (!o) return String(id);
        var t = xapiAnswerText(o.querySelector('.scq-opt-text') || o);
        var img = t ? null : o.querySelector('img');
        return t || (img && img.getAttribute('alt')) || String(id);
      }).join(', ');
    }
    if (q.type === 'value-input') {
      return (st.selectedSet || []).join(q.ratioRows ? ':' : ' | ');
    }
    return JSON.stringify(st.selectedSet || st.selected || '');
  } catch (e) { return ''; }
}

/* Called from quizCheck() after the verdict is known and BEFORE any marking — every submit, all
   three branches. Every question here is one catalogue item with one question, 'q1'. The isLast
   idiom is the family's: correct || attempts exhausted. The Retry gate (quiz-engine.js) makes the
   second attempt a real one, so answered.last counts are honest. */
function onQuizAnswered(screen, q, st, correct) {
  var item = _itemFor(screen);
  if (!item) return;
  xapiAnswered(item, 'q1', correct, correct || st.attempts >= q.maxAttempts, quizAnswerText(screen, q, st));
}

/* Called at the very tail of quizCheck(), after the last commitment (done / lw / verdict) on every
   path — the flush-after-last-commitment contract (§8.3, D-13). */
function onQuizCommitted(screen) { flushResumeSave(); }

/* Called from quizOpenHint() after its done-guard, immediately before the overlay opens. The hints
   ledger (xapiRequestedHint → sendStatementOnce) reports each question's hint once per attempt,
   across re-opens and reloads (D-7). */
function onQuizHint(screen) {
  var item = _itemFor(screen);
  if (item) xapiRequestedHint(item, 'q1');
}

/* An explicit result for every graded item's 'completed' (read by xapiItemResult, 20-xapi.js),
   from XAPI_Q_RESULTS — the ratio-01 pattern. Without it the item result would be the library's
   own per-page-load aggregate, which knows nothing about answers restored by a resume. Built as a
   getter map so it follows XAPI_EVAL_ITEMS (script.js, loaded before this file). */
var XAPI_ITEM_RESULT = {};
Object.keys((typeof XAPI_EVAL_ITEMS !== 'undefined') ? XAPI_EVAL_ITEMS : {}).forEach(function (item) {
  XAPI_ITEM_RESULT[item] = function () {
    var ok = !!XAPI_Q_RESULTS[item + '/q1'];
    return { success: ok, score: { scaled: ok ? 1 : 0 } };
  };
});

/* ═══════════════════ The end of the component ═══════════════════ */

/* The button whose click ends this component: the last question's "متابعة" (component 02), or
   the static last screen's continue button (component 01's hook closer). */
function lastScreenButton() {
  if (_pq(PART_LAST)) return document.getElementById('q' + PART_LAST + '-check');
  return document.querySelector('#s' + PART_LAST + ' .btn-continue');
}

/* The component result, from XAPI_Q_RESULTS — the same truth the 'answered' statements carried,
   so the component score cannot disagree with them. Unanswered questions count as not correct.
     component 01 (hook, PART_GATED false): success always; scaled = the one question.
     component 02 (PART_GATED true): the gate promised on screen 3 — "צריך לענות נכון על 8 שאלות
       לפחות" — PASS_MARK (unit.js) of the 10; scaled = correct / 10. Below the gate the component
       still ends and still reports (success:false); the platform routes (recommendedAfterFail). */
function partResult() {
  var items = Object.keys((typeof XAPI_EVAL_ITEMS !== 'undefined') ? XAPI_EVAL_ITEMS : {});
  var total = items.length;
  var n = items.filter(function (it) { return !!XAPI_Q_RESULTS[it + '/q1']; }).length;
  var scaled = total ? n / total : 0;
  var gated = (typeof PART_GATED !== 'undefined') && PART_GATED;
  return { success: gated ? n >= PASS_MARK : true, score: { scaled: scaled } };
}

function partResultKey() { return 'ratio06_c' + currentPartSlug().slice(-2) + '_result'; }

/* engine.js goTo() calls this instead of hopping when n leaves [PART_FIRST, PART_LAST].
   Forward off the last screen = the learner's last click: report the component, disable the
   button, record the verdict, flush — and navigate NOWHERE (the platform owns routing, §8.12).
   Only a DEV_NAV walkthrough (?dev=1 without ?registration) goes on to the next component.
   Backward off the first screen only exists under DEV_NAV too. */
function partExit(dir) {
  if (_restoring) return;
  if (dir < 0) {
    if (DEV_NAV) goToPrevPart();
    return;
  }
  if (currentScreen !== PART_LAST) return;
  /* The last question must be answered before its "متابعة" ends anything (ArrowLeft reaches this
     path too). A static last screen has nothing to answer. */
  var lq = _pq(PART_LAST);
  if (lq && !(quizState[PART_LAST] && quizState[PART_LAST].done)) return;
  var res = partResult();
  try { xapiEndComponent(res, lastScreenButton()); } catch (e) { console.error('[xAPI] end component', e); }
  try { setUnitResult(partResultKey(), res.success ? 'pass' : 'fail'); } catch (e) { console.error('[resume] result', e); }
  flushResumeSave();
  if (DEV_NAV && window.PART_CONFIG && window.PART_CONFIG.next) {
    var dest = String(window.PART_CONFIG.next).replace(/\/index\.html$/, '').replace(/\/+$/, '').split('/').pop();
    writeForwardState(dest, '#screen=' + PART_LAST);
    goToNextPart();
  }
}

/* ═══════════════════ Resume hooks ═══════════════════ */

var RESUME_Q_FIELDS = ['attempts', 'done', 'wasCorrect', 'hintUsed', 'selected', 'selectedSet', 'lw', 'tgl'];

/* This component's payload: where the learner is, the per-question verdicts, and every question's
   state — submitted AND pending (a pick or typed value not yet checked; §8.8 rule 4). */
function capturePartPayload() {
  var qs = {};
  _partQuestions().forEach(function (q) {
    var st = quizState[q.screen];
    if (!st) return;
    var o = {};
    RESUME_Q_FIELDS.forEach(function (k) {
      if (st[k] === undefined) return;
      o[k] = Array.isArray(st[k]) ? st[k].slice() : st[k];
    });
    qs[q.screen] = o;
  });
  return {
    currentScreen: currentScreen,
    qResults: JSON.parse(JSON.stringify(XAPI_Q_RESULTS)),
    q: qs
  };
}

/* Restores the variables. Idempotent — applyExecutionState runs it twice. XAPI_Q_RESULTS is
   refilled in place (it is a shared var other files hold). Only this part's questions. */
function applyResumeVars(st) {
  if (!st) return;
  if (st.qResults && typeof st.qResults === 'object') {
    Object.keys(XAPI_Q_RESULTS).forEach(function (k) { delete XAPI_Q_RESULTS[k]; });
    Object.keys(st.qResults).forEach(function (k) { XAPI_Q_RESULTS[k] = !!st.qResults[k]; });
  }
  var qs = st.q || {};
  Object.keys(qs).forEach(function (key) {
    var n = Number(key);
    if (!inPart(n) || !quizState[n]) return;
    var src = qs[key] || {};
    RESUME_Q_FIELDS.forEach(function (k) {
      if (src[k] === undefined) return;
      quizState[n][k] = Array.isArray(src[k]) ? src[k].slice() : src[k];
    });
  });
}

/* Nothing here lives only in the DOM: typed values are mirrored into quizState[n].selectedSet on
   every keystroke (quizInputChange) and written back by the painter, which runs after this. */
function applyResumeDom(st) { /* intentionally empty — see restoreScreenUI */ }

/* One painter per interaction type, config-driven (§8.8). Every painter:
   - repaints from state, never resets it; never reports; mutates no score state
   - is idempotent and safe on a clean screen ("clean" = nothing picked or typed, never attempts===0)
   - re-derives the check button through the live predicate (quizCheckBlocked — the Retry gate)
   - draws the wrong-attempt look only while the answer is still the submitted one (D-15)
   Static screens (0, 2, 3) have no painter. */
function restoreScreenUI(n) {
  var q = _pq(n);
  if (!q || !inPart(n)) return;
  var st = quizState[n];
  if (!st || !document.getElementById('q' + n)) return;
  if (q.type === 'single' || q.type === 'multi') paintChoice(n, q, st);
  else if (q.type === 'value-input') paintValue(n, q, st);
}

function _hintBtn(n) { return document.getElementById('q' + n + '-hint'); }

/* The finished look: exactly what live play leaves (quizCheck's correct / final-wrong branches). */
function _paintDone(n, q, st) {
  var hb = _hintBtn(n);
  if (hb) hb.style.display = 'none';
  if (st.wasCorrect) {
    quizShowFeedback(n, 'correct', q.fb.correct);
  } else {
    var fb = Object.assign({}, q.fb.wrong);
    if (q.type === 'value-input' && st.slotOk && st.slotOk.some(Boolean)) fb.title = 'تقريباً! بعض الإجابات صحيحة';
    quizShowFeedback(n, 'wrong', fb);
    if (q.type === 'value-input') {
      var mode = st.tgl;
      quizAnswerToggleAdd(n, q);
      var tb = document.querySelector('#q' + n + '-feedbox .fb-answer-toggle');
      if (mode === 'mine' && tb) tb.click();
    }
  }
  quizFinish(n);   // DOM: stepper, locked options, "متابعة"; st.done is already true
}

function paintChoice(n, q, st) {
  var opts = document.querySelectorAll('#q' + n + ' .scq-opt');
  var picked = q.type === 'multi' ? (st.selectedSet || []) : (st.selected ? [st.selected] : []);
  var hasPick = picked.length > 0;
  if (!st.done && !st.attempts && !hasPick) return;              // clean screen — leave untouched
  opts.forEach(function (o) {
    o.classList.remove('selected', 'correct', 'wrong', 'locked');
    var on = picked.indexOf(o.dataset.id) !== -1;
    if (on) o.classList.add('selected');
    o.setAttribute('aria-checked', on ? 'true' : 'false');
  });
  var check = document.getElementById('q' + n + '-check');
  if (st.done) {
    quizMarkOutcome(n, q, !!st.wasCorrect);
    _paintDone(n, q, st);
    return;
  }
  check.textContent = 'هل أنا محق؟';
  if (st.attempts > 0) {
    var hb = _hintBtn(n);
    if (hb) hb.style.visibility = 'visible';
    /* Nothing new picked since the rejected attempt: show what the learner saw when they left —
       the rejected pick marked wrong and the retry prompt. A new pick clears both, as live. */
    if (!hasPick && st.lw && q.type === 'single') {
      var w = document.querySelector('#q' + n + ' .scq-opt[data-id="' + st.lw + '"]');
      if (w) w.classList.add('wrong');
      quizShowFeedback(n, 'wrong', { title: q.fb.retry, body: '' });
    } else {
      quizHideFeedback(n);
    }
  }
  check.disabled = quizCheckBlocked(q, st, hasPick);
}

function paintValue(n, q, st) {
  var slots = quizSlots(n);
  var vals = st.selectedSet || [];
  var typed = vals.some(function (v) { return v !== '' && v != null; });
  if (!st.done && !st.attempts && !typed) return;                 // clean screen — leave untouched
  slots.forEach(function (inp, i) {
    inp.value = vals[i] == null ? '' : vals[i];
    inp.classList.remove('wrong', 'correct', 'mark-ok', 'mark-bad');
    inp.disabled = false;
  });
  var check = document.getElementById('q' + n + '-check');
  if (st.done) {
    quizMarkOutcome(n, q, !!st.wasCorrect);   // recomputes the same slotOk/answerKey from the same selectedSet
    _paintDone(n, q, st);
    return;
  }
  check.textContent = 'هل أنا محق؟';
  var ready = slots.length > 0 && !vals.some(function (v) { return !v; }) && vals.length === slots.length;
  if (st.attempts > 0) {
    var hb = _hintBtn(n);
    if (hb) hb.style.visibility = 'visible';
    if (st.lw && quizSig(q, st) === st.lw) {        // still the rejected answer: its marks + prompt
      quizMarkRetry(n, q);
      quizShowFeedback(n, 'wrong', { title: q.fb.retry, body: '' });
    } else {
      quizHideFeedback(n);
    }
  }
  check.disabled = quizCheckBlocked(q, st, ready);
}

/* Every navigation repaints the target screen from state (engine.js goTo, after resetScreenState):
   the §8.4a hard-lock is "variables say answered, DOM says blank". Skipped while restoring —
   applyExecutionState paints explicitly after its second applyResumeVars. Never an empty catch. */
function repaintScreen(n) {
  if (_restoring) return;
  beginRepaint();
  try {
    restoreScreenUI(n);
    restoreEndedButton();   // D-8: the painter just re-enabled a finished component's button
  } catch (e) { console.error('[resume] repaintScreen', e); }
  finally { endRepaint(); }
}

/* Replay a saved payload onto this component (ratio-01 30-nav.js, adapted). Two passes of
   applyResumeVars around goTo(); the sender is stubbed across the whole replay so nothing is
   re-reported; then the library is told about the restored answers (B-1 / seed) and the landing
   screen's item is opened exactly once.
   screenOverride (#screen=N) chooses the SCREEN only, never skips the restore (§8.4b). Both it and
   the saved screen are range-checked against THIS component: engine.js goTo() treats a screen
   outside [PART_FIRST, PART_LAST] as a request to leave the component. */
function applyExecutionState(st, screenOverride) {
  if (!st) return;
  _restoring = true;
  var _origSend = window.sendStatement720;
  window.sendStatement720 = function () {};
  var _inRange = function (v) { return typeof v === 'number' && v >= PART_FIRST && v <= PART_LAST; };
  try {
    applyResumeVars(st);
    var _n = _inRange(screenOverride) ? screenOverride
           : (_inRange(st.currentScreen) ? st.currentScreen : PART_FIRST);
    goTo(_n);
    applyResumeVars(st);
    applyResumeDom(st);
    restoreScreenUI(currentScreen);
    restoreEndedButton();
    /* The progress strip of the landing screen reads quizState, restored above */
    try { quizStepperUpdate(currentScreen); } catch (e) {}
  } catch (e) {
    console.error('[resume] apply', e);
  } finally {
    window.sendStatement720 = _origSend;
    _restoring = false;
  }
  try { xapiSeedAnsweredFromResume(); } catch (e) {}
  xapiCurrentItem = null;
  try { xapiOnScreen(currentScreen); } catch (e) {}
}

/* Pending answers are saved as they are made, not only on the next screen change (O-2 for this
   engine): a pick or a keystroke arms the debounced save. Bubble phase on document, so the
   element's own inline handler has already updated quizState. */
function initQuizFieldSaves() {
  var arm = function (e) {
    var t = e && e.target;
    if (t && t.closest && t.closest('.quiz-screen')) scheduleResumeSave();
  };
  document.addEventListener('input', arm);
  document.addEventListener('change', arm);
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('.scq-opt')) scheduleResumeSave();
  });
}

/* The part's own boot, called once from 90-boot.js (was engine.js's DOMContentLoaded block):
   build the question screens, give every screen its report flag, scale, land. */
function partBoot() {
  if (typeof quizBuildScreens === 'function') quizBuildScreens();
  if (typeof cloneReportFlags === 'function') cloneReportFlags();
  scaleApp();
  /* NOT a hard goTo(0): goTo() treats n < PART_FIRST as leaving the component. */
  goTo(firstScreen());
}
