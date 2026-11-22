/* ==========================================================================
   20-logic-programs.js  –  TRAININGSLOGIK (keine UI, kein DOM)
   - Standardprogramme und "intelligenter" Zufallsmodus (Regeln aus App.Data.AREAS)
   - Dehnprogramm-Auswahl
   - Umwandlung eines Programms in zeitliche Blöcke für den Timer
   ========================================================================== */
App.Programs = (function () {
  const D = App.Data;
  const areaById = id => D.AREAS.filter(a => a.id === id)[0];

  /** Kürzlich trainierte Übungen werden seltener gewählt (Abwechslung). */
  function recentIds(history, n) {
    const ids = {};
    (history || []).slice(-n).forEach(s => (s.exerciseIds || []).forEach(id => { ids[id] = true; }));
    return ids;
  }

  /** Gewichtete Zufallsauswahl von `n` verschiedenen Elementen. */
  function pickWeighted(pool, n, weightOf, rnd) {
    const items = pool.slice(), out = [];
    while (out.length < n && items.length) {
      const w = items.map(weightOf), sum = w.reduce((x, y) => x + y, 0);
      let r = rnd() * sum, i = 0;
      while (i < items.length - 1 && r >= w[i]) { r -= w[i]; i++; }
      out.push(items.splice(i, 1)[0]);
    }
    return out;
  }

  /** Zufallsprogramm für einen Bereich: strikt nach den Slot-Regeln (2/2/1). */
  function randomForArea(area, history, rnd) {
    const recent = recentIds(history, 3);
    let ids = [];
    area.slots.forEach(function (slot) {
      const pool = D.EXERCISES.filter(e => e.category === area.id && e.subCategory === slot.sub);
      ids = ids.concat(pickWeighted(pool, slot.n, e => (recent[e.id] ? 0.25 : 1), rnd).map(e => e.id));
    });
    return ids;
  }

  /**
   * Erstellt ein Kraftprogramm.
   * opts: { areaIds: ['upper',..], programType: 'standard'|'random', history: [...], rnd: fn }
   * Rückgabe (Program): { id, type, areaIds, exerciseIds }
   */
  function buildProgram(opts) {
    const rnd = opts.rnd || Math.random;
    const order = D.AREAS.map(a => a.id).filter(id => opts.areaIds.indexOf(id) >= 0);   // feste Reihenfolge
    let ids = [];
    order.forEach(function (id) {
      const a = areaById(id);
      ids = ids.concat(opts.programType === 'random' ? randomForArea(a, opts.history, rnd) : a.standard);
    });
    return { id: 'prog-' + Date.now(), type: opts.programType, areaIds: order, exerciseIds: ids };
  }

  /** Passendes Dehnprogramm zu trainierten Bereichen (mehrere Bereiche -> aneinandergehängt). */
  function stretchForAreas(areaIds) {
    const progs = D.STRETCH_PROGRAMS.filter(p => p.forAreas.some(a => areaIds.indexOf(a) >= 0));
    return buildStretch(progs.map(p => p.id));
  }

  /** StretchProgram aus einer oder mehreren Programm-IDs. */
  function buildStretch(programIds) {
    const progs = programIds.map(id => D.STRETCH_PROGRAMS.filter(p => p.id === id)[0]).filter(Boolean);
    const items = [];
    progs.forEach(p => p.exerciseIds.forEach(id => items.push({ id: id, secondsEach: p.secondsEach })));
    return { id: 'stretch-' + Date.now(), type: 'stretch', label: progs.map(p => p.label).join(' + '),
      areaIds: [], exerciseIds: items.map(i => i.id), items: items };
  }

  /**
   * Programm + Modus -> flache Blockliste (TrainingSession-Ablauf).
   * Jeder Block erhält exerciseIndex/exerciseCount für die Anzeige.
   */
  function buildBlocks(program, mode) {
    const blocks = [];
    const items = program.items || program.exerciseIds.map(id => ({ id: id }));
    items.forEach(function (it, i) {
      mode.buildBlocks(D.byId[it.id], { secondsEach: it.secondsEach }).forEach(function (b) {
        b.exerciseIndex = i; b.exerciseCount = items.length; blocks.push(b);
      });
    });
    return blocks;
  }

  const totalSeconds = blocks => blocks.reduce((s, b) => s + b.duration, 0);

  return { buildProgram: buildProgram, buildStretch: buildStretch, stretchForAreas: stretchForAreas,
    buildBlocks: buildBlocks, totalSeconds: totalSeconds, areaById: areaById };
})();
