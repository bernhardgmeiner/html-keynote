# Bausteine

Alle Bausteine sind in `template/deck.html` live zu sehen. Diese Seite ist das Nachschlagewerk dazu.
Bühne: 1920 × 1080. Inhalt einer Szene steht in `.wrap` (links/rechts 120 px, oben 170, unten 84).

## Aufbau eines Decks

```
#hub            Startseite: Kopfzeile (.strip), Raster (.grid) mit Titelkachel + Kapitelkacheln, Übersichts-Notizen
section.chapter.prolog   optional, gehört zur Titelkachel (data-ch="0")
section.chapter × n      2 bis 8 Kapitel, jedes mit eigener Pastellfarbe (--c)
#finale         Schlussszenen nach dem vollen Raster
```

Ablauf beim Klicken: Startseite → Prolog → Übersicht → Kapitel 01 → Übersicht (Kachel 01 erledigt) → … → volle Übersicht → Finale.

### Kapitelfarben (der Reihe nach)

| | Farbe | Hex |
|---|---|---|
| Prolog | Hellgrau | `#F7F8FB` |
| 01 | Himmel | `#D9E8FF` |
| 02 | Pfirsich | `#FFD9CC` |
| 03 | Minze | `#CFEFDD` |
| 04 | Butter | `#FFEEAD` |
| 05 | Flieder | `#E3DCFF` |
| 06 | Rosé | `#FFD8E8` |
| 07 | Salbei | `#DDEBD3` |
| 08 | Sand | `#F1E4D3` |

Die Kachel und das Kapitel bekommen dieselbe Farbe: `style="--c:#D9E8FF"`.

### Raster

Die Engine ordnet die Kacheln je nach Kapitelzahl selbst an (2–8). Bei 7 und 8 Kapiteln sind die Kacheln der unteren Reihe schmal:
dort nur `.big` mit kurzem `.lab` oder ein `.stmt` mit höchstens drei kurzen Wörtern, kein `.stmt.wide`.

### Kachel

```html
<div class="tile" data-ch="1" style="--c:#D9E8FF"><div class="num">01</div><div class="nx">als Nächstes</div><div class="ttl">Kapiteltitel</div><div class="chk"></div>
  <div class="sum"><div class="big">67 %</div><div class="lab">Etikett in einer Zeile</div></div></div>
```

Kernaussage (`.sum`), erscheint wenn das Kapitel erledigt ist:
- `.big` + `.lab`: Zahl mit Etikett (`.big.red` für einen Verlust)
- `.stmt`: Satz in zwei Zeilen, `.stmt.wide` größer für breite Kacheln
- `.mini`: Stufen als kleines Diagramm (siehe Musterdeck)

Titelkachel: `<div class="tile t-title" data-ch="0">` mit Prolog, ohne Prolog `<div class="tile t-title">`. Inhalt: `h1`, `.sub`, `.bar`. Kein Symbol, kein Etikett.

### Kapitel

```html
<section class="chapter" data-title="Kapiteltitel" style="--c:#D9E8FF">
  <div class="strip"><span class="sec"><b>01</b>Kapiteltitel</span><span class="pbar"></span></div>
  <div class="scene c-name" data-label="Kurzname für Notizen">
    <div class="wrap"> … </div>
    <aside class="note" data-f="0" data-t="3:15">Sprechnotiz</aside>
  </div>
</section>
```

## Klick-Logik

| Attribut | Wirkung |
|---|---|
| `class="f" data-f="2"` | Element erscheint mit dem 2. Klick in der Szene |
| `data-hl="2"` (in `.scene.spot`) | Element ist beim 2. Klick hervorgehoben, die anderen grau |
| `data-at="6"` | Element bekommt ab Klick 6 die Klasse `.at` (z. B. Stufe wird rot) |
| `data-count="39.4" data-dec="1"` | Zahl zählt beim Erscheinen hoch |
| `data-steps="3"` an der Szene | Szene hat mindestens 3 Klicks (für Live-Demos) |
| `data-skip` an der Szene | Sollbruchstelle: fällt in der Kurzfassung (Taste K) weg |
| `data-fb="0,2"` an der Szene | Diese Zwischenstände kommen zusätzlich in die Notfall-PowerPoint |
| `aside.note data-f="n" data-t="m:ss"` | Notiz ab Klick n, Soll-Zeit für den Timer im Notizenfenster |
| `aside.note data-done="k"` (im `#hub`) | Notiz für die Übersicht nach k erledigten Teilen (0 = Startseite) |

## Typo

`.d1` 180 · `.d2` 132 · `.h1` 92 · `.h2` 70 · `.lead` 56 · `.txt` 42 · `.kick` 30 (Quelle/Überschrift klein)
Zahlen: `.numxl` 300 · `.numl` 220 · `.numm` 120. Akzent: `.red`, Grau: `.grey`, `.redbar`.
Mindestgröße für Text auf der Bühne: 28 px.

