/* ==========================================================================
   00-config.js  –  Globaler Namespace + Konfiguration
   Alle weiteren Module hängen sich an das Objekt `App`.
   ========================================================================== */
const App = {};

App.Config = {
  version: 1,
  storageKey: 'training-state-v1',
  tokenKey: 'training-gh-token',
  /* GitHub-Sync: Fortschritt liegt als JSON auf eigenem Branch "progress" */
  github: { owner: 'aloisdanninger', repo: 'Training', branch: 'progress', path: 'progress/training.json' },
  /* Sekunden Vorbereitung zwischen zwei Übungen */
  prepareSeconds: 10,
  /* Übungen, die Befestigung brauchen (Band/TRX), nicht vorschlagen. Auf false setzen, wenn ein Ankerpunkt vorhanden ist. */
  excludeAnchored: true,
  /* Kieser-Dauer: Standard und Reglerbereich (Sekunden) */
  kieser: { min: 60, max: 120, step: 5, def: 120 },
  /* Klassisch: Sätze und Sekunden pro Satz wählbar, Pause zwischen den Sätzen */
  classic: { sets: { min: 1, max: 6, step: 1, def: 3 }, seconds: { min: 15, max: 90, step: 5, def: 30 }, rest: 10 },
  /* Zirkel: Runden und Sekunden pro Übung wählbar; Wechsel zwischen Übungen, Pause zwischen Runden */
  circuit: { rounds: { min: 1, max: 6, step: 1, def: 3 }, seconds: { min: 10, max: 60, step: 5, def: 30 }, transition: 10, roundRest: 30 },
  /* Schwierigkeitsbewertung: zu leicht = +levelStep s, zu schwer = -levelStep s (je Übung, kumulativ, begrenzt) */
  levelStep: 5, levelMax: 60, minSeconds: 10,
  /* Geometrie der Strichfigur (SVG-Einheiten) */
  body: { torso: 40, neck: 13, upperArm: 22, foreArm: 20, thigh: 27, shin: 26 },
  stage: { w: 240, h: 200, floorY: 172 }
};
