const assert = require('node:assert/strict');
const harness = require('./game-harness.cjs');
const noop = () => {};
let cases = 0;

function checkFit(args, frame) {
  const [image, sx, sy, sw, sh, dx, dy, dw, dh] = args;
  const [x, y, w, h] = frame;
  assert.equal(sx,0);assert.equal(sy,0);
  assert.equal(sw,image.width);assert.equal(sh,image.height,'the complete export bitmap is included');
  assert(Math.abs(dw/sw-dh/sh)<1e-10,'vehicles and parking bays keep one scale on both axes');
  assert(dx>=x-1e-8&&dy>=y-1e-8&&dx+dw<=x+w+1e-8&&dy+dh<=y+h+1e-8,'full scene fits the share frame');
  assert(Math.abs(dx+dw/2-x-w/2)<1e-8&&Math.abs(dy+dh/2-y-h/2)<1e-8,'scene is centered');
  assert(Math.abs(dw-w)<1e-8||Math.abs(dh-h)<1e-8,'scene fills the available frame uniformly');
}
const exportedField = (draws, canvas) => draws.find(args=>args.length===9&&args[0]!==canvas&&args[0].width>100&&args[0].height>100);
for(const [width,height] of [[320,568],[375,667],[360,800],[390,844],[412,915],[430,932],[1024,768]]){
 for(const density of [1,1.5,2])for(const level of [1,9,13]){
  const draws=[],texts=[],scales=[],transforms=[];
  const ctx=new Proxy({drawImage(...args){draws.push(args);},fillText(...args){texts.push(args);},scale(...args){scales.push(args);},setTransform(...args){transforms.push(args);},measureText:text=>({width:String(text).length*20}),createPattern:()=>({}),createLinearGradient:()=>({addColorStop:noop})},{get:(obj,key)=>key in obj?obj[key]:noop});
  const t=harness({},'','https:',ctx);
  t.markIntroSeen();t.applyLevel(level);t.resetGame(true);
  t.elements.get('#game').getBoundingClientRect=()=>({left:0,top:0,width,height});
  t.sandbox.window.devicePixelRatio=density;t.resize();
  const canvas=t.elements.get('#gameCanvas');
  for(const frame of [[28,28,664,596],[36,158,648,420],[20,20,180,400]]){
   draws.length=0;assert.equal(t.blitPlayfield(ctx,...frame),true);
   const field=exportedField(draws,canvas);assert(field);checkFit(field,frame);cases++;
   const capture=t.shareSceneFrame(frame[2],frame[3]),b=t.game.layout.bounds;
   assert(capture.left<b.left&&capture.top<b.top&&capture.right>b.right&&capture.bottom>b.bottom,'all four parking-lot boundaries are inside the capture');
  }
  for(const success of [false,true]){
   t.game.state=success?'success':'failed';t.game.successFx=1;t.showResult(success);
   if(!success){t.game.car.destroyed=true;t.game.failureFx={age:6,impacted:true};}
   const pose=JSON.stringify(t.game.car),layout=t.game.layout;
   draws.length=0;texts.length=0;scales.length=0;transforms.length=0;
   t.buildShareImage(t.game.lastRun);
   const field=exportedField(draws,canvas);assert(field);checkFit(field,[36,36,648,success?420:476]);
   const frame=t.shareSceneFrame(648,success?420:476);
   assert.equal(field[0].width,frame.sourceWidth);assert.equal(field[0].height,frame.sourceHeight);
   assert(Math.max(field[7]/field[0].width,field[8]/field[0].height)<=.5,'scene is redrawn at twice its export size');
   assert(transforms.some(m=>m[0]===m[3]&&m[0]>0&&m[1]===0&&m[2]===0),'export uses a uniform scene transform');
   assert(!scales.some(s=>Math.abs(s[0]-1.18)<1e-10&&Math.abs(s[1]-1.18)<1e-10),'the success camera zoom never crops the export');
   assert.equal(JSON.stringify(t.game.car),pose);assert.equal(t.game.layout,layout);assert.equal(t.game.successFx,1,'export never mutates live pose, layout or camera');
   assert(texts.some(args=>String(args[0]).startsWith(success?'净用时':'限时')),'primary statistic remains');
   assert(texts.some(args=>String(args[0]).startsWith('撞击 ')),'collision record remains');
   assert(texts.some(args=>String(args[0]).startsWith('教练点评：')),'original coach commentary is preserved');
   assert.equal(texts.some(args=>args[0]==='考核不通过'),!success,'settled failure stamp appears only in the failed share scene');
   assert(!texts.some(args=>args.length>3&&args[0]!=='考核不通过'),'card text uses fitted font sizes instead of horizontal squeezing');
   if(success){scales.length=0;t.draw();assert(scales.some(s=>Math.abs(s[0]-1.18)<1e-10),'live success camera is preserved');}
  }
  draws.length=0;t.buildRescueImage();checkFit(exportedField(draws,canvas),[36,158,648,420]);
  t.game.car.destroyed=true;t.game.failureFx={age:6,impacted:true};
  t.game.car.x=t.game.layout.bounds.right;t.game.car.y=t.game.layout.bounds.bottom;
  const capture=t.shareSceneFrame(664,596),footprint=t.assessmentFootprint();
  assert(capture.right>=t.game.car.x+footprint.extentX/2&&capture.bottom>=t.game.car.y+footprint.extentY/2,'a flattened vehicle at the boundary also remains fully visible');
  const cards=Array.from(t.elements.values()).filter(el=>el.width===720&&el.height===960);
  assert(cards.length>=3,'success, failure and rescue stay 720x960');
  draws.length=0;assert.equal(t.blitPlayfield(ctx,0,0,0,100),false);assert.equal(draws.length,0);
 }
}
console.log(`PASS sharing: ${cases} scene/frame combinations, full lot bounds, high-resolution uniform redraw, no success-camera crop, intact live state, original title/stars/coach hierarchy, three vehicles and 3:4 cards`);
