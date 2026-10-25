const assert = require('node:assert/strict');
const harness = require('./game-harness.cjs');
const noop = () => {};
const paint = new Proxy({ measureText: text => ({width:String(text).length*12}), createPattern: () => ({}), createLinearGradient: () => ({addColorStop:noop}) }, {get:(obj,key)=>key in obj ? obj[key] : noop});
const day = Date.parse('2026-10-25T04:00:00Z');
const key = 'parking-game.growth.v1';
const progressKey = 'parking-game.campaign.v2';
function fixture({status=0, initial={}, version=9510000, followResult=1, queryError=false, storageError=false}={}) {
 const native = {...initial}; const calls=[]; let pendingNote; let pendingFollow; let queryStatus=status;
 const api = {
  getStorage: o=>{if(storageError)o.fail(new Error('storage'));else o.success({data:native[o.key]||null});},
  setStorage: o=>{if(storageError)o.fail(new Error('storage'));else {native[o.key]=o.data;o.success({});}},
  getFollowStatus: o=>{calls.push('getFollowStatus');o.success({follow_status:queryError?-1:queryStatus});},
  followAuthor: o=>{calls.push('followAuthor');pendingFollow=o;if(followResult!==null)o.success({follow_status:followResult});},
  postNote: o=>{calls.push('postNote');pendingNote=o;},
  writeTempFile: o=>o.success({filePath:'local-test-image.png'}),
 };
 const t=harness({},'', 'https:',paint,{now:day,xhs:{launchOptions:{miniToolEnv:{buildVersion:version}},miniTool:api}});
 return {...t,native,calls,api, get note(){return pendingNote;}, get follow(){return pendingFollow;},setStatus:v=>{queryStatus=v;}};
}
function start(t,id=1) {t.markIntroSeen();t.game.journey='campaign';t.applyLevel(id);t.resetGame(true);}
function timeout(t) {t.game.elapsed=t.game.timeLimit;t.updatePlaying(1/60);}
async function ticks() {for(let i=0;i<12;i++)await Promise.resolve();}
(async()=>{
 const non=fixture();assert(!non.canPlayLevel(4),'neutral loading prevents bypass');
 await non.initializeStorage();
 for(let id=1;id<=16;id++)assert.equal(non.canPlayLevel(id),id%4!==0,'exactly four optional courses');
 assert.equal(non.nextPlayableLevel(3).id,5,'skip optional final');
 non.applyLevel(4);non.resetGame(false);assert.match(non.elements.get('#startButtonLabel').textContent,/关注作者/);
 non.resetGame(true);assert.equal(non.game.state,'ready','reset cannot bypass gate');
 await non.startGame();assert.equal(non.game.state,'playing');assert(non.canPlayLevel(16));assert.equal(non.calls.filter(x=>x==='followAuthor').length,1);
 const returning=fixture({initial:non.native});await returning.initializeStorage();assert(returning.canPlayLevel(16),'earned entitlement survives reload and unfollow');
 for(const status of [1,2]) {const fan=fixture({status});await fan.initializeStorage();for(let id=1;id<=16;id++)assert(fan.canPlayLevel(id));assert(!fan.calls.includes('followAuthor'),'followers / author never prompted');}
 const legacy=fixture({version:9500000});await legacy.initializeStorage();assert(legacy.canPlayLevel(16));assert(!legacy.calls.includes('getFollowStatus'));
 const cleared=fixture({initial:{[progressKey]:JSON.stringify({4:{clears:1,plays:1,bestStars:1,bestTime:60}})}});await cleared.initializeStorage();assert(cleared.canPlayLevel(4));assert(!cleared.canPlayLevel(8));
 const unknown=fixture({queryError:true});await unknown.initializeStorage();assert(!unknown.canPlayLevel(4));assert(unknown.canPlayLevel(5));unknown.applyLevel(4);unknown.resetGame(false);assert.match(unknown.elements.get('#startButtonLabel').textContent,/重新确认/);await unknown.startGame();assert(!unknown.calls.includes('followAuthor'));
 const cancel=fixture({followResult:null});await cancel.initializeStorage();cancel.applyLevel(4);cancel.resetGame(false);const attempt=cancel.startGame();await ticks();cancel.follow.fail({errCode:20002});await attempt;assert(!cancel.canPlayLevel(4));assert.equal(cancel.game.state,'ready');
 const negative=fixture({followResult:-1});await negative.initializeStorage();negative.applyLevel(4);negative.resetGame(false);await negative.startGame();assert(!negative.canPlayLevel(4));
 const throttled=fixture({followResult:null});await throttled.initializeStorage();throttled.applyLevel(4);throttled.resetGame(false);const request=throttled.startGame();await ticks();throttled.follow.fail({errCode:15404});await request;assert.match(throttled.elements.get('#toast').textContent,/上限/);
 console.log('PASS follow: neutral loading, 12+4 courses, skip route, followers/author, cancellation, -1, throttle, old clients, old clears and permanent reload entitlement');

 const t=fixture();await t.initializeStorage();start(t);t.input.gas=true;timeout(t);const pose={x:t.game.car.x,y:t.game.car.y,angle:t.game.car.angle};
 assert.equal(t.game.state,'rescue');assert.equal(t.game.car.destroyed,false);assert(!t.input.gas);assert.equal(t.dailyGrowth().offered,true);
 const frozen=t.game.elapsed;for(let i=0;i<300;i++)t.update(1/60,0);assert.equal(t.game.elapsed,frozen,'offer freezes time');
 const publishing=t.useOrShareRescue();await ticks();assert(t.note);assert.equal(t.dailyGrowth().earned,false,'opening editor never grants token');assert.equal(t.dailyGrowth().used,false);
 t.note.fail({errCode:20002});await publishing;assert.equal(t.dailyGrowth().earned,false);assert.equal(t.game.state,'rescue');
 const retry=t.useOrShareRescue();await ticks();const beforeCalls=t.calls.length;await t.useOrShareRescue();assert.equal(t.calls.length,beforeCalls,'double click does not open second editor');
 assert.equal(t.note.pageType,'photo_publish');assert(!('tags' in t.note),'only documented parameters');assert.match(t.note.content,/挑战还在继续/);
 t.note.success({errMsg:'postNote:ok'});t.note.success({errMsg:'postNote:ok'});await retry;
 assert.equal(t.dailyGrowth().earned,true);assert.equal(t.dailyGrowth().used,false);assert.equal(t.game.state,'rescue','return needs explicit resume click');
 await t.useOrShareRescue();assert.equal(t.game.state,'resuming');assert.equal(t.game.timeLeft,10);assert(t.dailyGrowth().used);assert.equal(t.game.rescueUsed,true);
 t.sandbox.document.hidden=true;for(let i=0;i<120;i++)t.update(1/60,0);assert.equal(t.game.resumeCountdown,3,'background freezes preparation');t.sandbox.document.hidden=false;
 for(let i=0;i<181;i++)t.update(1/60,0);assert.equal(t.game.state,'playing');assert(t.game.timeLeft>9.9);assert.deepEqual({x:t.game.car.x,y:t.game.car.y,angle:t.game.car.angle},pose);
 t.game.elapsed=t.game.rescueDeadline;t.updatePlaying(1/60);assert.equal(t.game.state,'assessment','second timeout has no rescue loop');
 const used=fixture({initial:t.native});await used.initializeStorage();start(used);timeout(used);assert.equal(used.game.state,'assessment','daily quota survives app reload');
 used.setClock(Date.parse('2026-10-25T15:59:59Z'));assert(used.dailyGrowth().used);used.setClock(Date.parse('2026-10-25T16:00:00Z'));assert(!used.dailyGrowth().used);assert(!used.dailyGrowth().earned);start(used);timeout(used);assert.equal(used.game.state,'rescue','Beijing midnight refresh');
 console.log('PASS rescue: freeze, cancel/fail/retry, no editor-open reward, double click/callback, explicit consumption, 3-second/background pause, same pose, second timeout, reload and Beijing midnight');

 const result=fixture();await result.initializeStorage();start(result,8); // Gate 8 is unlocked below using real follow flow.
 result.setStatus(1);await result.refreshFollowStatus();start(result,8);result.game.stage='exit';result.game.layout.target=result.game.layout.exitTarget;result.game.hits=2;result.game.penalty=4;timeout(result);
 result.dispatch('#rescueDecline','click');assert.equal(result.game.state,'assessment');assert(!result.dailyGrowth().used);
 result.game.state='failed';result.showResult(false);assert.equal(result.getProgress()[8].plays,1);assert(!result.elements.get('#resultRescueButton').hidden);
 result.game.car.destroyed=true;result.game.layout.parkedCars.forEach(car=>{car.destroyed=true;});
 result.dispatch('#resultRescueButton','click');assert.equal(result.game.state,'rescue');assert(!result.game.car.destroyed);assert(result.game.layout.parkedCars.every(car=>!car.destroyed));assert.equal(result.game.stage,'exit');assert.equal(result.game.layout.target,result.game.layout.exitTarget);
 const note=result.useOrShareRescue();await ticks();result.note.success({errMsg:'postNote:ok'});await note;await result.useOrShareRescue();
 result.game.elapsed+=6;result.game.state='success';result.showResult(true);
 assert(result.game.lastRun.netTime>result.game.timeLimit,'actual time is never clamped');assert.equal(result.game.lastRun.bonusTime,10);assert.equal(result.game.lastRun.hits,2);assert.equal(result.getProgress()[8].plays,1,'rescue does not count one attempt twice');assert.equal(result.getProgress()[8].clears,1);assert.equal(result.game.lastRun.stars,1);assert.match(result.shareSummaryText(),/使用续时/);assert.equal(result.game.lastRun.beat,0,'no fabricated ranking');
 const beforeResize={...result.game.rescueSnapshot};
 result.setSize(320,568);result.game.layout=result.projectMap(result.game.map);result.restoreRescueScene();
 assert(Math.abs((result.game.car.x-result.game.layout.ox)/result.game.layout.scale-beforeResize.u)<.01,'rescue pose survives viewport change');
 assert(Math.abs((result.game.car.y-result.game.layout.oy)/result.game.layout.scale-beforeResize.v)<.01,'rescue y survives viewport change');
 const bank=fixture();await bank.initializeStorage();start(bank);bank.game.elapsed=30;bank.game.state='success';bank.showResult(true);const bankPublish=bank.postShareNote();await ticks();assert(!bank.dailyGrowth().earned);bank.note.success({});await bankPublish;assert(bank.dailyGrowth().earned);assert(!bank.dailyGrowth().used);start(bank);timeout(bank);assert.match(bank.elements.get('#rescueAction').textContent,/使用续时/);await bank.useOrShareRescue();assert.equal(bank.calls.filter(x=>x==='postNote').length,1,'banked token does not ask to share again');
 const declined=fixture();await declined.initializeStorage();start(declined);timeout(declined);declined.dispatch('#rescueDecline','click');start(declined);timeout(declined);assert.equal(declined.game.state,'assessment','declining suppresses later automatic offers that day');declined.game.state='failed';declined.showResult(false);assert(!declined.elements.get('#resultRescueButton').hidden,'manual rescue remains available');
 const failedStore=fixture({storageError:true});await failedStore.initializeStorage();start(failedStore);timeout(failedStore);assert.equal(failedStore.game.state,'rescue');
 const offline=harness();await offline.initializeStorage();start(offline);timeout(offline);assert.equal(offline.game.state,'assessment','no fake rewards in browser / unsupported SDK');
 for(const [vehicle,difficulty,expected] of [['car','easy',10],['car','hard',5],['car','hell',5],['van','hard',5],['truck','hard',10],['truck','hell',5]]) {bank.game.journey='free';Object.assign(bank.game,{vehicle,difficulty});bank.resetGame(true);assert.equal(bank.rescueSeconds(),expected);}
 console.log('PASS complete result loop: decline, intact scene restoration, exit stage/penalties, truthful time/stars/card, single play count, early-share banking, manual rescue, storage failure, unsupported SDK and vehicle/difficulty durations');
})().catch(err=>{console.error(err);process.exitCode=1;});
