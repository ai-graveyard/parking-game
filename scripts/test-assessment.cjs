const assert = require('node:assert/strict');
const harness = require('./game-harness.cjs');

let cases = 0;
for (const level of Array.from({length:16}, (_, i) => i + 1)) {
 for (const size of [[320,568],[390,844],[430,932]]) {
  const t = harness(); t.setSize(...size); t.markIntroSeen(); t.applyLevel(level); t.resetGame(true);
  const pose = {...t.game.car};
  const snapshot = JSON.stringify({map:t.game.map,neighbors:t.game.layout.parkedCars,obstacles:t.game.layout.obstacles});
  const tankX = t.game.tank.x;
  t.input.gas = true; t.input.steer = .8; t.game.elapsed = t.game.timeLimit;
  t.updatePlaying(0);
  assert.equal(t.game.state, 'assessment');
  assert.equal(t.game.timeLeft, 0); assert.equal(t.game.car.speed, 0);
  assert(!t.input.gas); assert.equal(t.input.steer, 0);
  assert(t.elements.get('#controls').classList.contains('is-disabled'));
  assert.equal(JSON.stringify({map:t.game.map,neighbors:t.game.layout.parkedCars,obstacles:t.game.layout.obstacles}), snapshot, 'timeout preserves all geometry and vehicles');
  assert(Math.abs(t.game.car.x-pose.x)<1e-8 && Math.abs(t.game.car.y-pose.y)<1e-8 && Math.abs(t.game.car.angle-pose.angle)<1e-8);
  t.update(.6, 600); assert(t.game.failureFx.impacted); assert(t.game.car.destroyed);
  assert(!t.elements.get('#resultOverlay').classList.contains('is-visible'), 'weight lands before the result');
  const age = t.game.failureFx.age;
  t.sandbox.document.hidden = true; t.update(1, 1300); assert.equal(t.game.failureFx.age, age, 'background freezes the weight');
  t.sandbox.document.hidden = false;
  t.updateAssessment(2.3 - t.game.failureFx.age + t.game.failureFx.hitStop);
  assert.equal(t.assessmentPose(t.game.failureFx.age,false).sealAlpha,1);
  assert(Math.abs(t.assessmentPose(t.game.failureFx.age,false).sealScale-1)<1e-8);
  t.updateAssessment(2.99);
  assert.equal(t.game.state,'assessment','keep the settled verdict visible for a full three seconds');
  assert(!t.elements.get('#resultOverlay').classList.contains('is-visible'),'no early result popup during the verdict hold');
  while(t.game.state === 'assessment') t.update(1/60, 1400);
  assert.equal(t.game.state, 'failed'); assert(t.elements.get('#resultOverlay').classList.contains('is-visible'));
  assert.equal(t.game.tank.x, tankX, 'ordinary failure never advances the tank');
  assert(t.game.car.destroyed); assert.equal(t.game.car.wreck,null); assert(t.game.layout.parkedCars.every(p => !p.wreck), 'only the player becomes a pancake');
  assert.match(t.elements.get('#resultKicker').textContent, /考核不通过/);
  assert.match(t.shareSummaryText(), /考核不通过/); assert(!/坦克|这条路/.test(t.shareSummaryText()));
  assert.equal(t.getProgress()[level].plays, 1);
  for(let i=0;i<5;i++)t.update(1,2000);
  assert.equal(t.getProgress()[level].plays, 1, 'failed idle does not duplicate records');
  const fx = t.game.failureFx; t.resize(); assert.equal(t.game.failureFx, fx, 'resize retains the same weight');
  t.resetGame(true); assert.equal(t.game.failureFx, null); assert(!t.game.car.destroyed);
  t.failAssessment(); t.updateAssessment(.1); t.resetGame(true); t.update(6,6000);
  assert.equal(t.game.state, 'playing', 'retry cannot receive a stale failure callback');
  cases++;
 }
}
const t = harness();
for(const age of [0,.3,.58,.8,1.4,2.75]) {
 const pose = t.assessmentPose(age,true);
 assert.equal(pose.bodyX,1); assert.equal(pose.bodyY,1); assert.equal(pose.pancakeX,1); assert.equal(pose.pancakeY,1); assert.equal(pose.lift,0); assert.equal(pose.shake,0); assert.equal(pose.toolAlpha,0);
}
const slam = t.assessmentPose(.58,false), held=t.assessmentPose(1.10,false), reveal=t.assessmentPose(1.65,false);
assert(slam.pancakeX >= .8 && slam.pancakeY >= .35 && slam.pancakeY < .4, 'compressed sprite starts under the iron sole');
assert.equal(slam.toolX,1);assert.equal(slam.toolY,1);assert(slam.impact>0,'rigid iron lands with an impact ring');
assert.equal(held.lift,0,'heavy weight remains down before lifting');
assert(reveal.lift>0 && reveal.pancakeY>.95 && reveal.pancakeY<1.1,'lift reveals a small vehicle rebound');
assert.equal(t.assessmentPose(2.3,false).toolAlpha,0,'weight clears before the verdict/result');
assert(t.assessmentPose(2.3,false).sealAlpha>.99);
const freeze=harness();freeze.markIntroSeen();freeze.applyLevel(1);freeze.resetGame(true);freeze.failAssessment();
freeze.updateAssessment(.58);freeze.updateAssessment(.04);assert.equal(freeze.game.failureFx.age,.58);
freeze.updateAssessment(.04);assert.equal(freeze.game.failureFx.age,.58, 'one short hit stop');
freeze.updateAssessment(.04);assert(freeze.game.failureFx.age>.58, 'animation resumes after the impact hold');
let maxShake=0;
for(let age=.58;age<5.3;age+=.005){const p=t.assessmentPose(age,false);maxShake=Math.max(maxShake,Math.abs(p.shake));assert(p.pancakeY>=.35 && p.pancakeY<1.1);assert.equal(p.toolX,1);assert.equal(p.toolY,1);}
assert(maxShake>7 && maxShake<10);assert.equal(t.assessmentPose(1,false).shake,0, 'strong shake has a short tail');

