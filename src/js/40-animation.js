/* ==========================================================================
   40-animation.js  –  ANIMATION: SVG-Strichfigur (reines SVG, keine Bilder)
   createPlayer(svgElement) -> { setExercise(ex), render(p) }
   p = Bewegungsfortschritt 0..1 (0 = Pose a, 1 = Pose b). Der Timer liefert p,
   dadurch ist die Animation immer synchron zur Übungsphase (auch bei Pause).

   Ansicht: Standard = von der Seite. svgAnimation.view = 'front' -> Frontalansicht (Seitübungen):
  Winkel dann in der Bildebene, 'near' = Körperseite links im Bild, 'far' = rechts, zwei Augen + Mund.

   Gesicht: Auge + Nase zeigen die Vorderseite des Körpers (Blick = Kopfrichtung + 90°).
   So erkennt man Bauchlage (Gesicht nach unten) und Rückenlage (Gesicht nach oben).

   Bodenkontakt (svgAnimation.anchor):
     'foot' – Standfuß bleibt am Boden und an derselben Stelle (Kniebeuge, Ausfallschritt ...)
     'free' – Figur wird über beide Posen gemeinsam zentriert/aufgesetzt (Liegestütz, Plank ...)
     'roller' – Faszienrolle liegt fest am Boden; svgAnimation.roll = { seg, f: [von, bis] } legt fest, welche Stelle
                des Körpers gerade auf der Rolle liegt (p = 0..1) -> die Figur gleitet über die Rolle.
     (ohne Angabe: 'foot', wenn in Pose a die Beine nach unten gestreckt sind, sonst 'free')
   ========================================================================== */
