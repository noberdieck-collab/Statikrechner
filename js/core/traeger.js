// Träger auf zwei Stützen: Auflagerkräfte und Schnittgrößen (N, Q, M).
//
// Vorzeichen:
//   Lasten F und q wirken positiv nach unten, Horizontalkräfte H positiv nach rechts.
//   Auflagerkräfte AV, BV positiv nach oben, AH positiv nach rechts.
//   Q positiv, wenn die Summe der Kräfte links vom Schnitt nach oben zeigt.
//   M positiv, wenn die Unterseite gezogen wird. N positiv = Zug.
//
// A ist das feste Auflager (AV, AH), B das verschiebliche (BV).

import { fmt, z } from './format.js';

const EPS = 1e-9;

export function normalisiere(system) {
  const L = system.laenge;
  if (!(L > 0)) throw new Error('Bitte die Länge L des Trägers eingeben.');
  const xA = system.xA ?? 0;
  const xB = system.xB ?? L;
  if (!(xB - xA > EPS)) throw new Error('Auflager B muss rechts von Auflager A liegen.');

  const s = { L, xA, xB, einzel: [], horizontal: [], strecken: [] };
  const innen = (x) => x >= -EPS && x <= L + EPS;

  for (const last of system.lasten ?? []) {
    if (last.typ === 'einzel') {
      const name = `F${s.einzel.length + 1}`;
      if (!Number.isFinite(last.F) || !Number.isFinite(last.x)) throw new Error(`${name}: Bitte Kraft und Abstand eingeben.`);
      if (!innen(last.x)) throw new Error(`${name}: Der Abstand muss zwischen 0 und L liegen.`);
      s.einzel.push({ name, F: last.F, x: last.x });
    } else if (last.typ === 'horizontal') {
      const name = `H${s.horizontal.length + 1}`;
      if (!Number.isFinite(last.H) || !Number.isFinite(last.x)) throw new Error(`${name}: Bitte Kraft und Abstand eingeben.`);
      if (!innen(last.x)) throw new Error(`${name}: Der Abstand muss zwischen 0 und L liegen.`);
      s.horizontal.push({ name, H: last.H, x: last.x });
    } else if (last.typ === 'strecke') {
      const name = `q${s.strecken.length + 1}`;
      const { q1, q2, x1, x2 } = last;
      if (![q1, q2, x1, x2].every(Number.isFinite)) throw new Error(`${name}: Bitte alle Felder ausfüllen.`);
      if (!innen(x1) || !innen(x2)) throw new Error(`${name}: Anfang und Ende müssen zwischen 0 und L liegen.`);
      if (!(x2 - x1 > EPS)) throw new Error(`${name}: Das Ende muss rechts vom Anfang liegen.`);
      if (q1 * q2 < 0) throw new Error(`${name}: Links und rechts müssen in die gleiche Richtung wirken.`);
      s.strecken.push({ name, q1, q2, x1, x2 });
    } else {
      throw new Error('Unbekannte Lastart.');
    }
  }
  return s;
}

function formVon(st) {
  if (Math.abs(st.q1 - st.q2) < EPS) return 'gleich';
  if (Math.abs(st.q1) < EPS) return 'dreieckSteigend';
  if (Math.abs(st.q2) < EPS) return 'dreieckFallend';
  return 'trapez';
}

// Resultierende einer Streckenlast: Größe R und Lage xR (Abstand vom linken Trägerende)
export function resultierende(st) {
  const l = st.x2 - st.x1;
  const summe = st.q1 + st.q2;
  const R = (summe / 2) * l;
  const e = Math.abs(summe) < EPS ? l / 2 : (l * (st.q1 + 2 * st.q2)) / (3 * summe);
  return { name: st.name, R, xR: st.x1 + e, l, form: formVon(st), st };
}

// Teil einer Streckenlast, der links vom Schnitt x liegt
function teil(st, x) {
  const d = Math.min(x, st.x2) - st.x1;
  if (d <= EPS) return { R: 0, xR: st.x1, d: 0 };
  const l = st.x2 - st.x1;
  const qe = st.q1 + ((st.q2 - st.q1) * d) / l;
  const summe = st.q1 + qe;
  const R = (summe / 2) * d;
  const e = Math.abs(summe) < EPS ? d / 2 : (d * (st.q1 + 2 * qe)) / (3 * summe);
  return { R, xR: st.x1 + e, d };
}

