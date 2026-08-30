(() => {
  "use strict";

  const canvas = document.querySelector("#gameCanvas");
  const ctx = canvas.getContext("2d");
  const gameEl = document.querySelector("#game");
  const timerEl = document.querySelector("#timer");
  const timerBox = document.querySelector("#timerBox");
  const difficultyBadge = document.querySelector("#difficultyBadge");
  const missionEl = document.querySelector("#mission");
  const missionText = document.querySelector("#missionText");
  const controlsEl = document.querySelector("#controls");
  const wheelPad = document.querySelector("#wheelPad");
  const wheelEl = document.querySelector("#wheel");
  const steerReadout = document.querySelector("#steerReadout");
  const speedMeter = document.querySelector("#speedMeter");
  const speedValue = document.querySelector("#speedValue");
  const gasButton = document.querySelector("#gas");
  const brakeButton = document.querySelector("#brake");
  const toastEl = document.querySelector("#toast");
  const startOverlay = document.querySelector("#startOverlay");
  const startStamp = document.querySelector("#startStamp");
  const startButtonLabel = document.querySelector("#startButtonLabel");
  const startRecord = document.querySelector("#startRecord");
  const posterCard = document.querySelector(".poster-card");
  const howTo = document.querySelector("#howTo");
  const recordGrid = document.querySelector("#recordGrid");
  const modeButtons = [...document.querySelectorAll(".mode-option")];
  const difficultyButtons = [...document.querySelectorAll(".difficulty-option")];
  const timerLabel = document.querySelector("#timerLabel");
  const resultOverlay = document.querySelector("#resultOverlay");
  const resultCard = document.querySelector("#resultCard");
  const resultKicker = document.querySelector("#resultKicker");
  const resultTitle = document.querySelector("#resultTitle");
  const resultCopy = document.querySelector("#resultCopy");
  const resultStars = document.querySelector("#resultStars");
  const resultTime = document.querySelector("#resultTime");
  const resultPenalty = document.querySelector("#resultPenalty");
  const resultHits = document.querySelector("#resultHits");
  const resultScrapes = document.querySelector("#resultScrapes");
  const resultRecord = document.querySelector("#resultRecord");
  const nextLevel = document.querySelector("#nextLevel");
  const nextLevelTitle = document.querySelector("#nextLevelTitle");
  const nextLevelCopy = document.querySelector("#nextLevelCopy");
  const nextDifficultyButton = document.querySelector("#nextDifficultyButton");
  const resultStarRule = document.querySelector("#resultStarRule");
  const graduation = document.querySelector("#graduation");
  const graduationTitle = document.querySelector("#graduationTitle");
  const graduationCopy = document.querySelector("#graduationCopy");
  const startButton = document.querySelector("#startButton");
  const restartButton = document.querySelector("#restartButton");
  const restartButtonLabel = document.querySelector("#restartButtonLabel");
  const changeDifficultyButton = document.querySelector("#changeDifficultyButton");
  const pauseButton = document.querySelector("#pauseButton");
  const pauseOverlay = document.querySelector("#pauseOverlay");
  const pauseSummary = document.querySelector("#pauseSummary");
  const continueButton = document.querySelector("#continueButton");
  const pauseRestartButton = document.querySelector("#pauseRestartButton");
  const pauseExitButton = document.querySelector("#pauseExitButton");
  const soundToggle = document.querySelector("#soundToggle");
  const shareXhsButton = document.querySelector("#shareXhsButton");
  const shareXhsLabel = document.querySelector("#shareXhsLabel");
  let lastShareDataUrl = "";
  let shareBusy = false;
  const rotateOverlay = document.querySelector("#rotateOverlay");
  const guideTip = document.querySelector("#guideTip");
  const guideStepBadge = document.querySelector("#guideStepBadge");
  const guideText = document.querySelector("#guideText");
  const guideSkip = document.querySelector("#guideSkip");
  const guideFinger = document.querySelector("#guideFinger");
  const resultBeat = document.querySelector("#resultBeat");

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const normalizeAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
  const angleDistance = (a, b) => Math.abs(normalizeAngle(a - b));

  const SPEED_TO_KMH = 0.18;
  // 低于这个速度换算后显示为 0 km/h，让停稳判定和仪表读数一致
  const STOP_SPEED = 2.7;
  const STABLE_TIME = 0.65;
  const ALIGN_TOLERANCE = 0.24;
  const IMPACT_PENALTY = 2;
  const STORE_KEY = "parking-game.records.v1";
  const SOUND_KEY = "parking-game.sound.v1";
  const INTRO_KEY = "parking-game.intro.v1";
  const DIFF_ORDER = ["easy", "hard", "hell"];

  const MODES = {
    reverse: {
      key: "reverse",
      label: "倒车入库",
      short: "入库",
      summary: "路肩上方车位",
      hint: "倒进黄色车位，再把车停稳",
      slots: {
        easy: { length: 1.95, width: 2.35 },
        hard: { length: 1.68, width: 1.95 },
        hell: { length: 1.46, width: 1.72 },
      },
    },
    parallel: {
      key: "parallel",
      label: "侧方停车",
      short: "侧方",
      summary: "夹在两车之间",
      hint: "倒进两辆车之间的黄框",
      slots: {
        easy: { length: 2.25, width: 2.3 },
        hard: { length: 1.86, width: 1.92 },
        hell: { length: 1.6, width: 1.7 },
      },
    },
  };
  const MODE_ORDER = ["reverse", "parallel"];

  const DIFFICULTIES = {
    easy: { key: "easy", label: "简单", time: 100, obstacles: 1, neighbors: 0, next: "hard", summary: "大车位 · 少路障" },
    hard: { key: "hard", label: "困难", time: 60, obstacles: 4, neighbors: 1, next: "hell", summary: "标准车位 · 多路障" },
    hell: { key: "hell", label: "地狱", time: 30, obstacles: 7, neighbors: 2, next: null, summary: "小车位 · 路障密集" },
  };

  let W = 390;
  let H = 844;
  let dpr = 1;
  let lastFrame = performance.now();
  let toastTimer = 0;
  let audioCtx = null;
  let soundEnabled = readSoundPref();
  let engineOsc = null;
  let engineGain = null;
  let tankOsc = null;
  let tankGain = null;
  let engineActive = false;
  let tankActive = false;
  let engineToneAt = 0;
  let tankToneAt = 0;
  let lastReverseBeepAt = 0;
  let lastCountdownSecond = null;
  let orientationBlocked = false;

  const input = {
    steer: 0,
    steerTarget: 0,
    gas: false,
    brake: false,
    steerPointer: null,
    steerPointerAngle: null,
    steerDragDegrees: 0,
    steerReturnRate: 0,
  };

  // 松手回正：角速度先加速爬升，进入 EASE_SPAN 后按 sqrt 收敛，做到匀减速停在中位
  const STEER_RETURN_MAX_RATE = 1.3;
  const STEER_RETURN_ACCEL = 3;
  const STEER_RETURN_EASE_SPAN = 0.3;

  const game = {
    state: "ready",
    mode: "reverse",
    difficulty: "easy",
    map: null,
    layout: null,
    timeLimit: DIFFICULTIES.easy.time,
    timeLeft: DIFFICULTIES.easy.time,
    elapsed: 0,
    penalty: 0,
    hits: 0,
    scrapes: 0,
    stableTime: 0,
    collisionCooldown: 0,
    scrapeCooldown: 0,
    penaltyGrace: 0,
    flash: 0,
    car: { x: 0, y: 0, angle: 0, speed: 0, destroyed: false },
    tank: { x: 0, y: 0, crushedCar: false, crushedScene: false, endTimer: 0, smokeTimer: 0 },
    particles: [],
    skidMarks: [],
    driveDirection: -1,
    park: { inside: false, aligned: false, stopped: false },
    lastRun: null,
    guide: { active: false, step: 0, holdTimer: 0 },
    successFx: 0,
  };

  /* ---------------- 随机数与几何 ---------------- */

  function makeRng(seed) {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let x = Math.imul(state ^ (state >>> 15), 1 | state);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createObb() {
    return {
      points: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
      axes: [{ x: 1, y: 0 }, { x: 0, y: 1 }],
    };
  }

  function writeObb(box, x, y, length, width, angle) {
    const fx = Math.cos(angle);
    const fy = Math.sin(angle);
    const sx = -fy;
    const sy = fx;
    const hl = length / 2;
    const hw = width / 2;
    const p = box.points;
    p[0].x = x + fx * hl + sx * hw; p[0].y = y + fy * hl + sy * hw;
    p[1].x = x + fx * hl - sx * hw; p[1].y = y + fy * hl - sy * hw;
    p[2].x = x - fx * hl - sx * hw; p[2].y = y - fy * hl - sy * hw;
    p[3].x = x - fx * hl + sx * hw; p[3].y = y - fy * hl + sy * hw;
    box.axes[0].x = fx; box.axes[0].y = fy;
    box.axes[1].x = sx; box.axes[1].y = sy;
    return box;
  }

  function makeObb(x, y, length, width, angle) {
    return writeObb(createObb(), x, y, length, width, angle);
  }

  // 分离轴检测走热路径，用模块级变量回传投影区间，避免每帧产生临时对象
  let extentMin = 0;
  let extentMax = 0;

  function extentOnAxis(points, ax, ay) {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < 4; i += 1) {
      const value = points[i].x * ax + points[i].y * ay;
      if (value < min) min = value;
      if (value > max) max = value;
    }
    extentMin = min;
    extentMax = max;
  }

  function obbOverlap(a, b) {
    for (let i = 0; i < 4; i += 1) {
      const axis = i < 2 ? a.axes[i] : b.axes[i - 2];
      extentOnAxis(a.points, axis.x, axis.y);
      const aMin = extentMin;
      const aMax = extentMax;
      extentOnAxis(b.points, axis.x, axis.y);
      if (aMax < extentMin || extentMax < aMin) return false;
    }
    return true;
  }

  const probeCar = createObb();
  const probeOther = createObb();
  const probePark = createObb();

  function targetObb(target, inflate) {
    return makeObb(
      target.cx,
      target.cy,
      target.halfLength * 2 * inflate,
      target.halfWidth * 2 * inflate,
      target.angle
    );
  }

  function pointInTarget(target, px, py, pad) {
    const dx = px - target.cx;
    const dy = py - target.cy;
    const along = dx * target.fx + dy * target.fy;
    const across = dx * target.sx + dy * target.sy;
    return Math.abs(along) <= target.halfLength + pad && Math.abs(across) <= target.halfWidth + pad;
  }

  /* ---------------- 场地生成 ---------------- */

  function makeMap() {
    return {
      mode: game.mode,
      difficulty: game.difficulty,
      seed: (Math.random() * 0xffffffff) >>> 0,
    };
  }

  function playAreaTop() {
    const gameRect = gameEl.getBoundingClientRect();
    const missionRect = missionEl.getBoundingClientRect();
    const measured = missionRect.bottom - gameRect.top + 8;
    const fallback = 104;
    const value = Number.isFinite(measured) && measured > 48 ? measured : fallback;
    return clamp(value, 60, H * 0.32);
  }

  // 场地内容只由 map.seed 决定，屏幕尺寸只影响投影结果，
  // 所以 resize 重新投影不会换掉玩家正在挑战的场地。
  function projectMap(map) {
    const mode = MODES[map.mode];
    const level = DIFFICULTIES[map.difficulty];
    const rng = makeRng(map.seed);

    const controlsHeight = H <= 670 ? 178 : clamp(H * 0.27, 190, 232);
    const controlTop = H - controlsHeight;
    const playTop = playAreaTop();
    const minRoadTop = Math.max(playTop + 88, 200);
    const maxRoadTop = controlTop - 150;
    const roadTop = maxRoadTop <= minRoadTop
      ? Math.max(playTop + 36, maxRoadTop)
      : clamp(H * 0.4, minRoadTop, maxRoadTop);
    const roadBottom = controlTop + 18;
    const carLength = clamp(W * 0.14, 46, 62);
    const carWidth = carLength * 0.53;
    const slotSpec = mode.slots[map.difficulty];

    const layout = {
      controlsHeight,
      controlTop,
      playTop,
      roadTop,
      roadBottom,
      carLength,
      carWidth,
      target: null,
      parkedCars: [],
      obstacles: [],
      spawn: { x: W * 0.7, y: (roadTop + controlTop) / 2, angle: 0 },
      signX: W * 0.86,
    };
    // 贴着路面下沿留一条空车道，随机路障再密也一定有路开到车位前
    layout.travelLane = makeObb(W / 2, controlTop - carWidth * 0.95, W + 40, carWidth * 1.7, 0);

    const side = rng() < 0.5 ? -1 : 1;
    const spot = rng();

    layout.target = buildTarget(map.mode, layout, {
      side,
      spot,
      slotLength: carLength * slotSpec.length,
      slotWidth: carWidth * slotSpec.width,
    });
    layout.parkedCars = buildNeighbors(map.mode, layout, { extra: level.neighbors, rng });
    // 标线先于路障生成，随机路障才能避开这些画了线的格子
    layout.decorBays = buildDecorBays(layout);
    layout.obstacles = buildObstacles(level.obstacles, layout, rng);
    layout.spawn = pickSpawn(layout, rng);
    layout.signX = layout.target.cx < W / 2 ? W * 0.86 : W * 0.14;
    finishCurb(layout);
    return layout;
  }

  // 跨过路肩线的车位（倒车入库的目标位和邻位）在路沿上留出真实开口：
  // 碰撞放行、绘制画成下沉坡道，保证"看到豁口就能上、看到条纹就是墙"。
  function finishCurb(layout) {
    const curbY = layout.roadTop - 3;
    layout.curbBays = [layout.target, ...layout.decorBays]
      .filter((bay) => bay.cy - bay.hy < curbY);
    const spans = layout.curbBays
      .map((bay) => ({ x0: bay.cx - bay.hx, x1: bay.cx + bay.hx }))
      .sort((a, b) => a.x0 - b.x0);
    const merged = [];
    for (const span of spans) {
      const last = merged[merged.length - 1];
      if (last && span.x0 <= last.x1 + 4) last.x1 = Math.max(last.x1, span.x1);
      else merged.push(span);
    }
    layout.curbOpenings = merged;
  }

  function finishTarget(target) {
    target.fx = Math.cos(target.angle);
    target.fy = Math.sin(target.angle);
    target.sx = -target.fy;
    target.sy = target.fx;
    const c = Math.abs(target.fx);
    const s = Math.abs(target.fy);
    target.hx = target.halfLength * c + target.halfWidth * s;
    target.hy = target.halfLength * s + target.halfWidth * c;
    return target;
  }

  function pickLateral(minValue, maxValue, side, spot) {
    if (maxValue <= minValue) return (minValue + maxValue) / 2;
    const span = maxValue - minValue;
    return side < 0
      ? lerp(minValue, minValue + span * 0.42, spot)
      : lerp(maxValue - span * 0.42, maxValue, spot);
  }

  function buildTarget(mode, layout, opts) {
    const { roadTop, playTop, controlTop, carLength, carWidth } = layout;
    const { side, spot, slotLength, slotWidth } = opts;
    const halfLength = slotLength / 2;
    const halfWidth = slotWidth / 2;

    if (mode === "parallel") {
      // 左右各留一整格邻位车位，三格标线都要完整画在屏幕里
      const margin = halfLength * 3 + 6;
      const cx = pickLateral(margin, W - margin, side, spot);
      const cy = clamp(
        roadTop + 8 + halfWidth,
        roadTop + halfWidth,
        controlTop - halfWidth - carWidth * 1.1
      );
      return finishTarget({ cx, cy, halfLength, halfWidth, angle: 0 });
    }

    const angle = Math.PI / 2;
    const probe = finishTarget({ cx: 0, cy: 0, halfLength, halfWidth, angle });
    const cx = pickLateral(probe.hx + 8, W - probe.hx - 8, side, spot);
    // 车位整体在路肩上方，底边和草坪、路面的交界齐平，不伸进马路
    let cy = roadTop - probe.hy;
    const topEdge = cy - probe.hy;
    if (topEdge < playTop + 8) cy += playTop + 8 - topEdge;
    return finishTarget({ cx, cy, halfLength, halfWidth, angle });
  }

  function buildNeighbors(mode, layout, opts) {
    const { target, carLength, carWidth, roadTop, controlTop, playTop } = layout;
    const { extra, rng } = opts;
    const colors = ["#4c75c8", "#dc7ea2", "#7a8f5c", "#c8823f"];
    const cars = [];

    const push = (x, y, angle, inBay = false) => {
      const c = Math.abs(Math.cos(angle));
      const s = Math.abs(Math.sin(angle));
      const hx = (carLength * c + carWidth * s) / 2;
      const hy = (carLength * s + carWidth * c) / 2;
      if (x - hx < 4 || x + hx > W - 4) return;
      if (y - hy < playTop + 4 || y + hy > controlTop - 2) return;
      const box = makeObb(x, y, carLength, carWidth, angle);
      if (obbOverlap(box, targetObb(target, 1.04))) return;
      if (obbOverlap(box, layout.travelLane)) return;
      for (let i = 0; i < cars.length; i += 1) {
        const other = cars[i];
        if (obbOverlap(box, makeObb(other.x, other.y, carLength * 1.08, carWidth * 1.08, other.angle))) return;
      }
      cars.push({ x, y, angle, inBay, color: colors[cars.length % colors.length] });
    };

    if (mode === "parallel") {
      // 邻位间距取整格车位长，三个车位同尺寸、共用边线，邻车停在格子正中
      const gap = target.halfLength * 2;
      push(target.cx - gap, target.cy, 0, true);
      push(target.cx + gap, target.cy, 0, true);
    } else {
      // 邻位间距取整格车位宽，标线才能像真实停车场一格挨一格、共用一条线
      const gap = target.halfWidth * 2;
      const dir = target.cx < W / 2 ? 1 : -1;
      push(target.cx + gap * dir, target.cy, target.angle, true);
      if (extra >= 1) push(target.cx - gap * dir, target.cy, target.angle, true);
    }

    if (extra >= 2) {
      for (let attempt = 0; attempt < 24; attempt += 1) {
        const before = cars.length;
        push(
          lerp(W * 0.2, W * 0.8, rng()),
          lerp(roadTop + carWidth * 1.1, controlTop - carWidth * 1.1, rng()),
          rng() < 0.5 ? 0 : Math.PI / 2
        );
        if (cars.length > before) break;
      }
    }
    return cars;
  }

  function buildDecorBays(layout) {
    const { target } = layout;
    return layout.parkedCars
      .filter((car) => car.inBay)
      .map((car) => finishTarget({
        cx: car.x,
        cy: car.y,
        // 邻位和目标车位同尺寸，一格挨一格共用边线
        halfLength: target.halfLength,
        halfWidth: target.halfWidth,
        angle: target.angle,
      }));
  }

  // 车位正前方留出一条走廊，保证随机出来的场地一定能开进去
  function approachCorridor(layout) {
    const { target, carLength, carWidth, controlTop } = layout;
    const width = Math.max(target.hx * 2, carWidth * 2.7);
    const top = target.cy + target.hy * 0.2;
    const bottom = Math.min(controlTop, target.cy + target.hy + carLength * 1.9);
    const height = Math.max(carLength, bottom - top);
    return makeObb(target.cx, top + height / 2, width, height, 0);
  }

  function buildObstacles(count, layout, rng) {
    if (count <= 0) return [];
    const { target, parkedCars, roadTop, controlTop, carLength, carWidth } = layout;
    const specs = [
      { type: "cone", w: 18, h: 18, minScale: 0.7, maxScale: 0.92 },
      { type: "barrier", w: 46, h: 15, minScale: 0.86, maxScale: 1.06 },
      { type: "tires", w: 28, h: 23, minScale: 0.88, maxScale: 1.04 },
    ];
    const corridor = approachCorridor(layout);
    const slotZone = targetObb(target, 1.2);
    // 邻位格子比停着的车大，路障也不许落进画了线的格子里
    const bayBoxes = (layout.decorBays || []).map((bay) => targetObb(bay, 1.05));
    const carBoxes = parkedCars.map((car) => makeObb(car.x, car.y, carLength * 1.16, carWidth * 1.3, car.angle));
    const minY = roadTop + carWidth * 0.6;
    const maxY = controlTop - carWidth * 0.6;
    if (maxY <= minY) return [];

    const items = [];
    let guard = count * 80;
    while (items.length < count && guard > 0) {
      guard -= 1;
      const spec = specs[Math.floor(rng() * specs.length)];
      const scale = lerp(spec.minScale, spec.maxScale, rng());
      const w = spec.w * scale;
      const h = spec.h * scale;
      const angle = spec.type === "barrier" ? (rng() - 0.5) * 0.55 : 0;
      const x = lerp(W * 0.08, W * 0.92, rng());
      const y = lerp(minY, maxY, rng());
      const probe = makeObb(x, y, w * 1.15, h * 1.2, angle);
      if (obbOverlap(probe, corridor)) continue;
      if (obbOverlap(probe, slotZone)) continue;
      if (obbOverlap(probe, layout.travelLane)) continue;
      let blocked = false;
      for (let i = 0; i < bayBoxes.length && !blocked; i += 1) blocked = obbOverlap(probe, bayBoxes[i]);
      for (let i = 0; i < carBoxes.length && !blocked; i += 1) blocked = obbOverlap(probe, carBoxes[i]);
      if (blocked) continue;
      for (let i = 0; i < items.length && !blocked; i += 1) {
        const item = items[i];
        const distance = Math.hypot(item.x - x, item.y - y);
        blocked = distance < (Math.max(item.w, item.h) + Math.max(w, h)) * 0.85;
      }
      if (blocked) continue;
      items.push({ type: spec.type, x, y, w, h, angle, scale });
    }

    // 第一轮放不满就放宽间距再补，避免地狱局静默少障
    let extra = (count - items.length) * 100;
    while (items.length < count && extra > 0) {
      extra -= 1;
      const spec = specs[Math.floor(rng() * specs.length)];
      const scale = lerp(spec.minScale, spec.maxScale, rng());
      const w = spec.w * scale;
      const h = spec.h * scale;
      const angle = spec.type === "barrier" ? (rng() - 0.5) * 0.55 : 0;
      const x = lerp(W * 0.08, W * 0.92, rng());
      const y = lerp(minY, maxY, rng());
      const probe = makeObb(x, y, w * 1.15, h * 1.2, angle);
      if (obbOverlap(probe, corridor)) continue;
      if (obbOverlap(probe, slotZone)) continue;
      if (obbOverlap(probe, layout.travelLane)) continue;
      let blocked = false;
      for (let i = 0; i < bayBoxes.length && !blocked; i += 1) blocked = obbOverlap(probe, bayBoxes[i]);
      for (let i = 0; i < carBoxes.length && !blocked; i += 1) blocked = obbOverlap(probe, carBoxes[i]);
      if (blocked) continue;
      for (let i = 0; i < items.length && !blocked; i += 1) {
        const item = items[i];
        const distance = Math.hypot(item.x - x, item.y - y);
        blocked = distance < (Math.max(item.w, item.h) + Math.max(w, h)) * 0.52;
      }
      if (blocked) continue;
      items.push({ type: spec.type, x, y, w, h, angle, scale });
    }
    return items;
  }

  function pickSpawn(layout, rng) {
    const { target, parkedCars, obstacles, roadTop, controlTop, carLength, carWidth } = layout;
    let minY = roadTop + carWidth * 0.9;
    let maxY = controlTop - carWidth * 0.9;
    if (maxY <= minY) {
      const mid = (roadTop + controlTop) / 2;
      minY = mid - 1;
      maxY = mid + 1;
    }
    const farRight = target.cx < W / 2;
    const minX = farRight ? W * 0.52 : carLength * 0.64;
    const maxX = farRight ? W - carLength * 0.64 : W * 0.48;
    const carBoxes = parkedCars.map((car) => makeObb(car.x, car.y, carLength * 1.05, carWidth * 1.12, car.angle));
    const obstacleBoxes = obstacles.map((item) => makeObb(item.x, item.y, item.w * 1.1, item.h * 1.1, item.angle));
    const slotZone = targetObb(target, 1.12);

    for (let attempt = 0; attempt < 90; attempt += 1) {
      const x = lerp(minX, maxX, rng());
      const y = lerp(minY, maxY, rng());
      if (Math.hypot(x - target.cx, y - target.cy) < W * 0.3) continue;
      const box = makeObb(x, y, carLength * 1.2, carWidth * 1.45, 0);
      if (obbOverlap(box, slotZone)) continue;
      let blocked = false;
      for (let i = 0; i < carBoxes.length && !blocked; i += 1) blocked = obbOverlap(box, carBoxes[i]);
      for (let i = 0; i < obstacleBoxes.length && !blocked; i += 1) blocked = obbOverlap(box, obstacleBoxes[i]);
      if (blocked) continue;
      return { x, y, angle: 0 };
    }

    // 兜底位置可能压着路障，直接把压住的路障移走，保证这局一定开得出去
    const x = clamp(lerp(minX, maxX, 0.6), carLength * 0.64, W - carLength * 0.64);
    const y = (minY + maxY) / 2;
    const box = makeObb(x, y, carLength * 1.25, carWidth * 1.5, 0);
    layout.obstacles = obstacles.filter(
      (item) => !obbOverlap(box, makeObb(item.x, item.y, item.w * 1.1, item.h * 1.1, item.angle))
    );
    return { x, y, angle: 0 };
  }

  /* ---------------- 碰撞 ---------------- */

  function pointInCurbBays(bays, px, py) {
    for (let i = 0; i < bays.length; i += 1) {
      if (pointInTarget(bays[i], px, py, 4)) return true;
    }
    return false;
  }

  function obbHitsScene(box) {
    const { carLength, carWidth, parkedCars, obstacles, controlTop, roadTop, curbBays } = game.layout;
    const curb = roadTop - 3;
    for (let i = 0; i < 4; i += 1) {
      const point = box.points[i];
      if (point.x < 5 || point.x > W - 5 || point.y > controlTop + 4) return true;
      // 路肩以上只有开了口的车位内部可以进，其余草坪当墙处理
      if (point.y < curb && !pointInCurbBays(curbBays, point.x, point.y)) return true;
    }
    for (let i = 0; i < parkedCars.length; i += 1) {
      const parked = parkedCars[i];
      writeObb(probeOther, parked.x, parked.y, carLength * 0.97, carWidth * 0.95, parked.angle);
      if (obbOverlap(box, probeOther)) return true;
    }
    for (let i = 0; i < obstacles.length; i += 1) {
      const item = obstacles[i];
      writeObb(probeOther, item.x, item.y, item.w, item.h, item.angle);
      if (obbOverlap(box, probeOther)) return true;
    }
    return false;
  }

  function carFits(x, y, angle) {
    const { carLength, carWidth } = game.layout;
    writeObb(probeCar, x, y, carLength * 0.96, carWidth * 0.94, angle);
    return !obbHitsScene(probeCar);
  }

  const CONTACT_CLEAR = 0;
  const CONTACT_SLIDE = 1;
  const CONTACT_BLOCKED = 2;

  // 整帧回滚会让贴着障碍物的车完全动不了，这里按轴逐个退让，
  // 最后还允许原地转向，避免玩家被卡死。
  function moveCar(nextX, nextY, nextAngle) {
    const car = game.car;
    const prevX = car.x;
    const prevY = car.y;
    const prevAngle = car.angle;
    if (carFits(nextX, nextY, nextAngle)) {
      car.x = nextX; car.y = nextY; car.angle = nextAngle;
      return CONTACT_CLEAR;
    }
    if (carFits(nextX, prevY, nextAngle)) {
      car.x = nextX; car.angle = nextAngle;
      return CONTACT_SLIDE;
    }
    if (carFits(prevX, nextY, nextAngle)) {
      car.y = nextY; car.angle = nextAngle;
      return CONTACT_SLIDE;
    }
    if (carFits(nextX, nextY, prevAngle)) {
      car.x = nextX; car.y = nextY;
      return CONTACT_SLIDE;
    }
    if (carFits(prevX, prevY, nextAngle)) car.angle = nextAngle;
    return CONTACT_BLOCKED;
  }

  function settleCarIntoScene() {
    if (carFits(game.car.x, game.car.y, game.car.angle)) return;
    const radii = [6, 12, 20, 30, 44, 60, 80];
    for (let r = 0; r < radii.length; r += 1) {
      for (let i = 0; i < 12; i += 1) {
        const angle = (i / 12) * Math.PI * 2;
        const x = game.car.x + Math.cos(angle) * radii[r];
        const y = game.car.y + Math.sin(angle) * radii[r];
        if (carFits(x, y, game.car.angle)) {
          game.car.x = x;
          game.car.y = y;
          return;
        }
      }
    }
    const spawn = game.layout.spawn;
    game.car.x = spawn.x;
    game.car.y = spawn.y;
    game.car.angle = spawn.angle;
  }

  /* ---------------- 布局与尺寸 ---------------- */

  function normalizedCarPos(layout) {
    const span = Math.max(1, layout.controlTop - layout.roadTop);
    return {
      u: game.car.x / Math.max(1, W),
      v: (game.car.y - layout.roadTop) / span,
    };
  }

  function applyNormalizedCarPos(pos) {
    const layout = game.layout;
    const span = layout.controlTop - layout.roadTop;
    game.car.x = clamp(pos.u * W, layout.carLength * 0.6, W - layout.carLength * 0.6);
    game.car.y = clamp(layout.roadTop + pos.v * span, layout.playTop + layout.carWidth, layout.controlTop - layout.carWidth);
    settleCarIntoScene();
  }

  function resize() {
    const rect = gameEl.getBoundingClientRect();
    const previousLayout = game.layout;
    const previousCar = previousLayout ? normalizedCarPos(previousLayout) : null;
    W = Math.max(300, rect.width);
    H = Math.max(480, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!game.map) game.map = makeMap();
    game.layout = projectMap(game.map);

    if (game.state === "ready") {
      resetCar();
    } else if (previousCar) {
      applyNormalizedCarPos(previousCar);
      // 地址栏收起等尺寸变化会挪动场地，这段时间内不因此扣时间
      game.penaltyGrace = Math.max(game.penaltyGrace, 0.8);
    }
    game.tank.y = game.layout.roadTop + (game.layout.roadBottom - game.layout.roadTop) * 0.46;
    updateOrientationGuard(rect);
  }

  function updateOrientationGuard(rect) {
    const box = rect || gameEl.getBoundingClientRect();
    const blocked = box.height < 480 || box.width > box.height * 1.02;
    if (blocked === orientationBlocked) return;
    orientationBlocked = blocked;
    rotateOverlay.classList.toggle("is-visible", blocked);
    rotateOverlay.setAttribute("aria-hidden", String(!blocked));
    if (blocked && game.state === "playing") pauseGame();
  }

  function resetCar() {
    const spawn = game.layout.spawn;
    game.car.x = spawn.x;
    game.car.y = spawn.y;
    game.car.angle = spawn.angle;
    game.car.speed = 0;
    game.car.destroyed = false;
    settleCarIntoScene();
  }

  /* ---------------- 本地记录 ---------------- */

  function readSoundPref() {
    try {
      const raw = window.localStorage.getItem(SOUND_KEY);
      if (raw === "0") return false;
      if (raw === "1") return true;
    } catch (_) {
      /* 读不到就用默认开 */
    }
    return true;
  }

  function writeSoundPref() {
    try {
      window.localStorage.setItem(SOUND_KEY, soundEnabled ? "1" : "0");
    } catch (_) {
      /* 无痕模式写不了，忽略即可 */
    }
  }

  function syncSoundToggle() {
    soundToggle.classList.toggle("is-muted", !soundEnabled);
    soundToggle.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
    soundToggle.setAttribute("aria-label", soundEnabled ? "关闭声音" : "打开声音");
    soundToggle.setAttribute("title", soundEnabled ? "声音开" : "声音关");
  }

  function introSeen() {
    try {
      return window.localStorage.getItem(INTRO_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function markIntroSeen() {
    try {
      window.localStorage.setItem(INTRO_KEY, "1");
    } catch (_) {
      /* 记不住就下次再教一遍 */
    }
  }

  let records = readRecords();

  function readRecords() {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== "object") return {};
      // 老版本存过已下线科目的成绩，留着会把总局数和毕业进度算错
      const cleaned = {};
      Object.keys(parsed).forEach((key) => {
        const [mode, difficulty] = key.split(":");
        if (MODE_ORDER.includes(mode) && DIFF_ORDER.includes(difficulty)) cleaned[key] = parsed[key];
      });
      return cleaned;
    } catch (_) {
      return {};
    }
  }

  function writeRecords() {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(records));
    } catch (_) {
      /* 无痕模式等场景写不了，忽略即可 */
    }
  }

  function recordFor(mode, difficulty) {
    return records[`${mode}:${difficulty}`] || null;
  }

  function totalPlays() {
    return Object.keys(records).reduce((sum, key) => sum + (records[key].plays || 0), 0);
  }

  function clearedCount() {
    let count = 0;
    MODE_ORDER.forEach((mode) => {
      DIFF_ORDER.forEach((difficulty) => {
        const entry = recordFor(mode, difficulty);
        if (entry && entry.clears > 0) count += 1;
      });
    });
    return count;
  }

  function totalBestStars() {
    let stars = 0;
    MODE_ORDER.forEach((mode) => {
      DIFF_ORDER.forEach((difficulty) => {
        const entry = recordFor(mode, difficulty);
        stars += entry ? entry.bestStars || 0 : 0;
      });
    });
    return stars;
  }

  function allCleared() {
    return clearedCount() >= MODE_ORDER.length * DIFF_ORDER.length;
  }

  function formatStarTime(limit) {
    const value = limit * 0.42;
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  function commitRun(run) {
    const key = `${run.mode}:${run.difficulty}`;
    const entry = records[key] || { bestTime: null, bestStars: 0, clears: 0, plays: 0 };
    entry.plays += 1;
    let improved = false;
    if (run.success) {
      entry.clears += 1;
      if (entry.bestTime === null || run.netTime < entry.bestTime) {
        entry.bestTime = run.netTime;
        improved = true;
      }
      if (run.stars > entry.bestStars) entry.bestStars = run.stars;
    }
    records[key] = entry;
    writeRecords();
    return improved;
  }

  function rateRun(netTime, hits, limit) {
    if (hits === 0 && netTime <= limit * 0.42) return 3;
    if (hits <= 1 && netTime <= limit * 0.72) return 2;
    return 1;
  }

  function renderStartRecord() {
    const entry = recordFor(game.mode, game.difficulty);
    if (!entry || entry.bestTime === null) {
      startRecord.textContent = entry && entry.plays
        ? `这一科玩了 ${entry.plays} 局，还没通关`
        : "这一科还没有记录";
      return;
    }
    startRecord.textContent = "最佳 ";
    const value = document.createElement("b");
    value.textContent = `${entry.bestTime.toFixed(1)} 秒`;
    const tail = document.createElement("span");
    tail.textContent = ` · ${"★".repeat(entry.bestStars)}${"☆".repeat(3 - entry.bestStars)} · 通关 ${entry.clears} 次`;
    startRecord.append(value, tail);
  }

  function renderRecordGrid() {
    recordGrid.textContent = "";
    const head = document.createElement("div");
    head.className = "record-grid-row is-head";
    head.setAttribute("role", "row");
    ["", "简单", "困难", "地狱"].forEach((label) => {
      const cell = document.createElement("span");
      cell.textContent = label;
      head.appendChild(cell);
    });
    recordGrid.appendChild(head);

    MODE_ORDER.forEach((mode) => {
      const row = document.createElement("div");
      row.className = "record-grid-row";
      row.setAttribute("role", "row");
      const name = document.createElement("span");
      name.className = "record-grid-mode";
      name.textContent = MODES[mode].short;
      row.appendChild(name);
      DIFF_ORDER.forEach((difficulty) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "record-cell";
        button.dataset.mode = mode;
        button.dataset.difficulty = difficulty;
        const entry = recordFor(mode, difficulty);
        const selected = game.mode === mode && game.difficulty === difficulty;
        if (selected) button.classList.add("is-selected");
        if (entry && entry.clears) {
          button.classList.add(entry.bestStars >= 3 ? "is-perfect" : "is-cleared");
          button.textContent = "★".repeat(entry.bestStars) + "☆".repeat(3 - entry.bestStars);
        } else if (entry && entry.plays) {
          button.classList.add("is-tried");
          button.textContent = "未过";
        } else {
          button.textContent = "·";
        }
        button.setAttribute("aria-label", `${MODES[mode].label} ${DIFFICULTIES[difficulty].label}`);
        row.appendChild(button);
      });
      recordGrid.appendChild(row);
    });
  }

  /* ---------------- 流程 ---------------- */

  function syncSetupUi() {
    const mode = MODES[game.mode];
    const level = DIFFICULTIES[game.difficulty];
    const played = totalPlays() > 0;
    difficultyBadge.textContent = `${mode.label} · ${level.label} · ${level.time} 秒`;
    if (!introSeen()) {
      startStamp.textContent = "首局带 10 秒教学";
      startButtonLabel.textContent = `开始${mode.label}`;
    } else {
      startStamp.textContent = `⚠ 坦克还有 ${level.time} 秒`;
      startButtonLabel.textContent = `开始${mode.label} · ${level.label}`;
    }
    posterCard.classList.toggle("has-played", played);
    howTo.hidden = played;
    modeButtons.forEach((button) => {
      const selected = button.dataset.mode === game.mode;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-checked", String(selected));
    });
    difficultyButtons.forEach((button) => {
      const selected = button.dataset.difficulty === game.difficulty;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-checked", String(selected));
    });
    renderRecordGrid();
    renderStartRecord();
  }

  function selectSetup(mode, difficulty, autostart) {
    if (mode && MODES[mode]) game.mode = mode;
    if (difficulty && DIFFICULTIES[difficulty]) game.difficulty = difficulty;
    game.timeLimit = DIFFICULTIES[game.difficulty].time;
    resetGame(Boolean(autostart));
  }

  function resetGame(autostart = true, reuseMap = false) {
    const level = DIFFICULTIES[game.difficulty];
    const sameSetup = game.map && game.map.mode === game.mode && game.map.difficulty === game.difficulty;
    if (!reuseMap || !sameSetup) game.map = makeMap();
    game.layout = projectMap(game.map);
    game.state = autostart ? "playing" : "ready";
    game.timeLimit = level.time;
    game.timeLeft = level.time;
    game.elapsed = 0;
    game.penalty = 0;
    game.hits = 0;
    game.scrapes = 0;
    game.stableTime = 0;
    game.collisionCooldown = 0;
    game.scrapeCooldown = 0;
    game.penaltyGrace = 0;
    game.flash = 0;
    game.driveDirection = -1;
    game.successFx = 0;
    // 首次游玩的正式局前先做三步操作教学，教学期间不计时
    game.guide.active = autostart && !introSeen();
    game.guide.step = 0;
    game.guide.holdTimer = 0;
    lastReverseBeepAt = 0;
    lastCountdownSecond = null;
    game.particles.length = 0;
    game.skidMarks.length = 0;
    game.tank.x = -getTankSize() * 0.82;
    game.tank.y = game.layout.roadTop + (game.layout.roadBottom - game.layout.roadTop) * 0.44;
    game.tank.crushedCar = false;
    game.tank.crushedScene = false;
    game.tank.endTimer = 0;
    game.tank.smokeTimer = 0;
    input.steer = 0;
    input.steerTarget = 0;
    input.gas = false;
    input.brake = false;
    input.steerPointer = null;
    input.steerPointerAngle = null;
    input.steerDragDegrees = 0;
    input.steerReturnRate = 0;
    gasButton.classList.remove("is-pressed");
    brakeButton.classList.remove("is-pressed");
    resetCar();
    refreshParkStatus();
    pauseOverlay.classList.remove("is-visible");
    resultOverlay.classList.remove("is-visible");
    controlsEl.classList.toggle("is-disabled", !autostart);
    pauseButton.hidden = !autostart;
    gameEl.classList.toggle("is-live", autostart);
    gameEl.classList.remove("is-shaking");
    hudCache.guiding = null;
    hudCache.timerLabel = null;
    syncGuideUi();
    updateHud();
    syncSetupUi();
    setEngine(false);
    setTankRumble(false);
  }

  function startGame() {
    initAudio();
    startOverlay.classList.remove("is-visible");
    // 沿用开始页预览的那张场地，避免点开始后场地突然变了
    resetGame(true, true);
    if (game.guide.active) showToast("先花 10 秒学会开车", 1.4);
    else showToast(MODES[game.mode].hint);
  }

  function pauseGame() {
    if (game.state !== "playing") return;
    game.state = "paused";
    input.gas = false;
    input.brake = false;
    input.steerTarget = 0;
    input.steerPointer = null;
    input.steerPointerAngle = null;
    input.steerDragDegrees = input.steer * 360;
    input.steerReturnRate = 0;
    gasButton.classList.remove("is-pressed");
    brakeButton.classList.remove("is-pressed");
    controlsEl.classList.add("is-disabled");
    pauseButton.hidden = true;
    const mode = MODES[game.mode];
    const level = DIFFICULTIES[game.difficulty];
    if (game.guide.active) pauseSummary.textContent = `${mode.label} · 教学中 · 还没开始计时`;
    else pauseSummary.textContent = `${mode.label} · ${level.label} · 剩余 ${game.timeLeft.toFixed(1)} 秒`;
    hideToast();
    pauseOverlay.classList.add("is-visible");
    setEngine(false);
    setTankRumble(false);
  }

  function resumeGame() {
    if (game.state !== "paused") return;
    if (orientationBlocked) return;
    game.state = "playing";
    pauseOverlay.classList.remove("is-visible");
    controlsEl.classList.remove("is-disabled");
    pauseButton.hidden = false;
    lastFrame = performance.now();
    game.penaltyGrace = Math.max(game.penaltyGrace, 0.4);
    setEngine(Math.abs(game.car.speed) > 1);
  }

  function exitPausedGame() {
    if (game.state !== "paused") return;
    pauseOverlay.classList.remove("is-visible");
    resetGame(false);
    startOverlay.classList.add("is-visible");
  }

  function showToast(message, duration = 1.25) {
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    toastTimer = duration;
  }

  function hideToast() {
    toastTimer = 0;
    toastEl.classList.remove("is-visible");
  }

  /* ---------------- HUD ---------------- */

    const hudCache = {
    speed: null,
    moving: null,
    timer: null,
    timerLabel: null,
    urgent: null,
    guiding: null,
    mission: null,
    wheel: null,
    steer: null,
  };

  function updateHud() {
    const speedKmh = Math.round(Math.abs(game.car.speed) * SPEED_TO_KMH);
    if (hudCache.speed !== speedKmh) {
      hudCache.speed = speedKmh;
      speedValue.textContent = String(speedKmh);
      speedMeter.setAttribute("aria-valuenow", String(speedKmh));
    }
    const moving = speedKmh > 0;
    if (hudCache.moving !== moving) {
      hudCache.moving = moving;
      speedMeter.classList.toggle("is-moving", moving);
    }
    const timerText = game.timeLeft.toFixed(1);
    if (hudCache.timer !== timerText) {
      hudCache.timer = timerText;
      timerEl.textContent = timerText;
    }
    const guiding = Boolean(game.guide.active);
    const labelText = guiding ? "教学中" : "坦克到达";
    if (hudCache.timerLabel !== labelText) {
      hudCache.timerLabel = labelText;
      timerLabel.textContent = labelText;
    }
    if (hudCache.guiding !== guiding) {
      hudCache.guiding = guiding;
      timerBox.classList.toggle("is-practice", guiding);
    }
    const urgent = game.state === "playing" && !guiding && game.timeLeft <= 8;
    if (hudCache.urgent !== urgent) {
      hudCache.urgent = urgent;
      timerBox.classList.toggle("is-urgent", urgent);
    }
    const mission = missionMessage();
    if (hudCache.mission !== mission) {
      hudCache.mission = mission;
      missionText.textContent = mission;
    }
  }

  function missionMessage() {
    if (game.state === "tank") return "没停进去。坦克来了。";
    if (game.state === "failed") return "道路已清空，建议重考";
    if (game.state === "success") return "停车完成，路保住了";
    if (game.state === "paused") return "游戏已暂停";
    if (game.state === "playing") {
      if (game.guide.active) return "教学中 · 坦克还在睡觉";
      return parkingHint();
    }
    return MODES[game.mode].hint;
  }

  function parkingHint() {
    const park = game.park;
    if (park.inside && !park.aligned) return "车进框了，把方向摆正";
    if (park.inside && park.aligned && !park.stopped) return "位置对了，松开踏板停稳";
    if (park.inside && park.aligned && park.stopped) return "稳住别动，别再碰踏板";
    if (game.car.speed < -5) return "正在倒车 · 看准车尾";
    if (game.car.speed > 5) return "前进中 · 刹车后继续长按可倒车";
    return MODES[game.mode].hint;
  }

  /* ---------------- 首局教学 ---------------- */

  const GUIDE_STEPS = [
    { text: "左手：沿圆周把方向盘转起来", check: () => Math.abs(input.steer) * 360 >= 80 },
    { text: "右手：按住油门往前开", check: () => game.car.speed > 14 },
    { text: "按住刹车不松手，车会倒退", check: () => game.car.speed < -6 },
  ];

  function syncGuideUi() {
    const guide = game.guide;
    const active = Boolean(guide.active);
    guideTip.hidden = !active;
    guideFinger.hidden = !(active && guide.step === 0);
    wheelPad.classList.toggle("is-guide-target", active && guide.step === 0);
    gasButton.classList.toggle("is-guide-target", active && guide.step === 1);
    brakeButton.classList.toggle("is-guide-target", active && guide.step === 2);
    if (!active) return;
    const step = Math.min(guide.step, GUIDE_STEPS.length - 1);
    guideStepBadge.textContent = `教学 ${step + 1}/${GUIDE_STEPS.length}`;
    guideText.textContent = GUIDE_STEPS[step].text;
  }

  function updateGuide(dt) {
    const guide = game.guide;
    if (guide.holdTimer > 0) {
      guide.holdTimer -= dt;
      if (guide.holdTimer <= 0) {
        guide.step += 1;
        if (guide.step >= GUIDE_STEPS.length) finishGuide();
        else syncGuideUi();
      }
      return;
    }
    if (GUIDE_STEPS[guide.step].check()) {
      guide.holdTimer = 0.55;
      playTone(660, 0.12, "sine", 0.05, 0, 880);
      showToast("✓ 就是这样", 0.7);
    }
  }

  function finishGuide() {
    if (!game.guide.active) return;
    game.guide.active = false;
    game.guide.holdTimer = 0;
    markIntroSeen();
    syncGuideUi();
    // 教学期开出去的碰撞和用时全部清零，正式局从这一刻干净起跑
    game.elapsed = 0;
    game.penalty = 0;
    game.hits = 0;
    game.scrapes = 0;
    game.stableTime = 0;
    game.timeLeft = game.timeLimit;
    lastCountdownSecond = null;
    playTone(523, 0.16, "sine", 0.05, 0, 660);
    playTone(784, 0.2, "sine", 0.05, 0.12, 800);
    showToast(`教学完成 · ${game.timeLimit} 秒倒计时开始！`, 1.7);
  }

  /* ---------------- 声音 ---------------- */

  function resumeAudioContext() {
    if (!audioCtx || audioCtx.state !== "suspended" || typeof audioCtx.resume !== "function") return;
    const resumeResult = audioCtx.resume();
    if (resumeResult && typeof resumeResult.catch === "function") resumeResult.catch(() => {});
  }

  function initAudio() {
    if (audioCtx) {
      resumeAudioContext();
      return;
    }
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      engineOsc = audioCtx.createOscillator();
      engineGain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();
      engineOsc.type = "sawtooth";
      engineOsc.frequency.value = 48;
      filter.type = "lowpass";
      filter.frequency.value = 180;
      engineGain.gain.value = 0;
      engineOsc.connect(filter).connect(engineGain).connect(audioCtx.destination);
      engineOsc.start();

      tankOsc = audioCtx.createOscillator();
      tankGain = audioCtx.createGain();
      const tankFilter = audioCtx.createBiquadFilter();
      tankOsc.type = "sawtooth";
      tankOsc.frequency.value = 34;
      tankFilter.type = "lowpass";
      tankFilter.frequency.value = 105;
      tankGain.gain.value = 0;
      tankOsc.connect(tankFilter).connect(tankGain).connect(audioCtx.destination);
      tankOsc.start();
      engineActive = false;
      tankActive = false;
    } catch (_) {
      soundEnabled = false;
      syncSoundToggle();
    }
  }

  // 音量只在开关翻转时改一次，频率单独节流，避免每帧重排同一个 AudioParam
  function setEngine(active) {
    if (!audioCtx || !engineGain) return;
    const want = Boolean(soundEnabled && active);
    if (want === engineActive) return;
    engineActive = want;
    const now = audioCtx.currentTime;
    engineGain.gain.cancelScheduledValues(now);
    engineGain.gain.linearRampToValueAtTime(want ? 0.025 : 0, now + 0.08);
  }

  function setTankRumble(active) {
    if (!audioCtx || !tankGain) return;
    const want = Boolean(soundEnabled && active);
    if (want === tankActive) return;
    tankActive = want;
    const now = audioCtx.currentTime;
    tankGain.gain.cancelScheduledValues(now);
    tankGain.gain.linearRampToValueAtTime(want ? 0.045 : 0, now + 0.12);
  }

  function tickEngineTone(now) {
    if (!engineActive || !audioCtx || !engineOsc || now - engineToneAt < 90) return;
    engineToneAt = now;
    engineOsc.frequency.setTargetAtTime(48 + Math.abs(game.car.speed) * 0.55, audioCtx.currentTime, 0.1);
  }

  function tickTankTone(now) {
    if (!tankActive || !audioCtx || !tankOsc || now - tankToneAt < 90) return;
    tankToneAt = now;
    tankOsc.frequency.setTargetAtTime(34 + Math.sin(now / 85) * 2.5, audioCtx.currentTime, 0.08);
  }

  function playTone(frequency, duration, type = "sine", volume = 0.04, delay = 0, endFrequency = frequency) {
    if (!soundEnabled || !audioCtx) return;
    resumeAudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const start = audioCtx.currentTime + delay;
    const end = start + duration;
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, frequency), start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), end);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, end);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(start);
    osc.stop(end + 0.02);
  }

  function playUiClick() {
    playTone(210, 0.055, "square", 0.022, 0, 145);
  }

  function playReverseBeep() {
    playTone(880, 0.085, "square", 0.035);
    lastReverseBeepAt = performance.now();
  }

  function playScrape() {
    playTone(158, 0.1, "square", 0.018, 0, 96);
  }

  function playCountdownTick(secondsLeft) {
    const urgent = secondsLeft <= 3;
    playTone(urgent ? 1120 : 760, urgent ? 0.085 : 0.055, "sine", urgent ? 0.06 : 0.038);
    if (urgent) playTone(840, 0.06, "sine", 0.035, 0.09);
  }

  function playSuccessChime(isHell) {
    const notes = isHell ? [523, 659, 784, 1047] : [523, 659, 784];
    notes.forEach((note, index) => playTone(note, 0.22, "sine", 0.055, index * 0.1, note * 1.015));
  }

  function soundBurst(type = "hit") {
    if (!soundEnabled || !audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;
    osc.type = type === "success" ? "sine" : "square";
    osc.frequency.setValueAtTime(type === "success" ? 440 : 85, now);
    osc.frequency.exponentialRampToValueAtTime(type === "success" ? 760 : 38, now + 0.22);
    gain.gain.setValueAtTime(type === "success" ? 0.08 : 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /* ---------------- 输入 ---------------- */

  function bindPedal(button, key) {
    const release = (event) => {
      if (button.hasPointerCapture?.(event.pointerId)) button.releasePointerCapture(event.pointerId);
      input[key] = false;
      button.classList.remove("is-pressed");
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (game.state !== "playing") return;
      button.setPointerCapture?.(event.pointerId);
      input[key] = true;
      if (key === "gas") game.driveDirection = 1;
      if (key === "brake" && Math.abs(game.car.speed) < 2) {
        game.driveDirection = -1;
        playReverseBeep();
      }
      button.classList.add("is-pressed");
    });
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", () => {
      input[key] = false;
      button.classList.remove("is-pressed");
    });
  }

  function getSteerPointerAngle(event) {
    const rect = wheelPad.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(event.clientY - centerY, event.clientX - centerX);
  }

  function rotateSteerFromPointer(event) {
    const nextAngle = getSteerPointerAngle(event);
    if (input.steerPointerAngle === null) {
      input.steerPointerAngle = nextAngle;
      return;
    }
    const delta = normalizeAngle(nextAngle - input.steerPointerAngle);
    input.steerDragDegrees = clamp(input.steerDragDegrees + (delta * 180) / Math.PI, -360, 360);
    input.steerTarget = input.steerDragDegrees / 360;
    input.steer = input.steerTarget;
    input.steerPointerAngle = nextAngle;
  }

  wheelPad.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (game.state !== "playing") return;
    input.steerPointer = event.pointerId;
    input.steerPointerAngle = getSteerPointerAngle(event);
    input.steerDragDegrees = input.steer * 360;
    input.steerTarget = input.steer;
    wheelPad.setPointerCapture?.(event.pointerId);
  });
  wheelPad.addEventListener("pointermove", (event) => {
    if (event.pointerId !== input.steerPointer) return;
    event.preventDefault();
    rotateSteerFromPointer(event);
  });
  const releaseSteer = (event) => {
    if (event.pointerId !== input.steerPointer) return;
    if (wheelPad.hasPointerCapture?.(event.pointerId)) wheelPad.releasePointerCapture(event.pointerId);
    input.steerPointer = null;
    input.steerPointerAngle = null;
    input.steerTarget = 0;
    input.steerDragDegrees = input.steer * 360;
    input.steerReturnRate = 0;
  };
  wheelPad.addEventListener("pointerup", releaseSteer);
  wheelPad.addEventListener("pointercancel", releaseSteer);

  bindPedal(gasButton, "gas");
  bindPedal(brakeButton, "brake");

  const keyMap = {
    ArrowLeft: () => { input.steerTarget = -1; },
    ArrowRight: () => { input.steerTarget = 1; },
    ArrowUp: () => { input.gas = true; game.driveDirection = 1; gasButton.classList.add("is-pressed"); },
    ArrowDown: () => {
      input.brake = true;
      if (Math.abs(game.car.speed) < 2) {
        game.driveDirection = -1;
        playReverseBeep();
      }
      brakeButton.classList.add("is-pressed");
    },
  };
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (game.state === "playing") pauseGame();
      else if (game.state === "paused") resumeGame();
      return;
    }
    if (keyMap[event.key] && game.state === "playing") {
      event.preventDefault();
      keyMap[event.key]();
    }
  });
  window.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") input.steerTarget = 0;
    if (event.key === "ArrowUp") { input.gas = false; gasButton.classList.remove("is-pressed"); }
    if (event.key === "ArrowDown") { input.brake = false; brakeButton.classList.remove("is-pressed"); }
  });

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => selectSetup(button.dataset.mode, null, false));
  });
  difficultyButtons.forEach((button) => {
    button.addEventListener("click", () => selectSetup(null, button.dataset.difficulty, false));
  });
  startButton.addEventListener("click", startGame);
  guideSkip.addEventListener("click", finishGuide);
  pauseButton.addEventListener("click", pauseGame);
  continueButton.addEventListener("click", resumeGame);
  pauseRestartButton.addEventListener("click", () => resetGame(true));
  pauseExitButton.addEventListener("click", exitPausedGame);
  restartButton.addEventListener("click", () => resetGame(true));
  nextDifficultyButton.addEventListener("click", () => {
    const mode = nextDifficultyButton.dataset.mode;
    const difficulty = nextDifficultyButton.dataset.difficulty;
    if (mode && difficulty) selectSetup(mode, difficulty, true);
  });
  changeDifficultyButton.addEventListener("click", () => {
    resetGame(false);
    startOverlay.classList.add("is-visible");
  });
  shareXhsButton.addEventListener("click", postShareNote);
  recordGrid.addEventListener("click", (event) => {
    const cell = event.target.closest("[data-mode]");
    if (!cell) return;
    selectSetup(cell.dataset.mode, cell.dataset.difficulty, false);
  });
  soundToggle.addEventListener("click", () => {
    initAudio();
    soundEnabled = !soundEnabled;
    writeSoundPref();
    syncSoundToggle();
    if (!soundEnabled) {
      setEngine(false);
      setTankRumble(false);
    } else {
      if (game.state === "playing") setEngine(Math.abs(game.car.speed) > 1);
      if (game.state === "tank") setTankRumble(true);
    }
  });
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.classList.contains("pedal")) return;
    initAudio();
    playUiClick();
  });

  /* ---------------- 主循环 ---------------- */

  function updateSteer(dt) {
    if (game.state !== "playing") {
      input.steerReturnRate = 0;
      return;
    }
    if (input.steerPointer !== null) {
      input.steerReturnRate = 0;
      return;
    }
    if (input.steerTarget !== 0) {
      input.steerReturnRate = 0;
      input.steer = lerp(input.steer, input.steerTarget, 1 - Math.pow(0.0005, dt));
      return;
    }
    const remaining = Math.abs(input.steer);
    if (remaining < 0.0015) {
      input.steer = 0;
      input.steerReturnRate = 0;
      return;
    }
    const rateCap = STEER_RETURN_MAX_RATE * Math.min(1, Math.sqrt(remaining / STEER_RETURN_EASE_SPAN));
    input.steerReturnRate = Math.min(rateCap, input.steerReturnRate + STEER_RETURN_ACCEL * dt);
    const step = Math.min(remaining, input.steerReturnRate * dt);
    input.steer -= Math.sign(input.steer) * step;
  }

  function update(dt, now) {
    toastTimer -= dt;
    if (toastTimer <= 0) toastEl.classList.remove("is-visible");
    game.flash = Math.max(0, game.flash - dt * 2.4);
    game.collisionCooldown = Math.max(0, game.collisionCooldown - dt);

    updateSteer(dt);
    const wheelDegrees = input.steer * 360;
    const wheelText = `${wheelDegrees.toFixed(1)}deg`;
    if (hudCache.wheel !== wheelText) {
      hudCache.wheel = wheelText;
      wheelEl.style.setProperty("--steer-angle", wheelText);
    }
    const displayedDegrees = Math.abs(wheelDegrees) < 3 ? 0 : Math.round(wheelDegrees);
    if (hudCache.steer !== displayedDegrees) {
      hudCache.steer = displayedDegrees;
      steerReadout.textContent = `${displayedDegrees}°`;
      wheelPad.setAttribute("aria-valuenow", String(displayedDegrees));
    }

    decaySkidMarks(dt);
    if (game.state === "playing") updatePlaying(dt);
    else refreshParkStatus();
    if (game.state === "success") game.successFx = Math.min(1, game.successFx + dt * 1.5);
    if (game.state === "tank") updateTank(dt, now);
    updateParticles(dt);
    tickEngineTone(now);
    updateHud();
  }

  function updatePlaying(dt) {
    if (game.guide.active) {
      // 教学期不计时也不罚时，撞了只提示
      game.penaltyGrace = Math.max(game.penaltyGrace, 0.5);
      updateGuide(dt);
    } else {
      game.elapsed += dt;
    }
    game.penaltyGrace = Math.max(0, game.penaltyGrace - dt);
    game.scrapeCooldown = Math.max(0, game.scrapeCooldown - dt);
    game.timeLeft = Math.max(0, game.timeLimit - game.elapsed - game.penalty);

    const car = game.car;
    if (input.gas && !input.brake) {
      car.speed += (car.speed < 0 ? 118 : 82) * dt;
    } else if (input.brake && !input.gas) {
      car.speed -= (car.speed > 0 ? 142 : 66) * dt;
    } else {
      const drag = 42 * dt;
      if (Math.abs(car.speed) <= drag) car.speed = 0;
      else car.speed -= Math.sign(car.speed) * drag;
    }
    car.speed = clamp(car.speed, -76, 112);

    if (car.speed > 2) game.driveDirection = 1;
    else if (car.speed < -2) game.driveDirection = -1;
    else if (input.gas) game.driveDirection = 1;
    else if (input.brake) game.driveDirection = -1;

    // 自行车模型本身已经让低速转得慢，这里只保留一点点速度感，
    // 否则“慢慢挪”会变成最难掰弯的操作。
    const speedRatio = clamp(Math.abs(car.speed) / 38, 0.72, 1);
    const maxSteer = 0.57 * speedRatio;
    const wheelbase = game.layout.carLength * 0.62;
    const impactSpeed = Math.abs(car.speed);
    const nextAngle = normalizeAngle(
      car.angle + (car.speed / wheelbase) * Math.tan(input.steer * maxSteer) * dt
    );
    const nextX = car.x + Math.cos(nextAngle) * car.speed * dt;
    const nextY = car.y + Math.sin(nextAngle) * car.speed * dt;
    const contact = moveCar(nextX, nextY, nextAngle);

    if (contact === CONTACT_BLOCKED) {
      car.speed *= -0.22;
      if (impactSpeed > 8) registerImpact();
    } else if (contact === CONTACT_SLIDE) {
      car.speed *= 0.62;
      if (impactSpeed > 10) registerScrape();
    }

    if (Math.abs(car.speed) > 36 && Math.abs(input.steer) > 0.62 && Math.random() < dt * 7) {
      game.skidMarks.push({ x: car.x, y: car.y, angle: car.angle, life: 1 });
      if (game.skidMarks.length > 80) game.skidMarks.shift();
    }

    refreshParkStatus();
    if (game.park.inside && game.park.aligned && game.park.stopped) game.stableTime += dt;
    else game.stableTime = Math.max(0, game.stableTime - dt * 2.5);

    setEngine(Math.abs(car.speed) > 1 || input.gas || input.brake);
    updateDrivingSoundCues();

    if (!game.guide.active && game.stableTime >= STABLE_TIME) {
      completeSuccess();
      return;
    }
    if (!game.guide.active && game.timeLeft <= 0) summonTank();
  }

  function registerImpact() {
    if (game.collisionCooldown > 0) return;
    game.collisionCooldown = 0.7;
    game.hits += 1;
    game.flash = 0.8;
    burst(game.car.x, game.car.y, "#f05b32", 11);
    soundBurst("hit");
    navigator.vibrate?.(70);
    if (game.penaltyGrace > 0) {
      showToast("撞到了！");
      return;
    }
    game.penalty += IMPACT_PENALTY;
    game.timeLeft = Math.max(0, game.timeLimit - game.elapsed - game.penalty);
    showToast(`撞到了！罚 ${IMPACT_PENALTY} 秒`);
  }

  function registerScrape() {
    if (game.scrapeCooldown > 0) return;
    game.scrapeCooldown = 0.55;
    game.scrapes += 1;
    playScrape();
    if (game.scrapes <= 2) showToast("剐蹭一下，不罚时", 0.9);
  }

  function refreshParkStatus() {
    if (!game.layout) return;
    const { target, carLength, carWidth } = game.layout;
    const car = game.car;
    writeObb(probePark, car.x, car.y, carLength * 0.94, carWidth * 0.92, car.angle);
    const limitAlong = target.halfLength - 4;
    const limitAcross = target.halfWidth - 4;
    let inside = true;
    for (let i = 0; i < 4; i += 1) {
      const point = probePark.points[i];
      const dx = point.x - target.cx;
      const dy = point.y - target.cy;
      if (Math.abs(dx * target.fx + dy * target.fy) > limitAlong
        || Math.abs(dx * target.sx + dy * target.sy) > limitAcross) {
        inside = false;
        break;
      }
    }
    game.park.inside = inside;
    game.park.aligned = Math.min(
      angleDistance(car.angle, target.angle),
      angleDistance(car.angle, target.angle + Math.PI)
    ) < ALIGN_TOLERANCE;
    game.park.stopped = Math.abs(car.speed) < STOP_SPEED;
  }

  function updateDrivingSoundCues() {
    const reversing = game.car.speed < -1 || (input.brake && game.car.speed <= 0);
    if (reversing && performance.now() - lastReverseBeepAt >= 720) playReverseBeep();

    const countdownSecond = Math.ceil(game.timeLeft);
    if (!game.guide.active && game.timeLeft > 0 && game.timeLeft <= 10 && countdownSecond !== lastCountdownSecond) {
      lastCountdownSecond = countdownSecond;
      playCountdownTick(countdownSecond);
    } else if (game.timeLeft > 10) {
      lastCountdownSecond = null;
    }
  }

  function decaySkidMarks(dt) {
    const marks = game.skidMarks;
    if (!marks.length) return;
    let write = 0;
    for (let i = 0; i < marks.length; i += 1) {
      const mark = marks[i];
      mark.life -= dt * 0.06;
      if (mark.life <= 0) continue;
      marks[write] = mark;
      write += 1;
    }
    marks.length = write;
  }

  function completeSuccess() {
    game.state = "success";
    pauseButton.hidden = true;
    game.car.speed = 0;
    controlsEl.classList.add("is-disabled");
    setEngine(false);
    setTankRumble(false);
    playSuccessChime(game.difficulty === "hell");
    navigator.vibrate?.([40, 50, 90]);
    burst(game.car.x, game.car.y, "#f3df42", 34);
    showToast("稳稳入库！", 1.4);
    window.setTimeout(() => showResult(true), 1000);
  }

  function getTankSize() {
    return clamp(W * 0.36, 108, 172) * 2;
  }

  function emitTankSmoke(tank, size) {
    const life = 0.85 + Math.random() * 0.7;
    game.particles.push({
      kind: "smoke",
      x: tank.x - size * 0.58,
      y: tank.y - size * 0.08 + (Math.random() - 0.5) * size * 0.16,
      vx: -size * (0.2 + Math.random() * 0.16),
      vy: (Math.random() - 0.5) * size * 0.12,
      size: size * (0.045 + Math.random() * 0.035),
      growth: size * (0.07 + Math.random() * 0.05),
      color: Math.random() > 0.72 ? "#55584f" : "#252720",
      life,
      maxLife: life,
      spin: 0,
      angle: 0,
    });
  }

  function summonTank() {
    game.state = "tank";
    pauseButton.hidden = true;
    game.timeLeft = 0;
    game.car.speed = 0;
    input.gas = false;
    input.brake = false;
    controlsEl.classList.add("is-disabled");
    setEngine(false);
    setTankRumble(true);
    game.tank.x = -getTankSize() * 0.82;
    game.tank.y = game.layout.roadTop + (game.layout.roadBottom - game.layout.roadTop) * 0.48;
    game.tank.endTimer = 0;
    game.tank.smokeTimer = 0;
    showToast("轰——坦克真的来了", 1.8);
    soundBurst("hit");
    navigator.vibrate?.([120, 40, 120]);
  }

  function updateTank(dt, now) {
    const tank = game.tank;
    const size = getTankSize();
    tank.x += W * 0.34 * dt;
    tank.endTimer += dt;
    tickTankTone(now);
    const frontX = tank.x + size * 0.56;
    gameEl.classList.toggle("is-shaking", tank.x > -size * 0.82 && tank.x < W + size);

    tank.smokeTimer -= dt;
    while (tank.smokeTimer <= 0) {
      emitTankSmoke(tank, size);
      tank.smokeTimer += 0.11;
    }

    if (!tank.crushedScene && frontX > W * 0.37) {
      tank.crushedScene = true;
      game.flash = 1;
      burst(W * 0.4, tank.y, "#f3df42", 28);
      soundBurst("hit");
      navigator.vibrate?.([150, 45, 190]);
    }

    if (!tank.crushedCar && frontX > game.car.x) {
      tank.crushedCar = true;
      game.car.destroyed = true;
      game.flash = 1;
      burst(game.car.x, game.car.y, "#f05b32", 38);
      soundBurst("hit");
    }

    if (tank.x - size * 0.56 > W) {
      gameEl.classList.remove("is-shaking");
      game.state = "failed";
      setTankRumble(false);
      window.setTimeout(() => showResult(false), 260);
    }
  }

  /* ---------------- 结算 ---------------- */

  function nextChallenge(mode, difficulty) {
    const level = DIFFICULTIES[difficulty];
    if (level.next) return { mode, difficulty: level.next };
    const nextMode = MODE_ORDER[MODE_ORDER.indexOf(mode) + 1];
    return nextMode ? { mode: nextMode, difficulty: "easy" } : null;
  }

  // 按本局表现颁发称号和教练点评，规则从上往下第一条命中即生效
  function runVerdict(run) {
    if (!run.success) {
      if (run.almostIn) return { title: "差一个刹车的事", quip: "车都进框了，就差停稳。血亏，换张图立刻再来。" };
      if (run.hits >= 4) return { title: "碰碰车持证选手", quip: `撞了 ${run.hits} 次，你考的是拆迁资格证吧。` };
      if (run.scrapes >= 4) return { title: "贴地飞行员", quip: `剐蹭 ${run.scrapes} 次，补漆钱比学费贵。` };
      if (run.hits === 0 && run.scrapes === 0) return { title: "过分谨慎型学员", quip: "一下都没撞，就是也没停进去。" };
      return { title: "本路段已由坦克接管", quip: "路没保住。收拾心情，再考一次。" };
    }
    const level = DIFFICULTIES[run.difficulty];
    const ratio = run.netTime / level.time;
    if (run.difficulty === "hell" && run.stars === 3) return { title: "库神", quip: "地狱三星。建议直接去驾校当教练。" };
    if (run.stars === 3) return { title: "教练看了直接退休", quip: "零碰撞满分入库，这科没什么可教你的了。" };
    if (ratio <= 0.42 && run.hits > 0) return { title: "快是快，车不要了", quip: `${run.netTime.toFixed(1)} 秒是真快，撞 ${run.hits} 下也是真撞。` };
    if (run.scrapes >= 3) return { title: "全靠蹭进去的", quip: "挤进去也是进去，漆是不打算要了。" };
    if (ratio >= 0.9) return { title: "压哨入库", quip: "最后几秒进的库，心脏和车同时停稳。" };
    if (run.hits === 0 && run.scrapes === 0) return { title: "稳如老司机", quip: "干干净净，就是再快一点就三星了。" };
    return { title: "持证上路（暂定）", quip: "停进去了。过程嘛，建议不要回看。" };
  }

  // 没有后端，百分位是按难度限时标定的本地估算曲线，图个乐
  function estimateBeatPercent(run) {
    if (!run.success) return 40 + (run.seed % 36);
    const level = DIFFICULTIES[run.difficulty];
    const ratio = run.netTime / level.time;
    const beat = 95 - (ratio - 0.25) * 86 - run.hits * 5 - run.scrapes * 2;
    return Math.round(clamp(beat, 3, 98));
  }

  function renderStars(count) {
    resultStars.textContent = "";
    resultStars.hidden = count <= 0;
    if (count <= 0) return;
    for (let i = 0; i < 3; i += 1) {
      const star = document.createElement("i");
      star.textContent = i < count ? "★" : "☆";
      if (i >= count) star.className = "is-empty";
      resultStars.appendChild(star);
    }
  }

  function showResult(success) {
    const mode = MODES[game.mode];
    const level = DIFFICULTIES[game.difficulty];
    const netTime = Math.min(game.elapsed, game.timeLimit);
    const stars = success ? rateRun(netTime, game.hits, level.time) : 0;
    const previous = recordFor(game.mode, game.difficulty);
    const previousBest = previous ? previous.bestTime : null;
    const run = {
      mode: game.mode,
      difficulty: game.difficulty,
      success,
      netTime,
      penalty: game.penalty,
      hits: game.hits,
      scrapes: game.scrapes,
      stars,
      almostIn: !success && game.park.inside,
      seed: game.map ? game.map.seed : 0,
    };
    markIntroSeen();
    const improved = commitRun(run);
    run.improved = improved;
    run.previousBest = previousBest;
    const verdict = runVerdict(run);
    run.title = verdict.title;
    run.quip = verdict.quip;
    run.beat = estimateBeatPercent(run);
    game.lastRun = run;

    resultCard.classList.toggle("is-fail", !success);
    resultStarRule.textContent = `三星：零碰撞且 ${formatStarTime(level.time)} 秒内`;
    resultStarRule.hidden = !success;
    resultKicker.textContent = success
      ? `${mode.label} · ${level.label}通关 · 获封`
      : `${mode.label} · ${level.label}失败 · 获封`;
    resultTitle.textContent = run.title;
    resultCopy.textContent = `教练点评：${run.quip}`;
    resultBeat.textContent = success
      ? `估算击败了全国 ${run.beat}% 的学员`
      : `据不完全统计，${run.beat}% 的学员也倒在这一关`;
    resultBeat.hidden = false;
    renderStars(stars);
    resultTime.textContent = success ? `${netTime.toFixed(1)} 秒` : "没停进去";
    resultPenalty.textContent = game.penalty.toFixed(1);
    resultHits.textContent = String(game.hits);
    resultScrapes.textContent = String(game.scrapes);

    let recordText = "";
    let isBest = false;
    if (success && improved) {
      isBest = true;
      recordText = previousBest === null
        ? `首次通关，新纪录 ${netTime.toFixed(1)} 秒`
        : `新纪录！比之前快了 ${(previousBest - netTime).toFixed(1)} 秒`;
    } else if (success && previousBest !== null) {
      recordText = `最佳 ${previousBest.toFixed(1)} 秒 · 这把慢了 ${(netTime - previousBest).toFixed(1)} 秒`;
    } else if (!success && previousBest !== null) {
      recordText = `这一科最佳成绩 ${previousBest.toFixed(1)} 秒`;
    }
    resultRecord.textContent = recordText;
    resultRecord.hidden = !recordText;
    resultRecord.classList.toggle("is-best", isBest);

    const graduated = success && allCleared();
    const next = success && !graduated ? nextChallenge(game.mode, game.difficulty) : null;
    nextLevel.hidden = !next;
    graduation.hidden = !graduated;
    if (graduated) {
      const total = MODE_ORDER.length * DIFF_ORDER.length;
      graduationTitle.textContent = totalBestStars() >= total * 3 ? "全科三星" : "路保住了";
      graduationCopy.textContent = `${total} / ${total} 通关 · 累计 ${totalBestStars()} 星`;
    }
    restartButton.classList.toggle("is-secondary", Boolean(next || graduated));
    restartButtonLabel.textContent = !success
      ? "不服，再来一把"
      : next
        ? `换张场地重玩${level.label}`
        : `再挑战${level.label}`;
    if (next) {
      const nextMode = MODES[next.mode];
      const nextLevelData = DIFFICULTIES[next.difficulty];
      const sameMode = next.mode === game.mode;
      nextLevelTitle.textContent = sameMode ? `${nextLevelData.label}模式` : `${nextMode.label} · ${nextLevelData.label}`;
      nextLevelCopy.textContent = `${nextLevelData.time} 秒 · ${sameMode ? nextLevelData.summary : nextMode.summary}`;
      nextDifficultyButton.dataset.mode = next.mode;
      nextDifficultyButton.dataset.difficulty = next.difficulty;
      nextDifficultyButton.querySelector("span").textContent = sameMode
        ? `直接挑战${nextLevelData.label}`
        : `去考${nextMode.label}`;
    } else {
      nextDifficultyButton.dataset.mode = "";
      nextDifficultyButton.dataset.difficulty = "";
    }
    resetShareActions();
    hideToast();
    resultOverlay.classList.add("is-visible");
  }

  /* ---------------- 分享 ---------------- */

  function shareSummaryText() {
    const run = game.lastRun;
    if (!run) return "";
    const mode = MODES[run.mode].label;
    const level = DIFFICULTIES[run.difficulty];
    const head = `《会停车吗你》${mode} · ${level.label}难度`;
    if (!run.success) {
      return `${head}：${level.time} 秒没停进去，获封「${run.title}」。你能保住这条路吗？`;
    }
    const stars = "★".repeat(run.stars) + "☆".repeat(3 - run.stars);
    return `${head}：${run.netTime.toFixed(1)} 秒入库，${stars}，获封「${run.title}」。你能更快吗？`;
  }

  function clipChars(text, max) {
    return String(text || "").slice(0, max);
  }

  function shareNoteTitle(run) {
    if (run.title) return clipChars(`${run.title}｜会停车吗你`, 20);
    const mode = MODES[run.mode].label;
    const level = DIFFICULTIES[run.difficulty].label;
    return clipChars(`${mode}${level}${run.success ? "停进去了" : "路没保住"}`, 20);
  }

  function shareNoteBody() {
    return clipChars(`${shareSummaryText()}\n\n#会停车吗你 #停车游戏 #倒车入库`, 1000);
  }

  function xhsMiniTool() {
    try {
      const api = window.xhs && window.xhs.miniTool;
      return api && typeof api === "object" ? api : null;
    } catch (_) {
      return null;
    }
  }

  function xhsCan(name) {
    const api = xhsMiniTool();
    return Boolean(api && typeof api[name] === "function");
  }

  function callMiniTool(name, options, assumeOkMs) {
    const api = xhsMiniTool();
    if (!api || typeof api[name] !== "function") {
      return Promise.reject(new Error("unavailable"));
    }
    return new Promise((resolve, reject) => {
      let settled = false;
      const done = (fn) => (value) => {
        if (settled) return;
        settled = true;
        fn(value);
      };
      try {
        const result = api[name](Object.assign({}, options, {
          success: done(resolve),
          fail: done(reject),
        }));
        if (result && typeof result.then === "function") {
          result.then(done(resolve), done(reject));
        } else if (result !== undefined && result !== null) {
          Promise.resolve().then(() => {
            if (!settled) done(resolve)(result);
          });
        } else if (assumeOkMs) {
          setTimeout(() => {
            if (!settled) done(resolve)({});
          }, assumeOkMs);
        }
      } catch (err) {
        done(reject)(err);
      }
    });
  }

  function withTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("timeout")), ms);
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        }
      );
    });
  }

  function extractFilePath(res) {
    if (!res) return "";
    if (typeof res === "string") return res;
    if (typeof res !== "object") return "";
    const nested = res.data && typeof res.data === "object" ? res.data : null;
    return (
      res.filePath ||
      res.tempFilePath ||
      res.path ||
      res.url ||
      (nested && (nested.filePath || nested.tempFilePath || nested.path || nested.url)) ||
      ""
    );
  }

  async function writeShareTempFile(dataUrl) {
    if (!xhsCan("writeTempFile")) return "";
    const res = await withTimeout(callMiniTool("writeTempFile", { data: dataUrl }), 6000);
    return extractFilePath(res);
  }

  function resetShareActions() {
    lastShareDataUrl = "";
    setShareBusy(false);
  }

  function setShareBusy(busy, pendingLabel) {
    shareBusy = busy;
    shareXhsButton.disabled = busy;
    shareXhsLabel.textContent = busy && pendingLabel === "xhs" ? "生成中…" : "分享战绩";
  }

  // 战绩图按需生成：结束页两个按钮点了才画，省掉一次没人看的预览渲染
  function ensureShareImage(run) {
    if (lastShareDataUrl) return lastShareDataUrl;
    try {
      lastShareDataUrl = buildShareImage(run);
    } catch (_) {
      lastShareDataUrl = "";
    }
    return lastShareDataUrl;
  }

  function blitPlayfield(g, x, y, w, h) {
    if (!game.layout || canvas.width < 2 || canvas.height < 2) return false;
    const top = clamp(game.layout.playTop - 6, 0, H);
    const bottom = clamp(game.layout.controlTop + 2, top + 40, H);
    const sy = top * dpr;
    const sh = Math.max(1, (bottom - top) * dpr);
    g.drawImage(canvas, 0, sy, canvas.width, sh, x, y, w, h);
    return true;
  }

  function buildShareImage(run) {
    const width = 720;
    const height = 960;
    const board = document.createElement("canvas");
    board.width = width;
    board.height = height;
    const g = board.getContext("2d");
    if (!g) return "";

    const mode = MODES[run.mode];
    const level = DIFFICULTIES[run.difficulty];
    const sceneX = 36;
    const sceneY = 36;
    const sceneW = width - 72;
    const sceneH = 390;

    g.fillStyle = "#f5f1df";
    g.fillRect(0, 0, width, height);
    g.strokeStyle = "#171815";
    g.lineWidth = 14;
    g.strokeRect(7, 7, width - 14, height - 14);

    // 失败图把坦克请回画面中央再截图，事故现场才有戏剧感
    const stageTank = !run.success && game.state === "failed";
    let stagedTankX = 0;
    if (stageTank) {
      stagedTankX = game.tank.x;
      game.tank.x = W * 0.55;
      draw();
    }
    g.fillStyle = "#aebba7";
    g.fillRect(sceneX, sceneY, sceneW, sceneH);
    blitPlayfield(g, sceneX, sceneY, sceneW, sceneH);
    if (stageTank) {
      game.tank.x = stagedTankX;
      draw();
    }
    g.strokeStyle = "#171815";
    g.lineWidth = 5;
    g.strokeRect(sceneX, sceneY, sceneW, sceneH);

    g.fillStyle = "#171815";
    g.fillRect(sceneX, sceneY + sceneH + 22, 292, 52);
    g.fillStyle = "#f5f1df";
    g.font = "900 34px 'Arial Black', 'PingFang SC', sans-serif";
    g.textAlign = "left";
    g.textBaseline = "middle";
    g.fillText("会停车吗你", sceneX + 14, sceneY + sceneH + 49);

    const badge = `${mode.label} · ${level.label}难度`;
    g.fillStyle = run.success ? "#9ee0b0" : "#f05b32";
    g.fillRect(sceneX + 308, sceneY + sceneH + 22, sceneW - 308, 52);
    g.fillStyle = "#171815";
    g.font = "900 22px 'PingFang SC', sans-serif";
    g.fillText(badge, sceneX + 322, sceneY + sceneH + 49);

    const title = run.title || (run.success ? "停进去了" : "路没保住");
    g.fillStyle = "#171815";
    let titleSize = 68;
    g.font = `900 ${titleSize}px 'Arial Black', 'PingFang SC', sans-serif`;
    while (titleSize > 38 && g.measureText(title).width > sceneW) {
      titleSize -= 4;
      g.font = `900 ${titleSize}px 'Arial Black', 'PingFang SC', sans-serif`;
    }
    let cursorY = sceneY + sceneH + 128;
    g.fillText(title, sceneX, cursorY);

    if (run.success) {
      g.fillStyle = "#f05b32";
      g.font = "900 48px 'PingFang SC', sans-serif";
      g.fillText("★".repeat(run.stars), sceneX, cursorY + 56);
      g.fillStyle = "rgba(23, 24, 21, 0.22)";
      g.fillText("★".repeat(3 - run.stars), sceneX + run.stars * 52, cursorY + 56);
      cursorY += 56;
    }

    if (run.quip) {
      g.fillStyle = "#4a4b45";
      g.font = "800 22px 'PingFang SC', sans-serif";
      g.fillText(`教练点评：${run.quip}`, sceneX, cursorY + 46, sceneW);
    }

    if (run.beat) {
      g.fillStyle = "#f05b32";
      g.font = "900 26px 'PingFang SC', sans-serif";
      g.fillText(
        run.success ? `估算击败了全国 ${run.beat}% 的学员` : `${run.beat}% 的学员也倒在这一关`,
        sceneX,
        height - 236
      );
    }

    const rows = run.success
      ? [
          ["净用时", `${run.netTime.toFixed(1)} 秒`],
          ["撞击 / 剐蹭", `${run.hits} / ${run.scrapes}`],
        ]
      : [
          ["限时", `${level.time} 秒`],
          ["撞击 / 剐蹭", `${run.hits} / ${run.scrapes}`],
        ];
    let rowX = sceneX;
    rows.forEach(([label, value]) => {
      const boxW = (sceneW - 12) / 2;
      g.strokeStyle = "#171815";
      g.lineWidth = 4;
      g.setLineDash([10, 8]);
      g.strokeRect(rowX, height - 210, boxW, 70);
      g.setLineDash([]);
      g.fillStyle = "#5f6059";
      g.font = "800 18px 'PingFang SC', sans-serif";
      g.textAlign = "left";
      g.fillText(label, rowX + 14, height - 186);
      g.fillStyle = "#171815";
      g.font = "900 30px 'Arial Black', 'PingFang SC', sans-serif";
      g.fillText(value, rowX + 14, height - 156);
      rowX += boxW + 12;
    });

    g.fillStyle = "#f3df42";
    g.fillRect(sceneX, height - 118, sceneW, 64);
    g.strokeStyle = "#171815";
    g.lineWidth = 5;
    g.strokeRect(sceneX, height - 118, sceneW, 64);
    g.fillStyle = "#171815";
    g.font = "900 22px 'PingFang SC', sans-serif";
    g.textAlign = "center";
    g.fillText(
      "倒车入库 · 侧方停车　你能几星？",
      width / 2,
      height - 84
    );

    return board.toDataURL("image/png");
  }

  async function postShareNote() {
    if (shareBusy) return;
    const run = game.lastRun;
    if (!run) return;
    setShareBusy(true, "xhs");
    try {
      if (!xhsMiniTool()) {
        showToast("在小红书里打开才能一键发布", 1.8);
        return;
      }
      if (!xhsCan("postNote")) {
        showToast("当前版本还不支持发笔记", 1.6);
        return;
      }
      if (!ensureShareImage(run)) {
        showToast("战绩图没画出来，再试一次", 1.6);
        return;
      }
      let path = "";
      try {
        path = await writeShareTempFile(lastShareDataUrl);
      } catch (_) {
        path = "";
      }
      const url = path || lastShareDataUrl;
      await callMiniTool("postNote", {
        title: shareNoteTitle(run),
        content: shareNoteBody(),
        tags: "会停车吗你,停车游戏,倒车入库",
        mediaInfo: {
          image_resources: [{ url }],
        },
      }, 400);
      showToast("已打开发布页", 1.4);
    } catch (_) {
      showToast("发布页没打开，再试一次", 1.6);
    } finally {
      setShareBusy(false);
    }
  }

  /* ---------------- 粒子 ---------------- */

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * 135;
      game.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        size: 2 + Math.random() * 6,
        color,
        life: 0.5 + Math.random() * 0.8,
        spin: (Math.random() - 0.5) * 9,
        angle: Math.random() * Math.PI,
      });
    }
  }

  function updateParticles(dt) {
    const list = game.particles;
    if (!list.length) return;
    let write = 0;
    for (let i = 0; i < list.length; i += 1) {
      const particle = list[i];
      particle.life -= dt;
      if (particle.life <= 0) continue;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      if (particle.kind === "smoke") {
        particle.vx *= Math.pow(0.42, dt);
        particle.vy *= Math.pow(0.55, dt);
        particle.size += particle.growth * dt;
      } else {
        particle.vy += 170 * dt;
        particle.angle += particle.spin * dt;
      }
      list[write] = particle;
      write += 1;
    }
    list.length = write;
  }

  /* ---------------- 绘制 ---------------- */

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // 停进去之后镜头缓缓推向车位，给成功时刻一个值得截图的特写
    const zoomT = game.state === "success" ? game.successFx : 0;
    const zoom = zoomT > 0 ? 1 + 0.18 * (1 - Math.pow(1 - zoomT, 3)) : 1;
    if (zoom > 1) {
      const focus = game.layout.target;
      ctx.save();
      ctx.translate(focus.cx, focus.cy);
      ctx.scale(zoom, zoom);
      ctx.translate(-focus.cx, -focus.cy);
    }
    drawScene();
    drawDecorBays();
    drawSkids();
    drawParkingTarget();
    drawSmokeParticles();
    drawParkedCars();
    if (game.state === "playing" && game.difficulty !== "hell" && !game.car.destroyed) {
      drawTrajectoryPrediction();
    }
    if (!game.car.destroyed) drawCar(game.car.x, game.car.y, game.car.angle, "#f05b32", "你");
    else drawCrushedCar(game.car.x, game.car.y);
    drawStabilityRing();
    if (game.state === "tank" || game.state === "failed") drawTank();
    drawParticles();
    if (zoom > 1) ctx.restore();
    if (game.flash > 0) {
      ctx.save();
      ctx.globalAlpha = game.flash * 0.38;
      ctx.fillStyle = "#fff4b0";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  function drawTrajectoryPrediction() {
    const { car } = game;
    const { carLength, carWidth, controlTop, playTop } = game.layout;
    const direction = game.driveDirection;
    const wheelbase = carLength * 0.62;
    const speedRatio = clamp(Math.abs(car.speed) / 38, 0.72, 1);
    const steerAngle = input.steer * 0.57 * speedRatio;
    const curvature = Math.tan(steerAngle) / wheelbase;
    const startDistance = carLength * 0.5;
    const previewDistance = carLength * 1.12;
    const step = 5;
    const trackOffset = carWidth * 0.38;
    const leftTrack = [];
    const rightTrack = [];
    let x = car.x;
    let y = car.y;
    let angle = car.angle;

    for (let distance = step; distance <= startDistance + previewDistance; distance += step) {
      const signedStep = step * direction;
      angle = normalizeAngle(angle + signedStep * curvature);
      x += Math.cos(angle) * signedStep;
      y += Math.sin(angle) * signedStep;
      if (distance < startDistance) continue;
      const sideX = -Math.sin(angle) * trackOffset;
      const sideY = Math.cos(angle) * trackOffset;
      leftTrack.push({ x: x + sideX, y: y + sideY });
      rightTrack.push({ x: x - sideX, y: y - sideY });
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, playTop, W, controlTop - playTop + 4);
    ctx.clip();
    drawTrajectoryLine(leftTrack);
    drawTrajectoryLine(rightTrack);
    ctx.restore();
  }

  function drawTrajectoryLine(points) {
    if (points.length < 2) return;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = "rgba(23, 24, 21, 0.25)";
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.strokeStyle = "rgba(245, 241, 223, 0.62)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawScene() {
    const { roadTop, roadBottom, controlTop, signX } = game.layout;
    ctx.fillStyle = "#aebba7";
    ctx.fillRect(0, 0, W, roadTop);

    ctx.fillStyle = "#3d403b";
    ctx.fillRect(0, roadTop, W, roadBottom - roadTop);

    ctx.fillStyle = "#252723";
    ctx.fillRect(0, roadTop - 5, W, 7);

    // 警示路沿：黄底黑斜杠，像真实马路牙子的警示涂装
    ctx.fillStyle = "#f3df42";
    ctx.fillRect(0, roadTop - 16, W, 12);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, roadTop - 16, W, 12);
    ctx.clip();
    ctx.strokeStyle = "#171815";
    ctx.lineWidth = 8;
    ctx.beginPath();
    for (let x = -24; x < W + 24; x += 24) {
      ctx.moveTo(x, roadTop - 1);
      ctx.lineTo(x + 14, roadTop - 19);
    }
    ctx.stroke();
    ctx.restore();
    drawCurbOpenings(roadTop);

    const stripeY = roadTop + (roadBottom - roadTop) * 0.58;
    ctx.strokeStyle = "rgba(245, 241, 223, 0.55)";
    ctx.lineWidth = 3;
    ctx.setLineDash([19, 15]);
    ctx.beginPath();
    ctx.moveTo(0, stripeY);
    ctx.lineTo(W, stripeY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(23, 24, 21, 0.15)";
    for (let i = 0; i < 15; i += 1) {
      const x = (i * 83 + 17) % W;
      const y = roadTop + ((i * 47 + 31) % Math.max(30, roadBottom - roadTop));
      ctx.beginPath();
      ctx.arc(x, y, 1.4 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }

    for (const obstacle of game.layout.obstacles) drawObstacle(obstacle);
    drawSign(signX, roadTop - 49);

    ctx.fillStyle = "rgba(23, 24, 21, 0.15)";
    ctx.fillRect(0, controlTop - 2, W, 4);
  }

  // 可通过的开口处不画马路牙子：草坪直接接到路面，留白就是"能上"的信号
  function drawCurbOpenings(roadTop) {
    const openings = game.layout.curbOpenings;
    if (!openings || !openings.length) return;
    for (const span of openings) {
      const x0 = span.x0 - 2;
      const w = span.x1 - span.x0 + 4;
      ctx.fillStyle = "#aebba7";
      ctx.fillRect(x0, roadTop - 16, w, 16);
      ctx.fillStyle = "#3d403b";
      ctx.fillRect(x0, roadTop, w, 2);
    }
  }

  function drawDecorBays() {
    const { decorBays } = game.layout;
    if (!decorBays || !decorBays.length) return;
    ctx.save();
    ctx.strokeStyle = "rgba(245, 241, 223, 0.5)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const bay of decorBays) {
      const halfL = bay.halfLength;
      const halfW = bay.halfWidth;
      ctx.save();
      ctx.translate(bay.cx, bay.cy);
      ctx.rotate(bay.angle);
      // 实线闭合方框，像真实车位标线；虚线黄框留给目标车位
      ctx.strokeRect(-halfL, -halfW, halfL * 2, halfW * 2);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawParkingTarget() {
    const { target, carLength, carWidth, playTop, controlTop } = game.layout;
    const inside = game.park.inside;
    ctx.save();
    ctx.translate(target.cx, target.cy);
    ctx.rotate(target.angle);
    const length = target.halfLength * 2;
    const width = target.halfWidth * 2;
    ctx.fillStyle = inside ? "rgba(158, 224, 176, 0.68)" : "rgba(243, 223, 66, 0.57)";
    ctx.fillRect(-length / 2, -width / 2, length, width);
    ctx.strokeStyle = "#f3df42";
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 7]);
    ctx.strokeRect(-length / 2, -width / 2, length, width);
    ctx.setLineDash([]);
    ctx.globalAlpha = inside ? 0.36 : 0.2;
    drawCarShape(0, 0, carLength, carWidth, "#171815", "");
    ctx.restore();

    const markerY = clamp(target.cy - target.hy - 30, playTop + 24, controlTop - 24);
    drawTargetMarker(target.cx, markerY, MODES[game.mode].label);
  }

  function drawTargetMarker(centerX, baseY, label) {
    const arrowTop = baseY + Math.sin(performance.now() / 260) * 1.8;
    ctx.save();
    ctx.fillStyle = "#f3df42";
    ctx.strokeStyle = "#171815";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(centerX - 4, arrowTop);
    ctx.lineTo(centerX + 4, arrowTop);
    ctx.lineTo(centerX + 4, arrowTop + 12);
    ctx.lineTo(centerX + 10, arrowTop + 12);
    ctx.lineTo(centerX, arrowTop + 23);
    ctx.lineTo(centerX - 10, arrowTop + 12);
    ctx.lineTo(centerX - 4, arrowTop + 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#171815";
    ctx.font = `900 ${clamp(W * 0.035, 11, 15)}px PingFang SC, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(label, centerX, arrowTop - 7);
    ctx.restore();
  }

  function drawStabilityRing() {
    const progress = clamp(game.stableTime / STABLE_TIME, 0, 1);
    if (progress <= 0.02) return;
    const { target } = game.layout;
    const radius = Math.max(12, Math.min(target.halfLength, target.halfWidth) * 0.6);
    const start = -Math.PI / 2;
    const end = start + progress * Math.PI * 2;
    ctx.save();
    ctx.translate(target.cx, target.cy);
    ctx.lineCap = "round";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(23, 24, 21, 0.22)";
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#f5f1df";
    ctx.beginPath();
    ctx.arc(0, 0, radius, start, end);
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#2ebd54";
    ctx.beginPath();
    ctx.arc(0, 0, radius, start, end);
    ctx.stroke();
    ctx.restore();
  }

  function drawParkedCars() {
    for (const parked of game.layout.parkedCars) {
      if (game.state === "tank" && game.tank.crushedScene) {
        drawCrushedCar(parked.x, parked.y);
      } else {
        drawCar(parked.x, parked.y, parked.angle, parked.color, "");
      }
    }
  }

  function drawCar(x, y, angle, color, label) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    drawCarShape(0, 0, game.layout.carLength, game.layout.carWidth, color, label);
    ctx.restore();
  }

  function drawCarShape(x, y, length, width, color, label) {
    ctx.save();
    ctx.translate(x, y);
    ctx.lineJoin = "round";
    ctx.fillStyle = "#171815";
    ctx.fillRect(-length * 0.32, -width * 0.63, length * 0.18, width * 0.17);
    ctx.fillRect(length * 0.13, -width * 0.63, length * 0.18, width * 0.17);
    ctx.fillRect(-length * 0.32, width * 0.46, length * 0.18, width * 0.17);
    ctx.fillRect(length * 0.13, width * 0.46, length * 0.18, width * 0.17);

    ctx.beginPath();
    ctx.moveTo(-length * 0.52, -width * 0.47);
    ctx.lineTo(length * 0.27, -width * 0.5);
    ctx.bezierCurveTo(length * 0.46, -width * 0.5, length * 0.55, -width * 0.31, length * 0.55, 0);
    ctx.bezierCurveTo(length * 0.55, width * 0.31, length * 0.46, width * 0.5, length * 0.27, width * 0.5);
    ctx.lineTo(-length * 0.52, width * 0.47);
    ctx.lineTo(-length * 0.52, -width * 0.47);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#171815";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    roundedRectPath(-length * 0.2, -width * 0.39, length * 0.41, width * 0.78, 4);
    ctx.fillStyle = "#b9d8d2";
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(23, 24, 21, 0.18)";
    ctx.fillRect(length * 0.08, -width * 0.36, length * 0.055, width * 0.72);

    ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
    ctx.beginPath();
    ctx.moveTo(length * 0.18, -width * 0.32);
    ctx.lineTo(length * 0.26, -width * 0.23);
    ctx.lineTo(length * 0.26, width * 0.23);
    ctx.lineTo(length * 0.18, width * 0.32);
    ctx.closePath();
    ctx.fill();

    // 圆鼻头加白色前灯是车头，方尾加红色尾灯是车尾
    ctx.fillStyle = "#eaf5ed";
    ctx.beginPath();
    ctx.ellipse(length * 0.45, -width * 0.27, length * 0.045, width * 0.09, 0, 0, Math.PI * 2);
    ctx.ellipse(length * 0.45, width * 0.27, length * 0.045, width * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d6402f";
    ctx.fillRect(-length * 0.5, -width * 0.34, length * 0.075, width * 0.2);
    ctx.fillRect(-length * 0.5, width * 0.14, length * 0.075, width * 0.2);

    if (label) {
      ctx.fillStyle = "#171815";
      ctx.font = `900 ${Math.max(9, width * 0.32)}px PingFang SC, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 0, 1);
    }
    ctx.restore();
  }

  function drawCrushedCar(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.1);
    ctx.fillStyle = "#171815";
    ctx.beginPath();
    ctx.ellipse(0, 0, game.layout.carLength * 0.45, game.layout.carWidth * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f05b32";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-20, -4);
    ctx.lineTo(18, 5);
    ctx.moveTo(-10, 8);
    ctx.lineTo(12, -8);
    ctx.stroke();
    ctx.restore();
  }

  function drawCone(x, y, scale) {
    if (game.state === "tank" && game.tank.crushedScene) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#171815";
    ctx.fillRect(-10, 10, 20, 4);
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(-8, 10);
    ctx.lineTo(8, 10);
    ctx.closePath();
    ctx.fillStyle = "#f05b32";
    ctx.fill();
    ctx.strokeStyle = "#171815";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#f5f1df";
    ctx.fillRect(-5.5, 1, 11, 4);
    ctx.restore();
  }

  function drawObstacle(obstacle) {
    if (obstacle.type === "cone") {
      drawCone(obstacle.x, obstacle.y, obstacle.scale || 1);
      return;
    }
    if (obstacle.type === "barrier") {
      drawBarrier(obstacle);
      return;
    }
    if (obstacle.type === "tires") drawTireStack(obstacle);
  }

  function drawBarrier(obstacle) {
    if (game.state === "tank" && game.tank.crushedScene) return;
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);
    ctx.rotate(obstacle.angle || 0);
    ctx.fillStyle = "#171815";
    ctx.fillRect(-obstacle.w * 0.38, obstacle.h * 0.35, 4, 10);
    ctx.fillRect(obstacle.w * 0.31, obstacle.h * 0.35, 4, 10);
    roundedRectPath(-obstacle.w / 2, -obstacle.h / 2, obstacle.w, obstacle.h, 3);
    ctx.fillStyle = "#f3df42";
    ctx.fill();
    ctx.strokeStyle = "#171815";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.save();
    roundedRectPath(-obstacle.w / 2, -obstacle.h / 2, obstacle.w, obstacle.h, 3);
    ctx.clip();
    ctx.strokeStyle = "#f05b32";
    ctx.lineWidth = 6;
    for (let x = -obstacle.w; x < obstacle.w; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, obstacle.h);
      ctx.lineTo(x + 18, -obstacle.h);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }

  function drawTireStack(obstacle) {
    if (game.state === "tank" && game.tank.crushedScene) return;
    ctx.save();
    ctx.translate(obstacle.x, obstacle.y);
    ctx.rotate(obstacle.angle || 0);
    const positions = [[-7, 3], [7, 3], [0, -5]];
    for (const [x, y] of positions) {
      ctx.fillStyle = "#171815";
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#74776e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSign(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#171815";
    ctx.fillRect(-2, 13, 4, 38);
    roundedRectPath(-21, -15, 42, 30, 3);
    ctx.fillStyle = "#f5f1df";
    ctx.fill();
    ctx.strokeStyle = "#171815";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#f05b32";
    ctx.font = "900 16px Arial Black, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("P?", 0, 1);
    ctx.restore();
  }

  function drawSkids() {
    if (!game.skidMarks.length) return;
    ctx.save();
    ctx.strokeStyle = "rgba(10, 10, 9, 0.25)";
    ctx.lineWidth = 2;
    for (const mark of game.skidMarks) {
      ctx.globalAlpha = clamp(mark.life, 0, 1);
      const dx = Math.cos(mark.angle) * 9;
      const dy = Math.sin(mark.angle) * 9;
      ctx.beginPath();
      ctx.moveTo(mark.x - dx, mark.y - dy);
      ctx.lineTo(mark.x + dx, mark.y + dy);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTank() {
    const tank = game.tank;
    const size = getTankSize();
    const trackSpacing = size * 0.19;
    const trackOffset = (tank.endTimer * size * 0.48) % trackSpacing;
    ctx.save();
    ctx.translate(tank.x, tank.y);

    ctx.fillStyle = "rgba(23, 24, 21, 0.3)";
    ctx.beginPath();
    ctx.ellipse(0, size * 0.28, size * 0.65, size * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const trackY = side * size * 0.29;
      ctx.fillStyle = "#171815";
      roundedRectPath(-size * 0.56, trackY - size * 0.095, size * 1.12, size * 0.19, size * 0.095);
      ctx.fill();
      ctx.fillStyle = "#b0ba70";
      roundedRectPath(-size * 0.5, trackY - size * 0.055, size, size * 0.11, size * 0.055);
      ctx.fill();
      ctx.save();
      roundedRectPath(-size * 0.5, trackY - size * 0.055, size, size * 0.11, size * 0.055);
      ctx.clip();
      ctx.fillStyle = "#596043";
      for (let x = -size * 0.7 + trackOffset; x < size * 0.7; x += trackSpacing) {
        ctx.fillRect(x, trackY - size * 0.06, size * 0.065, size * 0.12);
      }
      ctx.restore();
    }

    ctx.fillStyle = "#6d7d43";
    roundedRectPath(-size * 0.47, -size * 0.23, size * 0.94, size * 0.46, size * 0.12);
    ctx.fill();
    ctx.strokeStyle = "#171815";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#171815";
    roundedRectPath(size * 0.08, -size * 0.055, size * 0.72, size * 0.11, size * 0.025);
    ctx.fill();
    ctx.fillStyle = "#6d7d43";
    roundedRectPath(size * 0.11, -size * 0.026, size * 0.62, size * 0.052, size * 0.018);
    ctx.fill();
    ctx.fillStyle = "#171815";
    roundedRectPath(size * 0.73, -size * 0.075, size * 0.1, size * 0.15, size * 0.025);
    ctx.fill();

    ctx.fillStyle = "#829653";
    ctx.strokeStyle = "#171815";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(-size * 0.02, 0, size * 0.28, size * 0.23, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#b8c47a";
    ctx.strokeStyle = "#171815";
    ctx.lineWidth = Math.max(1.5, size * 0.014);
    ctx.beginPath();
    ctx.arc(-size * 0.1, 0, size * 0.072, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    for (const side of [-1, 1]) {
      ctx.fillStyle = "#f3df42";
      ctx.strokeStyle = "#171815";
      ctx.lineWidth = Math.max(1.5, size * 0.012);
      ctx.beginPath();
      ctx.arc(size * 0.42, side * size * 0.145, size * 0.042, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSmokeParticles() {
    for (const particle of game.particles) {
      if (particle.kind !== "smoke") continue;
      const progress = 1 - particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = clamp((1 - progress) * 0.46, 0, 0.46);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha *= 0.42;
      ctx.beginPath();
      ctx.arc(
        particle.x - particle.size * 0.38,
        particle.y + particle.size * 0.2,
        particle.size * 0.72,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const particle of game.particles) {
      if (particle.kind === "smoke") continue;
      ctx.save();
      ctx.globalAlpha = clamp(particle.life * 1.4, 0, 1);
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.angle);
      ctx.fillStyle = particle.color;
      ctx.strokeStyle = "#171815";
      ctx.lineWidth = 1;
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      ctx.strokeRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      ctx.restore();
    }
  }

  function roundedRectPath(x, y, width, height, radius) {
    const r = Math.min(Math.abs(radius), Math.abs(width) / 2, Math.abs(height) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function frame(now) {
    const dt = Math.min((now - lastFrame) / 1000, 0.034);
    lastFrame = now;
    update(dt, now);
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => window.setTimeout(resize, 120));
  document.addEventListener("visibilitychange", () => {
    lastFrame = performance.now();
    if (document.hidden) {
      if (game.state === "playing") pauseGame();
      setEngine(false);
      setTankRumble(false);
    } else if (game.state === "tank") {
      setTankRumble(true);
    }
  });

  syncSoundToggle();

  resize();
  resetGame(false);
  requestAnimationFrame(frame);
})();
