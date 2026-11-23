/* ==========================================================================
   11-data-stretches.js  –  DATEN: Dehnübungen und Dehnprogramme
   Gleiche Struktur wie Kraftübungen (category = 'stretch', subCategory = Programm).
   Animation: a = Ausgangsposition, b = gedehnte Endposition (wird gehalten).
   ========================================================================== */
(function () {
  const P = App.Pose.P;
  const Q = P(68, [180, 180], [185, 270]);

  /* [id, name, program, muscles, description, instructions, animation] */
  const ROWS = [
    /* Oberkörper */
    ['st_brust', 'Brustdehnung', 'upper', ['Brust', 'vordere Schulter'], 'Arme hinter dem Körper verschränken.', 'Hände hinter dem Rücken falten, Arme nach hinten oben ziehen, Brust öffnen. Ruhig atmen.',
      { a: P(0, [180, 180]), b: P(-5, [250, 250]) }],
    ['st_schulter', 'Schulterdehnung', 'upper', ['hintere Schulter'], 'Arm quer vor der Brust.', 'Einen Arm quer vor der Brust halten, mit dem anderen Arm sanft zum Körper ziehen. Seite wechseln.',
      { view: 'front', a: P(0, [180, 180]), b: P(0, [130, 40], [180, 180], { b: [250, 260] }) }],
    ['st_latissimus', 'Latissimus-Dehnung', 'upper', ['Latissimus', 'seitlicher Rumpf'], 'Arm über Kopf, zur Seite neigen.', 'Arm gestreckt über den Kopf, Oberkörper zur Gegenseite neigen. Hüfte bleibt stabil.',
      { view: 'front', a: P(0, [0, 0], [180, 180], { b: [190, 190] }), b: P(22, [35, 35], [180, 180], { b: [190, 190] }) }],
    ['st_trizeps', 'Trizepsdehnung', 'upper', ['Trizeps'], 'Hand hinter den Kopf.', 'Ellbogen zeigt zur Decke, Hand zwischen die Schulterblätter. Mit der anderen Hand sanft am Ellbogen drücken.',
      { a: P(0, [180, 180]), b: P(0, [10, 200], [180, 180], { b: [30, 350] }) }],
    ['st_bizeps', 'Bizepsdehnung', 'upper', ['Bizeps', 'Brust'], 'Arm gestreckt nach hinten.', 'Arm gestreckt nach hinten führen, Daumen zeigt nach unten. Oberkörper leicht wegdrehen.',
      { a: P(0, [180, 180]), b: P(0, [250, 250], [180, 180], { b: [180, 180] }) }],

    /* Unterkörper */
    ['st_waden', 'Wadendehnung', 'lower', ['Waden'], 'Ausfallposition an der Wand.', 'Hinteres Bein gestreckt, Ferse am Boden, Hände an der Wand. Hüfte nach vorn schieben.',
      { a: P(0, [180, 180]), b: P(22, [80, 80], [130, 190], { r: [202, 202] }) }],
    ['st_quad', 'Dehnung Oberschenkel vorne', 'lower', ['Oberschenkel vorne'], 'Ferse zum Gesäß ziehen.', 'Auf einem Bein stehen, Fuß zum Gesäß ziehen, Knie zeigt nach unten, Hüfte nach vorn. Seite wechseln.',
      { a: P(0, [180, 180]), b: P(0, [180, 180], [180, 180], { r: [185, 335], b: [240, 280] }) }],
    ['st_hamstring', 'Dehnung Oberschenkel hinten', 'lower', ['hintere Oberschenkel'], 'Vorbeuge mit langem Rücken.', 'Beine fast gestreckt, aus der Hüfte nach vorn beugen, Hände Richtung Fuß gleiten lassen.',
      { a: P(0, [180, 180]), b: P(140, [170, 175], [175, 185]) }],
    ['st_hueftbeuger', 'Hüftbeuger-Dehnung', 'lower', ['Hüftbeuger'], 'Kniender Ausfallschritt.', 'Hinteres Knie am Boden, Becken nach vorn schieben, Arme nach oben strecken. Seite wechseln.',
      { a: P(0, [180, 180], [120, 180], { r: [190, 270] }), b: P(0, [10, 10], [95, 185], { r: [190, 270] }) }],
    ['st_gesaess', 'Gesäßdehnung', 'lower', ['Gesäß', 'Piriformis'], 'Figur-4 in Rückenlage.', 'Rückenlage: Knöchel über das gegenüberliegende Knie legen, das untere Bein zur Brust ziehen. Seite wechseln.',
      { a: P(-90, [90, 90], [0, 90], { r: [0, 90] }), b: P(-90, [30, 60], [35, 275], { r: [-10, 95] }) }],

    /* Rumpf */
    ['st_catcow', 'Cat-Cow', 'core', ['Wirbelsäule', 'Rückenstrecker', 'Bauch'], 'Katzenbuckel und Hohlkreuz im Wechsel.', 'Vierfüßlerstand, mit der Atmung abwechselnd Rücken runden (Cat) und Brust öffnen (Cow).',
      { a: P(60, [180, 180], [185, 270], { hd: 30 }), b: P(78, [180, 180], [185, 270], { hd: 150 }) }],
    ['st_child', 'Child Pose', 'core', ['unterer Rücken', 'Latissimus', 'Gesäß'], 'Gesäß auf die Fersen sinken lassen.', 'Aus dem Vierfüßlerstand das Gesäß zu den Fersen schieben, Arme lang nach vorn, Stirn ablegen.',
      { a: Q, b: P(100, [90, 90], [110, 270], { hd: 120 }) }],
    ['st_cobra', 'Cobra', 'core', ['gerade Bauchmuskeln', 'Hüftbeuger'], 'Aufrichten aus der Bauchlage.', 'Bauchlage: Hände neben die Brust, Oberkörper aufrichten, Becken bleibt am Boden, Schultern weg von den Ohren.',
      { a: P(90, [270, 90], [270, 270]), b: P(22, [180, 180], [270, 270]) }],
    ['st_rotation', 'Rotation im Liegen', 'core', ['Rumpfrotatoren', 'unterer Rücken'], 'Beide Knie zur Seite fallen lassen.', 'Rückenlage, Arme seitlich: Knie anwinkeln, zur Seite sinken lassen, Schultern bleiben am Boden. Seite wechseln.',
      { a: P(-90, [-90, -90], [45, 180]), b: P(-90, [-90, -90], [80, 150]) }],
    ['st_seitbeuge', 'Seitbeuge', 'core', ['seitlicher Rumpf', 'Latissimus'], 'Im Stand zur Seite neigen.', 'Ein Arm über den Kopf, Oberkörper zur Seite neigen, ohne nach vorn zu kippen. Seite wechseln.',
      { view: 'front', a: P(0, [0, 0]), b: P(25, [45, 45]) }],

    /* Rücken – Nacken – Schulter */
    ['st_nacken', 'Nackendehnung', 'rns', ['Nacken', 'Trapez'], 'Kopf seitlich neigen.', 'Ohr Richtung Schulter neigen, Hand legt sich locker auf den Kopf. Gegenüberliegende Schulter bleibt tief.',
      { a: P(0, [180, 180]), b: P(0, [60, 300], [180, 180], { hd: 40 }) }],
    ['st_levator', 'Levator Stretch', 'rns', ['Levator scapulae', 'Nacken'], 'Kopf diagonal nach vorn neigen.', 'Kopf schräg nach vorn unten Richtung Achsel neigen, Hand am Hinterkopf. Seite wechseln.',
      { view: 'front', a: P(0, [180, 180]), b: P(0, [180, 180], [180, 180], { hd: 35, b: [40, 280] }) }],
    ['st_brustoeffner', 'Brustöffner', 'rns', ['Brust', 'vordere Schulter'], 'Arme hinten öffnen, Brust heben.', 'Arme seitlich/hinten oben öffnen, Brustbein nach vorn oben schieben, Blick leicht nach oben.',
      { a: P(0, [180, 180]), b: P(-8, [290, 290], [180, 180], { hd: -25 }) }],
    ['st_schulterblatt', 'Schulterblattmobilisierung', 'rns', ['Schulterblatt', 'Trapez', 'Rautenmuskel'], 'Wall Angels: Arme an der Wand gleiten.', 'Rücken an der Wand, Arme in W-Form, langsam nach oben gleiten und zurück. Kontakt zur Wand halten.',
      { a: P(0, [140, 30]), b: P(0, [10, 10]), props: ['wall'] }],
    ['st_thread', 'Thread the Needle', 'rns', ['oberer Rücken', 'Schulter', 'Rotatoren'], 'Arm unter dem Körper durchfädeln.', 'Aus dem Vierfüßlerstand einen Arm unter dem Körper durchführen, Schulter und Kopf sinken lassen.',
      { a: Q, b: P(80, [190, 185], [185, 270], { b: [250, 270], hd: 130 }) }]
  ];

  App.Data.STRETCHES = ROWS.map(function (r) {
    return { id: r[0], name: r[1], category: 'stretch', subCategory: r[2], targetMuscles: r[3], difficulty: 1,
      equipment: [], oneSided: /Seite wechseln/.test(r[5]), description: r[4], instructions: r[5], svgAnimation: r[6] };
  });
  ['st_gesaess', 'st_catcow', 'st_child', 'st_cobra', 'st_rotation', 'st_thread'].forEach(function (id) {
    App.Data.STRETCHES.filter(e => e.id === id)[0].equipment = ['Matte'];
  });
  App.Data.register(App.Data.STRETCHES);

  /* Dehnprogramme. `forAreas`: Zuordnung zu Kraftbereichen (für "Passendes Dehnungsprogramm"). */
  App.Data.STRETCH_PROGRAMS = [
    { id: 'stretch_upper', label: 'Oberkörper Dehnung', forAreas: ['upper'], secondsEach: 60,
      exerciseIds: ['st_brust', 'st_schulter', 'st_latissimus', 'st_trizeps', 'st_bizeps'] },
    { id: 'stretch_lower', label: 'Unterkörper Dehnung', forAreas: ['lower', 'hiit'], secondsEach: 60,
      exerciseIds: ['st_waden', 'st_quad', 'st_hamstring', 'st_hueftbeuger', 'st_gesaess'] },
    { id: 'stretch_core', label: 'Rumpf Dehnung', forAreas: ['core'], secondsEach: 60,
      exerciseIds: ['st_catcow', 'st_child', 'st_cobra', 'st_rotation', 'st_seitbeuge'] },
    { id: 'stretch_rns', label: 'Rücken · Nacken · Schulter', forAreas: [], secondsEach: 75,
      exerciseIds: ['st_nacken', 'st_levator', 'st_brustoeffner', 'st_schulterblatt', 'st_thread'] }
  ];
})();
