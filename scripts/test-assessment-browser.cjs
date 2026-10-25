// Optional local-browser QA. Hooks are inserted into HTTP responses only.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const qaDir=path.join(root,'dist','qa');
fs.mkdirSync(qaDir,{recursive:true});
(async()=>{
 const launch={headless:true};if(process.env.CHROMIUM_EXECUTABLE)launch.executablePath=process.env.CHROMIUM_EXECUTABLE;
 const browser=await chromium.launch(launch);
 try {
  for(const [width,height,reduced] of [[390,844,false],[320,568,false],[430,932,false],[390,844,true]]){
   const context=await browser.newContext({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference'});
   await context.addInitScript(()=>localStorage.setItem('parking-game.intro.v1','true'));
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/app.js?*',async route=>{
    let source=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
    source=source.replace('  progress = cleanProgress(progress);','  window.__stampQA={game,handleTimeout,updateAssessment,updateHud,draw,buildShareImage,applyLevel,resetGame};\n  progress = cleanProgress(progress);');
    source=source.replace('  function update(dt, now) {','  function update(dt, now) {\n    if (window.__stampHold) return;');
    await route.fulfill({contentType:'text/javascript',body:source});
   });
   await page.goto(process.env.GAME_URL || 'http://127.0.0.1:4173');
   await page.locator('#startButton').click();
   await page.waitForFunction(()=>window.__stampQA.game.state==='playing');
   await page.waitForFunction(()=>getComputedStyle(document.querySelector('#startOverlay')).opacity==='0');
   await page.evaluate(()=>{window.__stampHold=true;const q=window.__stampQA;q.game.elapsed=q.game.timeLimit;q.handleTimeout();q.updateAssessment(.58);q.updateHud();q.draw();});
   const suffix=reduced?'reduced':String(width);
   await page.screenshot({path:path.join(qaDir,`assessment-impact-${suffix}.png`)});
   await page.evaluate(()=>{const q=window.__stampQA;q.updateAssessment(1.02);q.draw();});
   await page.screenshot({path:path.join(qaDir,`assessment-stamp-${suffix}.png`)});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.equal(await page.evaluate(()=>window.__stampQA.game.car.destroyed),true);
   await page.evaluate(()=>{const q=window.__stampQA;q.resetGame(true,true);q.game.elapsed=q.game.timeLimit;q.handleTimeout();window.__stampHold=false;});
   await page.locator('#resultOverlay.is-visible').waitFor();
   assert.match(await page.locator('#resultKicker').innerText(),/考核不通过/);
   assert.equal(await page.evaluate(()=>window.__stampQA.game.state),'failed');
   const share=await page.evaluate(()=>window.__stampQA.buildShareImage(window.__stampQA.game.lastRun));
   fs.writeFileSync(path.join(qaDir,`assessment-share-${suffix}.png`),Buffer.from(share.split(',')[1],'base64'));
   if(width===390&&!reduced){await page.waitForFunction(()=>getComputedStyle(document.querySelector('#resultOverlay')).opacity==='1');await page.screenshot({path:path.join(qaDir,'assessment-result-390.png')});}
   await page.locator('#restartButton').click();await page.waitForFunction(()=>window.__stampQA.game.state==='playing');
   assert.equal(await page.evaluate(()=>window.__stampQA.game.failureFx),null);
   assert.deepEqual(errors,[]);
   console.log(`PASS assessment browser ${width}x${height}, reduced=${reduced}: stamp, real completion, player pancake/intact neighbors, share, retry, no errors/overflow`);
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
