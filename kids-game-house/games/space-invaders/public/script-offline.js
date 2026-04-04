/**
 * Space Invaders - Offline Edition (Optimized)
 *
 * 修复/优化：
 *  1. 敌人移动改为纯速度驱动，消除"定时器步进 + 每帧移动"双重叠加
 *  2. 玩家受伤后新增无敌帧（1.5s），防止连续扣血
 *  3. script-offline 补齐敌人子弹系统及碰撞检测
 *  4. levelComplete 防重入（gameWon 标志 + 清理多余调用）
 *  5. 响应式画布：Phaser Scale.FIT 适配容器大小
 *  6. 移动端触屏虚拟摇杆 / 按钮支持
 *  7. AudioContext 延迟初始化，首次用户交互后才创建，避免浏览器自动播放限制
 */

// ==================== 状态 ====================
let game;
let myNickname   = localStorage.getItem("nickname")  || "Player";
let highScore    = parseInt(localStorage.getItem("highScore")) || 0;
let achievements = JSON.parse(localStorage.getItem("achievements") || "{}");
let difficulty   = localStorage.getItem("difficulty") || "normal";

// 游戏实体
let player, bullets, enemyBullets, enemies, powerups, particles, boss, starsBg;

// 状态标志
let enemyDirection = 1;
let cursors, fireKey, pauseKey;
let score = 0, lives = 3, level = 1;
let combo = 0, maxCombo = 0, lastKillTime = 0;
let totalKills = 0, totalShots = 0;
let scoreText, livesText, levelText, highScoreText, comboText;
let gameOver = false, gameWon = false, isPaused = false, bossLevel = false;
let lastFired = 0;
let fireRate = 300;          // 正常冷却 ms
let rapidFire = false, rapidFireTimer = null;
let hasShield = false, shieldSprite;
let invincible = false, invincibleTimer = null;  // ★ 无敌帧
let bossRef = null;

// 移动端输入
let touchLeft = false, touchRight = false, touchFire = false;

// ==================== 难度 ====================
const difficultySettings = {
  easy:   { enemySpeedX: 40,  enemyFireDelay: 3000, lives: 5, scoreMult: 0.8 },
  normal: { enemySpeedX: 60,  enemyFireDelay: 2000, lives: 3, scoreMult: 1.0 },
  hard:   { enemySpeedX: 90,  enemyFireDelay: 1000, lives: 2, scoreMult: 1.5 },
};

// ==================== 音效（延迟初始化） ====================
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
  try {
    ensureAudio();
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    switch (type) {
      case 'shoot':
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
        break;
      case 'explosion':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start(); osc.stop(audioCtx.currentTime + 0.25);
        break;
      case 'powerup':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start(); osc.stop(audioCtx.currentTime + 0.25);
        break;
      case 'hit':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
        osc.start(); osc.stop(audioCtx.currentTime + 0.18);
        break;
      case 'enemyShoot':
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.start(); osc.stop(audioCtx.currentTime + 0.08);
        break;
      case 'levelup':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.12);
        osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.24);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.start(); osc.stop(audioCtx.currentTime + 0.4);
        break;
    }
  } catch (e) { /* 静默忽略音效错误 */ }
}

// ==================== 成就 ====================
const achievementList = {
  firstBlood:   { name: '首次击杀',   desc: '消灭第一个敌人' },
  combo5:       { name: '连击大师',   desc: '达到5连击' },
  combo10:      { name: '连击之神',   desc: '达到10连击' },
  level5:       { name: '进阶玩家',   desc: '到达第5关' },
  level10:      { name: '资深战士',   desc: '到达第10关' },
  score1000:    { name: '分数破千',   desc: '单局得分超过1000' },
  score5000:    { name: '高分玩家',   desc: '单局得分超过5000' },
  sharpshooter: { name: '神射手',     desc: '命中率超过80%（≥50发）' },
  bossSlayer:   { name: 'Boss杀手',   desc: '击败首个Boss' },
};

function checkAchievement(id) {
  if (!achievements[id]) {
    achievements[id] = true;
    localStorage.setItem('achievements', JSON.stringify(achievements));
    showAchievementNotification(achievementList[id].name);
  }
}

function showAchievementNotification(name) {
  const scene = game.scene.scenes[0];
  const notif = scene.add.text(400, 100, `🏆 成就解锁: ${name}`, {
    fontSize: '22px', fill: '#ff0', fontStyle: 'bold',
    fontFamily: 'VT323, monospace', backgroundColor: '#000',
    padding: { x: 10, y: 5 }
  }).setOrigin(0.5).setDepth(200);

  scene.tweens.add({
    targets: notif, y: 50, alpha: 0, duration: 2200,
    onComplete: () => notif.destroy()
  });
  playSound('powerup');
}

