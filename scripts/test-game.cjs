const assert = require('node:assert/strict');
const harness = require('./game-harness.cjs');
const t=harness();
const snapshot=l=>JSON.stringify({spawn:l.spawn,target:l.target,obstacles:l.obstacles,parked:l.parkedCars});
assert.equal(t.levels.length,16);
function checkBays(layout, label) {
 assert.equal(layout.decorBays.length,layout.parkedCars.length+1,label+' all parking bays marked');
 layout.decorBays.forEach(function (bay,index) {
  const b=t.makeObb(bay.cx,bay.cy,bay.halfLength*2,bay.halfWidth*2,bay.angle);
  b.points.forEach(function (point) {
   assert(point.x>=layout.bounds.left-.01&&point.x<=layout.bounds.right+.01&&point.y>=layout.bounds.top-.01&&point.y<=layout.bounds.bottom+.01,label+' bay stays within scene');
  });
  if(index===0)return;
  const car=layout.parkedCars[index-1];
  assert.equal(car.vehicle,t.game.vehicle,label+' neighboring vehicles match zone');
  assert(bay.halfLength*2>=car.length&&bay.halfWidth*2>=car.width,label+' vehicle fits marked bay');
  const carBox=t.makeObb(car.x,car.y,car.length*.97,car.width*.95,car.angle);
  layout.obstacles.forEach(function (obstacle) {
   assert(!t.obbOverlap(carBox,t.makeObb(obstacle.x,obstacle.y,obstacle.w,obstacle.h,obstacle.angle)),label+' parked vehicle does not overlap walls');
  });
 });
}

