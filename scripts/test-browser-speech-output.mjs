import fs from 'node:fs';

const source = fs.readFileSync('public/js/kurukoo-speech-output.js', 'utf8');
const required = ['SpeechSynthesisUtterance', 'window.KurukooSpeechOutput', "provider: 'browser'", 'window.speechSynthesis.cancel()', 'window.speechSynthesis.speak(utterance)'];
const missing = required.filter(marker => !source.includes(marker));
if (missing.length) {
  console.error(JSON.stringify({ status: 'FAIL', missing }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: 'PASS', provider: 'browser', zeroCost: true, requiredMarkers: required.length }, null, 2));
