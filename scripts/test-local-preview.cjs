// Optional browser QA: GAME_URL=http://127.0.0.1:4173 PLAYWRIGHT_MODULE=/path/to/playwright node scripts/test-local-preview.cjs
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const qaDir=path.join(root,'dist','qa');
const base=process.env.GAME_URL || 'http://127.0.0.1:4173';
fs.mkdirSync(qaDir,{recursive:true});
(async()=>{
 const launch={headless:true};if(process.env.CHROMIUM_EXECUTABLE)launch.executablePath=process.env.CHROMIUM_EXECUTABLE;
 const browser=await chromium.launch(launch);
 try {
  for(const [width,height] of [[390,844],[320,568]]){
   const context=await browser.newContext({viewport:{width,height}});
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>localStorage.setItem('parking-game.campaign.v2',JSON.stringify({1:{clears:2,plays:2,bestStars:3,bestTime:20}})));
   await page.goto(base+'/?simulate=1');
   const ui=page.locator('#localPreview');
   await page.waitForFunction(()=>window.ParkingLocalPreview && window.ParkingLocalPreview.storage.getItem('parking-game.campaign.v2')!==null);
   await page.waitForFunction(()=>document.querySelectorAll('.level-option').length===4&&!document.querySelector('.level-option:last-child').disabled);
   assert.equal(await page.locator('.level-option.is-locked').count(),1);
   assert.match(await page.locator('#campaignProgress').innerText(),/^0 \/ 16/,'real progress not imported into simulation');
   await page.locator('[data-level="4"]').click();await page.locator('#startButton').click();
   await ui.locator('#dialog').waitFor({state:'visible'});assert.match(await ui.locator('#dialogTitle').innerText(),/模拟关注/);
   await ui.locator('#cancel').click();assert.match(await page.locator('#startButtonLabel').innerText(),/关注作者/);
   await page.locator('#startButton').click();await ui.locator('#confirm').click();
   await page.waitForFunction(()=>!document.querySelector('#startOverlay').classList.contains('is-visible'));
   await ui.locator('#toggle').click();await ui.locator('#timeout').click();
   await page.locator('#rescueAction').waitFor({state:'visible'});await page.locator('#rescueAction').click();
   await ui.locator('#dialog').waitFor({state:'visible'});assert.match(await ui.locator('#dialogTitle').innerText(),/模拟笔记/);
   assert(await ui.locator('#noteImage').isVisible());assert.match(await ui.locator('#noteText').inputValue(),/挑战还在继续/);
   const modal=await ui.locator('.dialog-card').boundingBox();assert(modal.x>=0&&modal.y>=0&&modal.x+modal.width<=width+1&&modal.y+modal.height<=height+1,'mock composer fits screen');
   if(width===390)await page.screenshot({path:path.join(qaDir,'local-preview-share.png')});
   await ui.locator('#fail').click();await page.waitForFunction(()=>!document.querySelector('#rescueAction').disabled);
   assert.match(await page.locator('#rescueStatus').innerText(),/机会未扣除/);
   await page.locator('#rescueAction').click();await ui.locator('#cancel').click();
   await page.waitForFunction(()=>!document.querySelector('#rescueAction').disabled);
   await page.locator('#rescueAction').click();await ui.locator('#confirm').click();
   await page.waitForFunction(()=>document.querySelector('#rescueAction').textContent.includes('使用续时'));
   assert(await page.locator('#rescueOverlay').isVisible());
   await page.locator('#rescueAction').click();await page.waitForFunction(()=>!document.querySelector('#rescueOverlay').classList.contains('is-visible'));
   assert(Number(await page.locator('#timer').innerText())<=10 && Number(await page.locator('#timer').innerText())>8);
   await ui.locator('#toggle').click();await ui.locator('#timeout').click();
   await page.locator('#resultOverlay.is-visible').waitFor();assert(await page.locator('#resultRescueButton').isHidden());
   await page.reload();await ui.locator('#toggle').click();await ui.locator('#summary').filter({hasText:'今日续时已使用'}).waitFor();
   await ui.locator('#resetDay').click();await ui.locator('#summary').filter({hasText:'今日尚未分享'}).waitFor();
   await ui.locator('#unfollowed').click();await page.waitForFunction(()=>document.querySelectorAll('.level-option.is-locked').length===1);
   assert.match(await page.locator('#startButtonLabel').innerText(),/关注作者/);
   if(width===390)await page.screenshot({path:path.join(qaDir,'local-preview-panel.png')});
   await ui.locator('#followed').click();await page.waitForFunction(()=>document.querySelectorAll('.level-option.is-locked').length===0);
   // Reset allowance then select a short free challenge: preview the five-second reward too.
   await ui.locator('#resetDay').click();await ui.locator('#toggle').click();await page.locator('[data-journey="free"]').click();await page.locator('.difficulty-option[data-difficulty="hell"]').click();
   await ui.locator('#toggle').click();await ui.locator('#timeout').click();await page.locator('#rescueAction').waitFor({state:'visible'});assert.match(await page.locator('#rescueAction').innerText(),/5 秒/);
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('parking-game.campaign.v2'))['1'].clears),2,'real save untouched');
   await page.goto(base+'/');assert.equal(await page.evaluate(()=>Boolean(window.xhs)),false,'ordinary mode has no fake SDK');
   assert.equal(await page.evaluate(()=>Boolean(window.ParkingLocalPreview)),false,'ordinary mode has no game hooks');assert.match(await ui.locator('#toggle').innerText(),/开启本地模拟/);
   assert.deepEqual(errors,[]);console.log(`PASS local preview ${width}x${height}: isolated save, lock, follow cancel/success, mock composer fail/cancel/success, explicit 10s resume, no second rescue, refresh persistence, daily reset, unfollowed/followed toggles, 5s difficulty, normal mode`);
   await context.close();
  }
  // Development response only: disk production files must not contain the panel or hooks.
  const html=fs.readFileSync(path.join(root,'src/index.html'),'utf8');const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
  assert(!html.includes('__local_preview'));assert(!app.includes('ParkingLocalPreview'));
  console.log('PASS packaging boundary: preview panel and state hooks are absent from shipping sources');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