for(const size of [[390,844],[320,568],[430,932]]) {
 t.setSize(...size);
 for(const mission of t.levels){
  t.game.journey='campaign';t.applyLevel(mission.id);t.resetGame(false);
  assert.equal(t.game.timeLimit,mission.time,'release uses configured mission duration');
  const l=t.game.layout;
  checkBays(l,'mission '+mission.id+' @ '+size);
  assert(t.carFits(l.spawn.x,l.spawn.y,l.spawn.angle),`${mission.id} spawn @ ${size}`);
  assert(t.carFits(l.target.cx,l.target.cy,l.target.angle),`${mission.id} target @ ${size}`);
  const before=snapshot(l);t.resetGame(false);assert.equal(snapshot(t.game.layout),before,'fixed retry');
  Object.assign(t.game.car,{x:l.target.cx,y:l.target.cy,angle:l.target.angle,speed:0});t.refreshParkStatus();
  assert(t.game.park.inside&&t.game.park.aligned&&t.game.park.stopped,'full-size target fits');
  for (const degrees of [-13, -10.01, -10, -9.99, 9.99, 10, 10.01, 13]) {
   t.game.car.angle=l.target.angle+degrees*Math.PI/180;t.refreshParkStatus();
   assert.equal(t.game.park.aligned,Math.abs(degrees)<10,`mission ${mission.id} heading ${degrees} degrees @ ${size}`);
  }
  t.game.car.angle=l.target.angle;
  t.game.car.angle+=Math.PI;t.refreshParkStatus();assert(!t.game.park.aligned,'nose-in rejected');
 }
}
t.setSize(390,844);
for(const vehicle of Object.keys(t.vehicles))for(const mode of ['reverse','parallel'])for(const difficulty of ['easy','hard','hell'])for(let seed=1;seed<=40;seed++){
 t.game.journey='free';Object.assign(t.game,{vehicle,mode,difficulty});
 t.game.map={vehicle,mode,difficulty,levelId:null,seed};t.game.layout=t.projectMap(t.game.map);
 const l=t.game.layout;
 checkBays(l,vehicle+'/'+mode+'/'+difficulty+'/'+seed);
 assert(t.carFits(l.spawn.x,l.spawn.y,l.spawn.angle),`random spawn ${vehicle}/${mode}/${difficulty}/${seed}`);
 assert(t.carFits(l.target.cx,l.target.cy,l.target.angle),`random target ${vehicle}/${mode}/${difficulty}/${seed}`);
 t.game.stage='park';
 Object.assign(t.game.car,{x:l.target.cx,y:l.target.cy,angle:l.target.angle+Math.PI,speed:0});t.refreshParkStatus();
 assert(!t.game.park.aligned&&t.game.park.wrongDirection,'random opposite heading rejected');
 t.game.car.angle=l.target.angle-2*Math.PI;t.refreshParkStatus();
 assert(t.game.park.aligned&&!t.game.park.wrongDirection,'random canonical heading accepts angle wrap');
}
// Truck bays must allow the advertised angle plus small positioning errors,
// without putting the body through neighboring cars, walls or scene boundaries.
const truckMargins=harness();
let truckMarginCases=0;
function checkTruckMargins(label) {
 const l=truckMargins.game.layout,goal=l.parkingTarget,s=l.scale;
 truckMargins.game.stage='park';l.target=goal;
 for(const degrees of [-9.99,0,9.99])for(const along of [-2,0,2])for(const across of [-2,0,2]){
  const x=goal.cx+(goal.fx*along+goal.sx*across)*s;
  const y=goal.cy+(goal.fy*along+goal.sy*across)*s;
  const angle=goal.angle+degrees*Math.PI/180;
  Object.assign(truckMargins.game.car,{x,y,angle,speed:0});truckMargins.refreshParkStatus();
  const pose=`${label}: ${degrees} degrees, offset ${along}/${across}`;
  assert(truckMargins.game.park.inside&&truckMargins.game.park.aligned&&truckMargins.game.park.stopped,pose+' accepts full-body parking');
  assert(truckMargins.carFits(x,y,angle),pose+' clears physical obstacles');
  truckMarginCases++;
 }
}
for(const size of [[390,844],[320,568],[430,932]]){
 truckMargins.setSize(...size);
 for(const id of [13,14,15,16]){
  truckMargins.game.journey='campaign';truckMargins.applyLevel(id);truckMargins.resetGame(false);
  checkTruckMargins('mission '+id+' @ '+size);
 }
 for(const mode of ['reverse','parallel'])for(const difficulty of ['easy','hard','hell'])for(let seed=1;seed<=40;seed++){
  Object.assign(truckMargins.game,{journey:'free',vehicle:'truck',mode,difficulty});
  truckMargins.game.layout=truckMargins.projectMap({vehicle:'truck',mode,difficulty,levelId:null,seed});
  checkTruckMargins(`${mode}/${difficulty}/${seed} @ ${size}`);
 }
}
console.log(`PASS truck bay margins: ${truckMarginCases} poses, +/-9.99 degrees and +/-2 world units, all truck missions, free difficulties and viewports`);

// Advanced lessons require tighter placement; the alley cannot be won by holding reverse.
const advanced=harness();advanced.markIntroSeen();advanced.applyLevel(1);advanced.resetGame(false);
const introArea=advanced.game.layout.target.halfLength*advanced.game.layout.target.halfWidth;
for(const id of [5,6,7,8]){
 advanced.applyLevel(id);advanced.resetGame(false);
 const goal=advanced.game.layout.target;
 assert(goal.halfLength*goal.halfWidth<introArea*.75,'advanced bay tighter than introductory bay '+id);
}
advanced.applyLevel(7);advanced.resetGame(true);advanced.input.brake=true;
for(let i=0;i<900;i++)advanced.update(1/60,0);
assert.equal(advanced.game.state,'playing','alley requires steering, holding reverse is insufficient');
assert.equal(advanced.game.stableTime,0,'straight reversing cannot accumulate alley completion');
console.log('PASS advanced training: tighter bays and nontrivial alley entry');

