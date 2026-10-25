const assert = require('node:assert/strict');
const harness = require('./game-harness.cjs');

// The empty space must move outside the HUD/scene/controls group while the
// proportional scene and its world coordinates stay in their original position.
for (const [width, height] of [[320,568],[375,667],[360,800],[390,844],[412,915],[430,932]]) {
  for (const [safeTop, safeBottom] of [[0,0],[44,34],[59,34]]) {
    const t = harness();
    const properties = {};
    const controlsHeight = (height <= 670 ? 178 : Math.min(232, Math.max(190, height * .27))) + safeBottom;
    const basePlayTop = (height <= 670 ? 114 : 118) + safeTop;
    t.elements.get('#game').style.setProperty = (key,value) => { properties[key] = value; };
    t.elements.get('#controls').offsetHeight = controlsHeight;
    t.elements.get('#mission').getBoundingClientRect = () => ({bottom:basePlayTop-8});
    t.setSize(width,height);
    for (let id=1;id<=16;id++) {
      t.applyLevel(id);
      const map=t.makeMap(), layout=t.projectMap(map);
      const outerSpace=parseFloat(properties['--game-edge-space']);
      assert(outerSpace>=0);
      assert(Math.abs(layout.roadTop-layout.playTop-6)<.01,'HUD-to-scene gap stays compact');
      assert(Math.abs(layout.controlTop-(layout.roadTop+350*layout.scale)-6)<.01,'scene-to-controls gap stays compact');
      assert(Math.abs(layout.playTop-basePlayTop-outerSpace)<.01,'extra height goes above the content');
      assert(Math.abs(height-controlsHeight-layout.controlTop-outerSpace)<.01,'equal extra height goes below the controls');
      assert(layout.scale<=(width-12)/390+.001,'scene never stretches beyond its proportional width');
      const previousSceneTop=basePlayTop+(height-controlsHeight-basePlayTop-350*layout.scale)/2;
      assert(Math.abs(layout.roadTop-previousSceneTop)<.01,'packing keeps the scene position stable');
    }
  }
}
console.log('PASS packed layout: 6 sizes × 3 safe areas × 16 courses, compact middle gaps, balanced outer space, proportional/stable scene');

for (const [titleRight, subtitleTop, expectedShift] of [[124,60,0],[124,48,6],[150,48,40]]) {
  const t=harness(), properties={};
  t.elements.get('#game').style.setProperty=(key,value)=>{properties[key]=value;};
  const element=(rect)=>({offsetWidth:rect.right-rect.left,getBoundingClientRect:()=>rect});
  const texts=[element({left:14,right:titleRight,top:14,bottom:44}),element({left:14,right:190,top:subtitleTop,bottom:subtitleTop+22})];
  const buttons=[element({left:141,right:173,top:14,bottom:46}),element({left:179,right:211,top:14,bottom:46}),element({left:217,right:249,top:14,bottom:46})];
  t.sandbox.document.querySelectorAll=selector=>selector==='.brand-title, .brand-kicker'?texts:selector==='.hud-actions button'?buttons:[];
  t.sandbox.document.querySelector('.hud-actions').getBoundingClientRect=()=>({left:141,right:249});
  t.game.layout=t.projectMap(t.makeMap());
  assert.equal(parseFloat(properties['--brand-shift']),expectedShift,'move the entire brand only as far as the buttons require');
  const shifted=texts.map(el=>{const r=el.getBoundingClientRect();return {...r,top:r.top+expectedShift,bottom:r.bottom+expectedShift};});
  for(const text of shifted)for(const button of buttons.map(el=>el.getBoundingClientRect())){
    assert(text.right+8<=button.left||text.left-8>=button.right||text.top>=button.bottom+8||text.bottom<=button.top-8,'title and subtitle leave a clear button target');
  }
}
console.log('PASS HUD clearance: clear text stays put, nearby subtitle moves slightly, overlapping title moves the full text group below buttons');

{
  const t=harness(), properties={}, gameEl=t.elements.get('#game');
  gameEl.style.setProperty=(key,value)=>{properties[key]=value;};
  const actions={left:141,right:249};
  const title={offsetWidth:136,classList:{contains:name=>name==='brand-title'},getBoundingClientRect:()=>({left:14,right:gameEl.classList.contains('is-compact-brand')?114:150,top:14,bottom:44})};
  const subtitle={offsetWidth:176,getBoundingClientRect:()=>({left:14,right:190,top:48,bottom:70})};
  const buttons=[0,1,2].map(i=>({offsetWidth:32,getBoundingClientRect:()=>({left:actions.left+i*38,right:actions.left+i*38+32,top:14,bottom:46})}));
  t.sandbox.document.querySelectorAll=selector=>selector==='.brand-title, .brand-kicker'?[title,subtitle]:selector==='.hud-actions button'?buttons:[];
  t.sandbox.document.querySelector('.hud-actions').getBoundingClientRect=()=>actions;
  t.projectMap(t.makeMap());
  assert(gameEl.classList.contains('is-compact-brand'),'shrink both labels when the title cannot fit beside buttons');
  assert.equal(parseFloat(properties['--brand-shift']),6,'compact text avoids the large downward move');
  actions.left=200;actions.right=308;
  t.projectMap(t.makeMap());
  assert(!gameEl.classList.contains('is-compact-brand'),'restore normal font sizes when more space becomes available');
  assert.equal(parseFloat(properties['--brand-shift']),0);
}
console.log('PASS adaptive brand size: shrink before moving, restore full size when space returns');

{
  const t=harness();
  t.setSize(320,568);
  t.elements.get('#controls').offsetHeight=212;
  t.elements.get('#mission').getBoundingClientRect=()=>({bottom:205});
  const layout=t.projectMap(t.makeMap());
  assert(layout.playTop>=213,'stacked title and safe area leave the scene below the mission line');
  assert(layout.roadTop>=213&&layout.scale>0,'the compact scene remains visible');
}
console.log('PASS full small-screen title: stacked header plus safe area never overlaps the scene');
