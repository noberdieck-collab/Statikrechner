// Merkt sich Eingaben auf dem Gerät. Funktioniert die Ablage nicht
// (z. B. privates Fenster), rechnet die App trotzdem normal weiter.

const PRAEFIX = 'statik:';

export function lade(schluessel, standard) {
  const kopie = JSON.parse(JSON.stringify(standard));
  try {
    const roh = localStorage.getItem(PRAEFIX + schluessel);
    return roh ? { ...kopie, ...JSON.parse(roh) } : kopie;
  } catch {
    return kopie;
  }
}

export function speichere(schluessel, wert) {
  try {
    localStorage.setItem(PRAEFIX + schluessel, JSON.stringify(wert));
  } catch {
    /* ohne Ablage weiterarbeiten */
  }
}

// Ergebnisse, die ein Modul an das nächste weitergibt (z. B. q an den Träger).
export function ladeWerte() {
  return lade('werte', {});
}

export function merkeWerte(neu) {
  speichere('werte', { ...ladeWerte(), ...neu });
}
