const assert = require('node:assert/strict');
const t = require('./game-harness.cjs')();

function inside(walls, x, y) {
  return walls.some(w => Math.abs(x-w.x) < w.w/2 && Math.abs(y-w.y) < w.h/2);
}

for (const size of [[390,844], [320,568], [430,932]]) {
  t.setSize(...size);
  for (const mission of t.levels) {
    t.applyLevel(mission.id); t.resetGame(false);
    const layout = t.game.layout;
    const groups = t.buildBrickWallGroups(layout.obstacles, layout.scale);
    for (const group of groups.filter(g => g.walls.length > 1)) {
      assert.equal(group.loops.length, 1, `level ${mission.id}: connected walls form one outline`);
      const step = .01 * layout.scale;
      for (const loop of group.loops) {
        for (let i=0; i<loop.length; i++) {
          const a=loop[i], b=loop[(i+1)%loop.length];
          const x=(a.x+b.x)/2, y=(a.y+b.y)/2;
          const horizontal=Math.abs(a.y-b.y)<step;
          const first=inside(group.walls,x+(horizontal?0:step),y+(horizontal?step:0));
          const second=inside(group.walls,x-(horizontal?0:step),y-(horizontal?step:0));
          assert.notEqual(first,second,`level ${mission.id}: no internal borders or missing exterior edges`);
        }
      }
    }
    if ([7,12,16].includes(mission.id)) {
      const enclosing=groups.find(g => g.walls.length>=3);
      assert(enclosing, `level ${mission.id}: continuous U-shaped enclosure`);
      assert.equal(enclosing.loops.length,1);
      assert(!inside(enclosing.walls,layout.target.cx,layout.target.cy), 'parking bay stays open');
      const corners=t.buildBrickWallCorners(enclosing.walls,layout.scale);
      const top=Math.min(...enclosing.walls.map(w=>w.y-w.h/2));
      const topCorners=corners.filter(c=>Math.abs(c.y-top)<layout.scale*.01);
      assert.equal(topCorners.length,2,'both top elbows have bonded brick courses');
      assert.equal(topCorners[0].direction+topCorners[1].direction,0,'left and right corners mirror the bond');
      for(const corner of topCorners){
        assert.notEqual(corner.rows[0].horizontal,corner.rows[1].horizontal,'horizontal corner joints stay staggered');
        assert.notEqual(corner.rows[0].vertical,corner.rows[1].vertical,'vertical corner joints stay staggered');
        const horizontal=enclosing.walls.find(w=>w.w>w.h&&Math.abs(w.y-w.h/2-corner.y)<layout.scale*.01);
        const vertical=enclosing.walls.find(w=>w.h>w.w&&Math.abs(w.x-corner.direction*w.w/2-corner.x)<layout.scale*.01);
        const brick=24*layout.scale;
        corner.rows.forEach((row,course)=>{
          const horizontalJoint=corner.x+corner.direction*row.horizontal;
          const hIndex=(horizontalJoint-(horizontal.x-horizontal.w/2-course*brick/2))/brick;
          const verticalCourse=corner.direction===1?1-course:course;
          const vIndex=(corner.y+row.vertical-(vertical.y-vertical.h/2-verticalCourse*brick/2))/brick;
          assert(Math.abs(hIndex-Math.round(hIndex))<1e-6,'corner ends on horizontal mortar grid');
          assert(Math.abs(vIndex-Math.round(vIndex))<1e-6,'corner ends on vertical mortar grid');
        });
      }
    }
    if (mission.id===7) {
      const connector=layout.obstacles.find(w => w.label==='巷墙转角');
      assert(connector, 'stepped alley has a solid connecting elbow');
      assert(!t.carFits(connector.x,connector.y,0), 'elbow has matching collision');
    }
  }
}

// Point contact is not a continuous wall; a doorway is not joined across its gap.
const wall=(x,y,w,h)=>({x,y,w,h,type:'wall'});
assert.equal(t.buildBrickWallGroups([wall(0,0,10,10),wall(10,10,10,10)],1).length,2);
assert.equal(t.buildBrickWallGroups([wall(0,0,30,10),wall(40,0,30,10)],1).length,2);
console.log('PASS continuous masonry: 16 missions × 3 viewports, exterior-only outlines, bonded corner mortar grids, U enclosures, solid elbow and open entrances');
