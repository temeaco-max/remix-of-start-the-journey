# Mistral Audio API Notes

Source: [Mistral Audio Transcriptions API](https://docs.mistral.ai/api/endpoint/audio/transcriptions), retrieved 2026-08-15.

The official transcription endpoint is `POST https://api.mistral.ai/v1/audio/transcriptions`. The request supports a multipart file upload plus `model`, optional `language`, `diarize`, `context_bias`, and timestamp options. The documented response contains `text`, `model`, optional `language`, `segments`, and `usage`. The current model example is `voxtral-mini-latest`.

Source: [Mistral Studio Audio Overview](https://docs.mistral.ai/studio-api/audio/overview), retrieved 2026-08-15.

Mistral separates bounded file transcription, realtime transcription, and text-to-speech capabilities. Voxtral Mini Transcribe is for bounded transcription; Voxtral Realtime is a separate live capability; Voxtral TTS is a separate speech-generation capability. Kurukoo must keep these capabilities separate and must not claim provider activation, quota, privacy suitability, or external delivery from configuration alone.
