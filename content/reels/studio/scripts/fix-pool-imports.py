# Rewrites each pool ideas file's build import to exactly the helpers it uses.
import re, sys, pathlib
names = ["CALLS","CARD","CH","CHAIR","CK","CLAIM","COUNT","CTA","DEMO","FLAG","FLIP","GAP","GR","idea","NOTIF","OPEN","PL","QUOTES","RATE","RK","SG","ST","T","TIMER","TK","VS"]
for f in sys.argv[1:]:
    p = pathlib.Path(f); s = p.read_text()
    head, body = s.split("\n", 1)
    used = [n for n in names if re.search(r"(?<![\w])" + n + r"\b", body)]
    p.write_text('import { ' + ", ".join(used) + ' } from "./build";\n' + body)
