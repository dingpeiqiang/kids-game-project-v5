import type { GameEngine } from '@shell/services/gameEngine';
import { gameActions } from '@shell/platform/gameBridge';
import type { GameLifecycle } from '@shell/platform/GameLifecycle';
import type { GameLifecycleContext } from '@shell/platform/GameLifecycle';
import { createLifecycleContext } from '@shell/platform/frameworkSession';
import { hostCanvas2D } from '@shell/platform/hostCanvas2D';
import { audioService } from '@shell/services/audio';
import type { GameState } from './state';
import { createInitialState } from './state';
import { spawnObstacle, spawnCoin, spawnPowerup } from './spawner';
import { spawnExplosion, spawnFloatText, activatePowerup } from './effects';
import { drawRoad, drawPlayer, drawObstacles, drawCoins, drawPowerups, drawParticles, drawBullets, drawHUD, drawFloatTexts } from './renderer';
import { H, W, LEVELS, SPEED_RECOVERY_RATE, OBSTACLE_CONFIG, SCENES, SCENE_SWITCH_DISTANCE, COLLISION_SLOW_DURATION } from './config';
import {
  applyCanvasMobileStyles,
  bindCanvasDragFollowAndLaneTap,
} from '@shell/utils/canvasMobileUtils';
import { bindDesktopControls } from '@shell/platform/mobileControls';
import { mergeLayout } from '@shell/platform/mobileControls/layout';

let activeHost: GameLifecycle | null = null;

export function destroyRacingRun(): void {
  activeHost?.destroy();
  activeHost = null;
}

export function initRacingRun(
  engine: GameEngine,
  onEnd: () => void,
  carColor: 'red' | 'blue' | 'yellow' = 'blue',
): void {
  destroyRacingRun();
  const lifecycleCtx = createLifecycleContext('racingRun', engine, onEnd);
  if (!lifecycleCtx?.canvas) {
    onEnd();
    return;
  }
  activeHost = startRacingRunLifecycle(lifecycleCtx, carColor);
}

function startRacingRunLifecycle(
  lifecycleCtx: GameLifecycleContext,
  carColor: 'red' | 'blue' | 'yellow',
): GameLifecycle {
  const canvas = lifecycleCtx.canvas!;
  const engine = lifecycleCtx.engine;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const state = createInitialState(carColor);
  let cleanupInput: (() => void) | null = null;

  const finishRace = (victory: boolean) => {
    if (state.gameEnded) return;
    state.gameEnded = true;
    cleanupInput?.();
    cleanupInput = null;
    gameActions.gameOver({
      victory,
      score: engine.getScore(),
      stats: {
        distance: Math.floor(state.distance),
        level: state.currentLevel,
        coins: state.coinsCollected,
      },
    });
  };

  return hostCanvas2D(lifecycleCtx, {
    onInit() {
      cleanupInput = setupInput(canvas, state);
    },
    onUpdate(_dt) {
      if (state.gameEnded) return;
      update(state, engine, finishRace);
    },
    onRender() {
      draw(ctx, state);
    },
    onDestroy() {
      cleanupInput?.();
      cleanupInput = null;
    },
  });
}

