// 单机版太空侵略者游戏 - 移除 Ably 依赖
let game;
let myNickname = localStorage.getItem("nickname") || "Player";
let amIHost = true; // 单机模式始终是主机

// Phaser 游戏配置
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
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

function preload() {
  this.load.spritesheet(
    "ship",
    "https://cdn.glitch.com/f66772e3-bbf6-4f6d-b5d5-94559e3c1c6f%2FShip%402x.png?v=1589228730678",
    { frameWidth: 60, frameHeight: 32 }
  );
  this.load.spritesheet(
    "bullet",
    "https://cdn.glitch.com/f66772e3-bbf6-4f6d-b5d5-94559e3c1c6f%2Fbullet.png?v=1589229887570",
    { frameWidth: 48, frameHeight: 48 }
  );
  this.load.spritesheet(
    "explosion",
    "https://cdn.glitch.com/f66772e3-bbf6-4f6d-b5d5-94559e3c1c6f%2Fexplosion57%20(2).png?v=1589491279459",
    { frameWidth: 48, frameHeight: 48 }
  );
  
  // 加载敌人精灵
  for (let i = 1; i <= 3; i++) {
    this.load.spritesheet(
      `avatar${String.fromCharCode(64 + i)}animated`,
      `https://cdn.glitch.com/c0cf9403-8071-4ec0-afd7-8a5293120d79%2Favatar${String.fromCharCode(65 + i - 1)}animated.png?v=1592436${546 + i * 30}438`,
      { frameWidth: 48, frameHeight: 32 }
    );
  }
}

let player;
let bullets;
let enemies;
let cursors;
let fireKey;
let score = 0;
let scoreText;
let gameOver = false;

function create() {
  // 创建玩家飞船
  player = this.physics.add.sprite(400, 550, "ship");
  player.setCollideWorldBounds(true);
  
  // 创建子弹组
  bullets = this.physics.add.group({
    defaultKey: "bullet",
    maxSize: 10,
  });
  
  // 创建敌人群
  enemies = this.physics.add.group();
  
  // 生成敌人
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      const enemyType = (row % 3) + 1;
      const enemy = enemies.create(
        150 + col * 70,
        50 + row * 60,
        `avatar${String.fromCharCode(65 + row)}animated`
      );
      enemy.setBounce(1);
      enemy.setCollideWorldBounds(true);
    }
  }
  
  // 设置控制
  cursors = this.input.keyboard.createCursorKeys();
  fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  
  // 添加分数文本
  scoreText = this.add.text(16, 16, "Score: 0", {
    fontSize: "32px",
    fill: "#fff",
  });
  
  // 添加玩家名称
  this.add.text(16, 50, `Player: ${myNickname}`, {
    fontSize: "20px",
    fill: "#0ff",
  });
  
  // 添加说明
  this.add.text(400, 580, "Use Arrow Keys to Move, SPACE to Shoot", {
    fontSize: "16px",
    fill: "#fff",
  }).setOrigin(0.5);
  
  // 设置碰撞
  this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);
  this.physics.add.collider(player, enemies, hitPlayer, null, this);
  
  // 动画
  this.anims.create({
    key: "explode",
    frames: this.anims.generateFrameNumbers("explosion", { start: 0, end: 15 }),
    frameRate: 20,
    hideOnComplete: true,
  });
}

function update() {
  if (gameOver) return;
  
  // 玩家移动
  if (cursors.left.isDown) {
    player.setVelocityX(-300);
  } else if (cursors.right.isDown) {
    player.setVelocityX(300);
  } else {
    player.setVelocityX(0);
  }
  
  // 射击
  if (Phaser.Input.Keyboard.JustDown(fireKey)) {
    fireBullet.call(this);
  }
  
  // 敌人移动
  enemies.children.iterate((enemy) => {
    if (enemy) {
      enemy.x += 2;
      if (enemy.x > 750 || enemy.x < 50) {
        enemy.y += 20;
        enemy.x = enemy.x > 750 ? 50 : 750;
      }
    }
  });
  
  // 检查胜利条件
  if (enemies.countActive(true) === 0) {
    gameOver = true;
    this.add.text(400, 300, "YOU WIN!", {
      fontSize: "64px",
      fill: "#0f0",
      fontStyle: "bold",
    }).setOrigin(0.5);
    
    setTimeout(() => {
      window.location.href = "/winner";
    }, 2000);
  }
}

function fireBullet() {
  const bullet = bullets.get(player.x, player.y - 20);
  
  if (bullet) {
    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setVelocityY(-400);
    
    // 2秒后自动销毁子弹
    this.time.delayedCall(2000, () => {
      bullet.setActive(false);
      bullet.setVisible(false);
    });
  }
}

function hitEnemy(bullet, enemy) {
  bullet.setActive(false);
  bullet.setVisible(false);
  
  // 创建爆炸效果
  const explosion = this.add.sprite(enemy.x, enemy.y, "explosion");
  explosion.setOrigin(0.5);
  explosion.on('animationcomplete', () => {
    explosion.destroy();
  });
  explosion.play("explode");
  
  enemy.disableBody(true, true);
  
  score += 10;
  scoreText.setText("Score: " + score);
}

function hitPlayer(player, enemy) {
  this.physics.pause();
  player.setTint(0xff0000);
  gameOver = true;
  
  this.add.text(400, 300, "GAME OVER", {
    fontSize: "64px",
    fill: "#f00",
    fontStyle: "bold",
  }).setOrigin(0.5);
  
  setTimeout(() => {
    window.location.href = "/gameover";
  }, 2000);
}

// 启动游戏
window.addEventListener("load", () => {
  game = new Phaser.Game(config);
});