// Boundary crossing validates the actual entry direction, not merely being in a bay.
t.game.journey='campaign';t.applyLevel(1);t.resetGame(false);
const l=t.game.layout, target=l.target;
function cross(speed,angle){
 t.game.reverseEntered=false;t.game.lastParkingOverlap=false;
 Object.assign(t.game.car,{x:target.cx,y:target.cy+target.halfLength+l.carLength*.35,angle,speed});
 t.updateMissionStage(1/60);return t.game.reverseEntered;
}
assert(cross(-20,target.angle),'rear-first entry accepted');
assert(!cross(20,target.angle),'forward entry rejected');
assert(!cross(-20,target.angle+Math.PI),'wrong heading rejected');
// Two-stage levels cannot finish at the first destination.
t.applyLevel(8);t.resetGame(true);t.game.guide.active=false;t.game.stage='park';t.game.reverseEntered=true;t.game.lastParkingOverlap=true;
Object.assign(t.game.car,{x:t.game.layout.target.cx,y:t.game.layout.target.cy,angle:t.game.layout.target.angle,speed:0});
for(let i=0;i<45;i++)t.updatePlaying(1/60);
assert.equal(t.game.stage,'exit');assert.equal(t.game.state,'playing');
Object.assign(t.game.car,{x:t.game.layout.exitTarget.cx,y:t.game.layout.exitTarget.cy,angle:0,speed:0});
for(let i=0;i<45;i++)t.updatePlaying(1/60);
assert.equal(t.game.state,'success');
t.applyLevel(16);t.resetGame(true);t.game.guide.active=false;
Object.assign(t.game.car,{x:t.game.layout.target.cx,y:t.game.layout.target.cy,angle:t.game.layout.target.angle,speed:0});
for(let i=0;i<60;i++)t.updatePlaying(1/60);
assert.equal(t.game.state,'playing');assert.equal(t.game.stage,'checkpoint');
Object.assign(t.game.car,{x:t.game.layout.checkpoint.cx,y:t.game.layout.checkpoint.cy});t.updateMissionStage(1/60);assert.equal(t.game.stage,'park');
assert.equal(t.rateRun(10,0,0,30),3);assert.equal(t.rateRun(40,0,0,30),2);assert.equal(t.rateRun(10,0,1,30),1);
t.setProgress({});assert.equal(t.unlockedLevel(),1);
t.commitRun({levelId:1,success:true,netTime:30,stars:1});assert.equal(t.unlockedLevel(),2);
t.commitRun({levelId:1,success:true,netTime:20,stars:3});assert.equal(t.getProgress()[1].bestStars,3);assert.equal(t.getProgress()[1].bestTime,20);
t.commitRun({levelId:2,success:false,netTime:100,stars:0});assert.equal(t.unlockedLevel(),2);
// Opposite headings never finish any parking stage, including the green exit.
const heading=harness();heading.markIntroSeen();
for(const mission of heading.levels){
 heading.applyLevel(mission.id);heading.resetGame(true);
 if(heading.game.stage==='checkpoint')heading.game.stage='park';
 heading.game.reverseEntered=true;heading.game.lastParkingOverlap=true;
 const goal=heading.game.layout.target;
 Object.assign(heading.game.car,{x:goal.cx,y:goal.cy,angle:goal.angle+Math.PI,speed:0});
 heading.game.stableTime=.65;heading.update(1/60,0);
 assert.equal(heading.game.state,'playing','reverse heading cannot finish mission '+mission.id);
 assert.equal(heading.game.stableTime,0,'invalid direction clears accumulated hold');
 assert(!heading.game.park.aligned&&heading.game.park.wrongDirection,'wrong direction distinguished from skew');
 assert.match(heading.elements.get('#missionText').textContent,/方向反了/,'persistent wrong-direction hint');
 assert.match(heading.elements.get('#toast').textContent,/车头应朝/,'warning gives required heading');
 heading.elements.get('#toast').textContent='already warned';heading.update(1/60,0);
 assert.equal(heading.elements.get('#toast').textContent,'already warned','same wrong attempt does not spam toast');
 heading.elements.get('#toast').textContent='方向反了！车头应朝正确方向';
 Object.assign(heading.game.car,{angle:goal.angle+2*Math.PI});
 heading.update(1/60,0);
 assert(!heading.game.park.wrongDirection&&!heading.game.wrongDirectionWarned,'correct heading clears warning');
 assert(heading.getToastTime()<=0,'correct heading dismisses direction toast');
 for(let i=0;i<45;i++)heading.updatePlaying(1/60);
 assert.equal(heading.game.state,mission.id===8?'playing':'success','correct heading completes mission '+mission.id);
 if(mission.id===8)assert.equal(heading.game.stage,'exit','first valid park advances to exit');
}
heading.applyLevel(8);heading.resetGame(true);heading.game.stage='exit';
heading.game.layout.target=heading.game.layout.exitTarget;
const exitGoal=heading.game.layout.target;
Object.assign(heading.game.car,{x:exitGoal.cx,y:exitGoal.cy,angle:exitGoal.angle+Math.PI,speed:0});
for(let i=0;i<90;i++)heading.update(1/60,0);
assert.equal(heading.game.state,'playing','opposite heading at green exit stays playing');
assert.equal(heading.game.park.aligned,false,'green exit enforces its specified heading');
assert.match(heading.elements.get('#missionText').textContent,/方向反了.*朝右/,'exit warns with correct direction');
heading.game.car.angle=exitGoal.angle+2*Math.PI;
for(let i=0;i<45;i++)heading.updatePlaying(1/60);
assert.equal(heading.game.state,'success','correct heading at green exit finishes');
console.log('PASS parking heading: all 16 missions, wrong/correct heading, hold reset, non-spam warning and green exit');