function setupInput(canvas: HTMLCanvasElement, state: GameState): () => void {
  applyCanvasMobileStyles(canvas);

  const LANE_XS = [80, 200, 320];
  const MIN_X = 50;
  const MAX_X = W - 50;

  const snapToNearestLane = (canvasX: number): void => {
    let closestLane = 0;
    let minDistance = Math.abs(canvasX - LANE_XS[0]);
    for (let i = 1; i < LANE_XS.length; i++) {
      const distance = Math.abs(canvasX - LANE_XS[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closestLane = i;
      }
    }
    state.targetX = LANE_XS[closestLane];
    state.currentLane = closestLane;
    audioService.collect();
  };

  const switchLane = (direction: number): void => {
    const newLane = Math.max(0, Math.min(2, state.currentLane + direction));
    if (newLane !== state.currentLane) {
      state.currentLane = newLane;
      state.targetX = LANE_XS[state.currentLane];
      audioService.collect(); // 变道音效
    }
  };

  const layout = mergeLayout(W, H, { viewWidth: W, viewHeight: H, buttons: [] });

  const unbindDrag = bindCanvasDragFollowAndLaneTap(canvas, {
    logicalWidth: W,
    onDragMove: (x) => {
      state.targetX = Math.max(MIN_X, Math.min(MAX_X, x));
    },
    onRelease: (x, wasDrag) => {
      if (!wasDrag) {
        if (x < W / 2) switchLane(-1);
        else switchLane(1);
      } else {
        snapToNearestLane(x);
      }
    },
  });

  const unbindDesktop = bindDesktopControls({
    canvas,
    preset: 'portrait_swipe_lane',
    layout,
    enablePointer: false,
    keyboardProfile: {
      buttons: { Space: 'fire' },
    },
    onAction: (action, payload) => {
      if (action === 'lane_left') switchLane(-1);
      if (action === 'lane_right') switchLane(1);
      if (action === 'button_down' && payload.id === 'fire' && state.vehicleForm === 'tank') {
        fireBullet(state);
      }
    },
  });

  return (): void => {
    unbindDrag();
    unbindDesktop();
  };
}

function update(
  state: GameState,
  engine: GameEngine,
  finishRace: (victory: boolean) => void,
): void {
  const py = H - 240;

  state.frameCount++;

  // 每30帧播放一次引擎声（约0.5秒一次）
  if (state.frameCount % 30 === 0 && !state.gameEnded) {
    if (state.boostTimer > 0) {
      audioService.engineBoost(); // 加速时播放加速音效
    } else {
      audioService.engine(); // 正常引擎声
    }
  }
  
  // 添加车辆尾迹粒子效果
  if (state.frameCount % 3 === 0 && !state.gameEnded) {
    const py = H - 240;
    const trailColor = state.boostTimer > 0 ? '#FF6B00' : 
                       state.vehicleForm === 'spaceship' ? '#00CED1' :
                       state.vehicleForm === 'tank' ? '#27AE60' :
                       state.vehicleForm === 'mecha' ? '#E67E22' : '#3498DB';
    
    // 主尾迹
    state.particles.push({
      x: state.playerX + (Math.random() - 0.5) * 10,
      y: py + state.playerH,
      vx: (Math.random() - 0.5) * 2,
      vy: 3 + Math.random() * 3,
      life: 0.5, maxLife: 0.5,
      color: trailColor,
      size: 4 + Math.random() * 4,
    });
    
    // 加速时添加更多尾迹
    if (state.boostTimer > 0) {
      for (let i = 0; i < 2; i++) {
        state.particles.push({
          x: state.playerX + (Math.random() - 0.5) * 15,
          y: py + state.playerH + 5,
          vx: (Math.random() - 0.5) * 3,
          vy: 4 + Math.random() * 4,
          life: 0.4, maxLife: 0.4,
          color: Math.random() > 0.5 ? '#FF6B00' : '#F1C40F',
          size: 5 + Math.random() * 6,
        });
      }
    }
  }

  if (state.gameEnded) return;

  const currentLevelConfig = LEVELS[state.currentLevel - 1];
  if (!currentLevelConfig) return;

  if (state.frameCount % 60 === 0 && !state.levelComplete) {
    state.timeRemaining -= 1;
    if (state.timeRemaining <= 0) {
      finishRace(false);
      return;
    }
  }

  if (state.distance >= currentLevelConfig.distanceGoal && !state.levelComplete) {
    state.levelComplete = true;
    spawnFloatText(state, W / 2, H / 2, `🎉 第${state.currentLevel}关完成!`, '#00FF00');
    if (state.currentLevel >= LEVELS.length) {
      state.gameWon = true;
      finishRace(true);
      return;
    } else {
      // 暂停游戏元素的生成
      state.lastObsTime = Date.now() + 3000; // 延迟3秒再生成障碍物
      state.lastCoinTime = Date.now() + 3000; // 延迟3秒再生成金币
      state.lastPowerupTime = Date.now() + 3000; // 延迟3秒再生成道具
      
      setTimeout(() => {
        nextLevel(state);
      }, 2000);
      return;
    }
  }

  updateSceneTransition(state);

  const actualSpeedMultiplier = state.speedMultiplier * state.slowMultiplier;
  state.distance += state.gameSpeed * actualSpeedMultiplier * 0.15;

  if (state.shakeFrames > 0) state.shakeFrames--;

  // 优化：车辆移动物理 - 更快速响应，更丝滑
  const prevX = state.playerX;
  
  // 根据车辆形态调整转向速度（提升灵敏度）
  let moveSpeed = 0.4; // 基础车：0.25->0.4，更快响应
  
  // 不同形态有不同的转向特性
  if (state.vehicleForm === 'spaceship') {
    moveSpeed = 0.55; // 飞船：0.35->0.55，超级灵活
  } else if (state.vehicleForm === 'tank') {
    moveSpeed = 0.32; // 坦克：0.18->0.32，虽然笨重但也要跟手
  } else if (state.vehicleForm === 'mecha') {
    moveSpeed = 0.45; // 机甲：0.22->0.45，反应迅速
  }
  
  // 应用转向（使用更快的插值速度）
  state.playerX += (state.targetX - state.playerX) * moveSpeed;
  
  // 优化：倾斜效果更明显，增强视觉反馈
  const dx = state.playerX - prevX;
  state.tilt += (dx * 0.06 - state.tilt) * 0.2; // 提高倾斜灵敏度

  state.roadLines.forEach(rl => {
    rl.y += state.gameSpeed * actualSpeedMultiplier * 1.5;
    if (rl.y > H) rl.y -= 800;
  });

  state.sideObjs.forEach(o => {
    o.y += state.gameSpeed * actualSpeedMultiplier * 1.0;
    if (o.y > H + 50) o.y = -50;
  });

  if (state.boostTimer > 0) {
    state.boostTimer--;
    if (state.boostTimer <= 0) {
      if (state.vehicleForm === 'tank') {
        state.speedMultiplier = 1.4;
      } else if (state.vehicleForm === 'spaceship') {
        state.speedMultiplier = 1.5;
      } else if (state.vehicleForm === 'mecha') {
        state.speedMultiplier = 1.45;
      } else if (state.magnetTimer > 0) {
        state.speedMultiplier = 1.2;
      } else {
        state.speedMultiplier = 1;
      }
    }
  }
  if (state.shieldTimer > 0) state.shieldTimer--;
  
  // 优化：磁铁增加速度效果
  if (state.magnetTimer > 0) {
    state.magnetTimer--;
    state.speedMultiplier = Math.max(state.speedMultiplier, 1.2); // 磁铁提供20%加速
  }
  
  if (state.doubleTimer > 0) state.doubleTimer--;
  if (state.invincibleTimer > 0) state.invincibleTimer--;
  
  if (state.spaceshipTimer > 0) {
    state.spaceshipTimer--;
    if (state.spaceshipTimer <= 0) {
      state.vehicleForm = 'car';
      if (state.boostTimer <= 0) state.speedMultiplier = 1;
      spawnFloatText(state, W / 2, H / 2, '🚗 变回跑车!', '#3498DB');
    }
  }
  if (state.tankTimer > 0) {
    state.tankTimer--;
    if (state.tankTimer <= 0) {
      state.vehicleForm = 'car';
      if (state.boostTimer <= 0) state.speedMultiplier = 1;
      spawnFloatText(state, W / 2, H / 2, '🚗 变回跑车!', '#3498DB');
    }
  }
  if (state.mechaTimer > 0) {
    state.mechaTimer--;
    if (state.mechaTimer <= 0) {
      state.vehicleForm = 'car';
      if (state.boostTimer <= 0) state.speedMultiplier = 1;
      spawnFloatText(state, W / 2, H / 2, '🚗 变回跑车!', '#3498DB');
    }
  }

  if (state.collisionSlowTimer > 0) {
    state.collisionSlowTimer--;
    state.slowMultiplier += SPEED_RECOVERY_RATE;
    if (state.slowMultiplier >= 1) {
      state.slowMultiplier = 1;
      state.collisionSlowTimer = 0;
    }
  }

  if (state.collisionFlash > 0) state.collisionFlash--;

  state.baseSpeed = Math.min(2.5 + state.distance / 800, currentLevelConfig.maxSpeed);
  state.gameSpeed = state.baseSpeed;

  const now = Date.now();

  const obsInterval = Math.random() * (currentLevelConfig.maxObsInterval - currentLevelConfig.minObsInterval) + currentLevelConfig.minObsInterval;
  if (now - state.lastObsTime > obsInterval) {
    spawnObstacle(state);
    if (state.distance > 250 && Math.random() > 0.75) spawnObstacle(state);
    state.lastObsTime = now;
  }

  const coinInterval = Math.random() * (currentLevelConfig.maxCoinInterval - currentLevelConfig.minCoinInterval) + currentLevelConfig.minCoinInterval;
  if (now - state.lastCoinTime > coinInterval) {
    spawnCoin(state);
    if (state.distance > 300 && Math.random() > 0.5) spawnCoin(state);
    state.lastCoinTime = now;
  }

  const powerupInterval = Math.random() * (currentLevelConfig.maxPowerupInterval - currentLevelConfig.minPowerupInterval) + currentLevelConfig.minPowerupInterval;
  if (now - state.lastPowerupTime > powerupInterval) {
    spawnPowerup(state);
    state.lastPowerupTime = now;
  }

  updateObstacles(state, engine, py);
  updateCoins(state, engine, py);
  updatePowerups(state, py);
  
  // 坦克自动射击（每60帧约1秒发射一次）
  if (state.vehicleForm === 'tank') {
    state.autoFireTimer = (state.autoFireTimer || 0) + 1;
    if (state.autoFireTimer >= 30) { // 30帧 = 0.5秒，提高射击频率
      fireBullet(state);
      state.autoFireTimer = 0;
    }
  }
  
  updateBullets(state, engine); // 更新炮弹
}

// 坦克发射炮弹 - 全屏攻击
function fireBullet(state: GameState): void {
  if (state.vehicleForm !== 'tank') return;
  
  const py = H - 240;
  state.bullets.push({
    x: W / 2,
    y: py - 20,
    speed: 10,
    isWide: true, // 标记为全屏攻击炮弹
  });
  
  // 播放开炮音效
  audioService.shoot();
}

// 更新炮弹
function updateBullets(state: GameState, engine: GameEngine): void {
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    b.y -= b.speed;
    
    // 全屏攻击炮弹：击中时清除所有障碍物
    if (b.isWide && b.y < H / 2) {
      // 清除所有障碍物
      if (state.obstacles.length > 0) {
        state.obstacles.forEach(o => {
          spawnExplosion(state, o.x, o.y + o.h / 2, 25, '#FF6B00');
          state.score += 15;
        });
        spawnFloatText(state, W / 2, H / 3, '💥 全屏清除!', '#FF6B00');
        state.obstacles = [];
        audioService.explosion();
      }
      state.bullets.splice(i, 1);
      continue;
    }
    
    // 普通炮弹：检查是否击中障碍物
    let hit = false;
    for (let j = state.obstacles.length - 1; j >= 0; j--) {
      const o = state.obstacles[j];
      const dist = Math.sqrt((b.x - o.x) ** 2 + (b.y - (o.y + o.h / 2)) ** 2);
      if (dist < 30) {
        // 击中障碍物
        spawnExplosion(state, o.x, o.y + o.h / 2, 20, '#FF6B00');
        spawnFloatText(state, o.x, o.y, '💥 击毁!', '#FF6B00');
        state.obstacles.splice(j, 1);
        state.score += 15;
        hit = true;
        audioService.explosion();
        break;
      }
    }
    
    if (hit || b.y < -20) {
      state.bullets.splice(i, 1);
    }
  }
}

