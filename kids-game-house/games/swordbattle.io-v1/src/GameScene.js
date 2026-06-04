import Phaser from "phaser";
import Bot from "./Bot.js";

// 动态加载配置文件
let configData = {};
let bushesData = { locations: [] }; // 默认值

async function loadConfig() {
  try {
    const configResponse = await fetch('/config.json');
    configData = await configResponse.json();
  } catch (e) {
    console.error('Failed to load config.json:', e);
    configData = { offlineMode: true, botCount: 5 };
  }
}

async function loadBushes() {
  try {
    const bushesResponse = await fetch('/src/bushes.json');
    bushesData = await bushesResponse.json();
  } catch (e) {
    console.error('Failed to load bushes.json:', e);
    bushesData = { locations: [] };
  }
}

class GameScene extends Phaser.Scene {
	constructor(callback) {
		super();
		this.callback = callback;
	}

	preload() {
		// 确保配置已加载
		loadConfig();
		loadBushes();
		
		window.onbeforeunload = confirmExit;
		function confirmExit(e) {
			e.preventDefault();
			return "You are in game.. Do you really want to leave?";
		}
		
		this.ready = false;
		this.loadrect = this.add.image(0, 0, "opening").setOrigin(0).setScrollFactor(0, 0).setScale(2).setDepth(200);

		const cameraWidth = this.cameras.main.width;
		const cameraHeight = this.cameras.main.height;

		this.loadrect.setScale(Math.max(cameraWidth / this.loadrect.width, cameraHeight / this.loadrect.height));
		this.loadtext= this.add.text(this.canvas.width/2, this.canvas.height/2, "Loading...", {fontFamily: "Arial", fontSize: "32px", color: "#ffffff"}).setOrigin(0.5).setScrollFactor(0, 0).setDepth(200);
		this.ping = 0;
	}

	create() {
		// 始终使用离线模式
		this.setupOfflineMode();
	}

	update(time, delta) {
		// 只更新离线模式
		this.updateOfflineMode(time, delta);
	}

	// ========== 离线模式方法 ==========

	/**
	 * 设置离线模式
	 */
	setupOfflineMode() {
		console.log('🎮 Starting Offline Mode');
		
		// 1. 创建本地玩家
		this.localPlayer = {
			x: 4000,
			y: 4000,
			health: 100,
			maxHealth: 100,
			coins: 0,
			level: 1,
			speed: 5,
			angle: 0
		};
		
		// 创建玩家精灵 - 使用小尺寸占位符
		this.playerSprite = this.add.circle(4000, 4000, 30, 0x4CAF50);
		this.playerSprite.setDepth(100);
		
		// 添加剑
		this.playerSword = this.add.circle(4000, 4000, 20, 0xFFC107);
		this.playerSword.setDepth(99);
		
		// 2. 创建 AI 机器人
		this.bots = [];
		const botNames = ['Bot Alpha', 'Bot Beta', 'Bot Gamma', 'Bot Delta', 'Bot Epsilon'];
		
		for (let i = 0; i < (configData.botCount || 5); i++) {
			const x = Math.random() * 8000;
			const y = Math.random() * 8000;
			const bot = new Bot(this, x, y, botNames[i] || `Bot ${i+1}`);
			this.bots.push(bot);
		}
		
		// 3. 添加离线模式提示
		const titleText = this.add.text(4000, 3800, 'OFFLINE MODE', {
			fontSize: '72px',
			fill: '#ffffff',
			stroke: '#000000',
			strokeThickness: 8,
			fontStyle: 'bold'
		}).setOrigin(0.5).setDepth(200);
		
		const subtitleText = this.add.text(4000, 3900, 'WASD/Arrows to Move | Click to Attack', {
			fontSize: '32px',
			fill: '#ffff00',
			stroke: '#000000',
			strokeThickness: 4
		}).setOrigin(0.5).setDepth(200);
		
		// 淡出提示
		this.tweens.add({
			targets: [titleText, subtitleText],
			alpha: 0,
			duration: 3000,
			delay: 2000,
			onComplete: () => {
				titleText.destroy();
				subtitleText.destroy();
			}
		});
		
		// 4. 添加 UI 元素
		this.scoreText = this.add.text(20, 20, 'Coins: 0', {
			fontSize: '28px',
			fill: '#ffd700',
			stroke: '#000000',
			strokeThickness: 4,
			fontStyle: 'bold'
		}).setScrollFactor(0).setDepth(300);
		
		this.healthText = this.add.text(20, 60, 'Health: 100', {
			fontSize: '28px',
			fill: '#00ff00',
			stroke: '#000000',
			strokeThickness: 4,
			fontStyle: 'bold'
		}).setScrollFactor(0).setDepth(300);
		
		this.levelText = this.add.text(20, 100, 'Level: 1', {
			fontSize: '28px',
			fill: '#00ffff',
			stroke: '#000000',
			strokeThickness: 4,
			fontStyle: 'bold'
		}).setScrollFactor(0).setDepth(300);
		
		this.killText = this.add.text(20, 140, 'Kills: 0', {
			fontSize: '28px',
			fill: '#ff6666',
			stroke: '#000000',
			strokeThickness: 4,
			fontStyle: 'bold'
		}).setScrollFactor(0).setDepth(300);
		
		// 5. 设置输入
		this.cursors = this.input.keyboard.createCursorKeys();
		this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
		this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
		this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
		this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
		
		// 鼠标点击攻击
		this.input.on('pointerdown', () => {
			this.performAttack();
		});
		
		// 6. 设置相机
		this.cameras.main.startFollow(this.playerSprite);
		this.cameras.main.setBounds(0, 0, 15000, 15000);
		this.cameras.main.setZoom(1);
		
		// 7. 添加背景
		this.background = this.add.tileSprite(0, 0, 15000, 15000, 'background');
		this.background.setOrigin(0, 0);
		this.background.setDepth(-1);
		
		// 8. 统计数据
		this.kills = 0;
		this.totalCoins = 0;
		
		// 隐藏加载界面
		this.loadrect.destroy();
		this.loadtext.destroy();
		
		console.log('✅ Offline mode ready!');
	}

