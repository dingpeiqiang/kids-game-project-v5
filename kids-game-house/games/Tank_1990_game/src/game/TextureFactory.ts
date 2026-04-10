// ─────────────────────────────────────────────
//  src/game/TextureFactory.ts
//  All game sprites are generated at runtime via
//  HTML Canvas so the project works without PNG assets.
//  Drop real spritesheets into public/assets/ and
//  load them in PreloadScene to replace these.
// ─────────────────────────────────────────────

import Phaser from 'phaser';
import { Direction } from '../types';

type Ctx = CanvasRenderingContext2D;

// ── Helpers ───────────────────────────────────
const mk = (w: number, h: number): [HTMLCanvasElement, Ctx] => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')!];
};

const add = (scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement) => {
  if (!scene.textures.exists(key)) scene.textures.addCanvas(key, canvas);
};

function lighten(hex: string, a: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgb(${Math.min(255, ((n >> 16) & 0xff) + a)},${Math.min(255, ((n >> 8) & 0xff) + a)},${Math.min(255, (n & 0xff) + a)})`;
}
function darken(hex: string, a: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgb(${Math.max(0, ((n >> 16) & 0xff) - a)},${Math.max(0, ((n >> 8) & 0xff) - a)},${Math.max(0, (n & 0xff) - a)})`;
}

// ── Tank drawing sub-routine ──────────────────
function drawTankBody(
  ctx: Ctx,
  dir: Direction,
  frame: number,
  body: string,
  track: string,
  turret: string,
) {
  // Tracks
  ctx.fillStyle = frame === 0 ? track : lighten(track, 18);
  ctx.fillRect(0, 0, 3, 16); ctx.fillRect(13, 0, 3, 16);
  ctx.fillStyle = darken(track, 10);
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(0, i * 4 + (frame ? 2 : 0), 3, 2);
    ctx.fillRect(13, i * 4 + (frame ? 2 : 0), 3, 2);
  }
  // Body
  ctx.fillStyle = body; ctx.fillRect(3, 2, 10, 12);
  ctx.fillStyle = darken(body, 22);
  ctx.fillRect(3, 10, 10, 4); ctx.fillRect(10, 2, 3, 12);
  // Turret
  ctx.fillStyle = turret; ctx.fillRect(5, 5, 6, 6);
  ctx.fillStyle = darken(turret, 18);
  // Barrel
  const barrelColor = darken(turret, 10);
  ctx.fillStyle = barrelColor;
  if (dir === Direction.UP)    ctx.fillRect(7, 0, 2, 8);
  if (dir === Direction.DOWN)  ctx.fillRect(7, 8, 2, 8);
  if (dir === Direction.LEFT)  ctx.fillRect(0, 7, 8, 2);
  if (dir === Direction.RIGHT) ctx.fillRect(8, 7, 8, 2);
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(3, 2, 4, 2);
}

