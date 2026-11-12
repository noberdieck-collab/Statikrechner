// Prüft die Rechenkerne gegen Aufgaben aus dem Heft und gegen das
// Arbeitsblatt "Typische Schnittkraftverläufe".
// Start: npm test

import test from 'node:test';
import assert from 'node:assert/strict';

import { fmt, parseNum } from '../js/core/format.js';
import { schneelast } from '../js/core/schnee.js';
import { eigenlast } from '../js/core/eigenlast.js';
import { kombination } from '../js/core/kombination.js';
import { loese, rechenweg } from '../js/core/traeger.js';

const nah = (ist, soll, tol = 0.005) =>
  assert.ok(Math.abs(ist - soll) <= tol, `erwartet ${soll}, berechnet ${ist}`);

test('Zahlen: Komma einlesen und ausgeben', () => {
  assert.equal(parseNum('3,75'), 3.75);
  assert.equal(parseNum('3.75'), 3.75);
  assert.ok(Number.isNaN(parseNum('')));
  assert.equal(fmt(3.6119), '3,612');
  assert.equal(fmt(4.5), '4,50');
  assert.equal(fmt(-1.25), '−1,25');
});

test('Schneelast Hannover (Zone 2, A = 55 m, α = 52°) = 1,36 kN/m²', () => {
  const e = schneelast({ zone: '2', hoehe: 55, alpha: 52 });
  nah(e.sk, 0.85);
  nah(e.formelwert, 0.376, 0.001);
  nah(e.mu1, 0.213, 0.001);
  nah(e.mu2, 1.6);
  nah(e.s, 1.36);
});

test('Schneelast Übung (Zone 1, A = 212 m, α = 28°)', () => {
  const e = schneelast({ zone: '1', hoehe: 212, alpha: 28, breite: 0.08 });
  nah(e.formelwert, 0.385, 0.001);
  nah(e.sk, 0.65);
  nah(e.mu, 1.547, 0.001);
  nah(e.linie, 0.65 * 0.08 * 1.5467, 0.001);
});

test('Schneelast: Zonen 1a/2a mit Faktor 1,25 und steile Dächer', () => {
  nah(schneelast({ zone: '2a', hoehe: 55, alpha: 10, muWahl: 'mu1' }).s, 0.8 * 0.85 * 1.25);
  nah(schneelast({ zone: '3', hoehe: 600, alpha: 0, muWahl: 'mu1' }).sk, 0.31 + 2.91 * (740 / 760) ** 2, 0.001);
  nah(schneelast({ zone: '1', hoehe: 0, alpha: 70, muWahl: 'mu1' }).s, 0);
});

test('Eigenlast Eiche 12/20: r = 6,7 · 0,12 · 0,20 = 0,16 kN/m', () => {
  const e = eigenlast({ wichte: 6.7, b: 12, h: 20, holzart: 'Eiche' });
  nah(e.r, 0.1608, 0.0001);
});

test('Sicherheitskonzept: 0,16 · 1,35 + 0,08 · 1,5 = 0,336 kN/m', () => {
  nah(kombination({ r: 0.16, s: 0.08 }).q, 0.336, 0.0001);
});

test('Heft: q = 0,336 kN/m auf 21,5 m → AV = BV = 3,612 kN', () => {
  const e = loese({ laenge: 21.5, lasten: [{ typ: 'strecke', q1: 0.336, q2: 0.336, x1: 0, x2: 21.5 }] });
  nah(e.AV, 3.612, 0.0005);
  nah(e.BV, 3.612, 0.0005);
  nah(e.AH, 0);
});

test('Heft: F = 7 kN bei 3 m auf 11,5 m → BV = 1,83 kN, AV = 5,17 kN', () => {
  const e = loese({ laenge: 11.5, lasten: [{ typ: 'einzel', F: 7, x: 3 }] });
  nah(e.BV, 1.826, 0.001);
  nah(e.AV, 5.174, 0.001);
});

test('Blatt Fall 1 und 2: Einzellast, max M = P·a·b / l', () => {
  const mitte = loese({ laenge: 6, lasten: [{ typ: 'einzel', F: 10, x: 3 }] });
  nah(mitte.maxM.M, (10 * 6) / 4);
  nah(mitte.maxQ.Q, 5);
  const aussen = loese({ laenge: 6, lasten: [{ typ: 'einzel', F: 10, x: 2 }] });
  nah(aussen.AV, (10 * 4) / 6);
  nah(aussen.maxM.M, (10 * 2 * 4) / 6);
  nah(aussen.maxM.x, 2);
});