// Measure distinct turning radius, acceleration and coasting under identical controls.
const handling=[];
for(const id of [1,9,13]){
 t.game.journey='campaign';t.applyLevel(id);t.resetGame(true);t.game.guide.active=false;
 Object.assign(t.game.car,{x:t.game.layout.ox+195*t.game.layout.scale,y:t.game.layout.oy+240*t.game.layout.scale,angle:0,speed:0});
 t.input.gas=true;t.input.brake=false;t.input.steer=0;
 for(let i=0;i<30;i++)t.updatePlaying(1/60);
 const speed=t.game.car.speed/t.game.layout.scale;
 t.input.gas=false;t.game.car.speed=30*t.game.layout.scale;
 const x=t.game.car.x;for(let i=0;i<120;i++)t.updatePlaying(1/60);
 const coast=(t.game.car.x-x)/t.game.layout.scale;
 const v=t.vehicles[t.game.vehicle],radius=v.length*v.wheelbase/Math.tan(v.steer);
 handling.push({vehicle:t.game.vehicle,speed:Number(speed.toFixed(1)),coast:Number(coast.toFixed(1)),radius:Number(radius.toFixed(1))});
}
assert(handling[0].speed>handling[1].speed&&handling[1].speed>handling[2].speed);
assert(handling[0].coast<handling[1].coast&&handling[1].coast<handling[2].coast);
assert(handling[2].radius>handling[0].radius*2.5);
console.log('PASS 16 missions × 3 viewports, 720 random layouts, reverse entry, two-stage tasks, stars, unlocks, records');
console.table(handling);

const reloaded=harness(t.data);
assert.equal(reloaded.getProgress()[1].bestStars,3,'progress survives reload');
const intro=harness();intro.markIntroSeen();assert.equal(harness(intro.data).introSeen(),true,'intro survives JSON storage');
assert.equal(harness({'parking-game.sound.v1':JSON.stringify('0')}).readSoundPref(),false,'mute survives JSON storage');
assert.equal(harness({'parking-game.sound.v1':'0'}).readSoundPref(),false,'legacy mute survives');
console.log('PASS reload: progress, intro and both legacy / new sound preferences');
for (const hostname of ['127.0.0.1', 'localhost', '[::1]', '192.168.1.10', 'example.com']) {
 const preview = harness({}, hostname);
 for (let id = 1; id <= 16; id++) assert(preview.canPlayLevel(id), 'local mission available');
 assert.equal(Object.keys(preview.getProgress()).length, 0, 'preview does not fabricate records');
}
console.log('PASS design review: 16 missions available on all hosts, no fabricated records');

