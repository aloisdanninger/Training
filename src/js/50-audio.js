/* ==========================================================================
   50-audio.js  –  Akustische Signale (WebAudio, keine Audiodateien)
   Auf iOS muss der AudioContext durch eine Nutzergeste entsperrt werden: unlock().
   Signale: start | set | end (Ende Übung) | finish (Trainingsende)
   ========================================================================== */
App.Audio = (function () {
  let ctx = null, enabled = false;
  const PATTERNS = {            // [Frequenz Hz, Dauer s, Pause bis zum nächsten Ton s]
    start:  [[880, 0.18, 0.0]],
    set:    [[660, 0.12, 0.16], [880, 0.18, 0]],
    end:    [[880, 0.12, 0.16], [660, 0.2, 0]],
    finish: [[523, 0.15, 0.18], [659, 0.15, 0.18], [784, 0.15, 0.18], [1047, 0.35, 0]]
  };
  function unlock() {
    try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); } catch (e) { ctx = null; }
  }
  function play(name) {
    if (!enabled || !ctx || !PATTERNS[name]) return;
    let t = ctx.currentTime;
    PATTERNS[name].forEach(function (n) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = n[0];
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + n[1]);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + n[1] + 0.05);
      t += n[1] + n[2];
    });
  }
  return { unlock: unlock, play: play, setEnabled: function (v) { enabled = !!v; if (enabled) unlock(); }, isEnabled: () => enabled };
})();
