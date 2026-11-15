#!/usr/bin/env node
/* ═══════════════════ layout.js — the canvas stays centred and reachable ═══════════════════
   NOT DEPLOYED. MOE monday 05.10.26: "מופיעים שני רכיבים בתוך היחידה ולא ניתן לגשת אליהם מכיוון
   שהתמונה לא ממורכזת במסך". When the window was smaller than the 1280x710 canvas, #stage's auto grid
   tracks grew to the canvas size, the canvas started at the window's edge instead of its centre,
   and scale() could not pull it back: at 1024x640 the first screen's button sat at x -109..3.

   In a real browser (layout cannot be measured in jsdom), for both components at several window
   sizes: #app is centred (±1px), lies wholly inside the window, and the first screen's bottom-bar
   buttons are wholly inside the window.

   Needs puppeteer-core OUTSIDE OneDrive, a local Chrome, and a static server on the repo root:
     python -m http.server 8796 --bind 127.0.0.1
     NODE_PATH=<tools>/node_modules node _test/layout.js [BASE=http://127.0.0.1:8796/] */
'use strict';
const puppeteer = require('puppeteer-core');
const BASE = process.argv[2] || 'http://127.0.0.1:8796/';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SIZES = [[1024, 640], [1366, 640], [1280, 600], [800, 600], [1280, 720], [1366, 768], [1920, 1080], [768, 1024]];

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--mute-audio'] });
  let passes = 0, failures = 0;
  const ok = (what, cond, detail) => { if (cond) passes++; else { failures++; console.log('  FAIL ' + what + (detail ? '  —  ' + detail : '')); } };
  for (const c of ['01', '02']) {
    const page = await browser.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(BASE + 'methodica-ar-math-ratio-06-' + c + '/index.html', { waitUntil: 'networkidle0' });
    for (const [w, h] of SIZES) {
      await page.setViewport({ width: w, height: h });
      await new Promise(r => setTimeout(r, 250));
      const m = await page.evaluate(() => {
        const r = document.getElementById('app').getBoundingClientRect();
        const btns = [...document.querySelectorAll('.screen.active button')]
          .filter(b => b.offsetParent && /\S/.test(b.innerText))
          .map(b => { const q = b.getBoundingClientRect(); return { t: b.innerText.trim(), l: q.left, t2: q.top, r: q.right, b: q.bottom }; });
        return { vw: innerWidth, vh: innerHeight, l: r.left, t: r.top, r: r.right, b: r.bottom, btns };
      });
      const tag = c + ' @' + w + 'x' + h;
      const cx = (m.l + m.r) / 2, cy = (m.t + m.b) / 2;
      ok(tag + ': the canvas is centred', Math.abs(cx - m.vw / 2) <= 1 && Math.abs(cy - m.vh / 2) <= 1,
        'centre ' + cx.toFixed(1) + ',' + cy.toFixed(1) + ' vs ' + m.vw / 2 + ',' + m.vh / 2);
      ok(tag + ': the canvas lies inside the window', m.l >= -1 && m.t >= -1 && m.r <= m.vw + 1 && m.b <= m.vh + 1,
        [m.l, m.t, m.r, m.b].map(Math.round).join(','));
      ok(tag + ': the first screen has a button', m.btns.length > 0);
      m.btns.forEach(b => ok(tag + ': "' + b.t + '" is reachable', b.l >= 0 && b.t2 >= 0 && b.r <= m.vw && b.b <= m.vh,
        [b.l, b.t2, b.r, b.b].map(Math.round).join(',')));
    }
    ok(c + ': no page error', !errs.length, errs.slice(0, 2).join(' | '));
    await page.close();
  }
  await browser.close();
  console.log('\nlayout: ' + passes + ' passed, ' + failures + ' failed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
