#!/usr/bin/env python3
"""Baut aus den modularen Quellen (src/) die Einzeldatei docs/training.html.

Aufruf:  python -I build/build.py
Die JS-Module werden in alphabetischer Reihenfolge (00-, 05-, 10- ...) eingebettet,
CSS und JS landen in src/template.html an den Markern /*{{CSS}}*/ und /*{{JS}}*/.
"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "src", ROOT / "docs"

INDEX_REDIRECT = ('<!DOCTYPE html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=training.html">'
                  '<title>Training</title><a href="training.html">Training öffnen</a>\n')


def read(p):
    return p.read_text(encoding="utf-8")


def main():
    css = read(SRC / "css" / "style.css")
    js_files = sorted((SRC / "js").glob("*.js"))
    js = "\n\n".join("/* ===== %s ===== */\n%s" % (f.name, read(f)) for f in js_files)
    html = read(SRC / "template.html")
    if "</script>" in js:
        raise SystemExit("JS enthält '</script>' – bitte als '<\\/script>' schreiben")
    html = html.replace("/*{{CSS}}*/", css).replace("/*{{JS}}*/", js)
    OUT.mkdir(exist_ok=True)
    (OUT / "training.html").write_text(html, encoding="utf-8")
    (OUT / "index.html").write_text(INDEX_REDIRECT, encoding="utf-8")
    print("OK: docs/training.html (%d KB, %d Module)" % (len(html.encode("utf-8")) // 1024, len(js_files)))


if __name__ == "__main__":
    main()
