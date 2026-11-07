#!/usr/bin/env python3
"""Holt aus einer fertigen Keynote-HTML das Deck und alle Medien zurück.

  python3 tools/unpack.py <fertige>.html talks/<name>/

Legt deck.html und alle {{asset:…}}/{{b64:…}}-Dateien wieder an ihren Pfaden ab.
So reicht es, die fertige HTML-Datei aufzuheben: Änderungen später sind trotzdem möglich.
"""
import base64, json, os, re, sys

TOKEN = re.compile(r"\{\{(ENGINE_CSS|ENGINE_JS|asset:[^}]+|b64:[^}]+|qr:[^}]+)\}\}")


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    html = open(sys.argv[1], encoding='utf-8').read()
    outdir = sys.argv[2]
    m = re.search(r'<script type="text/plain" id="deck-source">([A-Za-z0-9+/=]+)</script>', html)
    if not m:
        sys.exit('Keine eingebettete Deck-Quelle gefunden (Datei mit einer älteren Version gebaut?).')
    src = json.loads(base64.b64decode(m.group(1)).decode())['deck']
    body = html[:m.start()] + html[m.end():].lstrip('\n')
    os.makedirs(outdir, exist_ok=True)
    open(os.path.join(outdir, 'deck.html'), 'w', encoding='utf-8').write(src)
    # Literale zwischen den Platzhaltern der Reihe nach im fertigen HTML suchen,
    # dazwischen steht jeweils der eingesetzte Inhalt.
    parts = TOKEN.split(src)  # [lit, tok, lit, tok, …, lit]
    pos = 0
    first = parts[0]
    assert body.startswith(first), 'Anfang passt nicht'
    pos = len(first)
    done = set()
    for k in range(1, len(parts), 2):
        tok, lit = parts[k], parts[k + 1]
        end = body.find(lit, pos) if lit else len(body)
        if end < 0:
            sys.exit(f'Konnte {tok} nicht zuordnen')
        val = body[pos:end]
        pos = end + len(lit)
        if tok in done:
            continue
        done.add(tok)
        if tok.startswith('asset:') or tok.startswith('b64:'):
            rel = tok.split(':', 1)[1].strip()
            data = val.split(',', 1)[1] if tok.startswith('asset:') else val
            p = os.path.join(outdir, rel)
            os.makedirs(os.path.dirname(p) or '.', exist_ok=True)
            open(p, 'wb').write(base64.b64decode(data))
            print('  ', rel, round(os.path.getsize(p) / 1e3), 'KB')
    print('Deck zurückgeholt nach', os.path.join(outdir, 'deck.html'))


if __name__ == '__main__':
    main()