assert(harness({}, '', 'file:').canPlayLevel(16), 'file preview keeps all levels available');
assert(t.vehicles.van.length / t.vehicles.car.length > 1.7, 'van size progression');
assert(t.vehicles.truck.length / t.vehicles.car.length > 2.7, 'long truck keeps a clear progression from the car');
assert(t.vehicles.truck.length / t.vehicles.van.length >= 1.6, 'truck is substantially longer than the delivery van');
console.log('PASS larger vehicle dimensions and direct-file preview unlocks');

// Exercise the hint through actual driving, coasting, pause and restart transitions.
for (const id of [1,9,13]) {
 const hint=harness();hint.markIntroSeen();hint.applyLevel(id);hint.resetGame(true);
 const tick=frames=>{for(let i=0;i<frames;i++)hint.update(1/60,0);};
 assert(hint.shouldShowPlayerMarker(),'opening marker is visible');
 hint.input.gas=true;tick(5);
 assert(!hint.shouldShowPlayerMarker(),'movement dismisses opening marker');
 hint.input.gas=false;tick(1);
 assert(!hint.shouldShowPlayerMarker(),'coasting is not idle');
 for(let i=0;i<240&&Math.abs(hint.game.car.speed)>0;i++)tick(1);
 assert.equal(hint.game.car.speed,0,'car has stopped');
 tick(170);
 assert(!hint.shouldShowPlayerMarker(),'less than three idle seconds stays hidden');
 const idle=hint.game.playerMarker.idleTime;
 hint.pauseGame();tick(300);
 assert.equal(hint.game.playerMarker.idleTime,idle,'pause does not advance idle timer');
 assert(!hint.shouldShowPlayerMarker(),'pause hides the marker');
 hint.resumeGame();tick(12);
 assert(hint.shouldShowPlayerMarker(),'three active idle seconds show the reminder');
 hint.input.brake=true;tick(2);
 assert(!hint.shouldShowPlayerMarker(),'reverse driving dismisses reminder');
 hint.resetGame(true,true);
 assert(hint.shouldShowPlayerMarker(),'retry restores the opening marker');
 hint.game.guide.active=true;hint.game.playerMarker.introLeft=0;hint.finishGuide();
 assert(hint.shouldShowPlayerMarker(),'formal run after tutorial restores opening marker');
 hint.game.state='success';assert(!hint.shouldShowPlayerMarker(),'result hides marker');
 hint.game.state='playing';hint.game.car.destroyed=true;
 assert(!hint.shouldShowPlayerMarker(),'destroyed car has no marker');
}
console.log('PASS player hint: opening, moving, coasting, idle delay, pause, reverse, retry, tutorial and results for all vehicles');

// Periodic emphasis uses active, visible time and pauses with gameplay.
const bob=harness();bob.markIntroSeen();bob.applyLevel(1);bob.resetGame(true);
let pulses=0, lifting=false, maximumLift=0;
for(let frame=0;frame<480;frame++){
 bob.update(1/60,0);
 const lift=bob.playerMarkerLift(false);
 if(lift>.01&&!lifting)pulses++;
 lifting=lift>.01;maximumLift=Math.max(maximumLift,lift);
 assert.equal(bob.playerMarkerLift(true),0,'reduced motion keeps marker still');
}
assert.equal(pulses,2,'two gentle pulses in eight active seconds');
assert(maximumLift>2*bob.game.layout.scale&&maximumLift<=3*bob.game.layout.scale+.01,'bob remains subtle');
const bobClock=bob.game.playerMarker.bobTime;
bob.pauseGame();for(let i=0;i<240;i++)bob.update(1/60,0);
assert.equal(bob.game.playerMarker.bobTime,bobClock,'pause freezes bob phase');
bob.resumeGame();bob.input.gas=true;bob.update(1/60,0);
assert.equal(bob.game.playerMarker.bobTime,0,'driving resets bob phase');
bob.resetGame(true,true);assert.equal(bob.game.playerMarker.bobTime,0,'retry resets bob phase');
console.log('PASS player marker bob: periodic pulses, amplitude, pause, driving, retry and reduced motion');

