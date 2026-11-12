// Schneelast nach DIN 1055-5 (Arbeitsblatt "Ermittlung der Schneelast").
//   s = μ · sk

import { fmt, z } from './format.js';

// sk = max { sockel ; a + b · ((A + 140) / 760)² }, Zonen 1a/2a zusätzlich · 1,25
export const ZONEN = {
  '1': { sockel: 0.65, a: 0.19, b: 0.91, faktor: 1 },
  '1a': { sockel: 0.65, a: 0.19, b: 0.91, faktor: 1.25 },
  '2': { sockel: 0.85, a: 0.25, b: 1.91, faktor: 1 },
  '2a': { sockel: 0.85, a: 0.25, b: 1.91, faktor: 1.25 },
  '3': { sockel: 1.1, a: 0.31, b: 2.91, faktor: 1 },
};

// Orte aus den bisherigen Übungen im Heft. Weitere können hier ergänzt werden.
export const ORTE = [
  { name: 'Hannover', hoehe: 55, zone: '2' },
  { name: 'Bremen', hoehe: 11, zone: '2' },
  { name: 'Nürnberg', hoehe: 298, zone: '1' },
];

export function charakteristischeSchneelast(zone, hoehe) {
  const zn = ZONEN[zone];
  if (!zn) throw new Error('Unbekannte Schneelastzone.');
  const klammer = (hoehe + 140) / 760;
  const formelwert = zn.a + zn.b * klammer ** 2;
  const basis = Math.max(zn.sockel, formelwert);
  return { ...zn, klammer, formelwert, basis, sk: basis * zn.faktor };
}

export function formbeiwerte(alpha) {
  if (alpha <= 30) {
    return { bereich: '0° ≤ α ≤ 30°', spalte: 1, mu1: 0.8, mu2: 0.8 + (0.8 * alpha) / 30 };
  }
  if (alpha <= 60) {
    return { bereich: '30° < α ≤ 60°', spalte: 2, mu1: (0.8 * (60 - alpha)) / 30, mu2: 1.6 };
  }
  return { bereich: 'α > 60°', spalte: 3, mu1: 0, mu2: 1.6 };
}

// muWahl: 'max' (größerer Wert, wie im Unterricht), 'mu1' oder 'mu2'
// breite: optional, Breite in m für die Linienlast s̄ = s · b
export function schneelast({ zone, hoehe, alpha, muWahl = 'max', breite }) {
  if (!(hoehe >= 0)) throw new Error('Bitte die Höhe über dem Meer (A) eingeben.');
  if (!(alpha >= 0 && alpha <= 90)) throw new Error('Die Dachneigung α muss zwischen 0° und 90° liegen.');
  const k = charakteristischeSchneelast(zone, hoehe);
  const f = formbeiwerte(alpha);
  const mu = muWahl === 'mu1' ? f.mu1 : muWahl === 'mu2' ? f.mu2 : Math.max(f.mu1, f.mu2);
  const muName = muWahl === 'mu1' ? 'μ1' : muWahl === 'mu2' ? 'μ2' : f.mu2 >= f.mu1 ? 'μ2' : 'μ1';
  const s = mu * k.sk;
  const linie = breite > 0 ? s * breite : null;

  const schritte = [];

  const zeilenMu = [`α = ${z(alpha)}°  →  Bereich ${f.bereich}`];
  if (f.spalte === 1) {
    zeilenMu.push('μ1 = 0,8');
    zeilenMu.push(`μ2 = 0,8 + 0,8 · α / 30° = 0,8 + 0,8 · ${z(alpha)} / 30 = ${fmt(f.mu2)}`);
  } else if (f.spalte === 2) {
    zeilenMu.push(`μ1 = 0,8 · (60° − α) / 30° = 0,8 · (60 − ${z(alpha)}) / 30 = ${fmt(f.mu1)}`);
    zeilenMu.push('μ2 = 1,6');
  } else {
    zeilenMu.push('μ1 = 0');
    zeilenMu.push('μ2 = 1,6');
  }
  zeilenMu.push({
    t: `μ = ${muName} = ${fmt(mu)}`,
    art: 'ergebnis',
    notiz: muWahl === 'max' ? 'größerer Wert' : 'so gewählt',
  });
  schritte.push({ titel: 'Formbeiwert μ aus der Dachneigung', zeilen: zeilenMu });

  const zeilenSk = [
    `sk = max { ${z(k.sockel)} ; ${z(k.a)} + ${z(k.b)} · ((A + 140) / 760)² }`,
    `${z(k.a)} + ${z(k.b)} · ((${z(hoehe)} + 140) / 760)² = ${fmt(k.formelwert)}`,
  ];
  if (k.faktor === 1) {
    zeilenSk.push({ t: `sk = ${fmt(k.sk)} kN/m²`, art: 'ergebnis', notiz: 'größerer Wert' });
  } else {
    zeilenSk.push(`größerer Wert: ${fmt(k.basis)} kN/m²`);
    zeilenSk.push({
      t: `sk = 1,25 · ${fmt(k.basis)} = ${fmt(k.sk)} kN/m²`,
      art: 'ergebnis',
      notiz: `Zone ${zone}: Faktor 1,25`,
    });
  }
  schritte.push({
    titel: `Charakteristische Schneelast sk (Zone ${zone}, A = ${z(hoehe)} m)`,
    zeilen: zeilenSk,
  });

  schritte.push({
    titel: 'Schneelast auf dem Dach',
    zeilen: [
      's = μ · sk',
      `s = ${z(mu)} · ${z(k.sk)} kN/m²`,
      { t: `s = ${fmt(s)} kN/m²`, art: 'ergebnis', notiz: 'Flächenlast' },
    ],
  });

  if (linie !== null) {
    schritte.push({
      titel: 'Schneelast als Linienlast auf den Balken',
      zeilen: [
        's̄ = s · b',
        `s̄ = ${z(s)} kN/m² · ${z(breite)} m`,
        { t: `s̄ = ${fmt(linie)} kN/m`, art: 'ergebnis' },
      ],
    });
  }

  return { ...f, mu, muName, sk: k.sk, formelwert: k.formelwert, s, linie, schritte };
}
