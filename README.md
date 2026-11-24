# Persönlicher Trainingsgenerator

Offline-fähige Trainings-App in **einer HTML-Datei** (`docs/training.html`), ohne Frameworks, für Mac, iPad und iPhone.
Prompt/Anforderungen: `Prompt_Persönlicher_Trainingsgenerator.txt`.
Software-Architektur (Module, Datenmodell, Abläufe, Sync): [ARCHITEKTUR.md](ARCHITEKTUR.md).

## Aufbau (Quellen in `src/`, getrennt nach Verantwortung)

| Datei | Schicht | Inhalt |
|---|---|---|
| `js/00-config.js` | Konfiguration | Namespace `App`, Repo-/Sync-Einstellungen, Körpermaße |
| `js/05-pose.js` | Animation (Modell) | Pose-Format und Kinematik der Strichfigur |
| `js/10-data-exercises.js` | **Daten** | Bereiche, Zufallsregeln, 43 Kraftübungen |
| `js/11-data-stretches.js` | **Daten** | 20 Dehnübungen, 4 Dehnprogramme |
| `js/12-data-modes.js` | **Daten** | Trainingsstile (Kieser 90/120, Klassisch, Dehnen) |
| `js/20-logic-programs.js` | **Logik** | Standard-/Zufallsprogramme, Dehnauswahl, Blockliste |
| `js/30-timer.js` | **Timer** | zeitstempelbasierter Block-Timer |
| `js/40-animation.js` | **Animation** | SVG-Player (Strichfigur, Props) |
| `js/50-audio.js` | Audio | Signaltöne per WebAudio |
| `js/60-storage.js` | Persistenz | localStorage, JSON-Merge, GitHub-Sync |
| `js/70-ui.js` | **UI** | Bildschirme und Ereignisse |
| `js/90-selftest.js`, `99-main.js` | Test/Start | `training.html#selftest` |

## Entwickeln
```
python -I build/build.py            # src/ -> docs/training.html (+ docs/index.html)
python -I tests/run-selftest.py     # Selbsttest headless (Edge/Chrome), --shots für Screenshots
```
Katalog aller Animationen zur Kontrolle: `training.html#gallery`.

## Erweitern
- **Neue Übung:** eine Zeile in `EXERCISE_ROWS` (Pose a/b siehe `05-pose.js`), danach Katalog prüfen.
- **Neuer Trainingsstil:** Eintrag in `App.Data.MODES` (`buildBlocks` liefert zeitliche Blöcke).
- **Statistik/Historie/Favoriten/Gewichte:** Zustand liegt in `App.Store` (`sessions`, `favorites`, `weights` sind vorbereitet und werden mitsynchronisiert).

## Fortschritt & Sync
Sessions werden lokal gespeichert und als `progress/training.json` auf dem Branch `progress` dieses Repos
synchronisiert (Token pro Gerät über „🔑 GitHub-Sync“). Zusätzlich Export/Import als JSON-Datei (z. B. OneDrive).

## Hosting & Zugriffsschutz
Siehe [SETUP.md](SETUP.md) (Cloudflare Workers + Cloudflare Access).
