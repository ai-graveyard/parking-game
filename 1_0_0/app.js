(() => {
  "use strict";

  const canvas = document.querySelector("#gameCanvas");
  const ctx = canvas.getContext("2d");
  const gameEl = document.querySelector("#game");
  const timerEl = document.querySelector("#timer");
  const timerBox = document.querySelector("#timerBox");
  const difficultyBadge = document.querySelector("#difficultyBadge");
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
  const difficultyButtons = [...document.querySelectorAll(".difficulty-option")];
  const resultOverlay = document.querySelector("#resultOverlay");
  const resultCard = document.querySelector("#resultCard");
  const resultKicker = document.querySelector("#resultKicker");
  const resultTitle = document.querySelector("#resultTitle");
  const resultCopy = document.querySelector("#resultCopy");
  const resultTime = document.querySelector("#resultTime");
  const nextLevel = document.querySelector("#nextLevel");
  const nextLevelTitle = document.querySelector("#nextLevelTitle");
  const nextLevelCopy = document.querySelector("#nextLevelCopy");
  const nextDifficultyButton = document.querySelector("#nextDifficultyButton");
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

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const normalizeAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
  const angleDistance = (a, b) => Math.abs(normalizeAngle(a - b));
  const SPEED_TO_KMH = 0.18;
  const DIFFICULTIES = {
    easy: {
      key: "easy",
      label: "简单",
      time: 100,
      garageWidth: 1.28,
      garageHeight: 1.2,
      next: "hard",
      summary: "大车库 · 几乎没有路障",
    },
    hard: {
      key: "hard",
      label: "困难",
      time: 60,
      garageWidth: 1,
      garageHeight: 1,
      next: "hell",
      summary: "标准车库 · 路障变多",
    },
    hell: {
      key: "hell",
      label: "地狱",
      time: 30,
      garageWidth: 0.8,
      garageHeight: 0.82,
      next: null,
      summary: "小车库 · 路障密集",
    },
  };

  let W = 390;
  let H = 844;
  let dpr = 1;
  let lastFrame = performance.now();
  let toastTimer = 0;
  let audioCtx = null;
  let soundEnabled = true;
  let engineOsc = null;
  let engineGain = null;
  let tankOsc = null;
  let tankGain = null;
  let lastReverseBeepAt = 0;
  let lastCountdownSecond = null;

  const input = {
    steer: 0,
    steerTarget: 0,
    gas: false,
    brake: false,
    steerPointer: null,
    steerPointerAngle: null,
    steerDragDegrees: 0,
  };

  const game = {
    state: "ready",
    difficulty: "easy",
    timeLimit: DIFFICULTIES.easy.time,
    timeLeft: DIFFICULTIES.easy.time,
    elapsed: 0,
    stableTime: 0,
    collisionCooldown: 0,
    flash: 0,
    car: { x: 0, y: 0, angle: 0, speed: 0, destroyed: false },
    tank: { x: 0, y: 0, crushedCar: false, crushedScene: false, endTimer: 0, smokeTimer: 0 },
    particles: [],
    skidMarks: [],
    driveDirection: -1,
    layout: null,
    lastSpawn: null,
  };

  function resize() {
    const rect = gameEl.getBoundingClientRect();
    W = Math.max(300, rect.width);
    H = Math.max(560, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    game.layout = makeLayout();

    if (game.state === "ready") resetCar();
  }

  function makeLayout() {
    const difficulty = DIFFICULTIES[game.difficulty];
    const controlsHeight = H <= 670 ? 178 : clamp(H * 0.27, 190, 232);
    const controlTop = H - controlsHeight;
    const roadTop = clamp(H * 0.40, 228, controlTop - 150);
    const roadBottom = controlTop + 18;
    const baseTargetWidth = clamp(W * 0.19, 61, 82);
    const baseTargetHeight = clamp(H * 0.15, 92, 122);
    const target = {
      x: W * 0.105,
      y: roadTop - baseTargetHeight * difficulty.garageHeight,
      w: baseTargetWidth * difficulty.garageWidth,
      h: baseTargetHeight * difficulty.garageHeight,
    };
    const carLength = clamp(W * 0.14, 46, 62);
    const carWidth = carLength * 0.53;
    const parkedCars = [
      {
        x: target.x + target.w + carWidth * 1.02,
        y: target.y + target.h * 0.46,
        angle: Math.PI / 2,
        color: "#4c75c8",
      },
    ];
    if (game.difficulty !== "easy") {
      parkedCars.push({
        x: W * 0.83,
        y: controlTop - carWidth * 0.75,
        angle: 0,
        color: "#dc7ea2",
      });
    }
    return {
      controlsHeight,
      controlTop,
      roadTop,
      roadBottom,
      target,
      carLength,
      carWidth,
      parkedCars,
      obstacles: makeDifficultyObstacles(game.difficulty, roadTop, controlTop),
    };
  }

  function makeDifficultyObstacles(level, roadTop, controlTop) {
    const driveHeight = controlTop - roadTop;
    const obstacle = (type, xRatio, yRatio, width, height, angle = 0, scale = 1) => ({
      type,
      x: W * xRatio,
      y: roadTop + driveHeight * yRatio,
      w: width,
      h: height,
      angle,
      scale,
    });
    if (level === "easy") return [];
    const hardObstacles = [
      obstacle("cone", 0.47, 0.16, 18, 18, 0, 0.82),
      obstacle("cone", 0.61, 0.31, 18, 18, 0, 0.76),
      obstacle("barrier", 0.48, 0.56, 46, 15, -0.08),
      obstacle("cone", 0.30, 0.74, 18, 18, 0, 0.86),
    ];
    if (level === "hard") return hardObstacles;
    return [
      ...hardObstacles,
      obstacle("barrier", 0.70, 0.68, 48, 15, 0.1),
      obstacle("tires", 0.78, 0.42, 28, 23, -0.08),
      obstacle("cone", 0.37, 0.39, 18, 18, 0, 0.72),
    ];
  }

  function randomRoadStart() {
    const { roadTop, controlTop, carLength, carWidth, parkedCars, obstacles } = game.layout;
    const minX = Math.max(W * 0.68, carLength * 0.94);
    const maxX = W - carLength * 0.94;
    const minY = roadTop + carWidth * 0.82;
    const maxY = controlTop - carWidth * 0.82;
    const zoneHeight = (maxY - minY) * 0.28;
    const zones = [
      { minY, maxY: minY + zoneHeight },
      { minY: maxY - zoneHeight, maxY },
    ];
    const firstZone = Math.random() < 0.5 ? 0 : 1;
    const zoneOrder = [firstZone, firstZone === 0 ? 1 : 0];

    for (const zoneIndex of zoneOrder) {
      const zone = zones[zoneIndex];
      for (let attempt = 0; attempt < 50; attempt += 1) {
        const candidate = {
          x: lerp(minX, maxX, Math.random()),
          y: lerp(zone.minY, zone.maxY, Math.random()),
          angle: 0,
        };
        const carBox = makeObb(candidate.x, candidate.y, carLength * 1.22, carWidth * 1.42, candidate.angle);
        const tooCloseToLast = game.lastSpawn && Math.hypot(
          candidate.x - game.lastSpawn.x,
          candidate.y - game.lastSpawn.y
        ) < W * 0.22;
        const touchesParkedCar = parkedCars.some((parked) => obbOverlap(
          carBox,
          makeObb(parked.x, parked.y, carLength * 1.18, carWidth * 1.35, parked.angle)
        ));
        const touchesObstacle = obstacles.some((item) => obbOverlap(
          carBox,
          makeObb(item.x, item.y, item.w * 1.35, item.h * 1.45, item.angle || 0)
        ));

        if (!tooCloseToLast && !touchesParkedCar && !touchesObstacle) return candidate;
      }
    }

    const lastWasUpper = game.lastSpawn && game.lastSpawn.y < (minY + maxY) / 2;
    const fallbackZone = zones[lastWasUpper ? 1 : 0];
    return {
      x: lerp(minX, maxX, 0.68),
      y: (fallbackZone.minY + fallbackZone.maxY) / 2,
      angle: 0,
    };
  }

  function resetCar() {
    const start = randomRoadStart();
    game.lastSpawn = start;
    game.car.x = start.x;
    game.car.y = start.y;
    game.car.angle = start.angle;
    game.car.speed = 0;
    game.car.destroyed = false;
  }

  function syncDifficultyUi() {
    const difficulty = DIFFICULTIES[game.difficulty];
    difficultyBadge.textContent = `${difficulty.label} · ${difficulty.time} 秒`;
    startStamp.textContent = `⚠ 坦克还有 ${difficulty.time} 秒`;
    startButtonLabel.textContent = `开始${difficulty.label}模式`;
    difficultyButtons.forEach((button) => {
      const selected = button.dataset.difficulty === game.difficulty;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-checked", String(selected));
    });
  }

  function selectDifficulty(level, autostart = false) {
    if (!DIFFICULTIES[level]) return;
    game.difficulty = level;
    game.timeLimit = DIFFICULTIES[level].time;
    game.layout = makeLayout();
    syncDifficultyUi();
    resetGame(autostart);
  }

  function resetGame(autostart = true) {
    const difficulty = DIFFICULTIES[game.difficulty];
    game.state = autostart ? "playing" : "ready";
    game.timeLimit = difficulty.time;
    game.timeLeft = difficulty.time;
    game.elapsed = 0;
    game.stableTime = 0;
    game.collisionCooldown = 0;
    game.flash = 0;
    game.driveDirection = -1;
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
    input.steerPointerAngle = null;
    input.steerDragDegrees = 0;
    gasButton.classList.remove("is-pressed");
    brakeButton.classList.remove("is-pressed");
    wheelEl.style.setProperty("--steer-angle", "0deg");
    wheelPad.setAttribute("aria-valuenow", "0");
    steerReadout.textContent = "0°";
    resetCar();
    updateHud();
    pauseOverlay.classList.remove("is-visible");
    resultOverlay.classList.remove("is-visible");
    controlsEl.classList.toggle("is-disabled", !autostart);
    pauseButton.hidden = !autostart;
    gameEl.classList.remove("is-shaking");
    syncDifficultyUi();
    setEngine(false);
    setTankRumble(false);
  }

  function startGame() {
    initAudio();
    startOverlay.classList.remove("is-visible");
    resetGame(true);
    showToast("倒进黄框，停稳就算赢");
  }

  function pauseGame() {
    if (game.state !== "playing") return;
    game.state = "paused";
    input.gas = false;
    input.brake = false;
    input.steerTarget = 0;
    input.steerPointer = null;
    input.steerPointerAngle = null;
    gasButton.classList.remove("is-pressed");
    brakeButton.classList.remove("is-pressed");
    controlsEl.classList.add("is-disabled");
    pauseButton.hidden = true;
    const difficulty = DIFFICULTIES[game.difficulty];
    pauseSummary.textContent = `${difficulty.label}模式 · 剩余 ${game.timeLeft.toFixed(1)} 秒`;
    pauseOverlay.classList.add("is-visible");
    setEngine(false);
    setTankRumble(false);
  }

  function resumeGame() {
    if (game.state !== "paused") return;
    game.state = "playing";
    pauseOverlay.classList.remove("is-visible");
    controlsEl.classList.remove("is-disabled");
    pauseButton.hidden = false;
    lastFrame = performance.now();
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

  function updateHud() {
    const speedKmh = Math.round(Math.abs(game.car.speed) * SPEED_TO_KMH);
    speedValue.textContent = String(speedKmh);
    speedMeter.setAttribute("aria-valuenow", String(speedKmh));
    speedMeter.classList.toggle("is-moving", speedKmh > 0);
    timerEl.textContent = game.timeLeft.toFixed(1);
    timerBox.classList.toggle("is-urgent", game.state === "playing" && game.timeLeft <= 8);
    if (game.state === "tank") {
      missionText.textContent = "没停进去。坦克来了。";
    } else if (game.state === "failed") {
      missionText.textContent = "道路已清空，建议重考";
    } else if (game.state === "success") {
      missionText.textContent = "停车完成，路保住了";
    } else if (game.state === "paused") {
      missionText.textContent = "游戏已暂停";
    } else if (game.state === "playing") {
      missionText.textContent = parkingHint();
    } else {
      missionText.textContent = "倒进黄色车位，再把车停稳";
    }
  }

  function parkingHint() {
    const status = parkingStatus();
    if (status.inside && !status.aligned) return "车进框了，把方向摆正";
    if (status.inside && status.aligned && !status.stopped) return "位置对了，松开踏板停稳";
    if (game.car.speed < -5) return "正在倒车 · 看准车尾";
    if (game.car.speed > 5) return "前进中 · 刹车后继续长按可倒车";
    return "长按右侧刹车开始倒车";
  }

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
    } catch (_) {
      soundEnabled = false;
      soundToggle.textContent = "声音关";
    }
  }

  function setEngine(active) {
    if (!audioCtx || !engineOsc || !engineGain) return;
    const now = audioCtx.currentTime;
    const volume = soundEnabled && active ? 0.025 : 0;
    engineGain.gain.cancelScheduledValues(now);
    engineGain.gain.linearRampToValueAtTime(volume, now + 0.08);
    engineOsc.frequency.setTargetAtTime(48 + Math.abs(game.car.speed) * 0.55, now, 0.06);
  }

  function setTankRumble(active) {
    if (!audioCtx || !tankOsc || !tankGain) return;
    const now = audioCtx.currentTime;
    const volume = soundEnabled && active ? 0.045 : 0;
    tankGain.gain.cancelScheduledValues(now);
    tankGain.gain.linearRampToValueAtTime(volume, now + 0.12);
    tankOsc.frequency.setTargetAtTime(34 + Math.sin(performance.now() / 90) * 2.5, now, 0.08);
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
    input.steerDragDegrees = clamp(
      input.steerDragDegrees + delta * 180 / Math.PI,
      -360,
      360
    );
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
    input.steerPointer = null;
    input.steerPointerAngle = null;
    input.steerTarget = 0;
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

  difficultyButtons.forEach((button) => {
    button.addEventListener("click", () => selectDifficulty(button.dataset.difficulty, false));
  });
  startButton.addEventListener("click", startGame);
  pauseButton.addEventListener("click", pauseGame);
  continueButton.addEventListener("click", resumeGame);
  pauseRestartButton.addEventListener("click", () => resetGame(true));
  pauseExitButton.addEventListener("click", exitPausedGame);
  restartButton.addEventListener("click", () => resetGame(true));
  nextDifficultyButton.addEventListener("click", () => {
    const nextLevelKey = nextDifficultyButton.dataset.difficulty;
    if (nextLevelKey) selectDifficulty(nextLevelKey, true);
  });
  changeDifficultyButton.addEventListener("click", () => {
    resetGame(false);
    startOverlay.classList.add("is-visible");
  });
  soundToggle.addEventListener("click", () => {
    initAudio();
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? "声音开" : "声音关";
    soundToggle.setAttribute("aria-label", soundEnabled ? "关闭声音" : "打开声音");
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

  function update(dt) {
    toastTimer -= dt;
    if (toastTimer <= 0) toastEl.classList.remove("is-visible");
    game.flash = Math.max(0, game.flash - dt * 2.4);
    game.collisionCooldown = Math.max(0, game.collisionCooldown - dt);

    const steerFollow = input.steerPointer === null && input.steerTarget === 0
      ? 1 - Math.pow(0.04, dt)
      : 1 - Math.pow(0.0005, dt);
    input.steer = lerp(input.steer, input.steerTarget, steerFollow);
    const wheelDegrees = input.steer * 360;
    wheelEl.style.setProperty("--steer-angle", `${wheelDegrees.toFixed(1)}deg`);
    wheelPad.setAttribute("aria-valuenow", String(Math.round(wheelDegrees)));
    const displayedDegrees = Math.abs(wheelDegrees) < 3 ? 0 : Math.round(wheelDegrees);
    steerReadout.textContent = `${displayedDegrees}°`;

    if (game.state === "playing") updatePlaying(dt);
    if (game.state === "tank") updateTank(dt);
    updateParticles(dt);
    updateHud();
  }

  function updatePlaying(dt) {
    game.elapsed += dt;
    game.timeLeft = Math.max(0, game.timeLimit - game.elapsed);
    const car = game.car;
    const before = { x: car.x, y: car.y, angle: car.angle };
    const accelForward = 82;
    const accelReverse = 66;
    const rollingDrag = 42;

    if (input.gas && !input.brake) {
      car.speed += (car.speed < 0 ? 118 : accelForward) * dt;
    } else if (input.brake && !input.gas) {
      car.speed -= (car.speed > 0 ? 142 : accelReverse) * dt;
    } else {
      const drag = rollingDrag * dt;
      if (Math.abs(car.speed) <= drag) car.speed = 0;
      else car.speed -= Math.sign(car.speed) * drag;
    }

    car.speed = clamp(car.speed, -76, 112);
    if (car.speed > 2) game.driveDirection = 1;
    else if (car.speed < -2) game.driveDirection = -1;
    else if (input.gas) game.driveDirection = 1;
    else if (input.brake) game.driveDirection = -1;
    const speedRatio = clamp(Math.abs(car.speed) / 38, 0.25, 1);
    const maxSteer = 0.57 * speedRatio;
    const wheelbase = game.layout.carLength * 0.62;
    car.angle = normalizeAngle(car.angle + (car.speed / wheelbase) * Math.tan(input.steer * maxSteer) * dt);
    car.x += Math.cos(car.angle) * car.speed * dt;
    car.y += Math.sin(car.angle) * car.speed * dt;

    const collision = collidesWithScene();
    if (collision) {
      car.x = before.x;
      car.y = before.y;
      car.angle = before.angle;
      car.speed *= -0.22;
      if (game.collisionCooldown <= 0) {
        game.collisionCooldown = 0.75;
        game.timeLeft = Math.max(0, game.timeLeft - 2);
        game.elapsed = game.timeLimit - game.timeLeft;
        game.flash = 0.8;
        burst(car.x, car.y, "#f05b32", 11);
        showToast("撞到了！扣 2 秒");
        soundBurst("hit");
        navigator.vibrate?.(70);
      }
    }

    if (Math.abs(car.speed) > 36 && Math.abs(input.steer) > 0.62 && Math.random() < dt * 7) {
      game.skidMarks.push({ x: car.x, y: car.y, angle: car.angle, life: 1 });
      if (game.skidMarks.length > 80) game.skidMarks.shift();
    }
    for (const mark of game.skidMarks) mark.life -= dt * 0.06;

    const status = parkingStatus();
    if (status.inside && status.aligned && status.stopped) game.stableTime += dt;
    else game.stableTime = Math.max(0, game.stableTime - dt * 2.5);

    setEngine(Math.abs(car.speed) > 1 || input.gas || input.brake);
    updateDrivingSoundCues();

    if (game.stableTime >= 0.65) {
      completeSuccess();
      return;
    }
    if (game.timeLeft <= 0) summonTank();
  }

  function updateDrivingSoundCues() {
    const reversing = game.car.speed < -1 || (input.brake && game.car.speed <= 0);
    if (reversing && performance.now() - lastReverseBeepAt >= 720) playReverseBeep();

    const countdownSecond = Math.ceil(game.timeLeft);
    if (game.timeLeft > 0 && game.timeLeft <= 10 && countdownSecond !== lastCountdownSecond) {
      lastCountdownSecond = countdownSecond;
      playCountdownTick(countdownSecond);
    } else if (game.timeLeft > 10) {
      lastCountdownSecond = null;
    }
  }

  function collidesWithScene() {
    const { car } = game;
    const { carLength, carWidth, parkedCars, obstacles, controlTop } = game.layout;
    const moving = makeObb(car.x, car.y, carLength * 0.91, carWidth * 0.88, car.angle);
    const points = moving.points;
    const out = points.some((point) => point.x < 5 || point.x > W - 5 || point.y < 104 || point.y > controlTop + 4);
    if (out) return true;
    const hitsParkedCar = parkedCars.some((parked) => {
      const obstacle = makeObb(parked.x, parked.y, carLength * 0.97, carWidth * 0.95, parked.angle);
      return obbOverlap(moving, obstacle);
    });
    if (hitsParkedCar) return true;
    return obstacles.some((item) => obbOverlap(
      moving,
      makeObb(item.x, item.y, item.w, item.h, item.angle || 0)
    ));
  }

  function makeObb(x, y, length, width, angle) {
    const forward = { x: Math.cos(angle), y: Math.sin(angle) };
    const side = { x: -Math.sin(angle), y: Math.cos(angle) };
    const hl = length / 2;
    const hw = width / 2;
    const points = [
      { x: x + forward.x * hl + side.x * hw, y: y + forward.y * hl + side.y * hw },
      { x: x + forward.x * hl - side.x * hw, y: y + forward.y * hl - side.y * hw },
      { x: x - forward.x * hl - side.x * hw, y: y - forward.y * hl - side.y * hw },
      { x: x - forward.x * hl + side.x * hw, y: y - forward.y * hl + side.y * hw },
    ];
    return { points, axes: [forward, side] };
  }

  function obbOverlap(a, b) {
    for (const axis of [...a.axes, ...b.axes]) {
      const p1 = a.points.map((p) => p.x * axis.x + p.y * axis.y);
      const p2 = b.points.map((p) => p.x * axis.x + p.y * axis.y);
      if (Math.max(...p1) < Math.min(...p2) || Math.max(...p2) < Math.min(...p1)) return false;
    }
    return true;
  }

  function parkingStatus() {
    const { target, carLength, carWidth } = game.layout;
    const carBox = makeObb(game.car.x, game.car.y, carLength * 0.94, carWidth * 0.92, game.car.angle);
    const pad = 4;
    const inside = carBox.points.every((p) =>
      p.x > target.x + pad && p.x < target.x + target.w - pad &&
      p.y > target.y + pad && p.y < target.y + target.h - pad
    );
    const aligned = Math.min(
      angleDistance(game.car.angle, Math.PI / 2),
      angleDistance(game.car.angle, -Math.PI / 2)
    ) < 0.31;
    const stopped = Math.abs(game.car.speed) < 5;
    return { inside, aligned, stopped };
  }

  function completeSuccess() {
    game.state = "success";
    pauseButton.hidden = true;
    game.car.speed = 0;
    game.timeLeft = Math.max(0, game.timeLimit - game.elapsed);
    controlsEl.classList.add("is-disabled");
    setEngine(false);
    setTankRumble(false);
    playSuccessChime(game.difficulty === "hell");
    navigator.vibrate?.([40, 50, 90]);
    burst(game.car.x, game.car.y, "#f3df42", 34);
    showToast("稳稳入库！", 1.4);
    window.setTimeout(() => showResult(true), 750);
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

  function updateTank(dt) {
    const tank = game.tank;
    const size = getTankSize();
    tank.x += W * 0.34 * dt;
    tank.endTimer += dt;
    if (audioCtx && tankOsc && soundEnabled) {
      tankOsc.frequency.setTargetAtTime(34 + Math.sin(performance.now() / 85) * 2.5, audioCtx.currentTime, 0.07);
    }
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

  function showResult(success) {
    const difficulty = DIFFICULTIES[game.difficulty];
    const nextDifficulty = difficulty.next ? DIFFICULTIES[difficulty.next] : null;
    resultCard.classList.toggle("is-fail", !success);
    if (success) {
      resultKicker.textContent = `${difficulty.label}通关 · 驾驶合格`;
      resultTitle.textContent = game.difficulty === "hell" ? "地狱毕业！" : "停进去了！";
      resultCopy.textContent = game.elapsed < difficulty.time * 0.35
        ? "这手法，不去当代驾可惜了。"
        : "险归险，车和路都保住了。";
      resultTime.textContent = `${game.elapsed.toFixed(1)} 秒`;
    } else {
      resultKicker.textContent = `${difficulty.label}失败 · 驾驶存疑`;
      resultTitle.textContent = "车呢？路呢？";
      resultCopy.textContent = `${difficulty.time} 秒到。坦克替你完成了“清库”。`;
      resultTime.textContent = "坦克胜利";
    }
    const recommendNext = success && nextDifficulty;
    nextLevel.hidden = !recommendNext;
    restartButton.classList.toggle("is-secondary", Boolean(recommendNext));
    restartButtonLabel.textContent = recommendNext
      ? `重玩${difficulty.label}模式`
      : `再挑战${difficulty.label}模式`;
    if (recommendNext) {
      nextLevelTitle.textContent = `${nextDifficulty.label}模式`;
      nextLevelCopy.textContent = `${nextDifficulty.time} 秒 · ${nextDifficulty.summary}`;
      nextDifficultyButton.dataset.difficulty = nextDifficulty.key;
      nextDifficultyButton.querySelector("span").textContent = `直接挑战${nextDifficulty.label}`;
    } else {
      nextDifficultyButton.dataset.difficulty = "";
    }
    resultOverlay.classList.add("is-visible");
  }

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
    for (const particle of game.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      if (particle.kind === "smoke") {
        particle.vx *= Math.pow(0.42, dt);
        particle.vy *= Math.pow(0.55, dt);
        particle.size += particle.growth * dt;
        continue;
      }
      particle.vy += 170 * dt;
      particle.angle += particle.spin * dt;
    }
    game.particles = game.particles.filter((p) => p.life > 0);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawScene();
    drawSkids();
    drawParkingTarget();
    drawSmokeParticles();
    drawParkedCars();
    if (game.state === "playing" && game.difficulty !== "hell" && !game.car.destroyed) {
      drawTrajectoryPrediction();
    }
    if (!game.car.destroyed) drawCar(game.car.x, game.car.y, game.car.angle, "#f05b32", "你");
    else drawCrushedCar(game.car.x, game.car.y);
    if (game.state === "tank" || game.state === "failed") drawTank();
    drawParticles();
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
    const { carLength, carWidth, controlTop } = game.layout;
    const direction = game.driveDirection;
    const wheelbase = carLength * 0.62;
    const steerAngle = input.steer * 0.55;
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
    ctx.rect(0, 104, W, controlTop - 100);
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
    for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.strokeStyle = "rgba(245, 241, 223, 0.62)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawScene() {
    const { roadTop, roadBottom, controlTop } = game.layout;
    ctx.fillStyle = "#aebba7";
    ctx.fillRect(0, 0, W, roadTop);

    ctx.fillStyle = "#3d403b";
    ctx.fillRect(0, roadTop, W, roadBottom - roadTop);

    ctx.fillStyle = "#252723";
    ctx.fillRect(0, roadTop - 5, W, 7);

    ctx.fillStyle = "#ded6b9";
    ctx.fillRect(0, roadTop - 16, W, 12);
    for (let x = 0; x < W + 20; x += 44) {
      ctx.fillStyle = (x / 44) % 2 === 0 ? "#f3df42" : "#171815";
      ctx.fillRect(x, roadTop - 16, 24, 12);
    }

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
    drawSign(W * 0.86, roadTop - 49);

    ctx.fillStyle = "rgba(23, 24, 21, 0.15)";
    ctx.fillRect(0, controlTop - 2, W, 4);
  }

  function drawParkingTarget() {
    const { target } = game.layout;
    const status = parkingStatus();
    ctx.save();
    ctx.fillStyle = status.inside ? "rgba(158, 224, 176, 0.68)" : "rgba(243, 223, 66, 0.57)";
    ctx.fillRect(target.x, target.y, target.w, target.h);
    ctx.strokeStyle = "#f3df42";
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 7]);
    ctx.strokeRect(target.x, target.y, target.w, target.h + 2);
    ctx.setLineDash([]);

    ctx.translate(target.x + target.w / 2, target.y + target.h / 2);
    ctx.rotate(Math.PI / 2);
    ctx.globalAlpha = status.inside ? 0.38 : 0.21;
    drawCarShape(0, 0, game.layout.carLength, game.layout.carWidth, "#171815", "");
    ctx.restore();

    ctx.save();
    const centerX = target.x + target.w / 2;
    const arrowTop = target.y - 31 + Math.sin(performance.now() / 260) * 1.8;
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
    ctx.fillText("倒车入库", centerX, target.y - 38);
    ctx.restore();
  }

  function drawParkedCars() {
    for (const parked of game.layout.parkedCars) {
      if (game.state === "tank" && game.tank.crushedScene) {
        drawCrushedCar(parked.x, parked.y);
      } else {
        drawCar(parked.x, parked.y, parked.angle, parked.color, parked.label);
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

    // The rounded nose and white lamps mark the front; the flat red-lit edge is the rear.
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
    ctx.save();
    ctx.strokeStyle = "rgba(10, 10, 9, 0.25)";
    ctx.lineWidth = 2;
    for (const mark of game.skidMarks) {
      if (mark.life <= 0) continue;
      ctx.globalAlpha = mark.life;
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
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
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

  resize();
  resetGame(false);
  requestAnimationFrame(frame);
})();
