const fs = require('fs');

function replaceFile(path, replacer) {
  if (!fs.existsSync(path)) return;
  const content = fs.readFileSync(path, 'utf8');
  const newContent = replacer(content);
  if (content !== newContent) fs.writeFileSync(path, newContent);
}

const files = [
  'AboutSection.tsx',
  'EventsSection.tsx',
  'ContactSection.tsx',
  'PastorsSection.tsx',
  'YoutubeSection.tsx',
  'MissionSection.tsx',
  'CellsSection.tsx'
];

files.forEach(file => {
  replaceFile('src/features/portal/components/' + file, c => {
    // Seções
    c = c.replace(/className="relative py-32 px-6 bg-white dark:bg-slate-950 overflow-hidden"/g, 'className="relative py-32 px-6 bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden"');
    // Pastors Modal
    c = c.replace(/className="absolute inset-0 bg-white dark:bg-slate-950\/90 backdrop-blur-md"/g, 'className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/90 backdrop-blur-md"');
    // Youtube bg
    c = c.replace(/className="absolute -inset-2 bg-white dark:bg-slate-950\/40 rounded-3xl"/g, 'className="absolute -inset-2 bg-white/60 dark:bg-slate-950/40 rounded-3xl backdrop-blur-md"');
    c = c.replace(/bg-white dark:bg-slate-950"/g, 'bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl"');
    return c;
  });
});
console.log('Fixed solid backgrounds');
