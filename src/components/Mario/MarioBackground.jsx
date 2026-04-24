// frontend/src/components/Mario/MarioBackground.jsx
// Animated Mario-style sky background with clouds, pipes, and floor bricks
// Renders as a fixed background layer in mario theme

import { useEffect, useRef } from 'react';
import { useTheme } from '../../themes/ThemeContext.jsx';

// Pixel cloud shape drawn on canvas
function drawCloud(ctx, x, y, scale = 1) {
  ctx.fillStyle = '#fff';
  const w = 48 * scale, h = 24 * scale;
  // Bottom row
  ctx.fillRect(x + 8*scale, y + 16*scale, 32*scale, 8*scale);
  // Middle bumps
  ctx.fillRect(x + 4*scale, y + 8*scale,  20*scale, 16*scale);
  ctx.fillRect(x + 16*scale, y + 4*scale, 20*scale, 20*scale);
  ctx.fillRect(x + 28*scale, y + 8*scale, 16*scale, 16*scale);
  // Inner shadow
  ctx.fillStyle = 'rgba(200,220,255,0.4)';
  ctx.fillRect(x + 8*scale, y + 12*scale, 8*scale, 4*scale);
}

// Pixel pipe
function drawPipe(ctx, x, y, h = 80) {
  // Pipe body
  const g = ctx.createLinearGradient(x, 0, x+32, 0);
  g.addColorStop(0,   '#006400');
  g.addColorStop(0.3, '#00a800');
  g.addColorStop(0.7, '#009000');
  g.addColorStop(1,   '#004000');
  ctx.fillStyle = g;
  ctx.fillRect(x+2, y, 28, h);
  // Pipe rim
  const gr = ctx.createLinearGradient(x, 0, x+36, 0);
  gr.addColorStop(0,   '#004000');
  gr.addColorStop(0.3, '#00c800');
  gr.addColorStop(0.7, '#00a000');
  gr.addColorStop(1,   '#003000');
  ctx.fillStyle = gr;
  ctx.fillRect(x-2, y, 36, 14);
  ctx.fillRect(x-2, y+1, 36, 3);
  // Dark border
  ctx.fillStyle = '#002000';
  ctx.fillRect(x-2, y, 2, 14);
  ctx.fillRect(x+32, y, 4, 14);
  ctx.fillRect(x-2, y+14, 2, h-14);
  ctx.fillRect(x+30, y+14, 2, h-14);
}

// Floor bricks
function drawFloor(ctx, W, H) {
  const bw = 32, bh = 16;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col <= Math.ceil(W/bw); col++) {
      const ox = row % 2 === 0 ? 0 : bw/2;
      const bx = col * bw - ox;
      const by = H - bh * 2 + row * bh;
      // Brick fill
      ctx.fillStyle = row === 0 ? '#c84b0c' : '#b03a00';
      ctx.fillRect(bx, by, bw-2, bh-2);
      // Highlight
      ctx.fillStyle = 'rgba(255,180,100,0.25)';
      ctx.fillRect(bx, by, bw-2, 3);
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(bx, by+bh-4, bw-2, 2);
    }
  }
}

// Question block
function drawQBlock(ctx, x, y, hit = false) {
  ctx.fillStyle = hit ? '#a06000' : '#e8a020';
  ctx.fillRect(x, y, 24, 24);
  if (!hit) {
    ctx.fillStyle = '#ffd000';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('?', x+12, y+17);
  }
  ctx.fillStyle = '#8b5000';
  ctx.fillRect(x, y, 24, 2);
  ctx.fillRect(x, y+22, 24, 2);
  ctx.fillRect(x, y, 2, 24);
  ctx.fillRect(x+22, y, 2, 24);
}

export default function MarioBackground() {
  const { isMario } = useTheme();
  const canvasRef   = useRef(null);
  const rafRef      = useRef(null);
  const frameRef    = useRef(0);

  useEffect(() => {
    if (!isMario) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Clouds — static positions that slowly parallax
    const clouds = [
      { x: 80,  y: 60,  s: 1.2, speed: 0.2 },
      { x: 320, y: 40,  s: 0.9, speed: 0.15 },
      { x: 600, y: 80,  s: 1.4, speed: 0.18 },
      { x: 900, y: 50,  s: 1.0, speed: 0.22 },
      { x: 1200,y: 70,  s: 1.1, speed: 0.17 },
    ];

    // Pipes — evenly spaced
    const pipes = [
      { x: 200,  h: 70  },
      { x: 500,  h: 90  },
      { x: 800,  h: 60  },
      { x: 1100, h: 80  },
      { x: 1400, h: 70  },
    ];

    function draw() {
      frameRef.current++;
      const f  = frameRef.current;
      const W  = canvas.width;
      const H  = canvas.height;
      const ctx = canvas.getContext('2d');

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#2060e0');
      sky.addColorStop(0.6, '#5C94FC');
      sky.addColorStop(1, '#5C94FC');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Clouds (parallax scroll)
      clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -80) c.x = W + 80;
        drawCloud(ctx, c.x, c.y, c.s);
      });

      // Pipes (at bottom, on floor)
      pipes.forEach(p => {
        drawPipe(ctx, p.x % W, H - 32 - p.h, p.h);
      });

      // Question blocks (floating)
      const qblocks = [
        { x: 300, y: H * 0.45 },
        { x: 700, y: H * 0.42 },
        { x: 1000, y: H * 0.47 },
      ];
      qblocks.forEach((b, i) => {
        const bounce = Math.sin(f * 0.05 + i * 2) * 3;
        drawQBlock(ctx, b.x, b.y + bounce);
      });

      // Floor bricks
      drawFloor(ctx, W, H);

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [isMario]);

  if (!isMario) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}