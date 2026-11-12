import { parseNum, fmt, alsEingabe } from '../core/format.js';
import { lade, speichere } from '../core/speicher.js';
import { loese, rechenweg } from '../core/traeger.js';
import { systemSkizze, verlauf } from '../ui/diagramm.js';
import { h, feld, auswahl, karte, ergebnisListe, rechenwegAnsicht, meldung } from '../ui/dom.js';

const STANDARD = { L: '6', lasten: [{ typ: 'strecke', q: '2', von: '', bis: '' }] };

const NEU = {
  einzel: () => ({ typ: 'einzel', F: '', x: '' }),
  strecke: () => ({ typ: 'strecke', q: '', von: '', bis: '' }),
  trapez: () => ({ typ: 'trapez', qL: '0', qR: '', von: '', bis: '' }),
  horizontal: () => ({ typ: 'horizontal', H: '', x: '', richtung: 'links' }),
  moment: () => ({ typ: 'moment', M: '', x: '', richtung: 'gegen' }),
};

const TITEL = {
  einzel: 'Einzellast',
  strecke: 'Streckenlast',
  trapez: 'Dreiecks-/Trapezlast',
  horizontal: 'Horizontalkraft',
  moment: 'Moment',
};
const KUERZEL = { einzel: 'F', strecke: 'q', trapez: 'q', horizontal: 'H', moment: 'ML' };

// Die neun Fälle vom Arbeitsblatt "Typische Schnittkraftverläufe".
// Jede Vorlage trägt Beispielwerte ein, die danach geändert werden können.
const n = (x) => alsEingabe(Math.round(x * 100) / 100);
const VORLAGEN = [
  { titel: 'Einzellast in der Mitte', lasten: (L) => [{ typ: 'einzel', F: '10', x: n(L / 2) }] },
  { titel: 'Einzellast außermittig', lasten: (L) => [{ typ: 'einzel', F: '10', x: n(L / 3) }] },
  {
    titel: 'Zwei gleiche Einzellasten',
    lasten: (L) => [
      { typ: 'einzel', F: '10', x: n(L / 4) },
      { typ: 'einzel', F: '10', x: n((3 * L) / 4) },
    ],
  },
  { titel: 'Streckenlast über die ganze Länge', lasten: () => [{ typ: 'strecke', q: '2', von: '', bis: '' }] },
  { titel: 'Streckenlast links (Teilstück)', lasten: (L) => [{ typ: 'strecke', q: '2', von: '', bis: n(L / 2) }] },
  { titel: 'Streckenlast im Feld (Teilstück)', lasten: (L) => [{ typ: 'strecke', q: '2', von: n(L / 3), bis: n((2 * L) / 3) }] },
  { titel: 'Dreieckslast', lasten: () => [{ typ: 'trapez', qL: '0', qR: '4', von: '', bis: '' }] },
  { titel: 'Moment am Auflager B', lasten: (L) => [{ typ: 'moment', M: '10', x: n(L), richtung: 'gegen' }] },
  { titel: 'Moment im Feld', lasten: (L) => [{ typ: 'moment', M: '10', x: n(L / 3), richtung: 'gegen' }] },
];

// Eingaben (Texte) in das Rechenmodell übersetzen
function zuSystem(st) {
  const L = parseNum(st.L);
  const leer = (t, ersatz) => (String(t ?? '').trim() === '' ? ersatz : parseNum(t));
  const lasten = st.lasten.map((l) => {
    if (l.typ === 'einzel') return { typ: 'einzel', F: parseNum(l.F), x: parseNum(l.x) };
    if (l.typ === 'horizontal') {
      const betrag = parseNum(l.H);
      return { typ: 'horizontal', H: l.richtung === 'links' ? -betrag : betrag, x: parseNum(l.x) };
    }
    if (l.typ === 'moment') {
      const betrag = parseNum(l.M);
      return { typ: 'moment', M: l.richtung === 'im' ? betrag : -betrag, x: parseNum(l.x) };
    }
    if (l.typ === 'strecke') {
      const q = parseNum(l.q);
      return { typ: 'strecke', q1: q, q2: q, x1: leer(l.von, 0), x2: leer(l.bis, L) };
    }
    return { typ: 'strecke', q1: parseNum(l.qL), q2: parseNum(l.qR), x1: leer(l.von, 0), x2: leer(l.bis, L) };
  });
  return { laenge: L, lasten };
}

