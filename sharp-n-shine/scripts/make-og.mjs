// יצירת assets/og-image.png (1200x630) באמצעות Playwright. הרצה חד-פעמית: node scripts/make-og.mjs
import { createRequire } from 'node:module';
const require = createRequire('/node-tools/node_modules/');
const { chromium } = require('playwright');
const html = `<html dir="rtl"><body style="margin:0;width:1200px;height:630px;background:linear-gradient(160deg,#0f1215,#222a33);color:#fff;font-family:Segoe UI,Arial,sans-serif;display:flex;flex-direction:column;justify-content:center;padding:0 90px;box-sizing:border-box;position:relative;overflow:hidden">
<div style="position:absolute;inset:0;background:linear-gradient(115deg,transparent 55%,rgba(60,196,212,.16) 60%,transparent 66%)"></div>
<div style="direction:ltr;font-size:84px;font-weight:800;letter-spacing:.14em">SHARP <span style="color:#3cc4d4">N</span> SHINE</div>
<div style="font-size:44px;color:#c9cfd6;margin-top:18px">סדנת דיטיילינג מוסמכת ומקצועית · פתח תקווה</div>
<div style="font-size:30px;color:#3cc4d4;margin-top:34px">ביקור בתיאום מראש · 051-220-5703</div></body></html>`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html);
await p.screenshot({ path: new URL('../assets/og-image.png', import.meta.url).pathname });
await b.close();
