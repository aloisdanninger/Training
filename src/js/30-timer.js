/* ==========================================================================
   30-timer.js  –  TIMER (kennt weder DOM noch Übungen, nur Blöcke)
   Arbeitet mit Zeitstempeln statt Tick-Zählung -> bleibt korrekt, wenn der Browser
   im Hintergrund drosselt. `advance(dt)` ist die Kernlogik und direkt testbar.
   Callbacks: onTick(state), onBlockStart(block, index), onBlockEnd(block, index), onFinish()
   ========================================================================== */
App.Timer = function (blocks, cb) {
  let index = 0, elapsed = 0, running = false, finished = false, last = 0, raf = 0, iv = 0, started = false;
  const noop = function () {};
  cb = Object.assign({ onTick: noop, onBlockStart: noop, onBlockEnd: noop, onFinish: noop }, cb);

  function state() {
    const b = blocks[Math.min(index, blocks.length - 1)];
    return { index: index, block: b, elapsed: elapsed, remaining: Math.max(0, b.duration - elapsed),
      running: running, finished: finished, motion: b.motion(Math.min(elapsed, b.duration)) };
  }

  /** Zeit um dt Sekunden vorrücken; wechselt Blöcke, auch über mehrere Blockgrenzen. */
  function advance(dt) {
    if (finished) return;
    if (!started) { started = true; cb.onBlockStart(blocks[0], 0); }
    elapsed += dt;
    while (!finished && elapsed >= blocks[index].duration) {
      elapsed -= blocks[index].duration;
      cb.onBlockEnd(blocks[index], index);
      index++;
      if (index >= blocks.length) { finished = true; running = false; index = blocks.length - 1; elapsed = blocks[index].duration; stopLoops(); cb.onFinish(); return; }
      cb.onBlockStart(blocks[index], index);
    }
    cb.onTick(state());
  }

  function frame() {
    if (!running) return;
    const now = performance.now(); advance((now - last) / 1000); last = now;
    raf = requestAnimationFrame(frame);
  }
  function poll() { if (running) { const now = performance.now(); advance((now - last) / 1000); last = now; } }
  function stopLoops() { cancelAnimationFrame(raf); clearInterval(iv); }

  return {
    start: function () { if (running || finished) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); iv = setInterval(poll, 250); if (!started) advance(0); },
    pause: function () { if (!running) return; poll(); running = false; stopLoops(); cb.onTick(state()); },
    stop: function () { running = false; finished = true; stopLoops(); },
    /** Springt zum Beginn des nächsten Blocks. */
    skip: function () { if (!finished) advance(blocks[index].duration - elapsed); },
    advance: advance, state: state, isRunning: () => running, isFinished: () => finished
  };
};