Zitate mit hängendem Anführungszeichen, damit alle Zeilen bündig stehen:
```html
<div class="h2 hang"><span class="hq">„</span>Text des Zitats.“</div>
```
Wörter mit Bindestrich, die nicht getrennt werden dürfen: `<span class="nw">KI-Modelle</span>`.
Unterstreichen: `<span class="ul">Wort</span>` (in einem `.f`) oder `<span class="ul now">Wort</span>` (sofort).

## Szenen-Bausteine

| Baustein | Wofür | Kern-Markup |
|---|---|---|
| `.wrap.center` + `.d1` | Statement, Leitfrage | `<div class="wrap center"><div class="d1">Satz<span class="red">?</span></div></div>` |
| `.stat` | Großzahl mit Satz | `<div class="stat"><div class="numxl">…</div><div class="lead">…</div></div>` |
| `.statrow` | Zahlenreihe unten, `.gr` = abgesetzte Spalte | `<div class="statrow f" data-f="1"><div><span class="numm">77 %</span><span class="txt">…</span></div>…</div>` |
| `.res` + `.side` | Ergebnis unten links, Zusatz rechts mit roter Linie | `.res` enthält `.numxl` + `.lead` (Lead umbrechen, damit es nicht an `.side` stößt) |
| `.vs` | zwei Zahlen im Vergleich | zwei `div` mit `.numl` + `.lab`, zweite mit `.r` |
| `.hlist` | Spotlight-Liste | `<ol class="hlist"><li data-hl="1"><span class="mk"></span>…</li>` in `.scene.spot` |
| `.list` | einfache Liste | `<ul class="list"><li class="f" data-f="1">…` |
| `.rows` / `.rw` | nummerierte Zeilen | `<div class="rw"><b>01</b><div><strong>…</strong><span>…</span></div></div>` |
| `.cards` | Begriffe nebeneinander, `.r` rot | `<div class="cards" style="--n:4"><div><b>01</b><p>…</p></div>` |
| `.cols` / `.col` | Spalten mit rotem Etikett (`.when`), `.verdict` darunter | `<div class="cols" style="--n:3"><div class="col"><div class="when">…</div><h3>…</h3><p>…</p></div>` |
| `.stairs` | Stufenmodell | `<div class="s" style="height:68%"><div class="k">3</div><div class="n">…</div><div class="d">…</div></div>` |
| `.shots` | Screenshots hochkant mit Bildunterschrift | `<figure><img src="{{asset:media/x.png}}"><figcaption><b>…</b> · …</figcaption></figure>` |
| `.sites` | Webseiten mit Adressleiste | `<figure><div class="url">…</div><img …><figcaption>…</figcaption></figure>` |
| `.chart` | selbst gezeichnete Kurve | SVG mit `path.draw` (`.mute` grau, `.r` rot), Beschriftung `.lbl/.lblb/.lblr` |
| `.box` | schwarzer Kasten | `<div class="box">…</div>` |
| `.warn` | Warnhinweis rechts oben | `<div class="warn">…</div>` |
| `.tag` | rotes Etikett mit Rahmen | `<span class="tag">…</span>` |
| Video | Videoszene, startet von selbst | `<div class="scene dark"><video muted playsinline preload="auto" data-src="{{asset:media/x.mp4}}"></video>` |
| Live-Demo | eigene Web-App, offline eingebettet | `<div class="demo-frame"><iframe class="demo" data-b64="{{b64:ext/app.html}}"></iframe></div>` + `window.deckHooks.demo` |

Finale: `.fin-statement` (Schlusssatz), `.fin-quote` (Schlusszitat mit `.q.hang`, `.who`), `.fin-name` (Name + `{{qr:URL}}`).

## Platzhalter (tools/build.py)

| Platzhalter | wird zu |
|---|---|
| `{{ENGINE_CSS}}`, `{{ENGINE_JS}}` | Engine samt Schrift |
| `{{asset:media/x.jpg}}` | data:-URI (Bilder, Videos) |
| `{{b64:ext/app.html}}` | reines Base64 (Live-Demo) |
| `{{qr:https://…}}` | QR-Code als SVG in Tintenfarbe |

## Hooks (optional, im Deck vor der Engine)

```html
<script>
window.deckHooks={
  demoLabels:['Ausgangszustand','Zustand A'],     // Beschriftung oben rechts in der Demo-Szene
  demo(doc,f){ /* doc = Dokument im iframe, f = Klick in der Szene: Zustand herstellen (zuerst zurücksetzen!) */ },
  fragment(sceneEl,f,{instant}){ /* Extras bei jedem Klick */ }
};
</script>
```

Damit der Klicker in einer Live-Demo funktioniert, muss die Demo per Klick in Zustände gebracht werden können (Buttons mit IDs). Externe Schriften und Skripte in der Demo-App entfernen, sonst läuft sie offline nicht.

## Eigenes CSS

Nur in `<style id="deck">` im Deck, nur Abstände und Positionen einzelner Szenen (`.c-name …`). Keine neuen Farben, Schriften, Schatten oder Rundungen.