	/**
	 * 更新离线模式
	 */
	updateOfflineMode(time, delta) {
		if (!this.localPlayer) return;
		
		// 1. 处理玩家输入
		const speed = this.localPlayer.speed;
		let moved = false;
		
		if (this.cursors.left.isDown || this.aKey.isDown) {
			this.localPlayer.x -= speed;
			moved = true;
		}
		if (this.cursors.right.isDown || this.dKey.isDown) {
			this.localPlayer.x += speed;
			moved = true;
		}
		if (this.cursors.up.isDown || this.wKey.isDown) {
			this.localPlayer.y -= speed;
			moved = true;
		}
		if (this.cursors.down.isDown || this.sKey.isDown) {
			this.localPlayer.y += speed;
			moved = true;
		}
		
		// 边界限制
		this.localPlayer.x = Phaser.Math.Clamp(this.localPlayer.x, 0, 15000);
		this.localPlayer.y = Phaser.Math.Clamp(this.localPlayer.y, 0, 15000);
		
		// 更新玩家精灵位置
		this.playerSprite.setPosition(this.localPlayer.x, this.localPlayer.y);
		this.playerSword.setPosition(this.localPlayer.x, this.localPlayer.y);
		
		// 剑跟随鼠标方向
		if (this.input.activePointer) {
			const worldPointer = this.cameras.main.getWorldPoint(
				this.input.activePointer.x,
				this.input.activePointer.y
			);
			this.localPlayer.angle = Math.atan2(
				worldPointer.y - this.localPlayer.y,
				worldPointer.x - this.localPlayer.x
			);
			this.playerSword.setRotation(this.localPlayer.angle);
		}
		
		// 2. 更新所有 bots
		this.bots.forEach(bot => {
			bot.update(time, delta, this.localPlayer);
		});
		
		// 3. 碰撞检测 - 玩家 vs bots
		this.bots.forEach((bot, index) => {
			const distance = this.getDistance(this.localPlayer, {
				x: bot.sprite.x,
				y: bot.sprite.y
			});
			
			if (distance < 60) {
				// 简单的碰撞推开
				const angle = Math.atan2(
					bot.sprite.y - this.localPlayer.y,
					bot.sprite.x - this.localPlayer.x
				);
				
				bot.sprite.x += Math.cos(angle) * 3;
				bot.sprite.y += Math.sin(angle) * 3;
			}
		});
		
		// 4. 更新背景
		this.background.tilePositionX = this.localPlayer.x;
		this.background.tilePositionY = this.localPlayer.y;
		
		// 5. 更新 UI
		this.scoreText.setText(`Coins: ${this.localPlayer.coins}`);
		this.healthText.setText(`Health: ${this.localPlayer.health}`);
		this.levelText.setText(`Level: ${this.localPlayer.level}`);
		this.killText.setText(`Kills: ${this.kills}`);
		
		// 血条颜色
		const healthPercent = this.localPlayer.health / this.localPlayer.maxHealth;
		if (healthPercent > 0.6) {
			this.healthText.setColor('#00ff00');
		} else if (healthPercent > 0.3) {
			this.healthText.setColor('#ffff00');
		} else {
			this.healthText.setColor('#ff0000');
		}
	}

