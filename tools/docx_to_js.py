"""Word (.docx) test faylini sayt formatiga o'giradi.
Format: har bir savol oldidan +++++, variantlar orasida =====, to'g'ri javob oldida #.
Foydalanish:  python tools/docx_to_js.py Fan_Test.docx fan_id
Natija: data/<fan_id>.js  (keyin data/subjects.js ga fanni qo'shing)
Talab: pip install python-docx
"""
import docx, json, re, sys, os
src, sid = sys.argv[1], sys.argv[2]
text = "\n".join(p.text for p in docx.Document(src).paragraphs)
qs, bad = [], []
for n, b in enumerate([b for b in re.split(r'^\s*\+{3,}\s*$', text, flags=re.M) if b.strip()], 1):
    parts = [p.strip() for p in re.split(r'^\s*={3,}\s*$', b, flags=re.M) if p.strip()]
    opts, ans = [], None
    for o in parts[1:]:
        if o.startswith('#'):
            ans, o = len(opts), o[1:].strip()
        opts.append(o)
    if ans is None:
        bad.append(n); ans = 0
    qs.append({"q": parts[0], "o": opts, "a": ans})
out = os.path.join(os.path.dirname(__file__), "..", "data", sid + ".js")
with open(out, "w", encoding="utf-8") as f:
    f.write("window.SUBJECT_DATA = window.SUBJECT_DATA || {};\n")
    f.write("window.SUBJECT_DATA[%s] = %s;\n" % (json.dumps(sid), json.dumps(qs, ensure_ascii=False, indent=1)))
print(len(qs), "ta savol ->", out)
if bad: print("DIQQAT: to'g'ri javob (#) belgilanmagan savollar:", bad, "(1-variant qo'yildi, tekshiring)")
