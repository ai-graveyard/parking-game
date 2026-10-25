const assert = require('node:assert/strict');
const harness = require('./game-harness.cjs');

// Measure final Canvas geometry in each vehicle's local coordinates.
function recorder() {
  let matrix=[1,0,0,1,0,0],stack=[],points=[];
  function point(x,y){assert(Number.isFinite(x)&&Number.isFinite(y));points.push([matrix[0]*x+matrix[2]*y+matrix[4],matrix[1]*x+matrix[3]*y+matrix[5]]);}
  const ctx={save(){stack.push(matrix.slice());},restore(){matrix=stack.pop();},
    translate(x,y){matrix[4]+=matrix[0]*x+matrix[2]*y;matrix[5]+=matrix[1]*x+matrix[3]*y;},
    rotate(a){const c=Math.cos(a),s=Math.sin(a),[aa,b,cc,d]=matrix;matrix[0]=aa*c+cc*s;matrix[1]=b*c+d*s;matrix[2]=-aa*s+cc*c;matrix[3]=-b*s+d*c;},
    scale(x,y){matrix[0]*=x;matrix[1]*=x;matrix[2]*=y;matrix[3]*=y;},
    moveTo:point,lineTo:point,quadraticCurveTo(a,b,c,d){point(a,b);point(c,d);},
    ellipse(x,y,rx,ry){for(let i=0;i<32;i++){const a=i*Math.PI/16;point(x+Math.cos(a)*rx,y+Math.sin(a)*ry);}},
    beginPath(){},closePath(){},fill(){},stroke(){},setTransform(){},
    reset(){points=[];matrix=[1,0,0,1,0,0];stack=[];},points(){return points;}};
  return ctx;
}

let cases=0;
for(const levelId of [1,9,13])for(const size of [[320,568],[390,844],[430,932]])for(const angle of [0,Math.PI/3,Math.PI/2]){
  const ctx=recorder(),t=harness({},'', 'https:',ctx);
  t.setSize(...size);t.markIntroSeen();t.applyLevel(levelId);t.resetGame(true);
  t.game.car.angle=angle;
  const scheduled=[];t.sandbox.window.setTimeout=(fn,delay)=>scheduled.push({fn,delay});
  const l=t.game.layout,car=t.game.car;
  t.summonTank();
  let firstProgress=null,lastProgress=0,sawIntermediate=false;
  for(let frame=0;frame<1000&&t.game.state==='tank';frame++){
    t.updateTank(1/60,frame*1000/60);
    if(!car.wreck){assert(!car.destroyed);continue;}
    assert(car.destroyed);
    if(firstProgress===null)firstProgress=car.wreck.progress;
    assert(car.wreck.progress>=lastProgress&&car.wreck.progress<=1,'monotonic squash');
    if(car.wreck.progress>.2&&car.wreck.progress<.8)sawIntermediate=true;
    lastProgress=car.wreck.progress;
  }
  assert.equal(t.game.state,'failed');assert(firstProgress<.12,'starts crushing at leading edge');assert(sawIntermediate,'crush has visible intermediate states');
  assert.equal(car.wreck.progress,1,'fully flattened after tank passes');
  assert(car.wreck.splatAge > .4,'splat finishes before the aftermath');
  assert(t.game.layout.parkedCars.length>0);
  assert(t.game.layout.parkedCars.every(p=>p.wreck&&p.wreck.progress===1),'all passed neighbors remain wrecks after failure');
  assert(scheduled.some(s=>s.delay===700),'aftermath remains visible before result');
  // Check the wreck around its own origin, independent of heading and viewport.
  const local={...car,x:0,y:0,angle:0};ctx.reset();
  t.drawCrushedCar(local,l.carLength,l.carWidth,t.vehicles[t.game.vehicle].color,t.game.vehicle);
  const points=ctx.points();assert(points.length>100,'chunky metal plates and wheels');
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const length=Math.max(...xs)-Math.min(...xs),width=Math.max(...ys)-Math.min(...ys);
  assert(length>=l.carLength*.95&&length<=l.carLength*1.12,'wreck retains original length');
  assert(width>=l.carWidth*.9&&width<=l.carWidth*1.2,'wreck retains original width');
  const before=JSON.stringify(points);ctx.reset();t.drawCrushedCar(local,l.carLength,l.carWidth,t.vehicles[t.game.vehicle].color,t.game.vehicle);
  assert.equal(JSON.stringify(ctx.points()),before,'settled debris never jitters');
  ctx.reset();t.drawParkedCars();assert(ctx.points().length>0,'failed-state neighbors keep drawing their wrecks');
  const oldWrecks=t.game.layout.parkedCars.map(p=>p.wreck);t.resize();
  assert(t.game.layout.parkedCars.every((p,i)=>p.wreck===oldWrecks[i]),'resize preserves wrecks');
  t.resetGame(true);assert(!t.game.car.destroyed);assert.equal(t.game.car.wreck,null);
  assert(t.game.layout.parkedCars.every(p=>!p.wreck),'retry restores fresh vehicles');
  cases++;
}
console.log(`PASS tank aftermath: ${cases} vehicle/viewport/heading cases, progressive crushing, body-sized stable wrecks, persistent neighbors, resize and retry`);

