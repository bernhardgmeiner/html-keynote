# html-keynote

Vorlage für Keynotes als einzelne HTML-Datei im Stil „Swiss Editorial mit Pastell-Kapiteln“:
Startseite als Raster, ein Kapitel pro Kachel, Zoom ins Kapitel, Haken und Kernaussage nach jedem Kapitel.
Die fertige Datei läuft offline, Schrift, Bilder, Videos und Live-Demos stecken in der Datei.

Gebaut wird mit Claude über den Skill `gmeiner-html-keynote`.

## Ordner

| Ordner | Inhalt |
|---|---|
| `engine/` | Layout, Animationen, Tastensteuerung, Notizenfenster. Wird pro Vortrag nicht verändert. |
| `fonts/` | Barlow (SIL Open Font License, siehe `fonts/OFL.txt`) |
| `template/` | Musterdeck mit allen Bausteinen, Ausgangspunkt für jeden neuen Vortrag |
| `tools/` | Bauen, Prüfen, Notfall-PowerPoint, Deck aus fertiger Datei zurückholen |
| `docs/` | Bausteine (Nachschlagewerk) und Checkliste für den Probelauf |

## Befehle

```bash
cp -r template talks/<name>                                    # neuen Vortrag anlegen
python3 tools/build.py talks/<name>/deck.html -o dist/<Datei>.html
NODE_PATH=$(npm root -g) node tools/render.js dist/<Datei>.html shots   # jeden Schritt prüfen
python3 tools/sheet.py shots bogen.png                          # Kontaktbogen
NODE_PATH=$(npm root -g) node tools/fallback.js dist/<Datei>.html fb
python3 tools/mkpptx.py fb dist/Notfallversion_<Datei>.pptx
python3 tools/unpack.py <fertige>.html talks/<name>             # Deck + Medien aus fertiger Datei zurückholen
```

Voraussetzungen: Python 3 mit `pillow`, `python-pptx`, `segno`; Node mit `playwright`; optional `ffmpeg`.

Vorträge (`talks/`) und fertige Dateien (`dist/`) werden nicht ins Repository geladen.
