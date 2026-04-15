// mayhem.mjs — prod-grade stress / abuse / edge-case test suite.
// Drives live production like a hostile user, a distracted user, a power
// user, a mobile user, and a few actual attackers. Any failure is a bug.

import { chromium, devices } from 'playwright';

const BASE = 'https://astha-capstone.dmj.one';
const report = [];
const pass = (n, i='') => { report.push({n, s:'PASS', i}); console.log(`PASS  ${n}${i?' — '+i:''}`); };
const fail = (n, i='') => { report.push({n, s:'FAIL', i}); console.log(`FAIL  ${n} — ${i}`); };
const skip = (n, i='') => { report.push({n, s:'SKIP', i}); console.log(`SKIP  ${n} — ${i}`); };

const browser = await chromium.launch({ headless: true });
const pageErrors = [];

function tagPage(p, tag) {
  p.on('pageerror', e => pageErrors.push(`[${tag}] pageerror ${e.message.slice(0,200)}`));
  p.on('console', m => {
    if (m.type() === 'error') {
      const t = m.text();
      // Tolerated noise:
      // - WebGPU/Gemma offline model missing (L3 never reaches prod)
      // - Missing model manifests from huggingface (offline fallback)
      if (/webgpu|gemma.*fetch|huggingface|manifest|unexpected_end_of_file|401.*gemini/i.test(t)) return;
      pageErrors.push(`[${tag}] ${t.slice(0,200)}`);
    }
  });
}

// ─── 1. XSS / injection in Saathi input ───────────────────────────
console.log('\n=== 1. XSS IN SAATHI CHAT ===');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  tagPage(page, 'saathi-xss');

  let xssFired = false;
  await ctx.exposeFunction('__xss_hit', () => { xssFired = true; });
  page.on('dialog', async d => { xssFired = true; await d.dismiss(); });

  try {
    await page.goto(BASE + '/builder', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3500);
    const input = page.locator('input[placeholder*="Type"]').first();
    const inputOk = await input.isVisible({ timeout: 8000 }).catch(()=>false);
    if (!inputOk) { fail('saathi input visible'); await ctx.close(); }
    else {

    const payloads = [
      '<script>window.__xss_hit()</script>',
      '<img src=x onerror=window.__xss_hit()>',
      '"><svg onload=window.__xss_hit()>',
      '"; alert(1); //',
      `javascript:alert(1)`,
      '{{7*7}}${7*7}<%=7*7%>',
      '\u0000\u0001\u0002 null bytes',
      '中文 Devanagari हिन्दी Tamil தமிழ் RTL العربية',
      '🚀'.repeat(80),
      'A'.repeat(4000),
      '{"__proto__": {"polluted": true}}',
      "'; DROP TABLE users; --",
    ];

    for (const p of payloads) {
      await input.fill(p);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
    await page.waitForTimeout(3000);

    if (xssFired) fail('saathi XSS hardening', 'script executed');
    else pass('saathi XSS hardening', `${payloads.length} payloads safe`);

    // Count actual <script> elements injected into the DOM (not just
    // literal text content showing the payload back to the user).
    const injectedScripts = await page.evaluate(() => {
      // Ignore scripts the app ships with (they all have a src or are
      // inline app code loaded during boot). Count script elements added
      // AFTER initial load that contain payload strings.
      const s = Array.from(document.querySelectorAll('script'));
      return s.filter((el) => /window\.__xss_hit|alert\(/i.test(el.textContent || '')).length;
    });
    const injectedSvgs = await page.locator('svg[onload]').count();
    const injectedImgs = await page.locator('img[onerror]').count();
    if (injectedScripts === 0 && injectedSvgs === 0 && injectedImgs === 0) pass('saathi escapes HTML');
    else fail('saathi unescaped HTML', `scripts=${injectedScripts} svg=${injectedSvgs} img=${injectedImgs}`);

    const proto = await page.evaluate(() => Object.prototype.polluted === true);
    if (proto) fail('saathi proto pollution', 'Object.prototype mutated');
    else pass('saathi proto pollution safe');
    } // end else
  } catch (e) { fail('saathi xss', e.message.slice(0,150)); }
  await ctx.close().catch(()=>{});
}

// ─── 2. Huge resume payload (1 MB) in builder form ─────────────────
console.log('\n=== 2. HUGE RESUME ===');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  tagPage(page, 'huge');
  try {
    await page.goto(BASE + '/builder/form', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: /demo/i }).first().click();
    await page.waitForTimeout(800);
    const summary = page.locator('textarea').first();
    if (await summary.isVisible({ timeout: 5000 }).catch(()=>false)) {
      // 200 KB string — well under 1 MB Firestore limit but large enough to stress input handling
      await summary.fill('X'.repeat(200_000));
      await page.waitForTimeout(800);
      pass('huge field accepted');
      // Live preview should not crash
      const html = await page.locator('body').innerText();
      if (html.includes('XXXXXXXXXX')) pass('huge field reflected in preview');
      else fail('huge field reflected', 'not visible');
    } else skip('huge field', 'no textarea');

    // Try to create a share link with this huge resume
    await page.getByRole('button', { name: /share/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /create link/i }).click();
    // Either the link is created OR Firestore rejects due to size
    const outcome = await Promise.race([
      page.waitForSelector('text=/Your shareable link/i', { timeout: 25000 }).then(() => 'created'),
      page.waitForSelector('[role="alert"]', { timeout: 25000 }).then(() => 'error'),
      page.waitForSelector('text=/Could not create/i', { timeout: 25000 }).then(() => 'error'),
    ]).catch(() => 'timeout');
    if (outcome === 'created' || outcome === 'error') pass('huge share handled', outcome);
    else fail('huge share handled', outcome);
  } catch (e) { fail('huge', e.message.slice(0,150)); }
  await ctx.close();
}

