(() => {
  let stream = null;
  let muted = false;
  const video = document.getElementById('remote-video');
  const status = document.getElementById('call-status');
  const mic = document.getElementById('mic-state');
  const camera = document.getElementById('camera-state');
  const connection = document.getElementById('connection-state');
  const placeholder = document.getElementById('video-placeholder');
  const setStatus = text => { if (status) status.textContent = text; };
  document.getElementById('start-call')?.addEventListener('click', async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({audio:true, video:true});
      video.srcObject = stream;
      placeholder.hidden = true;
      mic.textContent = 'On'; camera.textContent = 'On'; connection.textContent = 'Local media ready';
      setStatus('Camera and microphone ready. Connect through an authenticated Kurukoo conversation to establish the remote peer.');
    } catch (error) {
      setStatus(error?.name === 'NotAllowedError' ? 'Camera/microphone permission was denied.' : 'Unable to access camera or microphone.');
    }
  });
  document.getElementById('mute-call')?.addEventListener('click', () => {
    if (!stream) return;
    muted = !muted;
    stream.getAudioTracks().forEach(track => { track.enabled = !muted; });
    mic.textContent = muted ? 'Muted' : 'On';
  });
  document.getElementById('end-call')?.addEventListener('click', () => {
    stream?.getTracks().forEach(track => track.stop());
    stream = null; video.srcObject = null; placeholder.hidden = false;
    mic.textContent = 'Off'; camera.textContent = 'Off'; connection.textContent = 'Not connected';
    setStatus('Call ended.');
  });
})();