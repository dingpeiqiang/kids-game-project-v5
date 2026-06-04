/**
 * Space Invaders - GTRS 资源管理器版本
 * 
 * 特点：
 * - 使用 GTRS.json 配置文件加载资源
 * - 支持资源管理器编辑的资源
 * - 保持原游戏所有功能
 */

// ==================== 全局变量 ====================
let game;
let myNickname = localStorage.getItem("nickname") || "Player";
let highScore = parseInt(localStorage.getItem("highScore")) || 0;
let achievements = JSON.parse(localStorage.getItem("achievements")) || {};
let difficulty = localStorage.getItem("difficulty") || "normal";

// 游戏配置
const GW = 1280, GH = 720; // 逻辑分辨率
const config = {
  type: Phaser.AUTO,
  width: GW,
  height: GH,
  parent: "game-container",
  backgroundColor: "#000033",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

// 游戏实体
let player;
let bullets;
let enemyBullets;
let enemies;
let powerups;
let particles;
let bossAlive = false; // Boss 存活标志，防止重复击杀
let boss;
let bossHpBg, bossHpFill, bossHpText;
let starsBg;

// 游戏状态
let enemyDirection = 1;
let baseEnemySpeed = 30;
let cursors;
let fireKey;
let pauseKey;
let tabKey;

// 分数和等级
let score = 0;
let lives = 3;
let level = 1;
let scoreText;
let livesText;
let levelText;
let highScoreText;

// 连击系统
let combo = 0;
let maxCombo = 0;
let lastKillTime = 0;
let comboText;

// 统计数据
let totalKills = 0;
let totalShots = 0;
let statsPanel;

// 游戏流程控制
let gameOver = false;
let gameWon = false;
let isPaused = false;
let bossLevel = false;

// 射击控制
let lastFired = 0;
let fireRate = 200; // 射击冷却（毫秒），越小越快
let rapidFire = false;
let rapidFireTimer;

// 道具和特效
let hasShield = false;
let shieldSprite;
let isInvincible = false;    // 受伤后无敌状态
let invincibleTimer;
let screenShake = 0; // 保留变量（已禁用震动）
let transitionLock = false; // 关卡过渡锁，防止 nextLevel 重复触发
let spreadShot = false;       // 散射弹幕
let spreadShotTimer;
let damageBoost = 1;           // 伤害倍率（基础 1x）
let damageBoostTimer;          // 伤害加成计时器
let bombActive = false;       // 全屏炸弹
let magnetActive = false;     // 磁铁吸分
let magnetTimer;
let laserActive = false;      // 激光武器
let laserTimer;
let doubleScore = false;      // 双倍得分
let doubleScoreTimer;
let activeEffectsList = [];   // 当前激活效果显示

// 难度设置（解压向：多命、慢速、快射击、高分倍率）
const difficultySettings = {
  easy:   { enemySpeed: 0.5, enemyFireRate: 5000, lives: 7, scoreMult: 1.0 },
  normal: { enemySpeed: 0.7, enemyFireRate: 4000, lives: 5, scoreMult: 1.0 },
  hard:   { enemySpeed: 1.0, enemyFireRate: 3000, lives: 3, scoreMult: 1.0 }
};

// ===== 敌人类型定义 =====
// hpMult: 血量倍率（最终HP = 关卡baseHP × hpMult），速度倍率: speedMult, 分值: points, 特殊行为: special
const ENEMY_TYPES = {
  enemy0: { key: 'enemy0', hpMult: 1,   speedMult: 1,   points: 10, minLevel: 1, special: null,     desc: '红色兵卒' },
  enemy1: { key: 'enemy1', hpMult: 1,   speedMult: 1,   points: 10, minLevel: 1, special: null,     desc: '紫色兵卒' },
  enemy2: { key: 'enemy2', hpMult: 1,   speedMult: 1,   points: 10, minLevel: 1, special: null,     desc: '青色兵卒' },
  enemy3: { key: 'enemy3', hpMult: 1,   speedMult: 2,   points: 15, minLevel: 3, special: 'fast',   desc: '橙色侦察者' },
  enemy4: { key: 'enemy4', hpMult: 3,   speedMult: 0.5, points: 30, minLevel: 5, special: 'tank',   desc: '银色重装甲' },
  enemy5: { key: 'enemy5', hpMult: 2,   speedMult: 1,   points: 20, minLevel: 8, special: 'sprint', desc: '绿色精英' },
};

// 获取当前关卡可用的敌人池（按行分配）
function getEnemyPool(lvl) {
  return Object.values(ENEMY_TYPES).filter(t => lvl >= t.minLevel);
}

function getLevelParams(lvl) {
  const base = difficultySettings[difficulty];
  const s = 1 + (lvl - 1) * 0.06; // 每关 +6% 难度（慢增长）
  return {
    // 敌人速度：逐关缓慢加快
    enemySpeed: base.enemySpeed * s,
    // 敌人射速：缓慢提升（概率）
    enemyFireChance: Math.min(0.003 * base.enemySpeed * s, 0.04),
    // 敌人数量：逐关增多
    rows: Math.min(3 + Math.floor(lvl / 4), 6),
    cols: Math.min(7 + Math.floor(lvl / 3), 11),
    // 道具掉率：高关卡多掉道具（解压核心）
    dropRate: Math.min(0.15 + lvl * 0.012, 0.40),
    // 敌弹速度：缓慢加快
    bulletSpeed: Math.min(200 + lvl * 15, 450),
    // Boss 血量：厚实耐打（给玩家割草的爽感）
    bossHP: 20 + lvl * 4,
    // 敌人下移幅度：缓慢递增
    dropStep: Math.min(5 + lvl * 0.3, 12),
    // 连击超时窗口：保持宽松
    comboWindow: Math.max(2500 - lvl * 30, 1500),
    // 关卡进阶奖励分数
    levelBonus: lvl * 80,
    // 伤害加成：每 5 关提升基础伤害
    baseDamageBoost: 1 + Math.floor((lvl - 1) / 5) * 0.5,
    // 敌人基础血量：第一关就2血，逐关提升（解压：让玩家感受多次击中的爽感）
    enemyHP: Math.min(2 + Math.floor((lvl - 1) / 3), 8),
  };
}

// 计算当前实际伤害值
function getDamage() {
  return Math.max(1, Math.round(getLevelParams(level).baseDamageBoost * damageBoost));
}

// Boss 血条更新
function updateBossHpBar(hp, maxHp) {
  if (!bossHpFill) return;
  const barW = 200, barH = 16;
  const barX = (GW - barW) / 2, barY = 50;
  const ratio = Math.max(0, hp / maxHp);
  let color;
  if (ratio > 0.5) color = 0x44ff44;
  else if (ratio > 0.25) color = 0xffdd00;
  else color = 0xff3333;
  bossHpFill.clear();
  bossHpFill.fillStyle(color, 1);
  bossHpFill.fillRoundedRect(barX, barY, barW * ratio, barH, 4);
  if (bossHpText) {
    bossHpText.setText('BOSS  ' + Math.max(0, hp) + '/' + maxHp);
    bossHpText.setColor(ratio > 0.25 ? '#ffffff' : '#ffcccc');
  }
}

// 敌人血条更新（已废弃：普通敌人不显示血条，只保留代码骨架供 Boss 使用）
function updateEnemyHpBar(enemy) { return; }

// 初始化敌人血条（已废弃）
function initEnemyHpBar(enemy) { return; }

// 成就列表
const achievementList = {
  firstBlood: { name: '首次击杀', desc: '消灭第一个敌人' },
  combo5: { name: '连击大师', desc: '达到5连击' },
  combo10: { name: '连击之神', desc: '达到10连击' },
  level5: { name: '进阶玩家', desc: '到达第5关' },
  level10: { name: '资深战士', desc: '到达第10关' },
  score1000: { name: '分数破千', desc: '单局得分超过1000' },
  score5000: { name: '高分玩家', desc: '单局得分超过5000' },
  perfect: { name: '完美通关', desc: '无伤通过一关' },
  sharpshooter: { name: '神射手', desc: '命中率超过80%' },
  bossSlayer: { name: 'Boss杀手', desc: '击败首个Boss' }
};

// ==================== 音效系统 ====================
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  if (audioContext.state === 'suspended') audioContext.resume();
  
  // 首先尝试从 GTRS 加载音频
  const gtrsAudioPath = window.resourceLoader ? window.resourceLoader.getAudioPath(type) : null;
  if (gtrsAudioPath) {
    try {
      // 使用 Phaser 的音频系统播放
      if (game && game.sound && game.sound.get(type)) {
        game.sound.play(type);
        return;
      }
    } catch (e) {
      console.log('GTRS 音频播放失败，使用备用音效');
    }
  }
  
  // 备用：使用 Web Audio API 生成音效
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  switch(type) {
    case 'shoot':
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      osc.start(); osc.stop(audioContext.currentTime + 0.1);
      break;
    case 'explosion':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      osc.start(); osc.stop(audioContext.currentTime + 0.2);
      break;
    case 'powerup':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, audioContext.currentTime);
      osc.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      osc.start(); osc.stop(audioContext.currentTime + 0.2);
      break;
    case 'hit':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, audioContext.currentTime);
      gain.gain.setValueAtTime(0.2, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      osc.start(); osc.stop(audioContext.currentTime + 0.15);
      break;
    case 'enemyShoot':
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, audioContext.currentTime);
      gain.gain.setValueAtTime(0.08, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
      osc.start(); osc.stop(audioContext.currentTime + 0.08);
      break;
  }
}

