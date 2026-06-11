const fs = require('fs');
const path = require('path');

const folders = [
  'C:/Users/Lee/Documents/icre-web/src/features/events/components',
  'C:/Users/Lee/Documents/icre-web/src/features/finance/components',
  'C:/Users/Lee/Documents/icre-web/src/features/members/components',
  'C:/Users/Lee/Documents/icre-web/src/features/cells/components',
  'C:/Users/Lee/Documents/icre-web/src/app/(admin)'
];

const replacements = [
  // backgrounds
  { regex: /bg-white(?!\/)/g, replacement: 'bg-white dark:bg-slate-800' },
  { regex: /bg-gray-50(?!\/)/g, replacement: 'bg-gray-50 dark:bg-slate-900/80' },
  { regex: /bg-gray-100(?!\/)/g, replacement: 'bg-gray-100 dark:bg-slate-700/50' },
  { regex: /bg-blue-50(?!\/)/g, replacement: 'bg-blue-50 dark:bg-blue-900/20' },
  { regex: /bg-blue-100(?!\/)/g, replacement: 'bg-blue-100 dark:bg-blue-900/40' },
  
  // borders
  { regex: /border-gray-200/g, replacement: 'border-gray-200 dark:border-slate-700' },
  { regex: /border-gray-300/g, replacement: 'border-gray-300 dark:border-slate-600' },
  { regex: /border-blue-100/g, replacement: 'border-blue-100 dark:border-blue-900/30' },
  
  // texts
  { regex: /text-gray-900/g, replacement: 'text-gray-900 dark:text-white' },
  { regex: /text-gray-800/g, replacement: 'text-gray-800 dark:text-slate-200' },
  { regex: /text-gray-700/g, replacement: 'text-gray-700 dark:text-slate-300' },
  { regex: /text-gray-600/g, replacement: 'text-gray-600 dark:text-slate-400' },
  { regex: /text-gray-500/g, replacement: 'text-gray-500 dark:text-slate-400' },
  { regex: /text-gray-400/g, replacement: 'text-gray-400 dark:text-slate-500' },
  { regex: /text-gray-300/g, replacement: 'text-gray-300 dark:text-slate-600' },
  { regex: /text-blue-600/g, replacement: 'text-blue-600 dark:text-blue-400' },
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
      
      replacements.forEach(rule => {
        // Only replace if it hasn't been replaced yet (e.g., if dark:bg-slate-800 is already there, don't replace bg-white again)
        // A simple way is to replace only if dark: isn't following it.
        // Easiest is to regex replace carefully.
        const r = new RegExp(rule.regex.source + '(?! dark:)', 'g');
        content = content.replace(r, rule.replacement);
      });
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${file}`);
      }
    }
  }
}

folders.forEach(processFolder);
console.log('Done');
