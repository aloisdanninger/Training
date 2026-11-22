/* ==========================================================================
   70-ui.js  –  UI: Startbildschirm, Trainingsbildschirm, Ende, Katalog
   Verbindet Daten (App.Data), Logik (App.Programs), Timer, Animation, Audio, Speicher.
   Enthält keine Trainingsregeln – nur Darstellung und Ereignisbehandlung.
   ========================================================================== */
App.UI = (function () {
  const $ = id => document.getElementById(id);
  const D = App.Data, S = App.Store, CIRC = 2 * Math.PI * 150;
  const STRENGTH_MODES = D.MODES.filter(m => m.kind === 'strength');
  const PTYPES = [{ id: 'standard', label: 'Standard' }, { id: 'random', label: 'Zufällig' }];
  const CK = App.Config.kieser;
  const PINGS = [60, 30, 10, 3, 2, 1];            // verbleibende Sekunden mit einfachem Ping
  let player, timer = null, session = null, wakeLock = null, shownEx = null, pending = null;

  const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };
  function show(id) { ['home', 'preview', 'train', 'done', 'gallery'].forEach(n => { $(n).hidden = n !== id; }); window.scrollTo(0, 0); }
  function btn(label, cls, pressed, onClick, html) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + cls;
    if (html) b.innerHTML = html; else b.textContent = label;
    if (pressed != null) b.setAttribute('aria-pressed', pressed);
    b.onclick = onClick; return b;
  }

  /* ---------------- Startbildschirm ---------------- */
  function currentMode() { const st = S.settings(); return D.modeById(st.style, st.kieserSeconds || CK.default); }

  function renderHome() {
    let st = S.settings();
    if (/^kieser\d+$/.test(st.style)) {         // alter Stand (kieser90/kieser120) -> 'kieser' + Dauer
      S.setSettings({ style: 'kieser', kieserSeconds: parseInt(st.style.slice(6), 10) || CK.default }); st = S.settings();
    }
    const areas = $('areas'); areas.textContent = '';
    D.AREAS.forEach(a => {
      const on = st.areas.indexOf(a.id) >= 0;
      areas.appendChild(btn('', 'choice', on, () => {
        const sel = st.areas.indexOf(a.id) >= 0 ? st.areas.filter(x => x !== a.id) : st.areas.concat(a.id);
        S.setSettings({ areas: sel }); renderHome();
      }, '<span class="ic">' + (on ? '☑' : '☐') + '</span><span>' + a.icon + ' ' + a.label + '</span>'));
    });
    const styles = $('styles'); styles.textContent = '';
    STRENGTH_MODES.forEach(m => styles.appendChild(btn(m.id === 'kieser' ? 'Kieser' : m.label, 'choice', st.style === m.id, () => { S.setSettings({ style: m.id }); renderHome(); })));
    const secs = st.kieserSeconds || CK.default, kb = $('kieserBox');
    kb.hidden = st.style !== 'kieser'; $('kieserRange').value = secs; $('kieserVal').textContent = secs + ' Sekunden';
    const pt = $('ptype'); pt.textContent = '';
    PTYPES.forEach(p => pt.appendChild(btn(p.label, 'choice', st.programType === p.id, () => { S.setSettings({ programType: p.id }); renderHome(); })));
    $('sound').checked = !!st.sound;
    const n = st.areas.length * 5;
    const preview = n ? App.Programs.totalSeconds(App.Programs.buildBlocks({ exerciseIds: new Array(n).fill('plank') }, currentMode())) : 0;
    $('summary').textContent = n ? n + ' Übungen · ca. ' + Math.round(preview / 60) + ' Minuten' : 'Bitte mindestens einen Bereich wählen.';
    $('start').disabled = !n; $('start').style.opacity = n ? 1 : .5;
    const st2 = $('stretches'); st2.textContent = '';
    D.STRETCH_PROGRAMS.forEach(p => st2.appendChild(btn('🧘 ' + p.label, '', null, () => openPreview(App.Programs.buildStretch([p.id]), D.modeById('stretch'), 'stretch'))));
    const h = S.history(), week = Date.now() - 7 * 864e5;
    $('stats').textContent = h.length + ' Einheiten insgesamt · ' + h.filter(s => new Date(s.date).getTime() > week).length + ' in den letzten 7 Tagen';
    $('syncBtn').textContent = App.Sync.hasToken() ? '☁ Jetzt synchronisieren' : '🔑 GitHub-Sync';
  }

  /* ---------------- Training ---------------- */
  function buildStrength() {
    const st = S.settings();
    return App.Programs.buildProgram({ areaIds: st.areas, programType: st.programType, history: S.history(), ratings: S.ratings() });
  }
  function startStrength() { openPreview(buildStrength(), currentMode(), 'strength'); }

  /* ---------------- Übersicht vor dem Start ---------------- */
  function esc(t) { return String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]); }
  function openPreview(program, mode, kind) {
    pending = { program: program, mode: mode, kind: kind };
    const blocks = App.Programs.buildBlocks(program, mode), perEx = {};
    blocks.forEach(b => { perEx[b.exerciseIndex] = (perEx[b.exerciseIndex] || 0) + b.duration; });
    $('pvTitle').textContent = kind === 'stretch' ? program.label : 'Dein Training';
    $('pvSummary').textContent = program.exerciseIds.length + ' Übungen · ca. ' + Math.round(App.Programs.totalSeconds(blocks) / 60) + ' Minuten · ' + mode.label +
      (program.type === 'random' ? ' · Zufallsprogramm' : '');
    // Material
    const gear = App.Programs.equipmentSummary(program.exerciseIds), ul = $('pvGear'); ul.textContent = '';
    if (!gear.length) ul.innerHTML = '<li>Kein Material nötig 🎉</li>';
    gear.forEach(function (g) {
      let detail = '';
      if (g.weights) detail = ['leicht', 'mittel', 'schwer'].filter(k => g.weights[k]).map(k => '<b style="display:inline">' + k + '</b>: ' + esc(g.weights[k].join(', '))).join('<br>');
      else detail = esc(g.usedBy.join(', '));
      const li = document.createElement('li');
      li.innerHTML = '<b>' + esc(g.item) + (g.optional ? ' (optional)' : '') + '</b><small>' + detail + '</small>';
      ul.appendChild(li);
    });
    // Übungsliste, gruppiert nach Bereich (nur bei Kraftprogrammen)
    const ol = $('pvList'); ol.textContent = ''; let lastCat = null;
    program.exerciseIds.forEach(function (id, i) {
      const ex = D.byId[id];
      if (kind === 'strength' && ex.category !== lastCat) {
        lastCat = ex.category; const h = document.createElement('li'); h.className = 'area'; h.textContent = App.Programs.areaById(ex.category).label; ol.appendChild(h);
      }
      const li = document.createElement('li');
      const w = ex.weight ? ' · Hantel ' + ex.weight : '';
      li.innerHTML = '<b>' + esc(ex.name) + '</b> <span class="muted">· ' + fmt(perEx[i]) + ' min</span><small>' + esc(ex.subCategory) + ' · ' + esc(ex.targetMuscles.join(', ')) + esc(w) + '</small>';
      ol.appendChild(li);
    });
    $('pvReroll').hidden = !(kind === 'strength' && program.type === 'random');
    show('preview');
  }
  function startStretch(program) { App.Audio.unlock(); run(program, D.modeById('stretch'), { kind: 'stretch' }); }   // direkt, ohne Übersicht (Folgefrage)

  function run(program, mode, meta) {
    const blocks = App.Programs.buildBlocks(program, mode);
    const totalAll = App.Programs.totalSeconds(blocks);
    session = { program: program, mode: mode, kind: meta.kind, startedAt: new Date(), doneCount: 0, completed: [], ui: { lastCount: null, lastCue: null, lastRem: null } };
    shownEx = null; show('train'); requestWake();
    timer = App.Timer(blocks, {
      onBlockStart: function (b) {
        if (shownEx !== b.exercise) { shownEx = b.exercise; showExercise(b); }
        App.Audio.play(b.sound);                              // Doppelping bei Start einer Übung/eines Satzes
        session.ui.lastRem = null;
        $('tProgress').textContent = (b.exerciseIndex + 1) + ' / ' + b.exerciseCount + (b.type === 'prepare' ? ' · Vorbereitung' : '');
      },
      onBlockEnd: function (b, i) {
        if (b.exerciseEnd && b.type === 'work') { session.doneCount++; session.completed.push(program.exerciseIds[b.exerciseIndex]); }
        if (b.endSound && i < blocks.length - 1) App.Audio.play(b.endSound);   // Doppelping bei Ende; am Trainingsende spielt 'finish'
      },
      onTick: function (s) {
        const b = s.block, rem = Math.ceil(s.remaining - 1e-6), u = session.ui;
        $('ringFg').style.strokeDasharray = CIRC;
        $('ringFg').style.strokeDashoffset = CIRC * Math.min(1, s.elapsed / b.duration);
        if (u.lastCount !== rem) { $('count').textContent = rem; u.lastCount = rem; }
        // Einfacher Ping bei 60/30/10/3/2/1 s Restzeit (nur wenn der Block länger ist als der Schwellwert)
        if (s.running && u.lastRem !== null && u.lastRem !== rem && PINGS.indexOf(rem) >= 0 && rem < b.duration) App.Audio.play('ping');
        u.lastRem = rem;
        const cue = (/^Satz/.test(b.label) ? b.label + ' · ' : '') + s.motion.cue;
        if (u.lastCue !== cue) { $('cue').textContent = cue; u.lastCue = cue; }
        player.render(s.motion.p);
        let left = s.remaining; for (let k = s.index + 1; k < blocks.length; k++) left += blocks[k].duration;
        $('tTotal').textContent = 'Gesamt ' + fmt(left) + ' / ' + fmt(totalAll);
        $('pauseBtn').textContent = s.running ? 'Pause' : 'Weiter';
      },
      onFinish: function () { App.Audio.play('finish'); finish(true); }
    });
    timer.start();
  }

  function showExercise(b) {
    const ex = b.exercise;
    $('tName').textContent = ex.name; $('tMuscles').textContent = ex.targetMuscles.join(' · ');
    $('tDesc').textContent = ex.description; $('tInstr').textContent = ex.instructions;
    $('tEquip').textContent = ex.equipment.length ? 'Material: ' + ex.equipment.join(', ') + (ex.weight ? ' (Hantel ' + ex.weight + ')' : '') : 'Kein Material nötig';
    player.setExercise(ex);
    const nextIdx = b.exerciseIndex + 1, ids = session.program.exerciseIds;
    $('tNext').textContent = nextIdx < ids.length ? 'Als Nächstes: ' + D.byId[ids[nextIdx]].name : 'Letzte Übung';
  }

  function finish(completed) {
    releaseWake();
    const secs = Math.round((Date.now() - session.startedAt.getTime()) / 1000), p = session.program;
    if (session.doneCount > 0) {
      S.addSession({ id: 's' + session.startedAt.getTime() + Math.random().toString(36).slice(2, 6), date: session.startedAt.toISOString(),
        kind: session.kind, areaIds: p.areaIds, modeId: session.mode.id, programType: p.type, exerciseIds: p.exerciseIds,
        completed: completed, durationSec: secs });
      if (App.Sync.hasToken()) App.Sync.sync();
    }
    if (!completed) { show('home'); renderHome(); return; }
    $('dText').textContent = fmt(secs) + ' Minuten · ' + p.exerciseIds.length + ' Übungen';
    renderRating(session.completed);
    $('dAsk').hidden = session.kind !== 'strength'; show('done');
  }

  function requestWake() { try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(w => { wakeLock = w; }, () => {}); } catch (e) { /* optional */ } }
  function releaseWake() { try { if (wakeLock) wakeLock.release(); } catch (e) { /* optional */ } wakeLock = null; }

  /* ---------------- Katalog (Kontrolle aller Animationen) ---------------- */
  function renderGallery() {
    const grid = $('galleryGrid'); if (grid.firstChild) return;
    D.EXERCISES.concat(D.STRETCHES).forEach(ex => {
      const c = document.createElement('div'); c.className = 'gcell';
      c.innerHTML = '<b>' + ex.name + '</b><small class="muted">' + ex.subCategory + (ex.needsAnchor ? ' · Befestigung nötig' : '') + '</small><br>';
      c.tabIndex = 0; c.setAttribute('role', 'button'); c.onclick = () => openOverlay(ex);
      c.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openOverlay(ex); } };
      [0, 1].forEach(k => {
        const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const pl = App.Animation.createPlayer(s); pl.setExercise(ex); pl.render(k); c.appendChild(s);
      });
      const sw = starsEl(ex.id); sw.className += ' small'; c.appendChild(sw);
      grid.appendChild(c);
    });
  }
  /* ---------------- Bewertung (Sterne) ---------------- */
  /** Sterne-Element; ein Tipp auf den aktuellen Wert setzt zurück auf 0 (unbewertet). */
  function starsEl(id) {
    const w = document.createElement('span'); w.className = 'stars'; w.dataset.id = id; w.setAttribute('role', 'group'); w.setAttribute('aria-label', 'Bewertung');
    for (let i = 1; i <= 5; i++) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = '★'; b.setAttribute('aria-label', i + ' Sterne');
      b.onclick = function (e) { e.stopPropagation(); S.setRating(id, S.rating(id) === i ? 0 : i); refreshStars(id); };
      w.appendChild(b);
    }
    paintStars(w); return w;
  }
  function paintStars(w) {
    const r = S.rating(w.dataset.id);
    Array.prototype.forEach.call(w.children, (b, i) => { b.className = i < r ? 'on' : ''; });
    w.title = r ? r + ' von 5 Sternen' : 'nicht bewertet';
  }
  function refreshStars(id) { Array.prototype.forEach.call(document.querySelectorAll('.stars'), w => { if (w.dataset.id === id) paintStars(w); }); }

  /** Bewertung der vollständig durchgeführten Übungen am Trainingsende. */
  function renderRating(ids) {
    const ul = $('dRateList'); ul.textContent = ''; $('dRate').hidden = !ids.length;
    ids.forEach(function (id) {
      const li = document.createElement('li'), n = document.createElement('span'); n.textContent = D.byId[id].name;
      li.appendChild(n); li.appendChild(starsEl(id)); ul.appendChild(li);
    });
  }

  /* ---------------- Übungs-Overlay (Katalog) ---------------- */
  let ovPlayer = null, ovRaf = 0;
  function openOverlay(ex) {
    if (!ovPlayer) ovPlayer = App.Animation.createPlayer($('ovFig'));
    $('ovName').textContent = ex.name; $('ovMuscles').textContent = ex.targetMuscles.join(' · ');
    $('ovDesc').textContent = ex.description; $('ovInstr').textContent = ex.instructions;
    $('ovEquip').textContent = (ex.equipment.length ? 'Material: ' + ex.equipment.join(', ') + (ex.weight ? ' (Hantel ' + ex.weight + ')' : '') : 'Kein Material nötig') +
      (ex.needsAnchor ? ' · braucht einen Befestigungspunkt' : '');
    const sb = $('ovStars'); sb.textContent = ''; sb.appendChild(starsEl(ex.id));
    ovPlayer.setExercise(ex);
    $('overlay').hidden = false; document.body.style.overflow = 'hidden';
    const t0 = performance.now(), ease = x => x * x * (3 - 2 * x);
    cancelAnimationFrame(ovRaf);
    (function frame(now) {
      const k = (((now || t0) - t0) / 4000) % 1; ovPlayer.render(k < 0.5 ? ease(k * 2) : ease(2 - k * 2));
      ovRaf = requestAnimationFrame(frame);
    })(t0);
  }
  function closeOverlay() { cancelAnimationFrame(ovRaf); $('overlay').hidden = true; document.body.style.overflow = ''; }

  function route() {
    if (timer && !timer.isFinished()) return;
    if (location.hash === '#gallery') { renderGallery(); show('gallery'); } else if (!$('gallery').hidden) { show('home'); renderHome(); }
  }

  /* ---------------- Init ---------------- */
  function init() {
    player = App.Animation.createPlayer($('fig'));
    $('sound').onchange = e => { S.setSettings({ sound: e.target.checked }); App.Audio.setEnabled(e.target.checked); };
    App.Audio.setEnabled(S.settings().sound);
    $('start').onclick = startStrength;
    $('kieserRange').min = CK.min; $('kieserRange').max = CK.max; $('kieserRange').step = CK.step;
    $('kieserRange').oninput = e => { S.setSettings({ kieserSeconds: +e.target.value }); $('kieserVal').textContent = e.target.value + ' Sekunden'; renderHome(); };
    $('ovClose').onclick = closeOverlay;
    $('overlay').onclick = e => { if (e.target === $('overlay')) closeOverlay(); };
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('overlay').hidden) closeOverlay(); });
    $('pvStart').onclick = () => { App.Audio.unlock(); run(pending.program, pending.mode, { kind: pending.kind }); };
    $('pvReroll').onclick = () => openPreview(buildStrength(), pending.mode, 'strength');
    $('pvBack').onclick = () => { show('home'); renderHome(); };
    $('pauseBtn').onclick = () => { if (timer.isRunning()) timer.pause(); else timer.start(); };
    $('skipBtn').onclick = () => timer.skip();
    $('stopBtn').onclick = () => { if (confirm('Training abbrechen?')) { timer.stop(); finish(false); } };
    $('askYes').onclick = () => startStretch(App.Programs.stretchForAreas(session.program.areaIds));
    $('askNo').onclick = $('dHome').onclick = () => { show('home'); renderHome(); };
    $('syncBtn').onclick = function () {
      if (!App.Sync.hasToken()) {
        const t = prompt('GitHub Fine-grained Token (Contents: Read & Write für Repo ' + App.Config.github.repo + '):', '');
        if (!t) return; App.Sync.setToken(t.trim());
      }
      App.Sync.sync().then(renderHome);
    };
    $('exportBtn').onclick = function () {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([S.exportJson()], { type: 'application/json' }));
      a.download = 'training-fortschritt.json'; a.click();
    };
    $('importFile').onchange = function (e) {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(t => { S.importJson(t); renderHome(); }).catch(err => alert('Import fehlgeschlagen: ' + err.message));
    };
    App.Sync.onStatus(s => { $('syncInfo').textContent = s.text; });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      if (timer && timer.isRunning()) requestWake(); else if (App.Sync.hasToken() && !$('home').hidden) App.Sync.sync().then(renderHome);
    });
    window.addEventListener('hashchange', route);
    renderHome(); route();
    if (App.Sync.hasToken()) App.Sync.sync().then(renderHome);
  }
  return { init: init };
})();