// ==================== 成就系统 ====================
function checkAchievement(id) {
  if (!achievements[id]) {
    achievements[id] = true;
    localStorage.setItem('achievements', JSON.stringify(achievements));
    showAchievementNotification(achievementList[id].name);
  }
}

function showAchievementNotification(name) {
  const notif = game.scene.scenes[0].add.text(GW / 2, 100, `🏆 成就解锁: ${name}`, {
    fontSize: '24px', fill: '#ff0', fontStyle: 'bold',
    fontFamily: 'VT323, monospace', backgroundColor: '#000',
    padding: { x: 10, y: 5 }
  }).setOrigin(0.5).setDepth(100);
  
  game.scene.scenes[0].tweens.add({
    targets: notif, y: 50, alpha: 0, duration: 2000,
    onComplete: () => notif.destroy()
  });
  playSound('powerup');
}

// ==================== 预加载资源 - 使用 GTRS ====================
// gtrsImageMap：key -> url，只存在于服务器上的图片（initGame 异步预检后填充）
const gtrsImageMap = {};

function preload() {
  // 清理可能残留的旧纹理（用户第二次开始游戏时避免 key 重复）
  const allKeys = [...Object.keys(gtrsImageMap),
    'ship', 'bullet', 'enemy0', 'enemy1', 'enemy2', 'enemy3', 'enemy4', 'enemy5', 'boss',
    'enemy_bullet', 'explosion', 'stars', 'particle',
    'powerup_shield', 'powerup_rapid', 'powerup_life',
    'powerup_spread', 'powerup_bomb', 'powerup_magnet',
    'powerup_laser', 'powerup_double'];
  for (const key of allKeys) {
    if (this.textures.exists(key)) {
      this.textures.remove(key);
    }
  }

  // 加载进度显示
  const progress = this.add.text(GW / 2, GH / 2 - 60, '加载资源中...', {
    fontSize: '24px', fill: '#fff', fontFamily: 'VT323, monospace'
  }).setOrigin(0.5);
  
  const progressBar = this.add.rectangle(GW / 2, GH / 2, 400, 20, 0x333333).setOrigin(0.5);
  const progressFill = this.add.rectangle(GW / 2 - 200, GH / 2, 0, 20, 0x00ff00).setOrigin(0, 0.5);
  
  this.load.on('progress', (value) => {
    progressFill.width = 400 * value;
    progress.text = `加载资源中... ${Math.round(value * 100)}%`;
  });
  
  this.load.on('complete', () => {
    progress.destroy();
    progressBar.destroy();
    progressFill.destroy();
  });
  
  // 加载已确认存在的 GTRS 图片（由 initGame 预检填充）
  // 先提交到加载队列
  for (const [key, url] of Object.entries(gtrsImageMap)) {
    this.load.image(key, url);
    console.log(`📷 加载图片: ${key} -> ${url}`);
  }

}

