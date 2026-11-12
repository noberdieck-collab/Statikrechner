// Startpunkt der App: zeigt die Startseite oder das gewählte Modul.
// Die Adresse hinter dem # bestimmt die Seite, z. B. #/traeger.

import { MODULE, GEPLANT } from './modules/index.js';
import { h } from './ui/dom.js';

const app = document.getElementById('app');

function startseite() {
  return [
    h(
      'header',
      { class: 'kopf start' },
      h('p', { class: 'marke-text' }, 'Statik'),
      h('h1', null, 'Statikrechner'),
      h('p', { class: 'unterzeile' }, 'Rechnen mit Rechenweg, Schritt für Schritt wie im Heft.'),
    ),
    h(
      'main',
      null,
      h(
        'nav',
        { class: 'modul-liste', 'aria-label': 'Module' },
        MODULE.map((m) =>
          h(
            'a',
            { class: 'modul', href: `#/${m.id}` },
            h('span', { class: 'modul-nummer' }, m.nummer),
            h('span', { class: 'modul-text' }, h('strong', null, m.titel), h('small', null, m.kurz)),
            h('span', { class: 'modul-pfeil', 'aria-hidden': 'true' }, '›'),
          ),
        ),
      ),
      h(
        'section',
        { class: 'karte ruhig' },
        h('h2', null, 'So hängen die Module zusammen'),
        h(
          'p',
          { class: 'erklaerung' },
          'Schneelast und Eigenlast liefern s̄ und r. Das Sicherheitskonzept macht daraus q. Mit q rechnet der Träger die Auflagerkräfte und die Schnittgrößen.',
        ),
      ),
      h(
        'section',
        { class: 'karte ruhig' },
        h('h2', null, 'Kommt später'),
        h('ul', { class: 'geplant' }, GEPLANT.map((t) => h('li', null, t))),
      ),
    ),
  ];
}

function modulseite(modul) {
  const inhalt = h('main');
  modul.render(inhalt);
  return [
    h(
      'header',
      { class: 'kopf' },
      h('a', { class: 'zurueck', href: '#/' }, '‹ Übersicht'),
      h('h1', null, modul.titel),
      h('p', { class: 'unterzeile' }, modul.kurz),
    ),
    inhalt,
  ];
}

function zeige() {
  const id = location.hash.replace(/^#\/?/, '');
  const modul = MODULE.find((m) => m.id === id);
  app.replaceChildren(...(modul ? modulseite(modul) : startseite()));
  document.title = modul ? `${modul.titel} – Statikrechner` : 'Statikrechner';
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', zeige);
zeige();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