const poseTest=harness();
const before=poseTest.crushVisualState({progress:.15,splatAge:-1});
const slam=poseTest.crushVisualState({progress:.4,splatAge:.075});
const rebound=poseTest.crushVisualState({progress:.6,splatAge:.18});
const settled=poseTest.crushVisualState({progress:1,splatAge:.5});
assert.equal(before.pileAlpha,0);assert.equal(before.spriteAlpha,1);
assert(slam.spriteY<.2&&slam.spriteX>1.2,'original sprite visibly squashes sideways');
assert(slam.pileX>1.2&&slam.pileY<.7,'pile has an exaggerated impact squash');
assert(rebound.pileY>slam.pileY,'pile rebounds after the slam');
assert.equal(settled.pileX,1);assert.equal(settled.pileY,1);assert.equal(settled.spriteAlpha,0);

function audioRun(muted=false){
 const t=harness(muted?{'parking-game.sound.v1':'"0"'}:{}),nodes=[];
 function param(){return {value:0,events:[],setValueAtTime(v,time){this.events.push([v,time]);},exponentialRampToValueAtTime(v,time){this.events.push([v,time]);},linearRampToValueAtTime(v,time){this.events.push([v,time]);},cancelScheduledValues(){},setTargetAtTime(){}};}
 function node(kind){const n={kind,frequency:param(),gain:param(),Q:param(),connect(to){this.to=to;return to;},disconnect(){this.disconnected=true;},start(at){this.started=at;},stop(at){this.stopped=at;}};nodes.push(n);return n;}
 let ctx;
 t.sandbox.window.AudioContext=function(){ctx=this;Object.assign(this,{currentTime:0,sampleRate:22050,state:'running',destination:{},createOscillator:()=>node('osc'),createGain:()=>node('gain'),createBiquadFilter:()=>node('filter'),createBuffer:()=>({getChannelData:()=>new Float32Array(5000)}),createBufferSource:()=>node('noise')});};
 t.markIntroSeen();t.applyLevel(1);t.resetGame(true);t.initAudio();t.summonTank();
 let stoppedFrames=0,lastX=t.game.tank.x;
 for(let i=0;i<1000&&t.game.state==='tank';i++){
  ctx.currentTime=i/60;t.updateTank(1/60,i*1000/60);
  if(t.game.tank.x===lastX)stoppedFrames++;lastX=t.game.tank.x;
 }
 assert(stoppedFrames>=2&&stoppedFrames<=4,'one brief impact pause, then tank continues');
 const voices=nodes.filter(n=>n.type==='triangle');
 assert.equal(voices.length,muted?0:t.game.layout.parkedCars.length+1,'one splat per crushed vehicle, respecting mute');
 if(!muted){
  const playerVoice=voices.find(n=>n.to.gain.events.some(e=>e[0]===.085));assert(playerVoice,'player splat has full strength');
  const f=playerVoice.frequency.events.map(e=>e[0]);assert(f[0]>f[1]&&f[2]>f[1]&&f[3]<f[2],'squelch falls, squeaks, then ends low');
  assert(playerVoice.stopped-playerVoice.started<.3,'short sound tail');
  t.dispatch('#soundToggle','click');assert.equal(playerVoice.to.to.gain.events.at(-1)[0],0,'mute silences active splat bus');
  playerVoice.onended();assert(playerVoice.disconnected&&playerVoice.to.disconnected,'splat nodes release');
 }
}
audioRun();audioRun(true);
console.log('PASS squash gag: anticipation/slam/rebound/settle, one short impact pause, synchronized single splats, mute and audio cleanup');
