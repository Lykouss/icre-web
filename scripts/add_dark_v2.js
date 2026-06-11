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

const classMap = {
  // backgrounds
  'bg-white': 'bg-slate-800',
  'bg-gray-50': 'bg-slate-900/80',
  'bg-gray-100': 'bg-slate-800',
  'bg-blue-50': 'bg-blue-900/20',
  'bg-blue-100': 'bg-blue-900/40',
  'bg-emerald-50': 'bg-emerald-900/20',
  'bg-red-50': 'bg-red-900/20',
  'bg-pink-50': 'bg-pink-900/20',
  
  // borders
  'border-gray-200': 'border-slate-700',
  'border-gray-300': 'border-slate-600',
  'border-blue-100': 'border-blue-900/30',
  'border-blue-200': 'border-blue-900/40',
  'border-emerald-100': 'border-emerald-900/30',
  'border-emerald-200': 'border-emerald-900/40',
  'border-red-200': 'border-red-900/30',
  
  // texts
  'text-gray-900': 'text-white',
  'text-gray-800': 'text-slate-200',
  'text-gray-700': 'text-slate-300',
  'text-gray-600': 'text-slate-400',
  'text-gray-500': 'text-slate-400',
  'text-gray-400': 'text-slate-500',
  'text-gray-300': 'text-slate-600',
  'text-blue-600': 'text-blue-400',
  'text-blue-700': 'text-blue-300',
  'text-emerald-600': 'text-emerald-400',
  'text-emerald-700': 'text-emerald-300',
  'text-red-600': 'text-red-400',
  'text-red-700': 'text-red-300',
  'text-pink-600': 'text-pink-400',
};

// Files we manually updated and shouldn't touch
const excludeFiles = [
  'HeroSection.tsx', 
  'AboutSection.tsx', 
  'MissionSection.tsx', 
  'PastorsSection.tsx', 
  'CellsSection.tsx', 
  'PublicNavbar.tsx'
];

function processFolder(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processFolder(fullPath);
    } else if (file.endsWith('.tsx') && !excludeFiles.includes(file)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      // Match class names inside className="..." or clsx(...)
      // A safe way is to just find the exact word boundaries, but carefully handling prefixes
      // Match any tailwind modifier chain followed by our target class
      
      Object.keys(classMap).forEach(targetClass => {
        const darkClass = classMap[targetClass];
        // Regex: 
        // 1. start of string or whitespace or quote or backtick
        // 2. Capture any number of prefix modifiers like `hover:`, `group-hover:`, `focus:` etc.
        // 3. Match the exact targetClass
        // 4. Word boundary (must not be followed by - or digit)
        
        // This regex looks for: (^|["'\s`])((?:[a-z0-9\-]+:)*)bg-white(?![a-z0-9\-])
        const regexStr = `(^|["'\\s\`])((?:[a-z0-9\\-]+:)*)(${targetClass})(?![a-z0-9\\-])`;
        const regex = new RegExp(regexStr, 'g');
        
        content = content.replace(regex, (match, before, prefixes, cls) => {
          // If it's already followed by a dark class somewhere, we might duplicate, but it's okay if we are running this fresh.
          const existingDark = `dark:${prefixes}${darkClass}`;
          // Let's check if the replaced string would already exist, but for now we trust `content !== original`.
          return `${before}${prefixes}${cls} dark:${prefixes}${darkClass}`;
        });
      });
      
      // Since replacing might duplicate if run multiple times, let's dedup just in case:
      // Deduping logic: if "dark:text-white dark:text-white" exists, replace with one.
      Object.values(classMap).forEach(val => {
        content = content.replace(new RegExp(`dark:((?:[a-z0-9\\-]+:)*)${val} dark:\\1${val}`, 'g'), `dark:$1${val}`);
      });
      
      // Also add transition-colors if we touched it and it's a component
      // Actually we won't try to add transition-colors automatically to everything, as it might mess up transitions.
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${file}`);
      }
    }
  }
}

folders.forEach(processFolder);
console.log('Done applying smart dark mode');
