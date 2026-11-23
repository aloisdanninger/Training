/* ==========================================================================
   60-storage.js  –  Persistenz + Synchronisation
   App.Store : lokaler Zustand (localStorage) – TrainingSession-Historie, Einstellungen,
               Favoriten, Gewichte (Platzhalter für spätere Features).
   App.Sync  : gleicht denselben Zustand als JSON-Datei mit GitHub ab
               (Contents-API, Datei progress/training.json auf Branch "progress").
   Merge-Regel: Sessions werden per ID vereinigt (nie Datenverlust), Einstellungen etc.
                kommen vom Stand mit dem neueren `updatedAt`.
   Zusätzlich: Export/Import als Datei (z. B. für OneDrive).
   ========================================================================== */
/**
 * Profile: getrennte Daten je Benutzer. Das Profil wird pro Gerät gespeichert.
 * Profil "Lois" (= Standard, auch ohne Auswahl) = bisheriger lokaler Schlüssel + progress/training-lois.json; Profil "anna" = Schlüssel ...-p-anna + progress/training-anna.json;
 * Profil "Test" = progress/training.json (für Tests, damit die echten Daten sauber bleiben).
 */
App.Profile = (function () {
  const C = App.Config;
  const slugOf = n => String(n || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);
  const TEST = 'test';
  const OWNER = 'lois';   // Profil "Lois" = Standardprofil mit den bisherigen Daten (alter lokaler Schlüssel, Sync-Datei training-lois.json)
  const name = () => { try { return (localStorage.getItem(C.profileKey) || '').trim() || 'Lois'; } catch (e) { return 'Lois'; } };
  const slug = () => { const s = slugOf(name()); return s === OWNER ? '' : s; };
  return {
    slugOf: slugOf, name: name, slug: slug,
    label: name,
    storageKey: () => C.storageKey + (slug() ? '-p-' + slug() : ''),
    /* Sync-Datei: Profil "Test" = progress/training.json (Testversion), jedes andere Profil (auch Lois) = progress/training-<profil>.json */
    remotePath: () => slugOf(name()) === TEST ? C.github.path : C.github.path.replace(/\.json$/, '-' + (slugOf(name()) || OWNER) + '.json'),
    remoteSlug: () => slugOf(name()) || OWNER,
    set: function (n) { try { n = (n || '').trim(); n ? localStorage.setItem(C.profileKey, n) : localStorage.removeItem(C.profileKey); } catch (e) { /* ignorieren */ } }
  };
})();

App.Store = (function () {
  const KEY = App.Profile.storageKey(), DEV = App.Config.storageKey;   // KEY: Daten je Profil, DEV: Geräteeinstellungen (Ton)
  const defaults = () => ({ version: 1, updatedAt: 0, settings: { areas: ['upper'], style: 'kieser', kieserSeconds: App.Config.kieser.def, classicSets: App.Config.classic.sets.def, classicSeconds: App.Config.classic.seconds.def,
      circuitRounds: App.Config.circuit.rounds.def, circuitSeconds: App.Config.circuit.seconds.def,
      hiitRounds: App.Config.hiit.rounds.def, hiitWork: App.Config.hiit.work.def, hiitRest: App.Config.hiit.rest.def, programType: 'random', sound: false },
    sessions: [], favorites: [], weights: {}, ratings: {}, levels: {} });   // levels: { id: { offset: s, last: 'leicht'|'richtig'|'schwer', t: ms } } · weights: { id: { kg, t } }
  let state = load();

  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.sessions) return Object.assign(defaults(), s); } catch (e) { /* ignorieren */ }
    return defaults();
  }
  function save(touch) {
    if (touch !== false) state.updatedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* Speicher voll/privat */ }
    listeners.forEach(f => f());
  }
  const listeners = [];

  /** Schwierigkeitsstufen je Übung: pro Übung gewinnt der jüngere Eintrag. */
  function mergeLevels(x, y) {
    const out = Object.assign({}, x);
    Object.keys(y || {}).forEach(k => { if (!out[k] || (y[k].t || 0) > (out[k].t || 0)) out[k] = y[k]; });
    return out;
  }

  /** Vereinigt zwei Zustände (siehe Merge-Regel oben). */
  function merge(a, b) {
    const newer = (a.updatedAt || 0) >= (b.updatedAt || 0) ? a : b, byId = {};
    // gleiche Session auf beiden Seiten: die später geänderte gewinnt (t = Zeitpunkt der letzten Änderung, z. B. Empfinden im Referenztraining)
    (a.sessions || []).concat(b.sessions || []).forEach(s => { const o = byId[s.id]; if (!o || (s.t || 0) >= (o.t || 0)) byId[s.id] = s; });
    const sessions = Object.keys(byId).map(k => byId[k]).sort((x, y) => x.date < y.date ? -1 : 1);
    const older = newer === a ? b : a;
    return Object.assign(defaults(), newer, { ratings: Object.assign({}, older.ratings, newer.ratings), levels: mergeLevels(a.levels, b.levels), weights: mergeLevels(a.weights, b.weights), sessions: sessions, updatedAt: Math.max(a.updatedAt || 0, b.updatedAt || 0) });
  }

  return {
    get: () => state,
    settings: () => state.settings,
    setSettings: function (patch) { Object.assign(state.settings, patch); save(); },
    addSession: function (s) { state.sessions.push(s); save(); },
    /** Nachträgliche Änderung einer gespeicherten Session (z. B. Empfinden je Übung); setzt den Änderungszeitpunkt t. */
    updateSession: function (id, fn) { const s = state.sessions.filter(x => x.id === id)[0]; if (!s) return; fn(s); s.t = Date.now(); save(); },
    /* Ton ist geräteabhängig (nicht synchronisiert): iPhone und iPad dürfen unterschiedlich eingestellt sein */
    sound: () => { try { return localStorage.getItem(DEV + '-sound') === '1'; } catch (e) { return false; } },
    setSound: v => { try { localStorage.setItem(DEV + '-sound', v ? '1' : '0'); } catch (e) { /* ignorieren */ } },
    volume: () => { try { return parseFloat(localStorage.getItem(DEV + '-vol')) || 1; } catch (e) { return 1; } },
    setVolume: v => { try { localStorage.setItem(DEV + '-vol', String(v)); } catch (e) { /* ignorieren */ } },
    level: id => state.levels[id] || null,
    /** Sekunden-Anpassung je Übung: { id: offset } */
    offsets: () => { const o = {}; Object.keys(state.levels).forEach(k => { o[k] = state.levels[k].offset || 0; }); return o; },
    setLevel: function (id, offset, last) { state.levels[id] = { offset: offset, last: last, t: Date.now() }; save(); },
    /** Zuletzt verwendetes Gewicht (kg) je Übung – Standardauswahl am Trainingsende. */
    weight: id => { const w = (state.weights || {})[id]; return w && w.kg ? w.kg : null; },
    setWeight: function (id, kg) { state.weights = state.weights || {}; state.weights[id] = { kg: kg, t: Date.now() }; save(); },
    history: () => state.sessions,
    ratings: () => state.ratings,
    rating: id => state.ratings[id] || 0,
    setRating: function (id, n) { if (n) state.ratings[id] = n; else delete state.ratings[id]; save(); },
    replace: function (s) { state = s; save(false); },
    merge: merge,
    onChange: f => listeners.push(f),
    exportJson: () => JSON.stringify(state, null, 1) + '\n',
    importJson: function (text) { const o = JSON.parse(text); if (!o || !Array.isArray(o.sessions)) throw new Error('Ungültige Datei'); state = merge(state, o); save(); }
  };
})();

