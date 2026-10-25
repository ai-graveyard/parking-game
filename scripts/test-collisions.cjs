const assert = require('node:assert/strict');
const harness = require('./game-harness.cjs');

function setup(vehicle = 'car', size = [390, 844]) {
  const t = harness();
  t.setSize(...size);
  t.game.journey = 'free';
  t.game.vehicle = vehicle;
  t.markIntroSeen();
  t.resetGame(true);
  Object.assign(t.game.layout, { bounds: {left:-1000,right:1000,top:-1000,bottom:1000}, parkedCars:[], obstacles:[] });
  return t;
}
function wallHit(t, angle = 0, direction = 1, diagonal = false) {
  const l = t.game.layout, s = l.scale;
  const nx = Math.cos(angle), ny = Math.sin(angle);
  const half = l.carLength * .48;
  const gap = .2 * s;
  const wall = {x:nx * (half + gap + 5 * s) * direction,
    y:ny * (half + gap + 5 * s) * direction,w:10*s,h:400*s,angle};
  l.obstacles = [wall];
  Object.assign(t.game.car, {x:0,y:0,angle:angle+(diagonal?.28:0),speed:direction*100*s});
  if (diagonal) {
    // Start beside the wall with a diagonal trajectory, allowing tangential slide.
    const support = Math.cos(.28)*half + Math.sin(.28)*l.carWidth*.47;
    t.game.car.x -= nx*(support-half);
    t.game.car.y -= ny*(support-half);
  }
  assert(t.carFits(t.game.car.x,t.game.car.y,t.game.car.angle),'valid pre-contact pose');
  t.updatePlaying(1/60);
}

for (const vehicle of ['car','van','truck']) for (const size of [[390,844],[320,568],[430,932]]) {
  for (const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]) for (const direction of [-1,1]) {
    const t = setup(vehicle,size); wallHit(t,angle,direction);
    assert.equal(t.game.hits,1,'head-on hit, including reverse and axis-aligned walls');
    assert.equal(t.game.scrapes,0);
    assert.equal(t.game.penalty,2);
    assert(t.game.car.speed*direction<0,'longitudinal bounce reverses speed');
    const fx = t.game.contactFx, s=t.game.layout.scale;
    assert(fx.nx*Math.cos(angle)*direction+fx.ny*Math.sin(angle)*direction<-.99,'recoil points away from contact');
    assert(Math.hypot(fx.x,fx.y)>t.game.layout.carLength*.4,'effect appears at bumper');
    assert.equal(t.game.particles.filter(p=>p.kind==='spark').length,12);
    const before={x:t.game.car.x,y:t.game.car.y};
    for(let i=0;i<30;i++) {
      t.update(1/60,i*1000/60);
      assert(t.carFits(t.game.car.x,t.game.car.y,t.game.car.angle),'rebound never crosses wall');
    }
    assert(Math.hypot(t.game.car.x-before.x,t.game.car.y-before.y)<4*s,'small bounded rebound');
    assert.equal(t.game.hits,1,'no repeated stationary penalty');
    assert.equal(t.game.contactFx.life,0);
    assert.equal(t.game.particles.filter(p=>p.kind==='spark').length,0,'sparks expire');
    t.resetGame(true);
    assert.equal(t.game.recoil.vx,0);assert.equal(t.game.recoil.vy,0);assert.equal(t.game.contactFx.life,0);
  }
  const scrape=setup(vehicle,size);wallHit(scrape,0,1,true);
  assert.equal(scrape.game.hits,0);assert.equal(scrape.game.scrapes,1);
  assert.equal(scrape.game.penalty,0,'scrape remains penalty-free');
  assert.equal(scrape.game.particles.filter(p=>p.kind==='spark').length,8);
  assert(scrape.game.contactFx.scrape);
  const sparkCount=scrape.game.particles.length;
  wallHit(scrape,0,1,true);
  assert.equal(scrape.game.scrapes,1);assert.equal(scrape.game.particles.length,sparkCount,'scrape cooldown bounds particles');
  scrape.pauseGame();const life=scrape.game.contactFx.life;
  scrape.update(.1,100);assert.equal(scrape.game.contactFx.life,life,'pause freezes car wobble');
}

// A wall behind the vehicle must block recoil rather than allowing a teleport.
const narrow=setup();wallHit(narrow);
const c=narrow.game.car,l=narrow.game.layout;
l.obstacles.push({x:c.x-l.carLength*.48-5*l.scale-.05*l.scale,y:0,w:10*l.scale,h:400*l.scale,angle:0});
for(let i=0;i<30;i++){narrow.update(1/60,i*1000/60);assert(narrow.carFits(c.x,c.y,c.angle));}

for(const kind of ['bounds','parked']) {
  const t=setup(),l=t.game.layout,s=l.scale;
  const edge=l.carLength*.48+.2*s;
  if(kind==='bounds')l.bounds.right=edge;
  else l.parkedCars=[{x:edge+30*s,y:0,length:60*s/.97,width:30*s/.95,angle:0}];
  Object.assign(t.game.car,{x:0,y:0,angle:0,speed:100*s});
  t.updatePlaying(1/60);
  assert.equal(t.game.hits,1,kind+' triggers contact feedback');
  assert(t.game.contactFx.nx<-.99,kind+' normal points away');
  assert(Math.abs(t.game.contactFx.x-edge)<2*s,kind+' contact point stays at touching edges');
  assert(t.carFits(t.game.car.x,t.game.car.y,t.game.car.angle));
}

// Exercise the actual synthesis path, preference toggle and resource cleanup.
const audio=setup();const nodes=[];let buffers=0;
function param(){return {value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(){}};}
function node(kind){const n={kind,frequency:param(),gain:param(),Q:param(),connect(to){this.to=to;return to;},disconnect(){this.disconnected=true;},start(){this.started=true;},stop(at){this.stopped=at;}};nodes.push(n);return n;}
audio.sandbox.window.AudioContext=function(){Object.assign(this,{currentTime:0,sampleRate:22050,state:'running',destination:{},createOscillator:()=>node('osc'),createGain:()=>node('gain'),createBiquadFilter:()=>node('filter'),createBuffer:()=>{buffers++;return {getChannelData:()=>new Float32Array(5000)};},createBufferSource:()=>node('noise')});};
audio.initAudio();wallHit(audio);
let voices=nodes.filter(n=>n.kind==='noise');assert.equal(voices.length,1);assert.equal(buffers,1);
assert(voices[0].stopped<=.22);assert.equal(voices[0].to.type,'lowpass');
voices[0].onended();assert(voices[0].disconnected&&voices[0].to.disconnected&&voices[0].to.to.disconnected);
audio.game.scrapeCooldown=0;wallHit(audio,0,1,true);
voices=nodes.filter(n=>n.kind==='noise');assert.equal(voices.length,2);assert.equal(buffers,1,'noise buffer reused');assert.equal(voices[1].to.type,'bandpass');
audio.dispatch('#soundToggle','click');audio.game.collisionCooldown=0;wallHit(audio);
assert.equal(nodes.filter(n=>n.kind==='noise').length,2,'mute prevents new contact sounds');
assert(audio.game.contactFx.life>0,'mute keeps visual feedback');
const noAudio=setup();noAudio.initAudio();wallHit(noAudio);assert.equal(noAudio.game.hits,1,'unsupported audio preserves gameplay');
console.log('PASS collision feedback: 72 forward/reverse wall hits, 9 scrapes, scene bounds/parked cars, bounded recoil, cooldown, pause/reset, sound synthesis/mute/cleanup and no-audio fallback');