// ==================== 资源预加载 ====================
function preload() {
  const g = this.make.graphics({ x: 0, y: 0, add: false });

  // 玩家飞船（绿色三角）
  g.clear();
  g.fillStyle(0x00ff44);
  g.beginPath(); g.moveTo(30, 0); g.lineTo(60, 32); g.lineTo(0, 32);
  g.closePath(); g.fillPath();
  // 驾驶舱高光
  g.fillStyle(0xaaffcc, 0.6);
  g.fillRect(24, 10, 12, 10);
  g.generateTexture('ship', 60, 32);

  // 玩家子弹（亮黄）
  g.clear();
  g.fillStyle(0xffff44);
  g.fillRect(1, 0, 2, 14);
  g.fillStyle(0xffffff, 0.8);
  g.fillRect(1, 0, 2, 4);
  g.generateTexture('bullet', 4, 16);

  // 敌人子弹（红色圆点）
  g.clear();
  g.fillStyle(0xff3300);
  g.fillCircle(5, 5, 5);
  g.generateTexture('enemy_bullet', 10, 10);

  // 敌人（3种颜色）
  const enemyColors = [0xff2222, 0xff22ff, 0x22ffff];
  for (let i = 0; i < 3; i++) {
    g.clear();
    g.fillStyle(enemyColors[i]);
    g.fillRect(8, 0, 32, 8);
    g.fillRect(0, 8, 48, 16);
    g.fillRect(8, 24, 8, 8);
    g.fillRect(32, 24, 8, 8);
    g.fillStyle(0x000000);
    g.fillRect(13, 12, 7, 7);
    g.fillRect(28, 12, 7, 7);
    g.generateTexture(`enemy${i}`, 48, 32);
  }

  // 星空背景（静态一次生成）
  g.clear();
  const rng = Phaser.Math.RND; // 使用 Phaser 内置 RNG，可复现
  for (let i = 0; i < 120; i++) {
    const alpha = 0.4 + Math.random() * 0.6;
    g.fillStyle(0xffffff, alpha);
    g.fillCircle(Math.random() * 800, Math.random() * 600, Math.random() < 0.15 ? 2 : 1);
  }
  g.generateTexture('stars', 800, 600);

  // 道具：护盾
  g.clear();
  g.lineStyle(3, 0x00ffff); g.strokeCircle(16, 16, 13);
  g.fillStyle(0x00ffff, 0.25); g.fillCircle(16, 16, 13);
  g.generateTexture('powerup_shield', 32, 32);

  // 道具：速射
  g.clear();
  g.fillStyle(0xff44ff);
  g.fillRect(4, 6, 24, 20);
  g.fillStyle(0xffffff);
  g.fillRect(2, 2, 4, 14); g.fillRect(12, 2, 4, 14); g.fillRect(22, 2, 4, 14);
  g.generateTexture('powerup_rapid', 32, 32);

  // 道具：生命（心形，用 Canvas 确保正确渲染）
  const cvLife = document.createElement('canvas');
  cvLife.width = 32; cvLife.height = 32;
  const cxLife = cvLife.getContext('2d');
  // 画心形：两个圆 + 下方尖角
  cxLife.beginPath();
  cxLife.arc(11, 12, 7, 0, Math.PI * 2);
  cxLife.fillStyle = '#ff2244'; cxLife.fill();
  cxLife.beginPath();
  cxLife.arc(21, 12, 7, 0, Math.PI * 2);
  cxLife.fillStyle = '#ff2244'; cxLife.fill();
  cxLife.beginPath();
  cxLife.moveTo(11, 17);
  cxLife.lineTo(21, 17);
  cxLife.lineTo(16, 28);
  cxLife.closePath();
  cxLife.fillStyle = '#ff2244'; cxLife.fill();
  this.textures.addCanvas('powerup_life', cvLife);

  // 粒子
  g.clear();
  g.fillStyle(0xffffff);
  g.fillCircle(4, 4, 4);
  g.generateTexture('particle', 8, 8);

  // 爆炸（三层同心圆，用单次 fill 避免多次叠加渲染问题）
  g.clear();
  g.fillStyle(0xff8800); g.fillCircle(24, 24, 22);
  g.generateTexture('explosion_outer', 48, 48);
  g.clear();
  g.fillStyle(0xffcc00); g.fillCircle(24, 24, 14);
  g.generateTexture('explosion_mid', 48, 48);
  g.clear();
  g.fillStyle(0xffffff); g.fillCircle(24, 24, 6);
  g.generateTexture('explosion_inner', 48, 48);

  // Boss
  g.clear();
  g.fillStyle(0xcc00ff); g.fillRect(0, 0, 80, 56);
  g.fillStyle(0xffcc00); g.fillRect(10, 8, 20, 16); g.fillRect(50, 8, 20, 16);
  g.fillRect(20, 34, 40, 10);
  g.fillStyle(0xff0000); g.fillCircle(40, 22, 10);
  g.generateTexture('boss', 80, 56);
}

