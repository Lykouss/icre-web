import os
import re

p = r'c:\Users\games\Documents\icre-web\src\features\support\components\SupportClient.tsx'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

# Replace root background
c = re.sub(
    r'<div\s*className=\"min-h-screen\"\s*style={{\s*background: \'radial-gradient\(ellipse 80% 50% at 50% 0%, rgba\(37,99,235,0\.08\) 0%, transparent 60%\), #060b17\',\s*}}\s*>',
    r'<div className=\"min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 text-slate-900 dark:text-white\">',
    c
)

# Text Colors
c = c.replace('text-white', 'text-slate-900 dark:text-white')
c = c.replace('text-slate-400', 'text-slate-500 dark:text-slate-400')
c = c.replace('text-slate-300', 'text-slate-700 dark:text-slate-300')
c = c.replace('text-slate-200', 'text-slate-800 dark:text-slate-200')
c = c.replace('text-slate-500 hover:text-slate-300', 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')

# Text overrides fix
c = c.replace('text-slate-900 dark:text-slate-900 dark:text-white', 'text-slate-900 dark:text-white')
c = c.replace('text-slate-900 dark:text-slate-900', 'text-slate-900 dark:text-white')

# Backgrounds
c = c.replace('bg-slate-900', 'bg-blue-100 dark:bg-slate-900')
c = c.replace('bg-slate-800', 'bg-blue-50 dark:bg-slate-800')
c = c.replace('bg-black/20', 'bg-white/40 dark:bg-black/20')
c = c.replace('bg-black/40', 'bg-white/60 dark:bg-black/40')
c = c.replace('bg-black/50', 'bg-white/60 dark:bg-black/50')
c = c.replace('bg-[#0f172a]', 'bg-white/60 dark:bg-[#0f172a]')
c = c.replace('bg-slate-950', 'bg-blue-100/50 dark:bg-slate-950')
c = c.replace('bg-white/8', 'bg-black/5 dark:bg-white/8')
c = c.replace('bg-white/5', 'bg-black/5 dark:bg-white/5')

# Borders
c = c.replace('border-white/10', 'border-blue-300/60 dark:border-white/10')
c = c.replace('border-slate-800', 'border-blue-300/60 dark:border-slate-800')

# Specific fixes for text inputs that had text-slate-900 dark:text-white added twice
c = c.replace('text-slate-900 dark:text-slate-900 dark:text-white', 'text-slate-900 dark:text-white')

with open(p, 'w', encoding='utf-8') as f:
    f.write(c)

print('Patched SupportClient styles!')