App.Animation = (function () {
  const NS = 'http://www.w3.org/2000/svg';
  const C = App.Config, Pose = App.Pose, R = Math.PI / 180;

  function el(parent, tag, attrs) {
    const e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(k => e.setAttribute(k, attrs[k]));
    parent.appendChild(e); return e;
  }
  const line = (e, p, q) => { e.setAttribute('x1', p[0]); e.setAttribute('y1', p[1]); e.setAttribute('x2', q[0]); e.setAttribute('y2', q[1]); };
  const poly = (e, pts) => e.setAttribute('points', pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '));
  const dir = (ang, len) => [Math.sin(ang * R) * len, -Math.cos(ang * R) * len];

  function createPlayer(svg) {
    svg.setAttribute('viewBox', '0 0 ' + C.stage.w + ' ' + C.stage.h);
    svg.textContent = '';
    const g = {
      props: el(svg, 'g', { 'class': 'fig-prop' }),
      floor: el(svg, 'line', { 'class': 'fig-floor', x1: 20, x2: C.stage.w - 20, y1: C.stage.floorY + 3, y2: C.stage.floorY + 3 }),
      farArm: el(svg, 'polyline', { 'class': 'fig-limb far' }),
      farLeg: el(svg, 'polyline', { 'class': 'fig-limb far' }),
      torso: el(svg, 'line', { 'class': 'fig-limb torso' }),
      nearLeg: el(svg, 'polyline', { 'class': 'fig-limb' }),
      nearArm: el(svg, 'polyline', { 'class': 'fig-limb' }),
      neck: el(svg, 'line', { 'class': 'fig-limb' }),
      head: el(svg, 'circle', { 'class': 'fig-head', r: 10 }),
      nose: el(svg, 'line', { 'class': 'fig-nose' }),
      eye: el(svg, 'circle', { 'class': 'fig-eye', r: 2 }),
      eye2: el(svg, 'circle', { 'class': 'fig-eye', r: 2 }),
      bars: [el(svg, 'line', { 'class': 'fig-limb torso' }), el(svg, 'line', { 'class': 'fig-limb torso' })],
      front: el(svg, 'g', { 'class': 'fig-prop' })
    };
    let A, B, front = false, ex = null, propEls = [], mode = 'free', footLimb = 'near', commonOff = [0, 0], x0 = 0, offA = [0, 0], roller = null;
    const RR = 10, ROLL_TOP = C.stage.floorY - 20;   // Rollenradius; Höhe der Körperlinie auf der Rolle
    const SEG = { shin: j => [j.near.leg[1], j.near.leg[2]], thigh: j => [j.near.leg[0], j.near.leg[1]], torso: j => [j.hip, j.neck],
      upperArm: j => [j.near.arm[0], j.near.arm[1]], foreArm: j => [j.near.arm[1], j.near.arm[2]] };
    /** Punkt des Körpers, der bei Fortschritt k auf der Rolle liegt. */
    function contact(j, k) {
      const r = ex.svgAnimation.roll, s = SEG[r.seg](j), f = r.f[0] + (r.f[1] - r.f[0]) * k;
      return [s[0][0] + (s[1][0] - s[0][0]) * f, s[0][1] + (s[1][1] - s[0][1]) * f];
    }

    const jt = p => Pose.joints(p, front);
    const lowest = j => Math.max(j.near.leg[2][1], j.far.leg[2][1]);

    /** Verschiebung (dx, dy) für eine Pose – abhängig vom Bodenkontakt-Modus. */
    function offsetFor(p, k) {
      if (mode === 'free') return commonOff;
      const j = jt(p);
      if (mode === 'roller') { const c = contact(j, k || 0); return [x0 - c[0], ROLL_TOP - c[1]]; }
      return [x0 - j[footLimb].leg[2][0], C.stage.floorY - lowest(j)];
    }

    function setup() {
      const jA = jt(A);
      mode = ex.svgAnimation.anchor || (lowest(jA) > 40 ? 'foot' : 'free');
      footLimb = jA.far.leg[2][1] > jA.near.leg[2][1] + 0.01 ? 'far' : 'near';
      // Rahmen über 11 Zwischenposen bestimmen, damit die Figur während der ganzen Bewegung im Bild bleibt
      let minX = 1e9, maxX = -1e9, maxY = -1e9;
      x0 = 0;
      for (let i = 0; i <= 10; i++) {
        const p = Pose.mix(A, B, i / 10), j = jt(p);
        const o = mode === 'free' ? [0, 0] : offsetFor(p, i / 10);
        [j.head, j.neck, j.hip].concat(j.near.arm, j.near.leg, j.far.arm, j.far.leg).forEach(pt => {
          minX = Math.min(minX, pt[0] + o[0]); maxX = Math.max(maxX, pt[0] + o[0]); maxY = Math.max(maxY, pt[1]);
        });
      }
      const cx = C.stage.w / 2 - (minX + maxX) / 2;
      if (mode === 'free') commonOff = [cx, C.stage.floorY - maxY]; else x0 = cx;
      offA = offsetFor(A, 0);
    }

    function buildProps() {
      g.props.textContent = ''; g.front.textContent = ''; propEls = []; roller = null;
      if (mode === 'roller') {   // Faszienrolle: Kreis am Boden + Markierung, die sich beim Rollen mitdreht
        roller = { c: el(g.props, 'circle', { 'class': 'fig-roller', r: RR, cx: x0, cy: C.stage.floorY + 3 - RR }), m: el(g.props, 'line', { 'class': 'fig-roller-mark' }) };
      }
      const sh = p => [p[0] + offA[0], p[1] + offA[1]];
      ((ex.svgAnimation.props) || []).forEach(function (pr) {
        const jA = jt(A), ank = sh(jA.near.leg[2]), hip = sh(jA.hip);
        if (pr === 'step') { el(g.props, 'rect', { 'class': 'fig-box', x: ank[0] - 22, y: ank[1], width: 44, height: Math.max(4, C.stage.floorY + 3 - ank[1]), rx: 3 }); }
        else if (pr === 'wall') { el(g.props, 'line', { 'class': 'fig-wall', x1: hip[0] - 16, x2: hip[0] - 16, y1: 14, y2: C.stage.floorY + 3 }); }
        else if (pr === 'bar') { const hd = sh(jA.near.arm[2]); el(g.props, 'line', { 'class': 'fig-wall', x1: hd[0] - 30, x2: hd[0] + 30, y1: hd[1] - 2, y2: hd[1] - 2 }); }
        else if (pr === 'kb') { propEls.push({ kind: 'kb', n: [el(g.front, 'circle', { 'class': 'fig-weight', r: 6.5 })] }); }
        else if (pr === 'dumbbell') { propEls.push({ kind: 'db', n: [el(g.front, 'circle', { 'class': 'fig-weight', r: 5 }), el(g.front, 'circle', { 'class': 'fig-weight', r: 5 })] }); }
        else if (pr.rope) { propEls.push({ kind: 'rope', anchor: pr.rope, n: [el(g.props, 'line', { 'class': 'fig-rope' }), el(g.props, 'circle', { 'class': 'fig-anchor', r: 3, cx: pr.rope[0], cy: pr.rope[1] })] }); }
      });
    }

    function setExercise(e) {
      ex = e; front = e.svgAnimation.view === 'front'; A = Pose.resolve(e.svgAnimation.a); B = Pose.resolve(e.svgAnimation.b);
      setup(); buildProps(); render(0);
    }

    function render(p) {
      if (!ex) return;
      const pk = Math.max(0, Math.min(1, p)), pose = Pose.mix(A, B, pk), j = jt(pose), off = offsetFor(pose, pk);
      if (roller) {
        const a = (off[0] - offA[0]) / RR, cy = C.stage.floorY + 3 - RR, d = [Math.sin(a) * (RR - 3), -Math.cos(a) * (RR - 3)];
        line(roller.m, [x0 - d[0], cy - d[1]], [x0 + d[0], cy + d[1]]);
      }
      const sh = q => [q[0] + off[0], q[1] + off[1]];
      const hip = sh(j.hip), neck = sh(j.neck), head = sh(j.head);
      poly(g.farArm, j.far.arm.map(sh)); poly(g.farLeg, j.far.leg.map(sh));
      poly(g.nearLeg, j.near.leg.map(sh)); poly(g.nearArm, j.near.arm.map(sh));
      line(g.torso, hip, neck); line(g.neck, neck, head);
      g.head.setAttribute('cx', head[0]); g.head.setAttribute('cy', head[1]);
      // Gesicht: Vorderseite = Kopfrichtung + 90° (Figur blickt standardmäßig nach rechts)
      if (front) {   // Frontalansicht: zwei Augen + Mund, Schulter- und Hüftlinie
        const l1 = dir(pose.hd + 90, -3.6), l2 = dir(pose.hd + 90, 3.6), up = dir(pose.hd, 2), m = dir(pose.hd + 180, 5), mw = dir(pose.hd + 90, 3);
        g.eye.setAttribute('cx', head[0] + l1[0] + up[0]); g.eye.setAttribute('cy', head[1] + l1[1] + up[1]);
        g.eye2.setAttribute('cx', head[0] + l2[0] + up[0]); g.eye2.setAttribute('cy', head[1] + l2[1] + up[1]);
        line(g.nose, [head[0] + m[0] - mw[0], head[1] + m[1] - mw[1]], [head[0] + m[0] + mw[0], head[1] + m[1] + mw[1]]);
        line(g.bars[0], sh(j.sh[0]), sh(j.sh[1])); line(g.bars[1], sh(j.hp[0]), sh(j.hp[1]));
      } else {
        const f = pose.hd + 90, e1 = dir(f, 4.5), n0 = dir(f, 10), n1 = dir(f, 14);
        g.eye.setAttribute('cx', head[0] + e1[0]); g.eye.setAttribute('cy', head[1] + e1[1]);
        line(g.nose, [head[0] + n0[0], head[1] + n0[1]], [head[0] + n1[0], head[1] + n1[1]]);
      }
      g.eye2.style.display = g.bars[0].style.display = g.bars[1].style.display = front ? '' : 'none';
      const hand = sh(j.near.arm[2]), hand2 = sh(j.far.arm[2]);
      propEls.forEach(function (pe) {
        if (pe.kind === 'kb') { pe.n[0].setAttribute('cx', hand[0]); pe.n[0].setAttribute('cy', hand[1] + 4); }
        else if (pe.kind === 'db') {
          [hand, hand2].forEach((h, i) => { pe.n[i].setAttribute('cx', h[0]); pe.n[i].setAttribute('cy', h[1]); });
        } else { line(pe.n[0], hand, pe.anchor); }
      });
    }
    return { setExercise: setExercise, render: render };
  }

  return { createPlayer: createPlayer };
})();
