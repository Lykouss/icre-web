import os

p = r'c:\Users\games\Documents\icre-web\src\features\support\components\SupportClient.tsx'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

# Replace literal backslash followed by quote with just quote
c = c.replace('\\"', '"')

with open(p, 'w', encoding='utf-8') as f:
    f.write(c)

print('Syntax error fixed!')
