// Offline geometry acceptance: searches continuous bicycle-model routes through each mission.
const harness = require('./game-harness.cjs');
const t = harness();
class Heap {
  constructor(){this.a=[];}
  push(n){const a=this.a;a.push(n);let i=a.length-1;while(i){const p=(i-1)>>1;if(a[p].f<=n.f)break;a[i]=a[p];i=p;}a[i]=n;}
  pop(){const a=this.a,top=a[0],n=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].f<a[c].f)c++;if(a[c].f>=n.f)break;a[i]=a[c];i=c;}a[i]=n;}return top;}
}
const angleDiff=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
function fitsTarget(pose,target){
 if(!Number.isFinite(target.halfLength)||!Number.isFinite(target.halfWidth))return true;
 const scale=t.game.layout.scale,halfLength=t.game.layout.carLength/2,halfWidth=t.game.layout.carWidth/2;
 const error=pose.angle-target.angle,c=Math.abs(Math.cos(error)),s=Math.abs(Math.sin(error));
 const fx=Math.cos(target.angle),fy=Math.sin(target.angle),dx=pose.x-target.cx,dy=pose.y-target.cy;
 return Math.abs(dx*fx+dy*fy)+c*halfLength+s*halfWidth<=target.halfLength-scale
  &&Math.abs(-dx*fy+dy*fx)+s*halfLength+c*halfWidth<=target.halfWidth-scale;
}
function solve(start,target,requireReverse=true,limit=260000){
 const vehicle=t.vehicles[t.game.vehicle], scale=t.game.layout.scale;
 const bay=t.game.layout.parkingTarget;
 const bayBox=t.makeObb(bay.cx,bay.cy,bay.halfLength*2,bay.halfWidth*2,bay.angle);
 const overlapsBay=pose=>t.obbOverlap(t.makeObb(pose.x,pose.y,t.game.layout.carLength*.96,t.game.layout.carWidth*.94,pose.angle),bayBox);
 const step=7*scale;
 const heuristic=n=>Math.hypot(n.x-target.cx,n.y-target.cy)/scale + angleDiff(n.angle,target.angle)*vehicle.length*.65;
 const key=n=>`${Math.round((n.x-t.game.layout.ox)/scale/3.5)},${Math.round((n.y-t.game.layout.oy)/scale/3.5)},${Math.round((n.angle+Math.PI)*36/Math.PI)%72},${n.d},${n.entered?1:0}`;
 const best=new Map(),heap=new Heap();const first={...start,g:0,f:0,d:0,entered:false,overlapping:requireReverse&&overlapsBay(start),parent:null};heap.push(first);best.set(key(first),0);
 let visits=0;
 while(heap.a.length&&visits<limit){
  const n=heap.pop();if(n.g>(best.get(key(n))??Infinity))continue;visits++;
  if(Math.hypot(n.x-target.cx,n.y-target.cy)<7*scale&&angleDiff(n.angle,target.angle)<.16&&fitsTarget(n,target)&&(!requireReverse||(n.d<0&&n.entered))){
   const path=[];let cur=n;while(cur.parent){path.push({x:cur.x,y:cur.y,angle:cur.angle,d:cur.d,s:cur.s});cur=cur.parent;}return {path:path.reverse(),visits,length:n.g};
  }
  for(const d of [-1,1])for(const s of [-1,-.5,0,.5,1]){
   let pose=n,valid=true,entered=n.entered,overlapping=n.overlapping;
   for(let j=0;j<3;j++){
    pose=t.advance(pose,d*step/3,s,vehicle,scale);if(!t.carFits(pose.x,pose.y,pose.angle)){valid=false;break;}
    if(requireReverse){
     const nextOverlap=overlapsBay(pose);
     if(!nextOverlap)entered=false;
     if(nextOverlap&&!overlapping){
      const rearTowardBay=(bay.cx-pose.x)*Math.cos(pose.angle)+(bay.cy-pose.y)*Math.sin(pose.angle)<0;
      entered=d<0&&rearTowardBay;
     }
     overlapping=nextOverlap;
    }
   }
   if(!valid)continue;
   const g=n.g+7*(d<0?1.08:1)+Math.abs(s)*.45+(n.d&&n.d!==d?12:0);
   const k=key({...pose,d,entered});if((best.get(k)??Infinity)<=g)continue;
   best.set(k,g);heap.push({...pose,d,s,entered,overlapping,g,f:g+heuristic(pose)*1.7,parent:n});
  }
 }
 return {path:null,visits};
}
if(require.main===module){
 const fs=require('node:fs');const routes={};let failures=0;
 for(const level of t.levels){
  if(process.argv[2]&&level.id!==Number(process.argv[2]))continue;
  t.game.journey='campaign';t.applyLevel(level.id);t.resetGame(false);let start={...t.game.layout.spawn};let segments=[];
  if(t.game.layout.checkpoint){const c=t.game.layout.checkpoint;const r=solve(start,{cx:c.cx,cy:c.cy,angle:-Math.PI/2},false);segments.push(r);if(r.path)start=r.path.at(-1);}
  const r=solve(start,t.game.layout.target);segments.push(r);
  if(r.path&&t.game.layout.exitTarget){const e=t.game.layout.exitTarget;segments.push(solve(r.path.at(-1),e,false));}
  let passed=segments.every(s=>s.path);
  if (passed) {
    t.game.stage=level.layout==='final'?'checkpoint':'park';t.game.reverseEntered=false;t.game.lastParkingOverlap=false;
    Object.assign(t.game.car,t.game.layout.spawn);
    for(let segment=0;segment<segments.length;segment++) {
      for(const pose of segments[segment].path) {
        Object.assign(t.game.car,pose,{speed:pose.d*20*t.game.layout.scale});t.updateMissionStage(1/60);
      }
      if((!t.game.layout.checkpoint || segment>0) && segment===(t.game.layout.checkpoint?1:0) && !t.game.reverseEntered) {
        console.log('  rear-first entry check failed');passed=false;
      }
      if(!t.game.layout.checkpoint || segment>0) {
        t.game.car.speed=0;t.refreshParkStatus();
        if(!t.game.park.inside||!t.game.park.aligned||!t.game.park.stopped){
          console.log('  full-body parking check failed');passed=false;
        }
      }
      if(t.game.layout.exitTarget && segment===0) {t.game.stage='exit';t.game.layout.target=t.game.layout.exitTarget;}
    }
  }
  if(!passed)failures++;
  routes[level.id]=segments;
  console.log(`${passed?'PASS':'FAIL'} ${String(level.id).padStart(2,'0')} ${level.title}: ${segments.map(s=>`${s.path?s.path.length:'no route'} steps / ${s.visits} states`).join(' + ')}`);
 }
 fs.writeFileSync('/tmp/parking-routes.json',JSON.stringify(routes));
 process.exitCode=failures?1:0;
}
module.exports={solve,t};
