// ─────────────────────────────────────────────
//  src/ui/HUD.tsx
//  经典坦克大战风格的HUD显示
// ─────────────────────────────────────────────

import React, { useEffect, useState, CSSProperties } from 'react';
import { EventBus } from '../game/EventBus';
import { HUDState } from '../types';
import { HUD_W, GAME_H, MAP_W } from '../game/config';

const FONT = '"Press Start 2P", "Courier New", monospace';

const defaultHUD: HUDState = {
  score:        0,
  highScore:    +(localStorage.getItem('bc_hs') ?? 0),
  lives:        3,
  level:        0,
  enemiesLeft:  0,
  starLevel:    0,
  shieldActive: false,
  frozen:       false,
};

// ── Sub-components ────────────────────────────

function Label({ children, color = '#888' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ 
      fontFamily: FONT, 
      fontSize: 8, 
      color, 
      marginBottom: 3, 
      letterSpacing: 2,
      textTransform: 'uppercase' as const
    }}>
      {children}
    </div>
  );
}

function Value({ children, color = '#fff' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ 
      fontFamily: FONT, 
      fontSize: 12, 
      color, 
      marginBottom: 10, 
      letterSpacing: 2,
      textAlign: 'center' as const
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ 
    width: '100%', 
    height: 2, 
    background: '#333', 
    margin: '8px 0 12px',
    borderTop: '1px solid #555'
  }} />;
}

function Stars({ count }: { count: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 10 }}>
      {[0, 1, 2, 3].map(i => (
        <span
          key={i}
          style={{
            fontFamily: FONT,
            fontSize:   12,
            color:      i < count ? '#ff0' : '#333',
            textShadow: i < count ? '0 0 4px #ff0' : 'none',
          }}
        >
          ☆
        </span>
      ))}
    </div>
  );
}

// ── Main HUD component ────────────────────────

interface HUDProps {
  /** Whether the game is currently active (hides HUD on menu/gameover) */
  visible: boolean;
}

export const HUD: React.FC<HUDProps> = ({ visible }) => {
  const [hud, setHud] = useState<HUDState>(defaultHUD);

  useEffect(() => {
    const handler = (state: HUDState) => setHud(state);
    EventBus.on('hud-update', handler);
    return () => EventBus.off('hud-update', handler);
  }, []);

  if (!visible) return null;

  const panel: CSSProperties = {
    position:        'absolute',
    top:             0,
    left:            MAP_W + 2,
    width:           HUD_W - 2,
    height:          GAME_H,
    display:         'flex',
    flexDirection:   'column',
    padding:         '12px 6px',
    pointerEvents:   'none',
    boxSizing:       'border-box',
    userSelect:      'none',
    background:      '#000',
    borderLeft:      '2px solid #333'
  };

  const shieldGlow: CSSProperties = hud.shieldActive
    ? { textShadow: '0 0 10px #0ff', color: '#0ff' }
    : {};

  const frozenStyle: CSSProperties = hud.frozen
    ? { color: '#8cf' }
    : {};

  return (
    <div style={panel}>
      {/* Score */}
      <Label color="#ff0">SCORE</Label>
      <Value color="#ff0">{String(hud.score).padStart(6, '0')}</Value>

      <Label color="#f00">HI-SCORE</Label>
      <Value color="#f00">{String(hud.highScore).padStart(6, '0')}</Value>

      <Divider />

      {/* Stage */}
      <Label color="#0f0">STAGE</Label>
      <Value color="#0f0">{String(hud.level + 1).padStart(2, '0')}</Value>

      {/* Enemies left */}
      <Label color={hud.frozen ? '#8cf' : '#f80'}>
        {hud.frozen ? 'FREEZE' : 'ENEMY'}
      </Label>
      <Value color={hud.frozen ? '#8cf' : '#f80'} {...frozenStyle}>
        {String(hud.enemiesLeft).padStart(2, '0')}
      </Value>

      {/* Lives */}
      <Label color="#0ff">LIFE</Label>
      <Value color="#0ff">{String(hud.lives).padStart(2, '0')}</Value>

      <Divider />

      {/* Star level */}
      <Label color="#ff0">POWER</Label>
      <Stars count={hud.starLevel} />

      {/* Shield indicator */}
      {hud.shieldActive && (
        <div
          style={{
            fontFamily: FONT,
            fontSize:   8,
            color:      '#0ff',
            marginBottom: 8,
            textAlign: 'center' as const,
            animation: 'hudPulse 0.4s infinite alternate',
            ...shieldGlow,
          }}
        >
          ◆ SHIELD
        </div>
      )}
      
      {/* Frozen indicator */}
      {hud.frozen && (
        <div
          style={{
            fontFamily: FONT,
            fontSize:   8,
            color:      '#8cf',
            marginBottom: 8,
            textAlign: 'center' as const,
            animation: 'hudPulse 0.6s infinite alternate',
          }}
        >
          ❄ FREEZE
        </div>
      )}

      {/* Controls reminder (bottom) */}
      <div style={{ marginTop: 'auto' }}>
        <Divider />
        {[
          ['↑↓←→', 'MOVE'],
          ['SPC',  'FIRE'],
          ['ESC',  'PAUSE'],
        ].map(([k, v]) => (
          <div key={k} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: 6,
            padding: '2px 4px'
          }}>
            <span style={{ fontFamily: FONT, fontSize: 7, color: '#ff0' }}>{k}</span>
            <span style={{ fontFamily: FONT, fontSize: 7, color: '#888' }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Inline keyframes for shield pulse */}
      <style>{`
        @keyframes hudPulse {
          from { opacity: 0.4; transform: scale(0.95); }
          to   { opacity: 1.0; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};