// ==================== 场景创建 ====================
function create() {
  const settings = difficultySettings[difficulty];
  lives = settings.lives;

  // 背景（平铺滚动）
  starsBg = this.add.tileSprite(400, 300, 800, 600, 'stars');

  // 玩家
  player = this.physics.add.sprite(400, 540, 'ship');
  player.setCollideWorldBounds(true);
  player.setDragX(600);

  // 护盾圆圈
  shieldSprite = this.add.circle(400, 540, 38, 0x00ffff, 0.28);
  shieldSprite.setVisible(false);

  // 子弹组（玩家）- 增加 maxSize 并启用越界自动回收
  bullets = this.physics.add.group({
    defaultKey: 'bullet',
    maxSize: 60,
    runChildUpdate: true
  });

  // 敌人子弹组
  enemyBullets = this.physics.add.group({
    defaultKey: 'enemy_bullet',
    maxSize: 80,
    runChildUpdate: true
  });

  // 敌人组
  enemies = this.physics.add.group();

  // 道具组
  powerups = this.physics.add.group({ defaultKey: 'powerup_shield', maxSize: 5 });

  // 粒子系统
  particles = this.add.particles(0, 0, 'particle', {
    speed: { min: 60, max: 180 },
    scale: { start: 1.2, end: 0 },
    blendMode: 'ADD',
    lifespan: 450,
    gravityY: 0,
    emitting: false,
  });

  // 键盘控制
  cursors  = this.input.keyboard.createCursorKeys();
  fireKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

  // ---- UI 文本 ----
  scoreText = this.add.text(16, 16, `Score: 0`, {
    fontSize: '24px', fill: '#fff', fontFamily: 'VT323, monospace'
  }).setDepth(10);

  livesText = this.add.text(16, 48, `Lives: ${lives}`, {
    fontSize: '24px', fill: '#44ff44', fontFamily: 'VT323, monospace'
  }).setDepth(10);

  levelText = this.add.text(16, 80, `Level: ${level}`, {
    fontSize: '24px', fill: '#44ffff', fontFamily: 'VT323, monospace'
  }).setDepth(10);

  highScoreText = this.add.text(784, 16, `Best: ${highScore}`, {
    fontSize: '20px', fill: '#ffff44', fontFamily: 'VT323, monospace'
  }).setOrigin(1, 0).setDepth(10);

  this.add.text(784, 44, myNickname, {
    fontSize: '18px', fill: '#aaaaaa', fontFamily: 'VT323, monospace'
  }).setOrigin(1, 0).setDepth(10);

  comboText = this.add.text(400, 16, '', {
    fontSize: '28px', fill: '#ff0', fontStyle: 'bold',
    fontFamily: 'VT323, monospace'
  }).setOrigin(0.5).setVisible(false).setDepth(10);

  // 操作提示（3秒后淡出）
  const helpText = this.add.text(400, 578, '← → 移动 | SPACE 射击 | ESC 暂停', {
    fontSize: '16px', fill: '#888', fontFamily: 'VT323, monospace'
  }).setOrigin(0.5).setDepth(10);
  this.tweens.add({ targets: helpText, alpha: 0, duration: 3500, delay: 3000 });

  // 暂停覆盖
  this.pauseText = this.add.text(400, 300, 'PAUSED\nESC 继续', {
    fontSize: '52px', fill: '#fff', align: 'center', fontFamily: 'VT323, monospace'
  }).setOrigin(0.5).setVisible(false).setDepth(50);

  // ---- 碰撞 ----
  this.physics.add.overlap(bullets,      enemies,      hitEnemy,          null, this);
  this.physics.add.overlap(player,       enemies,      hitPlayer,         null, this);
  this.physics.add.overlap(player,       powerups,     collectPowerup,    null, this);
  this.physics.add.overlap(player,       enemyBullets, playerHitByBullet, null, this);

  // ---- 定时器 ----
  // 道具生成
  this.time.addEvent({ delay: 8000, callback: spawnPowerup, callbackScope: this, loop: true });

  // 敌人射击
  this.time.addEvent({
    delay: settings.enemyFireDelay,
    callback: enemyShoot,
    callbackScope: this,
    loop: true
  });

  // ---- 生成第一波敌人 ----
  spawnEnemies.call(this);

  // ---- 移动端虚拟控制 ----
  setupTouchControls.call(this);
}

