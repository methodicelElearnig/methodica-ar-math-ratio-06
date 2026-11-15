/* ═══════════════════ behavioural statement-flow oracle — methodica-ar-math-ratio-06 ═══════════════════
   NOT DEPLOYED. Dev tooling only.

   Which statements actually leave the lomda when a learner does something, in what order, carrying
   what result — and which do NOT leave when the same screen is reached again by a reload or Back.
   Structure/contract checks live in verify-report.js; the Retry gate in retry-gate.js.
   Scenario list modelled on methodica-math-ratio-01/_test/statement-flow.js (35648a6).

   Run (jsdom outside OneDrive — _test/README.md):
     NODE_PATH=<jsdom>/node_modules node _test/statement-flow.js */

'use strict';

const H = require('./harness.js');
const { boot, readMeta, KEY, WR1, WR2, enterJs, clickCheck } = H;
const R = H.makeReporter('statement-flow');
const { ok, eq } = R;

const META = { '01': readMeta('01'), '02': readMeta('02') };
const itemId = (c, s) => META[c].id + 'methodica-ar-math-ratio-06-' + c + '-' + s + '/';
const qId = (c, s) => itemId(c, s) + 'q1';
const since = (b, n) => b.stmts().slice(n);
const tail = (b, n) => b.stmts().slice(-n);

/* Answer question n: an array of attempts (each entered through the real handlers, then check). */
function answer(b, n, attempts) {
  attempts.forEach(a => b.exec(enterJs(n, a) + clickCheck(n)));
}

