// Eigenlast eines Holzbalkens:  r = γ · b · h
// Wichte γ [kN/m³] = Rohdichte [kg/m³] / 100

import { fmt, z } from './format.js';

// Tabelle "Eigenschaften ausgewählter Holzarten" (Rohdichte in kg/m³)
export const HOLZARTEN = [
  { name: 'Fichte', rohdichte: 470 },
  { name: 'Kiefer', rohdichte: 520 },
  { name: 'Lärche', rohdichte: 590 },
  { name: 'Birke', rohdichte: 650 },
  { name: 'Buche', rohdichte: 690 },
  { name: 'Eiche', rohdichte: 670 },
  { name: 'Esche', rohdichte: 690 },
  { name: 'Robinie', rohdichte: 730 },
  { name: 'Sipo', rohdichte: 590 },
  { name: 'Azobé', rohdichte: 1060 },
];

export function wichteAusRohdichte(rohdichte) {
  return rohdichte / 100;
}

// b und h in cm, laenge (optional) in m
export function eigenlast({ wichte, b, h, laenge, holzart }) {
  if (!(wichte > 0)) throw new Error('Bitte eine Holzart wählen oder die Wichte γ eingeben.');
  if (!(b > 0 && h > 0)) throw new Error('Bitte Breite b und Höhe h des Querschnitts eingeben.');
  const bm = b / 100;
  const hm = h / 100;
  const r = wichte * bm * hm;
  const gewicht = laenge > 0 ? r * laenge : null;

  const schritte = [];
  const holz = HOLZARTEN.find((x) => x.name === holzart);
  if (holz && Math.abs(wichteAusRohdichte(holz.rohdichte) - wichte) < 1e-9) {
    schritte.push({
      titel: `Wichte γ für ${holz.name}`,
      zeilen: [
        `Rohdichte aus der Tabelle: ${z(holz.rohdichte)} kg/m³`,
        { t: `γ = ${z(holz.rohdichte)} / 100 = ${fmt(wichte, 2, 1)} kN/m³`, art: 'ergebnis' },
      ],
    });
  }
  schritte.push({
    titel: 'Eigenlast je Meter Balken',
    zeilen: [
      `Querschnitt b / h = ${z(b)} / ${z(h)} cm = ${z(bm)} m / ${z(hm)} m`,
      'r = γ · b · h',
      `r = ${z(wichte)} kN/m³ · ${z(bm)} m · ${z(hm)} m`,
      { t: `r = ${fmt(r)} kN/m`, art: 'ergebnis' },
    ],
  });
  if (gewicht !== null) {
    schritte.push({
      titel: 'Gesamtgewicht (z. B. Stütze als Einzellast)',
      zeilen: [
        'F = r · L',
        `F = ${z(r)} kN/m · ${z(laenge)} m`,
        { t: `F = ${fmt(gewicht)} kN`, art: 'ergebnis' },
      ],
    });
  }
  return { r, gewicht, schritte };
}
