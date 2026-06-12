import type { GameState } from './state';
import { W, H, LANES, LEVELS, SCENES } from './config';

export function drawRoad(ctx: CanvasRenderingContext2D, state: GameState): void {
  const currentScene = SCENES[state.currentScene];
  const nextScene = SCENES[state.nextScene];
  const progress = state.sceneTransitionProgress;

  const speedLineAlpha = Math.min(0.5, Math.max(0, (state.gameSpeed * state.speedMultiplier - 3) * 0.08));
  if (speedLineAlpha > 0.05) {
    ctx.strokeStyle = `rgba(255,255,255,${speedLineAlpha})`;
    ctx.lineWidth = 2;
    const offset = (state.frameCount * state.gameSpeed * state.speedMultiplier * 1.5) % 60;
    for (let i = 0; i < 6; i++) {
      const ly = (i * 60 + offset) % H;
      ctx.beginPath();
      ctx.moveTo(45, ly);
      ctx.lineTo(50, ly + 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W - 50, ly);
      ctx.lineTo(W - 45, ly + 20);
      ctx.stroke();
    }
  }

  const bgColors = currentScene.bgGradient;
  const nextBgColors = nextScene ? nextScene.bgGradient : bgColors;
  
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  for (let i = 0; i < bgColors.length; i++) {
    const color1 = bgColors[i];
    const color2 = nextBgColors[i] || color1;
    const mixedColor = mixColors(color1, color2, progress);
    grad.addColorStop(i / (bgColors.length - 1), mixedColor);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const sideColor = mixColors(currentScene.sideColor, nextScene ? nextScene.sideColor : currentScene.sideColor, progress);
  ctx.fillStyle = sideColor;
  ctx.fillRect(0, 0, 40, H);
  ctx.fillRect(W - 40, 0, 40, H);

  const roadColor = mixColors(currentScene.roadColor, nextScene ? nextScene.roadColor : currentScene.roadColor, progress);
  ctx.fillStyle = roadColor;
  ctx.fillRect(40, 0, W - 80, H);

  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 4;
  ctx.setLineDash([30, 30]);
  state.roadLines.forEach(rl => {
    ctx.beginPath();
    ctx.moveTo(140, rl.y);
    ctx.lineTo(140, rl.y + 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(260, rl.y);
    ctx.lineTo(260, rl.y + 30);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // 添加车道指示器 - 帮助小朋友识别车道位置（降低透明度，减少视觉干扰）
  const LANE_XS = [80, 200, 320];
  LANE_XS.forEach((laneX, index) => {
    // 在当前车道显示高亮标记
    const isCurrentLane = Math.abs(state.playerX - laneX) < 30;
    
    if (isCurrentLane) {
      // 当前车道：显示淡黄色光晕（降低透明度）
      ctx.fillStyle = 'rgba(255, 255, 0, 0.06)'; // 0.15 -> 0.06
      ctx.beginPath();
      ctx.arc(laneX, H - 150, 25, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.15)'; // 0.4 -> 0.15
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(laneX, H - 150, 25, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // 其他车道：显示极淡圆圈
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'; // 0.08 -> 0.03
      ctx.beginPath();
      ctx.arc(laneX, H - 150, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(40, 0);
  ctx.lineTo(40, H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W - 40, 0);
  ctx.lineTo(W - 40, H);
  ctx.stroke();

  state.sideObjs.forEach(o => {
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.8;
    const sx = o.side === 0 ? 20 : W - 20;
    ctx.fillText(o.type, sx, o.y);
    ctx.globalAlpha = 1;
  });

  if (progress > 0 && progress < 1) {
    ctx.fillStyle = `rgba(255, 255, 255, ${progress * 0.3})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function mixColors(color1: string, color2: string, ratio: number): string {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);
  
  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);
  
  const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState): void {
  const py = H - 240;
  const form = state.vehicleForm;

  if (state.invincibleTimer > 0 && Math.floor(state.invincibleTimer / 4) % 2 === 0) {
    return;
  }

  // 如果正在变身，绘制过渡效果
  if (state.transforming) {
    drawTransformAnimation(ctx, state, py);
  }

  if (state.shieldTimer > 0) {
    const alpha = 0.3 + 0.15 * Math.sin(state.frameCount * 0.15);
    ctx.strokeStyle = `rgba(52, 152, 219, ${alpha})`;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#3498DB';
    ctx.beginPath();
    ctx.arc(state.playerX, py + state.playerH / 2, state.playerW * 0.9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  if (state.invincibleTimer > 0) {
    const alpha = 0.2 + 0.2 * Math.sin(state.frameCount * 0.2);
    ctx.strokeStyle = `rgba(243, 156, 18, ${alpha})`;
    ctx.lineWidth = 5;
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#F39C12';
    ctx.beginPath();
    ctx.arc(state.playerX, py + state.playerH / 2, state.playerW * 1.1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  if (state.boostTimer > 0 || form === 'spaceship' || form === 'tank' || form === 'mecha') {
    for (let i = 0; i < (form === 'tank' || form === 'mecha' ? 2 : 4); i++) {
      const colors = form === 'spaceship' ? ['#00CED1', '#87CEEB', '#FFFFFF'] :
                     form === 'tank' ? ['#27AE60', '#2ECC71', '#90EE90'] :
                     form === 'mecha' ? ['#E67E22', '#F39C12', '#F1C40F'] :
                     ['#FF6B00', '#F1C40F', '#FF3300'];
      state.particles.push({
        x: state.playerX + (Math.random() - 0.5) * 20,
        y: py + state.playerH + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 5,
        life: 0.8, maxLife: 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 5 + Math.random() * 8,
      });
    }
  }

  ctx.save();
  ctx.translate(state.playerX, py + state.playerH / 2);
  ctx.rotate(state.tilt);
  ctx.translate(-state.playerX, -(py + state.playerH / 2));

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(state.playerX - state.playerW / 2 + 5, py + 5, state.playerW, state.playerH);

  if (form === 'spaceship') {
    drawSpaceship(ctx, state, py);
  } else if (form === 'tank') {
    drawTank(ctx, state, py);
  } else if (form === 'mecha') {
    drawMecha(ctx, state, py);
  } else {
    drawCar(ctx, state, py);
  }

  ctx.restore();
  ctx.shadowBlur = 0;
}

function drawCar(ctx: CanvasRenderingContext2D, state: GameState, py: number): void {
  // 根据选择的颜色设置车身颜色
  const colorMap = {
    red: { body: '#E74C3C', boost: '#FF6B00' },
    blue: { body: '#3498DB', boost: '#FF6B00' },
    yellow: { body: '#F1C40F', boost: '#FF6B00' },
  };
  const colors = colorMap[state.carColor];
  const carColor = state.boostTimer > 0 ? colors.boost : colors.body;
  
  ctx.shadowBlur = state.boostTimer > 0 ? 25 : 15;
  ctx.shadowColor = carColor;

  // 车身 - 更圆润的Q版设计
  ctx.fillStyle = carColor;
  ctx.beginPath();
  // 使用更大的圆角半径使车身更圆润
  ctx.roundRect(state.playerX - state.playerW / 2, py + 5, state.playerW, state.playerH - 5, 12);
  ctx.fill();

  // 车窗 - 圆形设计
  ctx.fillStyle = '#1A5276';
  ctx.beginPath();
  ctx.arc(state.playerX, py + 20, 12, 0, Math.PI * 2);
  ctx.fill();

  // 车灯 - 大眼睛风格
  ctx.fillStyle = '#F1C40F';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#F1C40F';
  ctx.beginPath();
  ctx.arc(state.playerX - 10, py + 12, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(state.playerX + 10, py + 12, 5, 0, Math.PI * 2);
  ctx.fill();

  // 车轮 - 更圆润
  ctx.fillStyle = '#2C3E50';
  ctx.shadowBlur = 0;
  // 左前轮
  ctx.beginPath();
  ctx.arc(state.playerX - state.playerW / 2 - 2, py + 15, 6, 0, Math.PI * 2);
  ctx.fill();
  // 右前轮
  ctx.beginPath();
  ctx.arc(state.playerX + state.playerW / 2 + 2, py + 15, 6, 0, Math.PI * 2);
  ctx.fill();
  // 左后轮
  ctx.beginPath();
  ctx.arc(state.playerX - state.playerW / 2 - 2, py + state.playerH - 15, 6, 0, Math.PI * 2);
  ctx.fill();
  // 右后轮
  ctx.beginPath();
  ctx.arc(state.playerX + state.playerW / 2 + 2, py + state.playerH - 15, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawSpaceship(ctx: CanvasRenderingContext2D, state: GameState, py: number): void {
  const glow = Math.sin(state.frameCount * 0.2) * 0.3 + 0.7;
  ctx.shadowBlur = 30 * glow;
  ctx.shadowColor = '#00CED1';

  // 飞船主体 - 更圆润的飞碟形状
  ctx.fillStyle = '#00CED1';
  ctx.beginPath();
  ctx.ellipse(state.playerX, py + state.playerH / 2, state.playerW / 2 + 5, state.playerH / 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 飞船顶部圆顶
  ctx.fillStyle = '#87CEEB';
  ctx.beginPath();
  ctx.arc(state.playerX, py + state.playerH / 2 - 5, state.playerW / 3, Math.PI, 0);
  ctx.fill();

  // 驾驶舱窗户 - 大眼睛风格
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(state.playerX - 8, py + state.playerH / 2 - 2, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(state.playerX + 8, py + state.playerH / 2 - 2, 7, 0, Math.PI * 2);
  ctx.fill();

  // 飞船底部推进器
  ctx.fillStyle = '#2C3E50';
  ctx.shadowBlur = 0;
  for (let i = 0; i < 3; i++) {
    const offset = (i - 1) * 15;
    ctx.beginPath();
    ctx.arc(state.playerX + offset, py + state.playerH - 8, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 推进器火焰效果
  for (let i = 0; i < 3; i++) {
    const offset = (i - 1) * 15;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(state.frameCount * 0.3 + i) * 0.3})`;
    ctx.beginPath();
    ctx.arc(state.playerX + offset, py + state.playerH - 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTank(ctx: CanvasRenderingContext2D, state: GameState, py: number): void {
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#27AE60';

  // 坦克主体 - 更圆润厚重
  ctx.fillStyle = '#27AE60';
  ctx.beginPath();
  ctx.roundRect(state.playerX - state.playerW / 2 - 8, py + 8, state.playerW + 16, state.playerH - 8, 8);
  ctx.fill();

  // 炮塔 - 圆形设计
  ctx.fillStyle = '#1E8449';
  ctx.beginPath();
  ctx.arc(state.playerX, py + 25, 15, 0, Math.PI * 2);
  ctx.fill();

  // 履带 - 圆润的轮子
  ctx.fillStyle = '#7F8C8D';
  ctx.shadowBlur = 0;
  // 左侧履带
  ctx.beginPath();
  ctx.roundRect(state.playerX - state.playerW / 2 - 10, py + 12, 10, state.playerH - 20, 5);
  ctx.fill();
  // 右侧履带
  ctx.beginPath();
  ctx.roundRect(state.playerX + state.playerW / 2, py + 12, 10, state.playerH - 20, 5);
  ctx.fill();

  // 履带轮子 - 圆形
  ctx.fillStyle = '#2C3E50';
  for (let i = 0; i < 3; i++) {
    const yPos = py + 20 + i * 15;
    // 左轮
    ctx.beginPath();
    ctx.arc(state.playerX - state.playerW / 2 - 5, yPos, 5, 0, Math.PI * 2);
    ctx.fill();
    // 右轮
    ctx.beginPath();
    ctx.arc(state.playerX + state.playerW / 2 + 5, yPos, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 炮管 - 圆润的圆柱形
  ctx.fillStyle = '#34495E';
  ctx.beginPath();
  ctx.roundRect(state.playerX - 4, py - 10, 8, 30, 4);
  ctx.fill();

  // 炮口
  ctx.fillStyle = '#2C3E50';
  ctx.beginPath();
  ctx.arc(state.playerX, py - 10, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawMecha(ctx: CanvasRenderingContext2D, state: GameState, py: number): void {
  ctx.shadowBlur = 25;
  ctx.shadowColor = '#E67E22';

  // 机甲身体 - 圆润的人形设计
  ctx.fillStyle = '#E67E22';
  ctx.beginPath();
  ctx.roundRect(state.playerX - state.playerW / 2 + 3, py + 18, state.playerW - 6, state.playerH - 18, 8);
  ctx.fill();

  // 机甲胸部装甲
  ctx.fillStyle = '#D35400';
  ctx.beginPath();
  ctx.arc(state.playerX, py + 30, 12, 0, Math.PI * 2);
  ctx.fill();

  // 机甲腿部/车轮 - 圆润的车轮
  ctx.fillStyle = '#2C3E50';
  ctx.shadowBlur = 0;
  // 左腿/轮
  ctx.beginPath();
  ctx.roundRect(state.playerX - state.playerW / 2 - 5, py + 22, 10, state.playerH - 22, 5);
  ctx.fill();
  // 右腿/轮
  ctx.beginPath();
  ctx.roundRect(state.playerX + state.playerW / 2 - 5, py + 22, 10, state.playerH - 22, 5);
  ctx.fill();

  // 车轮细节
  ctx.fillStyle = '#95A5A6';
  for (let i = 0; i < 2; i++) {
    const yPos = py + 30 + i * 18;
    // 左轮
    ctx.beginPath();
    ctx.arc(state.playerX - state.playerW / 2, yPos, 5, 0, Math.PI * 2);
    ctx.fill();
    // 右轮
    ctx.beginPath();
    ctx.arc(state.playerX + state.playerW / 2, yPos, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 机甲头部 - 圆形头盔
  ctx.fillStyle = '#F39C12';
  ctx.beginPath();
  ctx.arc(state.playerX, py + 10, 14, 0, Math.PI * 2);
  ctx.fill();

  // 眼睛 - 大眼睛风格
  ctx.fillStyle = '#2C3E50';
  ctx.beginPath();
  ctx.arc(state.playerX - 6, py + 8, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(state.playerX + 6, py + 8, 4, 0, Math.PI * 2);
  ctx.fill();

  // 嘴巴/传感器
  ctx.fillStyle = '#F1C40F';
  ctx.beginPath();
  ctx.arc(state.playerX, py + 14, 3, 0, Math.PI * 2);
  ctx.fill();

  // 机甲手臂
  ctx.fillStyle = '#E67E22';
  // 左臂
  ctx.beginPath();
  ctx.roundRect(state.playerX - state.playerW / 2 - 10, py + 20, 10, 20, 5);
  ctx.fill();
  // 右臂
  ctx.beginPath();
  ctx.roundRect(state.playerX + state.playerW / 2, py + 20, 10, 20, 5);
  ctx.fill();
}

export function drawObstacles(ctx: CanvasRenderingContext2D, state: GameState): void {
  state.obstacles.forEach(o => {
    ctx.shadowBlur = 8;
    ctx.shadowColor = o.color;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(o.x - o.w / 2 + 3, o.y + 3, o.w, o.h);

    ctx.font = `${o.h}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    if (o.type === 'oil' || o.type === 'water') {
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.roundRect(o.x - o.w / 2, o.y, o.w, o.h, 5);
      ctx.fill();
      ctx.font = `${Math.floor(o.h * 0.7)}px sans-serif`;
      ctx.fillText(o.emoji, o.x, o.y + 3);
    } else {
      ctx.fillText(o.emoji, o.x, o.y);
    }
    ctx.shadowBlur = 0;
  });
}

export function drawCoins(ctx: CanvasRenderingContext2D, state: GameState): void {
  state.coins.forEach((c, index) => {
    if (c.collected) return;

    ctx.save();
    ctx.translate(c.x, c.y);

    const rotation = (state.frameCount * 0.05 + index * 0.5) % (Math.PI * 2);
    ctx.rotate(rotation);

    const glow = 10 + Math.sin(state.frameCount * 0.1 + index) * 5;
    ctx.shadowBlur = glow;
    ctx.shadowColor = '#F1C40F';

    ctx.fillStyle = '#F1C40F';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F39C12';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    const starAlpha = 0.8 + Math.sin(state.frameCount * 0.2 + index) * 0.2;
    ctx.globalAlpha = starAlpha;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', 0, 1);

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.restore();
  });
}

export function drawPowerups(ctx: CanvasRenderingContext2D, state: GameState): void {
  state.powerups.forEach(p => {
    if (p.collected) return;

    ctx.save();
    ctx.translate(p.x, p.y);

    const bounce = Math.sin(state.frameCount * 0.1) * 3;
    ctx.translate(0, bounce);

    ctx.shadowBlur = 20;
    ctx.shadowColor = p.color;
    ctx.fillStyle = `${p.color}33`;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.emoji, 0, 0);

    ctx.shadowBlur = 0;
    ctx.restore();
  });
}

export function drawParticles(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.life -= 0.03;
    if (p.life <= 0) {
      state.particles.splice(i, 1);
      continue;
    }
    const alpha = p.life / p.maxLife;
    const radius = p.size * alpha;
    if (radius < 0.3) continue;

    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.rotation) ctx.rotate(p.rotation);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;

    const shape = p.shape || 'circle';
    switch (shape) {
      case 'circle':
        ctx.shadowBlur = radius * 3;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'diamond':
        ctx.shadowBlur = radius * 2;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.lineTo(radius, 0);
        ctx.lineTo(0, radius);
        ctx.lineTo(-radius, 0);
        ctx.closePath();
        ctx.fill();
        break;
      case 'star':
        ctx.shadowBlur = radius * 4;
        ctx.shadowColor = p.color;
        const spikes = 4;
        const outerR = radius;
        const innerR = radius * 0.4;
        ctx.beginPath();
        for (let j = 0; j < spikes * 2; j++) {
          const r = j % 2 === 0 ? outerR : innerR;
          const a = (j * Math.PI) / spikes - Math.PI / 2;
          const sx = Math.cos(a) * r;
          const sy = Math.sin(a) * r;
          if (j === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
        break;
      case 'spark':
        ctx.shadowBlur = radius * 2;
        ctx.shadowColor = p.color;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, radius * 0.5);
        ctx.beginPath();
        ctx.moveTo(-radius * 2, 0);
        ctx.lineTo(radius * 2, 0);
        ctx.stroke();
        break;
    }

    ctx.restore();
  }
}

// 绘制炮弹
export function drawBullets(ctx: CanvasRenderingContext2D, state: GameState): void {
  state.bullets.forEach(b => {
    // 炮弹主体
    ctx.fillStyle = '#FF6B00';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FF6B00';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // 炮弹尾焰
    ctx.fillStyle = 'rgba(255, 200, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(b.x, b.y + 8, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
  });
}

export function drawFloatTexts(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (let i = state.floatTexts.length - 1; i >= 0; i--) {
    const ft = state.floatTexts[i];
    ft.y += ft.vy;
    ft.life -= 0.025;
    if (ft.life <= 0) {
      state.floatTexts.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = Math.min(ft.life, 1);
    ctx.fillStyle = ft.color;
    
    const isTransform = ft.text.includes('变身');
    const fontSize = isTransform ? 32 : 18;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const shadowBlur = isTransform ? 15 : 5;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowColor = ft.color;
    
    if (isTransform) {
      const scale = 1 + Math.sin(state.frameCount * 0.1) * 0.1;
      ctx.save();
      ctx.translate(ft.x, ft.y);
      ctx.scale(scale, scale);
      ctx.fillText(ft.text, 0, 0);
      ctx.restore();
    } else {
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}

export function drawHUD(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.collisionFlash > 0) {
    const flashAlpha = (state.collisionFlash / 30) * 0.5;
    ctx.fillStyle = `rgba(255, 0, 0, ${flashAlpha})`;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  const levelConfigEarly = LEVELS[state.currentLevel - 1];
  const levelNameEarly = levelConfigEarly?.name || `第${state.currentLevel}关`;
  const timeColorHud = state.timeRemaining <= 10 ? '#E74C3C' : '#FFFFFF';
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.roundRect(10, 8, W - 20, 40, 10);
  ctx.fill();
  ctx.fillStyle = timeColorHud;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const comboHud = state.combo >= 3 ? ` · 🔥${state.combo}` : '';
  ctx.fillText(
    `${levelNameEarly} · 💰${state.coinsCollected} · ⏱${state.timeRemaining}s${comboHud}`,
    W / 2,
    28,
  );
  if (false) {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 3;
  ctx.shadowColor = '#000';
  ctx.fillText(`🏆 ${state.score}`, 15, 25);

  ctx.fillStyle = '#F1C40F';
  ctx.font = '16px sans-serif';
  ctx.fillText(`💰 ${state.coinsCollected}`, 15, 48);

  const levelConfig = LEVELS[state.currentLevel - 1];
  const levelName = levelConfig?.name || `第${state.currentLevel}关`;
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`🎮 ${levelName}`, W / 2, 18);
  
  // 显示车辆颜色提示
  const colorEmoji = state.carColor === 'red' ? '🔴' : state.carColor === 'blue' ? '🔵' : '🟡';
  ctx.fillStyle = '#FFD700';
  ctx.font = '12px sans-serif';
  ctx.fillText(`${colorEmoji} 车辆`, W / 2, 32);
  
  // 添加操作提示（仅在前10秒显示）
  if (state.frameCount < 600) { // 60fps * 10s = 600帧
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    const hintText = '⬅️ 点击左侧向左 | 点击右侧向右 ➡️';
    ctx.fillText(hintText, W / 2, H - 30);
    
    // 淡出效果
    const fadeAlpha = Math.max(0, 1 - state.frameCount / 600);
    ctx.fillStyle = `rgba(255, 255, 255, ${fadeAlpha * 0.3})`;
    ctx.fillRect(0, H - 45, W, 30);
  }

  const currentLevelConfig = LEVELS[state.currentLevel - 1];
  if (!currentLevelConfig) return;
  const progress = Math.min(1, state.distance / currentLevelConfig.distanceGoal);
  const progressBarWidth = 200;
  const progressBarHeight = 8;
  const progressBarX = (W - progressBarWidth) / 2;
  const progressBarY = 52;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.roundRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 4);
  ctx.fill();

  const progressColor = progress > 0.7 ? '#2ECC71' : progress > 0.4 ? '#F1C40F' : '#E74C3C';
  ctx.fillStyle = progressColor;
  ctx.beginPath();
  ctx.roundRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight, 4);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.floor(state.distance)}m / ${currentLevelConfig.distanceGoal}m`, W / 2, 52);

  const timeColor = state.timeRemaining <= 10 ? '#E74C3C' : '#FFFFFF';
  ctx.fillStyle = timeColor;
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`⏱️ ${state.timeRemaining}s`, W - 15, 25);

  ctx.fillStyle = '#00CED1';
  ctx.font = '12px sans-serif';
  ctx.fillText(`📍 ${SCENES[state.currentScene].name}`, W - 15, 48);

  if (state.combo >= 3) {
    ctx.fillStyle = '#E74C3C';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🔥 ${state.combo}连击!`, W / 2, 70);
  }

  if (state.collisionSlowTimer > 0) {
    ctx.fillStyle = '#E74C3C';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`⚠️ 减速中...`, W - 15, 75);
  }

  ctx.shadowBlur = 0;

  drawPowerupStatus(ctx, state);
}

function drawPowerupStatus(ctx: CanvasRenderingContext2D, state: GameState): void {
  const statusY = 75;
  let statusX = 15;

  if (state.spaceshipTimer > 0) {
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00CED1';
    ctx.fillStyle = '#00CED1';
    ctx.font = '22px sans-serif';
    ctx.fillText('🛸', statusX, statusY);
    ctx.shadowBlur = 0;
    statusX += 35;
  }
  if (state.tankTimer > 0) {
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#27AE60';
    ctx.fillStyle = '#27AE60';
    ctx.font = '22px sans-serif';
    ctx.fillText('💥', statusX, statusY);
    ctx.shadowBlur = 0;
    statusX += 35;
  }
  if (state.mechaTimer > 0) {
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#E67E22';
    ctx.fillStyle = '#E67E22';
    ctx.font = '22px sans-serif';
    ctx.fillText('🤖', statusX, statusY);
    ctx.shadowBlur = 0;
    statusX += 35;
  }
  if (state.boostTimer > 0) {
    ctx.fillStyle = '#FF6B00';
    ctx.font = '18px sans-serif';
    ctx.fillText('🔥', statusX, statusY);
    statusX += 30;
  }
  if (state.shieldTimer > 0) {
    ctx.fillStyle = '#3498DB';
    ctx.font = '18px sans-serif';
    ctx.fillText('🛡️', statusX, statusY);
    statusX += 30;
  }
  if (state.magnetTimer > 0) {
    ctx.fillStyle = '#9B59B6';
    ctx.font = '18px sans-serif';
    ctx.fillText('🧲', statusX, statusY);
    statusX += 30;
  }
  if (state.doubleTimer > 0) {
    ctx.fillStyle = '#F1C40F';
    ctx.font = '18px sans-serif';
    ctx.fillText('✨', statusX, statusY);
    statusX += 30;
  }
  if (state.invincibleTimer > 0) {
    ctx.fillStyle = '#F39C12';
    ctx.font = '18px sans-serif';
    ctx.fillText('⭐', statusX, statusY);
    statusX += 30;
  }
}

// 绘制变身过渡动画
function drawTransformAnimation(ctx: CanvasRenderingContext2D, state: GameState, py: number): void {
  const pulse = Math.sin(state.frameCount * 0.5) * 0.4 + 0.6;
  const radius = state.playerW * (1.5 + pulse * 0.5);

  const colors = state.vehicleForm === 'spaceship' ? ['#00CED1', '#FFFFFF'] :
                 state.vehicleForm === 'tank' ? ['#27AE60', '#FFFFFF'] :
                 state.vehicleForm === 'mecha' ? ['#E67E22', '#FFFFFF'] :
                 ['#FFD700', '#FFFFFF'];

  ctx.strokeStyle = `rgba(255, 255, 255, ${pulse * 0.5})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(state.playerX, py + state.playerH / 2, radius + 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = `rgba(${state.vehicleForm === 'spaceship' ? '0, 206, 209' : state.vehicleForm === 'tank' ? '39, 174, 96' : state.vehicleForm === 'mecha' ? '230, 126, 34' : '255, 215, 0'}, ${pulse * 0.6})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(state.playerX, py + state.playerH / 2, radius - 5, 0, Math.PI * 2);
  ctx.stroke();

  const rotation = state.frameCount * 0.15;
  for (let i = 0; i < 6; i++) {
    const angle = rotation + (i / 6) * Math.PI * 2;
    const r = radius + 5;
    const x = state.playerX + Math.cos(angle) * r;
    const y = py + state.playerH / 2 + Math.sin(angle) * r;
    ctx.fillStyle = i % 2 === 0 ? colors[0] : colors[1];
    ctx.beginPath();
    ctx.arc(x, y, 3 + Math.sin(state.frameCount * 0.5 + i) * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
