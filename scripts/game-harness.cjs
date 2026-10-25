// Test-only VM harness. Production has no unlock / teleport controls.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
module.exports = function harness(initialData = {}, hostname = "", protocol = "https:", canvasContext = null, options = {}) {
  const noop = function () {};
  const elements = new Map();
  const listeners = new Map();
  const on = (id, type, fn) => { const key = id + ':' + type; if (!listeners.has(key)) listeners.set(key, []); listeners.get(key).push(fn); };
  const dispatch = (id, type, event = {}) => { for (const fn of listeners.get(id + ':' + type) || []) fn({ preventDefault: noop, ...event }); };
  function element(id) {
    if (!elements.has(id)) elements.set(id, { textContent: '', hidden: false, dataset: {}, classList: (() => { const classes = new Set(); return { add: (...names) => names.forEach(n=>classes.add(n)), remove: (...names) => names.forEach(n=>classes.delete(n)), contains: n=>classes.has(n), toggle: (n,on) => {if(on === undefined)on=!classes.has(n);if(on)classes.add(n);else classes.delete(n);return on;} }; })(), style: { setProperty: noop }, setAttribute: noop, addEventListener: (type, fn) => on(id, type, fn), append: noop, appendChild: noop, getBoundingClientRect: () => id === '#mission' ? {bottom:150} : {left:0,top:0,width:390,height:844}, querySelector: name => element(id + name), toDataURL: () => "data:image/png;base64,TEST", getContext: () => canvasContext || ({setTransform:noop}) });
    return elements.get(id);
  }
  const data = { ...initialData };
  let clockNow = options.now || Date.now();
  class TestDate extends Date { constructor(...args) { super(...(args.length ? args : [clockNow])); } static now() { return clockNow; } }
  const sandbox = { console, Math, Promise, Date: TestDate, setTimeout, clearTimeout, performance:{now:()=>0}, navigator:{}, requestAnimationFrame:noop, document:{ querySelector:element, querySelectorAll:()=>[], createElement:()=>element(String(Math.random())), addEventListener:(type, fn)=>on('document',type,fn) }, window:{devicePixelRatio:1,addEventListener:(type, fn)=>on('window',type,fn),setTimeout:noop,localStorage:{getItem:k=>data[k] || null,setItem:(k,v)=>{data[k]=v}}} };
  if (options.xhs) sandbox.window.xhs = options.xhs;
  if (options.reducedMotion !== undefined) sandbox.window.matchMedia = () => ({matches:options.reducedMotion});
  vm.createContext(sandbox);
  sandbox.window.location = { hostname, protocol };
  const root = path.resolve(__dirname, '../src');
  vm.runInContext(fs.readFileSync(path.join(root,'challenges.js'),'utf8'),sandbox);
  let source=fs.readFileSync(path.join(root,'app.js'),'utf8');
  source=source.slice(0,source.lastIndexOf('  progress = cleanProgress(progress);')) + `
  window.test = { getToastTime: () => toastTimer, startGame, refreshFollowStatus, unlockBonus, bonusLocked, nextPlayableLevel, dailyGrowth, persistGrowth, beijingDay, canRescue, rescueSeconds, handleTimeout, useOrShareRescue, restoreRescueScene, renderRescue, renderGrowthActions, postShareNote, shareSummaryText, buildShareImage, buildRescueImage, blitPlayfield, shareSceneFrame, getGrowth: () => growth, game, input, levels: LEVELS, vehicles: VEHICLES, advance: CHALLENGES.advance, projectMap, makeMap, makeObb, obbOverlap, carFits, refreshParkStatus, updateMissionStage, updatePlaying, resetGame, applyLevel, update, pauseGame, resumeGame, finishGuide, shouldShowPlayerMarker, playerMarkerLift, commitRun, recordFor, rateRun, unlockedLevel, canPlayLevel, showResult, readRecords, initializeStorage, readSoundPref, introSeen, markIntroSeen, initAudio, playCrushSplat, crushVisualState, advanceCrushing, draw, buildBrickWallGroups, buildBrickWallCorners, drawCar, vehicleArt: VEHICLE_ART, drawCrushedCar, drawParkedCars, updateTank, summonTank, failAssessment, updateAssessment, assessmentPose, playAssessmentSound, drawAssessmentStamp, drawAssessmentPancake, drawAssessmentWeight, assessmentFootprint, assessmentArt: ASSESSMENT_ART, resize, updateParticles, elements: null, setProgress: value => { progress = value; }, getProgress: () => progress, setSize: (w,h) => {W=w;H=h;}, setPlatform: (version,storage) => {platformVersion=version;platformStorage=storage;}, nextChallenge };
})();`;
  vm.runInContext(source,sandbox);
  return { ...sandbox.window.test, sandbox, data, elements, dispatch, setClock: value => {clockNow=value;}, flushStorage: () => vm.runInContext("Promise.resolve()",sandbox) };
};
