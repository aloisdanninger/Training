#!/usr/bin/env python3
"""Führt den eingebauten Selbsttest headless in Edge/Chrome aus.

Aufruf:  python -I tests/run-selftest.py
Optional: --shots  erzeugt zusätzlich Screenshots (tests/out/*.png) von Start und Katalog.
"""
import pathlib
import re
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = (ROOT / "docs" / "training.html").as_uri()
BROWSERS = [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Google\Chrome\Application\chrome.exe"]


def browser():
    for b in BROWSERS:
        if pathlib.Path(b).exists():
            return b
    raise SystemExit("Kein Edge/Chrome gefunden")


def run(args):
    prof = tempfile.mkdtemp(prefix="trainprof_")
    return subprocess.run([browser(), "--headless=new", "--disable-gpu", "--user-data-dir=" + prof] + args,
                          capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=90)


def main():
    r = run(["--virtual-time-budget=3000", "--dump-dom", PAGE + "#selftest"])
    dom = r.stdout
    m = re.search(r'<pre id="selftest"[^>]*>(.*?)</pre>', dom, re.S)
    print(m.group(1) if m else "Kein Testergebnis im DOM")
    t = re.search(r"<title>(.*?)</title>", dom)
    print(t.group(1) if t else "?")
    if "--shots" in sys.argv:
        out = ROOT / "tests" / "out"
        out.mkdir(exist_ok=True)
        for name, hash_, size in [("home", "", "700,1300"), ("gallery", "#gallery", "1100,2600")]:
            run(["--window-size=" + size, "--virtual-time-budget=3000", "--screenshot=" + str(out / (name + ".png")), PAGE + hash_])
        print("Screenshots in", out)
    sys.exit(0 if t and "PASS" in t.group(1) else 1)


if __name__ == "__main__":
    main()
