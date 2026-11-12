import { parseNum, fmt } from '../core/format.js';
import { lade, speichere, merkeWerte } from '../core/speicher.js';
import { schneelast, ORTE, ZONEN } from '../core/schnee.js';
import { h, feld, auswahl, karte, ergebnisListe, rechenwegAnsicht, meldung } from '../ui/dom.js';

const STANDARD = { ort: 'Hannover', hoehe: '55', zone: '2', alpha: '52', muWahl: 'max', breite: '' };

export default {
  id: 'schneelast',
  nummer: 1,
  titel: 'Schneelast',
  kurz: 's = μ · sk nach DIN 1055-5',

  render(root) {
    const st = lade('schneelast', STANDARD);
    const ausgabe = h('div');
    const eingaben = h('div');

    const rechne = () => {
      speichere('schneelast', st);
      ausgabe.replaceChildren();
      try {
        const breite = st.breite.trim() === '' ? undefined : parseNum(st.breite);
        const e = schneelast({
          zone: st.zone,
          hoehe: parseNum(st.hoehe),
          alpha: parseNum(st.alpha),
          muWahl: st.muWahl,
          breite,
        });
        merkeWerte({ s: e.linie });
        const zeilen = [
          { name: 'Formbeiwert', notiz: e.muName, wert: fmt(e.mu), einheit: '' },
          { name: 'sk', notiz: 'auf dem Boden', wert: fmt(e.sk), einheit: 'kN/m²' },
          { name: 's', notiz: 'Schneelast auf dem Dach', wert: fmt(e.s), einheit: 'kN/m²' },
        ];
        if (e.linie !== null) zeilen.push({ name: 's̄', notiz: 'Linienlast auf den Balken', wert: fmt(e.linie), einheit: 'kN/m' });
        ausgabe.append(karte('Ergebnis', ergebnisListe(zeilen)), karte('Rechenweg', rechenwegAnsicht(e.schritte)));
      } catch (err) {
        ausgabe.append(meldung(err.message));
      }
    };

    const zeichne = () => {
      eingaben.replaceChildren(
        karte(
          'Eingaben',
          h(
            'div',
            { class: 'raster' },
            auswahl({
              label: 'Ort',
              wert: st.ort,
              optionen: [['', 'eigene Werte'], ...ORTE.map((o) => [o.name, `${o.name} (${o.hoehe} m, Zone ${o.zone})`])],
              onChange: (v) => {
                st.ort = v;
                const ort = ORTE.find((o) => o.name === v);
                if (ort) {
                  st.hoehe = String(ort.hoehe);
                  st.zone = ort.zone;
                }
                zeichne();
                rechne();
              },
            }),
            feld({
              label: 'Höhe über dem Meer A',
              einheit: 'm',
              wert: st.hoehe,
              onInput: (v) => {
                st.hoehe = v;
                rechne();
              },
            }),
            auswahl({
              label: 'Schneelastzone',
              wert: st.zone,
              optionen: Object.keys(ZONEN).map((k) => [k, `Zone ${k}`]),
              onChange: (v) => {
                st.zone = v;
                rechne();
              },
            }),
            feld({
              label: 'Dachneigung α',
              einheit: '°',
              wert: st.alpha,
              onInput: (v) => {
                st.alpha = v;
                rechne();
              },
            }),
            auswahl({
              label: 'Formbeiwert',
              wert: st.muWahl,
              optionen: [
                ['max', 'größerer Wert (wie im Unterricht)'],
                ['mu1', 'μ1'],
                ['mu2', 'μ2'],
              ],
              onChange: (v) => {
                st.muWahl = v;
                rechne();
              },
            }),
            feld({
              label: 'Breite b für die Linienlast',
              einheit: 'm',
              wert: st.breite,
              platzhalter: 'leer lassen = nur Flächenlast',
              hinweis: 'z. B. Balkenbreite 12 cm = 0,12 m',
              onInput: (v) => {
                st.breite = v;
                rechne();
              },
            }),
          ),
        ),
      );
    };

    root.append(eingaben, ausgabe);
    zeichne();
    rechne();
  },
};
