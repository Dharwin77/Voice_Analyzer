let rawApiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// Normalize API_BASE: ensure it starts with http:// or https://, and ends with /api (without trailing slash)
rawApiBase = rawApiBase.trim();
if (!rawApiBase.startsWith('http://') && !rawApiBase.startsWith('https://')) {
  rawApiBase = 'https://' + rawApiBase;
}
if (rawApiBase.endsWith('/')) {
  rawApiBase = rawApiBase.slice(0, -1);
}
if (!rawApiBase.endsWith('/api')) {
  rawApiBase = rawApiBase + '/api';
}

const API_BASE = rawApiBase;


/**
 * Check if the backend models are loaded and ready.
 */
export async function checkStatus() {
  const res = await fetch(`${API_BASE}/status`);
  return res.json();
}

/**
 * Predict emotion from a WAV blob/file.
 * @param {Blob|File} audioBlob
 */
export async function predictEmotion(audioBlob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.wav');

  const res = await fetch(`${API_BASE}/predict/emotion`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Emotion prediction failed');
  }
  return res.json();
}

/**
 * Predict gender from a WAV blob/file.
 * @param {Blob|File} audioBlob
 */
export async function predictGender(audioBlob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.wav');

  const res = await fetch(`${API_BASE}/predict/gender`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Gender prediction failed');
  }
  return res.json();
}

/**
 * Predict both emotion and gender simultaneously from a WAV blob/file.
 * @param {Blob|File} audioBlob
 */
export async function predictBoth(audioBlob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.wav');

  const res = await fetch(`${API_BASE}/predict/both`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Prediction failed');
  }
  return res.json();
}

/**
 * Convert a MediaRecorder Blob to WAV using Web Audio API.
 * Most browsers give webm/ogg from MediaRecorder; the backend needs WAV.
 * We decode via AudioContext and re-encode as PCM WAV.
 * @param {Blob} blob
 * @returns {Promise<Blob>} WAV blob
 */
export async function blobToWav(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext({ sampleRate: 16000 });
  const decoded  = await audioCtx.decodeAudioData(arrayBuffer);
  audioCtx.close();

  // Mix down to mono
  const numChannels = decoded.numberOfChannels;
  const length      = decoded.length;
  const sampleRate  = decoded.sampleRate;
  const monoData    = new Float32Array(length);

  for (let ch = 0; ch < numChannels; ch++) {
    const chData = decoded.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      monoData[i] += chData[i] / numChannels;
    }
  }

  // Convert float32 → int16
  const int16 = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, monoData[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  // Build WAV file
  const wavBuffer = new ArrayBuffer(44 + int16.byteLength);
  const view      = new DataView(wavBuffer);

  function writeStr(offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeStr(0, 'RIFF');
  view.setUint32(4,  36 + int16.byteLength,          true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16,          true);  // PCM chunk size
  view.setUint16(20, 1,           true);  // PCM format
  view.setUint16(22, 1,           true);  // mono
  view.setUint32(24, sampleRate,  true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2,           true);  // block align
  view.setUint16(34, 16,          true);  // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, int16.byteLength, true);

  new Int16Array(wavBuffer, 44).set(int16);

  return new Blob([wavBuffer], { type: 'audio/wav' });
}
