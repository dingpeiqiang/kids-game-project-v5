// 渲染系统模块
import { GAME_CONFIG, LEVEL_STATS } from './config';
import type { GameState } from './types';
import { drawEnemy } from './enemies';

// 绘制背景
export function drawBackground(ctx: CanvasRenderingContext2D, state: GameState): void {
  // 渐变背景
  const grad = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.CANVAS_HEIGHT);
  grad.addColorStop(0, '#0a0a1e');
  grad.addColorStop(0.5, '#0d1b2a');
  grad.addColorStop(1, '#1b2838');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

  // 星星
  for (const s of state.stars) {
    ctx.fillStyle = `rgba(255,255,255,${s.bright})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // 科技网格
  ctx.strokeStyle = 'rgba(0,229,255,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < GAME_CONFIG.CANVAS_WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, GAME_CONFIG.CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < GAME_CONFIG.CANVAS_HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH, y);
    ctx.stroke();
  }
}

// 绘制玩家
export function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.invincible > 0 && Math.floor(state.invincible * 10) % 2 === 0) return;

  ctx.save();
  ctx.translate(state.playerX, state.playerY);
  ctx.rotate(state.shootAngle + Math.PI / 2);

  // 引擎火焰
  const flicker = Math.random() * 4;
  const flameGrad = ctx.createLinearGradient(0, 12, 0, 22 + flicker);
  flameGrad.addColorStop(0, '#00E5FF');
  flameGrad.addColorStop(0.5, '#FF6B6B');
  flameGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.moveTo(-6, 12);
  ctx.lineTo(0, 22 + flicker);
  ctx.lineTo(6, 12);
  ctx.fill();

  // 角色主体（八边形）
  const r = 14;
  ctx.fillStyle = state.speedBoost > 0 ? '#00E5FF' : '#45B7D1';
  ctx.shadowColor = state.speedBoost > 0 ? '#00E5FF' : '#45B7D1';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i - Math.PI / 8;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // 内部装饰
  ctx.fillStyle = '#2E86AB';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  // 核心发光
  ctx.fillStyle = state.atkBoost > 0 ? '#FF6B6B' : '#00E5FF';
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 武器指示
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(0, -r - 6);
  ctx.lineTo(-3, -r);
  ctx.lineTo(3, -r);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // 等级显示
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Lv.${state.playerLevel}`, state.playerX, state.playerY - 22);
}

