/* ==========================================================================
   50-audio.js  –  Akustische Signale (WebAudio, keine Audiodateien)
   Auf iOS muss der AudioContext durch eine Nutzergeste entsperrt werden: unlock().
   Signale: ping (einfach) | double (Doppelping) | finish (Trainingsende)
   ========================================================================== */
App.Audio = (function () {
  let ctx = null, enabled = false;
  const PATTERNS = {            // [Frequenz Hz, Dauer s, Pause bis zum nächsten Ton s]
    ping:   [[988, 0.12, 0]],                          // Restzeit-Hinweis (60/30/10/3/2/1 s)
    double: [[988, 0.12, 0.1], [988, 0.12, 0]],        // Start und Ende einer Übung bzw. eines Satzes
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
