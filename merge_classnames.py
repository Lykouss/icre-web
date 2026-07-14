import os
import re

p = r'c:\Users\games\Documents\icre-web\src\features\support\components\SupportClient.tsx'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

# Merge adjacent className attributes on the same line or separated by whitespace
while True:
    new_c = re.sub(r'className="([^"]+)"\s+className="([^"]+)"', r'className="\1 \2"', c)
    if new_c == c:
        break
    c = new_c

# Also fix the NoTicketState warning and button colors that were left behind:
# 644: style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)' }}
c = c.replace(
    "style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)' }}",
    'className="bg-blue-100/50 dark:bg-blue-500/10 border border-blue-300/60 dark:border-blue-500/20"'
)
# 656: style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
c = c.replace(
    "style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}",
    'className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20"'
)

# Fix open ticket button text (text-white vs text-slate-900 dark:text-white)
c = c.replace(
    'className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"',
    'className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-slate-900 dark:text-white transition-all hover:scale-105"'
)

with open(p, 'w', encoding='utf-8') as f:
    f.write(c)

print('Merged duplicate classNames and applied missing styles!')