// Real input handlers dismiss only the hand that the player has actually used.
const thumbs=harness();thumbs.markIntroSeen();thumbs.resetGame(false);
const thumbVisible=side=>!thumbs.elements.get('#'+side+'ThumbHint').hidden;
assert(!thumbVisible('left')&&!thumbVisible('right'),'ready screen hides thumb hints');
thumbs.resetGame(true);
assert(thumbVisible('left')&&thumbVisible('right'),'both hands appear on entering play');
thumbs.dispatch('#wheelPad','pointerdown',{pointerId:1,clientX:60,clientY:160});
assert(!thumbVisible('left')&&thumbVisible('right'),'steering touch dismisses only left hand');
thumbs.dispatch('#wheelPad','pointerup',{pointerId:1});
thumbs.resetGame(true);
assert(!thumbVisible('left')&&thumbVisible('right'),'retry keeps learned steering hidden');
thumbs.pauseGame();thumbs.update(0,0);
assert(!thumbVisible('left')&&!thumbVisible('right'),'pause hides hand hints');
thumbs.resumeGame();thumbs.update(0,0);
assert(!thumbVisible('left')&&thumbVisible('right'),'resume restores only unused hand');
thumbs.dispatch('#brake','pointerdown',{pointerId:2});
assert(!thumbVisible('left')&&!thumbVisible('right'),'reverse pedal also completes right hand');
thumbs.dispatch('#brake','pointerup',{pointerId:2});
thumbs.resetGame(true);
assert(!thumbVisible('left')&&!thumbVisible('right'),'learned hands stay hidden on another run');
const keyboardThumbs=harness();keyboardThumbs.markIntroSeen();keyboardThumbs.resetGame(true);
keyboardThumbs.dispatch('window','keydown',{key:'ArrowLeft'});
assert(keyboardThumbs.elements.get('#leftThumbHint').hidden&&!keyboardThumbs.elements.get('#rightThumbHint').hidden,'keyboard steering dismisses only left hand');
keyboardThumbs.dispatch('window','keydown',{key:'ArrowUp'});
assert(keyboardThumbs.elements.get('#rightThumbHint').hidden,'keyboard pedal dismisses right hand');
const freshThumbs=harness();freshThumbs.markIntroSeen();freshThumbs.resetGame(true);
assert(!freshThumbs.elements.get('#leftThumbHint').hidden&&!freshThumbs.elements.get('#rightThumbHint').hidden,'a fresh page visit teaches both hands again');
freshThumbs.game.state='success';freshThumbs.update(0,0);
assert(freshThumbs.elements.get('#leftThumbHint').hidden&&freshThumbs.elements.get('#rightThumbHint').hidden,'results hide both hand hints');
console.log('PASS thumb hints: independent pointer/keyboard dismissal, ready/pause/resume/results, retry and fresh visit');

