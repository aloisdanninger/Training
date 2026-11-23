/* ==========================================================================
   10-data-exercises.js  –  DATEN: Kraftübungen
   Neue Übung = eine neue Zeile in EXERCISE_ROWS. Sonst ist nichts anzupassen.
   Spalten: id, Name, Kategorie, Unterkategorie, Zielmuskeln, Schwierigkeit(1-3),
            Equipment, Beschreibung, Anleitung, Animation {a, b, props}
   Props (optional): 'dumbbell' | 'step' | 'wall' | {rope:[x,y]}
   ========================================================================== */
App.Data = App.Data || {};

/** Bereiche (Kategorien) mit Anzeigename und Zufallsregeln (Anzahl je Unterkategorie).
   Reihenfolge = Ablauf im Training: HIIT (Aufwärmen/Kondition) zuerst, dann Kraft. */
App.Data.AREAS = [
  { id: 'hiit', label: 'HIIT', icon: '🔥', hiit: true,
    slots: [{ sub: 'Cardio', n: 3 }, { sub: 'Ganzkörper', n: 2 }] },
  { id: 'upper', label: 'Oberkörper', icon: '💪',
    slots: [{ sub: 'Drücken', n: 2 }, { sub: 'Ziehen', n: 2 }, { sub: 'Arme', n: 1 }] },
  { id: 'core', label: 'Rumpf', icon: '🎯',
    slots: [{ sub: 'Bauch', n: 2 }, { sub: 'Rücken', n: 2 }, { sub: 'Seitliche Stabilität', n: 1 }] },
  { id: 'lower', label: 'Unterkörper', icon: '🦵',
    slots: [{ sub: 'Knie dominant', n: 2 }, { sub: 'Hüftdominant', n: 2 }, { sub: 'Stabilität', n: 1 }] }
];

/**
 * Referenztraining (1x pro Monat, immer identisch): prüft alle wichtigen Muskelgruppen der 3 Kraftbereiche.
 * Drücken wird über den Knie-Liegestütz getestet (Ziel: voller Liegestütz), Trizeps separat.
 */
App.Data.REFERENCE = [
  'knie_liegestuetz', 'schulterdruecken', 'bent_over_row', 'trizeps_ueberkopf',     // Brust · Schulter · Rücken/Bizeps · Trizeps
  'plank', 'dead_bug', 'superman', 'side_plank',                                   // gerade/tiefe Bauchmuskeln · Rückenstrecker · seitlich
  'kniebeuge', 'romanian_deadlift', 'glute_bridge', 'ausfallschritt'               // Oberschenkel vorne · hinten · Gesäß · Stabilität
];

