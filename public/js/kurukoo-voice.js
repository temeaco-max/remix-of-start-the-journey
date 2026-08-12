/* Kurukoo Voice — free browser voice adapter.
 * Keeps voice inside the existing /chat conversation. No audio is stored and
 * no second conversation/request engine is created. A future realtime adapter
 * can replace this transport without changing the chat domain.
 */
(function () {
  'use strict';

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const input = document.getElementById('message-input');
  const button = document.getElementById('voice-input');
  const send = document.getElementById('send-message');
  if (!input || !button) return;

  let recognition = null;
  let listening = false;
  let speaking = false;
  let finalTranscript = '';

  function setState(state) {
    button.dataset.voiceState = state;
    button.setAttribute('aria-pressed', state === 'listening' ? 'true' : 'false');
    const labels = {
      idle: 'Start voice input',
      listening: 'Stop listening',
      unavailable: 'Voice input unavailable'
    };
    button.setAttribute('aria-label', labels[state] || labels.idle);
    button.title = labels[state] || labels.idle;
    button.classList.toggle('is-listening', state === 'listening');
  }

  function stopSpeech() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    speaking = false;
  }

  function speakAssistant(text) {
    if (!text || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = function () { speaking = true; };
    utterance.onend = function () { speaking = false; };
    utterance.onerror = function () { speaking = false; };
    window.speechSynthesis.speak(utterance);
  }

  function sendCurrentTranscript() {
    const text = finalTranscript.trim();
    if (!text) return;
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    if (send) send.click();
    finalTranscript = '';
  }

  if (!SpeechRecognition) {
    setState('unavailable');
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = document.documentElement.lang || navigator.language || 'en-GB';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = function () {
    listening = true;
    finalTranscript = '';
    stopSpeech();
    setState('listening');
  };

  recognition.onresult = function (event) {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalTranscript += transcript + ' ';
      else interim += transcript;
    }
    input.value = (finalTranscript + interim).trim();
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  recognition.onerror = function (event) {
    listening = false;
    setState('idle');
    if (event.error !== 'aborted' && event.error !== 'no-speech') {
      input.placeholder = 'Voice unavailable — type to continue';
      window.setTimeout(function () { input.placeholder = 'Message Kurukoo'; }, 3000);
    }
  };

  recognition.onend = function () {
    listening = false;
    setState('idle');
    sendCurrentTranscript();
  };

  button.addEventListener('click', function () {
    if (listening) {
      recognition.stop();
      return;
    }
    stopSpeech();
    try { recognition.start(); } catch (_) { setState('idle'); }
  });

  // Speak newly rendered assistant messages without creating a voice thread.
  const content = document.getElementById('chat-content');
  if (content && 'speechSynthesis' in window) {
    const seen = new WeakSet();
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (!(node instanceof Element)) return;
          const candidates = [node].concat(Array.from(node.querySelectorAll ? node.querySelectorAll('[data-role="assistant"], .assistant-message, .message-assistant') : []));
          candidates.forEach(function (candidate) {
            if (seen.has(candidate)) return;
            const role = candidate.getAttribute && candidate.getAttribute('data-role');
            const text = (candidate.innerText || '').trim();
            if (role === 'assistant' && text && text.length < 4000) {
              seen.add(candidate);
              speakAssistant(text);
            }
          });
        });
      });
    });
    observer.observe(content, { childList: true, subtree: true });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopSpeech();
  });

  setState('idle');
})();
