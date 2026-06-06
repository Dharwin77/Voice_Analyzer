import EmotionWheel from './EmotionWheel';

const EMOTION_COLORS = {
  neutral: '#94a3b8', calm: '#67e8f9', happy: '#ffb000',
  sad: '#3b82f6', angry: '#ff3b30', fear: '#a855f7',
  disgust: '#10b981', ps: '#ff7700', boredom: '#6366f1'
};

const EMOTION_LABELS = {
  neutral: 'NEUTRAL_HUM',
  calm: 'CALM_STEADY',
  happy: 'PEAK_EUPHORIA',
  sad: 'DEPRESSIVE_LOW',
  angry: 'HYPER_AGITATED',
  fear: 'TREMOR_STRESS',
  disgust: 'AVERSION_SPIKE',
  ps: 'SUDDEN_SHOCK',
  boredom: 'FATIGUE_SLUMP'
};

/**
 * Emotion Result Card — styled as a modular laboratory metal chassis.
 * Renders the vectorscope radar and a Nixie-style target text read-out.
 */
export default function EmotionResult({ data }) {
  const { label: emotion, emoji, color, probabilities } = data;

  // Sort probabilities descending
  const probEntries = Object.entries(probabilities || {})
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="console-panel rack-mount" style={{ animation: 'scale-in 0.4s ease both' }}>
      
      {/* Chassis Head */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          <span></span> DECODER_CH_01 // EMOTION_VECTORS
        </h2>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
          SERIAL: EM-8827-X
        </span>
      </div>

      {/* Grid: Vectorscope Scope (Left) & Result Panel (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '24px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        
        {/* Radar scope screen */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <EmotionWheel prediction={emotion} probabilities={probabilities} />
        </div>

        {/* Readout panel with Nixie tube display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{
            fontSize: '0.65rem',
            color: 'var(--text-dim)',
            fontWeight: 800,
            letterSpacing: '0.1em',
            fontFamily: "'Courier Prime', monospace"
          }}>
            LOCKED TARGET VALUE
          </div>

          {/* Nixie tube housing block */}
          <div style={{
            background: '#0a0a0f',
            border: '3px solid #2e334a',
            borderRadius: '10px',
            padding: '16px 20px',
            textAlign: 'center',
            boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.8), 0 0 15px rgba(255,176,0,0.05)'
          }}>
            <div className="split-flap-group" style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '2.5rem', animation: 'float 3s ease-in-out infinite' }}>
                {emoji}
              </span>
            </div>
            
            <div className="nixie-display" style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontFamily: "'Orbitron', sans-serif"
            }}>
              {EMOTION_LABELS[emotion] || emotion.toUpperCase()}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="led-indicator led-green active" style={{ width: '8px', height: '8px' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-dim)' }}>
              VECTOR_LOCK_COMPLETED
            </span>
          </div>

        </div>

      </div>

      {/* Segmented LED graph meters for Breakdown */}
      {probEntries.length > 1 && (
        <div style={{ marginTop: '24px' }}>
          <div className="divider" />
          <p style={{
            fontSize: '0.7rem',
            color: 'var(--text-dim)',
            marginBottom: '16px',
            fontWeight: 800,
            letterSpacing: '0.15em',
            fontFamily: "'Courier Prime', monospace"
          }}>
            CONFIDENCE EQUALIZER (SPECTRUM ANALYSIS)
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {probEntries.map(([label, prob]) => {
              const isMatch = label === emotion;
              
              // Calculate number of segments to glow (total 20 segments)
              const totalSegments = 20;
              const activeSegments = Math.round((prob / 100) * totalSegments);

              return (
                <div key={label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {/* Label */}
                  <span style={{
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    color: isMatch ? 'var(--text-green)' : 'var(--text-dim)',
                    width: '90px',
                    textTransform: 'uppercase',
                    textAlign: 'left'
                  }}>
                    {label}
                  </span>

                  {/* Segmented LED bar */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    gap: '2px',
                    background: '#090a0f',
                    border: '1.5px solid var(--panel-border)',
                    borderRadius: '4px',
                    padding: '3px'
                  }}>
                    {Array.from({ length: totalSegments }).map((_, idx) => {
                      const isActive = idx < activeSegments;
                      // Color segments green, amber at top, red at peak
                      let segColor = 'rgba(51, 255, 102, 0.05)'; // default inactive
                      if (isActive) {
                        if (idx >= 17) segColor = 'var(--phosphor-red)'; // Peak red
                        else if (idx >= 12) segColor = 'var(--phosphor-amber)'; // Mid amber
                        else segColor = 'var(--phosphor-green)'; // Safe green
                      }

                      return (
                        <div 
                          key={idx} 
                          style={{
                            flex: 1,
                            height: '10px',
                            background: segColor,
                            borderRadius: '1.5px',
                            boxShadow: isActive ? `0 0 4px ${segColor}` : 'none',
                            transition: 'all 0.4s ease'
                          }} 
                        />
                      );
                    })}
                  </div>

                  {/* Percentage Readout */}
                  <span className="nixie-display" style={{
                    width: '56px',
                    fontSize: '0.9rem',
                    textAlign: 'right',
                    color: isMatch ? 'var(--phosphor-amber)' : 'var(--text-dim)',
                    textShadow: isMatch ? 'var(--glow-amber)' : 'none'
                  }}>
                    {prob.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="panel-bottom-screws">
        <span>⚙</span>
        <span>⚙</span>
      </div>
    </div>
  );
}
