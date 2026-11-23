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
      { a: Q, b: P(80, [190, 185], [185, 270], { b: [250, 270], hd: 130 }) }],

    /* Mobilität Hüfte & Sprunggelenk (dynamisch = Liste DYNAMIC) */
    ['m_9090_switch', '90/90 Hip Switch', 'mob_hip', ['Hüftrotatoren', 'Gesäß', 'Hüftbeuger'], 'Im Sitzen beide Knie von Seite zu Seite drehen.', 'Sitzen, Hände hinter dem Körper, Füße breit aufgestellt. Beide Knie langsam zur einen Seite in die 90/90-Position sinken lassen, dann zur anderen Seite drehen.',
      { a: P(-15, [200, 200], [45, 150], { r: [75, 165] }), b: P(-15, [200, 200], [75, 165], { r: [45, 150] }) }],
    ['m_9090_stretch', '90/90 Dehnung', 'mob_hip', ['Gesäß', 'Hüftrotatoren'], 'In der 90/90-Position über das vordere Bein lehnen.', 'Vorderes Bein 90° vor dem Körper, hinteres Bein 90° seitlich. Mit langem Rücken über das vordere Schienbein lehnen und halten. Seite wechseln.',
      { a: P(-5, [200, 200], [60, 150], { r: [85, 165] }), b: P(40, [150, 150], [60, 150], { r: [85, 165] }) }],
    ['m_adductor_rock', 'Adductor Rock Back', 'mob_hip', ['Adduktoren', 'Hüfte'], 'Vierfüßlerstand, ein Bein seitlich gestreckt, Hüfte nach hinten schieben.', 'Vierfüßlerstand, ein Bein gestreckt zur Seite. Gesäß langsam Richtung Ferse schieben, bis die Innenseite des gestreckten Beins zieht, wieder nach vorn. Nach der halben Zeit Seite wechseln.',
      { a: Q, b: P(92, [125, 125], [135, 270]) }],
    ['m_frog', 'Frog Stretch', 'mob_hip', ['Adduktoren', 'Leiste'], 'Knie weit auseinander, Hüfte nach hinten sinken lassen.', 'Auf Unterarmen und Knien, Knie weit auseinander, Unterschenkel parallel. Hüfte langsam nach hinten sinken lassen und halten.',
      { a: P(78, [180, 90], [180, 270]), b: P(96, [160, 82], [145, 270]) }],
    ['m_wgs', "World's Greatest Stretch", 'mob_hip', ['Hüftbeuger', 'Brustwirbelsäule', 'hintere Oberschenkel'], 'Ausfallschritt, Hand innen am Boden, Arm zur Decke drehen.', 'Tiefer Ausfallschritt, beide Hände innen neben dem vorderen Fuß. Den inneren Arm zur Decke aufdrehen, Blick folgt, zurück. Nach der halben Zeit Seite wechseln.',
      { a: P(60, [180, 180], [95, 180], { r: [240, 240] }), b: P(45, [180, 180], [95, 180], { b: [10, 10], r: [240, 240], hd: 15 }) }],
    ['m_cossack', 'Cossack Squat', 'mob_hip', ['Adduktoren', 'Hüfte', 'Sprunggelenk'], 'Seitliche Kniebeuge von einer Seite zur anderen.', 'Breiter Stand. Gewicht langsam auf ein Bein verlagern und tief beugen, das andere Bein bleibt gestreckt (Zehen hoch). Durch die Mitte zur anderen Seite. Mit Halt an einem Stuhl leichter.',
      { view: 'front', a: P(0, [195, 175], [205, 205], { b: [165, 185], r: [155, 155] }), b: P(0, [150, 150], [232, 232], { b: [210, 210], r: [110, 195] }) }],
    ['m_knee_to_wall', 'Knee-to-Wall (Sprunggelenk)', 'mob_hip', ['Sprunggelenk', 'Waden'], 'Knie über die Zehen Richtung Wand schieben.', 'Schrittstellung vor einer Wand, Hände an der Wand. Vorderes Knie über die Zehen zur Wand schieben, Ferse bleibt am Boden, zurück. Nach der halben Zeit Seite wechseln.',
      { a: P(0, [90, 90], [170, 180], { r: [200, 200] }), b: P(8, [80, 80], [135, 210], { r: [205, 200] }) }],
    ['m_ankle_circles', 'Fußkreisen', 'mob_hip', ['Sprunggelenk', 'Fußmuskulatur'], 'Den angehobenen Fuß langsam kreisen.', 'Auf einem Bein stehen (bei Bedarf festhalten), anderen Fuß leicht anheben und langsam in großen Kreisen bewegen, Richtung wechseln. Nach der halben Zeit Seite wechseln.',
      { a: P(0, [180, 180], [180, 180], { r: [150, 185] }), b: P(0, [180, 180], [180, 180], { r: [150, 150] }) }],
    ['m_calf_dynamic', 'Wadendehnung dynamisch', 'mob_hip', ['Waden', 'Achillessehne'], 'Ferse im Wechsel zum Boden drücken und lösen.', 'Schrittstellung, Hände an der Wand, hinteres Bein gestreckt. Hintere Ferse zum Boden drücken (Dehnung), kurz lösen, wieder drücken – rhythmisch. Nach der halben Zeit Seite wechseln.',
      { a: P(15, [80, 80], [140, 190], { r: [195, 195] }), b: P(24, [80, 80], [128, 190], { r: [204, 204] }) }],

    /* Mobilität Wirbelsäule & Schulter */
    ['m_open_book', 'Open Book', 'mob_spine', ['Brustwirbelsäule', 'Brust', 'Schulter'], 'In Seitenlage den oberen Arm wie ein Buch aufklappen.', 'Seitenlage, Knie angewinkelt übereinander, Arme gestreckt vor der Brust. Oberen Arm in einem Bogen zur anderen Seite öffnen, Blick folgt, Knie bleiben zusammen. Nach der halben Zeit Seite wechseln.',
      { a: P(-90, [40, 40], [60, 170], { b: [40, 40] }), b: P(-90, [40, 40], [60, 170], { b: [-75, -75], hd: -120 }) }],
    ['m_tspine_rot', 'BWS-Rotation im Vierfüßlerstand', 'mob_spine', ['Brustwirbelsäule', 'oberer Rücken'], 'Hand am Hinterkopf, Ellbogen Richtung Decke drehen.', 'Vierfüßlerstand, eine Hand an den Hinterkopf. Ellbogen unter dem Körper Richtung Stützarm führen, dann weit zur Decke aufdrehen, Blick folgt. Nach der halben Zeit Seite wechseln.',
      { a: P(68, [180, 180], [185, 270], { b: [200, 80] }), b: P(68, [180, 180], [185, 270], { b: [335, 200], hd: 30 }) }],
    ['m_wall_rotation', 'Rotation an der Wand', 'mob_spine', ['Brustwirbelsäule', 'Brust'], 'Seitlich zur Wand, Arm nach hinten zur Wand drehen.', 'Seitlich zur Wand stehen, beide Arme gestreckt vor dem Körper. Den äußeren Arm in einem Bogen nach hinten zur Wand führen, Oberkörper dreht mit, Hüfte bleibt vorn, zurück. Seite wechseln.',
      { a: P(0, [90, 90], [180, 180], { b: [90, 90] }), b: P(0, [90, 90], [180, 180], { b: [268, 268], hd: -15 }) }],
    ['m_chair_ext', 'BWS-Streckung über der Stuhllehne', 'mob_spine', ['Brustwirbelsäule', 'Brust'], 'Im Sitzen über die Stuhllehne nach hinten strecken.', 'Auf einem Stuhl mit Lehne sitzen, Hände am Hinterkopf, Ellbogen zusammen. Brustbein über die Lehne nach hinten oben strecken, Becken bleibt ruhig, zurück.',
      { anchor: 'free', a: P(10, [-30, 110], [90, 180]), b: P(-22, [-55, 95], [90, 180], { hd: -45 }) }],
    ['m_shoulder_cars', 'Schulterkreisen (CARs)', 'mob_spine', ['Schultergelenk', 'Rotatorenmanschette'], 'Langsamer, maximal großer Kreis mit einem Arm.', 'Aufrecht, Rumpf fest. Einen gestreckten Arm so langsam und so groß wie möglich kreisen (vorn hoch, hinten runter), der Rumpf dreht nicht mit. Nach der halben Zeit Seite wechseln.',
      { a: P(0, [175, 175], [180, 180], { b: [180, 180] }), b: P(0, [355, 355], [180, 180], { b: [180, 180] }) }],
    ['m_arm_circles', 'Armkreisen', 'mob_spine', ['Schulter', 'oberer Rücken'], 'Arme seitlich ausgestreckt kreisen.', 'Arme seitlich auf Schulterhöhe. Kleine Kreise, langsam größer werden, nach der halben Zeit Richtung wechseln.',
      { view: 'front', a: P(0, [255, 255], [180, 180], { b: [105, 105] }), b: P(0, [290, 290], [180, 180], { b: [70, 70] }) }]
  ];
  /* Dynamische Mobilitätsübungen: im Programm langsam wiederholt statt gehalten */
  const DYNAMIC = ['m_9090_switch', 'm_adductor_rock', 'm_wgs', 'm_cossack', 'm_knee_to_wall', 'm_ankle_circles', 'm_calf_dynamic',
    'm_open_book', 'm_tspine_rot', 'm_wall_rotation', 'm_chair_ext', 'm_shoulder_cars', 'm_arm_circles', 'st_schulterblatt', 'st_catcow'];

  App.Data.STRETCHES = ROWS.map(function (r) {
    return { id: r[0], name: r[1], category: 'stretch', subCategory: r[2], targetMuscles: r[3], difficulty: 1,
      equipment: [], oneSided: /Seite wechseln/.test(r[5]), dynamic: DYNAMIC.indexOf(r[0]) >= 0, description: r[4], instructions: r[5], svgAnimation: r[6] };
  });
  ['st_gesaess', 'st_catcow', 'st_child', 'st_cobra', 'st_rotation', 'st_thread', 'm_9090_switch', 'm_9090_stretch', 'm_adductor_rock', 'm_frog', 'm_wgs',
    'm_open_book', 'm_tspine_rot'].forEach(function (id) {
    App.Data.STRETCHES.filter(e => e.id === id)[0].equipment = ['Matte'];
  });
  App.Data.STRETCHES.filter(e => e.id === 'm_chair_ext')[0].equipment = ['Stuhl'];
  App.Data.STRETCHES.forEach(e => { e.flags = {}; e.pattern = null; e.position = null; e.load = 'BW'; });
  App.Data.register(App.Data.STRETCHES);

  /* Dehnprogramme. `forAreas`: Zuordnung zu Kraftbereichen (für "Passendes Dehnungsprogramm"). */
  App.Data.STRETCH_PROGRAMS = [
    { id: 'stretch_upper', label: 'Oberkörper Dehnung', forAreas: ['upper', 'full'], secondsEach: 60,
      exerciseIds: ['st_brust', 'st_schulter', 'st_latissimus', 'st_trizeps', 'st_bizeps'] },
    { id: 'stretch_lower', label: 'Unterkörper Dehnung', forAreas: ['lower', 'hiit', 'full'], secondsEach: 60,
      exerciseIds: ['st_waden', 'st_quad', 'st_hamstring', 'st_hueftbeuger', 'st_gesaess'] },
    { id: 'stretch_core', label: 'Rumpf Dehnung', forAreas: ['core'], secondsEach: 60,
      exerciseIds: ['st_catcow', 'st_child', 'st_cobra', 'st_rotation', 'st_seitbeuge'] },
    { id: 'stretch_rns', label: 'Rücken · Nacken · Schulter', forAreas: [], secondsEach: 75,
      exerciseIds: ['st_nacken', 'st_levator', 'st_brustoeffner', 'st_schulterblatt', 'st_thread'] },
    /* Mobilität: überwiegend dynamisch (langsame Wiederholungen), ideal zum Aufwärmen oder an trainingsfreien Tagen */
    { id: 'mob_hip', label: 'Mobilität Hüfte & Sprunggelenk', forAreas: [], secondsEach: 45,
      exerciseIds: ['m_9090_switch', 'm_9090_stretch', 'm_adductor_rock', 'm_frog', 'm_wgs', 'm_cossack', 'm_knee_to_wall', 'm_ankle_circles', 'm_calf_dynamic'] },
    { id: 'mob_spine', label: 'Mobilität Wirbelsäule & Schulter', forAreas: [], secondsEach: 45,
      exerciseIds: ['m_open_book', 'm_tspine_rot', 'st_catcow', 'm_wall_rotation', 'm_chair_ext', 'st_schulterblatt', 'm_shoulder_cars', 'm_arm_circles'] }
  ];
})();
