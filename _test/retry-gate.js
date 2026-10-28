/* ═══════════════════ Retry gate + "paint only submitted state" — methodica-math-ratio-06 ═══════════════════
   NOT DEPLOYED. Dev tooling only. ADDING-REPORTING-AND-RESUME.md §8.8 rules 9–10 (QA D-14, D-15);
   the idea of methodica-science-mass-measure-03/_test/retry-gate.js.

   For every two-attempt question (screens 4–13): wrong → check; the SAME answer (also in an
   equivalent spelling) keeps "צדקתי?" disabled; a different answer enables it; back to the rejected
   one disables it again; leaving and returning keeps that; the payload carries `lw`; a JSON round
   trip into a fresh page and applyExecutionState keeps it disabled; after "changed answer, away and
   back" the unsubmitted answer carries no wrong marks; the correct answer then finishes and clears
   `lw`. Plus the one-attempt hook question (screen 1), where there is no retry at all.

   Run: NODE_PATH=<jsdom>/node_modules node _test/retry-gate.js */

'use strict';

const H = require('./harness.js');
const { boot, KEY, WR1, WR2, enterJs, clickCheck } = H;
const R = H.makeReporter('retry-gate');
const { ok, eq } = R;

/* an equivalent spelling of the rejected answer: value boxes get padding (quizNum ignores it) */
const SAME = { 5: [' 1'], 6: ['1 '], 8: [' 1 '], 12: ['1 ', ' 1'] };

async function main() {
  const disabled = (b, n) => b.val('document.getElementById("q' + n + '-check").disabled');
  const wrongMarks = (b, n) => b.val('document.querySelectorAll("#q' + n + ' .scq-opt.wrong, #q' + n + ' .vi-input.wrong").length');

  for (const n of [4, 5, 6, 7, 8, 9, 10, 11, 12, 13]) {
    const t = 'q' + n;
    const b = await boot('02', { lib: true });
    b.finishBoot();
    b.exec('goTo(' + n + ');');
    ok(t, 'clean screen: check disabled', disabled(b, n) === true);
    b.exec(enterJs(n, WR1[n]) + clickCheck(n));
    eq(t, 'after a wrong first attempt: attempts 1, not done', b.val('[quizState[' + n + '].attempts, quizState[' + n + '].done]'), [1, false]);
    ok(t, 'lw recorded', !!b.val('quizState[' + n + '].lw'));
    ok(t, 'check disabled right after the rejection', disabled(b, n) === true);

    b.exec(enterJs(n, WR1[n]));
    ok(t, 're-entering the rejected answer keeps check disabled', disabled(b, n) === true);
    if (SAME[n]) {
      b.exec(enterJs(n, SAME[n]));
      ok(t, 'an equivalent spelling of it is still refused', disabled(b, n) === true);
    }
    b.exec(enterJs(n, WR2[n]));
    ok(t, 'a different answer enables check', disabled(b, n) === false);
    b.exec(enterJs(n, WR1[n]));
    ok(t, 'back to the rejected answer disables it again', disabled(b, n) === true);

    b.exec('goTo(' + (n === 4 ? 5 : n - 1) + '); goTo(' + n + ');');
    ok(t, 'leave and return: still disabled on the rejected answer', disabled(b, n) === true);

    const payload = b.val('JSON.stringify(capturePartPayload())');
    ok(t, 'the payload carries lw', !!JSON.parse(payload).q[n].lw);

    /* a fresh page, the payload restored through the real replay */
    const r = await boot('02', { lib: true });
    r.finishBoot();
    r.exec('applyExecutionState(' + payload + ', ' + n + ');');
    eq(t, 'restored onto the question', r.val('currentScreen'), n);
    ok(t, 'restored: still disabled on the rejected answer', disabled(r, n) === true);

    /* D-15: change the answer, leave, return — the unsubmitted answer carries no wrong marks */
    r.exec(enterJs(n, WR2[n]));
    r.exec('goTo(' + (n === 4 ? 5 : n - 1) + '); goTo(' + n + ');');
    eq(t, 'changed answer, away and back: no wrong marks on it', wrongMarks(r, n), 0);
    ok(t, '… and check is enabled for it', disabled(r, n) === false);
    ok(t, '… and the retry prompt is not shown on it', r.val('!document.getElementById("q' + n + '-feedbox").classList.contains("is-wrong")'));

    /* the correct answer finishes and clears lw */
    r.exec(enterJs(n, KEY[n]) + clickCheck(n));
    eq(t, 'correct second attempt: done, lw cleared', r.val('[quizState[' + n + '].done, quizState[' + n + '].lw]'), [true, null]);
    ok(t, 'check became "שנמשיך?" and is enabled', r.val('document.getElementById("q' + n + '-check").textContent === "שנמשיך?" && !document.getElementById("q' + n + '-check").disabled'));
    eq(t, 'no console.error', b.errors.concat(r.errors), []);
  }

  /* the hook question: one attempt, so no retry state ever */
  {
    const b = await boot('01', { lib: true });
    b.finishBoot();
    b.exec('goTo(1);' + enterJs(1, WR1[1]) + clickCheck(1));
    eq('q1', 'one wrong attempt ends it: done, lw null', b.val('[quizState[1].done, quizState[1].lw]'), [true, null]);
  }

  return R.done();
}

main().catch(e => { console.error(e); process.exitCode = 1; });
