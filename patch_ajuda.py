import os
import re

p = r'c:\Users\games\Documents\icre-web\src\features\support\components\HelpCenterClient.tsx'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

# Root div
c = re.sub(
    r'<div\s*className=\"min-h-screen\"\s*style={{[^}]+}}\s*>',
    r'<div className=\"min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 text-slate-900 dark:text-white\">',
    c
)

# Text colors (be careful with those hardcoded strings)
c = c.replace('text-white', 'text-slate-900 dark:text-white')
c = c.replace('text-slate-400', 'text-slate-500 dark:text-slate-400')
c = c.replace('text-slate-100', 'text-slate-900 dark:text-slate-100')
c = c.replace('text-slate-200', 'text-slate-900 dark:text-slate-200')
c = c.replace('text-slate-300', 'text-slate-900 dark:text-slate-300')
c = c.replace(\"'rgba(148,163,184,0.9)'\", \"'#64748b'\")
c = c.replace(\"'rgba(148,163,184,0.7)'\", \"'#64748b'\")

# Search input
c = re.sub(
    r'className=\"w-full h-14 pl-12 pr-4 rounded-2xl text-base text-slate-900 dark:text-slate-200 placeholder-slate-600 outline-none transition-all\"',
    r'className=\"w-full h-14 pl-12 pr-4 rounded-2xl text-base text-slate-900 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-600 outline-none transition-all bg-white/60 dark:bg-white/5 border border-blue-300/60 dark:border-white/10 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10\"',
    c
)
c = c.replace(
    r\"style={{\n                background: 'rgba(255,255,255,0.04)',\n                border: '1px solid rgba(255,255,255,0.1)',\n              }}\",
    \"\"
)


# Categories Grid 
c = c.replace(
    \"style={{ background: cat.bg, border: `1px solid ${cat.border}` }}\",
    \"className=\\\"flex flex-col items-center gap-3 p-5 rounded-2xl text-center transition-all duration-200 group bg-white/60 dark:bg-white/5 border border-blue-300/60 dark:border-white/10\\\"\"
)
c = c.replace(
    'className=\"flex flex-col items-center gap-3 p-5 rounded-2xl text-center transition-all duration-200 group\"',
    ''
)

# Accordion style logic
c = re.sub(
    r'style={{\s*background: isOpen \? \'rgba\(59,130,246,0\.06\)\' : \'rgba\(255,255,255,0\.02\)\',\s*border: `1px solid \${isOpen \? \'rgba\(59,130,246,0\.2\)\' : \'rgba\(255,255,255,0\.08\)\'}`,\s*}}',
    r'className={`rounded-2xl overflow-hidden transition-all duration-200 ${isOpen ? \"bg-blue-100/50 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/20\" : \"bg-white/40 dark:bg-white/5 border border-blue-300/60 dark:border-white/10\"}`}',
    c
)
c = c.replace(
    'className=\"rounded-2xl overflow-hidden transition-all duration-200\"',
    ''
)

# CTA block
c = re.sub(
    r'style={{\s*background: \'rgba\(37,99,235,0\.08\)\',\s*border: \'1px solid rgba\(37,99,235,0\.2\)\',\s*}}',
    r'className=\"mt-10 p-6 rounded-2xl text-center bg-blue-100/80 dark:bg-blue-500/10 border border-blue-300/80 dark:border-blue-500/20\"',
    c
)
c = c.replace(
    'className=\"mt-10 p-6 rounded-2xl text-center\"',
    ''
)

# No Results icon
c = re.sub(
    r'style={{\s*background: \'rgba\(255,255,255,0\.04\)\',\s*border: \'1px solid rgba\(255,255,255,0\.08\)\'\s*}}',
    r'className=\"inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-white/40 dark:bg-white/5 border border-blue-300/60 dark:border-white/10\"',
    c
)
c = c.replace(
    'className=\"inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4\"',
    ''
)

with open(p, 'w', encoding='utf-8') as f:
    f.write(c)

print('HelpCenterClient styles patched!')
