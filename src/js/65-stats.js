/* ==========================================================================
   65-stats.js  –  Auswertung der Trainingshistorie (reine Funktionen, ohne DOM)
   App.Stats : Art einer Einheit, durchgeführte Übungen, Zähler je Übung,
               Kennzahlen, Kalender-Tage und Wochenminuten.
   Eingang : Sessions aus App.Store.history() (je Profil getrennt)
   ========================================================================== */
App.Stats = (function () {
  /** Trainingsarten in fester Reihenfolge (= feste Farbreihenfolge in der Anzeige). */
  const KINDS = [
    { id: 'kraft', label: 'Kraft', icon: '💪' },
    { id: 'hiit', label: 'HIIT', icon: '🔥' },
    { id: 'stretch', label: 'Dehnen', icon: '🧘' },
    { id: 'foam', label: 'Faszien', icon: '🧽' },
    { id: 'ref', label: 'Referenz', icon: '📋' }
  ];
  const kindById = id => KINDS.filter(k => k.id === id)[0] || KINDS[0];

  function kindOf(s) {
    if (s.programType === 'reference') return 'ref';
    if (s.kind === 'stretch' || s.kind === 'foam') return s.kind;
    const a = s.areaIds || [];
    return a.length && a.every(x => x === 'hiit') ? 'hiit' : 'kraft';
  }
  /** Vollständig durchgeführte Übungen einer Einheit.
      Neu: s.done. Ältere Einheiten: Referenz = gemessene Übungen, sonst bei abgeschlossenem Training das ganze Programm. */
  function doneIds(s) {
    if (Array.isArray(s.done)) return s.done;
    if (s.ref && s.ref.secs) return Object.keys(s.ref.secs);
    return s.completed ? (s.exerciseIds || []) : [];
  }
  function counts(sessions) {
    const c = {};
    sessions.forEach(s => doneIds(s).forEach(id => { c[id] = (c[id] || 0) + 1; }));
    return c;
  }
  const pad = n => ('0' + n).slice(-2);
  /** Lokaler Tag als 'JJJJ-MM-TT'. */
  const dayKey = d => { d = new Date(d); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  /** Montag 0:00 der Woche (lokal). */
  function weekStart(d) { d = new Date(d); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d; }
  const mins = s => (s.durationSec || 0) / 60;

  /** Sessions je Tag: { 'JJJJ-MM-TT': [session, ...] } */
  function byDay(sessions) {
    const m = {};
    sessions.forEach(s => { const k = dayKey(s.date); (m[k] = m[k] || []).push(s); });
    return m;
  }
  /** Minuten je Woche und Art für die letzten n Wochen (älteste zuerst). */
  function weekly(sessions, n, now) {
    const w0 = weekStart(now || Date.now()), out = [];
    for (let i = n - 1; i >= 0; i--) { const st = new Date(w0); st.setDate(st.getDate() - 7 * i); out.push({ start: st, min: {}, total: 0, count: 0 }); }
    sessions.forEach(function (s) {
      const ws = weekStart(s.date).getTime(), w = out.filter(x => x.start.getTime() === ws)[0];
      if (!w) return;
      const k = kindOf(s); w.min[k] = (w.min[k] || 0) + mins(s); w.total += mins(s); w.count++;
    });
    return out;
  }
  /** Wochen in Folge mit mindestens einer Einheit (die laufende Woche zählt mit, bricht die Serie aber noch nicht). */
  function streakWeeks(sessions, now) {
    const set = {}; sessions.forEach(s => { set[weekStart(s.date).getTime()] = 1; });
    const w = weekStart(now || Date.now()); let n = 0;
    if (!set[w.getTime()]) w.setDate(w.getDate() - 7);
    while (set[w.getTime()]) { n++; w.setDate(w.getDate() - 7); }
    return n;
  }
  function summary(sessions, now) {
    now = now || Date.now();
    const since = d => sessions.filter(s => new Date(s.date).getTime() > now - d * 864e5);
    const s30 = since(30), wk = weekly(sessions, 8, now);
    const perKind = {};
    KINDS.forEach(k => { perKind[k.id] = { count: 0, min: 0 }; });
    sessions.forEach(s => { const p = perKind[kindOf(s)]; p.count++; p.min += mins(s); });
    return {
      total: sessions.length, last7: since(7).length, last30: s30.length,
      minTotal: Math.round(sessions.reduce((a, s) => a + mins(s), 0)), min30: Math.round(s30.reduce((a, s) => a + mins(s), 0)),
      days30: Object.keys(byDay(s30)).length, streak: streakWeeks(sessions, now),
      avgWeek: Math.round(wk.reduce((a, w) => a + w.count, 0) / 8 * 10) / 10, perKind: perKind
    };
  }
  return { KINDS: KINDS, kindById: kindById, kindOf: kindOf, doneIds: doneIds, counts: counts, dayKey: dayKey, weekStart: weekStart,
    byDay: byDay, weekly: weekly, streakWeeks: streakWeeks, summary: summary };
})();