function nextLevel(state: GameState): void {
  if (state.currentLevel >= LEVELS.length) return;
  
  state.currentLevel++;
  const newLevel = LEVELS[state.currentLevel - 1];
  if (!newLevel) return;
  
  // 重置关卡相关状态
  state.distance = 0;
  state.timeRemaining = newLevel.timeLimit;
  state.levelComplete = false;
  state.combo = 0;
  
  // 清除所有游戏元素
  state.obstacles = [];
  state.coins = [];
  state.powerups = [];
  state.particles = [];
  state.floatTexts = [];
  
  // 重置道具计时器
  state.boostTimer = 0;
  state.shieldTimer = 0;
  state.magnetTimer = 0;
  state.doubleTimer = 0;
  state.invincibleTimer = 0;
  state.spaceshipTimer = 0;
  state.tankTimer = 0;
  state.mechaTimer = 0;
  
  // 重置速度相关状态
  state.speedMultiplier = 1;
  state.slowMultiplier = 1;
  state.collisionSlowTimer = 0;
  state.collisionFlash = 0;
  state.baseSpeed = 2.5;
  state.gameSpeed = 2.5;
  
  // 重置场景过渡状态
  state.sceneTransitionProgress = 0;
  
  // 重置车辆形态
  state.vehicleForm = 'car';
  state.transforming = false;
  
  // 根据新关卡配置设置场景
  if (newLevel.availableScenes && newLevel.availableScenes.length > 0) {
    const sceneTypes = Object.keys(SCENES) as Array<keyof typeof SCENES>;
    const availableSceneKeys = newLevel.availableScenes.filter(scene => 
      sceneTypes.includes(scene as keyof typeof SCENES)
    ) as Array<keyof typeof SCENES>;
    
    if (availableSceneKeys.length > 0) {
      // 选择新关卡的第一个可用场景
      state.currentScene = availableSceneKeys[0];
      state.nextScene = availableSceneKeys[1] || availableSceneKeys[0];
      
      // 重新初始化路边对象
      state.sideObjs = Array.from({ length: 6 }, (_, i) => ({
        y: i * 120,
        side: i % 2,
        type: SCENES[state.currentScene].objects[Math.floor(Math.random() * SCENES[state.currentScene].objects.length)],
      }));
    }
  }
  
  // 显示新关卡提示
  spawnFloatText(state, W / 2, H / 2, `🚀 第${state.currentLevel}关!`, '#00BFFF');
}

