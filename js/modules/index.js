// Liste aller Module. Ein neues Thema wird hier eingetragen und erscheint
// dann automatisch auf der Startseite (siehe README, Abschnitt "Neues Modul").

import schneelast from './schneelast.js';
import eigenlast from './eigenlast.js';
import kombination from './kombination.js';
import traeger from './traeger.js';

export const MODULE = [schneelast, eigenlast, kombination, traeger];

// Themen, die später dazukommen (nur Anzeige auf der Startseite)
export const GEPLANT = [
  'Biegebemessung (Spannungsnachweis)',
  'Durchbiegung (Gebrauchstauglichkeit)',
  'Kragarm und Träger mit Überstand',
  'Stützen',
];