// ==================== 移动端虚拟控制 ====================
function setupTouchControls() {
  if (!this.sys.game.device.input.touch) return; // 只在触屏上显示

  const btnStyle = {
    fontSize: '36px', fill: '#fff', fontFamily: 'VT323, monospace',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: { x: 20, y: 12 }
  };

  // 左移按钮
  const btnLeft = this.add.text(60, 540, '◀', btnStyle)
    .setInteractive().setOrigin(0.5).setDepth(30).setAlpha(0.7);
  btnLeft.on('pointerdown', () => { touchLeft = true; ensureAudio(); });
  btnLeft.on('pointerup',   () => { touchLeft = false; });
  btnLeft.on('pointerout',  () => { touchLeft = false; });

  // 右移按钮
  const btnRight = this.add.text(160, 540, '▶', btnStyle)
    .setInteractive().setOrigin(0.5).setDepth(30).setAlpha(0.7);
  btnRight.on('pointerdown', () => { touchRight = true; ensureAudio(); });
  btnRight.on('pointerup',   () => { touchRight = false; });
  btnRight.on('pointerout',  () => { touchRight = false; });

  // 射击按钮
  const btnFire = this.add.text(740, 540, '🔥', btnStyle)
    .setInteractive().setOrigin(0.5).setDepth(30).setAlpha(0.7);
  btnFire.on('pointerdown', () => { touchFire = true; ensureAudio(); });
  btnFire.on('pointerup',   () => { touchFire = false; });
  btnFire.on('pointerout',  () => { touchFire = false; });
}

// ==================== 主循环 ====================
function update(time, delta) {
  // 背景缓慢滚动
  if (starsBg) starsBg.tilePositionY += 0.4;

  // ESC 暂停/恢复
  if (Phaser.Input.Keyboard.JustDown(pauseKey) && !gameOver && !gameWon) {
    isPaused = !isPaused;
    if (isPaused) {
      this.physics.pause();
    } else {
      this.physics.resume();
    }
    this.pauseText.setVisible(isPaused);
    return;
  }

  if (gameOver || gameWon || isPaused) return;

  // ---- 玩家移动 ----
  const goLeft  = cursors.left.isDown  || touchLeft;
  const goRight = cursors.right.isDown || touchRight;
  if      (goLeft)  player.setVelocityX(-300);
  else if (goRight) player.setVelocityX(300);
  else              player.setVelocityX(0);

  // 护盾跟随
  if (hasShield && shieldSprite) shieldSprite.setPosition(player.x, player.y);

  // ---- 射击 ----
  const currentRate = rapidFire ? 100 : fireRate;
  if ((fireKey.isDown || touchFire) && time > lastFired) {
    fireBullet.call(this);
    lastFired = time + currentRate;
  }

  // ---- 清理越界子弹（直接 destroy，不留残留） ----
  bullets.children.iterate(b => {
    // 玩家子弹：飞出顶部 / 底部 / 左右边界 → 销毁
    if (b && b.active && (b.y < -20 || b.y > 620 || b.x < -20 || b.x > 820)) {
      b.destroy();
    }
  });
  enemyBullets.children.iterate(b => {
    if (b && b.active && (b.y > 620 || b.y < -20 || b.x < -20 || b.x > 820)) {
      b.destroy();
    }
  });
  powerups.children.iterate(p => {
    if (p && p.active && p.y > 640) {
      p.setActive(false).setVisible(false);
    }
  });

  // ---- 连击超时 ----
  if (combo > 0 && Date.now() - lastKillTime > 2200) {
    combo = 0;
    comboText.setVisible(false);
  }

  // ---- 胜利检测 ----
  if (!gameWon && !bossLevel && enemies.countActive(true) === 0) {
    levelComplete.call(this);
  }
  if (!gameWon && bossLevel && (!bossRef || !bossRef.active)) {
    bossLevelComplete.call(this);
  }

  // ---- 敌人突破底线 ----
  enemies.children.iterate(e => {
    if (e && e.active && e.y > 515 && !gameOver) {
      triggerGameOver.call(this);
    }
  });


  // ---- Boss移动（水平往返） ----
  if (bossLevel && bossRef && bossRef.active) {
    if (bossRef.x >= 680 || bossRef.x <= 120) {
      bossRef.setVelocityX(-bossRef.body.velocity.x);
    }
    updateBossHealthBar.call(this);
  }

  // ★ 每帧检查敌人边界（必须在 update 里，不能只依赖 hitEnemy 回调）
  checkEnemyBoundary(this);
}