App.Sync = (function () {
  const G = App.Config.github;
  let sha = null, busy = false, again = false, status = { text: '', cls: '' }, onStatus = function () {};
  const token = () => { try { return localStorage.getItem(App.Config.tokenKey) || ''; } catch (e) { return ''; } };
  const url = () => 'https://api.github.com/repos/' + G.owner + '/' + G.repo + '/contents/' + App.Profile.remotePath();
  const headers = () => ({ 'Authorization': 'Bearer ' + token(), 'Accept': 'application/vnd.github+json' });
  const enc = s => btoa(unescape(encodeURIComponent(s)));
  const dec = s => decodeURIComponent(escape(atob(s.replace(/\s/g, ''))));
  function set(text, cls) { status = { text: text, cls: cls || '' }; onStatus(status); }

  function fetchRemote() {
    return fetch(url() + '?ref=' + G.branch + '&t=' + Date.now(), { headers: headers(), cache: 'no-store' }).then(function (r) {
      if (r.status === 404) { sha = null; return null; }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(j => { if (!j) return null; sha = j.sha; return JSON.parse(dec(j.content)); });
  }

  function put() {
    const body = { message: 'progress training' + ' (' + App.Profile.remoteSlug() + ')', content: enc(App.Store.exportJson()), branch: G.branch };
    if (sha) body.sha = sha;
    return fetch(url(), { method: 'PUT', headers: headers(), body: JSON.stringify(body) }).then(function (r) {
      if (!r.ok) { const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
      return r.json();
    }).then(j => { sha = j.content.sha; });
  }

  /** Holt den Remote-Stand, mergt, speichert lokal und schreibt bei Bedarf zurück. */
  function sync() {
    if (!token()) { set('Nicht verbunden (🔑 Token eingeben)', 'warn'); return Promise.resolve(); }
    if (busy) { again = true; return Promise.resolve(); }
    busy = true; set('Synchronisiere …');
    return fetchRemote().then(function (remote) {
      const merged = remote ? App.Store.merge(App.Store.get(), remote) : App.Store.get();
      App.Store.replace(merged);
      const same = remote && JSON.stringify(remote.sessions) === JSON.stringify(merged.sessions) && remote.updatedAt === merged.updatedAt;
      return same ? null : put();
    }).then(() => set('☁ Synchronisiert ' + new Date().toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })))
      .catch(function (e) {
        if (e.status === 409 || e.status === 422) { again = true; } else set('Sync-Fehler (' + (e.message || e) + ')', 'warn');
      })
      .then(function () { busy = false; if (again) { again = false; return sync(); } });
  }

  return {
    sync: sync, hasToken: () => !!token(), onStatus: f => { onStatus = f; onStatus(status); },
    setToken: function (t) { try { t ? localStorage.setItem(App.Config.tokenKey, t) : localStorage.removeItem(App.Config.tokenKey); } catch (e) { /* ignorieren */ } },
    status: () => status
  };
})();
