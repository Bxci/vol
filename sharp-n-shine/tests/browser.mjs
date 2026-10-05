// בדיקות דפדפן: אין גלישה אופקית, תפריט נייד, סינון גלריה, מציג תמונות, ולידציית טופס
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from './pw.mjs';
const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  let p = new URL(req.url, 'http://x').pathname; if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'content-type': types[extname(p)] || 'text/plain' }).end(await readFile(join(dist, p))); } catch { res.writeHead(404).end('nf'); }
}).listen(0);
const base = `http://localhost:${server.address().port}`;
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.error('✗', m); } else console.log('✓', m); };
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
const paths = ['/', '/about/', '/services/', '/services/full-detailing/', '/services/ceramic-coating/', '/services/polishing/', '/services/upholstery-cleaning/', '/services/engine-cleaning/', '/services/headlight-restoration/', '/gallery/', '/reviews/', '/faq/', '/contact/', '/privacy/', '/accessibility/'];

for (const [name, vp] of [['נייד 360', { width: 360, height: 740 }], ['נייד 390', { width: 390, height: 844 }], ['טאבלט', { width: 820, height: 1180 }], ['דסקטופ', { width: 1366, height: 800 }]]) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: vp.width < 900 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  for (const p of paths) {
    await page.goto(base + p);
    const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(o <= 0, `${name} ${p}: אין גלישה אופקית`);
  }
  ok(errs.length === 0, `${name}: אין שגיאות קונסולה ${errs[0] || ''}`);
  await ctx.close();
}

// תפריט נייד
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage();
  await page.goto(base + '/');
  const nav = page.locator('#site-nav'), btn = page.locator('.nav-toggle');
  ok(!(await nav.isVisible()), 'נייד: התפריט סגור בהתחלה');
  await btn.click();
  ok(await nav.isVisible() && (await btn.getAttribute('aria-expanded')) === 'true', 'נייד: התפריט נפתח');
  const box = await page.locator('.site-nav a').first().boundingBox();
  ok(box.height >= 44, 'נייד: יעד לחיצה בתפריט לפחות 44px');
  await page.keyboard.press('Escape');
  ok(!(await nav.isVisible()), 'נייד: Escape סוגר');
  await btn.click(); await page.locator('.site-nav a', { hasText: 'שירותים' }).click(); await page.waitForURL('**/services/');
  ok(true, 'נייד: ניווט לעמוד השירותים');
  ok(await page.locator('.action-bar').isVisible(), 'נייד: סרגל פעולות קבוע מוצג');
  await ctx.close();
}
// דסקטופ: בלי המבורגר
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } }); const page = await ctx.newPage();
  await page.goto(base + '/');
  ok(!(await page.locator('.nav-toggle').isVisible()) && await page.locator('#site-nav').isVisible(), 'דסקטופ: ניווט גלוי בלי המבורגר');
  ok(!(await page.locator('.action-bar').isVisible()), 'דסקטופ: סרגל פעולות מוסתר');
  await ctx.close();
}
// גלריה
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage();
  await page.goto(base + '/gallery/');
  ok(await page.locator('.project:visible').count() === 6, 'גלריה: 6 פרויקטים');
  await page.locator('.chip[data-filter="polishing"]').click();
  ok(await page.locator('.project:visible').count() === 1, 'גלריה: סינון לפי שירות');
  await page.locator('.chip[data-filter="all"]').click();
  await page.locator('.thumb').first().click();
  ok(await page.locator('#lightbox[open]').count() === 1, 'גלריה: מציג תמונות נפתח');
  await page.keyboard.press('Escape');
  ok(await page.locator('#lightbox[open]').count() === 0, 'גלריה: Escape סוגר');
  await ctx.close();
}
// טופס
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); const page = await ctx.newPage();
  await page.goto(base + '/contact/?service=polishing');
  ok((await page.inputValue('#f-service')) === 'polishing', 'טופס: בחירת שירות מראש מה-URL');
  await page.click('button[type=submit]');
  ok((await page.locator('#error-summary li').count()) >= 4, 'טופס: שגיאות מוצגות כשריק');
  ok((await page.getAttribute('#f-name', 'aria-invalid')) === 'true', 'טופס: aria-invalid');
  await page.fill('#f-name', 'דנה'); await page.fill('#f-phone', '123'); await page.fill('#f-email', 'bad'); await page.fill('#f-vehicle', 'מאזדה 3 2019');
  await page.click('button[type=submit]');
  ok((await page.textContent('#f-phone-err')).includes('אינו תקין'), 'טופס: טלפון שגוי נדחה');
  ok((await page.textContent('#f-email-err')).includes('אינה תקינה'), 'טופס: אימייל שגוי נדחה');
  await page.fill('#f-phone', '052-123-4567'); await page.fill('#f-email', ''); await page.check('#f-consent');
  await ctx.route('**/api.whatsapp.com/**', (r) => r.fulfill({ status: 200, body: 'wa' }));
  const [popup] = await Promise.all([ctx.waitForEvent('page'), page.click('button[type=submit]')]);
  await popup.waitForURL(/api\.whatsapp\.com/);
  ok(popup.url().includes('api.whatsapp.com/send?phone=972512205703') && decodeURIComponent(popup.url()).includes('מאזדה 3 2019'), 'טופס: נפתח וואטסאפ עם הודעה מוכנה');
  ok((await page.textContent('#form-status')).includes('תישלח רק'), 'טופס: הודעת סטטוס כנה (ללא "נשלח בהצלחה")');
  await ctx.close();
}
await browser.close(); server.close();
console.log(fails ? `נכשלו ${fails} בדיקות` : '✓ כל בדיקות הדפדפן עברו');
process.exit(fails ? 1 : 0);