// ==================== 子弹 ====================
function fireBullet() {
  const b = bullets.get(player.x, player.y - 20);
  if (b) {
    // ★ 重新启用物理体（解决复用时物理体被禁用）+ 标记为活跃（让 Phaser 渲染和更新它）
    b.enableBody();
    b.body.reset(player.x, player.y - 20);
    b.setActive(true).setVisible(true);
    b.setVelocityY(-520);
    totalShots++;
    playSound('shoot');
  }
}

// ==================== 敌人生成 ====================
function spawnEnemies() {
  const settings = difficultySettings[difficulty];

  if (level % 5 === 0) {
    spawnBoss.call(this);
    return;
  }

  bossLevel = false;
  const rows = Math.min(3 + Math.floor((level - 1) / 2), 6);
  const cols = 8;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const e = enemies.create(100 + col * 70, 60 + row * 48, `enemy${row % 3}`);
      e.setImmovable(false);
      // ★ 速度驱动移动（消除定时器移动）
      e.setVelocityX(settings.enemySpeedX * enemyDirection);
    }
  }
}

// ==================== Boss ====================
function spawnBoss() {
  bossLevel = true;
  bossRef = this.physics.add.sprite(400, 100, 'boss');
  bossRef.health    = 20 + level * 2;
  bossRef.maxHealth = bossRef.health;
  bossRef.setImmovable(false);
  bossRef.setCollideWorldBounds(true);
  bossRef.setVelocityX(120);

  bossRef.healthBar = this.add.graphics().setDepth(15);

  // Boss子弹碰撞
  this.physics.add.overlap(bullets, bossRef, hitBoss, null, this);

  const label = this.add.text(400, 30, `⚠ BOSS — HP ${bossRef.health}`, {
    fontSize: '22px', fill: '#ff44ff', fontFamily: 'VT323, monospace',
    backgroundColor: '#000', padding: { x: 8, y: 4 }
  }).setOrigin(0.5).setDepth(15);
  bossRef.hpLabel = label;

  // Boss周期性加速射击
  this.time.addEvent({
    delay: 1400,
    callback: bossShoot,
    callbackScope: this,
    loop: true
  });
}

function updateBossHealthBar() {
  if (!bossRef || !bossRef.healthBar) return;
  const bar  = bossRef.healthBar;
  const pct  = bossRef.health / bossRef.maxHealth;
  bar.clear();
  bar.fillStyle(0x550000);
  bar.fillRect(bossRef.x - 42, bossRef.y - 44, 84, 10);
  bar.fillStyle(pct > 0.5 ? 0x00ff44 : pct > 0.25 ? 0xffaa00 : 0xff2200);
  bar.fillRect(bossRef.x - 42, bossRef.y - 44, 84 * pct, 10);
  if (bossRef.hpLabel) {
    bossRef.hpLabel.setPosition(400, 30);
    bossRef.hpLabel.setText(`⚠ BOSS — HP ${Math.max(0, bossRef.health)}`);
  }
}

function bossShoot() {
  if (!bossRef || !bossRef.active || gameOver || gameWon || isPaused) return;
  playSound('enemyShoot');
  const angles = [-25, 0, 25];
  for (const a of angles) {
    const b = enemyBullets.get(bossRef.x, bossRef.y + 28);
    if (b) {
      b.setActive(true).setVisible(true);
      const rad = Phaser.Math.DegToRad(90 + a);
      b.setVelocity(Math.cos(rad) * 260, Math.sin(rad) * 260);
    }
  }
}

function hitBoss(bullet, boss) {
  // ★ 防重入
  if (!bullet.active) return;
  bullet.disableBody(true, true);

  boss.health--;
  particles.emitParticleAt(boss.x, boss.y, 8);
  playSound('explosion');

  // 受击闪烁
  game.scene.scenes[0].tweens.add({
    targets: boss, alpha: 0.3, duration: 60, yoyo: true, repeat: 2,
    onComplete: () => boss.setAlpha(1)
  });

  addScore(50 * level);

  if (boss.health <= 0) {
    if (boss.healthBar)  boss.healthBar.destroy();
    if (boss.hpLabel)    boss.hpLabel.destroy();
    boss.disableBody(true, true);
    checkAchievement('bossSlayer');
    particles.emitParticleAt(boss.x, boss.y, 50);
    playSound('explosion');
  }
}

