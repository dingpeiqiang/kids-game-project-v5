import type { GameState } from './state';
import { W, H } from './config';

export function drawRoad(ctx: CanvasRenderingContext2D, state: GameState): void {
  // 渐变背景
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#87CEEB');
  grad.addColorStop(0.3, '#98D8C8');
  grad.addColorStop(0.6, '#F7DC6F');
  grad.addColorStop(1, '#F1948A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 路边草地
  ctx.fillStyle = '#27AE60';
  ctx.fillRect(0, 0, 40, H);
  ctx.fillRect(W - 40, 0, 40, H);

  // 路面
  ctx.fillStyle = '#5D6D7E';
  ctx.fillRect(40, 0, W - 80, H);

  // 车道分隔线（白色虚线）
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 4;
  ctx.setLineDash([30, 30]);
  state.roadLines.forEach(rl => {
    // 左分隔线
    ctx.beginPath();
    ctx.moveTo(140, rl.y);
    ctx.lineTo(140, rl.y + 30);
    ctx.stroke();
    // 右分隔线
    ctx.beginPath();
    ctx.moveTo(260, rl.y);
    ctx.lineTo(260, rl.y + 30);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // 路边白线
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

  // 路边装饰
  state.sideObjs.forEach(o => {
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.8;
    const sx = o.side === 0 ? 20 : W - 20;
    ctx.fillText(o.type, sx, o.y);
    ctx.globalAlpha = 1;
  });
}

export function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState): void {
  const py = H - 120;

  // 无敌闪烁
  if (state.invincible > 0 && Math.floor(state.invincible / 4) % 2 === 0) {
    return;
  }

  // 护盾光环
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

  // 氮气加速尾焰
  if (state.boostTimer > 0) {
    for (let i = 0; i < 2; i++) {
      state.particles.push({
        x: state.playerX + (Math.random() - 0.5) * 15,
        y: py + state.playerH,
        vx: (Math.random() - 0.5) * 2,
        vy: 3 + Math.random() * 4,
        life: 0.6, maxLife: 0.6,
        color: Math.random() > 0.5 ? '#FF6B00' : '#F1C40F',
        size: 4 + Math.random() * 6,
      });
    }
  }

  // 赛车阴影
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(state.playerX - state.playerW / 2 + 5, py + 5, state.playerW, state.playerH);

  // 赛车主体
  const carColor = state.boostTimer > 0 ? '#FF6B00' : '#3498DB';
  ctx.shadowBlur = state.boostTimer > 0 ? 25 : 15;
  ctx.shadowColor = carColor;

  // 车身
  ctx.fillStyle = carColor;
  ctx.beginPath();
  ctx.roundRect(state.playerX - state.playerW / 2, py, state.playerW, state.playerH, 8);
  ctx.fill();

  // 车顶（挡风玻璃）
  ctx.fillStyle = '#1A5276';
  ctx.beginPath();
  ctx.roundRect(state.playerX - state.playerW / 2 + 5, py + 12, state.playerW - 10, 18, 5);
  ctx.fill();

  // 车头灯
  ctx.fillStyle = '#F1C40F';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#F1C40F';
  ctx.beginPath();
  ctx.arc(state.playerX - 12, py + 8, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(state.playerX + 12, py + 8, 4, 0, Math.PI * 2);
  ctx.fill();

  // 车轮
  ctx.fillStyle = '#2C3E50';
  ctx.fillRect(state.playerX - state.playerW / 2 - 3, py + 8, 6, 12);
  ctx.fillRect(state.playerX + state.playerW / 2 - 3, py + 8, 6, 12);
  ctx.fillRect(state.playerX - state.playerW / 2 - 3, py + state.playerH - 20, 6, 12);
  ctx.fillRect(state.playerX + state.playerW / 2 - 3, py + state.playerH - 20, 6, 12);

  ctx.shadowBlur = 0;
}

export function drawObstacles(ctx: CanvasRenderingContext2D, state: GameState): void {
  state.obstacles.forEach(o => {
    ctx.shadowBlur = 8;
    ctx.shadowColor = o.color;
    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(o.x - o.w / 2 + 3, o.y + 3, o.w, o.h);
    // 障碍物
    ctx.font = `${o.h}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(o.emoji, o.x, o.y);
    ctx.shadowBlur = 0;
  });
}

export function drawCoins(ctx: CanvasRenderingContext2D, state: GameState): void {
  state.coins.forEach(c => {
    if (c.collected) return;

    ctx.save();
    ctx.translate(c.x, c.y);

    // 金币发光
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#F1C40F';
    ctx.fillStyle = '#F1C40F';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F39C12';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    // 星星标记
    ctx.fillStyle = '#F1C40F';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', 0, 1);

    ctx.shadowBlur = 0;
    ctx.restore();
  });
}

export function drawPowerups(ctx: CanvasRenderingContext2D, state: GameState): void {
  state.powerups.forEach(p => {
    if (p.collected) return;

    ctx.save();
    ctx.translate(p.x, p.y);

    // 道具发光 + 上下浮动
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
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
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
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 5;
    ctx.shadowColor = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}

export function drawHUD(ctx: CanvasRenderingContext2D, state: GameState): void {
  // 顶栏背景
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0, 0, W, 60);

  // 分数
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 3;
  ctx.shadowColor = '#000';
  ctx.fillText(`🏆 ${state.score}`, 15, 25);

  // 金币
  ctx.fillStyle = '#F1C40F';
  ctx.font = '16px sans-serif';
  ctx.fillText(`💰 ${state.coinsCollected}`, 15, 48);

  // 距离
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.floor(state.distance)}m`, W - 15, 25);

  // Combo
  if (state.combo >= 3) {
    ctx.fillStyle = '#E74C3C';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🔥 ${state.combo}连击!`, W / 2, 50);
  }
  ctx.shadowBlur = 0;

  // 道具状态条
  drawPowerupStatus(ctx, state);
}

function drawPowerupStatus(ctx: CanvasRenderingContext2D, state: GameState): void {
  const statusY = H - 30;
  let statusX = 15;

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
}
