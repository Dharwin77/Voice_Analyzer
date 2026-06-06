import { useState, useRef, useCallback } from 'react';
import WaveformVisualizer from './WaveformVisualizer';
import { blobToWav } from '../utils/api';

const MAX_RECORD_SECS = 10;

/**
 * AudioRecorder — Styled as an analog cassette / reel-to-reel deck console.
 * Includes spinning tape reels, red glow indicators, and tactile switches.
 */
export default function AudioRecorder({ onAudioReady, isAnalyzing }) {
  const [mode, setMode]             = useState('idle');    // idle | recording | done
  const [seconds, setSeconds]       = useState(0);
  const [fileName, setFileName]     = useState('');
  const [stream, setStream]         = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError]           = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const timerRef         = useRef(null);
  const fileInputRef     = useRef(null);

  const startRecording = useCallback(async () => {
    setError('');
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setStream(mic);

      const recorder = new MediaRecorder(mic, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      chunksRef.current        = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        mic.getTracks().forEach(t => t.stop());
        setStream(null);

        const rawBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        try {
          const wavBlob = await blobToWav(rawBlob);
          setMode('done');
          onAudioReady(wavBlob);
        } catch (err) {
          setError('Failed to process analog signal.');
          setMode('idle');
        }
      };

      recorder.start(100);
      setMode('recording');
      setSeconds(0);

      let count = 0;
      timerRef.current = setInterval(() => {
        count++;
        setSeconds(count);
        if (count >= MAX_RECORD_SECS) {
          clearInterval(timerRef.current);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
        }
      }, 1000);

    } catch (err) {
      setError('Signal source unavailable. Grant microphone permissions.');
      setMode('idle');
    }
  }, [onAudioReady]);

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setMode('done');
  }, []);

  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      setError('Format mismatch. Provide valid audio cartridge.');
      return;
    }
    setError('');
    setFileName(file.name);

    try {
      let wavBlob;
      if (file.type === 'audio/wav' || file.name.endsWith('.wav')) {
        wavBlob = file;
      } else {
        wavBlob = await blobToWav(file);
      }
      setMode('done');
      onAudioReady(wavBlob);
    } catch (err) {
      setError('Signal parsing error on file cartridge.');
      setMode('idle');
    }
  }, [onAudioReady]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleReset = () => {
    setMode('idle');
    setSeconds(0);
    setFileName('');
    setError('');
    setStream(null);
  };

  const progress = Math.min((seconds / MAX_RECORD_SECS) * 100, 100);

  return (
    <div className="console-panel" style={{ borderBottomWidth: '5px' }}>
      
      {/* Deck Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          <span></span> MAGNETIC_DECK_CONTROLS
        </h2>
        
        {/* Reset Lever Switch */}
        {mode !== 'idle' && (
          <button 
            className="push-button" 
            onClick={handleReset} 
            style={{ padding: '6px 14px', fontSize: '0.75rem', borderBottomWidth: '3px' }}
          >
            🎛 CLEAR / EJECT
          </button>
        )}
      </div>

      {/* Main Grid: Visualizer & Tape Deck reels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        
        {/* Left Panel: Time Oscilloscope visualizer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            fontSize: '0.65rem',
            color: 'var(--text-dim)',
            fontWeight: 800,
            letterSpacing: '0.1em',
            fontFamily: "'Courier Prime', monospace"
          }}>
            TRACE MONITOR [CH_A]
          </div>
          <div className="crt-bezel">
            <WaveformVisualizer stream={stream} isRecording={mode === 'recording'} />
            <div className="crt-sweep-line" style={{ animationDuration: '4s' }} />
          </div>
        </div>

        {/* Right Panel: Cassette Tape Reels */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            fontSize: '0.65rem',
            color: 'var(--text-dim)',
            fontWeight: 800,
            letterSpacing: '0.1em',
            fontFamily: "'Courier Prime', monospace"
          }}>
            MAGNETIC RECORDING REELS
          </div>
          <div className="cassette-window">
            <div className="tape-ribbon" />
            <div className={`tape-reel ${
              mode === 'recording' ? 'spinning' : 
              isAnalyzing ? 'spinning' : ''
            }`} style={{ animationDuration: isAnalyzing ? '0.5s' : '2s' }} />
            <div className={`tape-reel ${
              mode === 'recording' ? 'spinning-reverse' : 
              isAnalyzing ? 'spinning-reverse' : ''
            }`} style={{ animationDuration: isAnalyzing ? '0.5s' : '2s' }} />
          </div>
        </div>

      </div>

      <div className="divider" />

      {/* Control buttons & mechanical indicators */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
        
        {/* Physical Deck Keys */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          
          {/* Record Key */}
          {mode === 'idle' && (
            <button
              id="mic-record-btn"
              className="push-button btn-amber"
              onClick={startRecording}
              style={{ padding: '16px 28px' }}
            >
              <span className="led-indicator led-red active" style={{ animationDuration: '0.8s' }} />
              ● RECORD
            </button>
          )}

          {/* Stop Key */}
          {mode === 'recording' && (
            <button
              id="mic-stop-btn"
              className="push-button"
              onClick={stopRecording}
              style={{
                background: 'linear-gradient(to bottom, #7a2626 0%, #461414 100%)',
                borderColor: '#9e3c3c',
                borderBottomColor: '#2b0c0c',
                padding: '16px 28px'
              }}
            >
              ⏹ STOP SIGNAL
            </button>
          )}

          {/* Complete Status Light */}
          {mode === 'done' && !isAnalyzing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="led-indicator led-green active" style={{ width: '16px', height: '16px' }} />
              <span className="nixie-display" style={{ fontSize: '1.1rem', letterSpacing: '0.05em' }}>
                SIGNAL_STORED
              </span>
            </div>
          )}

          {/* Analyzing Gear */}
          {isAnalyzing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="loading-spinner" style={{ width: '24px', height: '24px' }} />
              <span className="monospace-terminal" style={{ fontSize: '0.85rem' }}>
                DECODING ANALOG TRACK...
              </span>
            </div>
          )}
        </div>

        {/* Counter Display (Digital Tape Counter) */}
        <div style={{
          background: '#090a0f',
          border: '2px solid var(--panel-border)',
          borderRadius: '6px',
          padding: '8px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)'
        }}>
          <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.15em' }}>
            TAPE COUNTER
          </span>
          <span className="nixie-display" style={{ fontSize: '1.6rem', letterSpacing: '0.1em' }}>
            00:{seconds.toString().padStart(2, '0')}
          </span>
        </div>

        {/* Upload Slot Bezel (Floppy drive style) */}
        <div 
          className={`crt-bezel ${isDragOver ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          style={{
            minWidth: '280px',
            borderStyle: isDragOver ? 'dashed' : 'solid',
            borderColor: isDragOver ? 'var(--phosphor-amber)' : '#1c1f2e',
            background: '#0d0f17',
            padding: '12px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            opacity: 1,
            transition: 'all 0.3s ease'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            id="audio-file-input"
            style={{ display: 'none' }}
            onChange={(e) => handleFileUpload(e.target.files[0])}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>📼</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>
                {fileName ? fileName.slice(0, 18) + '...' : 'FEED TAPE CARTRIDGE'}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>
                Drag file / Click slot to load
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Error read-out screen */}
      {error && (
        <div className="crt-bezel" style={{
          marginTop: '16px',
          borderColor: 'var(--phosphor-red)',
          color: 'var(--phosphor-red)',
          background: 'rgba(255, 59, 48, 0.05)',
          padding: '12px',
          fontFamily: "'Courier Prime', monospace",
          fontSize: '0.8rem',
          textAlign: 'center'
        }}>
          ⚠️ CONSOLE_ALERT: {error}
        </div>
      )}

      <div className="panel-bottom-screws">
        <span>⚙</span>
        <span>⚙</span>
      </div>
    </div>
  );
}