// ==================== 敌人自动射击 ====================
function enemyShoot() {
  if (gameOver || gameWon || bossLevel || isPaused) return;
  const active = enemies.getChildren().filter(e => e.active);
  if (active.length === 0) return;

  const shooter = Phaser.Utils.Array.GetRandom(active);
  const b = enemyBullets.get(shooter.x, shooter.y + 16);
  if (b) {
    b.setActive(true).setVisible(true).setVelocityY(220);
    playSound('enemyShoot');
  }
}

// ==================== 敌人移动（速度驱动 + 换向下移） ====================
// 在 update 里检测边界，改用物理速度，避免定时步进造成不均匀
// 额外保留一个 update 内的边界检测：
function checkEnemyBoundary(scene) {
  if (gameOver || gameWon || bossLevel || isPaused) return;
  const settings = difficultySettings[difficulty];

  let needFlip = false;
  enemies.children.iterate(e => {
    if (!e || !e.active) return;
    // ★ 扩大检测范围到 x >= 740 / x <= 60，同时检测实际已越界的情况
    if ((e.x >= 740 && enemyDirection > 0) || (e.x <= 60 && enemyDirection < 0)) {
      needFlip = true;
    }
    // ★ 强制拉回：高速时可能直接飞出屏幕，检测不到边界——强制钳位
    if (e.x > 790) { e.x = 790; needFlip = true; }
    if (e.x < 10)  { e.x = 10;  needFlip = true; }
  });

  if (needFlip) {
    enemyDirection *= -1;
    const speed = settings.enemySpeedX * (1 + (level - 1) * 0.08);
    // 所有敌人下移 + 换向
    enemies.children.iterate(e => {
      if (!e || !e.active) return;
      e.y += 18;
      e.setVelocityX(speed * enemyDirection);
    });
  }
}

// ==================== 碰撞回调 ====================
function hitEnemy(bullet, enemy) {
  // ★ 防重入：子弹或敌人已被处理则跳过（防止同帧穿透多个敌人）
  if (!bullet.active || !enemy.active) return;
  bullet.disableBody(true, true);   // 立即从物理世界移除，不再与任何对象碰撞

  const ex = enemy.x, ey = enemy.y;
  console.log('[hitEnemy] texture:', enemy.texture.key, 'pos:', ex, ey);
  // ★ 爆炸特效：仅用粒子系统，避免 sprite 黑框问题
  particles.emitParticleAt(ex, ey, 20);
  playSound('explosion');
  enemy.destroy();   // 直接销毁 sprite，不留残留

  // 连击
  const now = Date.now();
  if (now - lastKillTime < 2200) combo++;
  else combo = 1;
  lastKillTime = now;
  if (combo > maxCombo) maxCombo = combo;

  // 连击显示
  if (combo >= 2) {
    comboText.setText(`${combo}x COMBO!`);
    comboText.setColor(combo >= 10 ? '#ff4' : combo >= 5 ? '#f80' : '#fa0');
    comboText.setVisible(true);
  }

  const settings = difficultySettings[difficulty];
  const pts = Math.floor(10 * level * (1 + combo * 0.1) * settings.scoreMult);
  addScore(pts);
  totalKills++;

  checkAchievement('firstBlood');
  if (combo >= 5)  checkAchievement('combo5');
  if (combo >= 10) checkAchievement('combo10');
  if (score >= 1000) checkAchievement('score1000');

  if (score >= 5000) checkAchievement('score5000');
}

function hitPlayer(playerObj, enemy) {
  if (invincible) return;   // ★ 无敌帧保护
  if (hasShield) {
    playSound('hit');
    enemy.destroy();   // 直接销毁，不留残留
    flashShield.call(this);
    showFloatingText.call(this, playerObj.x, playerObj.y - 40, 'BLOCKED!', '#0ff');
    return;
  }
  enemy.destroy();
  playerTakeDamage.call(this);
}

function playerHitByBullet(playerObj, bullet) {
  // ★ 防重入：立即禁用物理体
  if (!bullet.active) return;
  bullet.disableBody(true, true);

  if (invincible) return;
  if (hasShield) {
    flashShield.call(this);
    return;
  }
  playerTakeDamage.call(this);
}

