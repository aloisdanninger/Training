/* ==========================================================================
   90-selftest.js  –  Eingebauter Selbsttest. Aufruf: training.html#selftest
   Ergebnis steht in <pre id="selftest"> und im Seitentitel ("SELFTEST PASS/FAIL").
   Läuft ohne Testframework, auch headless (siehe tests/run-selftest.py).
   ========================================================================== */
App.SelfTest = (function () {
  function run() {
    const out = [], fails = [];
    const check = (name, ok, info) => { out.push((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' – ' + info : '')); if (!ok) fails.push(name); };
    const D = App.Data, C2 = App.Config;

    // 1. Datenmodell: Pflichtfelder
    const req = ['id', 'name', 'category', 'subCategory', 'targetMuscles', 'difficulty', 'equipment', 'description', 'instructions', 'svgAnimation'];
    const all = D.EXERCISES.concat(D.STRETCHES);
    const nH = D.EXERCISES.filter(e => e.category === 'hiit').length;
    check('Anzahl Übungen = 111 (davon 24 HIIT), keine TRX-Übungen', D.EXERCISES.length === 111 && nH === 24 && !D.EXERCISES.some(e => e.equipment.some(q => /trx/i.test(q))), D.EXERCISES.length + '/' + nH);
    check('Neue Übungen (7-Minuten-Workout, Tragen, Unterschenkel, Schulter) vorhanden',
      ['dampflok', 'trizepsheben', 'liegestuetz_rotation', 'farmers_carry', 'suitcase_carry', 'dead_hang', 'scapular_pushup', 'wadenheben', 'tibialis_raise', 'copenhagen_plank',
        'bear_crawl', 'single_leg_glute_bridge', 'push_up_plus'].every(id => D.byId[id]) && ['m_9090_switch', 'm_open_book', 'm_knee_to_wall', 'm_wgs'].every(id => D.byId[id] && D.byId[id].dynamic));
    check('Attribute: jede Kraft-/HIIT-Übung hat Bewegungsmuster, Position, Belastung', D.EXERCISES.every(e => e.pattern && D.PATTERN_LABEL[e.pattern] && e.position && D.LOAD_LABEL[e.load] && e.flags),
      D.EXERCISES.filter(e => !e.pattern).map(e => e.id).join());
    check('Attribute: Beispiele', D.byId.burpee.flags.jump && !D.byId.dampflok.flags.jump && D.byId.liegestuetz.flags.wrist && D.byId.kb_press.load === 'KB' &&
      D.byId.goblet_squat.load === 'KH/KB' && D.byId.plank.position === 'Stütz' && D.byId.dead_bug.position === 'Rückenlage' && D.byId.suitcase_carry.flags.unilateral);
    check('Mindestens 7 Kettlebell-Übungen', D.EXERCISES.filter(e => e.equipment.some(q => /kettlebell/i.test(q))).length >= 7);
    check('Liegestütz-Aufbau vorhanden (Wand, Knie, Negativ, Schräg)', ['wand_liegestuetz', 'knie_liegestuetz', 'negativ_liegestuetz', 'schraeg_liegestuetz'].every(id => D.byId[id] && D.byId[id].subCategory === 'Drücken'));
    check('Anzahl Dehn-/Mobilitätsübungen = 35', D.STRETCHES.length === 35, D.STRETCHES.length);
    check('Pflichtfelder vollständig', all.every(e => req.every(k => e[k] != null && e[k] !== '')));
    check('IDs eindeutig', new Set(all.map(e => e.id)).size === all.length);
    check('Posen vorhanden und endlich', all.every(function (e) {
      return [e.svgAnimation.a, e.svgAnimation.b].every(function (p) {
        const j = App.Pose.joints(App.Pose.resolve(p)); return [j.head, j.neck].concat(j.near.arm, j.near.leg).every(q => isFinite(q[0]) && isFinite(q[1]));
      });
    }));
    check('Dehnprogramme referenzieren existierende Übungen', D.STRETCH_PROGRAMS.length === 6 && D.STRETCH_PROGRAMS.every(p => p.exerciseIds.length >= 5 && p.exerciseIds.every(id => D.byId[id] && D.byId[id].category === 'stretch')));
    const mb = D.modeById('stretch').buildBlocks(D.byId.m_9090_switch, { secondsEach: 45 }), sb0 = D.modeById('stretch').buildBlocks(D.byId.st_brust, {});
    const sm = App.Programs.buildStretch(['mob_hip', 'mob_spine', 'stretch_upper']);
    check('Mehrere Dehnprogramme: verbunden, ohne doppelte Übungen', sm.exerciseIds.length === new Set(sm.exerciseIds).size && sm.exerciseIds.length >= 12 && sm.exerciseIds.length <= 17 && sm.items.length === sm.exerciseIds.length, sm.exerciseIds.length);
    let shOk = true, diff = false;
    for (let i = 0; i < 60; i++) {
      const a = App.Programs.buildStretch(['stretch_upper']).exerciseIds, b = App.Programs.buildStretch(['mob_hip']).exerciseIds;
      if (a.slice().sort().join() !== D.STRETCH_PROGRAMS[0].exerciseIds.slice().sort().join() || b.length !== 6 || new Set(b).size !== 6 || !b.every(id => D.STRETCH_PROGRAMS[4].exerciseIds.indexOf(id) >= 0)) shOk = false;
      if (a.join() !== D.STRETCH_PROGRAMS[0].exerciseIds.join()) diff = true;
    }
    check('Dehnen: zufällige Reihenfolge, Mobilität zieht 6 aus dem Pool', shOk && diff);
    check('Dehnprogramm merkt seine Programme (Neu würfeln)', sm.programIds.join() === 'mob_hip,mob_spine,stretch_upper');
    check('Dehnen: 12 s Vorbereitung zwischen den Übungen', D.modeById('stretch').buildBlocks(D.byId.st_brust, {})[0].duration === 12);
    check('Mobilität: dynamisch wiederholt (6 s), Dehnung gleitet und hält', mb[1].duration === 45 && mb[1].motion(3).p === 1 && mb[1].motion(6).p === 0 && sb0[1].motion(30).p === 1);
    const R = D.REFERENCE.map(id => D.byId[id]), subs = R.map(e => e.subCategory);
    check('Referenztraining: 12 Übungen, je 4 aus Oberkörper/Rumpf/Unterkörper, alle Unterkategorien',
      R.length === 12 && R.every(Boolean) && ['upper', 'core', 'lower'].every(c => R.filter(e => e.category === c).length === 4) &&
      ['Drücken', 'Ziehen', 'Arme', 'Bauch', 'Rücken', 'Seitliche Stabilität', 'Knie dominant', 'Hüftdominant', 'Stabilität'].every(s => subs.indexOf(s) >= 0));
    const rp = App.Programs.buildProgram({ areaIds: ['hiit'], programType: 'reference' });
    check('Referenztraining ignoriert Bereichsauswahl, fester Stil Kieser 90 s', rp.type === 'reference' && rp.exerciseIds.join() === D.REFERENCE.join() &&
      App.Programs.totalSeconds(D.modeById('reference').buildBlocks(D.byId.plank)) === 100);
    check('HIIT steht links/zuerst', D.AREAS[0].id === 'hiit');

    // 2. Zufallsregeln (Unterkategorien bzw. Bewegungsmuster) – 300 Ziehungen
    let rulesOk = true, rulesInfo = '';
    for (let i = 0; i < 300 && rulesOk; i++) {
      D.AREAS.forEach(function (a) {
        const p = App.Programs.buildProgram({ areaIds: [a.id], programType: 'random', history: [] }), n = App.Programs.slotCount(a);
        if (p.exerciseIds.length !== n || new Set(p.exerciseIds).size !== n) rulesOk = false;
        a.slots.forEach(s => { if (p.exerciseIds.filter(id => s.pat ? s.pat.indexOf(D.byId[id].pattern) >= 0 : D.byId[id].subCategory === s.sub).length < s.n) { rulesOk = false; rulesInfo = a.id + ' ' + (s.sub || s.pat) + ': ' + p.exerciseIds; } });
      });
    }
    check('Zufallsmodus hält Regeln ein (HIIT 5, Ganzkörper 6, Ober-/Unterkörper/Rumpf je 5)', rulesOk && D.AREAS.map(a => App.Programs.slotCount(a)).join() === '5,6,5,5,5', rulesInfo);
    check('Ganzkörper: Squat/Lunge, Drücken, Hüftbeuge, Ziehen, Tragen, Rumpf; mit Oberkörper keine Doppelten', (function () {
      for (let i = 0; i < 100; i++) {
        const p = App.Programs.buildProgram({ areaIds: ['upper', 'full'], programType: 'random', history: [] });
        if (p.exerciseIds.length !== 11 || new Set(p.exerciseIds).size !== 11 || p.areaOf.slice(0, 6).join() !== 'full,full,full,full,full,full' || D.byId[p.exerciseIds[4]].pattern !== 'carry') return false;
      }
      return true;
    })());
    // Beispiel: Ganzkörper · ohne Springen · nur 1 Kettlebell
    const kbOnly = { noJump: true, kneeFriendly: false, wristFriendly: false, gear: { KH: false, KB: true, Band: false, Stange: false, Stuhl: false } };
    let fOk = true, fInfo = '';
    for (let i = 0; i < 200 && fOk; i++) {
      const p = App.Programs.buildProgram({ areaIds: ['hiit', 'full', 'upper', 'core', 'lower'], programType: 'random', history: [], filter: kbOnly });
      p.exerciseIds.forEach(id => { const e = D.byId[id]; if (e.flags.jump || /hantel(?!.*kettlebell)|stange|band|bank|stuhl|stufe/i.test(e.equipment.filter(q => !/optional|kettlebell/i.test(q)).join(' ')) || !App.Programs.allowed(e, kbOnly)) { fOk = false; fInfo = id; } });
      if (p.exerciseIds.length !== 26 || new Set(p.exerciseIds).size !== 26) { fOk = false; fInfo = 'Anzahl ' + p.exerciseIds.length; }
    }
    check('Rahmenbedingungen: ohne Springen + nur Kettlebell werden eingehalten, Bereiche trotzdem voll', fOk, fInfo);
    const kp = App.Programs.buildProgram({ areaIds: ['full'], programType: 'random', history: [], filter: kbOnly, rnd: (function () { let x = 7; return () => (x = (x * 9301 + 49297) % 233280) / 233280; })() });
    check('Beispiel Ganzkörper mit Kettlebell: Tragen mit Kettlebell, kein Sprung', kp.exerciseIds.length === 6 && D.byId[kp.exerciseIds[4]].load === 'KB' && kp.exerciseIds.every(id => !D.byId[id].flags.jump), kp.exerciseIds.join());
    check('Knieschonend / Handgelenke schonen filtern', !App.Programs.allowed(D.byId.jump_lunge, { kneeFriendly: true }) && !App.Programs.allowed(D.byId.liegestuetz, { wristFriendly: true }) &&
      App.Programs.allowed(D.byId.schulterdruecken, { wristFriendly: true, gear: { KH: true } }) && !App.Programs.allowed(D.byId.schulterdruecken, { gear: { KH: false } }) &&
      App.Programs.allowed(D.byId.goblet_squat, { gear: { KH: false, KB: true } }) && App.Programs.allowed(D.byId.single_leg_deadlift, { gear: {} }));
    check('Mehrfachauswahl: 4 Bereiche = 20 Übungen in fester Reihenfolge, HIIT zuerst',
      (function () { const p = App.Programs.buildProgram({ areaIds: ['lower', 'upper', 'hiit', 'core'], programType: 'random', history: [] });
        return p.exerciseIds.length === 20 && p.areaIds.join() === 'hiit,upper,core,lower' && p.exerciseIds.slice(0, 5).every(id => D.byId[id].category === 'hiit'); })());

    // 2b. Bewertung und Befestigung
    check('Referenztraining ohne Band/TRX', R.every(e => !e.needsAnchor));
    let anchorOk = true;
    for (let i = 0; i < 200; i++) D.AREAS.forEach(a => { if (App.Programs.buildProgram({ areaIds: [a.id], programType: 'random', history: [] }).exerciseIds.some(id => D.byId[id].needsAnchor)) anchorOk = false; });
    check('Zufallsmodus schlägt keine befestigten Band-Übungen vor', anchorOk && D.EXERCISES.filter(e => e.needsAnchor).length === 2 && !D.byId.band_pull_apart.needsAnchor);
    check('Gewichtsauswahl: Hanteln 1–4 kg, Kettlebell 8/12/16 kg, sonst keine', App.Programs.kgOptions(D.byId.bizeps_curl).join() === '1,2,3,4' &&
      App.Programs.kgOptions(D.byId.kb_press).join() === '8,12,16' && App.Programs.kgOptions(D.byId.goblet_squat).join() === '1,2,3,4,8,12,16' && App.Programs.kgOptions(D.byId.plank).length === 0);
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

    // 3b. HIIT + Kraft: HIIT-Teil im Intervall (2 Runden, 30 s / 15 s, 60 s Rundenpause), danach Klassisch
    //     HIIT: 10 + 4×30 + 15 + 60 + 15 = 220 s; Plank klassisch 120 s -> 340 s
    const hb = App.Programs.buildBlocks({ exerciseIds: ['hampelmann', 'high_knees', 'plank'] }, D.modeById('classic'), {}, D.modeById('hiit', { hiitRounds: 2, hiitWork: 30, hiitRest: 15 }));
    const hw = hb.filter(b => b.type === 'work');
    check('HIIT + Kraft: Dauer 340 s', App.Programs.totalSeconds(hb) === 340, App.Programs.totalSeconds(hb));
    check('HIIT + Kraft: Reihenfolge, Indizes und Abschlüsse stimmen',
      hw.map(b => b.exercise.id + b.exerciseIndex).join() === 'hampelmann0,high_knees1,hampelmann0,high_knees1,plank2,plank2,plank2' &&
      hb.every(b => b.exerciseCount === 3) && hb.filter(b => b.exerciseEnd).length === 3 && hw[3].nextEx === D.byId.plank);
    const ho = App.Programs.buildBlocks({ exerciseIds: ['burpee'] }, D.modeById('kieser'));
    check('Nur HIIT: Kraftstil wird ignoriert', ho.filter(b => b.type === 'work').length === C2.hiit.rounds.def && ho[1].duration === C2.hiit.work.def);

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

    pl.setExercise(D.byId.thruster);
    const t0 = ankle(0), t1 = ankle(1);
    check('Thruster: Füße bleiben in Hocke und Streckung am Boden', Math.abs(t0[1] - t1[1]) < 0.2 && Math.abs(t0[1] - (App.Config.stage.floorY)) < 0.5, t0 + ' / ' + t1);
    pl.setExercise(D.byId.wadenheben);
    const w0 = ankle(0), w1 = ankle(1);
    check('Wadenheben: Figur hebt sich in den Zehenstand', w1[1] < w0[1] - 5, w0 + ' / ' + w1);

    check('Einseitige Übungen markiert (Bulgarian Split Squat, Seitstütz, Dehnung mit Seitenwechsel), Plank nicht',
      D.byId.bulgarian_split_squat.oneSided && D.byId.side_plank.oneSided && D.byId.st_schulter.oneSided && !D.byId.plank.oneSided);

    check('Profile: Standard = alte Schlüssel/Datei, Name -> eigener Schlüssel und Datei',
      App.Profile.slugOf('Änna Müller!') === 'anna-muller' && App.Profile.slugOf('') === '' &&
      (App.Profile.slug() !== '' || (App.Profile.storageKey() === App.Config.storageKey && App.Profile.remotePath() === 'progress/training-lois.json')));

    const pb = D.modeById('classic').buildBlocks(D.byId.plank)[0];
    check('Vorbereitung: Animation läuft durch, Text bleibt', pb.type === 'prepare' && pb.motion(1.25).p > 0 && pb.motion(1.25).cue === 'Gleich geht es los');
    check('Sync-Dateien: Lois = training-lois.json, Test = training.json', (function () {
      const old = localStorage.getItem(App.Config.profileKey), r = {};
      ['Lois', 'Test', 'Elke'].forEach(n => { App.Profile.set(n); r[n] = App.Profile.remotePath(); });
      old ? localStorage.setItem(App.Config.profileKey, old) : localStorage.removeItem(App.Config.profileKey);
      return r.Lois === 'progress/training-lois.json' && r.Test === 'progress/training.json' && r.Elke === 'progress/training-elke.json';
    })());
    check('Profil Lois = Standarddaten, Elke eigene', App.Profile.slugOf('Elke') === 'elke' && App.Profile.slugOf('Lois') === 'lois');

    // 5a. Schwierigkeitsstufen: je Übung gewinnt der jüngere Eintrag
    const ml = App.Store.merge({ updatedAt: 1, levels: { a: { offset: 5, last: 'leicht', t: 10 }, b: { offset: -5, last: 'schwer', t: 50 } }, sessions: [] },
      { updatedAt: 2, levels: { a: { offset: 10, last: 'leicht', t: 20 }, b: { offset: 0, last: 'richtig', t: 40 } }, sessions: [] });
    check('Merge: Schwierigkeitsstufen je Übung nach Zeitstempel', ml.levels.a.offset === 10 && ml.levels.b.offset === -5);

    const mw = App.Store.merge({ updatedAt: 9, sessions: [], weights: { kb_press: { kg: 8, t: 10 }, goblet_squat: { kg: 12, t: 50 } } },
      { updatedAt: 1, sessions: [], weights: { kb_press: { kg: 12, t: 20 }, bizeps_curl: { kg: 3, t: 5 } } });
    check('Merge: Gewichte je Übung nach Zeitstempel', mw.weights.kb_press.kg === 12 && mw.weights.goblet_squat.kg === 12 && mw.weights.bizeps_curl.kg === 3);

    const ms = App.Store.merge({ updatedAt: 5, sessions: [{ id: 'r', date: '2026-01-01', t: 20, ref: { felt: { plank: 'leicht' } } }] },
      { updatedAt: 9, sessions: [{ id: 'r', date: '2026-01-01', t: 10, ref: { felt: {} } }] });
    check('Merge: später bearbeitete Session gewinnt (Empfinden im Referenztraining)', ms.sessions.length === 1 && ms.sessions[0].ref.felt.plank === 'leicht');

    // 5. Merge der Fortschrittsdaten
    const m = App.Store.merge({ updatedAt: 1, settings: { x: 1 }, sessions: [{ id: 'a', date: '2026-01-01' }] }, { updatedAt: 2, settings: { x: 2 }, sessions: [{ id: 'a', date: '2026-01-01' }, { id: 'b', date: '2026-01-02' }] });
    check('Merge vereinigt Sessions, neuere Einstellungen gewinnen', m.sessions.length === 2 && m.settings.x === 2);

    document.getElementById('selftest').textContent = out.join('\n'); document.getElementById('selftest').hidden = false;
    document.title = 'SELFTEST ' + (fails.length ? 'FAIL (' + fails.join('; ') + ')' : 'PASS');
  }
  return { run: run };
})();
