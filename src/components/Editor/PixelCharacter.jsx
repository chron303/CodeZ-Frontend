// frontend/src/components/Editor/PixelCharacter.jsx
// Renders space character (dark) or Mario (mario theme)

import { useTheme } from '../../themes/ThemeContext.jsx';
import MarioPixelCharacter from '../Mario/MarioCharacter.jsx';

// ── Space character sprite (dark theme) ──────────────────────
const SPRITE = [
  [0,0,2,2,2,0,0,0],
  [0,2,1,1,1,2,0,0],
  [0,2,1,1,1,2,0,0],
  [0,0,2,2,2,0,0,0],
  [3,3,3,3,3,3,0,0],
  [0,3,3,3,3,3,0,0],
  [0,4,4,0,4,4,0,0],
  [0,5,5,0,5,5,0,0],
];
const PAL  = { 0:null, 1:'#f4c89e', 2:'#3d2b1a', 3:'#7c3aed', 4:'#1d4ed8', 5:'#111827' };
const CELL = 3;

import { useEffect, useRef } from 'react';

function SpaceCharacter({ state, passingTests }) {
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
      ctx.clearRect(0, 0, 64, 72);
      const bobY  = state === 'running' ? 0 : Math.sin(f * 0.05) * 3;
      const sx    = 32 - (SPRITE[0].length * CELL) / 2;
      const sy    = 48 - SPRITE.length * CELL + bobY;
      SPRITE.forEach((row, ry) => {
        row.forEach((c, rx) => {
          const col = PAL[c];
          if (!col) return;
          let dy = 0;
          if (ry >= 6 && state === 'running') dy = rx < 4 ? Math.sin(f*0.25)*2.5 : -Math.sin(f*0.25)*2.5;
          ctx.fillStyle = col;
          ctx.fillRect(sx + rx*CELL, sy + ry*CELL + dy, CELL-0.5, CELL-0.5);
        });
      });
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [state]);

  return (
    <canvas ref={canvasRef} width={64} height={72}
      style={{ imageRendering: 'pixelated' }}/>
  );
}

export default function PixelCharacter({ state, passingTests }) {
  const { isMario } = useTheme();
  if (isMario) return <MarioPixelCharacter state={state} passingTests={passingTests}/>;
  return <SpaceCharacter state={state} passingTests={passingTests}/>;
}