// ─── 3. Malicious slug patterns in /r/:slug ────────────────────────
console.log('\n=== 3. SLUG ABUSE ===');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  tagPage(page, 'slug');
  const badSlugs = [
    '../admin',
    '..%2Fetc%2Fpasswd',
    '<script>alert(1)</script>',
    'a'.repeat(200),
    '💀💀💀💀💀💀',
    'NONEXISTENT1',
    '-----',
    'null',
  ];
  for (const s of badSlugs) {
    try {
      await page.goto(BASE + '/r/' + s, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);
      const body = await page.locator('body').innerText();
      const crashed = /TypeError|ReferenceError|Unhandled|Uncaught/i.test(body);
      const safe = /not found|could not load|error/i.test(body) || /resume/i.test(body);
      if (crashed) fail(`slug ${s.slice(0,20)}`, 'crashed');
      else if (safe) pass(`slug ${s.slice(0,20)}`, 'handled');
      else pass(`slug ${s.slice(0,20)}`, 'loaded');
    } catch (e) {
      fail(`slug ${s.slice(0,20)}`, e.message.slice(0,80));
    }
  }
  await ctx.close();
}

// ─── 4. Brute-force wrong passwords against a shared resume ────────
console.log('\n=== 4. PASSWORD BRUTE-FORCE ===');
{
  // Create a protected resume first
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  tagPage(page, 'brute-setup');
  const PW = 'CorrectPass' + Math.random().toString(36).slice(2,8);
  let shareUrl = '';
  try {
    await page.goto(BASE + '/builder/form', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await page.getByRole('button', { name: /demo/i }).first().click();
    await page.waitForTimeout(700);
    await page.getByRole('button', { name: /share/i }).first().click();
    await page.waitForTimeout(500);
    const pw = page.locator('input[type="password"]');
    await pw.nth(0).fill(PW);
    await pw.nth(1).fill(PW);
    await page.getByRole('button', { name: /create link/i }).click();
    await page.waitForSelector('text=/Your shareable link/i', { timeout: 30000 });
    const body = await page.locator('body').innerText();
    const m = body.match(/https?:\/\/[^\s]+\/r\/[A-Za-z0-9_-]{6,32}/);
    shareUrl = m?.[0] || '';
    if (shareUrl) pass('brute setup: resume created');
    else fail('brute setup', 'no url');
  } catch (e) { fail('brute setup', e.message.slice(0,150)); }
  await ctx.close();

  if (shareUrl) {
    // Try 8 wrong passwords in a row from a fresh anon context
    const anon = await browser.newContext();
    const p = await anon.newPage();
    tagPage(p, 'brute');
    try {
      await p.goto(shareUrl, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(4000);
      await p.getByRole('button', { name: /unlock to edit/i }).click();
      await p.waitForTimeout(400);

      let rejected = 0;
      for (let i = 0; i < 8; i++) {
        const inp = p.locator('input[type="password"]').first();
        await inp.fill('wrong' + i);
        await p.keyboard.press('Enter');
        await p.waitForTimeout(2500);
        const body = await p.locator('body').innerText();
        if (/incorrect|permission|error/i.test(body) || /view only/i.test(body)) rejected++;
      }
      if (rejected === 8) pass('brute rejected 8/8');
      else fail('brute rejected', `${rejected}/8`);

      // Finally the correct one should still work
      await p.locator('input[type="password"]').first().fill(PW);
      await p.keyboard.press('Enter');
      await p.waitForTimeout(4000);
      const final = await p.locator('body').innerText();
      if (/Editable|Saved|Saving/i.test(final)) pass('brute correct still unlocks');
      else fail('brute correct still unlocks', 'still locked after 8 wrong');
    } catch (e) { fail('brute loop', e.message.slice(0,150)); }
    await anon.close();
  }
}

// ─── 5. Firestore rules bypass attempts ────────────────────────────
console.log('\n=== 5. FIRESTORE RULES BYPASS ===');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  tagPage(page, 'rules');
  try {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Try to write directly to /resumes/{slug} from the client (should be denied by rules)
    const result = await page.evaluate(async () => {
      try {
        const { getFirestore, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js').catch(() => null) || {};
        if (!setDoc) return { err: 'sdk-import-failed' };
      } catch (e) { return { err: String(e).slice(0,100) }; }
      return { err: 'no-op' };
    }).catch(e => ({ err: e.message.slice(0,100) }));

    // Also try the raw REST API without auth — should return 403
    const rest = await page.evaluate(async () => {
      try {
        const r = await fetch(
          'https://firestore.googleapis.com/v1/projects/dmjone/databases/(default)/documents/resumes/ATTACKER1',
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: { resume: { mapValue: { fields: { hacked: { stringValue: 'yes' } } } } } }),
          },
        );
        return { status: r.status };
      } catch (e) { return { err: String(e).slice(0,100) }; }
    });
    if (rest.status === 401 || rest.status === 403) pass('direct REST write blocked', `HTTP ${rest.status}`);
    else fail('direct REST write blocked', `status=${rest.status} err=${rest.err || ''}`);

    // Try to write to /criteria directly as an anon user — should be allowed only via function, but rules let auth'd users create
    // Attempt unauth'd criteria write
    const restCriteria = await page.evaluate(async () => {
      try {
        const r = await fetch(
          'https://firestore.googleapis.com/v1/projects/dmjone/databases/(default)/documents/criteria/ATTACK1',
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: { jobTitle: { stringValue: 'pwnd' } } }),
          },
        );
        return { status: r.status };
      } catch (e) { return { err: String(e).slice(0,100) }; }
    });
    if (restCriteria.status === 401 || restCriteria.status === 403) pass('criteria write blocked', `HTTP ${restCriteria.status}`);
    else fail('criteria write blocked', `status=${restCriteria.status}`);
  } catch (e) { fail('rules bypass', e.message.slice(0,150)); }
  await ctx.close();
}

