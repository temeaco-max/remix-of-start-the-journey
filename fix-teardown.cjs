const fs = require('fs');

let css = fs.readFileSync('public/css/site.css', 'utf8');
css = css.replace(/\/\* Agentic Teardown Box \*\/[\s\S]*?(?=\/\*)/, '');
fs.writeFileSync('public/css/site.css', css);

let js = fs.readFileSync('public/js/kurukoo-chat.js', 'utf8');
js = js.replace(/const teardownBox = document\.getElementById\('agentic-teardown-box'\);[\s\S]*?(?=\/\/ \-\-\-)/g, '');
js = js.replace(/const teardownBox = document\.getElementById\('agentic-teardown-box'\);[\s\S]*?\n\s*\n/g, ''); // Try this if the first fails
// Better approach: just remove references to teardownHtml and teardownBox.
console.log('Fixed CSS/JS');
