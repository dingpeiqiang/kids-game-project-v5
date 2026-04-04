/**
 * Space Invaders v3.0 - 完整优化版
 * 
 * 新增功能:
 * 1. 连击系统 (Combo System)
 * 2. 敌人射击 (Enemy Shooting)
 * 3. Boss战系统 (Boss Battles)
 * 4. 成就系统 (Achievements)
 * 5. 难度选择 (Difficulty Levels)
 * 6. 实时统计 (Live Statistics)
 * 7. 动态背景 (Scrolling Background)
 * 8. 屏幕震动 (Screen Shake)
 */

// ==================== 全局变量 ====================
let game;
let myNickname = localStorage.getItem("nickname") || "Player";
let highScore = parseInt(localStorage.getItem("highScore")) || 0;
let achievements = JSON.parse(localStorage.getItem("achievements")) || {};
let difficulty = localStorage.getItem("difficulty") || "normal";

// 游戏配置
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  backgroundColor: "#000033",
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
let boss;
let starsBg;

// 游戏状态
let enemyDirection = 1;
let baseEnemySpeed = 50;
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
let fireRate = 300;
let rapidFire = false;
let rapidFireTimer;

// 道具和特效
let hasShield = false;
let shieldSprite;
let screenShake = 0;

// 难度设置
const difficultySettings = {
  easy: { enemySpeed: 0.7, enemyFireRate: 3000, lives: 5, scoreMult: 0.8 },
  normal: { enemySpeed: 1.0, enemyFireRate: 2000, lives: 3, scoreMult: 1.0 },
  hard: { enemySpeed: 1.5, enemyFireRate: 1000, lives: 2, scoreMult: 1.5 }
};

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
  const notif = game.scene.scenes[0].add.text(400, 100, `🏆 成就解锁: ${name}`, {
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

// ==================== 预加载资源 ====================
function preload() {
  const g = this.make.graphics({ x: 0, y: 0, add: false });
  
  // 玩家飞船
  g.clear(); g.fillStyle(0x00ff00);
  g.beginPath(); g.moveTo(30, 0); g.lineTo(60, 32); g.lineTo(0, 32);
  g.closePath(); g.fillPath();
  g.generateTexture('ship', 60, 32);
  
  // 子弹
  g.clear(); g.fillStyle(0xffff00); g.fillRect(0, 0, 4, 16);
  g.generateTexture('bullet', 4, 16);
  
  // 敌人 (3种)
  const colors = [0xff0000, 0xff00ff, 0x00ffff];
  for (let i = 0; i < 3; i++) {
    g.clear(); g.fillStyle(colors[i]);
    g.fillRect(8, 0, 32, 8); g.fillRect(0, 8, 48, 16);
    g.fillRect(8, 24, 8, 8); g.fillRect(32, 24, 8, 8);
    g.fillStyle(0xffffff); g.fillRect(12, 12, 8, 8); g.fillRect(28, 12, 8, 8);
    g.generateTexture(`enemy${i}`, 48, 32);
  }
  
  // 爆炸
  g.clear();
  g.fillStyle(0xff6600); 
  g.fillCircle(24, 24, 20);
  g.fillStyle(0xffff00); 
  g.fillCircle(24, 24, 12);
  g.fillStyle(0xffffff); 
  g.fillCircle(24, 24, 6);
  g.generateTexture('explosion', 48, 48);
  
  // 星空背景
  g.clear();
  for (let i = 0; i < 100; i++) {
    g.fillStyle(0xffffff, Math.random() * 0.5 + 0.5);
    g.fillCircle(Math.random() * 800, Math.random() * 600, Math.random() * 2);
  }
  g.generateTexture('stars', 800, 600);
  
  // 道具纹理
  g.clear(); g.lineStyle(3, 0x00ffff); g.strokeCircle(16, 16, 14);
  g.fillStyle(0x00ffff, 0.3); g.fillCircle(16, 16, 14);
  g.generateTexture('powerup_shield', 32, 32);
  
  g.clear(); g.fillStyle(0xff00ff); g.fillRect(4, 8, 24, 16);
  g.fillStyle(0xffffff); g.fillRect(8, 12, 16, 8);
  g.generateTexture('powerup_rapid', 32, 32);
  
  g.clear(); g.fillStyle(0xff0000);
  g.fillRect(8, 12, 16, 16); g.fillCircle(12, 12, 6);
  g.fillCircle(20, 12, 6); g.fillTriangle(8, 24, 24, 24, 16, 30);
  g.generateTexture('powerup_life', 32, 32);
  
  // 粒子
  g.clear(); g.fillStyle(0xffffff); g.fillCircle(4, 4, 4);
  g.generateTexture('particle', 8, 8);
  
  // 敌人子弹
  g.clear(); g.fillStyle(0xff0000); g.fillCircle(6, 6, 6);
  g.generateTexture('enemy_bullet', 12, 12);
  
  // Boss
  g.clear(); g.fillStyle(0xff00ff); g.fillRect(0, 0, 80, 60);
  g.fillStyle(0xffff00); g.fillRect(10, 10, 20, 15);
  g.fillRect(50, 10, 20, 15); g.fillRect(20, 35, 40, 10);
  g.generateTexture('boss', 80, 60);
}

// ==================== 创建场景 ====================
function create() {
  // 应用难度设置
  const settings = difficultySettings[difficulty];
  lives = settings.lives;
  baseEnemySpeed = 50 * settings.enemySpeed;
  
  // 动态背景
  starsBg = this.add.tileSprite(400, 300, 800, 600, 'stars');
  
  // 玩家
  player = this.physics.add.sprite(400, 550, "ship");
  player.setCollideWorldBounds(true);
  player.setDragX(500);
  
  // 护盾
  shieldSprite = this.add.circle(400, 550, 40, 0x00ffff, 0.3);
  shieldSprite.setVisible(false);
  
  // 子弹组
  bullets = this.physics.add.group({ defaultKey: "bullet", maxSize: 30 });
  enemyBullets = this.physics.add.group({ defaultKey: "enemy_bullet", maxSize: 50 });
  
  // 敌人群
  enemies = this.physics.add.group();
  
  // 道具组
  powerups = this.physics.add.group({ defaultKey: 'powerup_shield', maxSize: 5 });
  
  // 粒子系统
  particles = this.add.particles(0, 0, 'particle', {
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
  comboText = this.add.text(400, 16, '', {
    fontSize: "28px", fill: "#ff0", fontStyle: "bold",
    fontFamily: "VT323, monospace"
  }).setOrigin(0.5).setVisible(false);
  
  // 统计面板
  statsPanel = this.add.text(16, 120, '', {
    fontSize: "18px", fill: "#aaa", fontFamily: "VT323, monospace",
    backgroundColor: '#00000080', padding: { x: 8, y: 4 }
  }).setVisible(false);
  
  // 暂停文本
  this.pauseText = this.add.text(400, 300, 'PAUSED\n\nPress ESC to Resume', {
    fontSize: '48px', fill: '#fff', align: 'center',
    fontFamily: 'VT323, monospace'
  }).setOrigin(0.5).setVisible(false);
  
  // 生成敌人
  spawnEnemies.call(this);
  
  // 碰撞检测
  this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);
  this.physics.add.collider(player, enemies, hitPlayer, null, this);
  this.physics.add.overlap(player, powerups, collectPowerup, null, this);
  this.physics.add.overlap(player, enemyBullets, playerHitByBullet, null, this);
  
  // 定时器
  this.time.addEvent({
    delay: 1000, callback: moveEnemies, callbackScope: this, loop: true
  });
  
  this.time.addEvent({
    delay: 8000, callback: spawnPowerup, callbackScope: this, loop: true
  });
  
  // 敌人射击
  this.time.addEvent({
    delay: settings.enemyFireRate,
    callback: enemyShoot,
    callbackScope: this,
    loop: true
  });
  
  // Tab键切换统计面板
  tabKey.on('down', () => {
    statsPanel.setVisible(!statsPanel.visible);
  });
}

// ==================== 游戏更新循环 ====================
function update(time, delta) {
  // 背景滚动
  if (starsBg) starsBg.tilePositionY += 0.5;
  
  // 屏幕震动
  if (screenShake > 0) {
    this.cameras.main.shake(screenShake);
    screenShake = 0;
  }
  
  // 暂停
  if (Phaser.Input.Keyboard.JustDown(pauseKey) && !gameOver && !gameWon) {
    isPaused = !isPaused;
    this.physics.pause();
    this.pauseText.setVisible(isPaused);
    if (!isPaused) this.physics.resume();
    return;
  }
  
  if (gameOver || gameWon || isPaused) return;
  
  // 玩家移动
  if (cursors.left.isDown) player.setVelocityX(-300);
  else if (cursors.right.isDown) player.setVelocityX(300);
  else player.setVelocityX(0);
  
  // 护盾跟随
  if (hasShield && shieldSprite) shieldSprite.setPosition(player.x, player.y);
  
  // 射击
  const currentFireRate = rapidFire ? 100 : fireRate;
  if (fireKey.isDown && time > lastFired) {
    fireBullet.call(this);
    lastFired = time + currentFireRate;
  }
  
  // 清理子弹
  bullets.children.iterate(b => {
    if (b && b.active && b.y < 0) { b.setActive(false); b.setVisible(false); }
  });
  
  enemyBullets.children.iterate(b => {
    if (b && b.active && b.y > 620) { b.setActive(false); b.setVisible(false); }
  });
  
  // 清理道具
  powerups.children.iterate(p => {
    if (p && p.active && p.y > 620) { p.setActive(false); p.setVisible(false); }
  });
  
  // 连击超时检查
  if (combo > 0 && Date.now() - lastKillTime > 2000) {
    combo = 0;
    comboText.setVisible(false);
  }
  
  // 更新统计
  updateStats();
  
  // 检查胜利
  if (!bossLevel && enemies.countActive(true) === 0) {
    levelComplete.call(this);
  }
  
  // 检查Boss胜利
  if (bossLevel && (!boss || !boss.active)) {
    bossLevelComplete.call(this);
  }
  
  // 检查失败
  enemies.children.iterate(e => {
    if (e && e.active && e.y > 520) {
      gameOver = true;
      showGameOver.call(this);
    }
  });
}

// ==================== 敌人生成 ====================
function spawnEnemies() {
  // Boss关卡
  if (level % 5 === 0) {
    spawnBoss.call(this);
    return;
  }
  
  bossLevel = false;
  const rows = 3 + Math.min(level - 1, 3);
  const cols = 8;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const enemy = enemies.create(100 + col * 70, 50 + row * 50, `enemy${row % 3}`);
      enemy.setImmovable(true);
    }
  }
}

// ==================== Boss生成 ====================
function spawnBoss() {
  bossLevel = true;
  boss = this.physics.add.sprite(400, 100, 'boss');
  boss.health = 20 + level * 2;
  boss.maxHealth = boss.health;
  boss.setImmovable(true);
  
  // Boss血条
  boss.healthBar = this.add.graphics();
  updateBossHealthBar.call(this);
  
  // Boss移动
  this.time.addEvent({
    delay: 2000,
    callback: () => {
      if (boss && boss.active) {
        boss.x = Phaser.Math.Between(100, 700);
      }
    },
    loop: true
  });
  
  // Boss射击
  this.time.addEvent({
    delay: 1500,
    callback: bossShoot,
    callbackScope: this,
    loop: true
  });
}

function updateBossHealthBar() {
  if (!boss || !boss.healthBar) return;
  const bar = boss.healthBar;
  bar.clear();
  bar.fillStyle(0xff0000);
  bar.fillRect(boss.x - 40, boss.y - 40, 80, 8);
  bar.fillStyle(0x00ff00);
  bar.fillRect(boss.x - 40, boss.y - 40, 80 * (boss.health / boss.maxHealth), 8);
}

function bossShoot() {
  if (!boss || !boss.active) return;
  playSound('enemyShoot');
  
  // 三发散射
  for (let angle of [-30, 0, 30]) {
    const bullet = enemyBullets.get();
    if (bullet) {
      bullet.enableBody(true, boss.x, boss.y + 30, true, true);
      bullet.setActive(true).setVisible(true);
      this.physics.velocityFromRotation(angle * Math.PI / 180, 250, bullet.body.velocity);
    }
  }
}

// ==================== 敌人移动 ====================
function moveEnemies() {
  if (gameOver || gameWon || bossLevel) return;
  
  let hitEdge = false;
  enemies.children.iterate(e => {
    if (e && e.active) {
      if ((e.x > 750 && enemyDirection > 0) || (e.x < 50 && enemyDirection < 0)) {
        hitEdge = true;
      }
    }
  });
  
  enemies.children.iterate(e => {
    if (e && e.active) {
      if (hitEdge) e.y += 20;
      else e.x += enemyDirection * 10;
    }
  });
  
  if (hitEdge) enemyDirection *= -1;
}

// ==================== 敌人射击 ====================
function enemyShoot() {
  if (gameOver || gameWon || bossLevel) return;
  
  const activeEnemies = enemies.getChildren().filter(e => e.active);
  if (activeEnemies.length > 0) {
    const shooter = Phaser.Utils.Array.GetRandom(activeEnemies);
    const bullet = enemyBullets.get();
    if (bullet) {
      bullet.enableBody(true, shooter.x, shooter.y + 20, true, true);
      bullet.setActive(true).setVisible(true);
      bullet.setVelocityY(200);
      playSound('enemyShoot');
    }
  }
}

// ==================== 道具系统 ====================
function spawnPowerup() {
  if (gameOver || gameWon || isPaused) return;
  const types = ['powerup_shield', 'powerup_rapid', 'powerup_life'];
  const type = types[Math.floor(Math.random() * types.length)];
  const x = Phaser.Math.Between(50, 750);
  const p = powerups.get();
  
  if (p) {
    p.enableBody(true, x, -30, true, true);
    p.setActive(true).setVisible(true);
    p.setTexture(type);
    p.setVelocityY(80);
    p.powerupType = type;
  }
}

function collectPowerup(player, powerup) {
  playSound('powerup');
  const type = powerup.powerupType;
  
  switch(type) {
    case 'powerup_shield':
      hasShield = true;
      shieldSprite.setVisible(true);
      setTimeout(() => { hasShield = false; shieldSprite.setVisible(false); }, 10000);
      showFloatingText.call(this, player.x, player.y - 40, 'SHIELD!', '#0ff');
      break;
    case 'powerup_rapid':
      rapidFire = true;
      if (rapidFireTimer) clearTimeout(rapidFireTimer);
      rapidFireTimer = setTimeout(() => { rapidFire = false; }, 8000);
      showFloatingText.call(this, player.x, player.y - 40, 'RAPID FIRE!', '#f0f');
      break;
    case 'powerup_life':
      lives++;
      livesText.setText(`Lives: ${lives}`);
      showFloatingText.call(this, player.x, player.y - 40, '+1 LIFE!', '#f00');
      break;
  }
  
  powerup.setActive(false).setVisible(false);
}

// ==================== 战斗系统 ====================
function fireBullet() {
  const bullet = bullets.get();
  if (bullet) {
    bullet.enableBody(true, player.x, player.y - 20, true, true);
    bullet.setActive(true).setVisible(true);
    bullet.setVelocityY(-500);
    totalShots++;
    playSound('shoot');
  }
}

function hitEnemy(bullet, enemy) {
  bullet.setActive(false).setVisible(false);
  
  // Boss特殊处理 - 需要多次命中
  if (enemy === boss && bossLevel) {
    playSound('hit');
    boss.health--;
    updateBossHealthBar.call(this);
    
    // Boss受伤特效
    particles.emitParticleAt(enemy.x, enemy.y, 10);
    screenShake = 100;
    
    // Boss闪烁
    this.tweens.add({
      targets: boss,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 2,
      onComplete: () => boss.setAlpha(1)
    });
    
    // Boss被击败
    if (boss.health <= 0) {
      playSound('explosion');
      particles.emitParticleAt(boss.x, boss.y, 30);
      
      const exp = this.add.sprite(boss.x, boss.y, "explosion");
      exp.setOrigin(0.5);  // 设置原点为中心
      exp.setScale(1.8);   // Boss爆炸更大
      this.tweens.add({
        targets: exp, 
        scale: 3.0,        // 放大到3倍
        alpha: 0,          // 淡出
        duration: 600,     // 600ms动画
        ease: 'Power2',    // 缓动函数
        onComplete: () => exp.destroy()
      });
      
      boss.disableBody(true, true);
      if (boss.healthBar) boss.healthBar.destroy();
      
      // 连击系统
      const now = Date.now();
      if (now - lastKillTime < 2000) {
        combo++;
        if (combo > maxCombo) maxCombo = combo;
      } else {
        combo = 1;
      }
      lastKillTime = now;
      
      // Boss奖励分数
      const comboBonus = 1 + (combo * 0.1);
      const diffMult = difficultySettings[difficulty].scoreMult;
      score += Math.floor((50 * level) * comboBonus * diffMult);
      scoreText.setText(`Score: ${score}`);
      totalKills++;
      
      if (score > highScore) {
        highScore = score;
        highScoreText.setText(`High: ${highScore}`);
        localStorage.setItem('highScore', highScore.toString());
      }
      
      checkAchievement('bossSlayer');
      showFloatingText.call(this, boss.x, boss.y - 50, 'BOSS DEFEATED!', '#f0f');
    }
    
    return; // Boss未死亡,直接返回
  }
  
  // 普通敌人 - 一击必杀
  playSound('explosion');
  
  // 粒子爆炸
  particles.emitParticleAt(enemy.x, enemy.y, 15);
  
  // 传统爆炸
  const exp = this.add.sprite(enemy.x, enemy.y, "explosion");
  exp.setOrigin(0.5);  // 设置原点为中心
  exp.setScale(0.8);   // 初始缩放
  this.tweens.add({
    targets: exp, 
    scale: 2.0,        // 放大到2倍
    alpha: 0,          // 淡出
    duration: 400,     // 400ms动画
    ease: 'Power2',    // 缓动函数
    onComplete: () => exp.destroy()
  });
  
  enemy.disableBody(true, true);
  
  // 连击系统
  const now = Date.now();
  if (now - lastKillTime < 2000) {
    combo++;
    if (combo > maxCombo) maxCombo = combo;
  } else {
    combo = 1;
  }
  lastKillTime = now;
  
  // 更新连击显示
  if (combo > 1) {
    comboText.setText(`${combo}x COMBO!`);
    comboText.setVisible(true);
    if (combo >= 10) comboText.setColor('#ff0');
    else if (combo >= 5) comboText.setColor('#f80');
    else comboText.setColor('#ff0');
  }
  
  // 分数计算 (连击加成)
  const comboBonus = 1 + (combo * 0.1);
  const diffMult = difficultySettings[difficulty].scoreMult;
  score += Math.floor((10 * level) * comboBonus * diffMult);
  scoreText.setText(`Score: ${score}`);
  
  // 统计
  totalKills++;
  
  // 最高分
  if (score > highScore) {
    highScore = score;
    highScoreText.setText(`High: ${highScore}`);
    localStorage.setItem('highScore', highScore.toString());
  }
  
  // 成就检查
  checkAchievement('firstBlood');
  if (combo >= 5) checkAchievement('combo5');
  if (combo >= 10) checkAchievement('combo10');
  if (score >= 1000) checkAchievement('score1000');
  if (score >= 5000) checkAchievement('score5000');
  
  // 屏幕震动
  screenShake = 50;
}

function hitPlayer(player, enemy) {
  if (hasShield) {
    playSound('hit');
    enemy.disableBody(true, true);
    this.tweens.add({
      targets: shieldSprite, alpha: 0.1, duration: 100,
      yoyo: true, repeat: 3
    });
    showFloatingText.call(this, player.x, player.y - 40, 'BLOCKED!', '#0ff');
    return;
  }
  
  playerHit.call(this);
}

function playerHitByBullet(player, bullet) {
  if (hasShield) {
    bullet.setActive(false).setVisible(false);
    this.tweens.add({
      targets: shieldSprite, alpha: 0.1, duration: 100,
      yoyo: true, repeat: 3
    });
    return;
  }
  
  bullet.setActive(false).setVisible(false);
  playerHit.call(this);
}

function playerHit() {
  playSound('hit');
  lives--;
  livesText.setText(`Lives: ${lives}`);
  
  this.tweens.add({
    targets: player, alpha: 0, duration: 100, yoyo: true, repeat: 3,
    onComplete: () => player.setAlpha(1)
  });
  
  particles.emitParticleAt(player.x, player.y, 20);
  screenShake = 200;
  
  if (lives <= 0) {
    gameOver = true;
    showGameOver.call(this);
  } else {
    player.setPosition(400, 550);
  }
}

// ==================== 关卡系统 ====================
function levelComplete() {
  gameWon = true;
  this.physics.pause();
  playSound('powerup');
  
  const txt = this.add.text(400, 300, `LEVEL ${level} COMPLETE!`, {
    fontSize: "48px", fill: "#0f0", fontStyle: "bold",
    fontFamily: "VT323, monospace"
  }).setOrigin(0.5);
  
  this.tweens.add({
    targets: txt, scale: 1.2, duration: 500, yoyo: true, repeat: 2
  });
  
  // Bonus分数
  const bonus = level * 100;
  score += bonus;
  scoreText.setText(`Score: ${score}`);
  showFloatingText.call(this, 400, 360, `+${bonus} BONUS!`, '#ff0');
  
  // 成就
  if (level >= 5) checkAchievement('level5');
  if (level >= 10) checkAchievement('level10');
  
  setTimeout(() => {
    level++;
    levelText.setText(`Level: ${level}`);
    nextLevel.call(this);
  }, 2000);
}

function bossLevelComplete() {
  gameWon = true;
  this.physics.pause();
  playSound('powerup');
  
  const txt = this.add.text(400, 300, `BOSS DEFEATED!`, {
    fontSize: "48px", fill: "#f0f", fontStyle: "bold",
    fontFamily: "VT323, monospace"
  }).setOrigin(0.5);
  
  this.tweens.add({
    targets: txt, scale: 1.2, duration: 500, yoyo: true, repeat: 2
  });
  
  // Boss奖励
  const bonus = level * 500;
  score += bonus;
  scoreText.setText(`Score: ${score}`);
  showFloatingText.call(this, 400, 360, `+${bonus} BOSS BONUS!`, '#f0f');
  
  checkAchievement('bossSlayer');
  
  setTimeout(() => {
    level++;
    levelText.setText(`Level: ${level}`);
    nextLevel.call(this);
  }, 2000);
}

function nextLevel() {
  gameWon = false;
  gameOver = false;
  baseEnemySpeed += 10;
  
  // 清理
  enemies.clear(true, true);
  powerups.clear(true, true);
  if (enemyBullets) enemyBullets.clear(true, true);
  if (boss) {
    boss.destroy();
    boss = null;
  }
  
  // 重置状态
  hasShield = false;
  shieldSprite.setVisible(false);
  rapidFire = false;
  if (rapidFireTimer) clearTimeout(rapidFireTimer);
  combo = 0;
  comboText.setVisible(false);
  
  // 生成新敌人
  spawnEnemies.call(this);
  player.setPosition(400, 550);
  this.physics.resume();
}

// ==================== 辅助函数 ====================
function showFloatingText(x, y, text, color) {
  const ft = game.scene.scenes[0].add.text(x, y, text, {
    fontSize: '24px', fill: color, fontFamily: 'VT323, monospace',
    fontStyle: 'bold'
  }).setOrigin(0.5);
  
  game.scene.scenes[0].tweens.add({
    targets: ft, y: y - 50, alpha: 0, duration: 1000,
    onComplete: () => ft.destroy()
  });
}

function updateStats() {
  const acc = totalShots > 0 ? (totalKills / totalShots * 100).toFixed(1) : 0;
  statsPanel.setText([
    `Kills: ${totalKills}`,
    `Shots: ${totalShots}`,
    `Accuracy: ${acc}%`,
    `Max Combo: ${maxCombo}`
  ]);
  
  // 神射手成就
  if (totalShots > 50 && parseFloat(acc) > 80) {
    checkAchievement('sharpshooter');
  }
}

function showGameOver() {
  this.physics.pause();
  player.setTint(0xff0000);
  playSound('explosion');
  
  this.add.text(400, 200, "GAME OVER", {
    fontSize: "64px", fill: "#f00", fontStyle: "bold",
    fontFamily: "VT323, monospace"
  }).setOrigin(0.5);
  
  this.add.text(400, 280, `Final Score: ${score}`, {
    fontSize: "32px", fill: "#fff", fontFamily: "VT323, monospace"
  }).setOrigin(0.5);
  
  this.add.text(400, 320, `High Score: ${highScore}`, {
    fontSize: "28px", fill: "#ff0", fontFamily: "VT323, monospace"
  }).setOrigin(0.5);
  
  this.add.text(400, 360, `Level Reached: ${level}`, {
    fontSize: "24px", fill: "#0ff", fontFamily: "VT323, monospace"
  }).setOrigin(0.5);
  
  const restartTxt = this.add.text(400, 430, "Press R to Restart", {
    fontSize: "24px", fill: "#0ff", fontFamily: "VT323, monospace"
  }).setOrigin(0.5);
  
  const restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  restartKey.on('down', () => location.reload());
  
  this.tweens.add({
    targets: restartTxt, alpha: 0.3, duration: 1000,
    yoyo: true, repeat: -1
  });
  
  if (score >= highScore && score > 0) {
    const newHigh = this.add.text(400, 470, "🏆 NEW HIGH SCORE! 🏆", {
      fontSize: "28px", fill: "#ff0", fontStyle: "bold",
      fontFamily: "VT323, monospace"
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: newHigh, scale: 1.1, duration: 500,
      yoyo: true, repeat: -1
    });
  }
}

// ==================== 启动游戏 ====================
window.addEventListener("load", () => {
  game = new Phaser.Game(config);
});
