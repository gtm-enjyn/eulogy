/* global process, console, setTimeout, innerWidth, innerHeight, document, getComputedStyle */
// Layout fit check: every key element must sit fully inside the viewport and the page must not scroll.
// Usage: node scripts/fitcheck.mjs [baseUrl]   (default http://localhost:4173)
// Needs a Chromium binary: CHROME_PATH or the one Remotion downloaded under video/node_modules/.remotion.
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const base = process.argv[2] || 'http://localhost:4173';
const exe = process.env.CHROME_PATH || resolve(here, '../../../video/node_modules/.remotion/chrome-headless-shell/mac-arm64/chrome-headless-shell-mac-arm64/chrome-headless-shell');
if (!existsSync(exe)) { console.error('No Chromium at', exe, '— set CHROME_PATH'); process.exit(2); }
const SIZES = [[1280, 800], [1440, 900]];
const SEL = 'button, h1, h2, .card, .panel, .caption, [data-fit]';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const measure = (page, label) => page.evaluate(({ sel, label }) => {
  const W = innerWidth, H = innerHeight; const out = [];
  for (const el of document.querySelectorAll(sel)) {
    const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
    if (r.bottom > H - 1 + 0.5 || r.right > W - 1 + 0.5 || r.top < -0.5 || r.left < -0.5) out.push(`${label} :: <${el.tagName.toLowerCase()} class="${el.className && typeof el.className === 'string' ? el.className.slice(0, 40) : ''}"> "${(el.textContent || '').trim().slice(0, 40)}" box=${Math.round(r.left)},${Math.round(r.top)}→${Math.round(r.right)},${Math.round(r.bottom)}`);
  }
  const sh = document.documentElement.scrollHeight; if (sh > H + 1) out.push(`${label} :: page scrolls (scrollHeight ${sh} > ${H})`);
  return out;
}, { sel: SEL, label });

const browser = await chromium.launch({ executablePath: exe, headless: true });
let total = 0;
for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage(); const viol = [];
  const check = async (label) => { const v = await measure(page, `${w}x${h} ${label}`); viol.push(...v); };
  await page.goto(`${base}/`, { waitUntil: 'networkidle' }); await sleep(1200); await check('landing');
  await page.goto(`${base}/face`, { waitUntil: 'networkidle' }); await sleep(1200); await check('face');
  await page.goto(`${base}/connect`, { waitUntil: 'networkidle' }); await sleep(900); await check('connect:sources');
  await page.getByText(/connect all/i).first().click(); await sleep(10500); await check('connect:analyze'); await sleep(13000); await check('connect:people');
  await page.getByText(/these are my people/i).first().click(); await sleep(1200); await check('voice:prefilled');
  await page.goto(`${base}/voice`, { waitUntil: 'networkidle' }); await sleep(800); await page.getByText(/use demo profile/i).first().click(); await sleep(800); await check('voice:demo');
  await page.goto(`${base}/simulate`, { waitUntil: 'networkidle' }); await sleep(6000); await check('simulate:6s'); await sleep(14000); await check('simulate:20s'); await sleep(14000); await check('simulate:34s'); await sleep(13500); await check('simulate:47s');
  await page.goto(`${base}/result`, { waitUntil: 'networkidle' }); await sleep(2500); await check('result:reveal'); await page.getByText(/show me the table/i).first().click(); await sleep(1500); await check('result:table:001');
  await page.getByText(/table full/i).first().click(); await sleep(1200); await check('result:table:212');
  await page.getByText(/how this was built/i).first().click(); await sleep(600); await check('result:drawer');
  console.log(`${w}x${h}: ${viol.length} violation(s)`); viol.forEach((v) => console.log('  ' + v)); total += viol.length;
  await ctx.close();
}
await browser.close();
process.exit(total ? 1 : 0);