(function () {
  const P = App.Pose.P;
  const Q = P(68, [180, 180], [185, 270]);                    // Vierfüßlerstand
  const PU_UP = P(63, [180, 180], [243, 243]);                // Liegestütz oben
  const PU_DN = P(72, [235, 145], [252, 252]);                // Liegestütz unten
  const STAND = P(0, [180, 180], [180, 180]);

  /* [id, name, cat, sub, muscles, difficulty, equipment, description, instructions, animation] */
  const EXERCISE_ROWS = [
    /* ---------- OBERKÖRPER · Drücken ---------- */
    ['liegestuetz', 'Liegestütz', 'upper', 'Drücken', ['Brust', 'Trizeps', 'vordere Schulter'], 2, [],
      'Klassischer Liegestütz mit geradem Körper.', 'Hände schulterbreit, Körper bildet eine Linie. Brust zum Boden senken, kontrolliert hochdrücken.',
      { a: PU_UP, b: PU_DN }],
    ['schraeg_liegestuetz', 'Schrägliegestütz', 'upper', 'Drücken', ['Brust', 'Trizeps'], 1, ['Bank/Stuhl'],
      'Leichtere Variante mit erhöhten Händen.', 'Hände auf Bank oder Stuhl. Körper gerade halten, Brust zur Kante senken und wieder wegdrücken.',
      { a: P(40, [180, 180], [220, 220]), b: P(52, [235, 145], [232, 232]) }],
    ['schulterdruecken', 'Schulterdrücken', 'upper', 'Drücken', ['Schulter', 'Trizeps'], 2, ['Kurzhanteln'],
      'Kurzhanteln über den Kopf drücken.', 'Aufrecht stehen, Rumpf anspannen. Hanteln von Schulterhöhe senkrecht nach oben drücken.',
      { a: P(0, [165, 10]), b: P(0, [0, 0]), props: ['dumbbell'] }],
    ['arnold_press', 'Arnold Press', 'upper', 'Drücken', ['Schulter', 'Trizeps'], 2, ['Kurzhanteln'],
      'Schulterdrücken mit Drehbewegung.', 'Hanteln vor der Brust, Handflächen zu dir. Beim Hochdrücken die Hände nach außen drehen.',
      { a: P(0, [135, 350]), b: P(0, [0, 0]), props: ['dumbbell'] }],
    ['trx_chest_press', 'TRX Chest Press', 'upper', 'Drücken', ['Brust', 'Trizeps', 'Rumpf'], 2, ['TRX'],
      'Brustpresse am Schlingentrainer.', 'Körper gestreckt nach vorn lehnen, Griffe auf Brusthöhe. Kontrolliert absenken und wegdrücken.',
      { a: P(20, [110, 110], [200, 200]), b: P(32, [150, 60], [212, 212]), props: [{ rope: [25, 20] }] }],
    ['enge_liegestuetz', 'Enge Liegestütz', 'upper', 'Drücken', ['Trizeps', 'Brust'], 3, [],
      'Liegestütz mit engem Handabstand.', 'Hände unter der Brust eng zusammen. Ellbogen nah am Körper führen.',
      { a: PU_UP, b: P(72, [215, 170], [252, 252]) }],

    /* ---------- OBERKÖRPER · Ziehen ---------- */
    ['trx_row', 'TRX Rows', 'upper', 'Ziehen', ['oberer Rücken', 'Bizeps', 'hintere Schulter'], 2, ['TRX'],
      'Rudern am Schlingentrainer.', 'Körper gestreckt nach hinten lehnen. Brust zu den Griffen ziehen, Schulterblätter zusammen.',
      { a: P(-22, [60, 60], [158, 158]), b: P(-10, [215, 95], [170, 170]), props: [{ rope: [215, 15] }] }],
    ['kurzhantelrudern', 'Kurzhantelrudern', 'upper', 'Ziehen', ['Latissimus', 'Bizeps', 'Rautenmuskel'], 2, ['Kurzhantel'],
      'Einarmiges Rudern im Vorbeugen.', 'Rücken gerade, eine Hand stützt. Hantel zur Hüfte ziehen, Ellbogen nah am Körper.',
      { a: P(72, [180, 180], [170, 190], { b: [140, 170] }), b: P(72, [250, 175], [170, 190], { b: [140, 170] }), props: ['dumbbell'] }],
    ['face_pull', 'Face Pull', 'upper', 'Ziehen', ['hintere Schulter', 'Trapez', 'Rotatorenmanschette'], 1, ['Band/Kabel'],
      'Zug zum Gesicht für gesunde Schultern.', 'Band auf Gesichtshöhe. Zum Gesicht ziehen, Ellbogen hoch und weit nach hinten.',
      { a: P(0, [90, 90]), b: P(0, [265, 25]), props: [{ rope: [220, 60] }] }],
    ['upright_row', 'Upright Row', 'upper', 'Ziehen', ['Schulter', 'Trapez', 'Bizeps'], 2, ['Kurzhanteln'],
      'Aufrechtes Rudern entlang des Körpers.', 'Hanteln nah am Körper bis zur Brust ziehen, Ellbogen führen die Bewegung.',
      { a: P(0, [170, 175]), b: P(0, [95, 205]), props: ['dumbbell'] }],
    ['bent_over_row', 'Bent Over Row', 'upper', 'Ziehen', ['Rücken', 'Bizeps', 'Gesäß'], 2, ['Kurzhanteln'],
      'Beidarmiges Rudern im Vorbeugen.', 'Hüfte nach hinten, Rücken gerade. Hanteln zum Bauchnabel ziehen.',
      { a: P(68, [180, 180], [165, 190]), b: P(68, [250, 175], [165, 190]), props: ['dumbbell'] }],

    /* ---------- OBERKÖRPER · Arme ---------- */
    ['bizeps_curl', 'Bizeps Curl', 'upper', 'Arme', ['Bizeps'], 1, ['Kurzhanteln'],
      'Klassisches Beugen der Arme.', 'Oberarme am Körper fixieren. Hanteln beugen, oben kurz anspannen, langsam senken.',
      { a: P(0, [175, 175]), b: P(0, [175, 25]), props: ['dumbbell'] }],
    ['hammer_curl', 'Hammer Curl', 'upper', 'Arme', ['Bizeps', 'Brachialis', 'Unterarm'], 1, ['Kurzhanteln'],
      'Curl mit neutralem Griff (Daumen oben).', 'Handflächen zeigen zueinander. Ohne Schwung beugen und senken.',
      { a: P(0, [175, 175]), b: P(0, [175, 25]), props: ['dumbbell'] }],
    ['trizeps_dip', 'Trizeps Dip', 'upper', 'Arme', ['Trizeps', 'Schulter'], 2, ['Bank/Stuhl'],
      'Dips mit Händen auf Bank oder Stuhl.', 'Hände hinter dem Gesäß auf der Kante, Ellbogen zeigen nach hinten. Beugen und strecken.',
      { a: P(0, [195, 195], [100, 175]), b: P(0, [240, 150], [95, 170]) }],
    ['trizeps_kickback', 'Trizeps Kickback', 'upper', 'Arme', ['Trizeps'], 1, ['Kurzhantel'],
      'Armstrecken im Vorbeugen.', 'Oberarm parallel zum Rücken fixieren, nur den Unterarm nach hinten strecken.',
      { a: P(70, [265, 185], [165, 190]), b: P(70, [265, 270], [165, 190]), props: ['dumbbell'] }],

    /* ---------- RUMPF · Bauch ---------- */
    ['plank', 'Plank', 'core', 'Bauch', ['gerade Bauchmuskeln', 'Rumpf', 'Schulter'], 1, [],
      'Unterarmstütz als Halteübung.', 'Ellbogen unter den Schultern, Körper bildet eine Linie. Bauch und Gesäß fest anspannen.',
      { a: P(76, [180, 90], [256, 256]), b: P(74, [180, 90], [254, 254]) }],
    ['dead_bug', 'Dead Bug', 'core', 'Bauch', ['tiefe Bauchmuskeln', 'Hüftbeuger'], 1, [],
      'Gegengleiches Strecken in Rückenlage.', 'Rückenlage, Arme zur Decke, Knie 90° über der Hüfte. Unterer Rücken bleibt am Boden. Gegenüberliegenden Arm und Bein langsam strecken.',
      { a: P(-90, [0, 0], [0, 90], { b: [0, 0], r: [0, 90] }), b: P(-90, [-90, -90], [0, 90], { b: [0, 0], r: [90, 90] }) }],
    ['hollow_hold', 'Hollow Hold', 'core', 'Bauch', ['gerade Bauchmuskeln', 'Hüftbeuger'], 3, [],
      'Bananenhaltung in Rückenlage.', 'Rückenlage: Schultern und Beine leicht anheben, unterer Rücken drückt in den Boden. Position halten.',
      { a: P(-90, [-90, -90], [90, 90]), b: P(-68, [-78, -78], [68, 68]) }],
    ['bicycle_crunch', 'Bicycle Crunch', 'core', 'Bauch', ['schräge Bauchmuskeln', 'gerade Bauchmuskeln'], 2, [],
      'Fahrradbewegung mit Rumpfdrehung.', 'Rückenlage, Hände am Kopf. Ellbogen zum gegenüberliegenden Knie führen, Beine wechseln.',
      { a: P(-62, [-30, -150], [20, 100], { r: [80, 80] }), b: P(-62, [-30, -150], [80, 80], { r: [20, 100] }) }],
    ['reverse_crunch', 'Reverse Crunch', 'core', 'Bauch', ['untere Bauchmuskeln'], 2, [],
      'Becken zur Brust rollen.', 'Rückenlage, Knie über der Hüfte. Becken kontrolliert vom Boden rollen – kein Schwung.',
      { a: P(-90, [90, 90], [0, 90]), b: P(-88, [90, 90], [-35, 70]) }],

    /* ---------- RUMPF · Rücken ---------- */
    ['superman', 'Superman', 'core', 'Rücken', ['Rückenstrecker', 'Gesäß'], 1, [],
      'Arme und Beine in Bauchlage anheben.', 'Bauchlage: Gesicht zum Boden, Arme nach vorn gestreckt. Arme und Beine gleichzeitig anheben, oben kurz halten.',
      { a: P(90, [90, 90], [270, 270]), b: P(78, [72, 72], [285, 285]) }],
    ['bird_dog', 'Bird Dog', 'core', 'Rücken', ['Rückenstrecker', 'Gesäß', 'Rumpf'], 1, [],
      'Gegengleiches Strecken im Vierfüßlerstand.', 'Rücken bleibt gerade. Gegenüberliegenden Arm und Bein waagrecht strecken.',
      { a: Q, b: P(68, [90, 90], [185, 270], { b: [180, 180], r: [272, 272] }) }],
    ['rueckenstrecker', 'Rückenstrecker', 'core', 'Rücken', ['Rückenstrecker', 'Gesäß'], 2, ['Bank (optional)'],
      'Oberkörper aus der Vorbeuge aufrichten.', 'Hüfte fixiert, Oberkörper bis zur Verlängerung der Beine heben, nicht überstrecken.',
      { a: P(125, [140, 40], [190, 190]), b: P(25, [140, 40], [190, 190]) }],
    ['hip_extension', 'Hip Extension', 'core', 'Rücken', ['Gesäß', 'Rückenstrecker'], 1, [],
      'Beinstrecken nach hinten im Vierfüßlerstand.', 'Bein aus der Hüfte nach hinten oben strecken, Becken ruhig halten.',
      { a: Q, b: P(68, [180, 180], [185, 270], { r: [290, 285] }) }],
    ['good_morning', 'Good Morning', 'core', 'Rücken', ['Rückenstrecker', 'hintere Oberschenkel'], 2, [],
      'Hüftbeuge mit geradem Rücken.', 'Hände am Kopf, Hüfte nach hinten schieben, Rücken lang, dann wieder aufrichten.',
      { a: P(0, [-30, 110]), b: P(75, [-30, 110], [172, 190]) }],

    /* ---------- RUMPF · Seitliche Stabilität ---------- */
    ['side_plank', 'Side Plank', 'core', 'Seitliche Stabilität', ['seitliche Bauchmuskeln', 'Hüfte'], 2, [],
      'Seitstütz, Körper in einer Linie.', 'Ellbogen unter der Schulter, Hüfte hoch. Oberen Arm zur Decke strecken. Pro Seite halten.',
      { view: 'front', a: P(-55, [180, 180], [125, 125], { b: [0, 0] }), b: P(-65, [180, 180], [115, 115], { b: [0, 0] }) }],
    ['pallof_press', 'Pallof Press', 'core', 'Seitliche Stabilität', ['Rumpf', 'schräge Bauchmuskeln'], 2, ['Band/Kabel'],
      'Anti-Rotation mit Band.', 'Band seitlich verankert. Hände von der Brust nach vorn drücken, Rumpf nicht mitdrehen lassen.',
      { a: P(0, [170, 95]), b: P(0, [90, 90]), props: [{ rope: [20, 95] }] }],
    ['russian_twist', 'Russian Twist', 'core', 'Seitliche Stabilität', ['schräge Bauchmuskeln'], 2, [],
      'Rumpfdrehung im Sitz.', 'Oberkörper leicht zurück, Füße angehoben. Hände von Seite zu Seite führen.',
      { a: P(-30, [135, 135], [70, 110]), b: P(-30, [75, 75], [70, 110]) }],
    ['side_plank_reach', 'Side Plank Reach Through', 'core', 'Seitliche Stabilität', ['schräge Bauchmuskeln', 'Schulter'], 3, [],
      'Seitstütz mit Durchgreifen.', 'Aus dem Seitstütz den oberen Arm unter dem Körper durchführen, dann wieder öffnen.',
      { view: 'front', a: P(-55, [180, 180], [125, 125], { b: [0, 0] }), b: P(-60, [180, 180], [120, 120], { b: [205, 230] }) }],

    /* ---------- UNTERKÖRPER · Knie dominant ---------- */
    ['kniebeuge', 'Kniebeuge', 'lower', 'Knie dominant', ['Oberschenkel vorne', 'Gesäß'], 1, [],
      'Grundübung für die Beine.', 'Füße schulterbreit, Gewicht auf der ganzen Sohle. Hüfte nach hinten unten, Brust aufrecht.',
      { a: P(0, [90, 90]), b: P(35, [90, 90], [100, 215]) }],
    ['goblet_squat', 'Goblet Squat', 'lower', 'Knie dominant', ['Oberschenkel vorne', 'Gesäß', 'Rumpf'], 1, ['Kurzhantel'],
      'Kniebeuge mit Hantel vor der Brust.', 'Hantel mit beiden Händen vor die Brust, Ellbogen nach unten, tief beugen.',
      { a: P(0, [160, 70]), b: P(30, [160, 70], [100, 215]), props: ['dumbbell'] }],
    ['step_up', 'Step Up', 'lower', 'Knie dominant', ['Oberschenkel vorne', 'Gesäß'], 1, ['Stufe/Bank'],
      'Auf eine Stufe steigen.', 'Ganzer Fuß auf der Stufe, mit dem vorderen Bein hochdrücken, kontrolliert zurück.',
      { a: P(5, [180, 180], [100, 190], { r: [180, 180] }), b: P(0, [180, 180], [180, 180], { r: [95, 175] }), props: ['step'], anchor: 'free' }],
    ['bulgarian_split_squat', 'Bulgarian Split Squat', 'lower', 'Knie dominant', ['Oberschenkel vorne', 'Gesäß'], 3, ['Bank'],
      'Einbeinige Kniebeuge mit erhöhtem hinterem Fuß.', 'Hinterer Fuß auf der Bank. Senkrecht absenken, vorderes Knie bleibt über dem Fuß.',
      { a: P(5, [180, 180], [140, 180], { r: [235, 285] }), b: P(10, [180, 180], [100, 200], { r: [205, 280] }) }],
    ['wall_sit', 'Wall Sit', 'lower', 'Knie dominant', ['Oberschenkel vorne'], 1, ['Wand'],
      'Statisches Sitzen an der Wand.', 'Rücken an der Wand, Knie 90°. Position halten, nicht mit den Händen abstützen.',
      { a: P(0, [180, 180], [110, 190]), b: P(0, [160, 160], [90, 180]), props: ['wall'] }],

    /* ---------- UNTERKÖRPER · Hüftdominant ---------- */
    ['hip_thrust', 'Hip Thrust', 'lower', 'Hüftdominant', ['Gesäß', 'hintere Oberschenkel'], 2, ['Bank (optional)'],
      'Hüftheben mit Schulter auf Bank.', 'Rückenlage, obere Rückenpartie auf der Bank. Hüfte kräftig nach oben drücken, oben Gesäß anspannen.',
      { a: P(-60, [100, 100], [45, 180]), b: P(-92, [100, 100], [85, 190]) }],
    ['romanian_deadlift', 'Romanian Deadlift', 'lower', 'Hüftdominant', ['hintere Oberschenkel', 'Gesäß', 'Rückenstrecker'], 2, ['Kurzhanteln'],
      'Hüftbeuge mit fast gestreckten Beinen.', 'Hanteln nah am Bein entlang gleiten lassen, Rücken gerade, bis zur Dehnung hinten.',
      { a: STAND, b: P(75, [180, 180], [172, 185]), props: ['dumbbell'] }],
    ['glute_bridge', 'Glute Bridge', 'lower', 'Hüftdominant', ['Gesäß', 'hintere Oberschenkel'], 1, [],
      'Beckenheben in Rückenlage.', 'Rückenlage, Füße aufgestellt. Hüfte anheben bis Schulter–Knie eine Linie bilden.',
      { a: P(-90, [90, 90], [45, 180]), b: P(-105, [90, 90], [85, 190]) }],
    ['kettlebell_swing', 'Kettlebell Swing', 'lower', 'Hüftdominant', ['Gesäß', 'hintere Oberschenkel', 'Rücken'], 3, ['Kettlebell'],
      'Explosives Hüftschwingen.', 'Hüfte nach hinten, dann explosiv strecken. Die Kraft kommt aus der Hüfte, nicht aus den Armen.',
      { a: P(65, [200, 200], [165, 195]), b: P(0, [90, 90]), props: ['dumbbell'] }],
    ['single_leg_deadlift', 'Single Leg Deadlift', 'lower', 'Hüftdominant', ['Gesäß', 'hintere Oberschenkel', 'Gleichgewicht'], 3, ['Kurzhantel (optional)'],
      'Einbeiniges Kreuzheben.', 'Oberkörper nach vorn kippen, Bein nach hinten strecken, Hüfte bleibt gerade.',
      { a: STAND, b: P(85, [180, 180], [178, 182], { r: [268, 268] }) }],

    /* ---------- UNTERKÖRPER · Stabilität ---------- */
    ['ausfallschritt', 'Ausfallschritt', 'lower', 'Stabilität', ['Oberschenkel', 'Gesäß'], 1, [],
      'Schritt nach vorn in die Tiefe.', 'Großer Schritt, hinteres Knie Richtung Boden, Oberkörper aufrecht, zurückdrücken.',
      { a: STAND, b: P(0, [180, 180], [95, 190], { r: [200, 275] }) }],
    ['seitlicher_ausfallschritt', 'Seitlicher Ausfallschritt', 'lower', 'Stabilität', ['Innenseite Oberschenkel', 'Gesäß'], 2, [],
      'Schritt zur Seite.', 'Weit zur Seite treten, Gesäß nach hinten, anderes Bein bleibt gestreckt.',
      { view: 'front', a: P(0, [195, 170], [180, 180], { b: [165, 190] }), b: P(0, [195, 170], [220, 220], { b: [165, 190], r: [123, 180] }) }],
    ['einbeinstand', 'Einbeinstand', 'lower', 'Stabilität', ['Fußmuskulatur', 'Hüfte', 'Gleichgewicht'], 1, [],
      'Gleichgewicht auf einem Bein.', 'Standbein leicht gebeugt, anderes Knie anheben, ruhig halten. Seite wechseln.',
      { a: P(0, [140, 140]), b: P(0, [100, 100], [180, 180], { r: [100, 175] }) }],
    ['curtsy_lunge', 'Curtsy Lunge', 'lower', 'Stabilität', ['Gesäß', 'seitliche Hüfte', 'Oberschenkel'], 2, [],
      'Ausfallschritt diagonal nach hinten.', 'Ein Bein diagonal hinter das Standbein stellen, absenken, Becken bleibt gerade.',
      { view: 'front', a: P(0, [195, 170], [180, 180], { b: [165, 190] }), b: P(0, [195, 170], [205, 170], { b: [165, 190], r: [195, 225] }) }],
    /* ---------- OBERKÖRPER · Drücken: Aufbau bis zum ersten Liegestütz (Kieser D6 Brustdrücken) ---------- */
    ['wand_liegestuetz', 'Wand-Liegestütz', 'upper', 'Drücken', ['Brust', 'Trizeps', 'vordere Schulter'], 1, ['Wand'],
      'Einstieg: Liegestütz gegen die Wand.', 'Hände schulterbreit auf Brusthöhe an die Wand, Körper gerade. Brust zur Wand senken und kräftig wegdrücken. Je weiter die Füße von der Wand weg, desto schwerer.',
      { a: P(20, [95, 95], [200, 200]), b: P(28, [150, 40], [205, 205]) }],
    ['knie_liegestuetz', 'Knie-Liegestütz', 'upper', 'Drücken', ['Brust', 'Trizeps', 'vordere Schulter'], 1, [],
      'Liegestütz auf den Knien – der wichtigste Aufbauschritt.', 'Knie auf der Matte, Hände etwas breiter als die Schultern. Körper von Knie bis Kopf gerade, Brust bis knapp über den Boden senken, kräftig hochdrücken.',
      { a: P(55, [180, 180], [230, 270]), b: P(72, [235, 145], [240, 270]) }],
    ['negativ_liegestuetz', 'Negativ-Liegestütz', 'upper', 'Drücken', ['Brust', 'Trizeps', 'Rumpf'], 2, [],
      'Nur das Absenken – baut Kraft für den ersten vollen Liegestütz auf.', 'Im hohen Stütz starten und so langsam wie möglich (4–5 s) bis zum Boden absenken. Über die Knie wieder hochkommen und erneut absenken.',
      { a: PU_UP, b: PU_DN }],
    ['floor_press', 'Bodendrücken (Brustpresse)', 'upper', 'Drücken', ['Brust', 'Trizeps', 'vordere Schulter'], 1, ['Kurzhanteln'],
      'Brustdrücken in Rückenlage – wie die Kieser-Maschine D6.', 'Rückenlage, Knie aufgestellt, Oberarme im 45°-Winkel zum Körper am Boden. Hanteln senkrecht nach oben drücken, langsam ablassen, bis die Ellbogen den Boden berühren.',
      { a: P(-90, [100, 0], [45, 180]), b: P(-90, [0, 0], [45, 180]), props: ['dumbbell'] }],
    ['kb_press', 'Kettlebell Press einarmig', 'upper', 'Drücken', ['Schulter', 'Trizeps', 'Rumpf'], 2, ['Kettlebell'],
      'Einarmiges Drücken über Kopf.', 'Kettlebell in Rack-Position an der Schulter, Rumpf und Gesäß fest. Senkrecht über den Kopf drücken, Bizeps neben dem Ohr, kontrolliert zurück. Seite wechseln.',
      { a: P(0, [165, 10], [180, 180], { b: [180, 180] }), b: P(0, [0, 0], [180, 180], { b: [180, 180] }), props: ['dumbbell'] }],
    ['seitheben', 'Seitheben', 'upper', 'Drücken', ['seitliche Schulter'], 1, ['Kurzhanteln'],
      'Arme seitlich bis Schulterhöhe heben – wie Kieser E2.', 'Ellbogen leicht gebeugt, Hanteln seitlich bis auf Schulterhöhe führen, nicht höher. Langsam senken, Schultern bleiben tief.',
      { view: 'front', a: P(0, [190, 185], [180, 180], { b: [170, 175] }), b: P(0, [275, 265], [180, 180], { b: [85, 95] }), props: ['dumbbell'] }],

    /* ---------- OBERKÖRPER · Ziehen (Kieser C1 Überzug, C5 Rudern) ---------- */
    ['pullover', 'Kurzhantel-Pullover (Überzug)', 'upper', 'Ziehen', ['Latissimus', 'Brust', 'Trizeps'], 2, ['Kurzhantel'],
      'Überzug in Rückenlage – wie Kieser C1.', 'Rückenlage (Boden oder quer auf der Bank), Hantel mit beiden Händen über der Brust. Mit fast gestreckten Armen hinter den Kopf absenken, bis der breite Rückenmuskel gedehnt ist, und zurückführen.',
      { a: P(-90, [0, 0], [45, 180]), b: P(-90, [-80, -80], [45, 180]), props: ['dumbbell'] }],
    ['y_raise', 'Y-Heben in Bauchlage', 'upper', 'Ziehen', ['unterer Trapez', 'hintere Schulter', 'Rückenstrecker'], 1, [],
      'Arme in Y-Form anheben – für eine aufrechte Haltung.', 'Bauchlage, Stirn knapp über dem Boden, Arme schräg nach vorn (Y), Daumen zeigen nach oben. Schulterblätter nach hinten unten ziehen, Arme anheben, 2 s halten.',
      { a: P(90, [95, 95], [270, 270]), b: P(86, [72, 72], [270, 270]) }],
    ['kb_high_pull', 'Kettlebell High Pull', 'upper', 'Ziehen', ['oberer Rücken', 'Trapez', 'hintere Schulter', 'Gesäß'], 2, ['Kettlebell'],
      'Kraftvolles Hochziehen aus der Hüfte.', 'Kettlebell mit beiden Händen zwischen den Beinen, Hüfte nach hinten. Hüfte explosiv strecken und die Kettlebell mit hohen Ellbogen bis zur Brust ziehen, kontrolliert absenken.',
      { a: P(45, [180, 180], [150, 200]), b: P(0, [95, 205]), props: ['dumbbell'] }],

    /* ---------- OBERKÖRPER · Arme (Kieser H2 Armstreckung) ---------- */
    ['trizeps_ueberkopf', 'Trizepsdrücken über Kopf', 'upper', 'Arme', ['Trizeps'], 1, ['Kurzhantel'],
      'Armstrecken über dem Kopf – wichtig für den Liegestütz.', 'Hantel mit beiden Händen hinter dem Kopf, Oberarme senkrecht neben den Ohren. Nur die Unterarme nach oben strecken und langsam wieder absenken.',
      { a: P(0, [350, 200]), b: P(0, [0, 0]), props: ['dumbbell'] }],

    /* ---------- RUMPF (Kieser F2.1 Bauch, F1.1 Rumpfdrehung) ---------- */
    ['crunch', 'Crunch', 'core', 'Bauch', ['gerade Bauchmuskeln'], 1, [],
      'Oberkörper einrollen – wie Kieser F2.1.', 'Rückenlage, Knie aufgestellt, Hände an den Schläfen. Oberkörper einrollen, bis die Schulterblätter abheben, dabei ausatmen; langsam zurück.',
      { a: P(-90, [-30, -150], [45, 180]), b: P(-62, [-10, -130], [45, 180]) }],
    ['holzhacker', 'Kettlebell Holzhacker', 'core', 'Seitliche Stabilität', ['schräge Bauchmuskeln', 'Schulter', 'Gesäß'], 2, ['Kettlebell'],
      'Diagonale Zugbewegung – wie Kieser F1.1 Rumpfdrehung.', 'Kettlebell mit beiden Händen diagonal über der Schulter. Kontrolliert diagonal Richtung gegenüberliegendes Knie führen, Rumpf dreht mit, Hüfte beugt leicht. Seite wechseln.',
      { a: P(0, [30, 30], [180, 180]), b: P(20, [200, 200], [150, 200]), props: ['dumbbell'] }],
    ['kb_windmill', 'Kettlebell Windmill', 'core', 'Seitliche Stabilität', ['schräge Bauchmuskeln', 'Schulter', 'hintere Oberschenkel'], 3, ['Kettlebell'],
      'Seitbeuge mit Gewicht über dem Kopf.', 'Kettlebell mit gestrecktem Arm über dem Kopf, Blick zur Kettlebell. Hüfte zur Seite schieben, freie Hand am Bein entlang Richtung Fuß gleiten lassen, langsam aufrichten. Seite wechseln. Leichter: ohne Gewicht.',
      { view: 'front', a: P(0, [185, 180], [190, 190], { b: [0, 0], r: [170, 170] }), b: P(-45, [180, 180], [195, 195], { b: [0, 0], r: [170, 170] }) }],

    /* ---------- UNTERKÖRPER (Kieser B1, B7, A3) + Kettlebell ---------- */
    ['kniestrecken_sitzend', 'Kniestrecken im Sitzen', 'lower', 'Knie dominant', ['Oberschenkel vorne'], 1, ['Stuhl'],
      'Beinstrecken auf dem Stuhl – wie Kieser B1.', 'Aufrecht auf einem Stuhl, Hände halten die Sitzfläche. Ein Bein langsam ganz strecken, oben 2 s halten (Oberschenkel anspannen, Zehen anziehen), langsam senken. Mit Gewichtsmanschette schwerer. Seite wechseln.',
      { a: P(0, [175, 175], [90, 180]), b: P(0, [175, 175], [88, 92], { r: [90, 180] }), anchor: 'free' }],
    ['kb_sumo_squat', 'Kettlebell Sumo-Kniebeuge', 'lower', 'Knie dominant', ['Oberschenkel', 'Innenseite Oberschenkel', 'Gesäß'], 1, ['Kettlebell'],
      'Breite Kniebeuge mit Kettlebell.', 'Breiter Stand, Fußspitzen nach außen, Kettlebell hängt mit gestreckten Armen zwischen den Beinen. Gerade nach unten beugen, Knie zeigen über die Zehen, wieder aufrichten.',
      { view: 'front', a: P(0, [175, 185], [200, 180], { b: [185, 175], r: [160, 180] }), b: P(0, [178, 182], [225, 160], { b: [182, 178], r: [135, 200] }) }],
    ['slider_leg_curl', 'Beinbeuger am Boden (Handtuch)', 'lower', 'Hüftdominant', ['hintere Oberschenkel', 'Gesäß'], 3, ['Handtuch/Gleiter'],
      'Beinbeugen in der Brücke – wie Kieser B7.', 'Rückenlage, Fersen auf einem Handtuch (glatter Boden) oder Gleitern. Becken heben, Fersen zum Gesäß ziehen und langsam wieder wegschieben, das Becken bleibt oben. Leichter: nur langsam wegschieben.',
      { a: P(-100, [90, 90], [100, 100]), b: P(-105, [90, 90], [85, 190]) }],
    ['kb_deadlift', 'Kettlebell Kreuzheben', 'lower', 'Hüftdominant', ['Gesäß', 'hintere Oberschenkel', 'Rückenstrecker'], 1, ['Kettlebell'],
      'Hüftbeuge mit Kettlebell zwischen den Füßen.', 'Kettlebell zwischen den Füßen, Hüfte nach hinten, Rücken gerade, Griff mit beiden Händen. Durch die Fersen drücken und aufrichten, oben das Gesäß anspannen.',
      { a: P(70, [180, 180], [150, 200]), b: STAND, props: ['dumbbell'] }],
    ['seitliches_beinheben', 'Seitliches Beinheben', 'lower', 'Stabilität', ['seitliche Hüfte', 'Gesäß (Abduktoren)'], 1, [],
      'Bein seitlich abspreizen – wie Kieser A3.', 'Aufrecht stehen, mit einer Hand an Wand oder Stuhl festhalten. Gestrecktes Bein langsam seitlich anheben, Zehen zeigen nach vorn, 2 s halten, langsam senken. Seite wechseln.',
      { view: 'front', a: P(0, [185, 185], [185, 185], { b: [175, 175], r: [180, 180] }), b: P(-5, [190, 190], [230, 230], { b: [170, 170], r: [180, 180] }) }],

    /* ---------- HIIT · Cardio ---------- */
    ['hampelmann', 'Hampelmann', 'hiit', 'Cardio', ['Ganzkörper', 'Herz-Kreislauf', 'Waden'], 1, [],
      'Klassischer Hampelmann.', 'In die Grätsche springen und die Arme über den Kopf führen, zurück in die Ausgangsposition. Gelenkschonend: abwechselnd ein Bein seitlich tippen statt springen.',
      { view: 'front', anchor: 'free', a: P(0, [190, 185], [185, 185], { b: [170, 175], r: [175, 175] }), b: P(0, [315, 330], [205, 200], { b: [45, 30], r: [155, 160] }) }],
    ['high_knees', 'Knieheben (High Knees)', 'hiit', 'Cardio', ['Hüftbeuger', 'Oberschenkel', 'Herz-Kreislauf'], 2, [],
      'Laufen auf der Stelle mit hohen Knien.', 'Aufrecht bleiben, Knie abwechselnd bis Hüfthöhe ziehen, Arme schwingen gegengleich mit. Leise auf dem Vorfuß landen.',
      { anchor: 'free', a: P(0, [150, 60], [95, 185], { b: [210, 150], r: [180, 180] }), b: P(0, [210, 150], [180, 180], { b: [150, 60], r: [95, 185] }) }],
    ['anfersen', 'Anfersen', 'hiit', 'Cardio', ['hintere Oberschenkel', 'Herz-Kreislauf'], 1, [],
      'Laufen auf der Stelle, Fersen zum Gesäß.', 'Leicht nach vorn geneigt, Fersen abwechselnd zum Gesäß kicken, Arme schwingen mit.',
      { anchor: 'free', a: P(5, [160, 40], [190, 330], { b: [200, 140], r: [180, 180] }), b: P(5, [200, 140], [180, 180], { b: [160, 40], r: [190, 330] }) }],
    ['skater', 'Skater Hops', 'hiit', 'Cardio', ['Gesäß', 'seitliche Hüfte', 'Herz-Kreislauf'], 2, [],
      'Seitliche Sprünge wie ein Eisschnellläufer.', 'Von einem Bein seitlich auf das andere springen, das freie Bein kreuzt diagonal nach hinten, Oberkörper leicht vorgeneigt. Ohne Sprung: seitlich steigen.',
      { view: 'front', anchor: 'free', a: P(10, [230, 220], [160, 170], { b: [215, 200], r: [175, 180] }), b: P(-10, [145, 160], [185, 180], { b: [130, 140], r: [200, 190] }) }],
    ['schattenboxen', 'Schattenboxen', 'hiit', 'Cardio', ['Schulter', 'Rumpf', 'Herz-Kreislauf'], 1, [],
      'Schnelle Schläge in die Luft.', 'Leichte Schrittstellung, Fäuste vor dem Gesicht. Abwechselnd gerade nach vorn schlagen, Rumpf mitdrehen, auf den Fußballen federn.',
      { a: P(5, [90, 90], [170, 180], { b: [150, 20], r: [195, 180] }), b: P(5, [150, 20], [170, 180], { b: [90, 90], r: [195, 180] }) }],
    ['seilspringen', 'Seilspringen (ohne Seil)', 'hiit', 'Cardio', ['Waden', 'Herz-Kreislauf', 'Koordination'], 1, [],
      'Imaginäres Seilspringen.', 'Kleine, schnelle Sprünge auf dem Vorfuß, Knie leicht gebeugt, Handgelenke kreisen seitlich neben der Hüfte. Mit echtem Seil noch besser.',
      { anchor: 'free', a: P(0, [165, 120], [175, 190]), b: P(0, [160, 110], [165, 200]) }],

    /* ---------- HIIT · Ganzkörper ---------- */
    ['burpee', 'Burpee', 'hiit', 'Ganzkörper', ['Ganzkörper', 'Brust', 'Oberschenkel'], 3, [],
      'Aus dem Stand in den Stütz und zurück.', 'Hocken, Hände auf den Boden, Beine in den Stütz zurückspringen oder -steigen, zurück in die Hocke und aufrichten – optional mit Strecksprung. Leichter: ohne Sprung.',
      { anchor: 'free', a: P(0, [170, 180]), b: PU_UP }],
    ['mountain_climber', 'Mountain Climber', 'hiit', 'Ganzkörper', ['Rumpf', 'Hüftbeuger', 'Schulter'], 2, [],
      'Knie im Stütz abwechselnd zur Brust.', 'Hoher Stütz, Hände unter den Schultern. Knie abwechselnd zügig Richtung Brust ziehen, Hüfte bleibt tief. Leichter: langsam steigen statt springen.',
      { anchor: 'free', a: P(63, [180, 180], [110, 210], { r: [243, 243] }), b: P(63, [180, 180], [243, 243], { r: [110, 210] }) }],
    ['squat_jump', 'Hocksprung', 'hiit', 'Ganzkörper', ['Oberschenkel', 'Gesäß', 'Waden'], 2, [],
      'Kniebeuge mit explosivem Strecksprung.', 'Tief in die Hocke, Arme hinten. Explosiv nach oben springen, Arme hoch, weich in die Hocke landen. Leichter: schnelle Kniebeuge mit Zehenstand.',
      { a: P(35, [200, 200], [100, 215]), b: P(0, [10, 10], [180, 180]) }],
    ['jump_lunge', 'Ausfallschritt-Sprünge', 'hiit', 'Ganzkörper', ['Oberschenkel', 'Gesäß', 'Herz-Kreislauf'], 3, [],
      'Ausfallschritt mit Beinwechsel im Sprung.', 'Aus dem Ausfallschritt explosiv abspringen, in der Luft die Beine wechseln, weich landen. Leichter: Ausfallschritte im Wechsel ohne Sprung.',
      { anchor: 'free', a: P(0, [150, 60], [95, 190], { b: [210, 150], r: [200, 275] }), b: P(0, [210, 150], [200, 275], { b: [150, 60], r: [95, 190] }) }],
    ['thruster', 'Thruster', 'hiit', 'Ganzkörper', ['Oberschenkel', 'Gesäß', 'Schulter', 'Trizeps'], 2, ['Kurzhanteln'],
      'Kniebeuge und Drücken über Kopf in einer Bewegung.', 'Hanteln auf Schulterhöhe, tief in die Kniebeuge. Kraftvoll aufrichten und den Schwung nutzen, um die Hanteln über den Kopf zu drücken.',
      { a: P(30, [160, 20], [100, 215]), b: P(0, [0, 0]), props: ['dumbbell'] }],
    ['inchworm', 'Inchworm (Raupe)', 'hiit', 'Ganzkörper', ['hintere Oberschenkel', 'Schulter', 'Rumpf'], 2, [],
      'Mit den Händen vom Stand in den Stütz laufen.', 'Aus dem Stand nach vorn beugen, Hände auf den Boden, mit kleinen Schritten in den hohen Stütz gehen, zurücklaufen und aufrichten.',
      { a: P(110, [165, 195], [175, 185]), b: PU_UP }],
    ['shoulder_taps', 'Plank Shoulder Taps', 'hiit', 'Ganzkörper', ['Rumpf', 'Schulter', 'Brust'], 2, [],
      'Im hohen Stütz abwechselnd die Schulter antippen.', 'Hoher Stütz, Füße etwas breiter. Abwechselnd mit einer Hand die gegenüberliegende Schulter antippen, die Hüfte bleibt ruhig. Leichter: auf den Knien.',
      { a: PU_UP, b: P(63, [170, 330], [243, 243], { b: [180, 180] }) }]
  ];

  App.Data.EXERCISES = EXERCISE_ROWS.map(function (r) {
    return { id: r[0], name: r[1], category: r[2], subCategory: r[3], targetMuscles: r[4], difficulty: r[5],
      equipment: r[6], description: r[7], instructions: r[8], svgAnimation: r[9] };
  });

  /* Material-Ergänzungen (zentral gepflegt, damit die Zeilen oben übersichtlich bleiben) */
  const MAT = ['liegestuetz', 'enge_liegestuetz', 'plank', 'dead_bug', 'hollow_hold', 'bicycle_crunch', 'reverse_crunch', 'superman', 'bird_dog',
    'hip_extension', 'side_plank', 'russian_twist', 'side_plank_reach', 'hip_thrust', 'glute_bridge',
    'knie_liegestuetz', 'negativ_liegestuetz', 'floor_press', 'pullover', 'y_raise', 'crunch', 'slider_leg_curl', 'mountain_climber', 'shoulder_taps', 'burpee', 'inchworm'];
  /* Empfohlene Hantelklasse: leicht (ca. 2–4 kg) · mittel (ca. 5–8 kg) · schwer (ca. 10 kg+) – individuell anpassen */
  const WEIGHT = { schulterdruecken: 'mittel', arnold_press: 'leicht', kurzhantelrudern: 'schwer', upright_row: 'leicht', bent_over_row: 'mittel',
    bizeps_curl: 'mittel', hammer_curl: 'mittel', trizeps_kickback: 'leicht', goblet_squat: 'schwer', romanian_deadlift: 'schwer',
    kettlebell_swing: 'schwer', single_leg_deadlift: 'leicht', floor_press: 'mittel', kb_press: 'leicht', seitheben: 'leicht', pullover: 'mittel',
    kb_high_pull: 'mittel', trizeps_ueberkopf: 'mittel', holzhacker: 'mittel', kb_windmill: 'leicht', kb_deadlift: 'schwer', kb_sumo_squat: 'schwer', thruster: 'leicht' };
  /* Einseitige Übungen (Seitenwechsel in der Mitte der Zeit -> Doppelping) */
  const ONE_SIDED = ['kurzhantelrudern', 'trizeps_kickback', 'step_up', 'bulgarian_split_squat', 'single_leg_deadlift', 'ausfallschritt',
    'seitlicher_ausfallschritt', 'einbeinstand', 'curtsy_lunge', 'side_plank', 'side_plank_reach',
    'kb_press', 'holzhacker', 'kb_windmill', 'kniestrecken_sitzend', 'seitliches_beinheben'];
  App.Data.EXERCISES.forEach(function (e) {
    e.oneSided = ONE_SIDED.indexOf(e.id) >= 0;
    if (MAT.indexOf(e.id) >= 0) e.equipment = e.equipment.concat('Matte');
    if (WEIGHT[e.id]) e.weight = WEIGHT[e.id];
    e.needsAnchor = e.equipment.some(q => /^(trx|band)/i.test(q));   // braucht Befestigungspunkt
  });

  /* Hilfsfunktion für spätere Module (Dehnübungen nutzen dieselbe Struktur) */
  App.Data.byId = {};
  App.Data.register = function (list) { list.forEach(function (e) { App.Data.byId[e.id] = e; }); };
  App.Data.register(App.Data.EXERCISES);
})();