function updateSceneTransition(state: GameState): void {
  const sceneTypes = Object.keys(SCENES) as Array<keyof typeof SCENES>;
  const currentSceneIndex = sceneTypes.indexOf(state.currentScene);
  
  const targetDistance = Math.floor(state.distance / SCENE_SWITCH_DISTANCE) * SCENE_SWITCH_DISTANCE + SCENE_SWITCH_DISTANCE;
  
  if (state.distance >= targetDistance && state.sceneTransitionProgress === 0) {
    const nextIndex = (currentSceneIndex + 1) % sceneTypes.length;
    state.nextScene = sceneTypes[nextIndex];
    state.sceneTransitionProgress = 0.01;
    spawnFloatText(state, W / 2, H / 2 - 80, `🌍 ${SCENES[state.nextScene].name}!`, '#00CED1');
  }
  
  if (state.sceneTransitionProgress > 0 && state.sceneTransitionProgress < 1) {
    state.sceneTransitionProgress += 0.015;
    
    if (state.sceneTransitionProgress >= 1) {
      state.sceneTransitionProgress = 0;
      state.currentScene = state.nextScene;
      
      state.sideObjs = Array.from({ length: 6 }, (_, i) => ({
        y: i * 120,
        side: i % 2,
        type: SCENES[state.currentScene].objects[Math.floor(Math.random() * SCENES[state.currentScene].objects.length)],
      }));
    }
  }
}

