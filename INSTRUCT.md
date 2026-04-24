Looks good now. But now the Landing pgae is minimal scrollable, please make it that it isn't on Desktop. Should seem very native. ALso remove the reboot button from the front UI opnly have it at the settings.
In the settings I want all settings like in chessis app. Such as:
- Board design,
- Spieleinstellungen
    - Vorzug aktivieren
    - Bedrohungen anzeigen
    - Bewertungsleiste anzeigen
    - Pause bei Patzer
    - Pause bei Fehler
    - Zugstärke anzeigen
    - Gegnerzugstärke anzeigen
- Dorhungseinstellungen
    mehr oder weniger global für die nachfolgenden
    - Beim Spielen anzeigen
    - Während der Analyse anzeigen
    (Haben toggles):
    - Ungedeckte Figuren (Rote Umrandung)
    - Schachmatt-Drohung (Raute)
    - taktische (Bestzug-)Drohung (Stern Umrandung)
    - Abzugsangriff (Pfeil und Bogen)
    - Stark gedeckte Figuren (Grüne Umrandung)
    - Schwach gedeckte Figuren (Gelbe Umrandung)
    - Bauernschwächen (Rote Umrandung)
    - Freibauern (Blaue Umrandung)
    - Farbe der Drohungspfeile (Palette)
    - Drohungspfeile (Tofggle)
    - Bedrohtes Feld marikieren (Toggle), rot gestrichelte UMrandung
- Schlüsdselelemente (Toggles):
    beim Spielen anzeigen
    beim Analysieren anzeigen
    - Gefesselte Figur (Pinnadel)
    - Schachbarer König (+)
    - Ungedeckte Figure (Schutzschild mit x bzw gebrochenen Schutzschild)
    - Figurenmodbilität (Prozentanzeige)
    - Rückständiger Bauer (roter Punkt)
    - Isolierter Bauer (orangener Punkt)
    - Freibauer (grüner Punkt)
- Analyseeinstellungen
    Schnenbericht:
        - Analyse mit Radio(Zeit, Tiefe)
        - Max. Analyse Zeit / Bzw Tiefe (eingabefeld)
    Ausführlich
        - Analyse mit Radio(Zeit, Tiefe)
        - Max Nalayse Tiefe-/Zeit (eingabefeld)
    INtelligente Analyse (passt analysetiefe automatisch pro Stellung an. Verwendet tiefere Analyse für komplexe Stellungen und schnellere für einfache)
- Sprache ändern

Engine Einstellungen (zusätzlich)
    - Engine auwählen (Stockfish 13, Stockfish 18, .... (exteren Engines über NNUE?))
    - Threads/Kerne
    - Hash (MB)

Erweiterte Einstellungen:
    - Figurine-Notation (toggle)
    - Autoplaygeschwinigkeit
    - Figurenanimation (Schnell normla langsam)
    - Figur beim zihen vergößsern (toggle)
    - CPL im Spielbericht anzeigen (toggle)
    - pfeile auf dem Brett zecihnen (toggle), ermöglicht, pfeile frei auf dem Brett zu zeichnen, deaktiviert die drag and drop funktion
    - Analysepfeile anzeigen
    - Pfeilfarben nach Stärke, unterschiedliuche Farben für versch. Pfeile (grün: gute züge, schlechte rot,kl ungenaue in orange)
    - voherigen bestzugpfeil anzeigen, beim analysieren einer partie einen blassen transparenten Pfeil anzeigen, der den bestzug der engine aus der voiherigen stellung zeigt
    - letztenb Zug nach stärke färben wenn aktiviert übernimmt die Hervorhebung des letzten Zuges die farbed der zugklassifizierung (bester zug, gut, engenauigkeit, fehler, patzer, usw.)
    - benutzername festlegen (wenn man den gleichen wie auf chess.com/lichess angibt, wird das spielbrett automatisch gedreht berim analysieren)
    - Engine Immer Aktiv
    - Züge im Hochformat anziegen (auf kleinern Bildschirmene deaktivieren um Platz zu sparen)
    - Legale ZTüge (punktangezige auf legalen Feldern wenn eine figur ausgewählt ist)
    - alle partieen exportieren
    - partien mit anderen Apps teilen