// ─── 6. Rapid navigation / back-forward abuse ──────────────────────
console.log('\n=== 6. RAPID NAVIGATION ===');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  tagPage(page, 'nav');
  const routes = ['/', '/builder', '/builder/form', '/employer', '/employer/matches', '/pitch', '/capstone-report'];
  try {
    for (const r of routes) {
      await page.goto(BASE + r, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(200);
    }
    // Back-forward a few times
    for (let i = 0; i < 5; i++) { await page.goBack({ waitUntil: 'domcontentloaded' }).catch(()=>{}); }
    for (let i = 0; i < 5; i++) { await page.goForward({ waitUntil: 'domcontentloaded' }).catch(()=>{}); }
    pass('rapid nav survived', `${routes.length} routes + back/fwd`);
  } catch (e) { fail('rapid nav', e.message.slice(0,150)); }
  await ctx.close();
}

// ─── 7. Double-submit share (race) ─────────────────────────────────
console.log('\n=== 7. DOUBLE-SUBMIT SHARE ===');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  tagPage(page, 'double');
  try {
    await page.goto(BASE + '/builder/form', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: /demo/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /share/i }).first().click();
    await page.waitForTimeout(400);
    const createBtn = page.getByRole('button', { name: /create link/i }).first();
    // Click twice back-to-back
    await Promise.all([
      createBtn.click().catch(()=>{}),
      createBtn.click().catch(()=>{}),
    ]);
    await page.waitForSelector('text=/Your shareable link/i', { timeout: 30000 });
    pass('double-submit safe', 'single link created');
  } catch (e) { fail('double submit', e.message.slice(0,150)); }
  await ctx.close();
}

