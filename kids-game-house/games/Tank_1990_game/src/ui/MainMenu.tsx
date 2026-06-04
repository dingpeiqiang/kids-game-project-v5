
//  src/ui/MainMenu.tsx
//  React main-menu overlay rendered over the
//  Phaser canvas background.

import React, { useEffect, useState, CSSProperties } from 'react';
import { GAME_W, GAME_H, HS_KEY } from '../game/config';
import { EventBus } from '../game/EventBus';

const FONT = '"Press Start 2P", "Courier New", monospace';

interface MainMenuProps {
  /** Called when the player wants to start a new game */
  onStart: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
  const [highScore] = useState(() => +(localStorage.getItem(HS_KEY) ?? 0));
  const [blink, setBlink] = useState(true);
  const [tankDir, setTankDir] = useState(0);
  const [tankFrame, setTankFrame] = useState(0);

  // Blink prompt
  useEffect(() => {
    const id = setInterval(() => setBlink(b => !b), 500);
    return () => clearInterval(id);
  }, []);

  // Demo tank rotation
  useEffect(() => {
    let t = 0;
    const id = setInterval(() => {
      t++;
      setTankFrame(Math.floor(t / 10) % 2);
      if (t % 80 === 0) setTankDir(d => (d + 1) % 4);
    }, 40);
    return () => clearInterval(id);
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') onStart();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onStart]);

  const overlay: CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    userSelect: 'none',
    pointerEvents: 'auto',
  };

  const title = (text: string, color: string, size: number): CSSProperties => ({
    fontFamily: FONT,
    fontSize: size,
    color,
    textShadow: `0 0 20px ${color}55`,
    letterSpacing: 3,
    marginBottom: 4,
  });

  return (
    <div style={overlay}>
      {/* Title */}
      <div style={title('', '#ffdd00', 44)}>BATTLE</div>
      <div style={{ ...title('', '#ff4400', 44), marginBottom: 18 }}>CITY</div>

      <div style={{ fontFamily: FONT, fontSize: 8, color: '#555', marginBottom: 20, letterSpacing: 2 }}>
        ── TANK 1990 ──
      </div>

      {/* Enemy legend */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 24, alignItems: 'flex-start' }}>
        {([
          ['BASIC', '100 pts', '#c0c0c0'],
          ['FAST', '200 pts', '#ff9900'],
          ['ARMORED', '400 pts', '#5577cc'],
        ] as const).map(([name, pts, clr]) => (
          <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 32, height: 32,
              background: clr,
              borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 8px ${clr}66`,
            }}>
              <span style={{ fontFamily: FONT, fontSize: 16, color: '#000' }}>▲</span>
            </div>
            <span style={{ fontFamily: FONT, fontSize: 5, color: '#888' }}>{name}</span>
            <span style={{ fontFamily: FONT, fontSize: 5, color: '#666' }}>{pts}</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        {([
          ['ARROW / WASD', 'MOVE'],
          ['SPACE', 'FIRE'],
          ['ESC', 'PAUSE'],
        ] as const).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontFamily: FONT, fontSize: 7, color: '#ffaa00', minWidth: 110, textAlign: 'right' }}>{k}</span>
            <span style={{ fontFamily: FONT, fontSize: 7, color: '#444' }}>—</span>
            <span style={{ fontFamily: FONT, fontSize: 7, color: '#888' }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Start prompt */}
      <button
        onClick={onStart}
        style={{
          fontFamily: FONT,
          fontSize: 10,
          color: blink ? '#ffdd00' : 'rgba(255,221,0,0.2)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          letterSpacing: 2,
          padding: '10px 20px',
          transition: 'color 0.1s',
          marginBottom: 14,
        }}
      >
        ◄ PRESS SPACE TO START ►
      </button>

      {/* High score */}
      <div style={{ fontFamily: FONT, fontSize: 8, color: '#555', letterSpacing: 1 }}>
        HIGH SCORE&nbsp;&nbsp;{String(highScore).padStart(6, '0')}
      </div>

      {/* Levels preview */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        display: 'flex',
        gap: 12,
      }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{
            fontFamily: FONT, fontSize: 6, color: '#333',
            border: '1px solid #222', padding: '3px 6px', borderRadius: 2,
          }}>
            STAGE {s}
          </div>
        ))}
      </div>
    </div>
  );
};
