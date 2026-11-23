/* ==========================================================================
   20-logic-programs.js  –  TRAININGSLOGIK (keine UI, kein DOM)
   - Referenztraining (feste Liste) und "intelligenter" Zufallsmodus (Regeln aus App.Data.AREAS)
   - Rahmenbedingungen (ohne Springen, knieschonend, Handgelenke schonen, vorhandenes Material)
   - Ganzkörper: Auswahl nach Bewegungsmustern; gleiche Muster werden innerhalb eines Bereichs seltener gewählt
   - HIIT-Übungen laufen immer zuerst im HIIT-Intervall, danach die Kraftübungen im gewählten Stil
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
      const w = items.map(x => weightOf(x, out)), sum = w.reduce((x, y) => x + y, 0);
      let r = rnd() * sum, i = 0;
      while (i < items.length - 1 && r >= w[i]) { r -= w[i]; i++; }
      out.push(items.splice(i, 1)[0]);
    }
    return out;
  }

  /** Material -> Ausstattung (eine der Alternativen genügt). Wand, Matte, Handtuch und optionales Material sind immer verfügbar. */
  const GEAR = [['KH', /hantel/i], ['KB', /kettlebell/i], ['Band', /band/i], ['Stange', /stange/i], ['Stuhl', /bank|stuhl|stufe|hocker/i]];
  const gearNeeds = ex => ex.equipment.filter(q => !/optional/i.test(q)).map(q => GEAR.filter(g => g[1].test(q)).map(g => g[0])).filter(a => a.length);

  /**
   * Erfüllt eine Übung die Rahmenbedingungen?
   * f = { noJump, kneeFriendly, wristFriendly, gear: { KH, KB, Band, Stange, Stuhl } } (null = alles erlaubt außer Befestigung)
   */
  function allowed(ex, f) {
    if (App.Config.excludeAnchored && ex.needsAnchor) return false;
    if (!f) return true;
    const fl = ex.flags || {};
    if ((f.noJump && fl.jump) || (f.kneeFriendly && fl.knee) || (f.wristFriendly && fl.wrist)) return false;
    return !f.gear || gearNeeds(ex).every(alts => alts.some(k => f.gear[k]));
  }

  /** Mögliche Gewichte (kg) für die Auswahl am Trainingsende; leer = Übung ohne Hantel/Kettlebell. */
  function kgOptions(ex) {
    const s = (ex.equipment || []).join(' '), K = App.Config.kg;
    return (/hantel/i.test(s) ? K.KH : []).concat(/kettlebell/i.test(s) ? K.KB : []);
  }

  /**
   * Zufallsprogramm für einen Bereich nach den Slot-Regeln: { sub, n } = Unterkategorie, { pat: [...], n } = Bewegungsmuster (Ganzkörper).
   * Gewichtung: Bewertung · kürzlich trainiert ×0.25 · gleiches Bewegungsmuster schon gewählt ×0.3 · vorhandene Gewichte ×1.5.
   * Lassen die Rahmenbedingungen zu wenig übrig, wird aus dem ganzen Bereich aufgefüllt.
   */
  function randomForArea(area, ctx) {
    const recent = recentIds(ctx.history, 3), f = ctx.filter, rt = ctx.ratings || {}, used = ctx.used, chosen = {};
    const inArea = e => area.slots[0].pat ? e.category !== 'hiit' : e.category === area.id;
    const fits = (e, s) => inArea(e) && (s.pat ? s.pat.indexOf(e.pattern) >= 0 : e.subCategory === s.sub);
    const loaded = e => f && f.gear && /^(KH|KB|KH\/KB)$/.test(e.load) ? 1.5 : 1;
    const weight = (e, out) => (recent[e.id] ? 0.25 : 1) * ratingWeight(rt[e.id]) * loaded(e) *
      (chosen[e.pattern] || out.some(o => o.pattern === e.pattern) ? 0.3 : 1);
    const ids = [];
    area.slots.forEach(function (slot) {
      let got = pickWeighted(D.EXERCISES.filter(e => fits(e, slot) && !used[e.id] && allowed(e, f)), slot.n, weight, ctx.rnd);
      if (got.length < slot.n) got = got.concat(pickWeighted(D.EXERCISES.filter(e => inArea(e) && !used[e.id] && got.indexOf(e) < 0 && allowed(e, f)), slot.n - got.length, weight, ctx.rnd));
      got.forEach(e => { used[e.id] = true; chosen[e.pattern] = true; ids.push(e.id); });
    });
    return ids;
  }
  const slotCount = area => area.slots.reduce((s, x) => s + x.n, 0);

  /**
   * Erstellt ein Kraftprogramm.
   * opts: { areaIds: ['hiit','upper',..], programType: 'random'|'reference', history: [...], ratings: {id: 0-5}, filter: {...}, rnd: fn }
   * Rückgabe (Program): { id, type, areaIds, exerciseIds, areaOf } – areaOf[i] = Bereich, aus dem Übung i gewählt wurde (Ganzkörper mischt Kategorien).
   * Keine Übung kommt doppelt vor, auch wenn mehrere Bereiche gewählt sind.
   * Referenztraining ignoriert die Bereichsauswahl (immer alle 3 Kraftbereiche, immer dieselben Übungen).
   */
  function buildProgram(opts) {
    if (opts.programType === 'reference') return { id: 'ref-' + Date.now(), type: 'reference', areaIds: ['upper', 'core', 'lower'], exerciseIds: D.REFERENCE.slice() };
    const ctx = { history: opts.history, ratings: opts.ratings, filter: opts.filter || null, rnd: opts.rnd || Math.random, used: {} };
    const order = D.AREAS.map(a => a.id).filter(id => opts.areaIds.indexOf(id) >= 0);   // feste Reihenfolge
    let ids = [], areaOf = [];
    order.forEach(function (id) {
      const got = randomForArea(areaById(id), ctx);
      ids = ids.concat(got); areaOf = areaOf.concat(got.map(() => id));
    });
    return { id: 'prog-' + Date.now(), type: 'random', areaIds: order, exerciseIds: ids, areaOf: areaOf };
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
  function buildBlocks(program, mode, offsets, hiitMode) {
    const items = program.items || program.exerciseIds.map(id => ({ id: id }));
    const isH = it => D.byId[it.id].category === 'hiit';
    const h = mode.kind === 'strength' && mode.id !== 'hiit' ? items.filter(isH) : [];
    if (!h.length) return blocksFor(items, mode, offsets);
    // HIIT-Teil (steht im Programm immer vorne) im Intervall, danach Kraft im gewählten Stil; Indizes über das ganze Programm
    const rest = items.filter(it => !isH(it)), n = items.length;
    const hb = blocksFor(h, hiitMode || D.modeById('hiit'), offsets), sb = rest.length ? blocksFor(rest, mode, offsets) : [];
    hb.forEach(b => { b.exerciseCount = n; if (b.nextEx === null && rest.length) b.nextEx = D.byId[rest[0].id]; });
    sb.forEach(b => { b.exerciseIndex += h.length; b.exerciseCount = n; });
    return hb.concat(sb);
  }

  function blocksFor(items, mode, offsets) {
    const blocks = [], off = id => (offsets && offsets[id]) || 0;
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
  const CANON = [[/^kurzhantel/i, 'Kurzhanteln'], [/^(bank|stufe|stuhl)/i, 'Hocker / Bank / Stuhl'], [/^band/i, 'Band / Kabel (befestigt)'], [/^gummiband/i, 'Gummiband'],
    [/^matte/i, 'Matte'], [/^klimmzug/i, 'Klimmzugstange'], [/^kettlebell/i, 'Kettlebell'], [/^wand/i, 'freie Wand']];
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

  return { allowed: allowed, kgOptions: kgOptions, slotCount: slotCount, buildProgram: buildProgram, buildStretch: buildStretch, stretchForAreas: stretchForAreas,
    buildBlocks: buildBlocks, totalSeconds: totalSeconds, equipmentSummary: equipmentSummary, ratingWeight: ratingWeight, areaById: areaById };
})();