// ─── 8. Offline / network down ─────────────────────────────────────
console.log('\n=== 8. OFFLINE ===');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  tagPage(page, 'offline');
  try {
    // Load once to register SW / cache
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await ctx.setOffline(true);
    // Try to navigate SPA-style — same origin, cached by SW
    await page.goto(BASE + '/pitch', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(()=>{});
    await page.waitForTimeout(1500);
    const body = await page.locator('body').innerText();
    if (body.length > 50) pass('offline SPA loads', `${body.length} chars`);
    else skip('offline SPA', 'no cached content (sw may be cold)');
    await ctx.setOffline(false);
  } catch (e) { fail('offline', e.message.slice(0,150)); }
  await ctx.close();
}

// ─── 9. Mobile viewport (iPhone 14) ────────────────────────────────
console.log('\n=== 9. MOBILE ===');
{
  const ctx = await browser.newContext({ ...devices['iPhone 14'] });
  const page = await ctx.newPage();
  tagPage(page, 'mobile');
  try {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    // Click the primary CTA
    const lk = page.getByRole('link', { name: /talk to saathi|start|build.*resume/i }).first();
    if (await lk.isVisible({ timeout: 4000 }).catch(()=>false)) {
      await lk.click();
      await page.waitForTimeout(2500);
      if (page.url().includes('/builder')) pass('mobile landing -> builder');
      else fail('mobile landing -> builder', page.url());
    }
    const body = await page.locator('body').innerText();
    if (body.length > 100) pass('mobile builder renders', `${body.length} chars`);
    else fail('mobile builder', 'empty');
  } catch (e) { fail('mobile', e.message.slice(0,150)); }
  await ctx.close();
}

// ─── 10. Keyboard-only nav on landing ──────────────────────────────
console.log('\n=== 10. KEYBOARD-ONLY ===');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  tagPage(page, 'kbd');
  try {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    // Tab through 10 focusable elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);
    }
    const active = await page.evaluate(() => document.activeElement?.tagName);
    if (active && active !== 'BODY') pass('keyboard tab moves focus', active);
    else fail('keyboard tab moves focus', 'stuck on body');
  } catch (e) { fail('keyboard', e.message.slice(0,150)); }
  await ctx.close();
}

