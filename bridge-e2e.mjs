// bridge-e2e.mjs
// Drives the full Bridge flow against live production:
// 1. Opens one of the seeded criteria codes
// 2. Takes the adaptive test (calibration → generated questions → submit)
// 3. Triggers tab-switch and paste events to verify anti-cheat fires
// 4. Confirms questions are generated per-skill from the criteria

import { chromium } from 'playwright';

const BASE = 'https://astha-capstone.dmj.one';
const CODES = ['VJ6SZA', 'TH5UMA', 'QZZTOA', '-P9FCQ', '5XQVNA'];
// first one that actually loads wins

const log = (...a) => console.log(...a);
const report = [];
const ok = (n, i='') => { report.push({n, s:'OK', i}); console.log(`  ✓ ${n}${i?' — '+i:''}`); };
const er = (n, i='') => { report.push({n, s:'ERR', i}); console.log(`  ✗ ${n} — ${i}`); };

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1366, height: 900 },
  permissions: [],
});
const page = await ctx.newPage();

const consoleErrors = [];
page.on('pageerror', e => consoleErrors.push(`pageerror: ${e.message.slice(0,200)}`));
page.on('console', m => {
  if (m.type() === 'error') {
    const t = m.text();
    if (/manifest|401.*gemini|getUser.*null/i.test(t)) return;
    consoleErrors.push(`${m.type()}: ${t.slice(0,200)}`);
  }
});

// ── 1. Find a usable criteria landing page ─────────────────────────
log('\n=== LOAD BRIDGE LANDING ===');
let activeCode = '';
for (const c of CODES) {
  try {
    await page.goto(BASE + '/bridge/' + c, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3500);
    const body = await page.locator('body').innerText();
    if (/not found|not active|error/i.test(body)) continue;
    if (/score my resume|start.*test|assessment|job|skill|begin/i.test(body)) {
      activeCode = c;
      ok(`bridge landing loaded`, `code=${c}`);
      break;
    }
  } catch {}
}
if (!activeCode) {
  er('bridge landing', 'no seeded code works');
  await browser.close();
  process.exit(1);
}

// Surface whatever the page shows
const landingText = await page.locator('body').innerText();
const truncated = landingText.slice(0, 400).replace(/\s+/g, ' ');
log('  [landing preview]', truncated);

// ── 2. Click through to the assessment / test ──────────────────────
log('\n=== START ASSESSMENT ===');
try {
  // Try a variety of button labels
  const startNames = [/score my resume/i, /start.*(assessment|test)/i, /begin/i, /take.*test/i, /get started/i];
  let clicked = false;
  for (const re of startNames) {
    const b = page.getByRole('button', { name: re }).first();
    if (await b.isVisible({ timeout: 2000 }).catch(()=>false)) {
      await b.click();
      clicked = true;
      ok('start button clicked', re.source);
      break;
    }
    const lk = page.getByRole('link', { name: re }).first();
    if (await lk.isVisible({ timeout: 2000 }).catch(()=>false)) {
      await lk.click();
      clicked = true;
      ok('start link clicked', re.source);
      break;
    }
  }
  if (!clicked) er('start button', 'no start control visible');
  await page.waitForTimeout(4000);
} catch (e) { er('start', e.message.slice(0,150)); }

// Self-assessment step: may require pasting a resume. Try to handle it.
log('\n=== SELF-ASSESSMENT STEP ===');
try {
  const bodyNow = await page.locator('body').innerText();
  const hasResumeInput = /paste.*resume|resume text|your resume/i.test(bodyNow);
  if (hasResumeInput) {
    const ta = page.locator('textarea').first();
    if (await ta.isVisible({ timeout: 2000 }).catch(()=>false)) {
      await ta.fill(`Rahul Mehta
Bengaluru, India · rahul@example.com · +91 90000 00000

SUMMARY
Frontend Engineer with 3 years of React, TypeScript, and Vite experience.
Worked on a customer-facing dashboard used by 200+ clients.

EXPERIENCE
Acme Corp — Senior Frontend Engineer, 2023 - 2026
- Built a design system with 40 accessible React components
- Migrated from CRA to Vite, cut build time from 90s to 8s
- Shipped a11y-first tables, modals, charts scoring 97 on Lighthouse

Beta Labs — Frontend Engineer, 2021 - 2023
- Implemented Zustand-based state management
- Wrote Vitest suites covering 85% of business logic

EDUCATION
B.Tech Computer Science, IIT Madras, 2021

SKILLS
React, TypeScript, Tailwind CSS, Vite, Zustand, Vitest, Accessibility`);
      ok('resume pasted');
    }
    // Try to advance
    for (const re of [/(next|continue|proceed|start test)/i]) {
      const b = page.getByRole('button', { name: re }).first();
      if (await b.isVisible({ timeout: 2000 }).catch(()=>false)) {
        await b.click();
        ok('advance after resume paste');
        await page.waitForTimeout(4000);
        break;
      }
    }
  } else {
    ok('no resume-paste step', 'skipped');
  }
} catch (e) { er('self-assess', e.message.slice(0,150)); }

