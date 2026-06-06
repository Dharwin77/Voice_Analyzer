import { useEffect, useRef } from 'react';

/**
 * Authentic Phosphor Vector Oscilloscope.
 * Uses Web Audio API time-domain data to render a continuous green trace line.
 * Features background calibration grid lines and static scanlines.
 */
export default function WaveformVisualizer({ stream, isRecording }) {
  const canvasRef    = useRef(null);
  const animRef      = useRef(null);
  const analyserRef  = useRef(null);
  const sourceRef    = useRef(null);
  const ctxAudioRef  = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = 600;
    const H = canvas.height = 100;

    let phase = 0;



    if (isRecording && stream) {
      // Set up real time-domain audio analyzer
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.6;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      ctxAudioRef.current = audioCtx;
      analyserRef.current = analyser;
      sourceRef.current   = source;

      const bufferLen = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLen);

      function draw() {
        animRef.current = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);

        // Clear canvas with trace persistence (glowing trail effect)
        ctx.fillStyle = 'rgba(8, 14, 10, 0.25)';
        ctx.fillRect(0, 0, W, H);

        drawGrid(ctx, W, H);

        // Draw time-domain signal path
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#33ff66';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#33ff66';

        const sliceW = W / bufferLen;
        let x = 0;

        for (let i = 0; i < bufferLen; i++) {
          const v = dataArray[i] / 128.0; // Normalized between 0 and 2
          const y = (v * H) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            // Draw slightly curved bezier or line
            ctx.lineTo(x, y);
          }
          x += sliceW;
        }

        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow
      }

      draw();

    } else {
      // Idle calibration hum — gentle electric hum wave
      function drawIdle() {
        animRef.current = requestAnimationFrame(drawIdle);

        ctx.fillStyle = 'rgba(8, 14, 10, 0.2)';
        ctx.fillRect(0, 0, W, H);

        drawGrid(ctx, W, H);

        ctx.beginPath();
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = 'rgba(51, 255, 102, 0.7)';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#33ff66';

        ctx.moveTo(0, H / 2);
        for (let x = 0; x < W; x++) {
          // Draw standard hum wave (60Hz look) with a tiny bit of random jitter
          const jitter = (Math.random() - 0.5) * 0.8;
          const y = H / 2 + Math.sin(x * 0.045 + phase) * 8 * Math.sin(x * 0.005) + jitter;
          ctx.lineTo(x, y);
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
        phase += 0.08;
      }
      drawIdle();
    }

    return () => {
      cancelAnimationFrame(animRef.current);
      if (sourceRef.current)    try { sourceRef.current.disconnect(); }   catch {}
      if (ctxAudioRef.current)  try { ctxAudioRef.current.close(); }      catch {}
      sourceRef.current    = null;
      ctxAudioRef.current  = null;
      analyserRef.current  = null;
    };
  }, [stream, isRecording]);

  // Sub-helper to draw oscilloscope grid markings
  function drawGrid(ctx, w, h) {
    ctx.strokeStyle = 'rgba(51, 255, 102, 0.08)';
    ctx.lineWidth = 0.5;

    // Draw grid lines every 20px
    for (let x = 20; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 20; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Bold center horizontal & vertical axes
    ctx.strokeStyle = 'rgba(51, 255, 102, 0.2)';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    // Calibration tick marks on axes
    ctx.fillStyle = 'rgba(51, 255, 102, 0.4)';
    for (let tx = 10; tx < w; tx += 10) {
      ctx.fillRect(tx, h / 2 - 2, 1, 4);
    }
    for (let ty = 5; ty < h; ty += 5) {
      ctx.fillRect(w / 2 - 2, ty, 4, 1);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={100}
        style={{
          display: 'block',
          width: '100%',
          height: '110px',
          borderRadius: '4px',
          imageRendering: 'pixelated',
        }}
      />
      {/* Glare and bezel reflection */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)',
        pointerEvents: 'none',
        borderRadius: '4px',
      }} />
    </div>
  );
}
