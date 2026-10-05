// בדיקות סטטיות על dist: קישורים פנימיים, כותרות, תיאורים, lang/dir ופרטי עסק אחידים
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { business, services } from '../content/site.mjs';
const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
let fails = 0;
const fail = (m) => { fails++; console.error('✗', m); };
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const htmls = walk(dist).filter((f) => f.endsWith('.html'));
const titles = new Set();
for (const f of htmls) {
  const h = readFileSync(f, 'utf8'), rel = f.slice(dist.length);
  if (!/<html lang="he" dir="rtl">/.test(h)) fail(`${rel}: lang/dir`);
  const t = h.match(/<title>(.*?)<\/title>/)?.[1];
  if (!t) fail(`${rel}: חסר title`); else if (titles.has(t)) fail(`${rel}: title כפול`); titles.add(t);
  if (!/<meta name="description" content="[^"]{30,}/.test(h)) fail(`${rel}: description`);
  if ((h.match(/<h1[ >]/g) || []).length !== 1) fail(`${rel}: צריך h1 אחד`);
  if (/<img(?![^>]*\balt=)/.test(h)) fail(`${rel}: img בלי alt`);
  for (const m of h.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
    const p = m[1]; const target = p.endsWith('/') ? join(dist, p, 'index.html') : join(dist, p);
    if (!existsSync(target)) fail(`${rel}: קישור שבור ${p}`);
  }
  if (/target="_blank"/.test(h) && /<a[^>]*target="_blank"(?![^>]*rel="noopener)/.test(h)) fail(`${rel}: _blank בלי noopener`);
  for (const bad of ['7 שנים', 'שבע שנים', 'הכי טוב', 'מובטח', 'מבטיחים', 'KOCH', 'Koch']) if (h.includes(bad)) fail(`${rel}: ניסוח אסור "${bad}"`);
}
const home = readFileSync(join(dist, 'index.html'), 'utf8');
for (const v of [business.phoneDisplay, business.email, business.address, business.wazeUrl, business.social.instagram]) if (!home.includes(v.replace(/&/g, '&amp;'))) fail(`בית: חסר ${v}`);
for (const s of services) if (!existsSync(join(dist, 'services', s.slug, 'index.html'))) fail(`חסר עמוד שירות ${s.slug}`);
console.log(fails ? `נכשלו ${fails} בדיקות` : `✓ בדיקות סטטיות עברו (${htmls.length} עמודים)`);
process.exit(fails ? 1 : 0);
