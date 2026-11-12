// Zeichnungen als SVG: Systemskizze und Schnittgrößenverläufe.

import { fmt, z } from '../core/format.js';

const W = 360;
const LINKS = 36;
const BREIT = W - 2 * LINKS;

function pfeil(x1, y1, x2, y2, klasse = 'qpfeil') {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const k = 6;
  const bx = x2 - ux * k;
  const by = y2 - uy * k;
  const spitze = `${x2},${y2} ${bx - uy * 3},${by + ux * 3} ${bx + uy * 3},${by - ux * 3}`;
  return `<line class="${klasse}" x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}"/><polygon class="${klasse}-spitze" points="${spitze}"/>`;
}

// Zeichnet Träger, Auflager, Lasten und Maßkette. s = normalisiertes System.
export function systemSkizze(s) {
  const px = (x) => LINKS + (x / s.L) * BREIT;
  const yB = 96; // Trägerachse
  const teile = [];

  // Streckenlasten
  const qmax = Math.max(1e-9, ...s.strecken.map((st) => Math.max(Math.abs(st.q1), Math.abs(st.q2))));
  for (const st of s.strecken) {
    const hoehe = (q) => (Math.abs(q) < 1e-9 ? 0 : 10 + (22 * Math.abs(q)) / qmax);
    const [a, b] = [px(st.x1), px(st.x2)];
    const [hl, hr] = [hoehe(st.q1), hoehe(st.q2)];
    const fuss = yB - 5;
    teile.push(`<polygon class="strecke" points="${a},${fuss} ${a},${fuss - hl} ${b},${fuss - hr} ${b},${fuss}"/>`);
    const anzahl = Math.max(2, Math.round((b - a) / 20));
    for (let i = 0; i <= anzahl; i++) {
      const x = a + ((b - a) * i) / anzahl;
      const hi = hl + ((hr - hl) * i) / anzahl;
      if (hi >= 9) teile.push(pfeil(x, fuss - hi, x, fuss));
    }
    const text =
      Math.abs(st.q1 - st.q2) < 1e-9
        ? `${st.name} = ${z(st.q1)} kN/m`
        : `${st.name} = ${z(st.q1)} … ${z(st.q2)} kN/m`;
    teile.push(`<text class="beschriftung" x="${(a + b) / 2}" y="${fuss - Math.max(hl, hr) - 5}" text-anchor="middle">${text}</text>`);
  }

  // Einzellasten
  let letzteX = -999;
  let stufe = 0;
  for (const e of [...s.einzel].sort((p, q) => p.x - q.x)) {
    const x = px(e.x);
    stufe = x - letzteX < 70 ? (stufe + 1) % 2 : 0;
    letzteX = x;
    const oben = 30 - stufe * 13;
    if (e.F >= 0) teile.push(pfeil(x, oben, x, yB - 5, 'kraft'));
    else teile.push(pfeil(x, yB - 5, x, oben, 'kraft'));
    const anker = x < LINKS + 40 ? 'start' : x > W - LINKS - 40 ? 'end' : 'middle';
    teile.push(`<text class="beschriftung kraft-text" x="${x}" y="${oben - 5}" text-anchor="${anker}">${e.name} = ${z(e.F)} kN</text>`);
  }

  // Horizontalkräfte
  for (const hz of s.horizontal) {
    const x = px(hz.x);
    const nachRechts = hz.H >= 0;
    const text = `${hz.name} = ${z(Math.abs(hz.H))} kN`;
    const amEnde = hz.x > s.L - 1e-7;
    const amAnfang = hz.x < 1e-7;
    if (amEnde || amAnfang) {
      // Am Trägerende: Pfeil in der Trägerachse neben dem Träger, Text unter dem Auflager
      const innen = amEnde ? x + 5 : x - 5;
      const aussen = amEnde ? x + 31 : x - 31;
      const zeigtZumTraeger = amEnde ? !nachRechts : nachRechts;
      if (zeigtZumTraeger) teile.push(pfeil(aussen, yB, innen, yB, 'kraft'));
      else teile.push(pfeil(innen, yB, aussen, yB, 'kraft'));
      teile.push(`<text class="beschriftung kraft-text" x="${amEnde ? W - 3 : 3}" y="${yB + 40}" text-anchor="${amEnde ? 'end' : 'start'}">${text}</text>`);
    } else {
      const start = nachRechts ? x - 30 : x + 30;
      teile.push(pfeil(start, yB - 12, x, yB - 12, 'kraft'));
      teile.push(`<text class="beschriftung kraft-text" x="${start}" y="${yB - 17}" text-anchor="${nachRechts ? 'start' : 'end'}">${text}</text>`);
    }
  }

  // Träger
  teile.push(`<line class="traeger" x1="${px(0)}" y1="${yB}" x2="${px(s.L)}" y2="${yB}"/>`);

  // Einzelmomente: Kreisbogen mit Pfeilspitze um den Angriffspunkt
  for (const mo of s.momente ?? []) {
    const x = px(mo.x);
    const r = 13;
    const punkt = (grad) => [x + r * Math.cos((grad * Math.PI) / 180), yB - r * Math.sin((grad * Math.PI) / 180)];
    const imUhrzeigersinn = mo.M >= 0;
    const [startGrad, endGrad] = imUhrzeigersinn ? [215, -35] : [-35, 215];
    const [x1, y1] = punkt(startGrad);
    const [x2, y2] = punkt(endGrad);
    teile.push(`<path class="kraft bogen" d="M ${x1} ${y1} A ${r} ${r} 0 1 ${imUhrzeigersinn ? 1 : 0} ${x2} ${y2}"/>`);
    const w = (endGrad * Math.PI) / 180;
    const [tx, ty] = imUhrzeigersinn ? [Math.sin(w), Math.cos(w)] : [-Math.sin(w), -Math.cos(w)];
    const spitze = [x2 + tx * 5, y2 + ty * 5];
    const basis = [x2 - tx * 2, y2 - ty * 2];
    teile.push(
      `<polygon class="kraft-spitze" points="${spitze[0]},${spitze[1]} ${basis[0] - ty * 4},${basis[1] + tx * 4} ${basis[0] + ty * 4},${basis[1] - tx * 4}"/>`,
    );
    const anker = x < LINKS + 40 ? 'start' : x > W - LINKS - 40 ? 'end' : 'middle';
    teile.push(`<text class="beschriftung kraft-text" x="${x}" y="${yB - r - 8}" text-anchor="${anker}">${mo.name} = ${z(Math.abs(mo.M))} kNm</text>`);
  }

  // Auflager A (fest) und B (verschieblich)
  const a = px(s.xA);
  const b = px(s.xB);
  teile.push(`<polygon class="auflager" points="${a},${yB + 3} ${a - 9},${yB + 19} ${a + 9},${yB + 19}"/>`);
  for (let i = -9; i <= 9; i += 4.5) {
    teile.push(`<line class="schraffur" x1="${a + i}" y1="${yB + 19}" x2="${a + i - 4}" y2="${yB + 25}"/>`);
  }
  teile.push(`<polygon class="auflager" points="${b},${yB + 3} ${b - 9},${yB + 19} ${b + 9},${yB + 19}"/>`);
  teile.push(`<line class="auflager" x1="${b - 11}" y1="${yB + 23}" x2="${b + 11}" y2="${yB + 23}"/>`);
  teile.push(`<text class="beschriftung name" x="${a - 16}" y="${yB + 20}" text-anchor="middle">A</text>`);
  teile.push(`<text class="beschriftung name" x="${b + 17}" y="${yB + 20}" text-anchor="middle">B</text>`);

  // Maßkette
  const yM = yB + 56;
  const roh = [
    0,
    s.L,
    ...s.einzel.map((e) => e.x),
    ...(s.momente ?? []).map((mo) => mo.x),
    ...s.strecken.flatMap((st) => [st.x1, st.x2]),
  ].sort((p, q) => p - q);
  const punkte = roh.filter((x, i) => i === 0 || x - roh[i - 1] > 1e-7);
  teile.push(`<line class="mass" x1="${px(0)}" y1="${yM}" x2="${px(s.L)}" y2="${yM}"/>`);
  for (const x of punkte) teile.push(`<line class="mass" x1="${px(x) - 3}" y1="${yM + 4}" x2="${px(x) + 3}" y2="${yM - 4}"/>`);
  for (let i = 0; i < punkte.length - 1; i++) {
    const [l, r] = [px(punkte[i]), px(punkte[i + 1])];
    if (r - l >= 30) teile.push(`<text class="beschriftung mass-text" x="${(l + r) / 2}" y="${yM + 15}" text-anchor="middle">${z(punkte[i + 1] - punkte[i])} m</text>`);
  }

  return `<svg class="skizze" viewBox="0 0 ${W} ${yM + 22}" role="img" aria-label="Systemskizze des Trägers">${teile.join('')}</svg>`;
}

