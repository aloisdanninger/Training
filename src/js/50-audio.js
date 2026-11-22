/* ==========================================================================
   50-audio.js  –  Akustische Signale (WebAudio, keine Audiodateien)
   Auf iOS muss der AudioContext durch eine Nutzergeste entsperrt werden: unlock().
   Signale: ping (einfach) | double (Doppelping) | finish (Trainingsende)
   ========================================================================== */
App.Audio = (function () {
  let ctx = null, enabled = false, volume = 1, bus = null;
  const PATTERNS = {            // [Frequenz Hz, Dauer s, Pause bis zum nächsten Ton s]
    ping:   [[1320, 0.18, 0]],                         // Restzeit-Hinweis (60/30/10/3/2/1 s)
    double: [[1320, 0.16, 0.08], [1320, 0.16, 0]],        // Start und Ende einer Übung bzw. eines Satzes
    finish: [[523, 0.15, 0.18], [659, 0.15, 0.18], [784, 0.15, 0.18], [1047, 0.35, 0]]
  };
  /** iOS 16.4+: 'ambient' mischt die Pings über laufende Musik/Podcasts (statt sie zu unterbrechen). */
  function mixWithOthers() { try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (e) { /* optional */ } }
  function unlock() {
    try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state !== 'running') ctx.resume(); } catch (e) { ctx = null; }
    if (enabled) mixWithOthers();
  }
  function play(name) {
    if (!enabled || !ctx || !PATTERNS[name]) return;
    if (ctx.state !== 'running') ctx.resume();
    if (!bus) {   // Kompressor als Begrenzer, damit die Pings laut und trotzdem unverzerrt sind
      bus = ctx.createDynamicsCompressor(); bus.threshold.value = -6; bus.ratio.value = 12; bus.attack.value = 0.002; bus.release.value = 0.1;
      bus.connect(ctx.destination);
    }
    let t = ctx.currentTime;
    PATTERNS[name].forEach(function (n) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = n[0];   // Rechteck: durchsetzungsstark gegenüber Musik
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.001, 0.6 * volume), t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + n[1]);
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + n[1] + 0.05);
      t += n[1] + n[2];
    });
  }
  return { unlock: unlock, play: play, setVolume: function (v) { volume = Math.max(0.1, Math.min(1, +v || 1)); }, setEnabled: function (v) { enabled = !!v; if (enabled) unlock(); }, isEnabled: () => enabled };
})();
