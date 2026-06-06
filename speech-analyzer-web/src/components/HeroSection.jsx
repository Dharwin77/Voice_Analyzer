import { useState } from 'react';

/**
 * HeroSection — Styled like a physical metal console plate.
 * Displays terminal stampings, indicator lamps, and system toggles.
 */
export default function HeroSection({ modelStatus }) {
  return (
    <header className="console-panel" style={{
      maxWidth: '1200px',
      margin: '40px auto 28px',
      borderBottomWidth: '5px',
      boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
      padding: '30px 40px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        
        {/* Left Side: Console Name & Technical Stamp */}
        <div style={{ textAlign: 'left' }}>
          <div style={{ 
            fontSize: '0.65rem', 
            color: 'var(--text-dim)', 
            fontWeight: 800, 
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            marginBottom: '4px' 
          }}>
            FEDERAL AUDIO LABORATORY MODULE
          </div>
          <h1 style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '2.5rem',
            fontWeight: 900,
            lineHeight: 1.1,
            color: 'white',
            letterSpacing: '0.02em',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}>
            VOICE_DECK <span className="nixie-display" style={{ fontSize: '2.4rem', marginLeft: '4px' }}>VX-9</span>
          </h1>
          <p style={{
            fontSize: '0.82rem',
            color: 'var(--text-dim)',
            fontFamily: "'Courier Prime', monospace",
            marginTop: '8px',
            maxWidth: '500px',
            lineHeight: 1.5
          }}>
            LOGICAL SPEECH SPECTRUM & GENDER DECODER / CORE_SYS_2.20
          </p>
        </div>

        {/* Center: System Status Indicators (Analog lamps) */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '28px',
          background: '#0a0c16',
          border: '2px solid var(--panel-border)',
          borderRadius: '10px',
          padding: '12px 24px',
          boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.6)'
        }}>
          {/* LED 1: Master Power */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <span className="led-indicator led-green active" />
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>PWR</span>
          </div>

          {/* LED 2: Model Active Status */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <span className={`led-indicator led-amber ${
              modelStatus === 'loading' ? 'active' : ''
            }`} />
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>LOAD</span>
          </div>

          {/* LED 3: Online link status */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <span className={`led-indicator led-green ${
              modelStatus === 'ready' ? 'active' : ''
            } ${
              modelStatus === 'error' ? 'led-red active' : ''
            }`} />
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>READY</span>
          </div>

          {/* Vertical Divider */}
          <div style={{ width: '2px', height: '32px', background: 'var(--panel-border)' }} />

          {/* Terminal Screen Status */}
          <div className="monospace-terminal" style={{ 
            fontSize: '0.8rem', 
            fontWeight: 700, 
            textAlign: 'left',
            minWidth: '220px'
          }}>
            {modelStatus === 'ready' && <span style={{ color: 'var(--text-green)' }}>▶ SYSTEM ACTIVE / DECK_READY</span>}
            {modelStatus === 'loading' && <span style={{ color: 'var(--phosphor-amber)' }}>⏳ LINKING MODEL ARRAYS...</span>}
            {modelStatus === 'error' && <span style={{ color: 'var(--phosphor-red)', textShadow: 'var(--glow-red)' }}>⚠ LINKAGE FAILED: OFFLINE</span>}
          </div>
        </div>

        {/* Right Side: Design stamp or filler */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'white', letterSpacing: '0.05em' }}>SYS_METRIC</div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>MODEL_A_VX9</div>
        </div>

      </div>

      <div className="panel-bottom-screws">
        <span>⚙</span>
        <span>⚙</span>
      </div>
    </header>
  );
}