// ── Public API ────────────────────────────────
export function createAllTextures(scene: Phaser.Scene): void {
  // ── Player (yellow) ───────────────────────
  for (let dir = 0; dir < 4; dir++) {
    for (let fr = 0; fr < 2; fr++) {
      const [c, ctx] = mk(16, 16);
      drawTankBody(ctx, dir as Direction, fr, '#ffdd00', '#554400', '#ffaa00');
      add(scene, `player_${dir}_${fr}`, c);
    }
  }

  // ── Enemy tanks ───────────────────────────
  const defs: { name: string; body: string; track: string; turret: string }[] = [
    { name: 'basic',         body: '#c0c0c0', track: '#555555', turret: '#888888' },
    { name: 'fast',          body: '#ff9900', track: '#663300', turret: '#cc6600' },
    { name: 'armored',       body: '#5577cc', track: '#223355', turret: '#4466aa' },
    { name: 'armored_dmg1',  body: '#7799ee', track: '#334477', turret: '#6688cc' },
    { name: 'armored_dmg2',  body: '#99bbff', track: '#556699', turret: '#88aaee' },
    { name: 'armored_dmg3',  body: '#bbddff', track: '#7788aa', turret: '#aaccff' },
    { name: 'power',         body: '#ff3333', track: '#660000', turret: '#ff6666' },
  ];

  for (const def of defs) {
    for (let dir = 0; dir < 4; dir++) {
      for (let fr = 0; fr < 2; fr++) {
        const [c, ctx] = mk(16, 16);
        drawTankBody(ctx, dir as Direction, fr, def.body, def.track, def.turret);
        add(scene, `${def.name}_${dir}_${fr}`, c);
      }
    }
  }

  // ── Tiles ─────────────────────────────────
  // Brick
  { const [c, ctx] = mk(16, 16);
    ctx.fillStyle = '#8B3A10'; ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#cc5522';
    ctx.fillRect(1,1,6,3); ctx.fillRect(9,1,6,3);
    ctx.fillRect(1,5,3,3); ctx.fillRect(6,5,9,3);
    ctx.fillRect(1,9,6,3); ctx.fillRect(9,9,6,3);
    ctx.fillRect(1,13,3,3); ctx.fillRect(6,13,9,3);
    ctx.fillStyle = 'rgba(255,180,110,0.4)';
    ctx.fillRect(1,1,6,1); ctx.fillRect(9,1,6,1);
    add(scene, 'brick', c);
  }

  // Brick damaged
  { const [c, ctx] = mk(16, 16);
    ctx.fillStyle = '#5a2008'; ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#993311';
    ctx.fillRect(1,1,5,3); ctx.fillRect(9,1,5,3);
    ctx.fillRect(1,5,2,3); ctx.fillRect(5,5,6,3);
    ctx.fillRect(1,9,5,3); ctx.fillRect(9,9,5,3);
    ctx.fillStyle = '#111';
    ctx.fillRect(7,0,2,6); ctx.fillRect(12,6,4,3); ctx.fillRect(3,11,4,5);
    add(scene, 'brick_dmg', c);
  }

  // Steel
  { const [c, ctx] = mk(16, 16);
    ctx.fillStyle = '#6a6a6a'; ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#999'; ctx.fillRect(1,1,7,7); ctx.fillRect(9,9,6,6);
    ctx.fillStyle = '#444'; ctx.fillRect(8,1,7,7); ctx.fillRect(1,9,6,6);
    ctx.fillStyle = '#bbb'; ctx.fillRect(0,0,16,1); ctx.fillRect(0,0,1,16);
    ctx.fillStyle = '#333'; ctx.fillRect(0,15,16,1); ctx.fillRect(15,0,1,16);
    add(scene, 'steel', c);
  }

  // Water (2 animation frames)
  for (let f = 0; f < 2; f++) {
    const [c, ctx] = mk(16, 16);
    ctx.fillStyle = '#0d3d8a'; ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#1a55bb';
    if (f === 0) {
      ctx.fillRect(2,3,4,2); ctx.fillRect(10,3,4,2);
      ctx.fillRect(0,9,3,2); ctx.fillRect(7,9,5,2); ctx.fillRect(14,9,2,2);
      ctx.fillRect(4,13,8,2);
    } else {
      ctx.fillRect(0,1,3,2); ctx.fillRect(6,1,4,2); ctx.fillRect(13,1,3,2);
      ctx.fillRect(2,7,5,2); ctx.fillRect(11,7,5,2);
      ctx.fillRect(1,13,3,2); ctx.fillRect(8,13,6,2);
    }
    ctx.fillStyle = 'rgba(120,200,255,0.3)';
    ctx.fillRect(2, f ? 1 : 3, 4, 1); ctx.fillRect(10, f ? 7 : 3, 4, 1);
    add(scene, `water${f}`, c);
  }

  // Tree
  { const [c, ctx] = mk(16, 16);
    ctx.fillStyle = '#0d3d0d'; ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#1d6b1d';
    ctx.fillRect(2,0,4,8); ctx.fillRect(10,0,4,8);
    ctx.fillRect(0,6,8,10); ctx.fillRect(8,4,8,12);
    ctx.fillStyle = '#2d8f2d';
    ctx.fillRect(3,1,2,5); ctx.fillRect(11,1,2,5);
    ctx.fillRect(1,7,4,4); ctx.fillRect(9,5,4,4);
    ctx.fillStyle = 'rgba(100,220,100,0.2)';
    ctx.fillRect(2,0,2,6); ctx.fillRect(10,0,2,6);
    add(scene, 'tree', c);
  }

  // Ice
  { const [c, ctx] = mk(16, 16);
    ctx.fillStyle = '#aaddff'; ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(2,2,4,1); ctx.fillRect(11,5,4,1);
    ctx.fillRect(4,11,5,1); ctx.fillRect(1,14,3,1);
    ctx.fillStyle = 'rgba(150,210,255,0.45)'; ctx.fillRect(7, 0, 2, 16);
    add(scene, 'ice', c);
  }

  // Eagle alive
  { const [c, ctx] = mk(32, 16);
    ctx.fillStyle = '#cc9900'; ctx.fillRect(0,5,8,6); ctx.fillRect(24,5,8,6);
    ctx.fillStyle = '#ffcc00'; ctx.fillRect(1,6,6,4); ctx.fillRect(25,6,6,4);
    ctx.fillStyle = '#884400'; ctx.fillRect(8,1,16,14);
    ctx.fillStyle = '#cc6600'; ctx.fillRect(10,3,12,10);
    ctx.fillStyle = '#ff9900'; ctx.fillRect(12,5,8,6);
    ctx.fillStyle = '#cc6600'; ctx.fillRect(13,0,6,5);
    ctx.fillStyle = '#ff9900'; ctx.fillRect(14,1,4,4);
    ctx.fillStyle = '#ff6600'; ctx.fillRect(14,0,2,1);
    ctx.fillStyle = '#111';    ctx.fillRect(14,1,2,2);
    ctx.fillStyle = '#fff';    ctx.fillRect(14,1,1,1);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(10,3,3,2);
    add(scene, 'eagle', c);
  }

  // Eagle dead
  { const [c, ctx] = mk(32, 16);
    ctx.fillStyle = '#220000'; ctx.fillRect(0,0,32,16);
    ctx.fillStyle = '#553300';
    ctx.fillRect(2,2,4,3); ctx.fillRect(10,4,5,3);
    ctx.fillRect(18,2,4,5); ctx.fillRect(24,6,6,4);
    ctx.fillStyle = '#333';
    ctx.fillRect(4,7,8,6); ctx.fillRect(16,7,10,6);
    add(scene, 'eagle_dead', c);
  }

  // Bullet
  { const [c, ctx] = mk(4, 8);
    ctx.fillStyle = '#ffff88'; ctx.fillRect(1,0,2,8);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(1,0,2,2);
    ctx.fillStyle = '#ffaa00'; ctx.fillRect(1,6,2,2);
    add(scene, 'bullet', c);
  }

  // Explosion spritesheet (5 frames × 32px on 160×32 canvas)
  { const [c, ctx] = mk(160, 32);
    const frames = [
      { r: 5,  cols: ['#ffff00'] },
      { r: 9,  cols: ['#ffaa00', '#ffff00'] },
      { r: 13, cols: ['#ff6600', '#ffcc00', '#ffff66'] },
      { r: 11, cols: ['#cc2200', '#ff5500', '#ffaa00'] },
      { r: 7,  cols: ['#660000', '#aa2200', '#ff5500'] },
    ];
    for (let i = 0; i < 5; i++) {
      const cx = i * 32 + 16, cy = 16;
      const f = frames[i];
      for (let ci = f.cols.length - 1; ci >= 0; ci--) {
        ctx.fillStyle = f.cols[ci];
        ctx.beginPath(); ctx.arc(cx, cy, f.r * (1 - ci * 0.3), 0, Math.PI * 2); ctx.fill();
      }
      if (i < 3) {
        ctx.fillStyle = '#fff';
        const r = f.r * 1.4;
        [[0,-1],[0,1],[-1,0],[1,0],[-0.7,-0.7],[0.7,-0.7],[-0.7,0.7],[0.7,0.7]].forEach(([dx,dy]) => {
          ctx.fillRect(cx + dx * r - 1, cy + dy * r - 1, 2, 2);
        });
      }
    }
    if (!scene.textures.exists('explosion')) {
      scene.textures.addCanvas('explosion', c);
      const tex = scene.textures.get('explosion');
      for (let i = 0; i < 5; i++) tex.add(i, 0, i * 32, 0, 32, 32);
    }
  }

  // Power-up icons
  const puDefs: { key: string; fn: (ctx: Ctx) => void }[] = [
    { key: 'pu_star',   fn: (ctx) => { drawStar(ctx, 8, 8); } },
    { key: 'pu_shield', fn: (ctx) => { ctx.strokeStyle='#00eeff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(8,8,5,0,Math.PI*2); ctx.stroke(); ctx.fillStyle='rgba(0,200,255,0.3)'; ctx.fill(); } },
    { key: 'pu_bomb',   fn: (ctx) => { ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(8,10,5,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#ffcc00'; ctx.beginPath(); ctx.arc(13,3,2,0,Math.PI*2); ctx.fill(); } },
    { key: 'pu_life',   fn: (ctx) => { ctx.fillStyle='#ffdd00'; ctx.fillRect(4,3,8,10); ctx.fillRect(1,6,3,5); ctx.fillRect(12,6,3,5); ctx.fillStyle='#ffaa00'; ctx.fillRect(7,1,2,6); } },
    { key: 'pu_timer',  fn: (ctx) => { ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(8,8,5,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(8,4); ctx.lineTo(8,8); ctx.lineTo(11,8); ctx.stroke(); } },
  ];
  for (const { key, fn } of puDefs) {
    const [c, ctx] = mk(16, 16);
    ctx.fillStyle = 'rgba(180,30,30,0.88)'; ctx.fillRect(0,0,16,16);
    ctx.strokeStyle = '#ff8888'; ctx.lineWidth = 1; ctx.strokeRect(0.5,0.5,15,15);
    fn(ctx);
    add(scene, key, c);
  }

  // Shield FX overlay
  { const [c, ctx] = mk(26, 26);
    ctx.strokeStyle = 'rgba(0,220,255,0.9)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(13,13,11,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,220,255,0.25)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(13,13,11,0,Math.PI*2); ctx.stroke();
    add(scene, 'shield_fx', c);
  }

  // Spawn flash circles (4 frames)
  for (let i = 0; i < 4; i++) {
    const [c, ctx] = mk(16, 16);
    ctx.strokeStyle = i % 2 === 0 ? '#ffffff' : '#ffff00'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(8, 8, (i + 1) * 3, 0, Math.PI * 2); ctx.stroke();
    add(scene, `spawn${i}`, c);
  }
}

// ── Star shape helper ─────────────────────────
function drawStar(ctx: Ctx, cx: number, cy: number) {
  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 7 : 3.5;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    else         ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath(); ctx.fill();
}

// ── Animation registration ────────────────────
export function createAnimations(scene: Phaser.Scene): void {
  if (!scene.anims.exists('explode')) {
    scene.anims.create({
      key:       'explode',
      frames:    [0,1,2,3,4].map(f => ({ key: 'explosion', frame: f })),
      frameRate: 14,
      repeat:    0,
    });
  }
}