export function loese(system) {
  const s = normalisiere(system);
  const spannweite = s.xB - s.xA;
  const res = s.strecken.map(resultierende);

  let momentUmA = 0;
  let summeV = 0;
  let summeH = 0;
  for (const e of s.einzel) {
    momentUmA += e.F * (e.x - s.xA);
    summeV += e.F;
  }
  for (const r of res) {
    momentUmA += r.R * (r.xR - s.xA);
    summeV += r.R;
  }
  for (const hz of s.horizontal) summeH += hz.H;

  const BV = momentUmA / spannweite;
  const AV = summeV - BV;
  const AH = -summeH;

  // seite 'l' = knapp links der Stelle x, 'r' = knapp rechts
  const liegtLinks = (xi, x, seite) => (seite === 'r' ? xi <= x + EPS : xi < x - EPS);

  const Q = (x, seite = 'r') => {
    let q = 0;
    if (liegtLinks(s.xA, x, seite)) q += AV;
    if (liegtLinks(s.xB, x, seite)) q += BV;
    for (const e of s.einzel) if (liegtLinks(e.x, x, seite)) q -= e.F;
    for (const st of s.strecken) q -= teil(st, x).R;
    return q;
  };

  const M = (x) => {
    let m = 0;
    if (s.xA < x) m += AV * (x - s.xA);
    if (s.xB < x) m += BV * (x - s.xB);
    for (const e of s.einzel) if (e.x < x) m -= e.F * (x - e.x);
    for (const st of s.strecken) {
      const t = teil(st, x);
      m -= t.R * (x - t.xR);
    }
    return m;
  };

  const N = (x, seite = 'r') => {
    let n = 0;
    if (liegtLinks(s.xA, x, seite)) n -= AH;
    for (const hz of s.horizontal) if (liegtLinks(hz.x, x, seite)) n -= hz.H;
    return n;
  };

  // Wichtige Stellen: Trägerenden, Auflager, Lastangriffspunkte, Lastanfang und -ende
  const roh = [0, s.L, s.xA, s.xB];
  for (const e of s.einzel) roh.push(e.x);
  for (const hz of s.horizontal) roh.push(hz.x);
  for (const st of s.strecken) roh.push(st.x1, st.x2);
  roh.sort((a, b) => a - b);
  const xs = [];
  for (const x of roh) if (!xs.length || x - xs[xs.length - 1] > 1e-7) xs.push(x);

  const stellen = xs.map((x) => ({
    x,
    Ql: Q(x, 'l'),
    Qr: Q(x, 'r'),
    M: M(x),
    Nl: N(x, 'l'),
    Nr: N(x, 'r'),
  }));

  // Nullstellen der Querkraft zwischen den wichtigen Stellen (dort hat M einen Extremwert)
  const nullstellen = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i];
    const b = xs[i + 1];
    const Q0 = Q(a, 'r');
    let qa = 0;
    let steigung = 0;
    for (const st of s.strecken) {
      if (st.x1 <= a + EPS && st.x2 >= b - EPS) {
        const k = (st.q2 - st.q1) / (st.x2 - st.x1);
        qa += st.q1 + k * (a - st.x1);
        steigung += k;
      }
    }
    // Q(t) = Q0 − qa·t − steigung·t²/2
    const kandidaten = [];
    if (Math.abs(steigung) < EPS) {
      if (Math.abs(qa) > EPS) kandidaten.push(Q0 / qa);
    } else {
      const D = qa * qa + 2 * steigung * Q0;
      if (D >= 0) kandidaten.push((-qa + Math.sqrt(D)) / steigung, (-qa - Math.sqrt(D)) / steigung);
    }
    for (const t of kandidaten) {
      if (t > 1e-7 && t < b - a - 1e-7) {
        const x = a + t;
        nullstellen.push({ x, M: M(x), von: a, Q0, qa, steigung });
      }
    }
  }

  const kandidatenM = [...stellen.map((p) => ({ x: p.x, M: p.M })), ...nullstellen.map((p) => ({ x: p.x, M: p.M }))];
  const maxM = kandidatenM.reduce((a, b) => (b.M > a.M ? b : a));
  const minM = kandidatenM.reduce((a, b) => (b.M < a.M ? b : a));
  let maxQ = { x: 0, Q: 0 };
  for (const p of stellen) {
    if (Math.abs(p.Ql) > Math.abs(maxQ.Q)) maxQ = { x: p.x, Q: p.Ql };
    if (Math.abs(p.Qr) > Math.abs(maxQ.Q)) maxQ = { x: p.x, Q: p.Qr };
  }

  // Punkte für die Diagramme
  const kurve = [];
  const TEILE = 24;
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j <= TEILE; j++) {
      const x = j === TEILE ? xs[i + 1] : xs[i] + ((xs[i + 1] - xs[i]) * j) / TEILE;
      const seite = j === TEILE ? 'l' : 'r';
      kurve.push({ x, Q: Q(x, seite), M: M(x), N: N(x, seite) });
    }
  }

  return { system: s, resultierenden: res, AV, BV, AH, summeV, summeH, stellen, nullstellen, maxM, minM, maxQ, kurve, Q, M, N };
}

