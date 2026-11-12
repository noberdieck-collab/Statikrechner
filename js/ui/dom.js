// Kleine Bausteine für die Oberfläche, die alle Module gemeinsam nutzen.

export function h(tag, attrs, ...kinder) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kind of kinder.flat(Infinity)) {
    if (kind == null || kind === false) continue;
    el.append(kind.nodeType ? kind : document.createTextNode(String(kind)));
  }
  return el;
}

// Zahlenfeld mit Beschriftung und Einheit
export function feld({ label, einheit, wert, onInput, hinweis, platzhalter }) {
  const input = h('input', {
    type: 'text',
    inputmode: 'decimal',
    autocomplete: 'off',
    value: wert ?? '',
    placeholder: platzhalter ?? '',
    oninput: (ev) => onInput(ev.target.value),
  });
  return h(
    'label',
    { class: 'feld' },
    h('span', { class: 'feld-label' }, label),
    h('span', { class: 'feld-eingabe' }, input, einheit ? h('span', { class: 'einheit' }, einheit) : null),
    hinweis ? h('span', { class: 'feld-hinweis' }, hinweis) : null,
  );
}

// Auswahlliste; optionen = [[wert, text], ...]
export function auswahl({ label, optionen, wert, onChange, hinweis }) {
  const select = h(
    'select',
    { onchange: (ev) => onChange(ev.target.value) },
    optionen.map(([v, text]) => h('option', { value: v, selected: String(v) === String(wert) }, text)),
  );
  return h(
    'label',
    { class: 'feld' },
    h('span', { class: 'feld-label' }, label),
    h('span', { class: 'feld-eingabe' }, select),
    hinweis ? h('span', { class: 'feld-hinweis' }, hinweis) : null,
  );
}

export function karte(titel, ...kinder) {
  return h('section', { class: 'karte' }, titel ? h('h2', null, titel) : null, kinder);
}

// zeilen = [{ name, wert, einheit, notiz }]
export function ergebnisListe(zeilen) {
  return h(
    'dl',
    { class: 'ergebnisse' },
    zeilen.map((zl) =>
      h(
        'div',
        { class: 'ergebnis-zeile' },
        h('dt', null, zl.name, zl.notiz ? h('small', null, zl.notiz) : null),
        h('dd', null, h('strong', null, zl.wert), zl.einheit ? h('span', null, ` ${zl.einheit}`) : null),
      ),
    ),
  );
}

// schritte = [{ titel, zeilen: [text | { t, art: 'ergebnis' | 'hinweis', notiz }] }]
export function rechenwegAnsicht(schritte) {
  return h(
    'ol',
    { class: 'rechenweg' },
    schritte.map((schritt) =>
      h(
        'li',
        null,
        h('h3', null, schritt.titel),
        schritt.zeilen.map((zeile) => {
          if (typeof zeile === 'string') return h('p', { class: 'formel' }, zeile);
          if (zeile.art === 'hinweis') return h('p', { class: 'erklaerung' }, zeile.t);
          return h(
            'p',
            { class: 'formel resultat' },
            h('span', null, zeile.t),
            zeile.notiz ? h('small', null, zeile.notiz) : null,
          );
        }),
      ),
    ),
  );
}

export function meldung(text, art = 'info') {
  return h('p', { class: `meldung ${art}` }, text);
}
