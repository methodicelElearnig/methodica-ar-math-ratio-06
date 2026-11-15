/* ═══════════════════ structural verification — methodica-ar-math-ratio-06 ═══════════════════
   NOT DEPLOYED. Dev tooling only.

   Asserts the CONTRACTS of the reporting / issue-reporting / resume integration — the silent
   failures catalogued in Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md §6.8,
   §7.6, §10.2. Behaviour (which statements leave) is statement-flow.js; the Retry gate is
   retry-gate.js.

   Optional first argument: a package folder to verify instead of the repo (statement-flow.js and
   retry-gate.js cannot run against a package — the stub is correctly excluded from it).

   Run: NODE_PATH=<jsdom>/node_modules node _test/verify-report.js [packageDir] */

'use strict';

if (process.argv[2]) process.env.LOMDA_BASE = require('path').resolve(process.argv[2]);
const H = require('./harness.js');
const { BASE, UNIT, PARTS, PART_DIR, readMeta, boot, fs, path, KEY, WR1, enterJs, clickCheck } = H;
const R = H.makeReporter('verify-report');
const { ok, eq } = R;

const rd = p => fs.readFileSync(path.join(BASE, p), 'utf8');
const SHARED_ORDER = ['../unit-js/10-identity.js', '../unit-js/20-xapi.js', '../unit-js/40-resume.js', '../unit-js/50-loader.js',
  'script.js', '../unit-js/motion.js', '../unit-js/quiz-engine.js', '../unit-js/questions.js', '../unit-js/report-modal.js',
  '../unit-js/unit.js', '../unit-js/engine.js', '../unit-js/70-platform.js', '../unit-js/90-boot.js'];

/* brace-matched body of `function NAME(` in src */
function fnBody(src, name) {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) return null;
  let j = src.indexOf('{', i), depth = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}') { depth--; if (depth === 0) return src.slice(j, k + 1); }
  }
  return null;
}
/* top-level declarations (column 0) of a classic script */
function topDecls(src) {
  const out = [];
  const re = /^(?:async\s+)?(?:function\s+([A-Za-z_$][\w$]*)|(?:var|let|const)\s+([A-Za-z_$][\w$]*))/gm;
  let m; while ((m = re.exec(src))) out.push(m[1] || m[2]);
  return out;
}

