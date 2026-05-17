import type { GameEngine } from '../../services/gameEngine';
import { audioService } from '../../services/audio';
import type { GameState } from './state';
import { createInitialState } from './state';
import { spawnObstacle, spawnCoin, spawnPowerup } from './spawner';
import { spawnExplosion, spawnFloatText, activatePowerup } from './effects';
import { drawRoad, drawPlayer, drawObstacles, drawCoins, drawPowerups, drawParticles, drawHUD, drawFloatTexts } from './renderer';
import { H } from './config';

export function initRacingRun(engine: GameEngine, onEnd: () => void): void {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const state = createInitialState();

  // 输入控制
  setupInput(canvas, state);

  engine.start();
  loop(canvas, ctx, state, engine, onEnd);
}

function setupInput(canvas: HTMLCanvasElement, state: GameState): void {
  // 点击/触摸切换车道
  const switchLane = (direction: number): void => {
    const newLane = Math.max(0, Math.min(2, state.currentLane + direction));
    if (newLane !== state.currentLane) {
      state.currentLane = newLane;
      state.targetX = [80, 200, 320][state.currentLane];
      audioService.collect();
    }
  };

  // 鼠标点击：左半屏向左，右半屏向右
  canvas.onclick = (e: MouseEvent): void => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      switchLane(-1);
    } else {
      switchLane(1);
    }
  };

  // 触摸控制
  canvas.ontouchstart = (e: TouchEvent): void => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    if (x < rect.width / 2) {
      switchLane(-1);
    } else {
      switchLane(1);
    }
  };

  // 键盘控制
  document.onkeydown = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      switchLane(-1);
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      switchLane(1);
    }
  };
}

function loop(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  state: GameState,
  engine: GameEngine,
  onEnd: () => void
): void {
  if (!document.getElementById('mainGameCanvas') || state.gameEnded) return;

  update(state, engine);
  draw(ctx, state);

  requestAnimationFrame(() => loop(canvas, ctx, state, engine, onEnd));
}

function update(state: GameState, engine: GameEngine): void {
  const py = H - 120;

  state.frameCount++;
  state.distance += state.gameSpeed * state.speedMultiplier * 0.15;
  if (state.shakeFrames > 0) state.shakeFrames--;

  // 玩家平滑移动到目标车道
  state.playerX += (state.targetX - state.playerX) * 0.25;

  // 道路线动画
  state.roadLines.forEach(rl => {
    rl.y += state.gameSpeed * state.speedMultiplier * 2;
    if (rl.y > H) rl.y -= 800;
  });

  // 路边装饰动画
  state.sideObjs.forEach(o => {
    o.y += state.gameSpeed * state.speedMultiplier * 1.2;
    if (o.y > H + 50) o.y = -50;
  });

  // 道具计时器
  if (state.boostTimer > 0) {
    state.boostTimer--;
    if (state.boostTimer <= 0) state.speedMultiplier = 1;
  }
  if (state.shieldTimer > 0) state.shieldTimer--;
  if (state.magnetTimer > 0) state.magnetTimer--;
  if (state.doubleTimer > 0) state.doubleTimer--;

  // 无敌计时器
  if (state.invincible > 0) state.invincible--;

  // 速度逐渐加快（缓慢加速）
  const baseSpeed = Math.min(3 + state.distance / 500, 7);
  state.gameSpeed = baseSpeed;

  const now = Date.now();

  // 生成障碍物（固定频率）
  const obsInterval = Math.max(800, 1200 - state.distance * 0.3);
  if (now - state.lastObsTime > obsInterval) {
    spawnObstacle(state);
    if (state.distance > 200 && Math.random() > 0.6) spawnObstacle(state);
    state.lastObsTime = now;
  }

  // 生成金币
  const coinInterval = Math.max(500, 800 - state.distance * 0.2);
  if (now - state.lastCoinTime > coinInterval) {
    spawnCoin(state);
    if (state.distance > 300 && Math.random() > 0.5) spawnCoin(state);
    state.lastCoinTime = now;
  }

  // 生成道具
  const powerupInterval = Math.max(2500, 4000 - state.distance * 0.3);
  if (now - state.lastPowerupTime > powerupInterval) {
    spawnPowerup(state);
    state.lastPowerupTime = now;
  }

  // 障碍物更新
  updateObstacles(state, engine, py);

  // 金币更新和碰撞检测
  updateCoins(state, engine, py);

  // 道具更新和碰撞检测
  updatePowerups(state, py);
}

