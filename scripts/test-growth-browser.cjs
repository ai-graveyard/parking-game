// Optional QA dependency: PLAYWRIGHT_MODULE=/absolute/path/to/playwright node scripts/test-growth-browser.cjs
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const qaDir=path.join(root,'dist','qa');
const base=process.env.GAME_URL || 'http://127.0.0.1:4173';
const fs=require('node:fs');const assert=require('node:assert/strict');
fs.mkdirSync(qaDir,{recursive:true});
(async()=>{
 const launch={headless:true};if(process.env.CHROMIUM_EXECUTABLE)launch.executablePath=process.env.CHROMIUM_EXECUTABLE;
 const browser=await chromium.launch(launch);
 const results=[];
 for(const [width,height] of [[390,844],[320,568],[430,932]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
  await context.addInitScript(()=>{
   localStorage.setItem('parking-game.intro.v1','true');
   window.mockFollow=0;window.mockNotes=[];window.mockCalls=[];
   window.xhs={launchOptions:{miniToolEnv:{buildVersion:9510000}},miniTool:{
    getStorage:o=>o.success({data:localStorage.getItem(o.key)}),setStorage:o=>{localStorage.setItem(o.key,o.data);o.success({});},
    getFollowStatus:o=>{window.mockCalls.push('status');setTimeout(()=>o.success({follow_status:window.mockFollow}),80);},
    followAuthor:o=>{window.mockCalls.push('follow');window.mockFollow=1;o.success({follow_status:1});},
    writeTempFile:o=>{window.mockImage=o.data;o.success({filePath:'local-qa-image.png'});},
    postNote:o=>{window.mockNotes.push({title:o.title,content:o.content});window.mockPendingNote=o;}
   }};
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/app.js?*',async route=>{
   const source=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
   const patched=source.replace('  progress = cleanProgress(progress);','  window.__growthQA={game,input,timeout:handleTimeout,showResult,refreshFollowStatus,update};\n  progress = cleanProgress(progress);');
   await route.fulfill({contentType:'text/javascript',body:patched});
  });
  await page.goto(base);await page.waitForFunction(()=>document.querySelectorAll('.level-option').length===4 && !document.querySelector('.level-option:last-child').disabled);
  assert.equal(await page.locator('.level-option.is-locked').count(),1);
  await page.locator('[data-level="4"]').click();await page.screenshot({path:`${qaDir}/growth-lock-${width}.png`});
  await page.locator('#startButton').click();await page.waitForFunction(()=>window.__growthQA.game.state==='playing');
  assert.equal(await page.evaluate(()=>window.mockCalls.filter(x=>x==='follow').length),1);
  await page.evaluate(()=>{const q=window.__growthQA;q.game.guide.active=false;q.game.elapsed=q.game.timeLimit;q.game.timeLeft=0;q.timeout();});
  await page.locator('#rescueAction').waitFor({state:'visible'});
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#rescueOverlay')).opacity==='1' && getComputedStyle(document.querySelector('#startOverlay')).opacity==='0');
  await page.screenshot({path:`${qaDir}/growth-rescue-${width}.png`});
  const box=await page.locator('.rescue-card').boundingBox();assert(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,'rescue fits viewport');
  await page.locator('#rescueAction').click();await page.waitForFunction(()=>Boolean(window.mockPendingNote));
  assert.match(await page.evaluate(()=>window.mockNotes[0].content),/挑战还在继续/);
  const shot=await page.evaluate(()=>window.mockImage);fs.writeFileSync(`${qaDir}/growth-share-${width}.png`,Buffer.from(shot.split(',')[1],'base64'));
  await page.evaluate(()=>{window.mockPendingNote.fail({errCode:20002});window.mockPendingNote=null;});
  await page.waitForFunction(()=>!document.querySelector('#rescueAction').disabled);assert.match(await page.locator('#rescueStatus').innerText(),/机会未扣除/);
  await page.locator('#rescueAction').click();await page.waitForFunction(()=>Boolean(window.mockPendingNote));
  await page.evaluate(()=>window.mockPendingNote.success({errMsg:'postNote:ok'}));await page.waitForFunction(()=>document.querySelector('#rescueAction').textContent.includes('使用续时'));
  assert.equal(await page.evaluate(()=>window.__growthQA.game.state),'rescue');await page.locator('#rescueAction').click();
  await page.waitForFunction(()=>window.__growthQA.game.state==='playing');
  assert.equal(await page.evaluate(()=>window.__growthQA.game.bonusTime),10);
  await page.evaluate(()=>{const q=window.__growthQA;q.game.elapsed=q.game.rescueDeadline;q.timeout();});
  await page.waitForFunction(()=>window.__growthQA.game.state==='assessment');
  await page.reload();await page.waitForFunction(()=>window.mockCalls.includes('status'));
  await page.waitForFunction(()=>document.querySelectorAll('.level-option').length===4 && !document.querySelector('.level-option:last-child').disabled);
  assert.equal(await page.locator('.level-option.is-locked').count(),0,'permanent entitlement on reload');
  await page.locator('#startButton').click();if(await page.locator('#guideTip').isVisible())await page.locator('#guideSkip').click();
  await page.evaluate(()=>{const q=window.__growthQA;q.game.guide.active=false;q.game.elapsed=q.game.timeLimit;q.game.timeLeft=0;q.timeout();});
  assert.equal(await page.evaluate(()=>window.__growthQA.game.state),'assessment','used daily quota persisted');
  assert.deepEqual(errors,[]);results.push({width,height,follow:true,rescue:true,cancel:true,reload:true,errors:errors.length});await context.close();
 }
 const fanContext=await browser.newContext({viewport:{width:390,height:844}});
 await fanContext.addInitScript(()=>{window.xhs={launchOptions:{miniToolEnv:{buildVersion:9510000}},miniTool:{getFollowStatus:o=>o.success({follow_status:1}),followAuthor:()=>{throw Error('must not prompt');}}};});
 const fan=await fanContext.newPage();await fan.goto(base);await fan.waitForFunction(()=>document.querySelectorAll('.level-option').length===4&&!document.querySelector('.level-option:last-child').disabled);assert.equal(await fan.locator('.level-option.is-locked').count(),0);
 // Exercise assessment stamp completion, result rescue controls and a successful finish.
 const loopContext=await browser.newContext({viewport:{width:390,height:844}});
 await loopContext.addInitScript(()=>{
   localStorage.setItem('parking-game.intro.v1','true');
   window.xhs={launchOptions:{miniToolEnv:{buildVersion:9510000}},miniTool:{
     getStorage:o=>o.success({data:localStorage.getItem(o.key)}),setStorage:o=>{localStorage.setItem(o.key,o.data);o.success({});},
     getFollowStatus:o=>o.success({follow_status:1}),followAuthor:o=>o.success({follow_status:1}),
     writeTempFile:o=>o.success({filePath:'qa-local.png'}),postNote:o=>{window.pendingLoopNote=o;}
   }};
 });
 const loop=await loopContext.newPage();const loopErrors=[];loop.on('pageerror',e=>loopErrors.push(e.message));
 await loop.route('**/app.js?*',async route=>{
   const source=fs.readFileSync(path.join(root,'src/app.js'),'utf8');
   await route.fulfill({contentType:'text/javascript',body:source.replace('  progress = cleanProgress(progress);','  window.__growthQA={game,timeout:handleTimeout,update};\n  progress = cleanProgress(progress);')});
 });
 await loop.goto(base);await loop.waitForFunction(()=>!document.querySelector('.level-option:last-child').disabled);
 await loop.locator('#startButton').click();
 await loop.evaluate(()=>{const q=window.__growthQA;q.game.guide.active=false;q.game.elapsed=q.game.timeLimit;q.game.timeLeft=0;q.timeout();});
 await loop.locator('#rescueDecline').click();
 await loop.locator('#resultOverlay.is-visible').waitFor();
 assert(await loop.locator('#resultRescueButton').isVisible());
 await loop.locator('#resultRescueButton').click();await loop.locator('#rescueAction').click();
 await loop.waitForFunction(()=>Boolean(window.pendingLoopNote));await loop.evaluate(()=>window.pendingLoopNote.success({errMsg:'postNote:ok'}));
 await loop.waitForFunction(()=>document.querySelector('#rescueAction').textContent.includes('使用续时'));
 await loop.locator('#rescueAction').click();await loop.waitForFunction(()=>window.__growthQA.game.state==='playing');
 await loop.evaluate(()=>{const q=window.__growthQA;const t=q.game.layout.target;Object.assign(q.game.car,{x:t.cx,y:t.cy,angle:t.angle,speed:0});q.game.reverseEntered=true;q.game.lastParkingOverlap=true;});
 await loop.locator('#resultOverlay.is-visible').waitFor();
 assert.match(await loop.locator('#resultKicker').innerText(),/使用续时/);
 assert.match(await loop.locator('#resultTime').innerText(),/10[0-9]/,'continued run reports actual time');
 const recorded=await loop.evaluate(()=>JSON.parse(localStorage.getItem('parking-game.campaign.v2'))['1']);
 assert.equal(recorded.plays,1);assert.equal(recorded.clears,1);assert.deepEqual(loopErrors,[]);
 await loop.waitForFunction(()=>getComputedStyle(document.querySelector('#resultOverlay')).opacity==='1');
 await loop.screenshot({path:`${qaDir}/growth-result-390.png`});
 console.log(JSON.stringify({results,alreadyFollowed:'no locks or follow prompt',resultRescue:'assessment stamp -> result -> share -> restore -> success; one play, actual time'},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
