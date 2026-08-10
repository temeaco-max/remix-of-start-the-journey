import fs from 'node:fs';

const path = 'public/dashboard.html';
const source = fs.readFileSync(path, 'utf8');
let out = source;

if (!out.includes('/css/chat-ui.css')) {
  out = out.replace(
    /(<link rel="stylesheet" href="\/css\/site\.css[^>]*>)/,
    '$1\n    <link rel="stylesheet" href="/css/chat-ui.css?v=1.0.0">'
  );
}

if (!out.includes('/js/chat-ui-enhancements.js')) {
  out = out.replace(
    /(<\/head>)/,
    '    <script src="/js/chat-ui-enhancements.js?v=1.0.0" defer></script>\n$1'
  );
}

// Remove only presentation-only inline declarations that conflict with the shared design system.
out = out.replace(/\sstyle="display:\s*none\s*!important;"/g, '');

if (out === source) process.exit(0);
fs.writeFileSync(path, out);
