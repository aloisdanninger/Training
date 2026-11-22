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
  let player, timer = null, session = null, wakeLock = null, shownEx = null;

  const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };
  function show(id) { ['home', 'train', 'done', 'gallery'].forEach(n => { $(n).hidden = n !== id; }); window.scrollTo(0, 0); }
  function btn(label, cls, pressed, onClick, html) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + cls;
    if (html) b.innerHTML = html; else b.textContent = label;
    if (pressed != null) b.setAttribute('aria-pressed', pressed);
    b.onclick = onClick; return b;
  }

  /* ---------------- Startbildschirm ---------------- */
  function renderHome() {
    const st = S.settings();
    const areas = $('areas'); areas.textContent = '';
    D.AREAS.forEach(a => {
      const on = st.areas.indexOf(a.id) >= 0;
      areas.appendChild(btn('', 'choice', on, () => {
        const sel = st.areas.indexOf(a.id) >= 0 ? st.areas.filter(x => x !== a.id) : st.areas.concat(a.id);
        S.setSettings({ areas: sel }); renderHome();
      }, '<span class="ic">' + (on ? '☑' : '☐') + '</span><span>' + a.icon + ' ' + a.label + '</span>'));
    });
    const styles = $('styles'); styles.textContent = '';
    STRENGTH_MODES.forEach(m => styles.appendChild(btn(m.label, 'choice', st.style === m.id, () => { S.setSettings({ style: m.id }); renderHome(); })));
    const pt = $('ptype'); pt.textContent = '';
    PTYPES.forEach(p => pt.appendChild(btn(p.label, 'choice', st.programType === p.id, () => { S.setSettings({ programType: p.id }); renderHome(); })));
    $('sound').checked = !!st.sound;
    const n = st.areas.length * 5;
    const preview = n ? App.Programs.totalSeconds(App.Programs.buildBlocks({ exerciseIds: new Array(n).fill('plank') }, D.modeById(st.style))) : 0;
    $('summary').textContent = n ? n + ' Übungen · ca. ' + Math.round(preview / 60) + ' Minuten' : 'Bitte mindestens einen Bereich wählen.';
    $('start').disabled = !n; $('start').style.opacity = n ? 1 : .5;
    const st2 = $('stretches'); st2.textContent = '';
    D.STRETCH_PROGRAMS.forEach(p => st2.appendChild(btn('🧘 ' + p.label, '', null, () => startStretch(App.Programs.buildStretch([p.id])))));
    const h = S.history(), week = Date.now() - 7 * 864e5;
    $('stats').textContent = h.length + ' Einheiten insgesamt · ' + h.filter(s => new Date(s.date).getTime() > week).length + ' in den letzten 7 Tagen';
    $('syncBtn').textContent = App.Sync.hasToken() ? '☁ Jetzt synchronisieren' : '🔑 GitHub-Sync';
  }

  /* ---------------- Training ---------------- */
  function startStrength() {
    const st = S.settings(); App.Audio.unlock();
    const program = App.Programs.buildProgram({ areaIds: st.areas, programType: st.programType, history: S.history() });
    run(program, D.modeById(st.style), { kind: 'strength' });
  }
  function startStretch(program) { App.Audio.unlock(); run(program, D.modeById('stretch'), { kind: 'stretch' }); }

  function run(program, mode, meta) {
    const blocks = App.Programs.buildBlocks(program, mode);
    const totalAll = App.Programs.totalSeconds(blocks);
    session = { program: program, mode: mode, kind: meta.kind, startedAt: new Date(), doneCount: 0, ui: { lastCount: null, lastCue: null } };
    shownEx = null; show('train'); requestWake();
    timer = App.Timer(blocks, {
      onBlockStart: function (b) {
        if (shownEx !== b.exercise) { shownEx = b.exercise; showExercise(b); }
        App.Audio.play(b.sound);
        $('tProgress').textContent = (b.exerciseIndex + 1) + ' / ' + b.exerciseCount + (b.type === 'prepare' ? ' · Vorbereitung' : '');
      },
      onBlockEnd: function (b, i) {
        if (b.endSound) { session.doneCount++; if (i < blocks.length - 1) App.Audio.play(b.endSound); }
      },
      onTick: function (s) {
        const b = s.block, rem = Math.ceil(s.remaining - 1e-6), u = session.ui;
        $('ringFg').style.strokeDasharray = CIRC;
        $('ringFg').style.strokeDashoffset = CIRC * Math.min(1, s.elapsed / b.duration);
        if (u.lastCount !== rem) { $('count').textContent = rem; u.lastCount = rem; }
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
    $('dAsk').hidden = session.kind !== 'strength'; show('done');
  }

  function requestWake() { try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(w => { wakeLock = w; }, () => {}); } catch (e) { /* optional */ } }
  function releaseWake() { try { if (wakeLock) wakeLock.release(); } catch (e) { /* optional */ } wakeLock = null; }

  /* ---------------- Katalog (Kontrolle aller Animationen) ---------------- */
  function renderGallery() {
    const grid = $('galleryGrid'); if (grid.firstChild) return;
    D.EXERCISES.concat(D.STRETCHES).forEach(ex => {
      const c = document.createElement('div'); c.className = 'gcell';
      c.innerHTML = '<b>' + ex.name + '</b><small class="muted">' + ex.subCategory + '</small><br>';
      [0, 1].forEach(k => {
        const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const pl = App.Animation.createPlayer(s); pl.setExercise(ex); pl.render(k); c.appendChild(s);
      });
      grid.appendChild(c);
    });
  }
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
