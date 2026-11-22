/* ==========================================================================
   12-data-modes.js  –  DATEN: Trainingsstile (TrainingMode)
   Ein Modus beschreibt, wie Übungen in zeitliche Blöcke zerlegt werden.
   Block = { type: 'prepare'|'work'|'rest', label, duration (s), exercise,
             motion(t) -> { p: 0..1 Bewegungsfortschritt, cue: Phasentext },
             sound: Signal beim Start, endSound: Signal am Ende }
   Zwei Bauarten:
     buildBlocks(ex, ctx)   – pro Übung (Kieser, Klassisch, Dehnen); ctx.offset = Anpassung in s (Schwierigkeitsbewertung)
     buildAll(entries)      – für das ganze Programm auf einmal (Zirkel); entries = [{ ex, offset }]
   Die Dauer-Parameter kommen aus den Einstellungen: App.Data.modeById(id, settings).
   Neuen Stil ergänzen = neuen Eintrag in MODES + Zweig in modeById + Regler in App.Config/UI.
   ========================================================================== */
App.Data.MODES = (function () {
  const C = App.Config;
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const ease = x => x * x * (3 - 2 * x);
  const dur = (secs, off) => Math.max(C.minSeconds, secs + (off || 0));

  /** Kieser: 4 s Belastung · 2 s Halten · 4 s Rückbewegung · 2 s Halten, wiederholt bis `total` s. */
  function kieserMotion(t) {
    const s = t % 12;
    if (s < 4) return { p: s / 4, cue: 'Belastung' };
    if (s < 6) return { p: 1, cue: 'Halten' };
    if (s < 10) return { p: 1 - (s - 6) / 4, cue: 'Rückbewegung' };
    return { p: 0, cue: 'Halten' };
  }

  /** Klassisch/Zirkel: kontinuierliche Wiederholungen, eine Wiederholung dauert 5 s (langsam, kontrolliert). */
  function loopMotion(t) { const k = (t % 5) / 5; return { p: k < 0.5 ? ease(k * 2) : ease(2 - k * 2), cue: 'Los!' }; }

  /** Dehnung: langsam in die Dehnung gleiten (9 s), dann halten. */
  function stretchMotion(t) { return { p: ease(clamp01(t / 9)), cue: t < 9 ? 'In die Dehnung gehen' : 'Halten & ruhig atmen' }; }

  const prepare = (ex, secs) => ({ type: 'prepare', label: 'Bereit machen', duration: secs, exercise: ex, sound: null,
    motion: () => ({ p: 0, cue: 'Gleich geht es los' }) });
  const work = (ex, label, secs, motion) => ({ type: 'work', label: label, duration: secs, exercise: ex, sound: 'double', endSound: 'double', motion: motion });
  const rest = (ex, label, secs, cue) => ({ type: 'rest', label: label, duration: secs, exercise: ex, sound: null, motion: () => ({ p: 0, cue: cue }) });

  function kieser(total) {
    return {
      id: 'kieser', short: 'Kieser', label: 'Kieser ' + total + ' Sekunden', kind: 'strength',
      buildBlocks: (ex, ctx) => [prepare(ex, C.prepareSeconds), work(ex, 'Belastung', dur(total, ctx && ctx.offset), kieserMotion)]
    };
  }

  /** Klassisch: `sets` Sätze à `secs` Sekunden mit kurzer Pause. */
  function classic(sets, secs) {
    return {
      id: 'classic', short: 'Klassisch', label: 'Klassisch ' + sets + ' × ' + secs + ' s', kind: 'strength',
      buildBlocks: function (ex, ctx) {
        const out = [prepare(ex, C.prepareSeconds)];
        for (let s = 1; s <= sets; s++) {
          out.push(work(ex, 'Satz ' + s + ' / ' + sets, dur(secs, ctx && ctx.offset), loopMotion));
          if (s < sets) out.push(rest(ex, 'Pause', C.classic.rest, 'Pause'));
        }
        return out;
      }
    };
  }

  /**
   * Zirkel: alle Übungen nacheinander je `secs` Sekunden, kurzer Wechsel dazwischen,
   * nach jeder Runde eine längere Pause. Eine Übung gilt nach ihrer Arbeitsphase in der letzten Runde als erledigt.
   */
  function circuit(rounds, secs) {
    return {
      id: 'circuit', short: 'Zirkel', label: 'Zirkel ' + rounds + ' Runden × ' + secs + ' s', kind: 'strength',
      buildAll: function (entries) {
        const n = entries.length, out = [];
        const tag = (b, i, end, next) => { b.exerciseIndex = i; b.exerciseCount = n; b.exerciseEnd = !!end; b.nextEx = next; return b; };
        out.push(tag(prepare(entries[0].ex, C.prepareSeconds), 0, false, n > 1 ? entries[1].ex : null));
        for (let r = 1; r <= rounds; r++) {
          for (let i = 0; i < n; i++) {
            const lastOfAll = r === rounds && i === n - 1;
            const next = i + 1 < n ? entries[i + 1] : (r < rounds ? entries[0] : null);
            out.push(tag(work(entries[i].ex, 'Runde ' + r + ' / ' + rounds, dur(secs, entries[i].offset), loopMotion), i, r === rounds, next && next.ex));
            if (lastOfAll) continue;
            if (i + 1 < n) out.push(tag(rest(entries[i + 1].ex, 'Wechsel', C.circuit.transition, 'Weiter: ' + entries[i + 1].ex.name), i + 1, false, entries[i + 1].ex));
            else out.push(tag(rest(entries[0].ex, 'Pause', C.circuit.roundRest, 'Pause vor Runde ' + (r + 1)), 0, false, entries[0].ex));
          }
        }
        return out;
      }
    };
  }

  App.Data.modeFactories = { kieser: kieser, classic: classic, circuit: circuit };
  return [
    kieser(C.kieser.def),
    classic(C.classic.sets.def, C.classic.seconds.def),
    circuit(C.circuit.rounds.def, C.circuit.seconds.def),
    {
      id: 'stretch', short: 'Dehnen', label: 'Dehnen', kind: 'stretch',
      buildBlocks: function (ex, ctx) {
        return [prepare(ex, 5), work(ex, 'Dehnen', (ctx && ctx.secondsEach) || 60, stretchMotion)];
      }
    }
  ];
})();

/** Modus per ID; `st` = Einstellungen (kieserSeconds, classicSets, classicSeconds, circuitRounds, circuitSeconds). */
App.Data.modeById = function (id, st) {
  const C = App.Config, f = App.Data.modeFactories; st = st || {};
  if (id === 'kieser') return f.kieser(st.kieserSeconds || C.kieser.def);
  if (id === 'classic') return f.classic(st.classicSets || C.classic.sets.def, st.classicSeconds || C.classic.seconds.def);
  if (id === 'circuit') return f.circuit(st.circuitRounds || C.circuit.rounds.def, st.circuitSeconds || C.circuit.seconds.def);
  return App.Data.MODES.filter(m => m.id === id)[0];
};
