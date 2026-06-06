import { useState, useEffect, useCallback } from 'react';
import './index.css';

import ParticleBackground from './components/ParticleBackground';
import HeroSection        from './components/HeroSection';
import AudioRecorder      from './components/AudioRecorder';
import EmotionResult      from './components/EmotionResult';
import GenderResult       from './components/GenderResult';

import { checkStatus, predictBoth } from './utils/api';

const POLL_INTERVAL_MS = 3000;

export default function App() {
  const [modelStatus, setModelStatus] = useState('loading'); // loading | ready | error
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults]         = useState(null);      // { emotion, gender }
  const [apiError, setApiError]       = useState('');
  const [audioBlob, setAudioBlob]     = useState(null);

  // ── Poll backend status until models are ready ──────────────────────────
  useEffect(() => {
    let interval;

    async function poll() {
      try {
        const s = await checkStatus();
        if (s.models_ready) {
          setModelStatus('ready');
          clearInterval(interval);
        } else if (s.error) {
          setModelStatus('error');
          clearInterval(interval);
        } else {
          setModelStatus('loading');
        }
      } catch {
        setModelStatus('error');
        clearInterval(interval);
      }
    }

    poll();
    interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // ── Handle audio ready from recorder ────────────────────────────────────
  const handleAudioReady = useCallback((blob) => {
    setAudioBlob(blob);
    setResults(null);
    setApiError('');
  }, []);

  // ── Run analysis ─────────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!audioBlob) return;
    if (modelStatus !== 'ready') {
      setApiError('Models not ready yet. Please wait for the Flask backend to finish loading.');
      return;
    }

    setIsAnalyzing(true);
    setApiError('');
    setResults(null);

    try {
      const data = await predictBoth(audioBlob);
      setResults(data);
    } catch (err) {
      setApiError(err.message || 'Analysis failed. Is the Flask backend running on port 5000?');
    } finally {
      setIsAnalyzing(false);
    }
  }, [audioBlob, modelStatus]);

  return (
    <div className="app">
      {/* Animated retro CRT oscilloscope background */}
      <ParticleBackground />

      <div className="content-layer">
        {/* Retro Mount Hero Plate */}
        <HeroSection modelStatus={modelStatus} />

        {/* Main console cabinet */}
        <main className="main-content">
          {/* Recorder Panel */}
          <section className="section" style={{ marginBottom: '28px' }}>
            <AudioRecorder
              onAudioReady={handleAudioReady}
              isAnalyzing={isAnalyzing}
            />
          </section>

          {/* Analyze Tactile Key */}
          {audioBlob && !isAnalyzing && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', animation: 'slide-up 0.3s ease both' }}>
              <button
                id="analyze-btn"
                className="push-button btn-amber"
                onClick={handleAnalyze}
                disabled={modelStatus !== 'ready'}
                style={{
                  fontSize: '1.1rem',
                  padding: '18px 48px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                🧠 RUN SPEECH ANALYSIS
              </button>
            </div>
          )}

          {/* API Error readout */}
          {apiError && (
            <div className="crt-bezel" style={{
              maxWidth: 600,
              margin: '0 auto 32px',
              padding: '16px 20px',
              borderColor: 'var(--phosphor-red)',
              color: 'var(--phosphor-red)',
              background: 'rgba(255,59,48,0.05)',
              fontSize: '0.9rem',
              textAlign: 'center',
              fontFamily: "'Courier Prime', monospace",
              animation: 'slide-up 0.3s ease both',
            }}>
              ⚠️ SYSTEM_ALARM: {apiError}
            </div>
          )}

          {/* Decoded Results Panel */}
          {results && (
            <>
              {/* Summary Banner plate */}
              <div className="console-panel" style={{
                maxWidth: 700,
                margin: '0 auto 32px',
                padding: '16px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '40px',
                flexWrap: 'wrap',
                animation: 'scale-in 0.4s ease both',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800, letterSpacing: '0.15em', marginBottom: 6, fontFamily: "'Courier Prime', monospace" }}>LOCKED_EMOTION</div>
                  <div className="nixie-display" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span>{results.emotion.emoji}</span>
                    <span>{results.emotion.label.toUpperCase()}</span>
                  </div>
                </div>

                <div style={{ width: 2, height: 48, background: 'var(--panel-border)' }} />

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 800, letterSpacing: '0.15em', marginBottom: 6, fontFamily: "'Courier Prime', monospace" }}>LOCKED_GENDER</div>
                  <div className={`nixie-display ${results.gender.label === 'male' ? 'nixie-cyan' : 'nixie-pink'}`} style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span>{results.gender.emoji}</span>
                    <span>{results.gender.label.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Dual chassis modules */}
              <div className="console-row">
                <EmotionResult data={results.emotion} />
                <GenderResult  data={results.gender}  />
              </div>

              {/* Technical Specs Plate */}
              <div className="console-panel" style={{ marginTop: '28px' }}>
                <h2 className="section-title">SYSTEM ARCHITECTURE SPECIFICATIONS</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                  {[
                    { icon: '🎤', title: 'ACQUISITION BLOCK', desc: 'Analog input digitized at 16kHz mono, processed with PCM WAV headers.' },
                    { icon: '📊', title: 'DSP EXTRACTION', desc: 'Signal split into MFCC, Chroma and MEL Spectrogram float arrays via Librosa.' },
                    { icon: '🎭', title: 'DECISION TREE', desc: 'Sklearn BaggingClassifier multi-class prediction trained on RAVDESS/EMO-DB corpus.' },
                    { icon: '⚥',  title: 'NEURAL CLASSIFIER',  desc: 'TensorFlow Sequential deep net mapping voice features to gender classification.' },
                  ].map(({ icon, title, desc }) => (
                    <div key={title} className="crt-bezel" style={{
                      padding: '16px',
                      background: '#0a0b12',
                    }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{icon}</div>
                      <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', color: 'white' }}>{title}</h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.5, fontFamily: "'Courier Prime', monospace" }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Calibration Guide (before scan) */}
          {!results && !isAnalyzing && (
            <div className="console-panel" style={{ marginTop: '8px', animation: 'slide-up 0.5s ease both' }}>
              <h2 className="section-title">CALIBRATION GUIDE & STEPS</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {[
                  { step: '01', icon: '🎤', text: 'Engage RECORD button to capture microphone signal stream (10s limit).' },
                  { step: '02', icon: '📁', text: 'Or feed local audio cassette cartridge (drag WAV/MP3 file into slot).' },
                  { step: '03', icon: '🧠', text: 'Click "RUN SPEECH ANALYSIS" to boot deep learning classifiers.' },
                  { step: '04', icon: '✨', text: 'Analyze vector locks and dial VU needle gauges for predictions.' },
                ].map(({ step, icon, text }) => (
                  <div key={step} className="crt-bezel" style={{
                    background: '#090a10',
                    padding: '16px',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span className="nixie-display" style={{
                        fontSize: '0.85rem', fontWeight: 800,
                      }}>{step}</span>
                      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.5, fontFamily: "'Courier Prime', monospace" }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Footer console details */}
        <footer style={{
          textAlign: 'center',
          padding: '40px 24px',
          borderTop: '2px solid var(--panel-border)',
          color: 'var(--text-dim)',
          fontSize: '0.75rem',
          fontFamily: "'Courier Prime', monospace"
        }}>
          <p>
            <span className="nixie-display" style={{ fontSize: '0.95rem', fontWeight: 700 }}>VOICE_IQ terminal</span>
            {' '}— Manufactured in collaboration with TensorFlow, Scikit-Learn & Librosa
          </p>
          <p style={{ marginTop: '6px', color: '#444c5f' }}>
            DATASETS: RAVDESS (STAGE_01) · TESS (STAGE_02) · EMO-DB (STAGE_03) · MOZILLA_COMMON_VOICE
          </p>
        </footer>
      </div>
    </div>
  );
}
