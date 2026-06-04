// ─────────────────────────────────────────────
//  src/game/TextureFactory.ts
//  经典坦克大战风格纹理生成
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

// ── 经典坦克绘制方法 ──────────────────
function drawClassicTank(
  ctx: Ctx,
  dir: Direction,
  frame: number,
  bodyColor: string,
  trackColor: string,
  turretColor: string,
  isPlayer: boolean = false
) {
  ctx.clearRect(0, 0, 16, 16);
  
  // 履带
  const trackOffset = frame === 0 ? 0 : 2;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 4, 16);
  ctx.fillRect(12, 0, 4, 16);
  
  // 履带上的纹理
  ctx.fillStyle = trackColor;
  for (let i = 0; i < 4; i++) {
    const y = i * 4 + trackOffset;
    ctx.fillRect(1, y, 2, 2);
    ctx.fillRect(13, y, 2, 2);
  }
  
  // 车身主体
  ctx.fillStyle = bodyColor;
  ctx.fillRect(4, 1, 8, 14);
  
  // 车身阴影
  ctx.fillStyle = darken(bodyColor, 40);
  ctx.fillRect(4, 11, 8, 4);
  ctx.fillRect(10, 1, 2, 14);
  
  // 炮塔
  ctx.fillStyle = turretColor;
  ctx.fillRect(5, 4, 6, 8);
  
  // 炮管
  ctx.fillStyle = darken(turretColor, 30);
  if (dir === Direction.UP) {
    ctx.fillRect(7, 0, 2, 6);
  } else if (dir === Direction.DOWN) {
    ctx.fillRect(7, 10, 2, 6);
  } else if (dir === Direction.LEFT) {
    ctx.fillRect(0, 7, 6, 2);
  } else if (dir === Direction.RIGHT) {
    ctx.fillRect(10, 7, 6, 2);
  }
  
  // 玩家坦克的特殊标记
  if (isPlayer) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(6, 6, 4, 4);
    ctx.fillStyle = turretColor;
    ctx.fillRect(7, 7, 2, 2);
  }
}