for(const reducedMotion of [false,true]) {
 const q=harness({},'', 'https:', null, {reducedMotion});
 q.markIntroSeen();q.applyLevel(1);q.resetGame(true);q.failAssessment();
 q.updateAssessment(.58);
 const verdictAt=reducedMotion ? .58 : 2.3;
 q.updateAssessment(verdictAt-q.game.failureFx.age+q.game.failureFx.hitStop);
 q.update(2.99,0);assert.equal(q.game.state,'assessment','three-second hold in both motion modes');
 const age=q.game.failureFx.age;q.sandbox.document.hidden=true;q.update(5,0);
 assert.equal(q.game.failureFx.age,age,'background does not consume the verdict hold');
 q.sandbox.document.hidden=false;q.update(.02,0);
 assert.equal(q.game.state,'failed');assert.equal(q.getProgress()[1].plays,1);
}

for (const muted of [false, true]) {
 const nodes=[], t=harness(muted?{'parking-game.sound.v1':'"0"'}:{});
 function param(){return {value:0,events:[],setValueAtTime(v){this.events.push(v);},exponentialRampToValueAtTime(v){this.events.push(v);},linearRampToValueAtTime(v){this.events.push(v);},cancelScheduledValues(){},setTargetAtTime(){}};}
 function node(){const n={frequency:param(),gain:param(),connect(to){this.to=to;return to;},disconnect(){this.disconnected=true;},start(at){this.started=at;},stop(at){this.stopped=at;}};nodes.push(n);return n;}
 t.sandbox.window.AudioContext=function(){Object.assign(this,{currentTime:0,state:'running',destination:{},createOscillator:node,createGain:node,createBiquadFilter:node});};
 t.markIntroSeen();t.applyLevel(1);t.resetGame(true);t.initAudio();t.failAssessment();
 const before=nodes.length;t.updateAssessment(.58);const voices=nodes.slice(before).filter(n=>n.type==='sine'||n.type==='triangle');
 assert.equal(voices.length,muted?0:3,'one layered thump, crack and iron ring, respecting mute');
 const count=nodes.length;t.updateAssessment(.2);assert.equal(nodes.length,count,'impact audio triggers once');
 for(const voice of voices){assert(voice.stopped-voice.started<.4);voice.onended();assert(voice.disconnected&&voice.to.disconnected);}
 if(!muted){assert(voices.some(v=>v.to.gain.events.some(e=>e>=.17)), 'audible low-frequency impact');const ring=voices.find(v=>v.frequency.events.length===4);assert(ring && ring.frequency.events.every((value,i,all)=>i===0||value<all[i-1]), 'iron ring decays in pitch without a rubber squeak');}
 if(!muted){t.dispatch('#soundToggle','click');assert.equal(voices[0].to.to.gain.events.at(-1),0,'mute silences active iron audio');}
}
console.log(`PASS assessment: ${cases} mission/viewport cases, player pancake/intact neighbors, one result, background freeze, resize/retry, reduced motion, single impact sound, mute and audio cleanup`);