---
Vor der Partie
- Engine gegen Engine
- Startposition (erstellen oder PGN/FEN einfügen)
- Zeit, ELO, Spielen als...
- Chess 960
- Vordefinierte "Vorteilstellungen, Dame fehlt, Läufer fehlen, ...

---
Analysebrett settings
- Brett zurücksetzen
- PGN teilen
- Aktuelle stellung teilen
- Aktuelle PGN speichern
- Aktuelle PGN analysieren
- Von hier aus spielen
- Unten ein Board Flip button

---
Stellung aufbauen
- AM zug
- Figuren ins spielfeld drasg and drop oder click and place/click an delete (mülleimer knopf dann auf zu löschende Figur)
- seitenwechsel (dass mn adie stellung richtig aufbaut)
- löschen zurücksetzen
- rochade o-o-o, o-o
- FEN kopieren/FEN einfügen
- Brett Scanner bzw. Bild zu Stellung importieren
- Abbrechen, Fertig

---
Spielearchiv (auch lokale browsbar)

---
Eröffnungen
- Datenbank
- Antippen und dann entweder animiert anztiegen lassen in nder preview und nen Button "Auf Analysebrett laden, auch mit seitenwechsel und so"

--- OPTIONAL
GM-Partien
- werden gefechted und analysiert




👑 Das offizielle "Chessfish" Master-Einstellungsmenü

(Gedacht als großes Dialog-Overlay mit linker, seitlicher Navigation)
🎨 1. Brett-Designs & Allgemeines (Board & General)

    Design-Themen: Farbe für dunkle/helle Felder wählen.
    Sprache: (Deutsch, Englisch, etc.).
    Benutzername festlegen: (Gleicher Name wie auf Chess.com/Lichess ➡️ App dreht beim Analysieren automatisch das Brett für dich nach unten).
🎮 2. Spieleinstellungen (Play Mode Settings)
    Zen-Modus / Fokus: Menüs und Notationen während des Spiels gegen den Bot ausblenden (nur Brett und Uhr).
    Vorzug (Premove) aktivieren: Ermöglicht es, Züge schon auszuführen, während die Engine noch nachdenkt.
    Bedrohungen während des Spiels: Erlaubt das Anzeigen von Warnungen während der laufenden Partie.
    Bewertungsleiste: Anzeigen / Ausblenden.
    Pause bei Patzer (??): Partieuhr / Engine-Gegner stoppt, gibt dir die Chance zur Fehler-Rücknahme (Duolingo-Gamification).
    Pause bei Fehler (?): Partieuhr stoppt bei normalen Fehlern.
    Elo / Zugstärke einblenden: Bewertet deinen gespielten Zug visuell direkt auf dem Brett.
    Gegner-Zugstärke einblenden: Bewertet den vom Bot gezogenen Zug.

⚙️ 3. Engine- & Hardware-Verwaltung (Engine Cockpit)
    Engine auswählen: Dropdown für (Stockfish 18, Stockfish 16, Stockfish 14, etc.). Hier sitzt auch der "Boot/Connect Engine" Button.
    NNUE verwenden: Ein/Ausschalten der neuronalen Netz-Evaluierung (falls alte PC-Geräte sonst zu heiß werden).
    Threads (Kerne): Schieberegler 1 bis max. (hängt vom Cloud-Server ab).
    Hash-Speicher (MB): Ram-Zuweisung für die Analyse.
    Engine immer aktiv: Die Engine analysiert die aktuelle Stellung stumm im Hintergrund weiter.
    Multi-PV Standard: Standardanzahl der berechneten Linien (1-5).
    Syzygy Endspiel-Datenbanken: Wenn 6 oder weniger Figuren auf dem Brett sind, fragt die Engine perfekte Lösungsdatenbanken über eine API ab, statt endlos selbst zu rechnen.

