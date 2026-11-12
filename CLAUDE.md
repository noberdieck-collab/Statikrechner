# Statikrechner – Hinweise für die Arbeit am Projekt

- Nutzer ist Fachoberschüler (Bautechnik), hat keine Programmiererfahrung und nutzt die App auf iPhone, Tablet und Mac. Mit ihm auf Deutsch und ohne Programmierbegriffe sprechen.
- Die App ist statisch: reines HTML, CSS und JavaScript-Module, kein Build-Schritt, keine Abhängigkeiten. Das soll so bleiben.
- Alle Texte der Oberfläche und die Namen im Code sind deutsch. Zahlen werden mit Komma ausgegeben (`fmt`, `z` in `js/core/format.js`).
- Rechnung und Oberfläche sind getrennt: Statik in `js/core/`, Eingabe und Ausgabe in `js/modules/`. Jeder Rechenkern liefert `schritte` für den Rechenweg (Formel, eingesetzte Zahlen, Ergebnis).
- Der Rechenweg folgt der Schreibweise aus dem Unterricht: AV, BV, AH, R, xR, r (Eigenlast), s̄ (Schnee als Linienlast), q, Sicherheitsbeiwerte 1,35 und 1,5. Beim Formbeiwert wird standardmäßig der größere Wert von μ1/μ2 genommen.
- Vorzeichen im Träger: Lasten positiv nach unten, Q positiv nach oben gezeichnet, M positiv nach unten gezeichnet.
- Neues Modul: siehe README, Abschnitt „Neues Modul ergänzen". Neue Dateien auch in `sw.js` eintragen.
- Vor jedem Commit `npm test` ausführen. Neue Rechenkerne bekommen Tests mit Aufgaben aus dem Unterricht.
