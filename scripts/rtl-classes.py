# One-off: physical Tailwind classes -> logical ones, so Arabic (dir="rtl")
# mirrors the layout. Centering (left-1/2 with -translate-x-1/2) is left alone.
import re, sys, pathlib
B = r'(?<=[\s"\'`{(:])'
rules = [
    (B + r'(-?)ml-(?=[\w\[.])', r'\1ms-'),
    (B + r'(-?)mr-(?=[\w\[.])', r'\1me-'),
    (B + r'pl-(?=[\w\[.])', 'ps-'),
    (B + r'pr-(?=[\w\[.])', 'pe-'),
    (B + r'(-?)left-(?!1/2)(?=[\w\[.])', r'\1start-'),
    (B + r'(-?)right-(?!1/2)(?=[\w\[.])', r'\1end-'),
    (B + r'text-left(?![\w-])', 'text-start'),
    (B + r'text-right(?![\w-])', 'text-end'),
    (B + r'rounded-tl(?=[-\s"\'`])', 'rounded-ss'),
    (B + r'rounded-tr(?=[-\s"\'`])', 'rounded-se'),
    (B + r'rounded-bl(?=[-\s"\'`])', 'rounded-es'),
    (B + r'rounded-br(?=[-\s"\'`])', 'rounded-ee'),
    (B + r'rounded-l(?=[-\s"\'`])', 'rounded-s'),
    (B + r'rounded-r(?=[-\s"\'`])', 'rounded-e'),
    (B + r'border-l(?=[-\s"\'`])', 'border-s'),
    (B + r'border-r(?=[-\s"\'`])', 'border-e'),
]
total = 0
for path in sys.argv[1:]:
    p = pathlib.Path(path)
    s = p.read_text()
    out = s
    for pat, rep in rules:
        out, n = re.subn(pat, rep, out)
        total += n
    if out != s:
        p.write_text(out)
print(total)
