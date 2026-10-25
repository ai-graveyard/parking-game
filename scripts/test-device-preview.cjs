// Local workbench QA; run against scripts/preview_server.py.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const base=process.env.GAME_URL || 'http://127.0.0.1:4173';
(async()=>{
 const launch={headless:true};if(process.env.CHROMIUM_EXECUTABLE)launch.executablePath=process.env.CHROMIUM_EXECUTABLE;
 const browser=await chromium.launch(launch);
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/preview');
  const ready=()=>page.waitForFunction(()=>/块屏幕/.test(document.querySelector('#status').textContent));
  await ready();assert.equal(await page.locator('iframe').count(),4);
  for(const frame of page.frames().slice(1)){
   const geometry=await frame.evaluate(()=>({width:innerWidth,height:innerHeight,canvas:!!document.querySelector('canvas'),panel:document.querySelector('#localPreview').hidden}));
   assert([320,375,390,430].includes(geometry.width));assert(geometry.canvas);assert(geometry.panel);
   assert(await frame.locator('#pauseButton').isVisible());
   assert.equal(await frame.locator('#soundToggle').getAttribute('aria-pressed'),'false');
  }
  const first=page.frames()[1],second=page.frames()[2];
  await first.locator('#pauseButton').click();assert(await first.locator('#pauseOverlay').evaluate(el=>el.classList.contains('is-visible')));
  assert.equal(await second.locator('#pauseOverlay').evaluate(el=>el.classList.contains('is-visible')),false,'independent game state');
  await page.locator('#level').selectOption('16');await ready();
  for(const frame of page.frames().slice(1))assert.match(await frame.locator('#difficultyBadge').innerText(),/16 物流园终考/);
  await page.locator('#scene').selectOption('pause');await ready();
  for(const frame of page.frames().slice(1))assert(await frame.locator('#pauseOverlay').evaluate(el=>el.classList.contains('is-visible')));
  await page.locator('#scene').selectOption('select');await ready();
  for(const frame of page.frames().slice(1))assert(await frame.locator('#startOverlay').evaluate(el=>el.classList.contains('is-visible')));
  await page.locator('#safeArea').selectOption('59,34');await ready();
  for(const frame of page.frames().slice(1)){
   assert.equal(await frame.locator('#game').evaluate(el=>getComputedStyle(el).getPropertyValue('--game-safe-top')),'59px');
   assert.equal(await frame.locator('#game').evaluate(el=>getComputedStyle(el).getPropertyValue('--game-safe-bottom')),'34px');
  }
  await page.locator('.device-choice[data-device="android"]').click();await ready();
  await page.locator('.device-choice[data-device="android-large"]').click();await ready();assert.equal(await page.locator('iframe').count(),6);
  await page.locator('#scene').selectOption('play');await ready();
  for(const safe of ['0,0','44,34','59,34']){
   await page.locator('#safeArea').selectOption(safe);await ready();
   for(const frame of page.frames().slice(1)){
    const geometry=await frame.evaluate(()=>{
     const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,height:r.height};};
     return {wheel:rect('.wheel'),pad:rect('#wheelPad'),gas:rect('#gas'),brake:rect('#brake'),speed:rect('#speedMeter'),label:rect('.pedal-zone .control-label'),hint:rect('#rightThumbHint .thumb-hint-label'),brand:rect('.brand'),mission:rect('#mission'),height:innerHeight};
    });
    assert(geometry.label.right+4<=geometry.speed.x,'speed label clears the meter');
    assert(geometry.brake.bottom+5<=geometry.hint.y,'gesture copy clears pedal and shadow');
    assert(geometry.wheel.y>=geometry.pad.y&&geometry.wheel.bottom<=geometry.pad.bottom,'wheel fits touch area');
    assert(geometry.gas.height>=44&&geometry.brake.height>=44,'pedals retain touch target height');
    assert(geometry.hint.bottom<=geometry.height-Number(safe.split(',')[1]),'gesture copy stays inside safe area');
    assert(geometry.brand.bottom+4<=geometry.mission.y,'header lines have breathing room');
   }
  }
  await page.locator('#scene').selectOption('select');await ready();
  for(const frame of page.frames().slice(1)){
   const geometry=await frame.evaluate(()=>({button:document.querySelector('#startButton').getBoundingClientRect().bottom,height:innerHeight}));
   assert(geometry.button<=geometry.height-34,'campaign start button is visible above bottom safe area');
  }
  assert.equal(await page.locator('#screens').evaluate(el=>el.scrollWidth>el.clientWidth),false,'six devices wrap without clipping the last one');
  for(const scene of ['share-success','share-failed']){
   await page.locator('#scene').selectOption(scene);
   await page.waitForFunction(()=>/6 张分享图/.test(document.querySelector('#status').textContent));
   await page.waitForFunction(()=>Array.from(document.querySelectorAll('.share-card')).every(el=>el.complete&&el.naturalWidth===720));
   const images=await page.locator('.share-card').evaluateAll(els=>els.map(el=>({width:el.naturalWidth,height:el.naturalHeight,x:Number(el.dataset.scaleX),y:Number(el.dataset.scaleY)})));
   assert.equal(images.length,6);
   for(const image of images){assert.equal(image.width,720);assert.equal(image.height,960);assert(Math.abs(image.x-image.y)<1e-10,'share bitmap scales uniformly');}
   assert.equal(await page.locator('.share-download').count(),6);
  }
  await page.locator('#scene').selectOption('play');await ready();
  await page.locator('#zoom').fill('100');assert.equal(await page.locator('#zoomLabel').innerText(),'100%');
  const dimensions=await page.frames()[1].evaluate(()=>[innerWidth,innerHeight]);assert.deepEqual(dimensions,[320,568],'zoom leaves viewport dimensions unchanged');
  await page.locator('#autoFit').click();assert.equal(await page.locator('#zoomLabel').innerText(),'自动适应');
  await page.locator('#refresh').click();await ready();
  await page.locator('.device-choice[data-device="android"]').click();await ready();
  await page.locator('.device-choice[data-device="android-large"]').click();await ready();
  await page.locator('#level').selectOption('1');await ready();await page.locator('#scene').selectOption('play');await ready();
  await page.locator('#safeArea').selectOption('0,0');await ready();await page.waitForTimeout(450);
  const qa=path.join(__dirname,'../dist/qa');fs.mkdirSync(qa,{recursive:true});await page.screenshot({path:path.join(qa,'multi-screen-preview.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'workbench fits narrow screen');
  const normal=await browser.newPage();await normal.goto(base+'/');assert.equal(await normal.evaluate(()=>Boolean(window.ParkingLocalPreview)),false);
  const simulated=await browser.newPage();await simulated.goto(base+'/?simulate=1');assert(await simulated.locator('#localPreview').isVisible());
  const source=fs.readFileSync(path.join(__dirname,'../src/index.html'),'utf8');assert(!source.includes('iframe'));assert(!source.includes('__device_preview'));
  assert.deepEqual(errors,[]);
  console.log('PASS multi-screen preview: 4/6 real viewport sizes, independent play, 16th course, scenes, 18 safe-area layouts, non-overlapping controls, visible start buttons, zoom, refresh, mobile layout, ordinary preview and package isolation');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
