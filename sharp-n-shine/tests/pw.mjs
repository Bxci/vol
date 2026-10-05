// טעינת Playwright: מקומי אם הותקן, אחרת מההתקנה הגלובלית
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = createRequire(join(execSync('npm root -g').toString().trim(), 'x.js'))('playwright'); }
export const chromium = pw.chromium;