// ── Public API ────────────────────────────────
export function createAllTextures(scene: Phaser.Scene): void {
  // ── 玩家坦克（黄绿色，经典FC风格） ───────────────────────
  for (let dir = 0; dir < 4; dir++) {
    for (let fr = 0; fr < 2; fr++) {
      const [c, ctx] = mk(16, 16);
      drawClassicTank(ctx, dir as Direction, fr, '#7cb342', '#558b2f', '#aed581', true);
      add(scene, `player_${dir}_${fr}`, c);
    }
  }

  // ── 敌方坦克 ───────────────────────────
  const defs: { name: string; body: string; track: string; turret: string }[] = [
    { name: 'basic',         body: '#78909c', track: '#546e7a', turret: '#90a4ae' },
    { name: 'fast',          body: '#ff7043', track: '#e64a19', turret: '#ffab91' },
    { name: 'armored',       body: '#5c6bc0', track: '#3949ab', turret: '#7986cb' },
    { name: 'armored_dmg1',  body: '#7986cb', track: '#5c6bc0', turret: '#9fa8da' },
    { name: 'armored_dmg2',  body: '#9fa8da', track: '#7986cb', turret: '#c5cae9' },
    { name: 'armored_dmg3',  body: '#c5cae9', track: '#9fa8da', turret: '#e8eaf6' },
    { name: 'power',         body: '#e53935', track: '#c62828', turret: '#ef5350' },
  ];

  for (const def of defs) {
    for (let dir = 0; dir < 4; dir++) {
      for (let fr = 0; fr < 2; fr++) {
        const [c, ctx] = mk(16, 16);
        drawClassicTank(ctx, dir as Direction, fr, def.body, def.track, def.turret);
        add(scene, `${def.name}_${dir}_${fr}`, c);
      }
    }
  }

  // ── 砖块（经典FC砖墙） ─────────────────────────────────
  {
    const [c, ctx] = mk(16, 16);
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(0, 0, 16, 16);
    
    ctx.fillStyle = '#a1887f';
    ctx.fillRect(0, 0, 8, 4);
    ctx.fillRect(8, 0, 8, 4);
    ctx.fillRect(0, 4, 8, 4);
    ctx.fillRect(8, 4, 8, 4);
    ctx.fillRect(0, 8, 8, 4);
    ctx.fillRect(8, 8, 8, 4);
    ctx.fillRect(0, 12, 8, 4);
    ctx.fillRect(8, 12, 8, 4);
    
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(7, 0, 2, 4);
    ctx.fillRect(7, 4, 2, 4);
    ctx.fillRect(7, 8, 2, 4);
    ctx.fillRect(7, 12, 2, 4);
    ctx.fillRect(0, 3, 16, 1);
    ctx.fillRect(0, 7, 16, 1);
    ctx.fillRect(0, 11, 16, 1);
    
    add(scene, 'brick', c);
  }

  // 损坏的砖块
  {
    const [c, ctx] = mk(16, 16);
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(0, 0, 16, 16);
    
    ctx.fillStyle = '#795548';
    ctx.fillRect(0, 0, 6, 3);
    ctx.fillRect(10, 0, 6, 3);
    ctx.fillRect(2, 5, 5, 3);
    ctx.fillRect(9, 6, 7, 3);
    ctx.fillRect(1, 10, 6, 3);
    ctx.fillRect(10, 11, 6, 3);
    
    add(scene, 'brick_dmg', c);
  }

  // 钢铁
  {
    const [c, ctx] = mk(16, 16);
    ctx.fillStyle = '#37474f';
    ctx.fillRect(0, 0, 16, 16);
    
    ctx.fillStyle = '#78909c';
    ctx.fillRect(0, 0, 8, 8);
    ctx.fillRect(8, 8, 8, 8);
    
    ctx.fillStyle = '#455a64';
    ctx.fillRect(8, 0, 8, 8);
    ctx.fillRect(0, 8, 8, 8);
    
    ctx.fillStyle = '#90a4ae';
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 0, 1, 16);
    
    ctx.fillStyle = '#263238';
    ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(15, 0, 1, 16);
    
    add(scene, 'steel', c);
  }

  // 水（2帧动画）
  for (let f = 0; f < 2; f++) {
    const [c, ctx] = mk(16, 16);
    ctx.fillStyle = '#0d47a1';
    ctx.fillRect(0, 0, 16, 16);
    
    ctx.fillStyle = '#1976d2';
    if (f === 0) {
      ctx.fillRect(2, 2, 4, 3);
      ctx.fillRect(10, 2, 4, 3);
      ctx.fillRect(0, 8, 3, 3);
      ctx.fillRect(6, 8, 6, 3);
      ctx.fillRect(14, 8, 2, 3);
    } else {
      ctx.fillRect(0, 2, 3, 3);
      ctx.fillRect(5, 2, 5, 3);
      ctx.fillRect(12, 2, 4, 3);
      ctx.fillRect(2, 8, 5, 3);
      ctx.fillRect(10, 8, 6, 3);
    }
    
    add(scene, `water${f}`, c);
  }

  // 树
  {
    const [c, ctx] = mk(16, 16);
    ctx.fillStyle = '#1b5e20';
    ctx.fillRect(0, 0, 16, 16);
    
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(2, 0, 5, 7);
    ctx.fillRect(9, 0, 5, 7);
    ctx.fillRect(0, 5, 8, 11);
    ctx.fillRect(8, 3, 8, 13);
    
    ctx.fillStyle = '#388e3c';
    ctx.fillRect(3, 1, 3, 5);
    ctx.fillRect(10, 1, 3, 5);
    ctx.fillRect(1, 6, 5, 5);
    ctx.fillRect(9, 4, 5, 5);
    
    add(scene, 'tree', c);
  }

  // 冰
  {
    const [c, ctx] = mk(16, 16);
    ctx.fillStyle = '#b3e5fc';
    ctx.fillRect(0, 0, 16, 16);
    
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(2, 1, 4, 1);
    ctx.fillRect(10, 4, 4, 1);
    ctx.fillRect(4, 10, 5, 1);
    ctx.fillRect(1, 13, 3, 1);
    
    add(scene, 'ice', c);
  }

  // 老鹰（更接近原版的基地）
  {
    const [c, ctx] = mk(32, 16);
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(4, 2, 24, 12);
    
    ctx.fillStyle = '#ffd54f';
    ctx.fillRect(6, 4, 20, 8);
    
    ctx.fillStyle = '#ffb300';
    ctx.fillRect(13, 0, 6, 6);
    ctx.fillRect(10, 4, 12, 8);
    
    ctx.fillStyle = '#ff8f00';
    ctx.fillRect(14, 1, 4, 4);
    ctx.fillRect(12, 6, 8, 4);
    
    add(scene, 'eagle', c);
  }

  // 老鹰被摧毁
  {
    const [c, ctx] = mk(32, 16);
    ctx.fillStyle = '#212121';
    ctx.fillRect(0, 0, 32, 16);
    
    ctx.fillStyle = '#424242';
    ctx.fillRect(3, 2, 5, 3);
    ctx.fillRect(11, 4, 6, 3);
    ctx.fillRect(19, 2, 5, 5);
    ctx.fillRect(25, 6, 7, 4);
    
    add(scene, 'eagle_dead', c);
  }

  // 子弹（经典白色）
  {
    const [c, ctx] = mk(4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 4, 4);
    add(scene, 'bullet', c);
  }

  // 爆炸（更经典的9帧爆炸）
  {
    const [c, ctx] = mk(144, 32);
    const frames = [
      { r: 4,  cols: ['#fff'] },
      { r: 6,  cols: ['#ff0', '#fff'] },
      { r: 8,  cols: ['#f80', '#ff0'] },
      { r: 10, cols: ['#f00', '#f80', '#ff0'] },
      { r: 12, cols: ['#f00', '#f80', '#ff0'] },
      { r: 10, cols: ['#f00', '#f80'] },
      { r: 8,  cols: ['#f00'] },
      { r: 6,  cols: ['#a00'] },
      { r: 4,  cols: ['#500'] },
    ];
    
    for (let i = 0; i < 9; i++) {
      const cx = i * 16 + 8, cy = 16;
      const f = frames[i];
      for (let ci = f.cols.length - 1; ci >= 0; ci--) {
        ctx.fillStyle = f.cols[ci];
        ctx.beginPath();
        ctx.arc(cx, cy, f.r * (1 - ci * 0.3), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    if (!scene.textures.exists('explosion')) {
      scene.textures.addCanvas('explosion', c);
      const tex = scene.textures.get('explosion');
      for (let i = 0; i < 9; i++) tex.add(i, 0, i * 16, 0, 16, 16);
    }
  }

  // 道具（更经典的风格）
  const puDefs: { key: string; fn: (ctx: Ctx) => void }[] = [
    { key: 'pu_star', fn: (ctx) => { drawStar(ctx, 8, 8); } },
    { key: 'pu_shield', fn: (ctx) => { 
      ctx.fillStyle = '#fff'; 
      ctx.beginPath(); 
      ctx.arc(8, 8, 6, 0, Math.PI * 2); 
      ctx.fill();
      ctx.fillStyle = '#00bcd4';
      ctx.beginPath(); 
      ctx.arc(8, 8, 4, 0, Math.PI * 2); 
      ctx.fill();
    } },
    { key: 'pu_bomb', fn: (ctx) => { 
      ctx.fillStyle = '#000'; 
      ctx.beginPath(); 
      ctx.arc(8, 10, 5, 0, Math.PI * 2); 
      ctx.fill();
      ctx.fillStyle = '#ff0';
      ctx.beginPath(); 
      ctx.arc(8, 3, 2, 0, Math.PI * 2); 
      ctx.fill();
    } },
    { key: 'pu_life', fn: (ctx) => { 
      ctx.fillStyle = '#f00';
      ctx.fillRect(2, 5, 4, 6);
      ctx.fillRect(10, 5, 4, 6);
      ctx.fillRect(4, 3, 8, 10);
      ctx.fillStyle = '#ff5252';
      ctx.fillRect(5, 4, 6, 3);
    } },
    { key: 'pu_timer', fn: (ctx) => { 
      ctx.fillStyle = '#fff';
      ctx.fillRect(3, 3, 10, 10);
      ctx.fillStyle = '#000';
      ctx.fillRect(7, 5, 2, 5);
      ctx.fillRect(7, 5, 4, 2);
    } },
  ];
  
  for (const { key, fn } of puDefs) {
    const [c, ctx] = mk(16, 16);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 16, 16);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 15, 15);
    fn(ctx);
    add(scene, key, c);
  }

  // 护盾效果
  {
    const [c, ctx] = mk(26, 26);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(13, 13, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#00bcd4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(13, 13, 10, 0, Math.PI * 2);
    ctx.stroke();
    add(scene, 'shield_fx', c);
  }

  // 出生闪烁
  for (let i = 0; i < 4; i++) {
    const [c, ctx] = mk(16, 16);
    const colors = ['#fff', '#f00', '#fff', '#f00'];
    ctx.fillStyle = colors[i];
    if (i === 0) ctx.fillRect(6, 6, 4, 4);
    if (i === 1) ctx.fillRect(4, 4, 8, 8);
    if (i === 2) ctx.fillRect(2, 2, 12, 12);
    if (i === 3) ctx.fillRect(0, 0, 16, 16);
    add(scene, `spawn${i}`, c);
  }
}

// ── 星星绘制 ─────────────────────────
function drawStar(ctx: Ctx, cx: number, cy: number) {
  ctx.fillStyle = '#ff0';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 6 : 3;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    else ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath();
  ctx.fill();
}

// ── 动画注册 ────────────────────
export function createAnimations(scene: Phaser.Scene): void {
  if (!scene.anims.exists('explode')) {
    scene.anims.create({
      key: 'explode',
      frames: [0, 1, 2, 3, 4, 5, 6, 7, 8].map(f => ({ key: 'explosion', frame: f })),
      frameRate: 18,
      repeat: 0,
    });
  }
}
