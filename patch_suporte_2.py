import os
import re

p = r'c:\Users\games\Documents\icre-web\src\features\support\components\SupportClient.tsx'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

# 135: backdrop background
c = c.replace(
    'className=\"absolute inset-0 bg-black/70 backdrop-blur-sm\"',
    'className=\"absolute inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm\"'
)

# 138: Modal root
c = c.replace(
    'style={{ background: \'#0d1526\', border: \'1px solid rgba(255,255,255,0.12)\', animation: \'modal-in 0.25s ease-out\' }}',
    'className=\"bg-blue-50 dark:bg-[#0d1526] border border-blue-300/60 dark:border-white/10\" style={{ animation: \'modal-in 0.25s ease-out\' }}'
)

# 141: Modal Header
c = c.replace(
    'style={{ borderBottom: \'1px solid rgba(255,255,255,0.07)\' }}',
    'className=\"border-b border-blue-300/60 dark:border-white/10\"'
)

# 143: Blue Icon background
c = c.replace(
    'style={{ background: \'rgba(37,99,235,0.15)\', border: \'1px solid rgba(37,99,235,0.3)\' }}',
    'className=\"bg-blue-500/15 border border-blue-500/30\"'
)

# 230: Attachment items
c = c.replace(
    'style={{ background: \'rgba(255,255,255,0.04)\', border: \'1px solid rgba(255,255,255,0.07)\' }}',
    'className=\"bg-blue-100/50 dark:bg-white/5 border border-blue-300/60 dark:border-white/10\"'
)

# 448: Chat header
c = c.replace(
    'style={{ background: \'rgba(13,21,38,1)\', border: \'1px solid rgba(255,255,255,0.08)\', borderBottom: \'none\' }}',
    'className=\"bg-blue-100 dark:bg-[#0d1526] border border-blue-300/60 dark:border-white/10 border-b-0\"'
)

# 473: Chat body
c = c.replace(
    'style={{ background: \'rgba(6,11,23,0.8)\', border: \'1px solid rgba(255,255,255,0.06)\', borderTop: \'none\', borderBottom: \'none\' }}',
    'className=\"bg-white/50 dark:bg-[#060b17]/80 border-x border-blue-300/60 dark:border-white/5\"'
)

# 500, 502: hr lines
c = c.replace(
    'style={{ background: \'rgba(255,255,255,0.06)\' }}',
    'className=\"bg-blue-300/60 dark:bg-white/10\"'
)

# 573: Chat Input / 580: Chat Footer
c = c.replace(
    'style={{ background: \'rgba(13,21,38,1)\', border: \'1px solid rgba(255,255,255,0.08)\', borderTop: \'none\' }}',
    'className=\"bg-blue-100 dark:bg-[#0d1526] border border-blue-300/60 dark:border-white/10 border-t-0\"'
)

# 585: Attachment pill
c = c.replace(
    'style={{ background: \'rgba(255,255,255,0.06)\', border: \'1px solid rgba(255,255,255,0.08)\' }}',
    'className=\"bg-white dark:bg-white/5 border border-blue-300/60 dark:border-white/10\"'
)

# 617: Type message input
c = c.replace(
    'style={{ background: \'rgba(255,255,255,0.06)\', border: \'1px solid rgba(255,255,255,0.1)\' }}',
    'className=\"bg-white dark:bg-white/5 border border-blue-300/60 dark:border-white/10\"'
)

# 694: Header label
c = c.replace(
    'style={{ background: \'rgba(37,99,235,0.15)\', color: \'#93c5fd\', border: \'1px solid rgba(37,99,235,0.25)\' }}',
    'className=\"bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/25\"'
)

with open(p, 'w', encoding='utf-8') as f:
    f.write(c)

print('Second pass patching completed!')
