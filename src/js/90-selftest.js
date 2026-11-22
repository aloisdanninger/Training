/* ==========================================================================
   90-selftest.js  –  Eingebauter Selbsttest. Aufruf: training.html#selftest
   Ergebnis steht in <pre id="selftest"> und im Seitentitel ("SELFTEST PASS/FAIL").
   Läuft ohne Testframework, auch headless (siehe tests/run-selftest.py).
   ========================================================================== */
App.SelfTest = (function () {
  function run() {
    const out = [], fails = [];
    const check = (name, ok, info) => { out.push((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' – ' + info : '')); if (!ok) fails.push(name); };
    const D = App.Data;

    // 1. Datenmodell: Pflichtfelder
    const req = ['id', 'name', 'category', 'subCategory', 'targetMuscles', 'difficulty', 'equipment', 'description', 'instructions', 'svgAnimation'];
    const all = D.EXERCISES.concat(D.STRETCHES);
    check('Anzahl Kraftübungen = 43', D.EXERCISES.length === 43, D.EXERCISES.length);
    check('Anzahl Dehnübungen = 20', D.STRETCHES.length === 20, D.STRETCHES.length);
    check('Pflichtfelder vollständig', all.every(e => req.every(k => e[k] != null && e[k] !== '')));
    check('IDs eindeutig', new Set(all.map(e => e.id)).size === all.length);
    check('Posen vorhanden und endlich', all.every(function (e) {
      return [e.svgAnimation.a, e.svgAnimation.b].every(function (p) {
        const j = App.Pose.joints(App.Pose.resolve(p)); return [j.head, j.neck].concat(j.near.arm, j.near.leg).every(q => isFinite(q[0]) && isFinite(q[1]));
      });
    }));
    check('Dehnprogramme referenzieren existierende Übungen', D.STRETCH_PROGRAMS.every(p => p.exerciseIds.length === 5 && p.exerciseIds.every(id => D.byId[id])));
    check('Standardprogramme gültig (5 Übungen je Bereich)', D.AREAS.every(a => a.standard.length === 5 && a.standard.every(id => D.byId[id].category === a.id)));

    // 2. Zufallsregeln (2/2/1) – 300 Ziehungen
    let rulesOk = true;
    for (let i = 0; i < 300 && rulesOk; i++) {
      D.AREAS.forEach(function (a) {
        const p = App.Programs.buildProgram({ areaIds: [a.id], programType: 'random', history: [] });
        if (p.exerciseIds.length !== 5 || new Set(p.exerciseIds).size !== 5) rulesOk = false;
        a.slots.forEach(s => { if (p.exerciseIds.filter(id => D.byId[id].subCategory === s.sub).length !== s.n) rulesOk = false; });
      });
    }
    check('Zufallsmodus hält Regeln ein', rulesOk);
    check('Mehrfachauswahl: 3 Bereiche = 15 Übungen in fester Reihenfolge',
      (function () { const p = App.Programs.buildProgram({ areaIds: ['lower', 'upper', 'core'], programType: 'standard' }); return p.exerciseIds.length === 15 && p.areaIds.join() === 'upper,core,lower'; })());

    // 3. Trainingsstile / Dauer
    const ex = D.byId.plank, sum = m => App.Programs.totalSeconds(D.modeById(m).buildBlocks(ex));
    check('Kieser 90: 10 s Vorbereitung + 90 s', sum('kieser90') === 100, sum('kieser90'));
    check('Kieser 120: 10 s Vorbereitung + 120 s', sum('kieser120') === 130, sum('kieser120'));
    check('Klassisch: 10 + 3×30 + 2×10 = 120 s', sum('classic3') === 120, sum('classic3'));
    const km = D.modeById('kieser90').buildBlocks(ex)[1].motion;
    check('Kieser-Zyklus 4/2/4/2', km(0).p === 0 && km(4).p === 1 && km(5).cue === 'Halten' && km(8).p === 0.5 && km(10).p === 0 && km(11).cue === 'Halten');
    check('Stretch-Programm 5 Übungen', App.Programs.stretchForAreas(['upper']).exerciseIds.length === 5 && App.Programs.stretchForAreas(['upper', 'core']).exerciseIds.length === 10);

    // 4. Timer mit simulierter Zeit
    const events = [], blocks = App.Programs.buildBlocks({ exerciseIds: ['plank', 'bird_dog'] }, D.modeById('classic3'));
    const t = App.Timer(blocks, { onBlockStart: (b, i) => events.push('s' + i), onBlockEnd: (b, i) => events.push('e' + i), onFinish: () => events.push('F') });
    const total = App.Programs.totalSeconds(blocks);
    t.advance(0); t.advance(10.5);
    check('Timer wechselt von Vorbereitung zu Satz 1', t.state().index === 1 && Math.abs(t.state().elapsed - 0.5) < 1e-9);
    t.advance(total);      // weit über das Ende hinaus
    check('Timer beendet genau einmal', t.isFinished() && events.filter(e => e === 'F').length === 1 && events.filter(e => e.charAt(0) === 'e').length === blocks.length);

    // 5. Merge der Fortschrittsdaten
    const m = App.Store.merge({ updatedAt: 1, settings: { x: 1 }, sessions: [{ id: 'a', date: '2026-01-01' }] }, { updatedAt: 2, settings: { x: 2 }, sessions: [{ id: 'a', date: '2026-01-01' }, { id: 'b', date: '2026-01-02' }] });
    check('Merge vereinigt Sessions, neuere Einstellungen gewinnen', m.sessions.length === 2 && m.settings.x === 2);

    document.getElementById('selftest').textContent = out.join('\n'); document.getElementById('selftest').hidden = false;
    document.title = 'SELFTEST ' + (fails.length ? 'FAIL (' + fails.join('; ') + ')' : 'PASS');
  }
  return { run: run };
})();
