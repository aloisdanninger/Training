/* ==========================================================================
   12-data-modes.js  –  DATEN: Trainingsstile (TrainingMode)
   Ein Modus beschreibt, wie EINE Übung in zeitliche Blöcke zerlegt wird.
   Block = { type: 'prepare'|'work'|'rest', label, duration (s), exercise,
             motion(t) -> { p: 0..1 Bewegungsfortschritt, cue: Phasentext },
             sound: Signal beim Start des Blocks }
   Neuen Stil ergänzen = neuen Eintrag in App.Data.MODES (buildBlocks).
   ========================================================================== */
App.Data.MODES = (function () {
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const ease = x => x * x * (3 - 2 * x);

  /** Kieser: 4 s Belastung · 2 s Halten · 4 s Rückbewegung · 2 s Halten, wiederholt bis `total` s. */
  function kieserMotion(t) {
    const s = t % 12;
    if (s < 4) return { p: s / 4, cue: 'Belastung' };
    if (s < 6) return { p: 1, cue: 'Halten' };
    if (s < 10) return { p: 1 - (s - 6) / 4, cue: 'Rückbewegung' };
    return { p: 0, cue: 'Halten' };
  }

  /** Klassisch: kontinuierliche Wiederholungen, eine Wiederholung dauert 3 s. */
  function loopMotion(t) { const k = (t % 3) / 3; return { p: k < 0.5 ? ease(k * 2) : ease(2 - k * 2), cue: 'Los!' }; }

  /** Dehnung: langsam in die Dehnung gleiten (6 s), dann halten. */
  function stretchMotion(t) { return { p: ease(clamp01(t / 6)), cue: t < 6 ? 'In die Dehnung gehen' : 'Halten & ruhig atmen' }; }

  const prepare = (ex, secs) => ({ type: 'prepare', label: 'Bereit machen', duration: secs, exercise: ex, sound: null,
    motion: () => ({ p: 0, cue: 'Gleich geht es los' }) });

  function kieser(total) {
    return {
      id: 'kieser' + total, label: 'Kieser ' + total + ' Sekunden', kind: 'strength',
      buildBlocks: ex => [prepare(ex, App.Config.prepareSeconds),
        { type: 'work', label: 'Belastung', duration: total, exercise: ex, sound: 'double', endSound: 'double', motion: kieserMotion }]
    };
  }

  return [
    kieser(90),
    kieser(120),
    {
      id: 'classic3', label: 'Klassisch 3 Sätze', kind: 'strength',
      buildBlocks: function (ex) {
        const out = [prepare(ex, App.Config.prepareSeconds)];
        for (let s = 1; s <= 3; s++) {
          out.push({ type: 'work', label: 'Satz ' + s + ' / 3', duration: 30, exercise: ex, sound: 'double', endSound: 'double', motion: loopMotion });
          if (s < 3) out.push({ type: 'rest', label: 'Pause', duration: 10, exercise: ex, sound: null, motion: () => ({ p: 0, cue: 'Pause' }) });
        }
        return out;
      }
    },
    {
      id: 'stretch', label: 'Dehnen', kind: 'stretch',
      buildBlocks: function (ex, ctx) {
        return [prepare(ex, 5), { type: 'work', label: 'Dehnen', duration: (ctx && ctx.secondsEach) || 60, exercise: ex, sound: 'double', endSound: 'double', motion: stretchMotion }];
      }
    }
  ];
})();
App.Data.modeById = id => App.Data.MODES.filter(m => m.id === id)[0];