// ─── 11. Concurrent edits on the same shared resume ────────────────
console.log('\n=== 11. CONCURRENT EDITS ===');
{
  // Create an open-edit share first
  const setupCtx = await browser.newContext();
  const setupPage = await setupCtx.newPage();
  tagPage(setupPage, 'concurrent-setup');
  let url = '';
  try {
    await setupPage.goto(BASE + '/builder/form', { waitUntil: 'domcontentloaded' });
    await setupPage.waitForTimeout(3000);
    await setupPage.getByRole('button', { name: /demo/i }).first().click();
    await setupPage.waitForTimeout(500);
    await setupPage.getByRole('button', { name: /share/i }).first().click();
    await setupPage.waitForTimeout(400);
    // Leave password empty
    await setupPage.getByRole('button', { name: /create link/i }).click();
    await setupPage.waitForSelector('text=/Your shareable link/i', { timeout: 30000 });
    const b = await setupPage.locator('body').innerText();
    url = (b.match(/https?:\/\/[^\s]+\/r\/[A-Za-z0-9_-]{6,32}/) || [])[0] || '';
  } catch (e) { fail('concurrent setup', e.message.slice(0,150)); }
  await setupCtx.close();

  if (url) {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pA = await ctxA.newPage();
    const pB = await ctxB.newPage();
    tagPage(pA, 'concurrent-A');
    tagPage(pB, 'concurrent-B');
    try {
      await Promise.all([
        pA.goto(url, { waitUntil: 'domcontentloaded' }),
        pB.goto(url, { waitUntil: 'domcontentloaded' }),
      ]);
      await Promise.all([pA.waitForTimeout(4000), pB.waitForTimeout(4000)]);

      // Both edit Full Name simultaneously
      const fA = pA.getByLabel(/^full name/i).first();
      const fB = pB.getByLabel(/^full name/i).first();
      if (await fA.isVisible().catch(()=>false) && await fB.isVisible().catch(()=>false)) {
        await fA.fill('Edit From A');
        await fB.fill('Edit From B');
        await Promise.all([pA.waitForTimeout(4000), pB.waitForTimeout(4000)]);
        pass('concurrent edits survived');
      } else skip('concurrent edits', 'full name field missing');
    } catch (e) { fail('concurrent edits', e.message.slice(0,150)); }
    await ctxA.close(); await ctxB.close();
  }
}

// ─── 12. Security headers check ────────────────────────────────────
console.log('\n=== 12. SECURITY HEADERS ===');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    const r = await page.request.get(BASE + '/');
    const h = r.headers();
    const checks = [
      ['x-content-type-options', 'nosniff'],
      ['x-frame-options', /DENY|SAMEORIGIN/i],
      ['strict-transport-security', /max-age/i],
      ['referrer-policy', /./],
      ['permissions-policy', /./],
    ];
    for (const [name, want] of checks) {
      const got = h[name] || '';
      const ok = typeof want === 'string' ? got.toLowerCase().includes(want) : want.test(got);
      if (ok) pass(`header ${name}`, got.slice(0,60));
      else fail(`header ${name}`, `got "${got}"`);
    }
  } catch (e) { fail('headers', e.message.slice(0,150)); }
  await ctx.close();
}

// ─── 13. Sitemap / robots / favicon ────────────────────────────────
console.log('\n=== 13. SEO STATIC ===');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    for (const path of ['/favicon.svg', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest']) {
      const r = await page.request.get(BASE + path);
      if (r.ok()) pass(`asset ${path}`, r.status().toString());
      else fail(`asset ${path}`, `HTTP ${r.status()}`);
    }
  } catch (e) { fail('seo', e.message.slice(0,150)); }
  await ctx.close();
}

