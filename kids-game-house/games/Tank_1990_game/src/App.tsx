// ─────────────────────────────────────────────
//  src/App.tsx
//  Root React component.
//  Manages game state, creates the Phaser game
//  instance, and renders the correct UI overlay.
// ─────────────────────────────────────────────

import React, { useEffect, useRef, useState, useCallback, CSSProperties } from 'react';
import Phaser from 'phaser';

import { PHASER_CONFIG, GAME_W, GAME_H } from './game/config';
import { EventBus } from './game/EventBus';

import { BootScene }          from './game/scenes/BootScene';
import { PreloadScene }        from './game/scenes/PreloadScene';
import { MenuScene }           from './game/scenes/MenuScene';
import { GameScene }           from './game/scenes/GameScene';
import { GameOverScene, LevelCompleteScene } from './game/scenes/GameOverScene';

import { MainMenu }   from './ui/MainMenu';
import { HUD }        from './ui/HUD';
import { PauseMenu }  from './ui/PauseMenu';
import { PowerUpNotification } from './ui/PowerUpNotification';

// ── UI State machine ──────────────────────────
type UILayer = 'menu' | 'playing' | 'paused' | 'gameover' | 'level-complete';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef      = useRef<Phaser.Game | null>(null);
  const [layer, setLayer] = useState<UILayer>('menu');
  const [scale, setScale] = useState(1);

  // ── Responsive scaling for PC ─────────────
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      
      const maxWidth = window.innerWidth * 0.9;  // 90% of viewport width
      const maxHeight = window.innerHeight * 0.9; // 90% of viewport height
      
      const scaleX = maxWidth / GAME_W;
      const scaleY = maxHeight / GAME_H;
      
      // Use the smaller scale to fit both dimensions
      const newScale = Math.min(scaleX, scaleY, 2); // Max 2x scale
      
      // Only update if scale changed significantly
      if (Math.abs(newScale - scale) > 0.05) {
        setScale(Math.max(1, newScale)); // Minimum 1x scale
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    
    return () => window.removeEventListener('resize', updateScale);
  }, [scale]);

  // ── Bootstrap Phaser once ─────────────────
  useEffect(() => {
    if (gameRef.current) return;

    const game = new Phaser.Game({
      ...PHASER_CONFIG,
      parent: containerRef.current!,
      scene:  [
        BootScene,
        PreloadScene,
        MenuScene,
        GameScene,
        GameOverScene,
        LevelCompleteScene,
      ],
    });
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // ── EventBus listeners ───────────────────
  useEffect(() => {
    const onReady   = (scene: Phaser.Scene) => {
      switch (scene.scene.key) {
        case 'Menu':          setLayer('menu');           break;
        case 'Game':          setLayer('playing');        break;
        case 'GameOver':      setLayer('gameover');       break;
        case 'LevelComplete': setLayer('level-complete'); break;
      }
    };
    const onPaused  = () => setLayer('paused');
    const onResumed = () => setLayer('playing');

    EventBus.on('scene-ready',  onReady);
    EventBus.on('game-paused',  onPaused);
    EventBus.on('game-resumed', onResumed);

    return () => {
      EventBus.off('scene-ready',  onReady);
      EventBus.off('game-paused',  onPaused);
      EventBus.off('game-resumed', onResumed);
    };
  }, []);

  // ── Actions ───────────────────────────────
  const startGame = useCallback(() => {
    gameRef.current?.scene.start('Game', { level: 0, lives: 3, score: 0 });
    setLayer('playing');
  }, []);

  const handleResume  = useCallback(() => { EventBus.emit('resume-game');    setLayer('playing'); }, []);
  const handleRestart = useCallback(() => { EventBus.emit('restart-game');   setLayer('playing'); }, []);
  const handleMenu    = useCallback(() => { EventBus.emit('menu-requested'); setLayer('menu');    }, []);

  // ── Layout ────────────────────────────────
  const wrapStyle: CSSProperties = {
    position: 'relative',
    width:    GAME_W,
    height:   GAME_H,
    boxShadow:'0 0 60px rgba(255,200,0,0.12), 0 0 120px rgba(255,100,0,0.06)',
    overflow: 'hidden',
    // Apply responsive scale
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
  };

  const canvasWrap: CSSProperties = {
    position: 'absolute',
    inset:    0,
  };

  const uiLayer: CSSProperties = {
    position: 'absolute',
    inset:    0,
    pointerEvents: 'none',
  };

  return (
    <div style={wrapStyle}>
      {/* Phaser canvas is rendered here */}
      <div ref={containerRef} style={canvasWrap} />

      {/* React UI overlays */}
      <div style={uiLayer}>
        {/* Main menu */}
        {layer === 'menu' && (
          <MainMenu onStart={startGame} />
        )}

        {/* In-game HUD (right-panel) */}
        <HUD visible={layer === 'playing' || layer === 'paused'} />

        {/* PowerUp Notification */}
        <PowerUpNotification />

        {/* Pause overlay */}
        {layer === 'paused' && (
          <PauseMenu
            onResume={handleResume}
            onRestart={handleRestart}
            onMenu={handleMenu}
          />
        )}
      </div>
    </div>
  );
};
