# Statikrechner

Web-App zum Rechnen von Statikaufgaben mit Rechenweg, Schritt für Schritt wie im Heft.
Läuft im Browser auf iPhone, Tablet und Mac und funktioniert nach dem ersten Öffnen auch ohne Internet.

## Module

| Nr. | Modul | Inhalt |
|---|---|---|
| 1 | Schneelast | s = μ · sk nach DIN 1055-5, Zonen 1 bis 3, Formbeiwerte μ1/μ2 |
| 2 | Eigenlast | r = γ · b · h mit Holzarten-Tabelle |
| 3 | Sicherheitskonzept | q = r · 1,35 + s̄ · 1,5 |
| 4 | Träger auf zwei Stützen | AV, BV, AH und die Verläufe N, Q, M |

Geplant: Biegebemessung, Durchbiegung, Kragarm, Stützen.

## Auf dem iPhone oder iPad als App ablegen

1. Die Adresse der App in Safari öffnen.
2. Auf „Teilen" tippen und „Zum Home-Bildschirm" wählen.

## Aufbau

```
index.html            Startdatei
css/style.css         Aussehen
js/app.js             Startseite und Wechsel zwischen den Modulen
js/core/              Rechenkerne ohne Oberfläche (hier steht die Statik)
js/modules/           je Thema eine Datei mit Eingaben und Ausgabe
js/ui/                gemeinsame Bausteine und Zeichnungen
tests/                Kontrollrechnungen gegen Aufgaben aus dem Unterricht
sw.js                 sorgt dafür, dass die App ohne Internet läuft
```

Die App braucht keinen Build-Schritt und keine fremden Bibliotheken.

## Neues Modul ergänzen

1. Rechenkern in `js/core/<thema>.js` schreiben. Er liefert Ergebnisse und die Liste `schritte` für den Rechenweg.
2. Kontrollrechnungen in `tests/` ergänzen, am besten mit Aufgaben aus dem Unterricht.
3. Oberfläche in `js/modules/<thema>.js` anlegen (Vorlage: `eigenlast.js`).
4. Modul in `js/modules/index.js` eintragen und die neuen Dateien in `sw.js` in die Liste `DATEIEN` aufnehmen.

## Lokal starten und prüfen

```bash
npm start
```

Danach `http://localhost:8080` öffnen.

```bash
npm test
```