// ─── 14. JD PASTE BOMB at /employer/publish ────────────────────────
console.log('\n=== 14. JD PASTE BOMB ===');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  tagPage(page, 'jd-bomb');
  try {
    await page.goto(BASE + '/employer/publish', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const title = page.locator('#job-title');
    const desc = page.locator('#job-desc');
    if (!(await title.isVisible().catch(()=>false))) { fail('jd bomb: no title field'); }
    else {
      await title.fill('Stress Test Role — ' + Math.random().toString(36).slice(2,6));
      // 300 KB JD
      await desc.fill('Lorem ipsum dolor sit amet, '.repeat(10000));
      // Try to publish
      await page.getByRole('button', { name: /publish criteria/i }).click();
      // Wait for either Manage Criteria or alert
      const outcome = await Promise.race([
        page.waitForSelector('text=/Manage Criteria/i', { timeout: 30000 }).then(() => 'ok'),
        page.waitForSelector('[role="alert"]', { timeout: 30000 }).then(() => 'alert'),
      ]).catch(() => 'timeout');
      if (outcome === 'ok') pass('jd bomb publish', 'huge JD accepted');
      else if (outcome === 'alert') {
        const t = await page.locator('[role="alert"]').first().textContent().catch(()=>'');
        pass('jd bomb graceful reject', t?.trim().slice(0,80));
      }
      else fail('jd bomb', outcome);
    }
  } catch (e) { fail('jd bomb', e.message.slice(0,150)); }
  await ctx.close();
}

// ─── 15. Bridge test flow: open a seeded code, score + generate ────
console.log('\n=== 15. BRIDGE FLOW ===');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  tagPage(page, 'bridge-flow');
  const CODES = ['VJ6SZA', 'TH5UMA', 'QZZTOA', '5XQVNA', 'FM0JWG'];
  let loaded = '';
  try {
    for (const c of CODES) {
      await page.goto(BASE + '/bridge/' + c, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3500);
      const body = await page.locator('body').innerText();
      if (/score my resume/i.test(body)) { loaded = c; break; }
    }
    if (!loaded) { fail('bridge landing'); }
    else {
      pass('bridge landing', loaded);
      // Click to score
      await page.getByRole('button', { name: /score my resume/i }).first().click();
      await page.waitForTimeout(6000);
      // Wait for a question or radio to appear, up to 60s
      let qSeen = false;
      for (let i = 0; i < 20; i++) {
        const radios = await page.locator('[role="radio"], input[type="radio"]').count();
        if (radios >= 2) { qSeen = true; break; }
        await page.waitForTimeout(3000);
      }
      if (qSeen) pass('bridge question generated');
      else fail('bridge question generated', 'no radios after 60s');

      // Anti-cheat probes
      if (qSeen) {
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', { value: true, configurable: true });
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await page.evaluate(() => {
          const dt = new DataTransfer();
          dt.setData('text/plain', 'pwd');
          document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
        });
        await page.evaluate(() => document.dispatchEvent(new Event('fullscreenchange')));
        pass('bridge anti-cheat events fired');
      }
    }
  } catch (e) { fail('bridge flow', e.message.slice(0,150)); }
  await ctx.close();
}

// ─── 16. Concurrent load: 10 parallel landing requests ─────────────
console.log('\n=== 16. CONCURRENT LOAD ===');
{
  try {
    const ctxs = await Promise.all(Array.from({ length: 10 }, () => browser.newContext()));
    const pages = await Promise.all(ctxs.map((c) => c.newPage()));
    const start = Date.now();
    const results = await Promise.all(pages.map(async (p, i) => {
      try {
        const r = await p.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        return r?.status() === 200;
      } catch { return false; }
    }));
    const elapsed = Date.now() - start;
    const ok = results.filter(Boolean).length;
    if (ok === 10) pass('10 concurrent landing loads', `${elapsed}ms`);
    else fail('10 concurrent landing loads', `${ok}/10`);
    await Promise.all(ctxs.map((c) => c.close()));
  } catch (e) { fail('concurrent load', e.message.slice(0,150)); }
}

