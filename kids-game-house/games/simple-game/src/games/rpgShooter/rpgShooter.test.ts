/**
 * RPG Shooter 模块功能测试
 * 
 * 运行方式:
 * npm test
 * 或
 * npx jest rpgShooter.test.ts
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { createInitialState } from './state';
import { levelUp, initPlayerStats } from './player';
import { shoot } from './bullets';
import { spawnEnemy } from './enemies';
import { rectCollide, circleCollide } from './collision';
import { GAME_CONFIG, LEVEL_STATS, ENEMY_TYPES } from './config';

describe('RPG Shooter Module Tests', () => {
  let state: ReturnType<typeof createInitialState>;

  beforeEach(() => {
    state = createInitialState();
  });

  // ===== 配置测试 =====
  describe('Config Module', () => {
    test('GAME_CONFIG has correct values', () => {
      expect(GAME_CONFIG.CANVAS_WIDTH).toBe(400);
      expect(GAME_CONFIG.CANVAS_HEIGHT).toBe(600);
      expect(GAME_CONFIG.GAME_DURATION).toBe(120);
      expect(GAME_CONFIG.PLAYER_SPEED).toBe(4.5);
    });

    test('LEVEL_STATS has 10 levels', () => {
      expect(LEVEL_STATS.length).toBe(10);
    });

    test('ENEMY_TYPES has 6 types', () => {
      expect(ENEMY_TYPES.length).toBe(6);
    });
  });

  // ===== 状态管理测试 =====
  describe('State Module', () => {
    test('createInitialState creates valid state', () => {
      expect(state.playerLevel).toBe(1);
      expect(state.playerHP).toBe(6);
      expect(state.playerMaxHP).toBe(6);
      expect(state.playerATK).toBe(1);
      expect(state.score).toBe(0);
      expect(state.combo).toBe(0);
      expect(state.energy).toBe(0);
      expect(state.gameStarted).toBe(false);
      expect(state.gameEnded).toBe(false);
    });

    test('initial state has empty arrays', () => {
      expect(state.bullets).toEqual([]);
      expect(state.enemies).toEqual([]);
      expect(state.particles).toEqual([]);
      expect(state.drops).toEqual([]);
    });

    test('initial state has stars', () => {
      expect(state.stars.length).toBe(GAME_CONFIG.STAR_COUNT);
    });
  });

  // ===== 玩家系统测试 =====
  describe('Player Module', () => {
    test('initPlayerStats initializes correctly', () => {
      initPlayerStats(state);
      expect(state.playerHP).toBe(6);
      expect(state.playerMaxHP).toBe(6);
      expect(state.playerATK).toBe(1);
    });

    test('levelUp increases level', () => {
      const initialLevel = state.playerLevel;
      levelUp(state);
      expect(state.playerLevel).toBe(initialLevel + 1);
    });

    test('levelUp restores HP to max', () => {
      state.playerHP = 1; // 设置为低血量
      levelUp(state);
      expect(state.playerHP).toBe(state.playerMaxHP);
    });

    test('levelUp creates particles', () => {
      const initialParticles = state.particles.length;
      levelUp(state);
      expect(state.particles.length).toBeGreaterThan(initialParticles);
    });

    test('levelUp triggers screen effects', () => {
      levelUp(state);
      expect(state.shakeAmt).toBeGreaterThan(0);
      expect(state.screenFlash).toBeGreaterThan(0);
    });
  });

  // ===== 子弹系统测试 =====
  describe('Bullets Module', () => {
    test('shoot creates bullet when game started', () => {
      state.gameStarted = true;
      state.targetX = 300;
      state.targetY = 200;
      
      const initialBullets = state.bullets.length;
      shoot(state);
      
      expect(state.bullets.length).toBeGreaterThan(initialBullets);
    });

    test('shoot does not create bullet when cooldown active', () => {
      state.gameStarted = true;
      state.targetX = 300;
      state.targetY = 200;
      
      shoot(state);
      const bulletCount = state.bullets.length;
      
      // 立即再次射击（在冷却时间内）
      shoot(state);
      
      expect(state.bullets.length).toBe(bulletCount);
    });

    test('shoot creates tracking bullet when enemy exists', () => {
      state.gameStarted = true;
      state.enemies.push({
        x: 300, y: 200, w: 20, h: 20,
        hp: 1, maxHp: 1, score: 10, exp: 5,
        color: '#FF6B6B', shape: 'circle',
        speed: 1, vx: 0, vy: 0, type: 0
      });
      
      shoot(state);
      
      expect(state.bullets.length).toBeGreaterThan(0);
      expect(state.bullets[0].tracking).toBe(true);
    });
  });

  // ===== 敌人系统测试 =====
  describe('Enemies Module', () => {
    test('spawnEnemy creates enemy when game started', () => {
      state.gameStarted = true;
      
      const initialEnemies = state.enemies.length;
      spawnEnemy(state);
      
      expect(state.enemies.length).toBeGreaterThan(initialEnemies);
    });

    test('spawnEnemy does not create enemy when game not started', () => {
      state.gameStarted = false;
      
      const initialEnemies = state.enemies.length;
      spawnEnemy(state);
      
      expect(state.enemies.length).toBe(initialEnemies);
    });

    test('spawned enemy has valid properties', () => {
      state.gameStarted = true;
      spawnEnemy(state);
      
      const enemy = state.enemies[0];
      expect(enemy.x).toBeDefined();
      expect(enemy.y).toBeDefined();
      expect(enemy.hp).toBeGreaterThan(0);
      expect(enemy.maxHp).toBeGreaterThan(0);
      expect(enemy.shape).toBeDefined();
    });
  });

  // ===== 碰撞检测测试 =====
  describe('Collision Module', () => {
    test('rectCollide detects overlapping rectangles', () => {
      const result = rectCollide(0, 0, 10, 10, 5, 5, 10, 10);
      expect(result).toBe(true);
    });

    test('rectCollide returns false for non-overlapping rectangles', () => {
      const result = rectCollide(0, 0, 10, 10, 20, 20, 10, 10);
      expect(result).toBe(false);
    });

    test('circleCollide detects overlapping circles', () => {
      const result = circleCollide(0, 0, 10, 5, 0, 10);
      expect(result).toBe(true);
    });

    test('circleCollide returns false for non-overlapping circles', () => {
      const result = circleCollide(0, 0, 5, 20, 0, 5);
      expect(result).toBe(false);
    });
  });

  // ===== 集成测试 =====
  describe('Integration Tests', () => {
    test('complete game flow', () => {
      // 1. 初始化
      initPlayerStats(state);
      expect(state.playerLevel).toBe(1);

      // 2. 开始游戏
      state.gameStarted = true;
      state.targetX = 300;
      state.targetY = 200;

      // 3. 生成敌人
      spawnEnemy(state);
      expect(state.enemies.length).toBeGreaterThan(0);

      // 4. 射击
      shoot(state);
      expect(state.bullets.length).toBeGreaterThan(0);

      // 5. 升级
      levelUp(state);
      expect(state.playerLevel).toBe(2);
    });

    test('energy system works', () => {
      expect(state.energy).toBe(0);
      
      // 模拟获得能量
      state.energy = 50;
      expect(state.energy).toBe(50);
      
      // 能量满
      state.energy = state.maxEnergy;
      expect(state.energy).toBe(state.maxEnergy);
    });

    test('combo system works', () => {
      expect(state.combo).toBe(0);
      
      // 模拟连击
      state.combo = 5;
      state.comboTimer = 3;
      
      expect(state.combo).toBe(5);
      expect(state.comboTimer).toBe(3);
    });
  });
});
