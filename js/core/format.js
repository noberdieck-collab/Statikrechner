// Zahlen einlesen und ausgeben (deutsche Schreibweise mit Komma).

export function parseNum(text) {
  if (typeof text === 'number') return text;
  const t = String(text ?? '').trim().replace(/\s/g, '').replace('−', '-').replace(',', '.');
  if (t === '') return NaN;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

// fmt(3.6119) -> "3,612", fmt(4.5) -> "4,50"
export function fmt(x, max = 3, min = 2) {
  if (!Number.isFinite(x)) return '–';
  const wert = Math.abs(x) < 0.5 * 10 ** -max ? 0 : x;
  return wert
    .toLocaleString('de-DE', {
      minimumFractionDigits: Math.min(min, max),
      maximumFractionDigits: max,
      useGrouping: false,
    })
    .replace('-', '−');
}

// Kurze Schreibweise für Zahlen innerhalb einer Rechnung: 7 statt 7,00.
// Negative Zahlen werden eingeklammert.
export function z(x, max = 3) {
  const text = fmt(x, max, 0);
  return text.startsWith('−') ? `(${text})` : text;
}

// Schreibweise für Eingabefelder (ohne Klammern).
export function alsEingabe(x, max = 3) {
  return fmt(x, max, 0).replace('−', '-');
}