// ★ 集中扣血逻辑，附带无敌帧
function playerTakeDamage() {
  playSound('hit');
  lives--;
  livesText.setText(`Lives: ${lives}`);
  particles.emitParticleAt(player.x, player.y, 18);

  // 相机震动
  this.cameras.main.shake(200, 0.015);

  if (lives <= 0) {
    triggerGameOver.call(this);
    return;
  }

  // ★ 启动无敌帧（1.5秒）
  invincible = true;
  if (invincibleTimer) clearTimeout(invincibleTimer);
  invincibleTimer = setTimeout(() => { invincible = false; }, 1500);

  // 闪烁提示
  this.tweens.add({
    targets: player, alpha: 0.2, duration: 100,
    yoyo: true, repeat: 7,
    onComplete: () => player.setAlpha(1)
  });

  // 回中央
  player.setPosition(400, 540);
  showFloatingText.call(this, 400, 300, `💔 -1 生命`, '#f44');
}

function flashShield() {
  this.tweens.add({
    targets: shieldSprite, alpha: 0.05, duration: 80,
    yoyo: true, repeat: 4, onComplete: () => shieldSprite.setAlpha(0.28)
  });
}

// ==================== 道具 ====================
function spawnPowerup() {
  if (gameOver || gameWon || isPaused) return;
  const types = ['powerup_shield', 'powerup_rapid', 'powerup_life'];
  const type  = types[Math.floor(Math.random() * types.length)];
  const x     = Phaser.Math.Between(60, 740);
  const p     = powerups.get(x, -30, type);
  if (p) {
    p.setActive(true).setVisible(true).setVelocityY(85);
    p.powerupType = type;
  }
}

function collectPowerup(playerObj, powerup) {
  // ★ 防重入：Phaser overlap 同一帧可能多次回调，立刻禁用物理体防止重复触发
  if (!powerup.active) return;
  powerup.disableBody(true, true);   // 立即从物理世界移除，彻底阻止后续回调

  ensureAudio();
  playSound('powerup');
  switch (powerup.powerupType) {
    case 'powerup_shield':
      hasShield = true;
      shieldSprite.setVisible(true);
      if (this._shieldTimer) clearTimeout(this._shieldTimer);
      this._shieldTimer = setTimeout(() => { hasShield = false; shieldSprite.setVisible(false); }, 10000);
      showFloatingText.call(this, playerObj.x, playerObj.y - 40, '🛡 护盾激活!', '#0ff');
      break;
    case 'powerup_rapid':
      rapidFire = true;
      if (rapidFireTimer) clearTimeout(rapidFireTimer);
      rapidFireTimer = setTimeout(() => { rapidFire = false; }, 8000);
      showFloatingText.call(this, playerObj.x, playerObj.y - 40, '⚡ 速射模式!', '#f0f');
      break;
    case 'powerup_life':
      lives++;
      livesText.setText(`Lives: ${lives}`);
      showFloatingText.call(this, playerObj.x, playerObj.y - 40, '❤ +1 生命!', '#f44');
      break;
  }
}

// ==================== 分数 ====================
function addScore(pts) {
  score += pts;
  scoreText.setText(`Score: ${score}`);
  if (score > highScore) {
    highScore = score;
    highScoreText.setText(`Best: ${highScore}`);
    localStorage.setItem('highScore', highScore.toString());
  }
}

// ==================== 关卡完成 ====================
function levelComplete() {
  if (gameWon) return;   // ★ 防重入
  gameWon = true;
  this.physics.pause();
  playSound('levelup');

  const txt = this.add.text(400, 280, `LEVEL ${level} COMPLETE!`, {
    fontSize: '52px', fill: '#44ff44', fontStyle: 'bold',
    fontFamily: 'VT323, monospace'
  }).setOrigin(0.5).setDepth(50);

  this.tweens.add({ targets: txt, scale: 1.15, duration: 400, yoyo: true, repeat: 2 });

  const bonus = level * 120;
  addScore(bonus);
  showFloatingText.call(this, 400, 340, `+${bonus} BONUS!`, '#ff0');

  if (level >= 5)  checkAchievement('level5');
  if (level >= 10) checkAchievement('level10');

  if (totalShots >= 50 && totalKills / totalShots >= 0.8) checkAchievement('sharpshooter');

  this.time.delayedCall(2000, () => {
    level++;
    levelText.setText(`Level: ${level}`);
    txt.destroy();
    nextLevel.call(this);
  });
}

function bossLevelComplete() {
  if (gameWon) return;
  gameWon = true;
  this.physics.pause();
  playSound('levelup');

  const txt = this.add.text(400, 280, 'BOSS DEFEATED!', {
    fontSize: '52px', fill: '#ff44ff', fontStyle: 'bold',
    fontFamily: 'VT323, monospace'
  }).setOrigin(0.5).setDepth(50);
  this.tweens.add({ targets: txt, scale: 1.15, duration: 400, yoyo: true, repeat: 2 });

  const bonus = level * 500;
  addScore(bonus);
  showFloatingText.call(this, 400, 340, `+${bonus} BOSS BONUS!`, '#f0f');
  checkAchievement('bossSlayer');

  this.time.delayedCall(2200, () => {
    level++;
    levelText.setText(`Level: ${level}`);
    txt.destroy();
    nextLevel.call(this);
  });
}