	/**
	 * 执行攻击
	 */
	performAttack() {
		if (!this.localPlayer) return;
		
		// 剑挥动动画
		this.tweens.add({
			targets: this.playerSword,
			scaleX: 2,
			scaleY: 2,
			duration: 100,
			yoyo: true,
			ease: 'Power2'
		});
		
		// 检测攻击范围内的 bots
		const attackRange = 150;
		this.bots.forEach((bot, index) => {
			const dist = this.getDistance(this.localPlayer, {
				x: bot.sprite.x,
				y: bot.sprite.y
			});
			
			if (dist < attackRange) {
				// 检查是否在剑的方向上
				const angleToBot = Math.atan2(
					bot.sprite.y - this.localPlayer.y,
					bot.sprite.x - this.localPlayer.x
				);
				const angleDiff = Math.abs(angleToBot - this.localPlayer.angle);
				
				if (angleDiff < 1 || angleDiff > 5.5) { // 约60度范围
					const killed = bot.takeDamage(25 + this.localPlayer.level * 5);
					
					if (killed) {
						// Bot 死亡
						this.createExplosion(bot.sprite.x, bot.sprite.y);
						bot.destroy();
						this.bots.splice(index, 1);
						
						// 奖励
						this.localPlayer.coins += 50;
						this.totalCoins += 50;
						this.kills++;
						
						// 升级检查
						this.checkLevelUp();
						
						// 生成新 bot
						setTimeout(() => {
							if (this.bots.length < (configData.botCount || 5)) {
								const x = Math.random() * 8000;
								const y = Math.random() * 8000;
								const newBot = new Bot(this, x, y, `Bot ${Date.now()}`);
								this.bots.push(newBot);
							}
						}, 3000);
					}
				}
			}
		});
	}

	/**
	 * 检查升级
	 */
	checkLevelUp() {
		const expNeeded = this.localPlayer.level * 100;
		if (this.totalCoins >= expNeeded) {
			this.localPlayer.level++;
			this.localPlayer.maxHealth += 20;
			this.localPlayer.health = this.localPlayer.maxHealth;
			this.localPlayer.speed += 0.5;
			
			// 升级特效
			this.showLevelUpEffect();
		}
	}

	/**
	 * 显示升级特效
	 */
	showLevelUpEffect() {
		const text = this.add.text(
			this.localPlayer.x,
			this.localPlayer.y - 100,
			'LEVEL UP!',
			{
				fontSize: '48px',
				fill: '#ffff00',
				stroke: '#000000',
				strokeThickness: 6,
				fontStyle: 'bold'
			}
		).setOrigin(0.5).setDepth(400);
		
		this.tweens.add({
			targets: text,
			y: text.y - 100,
			alpha: 0,
			duration: 1500,
			ease: 'Power2',
			onComplete: () => text.destroy()
		});
	}

	/**
	 * 创建爆炸特效
	 */
	createExplosion(x, y) {
		// 简单的文本爆炸效果
		const text = this.add.text(x, y, '💥', {
			fontSize: '64px'
		}).setOrigin(0.5).setDepth(400);
		
		this.tweens.add({
			targets: text,
			scale: 2,
			alpha: 0,
			duration: 500,
			ease: 'Power2',
			onComplete: () => text.destroy()
		});
	}

	/**
	 * 计算距离
	 */
	getDistance(obj1, obj2) {
		const dx = obj1.x - obj2.x;
		const dy = obj1.y - obj2.y;
		return Math.sqrt(dx * dx + dy * dy);
	}
}

export default GameScene;