function updateObstacles(state: GameState, engine: GameEngine, py: number): void {
  for (let i = state.obstacles.length - 1; i >= 0; i--) {
    const o = state.obstacles[i];
    o.y += state.gameSpeed * state.speedMultiplier * 2;

    if (o.y > H + 100) {
      state.obstacles.splice(i, 1);
      // 成功躲避得分
      const baseScore = (10 + state.combo * 2) * (state.doubleTimer > 0 ? 2 : 1);
      state.score += baseScore;
      state.combo++;
      engine.addScore(baseScore, o.x, py);
      continue;
    }

    // 碰撞检测（同车道 + Y轴重叠）
    if (o.lane === state.currentLane && state.invincible <= 0) {
      const hitY = o.y + o.h > py && o.y < py + state.playerH;
      if (hitY) {
        if (state.shieldTimer > 0) {
          // 护盾挡住
          state.shieldTimer = 0;
          spawnExplosion(state, o.x, o.y + o.h / 2, 25, '#3498DB');
          spawnFloatText(state, state.playerX, py - 30, '🛡️ 挡住了!', '#3498DB');
          state.obstacles.splice(i, 1);
          state.invincible = 40;
          audioService.win();
        } else {
          // 碰撞！
          state.combo = 0;
          state.invincible = 80;
          state.shakeFrames = 20;
          audioService.lose();
          spawnExplosion(state, state.playerX, py + state.playerH / 2, 40, '#E74C3C');
          spawnFloatText(state, state.playerX, py - 30, '💥 哎呀!', '#E74C3C');
          state.score = Math.max(0, state.score - 50);
          state.obstacles.splice(i, 1);
        }
      }
    }
  }
}

function updateCoins(state: GameState, engine: GameEngine, py: number): void {
  for (let i = state.coins.length - 1; i >= 0; i--) {
    const c = state.coins[i];
    if (c.collected) {
      state.coins.splice(i, 1);
      continue;
    }

    c.y += state.gameSpeed * state.speedMultiplier * 2;

    // 磁铁吸引金币
    if (state.magnetTimer > 0) {
      const dist = Math.sqrt((c.x - state.playerX) ** 2 + (c.y - py) ** 2);
      if (dist < 150) {
        c.x += (state.playerX - c.x) * 0.15;
        c.y += (py - c.y) * 0.15;
      }
    }

    if (c.y > H + 40) {
      state.coins.splice(i, 1);
      continue;
    }

    // 碰撞检测
    const hitY = c.y + c.h / 2 > py && c.y - c.h / 2 < py + state.playerH;
    if ((c.lane === state.currentLane && hitY) || (state.magnetTimer > 0 && Math.sqrt((c.x - state.playerX) ** 2 + (c.y - py) ** 2) < 35)) {
      c.collected = true;
      state.coinsCollected++;
      const coinScore = 20 * (state.doubleTimer > 0 ? 2 : 1);
      state.score += coinScore;
      engine.addScore(coinScore, c.x, c.y);
      audioService.collect();
      // 金币收集特效
      for (let j = 0; j < 10; j++) {
        state.particles.push({
          x: c.x, y: c.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 0.8, maxLife: 0.8,
          color: '#F1C40F',
          size: 4 + Math.random() * 4,
        });
      }
    }
  }
}

function updatePowerups(state: GameState, py: number): void {
  for (let i = state.powerups.length - 1; i >= 0; i--) {
    const p = state.powerups[i];
    if (p.collected) {
      state.powerups.splice(i, 1);
      continue;
    }

    p.y += state.gameSpeed * state.speedMultiplier * 2;

    if (p.y > H + 40) {
      state.powerups.splice(i, 1);
      continue;
    }

    // 碰撞检测
    if (p.lane === state.currentLane) {
      const hitY = p.y + p.h / 2 > py && p.y - p.h / 2 < py + state.playerH;
      if (hitY) {
        p.collected = true;
        activatePowerup(state, p.type, p.x, p.y);
      }
    }
  }
}

function draw(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.save();
  if (state.shakeFrames > 0) {
    ctx.translate((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);
  }
  drawRoad(ctx, state);
  drawCoins(ctx, state);
  drawPowerups(ctx, state);
  drawObstacles(ctx, state);
  drawParticles(ctx, state);
  drawPlayer(ctx, state);
  drawHUD(ctx, state);
  drawFloatTexts(ctx, state);
  ctx.restore();
}
