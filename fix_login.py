import os
import re

files = [
    r'c:\Users\games\Documents\icre-web\src\app\(public)\login\page.tsx',
    r'c:\Users\games\Documents\icre-web\src\app\(public)\cadastro\page.tsx',
    r'c:\Users\games\Documents\icre-web\src\app\auth\reset-password\page.tsx',
    r'c:\Users\games\Documents\icre-web\src\app\(public)\criar-pin\page.tsx',
]

for p in files:
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as f:
            c = f.read()

        c = c.replace('className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4"', 'className="min-h-screen bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 flex items-center justify-center p-4 text-slate-900 dark:text-white"')

        if 'dark:bg-[radial-gradient' not in c:
            c = c.replace(
                'bg-[radial-gradient(ellipse_at_top,_#1e3a5f_0%,_transparent_60%)]',
                'bg-[radial-gradient(ellipse_at_top,_#e0f2fe_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_#1e3a5f_0%,_transparent_60%)]'
            )
            c = c.replace(
                'bg-blue-600/6',
                'bg-blue-500/20 dark:bg-blue-600/6'
            )

        c = c.replace('bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-200 dark:border-slate-800', 'bg-white/60 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 backdrop-blur-xl')
        
        c = c.replace('bg-white/80 backdrop-blur-md dark:backdrop-blur-none border border-slate-200/50 dark:border-transparent dark:bg-white/80 dark:bg-slate-800/40 dark:border-blue-300/60 dark:border-slate-700/50', 'bg-white/80 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50')
        
        c = c.replace('bg-white shadow-2xl shadow-slate-300/80 border border-slate-200 dark:border-transparent dark:shadow-none dark:bg-slate-800 dark:border-blue-300/60 dark:border-slate-700', 'bg-white dark:bg-slate-800 shadow-2xl shadow-slate-300/80 dark:shadow-none border border-slate-200 dark:border-slate-700')
        c = c.replace('text-slate-600 dark:text-slate-600 dark:text-slate-300', 'text-slate-600 dark:text-slate-300')
        
        c = c.replace('bg-white shadow-2xl shadow-slate-300/80 border border-slate-200 dark:border-transparent dark:shadow-none dark:bg-slate-800 border-l border-t dark:border-blue-300/60 dark:border-slate-700', 'bg-white dark:bg-slate-800 shadow-2xl shadow-slate-300/80 dark:shadow-none border border-slate-200 dark:border-slate-700 border-r-0 border-b-0')

        c = c.replace('bg-white dark:bg-slate-800/50 border border-blue-200/60 dark:border-blue-300/60 dark:border-slate-700/50', 'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50')
        c = c.replace('focus:ring-blue-500 dark:focus:border-transparent focus:border-blue-400', 'focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500')
        
        c = c.replace('text-slate-500 dark:text-slate-500 dark:text-slate-400', 'text-slate-500 dark:text-slate-400')
        
        with open(p, 'w', encoding='utf-8') as f:
            f.write(c)
        print('Fixed:', p)