// Verify the actual effect renderer selects each vehicle's own sprite, retains
// heading and uniform aspect ratio, and sizes the rigid weight to cover it.
for(const type of ['car','van','truck']) for(const angle of [0,Math.PI/2,Math.PI/4]) {
 const draws=[],rotations=[];
 const context=new Proxy({drawImage(...args){draws.push(args);},rotate(a){rotations.push(a);}}, {get(target,key){return key in target?target[key]:function(){};}});
 const q=harness({},'', 'https:',context);q.markIntroSeen();q.applyLevel(1);q.resetGame(true);
 q.game.vehicle=type;q.game.layout.carLength=q.vehicles[type].length*q.game.layout.scale;q.game.layout.carWidth=q.vehicles[type].width*q.game.layout.scale;q.game.car.angle=angle;
 q.failAssessment();q.updateAssessment(.58);q.updateAssessment(1);
 for(const [name,art] of Object.entries(q.assessmentArt)){art.image={name,complete:true,naturalWidth:1000,naturalHeight:1000*art.ratio};assert(require('node:fs').existsSync(require('node:path').resolve(__dirname,'../src',art.src)));}
 q.drawAssessmentPancake();
 assert.equal(draws[0][0].name,type,'player keeps its vehicle type after crushing');
 assert(Math.abs(draws[0][4]/draws[0][3]-q.assessmentArt[type].ratio)<1e-8,'no settled sprite stretching');
 assert(rotations.includes(angle),'flattened sprite follows player heading');
 const footprint=q.assessmentFootprint();
 q.drawAssessmentWeight(q.assessmentPose(.58,false));
 const weight=draws.find(d=>d[0].name==='weight');assert(weight,'draws the local iron sprite');
 assert(weight[3]>footprint.extentX && weight[3]>footprint.extentY,'weight covers the rotated vehicle');
 assert(Math.abs(weight[4]/weight[3]-q.assessmentArt.weight.ratio)<1e-8,'iron sprite stays rigid and uniformly scaled');
 // Missing effects do not interrupt state transitions or make the player disappear.
 draws.length=0;q.assessmentArt[type].image.complete=false;q.assessmentArt.weight.image.complete=false;
 q.vehicleArt[type].image={name:'original-'+type,complete:true,naturalWidth:1000,naturalHeight:400};
 q.drawAssessmentPancake();q.drawAssessmentWeight(q.assessmentPose(.58,false));
 assert(draws.some(d=>d[0].name==='original-'+type),'missing crushed sprite retains the original vehicle artwork');
}
console.log('PASS iron artwork: three vehicle types × three headings, matched PNGs, uniform scaling, rigid weight footprint and missing-asset fallback');
