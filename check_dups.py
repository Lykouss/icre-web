import re

p = r'c:\Users\games\Documents\icre-web\src\features\support\components\SupportClient.tsx'
with open(p, 'r', encoding='utf-8') as f:
    c = f.read()

# Look for consecutive className attributes, even across newlines
matches = re.findall(r'className=\"[^\"]*\"\s*className=\"[^\"]*\"', c, re.MULTILINE)
for match in matches:
    print('DUPLICATE FOUND:', match)
if not matches:
    print('No duplicate classNames found.')