function nextLevel() {
  gameWon   = false;
  gameOver  = false;
  bossLevel = false;
  combo     = 0;
  comboText.setVisible(false);
  hasShield  = false;
  rapidFire  = false;
  invincible = false;
  shieldSprite.setVisible(false);
  if (rapidFireTimer) { clearTimeout(rapidFireTimer); rapidFireTimer = null; }
  if (invincibleTimer){ clearTimeout(invincibleTimer); invincibleTimer = null; }

  enemies.clear(true, true);
  enemyBullets.clear(true, true);
  powerups.clear(true, true);
  if (bossRef) { bossRef = null; }

  enemyDirection = 1;
  spawnEnemies.call(this);
  player.setPosition(400, 540);
  player.setAlpha(1);
  this.physics.resume();
}

// ==================== 游戏结束 ====================
function triggerGameOver() {
  if (gameOver) return;
  gameOver = true;
  this.physics.pause();
  player.setTint(0xff2222);
  playSound('explosion');
  this.cameras.main.shake(400, 0.025);

  this.time.delayedCall(300, () => {
    this.add.text(400, 180, 'GAME OVER', {
      fontSize: '72px', fill: '#f22', fontStyle: 'bold', fontFamily: 'VT323, monospace'
    }).setOrigin(0.5).setDepth(60);

    this.add.text(400, 268, `Final Score: ${score}`, {
      fontSize: '32px', fill: '#fff', fontFamily: 'VT323, monospace'
    }).setOrigin(0.5).setDepth(60);

    this.add.text(400, 308, `Best Score: ${highScore}`, {
      fontSize: '26px', fill: '#ff0', fontFamily: 'VT323, monospace'
    }).setOrigin(0.5).setDepth(60);

    this.add.text(400, 346, `Level Reached: ${level}`, {
      fontSize: '22px', fill: '#0ff', fontFamily: 'VT323, monospace'
    }).setOrigin(0.5).setDepth(60);

    const acc = totalShots > 0 ? ((totalKills / totalShots) * 100).toFixed(1) : '0.0';
    this.add.text(400, 378, `Accuracy: ${acc}%  |  Max Combo: ${maxCombo}x`, {
      fontSize: '20px', fill: '#aaa', fontFamily: 'VT323, monospace'
    }).setOrigin(0.5).setDepth(60);

    const restartTxt = this.add.text(400, 440, '[ R ] Restart  |  [ M ] Menu', {
      fontSize: '26px', fill: '#0ff', fontFamily: 'VT323, monospace'
    }).setOrigin(0.5).setDepth(60);

    this.tweens.add({ targets: restartTxt, alpha: 0.25, duration: 900, yoyo: true, repeat: -1 });

    if (score > 0 && score >= highScore) {
      const nh = this.add.text(400, 490, '🏆 NEW HIGH SCORE! 🏆', {
        fontSize: '28px', fill: '#ff0', fontStyle: 'bold', fontFamily: 'VT323, monospace'
      }).setOrigin(0.5).setDepth(60);
      this.tweens.add({ targets: nh, scale: 1.1, duration: 450, yoyo: true, repeat: -1 });
    }

    const restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    restartKey.on('down', () => location.reload());

    const menuKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    menuKey.on('down', () => { window.location.href = '/'; });
  });
}

// ==================== 辅助：浮动文字 ====================
function showFloatingText(x, y, text, color) {
  const scene = game.scene.scenes[0];
  const ft = scene.add.text(x, y, text, {
    fontSize: '24px', fill: color,
    fontFamily: 'VT323, monospace', fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(30);

  scene.tweens.add({
    targets: ft, y: y - 55, alpha: 0, duration: 1100,
    onComplete: () => ft.destroy()
  });
}

// ==================== Phaser 配置 ====================
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#000033',
  // ★ 响应式适配
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: { preload, create, update },
};

// ==================== 启动 ====================
window.addEventListener('load', () => {
  // 首次用户交互后激活 AudioContext（解决自动播放限制）
  document.addEventListener('click',     ensureAudio, { once: true });
  document.addEventListener('keydown',   ensureAudio, { once: true });
  document.addEventListener('touchstart',ensureAudio, { once: true });

  game = new Phaser.Game(config);
});