// ==================== 创建场景 ====================
function create() {
  // 应用难度设置
  const settings = difficultySettings[difficulty];
  const lp = getLevelParams(level);
  lives = settings.lives;
  baseEnemySpeed = 30 * lp.enemySpeed;
  const gh = this.scale.gameSize.height;
  starsBg = this.add.tileSprite(GW / 2, gh / 2, GW, gh, 'stars');
  starsBg.setScrollFactor(0);
  starsBg.setDepth(-1);
  
  // 玩家 - 使用 ship 或 avatarAanimated 纹理
  const playerKey = this.textures.exists('avatarAanimated') ? 'avatarAanimated' : 
                     this.textures.exists('ship') ? 'ship' : 'ship';
  player = this.physics.add.sprite(GW / 2, GH - 80, playerKey);
  player.setCollideWorldBounds(true);
  player.setDragX(500);
  
  // 护盾
  shieldSprite = this.add.circle(GW / 2, GH - 80, 40, 0x00ffff, 0.3);
  shieldSprite.setVisible(false);
  
  // 子弹组
  const bulletKey = this.textures.exists('bullet') ? 'bullet' : 'bullet';
  bullets = this.physics.add.group({ defaultKey: bulletKey, maxSize: 30 });
  const enemyBulletKey = this.textures.exists('enemy_bullet') ? 'enemy_bullet' : 'enemy_bullet';
  enemyBullets = this.physics.add.group({ defaultKey: enemyBulletKey, maxSize: 50 });
  
  // 敌人群
  enemies = this.physics.add.group();
  
  // 道具组
  const powerupKey = this.textures.exists('powerup_shield') ? 'powerup_shield' : 'powerup_shield';
  powerups = this.physics.add.group({ defaultKey: powerupKey, maxSize: 5 });
  
  // 粒子系统
  const particleKey = this.textures.exists('particle') ? 'particle' : 'particle';
  particles = this.add.particles(0, 0, particleKey, {
    speed: { min: 50, max: 150 }, scale: { start: 1, end: 0 },
    blendMode: 'ADD', lifespan: 500, gravityY: 0, emitting: false
  });
  
  // 控制
  cursors = this.input.keyboard.createCursorKeys();
  fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
  
  // UI文本
  scoreText = this.add.text(16, 16, `Score: ${score}`, {
    fontSize: "24px", fill: "#fff", fontFamily: "VT323, monospace"
  });
  livesText = this.add.text(16, 48, `Lives: ${lives}`, {
    fontSize: "24px", fill: "#0f0", fontFamily: "VT323, monospace"
  });
  levelText = this.add.text(16, 80, `Level: ${level}`, {
    fontSize: "24px", fill: "#0ff", fontFamily: "VT323, monospace"
  });
  highScoreText = this.add.text(780, 16, `High: ${highScore}`, {
    fontSize: "20px", fill: "#ff0", fontFamily: "VT323, monospace"
  }).setOrigin(1, 0);
  
  // 连击显示
  comboText = this.add.text(GW / 2, 16, '', {
    fontSize: "28px", fill: "#ff0", fontStyle: "bold",
    fontFamily: "VT323, monospace"
  }).setOrigin(0.5).setVisible(false);
  
  // 当前激活效果 HUD（右侧显示）
  activeEffectsList = [];
  
  // 统计面板
  statsPanel = this.add.text(16, 120, '', {
    fontSize: "18px", fill: "#aaa", fontFamily: "VT323, monospace",
    backgroundColor: '#00000080', padding: { x: 8, y: 4 }
  }).setVisible(false);
  
  // 暂停文本
  this.pauseText = this.add.text(GW / 2, GH / 2, 'PAUSED\n\nPress ESC to Resume', {
    fontSize: '48px', fill: '#fff', align: 'center',
    fontFamily: 'VT323, monospace'
  }).setOrigin(0.5).setVisible(false);
  
  // 生成敌人
  spawnEnemies.call(this);
  
  // 碰撞检测
  this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);
  this.physics.add.overlap(enemyBullets, player, hitPlayer, null, this);
  this.physics.add.overlap(player, powerups, collectPowerup, null, this);
  this.physics.add.overlap(bullets, enemyBullets, bulletCollision, null, this);
}

// ==================== 更新循环 ====================
function update() {
  if (gameOver || gameWon || transitionLock) return;
  
  if (isPaused) {
    if (Phaser.Input.Keyboard.JustDown(pauseKey)) {
      isPaused = false;
      this.pauseText.setVisible(false);
      this.physics.resume();
    }
    return;
  }
  
  // 暂停键
  if (Phaser.Input.Keyboard.JustDown(pauseKey)) {
    isPaused = true;
    this.pauseText.setVisible(true);
    this.physics.pause();
    return;
  }
  
  // 统计面板切换
  if (Phaser.Input.Keyboard.JustDown(tabKey)) {
    statsPanel.setVisible(!statsPanel.visible);
    if (statsPanel.visible) {
      updateStatsPanel();
    }
  }
  
  // 玩家移动（慢速精确操控）
  if (cursors.left.isDown) {
    player.setVelocityX(-250);
  } else if (cursors.right.isDown) {
    player.setVelocityX(250);
  } else {
    player.setVelocityX(0);
  }
  
  // 玩家射击
  if (fireKey.isDown && this.time.now > lastFired) {
    shoot.call(this);
    lastFired = this.time.now + (rapidFire ? fireRate / 2 : fireRate);
  }
  
  // 敌人移动
  let edgeHit = false;
  enemies.children.iterate((enemy) => {
    if (enemy && enemy.active) {
      const speedMult = (enemy.enemyType && enemy.enemyType.speedMult) || 1;
      enemy.x += enemyDirection * baseEnemySpeed * 0.02 * speedMult;
      if (enemy.x <= 40 || enemy.x >= GW - 40) {
        edgeHit = true;
      }
      // 同步血条位置
      if (enemy.hpBarBg) {
        enemy.hpBarBg.setPosition(enemy.x, enemy.y - 30);
        enemy.hpBarFill.setPosition(enemy.x - 16, enemy.y - 30);
      }
    }
  });
  
  if (edgeHit) {
    enemyDirection *= -1;
    const dropStep = getLevelParams(level).dropStep;
    enemies.children.iterate((enemy) => {
      if (enemy) enemy.y += dropStep;
    });
  }
  
  // Boss移动
  if (boss && boss.active) {
    boss.x += Math.sin(this.time.now * 0.002) * 2;
    if (Math.random() < 0.01) {
      enemyShoot.call(this, boss);
    }
  }
  
  // 敌人随机射击（逐级加快）
  const lp = getLevelParams(level);
  if (Math.random() < lp.enemyFireChance) {
    const activeEnemies = enemies.getChildren().filter(e => e.active);
    if (activeEnemies.length > 0) {
      const shooter = activeEnemies[Math.floor(Math.random() * activeEnemies.length)];
      enemyShoot.call(this, shooter);
    }
  }
  
  // 更新护盾位置
  if (shieldSprite.visible) {
    shieldSprite.x = player.x;
    shieldSprite.y = player.y;
  }
  
  // 背景滚动
  starsBg.tilePositionY += 0.3;
  
  // 屏幕震动已禁用
  
  // 磁铁吸分
  if (magnetActive) magnetTick(this);
  
  // 子弹超出边界销毁
  bullets.children.iterate((bullet) => {
    if (bullet && bullet.y < -20) bullet.destroy();
  });
  enemyBullets.children.iterate((bullet) => {
    if (bullet && bullet.y > 620) bullet.destroy();
  });
  
  // 检查连击超时（高关卡窗口更短）
  if (combo > 0 && this.time.now - lastKillTime > getLevelParams(level).comboWindow) {
    combo = 0;
    comboText.setVisible(false);
  }
  
  // 检查游戏胜利（用 transitionLock 防止重复触发）
  if (!transitionLock && !bossLevel && enemies.countActive(true) === 0) {
    transitionLock = true;
    nextLevel.call(this);
  }
  if (!transitionLock && bossLevel && !bossAlive) {
    transitionLock = true;
    nextLevel.call(this);
  }
  
  // 检查游戏失败
  if (enemies.countActive(true) > 0) {
    const lowestEnemy = Phaser.Utils.Array.GetRandom(enemies.getChildren().filter(e => e.active));
    if (lowestEnemy && lowestEnemy.y > GH - 120) {
      gameOverScreen.call(this);
    }
  }
}

