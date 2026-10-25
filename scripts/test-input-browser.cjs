// Development check of real browser pointer capture and simultaneous touch input.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const base = process.env.GAME_URL || 'http://127.0.0.1:4173';

(async () => {
  const launch = { headless: true };
  if (process.env.CHROMIUM_EXECUTABLE) launch.executablePath = process.env.CHROMIUM_EXECUTABLE;
  const browser = await chromium.launch(launch);
  try {
    for (const [width, height] of [[320, 568], [390, 844], [430, 932]]) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: true });
      await context.addInitScript(() => {
        localStorage.setItem('parking-game.intro.v1', 'true');
        localStorage.setItem('parking-game.sound.v1', '0');
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/app.js?*', route => {
        const source = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
        return route.fulfill({ contentType: 'text/javascript', body: source.replace(
          '  progress = cleanProgress(progress);',
          '  window.__inputQA = { input, game };\n  progress = cleanProgress(progress);'
        ) });
      });
      await page.goto(base);
      await page.locator('#startButton').click();
      await page.waitForFunction(() => window.__inputQA.game.state === 'playing');
      await page.waitForFunction(() => {
        const style = getComputedStyle(document.querySelector('#controls'));
        return style.opacity === '1' && style.transform === 'none' &&
          getComputedStyle(document.querySelector('#startOverlay')).visibility === 'hidden';
      });
      const wheel = await page.locator('#wheelPad').boundingBox();
      const gas = await page.locator('#gas').boundingBox();
      const x = wheel.x + wheel.width * .8, y = wheel.y + wheel.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(wheel.x + wheel.width / 2, wheel.y + wheel.height * .8);
      const heldSteer = await page.evaluate(() => window.__inputQA.input.steer);
      assert(heldSteer > .01, 'held pointer turns the wheel');
      await page.evaluate(() => {
        const input = window.__inputQA.input;
        document.querySelector('#wheelPad').releasePointerCapture(input.steerPointer);
      });
      await page.mouse.move(x, y);
      await page.waitForFunction(() => window.__inputQA.input.steerPointer === null);
      await page.waitForFunction(() => Math.abs(window.__inputQA.input.steer) < .001);
      await page.mouse.up();

      const client = await context.newCDPSession(page);
      const steer = { id: 1, x, y };
      const extra = { id: 2, x: x - 12, y: y + 12 };
      const pedal = { id: 3, x: gas.x + gas.width / 2, y: gas.y + gas.height / 2 };
      const touch = (type, touchPoints) => client.send('Input.dispatchTouchEvent', { type, touchPoints });
      await touch('touchStart', [steer]);
      const owner = await page.evaluate(() => window.__inputQA.input.steerPointer);
      await touch('touchStart', [steer, extra, pedal]);
      assert.equal(await page.evaluate(() => window.__inputQA.input.steerPointer), owner);
      assert.equal(await page.evaluate(() => window.__inputQA.input.gas), true);
      await touch('touchEnd', [extra]);
      assert.equal(await page.evaluate(() => window.__inputQA.input.steerPointer), owner);
      await touch('touchEnd', [steer]);
      assert.equal(await page.evaluate(() => window.__inputQA.input.steerPointer), null);
      assert.equal(await page.evaluate(() => window.__inputQA.input.gas), true);
      await touch('touchEnd', []);
      const pedalExtra = { id: 4, x: pedal.x + 8, y: pedal.y + 8 };
      await touch('touchStart', [pedal]);
      await touch('touchStart', [pedal, pedalExtra]);
      await touch('touchEnd', [pedalExtra]);
      assert.equal(await page.evaluate(() => window.__inputQA.input.gas), true);
      await touch('touchCancel', []);
      assert.equal(await page.evaluate(() => window.__inputQA.input.gas), false);
      assert.deepEqual(errors, []);
      console.log(`PASS browser input ${width}x${height}: real capture loss, auto-centering, extra fingers, independent wheel/pedal and touch cancellation`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
