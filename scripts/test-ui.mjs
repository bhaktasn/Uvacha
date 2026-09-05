import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.UI_TEST_URL || 'http://127.0.0.1:3000';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(`${base}/?preview=1`, { waitUntil: 'networkidle' });
  assert.match(await page.locator('.prize-ribbon').innerText(), /Today’s cash prize: \$5/);
  await page.getByRole('button', { name: 'B · Creative brief' }).click();
  assert.match(await page.locator('h1').innerText(), /A fresh brief/);
  await page.locator('.hero-actions a').first().click();
  await page.waitForURL(/signup.*variant=b/);
  await page.getByLabel('Password', { exact: true }).fill('sample-password');
  await page.getByRole('button', { name: 'Show password' }).click();
  assert.equal(await page.locator('#password').getAttribute('type'), 'text');
  await page.screenshot({ path: '/tmp/uvacha-signup-b.png', fullPage: true });
  // Never create a real account during a UI check.
  await page.route('**/auth/v1/signup*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 'test', email: 'ui@example.com', identities: [] }, session: null }) }));
  await page.getByLabel('Email address').fill('ui@example.com');
  await page.getByRole('button', { name: 'Create account & continue' }).click();
  await page.getByRole('heading', { name: 'Check your inbox.' }).waitFor();
  await page.getByRole('button', { name: 'Use a different email' }).click();
  await page.goto(`${base}/login?variant=a&next=%2Fvideos`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/tmp/uvacha-login-a.png', fullPage: true });
  for (const path of ['/?variant=a', '/?variant=b', '/signup?variant=a', '/signup?variant=b', '/login?variant=b', '/admin']) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Mobile overflow: ${path}`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/admin`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '+ Add week' }).click();
  await page.getByLabel('Theme title').fill('The house is not empty');
  await page.getByLabel('Creative brief').fill('Make a horror short set in a haunted house. Let the house become a character.');
  assert.match(await page.locator('.schedule-preview').innerText(), /The house is not empty/);
  await page.screenshot({ path: '/tmp/uvacha-admin.png', fullPage: true });
  await page.getByRole('button', { name: 'Remove week' }).click();
  // Exercise persistence without changing the user's schedule.
  await page.getByRole('button', { name: 'Save schedule' }).click();
  await page.getByRole('status').filter({ hasText: 'Saved locally' }).waitFor();
  const forbidden = await page.request.put(`${base}/api/local-admin`, { data: {}, headers: { Origin: 'https://untrusted.example' } });
  assert.equal(forbidden.status(), 403);
  const invalid = await page.request.put(`${base}/api/local-admin`, { data: { defaultPrize: -1, prizes: {}, weeks: [] }, headers: { Origin: base } });
  assert.equal(invalid.status(), 400);
  const image = await page.request.get(`${base}/opengraph-image`);
  assert.equal(image.status(), 200);
  assert.match(image.headers()['content-type'], /image\/png/);
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  assert.match(await page.locator('meta[name="twitter:image"]').getAttribute('content'), /^https:\/\/www\.uvacha\.ai\/opengraph-image/);
  assert.deepEqual(errors, []);
  console.log('UI passed: variants, CTA routing, password visibility, mocked email confirmation, mobile layouts, admin preview/save, origin protection, invalid schedule rejection, social image and metadata.');
} finally { await browser.close(); }
