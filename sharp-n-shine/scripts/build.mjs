// מחולל אתר סטטי ללא תלויות. הרצה: node scripts/build.mjs  (SITE_URL=https://example.co.il לקבלת canonical ו-sitemap מלאים)
import { mkdirSync, writeFileSync, copyFileSync, rmSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { business, services, testimonials, projects, faq, shareWithRequest, askWorkshop, whatsappUrl, telUrl, mailUrl } from '../content/site.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const write = (path, content) => { const f = join(dist, path); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, content); };

// ---------- אייקונים ----------
const P = {
  sparkle: '<path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8zM19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z"/>',
  shield: '<path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z"/>',
  polish: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  seat: '<path d="M7 3h4l1 8h5a2 2 0 0 1 2 2v3H9a3 3 0 0 1-3-3z"/><path d="M8 21v-3M17 21v-3"/>',
  engine: '<path d="M4 9h3l2-2h6l2 2h3v7h-3l-2 2H8l-2-2H4zM1 12h3M20 12h3"/>',
  headlight: '<path d="M10 4C5 4 3 8 3 12s2 8 7 8c5 0 8-4 8-8s-3-8-8-8z"/><path d="M21 8h-2M21 12h-3M21 16h-2"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  wa: '<path d="M3 21l1.6-4.6A9 9 0 1 1 8 19.5z"/><path d="M9 9c0 3 3 6 6 6l1-2-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2z"/>',
  pin: '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
};
const icon = (n, attrs = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" ${attrs}>${P[n]}</svg>`;

// ---------- רכיבים ----------
const NAV = [
  ['/', 'בית'], ['/about/', 'אודות'], ['/services/', 'שירותים'], ['/gallery/', 'גלריה'],
  ['/reviews/', 'המלצות'], ['/faq/', 'שאלות נפוצות'], ['/contact/', 'צור קשר'],
];

const logo = `<a class="logo" href="/" aria-label="Sharp N Shine, ${esc(business.nameHe)} – לעמוד הבית"><b>SHARP <span>N</span> SHINE</b><small>סדנת דיטיילינג</small></a>`;

const header = (path) => `
<header class="site-header">
  <div class="wrap header-row">
    ${logo}
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="bars" aria-hidden="true"></span><span>תפריט</span></button>
    <nav class="site-nav" id="site-nav" aria-label="ניווט ראשי">
      <ul>${NAV.map(([h, t]) => {
        const cur = h === '/' ? path === '/' : path.startsWith(h);
        return `<li><a href="${h}"${cur ? ' aria-current="page"' : ''}>${t}</a></li>`;
      }).join('')}</ul>
    </nav>
  </div>
</header>`;

const hoursList = () => `<ul class="hours">${business.hours.map((h) =>
  `<li><span>${h.label}</span><span>${h.note ? h.note : `<bdi>${h.opens}–${h.closes}</bdi>`}</span></li>`).join('')}</ul>`;

const ctaButtons = (extra = '') => `<div class="btn-row">
  <a class="btn btn-wa" href="${esc(whatsappUrl())}" target="_blank" rel="noopener">${icon('wa', 'width="20" height="20"')} שליחת הודעה בוואטסאפ</a>
  <a class="btn btn-ghost" href="${telUrl}">${icon('phone', 'width="20" height="20"')} <bdi>${business.phoneDisplay}</bdi></a>${extra}
</div>`;

const footer = () => `
<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div>${logo}<p style="margin-top:12px">${esc(business.tagline)}.<br>${esc(business.appointmentNote)}.</p></div>
      <div><h2>ניווט</h2><ul>${NAV.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul></div>
      <div><h2>שירותים</h2><ul>${services.map((s) => `<li><a href="/services/${s.slug}/">${esc(s.title)}</a></li>`).join('')}</ul></div>
      <div><h2>יצירת קשר</h2>
        <ul>
          <li><a href="${telUrl}"><bdi>${business.phoneDisplay}</bdi></a></li>
          <li><a href="${esc(whatsappUrl())}" target="_blank" rel="noopener">וואטסאפ</a></li>
          <li><a href="${mailUrl}">${esc(business.email)}</a></li>
          <li>${esc(business.address)}</li>
          <li><a href="${esc(business.wazeUrl)}" target="_blank" rel="noopener">ניווט ב-Waze</a></li>
        </ul>
        <h2 style="margin-top:16px">רשתות חברתיות</h2>
        <ul>
          <li><a href="${esc(business.social.instagram)}" target="_blank" rel="noopener">Instagram</a></li>
          <li><a href="${esc(business.social.facebook)}" target="_blank" rel="noopener">Facebook</a></li>
          <li><a href="${esc(business.social.tiktok)}" target="_blank" rel="noopener">TikTok</a></li>
        </ul>
      </div>
    </div>
    <div class="legal">
      <a href="/privacy/">מדיניות פרטיות</a> · <a href="/accessibility/">הצהרת נגישות</a><br>
      © ${new Date().getFullYear()} Sharp N Shine. ${esc(business.appointmentNote)}.
    </div>
  </div>
</footer>
<nav class="action-bar" aria-label="פעולות מהירות">
  <a class="wa" href="${esc(whatsappUrl())}" target="_blank" rel="noopener">${icon('wa')}<span>וואטסאפ</span></a>
  <a class="call" href="${telUrl}">${icon('phone')}<span>חיוג</span></a>
  <a class="nav" href="${esc(business.wazeUrl)}" target="_blank" rel="noopener">${icon('pin')}<span>ניווט</span></a>
</nav>`;

const jsonLd = () => JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'AutomotiveBusiness',
  name: business.name,
  alternateName: business.nameHe,
  description: business.tagline,
  telephone: business.phoneIntl,
  email: business.email,
  ...(SITE_URL && { url: SITE_URL + '/' }),
  address: { '@type': 'PostalAddress', streetAddress: business.street, addressLocality: 'Petah Tikva', addressCountry: 'IL' },
  openingHoursSpecification: business.hours.filter((h) => h.opens).map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.days, opens: h.opens, closes: h.closes })),
  sameAs: Object.values(business.social),
  founder: { '@type': 'Person', name: business.ownerEn },
});

