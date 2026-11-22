/* ==========================================================================
   40-animation.js  –  ANIMATION: SVG-Strichfigur (reines SVG, keine Bilder)
   createPlayer(svgElement) -> { setExercise(ex), render(p) }
   p = Bewegungsfortschritt 0..1 (0 = Pose a, 1 = Pose b). Der Timer liefert p,
   dadurch ist die Animation immer synchron zur Übungsphase (auch bei Pause).
   ========================================================================== */
App.Animation = (function () {
  const NS = 'http://www.w3.org/2000/svg';
  const C = App.Config, Pose = App.Pose;

  function el(parent, tag, attrs) {
    const e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(k => e.setAttribute(k, attrs[k]));
    parent.appendChild(e); return e;
  }
  const line = (e, p, q) => { e.setAttribute('x1', p[0]); e.setAttribute('y1', p[1]); e.setAttribute('x2', q[0]); e.setAttribute('y2', q[1]); };
  const poly = (e, pts) => e.setAttribute('points', pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '));

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
      head: el(svg, 'circle', { 'class': 'fig-head', r: 9 }),
      front: el(svg, 'g', { 'class': 'fig-prop' })
    };
    let A, B, off = [0, 0], ex = null, propEls = [];

    /** Normalisierung: Figur über beide Posen zentrieren und auf den Boden stellen. */
    function normalise() {
      let minX = 1e9, maxX = -1e9, maxY = -1e9;
      [A, B].forEach(function (p) {
        const j = Pose.joints(p);
        [j.head, j.neck, j.hip].concat(j.near.arm, j.near.leg, j.far.arm, j.far.leg).forEach(pt => {
          minX = Math.min(minX, pt[0]); maxX = Math.max(maxX, pt[0]); maxY = Math.max(maxY, pt[1]);
        });
      });
      off = [C.stage.w / 2 - (minX + maxX) / 2, C.stage.floorY - maxY];
    }
    const sh = p => [p[0] + off[0], p[1] + off[1]];

    function buildProps() {
      g.props.textContent = ''; g.front.textContent = ''; propEls = [];
      ((ex.svgAnimation.props) || []).forEach(function (pr) {
        const jA = Pose.joints(A), ank = sh(jA.near.leg[2]), hip = sh(jA.hip);
        if (pr === 'step') { el(g.props, 'rect', { 'class': 'fig-box', x: ank[0] - 22, y: ank[1], width: 44, height: Math.max(4, C.stage.floorY + 3 - ank[1]), rx: 3 }); }
        else if (pr === 'wall') { el(g.props, 'line', { 'class': 'fig-wall', x1: hip[0] - 16, x2: hip[0] - 16, y1: 14, y2: C.stage.floorY + 3 }); }
        else if (pr === 'dumbbell') { propEls.push({ kind: 'db', n: [el(g.front, 'circle', { 'class': 'fig-weight', r: 5 }), el(g.front, 'circle', { 'class': 'fig-weight', r: 5 })] }); }
        else if (pr.rope) { propEls.push({ kind: 'rope', anchor: pr.rope, n: [el(g.props, 'line', { 'class': 'fig-rope' }), el(g.props, 'circle', { 'class': 'fig-anchor', r: 3, cx: pr.rope[0], cy: pr.rope[1] })] }); }
      });
    }

    function setExercise(e) {
      ex = e; A = Pose.resolve(e.svgAnimation.a); B = Pose.resolve(e.svgAnimation.b);
      normalise(); buildProps(); render(0);
    }

    function render(p) {
      if (!ex) return;
      const j = Pose.joints(Pose.mix(A, B, Math.max(0, Math.min(1, p))));
      const hip = sh(j.hip), neck = sh(j.neck), head = sh(j.head);
      poly(g.farArm, j.far.arm.map(sh)); poly(g.farLeg, j.far.leg.map(sh));
      poly(g.nearLeg, j.near.leg.map(sh)); poly(g.nearArm, j.near.arm.map(sh));
      line(g.torso, hip, neck); line(g.neck, neck, head);
      g.head.setAttribute('cx', head[0]); g.head.setAttribute('cy', head[1]);
      const hand = sh(j.near.arm[2]), hand2 = sh(j.far.arm[2]);
      propEls.forEach(function (pe) {
        if (pe.kind === 'db') {
          [hand, hand2].forEach((h, i) => { pe.n[i].setAttribute('cx', h[0]); pe.n[i].setAttribute('cy', h[1]); });
        } else { line(pe.n[0], hand, pe.anchor); }
      });
    }
    return { setExercise: setExercise, render: render };
  }

  return { createPlayer: createPlayer };
})();
