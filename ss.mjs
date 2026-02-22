import { chromium } from 'playwright';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://app.dailychexly.local.com:9002');
await page.waitForTimeout(3000);
const btn = page.getByText('Dev Login');
if (await btn.isVisible()) { await btn.click(); await page.waitForTimeout(5000); }
console.log('URL after login:', page.url());
await page.screenshot({ path: '/tmp/after-login.png' });

// Try navigating directly to checklist 1
await page.goto('http://app.dailychexly.local.com:9002/checklist/1');
await page.waitForTimeout(5000);
console.log('URL after nav:', page.url());
await page.screenshot({ path: '/tmp/cl-desktop.png' });

await browser.close();
console.log('Done');
