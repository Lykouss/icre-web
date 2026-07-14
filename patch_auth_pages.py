import os
import re

files = [
    r'c:\Users\games\Documents\icre-web\src\app\auth\reset-password\page.tsx',
    r'c:\Users\games\Documents\icre-web\src\app\(public)\login\page.tsx',
    r'c:\Users\games\Documents\icre-web\src\app\(public)\cadastro\page.tsx',
    r'c:\Users\games\Documents\icre-web\src\app\(public)\criar-pin\page.tsx',
    r'c:\Users\games\Documents\icre-web\src\app\(public)\minhas-inscricoes\page.tsx'
]

replacements = {
    # Backgrounds
    r'className="min-h-screen bg-slate-950\b': 'className="min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 text-slate-900 dark:text-white',
    r'className="min-h-screen flex items-center justify-center bg-slate-950': 'className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 text-slate-900 dark:text-white',
    r'bg-\[radial-gradient\(ellipse_at_top,_var\(--tw-gradient-stops\)\)\] from-blue-50/40 via-white to-slate-100 dark:bg-none dark:bg-slate-950': 'bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950',
    
    # Cards
    r'bg-slate-900/60 backdrop-blur-xl border border-white/8': 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-white/8',
    r'bg-\[\#060b17\]': 'bg-white dark:bg-[#060b17]',
    r'bg-\[\#0d1526\]': 'bg-blue-50 dark:bg-[#0d1526]',
    r'bg-slate-800/40': 'bg-white/80 dark:bg-slate-800/40',
    
    # Inputs
    r'bg-slate-800 border border-slate-700': 'bg-white dark:bg-slate-800/50 border border-blue-200/60 dark:border-slate-700/50',
    
    # Text
    r'\btext-white\b(?! transition| rounded| pointer|/|\})': 'text-slate-900 dark:text-white',
    r'\btext-slate-100\b': 'text-slate-900 dark:text-slate-100',
    r'\btext-slate-400\b(?!/)': 'text-slate-500 dark:text-slate-400',
    r'\btext-slate-300\b(?!/)': 'text-slate-600 dark:text-slate-300',
    
    # Borders
    r'border-white/10': 'border-blue-300/60 dark:border-white/10',
    r'border-white/5': 'border-blue-200/50 dark:border-white/5',
    r'border-slate-800': 'border-slate-200 dark:border-slate-800',
    r'border-slate-700': 'border-blue-300/60 dark:border-slate-700',
    
    # Form input focus
    r'focus:border-transparent': 'dark:focus:border-transparent focus:border-blue-400',
    
    # Fix specific occurrences that might have been mangled by 'text-white' replacement
    r'text-slate-900 dark:text-slate-900 dark:text-white': 'text-slate-900 dark:text-white',
}

for p in files:
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as f:
            c = f.read()
        
        original_c = c
        
        # We need to be careful with text-white replacement so it doesn't mess up explicit text-white
        # like buttons.
        # But wait, button classNames usually have "text-white transition-all". The negative lookahead
        # in text-white regex should handle some. We'll do simple string replaces instead of complex regexes
        # where possible to avoid breaking logic.
        
        # Apply strict replacements first
        for target, replacement in replacements.items():
            c = re.sub(target, replacement, c)
            
        # Fix button text that might have been altered
        c = c.replace('text-slate-900 dark:text-white hover:text-white', 'text-white hover:text-white')
        c = c.replace('bg-blue-600 text-slate-900 dark:text-white', 'bg-blue-600 text-white')
        c = c.replace('bg-blue-500 text-slate-900 dark:text-white', 'bg-blue-500 text-white')
        c = c.replace('text-slate-900 dark:text-slate-900 dark:text-white', 'text-slate-900 dark:text-white')
        
        if c != original_c:
            with open(p, 'w', encoding='utf-8') as f:
                f.write(c)
            print(f'Patched {os.path.basename(p)}')
        else:
            print(f'No changes for {os.path.basename(p)}')
    else:
        print(f'Missing {p}')