async function main() {

  /* ══════════ 1. Regression gate — no ?slxapi, no library ══════════ */
  {
    const b = await boot('02', { meta: false });
    ok('gate', 'sendStatement720 absent off-platform', b.val('typeof sendStatement720') === 'undefined');
    ok('gate', 'xapiOnScreen is a silent no-op', b.val('(function(){ xapiOnScreen(4); xapiOnScreen(5); return "no-throw"; })()') === 'no-throw');
    ok('gate', 'xapiAnswered still records the score', b.val("(function(){ xapiAnswered('001','q1',true,true,'x'); return XAPI_Q_RESULTS['001/q1']; })()") === true);
    b.exec('goTo(4);' + enterJs(4, KEY[4]) + clickCheck(4) + clickCheck(4));
    ok('gate', 'the lomda still works: q4 answered and moved on', b.val('quizState[4].done && currentScreen === 5') === true);
    eq('gate', 'no network request at all', b.w.__fetches.length, 0);
    eq('gate', 'no console.error', b.errors, []);
  }

  /* ══════════ 2. Component 01 — fresh load, the hook, the last click ══════════ */
  {
    const b = await boot('01', { lib: true });
    b.finishBoot();
    const s = b.stmts();
    eq('c01', 'fresh load: component then landing item initialized', s.map(x => x.verb), ['initialized', 'initialized']);
    ok('c01', 'the first is the component (no objectId)', !s[0].objectId);
    eq('c01', 'the second opens item 001', s[1].objectId, itemId('01', '001'));
    ok('c01', 'item 001 is flagged isEvaluationItem', s[1].opts && s[1].opts.isEvaluationItem === true);

    let n = b.stmts().length;
    b.exec('goTo(1);');
    eq('c01', 'paging inside item 001 (0 → 1) emits nothing', since(b, n).length, 0);

    b.exec(enterJs(1, WR1[1]) + clickCheck(1));
    const a = tail(b, 1)[0];
    eq('c01', 'the one-attempt hook question → answered.last', a.verb, 'answered.last');
    eq('c01', '… against the catalogue questionId', a.opts && a.opts.questionId, qId('01', '001'));
    eq('c01', '… success false, scaled 0', [a.result.success, a.result.score.scaled], [false, 0]);
    eq('c01', '… student_answer is the option text', a.result.extensions.student_answer, ['4']);
    ok('c01', 'no hint button on the hook question', b.val('document.getElementById("q1-hint") === null'));

    n = b.stmts().length;
    b.exec(clickCheck(1));                      // שנמשיך? → s2
    eq('c01', 'continue into s2 (same item) emits nothing', since(b, n).length, 0);
    eq('c01', 'landed on s2', b.val('currentScreen'), 2);

    n = b.stmts().length;
    b.exec('document.querySelector("#s2 .btn-continue").click();');
    const end = since(b, n);
    eq('c01', 'the last click → item completed, then component completed', end.map(x => x.verb + ':' + (x.objectId ? 'item' : 'comp')), ['completed:item', 'completed:comp']);
    eq('c01', 'item result is explicit', end[0].result, { success: false, score: { scaled: 0 } });
    eq('c01', 'hook component: success true, scaled = its one question', end[1].result, { success: true, score: { scaled: 0 } });
    ok('c01', 'the button is disabled', b.val('document.querySelector("#s2 .btn-continue").disabled') === true);
    eq('c01', 'no navigation in production', b.val('location.pathname'), '/methodica-ar-math-ratio-06/methodica-ar-math-ratio-06-01/index.html');
    eq('c01', 'verdict recorded in the document', b.state().results, { ratio06_c01_result: 'pass' });
    n = b.stmts().length;
    b.exec('document.querySelector("#s2 .btn-continue").disabled = false; document.querySelector("#s2 .btn-continue").click();');
    eq('c01', 'a second last click sends nothing (ledger)', since(b, n).length, 0);
    ok('c01', 'no statement ever names the unit as its object', !b.stmts().some(x => x.objectId === 'methodica-ar-math-ratio-06' || (x.opts && x.opts.objectId === 'methodica-ar-math-ratio-06')));

    /* reload on the finished component: nothing re-sent, button stays dead (D-8) */
    const r = await b.reload();
    const n0 = r.stmts().length;
    r.finishBoot();
    eq('c01', 'reload: lands on the saved screen', r.val('currentScreen'), 2);
    eq('c01', 'reload: only the two initialized go out', since(r, n0).map(x => x.verb), ['initialized', 'initialized']);
    ok('c01', 'reload: the finished button is still disabled', r.val('document.querySelector("#s2 .btn-continue").disabled') === true);
    r.exec('goTo(1);');
    ok('c01', 'reload: the hook question is repainted as answered', r.val('document.querySelector("#q1 .scq-opt[data-id=\\"a\\"]").classList.contains("wrong") && document.querySelector("#q1 .scq-opt[data-id=\\"c\\"]").classList.contains("correct") && document.getElementById("q1-check").textContent === "שנמשיך?"') === true);
    r.exec('goTo(2);');
    ok('c01', 'reload: back to s2, still disabled', r.val('document.querySelector("#s2 .btn-continue").disabled') === true);
    eq('c01', 'no console.error', b.errors.concat(r.errors), []);
  }

  /* ══════════ 3. Component 02 — items, hints, Back, the gate ══════════ */
  {
    const b = await boot('02', { lib: true });
    b.finishBoot();
    eq('c02', 'fresh load on the transition (no item): only the component initialized', b.verbs(), ['initialized']);
    let n = b.stmts().length;
    b.exec('document.querySelector("#s3 button[onclick=\\"goTo(4)\\"]").click();');
    eq('c02', 'אפשר להתחיל → one initialized on item 001', since(b, n).map(x => x.verb + ' ' + x.objectId), ['initialized ' + itemId('02', '001')]);

    n = b.stmts().length;
    answer(b, 4, [WR1[4]]);
    const w1 = since(b, n);
    eq('c02', 'first wrong answer → answered (not .last)', w1.map(x => x.verb), ['answered']);
    eq('c02', '… success false', w1[0].result.success, false);

    n = b.stmts().length;
    b.exec('quizOpenHint(4); quizCloseHint(); quizOpenHint(4); quizCloseHint();');
    const h = since(b, n);
    eq('c02', 'hint opened twice → ONE requested.1', h.map(x => x.verb), ['requested.1']);
    eq('c02', '… carrying the catalogue questionId', h[0].opts.questionId, qId('02', '001'));

    n = b.stmts().length;
    answer(b, 4, [KEY[4]]);
    const c1 = since(b, n);
    eq('c02', 'correct second answer → answered.last success, scaled 1', c1.map(x => [x.verb, x.result.success, x.result.score.scaled]), [['answered.last', true, 1]]);

    n = b.stmts().length;
    b.exec(clickCheck(4));                     // שנמשיך?
    eq('c02', 'crossing 001 → 002: completed 001 then initialized 002', since(b, n).map(x => x.verb + ' ' + x.objectId), ['completed ' + itemId('02', '001'), 'initialized ' + itemId('02', '002')]);

    n = b.stmts().length;
    b.exec('document.querySelector("#q5 .quiz-back").click();');
    eq('c02', 'Back 002 → 001 closes nothing, re-opens 001 (O-1)', since(b, n).map(x => x.verb + ' ' + x.objectId), ['initialized ' + itemId('02', '001')]);

    /* a hint can no longer be opened (or reported) once the question is done */
    b.exec('goTo(6);' + enterJs(6, KEY[6]) + clickCheck(6));
    let hn = b.stmts().length;
    b.exec('quizOpenHint(6); quizCloseHint();');
    eq('c02', 'quizOpenHint on a finished question reports nothing', since(b, hn).length, 0);
    b.exec('goTo(4);' + clickCheck(4));

    /* keyboard: ArrowLeft past an unanswered question is refused in production */
    b.exec(clickCheck(4));                     // forward again to q5 (001 done)
    const k = b.stmts().length;
    b.exec('document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));');
    eq('c02', 'ArrowLeft on unanswered q5 does not move', b.val('currentScreen'), 5);
    ok('c02', '… and closes no item', !since(b, k).some(x => x.verb === 'completed'));

    /* reload mid-component: nothing re-reported, hint ledger holds across the reload */
    answer(b, 5, [WR1[5]]);
    b.exec('quizOpenHint(5); quizCloseHint();');
    const r = await b.reload();
    const r0 = r.stmts().length;
    r.finishBoot();
    eq('c02', 'reload on q5: the item then the component initialized, nothing else', since(r, r0).map(x => x.verb + ' ' + (x.objectId || 'comp')), ['initialized ' + itemId('02', '002'), 'initialized comp']);
    eq('c02', 'reload: landed on q5', r.val('currentScreen'), 5);
    let m = r.stmts().length;
    r.exec('quizOpenHint(5); quizCloseHint();');
    eq('c02', 'reload: re-opening an already-reported hint sends nothing (D-7)', since(r, m).length, 0);
    m = r.stmts().length;
    answer(r, 5, [KEY[5]]);
    r.exec(clickCheck(5));
    const after = since(r, m);
    eq('c02', 'after reload: answered.last, then 002 completed (B-1 seed), then 003 opened', after.map(x => x.verb + ' ' + (x.objectId || '')), ['answered.last ', 'completed ' + itemId('02', '002'), 'initialized ' + itemId('02', '003')]);
    eq('c02', '002 completed carries the true final result', after[1].result, { success: true, score: { scaled: 1 } });
    eq('c02', 'no console.error', b.errors.concat(r.errors), []);
  }

  /* ══════════ 3b. B-2 (QA 2026-10-02) — Back onto the transition (no item) closes nothing ══════════
     Live: s4 (item 001) wrong once → the screen's Back → s3 (null) sent completed 001 {success:false};
     the right answer after it was then swallowed by the ledger. */
  {
    const b = await boot('02', { lib: true });
    b.finishBoot();
    b.exec('goTo(4);');
    answer(b, 4, [WR1[4]]);
    let n = b.stmts().length;
    b.exec('document.querySelector("#q4 .quiz-back").click();');
    eq('b2', 'the Back button lands on s3', b.val('currentScreen'), 3);
    ok('b2', 'Back s4 → s3 (no item) sends no completed', !since(b, n).some(x => x.verb === 'completed'), since(b, n).map(x => x.verb + ' ' + x.objectId).join(','));
    eq('b2', 'and leaves item 001 out of the ledger', b.val('alreadySent("doneItems", itemLedgerKey("001"))'), false);
    b.exec('goTo(4);');
    answer(b, 4, [KEY[4]]);
    b.exec(clickCheck(4));                     // שנמשיך? → s5, closes 001
    const c = b.stmts().filter(x => x.verb === 'completed' && x.objectId === itemId('02', '001'));
    eq('b2', 'item 001 completed exactly once', c.length, 1);
    ok('b2', 'with the final result (success, scaled 1)', c[0] && c[0].result && c[0].result.success === true && c[0].result.score.scaled === 1, JSON.stringify(c[0] && c[0].result));
    eq('b2', 'no console.error', b.errors, []);
  }

  /* ══════════ 4. The gate — 8 of 10 passes, 7 of 10 does not ══════════ */
  for (const good of [8, 7]) {
    const b = await boot('02', { lib: true });
    b.finishBoot();
    b.exec('goTo(4);');
    let i = 0;
    for (const n of [4, 5, 6, 7, 8, 9, 10, 11, 12, 13]) {
      answer(b, n, i++ < good ? [KEY[n]] : [WR1[n], WR2[n]]);
      b.exec(clickCheck(n));                  // שנמשיך? — on q13 this is the last click
    }
    const s = b.stmts();
    const comp = s.filter(x => x.verb === 'completed' && !x.objectId);
    const tag = 'gate' + good;
    eq(tag, 'exactly one component completed', comp.length, 1);
    eq(tag, 'result', comp[0] && comp[0].result, { success: good >= 8, score: { scaled: good / 10 } });
    eq(tag, 'ten answered.last (one per question)', s.filter(x => x.verb === 'answered.last').length, 10);
    eq(tag, 'ten item completed, one per item', new Set(s.filter(x => x.verb === 'completed' && x.objectId).map(x => x.objectId)).size, 10);
    eq(tag, 'item completed is the last statement before the component', s.slice(-2).map(x => x.verb + (x.objectId ? ':item' : ':comp')), ['completed:item', 'completed:comp']);
    ok(tag, 'q13 button disabled', b.val('document.getElementById("q13-check").disabled') === true);
    eq(tag, 'still on q13, no navigation', [b.val('currentScreen'), b.val('location.pathname')], [13, '/methodica-ar-math-ratio-06/methodica-ar-math-ratio-06-02/index.html']);
    eq(tag, 'verdict in the document', b.state().results.ratio06_c02_result, good >= 8 ? 'pass' : 'fail');
    const n = b.stmts().length;
    b.exec('document.getElementById("q13-check").disabled = false;' + clickCheck(13));
    eq(tag, 'a second last click sends nothing', since(b, n).length, 0);
    ok(tag, 'no unit-level object anywhere', !s.some(x => (x.opts && x.opts.objectId) === 'methodica-ar-math-ratio-06'));
    eq(tag, 'no console.error', b.errors, []);
  }

  /* ══════════ 5. Ended button after resume (D-8) — and its control ══════════ */
  {
    /* answered q13 but never clicked "שנמשיך?" → after reload the button must stay LIVE */
    const b = await boot('02', { lib: true });
    b.finishBoot();
    b.exec('goTo(13);');
    answer(b, 13, [KEY[13]]);
    const r = await b.reload();
    r.finishBoot();
    eq('d8', 'answered-not-clicked: lands on q13', r.val('currentScreen'), 13);
    ok('d8', 'answered-not-clicked: "שנמשיך?" is live', r.val('document.getElementById("q13-check").disabled === false && document.getElementById("q13-check").textContent === "שנמשיך?"'));
    const n = r.stmts().length;
    r.exec(clickCheck(13));
    ok('d8', '… and the click still sends the component completed', since(r, n).some(x => x.verb === 'completed' && !x.objectId));
    const r2 = await r.reload();
    r2.finishBoot();
    ok('d8', 'clicked-then-reloaded: the button is dead', r2.val('document.getElementById("q13-check").disabled') === true);
    r2.exec('goTo(12); goTo(13);');
    ok('d8', 'clicked-then-reloaded: still dead after back and forward', r2.val('document.getElementById("q13-check").disabled') === true);
  }

  /* ══════════ 6. Re-take — the platform cleared the document ══════════ */
  {
    const b = await boot('02', { lib: true, storage: { local: { ratio06_c02_result: 'pass' } } });
    b.finishBoot();
    eq('retake', 'an absent document beats a stale localStorage verdict', b.val('getUnitResult("ratio06_c02_result")'), null);
    eq('retake', 'empty ledgers', b.val('JSON.stringify([_unitState.done, _unitState.doneItems])'), '[{},{}]');
    eq('retake', 'nothing was written before any interaction', b.state(), null);
  }

  /* ══════════ 7. #screen=N picks the screen, never cancels the restore ══════════ */
  {
    const b = await boot('02', { lib: true });
    b.finishBoot();
    b.exec('goTo(4);'); answer(b, 4, [KEY[4]]); b.exec(clickCheck(4)); answer(b, 5, [KEY[5]]);
    const r = await b.reload({ hash: '#screen=4' });
    r.finishBoot(4);
    eq('hash', 'lands on the hashed screen', r.val('currentScreen'), 4);
    ok('hash', '… with every answer restored', r.val('quizState[4].done && quizState[5].done && XAPI_Q_RESULTS["002/q1"] === true') === true);
  }

  /* ══════════ 8. DEV_NAV ══════════ */
  {
    const a = await boot('01', { search: '?dev=1' });
    const c = await boot('01', { search: '?dev=1&registration=abc' });
    const d = await boot('01', { search: '' });
    eq('devnav', '?dev=1 → DEV_NAV', a.val('DEV_NAV'), true);
    eq('devnav', '?dev=1&registration → production', c.val('DEV_NAV'), false);
    eq('devnav', 'no query → production', d.val('DEV_NAV'), false);
    a.exec('goTo(1);');
    a.exec('document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));');
    eq('devnav', 'DEV_NAV keeps free keyboard navigation', a.val('currentScreen'), 2);
  }

  return R.done();
}

main().catch(e => { console.error(e); process.exitCode = 1; });
