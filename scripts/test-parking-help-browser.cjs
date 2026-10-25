// Optional local browser QA: PLAYWRIGHT_MODULE=/absolute/path/to/playwright node scripts/test-parking-help-browser.cjs
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const qaDir = path.join(root, 'dist', 'qa');
fs.mkdirSync(qaDir, {recursive:true});
const base = process.env.GAME_URL || 'file://' + path.join(root, 'src/index.html');

(async () => {
 const launch = {headless:true};
 if (process.env.CHROMIUM_EXECUTABLE) launch.executablePath=process.env.CHROMIUM_EXECUTABLE;
 const browser = await chromium.launch(launch);
 try {
  for (const [width,height,reduced] of [[320,568,false],[390,844,false],[430,932,false],[320,568,true]]) {
   const context = await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:reduced?'reduce':'no-preference'});
   await context.addInitScript(() => {
    localStorage.setItem('parking-game.intro.v1','true');
    // Advance the real game explicitly so exact threshold and expiry checks are deterministic.
    window.requestAnimationFrame=()=>0;
   });
   const page = await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/app.js?*',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(root,'src/app.js'),'utf8').replace('  progress = cleanProgress(progress);','  window.__helpQA={game,update,draw,applyLevel,resetGame};\n  progress = cleanProgress(progress);')}));
   await page.goto(base);
   await page.locator('#startButton').click();
   await page.waitForFunction(()=>Array.from(document.images).every(image=>image.complete));
   await page.evaluate(()=>{const q=window.__helpQA;q.game.elapsed=q.game.timeLimit/2;q.update(0,0);q.draw();});
   assert.equal(await page.locator('#parkingHelpButton').count(),0,'hint button is removed');

   const geometry = await page.evaluate(()=>{
    const q=window.__helpQA,t=q.game.layout.parkingTarget;
    const m=document.querySelector('#mission').getBoundingClientRect();
    return {missionTop:m.top,missionBottom:m.bottom,missionHeight:m.height,playTop:q.game.layout.playTop,controlsTop:document.querySelector('#controls').getBoundingClientRect().top,clip:{x:Math.floor(t.cx-t.hx-4),y:Math.floor(t.cy-t.hy-4),width:Math.ceil(t.hx*2+8),height:Math.ceil(t.hy*2+8)}};
   });
   const normalBay=await page.screenshot({clip:geometry.clip});
   await page.evaluate(()=>{const q=window.__helpQA;q.game.elapsed+=.01;q.update(0,0);q.draw();});
   assert.equal(await page.locator('#parkingHelpCard').count(),0,'large card is removed');
   assert.equal(await page.locator('#mission').evaluate(el=>el.classList.contains('is-help')),true);
   const highlightedBay=await page.screenshot({clip:geometry.clip});
   assert(!normalBay.equals(highlightedBay),'the target bay visibly highlights');
   const suffix=width+(reduced?'-reduced':'');
   await page.screenshot({path:path.join(qaDir,'parking-help-auto-'+suffix+'.png')});
   const advice=await page.locator('#missionText').innerText();
   const after=await page.locator('#mission').boundingBox();
   assert.equal(after.y,geometry.missionTop);assert.equal(after.height,geometry.missionHeight,'short advice does not change header height');
   assert(after.y+after.height<=geometry.playTop,'advice stays above the playfield');
   await page.evaluate(()=>{const q=window.__helpQA;q.update(2.5,0);q.draw();});
   assert.equal(await page.evaluate(()=>window.__helpQA.game.parkingHelp.highlightLeft),0);
   assert.equal(await page.locator('#missionText').innerText(),advice);
   await page.evaluate(()=>window.__helpQA.update(2.5,0));
   assert.notEqual(await page.locator('#missionText').innerText(),advice,'original mission returns in five seconds');
   await page.evaluate(()=>{const q=window.__helpQA;q.update(1,0);});
   assert.equal(await page.evaluate(()=>window.__helpQA.game.parkingHelp.timeLeft),0,'advice does not repeat');
   await page.locator('#pauseButton').click();await page.evaluate(()=>window.__helpQA.update(0,0));
   assert.equal(await page.locator('#parkingHelpButton').count(),0,'hint button is removed');
   await page.locator('#continueButton').click();await page.evaluate(()=>window.__helpQA.update(0,0));
   assert.equal(await page.evaluate(()=>window.__helpQA.game.parkingHelp.timeLeft),0,'pause/resume does not repeat advice');
   // Verify every course's short advice fits the same single line on this viewport.
   for(let id=1;id<=16;id++){
    await page.evaluate(id=>{const q=window.__helpQA;q.applyLevel(id);q.resetGame(true);q.game.guide.active=false;q.game.elapsed=q.game.timeLimit*.6;q.update(0,0);},id);
    assert.equal(await page.evaluate(()=>window.__helpQA.game.parkingHelp.timeLeft),5,'course '+id+' automatically shows advice');
    const line=await page.locator('#mission').boundingBox();
    assert.equal(line.height,geometry.missionHeight,'course '+id+' keeps advice on one line');
   }
   assert.deepEqual(errors,[]);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   console.log(`PASS automatic help ${width}x${height}, reduced=${reduced}: automatic top line, visible bay highlight, expiry/no repeat, pause/resume, 16 courses, no button/card/reflow/errors`);
   await context.close();
  }
 } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
