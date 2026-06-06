import { useEffect, useRef, useState } from 'react';

const EMOTIONS = [
  { id: 'neutral', emoji: '😐', angle: 0   , label: 'NEUTRAL' },
  { id: 'calm',    emoji: '😌', angle: 40  , label: 'CALM'    },
  { id: 'happy',   emoji: '😄', angle: 80  , label: 'HAPPY'   },
  { id: 'sad',     emoji: '😢', angle: 120 , label: 'SAD'     },
  { id: 'angry',   emoji: '😡', angle: 160 , label: 'ANGRY'   },
  { id: 'fear',    emoji: '😨', angle: 200 , label: 'FEAR'    },
  { id: 'disgust', emoji: '🤢', angle: 240 , label: 'DISGUST' },
  { id: 'ps',      emoji: '😮', angle: 280 , label: 'SURPRISE'},
  { id: 'boredom', emoji: '😴', angle: 320 , label: 'BOREDOM' },
];

function polarToXY(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/**
 * Sonar Radar vectorscope display.
 * Includes a rotating sonar beam sweep, grids, and target lock crosshairs.
 */
export default function EmotionWheel({ prediction, probabilities }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const [rotation, setRotation] = useState(0);

  const CX = 150, CY = 150, R_MAX = 125, R_GRID = [40, 80, 120];

  // Rotate sonar beam continuously in the background
  useEffect(() => {
    let currentRot = 0;
    function rotateBeam() {
      currentRot = (currentRot + 1.2) % 360;
      setRotation(currentRot);
      animRef.current = requestAnimationFrame(rotateBeam);
    }
    rotateBeam();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div className="radar-grid" style={{ width: '300px', height: '300px', position: 'relative' }}>
        
        {/* Rotating Radar Beam */}
        <div 
          className="radar-sweep-beam" 
          style={{ transform: `rotate(${rotation}deg)` }}
        />

        {/* Sonar Vector Screen Graphics */}
        <svg 
          viewBox="0 0 300 300" 
          width="100%" 
          height="100%" 
          style={{ position: 'absolute', inset: 0, zIndex: 2 }}
        >
          {/* Radial Grid lines */}
          {R_GRID.map(r => (
            <circle 
              key={r} 
              cx={CX} cy={CY} r={r} 
              fill="none" 
              stroke="rgba(51, 255, 102, 0.15)" 
              strokeWidth="0.8" 
              strokeDasharray="4 4" 
            />
          ))}

          {/* Core scope axes */}
          <line x1={CX - R_MAX} y1={CY} x2={CX + R_MAX} y2={CY} stroke="rgba(51, 255, 102, 0.25)" strokeWidth="1" />
          <line x1={CX} y1={CY - R_MAX} x2={CX} y2={CY + R_MAX} stroke="rgba(51, 255, 102, 0.25)" strokeWidth="1" />

          {/* Angular Ticks and Labels */}
          {EMOTIONS.map((e, idx) => {
            const edgePoint = polarToXY(CX, CY, R_MAX, e.angle);
            const textPoint = polarToXY(CX, CY, R_MAX + 15, e.angle);
            const tickPoint = polarToXY(CX, CY, R_MAX - 8, e.angle);
            const isActive  = prediction === e.id;

            return (
              <g key={e.id}>
                {/* Sonar sweep target grid line */}
                <line 
                  x1={CX} y1={CY} 
                  x2={edgePoint.x} y2={edgePoint.y} 
                  stroke={isActive ? 'rgba(51, 255, 102, 0.4)' : 'rgba(51, 255, 102, 0.06)'} 
                  strokeWidth="0.8" 
                />
                
                {/* Target Ticks */}
                <line 
                  x1={tickPoint.x} y1={tickPoint.y} 
                  x2={edgePoint.x} y2={edgePoint.y} 
                  stroke={isActive ? 'var(--phosphor-green)' : 'rgba(51, 255, 102, 0.3)'} 
                  strokeWidth={isActive ? '2' : '1'} 
                />

                {/* Target text (e.g. happy/sad) */}
                <text 
                  x={textPoint.x} 
                  y={textPoint.y} 
                  fill={isActive ? 'var(--text-green)' : 'var(--text-dim)'} 
                  fontSize="8" 
                  fontFamily="'Courier Prime', monospace"
                  fontWeight={isActive ? 'bold' : 'normal'}
                  textAnchor="middle" 
                  dominantBaseline="middle"
                  style={{
                    textShadow: isActive ? 'var(--glow-green)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {e.label}
                </text>
              </g>
            );
          })}

          {/* Locking crosshair if target matches */}
          {prediction && (() => {
            const target = EMOTIONS.find(e => e.id === prediction);
            if (!target) return null;
            
            // Calculate coordinates for locking (based on confidence if available)
            const confidence = probabilities ? (probabilities[prediction] || 100) : 100;
            const targetRadius = R_INNER_CALC(confidence);
            const targetCoords = polarToXY(CX, CY, targetRadius, target.angle);

            function R_INNER_CALC(conf) {
              // map 0-100 to R_GRID rings
              return 40 + (conf / 100.0) * 80;
            }

            return (
              <g style={{ transition: 'all 0.5s ease' }}>
                {/* Vector pointer lines */}
                <line 
                  x1={CX} y1={CY} 
                  x2={targetCoords.x} y2={targetCoords.y} 
                  stroke="#33ff66" 
                  strokeWidth="1.5" 
                  strokeDasharray="2 2"
                  style={{ filter: 'drop-shadow(0 0 4px #33ff66)' }}
                />

                {/* Blip Target Crosshair */}
                <g transform={`translate(${targetCoords.x}, ${targetCoords.y})`}>
                  <circle r="6" fill="none" stroke="#33ff66" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 4px #33ff66)' }} />
                  <circle r="1" fill="#33ff66" />
                  <line x1="-10" y1="0" x2="10" y2="0" stroke="#33ff66" strokeWidth="0.8" />
                  <line x1="0" y1="-10" x2="0" y2="10" stroke="#33ff66" strokeWidth="0.8" />
                </g>
              </g>
            );
          })()}

          {/* Center core */}
          <circle cx={CX} cy={CY} r="6" fill="#030a05" stroke="var(--phosphor-green)" strokeWidth="1.5" />
        </svg>

        {/* CRT Glass reflection cover */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 3,
          borderRadius: '50%'
        }} />
      </div>
    </div>
  );
}
