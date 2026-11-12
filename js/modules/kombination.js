import { parseNum, fmt, alsEingabe } from '../core/format.js';
import { lade, speichere, ladeWerte, merkeWerte } from '../core/speicher.js';
import { kombination } from '../core/kombination.js';
import { h, feld, karte, ergebnisListe, rechenwegAnsicht, meldung } from '../ui/dom.js';

const STANDARD = { r: '', s: '', einzel: '' };

export default {
  id: 'kombination',
  nummer: 3,
  titel: 'Sicherheitskonzept',
  kurz: 'q = r · 1,35 + s̄ · 1,5',

  render(root) {
    const st = lade('kombination', STANDARD);
    const werte = ladeWerte();
    const ausgabe = h('div');
    const eingaben = h('div');
    const leerAlsNull = (t) => (t.trim() === '' ? 0 : parseNum(t));

    const rechne = () => {
      speichere('kombination', st);
      ausgabe.replaceChildren();
      try {
        const e = kombination({
          r: leerAlsNull(st.r),
          s: leerAlsNull(st.s),
          einzel: st.einzel.trim() === '' ? undefined : parseNum(st.einzel),
        });
        merkeWerte({ q: e.q });
        const zeilen = [{ name: 'q', notiz: 'Streckenlast für die Bemessung', wert: fmt(e.q), einheit: 'kN/m' }];
        if (e.fd !== null) zeilen.push({ name: 'Fq', notiz: 'Einzellast für die Bemessung', wert: fmt(e.fd), einheit: 'kN' });
        ausgabe.append(
          karte(
            'Ergebnis',
            ergebnisListe(zeilen),
            e.q > 0
              ? h(
                  'button',
                  {
                    class: 'knopf haupt',
                    type: 'button',
                    onclick: () => {
                      const traeger = lade('traeger', { L: '6', lasten: [] });
                      traeger.lasten = [
                        ...traeger.lasten.filter((l) => !l.ausKombination),
                        { typ: 'strecke', q: alsEingabe(e.q), von: '', bis: '', ausKombination: true },
                      ];
                      speichere('traeger', traeger);
                      location.hash = '#/traeger';
                    },
                  },
                  'q im Träger verwenden →',
                )
              : null,
          ),
          karte('Rechenweg', rechenwegAnsicht(e.schritte)),
        );
      } catch (err) {
        ausgabe.append(meldung(err.message));
      }
    };

    const uebernehmen = (schluessel, wert, text) =>
      wert > 0 && alsEingabe(wert) !== st[schluessel].trim()
        ? h(
            'button',
            {
              class: 'chip',
              type: 'button',
              onclick: () => {
                st[schluessel] = alsEingabe(wert);
                zeichne();
                rechne();
              },
            },
            `${text}: ${fmt(wert)} kN/m übernehmen`,
          )
        : null;

    const zeichne = () => {
      eingaben.replaceChildren(
        karte(
          'Eingaben',
          h(
            'div',
            { class: 'raster' },
            h(
              'div',
              null,
              feld({
                label: 'Eigenlast r (ständig)',
                einheit: 'kN/m',
                wert: st.r,
                onInput: (v) => {
                  st.r = v;
                  rechne();
                },
              }),
              uebernehmen('r', werte.r, 'Aus Eigenlast'),
            ),
            h(
              'div',
              null,
              feld({
                label: 'Schneelast s̄ (veränderlich)',
                einheit: 'kN/m',
                wert: st.s,
                onInput: (v) => {
                  st.s = v;
                  rechne();
                },
              }),
              uebernehmen('s', werte.s, 'Aus Schneelast'),
            ),
            feld({
              label: 'Einzellast F (ständig)',
              einheit: 'kN',
              wert: st.einzel,
              platzhalter: 'optional',
              hinweis: 'z. B. Gewicht einer Stütze',
              onInput: (v) => {
                st.einzel = v;
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