// ==================== 游戏逻辑函数 ====================

function shoot() {
  if (laserActive) {
    // 激光模式：瞬间命中整条线上所有敌人
    laserLine(this);
    return;
  }
  
  if (spreadShot) {
    // 散射模式：一次发 5 发子弹，扇形展开
    const angles = [-15, -7, 0, 7, 15];
    const speed = 600;
    for (const deg of angles) {
      const rad = deg * Math.PI / 180;
      const bullet = bullets.get();
      if (bullet) {
        bullet.setPosition(player.x, player.y - 20);
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.body.velocity.y = -speed * Math.cos(rad);
        bullet.body.velocity.x = speed * Math.sin(rad);
      }
    }
    totalShots += 5;
    playSound('shoot');
  } else {
    const bullet = bullets.get();
    if (bullet) {
      bullet.setPosition(player.x, player.y - 20);
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.body.velocity.y = -600;
      totalShots++;
      playSound('shoot');
    }
  }
}

// 激光线效果：从飞船到屏幕顶部，命中所有路径上的敌人
function laserLine(scene) {
  // 绘制激光束视觉
  const laser = scene.add.rectangle(player.x, GH / 2, 6, GH, 0x00ff44, 0.6);
  laser.setDepth(50);
  scene.tweens.add({
    targets: laser, alpha: 0, duration: 200,
    onComplete: () => laser.destroy()
  });
  
  // 命中同一列所有敌人
  const toHit = [];
  enemies.children.iterate(e => {
    if (e && e.active && Math.abs(e.x - player.x) < 40) toHit.push(e);
  });
  if (boss && boss.active && Math.abs(boss.x - player.x) < 60) toHit.push(boss);
  
  for (const target of toHit) {
    if (target === boss) {
      hitBoss({ destroy() {} }, boss); // 伪造子弹对象
    } else {
      particles.emitParticleAt(target.x, target.y, 10);
      target.destroy();
      combo++;
      lastKillTime = scene.time.now;
      if (combo > maxCombo) maxCombo = combo;
      if (combo >= 2) {
        comboText.setText(`🔥 ${combo}x COMBO!`);
        comboText.setVisible(true);
        if (combo === 5) checkAchievement('combo5');
        if (combo === 10) checkAchievement('combo10');
      }
      const points = 10 * combo * difficultySettings[difficulty].scoreMult * (doubleScore ? 2 : 1);
      score += Math.floor(points);
      totalKills++;
      scoreText.setText(`Score: ${score}`);
    }
  }
  
  // 清除激光路径上的敌弹
  enemyBullets.children.iterate(b => {
    if (b && b.active && Math.abs(b.x - player.x) < 20) b.destroy();
  });
  
  playSound('explosion');
  totalShots++;
}

// 全屏炸弹效果
function triggerBomb(scene) {
  // 全屏闪白
  const flash = scene.add.rectangle(GW / 2, GH / 2, GW, GH, 0xffffff, 0.7).setDepth(60);
  scene.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });
  
  // 消灭所有敌人
  let killed = 0;
  enemies.children.iterate(e => {
    if (e && e.active) {
      particles.emitParticleAt(e.x, e.y, 15);
      e.destroy();
      killed++;
    }
  });
  
  // 清除所有敌弹
  enemyBullets.children.iterate(b => { if (b && b.active) b.destroy(); });
  
  score += killed * 20 * (doubleScore ? 2 : 1);
  totalKills += killed;
  scoreText.setText(`Score: ${score}`);
  
  // 显示炸弹文字
  const bombText = scene.add.text(GW / 2, GH / 2, '💥 BOOM!', {
    fontSize: '64px', fill: '#ff4400', fontStyle: 'bold',
    fontFamily: 'VT323, monospace', stroke: '#000', strokeThickness: 4
  }).setOrigin(0.5).setDepth(70);
  scene.tweens.add({
    targets: bombText, scale: 2, alpha: 0, duration: 800,
    onComplete: () => bombText.destroy()
  });
  
  playSound('explosion');
}

