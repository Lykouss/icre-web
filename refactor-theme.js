const fs = require('fs');
const path = require('path');

const replacements = [
  { search: /\bbg-slate-950\b/g, replace: 'bg-white dark:bg-slate-950' },
  { search: /\bbg-slate-900\b/g, replace: 'bg-slate-50 dark:bg-slate-900' },
  { search: /\btext-white\b/g, replace: 'text-slate-900 dark:text-white' },
  { search: /\btext-slate-400\b/g, replace: 'text-slate-500 dark:text-slate-400' },
  { search: /\btext-slate-300\b/g, replace: 'text-slate-600 dark:text-slate-300' },
  { search: /\bborder-white\/10\b/g, replace: 'border-black/10 dark:border-white/10' },
  { search: /\bborder-white\/8\b/g, replace: 'border-black/5 dark:border-white/8' },
  { search: /\bborder-white\/5\b/g, replace: 'border-black/5 dark:border-white/5' },
  { search: /\bbg-white\/10\b/g, replace: 'bg-black/5 dark:bg-white/10' },
  { search: /\bbg-white\/8\b/g, replace: 'bg-black/5 dark:bg-white/8' },
  { search: /\bbg-white\/6\b/g, replace: 'bg-black/5 dark:bg-white/6' },
  { search: /\bbg-white\/5\b/g, replace: 'bg-black/5 dark:bg-white/5' },
  { search: /\bbg-white\/4\b/g, replace: 'bg-black/5 dark:bg-white/4' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // We should only replace inside className="..." strings or template literals.
      // But a global replace is acceptable since these classes are very specific to Tailwind.
      
      // Let's do a naive global replacement, but be careful not to double replace.
      // e.g. "dark:bg-slate-950" shouldn't become "dark:bg-white dark:bg-slate-950".
      
      for (const { search, replace } of replacements) {
         // Using negative lookbehind to ensure we don't replace if preceded by "dark:" or "dark:hover:"
         // But JS regex might not support variable length lookbehinds.
         // Let's use a simpler approach: replace it, and then clean up double darks.
         
         const originalContent = content;
         content = content.replace(search, replace);
         if (content !== originalContent) changed = true;
      }

      // Cleanup bad darks
      content = content.replace(/dark:bg-white dark:bg-slate-950/g, 'dark:bg-slate-950');
      content = content.replace(/dark:bg-slate-50 dark:bg-slate-900/g, 'dark:bg-slate-900');
      content = content.replace(/dark:text-slate-900 dark:text-white/g, 'dark:text-white');
      content = content.replace(/dark:text-slate-500 dark:text-slate-400/g, 'dark:text-slate-400');
      content = content.replace(/dark:text-slate-600 dark:text-slate-300/g, 'dark:text-slate-300');
      content = content.replace(/dark:border-black\/10 dark:border-white\/10/g, 'dark:border-white/10');
      content = content.replace(/dark:border-black\/5 dark:border-white\/8/g, 'dark:border-white/8');
      content = content.replace(/dark:border-black\/5 dark:border-white\/5/g, 'dark:border-white/5');
      content = content.replace(/dark:bg-black\/5 dark:bg-white\/10/g, 'dark:bg-white/10');
      content = content.replace(/dark:bg-black\/5 dark:bg-white\/8/g, 'dark:bg-white/8');
      content = content.replace(/dark:bg-black\/5 dark:bg-white\/6/g, 'dark:bg-white/6');
      content = content.replace(/dark:bg-black\/5 dark:bg-white\/5/g, 'dark:bg-white/5');
      content = content.replace(/dark:bg-black\/5 dark:bg-white\/4/g, 'dark:bg-white/4');

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src/features/portal/components'));
processDirectory(path.join(__dirname, 'src/app/(public)'));

