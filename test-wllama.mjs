import { Wllama, WllamaChat } from '@wllama/wllama';
const t0 = Date.now();
console.log('Loading wllama...');
const wllama = new Wllama({ model: '/Users/mac/Antigravity/Kurukoo v2/models/gguf/Llama-3.2-1B-Instruct-Q4_K_M.gguf' });
await wllama.init();
console.log('initMs', Date.now() - t0);
const chat = new WllamaChat(wllama);
const t1 = Date.now();
const out = await chat.chat([
  { role: 'system', content: 'You are Kurukoo, a calm capable assistant.' },
  { role: 'user', content: 'Hello' }
], { maxTokens: 80 });
console.log('inferMs', Date.now() - t1);
console.log('OUT:', JSON.stringify(String(out)).slice(0, 400));