// 磁铁吸分效果：每帧吸取分数
function magnetTick(scene) {
  enemies.children.iterate(e => {
    if (e && e.active && Math.random() < 0.02) {
      const pts = 5 * (doubleScore ? 2 : 1);
      score += pts;
      scoreText.setText(`Score: ${score}`);
      // 显示 +5 飘字
      const ft = scene.add.text(e.x, e.y, `+${pts}`, {
        fontSize: '16px', fill: '#ff0', fontFamily: 'VT323, monospace'
      }).setOrigin(0.5);
      scene.tweens.add({ targets: ft, y: ft.y - 30, alpha: 0, duration: 600, onComplete: () => ft.destroy() });
    }
  });
}

// 激活效果 HUD 管理
function showEffectLabel(scene, text, color, duration) {
  const label = scene.add.text(GW - 20, 120 + activeEffectsList.length * 28, text, {
    fontSize: '20px', fill: color, fontStyle: 'bold',
    fontFamily: 'VT323, monospace', backgroundColor: '#00000080',
    padding: { x: 6, y: 2 }
  }).setOrigin(1, 0).setDepth(80);
  activeEffectsList.push({ label, timer: setTimeout(() => {
    scene.tweens.add({ targets: label, alpha: 0, duration: 300, onComplete: () => {
      label.destroy();
      activeEffectsList = activeEffectsList.filter(e => e.label !== label);
    }});
  }, duration) });
}

function enemyShoot(shooter) {
  const bullet = enemyBullets.get();
  if (bullet && shooter) {
    bullet.setPosition(shooter.x, shooter.y + 20);
    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.body.velocity.y = getLevelParams(level).bulletSpeed;
    playSound('enemyShoot');
  }
}

function hitEnemy(bullet, enemy) {
  bullet.destroy();
  
  const dmg = getDamage();
  const type = enemy.enemyType || ENEMY_TYPES.enemy0;
  
  // 多血量支持：只要伤害不足以击杀就扣血
  if (dmg < enemy.hp) {
    enemy.hp -= dmg;
    // 受击闪白
    enemy.setTint(0xffffff);
    this.time.delayedCall(80, () => { if (enemy.active) enemy.clearTint(); });

    // 精英型最后1血时向下冲刺
    if (type.special === 'sprint' && enemy.hp <= 1) {
      enemy.body.velocity.y = 200; // 冲刺向下
    }

    // 受击数字飘字
    const scene = game.scene.scenes[0];
    if (scene) {
      const dmgText = scene.add.text(enemy.x + Phaser.Math.Between(-15, 15), enemy.y, `-${dmg}`, {
        fontSize: '16px', fill: '#ff6644', fontStyle: 'bold',
        fontFamily: 'VT323, monospace'
      }).setOrigin(0.5).setDepth(70);
      scene.tweens.add({ targets: dmgText, y: dmgText.y - 25, alpha: 0, duration: 500, onComplete: () => dmgText.destroy() });
    }

    // 小爆炸
    particles.emitParticleAt(enemy.x, enemy.y, 5);
    playSound('hit');
    return;
  }
  
  enemy.destroy();
  
  // 爆炸效果（兼容 Phaser 3.60+，不用 createEmitter）
  const particleCount = type.special === 'tank' ? 25 : 10;
  particles.emitParticleAt(enemy.x, enemy.y, particleCount);
  
  // 连击系统
  combo++;
  lastKillTime = this.time.now;
  if (combo > maxCombo) maxCombo = combo;
  
  if (combo >= 2) {
    comboText.setText(`🔥 ${combo}x COMBO!`);
    comboText.setVisible(true);
    if (combo === 5) checkAchievement('combo5');
    if (combo === 10) checkAchievement('combo10');
  }
  
  // 分数计算：使用敌人类型分值
  const basePoints = type.points || 10;
  const points = basePoints * combo * difficultySettings[difficulty].scoreMult * (doubleScore ? 2 : 1);
  score += Math.floor(points);
  scoreText.setText(`Score: ${score}`);
  
  // 分数飘字
  const scene = game.scene.scenes[0];
  if (scene) {
    const pt = scene.add.text(enemy.x, enemy.y, `+${Math.floor(points)}`, {
      fontSize: '20px', fill: type.special === 'tank' ? '#ffdd00' : '#ffffff',
      fontStyle: 'bold', fontFamily: 'VT323, monospace'
    }).setOrigin(0.5).setDepth(70);
    scene.tweens.add({ targets: pt, y: pt.y - 40, alpha: 0, duration: 800, onComplete: () => pt.destroy() });
  }
  
  // 随机掉落道具
  if (Math.random() < getLevelParams(level).dropRate) {
    const types = [
      'powerup_shield', 'powerup_rapid', 'powerup_life',
      'powerup_spread', 'powerup_bomb', 'powerup_magnet',
      'powerup_laser', 'powerup_double', 'powerup_damage'
    ];
    const type2 = types[Math.floor(Math.random() * types.length)];
    const powerup = powerups.get(enemy.x, enemy.y, type2);
    if (powerup) {
      powerup.setActive(true);
      powerup.setVisible(true);
      powerup.body.velocity.y = 100;
    }
  }
  
  totalKills++;
  if (totalKills === 1) checkAchievement('firstBlood');
  if (score >= 1000) checkAchievement('score1000');
  if (score >= 5000) checkAchievement('score5000');
  
  playSound('explosion');
  screenShake = 5;
}