function updateObstacles(state: GameState, engine: GameEngine, py: number): void {
  const actualPlayerY = py;
  const actualSpeedMultiplier = state.speedMultiplier * state.slowMultiplier;

  for (let i = state.obstacles.length - 1; i >= 0; i--) {
    const o = state.obstacles[i];
    o.y += state.gameSpeed * actualSpeedMultiplier * 1.5;
    
    if (o.vx) {
      o.x += o.vx;
      if (o.x < 50 || o.x > W - 50) {
        o.vx = -o.vx;
      }
    }

    const obsCenterX = o.x;
    const playerCenterX = state.playerX;
    const xDist = Math.abs(obsCenterX - playerCenterX);
    const HIT_THRESHOLD = o.type === 'oil' || o.type === 'water' ? 45 : 35;

    if (!o.nearMissAwarded && xDist > HIT_THRESHOLD + 20 && state.invincibleTimer <= 0) {
      const obsCenter = o.y + o.h / 2;
      const playerCenter = actualPlayerY + state.playerH / 2;
      if (obsCenter > playerCenter - 15 && obsCenter < playerCenter + 25) {
        o.nearMissAwarded = true;
        const bonus = 30 * (state.doubleTimer > 0 ? 2 : 1);
        state.score += bonus;
        audioService.nearMiss(); // 完美闪避音效
        spawnFloatText(state, state.playerX, actualPlayerY - 30, '⚡ 完美闪避!', '#F1C40F');
        spawnExplosion(state, state.playerX, actualPlayerY + state.playerH / 2, 10, '#F1C40F');
      }
    }

    if (o.y > H + 100) {
      state.obstacles.splice(i, 1);
      const baseScore = (10 + state.combo * 2) * (state.doubleTimer > 0 ? 2 : 1);
      state.score += baseScore;
      state.combo++;
      gameActions.addScore(baseScore, o.x, actualPlayerY);
      continue;
    }

    if (xDist < HIT_THRESHOLD) {
      if (o.hitProcessed) continue;
      const hitY = o.y + o.h > actualPlayerY && o.y < actualPlayerY + state.playerH;
      if (hitY) {
        o.hitProcessed = true;
        if (state.spaceshipTimer > 0) {
          spawnFloatText(state, o.x, o.y, '✨ 穿墙而过!', '#00CED1');
          state.score += 10;
          state.obstacles.splice(i, 1);
        } else if (state.tankTimer > 0) {
          spawnExplosion(state, o.x, o.y + o.h / 2, 30, '#27AE60');
          spawnFloatText(state, o.x, o.y, '💥 撞碎!', '#27AE60');
          state.score += 20;
          state.obstacles.splice(i, 1);
          audioService.win();
        } else if (state.mechaTimer > 0) {
          spawnExplosion(state, o.x, o.y + o.h / 2, 35, '#E67E22');
          spawnFloatText(state, o.x, o.y, '⚡ 摧毁!', '#E67E22');
          state.score += 30;
          state.obstacles.splice(i, 1);
          audioService.win();
        } else if (state.shieldTimer > 0) {
          state.shieldTimer = 0;
          spawnExplosion(state, o.x, o.y + o.h / 2, 25, '#3498DB');
          spawnFloatText(state, state.playerX, actualPlayerY - 30, '🛡️ 挡住了!', '#3498DB');
          state.obstacles.splice(i, 1);
          state.invincibleTimer = 40;
          audioService.win();
        } else if (state.invincibleTimer <= 0) {
          state.combo = 0;
          state.invincibleTimer = 80;
          state.shakeFrames = 30;
          audioService.crash(); // 撞击音效

          const cfg = OBSTACLE_CONFIG[o.type];
          const slowAmount = cfg ? cfg.slowAmount : 0.3;
          state.slowMultiplier = Math.max(0.1, 1 - slowAmount);
          state.collisionSlowTimer = COLLISION_SLOW_DURATION;
          state.collisionFlash = 30;

          spawnExplosion(state, state.playerX, actualPlayerY + state.playerH / 2, 40, '#E74C3C');
          spawnFloatText(state, state.playerX, actualPlayerY - 30, '💥 碰撞!', '#E74C3C');
          state.score = Math.max(0, state.score - 50);
          state.obstacles.splice(i, 1);
        }
      }
    }
  }
}

