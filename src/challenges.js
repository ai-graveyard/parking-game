/* Shared, offline mission and vehicle definitions. Distances are world units. */
(function () {
  "use strict";
  const vehicles = {
    car: { label: "小轿车", length: 46, width: 24, wheelbase: 0.58, steer: 0.64, accel: 82, reverseAccel: 66, brake: 142, drag: 42, forward: 112, reverse: 76, response: 10, color: "#f05b32", note: "短轴距 · 转向灵活 · 松脚收速快" },
    van: { label: "小货车", length: 80, width: 34, wheelbase: 0.67, steer: 0.59, accel: 52, reverseAccel: 42, brake: 94, drag: 25, forward: 88, reverse: 56, response: 6, color: "#e7a83d", note: "车长约为轿车的 1.7 倍 · 转弯留足空间" },
    truck: { label: "大卡车", length: 128, width: 40, wheelbase: 0.73, steer: 0.56, accel: 32, reverseAccel: 28, brake: 62, drag: 15, forward: 68, reverse: 42, response: 3.6, color: "#65a6bd", note: "车长约为轿车的 2.8 倍 · 长货厢，大惯性" },
  };
  const chapters = ["小车入门", "进阶训练", "货车训练", "大车训练"];
  // Every mission has a stable layout. A restart never changes its geometry.
  const levels = [
    ["宽位倒库", "car", "reverse", "wide", 100, 42, "车尾朝里倒进黄框，松开踏板停稳"],
    ["左侧倒库", "car", "reverse", "left", 90, 38, "车位换到另一侧，先留出打方向的空间"],
    ["标准侧方", "car", "parallel", "parallel", 100, 45, "倒进前后两辆车之间，车头朝右"],
    ["狭窄侧方", "car", "parallel", "tight", 90, 40, "车位缩短了，允许前后修正，别急"],
    ["斜列车位", "car", "reverse", "diagonal", 100, 44, "绕开隔离带借位，沿斜线倒入窄车位"],
    ["绕过花坛", "car", "reverse", "garden", 110, 48, "绕过大花坛，留出车头摆动空间再倒库"],
    ["死胡同倒车", "car", "reverse", "alley", 100, 38, "先在巷外摆正，再倒过收窄巷口"],
    ["停好再出巷", "car", "reverse", "exit", 130, 65, "窄巷倒库后绕开隔离带，车头朝右停进出口"],
    ["货车初体验", "van", "reverse", "wide", 130, 60, "换上小货车，先感受更长的车身"],
    ["窄门进院", "van", "reverse", "gate", 140, 65, "先在院外摆正，再倒过窄门"],
    ["路边卸货", "van", "parallel", "parallel", 130, 60, "侧方停进卸货区，注意车头摆动"],
    ["仓库卸货口", "van", "reverse", "dock", 140, 62, "车尾对准卸货口，倒库后停稳"],
    ["大车第一课", "truck", "reverse", "wide", 160, 76, "转弯需要更多空间，提前收油刹车"],
    ["绕柱倒库", "truck", "reverse", "pillar", 170, 82, "先向外借空间，再绕过立柱倒库"],
    ["长车侧方", "truck", "parallel", "parallel", 170, 85, "慢慢倒入长车位，允许多次修正"],
    ["物流园终考", "truck", "reverse", "final", 200, 100, "通过绿色检查区，再倒入指定卸货口"],
  ].map(function (row, index) {
    return { id: index + 1, chapter: Math.floor(index / 4), title: row[0], vehicle: row[1], mode: row[2], layout: row[3], time: row[4], starTime: row[5], hint: row[6], seed: 40400 + index * 997 };
  });
  function advance(pose, distance, steer, vehicle, scale) {
    const axle = vehicle.length * scale * 0.30;
    const angle = pose.angle + distance / (vehicle.length * vehicle.wheelbase * scale) * Math.tan(steer * vehicle.steer);
    return {
      x: pose.x - Math.cos(pose.angle) * axle + Math.cos(angle) * (distance + axle),
      y: pose.y - Math.sin(pose.angle) * axle + Math.sin(angle) * (distance + axle),
      angle: Math.atan2(Math.sin(angle), Math.cos(angle)),
    };
  }
  window.ParkingChallenges = { vehicles: vehicles, chapters: chapters, levels: levels, advance: advance };
})();
