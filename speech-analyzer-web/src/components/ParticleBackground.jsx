import { useEffect, useRef } from 'react';

/**
 * Animated retro oscilloscope signal grid background.
 * Draws phosphor radar lines, coordinate grids, and slow sweep markers.
 */
export default function ParticleBackground() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    let sweepY = 0;
    let time = 0;

    function draw() {
      // Background base
      ctx.fillStyle = '#06060c';
      ctx.fillRect(0, 0, W, H);

      // Draw Grid Lines (Blueprint style)
      ctx.strokeStyle = 'rgba(51, 255, 102, 0.035)';
      ctx.lineWidth = 1;

      const gridSize = 60;

      // Vertical Grid
      for (let x = 0; x < W; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();

        // Draw tiny coordinate numbers sometimes
        if (x % (gridSize * 3) === 0 && x > 0 && x < W - 100) {
          ctx.fillStyle = 'rgba(51, 255, 102, 0.15)';
          ctx.font = '8px monospace';
          ctx.fillText(`FRQ_${(x / 10).toFixed(0)}`, x + 5, 15);
        }
      }

      // Horizontal Grid
      for (let y = 0; y < H; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();

        if (y % (gridSize * 2) === 0 && y > 0 && y < H - 50) {
          ctx.fillStyle = 'rgba(51, 255, 102, 0.15)';
          ctx.font = '8px monospace';
          ctx.fillText(`AMP_${(H - y).toString(16).toUpperCase()}`, 10, y - 5);
        }
      }

      // Draw Radar concentric rings in center-right background
      const centerX = W * 0.75;
      const centerY = H * 0.5;
      ctx.strokeStyle = 'rgba(51, 255, 102, 0.025)';
      for (let r = 100; r <= 500; r += 100) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw a slow sweeping Radar Beam in the background
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(time * 0.01);
      const gradSweep = ctx.createConicGradient(0, 0, 0);
      gradSweep.addColorStop(0, 'rgba(51, 255, 102, 0.05)');
      gradSweep.addColorStop(0.2, 'rgba(51, 255, 102, 0.01)');
      gradSweep.addColorStop(0.5, 'transparent');
      ctx.fillStyle = gradSweep;
      ctx.beginPath();
      ctx.arc(0, 0, 500, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Floating sine wave interference pattern (Scope wave)
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.035)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, H / 2);
      for (let x = 0; x < W; x += 10) {
        const offset = Math.sin(x * 0.003 + time * 0.005) * 50 * Math.sin(x * 0.0005) + Math.cos(x * 0.01 - time * 0.01) * 10;
        ctx.lineTo(x, H / 2 + offset);
      }
      ctx.stroke();

      // Sweeping Phosphor line (top to bottom scanning sweep)
      sweepY += 2;
      if (sweepY > H) sweepY = 0;

      ctx.fillStyle = 'rgba(51, 255, 102, 0.02)';
      ctx.fillRect(0, sweepY - 50, W, 50);

      ctx.strokeStyle = 'rgba(51, 255, 102, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, sweepY);
      ctx.lineTo(W, sweepY);
      ctx.stroke();

      time += 1;
      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    const handleResize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <div className="blueprint-grid" />
      <canvas ref={canvasRef} className="particle-canvas" />
    </>
  );
}