test('Blatt Fall 3: zwei gleiche Einzellasten, M = P·a', () => {
  const e = loese({
    laenge: 8,
    lasten: [
      { typ: 'einzel', F: 5, x: 2 },
      { typ: 'einzel', F: 5, x: 6 },
    ],
  });
  nah(e.AV, 5);
  nah(e.maxM.M, 10);
});

test('Blatt Fall 4: Streckenlast, Q = p·l/2 und M = p·l²/8 in der Mitte', () => {
  const e = loese({ laenge: 6, lasten: [{ typ: 'strecke', q1: 2, q2: 2, x1: 0, x2: 6 }] });
  nah(e.AV, 6);
  nah(e.maxM.M, 9);
  nah(e.maxM.x, 3);
  assert.equal(e.nullstellen.length, 1);
});

test('Blatt Fall 5 / Heft: q = 9,6 kN/m auf a = 1,7 m, L = 4,2 m', () => {
  const e = loese({ laenge: 4.2, lasten: [{ typ: 'strecke', q1: 9.6, q2: 9.6, x1: 0, x2: 1.7 }] });
  nah(e.BV, 3.3, 0.005);
  nah(e.AV, 13.02, 0.005);
  nah(e.nullstellen[0].x, 13.02 / 9.6, 0.005); // x0 = A / p = 1,36 m
  nah(e.M(1.7), 8.25, 0.01);
  nah(e.maxM.M, 13.02 ** 2 / (2 * 9.6), 0.01);
});

test('Blatt Fall 6: Teilstreckenlast in der Mitte', () => {
  const [p, a, b, c] = [4, 1, 2, 3];
  const e = loese({ laenge: a + b + c, lasten: [{ typ: 'strecke', q1: p, q2: p, x1: a, x2: a + b }] });
  nah(e.AV, ((p * b) / 6) * (b / 2 + c));
  nah(e.BV, p * b - e.AV);
});

test('Blatt Fall 7 / Heft: Dreieckslast 17 kN/m auf 5 m', () => {
  const e = loese({ laenge: 5, lasten: [{ typ: 'strecke', q1: 0, q2: 17, x1: 0, x2: 5 }] });
  nah(e.AV, 14.17, 0.005);
  nah(e.BV, 28.33, 0.005);
  nah(e.nullstellen[0].x, 5 / Math.sqrt(3), 0.001); // 2,89 m
  nah(e.maxM.M, (17 * 25) / (9 * Math.sqrt(3)), 0.01);
});

test('Horizontalkraft: AH und Normalkraft', () => {
  const e = loese({ laenge: 4.2, lasten: [{ typ: 'horizontal', H: -6.9, x: 4.2 }] });
  nah(e.AH, 6.9);
  nah(e.N(2), -6.9); // Druck
});

test('Gleichgewicht und Randwerte bei gemischten Lasten', () => {
  const e = loese({
    laenge: 12,
    lasten: [
      { typ: 'einzel', F: 0.4, x: 3.5 },
      { typ: 'einzel', F: 0.4, x: 8.1 },
      { typ: 'strecke', q1: 0.23, q2: 0.23, x1: 0, x2: 12 },
      { typ: 'strecke', q1: 1, q2: 3, x1: 2, x2: 9 },
    ],
  });
  nah(e.AV + e.BV, e.summeV, 1e-9);
  nah(e.M(12), 0, 1e-9);
  nah(e.Q(12, 'r'), 0, 1e-9);
  for (const n of e.nullstellen) nah(e.Q(n.x), 0, 1e-9);
  assert.ok(rechenweg(e).length >= 5);
});

test('Fehlerhafte Eingaben werden gemeldet', () => {
  assert.throws(() => loese({ laenge: 0, lasten: [] }));
  assert.throws(() => loese({ laenge: 5, lasten: [{ typ: 'einzel', F: 1, x: 6 }] }));
  assert.throws(() => loese({ laenge: 5, lasten: [{ typ: 'strecke', q1: 1, q2: 1, x1: 3, x2: 2 }] }));
});