function hitBoss(spriteA, spriteB) {
  // 确定哪个是子弹，哪个是 boss
  const bullet = spriteA.texture && spriteA.texture.key && 
                  (spriteA.texture.key === 'bullet' || spriteA.texture.key === 'enemy_bullet') 
                 ? spriteA : spriteB;
  const bossRef = spriteA === bullet ? spriteB : spriteA;
  
  console.log('[hitBoss] 函数被调用!', { spriteA: spriteA, spriteB: spriteB, bullet: bullet, bossRef: bossRef });
  
  // 安全销毁子弹
  if (bullet && bullet.active) {
    console.log('[hitBoss] 销毁子弹');
    bullet.destroy();
  }
  
  // 多重防护：全局标志 + active 检查
  if (!bossAlive || !bossRef) {
    console.log('[hitBoss] Boss 不存在或已死亡，跳过', { bossAlive, bossRef });
    return;
  }
  
  if (!bossRef.active) {
    console.log('[hitBoss] Boss 不活跃，跳过');
    return;
  }

  // 从全局 boss 对象获取 hp 和 maxHp，因为 sprite 的属性可能丢失
  const dmg = getDamage();
  const currentHp = boss.hp;
  const maxHp = boss.maxHp;
  
  console.log('[hitBoss] BEFORE hp:', currentHp, 'maxHp:', maxHp, 'dmg:', dmg, 'bossAlive:', bossAlive, 'active:', bossRef.active);

  // 确保 maxHp 存在
  if (!maxHp || maxHp <= 0) {
    console.warn('[hitBoss] Boss has no maxHp! Setting to 40');
    boss.maxHp = 40;
    boss.hp = 40;
  }

  // 使用全局 boss 对象修改血量
  boss.hp -= dmg;
  console.log('[hitBoss] AFTER hp:', boss.hp);

  // 受击闪白（使用 bossRef 因为它有 sprite 方法）
  if (bossRef && bossRef.active) {
    bossRef.setTint(0xffffff);
    const scene = game.scene.scenes[0];
    if (scene && scene.time) {
      scene.time.delayedCall(100, () => { if (bossRef && bossRef.active) bossRef.clearTint(); });
    }

    // 受击数字飘字
    if (scene) {
      const dmgText = scene.add.text(bossRef.x + Phaser.Math.Between(-20, 20), bossRef.y - 50, `-${dmg}`, {
        fontSize: '18px', fill: '#ff6644', fontStyle: 'bold',
        fontFamily: 'VT323, monospace'
      }).setOrigin(0.5).setDepth(70);
      scene.tweens.add({ targets: dmgText, y: dmgText.y - 30, alpha: 0, duration: 500, onComplete: () => dmgText.destroy() });
    }
    
    // 小爆炸反馈
    if (particles) particles.emitParticleAt(bossRef.x, bossRef.y, 8);
  }

  if (boss.hp <= 0) {
    console.log('[hitBoss] Boss 血量归零，准备死亡');
    // 立即标记死亡，防止后续 overlap 再次触发
    bossAlive = false;
    boss.hp = 0;

    console.log('[hitBoss] BOSS DEFEATED!');
    
    // 清除血条 UI
    if (bossHpBg) { bossHpBg.destroy(); bossHpBg = null; }
    if (bossHpFill) { bossHpFill.destroy(); bossHpFill = null; }
    if (bossHpText) { bossHpText.destroy(); bossHpText = null; }

    // 保存 boss 位置用于爆炸
    const bossX = bossRef ? bossRef.x : GW / 2;
    const bossY = bossRef ? bossRef.y : 100;

    // 销毁 Boss 精灵
    if (bossRef && bossRef.active) bossRef.destroy();
    boss = null;

    // 大爆炸效果
    if (particles) particles.emitParticleAt(bossX, bossY, 30);
    
    score += 500 * difficultySettings[difficulty].scoreMult;
    scoreText.setText(`Score: ${score}`);
    checkAchievement('bossSlayer');
    playSound('explosion');
    screenShake = 15;
  } else {
    console.log('[hitBoss] Boss 受伤，更新血条');
    updateBossHpBar(boss.hp, boss.maxHp);
    playSound('hit');
  }
}

function hitPlayer(player, enemy) {
  if (isInvincible) return; // 无敌期间不受伤

  if (hasShield) {
    hasShield = false;
    shieldSprite.setVisible(false);
    if (enemy) enemy.destroy();
    playSound('hit');
    return;
  }

  lives--;
  livesText.setText(`Lives: ${lives}`);

  // 爆炸效果
  const explosion = this.add.sprite(player.x, player.y, 'explosion');
  this.tweens.add({
    targets: explosion,
    scale: 1.5,
    alpha: 0,
    duration: 300,
    onComplete: () => explosion.destroy()
  });

  player.setPosition(GW / 2, GH - 80);
  combo = 0;
  comboText.setVisible(false);

  // 无敌保护：2秒无敌 + 闪烁效果
  isInvincible = true;
  player.setAlpha(0.4);
  if (invincibleTimer) clearTimeout(invincibleTimer);
  invincibleTimer = setTimeout(() => {
    isInvincible = false;
    if (player && player.active) player.setAlpha(1);
  }, 2000);

  playSound('explosion');
  screenShake = 10;
  
  if (lives <= 0) {
    gameOverScreen.call(this);
  }
}

function collectPowerup(player, powerup) {
  powerup.destroy();
  playSound('powerup');
  const scene = game.scene.scenes[0];
  const key = powerup.texture.key;
  
  switch(key) {
    case 'powerup_shield':
      hasShield = true;
      shieldSprite.setVisible(true);
      showEffectLabel(scene, '🛡️ 护盾', '#00ffff', 10000);
      setTimeout(() => { hasShield = false; shieldSprite.setVisible(false); }, 10000);
      break;
    case 'powerup_rapid':
      rapidFire = true;
      if (rapidFireTimer) clearTimeout(rapidFireTimer);
      showEffectLabel(scene, '⚡ 速射', '#ff66ff', 8000);
      rapidFireTimer = setTimeout(() => { rapidFire = false; }, 8000);
      break;
    case 'powerup_life':
      lives++;
      livesText.setText(`Lives: ${lives}`);
      showEffectLabel(scene, '❤️ +1 UP', '#ff4444', 2000);
      break;
    case 'powerup_spread':
      spreadShot = true;
      if (spreadShotTimer) clearTimeout(spreadShotTimer);
      showEffectLabel(scene, '🔥 散射弹幕', '#ff8800', 8000);
      spreadShotTimer = setTimeout(() => { spreadShot = false; }, 8000);
      break;
    case 'powerup_bomb':
      triggerBomb(scene);
      break;
    case 'powerup_magnet':
      magnetActive = true;
      if (magnetTimer) clearTimeout(magnetTimer);
      showEffectLabel(scene, '🧲 磁铁吸分', '#ffff00', 10000);
      magnetTimer = setTimeout(() => { magnetActive = false; }, 10000);
      break;
    case 'powerup_laser':
      laserActive = true;
      if (laserTimer) clearTimeout(laserTimer);
      showEffectLabel(scene, '🔫 激光武器', '#00ff44', 6000);
      laserTimer = setTimeout(() => { laserActive = false; }, 6000);
      break;
    case 'powerup_double':
      doubleScore = true;
      if (doubleScoreTimer) clearTimeout(doubleScoreTimer);
      showEffectLabel(scene, '⭐ 双倍得分', '#ffdd00', 10000);
      doubleScoreTimer = setTimeout(() => { doubleScore = false; }, 10000);
      break;
    case 'powerup_damage':
      damageBoost = 3;
      if (damageBoostTimer) clearTimeout(damageBoostTimer);
      showEffectLabel(scene, '💥 伤害 ×3', '#ff4400', 8000);
      damageBoostTimer = setTimeout(() => { damageBoost = 1; }, 8000);
      break;
  }
}

