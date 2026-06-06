/**
 * Gender Result Card — styled as a vintage hardware dial console module.
 * Features a mechanical needle dial gauge (VU meter) that tilts left/right.
 */
export default function GenderResult({ data }) {
  const { label: gender, emoji, male_probability, female_probability } = data;

  const isMale = gender === 'male';

  // Calculate needle tilt angle (swings from -60deg for Male to +60deg for Female)
  // Center (50% probability each) is 0deg.
  // 100% Male is -60deg. 100% Female is +60deg.
  const diff = female_probability - male_probability; // swings from -100 to +100
  const needleAngle = (diff / 100.0) * 60; // swings from -60 to +60

  const accentColor = isMale ? 'var(--phosphor-cyan)' : 'var(--phosphor-pink)';
  const nixieClass = isMale ? 'nixie-cyan' : 'nixie-pink';

  return (
    <div className="console-panel rack-mount" style={{ animation: 'scale-in 0.4s 0.1s ease both' }}>
      
      {/* Chassis Head */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          <span></span> DECODER_CH_02 // GENDER_BIAS
        </h2>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
          MODEL: GD-9904-Y
        </span>
      </div>

      {/* Grid: Mechanical Dial (Left) & Digital Display (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '24px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        
        {/* Dial Face Gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          
          <div style={{
            fontSize: '0.65rem',
            color: 'var(--text-dim)',
            fontWeight: 800,
            letterSpacing: '0.1em',
            fontFamily: "'Courier Prime', monospace"
          }}>
            ANALOG TENSION METRIC (VU)
          </div>

          {/* Physical VU Meter Chassis */}
          <div className="vu-meter-panel">
            {/* Scale background graphic */}
            <svg viewBox="0 0 200 80" width="100%" height="60" style={{ opacity: 0.8 }}>
              {/* Arc Scale */}
              <path 
                d="M 20 70 A 90 90 0 0 1 180 70" 
                fill="none" 
                stroke="#333" 
                strokeWidth="3" 
              />
              
              {/* Color zones: Male Cyan (left half), Female Pink (right half) */}
              <path 
                d="M 20 70 A 90 90 0 0 1 100 12" 
                fill="none" 
                stroke="var(--phosphor-cyan)" 
                strokeWidth="3" 
                strokeOpacity="0.4"
              />
              <path 
                d="M 100 12 A 90 90 0 0 1 180 70" 
                fill="none" 
                stroke="var(--phosphor-pink)" 
                strokeWidth="3" 
                strokeOpacity="0.4"
              />

              {/* Ticks on scale */}
              {Array.from({ length: 11 }).map((_, i) => {
                const angle = -60 + i * 12; // -60deg to +60deg
                const rad = ((angle - 90) * Math.PI) / 180;
                
                const startR = 85;
                const endR = 90;
                const bold = i === 0 || i === 5 || i === 10;
                
                const sx = 100 + startR * Math.cos(rad);
                const sy = 80 + startR * Math.sin(rad);
                const ex = 100 + endR * Math.cos(rad);
                const ey = 80 + endR * Math.sin(rad);

                return (
                  <line 
                    key={i} 
                    x1={sx} y1={sy} 
                    x2={ex} y2={ey} 
                    stroke={bold ? '#111' : '#666'} 
                    strokeWidth={bold ? '2' : '1'} 
                  />
                );
              })}

              {/* Labels */}
              <text x="25" y="76" fontSize="6" fill="#444" fontFamily="monospace" textAnchor="middle">MALE</text>
              <text x="100" y="24" fontSize="6" fill="#444" fontFamily="monospace" textAnchor="middle">CEN</text>
              <text x="175" y="76" fontSize="6" fill="#444" fontFamily="monospace" textAnchor="middle">FEMALE</text>
            </svg>

            {/* Glowing active needle */}
            <div 
              className="vu-needle" 
              style={{
                transform: `rotate(${needleAngle}deg)`,
                transition: 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // physics spring bounce!
                background: accentColor,
                boxShadow: `0 0 8px ${accentColor}`
              }}
            />

            {/* Label dial label */}
            <div className="vu-label">SPEECH_BIAS</div>
          </div>
        </div>

        {/* Digital Nixie Tube Display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{
            fontSize: '0.65rem',
            color: 'var(--text-dim)',
            fontWeight: 800,
            letterSpacing: '0.1em',
            fontFamily: "'Courier Prime', monospace"
          }}>
            RECONSTRUCTED VALUE
          </div>

          <div style={{
            background: '#0a0a0f',
            border: '3px solid #2e334a',
            borderRadius: '10px',
            padding: '16px 20px',
            textAlign: 'center',
            boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.8), 0 0 15px rgba(255,42,133,0.05)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px', animation: 'float 3s ease-in-out infinite reverse' }}>
              {emoji}
            </div>
            
            <div className={`nixie-display ${nixieClass}`} style={{
              fontSize: '1.7rem',
              fontWeight: 'bold',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: "'Orbitron', sans-serif"
            }}>
              {gender.toUpperCase()}_BIAS
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="led-indicator led-green active" style={{ width: '8px', height: '8px' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-dim)' }}>
              ACCURACY_CONFIRMED
            </span>
          </div>

        </div>

      </div>

      <div className="divider" />

      {/* Probability breakdowns */}
      <div>
        <p style={{
          fontSize: '0.7rem',
          color: 'var(--text-dim)',
          marginBottom: '16px',
          fontWeight: 800,
          letterSpacing: '0.15em',
          fontFamily: "'Courier Prime', monospace"
        }}>
          GENDER PROBABILITY LEVELS
        </p>

        {/* Individual bars */}
        {[
          { label: 'Male Voice',   value: male_probability,   color: 'var(--phosphor-cyan)', glow: 'var(--glow-cyan)' },
          { label: 'Female Voice', value: female_probability, color: 'var(--phosphor-pink)', glow: 'var(--glow-pink)' },
        ].map(({ label, value, color: barColor, glow }) => {
          const isWinner = (isMale && label.includes('Male')) || (!isMale && label.includes('Female'));
          
          return (
            <div key={label} className="prob-row" style={{ marginBottom: '12px' }}>
              <span style={{
                fontFamily: "'Courier Prime', monospace",
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: isWinner ? 'var(--text-bright)' : 'var(--text-dim)',
                width: '110px'
              }}>
                {label.toUpperCase()}
              </span>

              <div className="prob-bar-wrap" style={{ 
                height: '12px', 
                background: '#090a0f', 
                border: '1px solid var(--panel-border)',
                borderRadius: '4px' 
              }}>
                <div 
                  className="prob-bar-fill" 
                  style={{ 
                    width: `${Math.max(value, 1)}%`, 
                    background: barColor,
                    boxShadow: isWinner ? glow : 'none',
                    borderRadius: '3px'
                  }} 
                />
              </div>

              <span className="nixie-display" style={{
                width: '56px',
                fontSize: '0.95rem',
                textAlign: 'right',
                color: isWinner ? barColor : 'var(--text-dim)',
                textShadow: isWinner ? glow : 'none'
              }}>
                {value.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Dial confidence reading indicator */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        background: '#0c0e18',
        border: `2.5px double ${accentColor}88`,
        borderRadius: '6px',
        fontSize: '0.78rem',
        color: accentColor,
        textAlign: 'center',
        fontWeight: 'bold',
        fontFamily: "'Courier Prime', monospace",
        textShadow: `0 0 4px ${accentColor}44`,
        letterSpacing: '0.05em'
      }}>
        {Math.max(male_probability, female_probability) > 85
          ? '▶ LOCK_STATE: HIGH_CONFIDENCE_SIGNAL'
          : Math.max(male_probability, female_probability) > 65
            ? '▶ LOCK_STATE: CONFIDENT_STRENGTH'
            : '▶ LOCK_STATE: DEGRADED_SIGNAL - LONGER TRACK SUGGESTED'}
      </div>

      <div className="panel-bottom-screws">
        <span>⚙</span>
        <span>⚙</span>
      </div>
    </div>
  );
}