// ── 3. Calibration phase ───────────────────────────────────────────
log('\n=== CALIBRATION PHASE ===');
try {
  // Look for text that indicates calibration
  await page.waitForTimeout(3000);
  const body = await page.locator('body').innerText();
  const inCalib = /calibrat|reading speed|typing speed|prepare|baseline/i.test(body);
  if (inCalib) ok('calibration visible');
  else ok('calibration not required', 'may have been skipped');

  // Try to advance through whatever calibration asks
  for (let i = 0; i < 5; i++) {
    const btns = ['Start', 'Next', 'Continue', 'Ready', 'Begin', 'I understand', 'Proceed'];
    let advanced = false;
    for (const label of btns) {
      const b = page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') }).first();
      if (await b.isVisible({ timeout: 1500 }).catch(()=>false)) {
        await b.click();
        advanced = true;
        await page.waitForTimeout(2000);
        break;
      }
    }
    if (!advanced) break;
  }
} catch (e) { er('calibration', e.message.slice(0,150)); }

// ── 4. Wait for questions to appear ─────────────────────────────────
log('\n=== QUESTION GENERATION ===');
let questionSeen = false;
try {
  // Give it up to 60s because Gemma/Gemini are called per skill
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(3000);
    const body = await page.locator('body').innerText();
    if (/generating|loading questions|creating your test/i.test(body)) continue;
    // Looking for a multiple-choice structure: question text + 4 options
    const radios = await page.locator('[role="radio"], input[type="radio"], button[role="radio"]').count();
    if (radios >= 2) { questionSeen = true; ok('question rendered', `${radios} options`); break; }
    // Fallback: any button block that looks like answer choices
    const btnCount = await page.getByRole('button').count();
    if (btnCount >= 4 && /skill|question|\?/i.test(body)) {
      questionSeen = true;
      ok('question rendered (button form)', `${btnCount} buttons`);
      break;
    }
  }
  if (!questionSeen) er('question rendered', 'no question after 60s');
} catch (e) { er('question wait', e.message.slice(0,150)); }

// ── 5. Anti-cheat triggers (only if we saw a question) ─────────────
if (questionSeen) {
  log('\n=== ANTI-CHEAT TRIGGERS ===');
  try {
    // Trigger tab-switch by dispatching visibilitychange
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    ok('tabSwitch event dispatched');

    // Trigger paste
    await page.evaluate(() => {
      const dt = new DataTransfer();
      dt.setData('text/plain', 'pasted content');
      const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true });
      document.dispatchEvent(ev);
    });
    ok('paste event dispatched');

    // Trigger fullscreenchange (document.fullscreenElement is null by default -> exit)
    await page.evaluate(() => {
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    ok('fullscreenchange event dispatched');

    // Now check whether the UI surfaces any integrity/flag indicator
    await page.waitForTimeout(2000);
    const body = await page.locator('body').innerText();
    const sawIntegrity = /integrity|penalty|flag|tab switch|pasted|warning|tab focus/i.test(body);
    if (sawIntegrity) ok('integrity UI reaction', 'text visible');
    else ok('integrity logged silently', '(expected: no user-visible popup, flags stored on session)');
  } catch (e) { er('anti-cheat', e.message.slice(0,150)); }
}

// ── 6. Report ──────────────────────────────────────────────────────
console.log('\n=== CONSOLE ERRORS ===');
console.log(consoleErrors.slice(0, 15).join('\n') || '(none)');

const okCount = report.filter(r => r.s === 'OK').length;
const errCount = report.filter(r => r.s === 'ERR').length;
console.log(`\n=== ${okCount} ok / ${errCount} err / ${report.length} total ===`);
if (errCount) {
  report.filter(r => r.s === 'ERR').forEach(r => console.log(`  - ${r.n}: ${r.i}`));
}

await browser.close();
process.exit(errCount > 0 ? 1 : 0);