// ---------------------------------------------------------------------------
// Rechenweg
// ---------------------------------------------------------------------------

function momentAusdruck(erg, x) {
  const s = erg.system;
  const teileText = [];
  if (s.xA < x - EPS) teileText.push(`${z(erg.AV)} · ${z(x - s.xA)}`);
  if (s.xB < x - EPS) teileText.push(`+ ${z(erg.BV)} · ${z(x - s.xB)}`);
  for (const e of s.einzel) if (e.x < x - EPS) teileText.push(`− ${z(e.F)} · ${z(x - e.x)}`);
  for (const st of s.strecken) {
    const t = teil(st, x);
    if (Math.abs(t.R) < EPS) continue;
    if (formVon(st) === 'gleich') teileText.push(`− ${z(st.q1)} · ${z(t.d)} · ${z(x - t.xR)}`);
    else teileText.push(`− ${z(t.R)} · ${z(x - t.xR)}`);
  }
  return teileText.length ? teileText.join(' ') : '0';
}

export function rechenweg(erg) {
  const s = erg.system;
  const L = s.xB - s.xA;
  const schritte = [];

  // 1. Resultierende
  if (erg.resultierenden.length) {
    const zeilen = [];
    erg.resultierenden.forEach((r, i) => {
      const n = i + 1;
      const { st } = r;
      const ab = st.x1 > EPS ? `${z(st.x1)} + ` : '';
      const abSymbol = st.x1 > EPS ? 'a + ' : '';
      if (r.form === 'gleich') {
        zeilen.push(`R${n} = ${st.name} · l = ${z(st.q1)} kN/m · ${z(r.l)} m = ${fmt(r.R)} kN`);
        zeilen.push(`xR${n} = ${abSymbol}l / 2 = ${ab}${z(r.l)} / 2 = ${fmt(r.xR)} m`);
      } else if (r.form === 'dreieckSteigend') {
        zeilen.push(`R${n} = ${st.name} · l / 2 = ${z(st.q2)} kN/m · ${z(r.l)} m / 2 = ${fmt(r.R)} kN`);
        zeilen.push(`xR${n} = ${abSymbol}2/3 · l = ${ab}2/3 · ${z(r.l)} = ${fmt(r.xR)} m`);
      } else if (r.form === 'dreieckFallend') {
        zeilen.push(`R${n} = ${st.name} · l / 2 = ${z(st.q1)} kN/m · ${z(r.l)} m / 2 = ${fmt(r.R)} kN`);
        zeilen.push(`xR${n} = ${abSymbol}1/3 · l = ${ab}1/3 · ${z(r.l)} = ${fmt(r.xR)} m`);
      } else {
        zeilen.push(`R${n} = (q links + q rechts) / 2 · l = (${z(st.q1)} + ${z(st.q2)}) / 2 · ${z(r.l)} = ${fmt(r.R)} kN`);
        zeilen.push(`xR${n} = ${fmt(r.xR)} m  (Schwerpunkt des Trapezes)`);
      }
    });
    zeilen.push({ t: 'R = Ersatzkraft der Streckenlast, xR = ihr Abstand von A', art: 'hinweis' });
    schritte.push({ titel: 'Resultierende der Streckenlasten', zeilen });
  }

  // 2. Momentengleichgewicht um A
  const symbole = [];
  const zahlen = [];
  for (const e of s.einzel) {
    symbole.push(`${e.name} · x${e.name}`);
    zahlen.push(`${z(e.F)} · ${z(e.x - s.xA)}`);
  }
  erg.resultierenden.forEach((r, i) => {
    symbole.push(`R${i + 1} · xR${i + 1}`);
    zahlen.push(`${z(r.R)} · ${z(r.xR - s.xA)}`);
  });
  if (symbole.length) {
    schritte.push({
      titel: 'Summe der Momente um A  (↻ +)',
      zeilen: [
        `ΣM(A) = 0:  0 = ${symbole.join(' + ')} − BV · L`,
        `BV = (${symbole.join(' + ')}) / L`,
        `BV = (${zahlen.join(' + ')}) / ${z(L)}`,
        { t: `BV = ${fmt(erg.BV)} kN`, art: 'ergebnis' },
      ],
    });
  } else {
    schritte.push({
      titel: 'Summe der Momente um A  (↻ +)',
      zeilen: ['Keine vertikalen Lasten vorhanden.', { t: 'BV = 0 kN', art: 'ergebnis' }],
    });
  }

  // 3. Vertikales Gleichgewicht
  const lastSymbole = [...s.einzel.map((e) => e.name), ...erg.resultierenden.map((_, i) => `R${i + 1}`)];
  const lastZahlen = [...s.einzel.map((e) => z(e.F)), ...erg.resultierenden.map((r) => z(r.R))];
  if (lastSymbole.length) {
    schritte.push({
      titel: 'Summe der Vertikalkräfte  (↑ +)',
      zeilen: [
        `ΣV = 0:  0 = AV + BV − ${lastSymbole.join(' − ')}`,
        `AV = ${lastSymbole.join(' + ')} − BV`,
        `AV = ${lastZahlen.join(' + ')} − ${z(erg.BV)}`,
        { t: `AV = ${fmt(erg.AV)} kN`, art: 'ergebnis' },
        { t: `Kontrolle: AV + BV = ${fmt(erg.AV + erg.BV)} kN = Summe aller Lasten ✓`, art: 'hinweis' },
      ],
    });
  } else {
    schritte.push({ titel: 'Summe der Vertikalkräfte  (↑ +)', zeilen: [{ t: 'AV = 0 kN', art: 'ergebnis' }] });
  }

  // 4. Horizontales Gleichgewicht
  if (s.horizontal.length) {
    const namen = s.horizontal.map((hz) => hz.name);
    const werte = s.horizontal.map((hz) => fmt(hz.H, 3, 0));
    schritte.push({
      titel: 'Summe der Horizontalkräfte  (→ +)',
      zeilen: [
        `ΣH = 0:  0 = AH + ${namen.join(' + ')}`,
        `AH = −(${werte.join(' + ')})`,
        { t: `AH = ${fmt(erg.AH)} kN`, art: 'ergebnis', notiz: erg.AH < -EPS ? 'wirkt nach links' : erg.AH > EPS ? 'wirkt nach rechts' : '' },
      ],
    });
  } else {
    schritte.push({
      titel: 'Summe der Horizontalkräfte  (→ +)',
      zeilen: ['ΣH = 0:  0 = AH', { t: 'AH = 0 kN', art: 'ergebnis', notiz: 'keine Horizontalkräfte' }],
    });
  }

  // 5. Querkraft
  const zeilenQ = [{ t: 'Q = Summe aller Kräfte links vom Schnitt (↑ +). Von links nach rechts durchgehen:', art: 'hinweis' }];
  erg.stellen.forEach((p, k) => {
    if (k > 0) {
      const davor = erg.stellen[k - 1].Qr;
      const dazwischen = davor - p.Ql;
      if (Math.abs(dazwischen) > 1e-7) {
        zeilenQ.push(`x = ${z(p.x)} m, links:  Q = ${z(davor)} − ${z(dazwischen)} = ${fmt(p.Ql)} kN`);
      }
    }
    if (Math.abs(p.Qr - p.Ql) > 1e-7) {
      const teileText = [];
      if (Math.abs(p.x - s.xA) < 1e-7) teileText.push(`+ AV`);
      if (Math.abs(p.x - s.xB) < 1e-7) teileText.push(`+ BV`);
      for (const e of s.einzel) if (Math.abs(e.x - p.x) < 1e-7) teileText.push(`− ${e.name}`);
      const start = Math.abs(p.Ql) < 1e-7 ? '' : `${z(p.Ql)} `;
      let ausdruck = `${start}${teileText.join(' ')}`.trim();
      if (ausdruck.startsWith('+ ')) ausdruck = ausdruck.slice(2);
      const seite = Math.abs(p.Ql) < 1e-7 ? '' : ', rechts';
      zeilenQ.push(`x = ${z(p.x)} m${seite}:  Q = ${ausdruck} = ${fmt(p.Qr)} kN`);
    }
  });
  for (const n of erg.nullstellen) {
    if (Math.abs(n.steigung) < EPS) {
      zeilenQ.push({
        t: `Q = 0 bei x0 = ${n.von > EPS ? `${z(n.von)} + ` : ''}${z(n.Q0)} / ${z(n.qa)} = ${fmt(n.x)} m`,
        art: 'ergebnis',
        notiz: 'x0 = Q / q, dort ist M am größten',
      });
    } else {
      zeilenQ.push({ t: `Q = 0 bei x0 = ${fmt(n.x)} m`, art: 'ergebnis', notiz: 'dort ist M am größten' });
    }
  }
  schritte.push({ titel: 'Querkraft Q', zeilen: zeilenQ });

  // 6. Biegemoment
  const zeilenM = [{ t: 'M = Summe der Momente aller Kräfte links vom Schnitt (Kraft · Abstand zum Schnitt).', art: 'hinweis' }];
  const punkte = [
    ...erg.stellen.filter((p) => p.x > EPS && p.x < s.L - EPS).map((p) => ({ x: p.x })),
    ...erg.nullstellen.map((n) => ({ x: n.x, null: true })),
  ].sort((a, b) => a.x - b.x);
  for (const p of punkte) {
    zeilenM.push(`M(x = ${z(p.x)} m) = ${momentAusdruck(erg, p.x)} = ${fmt(erg.M(p.x))} kNm`);
  }
  if (!punkte.length) zeilenM.push('Keine Lasten: M = 0');
  if (Math.abs(erg.maxM.M) > 1e-7 && erg.maxM.M > 0) {
    zeilenM.push({ t: `max M = ${fmt(erg.maxM.M)} kNm bei x = ${fmt(erg.maxM.x)} m`, art: 'ergebnis' });
  }
  if (erg.minM.M < -1e-7) {
    zeilenM.push({ t: `min M = ${fmt(erg.minM.M)} kNm bei x = ${fmt(erg.minM.x)} m`, art: 'ergebnis' });
  }
  schritte.push({ titel: 'Biegemoment M', zeilen: zeilenM });

  // 7. Normalkraft
  if (s.horizontal.length) {
    const zeilenN = [{ t: 'N = Summe der Horizontalkräfte links vom Schnitt, Zug +, Druck −.', art: 'hinweis' }];
    for (let k = 0; k < erg.stellen.length - 1; k++) {
      const a = erg.stellen[k];
      const b = erg.stellen[k + 1];
      zeilenN.push(`von x = ${z(a.x)} m bis ${z(b.x)} m:  N = ${fmt(a.Nr)} kN`);
    }
    schritte.push({ titel: 'Normalkraft N', zeilen: zeilenN });
  }

  return schritte;
}