// 绘制子弹
export function drawBullets(ctx: CanvasRenderingContext2D, state: GameState): void {
  // 玩家子弹
  for (const b of state.bullets) {
    const bulletColor = b.tracking ? '#00FF88' : b.color;
    ctx.fillStyle = bulletColor;
    ctx.shadowColor = bulletColor;
    ctx.shadowBlur = b.tracking ? 16 : 12;
    
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.tracking ? 6 : 5, 0, Math.PI * 2);
    ctx.fill();

    // 拖尾效果
    ctx.shadowBlur = 0;
    const trailLength = b.tracking ? 4 : 3;
    for (let t = 1; t <= trailLength; t++) {
      const alpha = 1 - (t / trailLength);
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = bulletColor;
      ctx.beginPath();
      ctx.arc(
        b.x - b.vx * t * 0.8,
        b.y - b.vy * t * 0.8,
        (b.tracking ? 6 : 5) * (1 - t * 0.2),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.shadowBlur = 0;

  // 敌人子弹
  for (const b of state.enemyBullets) {
    ctx.fillStyle = b.color;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

// 绘制掉落物
export function drawDrops(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const d of state.drops) {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
    ctx.shadowColor = d.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.icon, 0, 0);
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// 绘制浮动文字
export function drawFloatTexts(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (const ft of state.floatTexts) {
    ctx.globalAlpha = ft.life;
    ctx.fillStyle = ft.color;
    ctx.font = `bold ${ft.size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 6;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}

// 绘制HUD界面
export function drawHUD(ctx: CanvasRenderingContext2D, state: GameState): void {
  // 时间
  const timeLeft = Math.max(0, GAME_CONFIG.GAME_DURATION - state.elapsed);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 3;
  ctx.fillText(`⏱ ${Math.ceil(timeLeft)}s`, 12, 28);
  ctx.shadowBlur = 0;

  // 分数
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`★ ${state.score}`, GAME_CONFIG.CANVAS_WIDTH - 12, 28);

  // 经验条
  const expBarW = 120, expBarH = 10;
  const expX = GAME_CONFIG.CANVAS_WIDTH / 2 - expBarW / 2;
  const expY = 15;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(expX, expY, expBarW, expBarH);
  ctx.fillStyle = '#9B59B6';
  ctx.fillRect(expX, expY, expBarW * (state.playerExp / state.expToLevel), expBarH);
  ctx.strokeStyle = '#9B59B6';
  ctx.lineWidth = 1;
  ctx.strokeRect(expX, expY, expBarW, expBarH);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Lv.${state.playerLevel}`, GAME_CONFIG.CANVAS_WIDTH / 2, expY - 4);

  // 血条
  const hpBarW = 80, hpBarH = 8;
  const hpX = 12, hpY = GAME_CONFIG.CANVAS_HEIGHT - 15;
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(hpX, hpY - hpBarH, hpBarW, hpBarH);
  const hpRatio = state.playerHP / state.playerMaxHP;
  const hpColor = hpRatio > 0.6 ? '#00E676' : hpRatio > 0.3 ? '#FFA502' : '#FF4757';
  ctx.fillStyle = hpColor;
  ctx.fillRect(hpX, hpY - hpBarH, hpBarW * hpRatio, hpBarH);

  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`❤️ ${state.playerHP}/${state.playerMaxHP}`, hpX, hpY - hpBarH - 4);

  // 攻击加成显示
  if (state.atkBoost > 0) {
    ctx.fillStyle = '#FF6B6B';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`🔥 ATK+${state.atkBoost.toFixed(1)}`, GAME_CONFIG.CANVAS_WIDTH - 12, GAME_CONFIG.CANVAS_HEIGHT - 20);
  }

  // 速度加成显示
  if (state.speedBoost > 0) {
    ctx.fillStyle = '#00E5FF';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`⚡ SPD+${state.speedBoost.toFixed(1)}`, GAME_CONFIG.CANVAS_WIDTH - 12, GAME_CONFIG.CANVAS_HEIGHT - 35);
  }

  // 能量条
  const energyBarW = 80, energyBarH = 6;
  const energyX = GAME_CONFIG.CANVAS_WIDTH - 12 - energyBarW;
  const energyY = GAME_CONFIG.CANVAS_HEIGHT - 50;
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(energyX, energyY, energyBarW, energyBarH);
  ctx.fillStyle = '#A855F7';
  ctx.fillRect(energyX, energyY, energyBarW * (state.energy / state.maxEnergy), energyBarH);
  ctx.strokeStyle = '#A855F7';
  ctx.lineWidth = 1;
  ctx.strokeRect(energyX, energyY, energyBarW, energyBarH);
  
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`⚡ ${Math.floor(state.energy)}/${state.maxEnergy}`, GAME_CONFIG.CANVAS_WIDTH - 12, energyY - 3);

  // 道具效果状态指示器
  let effectY = GAME_CONFIG.CANVAS_HEIGHT - 50;
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px sans-serif';
  if (state.freezeTimer > 0) {
    ctx.fillStyle = '#74B9FF';
    ctx.fillText(`❄️ 冻结 ${state.freezeTimer.toFixed(1)}s`, 12, effectY);
    effectY -= 18;
  }
  if (state.laserTimer > 0) {
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`⚡ 激光 ${state.laserTimer.toFixed(1)}s`, 12, effectY);
    effectY -= 18;
  }
  if (state.cloneTimer > 0) {
    ctx.fillStyle = '#A855F7';
    ctx.fillText(`👾 分身 ${state.cloneTimer.toFixed(1)}s`, 12, effectY);
    effectY -= 18;
  }
  if (state.score2xTimer > 0) {
    ctx.fillStyle = '#FFD93D';
    ctx.fillText(`✨ 2x ${state.score2xTimer.toFixed(1)}s`, 12, effectY);
    effectY -= 18;
  }
  if (state.shieldCount > 0) {
    ctx.fillStyle = '#4D96FF';
    ctx.fillText(`🛡️ ×${state.shieldCount}`, 12, effectY);
  }

  // 连击显示
  if (state.combo >= 3) {
    ctx.fillStyle = '#FF6B6B';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FF6B6B';
    ctx.shadowBlur = 8;
    ctx.fillText(`${state.combo}x 连击!`, GAME_CONFIG.CANVAS_WIDTH / 2, 55);
    ctx.shadowBlur = 0;
  }
}

// 应用屏幕特效（震动、闪光）
export function applyScreenEffects(ctx: CanvasRenderingContext2D, state: GameState): void {
  // 受伤闪屏
  if (state.screenFlash > 0) {
    ctx.fillStyle = `rgba(255,50,50,${state.screenFlash * 0.4})`;
    ctx.fillRect(-20, -20, GAME_CONFIG.CANVAS_WIDTH + 40, GAME_CONFIG.CANVAS_HEIGHT + 40);
  }
}

// 绘制能量满光环
export function drawEnergyAura(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.energy >= state.maxEnergy) {
    ctx.save();
    ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
    ctx.strokeStyle = '#A855F7';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#A855F7';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(state.playerX, state.playerY, state.autoCollectRadius * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// 绘制开始界面
export function drawStartScreen(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, GAME_CONFIG.CANVAS_HEIGHT / 2 - 65, GAME_CONFIG.CANVAS_WIDTH, 130);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎮 星际猎手', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 - 20);
  ctx.font = '14px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('移动鼠标/键盘控制移动', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 8);
  ctx.fillText('自动射击 · 击杀敌人获得经验升级!', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 28);
}

// 绘制游戏结束界面
export function drawGameOver(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, GAME_CONFIG.CANVAS_HEIGHT / 2 - 80, GAME_CONFIG.CANVAS_WIDTH, 160);
  
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 10;
  ctx.fillText('🏆 游戏结束', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 - 40);
  ctx.shadowBlur = 0;
  
  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.fillText(`最终得分: ${state.score}`, GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 - 5);
  ctx.fillText(`达到等级: Lv.${state.playerLevel}`, GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 20);
  ctx.fillText(`最高连击: ${state.combo}x`, GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 45);
  
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '14px sans-serif';
  ctx.fillText('点击重新开始', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 70);
}