function bulletCollision(bullet1, bullet2) {
  bullet1.destroy();
  bullet2.destroy();
  playSound('hit');
}

function spawnEnemies() {
  enemyDirection = 1;
  enemies.clear(true, true);
  const lp = getLevelParams(level);
  
  // 每关更新敌人移动速度
  baseEnemySpeed = 30 * lp.enemySpeed;
  
  if (level % 5 === 0) {
    bossLevel = true;
    bossAlive = true; // 标记 Boss 存活
    
    // 使用存在的纹理，如果 boss 不存在，使用 enemy4（坦克型敌人）作为 boss
    const bossTexture = this.textures.exists('boss') ? 'boss' : 
                        this.textures.exists('enemy4') ? 'enemy4' :
                        this.textures.exists('enemy0') ? 'enemy0' : 'enemy0';
    
    boss = this.physics.add.sprite(GW / 2, 100, bossTexture);
    boss.hp = lp.bossHP;
    boss.maxHp = lp.bossHP;
    boss.setCollideWorldBounds(true);
    boss.setImmovable(true); // Boss 不会被子弹推动
    boss.setScale(2); // Boss 放大显示
    console.log('[spawnBoss] Boss created. hp:', boss.hp, 'maxHp:', boss.maxHp, 'bossHP param:', lp.bossHP, 'texture:', bossTexture);
    
    // 添加 boss 和 bullets 的碰撞检测
    this.physics.add.overlap(bullets, boss, hitBoss, null, this);

    // Boss 血条
    const barW = 200, barH = 16;
    const barX = (GW - barW) / 2, barY = 50;
    bossHpBg = this.add.graphics().setDepth(80);
    bossHpBg.fillStyle(0x333333, 0.8);
    bossHpBg.fillRoundedRect(barX, barY, barW, barH, 4);
    bossHpFill = this.add.graphics().setDepth(81);
    bossHpText = this.add.text(GW / 2, barY + barH / 2, `BOSS  ${lp.bossHP}/${lp.bossHP}`, {
      fontSize: '16px', fill: '#ffffff', fontFamily: 'VT323, monospace'
    }).setOrigin(0.5).setDepth(82);
    updateBossHpBar(boss.hp, boss.maxHp);
  } else {
    bossLevel = false;
    bossAlive = false;
    const rows = lp.rows;
    const cols = lp.cols;
    const spacingX = 75;
    const spacingY = 58;
    const startX = (GW - (cols - 1) * spacingX) / 2;
    const startY = 90;
    const pool = getEnemyPool(level);
    
    for (let row = 0; row < rows; row++) {
      // 最后一行（最接近玩家）放最强敌人，第0行放最弱的
      const typeIdx = Math.floor((row / Math.max(rows - 1, 1)) * (pool.length - 1));
      const type = pool[pool.length - 1 - typeIdx]; // 倒序：最后一行最强
      
      for (let col = 0; col < cols; col++) {
        const textureKey = this.textures.exists(type.key) ? type.key : 'enemy0';
        const enemy = enemies.create(
          startX + col * spacingX,
          startY + row * spacingY,
          textureKey
        );
        enemy.setOrigin(0.5);
        // 存储敌人类型数据
        enemy.enemyType = type;
        // 设置敌人血量 = 关卡基础血量 × 类型血量倍率
        enemy.hp = lp.enemyHP * type.hpMult;
        enemy.maxHp = enemy.hp;
        // 坦克型速度更慢
        if (type.special === 'tank') {
          enemy.body.velocity.x = baseEnemySpeed * type.speedMult * enemyDirection;
        }
        // 初始化敌人血条
        initEnemyHpBar(enemy);
      }
    }
  }
}

function nextLevel() {
  level++;
  const lp = getLevelParams(level);
  
  // 关卡奖励分数
  score += lp.levelBonus;
  scoreText.setText(`Score: ${score}`);
  levelText.setText(`Level: ${level}`);
  
  if (level === 5) checkAchievement('level5');
  if (level === 10) checkAchievement('level10');
  
  // 更新最高分
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('highScore', highScore);
    highScoreText.setText(`High: ${highScore}`);
  }
  
  // 检查完美通关
  if (lives === difficultySettings[difficulty].lives) {
    checkAchievement('perfect');
  }
  
  // 检查神射手
  if (totalShots > 0 && totalKills / totalShots > 0.8) {
    checkAchievement('sharpshooter');
  }
  
  // 显示过关信息
  const scene = game.scene.scenes[0];
  if (scene) {
    const isBoss = level % 5 === 0;
    const lvlText = scene.add.text(GW / 2, GH / 2 - 40, 
      isBoss ? `⚠️ LEVEL ${level} — BOSS INCOMING!` : `✨ LEVEL ${level}`, {
      fontSize: '48px', fill: isBoss ? '#ff4444' : '#44ff44', fontStyle: 'bold',
      fontFamily: 'VT323, monospace', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(90);
    
    const bonusText = scene.add.text(GW / 2, GH / 2 + 20, 
      `+${lp.levelBonus} 过关奖励`, {
      fontSize: '28px', fill: '#ffdd00',
      fontFamily: 'VT323, monospace'
    }).setOrigin(0.5).setDepth(90);
    
    const infoText = scene.add.text(GW / 2, GH / 2 + 55, 
      `速度 ×${lp.enemySpeed.toFixed(1)} | 敌弹 ×${(lp.bulletSpeed / 250).toFixed(1)} | ${lp.rows}×${lp.cols} 编队 | 伤害 ×${lp.baseDamageBoost.toFixed(1)}`, {
      fontSize: '22px', fill: '#aaaaaa',
      fontFamily: 'VT323, monospace'
    }).setOrigin(0.5).setDepth(90);
    
    scene.tweens.add({
      targets: [lvlText, bonusText, infoText],
      alpha: 0, y: '-=30', duration: 500,
      delay: 1500,
      onComplete: () => {
        lvlText.destroy();
        bonusText.destroy();
        infoText.destroy();
      }
    });
  }
  
  // 短暂庆祝后生成下一关敌人
  this.time.delayedCall(2000, () => {
    spawnEnemies.call(this);
    transitionLock = false; // 生成完毕，解锁
  });
}

function gameOverScreen() {
  gameOver = true;
  
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('highScore', highScore);
  }
  
  this.physics.pause();
  
  // 显示游戏结束界面
  this.add.text(GW / 2, GH * 0.3, 'GAME OVER', {
    fontSize: '64px', fill: '#f00', fontStyle: 'bold',
    fontFamily: 'VT323, monospace'
  }).setOrigin(0.5);
  
  this.add.text(GW / 2, GH * 0.45, `Final Score: ${score}  |  到达关卡: ${level}`, {
    fontSize: '32px', fill: '#fff',
    fontFamily: 'VT323, monospace'
  }).setOrigin(0.5);
  
  this.add.text(GW / 2, GH * 0.58, '点击刷新重新开始', {
    fontSize: '24px', fill: '#aaa',
    fontFamily: 'VT323, monospace'
  }).setOrigin(0.5);
  
  this.input.once('pointerdown', () => {
    location.reload();
  });
}