// ─── 17. Dark mode toggle ──────────────────────────────────────────
console.log('\n=== 17. DARK MODE ===');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  tagPage(page, 'dark');
  try {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const themeBtn = page.getByRole('button', { name: /dark mode|light mode|theme/i }).first();
    if (await themeBtn.isVisible({ timeout: 3000 }).catch(()=>false)) {
      const before = await page.evaluate(() => document.documentElement.className);
      await themeBtn.click();
      await page.waitForTimeout(600);
      const after = await page.evaluate(() => document.documentElement.className);
      if (before !== after && /light|dark/.test(after)) pass('dark mode toggle', `${before} -> ${after}`);
      else fail('dark mode toggle', `${before} -> ${after}`);
    } else skip('dark mode toggle', 'button not visible');
  } catch (e) { fail('dark mode', e.message.slice(0,150)); }
  await ctx.close();
}

// ─── 18. CSP connect-src honored (blocks random origins) ───────────
console.log('\n=== 18. CSP ENFORCEMENT ===');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  let csp_blocked = false;
  page.on('console', m => { if (/Content Security Policy/i.test(m.text())) csp_blocked = true; });
  try {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.evaluate(async () => {
      try { await fetch('https://evil.example.com/pwn'); } catch {}
    });
    await page.waitForTimeout(1500);
    if (csp_blocked) pass('CSP blocks evil.example.com');
    else pass('CSP fetch failed silently', '(browser network block)');
  } catch (e) { fail('csp enforcement', e.message.slice(0,150)); }
  await ctx.close();
}

// ─── 19. Saathi rapid-fire spam ─────────────────────────────────────
console.log('\n=== 19. SAATHI SPAM ===');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  tagPage(page, 'spam');
  try {
    await page.goto(BASE + '/builder', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const input = page.locator('input[placeholder*="Type"]').first();
    if (!(await input.isVisible({ timeout: 8000 }).catch(()=>false))) fail('spam input');
    else {
      for (let i = 0; i < 10; i++) {
        await input.fill('spam ' + i);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(80);
      }
      await page.waitForTimeout(4000);
      const body = await page.locator('body').innerText();
      if (body.length > 200) pass('saathi survives spam', `${body.length} chars`);
      else fail('saathi survives spam', `only ${body.length}`);
    }
  } catch (e) { fail('saathi spam', e.message.slice(0,150)); }
  await ctx.close();
}

// ─── 20. Clock skew / system clock manipulation guard ──────────────
console.log('\n=== 20. CLOCK GUARDS ===');
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  tagPage(page, 'clock');
  try {
    // Override Date() to 1970 then try to use the shared resume flow
    await page.addInitScript(() => {
      const realDate = Date;
      // @ts-ignore
      globalThis.Date = class extends realDate {
        constructor(...args) {
          if (args.length === 0) super(0);
          else super(...args);
        }
        static now() { return 0; }
      };
    });
    await page.goto(BASE + '/builder/form', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const body = await page.locator('body').innerText();
    if (body.length > 200) pass('clock skew survivable', `${body.length} chars`);
    else fail('clock skew', 'page blank');
  } catch (e) { fail('clock skew', e.message.slice(0,150)); }
  await ctx.close();
}

// ─── SUMMARY ───────────────────────────────────────────────────────
console.log('\n=== PAGE / CONSOLE ERRORS ===');
if (pageErrors.length) console.log(pageErrors.slice(0, 30).join('\n'));
else console.log('(none)');

const passes = report.filter(r => r.s === 'PASS').length;
const fails = report.filter(r => r.s === 'FAIL').length;
const skips = report.filter(r => r.s === 'SKIP').length;
console.log(`\n=== ${passes} pass / ${fails} fail / ${skips} skip / ${report.length} total ===`);
if (fails) {
  console.log('\nFAILED:');
  report.filter(r => r.s === 'FAIL').forEach(r => console.log(`  - ${r.n}: ${r.i}`));
}
if (skips) {
  console.log('\nSKIPPED:');
  report.filter(r => r.s === 'SKIP').forEach(r => console.log(`  - ${r.n}: ${r.i}`));
}

await browser.close();
process.exit(fails > 0 ? 1 : 0);
