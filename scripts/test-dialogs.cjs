const assert = require('node:assert/strict');
const harness = require('./game-harness.cjs');
const noop = () => {};
const paint = new Proxy({measureText: text => ({width: String(text).length * 12})}, {get: (obj, key) => obj[key] || noop});
const visible = (t, id) => t.elements.get(id).classList.contains('is-visible');
const snapshot = t => JSON.stringify({car: t.game.car, elapsed: t.game.elapsed, time: t.game.timeLeft, progress: t.getProgress()});
async function fixture() {
  let note;
  const native = {};
  const t = harness({}, '', 'https:', paint, {now: Date.parse('2026-10-25T04:00:00Z'), xhs: {
    launchOptions: {miniToolEnv: {buildVersion: 9510000}}, miniTool: {
      getStorage: o => o.success({data: native[o.key] || null}),
      setStorage: o => {native[o.key] = o.data; o.success({});},
      getFollowStatus: o => o.success({follow_status: 1}),
      writeTempFile: o => o.success({filePath: 'local-test.png'}),
      postNote: o => {note = o;},
    },
  }});
  await t.initializeStorage();
  return Object.assign(t, {getNote: () => note});
}
(async () => {
  for (const size of [[320,568], [390,844], [430,932]]) {
    const t = await fixture(); t.setSize(...size); t.markIntroSeen(); t.applyLevel(1); t.resetGame(false);
    t.elements.get('#startOverlay').classList.add('is-visible');
    const ready = snapshot(t);
    t.dispatch('#startCloseButton', 'click');
    assert(!visible(t, '#startOverlay')); assert(!t.elements.get('#sceneReturn').hidden);
    t.dispatch('window', 'keydown', {key: 'ArrowUp'}); t.update(1, 0);
    assert.equal(t.game.state, 'ready'); assert.equal(snapshot(t), ready, 'preview neither drives nor starts the timer');
    t.dispatch('#sceneReturnButton', 'click'); assert(visible(t, '#startOverlay'));
    assert(t.elements.get('#sceneReturn').hidden);
    await t.startGame(); t.game.elapsed = 12; t.game.timeLeft -= 12;
    t.pauseGame(); const paused = snapshot(t); t.update(1, 0);
    t.dispatch('#pauseCloseButton', 'click'); assert.equal(t.game.state, 'playing');
    assert.equal(snapshot(t), paused); assert(!visible(t, '#pauseOverlay'));
    t.update(1/60, 0); assert(t.game.elapsed > 12);

    const active = snapshot(t), activeCar = JSON.stringify(t.game.car), activeLevel = t.game.levelId;
    t.input.gas = true;
    t.dispatch('#levelSelectButton', 'click');
    assert.equal(t.game.state, 'ready'); assert(visible(t, '#startOverlay'));
    t.update(2, 0);
    t.applyLevel(2); t.resetGame(false); await t.startGame();
    assert(visible(t, '#switchLevelOverlay')); assert(!visible(t, '#startOverlay'));
    assert.equal(t.game.state, 'ready', 'selecting a course waits for confirmation');
    t.dispatch('#switchLevelCancel', 'click');
    assert.equal(t.game.state, 'playing'); assert.equal(t.game.levelId, activeLevel);
    assert.equal(snapshot(t), active, 'cancel restores timer, car and records');
    assert.equal(JSON.stringify(t.game.car), activeCar); assert.equal(t.input.gas, false);
    t.dispatch('#levelSelectButton', 'click');
    t.applyLevel(3); t.resetGame(false);
    t.dispatch('#startCloseButton', 'click');
    assert.equal(snapshot(t), active, 'closing selection resumes the original course');
    t.dispatch('#levelSelectButton', 'click');
    t.applyLevel(2); t.resetGame(false); await t.startGame();
    t.dispatch('window', 'keydown', {key: 'Escape'});
    assert(!visible(t, '#switchLevelOverlay')); assert(visible(t, '#startOverlay'));
    await t.startGame(); t.dispatch('#switchLevelConfirm', 'click');
    assert.equal(t.game.state, 'playing'); assert.equal(t.game.levelId, 2);
    assert.equal(t.game.elapsed, 0); assert(!visible(t, '#switchLevelOverlay'));
    t.dispatch('#levelSelectButton', 'click'); await t.startGame();
    assert.equal(t.elements.get('#switchLevelConfirm').textContent, '终止并重新开始');
    t.dispatch('#switchLevelCancel', 'click'); assert.equal(t.game.levelId, 2);

    t.game.elapsed = t.game.timeLimit; t.handleTimeout(); assert.equal(t.game.state, 'rescue');
    const rescue = snapshot(t), allowance = JSON.stringify(t.dailyGrowth());
    t.dispatch('#rescueCloseButton', 'click'); t.dispatch('#levelSelectButton', 'click');
    t.applyLevel(3); t.resetGame(false); await t.startGame();
    t.dispatch('#switchLevelCancel', 'click');
    assert.equal(t.game.state, 'rescue'); assert(visible(t, '#rescueOverlay'));
    assert.equal(snapshot(t), rescue, 'cancel also restores an unfinished rescue scene');
    assert.equal(JSON.stringify(t.dailyGrowth()), allowance);
    for (let i = 0; i < 4; i++) {
      t.dispatch('#rescueCloseButton', 'click'); assert(!visible(t, '#rescueOverlay'));
      t.update(1, 0); t.dispatch('window', 'keydown', {key: 'ArrowUp'});
      assert.equal(snapshot(t), rescue); assert.equal(JSON.stringify(t.dailyGrowth()), allowance);
      t.dispatch('#sceneReturnButton', 'click'); assert(visible(t, '#rescueOverlay'));
    }
    const publishing = t.useOrShareRescue();
    for (let i = 0; i < 20; i++) await Promise.resolve();
    assert(t.getNote()); assert(t.elements.get('#rescueCloseButton').disabled);
    t.dispatch('#rescueCloseButton', 'click'); assert(visible(t, '#rescueOverlay'), 'publishing guards the parent dialog');
    t.getNote().fail({errCode: 20002}); await publishing;
    assert(!t.dailyGrowth().earned); assert(!t.dailyGrowth().used);
    t.dispatch('#rescueCloseButton', 'click'); t.dispatch('#sceneReturnButton', 'click');
    t.dispatch('#rescueDecline', 'click'); assert.equal(t.game.state, 'assessment');
    t.game.state = 'failed'; t.showResult(false);
    for (const success of [false, true]) {
      if (success) {t.game.state = 'success'; t.showResult(true);}
      const result = snapshot(t), run = JSON.stringify(t.game.lastRun);
      for (let i = 0; i < 4; i++) {
        t.dispatch('#resultCloseButton', 'click'); assert(!visible(t, '#resultOverlay'));
        t.update(1, 0); assert.equal(snapshot(t), result);
        t.dispatch('#sceneReturnButton', 'click'); assert(visible(t, '#resultOverlay'));
        assert.equal(JSON.stringify(t.game.lastRun), run, 'reopening never records another play or clear');
      }
    }
    const publishResult = t.postShareNote();
    for (let i = 0; i < 20; i++) await Promise.resolve();
    t.dispatch('#resultCloseButton', 'click'); assert(visible(t, '#resultOverlay'));
    t.getNote().fail({errCode: 20002}); await publishResult;
    t.dispatch('#resultCloseButton', 'click'); assert(!visible(t, '#resultOverlay'));
    t.resetGame(true); assert(t.elements.get('#sceneReturn').hidden);
    assert(!t.elements.get('#game').classList.contains('is-viewing-scene'));
    const gameElement = t.elements.get('#game');
    gameElement.getBoundingClientRect = () => ({left: 0, top: 0, width: 700, height: 390});
    t.resize(); assert.equal(t.game.state, 'paused');
    t.dispatch('#rotateCloseButton', 'click'); assert(!visible(t, '#rotateOverlay'));
    t.dispatch('#pauseCloseButton', 'click'); assert.equal(t.game.state, 'paused');
    t.dispatch('#pauseRestartButton', 'click'); assert.equal(t.game.state, 'paused', 'horizontal close cannot bypass the driving guard');
    t.resetGame(false); t.elements.get('#startOverlay').classList.add('is-visible');
    await t.startGame(); assert.equal(t.game.state, 'ready'); assert(visible(t, '#startOverlay'));
    const levelBefore = t.game.levelId; t.dispatch('#nextDifficultyButton', 'click');
    assert.equal(t.game.levelId, levelBefore, 'blocked next challenge never mutates the setup');
    gameElement.getBoundingClientRect = () => ({left: 0, top: 0, width: size[0], height: size[1]});
    t.resize(); await t.startGame(); assert.equal(t.game.state, 'playing');
    console.log(`PASS dialogs ${size.join('×')}: setup preview, switch confirmation/cancel/resume, pause resume, rescue quota/freeze, cancel/retry, publishing guards, result records and reset`);
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
