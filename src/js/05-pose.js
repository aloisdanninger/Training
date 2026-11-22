/* ==========================================================================
   05-pose.js  –  Pose-Modell der Strichfigur
   Winkel in Grad, ABSOLUT gemessen: 0 = nach oben, 90 = nach rechts (Blickrichtung),
   180 = nach unten, -90/270 = nach links.
   Pose-Felder:
     t   Rumpf (Hüfte -> Hals/Schulter)      hd  Kopfrichtung (Default = t)
     a   [Oberarm, Unterarm] vordere Seite    b   hintere Seite (Default = a)
     l   [Oberschenkel, Unterschenkel] vorne  r   hinten (Default = l)
   Eine Übung hat zwei Posen (a = Start, b = Ende); der Player interpoliert.
   ========================================================================== */
App.Pose = (function () {
  /** Kurzschreibweise zum Anlegen einer Pose. */
  function P(t, a, l, o) { return Object.assign({ t: t, a: a || [180, 180], l: l || [180, 180] }, o || {}); }

  /** Ergänzt Defaults, damit alle Felder gesetzt sind. */
  function resolve(p) {
    return { t: p.t, hd: p.hd == null ? p.t : p.hd, a: p.a, b: p.b || p.a, l: p.l, r: p.r || p.l };
  }

  function lerp(x, y, k) { return x + (y - x) * k; }
  function lerpPair(x, y, k) { return [lerp(x[0], y[0], k), lerp(x[1], y[1], k)]; }

  /** Interpoliert zwei aufgelöste Posen (k = 0..1). */
  function mix(A, B, k) {
    return { t: lerp(A.t, B.t, k), hd: lerp(A.hd, B.hd, k),
      a: lerpPair(A.a, B.a, k), b: lerpPair(A.b, B.b, k), l: lerpPair(A.l, B.l, k), r: lerpPair(A.r, B.r, k) };
  }

  /** Vorwärtskinematik: liefert alle Gelenkpunkte (Hüfte im Ursprung). */
  function joints(p) {
    const L = App.Config.body, R = Math.PI / 180;
    const v = (ang, len) => [Math.sin(ang * R) * len, -Math.cos(ang * R) * len];
    const add = (u, w) => [u[0] + w[0], u[1] + w[1]];
    const hip = [0, 0], neck = add(hip, v(p.t, L.torso)), head = add(neck, v(p.hd, L.neck));
    const arm = q => { const e = add(neck, v(q[0], L.upperArm)); return [neck, e, add(e, v(q[1], L.foreArm))]; };
    const leg = q => { const k = add(hip, v(q[0], L.thigh)); return [hip, k, add(k, v(q[1], L.shin))]; };
    return { hip: hip, neck: neck, head: head, near: { arm: arm(p.a), leg: leg(p.l) }, far: { arm: arm(p.b), leg: leg(p.r) } };
  }

  return { P: P, resolve: resolve, mix: mix, joints: joints };
})();