// Half-time help appears automatically once per run, without covering the playfield.
const help=harness();help.markIntroSeen();
const helpActive=()=>help.game.parkingHelp.timeLeft>0;
function pastHalf(){help.game.elapsed=help.game.timeLimit/2+.01;help.update(0,0);}
for(const size of [[320,568],[390,844],[430,932]])for(const mission of help.levels){
 help.setSize(...size);help.applyLevel(mission.id);help.resetGame(true);
 assert(!helpActive()&&!help.game.parkingHelp.shown,'no opening reminder');
 help.game.elapsed=help.game.timeLimit/2;help.update(0,0);assert(!helpActive(),'exact half is too early');
 const pose=JSON.stringify(help.game.car),layout=help.game.layout;
 pastHalf();assert(helpActive()&&help.game.parkingHelp.shown,'over half automatically shows advice');
 const copy=help.elements.get('#missionText').textContent;
 assert(copy.length>=10&&copy.length<=20&&!copy.includes('\n'),'advice is a single short instruction');
 if(help.game.stage==='checkpoint')assert.match(copy,/绿色检查区/);
 assert.equal(help.game.parkingHelp.timeLeft,5);assert.equal(help.game.parkingHelp.highlightLeft,2.5);
 assert.equal(JSON.stringify(help.game.car),pose,'automatic advice leaves pose unchanged');assert.equal(help.game.layout,layout,'field is not reprojected');
 help.update(2.5,0);assert.equal(help.game.parkingHelp.highlightLeft,0);assert.equal(help.elements.get('#missionText').textContent,copy);
 help.update(2.5,0);assert(!helpActive(),'advice expires');assert.notEqual(help.elements.get('#missionText').textContent,copy,'mission text returns');
 help.update(1,0);assert(!helpActive(),'eligible condition does not retrigger expired advice');
 help.pauseGame();help.update(0,0);const elapsed=help.game.elapsed;help.update(1,0);assert.equal(help.game.elapsed,elapsed);
 help.resumeGame();help.update(0,0);assert(!helpActive(),'resume does not repeat an earlier reminder');
 help.resetGame(true);pastHalf();assert(helpActive(),'retry resets one-shot reminder');
 const bay=help.game.layout.parkingTarget;
 Object.assign(help.game.car,{x:bay.cx+bay.fx*(bay.halfLength+help.game.layout.carLength*.4),y:bay.cy+bay.fy*(bay.halfLength+help.game.layout.carLength*.4),angle:bay.angle,speed:0});
 help.update(0,0);assert(!help.game.park.inside&&!helpActive(),'partial contact clears advice before a full successful park');
 Object.assign(help.game.car,help.game.layout.spawn);help.update(0,0);assert(!helpActive(),'leaving bay does not repeat advice');
 for(const state of ['rescue','resuming','success','failed','ready','assessment']){
  help.game.state=state;help.game.resumeCountdown=3;help.game.failureFx={age:0,impacted:false};help.update(0,0);assert(!helpActive(),'inactive state hides advice '+state);
 }
}
help.applyLevel(1);help.resetGame(true);help.game.elapsed=help.game.timeLimit/2-2;help.game.penalty=2;
help.update(0,0);assert(!helpActive(),'penalties exactly at half do not trigger');
help.game.penalty+=.01;help.update(0,0);assert(helpActive(),'collision penalties count toward countdown half');
help.resetGame(true);help.game.guide.active=true;pastHalf();assert(!helpActive()&&!help.game.parkingHelp.shown,'tutorial cannot consume reminder');
help.game.guide.active=false;help.update(0,0);assert(helpActive(),'reminder remains available after tutorial');
help.resetGame(true);help.game.stage='exit';pastHalf();assert(!helpActive(),'exit stage needs no bay reminder');
for(const vehicle of Object.keys(help.vehicles))for(const mode of ['reverse','parallel']){
 help.game.journey='free';Object.assign(help.game,{vehicle,mode,difficulty:'hard'});help.resetGame(true);pastHalf();
 assert(helpActive(),'free challenge automatically offers advice');assert(help.elements.get('#missionText').textContent.length<=20);
}
help.game.journey='campaign';help.applyLevel(1);help.resetGame(true);
const bay=help.game.layout.parkingTarget;
Object.assign(help.game.car,{x:bay.cx+bay.fx*(bay.halfLength+help.game.layout.carLength*.6),y:bay.cy+bay.fy*(bay.halfLength+help.game.layout.carLength*.6),angle:bay.angle,speed:0});
pastHalf();assert.match(help.elements.get('#missionText').textContent,/车尾已对准/);
help.resetGame(true);Object.assign(help.game.car,{x:bay.cx+bay.fx*(bay.halfLength+help.game.layout.carLength*.6),y:bay.cy+bay.fy*(bay.halfLength+help.game.layout.carLength*.6),angle:bay.angle+Math.PI/2,speed:0});
pastHalf();assert.match(help.elements.get('#missionText').textContent,/先摆正车身.*车头应朝/);
help.applyLevel(16);help.resetGame(true);pastHalf();help.game.stage='park';help.update(0,0);
assert(!helpActive()&&help.game.parkingHelp.highlightLeft===0,'stage transition clears stale advice without repeating it');
help.applyLevel(1);help.resetGame(true);
const occupied=help.game.layout.parkingTarget;Object.assign(help.game.car,{x:occupied.cx,y:occupied.cy,angle:occupied.angle,speed:0});
pastHalf();assert(!helpActive()&&!help.game.parkingHelp.shown,'car already in bay does not consume automatic reminder');
Object.assign(help.game.car,help.game.layout.spawn);help.update(0,0);assert(helpActive(),'first eligible moment after leaving bay triggers reminder');
console.log('PASS automatic parking help: 16 missions × 3 viewports, strict half-time/penalties, short advice and highlight expiry, once per run, retry/contact/pause/stages and free challenges');

