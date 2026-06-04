import Phaser from "phaser";

/**
 * 简单的 AI 机器人
 * 用于离线/单机模式
 */
export default class Bot {
  constructor(scene, x, y, name, skin = 'playerPlayer') {
    this.scene = scene;
    this.name = name;
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 2 + Math.random() * 2; // 随机速度
    this.direction = Math.random() * Math.PI * 2;
    this.changeDirTimer = 0;
    this.coins = 0;
    this.level = 1;
    
    // 创建精灵 - 使用小尺寸占位符
    const colors = [0xFF5722, 0xE91E63, 0x9C27B0, 0x673AB7, 0x3F51B5];
    const colorIndex = Math.floor(Math.random() * colors.length);
    this.originalColor = colors[colorIndex];
    this.sprite = scene.add.circle(x, y, 25, this.originalColor);
    this.sprite.setDepth(50);
    
    // 添加名称标签
    this.nameText = scene.add.text(x, y - 40, name, {
      fontSize: '16px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // 添加血条背景
    this.healthBarBg = scene.add.rectangle(x, y + 30, 40, 6, 0x000000);
    this.healthBarBg.setDepth(51);
    
    // 添加血条
    this.healthBar = scene.add.rectangle(x, y + 30, 38, 4, 0x00ff00);
    this.healthBar.setDepth(52);
    
    // 边界
    this.bounds = {
      left: 0,
      right: 8000,
      top: 0,
      bottom: 8000
    };
  }
  
  update(time, delta, player) {
    // 更新计时器
    this.changeDirTimer -= delta;
    
    // 简单 AI：朝玩家移动或随机移动
    if (player && this.distanceTo(player) < 500) {
      // 追击玩家
      const angle = Math.atan2(player.y - this.sprite.y, player.x - this.sprite.x);
      this.direction = angle;
    } else if (this.changeDirTimer <= 0) {
      // 随机改变方向
      this.direction += (Math.random() - 0.5) * 2;
      this.changeDirTimer = 1000 + Math.random() * 2000; // 1-3秒后再次改变
    }
    
    // 移动
    const newX = this.sprite.x + Math.cos(this.direction) * this.speed;
    const newY = this.sprite.y + Math.sin(this.direction) * this.speed;
    
    // 边界检测
    if (newX >= this.bounds.left && newX <= this.bounds.right) {
      this.sprite.x = newX;
    } else {
      this.direction = Math.PI - this.direction; // 反弹
    }
    
    if (newY >= this.bounds.top && newY <= this.bounds.bottom) {
      this.sprite.y = newY;
    } else {
      this.direction = -this.direction; // 反弹
    }
    
    // 更新名称和血条位置
    this.nameText.setPosition(this.sprite.x, this.sprite.y - 40);
    this.healthBarBg.setPosition(this.sprite.x, this.sprite.y + 30);
    this.healthBar.setPosition(this.sprite.x, this.sprite.y + 30);
    
    // 更新血条宽度
    const healthPercent = this.health / this.maxHealth;
    this.healthBar.width = 38 * healthPercent;
    
    // 血条颜色变化
    if (healthPercent > 0.6) {
      this.healthBar.setFillStyle(0x00ff00); // 绿色
    } else if (healthPercent > 0.3) {
      this.healthBar.setFillStyle(0xffff00); // 黄色
    } else {
      this.healthBar.setFillStyle(0xff0000); // 红色
    }
  }
  
  distanceTo(target) {
    const dx = target.x - this.sprite.x;
    const dy = target.y - this.sprite.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
    
    // 受伤闪烁效果
    this.sprite.fillColor = 0xff0000;
    this.scene.time.delayedCall(100, () => {
      this.sprite.fillColor = this.originalColor;
    });
    
    return this.health <= 0;
  }
  
  heal(amount) {
    this.health += amount;
    if (this.health > this.maxHealth) this.health = this.maxHealth;
  }
  
  destroy() {
    this.sprite.destroy();
    this.nameText.destroy();
    this.healthBar.destroy();
    this.healthBarBg.destroy();
  }
}
