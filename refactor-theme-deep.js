const fs = require('fs');
const path = require('path');

const DIRS = [
  'src/app/(public)',
  'src/features/portal/components',
  'src/features/core/components'
];

let updatedFilesCount = 0;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // We find class="..." strings and replace inside them
  content = content.replace(/(className\s*=\s*["'`])([^"'`]+)(["'`])/g, (match, p1, classes, p3) => {
    let words = classes.split(/\s+/);
    let newWords = [];

    for (let word of words) {
      if (!word) continue;

      // Skip already processed dark variants to avoid double application
      if (word.startsWith('dark:')) {
        newWords.push(word);
        continue;
      }

      // Backgrounds
      if (word === 'bg-slate-950') {
        newWords.push('bg-white', 'dark:bg-slate-950');
      } else if (word === 'bg-slate-900') {
        newWords.push('bg-slate-50', 'dark:bg-slate-900');
      } else if (word === 'bg-slate-800') {
        newWords.push('bg-white', 'shadow-xl', 'shadow-slate-200/50', 'border', 'border-slate-200', 'dark:border-transparent', 'dark:shadow-none', 'dark:bg-slate-800');
      } else if (word.match(/^bg-slate-[89]\d\d\/\d+$/)) {
        if (word === 'bg-slate-950/55') {
          // Special case for Hero Section overlay (done manually, but let's catch it here)
          newWords.push('bg-slate-900/10', `dark:${word}`);
        } else {
          newWords.push('bg-white/80', 'backdrop-blur-md', 'dark:backdrop-blur-none', 'border', 'border-slate-200/50', 'dark:border-transparent', `dark:${word}`);
        }
      }
      
      // Texts
      else if (word === 'text-white') {
        newWords.push('text-slate-900', 'dark:text-white');
      } else if (word.match(/^text-slate-(200|300|400)(\/\d+)?$/)) {
        const opacity = word.includes('/') ? '/' + word.split('/')[1] : '';
        newWords.push(`text-slate-600${opacity}`, `dark:${word}`);
      }
      
      // Borders
      else if (word.match(/^border-slate-[678]\d\d(\/\d+)?$/)) {
        const opacity = word.includes('/') ? '/' + word.split('/')[1] : '';
        newWords.push(`border-slate-200${opacity}`, `dark:${word}`);
      } else if (word.match(/^border-white\/\d+$/)) {
        const val = word.split('/')[1];
        newWords.push(`border-black/${val}`, `dark:${word}`);
      }
      
      // Gradients
      else if (word.match(/^from-slate-950(\/\d+)?$/)) {
        const opacity = word.includes('/') ? '/' + word.split('/')[1] : '';
        newWords.push(`from-white${opacity}`, `dark:${word}`);
      } else if (word.match(/^from-slate-[89]\d\d(\/\d+)?$/)) {
        const opacity = word.includes('/') ? '/' + word.split('/')[1] : '';
        newWords.push(`from-slate-50${opacity}`, `dark:${word}`);
      } else if (word.match(/^via-slate-[89]\d\d(\/\d+)?$/)) {
        const opacity = word.includes('/') ? '/' + word.split('/')[1] : '';
        newWords.push(`via-slate-50${opacity}`, `dark:${word}`);
      } else if (word.match(/^to-slate-950(\/\d+)?$/)) {
        const opacity = word.includes('/') ? '/' + word.split('/')[1] : '';
        newWords.push(`to-white${opacity}`, `dark:${word}`);
      } else if (word.match(/^to-slate-[89]\d\d(\/\d+)?$/)) {
        const opacity = word.includes('/') ? '/' + word.split('/')[1] : '';
        newWords.push(`to-slate-50${opacity}`, `dark:${word}`);
      }
      
      // Unmatched
      else {
        newWords.push(word);
      }
    }

    // Remove duplicates
    const unique = [...new Set(newWords)];
    return p1 + unique.join(' ') + p3;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
    updatedFilesCount++;
  }
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

DIRS.forEach(processDirectory);
console.log(`\nRefactoring complete! Updated ${updatedFilesCount} files.`);