// Exercise the actual reminder transition, audio envelope, mute bus and cleanup.
for(const muted of [false,true]){
 const t=harness(muted?{'parking-game.sound.v1':'"0"'}:{}),nodes=[];
 function param(){return {value:0,events:[],setValueAtTime(v,at){this.events.push([v,at]);},exponentialRampToValueAtTime(v,at){this.events.push([v,at]);},linearRampToValueAtTime(v,at){this.events.push([v,at]);},cancelScheduledValues(){},setTargetAtTime(){}};}
 function node(){const n={frequency:param(),gain:param(),connect(to){this.to=to;return to;},disconnect(){this.disconnected=true;},start(at){this.started=at;},stop(at){this.stopped=at;}};nodes.push(n);return n;}
 let failVoice=false;
 t.sandbox.window.AudioContext=function(){Object.assign(this,{currentTime:0,state:'running',destination:{},createOscillator:()=>{if(failVoice)throw Error('audio unavailable');return node();},createGain:node,createBiquadFilter:node});};
 t.markIntroSeen();t.applyLevel(1);t.resetGame(true);t.initAudio();
 t.game.elapsed=t.game.timeLimit/2;t.update(0,0);
 const voices=()=>nodes.filter(n=>typeof n.stopped==='number');
 assert.equal(voices().length,0,'no chime at exact half');
 t.game.elapsed+=.01;t.update(0,0);
 assert.equal(voices().length,muted?0:2,'one short rising chime appears with the hint, respecting saved mute');
 assert(t.game.parkingHelp.timeLeft>0,'visual advice appears even while muted');
 if(!muted){
  const notes=voices();assert(notes[0].frequency.events[0][0]<notes[1].frequency.events[0][0],'chime rises in pitch');
  assert(notes.every(n=>n.type==='sine'&&n.stopped<=.33),'chime stays soft and short');
  assert(notes.every(n=>n.to.gain.events[0][0]===.001),'gain ramps in without a sharp click');
  t.dispatch('#soundToggle','click');assert.equal(notes[0].to.to.gain.events.slice(-1)[0][0],0,'mute silences an active chime');
  notes.forEach(n=>{n.onended();assert(n.disconnected&&n.to.disconnected,'ended chime releases both nodes');});
 }
 t.update(1,0);t.pauseGame();t.update(0,0);t.resumeGame();t.update(0,0);
 assert.equal(voices().length,muted?0:2,'hint duration and pause/resume cannot repeat the sound');
 if(!muted){
  t.dispatch('#soundToggle','click');t.resetGame(true);t.game.elapsed=t.game.timeLimit*.6;t.update(0,0);
  assert.equal(voices().length,4,'new run can chime once again');
  t.resetGame(true);failVoice=true;t.game.elapsed=t.game.timeLimit*.6;
  assert.doesNotThrow(()=>t.update(0,0));assert(t.game.parkingHelp.timeLeft>0,'synthesis failure preserves the visual hint');
 }
}
const silentHelp=harness();silentHelp.markIntroSeen();silentHelp.resetGame(true);silentHelp.initAudio();
silentHelp.game.elapsed=silentHelp.game.timeLimit*.6;silentHelp.update(0,0);
assert(silentHelp.game.parkingHelp.timeLeft>0,'devices without Web Audio still show the hint');
console.log('PASS parking hint chime: synchronized one-shot rising tone, short envelope, saved/live mute, pause/retry, node cleanup and unavailable/failed audio');
