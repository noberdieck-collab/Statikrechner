import { parseNum, fmt, alsEingabe } from '../core/format.js';
import { lade, speichere, merkeWerte } from '../core/speicher.js';
import { eigenlast, HOLZARTEN, wichteAusRohdichte } from '../core/eigenlast.js';
import { h, feld, auswahl, karte, ergebnisListe, rechenwegAnsicht, meldung } from '../ui/dom.js';

const STANDARD = { holzart: 'Eiche', wichte: '6,7', b: '12', h: '20', laenge: '' };

export default {
  id: 'eigenlast',
  nummer: 2,
  titel: 'Eigenlast',
  kurz: 'r = γ · b · h für Holzbalken und Stützen',

  render(root) {
    const st = lade('eigenlast', STANDARD);
    const ausgabe = h('div');
    const eingaben = h('div');

    const rechne = () => {
      speichere('eigenlast', st);
      ausgabe.replaceChildren();
      try {
        const e = eigenlast({
          wichte: parseNum(st.wichte),
          b: parseNum(st.b),
          h: parseNum(st.h),
          laenge: st.laenge.trim() === '' ? undefined : parseNum(st.laenge),
          holzart: st.holzart,
        });
        merkeWerte({ r: e.r });
        const zeilen = [{ name: 'r', notiz: 'Eigenlast je Meter', wert: fmt(e.r), einheit: 'kN/m' }];
        if (e.gewicht !== null) zeilen.push({ name: 'F', notiz: 'Gesamtgewicht', wert: fmt(e.gewicht), einheit: 'kN' });
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
              label: 'Holzart',
              wert: st.holzart,
              optionen: [...HOLZARTEN.map((x) => [x.name, `${x.name} (${x.rohdichte} kg/m³)`]), ['', 'eigene Wichte']],
              onChange: (v) => {
                st.holzart = v;
                const holz = HOLZARTEN.find((x) => x.name === v);
                if (holz) st.wichte = alsEingabe(wichteAusRohdichte(holz.rohdichte));
                zeichne();
                rechne();
              },
            }),
            feld({
              label: 'Wichte γ',
              einheit: 'kN/m³',
              wert: st.wichte,
              onInput: (v) => {
                st.wichte = v;
                rechne();
              },
            }),
            feld({
              label: 'Breite b',
              einheit: 'cm',
              wert: st.b,
              onInput: (v) => {
                st.b = v;
                rechne();
              },
            }),
            feld({
              label: 'Höhe h',
              einheit: 'cm',
              wert: st.h,
              onInput: (v) => {
                st.h = v;
                rechne();
              },
            }),
            feld({
              label: 'Länge L',
              einheit: 'm',
              wert: st.laenge,
              platzhalter: 'leer lassen = nur je Meter',
              hinweis: 'für das Gesamtgewicht, z. B. einer Stütze',
              onInput: (v) => {
                st.laenge = v;
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
