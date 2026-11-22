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
  /* Geometrie der Strichfigur (SVG-Einheiten) */
  body: { torso: 40, neck: 13, upperArm: 22, foreArm: 20, thigh: 27, shin: 26 },
  stage: { w: 240, h: 200, floorY: 172 }
};
