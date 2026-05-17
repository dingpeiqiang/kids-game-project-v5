
//  src/ui/PauseMenu.tsx

import React, { useEffect, CSSProperties } from 'react';
import { EventBus } from '../game/EventBus';

const FONT = '"Press Start 2P", "Courier New", monospace';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onRestart, onMenu }) => {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'Space') onResume();
      if (e.code === 'KeyR') onRestart();
      if (e.code === 'KeyM') onMenu();
    };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onResume, onRestart, onMenu]);

  const overlay: CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.82)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    userSelect: 'none',
    pointerEvents: 'auto',
  };

  const btn = (label: string, hint: string, onClick: () => void, color = '#aaa'): React.ReactNode => (
    <button
      key={label}
      onClick={onClick}
      style={{
        fontFamily: FONT,
        fontSize: 10,
        color,
        background: 'transparent',
        border: '1px solid #222',
        padding: '8px 20px',
        cursor: 'pointer',
        letterSpacing: 1,
        minWidth: 220,
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        transition: 'border-color 0.2s, color 0.2s',
      }}
      onMouseEnter={e => { (e.currentTarget.style.borderColor = color); }}
      onMouseLeave={e => { (e.currentTarget.style.borderColor = '#222'); }}
    >
      <span>{label}</span>
      <span style={{ color: '#444', fontSize: 8 }}>[{hint}]</span>
    </button>
  );

  return (
    <div style={overlay}>
      <div style={{ fontFamily: FONT, fontSize: 28, color: '#ffdd00', letterSpacing: 4, marginBottom: 10 }}>
        PAUSED
      </div>
      {btn('RESUME', 'ESC', onResume, '#ffffff')}
      {btn('RESTART LEVEL', 'R', onRestart, '#ffaa00')}
      {btn('MAIN MENU', 'M', onMenu, '#ff6666')}
    </div>
  );
};
