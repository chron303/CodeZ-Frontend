// frontend/src/components/Mario/MarioCharacter.jsx
// Pixel Mario sprite — replaces the space character in mario theme

import { useEffect, useRef } from 'react';
import { useTheme } from '../../themes/ThemeContext.jsx';

// Mario pixel art — 16x16 grid
// Colors: 0=transparent, 1=skin, 2=hair/shoe, 3=red, 4=blue, 5=brown
const MARIO_STAND = [
  [0,0,0,3,3,3,3,3,0,0,0,0,0,0,0,0],
  [0,0,3,3,3,3,3,3,3,3,3,0,0,0,0,0],
  [0,0,2,2,2,1,1,2,1,0,0,0,0,0,0,0],
  [0,2,1,2,1,1,1,2,1,1,1,0,0,0,0,0],
  [0,2,1,2,2,1,1,1,2,1,1,1,0,0,0,0],
  [0,2,2,1,1,1,1,2,2,2,2,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,3,3,4,3,3,3,0,0,0,0,0,0,0,0],
  [0,3,3,3,4,3,3,4,3,3,3,0,0,0,0,0],
  [3,3,3,3,4,4,4,4,3,3,3,3,0,0,0,0],
  [1,1,3,4,4,4,4,4,4,3,1,1,0,0,0,0],
  [1,1,1,4,4,0,0,4,4,1,1,1,0,0,0,0],
  [1,1,4,4,0,0,0,0,4,4,1,0,0,0,0,0],
  [0,2,2,2,0,0,0,0,2,2,2,0,0,0,0,0],
  [0,2,2,2,0,0,0,0,2,2,2,0,0,0,0,0],
  [0,2,2,0,0,0,0,0,0,2,2,0,0,0,0,0],
];

const MARIO_JUMP = [
  [0,0,0,3,3,3,3,3,0,0,0,0,0,0,0,0],
  [0,0,3,3,3,3,3,3,3,3,3,0,0,0,0,0],
  [0,0,2,2,2,1,1,2,1,0,0,0,0,0,0,0],
  [0,2,1,2,1,1,1,2,1,1,1,0,0,0,0,0],
  [0,2,1,2,2,1,1,1,2,1,1,1,0,0,0,0],
  [0,2,2,1,1,1,1,2,2,2,2,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,3,3,4,3,3,3,0,0,0,0,0,0,0,0],
  [0,3,3,3,4,3,3,4,3,3,3,0,0,0,0,0],
  [3,3,3,3,4,4,4,4,3,3,3,3,0,0,0,0],
  [1,1,3,4,4,4,4,4,4,3,1,1,0,0,0,0],
  [1,1,4,4,1,0,0,1,4,4,1,0,0,0,0,0],
  [0,1,4,1,1,0,0,1,1,4,0,0,0,0,0,0],
  [0,2,4,2,0,0,0,0,2,4,2,0,0,0,0,0],
  [0,2,2,2,2,0,0,2,2,2,2,0,0,0,0,0],
  [0,0,2,2,0,0,0,0,2,2,0,0,0,0,0,0],
];

const PAL = {
  0: null,
  1: '#f4c89e',  // skin
  2: '#6b3100',  // dark brown
  3: '#e52521',  // Mario red
  4: '#0042a0',  // Mario blue
  5: '#c84b0c',  // brown
};

const CELL = 3;

function drawMario(ctx, sprite, cx, cy) {
  const startX = cx - (16 * CELL) / 2;
  const startY = cy - (16 * CELL);
  sprite.forEach((row, ry) => {
    row.forEach((c, rx) => {
      const color = PAL[c];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(startX + rx * CELL, startY + ry * CELL, CELL - 0.5, CELL - 0.5);
    });
  });
}

export { drawMario, MARIO_STAND, MARIO_JUMP, CELL };

// Drop-in replacement for PixelCharacter in mario theme
export default function MarioPixelCharacter({ state, passingTests }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const frameRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      frameRef.current++;
      const f   = frameRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 80, 96);

      let sprite = MARIO_STAND;
      let offsetY = 0;

      if (state === 'running' || state === 'jumping') {
        // Walking animation — alternate frames
        sprite = f % 20 < 10 ? MARIO_JUMP : MARIO_STAND;
        offsetY = Math.abs(Math.sin(f * 0.2)) * -8;
      } else if (state === 'victory') {
        // Jump for joy
        sprite = MARIO_JUMP;
        offsetY = -Math.abs(Math.sin(f * 0.15)) * 20;
        // Draw star/coin above
        if (f % 30 < 15) {
          ctx.fillStyle = '#fbd000';
          ctx.font = '16px serif';
          ctx.textAlign = 'center';
          ctx.fillText('⭐', 40, 12 + offsetY);
        }
      } else if (state === 'sad') {
        // Mario face-plants
        sprite = MARIO_STAND;
        ctx.save();
        ctx.translate(40, 48);
        ctx.rotate(0.3);
        ctx.translate(-40, -48);
        drawMario(ctx, sprite, 40, 72 + offsetY);
        ctx.restore();
        rafRef.current = requestAnimationFrame(draw);
        return;
      } else {
        // Idle — subtle bob
        offsetY = Math.sin(f * 0.05) * 2;
      }

      drawMario(ctx, sprite, 40, 72 + offsetY);
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [state, passingTests]);

  return (
    <div className="flex flex-col items-center gap-1">
      <canvas ref={canvasRef} width={80} height={96}
        style={{ imageRendering: 'pixelated' }}/>
      {passingTests > 0 && state === 'victory' && (
        <div className="flex gap-0.5">
          {Array.from({ length: Math.min(passingTests, 5) }).map((_, i) => (
            <span key={i} className="text-yellow-400" style={{ fontSize: 10 }}>★</span>
          ))}
        </div>
      )}
    </div>
  );
}