function layout({ path, title, desc, body, schema = false, noindex = false }) {
  const fullTitle = path === '/' ? title : `${title} | Sharp N Shine`;
  const canon = SITE_URL ? `<link rel="canonical" href="${SITE_URL}${path}">` : '';
  const ogImg = `${SITE_URL}/assets/og-image.png`;
  const clientCfg = JSON.stringify({ whatsappBase: business.whatsappBase, email: business.email }).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#0f1215">
${noindex ? '<meta name="robots" content="noindex">' : ''}
${canon}
<meta property="og:type" content="website">
<meta property="og:locale" content="he_IL">
<meta property="og:site_name" content="Sharp N Shine">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
${SITE_URL ? `<meta property="og:url" content="${SITE_URL}${path}">` : ''}
<meta property="og:image" content="${ogImg}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles.css">
<script>document.documentElement.classList.add('js')</script>
${schema ? `<script type="application/ld+json">${jsonLd()}</script>` : ''}
</head>
<body>
<a class="skip" href="#main">דילוג לתוכן הראשי</a>
${header(path)}
<main id="main">
${body}
</main>
${footer()}
<script>window.SNS=${clientCfg}</script>
<script src="/main.js" defer></script>
</body>
</html>`;
}

const pageHero = (crumbs, h1, lead) => `
<div class="page-hero"><div class="wrap">
  <p class="crumbs"><a href="/">בית</a>${crumbs.map(([h, t]) => ` › ${h ? `<a href="${h}">${t}</a>` : t}`).join('')}</p>
  <h1>${h1}</h1>${lead ? `<p>${lead}</p>` : ''}
</div></div>`;

const serviceCard = (s) => `
<article class="card">
  <div class="svc-icon">${icon(s.icon)}</div>
  <h3><a href="/services/${s.slug}/" style="color:inherit;text-decoration:none">${esc(s.title)}</a></h3>
  <p>${esc(s.short)}</p>
  <a class="more" href="/services/${s.slug}/" aria-label="פרטים על ${esc(s.title)}">לפרטים</a>
</article>`;

const quoteCard = (t) => `
<figure class="card quote"><blockquote>${esc(t.text)}</blockquote><figcaption>${esc(t.name)}<span class="src">מתוך ההמלצות בעמוד העסק</span></figcaption></figure>`;

// ---------- גלריה: תמונות אמיתיות אם קיימות, אחרת מקום שמור ----------
const galDir = join(root, 'assets', 'gallery');
const galFiles = existsSync(galDir) ? readdirSync(galDir) : [];
const findImg = (slug, kind) => galFiles.find((f) => new RegExp(`^${slug}-${kind}\\.(jpe?g|png|webp|avif)$`, 'i').test(f));
const placeholder = (label) => `<svg viewBox="0 0 400 300" role="img" aria-label="${esc(label)}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#222830"/><stop offset="1" stop-color="#11151a"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><path d="M60 190l30-50c6-9 14-14 24-14h172c10 0 18 5 24 14l30 50v30H60z" fill="none" stroke="#5b6672" stroke-width="3"/><circle cx="125" cy="224" r="20" fill="#11151a" stroke="#5b6672" stroke-width="3"/><circle cx="275" cy="224" r="20" fill="#11151a" stroke="#5b6672" stroke-width="3"/><text x="200" y="85" text-anchor="middle" fill="#c9cfd6" font-size="18" font-family="sans-serif">מקום שמור לתמונה אמיתית</text></svg>`;
const thumb = (p, kind, tagText) => {
  const f = findImg(p.slug, kind);
  const caption = `${p.car} – ${tagText}`;
  const media = f
    ? `<img src="/assets/gallery/${f}" alt="${esc(caption)}" loading="lazy" decoding="async" width="800" height="600">`
    : placeholder(`${caption}: מקום שמור לתמונה אמיתית מהעסק`);
  return `<button class="thumb" type="button" data-caption="${esc(caption + (f ? '' : ' (מקום שמור לתמונה אמיתית)'))}" aria-label="הגדלת תמונה: ${esc(caption)}">${media}<span class="tag">${tagText}</span></button>`;
};
const projectCard = (p, full = true) => {
  const plat = p.platform === 'facebook' ? ['פייסבוק', business.social.facebook] : ['אינסטגרם', business.social.instagram];
  return `<article class="card project" data-service="${p.service}">
  <div class="thumbs">${thumb(p, 'before', 'לפני')}${thumb(p, 'after', 'אחרי')}</div>
  <div class="body"><h3>${esc(p.car)}</h3>
  <p class="work">${p.work.map(esc).join(' · ')}</p>
  ${full ? `<p class="src">הפרטים לפי פרסומי העסק ב<a href="${esc(plat[1])}" target="_blank" rel="noopener">${plat[0]}<span class="visually-hidden"> (נפתח בחלון חדש)</span></a>.</p>` : ''}</div>
</article>`;
};

// ---------- עמודים ----------
const pages = [];
const add = (path, o) => pages.push({ path, ...o });

// בית
add('/', {
  title: 'Sharp N Shine | סדנת דיטיילינג מוסמכת בפתח תקווה',
  desc: 'סדנת דיטיילינג מקצועית בפתח תקווה: דיטיילינג מלא, ציפוי נאנו-קרמי, ליטוש רב-שלבי, ניקוי ריפודים ושחזור פנסים. בתיאום מראש.',
  schema: true,
  body: `
<section class="hero"><div class="wrap">
  <span class="eyebrow">${esc(business.tagline)} · פתח תקווה</span>
  <h1>הרכב שלך ראוי לטיפול של מי שמקפיד על כל פרט</h1>
  <p class="lead">ב-Sharp N Shine תקבלו טיפול דיטיילינג מותאם לרכב ולמצבו, עם הסבר מסודר ויחס אישי מבעל הסדנה. שירותים לרכבים, לאופנועים ולסירות.</p>
  ${ctaButtons('<a class="btn btn-primary" href="/services/">לשירותים</a><a class="btn btn-ghost" href="/gallery/">לגלריה</a>')}
  <p class="notice" role="note">📅 ${esc(business.appointmentNote)}. נא ליצור קשר לפני ההגעה.</p>
</div></section>

<section class="block"><div class="wrap split">
  <div>
    <h2>הכירו את חזי גוהרי</h2>
    <p>חזי הוא מדייטיילר מוסמך ומהנדס מכונות מעשי עם התמחות בהנדסת רכב. הרכבים מלווים אותו מילדותו, והעניין שלו בטיפוח רכב התחיל בגיל 16.</p>
    <p>בסדנה חזי מעורב אישית בעבודה ומקפיד על הפרטים, מההקשבה לצורכי הלקוח ועד התוצאה הסופית.</p>
    <p><a class="btn btn-outline" href="/about/">עוד על העסק</a></p>
  </div>
  <aside class="panel" aria-label="פרטי הסדנה">
    <dl>
      <dt>כתובת</dt><dd>${esc(business.address)} · <a href="${esc(business.wazeUrl)}" target="_blank" rel="noopener">Waze</a></dd>
      <dt>טלפון</dt><dd><a href="${telUrl}"><bdi>${business.phoneDisplay}</bdi></a></dd>
      <dt>שעות פעילות</dt><dd>${hoursList()}</dd>
      <dt>ביקור</dt><dd>${esc(business.appointmentNote)}</dd>
    </dl>
  </aside>
</div></section>

<section class="block alt"><div class="wrap">
  <div class="section-head"><h2>השירותים שלנו</h2><p>שישה תחומי טיפול, כולם מותאמים לרכב ולמצבו. לחצו על שירות כדי לקרוא עוד.</p></div>
  <div class="grid cols-3">${services.map(serviceCard).join('')}</div>
</div></section>

<section class="block"><div class="wrap">
  <div class="section-head"><h2>דוגמאות מהעבודה</h2><p>פרויקטים לפי פרסומי העסק ברשתות החברתיות. הגלריה המלאה מכילה עוד.</p></div>
  <div class="grid cols-3">${projects.slice(0, 3).map((p) => projectCard(p, false)).join('')}</div>
  <p style="margin-top:20px"><a class="btn btn-dark" href="/gallery/">לכל הפרויקטים</a></p>
</div></section>

<section class="block alt"><div class="wrap">
  <div class="section-head"><h2>מה אומרים הלקוחות</h2></div>
  <div class="grid cols-3">${testimonials.slice(0, 3).map(quoteCard).join('')}</div>
  <p style="margin-top:20px"><a href="/reviews/">לכל ההמלצות</a></p>
</div></section>

<section class="block"><div class="wrap split">
  <div>
    <h2>איך זה עובד כשיוצרים קשר?</h2>
    <ol class="steps">
      <li><strong>שולחים פרטים.</strong> בוואטסאפ או בטלפון: דגם הרכב, שנתון, מטרת הטיפול ותמונות.</li>
      <li><strong>מקבלים הכוונה.</strong> העבודה המתאימה נקבעת לפי מצב הרכב, ולכן המחיר והמשך נקבעים מול העסק.</li>
      <li><strong>מתאמים הגעה.</strong> הביקור בסדנה בתיאום מראש בלבד.</li>
    </ol>
  </div>
  <div class="panel"><h2>רוצים ייעוץ?</h2><p>ספרו לנו על הרכב ונחזור אליכם.</p>${ctaButtons()}</div>
</div></section>`,
});

// אודות
add('/about/', {
  title: 'אודות Sharp N Shine וחזי גוהרי',
  desc: 'הכירו את חזי גוהרי, מדייטיילר מוסמך ומהנדס מכונות מעשי, ואת גישת העבודה של סדנת Sharp N Shine בפתח תקווה.',
  body: `${pageHero([[null, 'אודות']], 'אודות Sharp N Shine', esc(business.tagline))}
<section class="block"><div class="wrap split">
  <div>
    <h2>חזי גוהרי, בעל הסדנה</h2>
    <p>חזי מתאר את עצמו כמדייטיילר מוסמך וכמהנדס מכונות מעשי המתמחה בהנדסת רכב. לדבריו, הרכבים מלווים אותו מילדותו, והוא החל להתעניין בטיפוח רכב בגיל 16.</p>
    <h2>הגישה שלנו</h2>
    <ul class="checks">
      <li>מעורבות אישית של בעל הסדנה בעבודה ובשיחה עם הלקוח.</li>
      <li>הקפדה על פרטים והקשבה לצורכי הלקוח.</li>
      <li>ציוד וחומרים איכותיים, כפי שהעסק מתאר.</li>
      <li>טיפול מותאם לרכב ולמצבו, ולא תבנית אחת לכולם.</li>
      <li>הסברים מסודרים בזמן העבודה. לקוחות מציינים בהמלצותיהם עדכונים במהלך התהליך.</li>
    </ul>
    <p>הטיפול יכול לשפר את מראה הרכב ולסייע בשמירה שוטפת על הצבע ועל הפנים. התוצאה בפועל תלויה במצב הרכב, ולכן נבדקת מול העסק.</p>
    ${ctaButtons()}
  </div>
  <aside class="panel" aria-label="מיקום ושעות">
    <h2>המיקום והביקור</h2>
    <p>${esc(business.address)}</p>
    <p><strong>${esc(business.appointmentNote)}.</strong> אנא צרו קשר לפני ההגעה.</p>
    ${hoursList()}
    <p style="margin-top:14px"><a class="btn btn-primary" href="${esc(business.wazeUrl)}" target="_blank" rel="noopener">ניווט ב-Waze</a></p>
  </aside>
</div></section>`,
});

// שירותים
add('/services/', {
  title: 'שירותי דיטיילינג לרכב, אופנוע וסירה',
  desc: 'כל השירותים של Sharp N Shine: דיטיילינג מלא, ציפוי נאנו-קרמי, ליטוש רב-שלבי, ניקוי וחיטוי ריפודים, ניקוי מנוע ושחזור פנסים.',
  body: `${pageHero([[null, 'שירותים']], 'השירותים שלנו', 'שישה תחומי טיפול. התוכנית המדויקת נקבעת לפי מצב הרכב ומטרת הטיפול.')}
<section class="block"><div class="wrap">
  <div class="grid cols-3">${services.map(serviceCard).join('')}</div>
  <div class="callout"><strong>לא בטוחים איזה טיפול מתאים?</strong> שלחו תמונות ופרטי רכב, ונבדוק מה נכון עבורכם.
    <div class="btn-row"><a class="btn btn-wa" href="${esc(whatsappUrl('שלום חזי, אשמח לעזרה בבחירת הטיפול המתאים לרכב שלי. סוג הרכב ושנתון: '))}" target="_blank" rel="noopener">שאלו בוואטסאפ</a><a class="btn btn-outline" href="/contact/">טופס יצירת קשר</a></div></div>
</div></section>`,
});

// עמודי שירות
for (const s of services) {
  add(`/services/${s.slug}/`, {
    title: s.title,
    desc: s.meta,
    body: `${pageHero([['/services/', 'שירותים'], [null, esc(s.title)]], esc(s.title), esc(s.intro))}
<section class="block"><div class="wrap split">
  <div>
    <h2>מה השירות בא לענות עליו</h2>
    <ul class="checks">${s.addresses.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
    <h2>למי זה עשוי להתאים</h2>
    <ul class="checks">${s.useful.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
    ${s.note ? `<div class="callout">${esc(s.note)}</div>` : ''}
    <p>המידע בעמוד זה הסבר כללי ואינו תוכנית עבודה מחייבת. היקף העבודה, ההכנה, התוצאה הצפויה, משך הטיפול והמחיר נקבעים מול העסק לפי הרכב.</p>
  </div>
  <div>
    <aside class="card"><h2>מה כדאי לשלוח בבקשה להצעה</h2><ul>${shareWithRequest.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></aside>
    <aside class="card" style="margin-top:16px"><h2>מה כדאי לשאול את הסדנה</h2><ul>${askWorkshop.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></aside>
  </div>
</div></section>
<section class="block dark"><div class="wrap">
  <h2>מעוניינים ב${esc(s.title)}?</h2>
  <p>${esc(business.appointmentNote)}. ספרו לנו על הרכב ונחזור אליכם.</p>
  <div class="btn-row">
    <a class="btn btn-wa" href="${esc(whatsappUrl(`שלום חזי, אני מתעניין ב${s.title} לרכב שלי. סוג הרכב ושנתון: `))}" target="_blank" rel="noopener">וואטסאפ</a>
    <a class="btn btn-ghost" href="${telUrl}"><bdi>${business.phoneDisplay}</bdi></a>
    <a class="btn btn-ghost" href="/contact/?service=${s.slug}">טופס יצירת קשר</a>
  </div>
</div></section>
<section class="block"><div class="wrap"><h2>שירותים נוספים</h2>
  <div class="grid cols-3">${services.filter((x) => x.slug !== s.slug).slice(0, 3).map(serviceCard).join('')}</div>
</div></section>`,
  });
}

// גלריה
add('/gallery/', {
  title: 'גלריית עבודות',
  desc: 'דוגמאות לעבודות של Sharp N Shine: גולף, אאודי Q5 ו-SQ5, טסלה מודל 3, פיג׳ו 208 וסמארט, לפי פרסומי העסק ברשתות.',
  body: `${pageHero([[null, 'גלריה']], 'גלריית עבודות', 'דוגמאות לפי פרסומי העסק ברשתות החברתיות.')}
<section class="block"><div class="wrap">
  <div class="callout">תמונות לפני/אחרי אמיתיות יופיעו כאן לאחר שהעסק יספק אותן. עד אז מוצגים מקומות שמורים מסומנים בבירור. פרטי העבודה נלקחו מפרסומי העסק ואינם כוללים תאריכים, מחירים או התחייבות לתוצאה.</div>
  <div class="filters" role="group" aria-label="סינון לפי שירות">
    <button class="chip" type="button" data-filter="all" aria-pressed="true">הכול</button>
    ${services.filter((s) => projects.some((p) => p.service === s.slug)).map((s) => `<button class="chip" type="button" data-filter="${s.slug}" aria-pressed="false">${esc(s.title)}</button>`).join('')}
  </div>
  <p class="visually-hidden" id="gallery-count" role="status" aria-live="polite"></p>
  <div class="grid cols-3">${projects.map((p) => projectCard(p)).join('')}</div>
  <p style="margin-top:28px">עוד עבודות ברשתות: <a href="${esc(business.social.instagram)}" target="_blank" rel="noopener">Instagram</a> · <a href="${esc(business.social.facebook)}" target="_blank" rel="noopener">Facebook</a> · <a href="${esc(business.social.tiktok)}" target="_blank" rel="noopener">TikTok</a></p>
  <p>העסק מציין גם עבודה על אופנועים וכלי שיט.</p>
  <dialog class="lightbox" id="lightbox" aria-label="תצוגת תמונה מוגדלת"><div class="lb-inner"><div class="lb-media"></div><div class="lb-bar"><span class="lb-cap"></span><button class="btn btn-primary lb-close" type="button">סגירה</button></div></div></dialog>
</div></section>`,
});

// המלצות
add('/reviews/', {
  title: 'המלצות לקוחות',
  desc: 'המלצות לקוחות על Sharp N Shine מתוך עמוד העסק, וקישור להוספת ביקורת בגוגל.',
  body: `${pageHero([[null, 'המלצות']], 'המלצות לקוחות', 'ההמלצות להלן הן של לקוחות, והן כלולות בעמוד העסק הקיים.')}
<section class="block"><div class="wrap">
  <div class="grid cols-2">${testimonials.map(quoteCard).join('')}</div>
  <p class="callout">ההמלצות הועתקו מעמוד העסק הקיים ואינן מאומתות באופן עצמאי, ואין לראות בהן תאריך עדכני. ביקורות נוספות ניתן לראות ולהוסיף בגוגל.</p>
  <p><a class="btn btn-dark" href="${esc(business.googleReviewUrl)}" target="_blank" rel="noopener">כתיבת ביקורת בגוגל<span class="visually-hidden"> (נפתח בחלון חדש)</span></a></p>
</div></section>`,
});

// שאלות נפוצות
add('/faq/', {
  title: 'שאלות נפוצות',
  desc: 'תשובות לשאלות נפוצות על Sharp N Shine: תיאום ביקור, מחירים, משך טיפול, אופנועים וסירות וציפוי נאנו-קרמי.',
  body: `${pageHero([[null, 'שאלות נפוצות']], 'שאלות נפוצות')}
<section class="block"><div class="wrap" style="max-width:820px">
  ${faq.map((f) => `<details class="faq"><summary>${esc(f.q)}</summary><div class="ans"><p>${f.a}</p></div></details>`).join('')}
  <div class="callout"><strong>לא מצאתם תשובה?</strong> אנחנו זמינים בוואטסאפ ובטלפון.${ctaButtons()}</div>
</div></section>
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') } })) })}</script>`,
});

// יצירת קשר
add('/contact/', {
  title: 'יצירת קשר וקביעת תור',
  desc: 'צרו קשר עם Sharp N Shine בפתח תקווה: טלפון, וואטסאפ, אימייל, Waze וטופס פנייה. ביקור בסדנה בתיאום מראש בלבד.',
  schema: true,
  body: `${pageHero([[null, 'צור קשר']], 'יצירת קשר וקביעת תור', esc(business.appointmentNote) + '. אנא צרו קשר לפני ההגעה.')}
<section class="block"><div class="wrap split">
  <div>
    <h2>בקשת ייעוץ</h2>
    <form class="contact" id="contact-form" novalidate>
      <div id="error-summary" class="error-summary" role="alert"></div>
      <div class="field"><label for="f-name">שם מלא</label><input id="f-name" name="name" autocomplete="name" required aria-describedby="f-name-err"><div class="err" id="f-name-err"></div></div>
      <div class="field"><label for="f-phone">טלפון</label><input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required aria-describedby="f-phone-err"><div class="err" id="f-phone-err"></div></div>
      <div class="field"><label for="f-email">אימייל <span class="opt">(לא חובה)</span></label><input id="f-email" name="email" type="email" autocomplete="email" aria-describedby="f-email-err"><div class="err" id="f-email-err"></div></div>
      <div class="field"><label for="f-vehicle">יצרן, דגם ושנתון הרכב</label><input id="f-vehicle" name="vehicle" required aria-describedby="f-vehicle-err"><div class="err" id="f-vehicle-err"></div></div>
      <div class="field"><label for="f-service">השירות המבוקש</label>
        <select id="f-service" name="service" required aria-describedby="f-service-err"><option value="">בחירה…</option>${services.map((s) => `<option value="${s.slug}">${esc(s.title)}</option>`).join('')}<option value="unsure">לא בטוח/ה, אשמח להמלצה</option></select><div class="err" id="f-service-err"></div></div>
      <div class="field"><label for="f-message">פרטים נוספים <span class="opt">(לא חובה)</span></label><textarea id="f-message" name="message"></textarea></div>
      <div class="field"><div class="check"><input id="f-consent" name="consent" type="checkbox" required aria-describedby="f-consent-err"><label for="f-consent" style="font-weight:400">אני מסכים/ה שהפרטים ששלחתי ישמשו את העסק לחזור אליי בנוגע לפנייה. <a href="/privacy/">מדיניות פרטיות</a></label></div><div class="err" id="f-consent-err"></div></div>
      <div class="form-note">האתר אינו שומר את הפרטים בשרת. בלחיצה על השליחה ייפתח וואטסאפ (או טיוטת אימייל) עם הודעה מוכנה, והיא תישלח רק לאחר שתאשרו שם.</div>
      <div class="btn-row" style="margin:0"><button class="btn btn-wa" type="submit">המשך לוואטסאפ עם הודעה מוכנה</button><button class="btn btn-outline" type="button" id="send-email">שליחה באימייל</button></div>
      <div id="form-status" class="form-status" role="status" aria-live="polite"></div>
      <noscript><p class="callout">הטופס דורש JavaScript. ניתן לפנות ישירות: <a href="${telUrl}"><bdi>${business.phoneDisplay}</bdi></a> או <a href="${esc(whatsappUrl())}">וואטסאפ</a>.</p></noscript>
    </form>
  </div>
  <aside class="panel" aria-label="פרטי התקשרות">
    <h2>דרכי יצירת קשר</h2>
    <dl>
      <dt>טלפון</dt><dd><a href="${telUrl}"><bdi>${business.phoneDisplay}</bdi></a></dd>
      <dt>וואטסאפ</dt><dd><a href="${esc(whatsappUrl())}" target="_blank" rel="noopener">הודעה מוכנה לחזי</a></dd>
      <dt>אימייל</dt><dd><a href="${mailUrl}">${esc(business.email)}</a></dd>
      <dt>כתובת</dt><dd>${esc(business.address)}<br><a href="${esc(business.wazeUrl)}" target="_blank" rel="noopener">ניווט ב-Waze</a> · <a href="${esc(business.mapsUrl)}" target="_blank" rel="noopener">Google Maps</a></dd>
      <dt>שעות פעילות</dt><dd>${hoursList()}</dd>
      <dt>חשוב</dt><dd>${esc(business.appointmentNote)}.</dd>
    </dl>
  </aside>
</div></section>`,
});

// פרטיות
add('/privacy/', {
  title: 'מדיניות פרטיות',
  desc: 'מדיניות הפרטיות של אתר Sharp N Shine: אילו פרטים נאספים ובאילו אופנים.',
  body: `${pageHero([[null, 'מדיניות פרטיות']], 'מדיניות פרטיות')}
<section class="block"><div class="wrap" style="max-width:820px">
  <div class="callout"><strong>טיוטה לבדיקת בעל העסק ויועץ משפטי.</strong> הנוסח להלן תבנית ראשונית, לא נבדק משפטית, ואין בו כדי לקבוע עמידה בדרישות החוק. יש לעדכנו לפני פרסום סופי.</div>
  <h2>איזה מידע האתר אוסף?</h2>
  <p>האתר אינו שומר פרטים בשרת ואינו כולל כלי מעקב או פרסום של צד שלישי. פרטים שמוזנים בטופס יצירת הקשר (שם, טלפון, אימייל אופציונלי, פרטי הרכב והודעה) משמשים רק להכנת הודעה לוואטסאפ או לאימייל. ההודעה נשלחת רק לאחר שהגולש מאשר שליחה באפליקציה.</p>
  <h2>שימוש בפרטים</h2>
  <p>הפרטים שנשלחים לעסק משמשים למענה לפנייה ולתיאום טיפול.</p>
  <h2>שירותי צד שלישי</h2>
  <p>לחיצה על קישורי וואטסאפ, Waze, גוגל או הרשתות החברתיות מעבירה לשירותים חיצוניים הכפופים למדיניות הפרטיות שלהם.</p>
  <h2>פנייה בנושא פרטיות</h2>
  <p>לבקשות עיון, תיקון או מחיקה של מידע שנמסר לעסק: <a href="${mailUrl}">${esc(business.email)}</a> או <a href="${telUrl}"><bdi>${business.phoneDisplay}</bdi></a>.</p>
</div></section>`,
});

// נגישות
add('/accessibility/', {
  title: 'הצהרת נגישות',
  desc: 'הצהרת הנגישות של אתר Sharp N Shine ודרכים לדווח על בעיות נגישות.',
  body: `${pageHero([[null, 'הצהרת נגישות']], 'הצהרת נגישות')}
<section class="block"><div class="wrap" style="max-width:820px">
  <div class="callout"><strong>טיוטה לבדיקת בעל העסק.</strong> הנוסח אינו מהווה אישור של עמידה בתקן או בחוק, ויש לעדכנו לאחר בדיקת נגישות מקצועית.</div>
  <p>האתר נבנה מתוך כוונה להיות נגיש ושמיש עבור כמה שיותר אנשים, בהתאם להנחיות WCAG ברמת AA כיעד. בין השאר: מבנה כותרות סמנטי, ניווט מקלדת עם סימון מיקוד ברור, ניגודיות צבעים, טפסים עם תוויות והודעות שגיאה, טקסט חלופי לתמונות, כיבוד העדפת תנועה מופחתת ותמיכה במסכים קטנים.</p>
  <p>ייתכנו חלקים באתר שעדיין אינם נגישים במלואם. נתקלתם בבעיה או זקוקים לעזרה? פנו אלינו ב<a href="${mailUrl}">${esc(business.email)}</a> או בטלפון <a href="${telUrl}"><bdi>${business.phoneDisplay}</bdi></a>, ונשתדל לסייע.</p>
</div></section>`,
});

// ---------- כתיבה ----------
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const p of pages) {
  const out = p.path === '/' ? 'index.html' : join(p.path, 'index.html');
  write(out, layout(p));
}
write('404.html', layout({ path: '/404.html', title: 'העמוד לא נמצא', desc: 'העמוד שחיפשתם לא נמצא באתר Sharp N Shine. אפשר לחזור לעמוד הבית או ליצור קשר.', noindex: true,
  body: `${pageHero([], 'העמוד לא נמצא', 'ייתכן שהקישור שגוי או שהעמוד הוסר.')}<section class="block"><div class="wrap"><div class="btn-row"><a class="btn btn-dark" href="/">לעמוד הבית</a><a class="btn btn-outline" href="/services/">לשירותים</a><a class="btn btn-outline" href="/contact/">יצירת קשר</a></div></div></section>` }));
copyFileSync(join(root, 'src/styles.css'), join(dist, 'styles.css'));
copyFileSync(join(root, 'src/main.js'), join(dist, 'main.js'));
if (existsSync(join(root, 'assets'))) {
  const cp = (from, to) => { mkdirSync(to, { recursive: true }); for (const f of readdirSync(from, { withFileTypes: true })) { f.isDirectory() ? cp(join(from, f.name), join(to, f.name)) : copyFileSync(join(from, f.name), join(to, f.name)); } };
  cp(join(root, 'assets'), join(dist, 'assets'));
}
write('robots.txt', `User-agent: *\nAllow: /\n${SITE_URL ? `Sitemap: ${SITE_URL}/sitemap.xml\n` : ''}`);
if (SITE_URL) write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${SITE_URL}${p.path}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`נבנו ${pages.length} עמודים ל-${dist}${SITE_URL ? '' : ' (ללא SITE_URL: אין canonical/sitemap)'}`);
