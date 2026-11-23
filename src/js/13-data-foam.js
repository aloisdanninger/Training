/* ==========================================================================
   13-data-foam.js  –  DATEN: Faszienrolle (Übungen + Bereiche)
   Gleiche Struktur wie die anderen Übungen (category = 'foam', area = 'upper'|'core'|'lower').
   Animation: anchor 'roller' – die Rolle liegt fest am Boden, die Figur gleitet darüber.
     roll.seg = Körperteil auf der Rolle ('shin' Unterschenkel, 'thigh' Oberschenkel, 'torso' Rumpf,
                'upperArm' Oberarm, 'foreArm' Unterarm), roll.f = [von, bis] Position entlang des Körperteils
                (0 = körpernahes Gelenk, 1 = körperfernes Gelenk bzw. Hals).
   Dauer: 60 s, einseitige Übungen 90 s (Seitenwechsel nach der halben Zeit).
   ========================================================================== */
(function () {
  const P = App.Pose.P;
  const SIT = P(-55, [190, 190], [90, 90], { hd: -20 });                      // Sitz, Hände hinten, Beine lang
  const PRONE = P(90, [180, 90], [270, 270], { hd: 100 });                   // Unterarmstütz, Bauchlage
  const SUP = P(280, [315, 170], [70, 170], { hd: 280 });                     // Rückenlage, Hände am Hinterkopf, Füße aufgestellt

  /* [id, name, area, muscles, description, instructions, animation] */
  const ROWS = [
    /* Unterkörper */
    ['fr_waden', 'Waden rollen', 'lower', ['Waden', 'Achillessehne'], 'Im Sitz die Waden über die Rolle bewegen.',
      'Sitzen, Rolle unter den Waden, Hände hinter dem Körper aufstützen, Gesäß anheben. Langsam von der Ferse bis unter die Kniekehle rollen. Mehr Druck: ein Bein auf das andere legen.',
      { anchor: 'roller', roll: { seg: 'shin', f: [0.85, 0.15] }, a: SIT, b: SIT }],
    ['fr_schienbein', 'Schienbein vorne rollen', 'lower', ['Schienbeinmuskel', 'Fußheber'], 'Im Vierfüßlerstand die Schienbeine vorne rollen.',
      'Vierfüßlerstand, Rolle unter den Schienbeinen, Hände unter den Schultern. Knie leicht anheben und die Schienbeine langsam vom Sprunggelenk bis unter das Knie rollen. Nicht direkt auf dem Knochen, leicht nach außen drehen.',
      { anchor: 'roller', roll: { seg: 'shin', f: [0.8, 0.2] }, a: P(80, [180, 180], [235, 270], { hd: 90 }), b: P(80, [180, 180], [235, 270], { hd: 90 }) }],
    ['fr_quad', 'Oberschenkel vorne rollen', 'lower', ['vordere Oberschenkel', 'Hüftbeuger'], 'Im Unterarmstütz die Oberschenkel vorne rollen.',
      'Bauchlage im Unterarmstütz, Rolle unter den Oberschenkeln. Bauch fest, Körper gerade. Langsam von oberhalb des Knies bis zur Hüfte rollen. Mehr Druck: nur ein Bein auf der Rolle.',
      { anchor: 'roller', roll: { seg: 'thigh', f: [0.85, 0.15] }, a: PRONE, b: PRONE }],
    ['fr_hamstring', 'Oberschenkel hinten rollen', 'lower', ['hintere Oberschenkel'], 'Im Sitz die Oberschenkelrückseite rollen.',
      'Sitzen, Rolle unter den Oberschenkeln, Hände hinten aufstützen, Gesäß anheben. Langsam von der Kniekehle bis zum Gesäß rollen. Füße locker, Zehen zeigen leicht nach außen und innen.',
      { anchor: 'roller', roll: { seg: 'thigh', f: [0.85, 0.15] }, a: SIT, b: SIT }],
    ['fr_itband', 'Oberschenkel außen rollen', 'lower', ['Oberschenkel außen (Tractus)', 'Hüfte außen'], 'In Seitenlage die Außenseite des Oberschenkels rollen.',
      'Seitlich auf die Rolle legen, Unterarm stützt, oberes Bein vorne aufgestellt. Langsam von oberhalb des Knies bis zur Hüfte rollen. Druck über das obere Bein dosieren. Nach der halben Zeit Seite wechseln.',
      { anchor: 'roller', roll: { seg: 'thigh', f: [0.85, 0.2] }, a: P(80, [180, 90], [270, 270], { r: [92, 140], hd: 80 }), b: P(80, [180, 90], [270, 270], { r: [92, 140], hd: 80 }) }],
    ['fr_gesaess', 'Gesäß rollen', 'lower', ['Gesäß', 'Piriformis'], 'Auf der Rolle sitzen, ein Bein überschlagen.',
      'Auf die Rolle setzen, Hände hinten aufstützen. Einen Knöchel auf das andere Knie legen und das Gewicht auf diese Gesäßseite verlagern. Langsam vor und zurück rollen. Nach der halben Zeit Seite wechseln.',
      { anchor: 'roller', roll: { seg: 'torso', f: [-0.15, 0.15] }, a: P(-55, [190, 190], [80, 175], { r: [40, 120], hd: -15 }), b: P(-55, [190, 190], [80, 175], { r: [40, 120], hd: -15 }) }],

    /* Rumpf */
    ['fr_bws', 'Oberen Rücken rollen', 'core', ['oberer Rücken', 'Brustwirbelsäule', 'Rautenmuskel'], 'In Rückenlage den oberen Rücken über die Rolle bewegen.',
      'Rolle quer unter den oberen Rücken, Hände stützen den Kopf, Füße aufgestellt, Gesäß angehoben. Mit den Beinen langsam vom unteren Rand der Schulterblätter bis zu den Schultern rollen. Nicht in den unteren Rücken rollen.',
      { anchor: 'roller', roll: { seg: 'torso', f: [0.45, 0.85] }, a: SUP, b: SUP }],
    ['fr_bws_ext', 'Brustwirbelsäule strecken', 'core', ['Brustwirbelsäule', 'Brust', 'Bauch'], 'Über die Rolle nach hinten strecken.',
      'Rolle quer unter dem oberen Rücken, Gesäß am Boden, Hände stützen den Kopf. Langsam über die Rolle nach hinten strecken, Ellbogen öffnen, ausatmen. Wieder aufrichten. Rolle eine Handbreit versetzen und wiederholen.',
      { anchor: 'roller', roll: { seg: 'torso', f: [0.6, 0.6] }, a: SUP, b: P(255, [250, 250], [90, 190], { hd: 240 }) }],
    ['fr_flanke', 'Seitlichen Rumpf rollen', 'core', ['seitlicher Rumpf', 'Latissimus unten'], 'In Seitenlage die Flanke zwischen Becken und Rippen rollen.',
      'Seitenlage, Rolle unter der Flanke oberhalb des Beckens, Unterarm stützt, oberes Bein vorne aufgestellt. Sanft und langsam zwischen Becken und Rippen rollen, nicht auf die Rippen drücken. Nach der halben Zeit Seite wechseln.',
      { anchor: 'roller', roll: { seg: 'torso', f: [0.25, 0.55] }, a: P(75, [180, 90], [254, 254], { r: [90, 120], hd: 75 }), b: P(75, [180, 90], [254, 254], { r: [90, 120], hd: 75 }) }],
    ['fr_hueftbeuger', 'Hüftbeuger rollen', 'core', ['Hüftbeuger', 'Leiste'], 'In Bauchlage die Vorderseite der Hüfte rollen.',
      'Unterarmstütz in Bauchlage, Rolle unter der Hüftvorderseite. Anderes Bein seitlich angewinkelt ablegen. Kleine, langsame Bewegungen zwischen Hüftknochen und oberem Oberschenkel. Nach der halben Zeit Seite wechseln.',
      { anchor: 'roller', roll: { seg: 'torso', f: [-0.1, 0.25] }, a: P(90, [180, 90], [248, 248], { hd: 100 }), b: P(90, [180, 90], [248, 248], { hd: 100 }) }],

    /* Oberkörper */
    ['fr_lat', 'Latissimus rollen', 'upper', ['Latissimus', 'seitlicher Rücken', 'Achsel'], 'In Seitenlage unter der Achsel rollen, Arm lang.',
      'Seitenlage, Rolle unter der Achsel, unterer Arm lang über den Kopf, oberer Arm stützt vorne. Langsam von der Achsel bis zur Mitte des Brustkorbs rollen, dabei leicht vor und zurück drehen. Nach der halben Zeit Seite wechseln.',
      { anchor: 'roller', roll: { seg: 'torso', f: [0.95, 0.7] }, a: P(54, [54, 54], [270, 270], { b: [110, 145], hd: 54 }), b: P(54, [54, 54], [270, 270], { b: [110, 145], hd: 54 }) }],
    ['fr_trizeps', 'Trizeps rollen', 'upper', ['Trizeps', 'hintere Schulter'], 'In Seitenlage den Oberarm hinten rollen.',
      'Seitenlage, Arm über den Kopf gestreckt, Rolle unter dem Oberarm hinten. Mit dem anderen Arm abstützen und langsam vom Ellbogen bis zur Achsel rollen. Nach der halben Zeit Seite wechseln.',
      { anchor: 'roller', roll: { seg: 'upperArm', f: [0.45, 0.1] }, a: P(65, [50, 50], [272, 272], { b: [100, 120], hd: 70 }), b: P(65, [50, 50], [272, 272], { b: [100, 120], hd: 70 }) }],
    ['fr_unterarm', 'Unterarm rollen', 'upper', ['Unterarm', 'Handgelenkbeuger und -strecker'], 'Im Kniestand den Unterarm über die Rolle bewegen.',
      'Kniestand, Unterarm auf der Rolle, Handfläche nach unten. Mit dem Körper Druck geben und langsam vom Handgelenk bis zum Ellbogen rollen. Dann Handfläche nach oben drehen. Nach der halben Zeit Seite wechseln.',
      { anchor: 'roller', roll: { seg: 'foreArm', f: [0.9, 0.1] }, a: P(70, [175, 90], [180, 270], { b: [175, 90], hd: 80 }), b: P(70, [175, 90], [180, 270], { b: [175, 90], hd: 80 }) }],
    ['fr_brust', 'Brust & Schulter vorne rollen', 'upper', ['Brust', 'vordere Schulter'], 'In Bauchlage die Brust nahe der Schulter rollen.',
      'Bauchlage, Rolle schräg unter der Brust nahe der Schulter, Arm seitlich ausgestreckt, anderer Arm stützt. Mit kleinen Bewegungen zwischen Brustbein und Schulter rollen. Nach der halben Zeit Seite wechseln.',
      { anchor: 'roller', roll: { seg: 'torso', f: [0.75, 0.95] }, a: P(70, [100, 95], [260, 260], { b: [160, 90], hd: 100 }), b: P(70, [100, 95], [260, 260], { b: [160, 90], hd: 100 }) }]
  ];
  const AREA_LABEL = { upper: 'Oberkörper', core: 'Rumpf', lower: 'Unterkörper' };

  App.Data.FOAM = ROWS.map(function (r) {
    const one = /Seite wechseln/.test(r[5]);
    return { id: r[0], name: r[1], category: 'foam', area: r[2], subCategory: AREA_LABEL[r[2]], targetMuscles: r[3], difficulty: 1,
      equipment: ['Faszienrolle', 'Matte (optional)'], oneSided: one, secondsEach: one ? 90 : 60, description: r[4], instructions: r[5], svgAnimation: r[6],
      flags: {}, pattern: null, position: null, load: 'BW' };
  });
  App.Data.register(App.Data.FOAM);

  /* Bereiche zur Auswahl (wie Trainingsbereiche); Ganzkörper = je 2 aus Oberkörper, Rumpf, Unterkörper */
  App.Data.FOAM_AREAS = [
    { id: 'full', label: 'Ganzkörper', icon: '⚡', from: { upper: 2, core: 2, lower: 2 } },
    { id: 'upper', label: 'Oberkörper', icon: '💪', from: { upper: 5 } },
    { id: 'core', label: 'Rumpf', icon: '🎯', from: { core: 5 } },
    { id: 'lower', label: 'Unterkörper', icon: '🦵', from: { lower: 5 } }
  ];
})();
