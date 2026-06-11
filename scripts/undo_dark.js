const fs = require('fs');
const path = require('path');

const folders = [
  'C:/Users/Lee/Documents/icre-web/src/features/portal/components',
  'C:/Users/Lee/Documents/icre-web/src/app/(public)/login',
  'C:/Users/Lee/Documents/icre-web/src/app/(public)/cadastro',
  'C:/Users/Lee/Documents/icre-web/src/features/events/components',
  'C:/Users/Lee/Documents/icre-web/src/features/finance/components',
  'C:/Users/Lee/Documents/icre-web/src/features/members/components',
  'C:/Users/Lee/Documents/icre-web/src/features/cells/components',
  'C:/Users/Lee/Documents/icre-web/src/app/(admin)'
];

const injectedStrings = [
  ' dark:bg-slate-800',
  ' dark:bg-slate-900/80',
  ' dark:bg-slate-700/50',
  ' dark:bg-blue-900/20',
  ' dark:bg-blue-900/40',
  ' dark:border-slate-700',
  ' dark:border-slate-600',
  ' dark:border-blue-900/30',
  ' dark:text-white',
  ' dark:text-slate-200',
  ' dark:text-slate-300',
  ' dark:text-slate-400', // matches two rules
  ' dark:text-slate-500',
  ' dark:text-slate-600',
  ' dark:text-blue-400'
];

function processFolder(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processFolder(fullPath);
    } else if (file.endsWith('.tsx') && !['HeroSection.tsx', 'AboutSection.tsx', 'MissionSection.tsx', 'PastorsSection.tsx', 'PublicNavbar.tsx'].includes(file)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      injectedStrings.forEach(str => {
        // Escape string for regex
        const escaped = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const r = new RegExp(escaped, 'g');
        content = content.replace(r, '');
      });
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Reverted ${file}`);
      }
    }
  }
}

folders.forEach(processFolder);
console.log('Done reverting');