function updateStatsPanel() {
  const accuracy = totalShots > 0 ? Math.round((totalKills / totalShots) * 100) : 0;
  statsPanel.setText([
    `📊 统计数据`,
    `────────────────`,
    `击杀: ${totalKills}`,
    `射击: ${totalShots}`,
    `命中率: ${accuracy}%`,
    `最大连击: ${maxCombo}`,
    `当前等级: ${level}`
  ]);
}

// ==================== 初始化游戏 ====================
// 首先加载 GTRS 配置，预检图片存在性，然后启动游戏
async function initGame() {
  // 从 localStorage 重新读取用户刚选的难度（覆盖页面加载时的旧值）
  difficulty = localStorage.getItem("difficulty") || "normal";

  // 重置所有游戏状态（防止第二次开始游戏时残留旧状态）
  score = 0;
  lives = 3;
  level = 1;
  combo = 0;
  maxCombo = 0;
  lastKillTime = 0;
  totalKills = 0;
  totalShots = 0;
  gameOver = false;
  gameWon = false;
  isPaused = false;
  bossLevel = false;
  hasShield = false;
  rapidFire = false;
  spreadShot = false;
  bombActive = false;
  magnetActive = false;
  laserActive = false;
  doubleScore = false;
  damageBoost = 1;
  screenShake = 0;
  transitionLock = false;
  lastFired = 0;
  boss = null;
  bossAlive = false;
  bossHpBg = bossHpFill = bossHpText = null;
  player = null;
  bullets = null;
  enemies = null;
  enemyBullets = null;
  powerups = null;
  particles = null;
  starsBg = null;
  shieldSprite = null;
  scoreText = null;
  livesText = null;
  levelText = null;
  comboText = null;
  statsPanel = null;
  enemyDirection = 1;
  baseEnemySpeed = 30;

  try {
    if (window.resourceLoader) {
      await window.resourceLoader.loadGtrsConfig();
      console.log('🎮 GTRS 配置加载成功');

      // 预检图片存在性，填充 gtrsImageMap
      // 注意：Vite SPA fallback 会把 404 变成 200（返回 index.html），
      // 必须检查 Content-Type 才能区分真实图片和 HTML fallback
      const gtrsData = window.resourceLoader.gtrsData;
      if (gtrsData && gtrsData.resources && gtrsData.resources.images) {
        for (const category of Object.values(gtrsData.resources.images)) {
          for (const [key, img] of Object.entries(category)) {
            if (!img.src) continue;
            try {
              const resp = await fetch(img.src, { method: 'HEAD' });
              const ct = resp.headers.get('content-type') || '';
              // 只接受真正的图片（image/*），排除 HTML SPA fallback
              if (resp.ok && ct.startsWith('image/')) {
                gtrsImageMap[key] = img.src;
                console.log(`✅ 图片存在: ${key} (${ct})`);
              } else {
                console.log(`⏭️ 跳过不存在的图片: ${key} (${resp.status} ${ct})`);
              }
            } catch { /* 忽略网络错误 */ }
          }
        }
      }
    }
  } catch (error) {
    console.log('⚠️ 资源管理器加载失败，使用默认配置');
  }
  
  // 启动 Phaser 游戏
  // 如果 game 实例已存在（用户第二次开始游戏），先销毁再重建，否则纹理 key 重复报错
  if (game) {
    game.destroy(true);
    game = null;
    // 等一帧，让 Phaser 完成销毁
    await new Promise(r => setTimeout(r, 100));
  }
  game = new Phaser.Game(config);
}

// index.html 调用 window.launchPhaser() 触发游戏初始化
window.launchPhaser = initGame;

// 资源管理器「应用到资源」后调用此函数，热替换游戏纹理（无需刷新页面）
window.reloadGameTexture = function(key, base64DataUrl) {
  if (!game || game.scene.scenes.length === 0) return;
  const scene = game.scene.scenes[0]; // BootScene
  if (!scene || !scene.textures) return;

  // 用 Image 加载 base64 → 替换纹理
  const img = new Image();
  img.onload = function() {
    if (scene.textures.exists(key)) {
      // 已有纹理：更新源图片
      const tex = scene.textures.get(key);
      const src = tex.source[0];
      if (src && src.image) {
        src.image = img;
        tex.update();
        console.log(`🔄 纹理热替换成功: ${key}`);
      } else {
        // fallback：删除后重建
        scene.textures.remove(key);
        scene.textures.addImage(key, img);
        console.log(`🔄 纹理重建成功: ${key}`);
      }
    } else {
      scene.textures.addImage(key, img);
      console.log(`🔄 纹理新增成功: ${key}`);
    }
  };
  img.onerror = function() {
    console.warn(`⚠️ 纹理热替换失败: ${key}, 无效的图片数据`);
  };
  img.src = base64DataUrl;
};

// 如果没有难度选择界面（比如直接访问 /resource-manager 再回来），不自动启动
// 页面加载完成后不再自动初始化，等待 startGame 调用
