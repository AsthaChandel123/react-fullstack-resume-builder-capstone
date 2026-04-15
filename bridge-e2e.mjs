// Re-run of the end-to-end bridge test after the CSP + IDB fixes.
import { chromium } from 'playwright';

const BASE = 'https://astha-capstone.dmj.one';
const CODES = ['VJ6SZA', 'TH5UMA', 'QZZTOA', '5XQVNA', 'FM0JWG'];

const report = [];
const ok = (n, i='') => { report.push({n, s:'OK', i}); console.log(`  ✓ ${n}${i?' — '+i:''}`); };
const er = (n, i='') => { report.push({n, s:'ERR', i}); console.log(`  ✗ ${n} — ${i}`); };

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
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

// 1. Load seeded JD
console.log('\n=== LOAD BRIDGE /bridge/:code ===');
let active = '';
for (const c of CODES) {
  try {
    await page.goto(BASE + '/bridge/' + c, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3500);
    const body = await page.locator('body').innerText();
    if (/Frontend|Backend|Data Scientist|DevOps|Mobile/i.test(body) && /score my resume/i.test(body)) {
      active = c;
      ok('bridge landing', `code=${c}`);
      break;
    }
  } catch {}
}
if (!active) {
  er('bridge landing', 'no seeded code worked');
  await browser.close();
  process.exit(1);
}

// Confirm JD title displayed
const jdText = await page.locator('body').innerText();
const titleMatch = jdText.match(/(Frontend Engineer — React|Backend Engineer — Node\.js|Data Scientist — NLP|DevOps \/ SRE|Mobile Engineer — Flutter)/);
if (titleMatch) ok('JD title visible', titleMatch[0]);
else er('JD title visible', 'not found');

// 2. Click "Score My Resume"
console.log('\n=== START ASSESSMENT ===');
try {
  await page.getByRole('button', { name: /score my resume/i }).first().click();
  ok('clicked Score My Resume');
  await page.waitForTimeout(4000);
} catch (e) { er('click start', e.message.slice(0,150)); }

// 3. Self-assessment: paste resume if asked, advance
try {
  const body = await page.locator('body').innerText();
  if (/paste.*resume|resume text|your resume/i.test(body)) {
    const ta = page.locator('textarea').first();
    if (await ta.isVisible({ timeout: 2000 }).catch(()=>false)) {
      await ta.fill(`Rahul Mehta\nBengaluru · rahul@example.com\n\nSUMMARY\nFrontend Engineer with 3 years of React, TypeScript, Vite.\n\nEXPERIENCE\nAcme Corp — Senior Frontend Engineer 2023-2026\n- Built a design system in React + TypeScript\n- Migrated CRA to Vite, cut build time 90s -> 8s\n\nEDUCATION\nB.Tech Computer Science, IIT Madras, 2021\n\nSKILLS\nReact, TypeScript, Tailwind CSS, Vite, Zustand, Vitest, Accessibility`);
      ok('resume pasted');
    }
    for (const re of [/(next|continue|proceed|start test)/i]) {
      const b = page.getByRole('button', { name: re }).first();
      if (await b.isVisible({ timeout: 2000 }).catch(()=>false)) {
        await b.click();
        await page.waitForTimeout(4000);
        break;
      }
    }
  }
} catch (e) { er('self-assess', e.message.slice(0,150)); }

// 4. Calibration
try {
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
  ok('advanced through intermediate steps');
} catch (e) { er('calibration', e.message.slice(0,150)); }

// 5. Wait for questions to render
console.log('\n=== QUESTIONS GENERATED ===');
let questionSeen = false;
for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(3000);
  const body = await page.locator('body').innerText();
  if (/generating|loading questions|creating your test/i.test(body)) continue;
  const radios = await page.locator('[role="radio"], input[type="radio"]').count();
  if (radios >= 2) { questionSeen = true; ok('question rendered', `${radios} radios`); break; }
  const btnCount = await page.getByRole('button').count();
  if (btnCount >= 4 && /skill|question|\?/i.test(body)) {
    questionSeen = true;
    ok('question rendered (button form)', `${btnCount} buttons`);
    break;
  }
}
if (!questionSeen) er('question rendered', 'no question after 60s');

// 6. Anti-cheat triggers
if (questionSeen) {
  console.log('\n=== ANTI-CHEAT TRIGGERS ===');
  try {
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    ok('tabSwitch event fired');

    await page.evaluate(() => {
      const dt = new DataTransfer();
      dt.setData('text/plain', 'pasted');
      document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
    });
    ok('paste event fired');

    await page.evaluate(() => {
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    ok('fullscreenchange fired');

    await page.waitForTimeout(2000);
  } catch (e) { er('anti-cheat', e.message.slice(0,150)); }
}

console.log('\n=== CONSOLE ERRORS ===');
console.log(consoleErrors.slice(0, 15).join('\n') || '(none)');

const okCount = report.filter(r => r.s === 'OK').length;
const errCount = report.filter(r => r.s === 'ERR').length;
console.log(`\n=== ${okCount} ok / ${errCount} err / ${report.length} total ===`);

await browser.close();
process.exit(errCount > 0 ? 1 : 0);
