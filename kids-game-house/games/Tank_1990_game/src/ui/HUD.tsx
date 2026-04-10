// ─────────────────────────────────────────────
//  src/ui/HUD.tsx
//  In-game heads-up display rendered by React
//  on top of the Phaser canvas.
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

function Label({ children, color = '#555' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ fontFamily: FONT, fontSize: 7, color, marginBottom: 2, letterSpacing: 1 }}>
      {children}
    </div>
  );
}

function Value({ children, color = '#fff' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ fontFamily: FONT, fontSize: 11, color, marginBottom: 8, letterSpacing: 1 }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ width: '100%', height: 1, background: '#1e1e1e', margin: '4px 0 8px' }} />;
}

function Stars({ count }: { count: number }) {
  return (
    <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
      {[0, 1, 2, 3].map(i => (
        <span
          key={i}
          style={{
            fontFamily: FONT,
            fontSize:   10,
            color:      i < count ? '#ffdd00' : '#2a2a2a',
            textShadow: i < count ? '0 0 6px #ffaa00' : 'none',
          }}
        >
          ★
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
    padding:         '8px 6px',
    pointerEvents:   'none',
    boxSizing:       'border-box',
    userSelect:      'none',
  };

  const shieldGlow: CSSProperties = hud.shieldActive
    ? { textShadow: '0 0 8px #00eeff', color: '#00eeff' }
    : {};

  const frozenStyle: CSSProperties = hud.frozen
    ? { color: '#88ccff' }
    : {};

  return (
    <div style={panel}>
      {/* Score */}
      <Label>SCORE</Label>
      <Value color="#ffdd00">{String(hud.score).padStart(6, '0')}</Value>

      <Label>BEST</Label>
      <Value color="#ff6666">{String(hud.highScore).padStart(6, '0')}</Value>

      <Divider />

      {/* Stage */}
      <Label>STAGE</Label>
      <Value color="#ffaa00">{hud.level + 1}</Value>

      {/* Enemies left */}
      <Label color={hud.frozen ? '#88ccff' : '#555'}>
        {hud.frozen ? 'FROZEN' : 'ENEMY'}
      </Label>
      <Value color={hud.frozen ? '#88ccff' : '#ff4444'} {...frozenStyle}>
        {String(hud.enemiesLeft).padStart(2, '0')}
      </Value>

      {/* Lives */}
      <Label>LIVES</Label>
      <Value color="#44ff88">{String(hud.lives).padStart(2, '0')}</Value>

      <Divider />

      {/* Star level */}
      <Label>POWER</Label>
      <Stars count={hud.starLevel} />

      {/* Shield indicator */}
      {hud.shieldActive && (
        <div
          style={{
            fontFamily: FONT,
            fontSize:   7,
            color:      '#00eeff',
            marginBottom: 6,
            animation: 'hudPulse 0.5s infinite alternate',
            ...shieldGlow,
          }}
        >
          ◈ SHIELD
        </div>
      )}

      {/* Controls reminder (bottom) */}
      <div style={{ marginTop: 'auto' }}>
        <Divider />
        {[
          ['↑↓←→', 'Move'],
          ['SPC',  'Fire'],
          ['ESC',  'Pause'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: FONT, fontSize: 6, color: '#ffaa00' }}>{k}</span>
            <span style={{ fontFamily: FONT, fontSize: 6, color: '#444' }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Inline keyframes for shield pulse */}
      <style>{`
        @keyframes hudPulse {
          from { opacity: 0.5; }
          to   { opacity: 1.0; }
        }
      `}</style>
    </div>
  );
};