🔬 4. Analyse & Spielbericht (Analysis & Reports)
    Schnellbericht: Radiobuttons (Nach Zeit oder Nach Tiefe analysieren). Max-Eingabefeld (z.B. Tiefe 12).
    Ausführlich (Pro-Review): Radiobuttons (Zeit / Tiefe). Max-Eingabefeld (z.B. Tiefe 20).
    Intelligente Analyse: Passt Analysetiefe pro Stellung an (geht in krass komplexen Momenten tiefer in die Rechenleistung, sprintet durch klare Eröffnungszüge).
    CPL im Bericht anzeigen: Centipawn-Loss als genauen Zahlenwert im Profil auflisten.

🛡️ 5. Drohungen (Threat Overlay Settings)

Globale Master-Toggles: Beim Spielen an / Bei Analyse an.
    Pfeil & Linien Option: Drohungspfeile (Linien über das ganze Brett ziehen) UND/ODER Bedrohtes Zielfeld mit roter, gestrichelter Umrandung versehen.
    Indikator-Toggles:
        Ungedeckte Figuren (Rote Randung).
        Mattdrohung (Kreis oder Raute auf dem Feld).
        Taktische Drohung / Engine Bestzug-Drohung (Glow oder Stern-Rahmen).
        Abzugsangriffe.
        Stark gedeckt (Grün) / Schwach gedeckt (Gelb).
        Bauernschwächen / Freibauern.
    Farbe für Pfeile wählen: Palette öffnet sich zur manuellen Anpassung.

🗝️ 6. Schlüsselelemente (Key Concept Insights)

Diese zeigen auf den Eck-Indikatoren ("Schild", "Nadel") fundamentale strategische Elemente an.
    Toggles für Elemente:
        Gefesselte Figur (Pinnadel-Icon).
        Schachbarer König (+ Icon auf dem gegnerischen König, falls direkter Schach-Pfad existiert).
        Figur in Gefahr/Ungedeckt (Geplatztes Schild).
        Rückständiger Bauer (mittelkleiner roter Punkt rechts über dem Bauern).
        Isolierter Bauer (Orange Punkt).
        Freibauer (Grüner Punkt).
        Figurenmobilität (Kleines "%"-Schild oder Thermometer neben Figuren, die völlig eingekesselt sind).

🪚 7. Optik & Erweitertes Layout (Visuals & Flow)
    Figurenanimation: Geschwindigkeits-Toggle (Slow / Normal / Fast).
    Figur bei Drag vergrößern: Toggle. Wenn man eine Figur mit Maus/Finger hochhebt, wächst sie leicht, damit man die Feldsicht darunter behält.
    Manuelle Markierungen: Rechtsklick-Drag zeichnet grüne Pfeile/Felder. (Blockiert kurzes Bewegen, solange gedrückt).
    Automatisches Einfärben:
        Pfeilfarben folgen Bewertungsstärke (Grün=Stark, Orange/Rot=Mäßig/Verlust).
        Der VORHERIGE Top-Zug als transparenter, matter Geist (Zeigt den verpassten besten Weg an!).
        Der JETZT letzte gespielte Zug ändert die gelbe Ursprungs-Brett-Farbe entsprechend der Duolingo-Badge-Farbe (Rot/Blunder, Grün/Gespielt, Blau/Genauigkeit).
    Figurine Notation: Schreibt man Springer = "S" / "N", oder benutzt die App hübsche
    Unicode/SVGs (♘/♞).
    Züge vertikal scrollen: PGN auf schmalen Monitoren stapeln.
    Legal Dots: Diese winzigen transparent-grauen Punkte, wohin du legal ziehen kannst, wenn eine Figur ausgewählt ist.

🔉 8. Audio (Sound & Feel)
    Global Sound an/aus.
    Puff-/Klack-Sound für Bewegung & Schlagen.
    Alarm-Ton (Bass / Warn-Schall) für ein gespieltes SCHACH (+).
    Duolingo-Pling beim Klicken der Buttons & Fehlererkennung.
    Spiel-Teilen / Partien-Export-Button (Hier als globale Tools integriert).