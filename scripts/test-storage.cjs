const assert = require('node:assert/strict');
const harness = require('./game-harness.cjs');

const campaignKey = 'parking-game.campaign.v2';
const freeKey = 'parking-game.free.v2';
const growthKey = 'parking-game.growth.v1';
const saved = { clears: 5, plays: 7, bestStars: 3, bestTime: 20 };
function fixture({ initial = {}, local = {}, failing = [], heldKey = '' } = {}) {
  const native = { ...initial };
  const failures = new Set(failing);
  const writes = [];
  const held = [];
  const api = {
    getStorage(options) {
      if (failures.has(options.key)) options.fail(new Error('transient native read failure'));
      else if (options.key === heldKey) held.push(options);
      else options.success({ data: native[options.key] || null });
    },
    setStorage(options) {
      writes.push(options.key);
      native[options.key] = options.data;
      options.success({});
    },
  };
  const t = harness(local, '', 'https:', null, {
    xhs: { launchOptions: { miniToolEnv: { buildVersion: 9500000 } }, miniTool: api },
  });
  return { ...t, native, failures, writes, held };
}
const success = id => ({ levelId: id, success: true, netTime: 30, stars: 2 });
async function ticks() { for (let i = 0; i < 20; i++) await Promise.resolve(); }
// persistGrowth returns the serialized native write queue, including earlier record writes.
async function flush(t) { await t.persistGrowth(); }

(async () => {
  const isolated = fixture({ initial: { [campaignKey]: JSON.stringify({ 16: saved }) }, failing: [growthKey] });
  await isolated.initializeStorage();
  assert.equal(isolated.getProgress()[16].bestStars, 3, 'one failed key does not skip other native records');
  isolated.commitRun(success(1));
  await flush(isolated);
  assert.deepEqual(JSON.parse(isolated.native[campaignKey])[16], saved, 'unrelated read failure preserves earned records');
  assert.equal(JSON.parse(isolated.native[campaignKey])[1].clears, 1);

  const retry = fixture({ initial: { [campaignKey]: JSON.stringify({ 16: saved }) }, failing: [campaignKey] });
  const original = retry.native[campaignKey];
  await retry.initializeStorage();
  await flush(retry);
  retry.commitRun(success(1));
  await flush(retry);
  assert.equal(retry.native[campaignKey], original, 'a key that cannot be read must never be overwritten');
  assert(!retry.writes.includes(campaignKey));
  retry.failures.delete(campaignKey);
  retry.commitRun(success(2));
  await flush(retry);
  const recovered = JSON.parse(retry.native[campaignKey]);
  assert.deepEqual(recovered[16], saved, 'retry merges native data before saving');
  assert.equal(recovered[1].clears, 1, 'unsaved session records survive until the retry');
  assert.equal(recovered[2].clears, 1);

  const corrupt = fixture({ initial: { [campaignKey]: '{invalid JSON' } });
  await corrupt.initializeStorage();
  corrupt.commitRun(success(1));
  await flush(corrupt);
  assert.equal(corrupt.native[campaignKey], '{invalid JSON', 'unparseable native data is preserved for recovery');

  const delayed = fixture({ initial: { [campaignKey]: JSON.stringify({ 16: saved }) }, heldKey: campaignKey });
  const initializing = delayed.initializeStorage();
  await ticks();
  assert.equal(delayed.held.length, 1);
  delayed.commitRun(success(1));
  await ticks();
  assert.equal(delayed.held.length, 1, 'initialization and a pending save share the same read');
  delayed.held[0].success({ data: delayed.native[campaignKey] });
  await initializing;
  await flush(delayed);
  const merged = JSON.parse(delayed.native[campaignKey]);
  assert.equal(merged[1].clears, 1);
  assert.deepEqual(merged[16], saved, 'finishing a run during native loading preserves both record sets');

  const combo = 'car:reverse:easy';
  const stale = { clears: 1, plays: 2, bestStars: 1, bestTime: 50 };
  const migrated = fixture({ initial: { [freeKey]: JSON.stringify({ [combo]: saved }) }, local: { [freeKey]: JSON.stringify({ [combo]: stale }) } });
  await migrated.initializeStorage();
  migrated.game.journey = 'free';
  Object.assign(migrated.game, { vehicle: 'car', mode: 'reverse', difficulty: 'easy' });
  assert.equal(migrated.recordFor('reverse', 'easy').bestTime, 20, 'stale browser data cannot replace a better native free record');
  migrated.commitRun({ vehicle: 'car', mode: 'reverse', difficulty: 'easy', success: false });
  await flush(migrated);
  assert.equal(JSON.parse(migrated.native[freeKey])[combo].bestStars, 3);
  assert.equal(JSON.parse(migrated.native[freeKey])[combo].plays, 8);

  console.log('PASS storage: isolated read failures, no unread/corrupt overwrite, retry recovery, concurrent initialization and save, stale browser/native free-record merge');
})().catch(error => { console.error(error); process.exitCode = 1; });