// Verlauf einer Schnittgröße. feld = 'Q' | 'M' | 'N'
// marken = [{ x, v }] Stellen, an denen der Wert angeschrieben wird (wichtigste zuerst)
export function verlauf({ kurve, feld, L, titel, einheit, positivUnten = false, marken = [] }) {
  const oben = 30;
  const hoehe = 78;
  const H = oben + hoehe + 22;
  const werte = kurve.map((p) => p[feld]);
  let vmin = Math.min(0, ...werte);
  let vmax = Math.max(0, ...werte);
  const flach = vmax - vmin < 1e-9;
  if (flach) {
    vmin = -1;
    vmax = 1;
  }
  const px = (x) => LINKS + (x / L) * BREIT;
  const py = (v) => (positivUnten ? oben + ((v - vmin) / (vmax - vmin)) * hoehe : oben + ((vmax - v) / (vmax - vmin)) * hoehe);
  const y0 = py(0);

  const teile = [`<text class="verlauf-titel" x="4" y="14">${titel}</text>`];

  if (!flach) {
    let d = `M ${px(0)} ${y0}`;
    for (const p of kurve) d += ` L ${px(p.x).toFixed(2)} ${py(p[feld]).toFixed(2)}`;
    d += ` L ${px(L)} ${y0} Z`;
    teile.push(`<path class="flaeche ${feld}" d="${d}"/>`);

    // Vorzeichen in die Flächen schreiben
    const groesster = kurve.reduce((a, b) => (b[feld] > a[feld] ? b : a));
    const kleinster = kurve.reduce((a, b) => (b[feld] < a[feld] ? b : a));
    const spanne = vmax - vmin;
    if (groesster[feld] > spanne * 0.22) {
      const mitte = mitteDerFlaeche(kurve, feld, 1);
      teile.push(`<text class="vorzeichen" x="${px(mitte.x)}" y="${(py(mitte.v) + y0) / 2 + 5}" text-anchor="middle">+</text>`);
    }
    if (kleinster[feld] < -spanne * 0.22) {
      const mitte = mitteDerFlaeche(kurve, feld, -1);
      teile.push(`<text class="vorzeichen" x="${px(mitte.x)}" y="${(py(mitte.v) + y0) / 2 + 5}" text-anchor="middle">−</text>`);
    }
  }
  teile.push(`<line class="achse" x1="${px(0)}" y1="${y0}" x2="${px(L)}" y2="${y0}"/>`);

  if (flach) {
    teile.push(`<text class="beschriftung" x="${W / 2}" y="${y0 - 8}" text-anchor="middle">überall 0</text>`);
  }

  const gesetzt = [];
  for (const m of marken) {
    if (Math.abs(m.v) < 1e-7) continue;
    const x = px(m.x);
    const y = py(m.v);
    const ausserhalb = m.v > 0 !== positivUnten;
    const ty = ausserhalb ? y - 5 : y + 13;
    const text = fmt(m.v, 2, 2);
    // nichts doppelt oder übereinander schreiben
    if (gesetzt.some((g) => Math.abs(g.x - x) < 44 && Math.abs(g.y - ty) < 12)) continue;
    if (gesetzt.some((g) => g.text === text && Math.abs(g.x - x) < 130)) continue;
    gesetzt.push({ x, y: ty, text });
    const anker = x < LINKS + 24 ? 'start' : x > W - LINKS - 24 ? 'end' : 'middle';
    teile.push(`<line class="marke" x1="${x}" y1="${y0}" x2="${x}" y2="${y}"/>`);
    teile.push(`<text class="beschriftung wert" x="${x}" y="${ty}" text-anchor="${anker}">${text}</text>`);
  }
  teile.push(`<text class="beschriftung einheit-text" x="${W - 4}" y="14" text-anchor="end">${einheit}</text>`);

  return `<svg class="verlauf" viewBox="0 0 ${W} ${H}" role="img" aria-label="${titel}">${teile.join('')}</svg>`;
}

// Stelle ungefähr in der Mitte des größten positiven (richtung = 1) oder negativen Bereichs
function mitteDerFlaeche(kurve, feld, richtung) {
  let bester = null;
  let start = null;
  const pruefe = (i) => {
    if (start === null) return;
    const flaeche = kurve.slice(start, i).reduce((sum, p) => sum + Math.abs(p[feld]), 0);
    if (!bester || flaeche > bester.flaeche) bester = { flaeche, start, ende: i - 1 };
    start = null;
  };
  kurve.forEach((p, i) => {
    if (p[feld] * richtung > 1e-9) {
      if (start === null) start = i;
    } else pruefe(i);
  });
  pruefe(kurve.length);
  const punkt = kurve[Math.round((bester.start + bester.ende) / 2)];
  return { x: punkt.x, v: punkt[feld] };
}