export default {
  id: 'traeger',
  nummer: 4,
  titel: 'Träger auf zwei Stützen',
  kurz: 'Auflagerkräfte AV, BV, AH und Schnittgrößen N, Q, M',

  render(root) {
    const st = lade('traeger', STANDARD);
    const ausgabe = h('div');
    const eingaben = h('div');

    const rechne = () => {
      speichere('traeger', st);
      ausgabe.replaceChildren();
      let erg;
      try {
        erg = loese(zuSystem(st));
      } catch (err) {
        ausgabe.append(meldung(err.message));
        return;
      }
      const s = erg.system;

      const markenQ = [
        { x: erg.maxQ.x, v: erg.maxQ.Q },
        ...erg.stellen.flatMap((p) => [
          { x: p.x, v: p.Ql },
          { x: p.x, v: p.Qr },
        ]),
      ];
      const markenM = [
        { x: erg.maxM.x, v: erg.maxM.M },
        { x: erg.minM.x, v: erg.minM.M },
        ...erg.stellen.flatMap((p) => [
          { x: p.x, v: p.Ml },
          { x: p.x, v: p.Mr },
        ]),
      ];
      const markenN = erg.stellen.flatMap((p) => [
        { x: p.x, v: p.Nr },
        { x: p.x, v: p.Nl },
      ]);

      const diagramme = [
        s.horizontal.length
          ? verlauf({ kurve: erg.kurve, feld: 'N', L: s.L, titel: 'N – Normalkraft', einheit: 'kN', marken: markenN })
          : '',
        verlauf({ kurve: erg.kurve, feld: 'Q', L: s.L, titel: 'Q – Querkraft', einheit: 'kN', marken: markenQ }),
        verlauf({ kurve: erg.kurve, feld: 'M', L: s.L, titel: 'M – Biegemoment', einheit: 'kNm', positivUnten: true, marken: markenM }),
      ].join('');

      const kennwerte = [];
      if (erg.maxM.M > 1e-7) kennwerte.push({ name: 'max M', notiz: `bei x = ${fmt(erg.maxM.x)} m`, wert: fmt(erg.maxM.M), einheit: 'kNm' });
      if (erg.minM.M < -1e-7) kennwerte.push({ name: 'min M', notiz: `bei x = ${fmt(erg.minM.x)} m`, wert: fmt(erg.minM.M), einheit: 'kNm' });
      kennwerte.push({ name: 'max |Q|', notiz: `bei x = ${fmt(erg.maxQ.x)} m`, wert: fmt(Math.abs(erg.maxQ.Q)), einheit: 'kN' });

      ausgabe.append(
        karte('System', h('div', { class: 'zeichnung', html: systemSkizze(s) })),
        karte(
          'Auflagerkräfte',
          ergebnisListe([
            { name: 'AV', notiz: 'bei A, nach oben', wert: fmt(erg.AV), einheit: 'kN' },
            { name: 'BV', notiz: 'bei B, nach oben', wert: fmt(erg.BV), einheit: 'kN' },
            { name: 'AH', notiz: 'bei A, horizontal', wert: fmt(erg.AH), einheit: 'kN' },
          ]),
        ),
        karte(
          'Schnittgrößen',
          h('div', { class: 'zeichnung', html: diagramme }),
          ergebnisListe(kennwerte),
          h('p', { class: 'erklaerung' }, 'Q positiv nach oben, M positiv nach unten gezeichnet – wie auf dem Arbeitsblatt.'),
        ),
        karte('Rechenweg', rechenwegAnsicht(rechenweg(erg))),
      );
    };

    const zeichne = () => {
      const zaehler = { F: 0, q: 0, H: 0, ML: 0 };
      const setze = (last, schluessel) => (v) => {
        last[schluessel] = v;
        rechne();
      };

      const lastKarten = st.lasten.map((last, index) => {
        const k = KUERZEL[last.typ];
        zaehler[k] += 1;
        const name = `${k}${zaehler[k]}`;
        let felder;
        if (last.typ === 'einzel') {
          felder = [
            feld({ label: `Kraft ${name}`, einheit: 'kN', wert: last.F, onInput: setze(last, 'F') }),
            feld({ label: 'Abstand von A', einheit: 'm', wert: last.x, onInput: setze(last, 'x') }),
          ];
        } else if (last.typ === 'strecke') {
          felder = [
            feld({ label: `Last ${name}`, einheit: 'kN/m', wert: last.q, onInput: setze(last, 'q') }),
            feld({ label: 'von', einheit: 'm', wert: last.von, platzhalter: '0', onInput: setze(last, 'von') }),
            feld({ label: 'bis', einheit: 'm', wert: last.bis, platzhalter: 'L', onInput: setze(last, 'bis') }),
          ];
        } else if (last.typ === 'trapez') {
          felder = [
            feld({ label: `${name} links`, einheit: 'kN/m', wert: last.qL, onInput: setze(last, 'qL') }),
            feld({ label: `${name} rechts`, einheit: 'kN/m', wert: last.qR, onInput: setze(last, 'qR') }),
            feld({ label: 'von', einheit: 'm', wert: last.von, platzhalter: '0', onInput: setze(last, 'von') }),
            feld({ label: 'bis', einheit: 'm', wert: last.bis, platzhalter: 'L', onInput: setze(last, 'bis') }),
          ];
        } else if (last.typ === 'moment') {
          felder = [
            feld({ label: `Moment ${name}`, einheit: 'kNm', wert: last.M, onInput: setze(last, 'M') }),
            feld({ label: 'Abstand von A', einheit: 'm', wert: last.x, onInput: setze(last, 'x') }),
            auswahl({
              label: 'Drehrichtung',
              wert: last.richtung,
              optionen: [
                ['gegen', '↺ gegen den Uhrzeiger'],
                ['im', '↻ im Uhrzeigersinn'],
              ],
              onChange: setze(last, 'richtung'),
            }),
          ];
        } else {
          felder = [
            feld({ label: `Kraft ${name}`, einheit: 'kN', wert: last.H, onInput: setze(last, 'H') }),
            feld({ label: 'Abstand von A', einheit: 'm', wert: last.x, onInput: setze(last, 'x') }),
            auswahl({
              label: 'Richtung',
              wert: last.richtung,
              optionen: [
                ['links', '← nach links'],
                ['rechts', '→ nach rechts'],
              ],
              onChange: setze(last, 'richtung'),
            }),
          ];
        }
        return h(
          'div',
          { class: 'last' },
          h(
            'div',
            { class: 'last-kopf' },
            h('strong', null, `${TITEL[last.typ]} ${name}`),
            h(
              'button',
              {
                class: 'knopf klein',
                type: 'button',
                'aria-label': `${TITEL[last.typ]} ${name} entfernen`,
                onclick: () => {
                  st.lasten.splice(index, 1);
                  zeichne();
                  rechne();
                },
              },
              'Entfernen',
            ),
          ),
          h('div', { class: 'raster eng' }, felder),
        );
      });

      const hinzu = (typ, text) =>
        h(
          'button',
          {
            class: 'knopf',
            type: 'button',
            onclick: () => {
              st.lasten.push(NEU[typ]());
              zeichne();
              rechne();
            },
          },
          `+ ${text}`,
        );

      eingaben.replaceChildren(
        karte(
          'Träger',
          h(
            'div',
            { class: 'raster' },
            feld({
              label: 'Länge L (Abstand A bis B)',
              einheit: 'm',
              wert: st.L,
              onInput: (v) => {
                st.L = v;
                rechne();
              },
            }),
          ),
        ),
        karte(
          'Lasten',
          h(
            'div',
            { class: 'vorlage' },
            auswahl({
              label: 'Lastfall vom Arbeitsblatt laden',
              wert: '',
              optionen: [['', 'Fall 1 bis 9 auswählen …'], ...VORLAGEN.map((v, i) => [i, `${i + 1}. ${v.titel}`])],
              hinweis: 'Ersetzt die Lasten unten durch Beispielwerte. Die Zahlen können Sie danach ändern.',
              onChange: (v) => {
                if (v === '') return;
                const L = parseNum(st.L);
                if (!(L > 0)) st.L = '6';
                st.lasten = VORLAGEN[Number(v)].lasten(L > 0 ? L : 6);
                zeichne();
                rechne();
              },
            }),
          ),
          lastKarten.length ? lastKarten : h('p', { class: 'erklaerung' }, 'Noch keine Last eingetragen.'),
          h('p', { class: 'feld-label' }, 'Eigene Last hinzufügen'),
          h(
            'div',
            { class: 'knopfzeile' },
            hinzu('einzel', 'Einzellast'),
            hinzu('strecke', 'Streckenlast'),
            hinzu('trapez', 'Dreieckslast'),
            hinzu('moment', 'Moment'),
            hinzu('horizontal', 'Horizontalkraft'),
          ),
          h('p', { class: 'erklaerung' }, 'Lasten wirken nach unten. Abstände werden vom linken Auflager A gemessen.'),
        ),
      );
    };

    root.append(eingaben, ausgabe);
    zeichne();
    rechne();
  },
};
