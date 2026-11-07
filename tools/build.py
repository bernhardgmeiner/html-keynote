#!/usr/bin/env python3
"""Baut aus einem Deck eine einzige, offline lauffähige HTML-Datei.

  python3 tools/build.py talks/<name>/deck.html [-o dist/<Datei>.html]

Platzhalter im Deck:
  {{ENGINE_CSS}}        Engine-Stylesheet (inkl. eingebetteter Barlow)
  {{ENGINE_JS}}         Engine-Skript
  {{asset:pfad}}        Datei als data:-URI (Bild, Video, …), Pfad relativ zum Deck
  {{b64:pfad}}          Datei als reines Base64 (z. B. für iframe.demo data-b64)
  {{qr:https://…}}      QR-Code als SVG (Tinte #15171E), braucht segno

Das Deck selbst wird mit eingebettet, damit tools/unpack.py es später aus der fertigen
HTML-Datei zurückholen kann (inklusive aller Medien).
"""
import base64, json, mimetypes, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOKEN = re.compile(r"\{\{(ENGINE_CSS|ENGINE_JS|asset:[^}]+|b64:[^}]+|qr:[^}]+)\}\}")
MIME = {'.mp4': 'video/mp4', '.webm': 'video/webm', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.svg': 'image/svg+xml', '.gif': 'image/gif', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.html': 'text/html'}


def b64(path):
    with open(path, 'rb') as fh:
        return base64.b64encode(fh.read()).decode()


def engine_css():
    css = open(os.path.join(ROOT, 'engine/engine.css'), encoding='utf-8').read()
    for w in (400, 500, 600, 700):
        css = css.replace('{{FONT%d}}' % w, b64(os.path.join(ROOT, f'fonts/barlow-latin-{w}-normal.woff2')))
    return css


def qr_svg(url):
    try:
        import segno
    except ImportError:
        sys.exit('segno fehlt: pip install segno --break-system-packages')
    import io
    buf = io.BytesIO()
    segno.make(url, error='m').save(buf, kind='svg', scale=10, border=0, dark='#15171E', xmldecl=False, svgns=True)
    svg = buf.getvalue().decode('utf-8')
    m = re.search(r'width="(\d+)" height="(\d+)"', svg)
    if m:
        svg = svg.replace(m.group(0), f'viewBox="0 0 {m.group(1)} {m.group(2)}" width="100%" height="100%"', 1)
    return svg


def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    deck = os.path.abspath(args[0])
    out = None
    if '-o' in args:
        out = os.path.abspath(args[args.index('-o') + 1])
    base = os.path.dirname(deck)
    src = open(deck, encoding='utf-8').read()
    if out is None:
        name = os.path.basename(base) or 'keynote'
        out = os.path.join(ROOT, 'dist', name + '.html')
    cache = {}

    def repl(m):
        t = m.group(1)
        if t in cache:
            return cache[t]
        if t == 'ENGINE_CSS':
            v = engine_css()
        elif t == 'ENGINE_JS':
            v = open(os.path.join(ROOT, 'engine/engine.js'), encoding='utf-8').read()
        elif t.startswith('asset:'):
            p = os.path.join(base, t[6:].strip())
            if not os.path.exists(p):
                sys.exit(f'Datei fehlt: {p}')
            ext = os.path.splitext(p)[1].lower()
            v = 'data:%s;base64,%s' % (MIME.get(ext) or mimetypes.guess_type(p)[0] or 'application/octet-stream', b64(p))
        elif t.startswith('b64:'):
            p = os.path.join(base, t[4:].strip())
            if not os.path.exists(p):
                sys.exit(f'Datei fehlt: {p}')
            v = b64(p)
        else:
            v = qr_svg(t[3:].strip())
        cache[t] = v
        return v

    html = TOKEN.sub(repl, src)
    left = re.findall(r'\{\{[^}]{1,80}\}\}', html.split('<script type="text/plain" id="deck-source">')[0])
    left = [x for x in left if not x.startswith('{{FONT')]
    if left:
        print('Warnung: unbekannte Platzhalter', sorted(set(left)))
    payload = base64.b64encode(json.dumps({'deck': src}, ensure_ascii=False).encode()).decode()
    head, sep, tail = html.rpartition('</body>')
    html = head + f'<script type="text/plain" id="deck-source">{payload}</script>\n' + sep + tail
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w', encoding='utf-8').write(html)
    print(out, round(os.path.getsize(out) / 1e6, 2), 'MB')


if __name__ == '__main__':
    main()
