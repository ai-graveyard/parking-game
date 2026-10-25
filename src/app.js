(() => {
  "use strict";

  const canvas = document.querySelector("#gameCanvas");
  let ctx = canvas.getContext("2d");
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
  const levelSelectButton = document.querySelector("#levelSelectButton");
  const switchLevelOverlay = document.querySelector("#switchLevelOverlay");
  const switchLevelCopy = document.querySelector("#switchLevelCopy");
  const switchLevelConfirm = document.querySelector("#switchLevelConfirm");
  const switchLevelCancel = document.querySelector("#switchLevelCancel");
  const switchLevelClose = document.querySelector("#switchLevelClose");
  let suspendedRun = null;
  const pauseButton = document.querySelector("#pauseButton");
  const pauseOverlay = document.querySelector("#pauseOverlay");
  const pauseCloseButton = document.querySelector("#pauseCloseButton");
  const startCloseButton = document.querySelector("#startCloseButton");
  const rescueCloseButton = document.querySelector("#rescueCloseButton");
  const resultCloseButton = document.querySelector("#resultCloseButton");
  const rotateCloseButton = document.querySelector("#rotateCloseButton");
  const sceneReturn = document.querySelector("#sceneReturn");
  const sceneReturnCopy = document.querySelector("#sceneReturnCopy");
  const sceneReturnButton = document.querySelector("#sceneReturnButton");
  let dismissedOverlay = null;
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
  const leftThumbHint = document.querySelector("#leftThumbHint");
  const rightThumbHint = document.querySelector("#rightThumbHint");
  // Learn each hand independently for this page visit; retries do not re-teach it.
  const controlHintSeen = { steer: false, pedals: false };
  const resultBeat = document.querySelector("#resultBeat");

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const normalizeAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
  const angleDistance = (a, b) => Math.abs(normalizeAngle(a - b));

  const SPEED_TO_KMH = 0.18;
  // 低于这个速度换算后显示为 0 km/h，让停稳判定和仪表读数一致
  const STOP_SPEED = 2.7;
  const STABLE_TIME = 0.65;
  const PLAYER_MARKER_DELAY = 3;
  const ASSESSMENT_IMPACT = .58;
  const ASSESSMENT_VERDICT_START = 2.10;
  const ASSESSMENT_VERDICT_SETTLE = .20;
  const ASSESSMENT_RESULT_DELAY = 3;
  const ASSESSMENT_DURATION = ASSESSMENT_VERDICT_START + ASSESSMENT_VERDICT_SETTLE + ASSESSMENT_RESULT_DELAY;
  const PARKING_HELP_DURATION = 5;
  const PARKING_HELP_HIGHLIGHT_DURATION = 2.5;
  const ALIGN_TOLERANCE = 10 * Math.PI / 180;
  const IMPACT_PENALTY = 2;
  const STORE_KEY = "parking-game.records.v1";
  const SOUND_KEY = "parking-game.sound.v1";
  const INTRO_KEY = "parking-game.intro.v1";
  const CHALLENGES = window.ParkingChallenges;
  const VEHICLES = CHALLENGES.vehicles;
  const LEVELS = CHALLENGES.levels;
  const PROGRESS_KEY = "parking-game.campaign.v2";
  const FREE_KEY = "parking-game.free.v2";
  // Ordinary courses remain open; four optional chapter finals reward following.
  const ALL_LEVELS_OPEN = true;
  const BONUS_LEVELS = [4, 8, 12, 16];
  const GROWTH_KEY = "parking-game.growth.v1";
  let growth = cleanGrowth(readData(GROWTH_KEY, {}));
  let growthReady = false;
  let followChecking = Boolean(xhsMiniTool());
  let followSupported = false;
  let followStatus = -1;
  let followBusy = false;
  let followRefresh = null;
  let rescueBusy = false;
  let rescueMessage = "";
  const rescueOverlay = document.querySelector("#rescueOverlay");
  const rescueAction = document.querySelector("#rescueAction");
  const rescueDecline = document.querySelector("#rescueDecline");
  const rescueCopy = document.querySelector("#rescueCopy");
  const rescueStatus = document.querySelector("#rescueStatus");
  const resultRescueButton = document.querySelector("#resultRescueButton");
  // Painted-body frames exclude mirrors and tires; every sprite draws uniformly.
  const VEHICLE_ART = {
    car: { src: "./assets/vehicles/mirror-car.png", body: {"x": 1.948003, "y": 23.863031, "width": 764.103995, "height": 365.250476}, image: null },
    van: { src: "./assets/vehicles/seam-van.png", body: {"x": 0.285714, "y": 17.714286, "width": 511.142857, "height": 198.571429}, image: null },
    truck: { src: "./assets/vehicles/mirror-truck.png", body: {"x": 0.37555, "y": 21.030807, "width": 767.2489, "height": 221.574572}, image: null },
  };
  // Local effect sprites; ratios describe the trimmed transparent images.
  const ASSESSMENT_ART = {
    weight: { src: "./assets/effects/iron-weight.png", ratio: 226 / 256, image: null },
    car: { src: "./assets/effects/flat-car.png", ratio: 169 / 256, image: null },
    van: { src: "./assets/effects/flat-van.png", ratio: 158 / 384, image: null },
    truck: { src: "./assets/effects/flat-truck.png", ratio: 169 / 512, image: null },
  };
  if (typeof Image !== "undefined") {
    Object.keys(ASSESSMENT_ART).forEach(function (name) {
      const image = new Image();
      image.src = ASSESSMENT_ART[name].src;
      ASSESSMENT_ART[name].image = image;
    });
  }
  const CAR_PAINTS = [
    { art: "carBlue", color: "#658fc0", file: "blue", src: "./assets/vehicles/mirror-car-blue.png", body: {"x": 1.954198, "y": 19.053435, "width": 764.091603, "height": 378.625954} },
    { art: "carSage", color: "#91a77c", file: "sage", src: "./assets/vehicles/mirror-car-sage.png", body: {"x": 1.994805, "y": 17.953247, "width": 764.01039, "height": 367.044156} },
    { art: "carCream", color: "#e8cf86", file: "cream", src: "./assets/vehicles/mirror-car-cream.png", body: {"x": 1.976834, "y": 19.274131, "width": 764.046332, "height": 372.138996} },
    { art: "carLavender", color: "#a58cbb", file: "lavender", src: "./assets/vehicles/mirror-car-lavender.png", body: {"x": 1.957935, "y": 19.089866, "width": 764.08413, "height": 376.902486} },
  ];
  const NEIGHBOR_PAINTS = {
    car: CAR_PAINTS,
    van: [
      {"art": "vanBlue", "color": "#658fc0", "src": "./assets/vehicles/seam-van-blue.png", "body": {"x": 0.285396, "y": 17.979933, "width": 511.714604, "height": 198.635452}},
      {"art": "vanSage", "color": "#91a77c", "src": "./assets/vehicles/seam-van-sage.png", "body": {"x": 0.285237, "y": 18.255153, "width": 511.714763, "height": 198.239554}},
      {"art": "vanLavender", "color": "#a58cbb", "src": "./assets/vehicles/seam-van-lavender.png", "body": {"x": 0.570792, "y": 17.979933, "width": 510.858417, "height": 197.779264}},
    ],
    truck: [
      {"art": "truckCoral", "color": "#d66b56", "src": "./assets/vehicles/mirror-truck-coral.png", "body": {"x": 1.50736, "y": 22.233562, "width": 765.36212, "height": 220.074583}},
      {"art": "truckSage", "color": "#91a77c", "src": "./assets/vehicles/mirror-truck-sage.png", "body": {"x": 1.133858, "y": 21.543307, "width": 765.732283, "height": 222.992126}},
      {"art": "truckOchre", "color": "#d6ae55", "src": "./assets/vehicles/mirror-truck-ochre.png", "body": {"x": 1.516288, "y": 21.98618, "width": 764.967423, "height": 222.894373}},
    ],
  };
  Object.keys(NEIGHBOR_PAINTS).forEach(function (type) {
    NEIGHBOR_PAINTS[type].forEach(function (paint) {
      VEHICLE_ART[paint.art] = { src: paint.src,
        body: paint.body, image: null };
    });
  });
  if (typeof Image !== "undefined") {
    Object.keys(VEHICLE_ART).forEach(function (type) {
      const image = new Image();
      image.src = VEHICLE_ART[type].src;
      VEHICLE_ART[type].image = image;
    });
  }
  const journeyButtons = [...document.querySelectorAll("[data-journey]")];
  const vehicleButtons = [...document.querySelectorAll("[data-vehicle]")];
  const campaignPanel = document.querySelector("#campaignPanel");
  const freePanel = document.querySelector("#freePanel");
  const chapterPicker = document.querySelector("#chapterPicker");
  const levelList = document.querySelector("#levelList");
  const levelDetail = document.querySelector("#levelDetail");
  const campaignProgress = document.querySelector("#campaignProgress");
  const vehicleNote = document.querySelector("#vehicleNote");
  let progress = cleanProgress(readData(PROGRESS_KEY, {}));
  let freeRecords = cleanFreeRecords(readData(FREE_KEY, {}));
  let selectedChapter = 0;
  let platformVersion = 0;
  let platformStorage = false;
  let storageQueue = Promise.resolve();
  const loadedStorageKeys = new Set();
  const loadingStorageKeys = new Map();
  const changedStorageKeys = new Set();
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
      summary: "沿路边侧方停入",
      hint: "倒进路边黄框，再停稳",
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
  const markerMotionPreference = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  let toastTimer = 0;
  let audioCtx = null;
  let contactNoise = null;
  let contactBus = null;
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
    journey: "campaign",
    levelId: Math.min(16, unlockedLevel()),
    vehicle: "car",
    stage: "park",
    reverseEntered: false,
    mode: "reverse",
    difficulty: "easy",
    map: null,
    layout: null,
    timeLimit: DIFFICULTIES.easy.time,
    timeLeft: DIFFICULTIES.easy.time,
    elapsed: 0,
    parkingHelp: { shown: false, timeLeft: 0, highlightLeft: 0, message: "", stage: "" },
    bonusTime: 0,
    rescueUsed: false,
    rescueSnapshot: null,
    resumeCountdown: 0,
    resultRecorded: false,
    penalty: 0,
    hits: 0,
    scrapes: 0,
    stableTime: 0,
    collisionCooldown: 0,
    scrapeCooldown: 0,
    penaltyGrace: 0,
    flash: 0,
    car: { x: 0, y: 0, angle: 0, speed: 0, destroyed: false, wreck: null },
    tank: { x: 0, y: 0, crushedCar: false, crushedScene: false, endTimer: 0, smokeTimer: 0 },
    particles: [],
    contactFx: { life: 0, duration: 0.38, x: 0, y: 0, nx: 0, ny: 0, strength: 0, scrape: false },
    recoil: { vx: 0, vy: 0 },
    skidMarks: [],
    driveDirection: -1,
    park: { inside: false, aligned: false, stopped: false, wrongDirection: false },
    wrongDirectionWarned: false,
    lastRun: null,
    guide: { active: false, step: 0, holdTimer: 0 },
    successFx: 0,
    failureFx: null,
    playerMarker: { introLeft: PLAYER_MARKER_DELAY, idleTime: 0, bobTime: 0 },
  };

  function readData(key, fallback) {
    try { const value = JSON.parse(window.localStorage.getItem(key)); return value === null ? fallback : value; } catch (_) { return fallback; }
  }
  function validEntry(entry) {
    return entry && typeof entry === "object" && Number.isFinite(entry.clears) && entry.clears >= 0 && Number.isFinite(entry.bestStars) && entry.bestStars >= 0 && entry.bestStars <= 3 && (entry.bestTime === null || Number.isFinite(entry.bestTime));
  }
  function cleanProgress(value) {
    const clean = {};
    LEVELS.forEach(function (level) { if (value && validEntry(value[level.id])) clean[level.id] = value[level.id]; });
    return clean;
  }
  function cleanFreeRecords(value) {
    const clean = {};
    Object.keys(value || {}).forEach(function (key) {
      const parts = key.split(":");
      if (VEHICLES[parts[0]] && ["reverse", "parallel"].includes(parts[1]) && ["easy", "hard", "hell"].includes(parts[2]) && validEntry(value[key])) clean[key] = value[key];
    });
    return clean;
  }
  function unlockedLevel() {
    let id = 1;
    while (id < 16 && progress[id] && progress[id].clears > 0) id += 1;
    return id;
  }
  function canPlayLevel(id) {
    return Number.isInteger(id) && id >= 1 && id <= LEVELS.length &&
      (ALL_LEVELS_OPEN || id <= unlockedLevel()) && !bonusLocked(id);
  }
  function bonusLocked(id) {
    if (BONUS_LEVELS.indexOf(id) < 0 || growth.unlocked || (progress[id] && progress[id].clears > 0)) return false;
    return followChecking || (followSupported && followStatus !== 1 && followStatus !== 2);
  }
  function nextPlayableLevel(id) {
    return LEVELS.find(function (level) { return level.id > id && canPlayLevel(level.id); }) || null;
  }
  function currentLevel() { return game.journey === "campaign" ? LEVELS[game.levelId - 1] : null; }
  function currentRules() {
    const mission = currentLevel();
    const multiplier = game.vehicle === "truck" ? 1.8 : game.vehicle === "van" ? 1.35 : 1;
    const time = Math.round(DIFFICULTIES[game.difficulty].time * multiplier);
    return Object.assign({}, mission || { starTime: Math.round(time * 0.48) }, { time: mission ? mission.time : time });
  }
  function challengeLabel(run) {
    const mission = run.levelId ? LEVELS[run.levelId - 1] : null;
    return mission ? String(mission.id).padStart(2, "0") + " " + mission.title : VEHICLES[run.vehicle || "car"].label + " · " + MODES[run.mode].label + " · " + DIFFICULTIES[run.difficulty].label;
  }
  function mergeRecordSets(current, other) {
    Object.keys(other).forEach(function (id) {
      const old = current[id]; const next = other[id];
      if (!old) current[id] = next;
      else current[id] = Object.assign({}, old, { clears: Math.max(old.clears, next.clears), plays: Math.max(old.plays || 0, next.plays || 0), bestStars: Math.max(old.bestStars, next.bestStars), bestTime: old.bestTime === null ? next.bestTime : next.bestTime === null ? old.bestTime : Math.min(old.bestTime, next.bestTime) });
    });
  }
  function mergeNativeStorage(key, remote) {
    if (key === GROWTH_KEY) {
      const saved = cleanGrowth(remote || {});
      const current = dailyGrowth();
      growth.unlocked = growth.unlocked || saved.unlocked;
      if (saved.day === current.day) {
        growth.earned = current.earned || saved.earned;
        growth.used = current.used || saved.used;
        growth.offered = current.offered || saved.offered;
      }
    } else if (key === PROGRESS_KEY) mergeRecordSets(progress, cleanProgress(remote));
    else if (key === FREE_KEY) mergeRecordSets(freeRecords, cleanFreeRecords(remote));
    else if (key === STORE_KEY && remote) records = Object.assign({}, records, remote);
    else if (key === SOUND_KEY && remote !== null && !changedStorageKeys.has(key)) { soundEnabled = remote !== 0 && remote !== "0"; syncSoundToggle(); }
    else if (key === INTRO_KEY && remote) nativeIntroSeen = true;
  }
  function currentStorageValue(key, fallback) {
    if (key === PROGRESS_KEY) return progress;
    if (key === FREE_KEY) return freeRecords;
    if (key === GROWTH_KEY) return dailyGrowth();
    return fallback;
  }
  function loadNativeStorageKey(key) {
    if (loadedStorageKeys.has(key)) return Promise.resolve(null);
    if (loadingStorageKeys.has(key)) return loadingStorageKeys.get(key);
    const request = withTimeout(callMiniTool("getStorage", { key: key }), 4000).then(function (res) {
      const remote = res && res.data ? JSON.parse(res.data) : null;
      mergeNativeStorage(key, remote);
      loadedStorageKeys.add(key);
      loadingStorageKeys.delete(key);
      return remote;
    }).catch(function (err) {
      loadingStorageKeys.delete(key);
      throw err;
    });
    loadingStorageKeys.set(key, request);
    return request;
  }
  function saveData(key, value) {
    const data = JSON.stringify(value);
    changedStorageKeys.add(key);
    if (platformStorage) {
      storageQueue = storageQueue.then(async function () {
        // Never replace an unread native record with an incomplete in-memory copy.
        // A failed read is retried on the next save; other keys remain independent.
        if (!loadedStorageKeys.has(key)) await loadNativeStorageKey(key);
        await withTimeout(callMiniTool("setStorage", { key: key, data: JSON.stringify(currentStorageValue(key, value)) }), 4000);
      }).catch(function () { showToast("进度暂未保存，本次仍可继续游玩", 2); });
    } else {
      try { window.localStorage.setItem(key, data); } catch (_) { showToast("进度暂未保存，本次仍可继续游玩", 2); }
    }
  }
  async function initializeStorage() {
    const api = xhsMiniTool();
    try {
      let opts = window.xhs && window.xhs.launchOptions;
      if (!(opts && opts.miniToolEnv && opts.miniToolEnv.buildVersion) && api && typeof api.getLaunchOptions === "function") opts = await withTimeout(callMiniTool("getLaunchOptions", {}), 4000);
      platformVersion = Math.floor(Number(opts && opts.miniToolEnv && opts.miniToolEnv.buildVersion) / 1000) || 0;
      platformStorage = platformVersion >= 9460 && api && typeof api.getStorage === "function" && typeof api.setStorage === "function";
      if (platformStorage) {
        for (const key of [GROWTH_KEY, PROGRESS_KEY, FREE_KEY, STORE_KEY, SOUND_KEY, INTRO_KEY]) {
          try {
            const remote = await loadNativeStorageKey(key);
            const local = readData(key, null);
            if (remote === null && local !== null) saveData(key, currentStorageValue(key, local));
          } catch (_) { showToast("进度读取暂不可用，可继续游玩", 2); }
        }
        saveData(PROGRESS_KEY, progress);
      }
    } catch (_) { showToast("进度读取暂不可用，可继续游玩", 2); }
    refreshWindowInfo();
    growthReady = true;
    await refreshFollowStatus();
    if (game.state === "ready") syncSetupUi();
    renderGrowthActions();
  }
  let nativeIntroSeen = false;
  function feedback(type) {
    if (platformVersion >= 9500 && xhsCan("vibrateShort")) callMiniTool("vibrateShort", { type: type || "medium" }).catch(function () {});
  }

  /* ---------------- 关注福利与每日救场 ---------------- */
  function beijingDay(now) {
    return new Date((now === undefined ? Date.now() : now) + 8 * 3600000).toISOString().slice(0, 10);
  }
  function cleanGrowth(value) {
    value = value && typeof value === "object" ? value : {};
    const today = beijingDay();
    const sameDay = value.day === today;
    return { unlocked: value.unlocked === true, day: today,
      earned: sameDay && value.earned === true,
      used: sameDay && value.used === true,
      offered: sameDay && value.offered === true };
  }
  function dailyGrowth() {
    if (growth.day !== beijingDay()) growth = cleanGrowth({ unlocked: growth.unlocked });
    return growth;
  }
  function persistGrowth() {
    saveData(GROWTH_KEY, growth);
    return storageQueue;
  }
  async function refreshFollowStatus() {
    if (followRefresh) return followRefresh;
    // Unknown version stays neutral until launch options / native storage finish.
    if (!growthReady) return;
    followSupported = platformVersion >= 9510 && xhsCan("getFollowStatus") && xhsCan("followAuthor");
    if (!followSupported) {
      followChecking = false;
      if (game.state === "ready") syncSetupUi();
      return;
    }
    followChecking = true;
    if (game.state === "ready") syncSetupUi();
    followRefresh = (async function () {
      try {
        const res = await withTimeout(callMiniTool("getFollowStatus", {}), 6000);
        followStatus = res && [0, 1, 2].indexOf(res.follow_status) >= 0 ? res.follow_status : -1;
        if (followStatus === 1 || followStatus === 2) {
          growth.unlocked = true;
          await persistGrowth();
        }
      } catch (_) { followStatus = -1; }
      finally {
        followChecking = false;
        followRefresh = null;
        if (game.state === "ready") syncSetupUi();
      }
    })();
    return followRefresh;
  }
  async function unlockBonus() {
    if (followBusy || followChecking) return;
    if (followStatus === -1) { await refreshFollowStatus(); return; }
    if (!followSupported) return;
    followBusy = true;
    syncSetupUi();
    try {
      const res = await callMiniTool("followAuthor", {});
      followStatus = res && [0, 1, 2].indexOf(res.follow_status) >= 0 ? res.follow_status : -1;
      if (followStatus === 1 || followStatus === 2) {
        growth.unlocked = true;
        await persistGrowth();
        showToast("四个福利关已解锁，开始挑战！", 2);
      } else showToast("暂未确认关注成功，可重试或先玩其他课程", 2);
    } catch (err) {
      if (err && err.errCode === 15404) showToast("今日关注引导次数已达上限，先玩其他课程吧", 2);
      else if (!(err && err.errCode === 20002)) showToast("关注暂未完成，可稍后重试", 2);
    } finally {
      followBusy = false;
      syncSetupUi();
    }
  }
  function rescueSeconds() { return game.timeLimit >= 90 ? 10 : 5; }
  function canRescue() {
    return growthReady && xhsCan("postNote") && !dailyGrowth().used && !game.rescueUsed;
  }
  async function earnDailyRescue() {
    const daily = dailyGrowth();
    if (!daily.earned && !daily.used) {
      daily.earned = true;
      await persistGrowth();
    }
    renderGrowthActions();
  }
  function renderGrowthActions() {
    const daily = dailyGrowth();
    const eligible = canRescue();
    resultRescueButton.hidden = !(game.lastRun && !game.lastRun.success && game.rescueSnapshot && eligible);
    resultRescueButton.disabled = shareBusy || rescueBusy;
    resultRescueButton.textContent = daily.earned ? "使用今日续时，返回现场 +" + rescueSeconds() + " 秒" : "分享笔记，返回现场 +" + rescueSeconds() + " 秒";
  }
  function clearRescueInputs() {
    input.gas = false; input.brake = false;
    input.steer = 0; input.steerTarget = 0;
    input.steerPointer = null; input.steerPointerAngle = null;
    input.steerDragDegrees = 0; input.steerReturnRate = 0;
    gasButton.classList.remove("is-pressed"); brakeButton.classList.remove("is-pressed");
    game.car.speed = 0; game.recoil.vx = 0; game.recoil.vy = 0;
    setEngine(false); setTankRumble(false);
    controlsEl.classList.add("is-disabled"); pauseButton.hidden = true;
    syncThumbHints();
  }
  function handleTimeout() {
    if (canRescue()) {
      game.rescueSnapshot = Object.assign(normalizedCarPos(game.layout), { angle: game.car.angle });
      if (!dailyGrowth().offered) { openRescue(true); return; }
    }
    failAssessment();
  }
  function openRescue(markOffered) {
    if (!canRescue()) { failAssessment(); return; }
    clearSceneView();
    if (markOffered) { dailyGrowth().offered = true; persistGrowth(); }
    game.state = "rescue";
    rescueMessage = "";
    clearRescueInputs();
    hideToast();
    resultOverlay.classList.remove("is-visible");
    rescueOverlay.classList.add("is-visible");
    renderRescue();
    if (typeof rescueAction.focus === "function") rescueAction.focus();
  }
  function renderRescue() {
    const daily = dailyGrowth();
    rescueCopy.textContent = daily.used ? "今日续时已使用，明天再来挑战。" : daily.earned ? "今日续时已备好，可继续当前现场 +" + rescueSeconds() + " 秒。" : "今日首次分享笔记，可增加 " + rescueSeconds() + " 秒，继续当前挑战。";
    rescueAction.textContent = rescueBusy ? "等待笔记发布结果…" : daily.earned ? "使用续时 +" + rescueSeconds() + " 秒" : "分享笔记，续时 " + rescueSeconds() + " 秒";
    rescueAction.disabled = rescueBusy || daily.used || game.state === "resuming";
    rescueDecline.disabled = rescueBusy || game.state === "resuming";
    rescueCloseButton.disabled = rescueBusy || game.state === "resuming";
    rescueStatus.textContent = rescueMessage || "现场已暂停 · 每日一次 · 北京时间零点刷新";
  }
  function restoreRescueScene() {
    game.failureFx = null;
    game.layout = projectMap(game.map);
    clearParkingHelp();
    if (game.stage === "exit") game.layout.target = game.layout.exitTarget;
    Object.assign(game.car, { angle: game.rescueSnapshot.angle, speed: 0, destroyed: false, wreck: null });
    applyNormalizedCarPos(game.rescueSnapshot);
    game.particles.length = 0; game.contactFx.life = 0;
    gameEl.classList.remove("is-shaking");
    clearRescueInputs();
    refreshParkStatus();
    lastShareDataUrl = "";
    draw();
  }
  function buildRescueImage() {
    const board = document.createElement("canvas"); board.width = 720; board.height = 960;
    const g = board.getContext("2d");
    if (!g) return "";
    g.fillStyle = "#f5f1df"; g.fillRect(0, 0, 720, 960);
    g.strokeStyle = "#171815"; g.lineWidth = 10; g.strokeRect(5, 5, 710, 950);
    g.fillStyle = "#171815"; g.textAlign = "left";
    g.font = "900 44px 'PingFang SC', sans-serif"; g.fillText("会停车吗你", 36, 78);
    g.font = "800 24px 'PingFang SC', sans-serif";
    g.fillText(challengeLabel({ levelId: currentLevel() ? game.levelId : null, vehicle: game.vehicle, mode: game.mode, difficulty: game.difficulty }), 36, 126, 648);
    blitPlayfield(g, 36, 158, 648, 420);
    g.strokeRect(36, 158, 648, 420);
    g.fillStyle = "#f3df42"; g.fillRect(36, 620, 648, 100);
    g.fillStyle = "#171815"; g.font = "900 46px 'PingFang SC', sans-serif";
    g.fillText("就差最后一把方向了", 54, 685, 610);
    g.font = "800 30px 'PingFang SC', sans-serif"; g.fillText("挑战中 · 教练，再给几秒！", 36, 786);
    g.font = "700 25px 'PingFang SC', sans-serif"; g.fillText("倒车入库 / 侧方停车 · 你能停进去吗？", 36, 870, 648);
    return board.toDataURL("image/png");
  }
  async function useOrShareRescue() {
    if (rescueBusy || game.state !== "rescue" || !canRescue()) return;
    if (!dailyGrowth().earned) {
      rescueBusy = true; rescueMessage = ""; renderRescue();
      try {
        const dataUrl = buildRescueImage();
        if (!dataUrl) throw new Error("image");
        let path = "";
        try { path = await writeShareTempFile(dataUrl); } catch (_) {}
        await callMiniTool("postNote", {
          title: "就差最后一把方向了", pageType: "photo_publish",
          content: "《会停车吗你》" + challengeLabel({ levelId: currentLevel() ? game.levelId : null, vehicle: game.vehicle, mode: game.mode, difficulty: game.difficulty }) + "，挑战还在继续！你能停进去吗？\n\n#会停车吗你 #停车游戏 #倒车入库",
          mediaInfo: { image_resources: [{ url: path || dataUrl }] }
        });
        await earnDailyRescue();
        rescueMessage = "已提交笔记发布，点击使用续时后继续当前现场";
      } catch (_) { rescueMessage = "未完成发布，机会未扣除。可重试，也可接受失败。"; }
      finally { rescueBusy = false; renderRescue(); }
      return; // Explicit second click avoids unexpectedly restarting after app return.
    }
    const daily = dailyGrowth();
    daily.used = true;
    game.bonusTime = rescueSeconds();
    game.rescueUsed = true;
    game.rescueDeadline = game.elapsed + game.penalty + game.bonusTime;
    game.timeLeft = game.bonusTime;
    game.stableTime = 0;
    game.state = "resuming";
    game.resumeCountdown = 3;
    clearRescueInputs();
    persistGrowth();
    renderRescue();
    rescueStatus.textContent = "准备继续 · 3";
    updateHud();
  }

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
      levelId: game.journey === "campaign" ? game.levelId : null,
      vehicle: game.vehicle,
      seed: currentLevel() ? currentLevel().seed : (Math.random() * 0xffffffff) >>> 0,
    };
  }

  function syncDifficultyBadge() {
    const mission = currentLevel();
    difficultyBadge.textContent = mission ? String(mission.id).padStart(2, "0") + " " + mission.title + " · " + VEHICLES[game.vehicle].label : VEHICLES[game.vehicle].label + " · " + MODES[game.mode].label + " · " + DIFFICULTIES[game.difficulty].label;
  }

  function clearHudButtons() {
    syncDifficultyBadge();
    gameEl.style.setProperty("--brand-shift", "0px");
    gameEl.classList.remove("is-compact-brand");
    const textElements = Array.from(document.querySelectorAll(".brand-title, .brand-kicker"))
      .filter(function (el) { return el.offsetWidth > 0; });
    const buttonRects = Array.from(document.querySelectorAll(".hud-actions button"))
      .filter(function (el) { return el.offsetWidth > 0; })
      .map(function (el) { return el.getBoundingClientRect(); });
    if (!textElements.length || !buttonRects.length) return;
    // Reserve the full three-button row even while the pause button is hidden.
    const actions = document.querySelector(".hud-actions").getBoundingClientRect();
    const needsCompactText = textElements.some(function (el) {
      const isTitle = el.classList && el.classList.contains("brand-title");
      return (isTitle && el.getBoundingClientRect().right + 8 > actions.left) || el.scrollWidth > el.clientWidth;
    });
    if (needsCompactText) gameEl.classList.add("is-compact-brand");
    const textRects = textElements.map(function (el) { return el.getBoundingClientRect(); });
    const top = Math.min.apply(null, buttonRects.map(function (r) { return r.top; }));
    const bottom = Math.max.apply(null, buttonRects.map(function (r) { return r.bottom; }));
    let shift = 0;
    textRects.forEach(function (r) {
      if (r.right + 8 > actions.left && r.left - 8 < actions.right && r.bottom + 8 > top && r.top - 8 < bottom) {
        shift = Math.max(shift, bottom + 8 - r.top);
      }
    });
    if (shift > 0) gameEl.style.setProperty("--brand-shift", Math.ceil(shift) + "px");
  }

  function playAreaTop() {
    const gameRect = gameEl.getBoundingClientRect();
    const missionRect = missionEl.getBoundingClientRect();
    const measured = missionRect.bottom - gameRect.top + 8;
    const fallback = 104;
    const value = Number.isFinite(measured) && measured > 48 ? measured : fallback;
    // A narrow screen may stack the full title below the centered buttons.
    return clamp(value, 60, H * 0.5);
  }

  // 场地内容只由 map.seed 决定，屏幕尺寸只影响投影结果，
  // 所以 resize 重新投影不会换掉玩家正在挑战的场地。
  // Fixed world geometry is uniformly fitted into the available playfield.
  // Physics, obstacle spacing and turning circles therefore survive viewport changes.
  function projectMap(map) {
    const mission = map.levelId ? LEVELS[map.levelId - 1] : null;
    const advanced = mission && mission.chapter === 1;
    const rng = makeRng(map.seed);
    const vehicle = VEHICLES[map.vehicle || "car"];
    // At 10 degrees a 128x40 truck spans about 133x62 world units.
    // Include the 1-unit parking inset and 2 units of center error on each side.
    const truckMinBayLength = 140;
    const truckMinBayWidth = 68;
    const freeDiff = DIFF_ORDER.indexOf(map.difficulty);
    const kind = mission ? mission.layout : map.mode === "parallel" ? (freeDiff === 2 ? "tight" : "parallel") : ["wide", "garden", "pillar"][freeDiff];
    // Include the rendered safe-area padding when projecting the driving scene.
    const controlsHeight = controlsEl.offsetHeight || (H <= 670 ? 178 : clamp(H * 0.27, 190, 232));
    // Pack the HUD, proportional scene and controls together. Extra height belongs
    // outside this group, rather than in gaps above and below the parking lot.
    gameEl.style.setProperty("--game-edge-space", "0px");
    clearHudButtons();
    const basePlayTop = playAreaTop();
    const widthScale = (W - 12) / 390;
    const edgeSpace = Math.max(0, (H - controlsHeight - basePlayTop - 350 * widthScale - 12) / 2);
    gameEl.style.setProperty("--game-edge-space", edgeSpace + "px");
    const controlTop = H - controlsHeight - edgeSpace;
    const playTop = basePlayTop + edgeSpace;
    const scale = Math.min((W - 12) / 390, (controlTop - playTop - 12) / 350);
    // Keep the reminder proportional to a narrow projected lot, with readable text.
    gameEl.style.setProperty("--mission-scale", clamp(382 * scale / 280, 0.85, 1).toFixed(3));
    const ox = (W - 390 * scale) / 2;
    const oy = playTop + (controlTop - playTop - 350 * scale) / 2;
    const px = function (x) { return ox + x * scale; };
    const py = function (y) { return oy + y * scale; };
    const layout = { controlsHeight: controlsHeight, controlTop: controlTop, playTop: playTop, roadTop: oy, roadBottom: controlTop,
      scale: scale, ox: ox, oy: oy, bounds: { left: px(4), right: px(386), top: py(5), bottom: py(345) },
      carLength: vehicle.length * scale, carWidth: vehicle.width * scale, parkedCars: [], obstacles: [], decorBays: [], curbBays: [], curbOpenings: [],
      signX: px(345), checkpoint: null, exitTarget: null, kind: kind };
    const rect = function (x, y, w, h, type, label) {
      layout.obstacles.push({ x: px(x), y: py(y), w: w * scale, h: h * scale, angle: 0, type: type || "wall", label: label || "" });
    };
    const neighbor = function (x, y, angle, bayLength, bayWidth) {
      // Stable paint variety on retry, without consuming the geometry RNG.
      const paints = NEIGHBOR_PAINTS[map.vehicle || "car"];
      const paint = paints[((map.seed >>> 0) + layout.parkedCars.length) % paints.length];
      layout.parkedCars.push({ x: px(x), y: py(y), angle: angle, vehicle: map.vehicle || "car",
        length: vehicle.length * scale, width: vehicle.width * scale,
        bayLength: (bayLength || slotLength) * scale, bayWidth: (bayWidth || slotWidth) * scale,
        art: paint.art,
        color: paint.color });
    };
    let rowNeighbors = false, parallelNeighbors = false;
    let tx = kind === "left" ? 264 : 132, ty = 79, angle = Math.PI / 2;
    const isCar = map.vehicle === "car";
    let slotLength = isCar ? vehicle.length * 1.38 + 10 : vehicle.length + 26;
    let slotWidth = isCar ? vehicle.width * 1.65 + 9 : map.vehicle === "truck" ? truckMinBayWidth : vehicle.width + 18;
    let spawn = { x: 290, y: 245, angle: 0 };
    if (kind === "left") spawn = { x: 95, y: 245, angle: Math.PI };
    if (kind === "parallel" || kind === "tight") {
      tx = 195; ty = 75; angle = 0;
      const parallelRatio = isCar ? (kind === "tight" ? 1.34 : 1.64) : map.vehicle === "van" ? (kind === "tight" ? 1.26 : 1.50) : (kind === "tight" ? 1.24 : 1.40);
      slotLength = map.vehicle === "truck" ? vehicle.length + (kind === "tight" ? 28 : 36) : vehicle.length * parallelRatio + 12;
      slotWidth = isCar ? vehicle.width * 1.48 + 9 : map.vehicle === "truck" ? truckMinBayWidth : vehicle.width + 14;
      parallelNeighbors = true;
      // A long-truck bay and one full-size neighbor fit without shrinking either.
      if (map.vehicle === "truck") tx = 236;
      neighbor(tx, ty, 0);
      if (map.vehicle !== "truck") neighbor(tx, ty, 0);
      if (map.vehicle === "truck") rect(349, ty, 20, slotWidth + 8, "wall", "护栏");
      // Road edge behind the bay prevents an easy drive-through from above.
      rect(195, ty - slotWidth / 2 - 9, 378, 12, "wall", "路沿");
      spawn = { x: 293, y: 195, angle: 0 };
    } else if (kind === "diagonal") {
      tx = 145; ty = 90; angle = Math.PI / 3;
      if (advanced) {
        slotLength = 62; slotWidth = 37;
        spawn = { x: 316, y: 279, angle: 0 };
        rect(211, 198, 112, 18, "wall", "借位隔离带");
      }
      rowNeighbors = true;
      neighbor(tx, ty, angle); neighbor(tx, ty, angle);
    } else if (kind === "alley") {
      tx = 277; ty = 63; slotLength = 62; slotWidth = 34;
      rect(238, 90, 16, 160, "wall", "巷墙");
      rect(247, 170, 34, 16, "wall", "巷墙转角");
      rect(256, 210, 16, 80, "wall", "收窄巷口");
      rect(326, 130, 16, 240, "wall", "巷墙");
      rect(282, 10, 104, 12, "wall", "尽头");
      spawn = { x: 322, y: 300, angle: Math.PI / 6 };
    } else if (kind === "gate") {
      tx = 155; ty = 64;
      rect(68, 125, 130, 18, "wall", "院墙"); rect(283, 125, 210, 18, "wall", "院墙");
      spawn = { x: 291, y: 255, angle: 0 };
      slotWidth = vehicle.width * 1.45 + 10;
      neighbor(286, 64, angle, vehicle.length + 14, vehicle.width + 18);
    } else if (kind === "dock" || kind === "final") {
      tx = kind === "final" ? 128 : 170; ty = 78;
      slotWidth = vehicle.width * 1.48 + 10;
      const wallX = tx - slotWidth / 2 - 10;
      rect(wallX, 72, 14, 128, "wall", "仓库");
      rect(tx + slotWidth / 2 + 10, 72, 14, 128, "wall", "仓库");
      rect(tx, 11, slotWidth + 33, 12, "dock", "卸货口");
      if (kind === "final") {
        rect(283, 165, 18, 100, "wall", "分隔墙");
        layout.checkpoint = finishTarget({ cx: px(325), cy: py(110), halfLength: 40 * scale, halfWidth: 37 * scale, angle: Math.PI / 2 });
        spawn = { x: 324, y: 276, angle: -Math.PI / 2 };
        neighbor(46, 78, angle, slotLength, 56);
      } else {
        neighbor(65, 78, angle, slotLength, vehicle.width + 18);
        neighbor(287, 78, angle, slotLength, vehicle.width + 18);
      }
    } else {
      rowNeighbors = true;
      neighbor(tx, ty, angle); neighbor(tx, ty, angle);
    }
    if (kind === "garden") {
      rect(196, 190, advanced ? 146 : 78, advanced ? 82 : 47, "garden", "花坛");
      if (advanced) {
        tx = 118; ty = 66; slotLength = 63; slotWidth = 36;
        spawn = { x: 310, y: 289, angle: 0 };
        rect(74, 273, 18, 72, "wall", "借道护栏");
      }
    }
    if (kind === "pillar") {
      rect(200, 225, 27, 29, "pillar", "立柱");
      if (map.vehicle === "truck") spawn.y = 280;
    }
    if (kind === "exit") {
      tx = 132; ty = 68; slotLength = 64; slotWidth = 36;
      rect(92, 177, 16, 212, "wall", "巷墙"); rect(204, 142, 16, 168, "wall", "巷墙");
      rect(258, 256, 100, 16, "wall", "出口隔离带");
      layout.exitTarget = finishTarget({ cx: px(328), cy: py(307), halfLength: 31 * scale, halfWidth: 18 * scale, angle: 0 });
      spawn = { x: 320, y: 190, angle: Math.PI / 2 };
    }
    if (!mission) {
      // Bounded variations: keep a full maneuvering lane and the target entrance clear.
      const shift = (rng() - 0.5) * (map.mode === "parallel" ? 12 : 24);
      tx += shift;
      layout.parkedCars.forEach(function (car) { car.x += shift * scale; });
      if (freeDiff === 0) { slotLength *= 1.12; slotWidth *= 1.08; }
      if (freeDiff === 2) { slotLength *= 0.94; slotWidth *= 0.94; }
      if (map.vehicle === "truck") {
        slotLength = Math.max(slotLength, truckMinBayLength);
        slotWidth = Math.max(slotWidth, truckMinBayWidth);
      }
      if (map.mode === "reverse" && map.vehicle === "truck") slotLength = Math.min(slotLength, 142);
      if (map.mode === "parallel" && map.vehicle === "truck") {
        slotLength = Math.min(slotLength, vehicle.length + 36);
        const neighborBay = vehicle.length + 10;
        tx = clamp(tx, 6 + slotLength / 2 + neighborBay, 384 - slotLength / 2);
      }
      const count = freeDiff + 1;
      for (let i = 0; i < count; i += 1) rect(27 + i * 37 + rng() * 10, 310 + rng() * 12, 12, 12, "cone");
      spawn.y += (rng() - 0.5) * 34;
      if (map.vehicle === "truck" && map.mode === "reverse") spawn.y = Math.max(spawn.y, 275);
      if (rng() < 0.5) {
        tx = 390 - tx; spawn.x = 390 - spawn.x; spawn.angle = Math.PI - spawn.angle;
        if (angle === 0) angle = Math.PI;
        layout.parkedCars.forEach(function (car) { car.x = px(390) - (car.x - ox); car.angle = Math.PI - car.angle; });
        layout.obstacles.forEach(function (item) { item.x = px(390) - (item.x - ox); });
      }
    }
    if (map.vehicle === "truck" && angle !== 0 && angle !== Math.PI) {
      const offset = Math.max(0, slotLength / 2 + 7 - ty);
      ty += offset;
      layout.parkedCars.forEach(function (car) { car.y += offset * scale; });
    }
    layout.target = finishTarget({ cx: px(tx), cy: py(ty), halfLength: slotLength * scale / 2, halfWidth: slotWidth * scale / 2, angle: angle });
    layout.parkingTarget = layout.target;
    if (rowNeighbors) {
      layout.parkedCars.forEach(function (car, index) {
        const side = index === 0 ? -1 : 1;
        car.x = layout.target.cx + layout.target.sx * slotWidth * scale * side;
        car.y = layout.target.cy + layout.target.sy * slotWidth * scale * side;
        car.angle = angle; car.bayLength = slotLength * scale; car.bayWidth = slotWidth * scale;
      });
    } else if (parallelNeighbors) {
      const rowLength = 2 * Math.min(tx - 6, 384 - tx);
      const neighborLength = map.vehicle === "truck" ? vehicle.length + 10 : Math.min(slotLength, (rowLength - slotLength) / 2);
      layout.parkedCars.forEach(function (car, index) {
        const distance = (slotLength + neighborLength) * scale / 2 * (index === 0 ? -1 : 1);
        car.x = layout.target.cx + layout.target.fx * distance;
        car.y = layout.target.cy + layout.target.fy * distance;
        car.angle = angle; car.bayLength = neighborLength * scale; car.bayWidth = slotWidth * scale;
      });
    }
    // The left wall occupies the would-be neighboring bay in the exit alley.
    if (kind === "exit") layout.parkedCars = layout.parkedCars.filter(function (car) { return car.x > layout.target.cx; });
    // Paint describes the exact bays containing the collision geometry.
    layout.decorBays = [layout.parkingTarget].concat(layout.parkedCars.map(function (car) {
      return finishTarget({ cx: car.x, cy: car.y, angle: car.angle, halfLength: car.bayLength / 2, halfWidth: car.bayWidth / 2 });
    }));
    layout.parkingZoneLabel = vehicle.label + (kind === "dock" || kind === "final" ? "装卸区" : "停车区");
    layout.spawn = { x: px(spawn.x), y: py(spawn.y), angle: spawn.angle };
    // A separate seed keeps the scattered edge cones stable without changing course geometry.
    const coneRng = makeRng((map.seed ^ 0x6c8e9cf5) >>> 0);
    const coneSpots = [[21, 157], [369, 153], [22, 239], [368, 242], [194, 315], [287, 316]];
    for (let i = coneSpots.length - 1; i > 0; i -= 1) {
      const j = Math.floor(coneRng() * (i + 1));
      const spot = coneSpots[i]; coneSpots[i] = coneSpots[j]; coneSpots[j] = spot;
    }
    const coneLimit = 3 + Math.floor(coneRng() * 3);
    let addedCones = 0;
    const coneClear = function (x, y) {
      const pad = 21 * scale;
      const zones = layout.decorBays.concat([layout.checkpoint, layout.exitTarget]).filter(Boolean);
      if (zones.some(function (zone) {
        return Math.abs(x - zone.cx) < zone.hx + pad && Math.abs(y - zone.cy) < zone.hy + pad;
      })) return false;
      // Leave room for the whole starting vehicle, its marker and the first maneuver.
      const dx = x - layout.spawn.x, dy = y - layout.spawn.y;
      const along = dx * Math.cos(spawn.angle) + dy * Math.sin(spawn.angle);
      const across = -dx * Math.sin(spawn.angle) + dy * Math.cos(spawn.angle);
      if (Math.abs(along) < layout.carLength / 2 + 40 * scale
        && Math.abs(across) < layout.carWidth / 2 + 28 * scale) return false;
      return layout.obstacles.every(function (item) {
        return Math.abs(x - item.x) > item.w / 2 + pad || Math.abs(y - item.y) > item.h / 2 + pad;
      });
    };
    coneSpots.forEach(function (spot) {
      if (addedCones >= coneLimit) return;
      const x = px(spot[0] + (coneRng() - .5) * 8);
      const y = py(spot[1] + (coneRng() - .5) * 22);
      if (!coneClear(x, y)) return;
      layout.obstacles.push({ x: x, y: y, w: 14 * scale, h: 19 * scale, angle: 0, type: "cone", label: "雪糕桶" });
      addedCones += 1;
    });
    return layout;
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

  // Record only the rejected intended pose, before axis sliding overwrites probes.
  const sceneContact = { x: 0, y: 0, nx: 0, ny: 0 };

  function recordContact(box, nx, ny) {
    extentOnAxis(box.points, -nx, -ny);
    const edge = extentMax;
    let x = 0, y = 0, count = 0;
    box.points.forEach(function (point) {
      if (edge - point.x * -nx - point.y * -ny < 0.75 * game.layout.scale) {
        x += point.x; y += point.y; count += 1;
      }
    });
    sceneContact.x = x / count; sceneContact.y = y / count;
    sceneContact.nx = nx; sceneContact.ny = ny;
  }

  function recordObbContact(box, other) {
    let depth = Infinity, nx = 0, ny = 0;
    for (let i = 0; i < 4; i += 1) {
      const axis = i < 2 ? box.axes[i] : other.axes[i - 2];
      extentOnAxis(box.points, axis.x, axis.y);
      const min = extentMin, max = extentMax;
      extentOnAxis(other.points, axis.x, axis.y);
      const positive = extentMax - min, negative = max - extentMin;
      const overlap = Math.min(positive, negative);
      if (overlap < depth) {
        depth = overlap;
        const sign = positive < negative ? 1 : -1;
        nx = axis.x * sign; ny = axis.y * sign;
      }
    }
    recordContact(box, nx, ny);
    // Use the overlapping part of the bumper/side, including off-center hits.
    extentOnAxis(box.points, -ny, nx);
    const min = extentMin, max = extentMax;
    extentOnAxis(other.points, -ny, nx);
    const tangent = (Math.max(min, extentMin) + Math.min(max, extentMax)) / 2;
    const shift = tangent - (sceneContact.x * -ny + sceneContact.y * nx);
    sceneContact.x -= ny * shift; sceneContact.y += nx * shift;
  }

  function obbHitsScene(box, captureContact) {
    const { carLength, carWidth, parkedCars, obstacles } = game.layout;
    for (let i = 0; i < 4; i += 1) {
      const point = box.points[i];
      const bounds = game.layout.bounds;
      if (point.x < bounds.left || point.x > bounds.right || point.y < bounds.top || point.y > bounds.bottom) {
        if (captureContact) recordContact(box, point.x < bounds.left ? 1 : point.x > bounds.right ? -1 : 0,
          point.x < bounds.left || point.x > bounds.right ? 0 : point.y < bounds.top ? 1 : -1);
        return true;
      }
    }
    for (let i = 0; i < parkedCars.length; i += 1) {
      const parked = parkedCars[i];
      writeObb(probeOther, parked.x, parked.y, (parked.length || carLength) * 0.97, (parked.width || carWidth) * 0.95, parked.angle);
      if (obbOverlap(box, probeOther)) {
        if (captureContact) recordObbContact(box, probeOther);
        return true;
      }
    }
    for (let i = 0; i < obstacles.length; i += 1) {
      const item = obstacles[i];
      writeObb(probeOther, item.x, item.y, item.w, item.h, item.angle);
      if (obbOverlap(box, probeOther)) {
        if (captureContact) recordObbContact(box, probeOther);
        return true;
      }
    }
    return false;
  }

  function carFits(x, y, angle, captureContact) {
    const { carLength, carWidth } = game.layout;
    writeObb(probeCar, x, y, carLength * 0.96, carWidth * 0.94, angle);
    return !obbHitsScene(probeCar, captureContact);
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
    if (carFits(nextX, nextY, nextAngle, true)) {
      car.x = nextX; car.y = nextY; car.angle = nextAngle;
      return CONTACT_CLEAR;
    }
    const minSlide = 0.001 * game.layout.scale;
    if (Math.abs(nextX - prevX) > minSlide && carFits(nextX, prevY, nextAngle)) {
      car.x = nextX; car.angle = nextAngle;
      return CONTACT_SLIDE;
    }
    if (Math.abs(nextY - prevY) > minSlide && carFits(prevX, nextY, nextAngle)) {
      car.y = nextY; car.angle = nextAngle;
      return CONTACT_SLIDE;
    }
    if (Math.hypot(nextX - prevX, nextY - prevY) > minSlide && carFits(nextX, nextY, prevAngle)) {
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
    return { u: (game.car.x - layout.ox) / layout.scale, v: (game.car.y - layout.oy) / layout.scale };
  }

  function applyNormalizedCarPos(pos) {
    const layout = game.layout;
    game.car.x = layout.ox + pos.u * layout.scale;
    game.car.y = layout.oy + pos.v * layout.scale;
    if (game.stage === "exit" && layout.exitTarget) layout.target = layout.exitTarget;
    settleCarIntoScene();
  }

  // Native window geometry takes priority over guessed status-bar / button sizes.
  // Old clients retain the CSS safe-area and corner-clear fallbacks.
  let windowInfoRequest = 0;
  function refreshWindowInfo() {
    if (platformVersion < 9490 || !xhsCan("getWindowInfo")) return;
    const request = ++windowInfoRequest;
    withTimeout(callMiniTool("getWindowInfo", {}), 4000).then(function (info) {
      if (request !== windowInfoRequest || !info || !Number.isFinite(info.windowHeight) || info.windowHeight <= 0) return;
      const safe = info.safeArea;
      if (!safe || !Number.isFinite(safe.top) || !Number.isFinite(safe.bottom)) return;
      const rect = gameEl.getBoundingClientRect();
      const safeTop = Math.max(0, safe.top);
      const safeBottom = Math.max(0, info.windowHeight - safe.bottom);
      let topInset = safeTop;
      const buttons = info.menuButtons || {};
      [buttons.back, buttons.me, buttons.share].forEach(function (button) {
        if (button && Number.isFinite(button.left) && Number.isFinite(button.right) && Number.isFinite(button.bottom) &&
            button.right > rect.left && button.left < rect.right) topInset = Math.max(topInset, button.bottom + 6);
      });
      // Keep malformed native results from consuming the whole playfield.
      topInset = Math.min(topInset, info.windowHeight / 3);
      gameEl.style.setProperty("--game-safe-top", safeTop + "px");
      gameEl.style.setProperty("--game-safe-bottom", Math.min(safeBottom, info.windowHeight / 3) + "px");
      gameEl.style.setProperty("--game-top-inset", topInset + "px");
      gameEl.style.setProperty("--corner-clear", "0px");
      resize(true);
    }).catch(function () { /* Keep the CSS fallback when the bridge is unavailable. */ });
  }

  function resize(skipNativeWindowInfo) {
    if (Number.isFinite(window.innerHeight) && window.innerHeight > 0) gameEl.style.setProperty("--app-height", window.innerHeight + "px");
    const rect = gameEl.getBoundingClientRect();
    gameEl.style.setProperty("--controls-height", (rect.height <= 670 ? 178 : clamp(rect.height * .27, 190, 232)) + "px");
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

    // A viewport change must not restore vehicles already crushed by the tank.
    if (previousLayout && (game.state === "tank" || game.state === "failed")) {
      game.layout.parkedCars.forEach(function (parked, index) {
        parked.wreck = previousLayout.parkedCars[index] ? previousLayout.parkedCars[index].wreck : null;
      });
    }

    if (game.state === "ready") {
      resetCar();
    } else if (previousCar) {
      applyNormalizedCarPos(previousCar);
      // 地址栏收起等尺寸变化会挪动场地，这段时间内不因此扣时间
      game.penaltyGrace = Math.max(game.penaltyGrace, 0.8);
    }
    game.tank.y = game.layout.roadTop + (game.layout.roadBottom - game.layout.roadTop) * 0.46;
    updateOrientationGuard(rect);
    if (skipNativeWindowInfo !== true) refreshWindowInfo();
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
    game.car.wreck = null;
    settleCarIntoScene();
  }

  /* ---------------- 本地记录 ---------------- */

  function readSoundPref() {
    try {
      const raw = readData(SOUND_KEY, null);
      if (raw === "0" || raw === 0) return false;
      if (raw === "1" || raw === 1) return true;
    } catch (_) {
      /* 读不到就用默认开 */
    }
    return true;
  }

  function writeSoundPref() {
    try {
      saveData(SOUND_KEY, soundEnabled ? "1" : "0");
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
      const value = readData(INTRO_KEY, null);
      return nativeIntroSeen || value === true || value === 1 || value === "1";
    } catch (_) {
      return false;
    }
  }

  function markIntroSeen() {
    try {
      nativeIntroSeen = true; saveData(INTRO_KEY, "1");
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
        if (MODE_ORDER.includes(mode) && DIFF_ORDER.includes(difficulty) && validEntry(parsed[key])) cleaned[key] = parsed[key];
      });
      return cleaned;
    } catch (_) {
      return {};
    }
  }

  function recordFor(mode, difficulty) {
    if (game.journey === "campaign") return progress[game.levelId] || null;
    return freeRecords[`${game.vehicle}:${mode}:${difficulty}`] || (game.vehicle === "car" ? records[`${mode}:${difficulty}`] : null) || null;
  }

  function totalPlays() { return Object.keys(progress).reduce(function (sum, id) { return sum + (progress[id].plays || 0); }, 0); }
  function clearedCount() { return LEVELS.filter(function (level) { return progress[level.id] && progress[level.id].clears > 0; }).length; }
  function totalBestStars() { return LEVELS.reduce(function (sum, level) { return sum + (progress[level.id] ? progress[level.id].bestStars : 0); }, 0); }
  function allCleared() { return clearedCount() === 16; }

  function commitRun(run) {
    const key = run.levelId || `${run.vehicle}:${run.mode}:${run.difficulty}`;
    const store = run.levelId ? progress : freeRecords;
    const entry = store[key] || { bestTime: null, bestStars: 0, clears: 0, plays: 0 };
    if (run.countPlay !== false) entry.plays += 1;
    let improved = false;
    if (run.success) {
      entry.clears += 1;
      if (entry.bestTime === null || run.netTime < entry.bestTime) {
        entry.bestTime = run.netTime;
        improved = true;
      }
      if (run.stars > entry.bestStars) entry.bestStars = run.stars;
    }
    store[key] = entry;
    saveData(run.levelId ? PROGRESS_KEY : FREE_KEY, store);
    return improved;
  }

  function rateRun(netTime, hits, scrapes, starTime) {
    if (hits === 0 && scrapes === 0 && netTime <= starTime) return 3;
    if (hits === 0 && scrapes === 0) return 2;
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

  function applyLevel(id) {
    const mission = LEVELS[id - 1];
    if (!mission) return;
    game.levelId = id; game.vehicle = mission.vehicle; game.mode = mission.mode;
    game.difficulty = id % 4 === 0 ? "hard" : "easy";
  }
  function renderCampaign() {
    campaignProgress.textContent = clearedCount() + " / 16 关 · " + totalBestStars() + " / 48 星";
    chapterPicker.textContent = "";
    CHALLENGES.chapters.forEach(function (title, index) {
      const button = document.createElement("button");
      button.type = "button"; button.dataset.chapter = String(index);
      button.className = "chapter-option" + (index === selectedChapter ? " is-selected" : "");
      button.setAttribute("aria-pressed", String(index === selectedChapter));
      button.textContent = String(index + 1).padStart(2, "0") + " " + title;
      chapterPicker.appendChild(button);
    });
    levelList.textContent = "";
    LEVELS.filter(function (mission) { return mission.chapter === selectedChapter; }).forEach(function (mission) {
      const button = document.createElement("button");
      const entry = progress[mission.id]; const locked = !canPlayLevel(mission.id);
      button.type = "button"; button.dataset.level = String(mission.id);
      button.className = "level-option" + (mission.id === game.levelId ? " is-selected" : "") + (locked && !followChecking ? " is-locked" : "");
      button.disabled = locked && followChecking; button.setAttribute("aria-pressed", String(mission.id === game.levelId));
      const number = document.createElement("b"); number.textContent = String(mission.id).padStart(2, "0");
      const title = document.createElement("span"); title.textContent = mission.title;
      const stars = document.createElement("small"); stars.textContent = locked ? (followChecking ? "确认中…" : followStatus === -1 ? "重试确认" : "关注解锁") : entry && entry.clears ? "★".repeat(entry.bestStars) + "☆".repeat(3 - entry.bestStars) : "待挑战";
      button.append(number, title, stars); levelList.appendChild(button);
    });
    const mission = currentLevel();
    if (mission && mission.chapter !== selectedChapter) {
      levelDetail.textContent = "本章尚未解锁 · 完成前面的关卡后开启。";
      vehicleNote.textContent = "可以先去自由挑战，试开小货车和大卡车。";
      startButtonLabel.textContent = "继续第 " + mission.id + " 关 · " + mission.title;
    } else if (mission) {
      levelDetail.textContent = "第 " + mission.id + " 关 · " + VEHICLES[mission.vehicle].label + " · " + mission.time + " 秒\n" + mission.hint;
      vehicleNote.textContent = VEHICLES[mission.vehicle].note;
      if (bonusLocked(mission.id)) {
        vehicleNote.textContent = followChecking ? "正在确认关注状态…" : followStatus === -1 ? "暂未确认关注状态，点击下方重试；其他课程可正常游玩。" : "关注一次，解锁 04 / 08 / 12 / 16 四个福利关；也可先玩其他课程。";
        startButtonLabel.textContent = followChecking ? "正在确认关注状态…" : followStatus === -1 ? "重新确认关注状态" : "关注作者，解锁 4 个福利关";
      }
    }
  }
  function syncSetupUi() {
    const mission = currentLevel();
    syncDifficultyBadge();
    startStamp.textContent = mission ? "停车训练场 · 16 关主线" : "开放练习场 · 随机车位";
    startButtonLabel.textContent = mission ? "挑战 " + String(mission.id).padStart(2, "0") + " " + mission.title : "开始随机挑战";
    posterCard.classList.toggle("has-played", totalPlays() > 0);
    howTo.hidden = introSeen();
    campaignPanel.hidden = !mission; freePanel.hidden = Boolean(mission);
    journeyButtons.forEach(function (button) { const selected = button.dataset.journey === game.journey; button.classList.toggle("is-selected", selected); button.setAttribute("aria-selected", String(selected)); });
    modeButtons.forEach(function (button) { const selected = button.dataset.mode === game.mode; button.classList.toggle("is-selected", selected); button.setAttribute("aria-checked", String(selected)); });
    difficultyButtons.forEach(function (button) {
      const selected = button.dataset.difficulty === game.difficulty; button.classList.toggle("is-selected", selected); button.setAttribute("aria-checked", String(selected));
      const factor = game.vehicle === "truck" ? 1.8 : game.vehicle === "van" ? 1.35 : 1;
      button.querySelector("b").textContent = Math.round(DIFFICULTIES[button.dataset.difficulty].time * factor) + " 秒";
    });
    vehicleButtons.forEach(function (button) { const selected = button.dataset.vehicle === game.vehicle; button.classList.toggle("is-selected", selected); button.setAttribute("aria-checked", String(selected)); });
    document.querySelector("#freeVehicleNote").textContent = VEHICLES[game.vehicle].note;
    document.querySelector("#pauseRestartLabel").textContent = mission ? "原场地重新挑战" : "换一张随机场地";
    renderCampaign(); renderRecordGrid(); renderStartRecord();
    startButton.disabled = followBusy || Boolean(mission && bonusLocked(mission.id) && followChecking);
    startCloseButton.disabled = followBusy;
    startCloseButton.setAttribute("aria-label", suspendedRun ? "关闭选关，继续当前关卡" : "收起关卡选择，查看场地");
    startCloseButton.title = suspendedRun ? "继续当前关卡" : "查看场地";
  }
  function selectSetup(mode, difficulty, autostart) {
    if (autostart && !canStartInOrientation()) return;
    if (mode && MODES[mode]) game.mode = mode;
    if (difficulty && DIFFICULTIES[difficulty]) game.difficulty = difficulty;
    if (game.journey === "campaign") applyLevel(game.levelId);
    resetGame(Boolean(autostart));
  }

  function resetGame(autostart = true, reuseMap = false) {
    if (shareBusy || rescueBusy) return;
    if (autostart && !canStartInOrientation()) return;
    clearSceneView();
    clearParkingHelp();
    game.parkingHelp.shown = false;
    if (autostart && currentLevel() && !canPlayLevel(game.levelId)) autostart = false;
    rescueOverlay.classList.remove("is-visible");
    rescueMessage = "";
    game.bonusTime = 0;
    game.rescueDeadline = 0;
    game.rescueUsed = false;
    game.rescueSnapshot = null;
    game.resumeCountdown = 0;
    game.resultRecorded = false;
    if (game.journey === "campaign") applyLevel(game.levelId);
    const level = currentRules();
    const sameSetup = game.map && game.map.mode === game.mode && game.map.difficulty === game.difficulty && game.map.vehicle === game.vehicle && game.map.levelId === (currentLevel() ? game.levelId : null);
    if (!reuseMap || !sameSetup) game.map = makeMap();
    game.layout = projectMap(game.map);
    game.state = autostart ? "playing" : "ready";
    game.timeLimit = level.time;
    game.timeLeft = level.time;
    game.elapsed = 0;
    game.playerMarker.introLeft = PLAYER_MARKER_DELAY;
    game.playerMarker.idleTime = 0;
    game.playerMarker.bobTime = 0;
    game.stage = currentLevel() && currentLevel().layout === "final" ? "checkpoint" : "park";
    game.reverseEntered = false;
    game.lastParkingOverlap = false;
    game.actualSteer = 0;
    game.penalty = 0;
    game.hits = 0;
    game.scrapes = 0;
    game.stableTime = 0;
    clearDirectionWarning();
    game.collisionCooldown = 0;
    game.scrapeCooldown = 0;
    game.penaltyGrace = 0;
    game.flash = 0;
    game.driveDirection = -1;
    game.successFx = 0;
    game.failureFx = null;
    // 首次游玩的正式局前先做三步操作教学，教学期间不计时
    game.guide.active = autostart && !introSeen();
    game.guide.step = 0;
    game.guide.holdTimer = 0;
    lastReverseBeepAt = 0;
    lastCountdownSecond = null;
    game.particles.length = 0;
    game.contactFx.life = 0;
    game.recoil.vx = 0;
    game.recoil.vy = 0;
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

  async function startGame(confirmed = false) {
    if (shareBusy || rescueBusy || followBusy) return;
    if (!canStartInOrientation()) return;
    if (currentLevel() && !canPlayLevel(game.levelId)) {
      await unlockBonus();
      if (!canPlayLevel(game.levelId)) return;
    }
    if (!canStartInOrientation()) return;
    if (suspendedRun && confirmed !== true) {
      const previous = suspendedRun.game;
      const same = previous.journey === game.journey && (game.journey === "campaign" ? previous.levelId === game.levelId : previous.vehicle === game.vehicle && previous.mode === game.mode && previous.difficulty === game.difficulty);
      switchLevelCopy.textContent = (same ? "重新开始将终止当前这局。" : "进入所选关卡将终止当前这局。") + "本局进度不会保留，已获得的成绩不受影响。";
      switchLevelConfirm.textContent = same ? "终止并重新开始" : "终止并进入新关卡";
      startOverlay.classList.remove("is-visible");
      switchLevelOverlay.classList.add("is-visible");
      if (typeof switchLevelCancel.focus === "function") switchLevelCancel.focus();
      return;
    }
    initAudio();
    suspendedRun = null;
    switchLevelOverlay.classList.remove("is-visible");
    startOverlay.classList.remove("is-visible");
    // 沿用开始页预览的那张场地，避免点开始后场地突然变了
    resetGame(true, true);
    // The mission line (or tutorial strip) already explains the opening action.
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
    const level = currentRules();
    if (game.guide.active) pauseSummary.textContent = `${mode.label} · 教学中 · 还没开始计时`;
    else pauseSummary.textContent = `${challengeLabel({ levelId: currentLevel() ? game.levelId : null, vehicle: game.vehicle, mode: game.mode, difficulty: game.difficulty })} · 剩余 ${game.timeLeft.toFixed(1)} 秒`;
    hideToast();
    pauseOverlay.classList.add("is-visible");
    setEngine(false);
    setTankRumble(false);
  }

  function resumeGame() {
    if (game.state !== "paused") return;
    if (!canStartInOrientation()) return;
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
    returnToLevelSelect();
  }

  function returnToLevelSelect() {
    if (shareBusy || rescueBusy || followBusy) return;
    if (!suspendedRun && ["playing", "paused", "rescue", "resuming"].includes(game.state)) {
      if (game.state === "playing") pauseGame();
      suspendedRun = { game: JSON.parse(JSON.stringify(game)), steer: input.steer, chapter: selectedChapter, width: W, height: H, rescueMessage: rescueMessage };
    }
    resetGame(false);
    hideToast();
    startOverlay.classList.add("is-visible");
    if (typeof startButton.focus === "function") startButton.focus();
  }

  function cancelLevelSwitch() {
    switchLevelOverlay.classList.remove("is-visible");
    startOverlay.classList.add("is-visible");
    if (typeof startButton.focus === "function") startButton.focus();
  }

  function continueSuspendedRun() {
    if (!suspendedRun || shareBusy || rescueBusy || followBusy) return;
    const saved = suspendedRun;
    suspendedRun = null;
    Object.keys(game).forEach(function (key) { delete game[key]; });
    Object.assign(game, saved.game);
    selectedChapter = saved.chapter;
    rescueMessage = saved.rescueMessage;
    input.steer = saved.steer;
    input.steerTarget = 0;
    input.steerDragDegrees = input.steer * 360;
    clearSceneView();
    startOverlay.classList.remove("is-visible");
    switchLevelOverlay.classList.remove("is-visible");
    if (W !== saved.width || H !== saved.height) resize();
    gameEl.classList.add("is-live");
    syncSetupUi();
    syncGuideUi();
    if (game.state === "paused") {
      pauseOverlay.classList.add("is-visible");
      resumeGame();
    } else {
      renderRescue();
      rescueOverlay.classList.add("is-visible");
    }
    lastFrame = performance.now();
    updateHud();
  }

  function clearSceneView() {
    dismissedOverlay = null;
    sceneReturn.hidden = true;
    gameEl.classList.remove("is-viewing-scene");
  }

  function closeSceneDialog(overlay, copy, label) {
    if (shareBusy || rescueBusy || followBusy || !overlay.classList.contains("is-visible")) return;
    dismissedOverlay = overlay;
    overlay.classList.remove("is-visible");
    sceneReturnCopy.textContent = copy;
    sceneReturnButton.textContent = label;
    sceneReturn.hidden = false;
    gameEl.classList.add("is-viewing-scene");
    hideToast();
    if (typeof sceneReturnButton.focus === "function") sceneReturnButton.focus();
  }

  function reopenSceneDialog() {
    if (!dismissedOverlay) return;
    const overlay = dismissedOverlay;
    clearSceneView();
    if (overlay === rescueOverlay) renderRescue();
    if (overlay === resultOverlay) renderGrowthActions();
    overlay.classList.add("is-visible");
    const closeButton = overlay === startOverlay ? startCloseButton : overlay === rescueOverlay ? rescueCloseButton : resultCloseButton;
    if (typeof closeButton.focus === "function") closeButton.focus();
  }

  function closeSetupDialog() {
    if (suspendedRun) { continueSuspendedRun(); return; }
    if (game.state === "ready") closeSceneDialog(startOverlay, "查看场地中 · 尚未开始计时", "返回关卡选择");
  }

  function closeRescueDialog() {
    if (game.state === "rescue") closeSceneDialog(rescueOverlay, "现场已暂停 · 救场机会保留", "返回救场");
  }

  function closeResultDialog() {
    if (game.state === "success" || game.state === "failed") closeSceneDialog(resultOverlay, "本局已结束 · 正在查看现场", "查看结算");
  }

  function closeRotateDialog() {
    rotateOverlay.classList.remove("is-visible");
    rotateOverlay.setAttribute("aria-hidden", "true");
  }

  function canStartInOrientation() {
    if (!orientationBlocked) return true;
    showToast("请先转回竖屏，再继续停车", 2);
    return false;
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
    const speedKmh = Math.round(Math.abs(game.car.speed) / (game.layout ? game.layout.scale : 1) * SPEED_TO_KMH);
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
    const labelText = guiding ? "教学中" : "考核剩余";
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
    syncParkingHelp();
    const mission = missionMessage();
    if (hudCache.mission !== mission) {
      hudCache.mission = mission;
      missionText.textContent = mission;
    }
    syncThumbHints();
  }

  function parkingHelpAvailable() {
    if (game.state !== "playing" || game.guide.active || game.car.destroyed || !game.layout || game.stage === "exit") return false;
    // Match the countdown, including collision penalties. Tutorial and pauses use no time.
    if (game.elapsed + game.penalty <= game.timeLimit / 2 || game.timeLeft <= 0) return false;
    const layout = game.layout;
    const target = layout.parkingTarget;
    writeObb(probeCar, game.car.x, game.car.y, layout.carLength, layout.carWidth, game.car.angle);
    writeObb(probeOther, target.cx, target.cy, target.halfLength * 2, target.halfWidth * 2, target.angle);
    // Reaching any part of the bay is enough; this is not the stricter win condition.
    return !obbOverlap(probeCar, probeOther);
  }

  function clearParkingHelp() {
    game.parkingHelp.timeLeft = 0;
    game.parkingHelp.highlightLeft = 0;
    game.parkingHelp.message = "";
    game.parkingHelp.stage = "";
  }

  function syncParkingHelp() {
    const available = parkingHelpAvailable();
    if (!available || game.parkingHelp.stage !== game.stage) clearParkingHelp();
    if (available && !game.parkingHelp.shown) {
      game.parkingHelp.shown = true;
      game.parkingHelp.timeLeft = PARKING_HELP_DURATION;
      game.parkingHelp.highlightLeft = PARKING_HELP_HIGHLIGHT_DURATION;
      game.parkingHelp.message = parkingHelpMessage();
      game.parkingHelp.stage = game.stage;
      playParkingHelpSound();
    }
    const active = available && game.parkingHelp.timeLeft > 0;
    missionEl.classList.toggle("is-help", active);
  }

  function parkingHelpMessage() {
    if (game.stage === "checkpoint") return "先让车身经过绿色检查区";
    const target = game.layout.parkingTarget;
    const dx = game.car.x - target.cx, dy = game.car.y - target.cy;
    const along = dx * target.fx + dy * target.fy;
    const across = Math.abs(dx * target.sx + dy * target.sy);
    const headingError = angleDistance(game.car.angle, target.angle);
    if (headingError < ALIGN_TOLERANCE && across < target.halfWidth && along > target.halfLength) return "车尾已对准黄框，按住后退慢慢倒入";
    const nearby = Math.hypot(dx, dy) < target.halfLength + game.layout.carLength;
    if (nearby && headingError >= ALIGN_TOLERANCE) return "先摆正车身，" + requiredHeading();
    const tips = {
      parallel: "先与前车并排，再向黄框低速倒入",
      tight: "空间较窄，分几次前进后退微调",
      diagonal: "绕开隔离带，让车尾对准斜列车位",
      garden: "先绕开花坛，给车头留出转弯空间",
      alley: "先在巷口外摆正，再低速倒入",
      exit: "先在巷外摆正，倒进黄框停稳",
      gate: "先在院外摆正，让车尾对准窄门",
      dock: "先留出转弯空间，让车尾对准卸货口",
      final: "检查已通过，让车尾对准黄色卸货口",
      pillar: "先向外借出空间，绕过立柱再倒库",
    };
    return tips[game.layout.kind] || "先留出转弯空间，让车尾对准黄框";
  }

  function syncThumbHints() {
    const active = game.state === "playing" && !game.car.destroyed;
    const leftHidden = !active || controlHintSeen.steer;
    const rightHidden = !active || controlHintSeen.pedals;
    if (leftThumbHint.hidden !== leftHidden) leftThumbHint.hidden = leftHidden;
    if (rightThumbHint.hidden !== rightHidden) rightThumbHint.hidden = rightHidden;
  }

  function dismissThumbHint(control) {
    controlHintSeen[control] = true;
    syncThumbHints();
  }

  function missionMessage() {
    if (game.state === "rescue" || game.state === "resuming") return "现场已暂停 · 教练，再给几秒";
    if (game.state === "assessment") return "时间到 · 考核不通过";
    if (game.state === "tank") return "没停进去。坦克来了。";
    if (game.state === "failed") return "本次考核不通过 · 再练一把";
    if (game.state === "success") return "停车完成 · 考核通过";
    if (game.state === "paused") return "游戏已暂停";
    if (game.state === "playing") {
      if (game.guide.active) return "教学中 · 暂不计时";
      if (game.parkingHelp.timeLeft > 0) return game.parkingHelp.message;
      return parkingHint();
    }
    return MODES[game.mode].hint;
  }

  function parkingHint() {
    const park = game.park;
    if (game.stage === "checkpoint") return "先通过绿色检查区，再去卸货口";
    if (park.wrongDirection) return "方向反了 · " + requiredHeading();
    if (game.stage === "exit") {
      if (park.inside && !park.aligned) return "摆正车身 · " + requiredHeading();
      if (park.inside) return park.stopped ? "停稳中…" : "松开踏板停稳";
      return "停车完成！驶到绿色出口，再停稳";
    }
    if (park.inside && !game.reverseEntered) return "请驶出车位，再让车尾先倒入";
    if (park.inside && !park.aligned) return "摆正车身";
    if (park.inside && park.aligned && !park.stopped) return "松开踏板停稳";
    if (park.inside && park.aligned && park.stopped) return "停稳中…";
    if (game.car.speed < -5) return "倒车中";
    if (game.car.speed > 5) return "前进中";
    return currentLevel() ? currentLevel().hint : "车尾先进入黄框，按箭头方向停稳";
  }

  function requiredHeading() {
    const directions = ["右", "右下", "下", "左下", "左", "左上", "上", "右上"];
    const index = (Math.round(game.layout.target.angle / (Math.PI / 4)) % 8 + 8) % 8;
    return "车头应朝" + directions[index] + "方";
  }

  function clearDirectionWarning() {
    game.wrongDirectionWarned = false;
    if (toastEl.textContent.indexOf("方向反了！") === 0) hideToast();
  }

  /* ---------------- 首局教学 ---------------- */

  const GUIDE_STEPS = [
    { text: "左手大拇指：沿圆周转动方向盘", check: () => Math.abs(input.steer) * 360 >= 80 },
    { text: "右手大拇指：按住「前进」往前开", check: () => game.car.speed > 14 },
    { text: "按住「后退」向后开", check: () => game.car.speed < -6 },
  ];

  function syncGuideUi() {
    const guide = game.guide;
    const active = Boolean(guide.active);
    guideTip.hidden = !active;
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
    game.playerMarker.introLeft = PLAYER_MARKER_DELAY;
    game.playerMarker.idleTime = 0;
    game.playerMarker.bobTime = 0;
    game.stage = currentLevel() && currentLevel().layout === "final" ? "checkpoint" : "park";
    game.reverseEntered = false;
    game.lastParkingOverlap = false;
    game.actualSteer = 0;
    game.penalty = 0;
    game.hits = 0;
    game.scrapes = 0;
    game.stableTime = 0;
    clearDirectionWarning();
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

  function playParkingHelpSound() {
    if (!soundEnabled || !audioCtx || document.hidden || orientationBlocked) return;
    try {
      resumeAudioContext();
      if (!contactBus) { contactBus = audioCtx.createGain(); contactBus.connect(audioCtx.destination); }
      contactBus.gain.setValueAtTime(1, audioCtx.currentTime);
      // A soft rising chime, clearly different from reverse and collision sounds.
      [[784, 0, .16, .035], [1046, .08, .22, .028]].forEach(function (note) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const start = audioCtx.currentTime + note[1];
        osc.type = "sine";
        osc.frequency.setValueAtTime(note[0], start);
        gain.gain.setValueAtTime(.001, start);
        gain.gain.linearRampToValueAtTime(note[3], start + .006);
        gain.gain.exponentialRampToValueAtTime(.001, start + note[2]);
        osc.connect(gain).connect(contactBus);
        osc.onended = function () { osc.disconnect(); gain.disconnect(); };
        osc.start(start);
        osc.stop(start + note[2] + .02);
      });
    } catch (_) { /* The visual hint remains available if audio cannot play. */ }
  }

  function playReverseBeep() {
    playTone(880, 0.085, "square", 0.035);
    lastReverseBeepAt = performance.now();
  }

  function playContactSound(scrape, strength) {
    if (!soundEnabled || !audioCtx) return;
    // A cached noise buffer adds a soft friction texture without media downloads.
    if (typeof audioCtx.createBuffer !== "function" || typeof audioCtx.createBufferSource !== "function") {
      playTone(scrape ? 158 : 105, 0.12, "triangle", 0.035, 0, scrape ? 96 : 42);
      return;
    }
    try {
      resumeAudioContext();
      if (!contactBus) {
        contactBus = audioCtx.createGain();
        contactBus.connect(audioCtx.destination);
      }
      contactBus.gain.setValueAtTime(1, audioCtx.currentTime);
      if (!contactNoise) {
        contactNoise = audioCtx.createBuffer(1, Math.ceil(audioCtx.sampleRate * 0.22), audioCtx.sampleRate);
        const samples = contactNoise.getChannelData(0);
        for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;
      }
      const now = audioCtx.currentTime;
      const duration = scrape ? 0.15 : 0.18;
      const noise = audioCtx.createBufferSource();
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();
      noise.buffer = contactNoise;
      filter.type = scrape ? "bandpass" : "lowpass";
      filter.frequency.value = scrape ? 1450 : 620;
      filter.Q.value = 0.65;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime((scrape ? 0.055 : 0.1) * strength, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      noise.connect(filter).connect(gain).connect(contactBus);
      noise.onended = function () { noise.disconnect(); filter.disconnect(); gain.disconnect(); };
      noise.start(now); noise.stop(now + duration);
      if (!scrape) {
        const thud = audioCtx.createOscillator();
        const thudGain = audioCtx.createGain();
        thud.type = "sine";
        thud.frequency.setValueAtTime(115, now);
        thud.frequency.exponentialRampToValueAtTime(42, now + 0.13);
        thudGain.gain.setValueAtTime(0.09 * strength, now);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        thud.connect(thudGain).connect(contactBus);
        thud.onended = function () { thud.disconnect(); thudGain.disconnect(); };
        thud.start(now); thud.stop(now + 0.16);
      }
    } catch (_) {
      playTone(scrape ? 158 : 105, 0.12, "triangle", 0.035, 0, 48);
    }
  }

  function playCountdownTick(secondsLeft) {
    const urgent = secondsLeft <= 3;
    playTone(urgent ? 1120 : 760, urgent ? 0.085 : 0.055, "sine", urgent ? 0.06 : 0.038);
    if (urgent) playTone(840, 0.06, "sine", 0.035, 0.09);
  }

  function playCrushSplat(strength) {
    if (!soundEnabled || !audioCtx) return;
    // A soft crack/thud followed by a descending rubbery "squelch".
    playContactSound(false, strength);
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(460, now);
      osc.frequency.exponentialRampToValueAtTime(72, now + .075);
      osc.frequency.exponentialRampToValueAtTime(128, now + .13);
      osc.frequency.exponentialRampToValueAtTime(42, now + .25);
      gain.gain.setValueAtTime(.001, now);
      gain.gain.linearRampToValueAtTime(.085 * strength, now + .008);
      gain.gain.exponentialRampToValueAtTime(.001, now + .26);
      osc.connect(gain).connect(contactBus || audioCtx.destination);
      osc.onended = function () { osc.disconnect(); gain.disconnect(); };
      osc.start(now); osc.stop(now + .27);
    } catch (_) {
      playTone(280, .18, "triangle", .04 * strength, 0, 48);
    }
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
    let activePointer = null;
    const release = (event) => {
      if (event.pointerId !== activePointer) return;
      activePointer = null;
      input[key] = false;
      button.classList.remove("is-pressed");
      if (button.hasPointerCapture && button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (game.state !== "playing") return;
      if (activePointer !== null && input[key]) return;
      activePointer = event.pointerId;
      dismissThumbHint("pedals");
      if (button.setPointerCapture) button.setPointerCapture(event.pointerId);
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
    button.addEventListener("lostpointercapture", release);
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
    if (game.state !== "playing" || input.steerPointer !== null) return;
    dismissThumbHint("steer");
    input.steerPointer = event.pointerId;
    input.steerPointerAngle = getSteerPointerAngle(event);
    input.steerDragDegrees = input.steer * 360;
    input.steerTarget = input.steer;
    if (wheelPad.setPointerCapture) wheelPad.setPointerCapture(event.pointerId);
  });
  wheelPad.addEventListener("pointermove", (event) => {
    if (event.pointerId !== input.steerPointer) return;
    event.preventDefault();
    rotateSteerFromPointer(event);
  });
  const releaseSteer = (event) => {
    if (event.pointerId !== input.steerPointer) return;
    input.steerPointer = null;
    input.steerPointerAngle = null;
    input.steerTarget = 0;
    input.steerDragDegrees = input.steer * 360;
    input.steerReturnRate = 0;
    if (wheelPad.hasPointerCapture && wheelPad.hasPointerCapture(event.pointerId)) wheelPad.releasePointerCapture(event.pointerId);
  };
  wheelPad.addEventListener("pointerup", releaseSteer);
  wheelPad.addEventListener("pointercancel", releaseSteer);
  wheelPad.addEventListener("lostpointercapture", releaseSteer);

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
      if (event.defaultPrevented) return;
      if (rotateOverlay.classList.contains("is-visible")) closeRotateDialog();
      else if (switchLevelOverlay.classList.contains("is-visible")) cancelLevelSwitch();
      else if (dismissedOverlay) reopenSceneDialog();
      else if (startOverlay.classList.contains("is-visible")) closeSetupDialog();
      else if (rescueOverlay.classList.contains("is-visible")) closeRescueDialog();
      else if (resultOverlay.classList.contains("is-visible")) closeResultDialog();
      else if (game.state === "playing") pauseGame();
      else if (game.state === "paused") resumeGame();
      return;
    }
    if (keyMap[event.key] && game.state === "playing") {
      event.preventDefault();
      dismissThumbHint(event.key === "ArrowLeft" || event.key === "ArrowRight" ? "steer" : "pedals");
      keyMap[event.key]();
    }
  });
  window.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") input.steerTarget = 0;
    if (event.key === "ArrowUp") { input.gas = false; gasButton.classList.remove("is-pressed"); }
    if (event.key === "ArrowDown") { input.brake = false; brakeButton.classList.remove("is-pressed"); }
  });

  journeyButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      game.journey = button.dataset.journey;
      if (currentLevel()) { applyLevel(game.levelId); selectedChapter = currentLevel().chapter; }
      resetGame(false);
    });
  });
  vehicleButtons.forEach(function (button) {
    button.addEventListener("click", function () { game.vehicle = button.dataset.vehicle; resetGame(false); });
  });
  chapterPicker.addEventListener("click", function (event) {
    const button = event.target.closest("[data-chapter]");
    if (!button) return;
    selectedChapter = Number(button.dataset.chapter);
    const first = selectedChapter * 4 + 1;
    if (canPlayLevel(first) && currentLevel().chapter !== selectedChapter) {
      applyLevel(ALL_LEVELS_OPEN ? first : Math.min(first + 3, unlockedLevel())); resetGame(false);
    } else renderCampaign();
  });
  levelList.addEventListener("click", function (event) {
    const button = event.target.closest("[data-level]");
    if (!button || button.disabled) return;
    const id = Number(button.dataset.level);
    applyLevel(id); resetGame(false);
  });
  modeButtons.forEach((button) => {
    button.addEventListener("click", () => selectSetup(button.dataset.mode, null, false));
  });
  difficultyButtons.forEach((button) => {
    button.addEventListener("click", () => selectSetup(null, button.dataset.difficulty, false));
  });
  startButton.addEventListener("click", () => startGame());
  switchLevelConfirm.addEventListener("click", () => startGame(true));
  switchLevelCancel.addEventListener("click", continueSuspendedRun);
  switchLevelClose.addEventListener("click", cancelLevelSwitch);
  guideSkip.addEventListener("click", finishGuide);
  pauseButton.addEventListener("click", pauseGame);
  levelSelectButton.addEventListener("click", returnToLevelSelect);
  pauseCloseButton.addEventListener("click", resumeGame);
  startCloseButton.addEventListener("click", closeSetupDialog);
  rescueCloseButton.addEventListener("click", closeRescueDialog);
  resultCloseButton.addEventListener("click", closeResultDialog);
  rotateCloseButton.addEventListener("click", closeRotateDialog);
  sceneReturnButton.addEventListener("click", reopenSceneDialog);
  continueButton.addEventListener("click", resumeGame);
  pauseRestartButton.addEventListener("click", () => resetGame(true));
  pauseExitButton.addEventListener("click", exitPausedGame);
  restartButton.addEventListener("click", () => resetGame(true));
  nextDifficultyButton.addEventListener("click", () => {
    if (!canStartInOrientation()) return;
    if (game.journey === "campaign") {
      if (nextPlayableLevel(game.levelId)) { applyLevel(nextPlayableLevel(game.levelId).id); selectedChapter = currentLevel().chapter; resetGame(true); }
      else { game.journey = "free"; resetGame(false); startOverlay.classList.add("is-visible"); }
    } else selectSetup(nextDifficultyButton.dataset.mode, nextDifficultyButton.dataset.difficulty, true);
  });
  changeDifficultyButton.addEventListener("click", returnToLevelSelect);
  shareXhsButton.addEventListener("click", postShareNote);
  rescueAction.addEventListener("click", useOrShareRescue);
  rescueDecline.addEventListener("click", function () {
    if (rescueBusy || game.state !== "rescue") return;
    rescueOverlay.classList.remove("is-visible");
    failAssessment();
  });
  resultRescueButton.addEventListener("click", function () {
    if (shareBusy || !canRescue() || !game.rescueSnapshot) return;
    restoreRescueScene();
    openRescue(false);
  });
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
      if (contactBus) contactBus.gain.setValueAtTime(0, audioCtx.currentTime);
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
    if (game.state === "playing" && !document.hidden && !orientationBlocked) {
      game.parkingHelp.timeLeft = Math.max(0, game.parkingHelp.timeLeft - dt);
      game.parkingHelp.highlightLeft = Math.max(0, game.parkingHelp.highlightLeft - dt);
    }
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
    if (game.state !== "paused") game.contactFx.life = Math.max(0, game.contactFx.life - dt);
    if (game.state === "resuming" && !document.hidden && !orientationBlocked) {
      game.resumeCountdown = Math.max(0, game.resumeCountdown - dt);
      rescueStatus.textContent = "准备继续 · " + Math.ceil(game.resumeCountdown);
      if (game.resumeCountdown <= 0) {
        game.state = "playing";
        rescueOverlay.classList.remove("is-visible");
        controlsEl.classList.remove("is-disabled");
        pauseButton.hidden = false;
        lastFrame = performance.now();
      }
    } else if (game.state === "playing") updatePlaying(dt);
    else refreshParkStatus();
    if (game.state === "success") game.successFx = Math.min(1, game.successFx + dt * 1.5);
    if (game.state === "assessment" && !document.hidden && !orientationBlocked) updateAssessment(dt);
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
    game.timeLeft = Math.max(0, (game.rescueUsed ? game.rescueDeadline : game.timeLimit) - game.elapsed - game.penalty);

    const car = game.car;
    const vehicle = VEHICLES[game.vehicle];
    const scale = game.layout.scale;
    if (input.gas && !input.brake) car.speed += (car.speed < 0 ? vehicle.brake : vehicle.accel) * scale * dt;
    else if (input.brake && !input.gas) car.speed -= (car.speed > 0 ? vehicle.brake : vehicle.reverseAccel) * scale * dt;
    else {
      const drag = vehicle.drag * scale * dt;
      if (Math.abs(car.speed) <= drag) car.speed = 0;
      else car.speed -= Math.sign(car.speed) * drag;
    }
    car.speed = clamp(car.speed, -vehicle.reverse * scale, vehicle.forward * scale);
    if (car.speed > 2 * scale) game.driveDirection = 1;
    else if (car.speed < -2 * scale) game.driveDirection = -1;
    game.actualSteer = lerp(game.actualSteer, input.steer, 1 - Math.exp(-vehicle.response * dt));
    const impactSpeed = Math.abs(car.speed);
    const nextPose = CHALLENGES.advance(car, car.speed * dt, game.actualSteer, vehicle, scale);
    const nextX = nextPose.x, nextY = nextPose.y, nextAngle = nextPose.angle;
    const contact = moveCar(nextX, nextY, nextAngle);

    if (contact === CONTACT_BLOCKED) {
      car.speed = -Math.sign(car.speed) * Math.min(impactSpeed * 0.1, 8 * scale);
      if (impactSpeed > 8) registerImpact(impactSpeed);
    } else if (contact === CONTACT_SLIDE) {
      car.speed *= 0.62;
      if (impactSpeed > 10) registerScrape(impactSpeed);
    }
    updateRecoil(dt);

    if (Math.abs(car.speed) > 36 && Math.abs(input.steer) > 0.62 && Math.random() < dt * 7) {
      game.skidMarks.push({ x: car.x, y: car.y, angle: car.angle, life: 1 });
      if (game.skidMarks.length > 80) game.skidMarks.shift();
    }

    updatePlayerMarker(dt);
    updateMissionStage(dt);
    refreshParkStatus();
    const validEntry = game.stage === "exit" || game.reverseEntered;
    const validParking = game.stage !== "checkpoint" && validEntry && game.park.inside && game.park.aligned && game.park.stopped;
    if (validParking) game.stableTime += dt;
    else game.stableTime = 0;
    const wrongDirection = !game.guide.active && game.park.wrongDirection;
    if (wrongDirection && !game.wrongDirectionWarned) showToast("方向反了！" + requiredHeading() + "，驶出后调头再停", 2.5);
    if (wrongDirection) game.wrongDirectionWarned = true;
    else if (game.wrongDirectionWarned) clearDirectionWarning();

    setEngine(Math.abs(car.speed) > 1 || input.gas || input.brake);
    updateDrivingSoundCues();

    if (!game.guide.active && validParking && game.stableTime >= STABLE_TIME) {
      if (currentLevel() && currentLevel().layout === "exit" && game.stage === "park") {
        game.stage = "exit"; game.layout.target = game.layout.exitTarget; game.stableTime = 0;
        showToast("停好了！现在驶出窄巷，到绿色出口停稳", 2.8);
      } else completeSuccess();
      return;
    }
    if (!game.guide.active && game.timeLeft <= 0) handleTimeout();
  }

  function updateMissionStage(dt) {
    const layout = game.layout;
    if (game.stage === "checkpoint") {
      const check = layout.checkpoint;
      if (pointInTarget(check, game.car.x, game.car.y, 0)) {
        game.stage = "park"; showToast("检查通过！去左侧卸货口倒库", 2.4);
      }
      return;
    }
    if (game.stage === "exit") return;
    const target = layout.parkingTarget;
    const box = makeObb(game.car.x, game.car.y, layout.carLength * 0.96, layout.carWidth * 0.94, game.car.angle);
    const overlapping = obbOverlap(box, targetObb(target, 1));
    if (!overlapping) { game.reverseEntered = false; }
    if (overlapping && !game.lastParkingOverlap) {
      // Crossing the bay boundary backwards, with the rear facing the intended end.
      const rearTowardBay = (target.cx - game.car.x) * Math.cos(game.car.angle) + (target.cy - game.car.y) * Math.sin(game.car.angle) < 0;
      game.reverseEntered = game.car.speed < -1 * layout.scale && rearTowardBay;
    }
    game.lastParkingOverlap = overlapping;
  }

  function updateRecoil(dt) {
    const recoil = game.recoil;
    if (Math.abs(recoil.vx) + Math.abs(recoil.vy) < 0.1) return;
    const car = game.car;
    const decay = Math.exp(-30 * dt);
    const step = (1 - decay) / 30;
    const x = car.x + recoil.vx * step, y = car.y + recoil.vy * step;
    if (carFits(x, y, car.angle)) { car.x = x; car.y = y; }
    else { recoil.vx = 0; recoil.vy = 0; return; }
    recoil.vx *= decay; recoil.vy *= decay;
  }

  function contactFeedback(scrape, speed) {
    const scale = game.layout.scale;
    const strength = clamp(speed / (100 * scale), 0.4, 1);
    const fx = game.contactFx;
    Object.assign(fx, sceneContact, { life: fx.duration, strength: strength, scrape: scrape });
    const impulse = (scrape ? 8 : 28) * strength * scale;
    game.recoil.vx = fx.nx * impulse;
    game.recoil.vy = fx.ny * impulse;
    const count = scrape ? 8 : 12;
    for (let i = 0; i < count; i += 1) {
      const spread = (Math.random() - 0.5) * 4 * scale;
      const tangent = (Math.random() - 0.5) * (scrape ? 110 : 95) * scale;
      const outward = (20 + Math.random() * 62) * strength * scale;
      const life = 0.22 + Math.random() * 0.16;
      game.particles.push({ kind: "spark", x: fx.x - fx.ny * spread, y: fx.y + fx.nx * spread,
        vx: fx.nx * outward - fx.ny * tangent, vy: fx.ny * outward + fx.nx * tangent,
        size: (scrape ? 4.5 : 6) * scale, color: i % 2 ? "#fff8d9" : "#ffb638",
        life: life, maxLife: life, angle: 0, spin: 0 });
    }
    playContactSound(scrape, strength);
  }

  function registerImpact(speed) {
    if (game.collisionCooldown > 0) return;
    game.collisionCooldown = 0.7;
    game.hits += 1;
    game.flash = 0.2;
    contactFeedback(false, speed);
    feedback("medium");
    if (game.penaltyGrace > 0) {
      showToast("撞到了！");
      return;
    }
    game.penalty += IMPACT_PENALTY;
    game.timeLeft = Math.max(0, (game.rescueUsed ? game.rescueDeadline : game.timeLimit) - game.elapsed - game.penalty);
    showToast(`撞到了！罚 ${IMPACT_PENALTY} 秒`);
  }

  function registerScrape(speed) {
    if (game.scrapeCooldown > 0) return;
    game.scrapeCooldown = 0.55;
    game.scrapes += 1;
    contactFeedback(true, speed);
    feedback("light");
    if (game.scrapes <= 2) showToast("剐蹭一下，不罚时", 0.9);
  }

  function refreshParkStatus() {
    if (!game.layout) return;
    const { target, carLength, carWidth } = game.layout;
    const car = game.car;
    writeObb(probePark, car.x, car.y, carLength, carWidth, car.angle);
    const limitAlong = target.halfLength - 1 * game.layout.scale;
    const limitAcross = target.halfWidth - 1 * game.layout.scale;
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
    const headingError = angleDistance(car.angle, target.angle);
    // Exclude exactly 10 degrees despite rounding when angles wrap.
    game.park.aligned = headingError < ALIGN_TOLERANCE - 1e-10;
    game.park.wrongDirection = game.stage !== "checkpoint" && pointInTarget(target, car.x, car.y, 0) && headingError > Math.PI / 2;
    game.park.stopped = Math.abs(car.speed) < STOP_SPEED * game.layout.scale;
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
    feedback("medium");
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

  function failAssessment() {
    if (game.state === "assessment" || game.state === "failed") return;
    game.state = "assessment";
    game.timeLeft = 0;
    game.failureFx = { age: 0, impacted: false, hitStop: 0 };
    game.contactFx.life = 0;
    clearRescueInputs();
    hideToast();
  }

  function updateAssessment(dt) {
    const fx = game.failureFx;
    if (fx.hitStop > 0) {
      const held = Math.min(dt, fx.hitStop);
      fx.hitStop -= held;
      dt -= held;
    }
    fx.age += dt;
    if (!fx.impacted && fx.age >= ASSESSMENT_IMPACT) {
      fx.impacted = true;
      fx.age = ASSESSMENT_IMPACT;
      fx.hitStop = markerMotionPreference && markerMotionPreference.matches ? 0 : .085;
      game.car.destroyed = true;
      // One heavy thump, crack and low iron ring on the existing muteable bus.
      playAssessmentSound();
      feedback("heavy");
    }
    // Keep the fully visible verdict and flattened scene on screen for 3 seconds.
    // Use animation time so background/orientation suspension also pauses the hold.
    const reducedMotion = markerMotionPreference && markerMotionPreference.matches;
    const resultAt = reducedMotion ? ASSESSMENT_IMPACT + ASSESSMENT_RESULT_DELAY : ASSESSMENT_DURATION;
    if (fx.age >= resultAt) {
      game.state = "failed";
      showResult(false);
    }
  }

  function playAssessmentSound() {
    if (!soundEnabled || !audioCtx) return;
    try {
      resumeAudioContext();
      if (!contactBus) { contactBus = audioCtx.createGain(); contactBus.connect(audioCtx.destination); }
      contactBus.gain.setValueAtTime(1, audioCtx.currentTime);
      const voices = [
        { type: "sine", delay: 0, duration: .30, volume: .24, pitch: [[0, 150], [.045, 58], [.30, 32]] },
        { type: "triangle", delay: 0, duration: .075, volume: .075, pitch: [[0, 1050], [.075, 145]] },
        { type: "triangle", delay: .025, duration: .34, volume: .075, pitch: [[0, 340], [.10, 190], [.21, 125], [.34, 78]] },
      ];
      voices.forEach(function (note) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const start = audioCtx.currentTime + note.delay;
        osc.type = note.type;
        note.pitch.forEach(function (point, index) {
          if (index === 0) osc.frequency.setValueAtTime(point[1], start);
          else osc.frequency.exponentialRampToValueAtTime(point[1], start + point[0]);
        });
        gain.gain.setValueAtTime(.001, start);
        gain.gain.linearRampToValueAtTime(note.volume, start + .004);
        if (note.type === "sine") gain.gain.linearRampToValueAtTime(note.volume * .7, start + .045);
        gain.gain.exponentialRampToValueAtTime(.001, start + note.duration);
        osc.connect(gain).connect(contactBus);
        osc.onended = function () { osc.disconnect(); gain.disconnect(); };
        osc.start(start); osc.stop(start + note.duration + .02);
      });
    } catch (_) { /* Sound is optional; assessment and rescue stay available. */ }
  }

  // Reserved animation; ordinary timeout paths use failAssessment instead.
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
    game.tank.pressAge = -1;
    game.tank.impactPause = 0;
    showToast("轰——坦克真的来了", 1.8);
    soundBurst("hit");
    feedback("medium");
  }

  function advanceCrushing(body, length, width, frontX, dt) {
    const halfX = (Math.abs(Math.cos(body.angle)) * length + Math.abs(Math.sin(body.angle)) * width) / 2;
    const left = body.x - halfX;
    if (!body.wreck && frontX <= left) return false;
    const started = !body.wreck;
    if (started) {
      body.wreck = { progress: 0, age: 0, splatAge: -1 };
    }
    const wreck = body.wreck;
    wreck.age += dt;
    if (wreck.splatAge >= 0) wreck.splatAge += dt;
    wreck.progress = Math.max(wreck.progress, clamp((frontX - left) / (halfX * 2), 0, 1));
    if (wreck.progress >= .3 && wreck.splatAge < 0) {
      wreck.splatAge = 0;
      emitCrushDust(body, length, width);
      const player = body === game.car;
      playCrushSplat(player ? 1 : .55);
      if (player) {
        game.tank.pressAge = 0;
        game.tank.impactPause = .06;
        game.flash = .45;
        feedback("medium");
      }
    }
    return started;
  }

  function emitCrushDust(body, length, width) {
    const scale = game.layout.scale;
    const fx = Math.cos(body.angle), fy = Math.sin(body.angle);
    for (let i = 0; i < 6; i += 1) {
      const along = (Math.random() - 0.5) * length * 0.9;
      const across = (i % 2 ? 1 : -1) * width * 0.4;
      const life = 0.35 + Math.random() * 0.3;
      game.particles.push({ kind: "smoke", x: body.x + fx * along - fy * across,
        y: body.y + fy * along + fx * across,
        vx: (Math.random() - 0.5) * 30 * scale, vy: (Math.random() - 0.5) * 30 * scale,
        size: (4 + Math.random() * 3) * scale, growth: 14 * scale,
        color: i % 3 ? "#d7cdb5" : "#8b8b7e", life: life, maxLife: life });
    }
  }

  function updateTank(dt, now) {
    const tank = game.tank;
    const size = getTankSize();
    if (tank.pressAge >= 0) tank.pressAge += dt;
    const travelTime = Math.max(0, dt - (tank.impactPause || 0));
    tank.impactPause = Math.max(0, (tank.impactPause || 0) - dt);
    tank.x += W * 0.34 * travelTime;
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
      feedback("medium");
    }

    game.layout.parkedCars.forEach(function (parked) {
      advanceCrushing(parked, parked.length || game.layout.carLength, parked.width || game.layout.carWidth,
        frontX, dt);
    });

    if (advanceCrushing(game.car, game.layout.carLength, game.layout.carWidth, frontX, dt)) {
      tank.crushedCar = true;
      game.car.destroyed = true;
      game.contactFx.life = 0;
    }

    if (tank.x - size * 0.56 > W) {
      gameEl.classList.remove("is-shaking");
      game.state = "failed";
      setTankRumble(false);
      // Let the flattened wreck settle in view before showing the result card.
      window.setTimeout(() => showResult(false), 700);
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
      if (run.almostIn) return { title: "差一个刹车的事", quip: "车都进框了，就差停稳。再来一次，提前收脚。" };
      if (run.hits >= 4) return { title: "碰碰车持证选手", quip: `撞了 ${run.hits} 次，你考的是拆迁资格证吧。` };
      if (run.scrapes >= 4) return { title: "贴地飞行员", quip: `剐蹭 ${run.scrapes} 次，补漆钱比学费贵。` };
      if (run.hits === 0 && run.scrapes === 0) return { title: "过分谨慎型学员", quip: "一下都没撞，就是也没停进去。" };
      return { title: "方向盘说它尽力了", quip: "时间到了，车位还空着。再练一把，这次慢打早回。" };
    }
    const level = run.levelId ? LEVELS[run.levelId - 1] : DIFFICULTIES[run.difficulty];
    const ratio = run.netTime / (run.timeLimit || level.time);
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
    const level = run.levelId ? LEVELS[run.levelId - 1] : DIFFICULTIES[run.difficulty];
    const ratio = run.netTime / (run.timeLimit || level.time);
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
    clearSceneView();
    const mode = MODES[game.mode];
    const level = currentRules();
    const netTime = game.elapsed;
    const stars = success ? rateRun(netTime, game.hits, game.scrapes, level.starTime) : 0;
    const previous = recordFor(game.mode, game.difficulty);
    const previousBest = previous ? previous.bestTime : null;
    const run = {
      levelId: currentLevel() ? game.levelId : null,
      vehicle: game.vehicle,
      mode: game.mode,
      difficulty: game.difficulty,
      timeLimit: level.time,
      bonusTime: game.bonusTime,
      countPlay: !game.resultRecorded,
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
    game.resultRecorded = true;
    run.improved = improved;
    run.previousBest = previousBest;
    const verdict = runVerdict(run);
    run.title = verdict.title;
    run.quip = verdict.quip;
    run.beat = 0;
    game.lastRun = run;

    resultCard.classList.toggle("is-fail", !success);
    resultStarRule.textContent = `三星：零撞击、零剐蹭且 ${Number(level.starTime.toFixed(1))} 秒内`;
    resultStarRule.hidden = !success;
    resultKicker.textContent = challengeLabel(run) + (success ? " · 通关" : " · 考核不通过") + (run.bonusTime ? " · 使用续时 +" + run.bonusTime + " 秒" : "");
    resultTitle.textContent = run.title;
    resultCopy.textContent = `教练点评：${run.quip}`;
    resultBeat.textContent = success
      ? `估算击败了全国 ${run.beat}% 的学员`
      : `据不完全统计，${run.beat}% 的学员也倒在这一关`;
    resultBeat.hidden = true;
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

    const mission = currentLevel();
    const graduated = success && mission && allCleared();
    const next = success && mission ? nextPlayableLevel(game.levelId) : success && !mission ? nextChallenge(game.mode, game.difficulty) : null;
    nextLevel.hidden = !next && !graduated;
    graduation.hidden = !graduated;
    if (graduated) {
      graduationTitle.textContent = totalBestStars() === 48 ? "全关三星 · 库神" : "16 关全通！";
      graduationCopy.textContent = "16 / 16 通关 · " + totalBestStars() + " / 48 星";
    }
    restartButton.classList.toggle("is-secondary", Boolean(next || graduated));
    restartButtonLabel.textContent = mission ? "原场地再挑战" : "换张随机场地再来";
    if (mission && (next || graduated)) {
      nextLevelTitle.textContent = next ? String(next.id).padStart(2, "0") + " " + next.title : "随机自由挑战";
      nextLevelCopy.textContent = next ? VEHICLES[next.vehicle].label + " · " + next.time + " 秒 · " + next.hint : "三种车辆随便选，继续刷新个人纪录";
      nextDifficultyButton.querySelector("span").textContent = next ? "挑战下一关" : "去自由挑战";
    } else if (next) {
      nextLevelTitle.textContent = MODES[next.mode].label + " · " + DIFFICULTIES[next.difficulty].label;
      const timeFactor = game.vehicle === "truck" ? 1.8 : game.vehicle === "van" ? 1.35 : 1;
      nextLevelCopy.textContent = "随机新场地 · " + Math.round(DIFFICULTIES[next.difficulty].time * timeFactor) + " 秒";
      nextDifficultyButton.dataset.mode = next.mode; nextDifficultyButton.dataset.difficulty = next.difficulty;
      nextDifficultyButton.querySelector("span").textContent = "继续挑战";
    }
    resetShareActions();
    renderGrowthActions();
    hideToast();
    resultOverlay.classList.add("is-visible");
  }

  /* ---------------- 分享 ---------------- */

  function shareSummaryText() {
    const run = game.lastRun;
    if (!run) return "";
    const mode = MODES[run.mode].label;
    const level = run.levelId ? LEVELS[run.levelId - 1] : DIFFICULTIES[run.difficulty];
    const head = "《会停车吗你》" + challengeLabel(run);
    if (!run.success) {
      return `${head}：${(run.timeLimit || level.time) + (run.bonusTime || 0)} 秒未完成停车，考核不通过，获封「${run.title}」。换你来，能一把停好吗？`;
    }
    const stars = "★".repeat(run.stars) + "☆".repeat(3 - run.stars);
    return `${head}：${run.netTime.toFixed(1)} 秒入库${run.bonusTime ? "（使用续时 +" + run.bonusTime + " 秒）" : ""}，${stars}，获封「${run.title}」。你能更快吗？`;
  }

  function clipChars(text, max) {
    return String(text || "").slice(0, max);
  }

  function shareNoteTitle(run) {
    if (run.title) return clipChars(`${run.title}｜会停车吗你`, 20);
    const mode = MODES[run.mode].label;
    const level = DIFFICULTIES[run.difficulty].label;
    return clipChars(`${challengeLabel(run)}${run.success ? "停进去了" : "考核不通过"}`, 20);
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

  function callMiniTool(name, options) {
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
    shareXhsLabel.textContent = busy && pendingLabel === "xhs" ? "正在发布…" : "分享战绩";
    [restartButton, nextDifficultyButton, changeDifficultyButton, resultCloseButton].forEach(function (button) { button.disabled = busy; });
    renderGrowthActions();
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

  function shareSceneFrame(width, height) {
    if (!game.layout || !(width > 0 && height > 0)) return null;
    const layout = game.layout, bounds = layout.bounds, pad = 12 * layout.scale;
    let left = bounds.left - pad, right = bounds.right + pad;
    let top = bounds.top - pad, bottom = bounds.bottom + pad;
    if (game.car.destroyed && game.failureFx) {
      const footprint = assessmentFootprint();
      left = Math.min(left, game.car.x - footprint.extentX / 2 - pad);
      right = Math.max(right, game.car.x + footprint.extentX / 2 + pad);
      top = Math.min(top, game.car.y - footprint.extentY / 2 - pad);
      bottom = Math.max(bottom, game.car.y + footprint.extentY / 2 + pad);
    }
    const paintScale = Math.min(width / (right - left), height / (bottom - top)) * 2;
    const sourceWidth = Math.ceil((right - left) * paintScale);
    const sourceHeight = Math.ceil((bottom - top) * paintScale);
    const fit = Math.min(width / sourceWidth, height / sourceHeight);
    return {left:left, top:top, right:right, bottom:bottom, paintScale:paintScale,
      sourceWidth:sourceWidth, sourceHeight:sourceHeight,
      drawWidth:sourceWidth * fit, drawHeight:sourceHeight * fit};
  }

  function blitPlayfield(g, x, y, width, height) {
    const frame = shareSceneFrame(width, height);
    if (!frame) return false;
    const bitmap = document.createElement("canvas");
    bitmap.width = frame.sourceWidth; bitmap.height = frame.sourceHeight;
    const exportCtx = bitmap.getContext("2d");
    if (!exportCtx) return false;
    exportCtx.fillStyle = "#f5f1df"; exportCtx.fillRect(0, 0, bitmap.width, bitmap.height);
    exportCtx.setTransform(frame.paintScale, 0, 0, frame.paintScale,
      -frame.left * frame.paintScale, -frame.top * frame.paintScale);
    const liveCtx = ctx;
    try {
      ctx = exportCtx;
      // Keep the result pose and failure verdict; omit the live camera zoom.
      draw({share:true});
    } finally {
      ctx = liveCtx;
    }
    g.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height,
      x + (width - frame.drawWidth) / 2, y + (height - frame.drawHeight) / 2,
      frame.drawWidth, frame.drawHeight);
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

    const level = run.levelId ? LEVELS[run.levelId - 1] : DIFFICULTIES[run.difficulty];
    const sceneX = 36;
    const sceneY = 36;
    const sceneW = width - 72;
    const sceneH = run.success ? 420 : 476;
    function fitLine(text, left, baseline, size, maxWidth, weight) {
      do {
        g.font = weight + " " + size + "px 'PingFang SC', 'Microsoft YaHei', sans-serif";
        if (g.measureText(text).width <= maxWidth || size <= 16) break;
        size -= 1;
      } while (size >= 16);
      g.fillText(text, left, baseline);
    }

    g.fillStyle = "#f5f1df";
    g.fillRect(0, 0, width, height);
    g.strokeStyle = "#171815";
    g.lineWidth = 14;
    g.strokeRect(7, 7, width - 14, height - 14);

    // Redraw the full lot at export resolution without the live camera crop.
    blitPlayfield(g, sceneX, sceneY, sceneW, sceneH);
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

    const badge = challengeLabel(run) + (run.levelId ? " · " + VEHICLES[run.vehicle || "car"].label : "");
    g.fillStyle = run.success ? "#9ee0b0" : "#f05b32";
    g.fillRect(sceneX + 308, sceneY + sceneH + 22, sceneW - 308, 52);
    g.fillStyle = "#171815";
    g.font = "900 22px 'PingFang SC', sans-serif";
    fitLine(badge, sceneX + 322, sceneY + sceneH + 49, 22, sceneW - 336, 900);

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
      fitLine(`教练点评：${run.quip}`, sceneX, cursorY + 46, 22, sceneW, 800);
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
          ["净用时" + (run.bonusTime ? ` · 续时 +${run.bonusTime} 秒` : ""), `${run.netTime.toFixed(1)} 秒`],
          ["撞击 / 剐蹭", `${run.hits} / ${run.scrapes}`],
        ]
      : [
          ["限时" + (run.bonusTime ? ` · 续时 +${run.bonusTime} 秒` : ""), `${(run.timeLimit || level.time) + (run.bonusTime || 0)} 秒`],
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
    if (!growthReady) { showToast("正在读取今日续时状态，请稍后重试", 2); return; }
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
        pageType: "photo_publish",
        content: shareNoteBody(),
        mediaInfo: {
          image_resources: [{ url }],
        },
      });
      await earnDailyRescue();
      showToast(dailyGrowth().used ? "已提交笔记发布" : "已提交笔记发布 · 今日续时已备好", 2);
    } catch (_) {
      showToast("未完成发布，续时机会未扣除，可重试", 2);
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
      } else if (particle.kind === "spark") {
        particle.vx *= Math.exp(-8 * dt);
        particle.vy *= Math.exp(-8 * dt);
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

  let trainingPaperPattern = null;

  function assessmentPose(age, reducedMotion) {
    const elapsed = Math.max(0, age - ASSESSMENT_IMPACT);
    const landed = age >= ASSESSMENT_IMPACT;
    if (reducedMotion) return { toolAlpha: 0, lift: 0, angle: 0, shake: 0,
      bodyX: 1, bodyY: 1, pancakeX: 1, pancakeY: 1,
      sealAlpha: landed ? 1 : 0, sealScale: 1, dust: 0, impact: 0, impactSpread: 1, toolX: 1, toolY: 1 };
    const fall = clamp((age - .18) / .40, 0, 1);
    const raise = clamp((age - 1.20) / .84, 0, 1);
    const spread = clamp(elapsed / .20, 0, 1);
    const smoothSpread = spread * spread * (3 - 2 * spread);
    const released = Math.max(0, age - 1.54);
    const bounce = age > 1.54 ? Math.sin(released * 24) * Math.exp(-released * 7) * .055 : 0;
    return {
      toolAlpha: clamp(age / .12, 0, 1) * (1 - clamp((raise - .74) / .26, 0, 1)),
      lift: 200 * (1 - Math.pow(fall, 3)) + 300 * Math.pow(raise, 1.6),
      angle: landed ? Math.sin(elapsed * 24) * .006 * Math.exp(-elapsed * 12) : -.025 * (1 - fall),
      // Cast iron stays rigid while the vehicle spreads beneath it.
      toolX: 1, toolY: 1,
      bodyX: 1, bodyY: 1,
      pancakeX: .80 + smoothSpread * .20 - bounce,
      pancakeY: .35 + smoothSpread * .65 + bounce,
      shake: landed && elapsed < .38 ? Math.sin(elapsed * 95) * 9 * Math.exp(-elapsed * 10) : 0,
      sealAlpha: clamp((age - ASSESSMENT_VERDICT_START) / .18, 0, 1),
      sealScale: 1 + Math.max(0, 1 - (age - ASSESSMENT_VERDICT_START) / ASSESSMENT_VERDICT_SETTLE) * .10,
      impact: landed ? Math.max(0, 1 - elapsed / .38) : 0,
      impactSpread: 1 + Math.min(1, elapsed / .38) * .55,
      dust: landed && elapsed < .85 ? Math.sin(Math.min(1, elapsed / .07) * Math.PI / 2) * (1 - elapsed / .85) : 0,
    };
  }

  function assessmentFootprint() {
    const art = ASSESSMENT_ART[game.vehicle] || ASSESSMENT_ART.car;
    const length = game.layout.carLength * 1.28;
    const width = length * art.ratio;
    const cos = Math.abs(Math.cos(game.car.angle)), sin = Math.abs(Math.sin(game.car.angle));
    return { length: length, width: width,
      extentX: cos * length + sin * width, extentY: sin * length + cos * width };
  }

  function drawAssessmentPancake(forShare) {
    const car = game.car, layout = game.layout;
    const pose = assessmentPose(game.failureFx.age, markerMotionPreference && markerMotionPreference.matches);
    const art = ASSESSMENT_ART[game.vehicle] || ASSESSMENT_ART.car;
    const footprint = assessmentFootprint();
    ctx.save();
    if (!forShare) {
      ctx.beginPath(); ctx.rect(0, layout.playTop, W, layout.controlTop - layout.playTop); ctx.clip();
    }
    ctx.translate(car.x, car.y); ctx.rotate(car.angle);
    ctx.scale(pose.pancakeX, pose.pancakeY);
    ctx.fillStyle = "rgba(23,24,21,.18)";
    ctx.beginPath(); ctx.ellipse(0, layout.carWidth * .12, footprint.length * .51, footprint.width * .45, 0, 0, Math.PI * 2); ctx.fill();
    if (art.image && art.image.complete && art.image.naturalWidth > 0) {
      // Uniform scaling preserves the approved folded body and face-up tire discs.
      const height = footprint.length * art.image.naturalHeight / art.image.naturalWidth;
      ctx.drawImage(art.image, -footprint.length / 2, -height / 2, footprint.length, height);
    } else {
      // Keep the player's actual paint/cargo visible if an effect image is unavailable.
      ctx.save(); ctx.scale(1.2, .6);
      drawCar(0, 0, 0, VEHICLES[game.vehicle].color, "", game.vehicle, layout.carLength, layout.carWidth);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawAssessmentWeight(pose) {
    const car = game.car, layout = game.layout;
    const scale = clamp(layout.scale, .6, 1.35);
    const footprint = assessmentFootprint();
    const depth = Math.max(52 * scale, footprint.extentY + 14 * scale);
    const width = Math.max(112 * scale, footprint.extentX + 28 * scale, depth * 1.5);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, layout.playTop, W, layout.controlTop - layout.playTop); ctx.clip();
    if (pose.impact > 0) {
      ctx.save(); ctx.translate(car.x, car.y); ctx.globalAlpha = pose.impact;
      ctx.strokeStyle = "#f3df42"; ctx.lineWidth = 5 * scale;
      ctx.beginPath(); ctx.ellipse(0, 0, width * .64 * pose.impactSpread, depth * .72 * pose.impactSpread, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "#171815"; ctx.lineWidth = 2 * scale;
      for (let i = 0; i < 12; i += 1) {
        const angle = i * Math.PI / 6;
        const x = Math.cos(angle) * width * .65 * pose.impactSpread;
        const y = Math.sin(angle) * depth * .72 * pose.impactSpread;
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * 16 * scale, y + Math.sin(angle) * 12 * scale); ctx.stroke();
      }
      ctx.restore();
    }
    if (pose.dust > 0) {
      ctx.save(); ctx.fillStyle = "#f5e1b1"; ctx.globalAlpha = pose.dust * .9;
      const spread = 1 + (1 - pose.dust) * .3;
      for (let i = 0; i < 8; i += 1) {
        const angle = i * Math.PI / 4;
        ctx.beginPath(); ctx.ellipse(car.x + Math.cos(angle) * width * .55 * spread, car.y + Math.sin(angle) * depth * .60 * spread,
          18 * scale, 11 * scale, angle, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    const art = ASSESSMENT_ART.weight;
    if (pose.toolAlpha > 0 && art.image && art.image.complete && art.image.naturalWidth > 0) {
      const shadow = 1 - clamp(pose.lift / 300, 0, 1);
      ctx.globalAlpha = pose.toolAlpha * (.08 + shadow * .23);
      ctx.fillStyle = "#171815"; ctx.beginPath();
      ctx.ellipse(car.x, car.y + 5 * scale, width * (.4 + shadow * .12), depth * .52, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = pose.toolAlpha;
      ctx.translate(car.x, car.y + depth * .55 + 12 * scale - pose.lift * scale);
      ctx.rotate(pose.angle);
      const height = width * art.image.naturalHeight / art.image.naturalWidth;
      ctx.drawImage(art.image, -width / 2, -height, width, height);
    }
    ctx.restore();
  }

  function drawAssessmentStamp() {
    if (!game.failureFx || (game.state !== "assessment" && game.state !== "failed")) return;
    const layout = game.layout, b = layout.bounds, car = game.car;
    const pose = assessmentPose(game.failureFx.age, markerMotionPreference && markerMotionPreference.matches);
    drawAssessmentWeight(pose);
    if (pose.sealAlpha <= 0) return;
    const width = Math.min(218, (b.right - b.left) * .63), height = width * .34;
    const halfCarY = assessmentFootprint().extentY / 2;
    const gap = halfCarY + height / 2 + 26 * layout.scale;
    const above = car.y - gap - height * .65 >= b.top + 5;
    const y = clamp(car.y + (above ? -gap : gap), b.top + height * .65, b.bottom - height * .65);
    const x = clamp(car.x, b.left + width * .55, b.right - width * .55);
    ctx.save(); ctx.globalAlpha = pose.sealAlpha;
    ctx.translate(x, y); ctx.rotate(-.08); ctx.scale(pose.sealScale, pose.sealScale);
    ctx.fillStyle = "rgba(245,241,223,.94)"; ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.strokeStyle = "#c83d32"; ctx.lineWidth = 3;
    ctx.strokeRect(-width / 2, -height / 2, width, height);
    ctx.lineWidth = 1; ctx.strokeRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8);
    ctx.fillStyle = "#c83d32";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "900 " + width * .156 + "px 'PingFang SC', 'Microsoft YaHei', sans-serif";
    ctx.fillText("考核不通过", 0, -height * .09, width * .87);
    ctx.font = "800 " + width * .067 + "px 'PingFang SC', sans-serif";
    ctx.fillText("这下，真·平了。", 0, height * .29);
    ctx.restore();
  }

  function draw(options) {
    const forShare = Boolean(options && options.share);
    ctx.clearRect(0, 0, W, H);
    const stampShake = !forShare && game.state === "assessment" && game.failureFx
      ? assessmentPose(game.failureFx.age, markerMotionPreference && markerMotionPreference.matches).shake : 0;
    ctx.save();
    ctx.translate(stampShake, -stampShake * .5);
    // 停进去之后镜头缓缓推向车位，给成功时刻一个值得截图的特写
    const zoomT = !forShare && game.state === "success" ? game.successFx : 0;
    const zoom = zoomT > 0 ? 1 + 0.18 * (1 - Math.pow(1 - zoomT, 3)) : 1;
    if (zoom > 1) {
      const focus = game.layout.target;
      ctx.save();
      ctx.translate(focus.cx, focus.cy);
      ctx.scale(zoom, zoom);
      ctx.translate(-focus.cx, -focus.cy);
    }
    drawScene();
    drawSkids();
    drawParkingTarget();
    drawSmokeParticles();
    drawParkedCars();
    if (game.state === "playing" && game.difficulty !== "hell" && !game.car.destroyed) {
      drawTrajectoryPrediction();
    }
    if (!game.car.destroyed) {
      const fx = game.contactFx;
      const progress = 1 - fx.life / fx.duration;
      const wobble = fx.life > 0 ? Math.sin(progress * Math.PI * (fx.scrape ? 8 : 3)) * Math.pow(1 - progress, 1.5) * fx.strength : 0;
      // Scrapes shake only the artwork; the driving pose and collider stay stable.
      const shake = fx.scrape ? wobble * 1.3 * game.layout.scale : 0;
      ctx.save();
      ctx.translate(game.car.x + fx.nx * shake, game.car.y + fx.ny * shake);
      ctx.rotate(wobble * (fx.scrape ? 0.025 : 0.035));
      ctx.scale(1 - Math.abs(wobble) * (fx.scrape ? 0.01 : 0.035), 1 + Math.abs(wobble) * (fx.scrape ? 0.005 : 0.02));
      if (game.state === "assessment" && game.failureFx) {
        const pose = assessmentPose(game.failureFx.age, markerMotionPreference && markerMotionPreference.matches);
        ctx.rotate(game.car.angle); ctx.scale(pose.bodyX, pose.bodyY); ctx.rotate(-game.car.angle);
      }
      drawCar(0, 0, game.car.angle, VEHICLES[game.vehicle].color, "", game.vehicle);
      ctx.restore();
      drawPlayerMarker();
    } else if (game.failureFx && game.failureFx.impacted) drawAssessmentPancake(forShare);
    else drawCrushedCar(game.car, game.layout.carLength, game.layout.carWidth, VEHICLES[game.vehicle].color, game.vehicle);
    drawStabilityRing();
    if (game.state === "tank" || (game.state === "failed" && game.car.destroyed && !game.failureFx)) drawTank();
    drawContactFx();
    drawParticles();
    if (zoom > 1) ctx.restore();
    ctx.restore();
    if (!forShare && game.flash > 0) {
      ctx.save();
      ctx.globalAlpha = game.flash * 0.38;
      ctx.fillStyle = "#fff4b0";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (!forShare || game.state === "failed") drawAssessmentStamp();
  }

  function updatePlayerMarker(dt) {
    const hint = game.playerMarker;
    if (input.gas || input.brake || Math.abs(game.car.speed) > .1 * game.layout.scale) {
      hint.introLeft = 0;
      hint.idleTime = 0;
      hint.bobTime = 0;
      return;
    }
    hint.introLeft = Math.max(0, hint.introLeft - dt);
    hint.idleTime = Math.min(PLAYER_MARKER_DELAY, hint.idleTime + dt);
    hint.bobTime = shouldShowPlayerMarker() ? (hint.bobTime + dt) % 3.6 : 0;
  }

  function playerMarkerLift(reducedMotion) {
    if (reducedMotion) return 0;
    const phase = game.playerMarker.bobTime;
    if (phase < 2 || phase > 2.8) return 0;
    const wave = Math.sin((phase - 2) / .8 * Math.PI);
    return 3 * clamp(game.layout.scale, .75, 1.3) * wave * wave;
  }

  function shouldShowPlayerMarker() {
    return game.state === "playing" && !game.car.destroyed
      && (game.playerMarker.introLeft > 0 || game.playerMarker.idleTime >= PLAYER_MARKER_DELAY);
  }

  function drawPlayerMarker() {
    if (!shouldShowPlayerMarker()) return;
    const car = game.car;
    const layout = game.layout;
    const scale = clamp(layout.scale, .75, 1.3);
    const size = 5 * scale;
    // Include mirrors and tires, keeping the marker outside the rotated vehicle.
    const halfHeight = (Math.abs(Math.sin(car.angle)) * layout.carLength * 1.03
      + Math.abs(Math.cos(car.angle)) * layout.carWidth * 1.3) / 2;
    const gap = 5 * scale;
    const above = car.y - halfHeight - gap - size * 2 >= layout.bounds.top + 2;
    const lift = playerMarkerLift(markerMotionPreference && markerMotionPreference.matches);
    const baseY = car.y + (above ? -1 : 1) * (halfHeight + gap);
    // Lift away from the car, with enough clearance for the full arrow at edges.
    const tipY = above ? Math.max(layout.bounds.top + size * 2 + 2, baseY - lift)
      : Math.min(layout.bounds.bottom - size * 2 - 2, baseY + lift);
    const x = clamp(car.x, layout.bounds.left + size + 2, layout.bounds.right - size - 2);
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.translate(x, tipY);
    // Stay upright in screen space; flip below the car when the upper edge is tight.
    ctx.scale(1, above ? 1 : -1);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size * 1.15);
    ctx.lineTo(-size * .38, -size * 1.15);
    ctx.lineTo(-size * .38, -size * 2);
    ctx.lineTo(size * .38, -size * 2);
    ctx.lineTo(size * .38, -size * 1.15);
    ctx.lineTo(size, -size * 1.15);
    ctx.closePath();
    ctx.fillStyle = "#f58d72";
    ctx.strokeStyle = "#171815";
    ctx.lineWidth = Math.max(1, 1.2 * scale);
    ctx.lineJoin = "round";
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawTrajectoryPrediction() {
    const { car } = game;
    const { carLength, carWidth, controlTop, playTop } = game.layout;
    const direction = game.driveDirection;
    const vehicle = VEHICLES[game.vehicle];
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
      const pose = CHALLENGES.advance({ x: x, y: y, angle: angle }, signedStep, game.actualSteer, vehicle, game.layout.scale);
      x = pose.x; y = pose.y; angle = pose.angle;
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
    ctx.strokeStyle = "rgba(23, 24, 21, 0.12)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.strokeStyle = "rgba(245, 241, 223, 0.38)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawScene() {
    const layout = game.layout, b = layout.bounds, scale = layout.scale;
    drawTrainingSurface();
    drawParkingBays();
    drawTrainingStart();
    ctx.save();
    ctx.fillStyle = "#171815";
    ctx.font = "900 " + (9 * scale) + "px PingFang SC,sans-serif";
    ctx.textAlign = "left";
    const exercise = layout.kind === "dock" || layout.kind === "final" ? "模拟装卸" : game.mode === "parallel" ? "侧方停车" : "倒车入库";
    const topClear = layout.decorBays.every(function (bay) { return bay.cy - bay.hy > b.top + 28 * scale; })
      && layout.obstacles.every(function (item) { return item.y - item.h / 2 > b.top + 28 * scale; });
    if (topClear) {
      ctx.fillRect(b.left + 12 * scale, b.top + 9 * scale, 88 * scale, 17 * scale);
      ctx.fillStyle = "#f5f1df";
      ctx.fillRect(b.left + 10 * scale, b.top + 7 * scale, 88 * scale, 17 * scale);
      ctx.strokeStyle = "#171815"; ctx.lineWidth = 1.5 * scale;
      ctx.strokeRect(b.left + 10 * scale, b.top + 7 * scale, 88 * scale, 17 * scale);
      ctx.fillStyle = "#171815";
      ctx.fillText(exercise + "训练区", b.left + 13 * scale, b.top + 18 * scale);
      ctx.textAlign = "right";
      ctx.font = "700 " + (10 * scale) + "px Arial,sans-serif";
      ctx.fillText("NO. " + (currentLevel() ? String(currentLevel().id).padStart(2, "0") : "FREE"), b.right - 13 * scale, b.top + 18 * scale);
    }
    ctx.textAlign = "left";
    ctx.font = "800 " + (9 * scale) + "px PingFang SC,sans-serif";
    ctx.fillStyle = "#263f37";
    ctx.fillText((topClear ? "低速练习" : exercise + "训练区") + " · " + VEHICLES[game.vehicle].label, b.left + 13 * scale, b.bottom - 12 * scale);
    ctx.restore();
    if (layout.checkpoint) drawZone(layout.checkpoint, "检查区", game.stage === "checkpoint");
    if (layout.exitTarget && game.stage !== "exit") drawZone(layout.exitTarget, "出口", true);
    drawBrickWallGroups(layout);
    for (const item of layout.obstacles) {
      if (item.type === "cone") { drawCone(item.x, item.y, scale * 0.7); continue; }
      ctx.save(); ctx.translate(item.x, item.y);
      if (item.type === "garden") {
        drawFlowerbed(item.w, item.h, scale);
        ctx.restore();
        continue;
      }
      if (item.type === "wall" || item.type === "dock") {
        ctx.restore();
        continue;
      }
      ctx.fillStyle = "#171815";
      ctx.fillRect(-item.w / 2 + 3 * scale, -item.h / 2 + 4 * scale, item.w, item.h);
      ctx.fillStyle = "#f05b32";
      ctx.strokeStyle = "#171815"; ctx.lineWidth = 2.5 * scale;
      ctx.fillRect(-item.w / 2, -item.h / 2, item.w, item.h); ctx.strokeRect(-item.w / 2, -item.h / 2, item.w, item.h);
      // Standalone training pillars retain their high-visibility paint.
      ctx.save();
      ctx.beginPath(); ctx.rect(-item.w / 2, -item.h / 2, item.w, item.h); ctx.clip();
      ctx.strokeStyle = "#171815"; ctx.lineWidth = 5 * scale;
      const vertical = item.h > item.w;
      const run = vertical ? item.h : item.w;
      for (let p = -run / 2; p < run / 2; p += 19 * scale) {
        ctx.beginPath();
        if (vertical) { ctx.moveTo(-item.w / 2, p); ctx.lineTo(item.w / 2, p + 10 * scale); }
        else { ctx.moveTo(p, -item.h / 2); ctx.lineTo(p + 10 * scale, item.h / 2); }
        ctx.stroke();
      }
      ctx.restore();
      if (item.type === "pillar") {
        ctx.fillStyle = "#f3df42";
        ctx.fillRect(-item.w * .3, -item.h * .3, item.w * .6, item.h * .6);
      }
      ctx.restore();
    }
  }

  function buildBrickWallGroups(obstacles, scale) {
    const pending = obstacles.filter(function (item) { return item.type === "wall" || item.type === "dock"; });
    const groups = [], epsilon = scale * .001;
    while (pending.length) {
      const walls = [pending.shift()];
      for (let i = 0; i < walls.length; i += 1) {
        for (let j = pending.length - 1; j >= 0; j -= 1) {
          const a = walls[i], b = pending[j];
          const overlapX = (a.w + b.w) / 2 - Math.abs(a.x - b.x);
          const overlapY = (a.h + b.h) / 2 - Math.abs(a.y - b.y);
          if (overlapX >= -epsilon && overlapY >= -epsilon
            && (overlapX > epsilon || overlapY > epsilon)) walls.push(pending.splice(j, 1)[0]);
        }
      }
      if (walls.length === 1) { groups.push({ walls: walls, loops: [] }); continue; }
      // Trace the union of touching rectangles, omitting every internal edge.
      const xs = [], ys = [];
      walls.forEach(function (wall) { xs.push(wall.x - wall.w / 2, wall.x + wall.w / 2); ys.push(wall.y - wall.h / 2, wall.y + wall.h / 2); });
      function coordinates(values) {
        return values.sort(function (a, b) { return a - b; }).filter(function (value, i, sorted) { return !i || value - sorted[i - 1] > epsilon; });
      }
      const x = coordinates(xs), y = coordinates(ys), cells = [];
      for (let row = 0; row < y.length - 1; row += 1) {
        cells[row] = [];
        for (let col = 0; col < x.length - 1; col += 1) {
          const cx = (x[col] + x[col + 1]) / 2, cy = (y[row] + y[row + 1]) / 2;
          cells[row][col] = walls.some(function (wall) { return Math.abs(cx - wall.x) < wall.w / 2 + epsilon && Math.abs(cy - wall.y) < wall.h / 2 + epsilon; });
        }
      }
      const edges = new Map();
      function edge(ax, ay, bx, by) { edges.set(ax + "," + ay, { x: ax, y: ay, nextX: bx, nextY: by }); }
      function filled(col, row) { return !!(cells[row] && cells[row][col]); }
      cells.forEach(function (row, iy) { row.forEach(function (inside, ix) {
        if (!inside) return;
        if (!filled(ix, iy - 1)) edge(ix, iy, ix + 1, iy);
        if (!filled(ix + 1, iy)) edge(ix + 1, iy, ix + 1, iy + 1);
        if (!filled(ix, iy + 1)) edge(ix + 1, iy + 1, ix, iy + 1);
        if (!filled(ix - 1, iy)) edge(ix, iy + 1, ix, iy);
      }); });
      const loops = [];
      while (edges.size) {
        let key = edges.keys().next().value;
        const loop = [];
        while (edges.has(key)) {
          const segment = edges.get(key); edges.delete(key);
          loop.push({ x: x[segment.x], y: y[segment.y] });
          key = segment.nextX + "," + segment.nextY;
        }
        loops.push(loop);
      }
      groups.push({ walls: walls, loops: loops });
    }
    return groups;
  }

  function drawBrickWallGroups(layout) {
    const scale = layout.scale;
    // Layout geometry is fixed until reset/resize, so trace connected walls once.
    if (!layout.brickWallGroups) layout.brickWallGroups = buildBrickWallGroups(layout.obstacles, scale);
    layout.brickWallGroups.forEach(function (group) {
      if (group.walls.length === 1) {
        const wall = group.walls[0];
        ctx.save(); ctx.translate(wall.x, wall.y); drawBrickWall(wall.w, wall.h, scale); ctx.restore();
        return;
      }
      function outline() {
        ctx.beginPath();
        group.loops.forEach(function (loop) {
          ctx.moveTo(loop[0].x, loop[0].y);
          for (let i = 1; i < loop.length; i += 1) ctx.lineTo(loop[i].x, loop[i].y);
          ctx.closePath();
        });
      }
      ctx.save(); ctx.translate(3 * scale, 4 * scale); outline(); ctx.fillStyle = "#171815"; ctx.fill(); ctx.restore();
      group.walls.forEach(function (wall) {
        ctx.save(); ctx.translate(wall.x, wall.y); drawBrickWall(wall.w, wall.h, scale, true); ctx.restore();
      });
      // Bond the two brick courses around each elbow instead of overlapping textures.
      if (!group.corners) group.corners = buildBrickWallCorners(group.walls, scale);
      ctx.save(); outline(); ctx.clip();
      group.corners.forEach(function (corner) { drawBrickWallCorner(corner, scale); });
      ctx.restore();
      outline(); ctx.strokeStyle = "#171815"; ctx.lineWidth = 2.5 * scale; ctx.lineJoin = "miter"; ctx.stroke();
    });
  }

  function buildBrickWallCorners(walls, scale) {
    const corners = [], brick = 24 * scale;
    walls.filter(function (wall) { return wall.w > wall.h; }).forEach(function (horizontal) {
      walls.filter(function (wall) { return wall.h > wall.w; }).forEach(function (vertical) {
        const direction = horizontal.x > vertical.x ? 1 : -1;
        const x = vertical.x - direction * vertical.w / 2;
        const y = horizontal.y - horizontal.h / 2;
        const horizontalEnd = horizontal.x - direction * horizontal.w / 2;
        if (Math.abs(horizontalEnd - x) > scale
          || vertical.y - vertical.h / 2 > y + horizontal.h
          || vertical.y + vertical.h / 2 < y + horizontal.h + brick / 2) return;
        // End each corner brick on the existing arm's mortar grid.
        const rows = [];
        for (let course = 0; course < 2; course += 1) {
          const horizontalStart = horizontal.x - horizontal.w / 2 - course * brick / 2;
          const verticalRow = direction === 1 ? 1 - course : course;
          const verticalStart = vertical.y - vertical.h / 2 - verticalRow * brick / 2;
          const horizontalDistance = direction * (horizontalStart - x);
          const horizontalRun = horizontalDistance + Math.ceil((vertical.w - horizontalDistance + scale * .01) / brick) * brick;
          const verticalDistance = verticalStart - y;
          const verticalRun = verticalDistance + Math.ceil((horizontal.h - verticalDistance + scale * .01) / brick) * brick;
          rows.push({ horizontal: horizontalRun, vertical: verticalRun });
        }
        corners.push({ x: x, y: y, direction: direction, width: vertical.w, height: horizontal.h, rows: rows });
      });
    });
    return corners;
  }

  function drawBrickWallCorner(corner, scale) {
    ctx.save(); ctx.translate(corner.x, corner.y); ctx.scale(corner.direction, 1);
    const halfWidth = corner.width / 2, halfHeight = corner.height / 2;
    const colors = ["#cd7957", "#dc9068"];
    corner.rows.forEach(function (row, course) {
      const x = course * halfWidth, y = course * halfHeight;
      function brickPath() {
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.lineTo(row.horizontal, y); ctx.lineTo(row.horizontal, y + halfHeight);
        ctx.lineTo(x + halfWidth, y + halfHeight); ctx.lineTo(x + halfWidth, row.vertical);
        ctx.lineTo(x, row.vertical); ctx.closePath();
      }
      brickPath();
      ctx.fillStyle = colors[course]; ctx.fill();
      ctx.strokeStyle = "#efd4ae"; ctx.lineWidth = 1.4 * scale; ctx.lineJoin = "miter";
      ctx.save(); ctx.clip();
      // Split long arms into ordinary-sized bricks, keeping a small bonded elbow.
      if (row.horizontal - x - halfWidth >= 10 * scale) {
        const jointX = (x + halfWidth + row.horizontal) / 2;
        ctx.fillStyle = colors[1 - course];
        ctx.fillRect(jointX, y, row.horizontal - jointX, halfHeight);
        ctx.beginPath(); ctx.moveTo(jointX, y); ctx.lineTo(jointX, y + halfHeight); ctx.stroke();
      }
      if (row.vertical - y - halfHeight >= 10 * scale) {
        const jointY = (y + halfHeight + row.vertical) / 2;
        ctx.fillStyle = "#bd674c";
        ctx.fillRect(x, jointY, halfWidth, row.vertical - jointY);
        ctx.beginPath(); ctx.moveTo(x, jointY); ctx.lineTo(x + halfWidth, jointY); ctx.stroke();
      }
      ctx.restore();
      brickPath(); ctx.stroke();
    });
    ctx.restore();
  }

  function drawBrickWall(width, height, scale, surfaceOnly) {
    const ink = "#171815";
    if (!surfaceOnly) {
      ctx.fillStyle = ink;
      ctx.fillRect(-width / 2 + 3 * scale, -height / 2 + 4 * scale, width, height);
    }
    ctx.save();
    // Keep the masonry courses legible along either wall orientation.
    const vertical = height > width;
    if (vertical) ctx.rotate(Math.PI / 2);
    const length = vertical ? height : width, thickness = vertical ? width : height;
    const left = -length / 2, top = -thickness / 2;
    ctx.beginPath(); ctx.rect(left, top, length, thickness); ctx.clip();
    ctx.fillStyle = "#efd4ae";
    ctx.fillRect(left, top, length, thickness);
    const brickLength = 24 * scale, course = thickness / 2, joint = 1.4 * scale;
    const colors = ["#cd7957", "#dc9068", "#bd674c"];
    for (let row = 0; row < 2; row += 1) {
      const offset = row % 2 ? brickLength / 2 : 0;
      for (let column = -1; column * brickLength - offset < length; column += 1) {
        const x = left + column * brickLength - offset;
        const y = top + row * course;
        ctx.fillStyle = colors[(column + row + colors.length) % colors.length];
        ctx.fillRect(x + joint / 2, y + joint / 2, brickLength - joint, course - joint);
      }
    }
    // A dark lower edge gives the flat brick cap a little visible thickness.
    if (!surfaceOnly) {
      ctx.fillStyle = "#944c39";
      ctx.fillRect(left, top + thickness - 2 * scale, length, 2 * scale);
    }
    ctx.restore();
    if (!surfaceOnly) {
      ctx.strokeStyle = ink; ctx.lineWidth = 2.5 * scale;
      ctx.strokeRect(-width / 2, -height / 2, width, height);
    }
  }

  const FLOWERBED_PLANTS = [[.18, .28, 1, -.22], [.50, .23, .88, .26], [.81, .34, 1.04, -.12],
    [.24, .72, .92, .15], [.58, .68, 1.08, -.25], [.83, .76, .82, .2]];
  const SMALL_FLOWERBED_PLANTS = [[.29, .45, 1, -.2], [.72, .54, .9, .3]];
  const FLOWERBED_FOLIAGE = [[.15, .23, -.3], [.44, .24, .3], [.76, .22, -.2], [.87, .53, .2],
    [.75, .77, -.4], [.43, .76, .3], [.14, .69, -.2], [.51, .49, -.1]];
  const SMALL_FLOWERBED_FOLIAGE = [[.21, .42, -.3], [.5, .28, .2], [.78, .49, -.1], [.5, .77, .3]];

  function drawFlowerbed(width, height, scale) {
    // Soft corners and staggered, varied plants keep the simple bed lively.
    const rim = 5 * scale, left = -width / 2, top = -height / 2;
    const corner = Math.min(10 * scale, height * .2);
    roundedRectPath(left + 3 * scale, top + 4 * scale, width, height, corner);
    ctx.fillStyle = "#171815"; ctx.fill();
    roundedRectPath(left, top, width, height, corner);
    ctx.fillStyle = "#edbd89"; ctx.fill();
    ctx.strokeStyle = "#171815"; ctx.lineWidth = 2.5 * scale; ctx.stroke();
    roundedRectPath(left + rim, top + rim, width - rim * 2, height - rim * 2, corner - rim * .6);
    ctx.fillStyle = "#b09b74"; ctx.fill();
    ctx.strokeStyle = "#171815"; ctx.lineWidth = 1.3 * scale;
    ctx.stroke();
    ctx.save();
    ctx.clip();
    const large = width / scale > 110 && height / scale > 65;
    const plants = large ? FLOWERBED_PLANTS : SMALL_FLOWERBED_PLANTS;
    const foliage = large ? FLOWERBED_FOLIAGE : SMALL_FLOWERBED_FOLIAGE;
    const leafSize = Math.min(14 * scale, height * .24);
    // Pointed leaf pairs and a single midrib stay readable at game size.
    foliage.forEach(function (leaf, index) {
      ctx.save();
      ctx.translate(left + rim + leaf[0] * (width - rim * 2), top + rim + leaf[1] * (height - rim * 2));
      ctx.rotate(leaf[2]);
      ctx.translate(0, leafSize * .55);
      for (let side = 0; side < 2; side += 1) {
        ctx.save();
        ctx.rotate(side ? .85 : -.9);
        const length = leafSize * (side ? 1.9 : 1.75), breadth = leafSize * .64;
        ctx.fillStyle = (index + side) % 2 ? "#8cc878" : "#58a47b";
        ctx.strokeStyle = "#171815"; ctx.lineWidth = 1.3 * scale;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(breadth, -length * .18, breadth * .85, -length * .7, 0, -length);
        ctx.bezierCurveTo(-breadth * .85, -length * .72, -breadth, -length * .22, 0, 0);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.lineWidth = scale;
        ctx.beginPath();
        ctx.moveTo(0, -length * .1);
        ctx.quadraticCurveTo(-breadth * .12, -length * .5, 0, -length * .88);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    });
    const radius = Math.min(10.8 * scale, height * .18);
    const colors = ["#f5aaa7", "#fff0ca", "#f4c264"];
    plants.forEach(function (plant, index) {
      const x = left + rim + plant[0] * (width - rim * 2);
      const y = top + rim + plant[1] * (height - rim * 2);
      ctx.save(); ctx.translate(x, y); ctx.rotate(plant[3]); ctx.scale(plant[2], plant[2]);
      ctx.fillStyle = colors[index % colors.length];
      ctx.strokeStyle = "#171815"; ctx.lineWidth = 1.1 * scale;
      // Rounded daisy petals and a broad center read as flowers at game size.
      const petals = index % 2 ? 8 : 6;
      for (let petal = 0; petal < petals; petal += 1) {
        const angle = petal * Math.PI * 2 / petals - Math.PI / 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(angle) * radius * .57, Math.sin(angle) * radius * .57,
          radius * .43, radius * .29, angle, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = index % colors.length === 2 ? "#9a603b" : "#efbd44";
      ctx.beginPath(); ctx.arc(0, 0, radius * .34, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }

  function drawTrainingSurface() {
    const layout = game.layout, b = layout.bounds, scale = layout.scale;
    const width = b.right - b.left, height = b.bottom - b.top;
    ctx.save();
    // Printed paper surrounds a flat, ink-framed training board.
    ctx.fillStyle = "#f5edcf"; ctx.fillRect(0, 0, W, H);
    // Reuse a tiny print tile rather than rebuilding thousands of dots per frame.
    if (!trainingPaperPattern) {
      const tile = document.createElement("canvas");
      tile.width = 14; tile.height = 14;
      const ink = tile.getContext("2d");
      ink.fillStyle = "rgba(23,24,21,.19)";
      ink.beginPath(); ink.arc(9, 9, .8, 0, Math.PI * 2); ink.fill();
      trainingPaperPattern = ctx.createPattern(tile, "repeat");
    }
    ctx.fillStyle = trainingPaperPattern;
    ctx.fillRect(0, 0, W, layout.controlTop);

    const curb = 6 * scale, unit = 20 * scale;
    const outerX = b.left - curb / 2, outerY = b.top - curb / 2;
    ctx.fillStyle = "#171815";
    ctx.fillRect(outerX + 4 * scale, outerY + 5 * scale, width + curb, height + curb);
    ctx.fillStyle = "#959995"; ctx.fillRect(b.left, b.top, width, height);
    ctx.save();
    ctx.beginPath(); ctx.rect(b.left, b.top, width, height); ctx.clip();
    // A quiet drafting grid keeps the flat color readable behind vehicles.
    ctx.strokeStyle = "rgba(23,24,21,.09)"; ctx.lineWidth = scale;
    ctx.beginPath();
    for (let x = b.left + 32 * scale; x < b.right; x += 32 * scale) { ctx.moveTo(x, b.top); ctx.lineTo(x, b.bottom); }
    for (let y = b.top + 32 * scale; y < b.bottom; y += 32 * scale) { ctx.moveTo(b.left, y); ctx.lineTo(b.right, y); }
    ctx.stroke();
    ctx.restore();
    // Yellow/ink edge blocks mark the same collision boundary as before.
    for (let x = b.left, i = 0; x < b.right; x += unit, i += 1) {
      ctx.fillStyle = i % 2 ? "#171815" : "#f3df42";
      ctx.fillRect(x, outerY, Math.min(unit, b.right - x), curb);
      ctx.fillRect(x, b.bottom - curb / 2, Math.min(unit, b.right - x), curb);
    }
    for (let y = b.top, i = 0; y < b.bottom; y += unit, i += 1) {
      ctx.fillStyle = i % 2 ? "#171815" : "#f3df42";
      ctx.fillRect(outerX, y, curb, Math.min(unit, b.bottom - y));
      ctx.fillRect(b.right - curb / 2, y, curb, Math.min(unit, b.bottom - y));
    }
    ctx.strokeStyle = "#171815"; ctx.lineWidth = 2 * scale;
    ctx.strokeRect(outerX, outerY, width + curb, height + curb);
    ctx.strokeRect(b.left + curb / 2, b.top + curb / 2, width - curb, height - curb);
    ctx.restore();
  }

  function drawTrainingStart() {
    const layout = game.layout, spawn = layout.spawn, b = layout.bounds, scale = layout.scale;
    const back = layout.carLength / 2 + 8 * scale;
    const x = spawn.x - Math.cos(spawn.angle) * back;
    const y = spawn.y - Math.sin(spawn.angle) * back;
    const halfWidth = layout.carWidth * .65;
    const reach = halfWidth + 10 * scale;
    if (x - reach < b.left + 12 * scale || x + reach > b.right - 12 * scale
      || y - reach < b.top + 28 * scale || y + reach > b.bottom - 26 * scale) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(spawn.angle);
    ctx.strokeStyle = "rgba(255,255,255,.64)"; ctx.lineWidth = 2 * scale;
    ctx.beginPath(); ctx.moveTo(0, -halfWidth); ctx.lineTo(0, halfWidth); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = "600 " + (8 * scale) + "px PingFang SC,sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.rotate(-Math.PI / 2); ctx.fillText("起点", 0, -10 * scale);
    ctx.restore();
  }
  function drawParkingBays() {
    const scale = game.layout.scale;
    ctx.save(); ctx.strokeStyle = "#fff9e8"; ctx.lineWidth = 2.5 * scale;
    ctx.lineCap = "square"; ctx.lineJoin = "miter"; ctx.setLineDash([]);
    for (const bay of game.layout.decorBays) {
      ctx.save(); ctx.translate(bay.cx, bay.cy); ctx.rotate(bay.angle);
      const hl = bay.halfLength, hw = bay.halfWidth;
      if (game.mode === "parallel") ctx.strokeRect(-hl, -hw, hl * 2, hw * 2);
      else {
        // Open end faces the lane; paint is guidance and never a collision wall.
        ctx.beginPath(); ctx.moveTo(hl, -hw); ctx.lineTo(-hl, -hw); ctx.lineTo(-hl, hw); ctx.lineTo(hl, hw); ctx.stroke();
        ctx.strokeStyle = "#fff9e8"; ctx.lineWidth = 1.5 * scale;
        ctx.beginPath(); ctx.moveTo(hl - 6 * scale, -hw); ctx.lineTo(hl, -hw); ctx.lineTo(hl, -hw + 5 * scale);
        ctx.moveTo(hl - 6 * scale, hw); ctx.lineTo(hl, hw); ctx.lineTo(hl, hw - 5 * scale); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawZone(target, label, active) {
    ctx.save(); ctx.translate(target.cx, target.cy); ctx.rotate(target.angle);
    ctx.fillStyle = active ? "rgba(158,224,176,.26)" : "rgba(158,224,176,.1)";
    ctx.strokeStyle = "#263f37"; ctx.lineWidth = 2; ctx.setLineDash([7, 5]);
    ctx.fillRect(-target.halfLength, -target.halfWidth, target.halfLength * 2, target.halfWidth * 2);
    ctx.strokeRect(-target.halfLength, -target.halfWidth, target.halfLength * 2, target.halfWidth * 2);
    ctx.setLineDash([]); ctx.rotate(-target.angle); ctx.fillStyle = "#171815"; ctx.font = "900 11px PingFang SC,sans-serif"; ctx.textAlign = "center"; ctx.fillText(label, 0, 4); ctx.restore();
  }

  function drawParkingTarget() {
    const { target, carLength, carWidth, playTop, controlTop } = game.layout;
    const inside = game.park.inside;
    ctx.save();
    ctx.translate(target.cx, target.cy);
    ctx.rotate(target.angle);
    // Fill up to the inner edge of the 2.5-scale white bay paint.
    const inset = game.stage === "exit" ? 0 : 1.25 * game.layout.scale;
    const length = target.halfLength * 2 - inset * 2;
    const width = target.halfWidth * 2 - inset * 2;
    ctx.fillStyle = game.stage === "exit" ? "rgba(158,224,176,.18)" : "rgba(243, 223, 66, 0.30)";
    ctx.fillRect(-length / 2, -width / 2, length, width);
    const outlineInset = game.stage === "exit" ? 0 : 5 * game.layout.scale;
    ctx.strokeStyle = inside || game.stage === "exit" ? "#9ee0b0" : "rgba(243, 223, 130, 0.55)";
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 6]);
    ctx.strokeRect(-target.halfLength + outlineInset, -target.halfWidth + outlineInset,
      target.halfLength * 2 - outlineInset * 2, target.halfWidth * 2 - outlineInset * 2);
    ctx.setLineDash([]);
    ctx.globalAlpha = inside ? 0.18 : 0.1;
    drawCarShape(0, 0, carLength, carWidth, "#171815", "", game.vehicle);
    ctx.restore();

    drawParkingHelpHighlight();
    const markerY = clamp(target.cy - target.hy - 19, playTop + 14, controlTop - 18);
    drawTargetMarker(target.cx, markerY);
  }

  function drawParkingHelpHighlight() {
    if (game.state !== "playing" || game.parkingHelp.highlightLeft <= 0) return;
    const target = game.layout.parkingTarget;
    const scale = game.layout.scale;
    const inset = 5 * scale;
    const length = target.halfLength * 2 - inset * 2;
    const width = target.halfWidth * 2 - inset * 2;
    ctx.save();
    ctx.translate(target.cx, target.cy);
    ctx.rotate(target.angle);
    // A steady outline fades out; no flashing, mask or extra marker covers the scene.
    ctx.globalAlpha = Math.min(1, game.parkingHelp.highlightLeft / 0.5);
    ctx.strokeStyle = "#8d751f";
    ctx.lineWidth = 5 * scale;
    ctx.strokeRect(-length / 2, -width / 2, length, width);
    ctx.strokeStyle = "#fff1a1";
    ctx.lineWidth = 3 * scale;
    ctx.strokeRect(-length / 2, -width / 2, length, width);
    ctx.restore();
  }

  function drawTargetMarker(centerX, baseY) {
    const arrowTop = baseY;
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "#e6d66b";
    ctx.strokeStyle = "#171815";
    ctx.lineWidth = 1;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(centerX - 2.5, arrowTop);
    ctx.lineTo(centerX + 2.5, arrowTop);
    ctx.lineTo(centerX + 2.5, arrowTop + 7);
    ctx.lineTo(centerX + 6, arrowTop + 7);
    ctx.lineTo(centerX, arrowTop + 14);
    ctx.lineTo(centerX - 6, arrowTop + 7);
    ctx.lineTo(centerX - 2.5, arrowTop + 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

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
      if (parked.wreck) {
        drawCrushedCar(parked, parked.length || game.layout.carLength, parked.width || game.layout.carWidth,
          parked.color, parked.vehicle, parked.art);
      } else {
        drawCar(parked.x, parked.y, parked.angle, parked.color, "", parked.vehicle, parked.length, parked.width, parked.art);
      }
    }
  }

  function drawCar(x, y, angle, color, label, vehicleType, length, width, art) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    drawCarShape(0, 0, length || game.layout.carLength, width || game.layout.carWidth, color, label, vehicleType, art);
    ctx.restore();
  }

  function drawCarShape(x, y, length, width, color, label, vehicleType, art) {
    if (drawVehicleArt(x, y, length, width, label, art || vehicleType || "car")) return;
    if (vehicleType && vehicleType !== "car") { drawTruckFallback(x, y, length, width, color, label, vehicleType); return; }
    ctx.save();
    ctx.translate(x, y);
    ctx.lineJoin = "round";
    ctx.fillStyle = "#171815";
    ctx.fillRect(-length * 0.32, -width * 0.63, length * 0.18, width * 0.17);
    ctx.fillRect(length * 0.13, -width * 0.63, length * 0.18, width * 0.17);
    ctx.fillRect(-length * 0.32, width * 0.46, length * 0.18, width * 0.17);
    ctx.fillRect(length * 0.13, width * 0.46, length * 0.18, width * 0.17);

    ctx.beginPath();
    ctx.moveTo(-length * 0.35, -width * 0.5);
    ctx.lineTo(length * 0.27, -width * 0.5);
    ctx.bezierCurveTo(length * 0.46, -width * 0.5, length * 0.55, -width * 0.31, length * 0.55, 0);
    ctx.bezierCurveTo(length * 0.55, width * 0.31, length * 0.46, width * 0.5, length * 0.27, width * 0.5);
    ctx.lineTo(-length * 0.35, width * 0.5);
    ctx.bezierCurveTo(-length * 0.48, width * 0.5, -length * 0.52, width * 0.3, -length * 0.52, 0);
    ctx.bezierCurveTo(-length * 0.52, -width * 0.3, -length * 0.48, -width * 0.5, -length * 0.35, -width * 0.5);
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

    // 白色前灯是车头，红色尾灯是车尾。
    ctx.fillStyle = "#eaf5ed";
    ctx.beginPath();
    ctx.ellipse(length * 0.45, -width * 0.27, length * 0.045, width * 0.09, 0, 0, Math.PI * 2);
    ctx.ellipse(length * 0.45, width * 0.27, length * 0.045, width * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d6402f";
    ctx.fillRect(-length * 0.5, -width * 0.34, length * 0.075, width * 0.2);
    ctx.fillRect(-length * 0.5, width * 0.14, length * 0.075, width * 0.2);

    ctx.restore();
  }

  function drawVehicleArt(x, y, length, width, label, type) {
    const art = VEHICLE_ART[type];
    if (!art || !art.image || !art.image.complete || !art.image.naturalWidth) {
      return false;
    }
    const body = art.body;
    const scale = Math.min(length / body.width, width / body.height);
    ctx.save();
    ctx.translate(x, y);
    ctx.drawImage(art.image, -(body.x + body.width / 2) * scale, -(body.y + body.height / 2) * scale,
      art.image.naturalWidth * scale, art.image.naturalHeight * scale);
    ctx.restore();
    return true;
  }

  function drawTruckFallback(x, y, length, width, color, label, type) {
    ctx.save(); ctx.translate(x, y); ctx.lineWidth = 2; ctx.strokeStyle = "#171815";
    const cabLength = type === "truck" ? .32 : .28;
    const cabStart = .5 - cabLength;
    const axles = type === "truck" ? [-.34, -.18, .32] : [-.32, .36];
    ctx.fillStyle = "#171815";
    axles.forEach(function (axle) { ctx.fillRect(length * axle - length * .055, -width * .6, length * .11, width * 1.2); });
    if (type === "van") {
      ctx.fillStyle = "#373735";
      ctx.fillRect(length * (cabStart - .035), -width * .38, length * .05, width * .76);
    }
    ctx.fillStyle = type === "truck" ? "#d3d8cd" : "#e2c88e";
    ctx.fillRect(-length * .49, -width * .47, length * (cabStart + .47), width * .94); ctx.strokeRect(-length * .49, -width * .47, length * (cabStart + .47), width * .94);
    ctx.fillStyle = color; roundedRectPath(length * cabStart, -width * .48, length * cabLength, width * .96, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#a4d2d0"; ctx.fillRect(length * (type === "truck" ? .35 : cabStart + cabLength * .53), -width * .35, length * (type === "truck" ? .09 : cabLength * .28), width * .7);
    ctx.strokeStyle = "rgba(23,24,21,.22)"; ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) { const xx = length * (-.39 + i * .14); ctx.beginPath(); ctx.moveTo(xx, -width * .4); ctx.lineTo(xx, width * .4); ctx.stroke(); }
    ctx.fillStyle = "#f1f5df"; ctx.fillRect(length * .47, -width * .36, length * .045, width * .18); ctx.fillRect(length * .47, width * .18, length * .045, width * .18);
    ctx.fillStyle = "#d6402f"; ctx.fillRect(-length * .5, -width * .37, length * .055, width * .2); ctx.fillRect(-length * .5, width * .17, length * .055, width * .2);
    ctx.restore();
  }

  const WRECK_HEAP = [[-.50,-.10],[-.43,-.34],[-.21,-.41],[.03,-.36],[.31,-.4],[.5,-.18],[.47,.12],[.5,.26],[.28,.4],[.02,.36],[-.25,.41],[-.47,.23]];
  const WRECK_PANELS = [
    [[-.47,-.19],[-.38,-.36],[-.2,-.33],[-.12,-.1],[-.25,.1],[-.45,.16]],
    [[-.44,.08],[-.24,-.02],[-.06,.1],[-.11,.34],[-.34,.37],[-.46,.23]],
    [[-.21,-.17],[-.09,-.36],[.14,-.3],[.23,-.05],[.07,.15],[-.14,.17]],
    [[-.09,.08],[.14,-.04],[.38,.1],[.3,.35],[.07,.37],[-.11,.24]],
    [[.19,-.23],[.39,-.29],[.48,-.08],[.43,.19],[.23,.2],[.13,.02]],
  ];

  function wreckPolygon(points, length, width, fill) {
    ctx.beginPath();
    points.forEach(function (point, index) {
      if (index === 0) ctx.moveTo(point[0] * length, point[1] * width);
      else ctx.lineTo(point[0] * length, point[1] * width);
    });
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.stroke();
  }

  function crushVisualState(wreck) {
    const age = wreck.splatAge;
    if (age < 0) {
      const anticipation = clamp(wreck.progress / .3, 0, 1);
      return { spriteAlpha: 1, spriteX: 1 - anticipation * .04, spriteY: 1 + anticipation * .1,
        pileAlpha: 0, pileX: 1, pileY: 1, tilt: 0 };
    }
    const slam = Math.min(1, age / .075);
    const pulse = age < .4 ? Math.sin(slam * Math.PI / 2) * Math.exp(-Math.max(0, age - .075) * 15) : 0;
    const rebound = age > .075 && age < .4 ? Math.sin((age - .075) * 32) * Math.exp(-(age - .075) * 14) * .13 : 0;
    return { spriteAlpha: Math.max(0, 1 - age / .13), spriteX: 1 + slam * .28, spriteY: 1 - slam * .84,
      pileAlpha: Math.min(1, age / .09), pileX: 1 + pulse * .24 - rebound * .4,
      pileY: 1 - pulse * .38 + rebound, tilt: rebound * .15 };
  }

  function drawCrushedCar(body, length, width, color, vehicle, art) {
    const wreck = body.wreck;
    if (!wreck) return;
    const pose = crushVisualState(wreck);
    const paint = art ? color : vehicle === "van" ? "#f47d24" : vehicle === "truck" ? "#3c91c5" : color;
    const cargo = vehicle === "truck" ? "#87956e" : "#d4d5c5";
    ctx.save(); ctx.translate(body.x, body.y); ctx.rotate(body.angle);
    if (pose.spriteAlpha > 0) {
      ctx.save(); ctx.scale(pose.spriteX, pose.spriteY); ctx.globalAlpha = pose.spriteAlpha;
      drawCarShape(0, 0, length, width, color, "", vehicle, art); ctx.restore();
    }
    if (pose.pileAlpha <= 0) { ctx.restore(); return; }
    ctx.globalAlpha = pose.pileAlpha * .17; ctx.fillStyle = "#363a32";
    ctx.beginPath(); ctx.ellipse(0, width * .03, length * .52, width * .53, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = pose.pileAlpha;
    ctx.scale(pose.pileX, pose.pileY); ctx.rotate(pose.tilt);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.strokeStyle = "#292d28"; ctx.lineWidth = Math.max(.9, width * .04);
    ctx.save(); ctx.translate(0, width * .035);
    wreckPolygon(WRECK_HEAP, length * .98, width, "#4b5545"); ctx.restore();
    WRECK_PANELS.forEach(function (points, index) {
      const fill = index === 1 ? "#9ba38e" : vehicle !== "car" && index < 4 ? cargo : paint;
      wreckPolygon(points, length * .98, width * .98, fill);
      // One broad fold per block replaces the old tiny shards and glass details.
      const a = points[0], b = points[2], c = points[4];
      ctx.strokeStyle = "#4c5644"; ctx.lineWidth = Math.max(.8, width * .035);
      ctx.beginPath(); ctx.moveTo(a[0] * length, a[1] * width);
      ctx.lineTo((a[0] + b[0]) * length * .5, (a[1] + b[1]) * width * .5);
      ctx.lineTo(c[0] * length, c[1] * width); ctx.stroke();
      ctx.strokeStyle = "#e0e4ce"; ctx.lineWidth = Math.max(.6, width * .025);
      ctx.beginPath(); ctx.moveTo((a[0] + b[0]) * length * .5, (a[1] + b[1]) * width * .5);
      ctx.lineTo(c[0] * length, c[1] * width); ctx.stroke();
      ctx.strokeStyle = "#292d28"; ctx.lineWidth = Math.max(.9, width * .04);
    });
    for (const axle of [-.31,.30]) for (const side of [-1,1]) {
      ctx.save(); ctx.translate(axle * length, side * width * .4); ctx.rotate(side * (axle < 0 ? .6 : -.48));
      ctx.fillStyle = "#292c29";
      roundedRectPath(-length * .065, -width * .055, length * .13, width * .11, width * .025); ctx.fill(); ctx.restore();
    }
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
    const press = tank.pressAge >= 0 && tank.pressAge < .24 ? Math.sin(tank.pressAge / .24 * Math.PI) : 0;
    ctx.translate(0, press * 3 * game.layout.scale);
    ctx.scale(1 + press * .025, 1 - press * .07);

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

  function drawContactFx() {
    const fx = game.contactFx;
    if (fx.life <= 0 || game.car.destroyed) return;
    const progress = 1 - fx.life / fx.duration;
    const scale = game.layout.scale;
    const radius = (4 + progress * (fx.scrape ? 12 : 20)) * scale;
    ctx.save();
    ctx.globalAlpha = Math.pow(1 - progress, 0.7) * 0.9;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#c57524";
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    const angle = Math.atan2(fx.ny, fx.nx);
    ctx.arc(fx.x, fx.y, radius, angle - 1.15, angle + 1.15);
    ctx.stroke();
    ctx.strokeStyle = "#fff8d9";
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
    ctx.restore();
  }

  function drawParticles() {
    for (const particle of game.particles) {
      if (particle.kind === "smoke") continue;
      ctx.save();
      if (particle.kind === "spark") {
        ctx.globalAlpha = Math.pow(clamp(particle.life / particle.maxLife, 0, 1), 0.65);
        ctx.strokeStyle = "#bd762a";
        ctx.lineWidth = Math.max(2.5, game.layout.scale * 3);
        ctx.lineCap = "round";
        const angle = Math.atan2(particle.vy, particle.vx);
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x - Math.cos(angle) * particle.size, particle.y - Math.sin(angle) * particle.size);
        ctx.stroke();
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = Math.max(1.4, game.layout.scale * 1.7);
        ctx.stroke();
        ctx.restore();
        continue;
      }
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
    } else {
      refreshFollowStatus();
      if (game.state === "rescue") renderRescue();
      renderGrowthActions();
      if (game.state === "tank") setTankRumble(true);
    }
  });

  progress = cleanProgress(progress);
  applyLevel(unlockedLevel()); selectedChapter = currentLevel().chapter;
  syncSoundToggle();

  resize();
  resetGame(false);
  initializeStorage();
  requestAnimationFrame(frame);
})();