function updateCoins(state: GameState, engine: GameEngine, py: number): void {
  const actualPlayerY = py;
  const actualSpeedMultiplier = state.speedMultiplier * state.slowMultiplier;

  for (let i = state.coins.length - 1; i >= 0; i--) {
    const c = state.coins[i];
    if (c.collected) {
      state.coins.splice(i, 1);
      continue;
    }

    c.y += state.gameSpeed * actualSpeedMultiplier * 2;

    const hasMagnet = state.magnetTimer > 0 || 
                      state.spaceshipTimer > 0 || 
                      state.tankTimer > 0 || 
                      state.mechaTimer > 0;
    
    if (hasMagnet) {
      const magnetRange = state.magnetTimer > 0 ? 250 : 180;
      const magnetStrength = state.magnetTimer > 0 ? 0.25 : 0.2;
      const dist = Math.sqrt((c.x - state.playerX) ** 2 + (c.y - actualPlayerY) ** 2);
      if (dist < magnetRange) {
        c.x += (state.playerX - c.x) * magnetStrength;
        c.y += (actualPlayerY - c.y) * magnetStrength;
      }
    }

    if (c.y > H + 40) {
      state.coins.splice(i, 1);
      continue;
    }

    const dist = Math.sqrt((c.x - state.playerX) ** 2 + (c.y - actualPlayerY) ** 2);
    if (dist < 40) {
      c.collected = true;
      state.coinsCollected++;
      const levelConfig = LEVELS[state.currentLevel - 1];
      const coinMultiplier = levelConfig?.coinMultiplier || 1;
      const scoreMultiplier = levelConfig?.scoreMultiplier || 1;
      const coinScore = Math.floor(30 * coinMultiplier * scoreMultiplier * (state.doubleTimer > 0 ? 2 : 1));
      state.score += coinScore;
      gameActions.addScore(coinScore, c.x, c.y);
      audioService.collect();
      
      // 增强的金币收集粒子效果
      for (let j = 0; j < 15; j++) {
        state.particles.push({
          x: c.x, y: c.y,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10 - 3,
          life: 0.8, maxLife: 0.8,
          color: Math.random() > 0.5 ? '#F1C40F' : '#FFD700',
          size: 4 + Math.random() * 6,
        });
      }
      
      // 添加闪光粒子
      for (let j = 0; j < 5; j++) {
        state.particles.push({
          x: c.x + (Math.random() - 0.5) * 20,
          y: c.y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          life: 0.4, maxLife: 0.4,
          color: '#FFFFFF',
          size: 8 + Math.random() * 8,
        });
      }
    }
  }
}

function updatePowerups(state: GameState, py: number): void {
  const actualPlayerY = py;
  const actualSpeedMultiplier = state.speedMultiplier * state.slowMultiplier;

  for (let i = state.powerups.length - 1; i >= 0; i--) {
    const p = state.powerups[i];
    if (p.collected) {
      state.powerups.splice(i, 1);
      continue;
    }

    p.y += state.gameSpeed * actualSpeedMultiplier * 2;

    if (p.y > H + 40) {
      state.powerups.splice(i, 1);
      continue;
    }

    const dist = Math.sqrt((p.x - state.playerX) ** 2 + (p.y - actualPlayerY) ** 2);
    if (dist < 45) {
      p.collected = true;
      activatePowerup(state, p.type, p.x, p.y);
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
  drawBullets(ctx, state); // 绘制炮弹
  drawObstacles(ctx, state);
  drawParticles(ctx, state);
  drawPlayer(ctx, state);
  drawHUD(ctx, state);
  drawFloatTexts(ctx, state);
  ctx.restore();
}
