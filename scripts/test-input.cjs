const assert = require('node:assert/strict');
const harness = require('./game-harness.cjs');
const t = harness();
t.markIntroSeen();
t.applyLevel(1);
t.resetGame(true);
const point = (pointerId, clientX = 300, clientY = 422) => ({ pointerId, clientX, clientY });

t.dispatch('#wheelPad', 'pointerdown', point(1));
t.dispatch('#wheelPad', 'pointermove', point(1, 195, 600));
assert(t.input.steer > 0, 'first pointer turns the wheel');
t.dispatch('#wheelPad', 'lostpointercapture', point(1));
assert.equal(t.input.steerPointer, null, 'unexpected capture loss releases the wheel');
assert.equal(t.input.steerTarget, 0, 'capture loss starts automatic centering');
const releasedSteer = t.input.steer;
t.dispatch('#wheelPad', 'pointermove', point(1, 90, 422));
assert.equal(t.input.steer, releasedSteer, 'moves after capture loss cannot keep steering');
t.update(.034, 0);
assert(t.input.steer < releasedSteer, 'wheel returns toward center after capture loss');

t.dispatch('#wheelPad', 'pointerdown', point(2));
t.dispatch('#wheelPad', 'pointerdown', point(3));
assert.equal(t.input.steerPointer, 2, 'extra finger cannot steal the steering wheel');
t.dispatch('#wheelPad', 'pointerup', point(3));
assert.equal(t.input.steerPointer, 2, 'unrelated release leaves steering active');
t.dispatch('#wheelPad', 'pointercancel', point(2));
assert.equal(t.input.steerPointer, null, 'pointer cancellation releases steering');

for (const [id, key] of [['#gas', 'gas'], ['#brake', 'brake']]) {
  t.dispatch(id, 'pointerdown', point(10));
  t.dispatch(id, 'pointerdown', point(11));
  t.dispatch(id, 'pointerup', point(11));
  assert.equal(t.input[key], true, 'extra finger release leaves the held pedal active');
  t.dispatch(id, 'lostpointercapture', point(11));
  assert.equal(t.input[key], true, 'unrelated capture loss leaves the pedal active');
  t.dispatch(id, 'pointercancel', point(10));
  assert.equal(t.input[key], false, 'owner cancellation releases the pedal');
  t.dispatch(id, 'pointerdown', point(12));
  t.pauseGame();
  t.resumeGame();
  t.dispatch(id, 'pointerdown', point(13));
  t.dispatch(id, 'lostpointercapture', point(12));
  assert.equal(t.input[key], true, 'stale loss after pause cannot release a new press');
  t.dispatch(id, 'lostpointercapture', point(13));
  assert.equal(t.input[key], false, 'owner capture loss releases the pedal');
}

t.dispatch('#wheelPad', 'pointerdown', point(20));
t.dispatch('#gas', 'pointerdown', point(21));
assert.equal(t.input.steerPointer, 20);
assert.equal(t.input.gas, true, 'wheel and pedal remain independently active');
t.dispatch('#wheelPad', 'pointerup', point(20));
assert.equal(t.input.gas, true, 'wheel release does not release the pedal');
t.dispatch('#gas', 'pointerup', point(21));
console.log('PASS input: capture loss and centering, extra fingers, cancellation, stale capture after pause, independent wheel and pedal');
