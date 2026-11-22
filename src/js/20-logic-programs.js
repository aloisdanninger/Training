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

  /** Gewicht einer Bewertung (0 = unbewertet = neutral wie 3 Sterne). Hohe Bewertung -> häufiger. */
  const RATING_WEIGHT = { 1: 0.25, 2: 0.6, 3: 1, 4: 1.8, 5: 3 };
  const ratingWeight = r => RATING_WEIGHT[r] || 1;

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
  function randomForArea(area, history, rnd, ratings) {
    const recent = recentIds(history, 3), excl = App.Config.excludeAnchored;
    let ids = [];
    area.slots.forEach(function (slot) {
      const pool = D.EXERCISES.filter(e => e.category === area.id && e.subCategory === slot.sub && !(excl && e.needsAnchor));
      ids = ids.concat(pickWeighted(pool, slot.n, e => (recent[e.id] ? 0.25 : 1) * ratingWeight((ratings || {})[e.id]), rnd).map(e => e.id));
    });
    return ids;
  }

  /**
   * Erstellt ein Kraftprogramm.
   * opts: { areaIds: ['upper',..], programType: 'standard'|'random', history: [...], ratings: {id: 0-5}, rnd: fn }
   * Rückgabe (Program): { id, type, areaIds, exerciseIds }
   */
  function buildProgram(opts) {
    const rnd = opts.rnd || Math.random;
    const order = D.AREAS.map(a => a.id).filter(id => opts.areaIds.indexOf(id) >= 0);   // feste Reihenfolge
    let ids = [];
    order.forEach(function (id) {
      const a = areaById(id);
      ids = ids.concat(opts.programType === 'random' ? randomForArea(a, opts.history, rnd, opts.ratings) : a.standard);
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
  function buildBlocks(program, mode, offsets) {
    const blocks = [], off = id => (offsets && offsets[id]) || 0;
    const items = program.items || program.exerciseIds.map(id => ({ id: id }));
    if (mode.buildAll) return mode.buildAll(items.map(it => ({ ex: D.byId[it.id], offset: off(it.id) })));   // z. B. Zirkel
    items.forEach(function (it, i) {
      const bl = mode.buildBlocks(D.byId[it.id], { secondsEach: it.secondsEach, offset: off(it.id) });
      bl.forEach(function (b) { b.exerciseIndex = i; b.exerciseCount = items.length; b.exerciseEnd = false; blocks.push(b); });
      bl[bl.length - 1].exerciseEnd = true;           // letzter Block einer Übung (für Zählung/Abschluss)
    });
    return blocks;
  }

  const totalSeconds = blocks => blocks.reduce((s, b) => s + b.duration, 0);

  /** Kanonische Materialnamen (Schreibvarianten in den Daten werden zusammengeführt). */
  const CANON = [[/^kurzhantel/i, 'Kurzhanteln'], [/^(bank|stufe)/i, 'Hocker / Bank / Stuhl'], [/^band/i, 'Gummiband / Kabel'],
    [/^matte/i, 'Matte'], [/^trx/i, 'TRX / Schlingentrainer'], [/^kettlebell/i, 'Kettlebell'], [/^wand/i, 'freie Wand']];
  const canon = n => { const c = CANON.filter(x => x[0].test(n))[0]; return c ? c[1] : n.replace(/\s*\(optional\)/, ''); };

  /**
   * Materialübersicht für eine Liste von Übungs-IDs.
   * Rückgabe: [{ item, optional, weights: {leicht:[namen],..}|null, usedBy:[namen] }]
   * "optional" = nur optional benötigt; Hanteln werden nach Gewichtsklasse gruppiert.
   */
  function equipmentSummary(exerciseIds) {
    const map = {}, order = [];
    exerciseIds.forEach(function (id) {
      const ex = D.byId[id];
      (ex.equipment || []).forEach(function (raw) {
        const item = canon(raw), opt = /optional/i.test(raw);
        if (!map[item]) { map[item] = { item: item, optional: true, weights: null, usedBy: [] }; order.push(item); }
        const m = map[item]; if (!opt) m.optional = false;
        if (m.usedBy.indexOf(ex.name) < 0) m.usedBy.push(ex.name);
        if (ex.weight && /hantel|kettlebell/i.test(item)) { m.weights = m.weights || {}; (m.weights[ex.weight] = m.weights[ex.weight] || []).push(ex.name); }
      });
    });
    const rank = { 'Matte': 0, 'Kurzhanteln': 1, 'Kettlebell': 2 };
    return order.map(k => map[k]).sort((a, b) => (rank[a.item] == null ? 9 : rank[a.item]) - (rank[b.item] == null ? 9 : rank[b.item]));
  }

  return { buildProgram: buildProgram, buildStretch: buildStretch, stretchForAreas: stretchForAreas,
    buildBlocks: buildBlocks, totalSeconds: totalSeconds, equipmentSummary: equipmentSummary, ratingWeight: ratingWeight, areaById: areaById };
})();
