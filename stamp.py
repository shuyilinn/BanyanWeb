"""Gives every script, style sheet and data file a version in the pages' links (?v=<first 8 hex of its md5>), so a
browser that cached an older copy fetches the new one as soon as the file changes. Run before committing:

    python3 stamp.py
"""
import hashlib, os, re

HERE = os.path.dirname(os.path.abspath(__file__))


def ver(path):
    p = os.path.join(HERE, path)
    return hashlib.md5(open(p, "rb").read()).hexdigest()[:8] if os.path.exists(p) else None


for page in sorted(f for f in os.listdir(HERE) if f.endswith(".html")):
    p = os.path.join(HERE, page)
    s = open(p).read()

    def sub(m):
        v = ver(m.group(2))
        return f"{m.group(1)}{m.group(2)}?v={v}{m.group(3)}" if v else m.group(0)
    t = re.sub(r'((?:src|href)=")((?:data/)?[\w.-]+\.(?:js|css))(?:\?v=[0-9a-f]+)?(")', sub, s)
    if t != s:
        open(p, "w").write(t)
        print("stamped", page)
