// Sicherheitskonzept:  q = r · 1,35 + s̄ · 1,5
// (ständige Lasten · 1,35, veränderliche Lasten · 1,5)

import { fmt, z } from './format.js';

export const GAMMA_G = 1.35;
export const GAMMA_Q = 1.5;

// r, s: Linienlasten in kN/m; einzel (optional): ständige Einzellast in kN
export function kombination({ r = 0, s = 0, einzel }) {
  if (!(r >= 0) || !(s >= 0)) throw new Error('Bitte die Lasten als positive Zahlen eingeben.');
  const q = r * GAMMA_G + s * GAMMA_Q;
  const schritte = [
    {
      titel: 'Streckenlast mit Sicherheitsbeiwerten',
      zeilen: [
        'q = r · 1,35 + s̄ · 1,5',
        `q = ${z(r)} kN/m · 1,35 + ${z(s)} kN/m · 1,5`,
        `q = ${fmt(r * GAMMA_G)} + ${fmt(s * GAMMA_Q)}`,
        { t: `q = ${fmt(q)} kN/m`, art: 'ergebnis' },
      ],
    },
  ];
  let fd = null;
  if (einzel > 0) {
    fd = einzel * GAMMA_G;
    schritte.push({
      titel: 'Einzellast mit Sicherheitsbeiwert',
      zeilen: [
        'Fq = F · 1,35',
        `Fq = ${z(einzel)} kN · 1,35`,
        { t: `Fq = ${fmt(fd)} kN`, art: 'ergebnis' },
      ],
    });
  }
  return { q, fd, schritte };
}