async function main() {
  const unitMeta = JSON.parse(rd('metadata/' + UNIT + '_unit.json').replace(/^﻿/, ''));

  /* ══════════ 1. Script tags, versions, layering ══════════ */
  const tagSets = {};
  for (const c of PARTS) {
    const html = rd(PART_DIR(c) + '/index.html');
    const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
    const bare = srcs.map(s => s.split('?')[0]);
    eq('tags', c + ': script order', bare, SHARED_ORDER);
    ok('tags', c + ': every script carries ?v=', srcs.every(s => /\?v=\d+$/.test(s)), srcs.filter(s => !/\?v=/.test(s)).join(', '));
    const links = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m => m[1]);
    ok('tags', c + ': every stylesheet carries ?v=', links.every(s => /\?v=\d+$/.test(s)), links.join(', '));
    tagSets[c] = srcs.concat(links);
    /* 2026-11-14 (fix R, C2): the head now preloads the loader's library; no <script> may name it */
    ok('tags', c + ': no CDN library script tag in the markup (the loader picks it)', !/<script[^>]*xapi-720-/.test(html));
    ok('cover', c + ': #boot-cover in the markup, inline-styled, a sibling of #stage', /<div id="boot-cover" style="position:fixed;inset:0;z-index:9999;[^"]*"><\/div>\s*<script>[\s\S]*?setTimeout\(tick, 800\)[\s\S]*?<\/script>\s*<div id="stage">/.test(html));
  }
  eq('tags', '?v= identical across both components (shared files and script.js)', tagSets['01'].filter(s => s !== 'script.js'), tagSets['02'].filter(s => s !== 'script.js'));

  const loader = rd('unit-js/50-loader.js');
  const libLine = (loader.match(/var LIB720 = CDN \+ \(RESUME_ENABLED \? '(xapi-720-(\w)\.js)' : '(xapi-720-(\w)\.js)'\);/) || []);
  const gate = (loader.match(/window\.XAPI_USING_G = \/xapi-720-\[(\w+)\]\\\.js\/\.test\(LIB720\);/) || [])[1] || '';
  eq('lib', 'resume on → the loader names -l (2026-11-14, fix R §2.10)', libLine[1], 'xapi-720-l.js');
  ok('lib', 'the -l letter is inside the XAPI_USING_G gate', gate.includes('l') && gate.includes(libLine[4] || '?'), gate);
  ok('lib', 'the stub filename carries a gated letter', fs.existsSync(path.join(__dirname, 'xapi-720-l.js')));
  if (process.env.LOMDA_BASE) ok('pkg', 'the package carries no _test/ (the stub never ships)', !fs.existsSync(path.join(BASE, '_test')));

  /* no identifier declared twice at top level across the loaded files (script.js per part) */
  const decl = {};
  for (const s of SHARED_ORDER.filter(s => s !== 'script.js')) {
    topDecls(rd(s.replace('../', ''))).forEach(n => { (decl[n] = decl[n] || []).push(s); });
  }
  for (const c of PARTS) {
    const d = Object.assign({}, decl);
    topDecls(rd(PART_DIR(c) + '/script.js')).forEach(n => { d[n] = (d[n] || []).concat(PART_DIR(c) + '/script.js'); });
    const dup = Object.keys(d).filter(n => d[n].length > 1);
    eq('layers', c + ': no top-level name declared in two files', dup.map(n => n + ' @ ' + d[n].join(' + ')), []);
  }
  for (const c of PARTS) {
    const s = rd(PART_DIR(c) + '/script.js');
    ok('layers', c + ': script.js is configuration only (no function, no listener)', !/\bfunction\b|addEventListener|=>/.test(s));
  }
  const codeFiles = SHARED_ORDER.filter(s => s !== 'script.js').map(s => s.replace('../', ''))
    .concat(PARTS.map(c => PART_DIR(c) + '/script.js'), PARTS.map(c => PART_DIR(c) + '/index.html'),
      process.env.LOMDA_BASE ? [] : ['index.html']);
  ok('case', 'no capitalised unit slug anywhere in code', !codeFiles.some(f => /Methodica-math-ratio-06/i.test(rd(f)) && /[A-Z]ethodica-math-ratio-06|methodica-math-[A-Z]/.test(rd(f))));
  /* Rule 28.09.26: the platforms launch the COMPONENT links only, so a package carries nothing at
     its root. The repo keeps a root index.html for local use; it must never ship. */
  if (process.env.LOMDA_BASE) {
    eq('pkg', 'the package root holds only component folders and shared folders — no root index.html',
      fs.readdirSync(BASE).filter(n => fs.statSync(path.join(BASE, n)).isFile() && n !== 'DEPLOY.md'), []);
  } else {
    ok('root', 'root index.html (local use) redirects to component 01 index.html carrying location.search', /location\.replace\('\.\/methodica-ar-math-ratio-06-01\/index\.html' \+ window\.location\.search\)/.test(rd('index.html')));
  }
  /* The MOE CDN answers a folder URL with 200 + 0 bytes (seen live 28.09.26): every navigation
     target must name its file. The local static server resolves folders, which hid this. */
  for (const c of PARTS) {
    const pc = rd(PART_DIR(c) + '/script.js').match(/window\.PART_CONFIG = (\{[^;]*\});/);
    const cfg = pc ? Function('return ' + pc[1])() : {};
    ok('root', c + ': PART_CONFIG next/prev never a bare folder URL', ['next', 'prev'].every(k => !cfg[k] || /\/index\.html$/.test(cfg[k])), JSON.stringify(cfg));
  }
  ok('root', 'no location.replace/href to a bare folder in shipped code', !codeFiles.some(f => /location\.(replace|href)\s*[=(]\s*['"][^'"]*\/['"]/.test(rd(f))));

  /* ══════════ 2. Ids and maps against metadata/ ══════════ */
  for (const c of PARTS) {
    const meta = readMeta(c);
    const b = await boot(c, { meta: false });
    const t = 'ids' + c;
    eq(t, 'XAPI_UNIT_ID equals the unit metadata id', b.val('window.XAPI_UNIT_ID'), unitMeta.id);
    eq(t, 'learningUnitId equals the unit id', meta.learningUnitId, unitMeta.id);
    eq(t, 'XAPI_COMP_ID equals METADATA.id byte-for-byte', b.val('XAPI_COMP_ID'), meta.id);
    eq(t, 'XAPI_COMP_SLUG is its last segment', b.val('XAPI_COMP_SLUG'), meta.id.replace(/\/+$/, '').split('/').pop());
    eq(t, 'XAPI_COMP_SLUG equals the folder', b.val('XAPI_COMP_SLUG'), PART_DIR(c));
    const mf = b.val('XAPI_METADATA_FILE');
    eq(t, 'XAPI_METADATA_FILE is ../metadata/<slug>.json', mf, '../metadata/' + PART_DIR(c) + '.json');
    ok(t, '… and the file exists', fs.existsSync(path.resolve(BASE, PART_DIR(c), mf)));
    const map = b.val('JSON.stringify(SCREEN_TO_SUBCONTENT)') ;
    const m = JSON.parse(map);
    const domScreens = b.val('JSON.stringify([...document.querySelectorAll(".screen[data-screen]")].map(function(s){ return Number(s.dataset.screen); }).sort(function(a,b){return a-b;}))');
    eq(t, 'map keys = exactly this component\'s screens (DOM)', Object.keys(m).map(Number).sort((a, b) => a - b), JSON.parse(domScreens));
    const range = b.val('JSON.stringify([PART_CONFIG.start, PART_CONFIG.end])');
    eq(t, 'map keys = the PART_CONFIG range', Object.keys(m).map(Number).sort((a, b) => a - b), (() => { const [s, e] = JSON.parse(range); const a = []; for (let i = s; i <= e; i++) a.push(i); return a; })());
    const mapSuffixes = [...new Set(Object.values(m).filter(Boolean).map(v => v[0]))].sort();
    const metaSuffixes = meta.subContent.map(s => s.id.replace(/\/+$/, '').split('-').pop()).sort();
    eq(t, 'map items = catalogue items, both directions', mapSuffixes, metaSuffixes);
    ok(t, 'suffixes are 3-digit strings', Object.values(m).filter(Boolean).every(v => /^\d{3}$/.test(v[0])));
    meta.subContent.forEach(sc => {
      const suf = sc.id.replace(/\/+$/, '').split('-').pop();
      eq(t, 'item id rebuilt by xapiItemId ' + suf, b.val('xapiItemId("' + suf + '")'), sc.id);
      ok(t, suf + ': questions are absolute and start with the item id', (sc.questions || []).length > 0 && sc.questions.every(q => /^https?:\/\//.test(q.questionId) && q.questionId.startsWith(sc.id)));
    });
    const evalItems = Object.keys(JSON.parse(b.val('JSON.stringify(XAPI_EVAL_ITEMS)'))).sort();
    eq(t, 'XAPI_EVAL_ITEMS = the items with a graded question', evalItems, metaSuffixes);
    /* every question screen of the part maps to an item whose questionId xapiQ resolves (no warn) */
    b.exec('window.METADATA = ' + JSON.stringify(meta) + ';');
    const qScreens = JSON.parse(b.val('JSON.stringify(QUESTIONS.filter(function(q){ return inPart(q.screen); }).map(function(q){ return q.screen; }))'));
    qScreens.forEach(n => {
      const suf = m[n] && m[n][0];
      ok(t, 'question screen ' + n + ' is mapped', !!suf);
      const sc = meta.subContent.find(x => x.id.endsWith('-' + suf + '/'));
      eq(t, 'screen ' + n + ': xapiQ resolves the catalogue questionId', b.val('xapiQ("' + suf + '","q1").questionId'), sc && sc.questions[0].questionId);
    });
    ok(t, 'no [xAPI] warning while resolving', !b.warns.some(x => /\[xAPI\]/.test(x)), b.warns.join(' | '));
  }

  /* ══════════ 3. Static contract scans ══════════ */
  const qe = rd('unit-js/quiz-engine.js');
  const check = fnBody(qe, 'quizCheck');
  ok('flush', 'quizCheck calls onQuizCommitted', /onQuizCommitted\(screen\)/.test(check));
  ok('flush', 'the commit hook comes after the LAST commitment (done / lw / verdict)', check.lastIndexOf('onQuizCommitted') > Math.max(check.lastIndexOf('quizFinish(screen)'), check.lastIndexOf('st.lw ='), check.lastIndexOf('st.wasCorrect =')));
  ok('flush', 'no return between the commitment and the commit hook', !/st\.attempts \+= 1[\s\S]*\breturn\b[\s\S]*onQuizCommitted/.test(check));
  ok('flush', 'onQuizAnswered is called before any marking', check.indexOf('onQuizAnswered') < check.indexOf('quizMarkOutcome') && check.indexOf('onQuizAnswered') < check.indexOf('quizMarkRetry'));
  ok('flush', 'the retry lw is taken before quizMarkRetry clears the pick', check.indexOf('st.lw = quizSig') < check.indexOf('quizMarkRetry'));
  const plat = rd('unit-js/70-platform.js');
  ok('flush', 'onQuizCommitted flushes synchronously', /function onQuizCommitted\(screen\) \{ flushResumeSave\(\); \}/.test(plat));
  const exit = fnBody(plat, 'partExit');
  ok('flush', 'partExit: end → verdict → flush, in that order', exit.indexOf('xapiEndComponent') < exit.indexOf('setUnitResult') && exit.indexOf('setUnitResult') < exit.lastIndexOf('flushResumeSave'));
  ok('flush', 'partExit navigates only under DEV_NAV', /if \(DEV_NAV && window\.PART_CONFIG/.test(exit) && !/location\./.test(exit));
  const hint = fnBody(qe, 'quizOpenHint');
  ok('hint', 'the hint report sits after the done-guard, before the overlay opens', hint.indexOf('if (st.done) return;') >= 0 && hint.indexOf('if (st.done) return;') < hint.indexOf('onQuizHint') && hint.indexOf('onQuizHint') < hint.indexOf("classList.remove('hidden')"));
  const allCode = SHARED_ORDER.filter(s => s !== 'script.js').map(s => s.replace('../', ''));
  const lsWriters = allCode.filter(f => f !== 'unit-js/40-resume.js' && /localStorage\.setItem\([^)]*(pass|fail)/.test(rd(f)));
  eq('verdict', 'no pass/fail verdict written to localStorage outside 40-resume.js', lsWriters, []);
  ok('verdict', 'the verdict goes through setUnitResult', /setUnitResult\(partResultKey\(\)/.test(exit));
  const eng = rd('unit-js/engine.js');
  const go = fnBody(eng, 'goTo');
  ok('nav', 'goTo: repaint → item scope → save, after resetScreenState', go.indexOf('resetScreenState(n)') < go.indexOf('repaintScreen(n)') && go.indexOf('repaintScreen(n)') < go.indexOf('xapiOnScreen(n)') && go.indexOf('xapiOnScreen(n)') < go.indexOf('scheduleResumeSave()'));
  ok('nav', 'goTo: leaving the component goes through partExit', /partExit\(\+1\)/.test(go) && /partExit\(-1\)/.test(go));
  ok('nav', 'goTo: no empty catch around the platform calls', !/catch \(e\) \{\s*\}/.test(go));
  ok('nav', 'hops (location.replace) only in goToNextPart/goToPrevPart', (eng.match(/location\.replace\(/g) || []).length === 2);
  ok('report', 'report-modal.js has no leftover of another unit', !/percent-08/.test(rd('unit-js/report-modal.js')));
  ok('report', 'report-modal.js binds the flag by delegation', /document\.addEventListener\('click', function \(e\) \{\s*if \(e\.target && e\.target\.closest && e\.target\.closest\('\.flag-btn'\)\)/.test(rd('unit-js/report-modal.js')));
  eq('keys', 'UI_CHARACTER_KEY is namespaced to this unit', (rd('unit-js/40-resume.js').match(/var UI_CHARACTER_KEY = '([^']+)'/) || [])[1], 'methodica_ar_math_ratio_06_selectedCharacter');
  eq('keys', 'NAV_EDGE_KEY carries this unit', (rd('unit-js/40-resume.js').match(/var NAV_EDGE_KEY = '([^']+)'/) || [])[1], 'lomda_nav_edges::methodica-ar-math-ratio-06');
  ok('keys', 'RESULT_KEYS = the two verdict keys partExit writes', /var RESULT_KEYS\s+= \['ratio06_c01_result', 'ratio06_c02_result'\];/.test(rd('unit-js/40-resume.js')));
  ok('keys', 'no donor constants left (keys, slugs)', !allCode.map(rd).concat([fs.readFileSync(path.join(__dirname, 'xapi-720-k.js'), 'utf8')]).some(s => /lomda_nav_edges::methodica-math-ratio-01|ratio01_c|methodica_math_ratio_01|'methodica-math-ratio-01/.test(s)));

  /* ══════════ 4. Painters: never throw, show the answer, dispatch every question ══════════ */
  for (const c of PARTS) {
    for (const verdict of [true, false]) {
      const b = await boot(c, { lib: true });
      b.finishBoot();
      const t = 'paint' + c + (verdict ? 'ok' : 'bad');
      /* force every question in the part done, with a submitted answer, then walk every screen */
      b.exec('QUESTIONS.filter(function(q){ return inPart(q.screen); }).forEach(function(q){ var st = quizState[q.screen];' +
        'st.attempts = q.maxAttempts; st.done = true; st.wasCorrect = ' + verdict + ';' +
        'if (q.type === "value-input") st.selectedSet = ' + verdict + ' ? q.correctInputs.slice() : q.correctInputs.map(function(){ return "7"; });' +
        'else st.selected = ' + verdict + ' ? q.correct : q.options.find(function(o){ return o.id !== q.correct; }).id; });');
      const first = b.val('PART_CONFIG.start'), last = b.val('PART_CONFIG.end');
      for (let n = first; n <= last; n++) b.exec('goTo(' + n + ');');
      eq(t, 'no [resume] error across a full sweep of forced-answered screens', b.errors.filter(e => /\[resume\]|script error/.test(e)), []);
      const qs = JSON.parse(b.val('JSON.stringify(QUESTIONS.filter(function(q){ return inPart(q.screen); }).map(function(q){ return [q.screen, q.type]; }))'));
      for (const [n, type] of qs) {
        /* dispatch + "shows the answer" on a PRISTINE page: capture → new page → restore */
        const payload = b.val('JSON.stringify(capturePartPayload())');
        const r = await boot(c, { lib: true });
        r.finishBoot();
        r.exec('applyExecutionState(' + payload + ', ' + n + ');');
        ok(t, 'screen ' + n + ': restored with "שנמשיך?"', r.val('document.getElementById("q' + n + '-check").textContent') === 'שנמשיך?');
        ok(t, 'screen ' + n + ': feedback shown (' + (verdict ? 'correct' : 'wrong') + ')', r.val('document.getElementById("q' + n + '-feedbox").classList.contains("' + (verdict ? 'is-correct' : 'is-wrong') + '")'));
        if (type === 'single') {
          ok(t, 'screen ' + n + ': the right option carries .correct', r.val('!!document.querySelector("#q' + n + ' .scq-opt.correct")'));
          ok(t, 'screen ' + n + ': options locked', r.val('[...document.querySelectorAll("#q' + n + ' .scq-opt")].every(function(o){ return o.classList.contains("locked"); })'));
          if (!verdict) ok(t, 'screen ' + n + ': the learner\'s wrong pick carries .wrong', r.val('!!document.querySelector("#q' + n + ' .scq-opt.wrong")'));
        } else {
          ok(t, 'screen ' + n + ': inputs disabled and marked', r.val('quizSlots(' + n + ').every(function(i){ return i.disabled && (i.classList.contains("correct") || i.classList.contains("wrong")); })'));
          if (!verdict) ok(t, 'screen ' + n + ': answer toggle re-added', r.val('!!document.querySelector("#q' + n + '-feedbox .fb-answer-toggle")'));
        }
        ok(t, 'screen ' + n + ': the hint button is gone', r.val('!document.getElementById("q' + n + '-hint") || document.getElementById("q' + n + '-hint").style.display === "none"'));
        eq(t, 'screen ' + n + ': no error on restore', r.errors, []);
        /* idempotent: painting twice changes nothing */
        const once = r.val('document.getElementById("q' + n + '").innerHTML');
        r.exec('restoreScreenUI(' + n + '); restoreScreenUI(' + n + ');');
        ok(t, 'screen ' + n + ': the painter is idempotent', r.val('document.getElementById("q' + n + '").innerHTML') === once);
      }
    }
  }

  /* pending answers: a pick / typed value not yet checked survives back-forward and a reload */
  for (const [n, a] of [[4, 'b'], [5, ['12']]]) {
    const b = await boot('02', { lib: true });
    b.finishBoot();
    b.exec('goTo(' + n + ');' + enterJs(n, a) + 'goTo(3); goTo(' + n + ');');
    const shown = () => Array.isArray(a) ? b.val('quizSlots(' + n + ')[0].value') : b.val('document.querySelector("#q' + n + ' .scq-opt.selected") && document.querySelector("#q' + n + ' .scq-opt.selected").dataset.id');
    eq('pending', 'screen ' + n + ': pending answer shown after back-forward', shown(), Array.isArray(a) ? a[0] : a);
    ok('pending', 'screen ' + n + ': check live after back-forward', b.val('document.getElementById("q' + n + '-check").disabled') === false);
    const payload = b.val('JSON.stringify(capturePartPayload())');
    const r = await boot('02', { lib: true });
    r.finishBoot();
    r.exec('applyExecutionState(' + payload + ');');
    const shownR = Array.isArray(a) ? r.val('quizSlots(' + n + ')[0].value') : r.val('document.querySelector("#q' + n + ' .scq-opt.selected") && document.querySelector("#q' + n + ' .scq-opt.selected").dataset.id');
    eq('pending', 'screen ' + n + ': pending answer shown after reload', shownR, Array.isArray(a) ? a[0] : a);
    ok('pending', 'screen ' + n + ': check live after reload', r.val('document.getElementById("q' + n + '-check").disabled') === false);
  }

  /* the value-input answer toggle: which of the two answers is on screen survives a reload (§8.10) */
  {
    const b = await boot('02', { lib: true });
    b.finishBoot();
    b.exec('goTo(5);' + enterJs(5, WR1[5]) + clickCheck(5) + enterJs(5, ['2']) + clickCheck(5));
    b.exec('document.querySelector("#q5-feedbox .fb-answer-toggle").click();');
    eq('toggle', 'live: the learner own answer is shown', [b.val('quizSlots(5)[0].value'), b.val('quizState[5].tgl')], ['2', 'mine']);
    const payload = b.val('JSON.stringify(capturePartPayload())');
    const r = await boot('02', { lib: true });
    r.finishBoot();
    r.exec('applyExecutionState(' + payload + ', 5);');
    eq('toggle', 'restored: still the learner own answer, toggle labelled for the other', [r.val('quizSlots(5)[0].value'), r.val('document.querySelector("#q5-feedbox .fb-answer-toggle").textContent')], ['2', 'התשובה הנכונה']);
  }

  /* the gate agrees in all four places: metadata (source of truth), screen 3, PASS_MARK, the result */
  {
    const info = readMeta('02').subContent[0].informationToBot;
    const m = /(\d+) מתוך 10/.exec(info);
    ok('gate', 'metadata states the gate', !!m, info.slice(0, 60));
    const gateN = m ? Number(m[1]) : -1;
    ok('gate', 'screen 3 promises the same number', rd(PART_DIR('02') + '/index.html').includes('צריך לענות נכון על ' + gateN + ' שאלות לפחות'));
    const b = await boot('02', { meta: false });
    eq('gate', 'PASS_MARK equals it', b.val('PASS_MARK'), gateN);
  }

  /* ══════════ 5. The payload shape (v6 document) ══════════ */
  {
    const b = await boot('02', { lib: true });
    b.finishBoot();
    b.exec('goTo(4);' + enterJs(4, KEY[4]) + clickCheck(4));
    const doc = b.state();
    eq('shape', 'document keys (v6)', Object.keys(doc).sort(), ['component', 'done', 'doneItems', 'hints', 'payload', 'picks', 'results', 'ui', 'v']);
    eq('shape', 'v = 6, component = this part', [doc.v, doc.component], [6, 'methodica-ar-math-ratio-06-02']);
    eq('shape', 'payload keys', Object.keys(doc.payload).sort(), ['currentScreen', 'q', 'qResults']);
    eq('shape', 'payload holds only this part\'s questions', Object.keys(doc.payload.q).map(Number).sort((x, y) => x - y), [4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    eq('shape', 'the answer was saved synchronously at the commit', doc.payload.q[4].done, true);
    /* another part's document is discarded */
    b.exec('_unitState = null; window.__setState(Object.assign({}, ' + JSON.stringify(doc) + ', { component: "methodica-ar-math-ratio-06-01" }));');
    const d2 = b.val('JSON.stringify(readUnitState())');
    ok('shape', 'a document naming another component is discarded', JSON.parse(d2).payload === null && b.warns.some(w => /belongs to "methodica-ar-math-ratio-06-01"/.test(w)));
  }

  /* ══════════ 6. Issue reporting ══════════ */
  for (const c of PARTS) {
    const b = await boot(c, { lib: true });
    b.finishBoot();
    const t = 'report' + c;
    ok(t, 'report dialogs exist, start hidden, sit inside #app and outside every .screen',
      b.val('["report-modal","report-confirm-modal"].every(function(id){ var e = document.getElementById(id); return e && e.hasAttribute("hidden") && e.closest("#app") && !e.closest(".screen"); })'));
    const screens = b.val('document.querySelectorAll(".screen").length');
    eq(t, 'every screen carries a flag (+ the static one)', b.val('document.querySelectorAll(".screen .flag-btn").length'), screens);
    const flags = b.val('document.querySelectorAll(".flag-btn").length');
    let opened = 0;
    for (let i = 0; i < flags; i++) {
      b.exec('forceCloseReportModal(); document.querySelectorAll(".flag-btn")[' + i + '].querySelector(".flag-btn-label").click();');
      if (b.val('!document.getElementById("report-modal").hasAttribute("hidden")')) opened++;
    }
    eq(t, 'all ' + flags + ' flag instances open the dialog (clicking the inner label — delegation)', opened, flags);
    const meta = readMeta(c);
    const map = JSON.parse(b.val('JSON.stringify(SCREEN_TO_SUBCONTENT)'));
    for (const n of Object.keys(map).map(Number)) {
      b.w.__fetches.length = 0;
      b.exec('goTo(' + n + '); openReportModal(); var s = document.getElementById("report-type"); s.value = "technical"; document.getElementById("report-text").value = "בדיקת QA — לא לטפל"; submitReport();');
      const f = b.w.__fetches[0];
      ok(t, 'screen ' + n + ': exactly one POST to the shared Google Form', b.w.__fetches.length === 1 && /^https:\/\/docs\.google\.com\/forms\/d\/e\/[\w-]+\/formResponse$/.test(f.url) && f.init.mode === 'no-cors' && f.init.body instanceof b.w.URLSearchParams);
      if (!f) continue;
      const body = f.init.body;
      eq(t, 'screen ' + n + ': unit slug', body.get('entry.1933069481'), 'methodica-ar-math-ratio-06');
      eq(t, 'screen ' + n + ': component slug', body.get('entry.2070680092'), PART_DIR(c));
      eq(t, 'screen ' + n + ': item', body.get('entry.1555704258'), map[n] ? PART_DIR(c) + '-' + map[n][0] : '');
      eq(t, 'screen ' + n + ': page', body.get('entry.1671046914'), map[n] ? String(map[n][1]) : String(n));
      eq(t, 'screen ' + n + ': the Hebrew label, not the key', body.get('entry.1179822443'), 'תקלה טכנית או שמשהו לא עובד');
      eq(t, 'screen ' + n + ': free text verbatim', body.get('entry.806447525'), 'בדיקת QA — לא לטפל');
      ok(t, 'screen ' + n + ': year', /^\d{4}$/.test(body.get('entry.301404029_year')));
      b.exec('forceCloseReportModal();');
    }
    /* a rejected fetch still shows the thank-you */
    b.w.fetch = () => Promise.reject(new Error('offline'));
    b.exec('openReportModal(); document.getElementById("report-type").value = "other"; document.getElementById("report-text").value = "x"; submitReport();');
    ok(t, 'a failed send still thanks the learner', b.val('!document.getElementById("report-thanks").hasAttribute("hidden")'));
    eq(t, 'no console.error', b.errors, []);
  }

  /* ══════════ 7. Boot cover ══════════ */
  {
    const b = await boot('01', { meta: false });
    ok('cover', 'dropBootCover removes the cover and clears the in-flight flag', b.val('(function(){ window.__resumeInFlight = true; dropBootCover(); return !document.getElementById("boot-cover") && window.__resumeInFlight === false; })()'));
  }

  return R.done();
}

main().catch(e => { console.error(e); process.exitCode = 1; });
