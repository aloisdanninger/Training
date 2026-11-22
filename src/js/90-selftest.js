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

    // 2b. Bewertung und Befestigung
    check('Standardprogramme ohne Band/TRX', D.AREAS.every(a => a.standard.every(id => !D.byId[id].needsAnchor)));
    let anchorOk = true;
    for (let i = 0; i < 200; i++) D.AREAS.forEach(a => { if (App.Programs.buildProgram({ areaIds: [a.id], programType: 'random', history: [] }).exerciseIds.some(id => D.byId[id].needsAnchor)) anchorOk = false; });
    check('Zufallsmodus schlägt keine Band/TRX-Übungen vor', anchorOk && D.EXERCISES.filter(e => e.needsAnchor).length === 4);
    const rt = { liegestuetz: 5, schulterdruecken: 1 }; let hi = 0, lo = 0;
    for (let i = 0; i < 400; i++) { const ids = App.Programs.buildProgram({ areaIds: ['upper'], programType: 'random', history: [], ratings: rt }).exerciseIds; if (ids.indexOf('liegestuetz') >= 0) hi++; if (ids.indexOf('schulterdruecken') >= 0) lo++; }
    check('Hohe Bewertung kommt öfter als niedrige', hi > lo * 1.5, hi + ' vs ' + lo);

    // 3. Trainingsstile / Dauer
    const ex = D.byId.plank, sum = (m, o) => App.Programs.totalSeconds(D.modeById(m, o).buildBlocks(ex));
    const ks = n => sum('kieser', { kieserSeconds: n });
    check('Kieser 90: 10 s Vorbereitung + 90 s', ks(90) === 100, ks(90));
    check('Kieser Standard 120 s: 10 s Vorbereitung + 120 s', sum('kieser') === 130 && ks(120) === 130, sum('kieser'));
    check('Klassisch Standard: 10 + 3×30 + 2×10 = 120 s', sum('classic') === 120, sum('classic'));
    check('Klassisch wählbar: 2 Sätze × 20 s = 10 + 40 + 10 = 60 s', sum('classic', { classicSets: 2, classicSeconds: 20 }) === 60, sum('classic', { classicSets: 2, classicSeconds: 20 }));
    // Zirkel: 3 Übungen, 2 Runden, 20 s: 10 + 6×20 + 2×(2×10) + 30 = 200 s; jede Übung genau einmal "erledigt"
    const cm = D.modeById('circuit', { circuitRounds: 2, circuitSeconds: 20 }), cbl = App.Programs.buildBlocks({ exerciseIds: ['plank', 'bird_dog', 'superman'] }, cm);
    check('Zirkel: Gesamtdauer 200 s', App.Programs.totalSeconds(cbl) === 200, App.Programs.totalSeconds(cbl));
    check('Zirkel: 6 Arbeitsblöcke, je Übung ein Abschluss, Reihenfolge stimmt',
      cbl.filter(b => b.type === 'work').length === 6 && cbl.filter(b => b.exerciseEnd).length === 3 &&
      cbl.filter(b => b.type === 'work').map(b => b.exercise.id).join() === 'plank,bird_dog,superman,plank,bird_dog,superman');
    const co = App.Programs.buildBlocks({ exerciseIds: ['plank', 'bird_dog'] }, D.modeById('circuit', { circuitRounds: 1, circuitSeconds: 20 }), { plank: 5, bird_dog: -5 });
    check('Zirkel: Schwierigkeits-Anpassung ±5 s je Übung', co.filter(b => b.type === 'work').map(b => b.duration).join() === '25,15');
    check('Schwierigkeit: Kieser +5 s, Klassisch -5 s je Satz', App.Programs.totalSeconds(App.Programs.buildBlocks({ exerciseIds: ['plank'] }, D.modeById('kieser'), { plank: 5 })) === 135 &&
      App.Programs.totalSeconds(App.Programs.buildBlocks({ exerciseIds: ['plank'] }, D.modeById('classic'), { plank: -5 })) === 10 + 3 * 25 + 20);
    const km = D.modeById('kieser').buildBlocks(ex)[1].motion;
    check('Kieser-Zyklus 4/2/4/2', km(0).p === 0 && km(4).p === 1 && km(5).cue === 'Halten' && km(8).p === 0.5 && km(10).p === 0 && km(11).cue === 'Halten');
    check('Stretch-Programm 5 Übungen', App.Programs.stretchForAreas(['upper']).exerciseIds.length === 5 && App.Programs.stretchForAreas(['upper', 'core']).exerciseIds.length === 10);

    // 4. Timer mit simulierter Zeit
    const events = [], blocks = App.Programs.buildBlocks({ exerciseIds: ['plank', 'bird_dog'] }, D.modeById('classic'));
    const t = App.Timer(blocks, { onBlockStart: (b, i) => events.push('s' + i), onBlockEnd: (b, i) => events.push('e' + i), onFinish: () => events.push('F') });
    const total = App.Programs.totalSeconds(blocks);
    t.advance(0); t.advance(10.5);
    check('Timer wechselt von Vorbereitung zu Satz 1', t.state().index === 1 && Math.abs(t.state().elapsed - 0.5) < 1e-9);
    t.advance(total);      // weit über das Ende hinaus
    check('Timer beendet genau einmal', t.isFinished() && events.filter(e => e === 'F').length === 1 && events.filter(e => e.charAt(0) === 'e').length === blocks.length);

    // 4b. Material-Übersicht
    const gear = App.Programs.equipmentSummary(['superman', 'bizeps_curl', 'schulterdruecken', 'kurzhantelrudern', 'trizeps_dip', 'kettlebell_swing']);
    const g = n => gear.filter(x => x.item === n)[0];
    check('Material: Matte erkannt', !!g('Matte') && g('Matte').usedBy[0] === 'Superman');
    check('Material: Hanteln nach Gewicht gruppiert', !!g('Kurzhanteln') && g('Kurzhanteln').weights.mittel.length === 2 && g('Kurzhanteln').weights.schwer[0] === 'Kurzhantelrudern');
    check('Material: Hocker/Bank + Kettlebell', !!g('Hocker / Bank / Stuhl') && !!g('Kettlebell'));
    check('Material: Programm ohne Equipment liefert leere Liste', App.Programs.equipmentSummary(['wall_sit']).length === 1);   // nur freie Wand

    // 4c. Töne: Doppelping bei Start/Ende jedes Satzes, letzter Block jeder Übung markiert
    const cb = App.Programs.buildBlocks({ exerciseIds: ['plank'] }, D.modeById('classic'));
    check('Klassisch: 3 Sätze mit Doppelping Start/Ende', cb.filter(b => b.type === 'work' && b.sound === 'double' && b.endSound === 'double').length === 3 && cb.filter(b => b.exerciseEnd).length === 1);

    // 4d. Animation: Standfuß bleibt bei der Kniebeuge an derselben Stelle (kein "Hüpfen")
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), pl = App.Animation.createPlayer(svg);
    pl.setExercise(D.byId.kniebeuge);
    const ankle = p => { pl.render(p); const pts = svg.querySelectorAll('polyline')[2].getAttribute('points').trim().split(' '); return pts[pts.length - 1].split(',').map(Number); };
    const a0 = ankle(0), a5 = ankle(0.5), a1 = ankle(1);
    check('Kniebeuge: Fuß bleibt am Boden und an derselben Stelle', [a5, a1].every(a => Math.abs(a[0] - a0[0]) < 0.2 && Math.abs(a[1] - a0[1]) < 0.2), a0 + ' / ' + a5 + ' / ' + a1);

    // 5a. Schwierigkeitsstufen: je Übung gewinnt der jüngere Eintrag
    const ml = App.Store.merge({ updatedAt: 1, levels: { a: { offset: 5, last: 'leicht', t: 10 }, b: { offset: -5, last: 'schwer', t: 50 } }, sessions: [] },
      { updatedAt: 2, levels: { a: { offset: 10, last: 'leicht', t: 20 }, b: { offset: 0, last: 'richtig', t: 40 } }, sessions: [] });
    check('Merge: Schwierigkeitsstufen je Übung nach Zeitstempel', ml.levels.a.offset === 10 && ml.levels.b.offset === -5);

    // 5. Merge der Fortschrittsdaten
    const m = App.Store.merge({ updatedAt: 1, settings: { x: 1 }, sessions: [{ id: 'a', date: '2026-01-01' }] }, { updatedAt: 2, settings: { x: 2 }, sessions: [{ id: 'a', date: '2026-01-01' }, { id: 'b', date: '2026-01-02' }] });
    check('Merge vereinigt Sessions, neuere Einstellungen gewinnen', m.sessions.length === 2 && m.settings.x === 2);

    document.getElementById('selftest').textContent = out.join('\n'); document.getElementById('selftest').hidden = false;
    document.title = 'SELFTEST ' + (fails.length ? 'FAIL (' + fails.join('; ') + ')' : 'PASS');
  }
  return { run: run };
})();
