# PVZ 游戏完善路线图

## 📋 当前功能状态

### ✅ 已实现
- [x] 基础游戏框架（Phaser 3）
- [x] Vite 构建系统
- [x] 响应式屏幕适配
- [x] 豌豆射手放置
- [x] 豌豆子弹发射和移动
- [x] 普通僵尸生成和移动
- [x] 碰撞检测（子弹 vs 僵尸）
- [x] 僵尸受击和死亡
- [x] 游戏结束判定
- [x] 基础音效

### ❌ 缺失核心功能
- [ ] 阳光系统（收集、计数、消耗）
- [ ] 植物选择卡片栏
- [ ] 多种植物类型
- [ ] 铲子工具
- [ ] 关卡进度系统
- [ ] 胜利条件
- [ ] 暂停/菜单系统
- [ ] 更丰富的动画

---

## 🎯 Phase 1: 核心游戏循环完善（P0）

### 1.1 阳光系统 ⭐⭐⭐⭐⭐
**优先级**: 最高  
**预计工作量**: 2-3 小时

#### 功能需求
- [ ] 天空掉落阳光（每 10-15 秒）
- [ ] 向日葵生产阳光（每 20-25 秒）
- [ ] 点击阳光收集
- [ ] 阳光计数器显示
- [ ] 阳光飞向 UI 的动画

#### 技术实现
```javascript
// Sun.js - 阳光类
class Sun extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type = 'sky') {
    super(scene, x, y, 'sprites', 'sun1.png')
    this.type = type // 'sky' 或 'flower'
    this.value = 25
    
    // 从天而降或从花中产生
    if (type === 'sky') {
      this.fallFromSky()
    }
    
    // 点击收集
    this.setInteractive({ useHandCursor: true })
    this.on('pointerdown', () => this.collect())
  }
  
  collect() {
    // 播放收集动画
    this.scene.tweens.add({
      targets: this,
      x: 50,  // UI 位置
      y: 30,
      duration: 500,
      onComplete: () => {
        this.scene.addSun(this.value)
        this.destroy()
      }
    })
  }
}

// PlayScene.js - 添加阳光管理
addSun(amount) {
  this.sunCount += amount
  this.updateSunDisplay()
}

spawnSkySun() {
  const x = Phaser.Math.Between(50, 440)
  new Sun(this, x, -50, 'sky')
}
```

#### 所需素材
- `sun_fall_01.png` ~ `sun_fall_08.png` - 下落动画
- `sun_idle_01.png` ~ `sun_idle_06.png` - 地面闪烁
- `sun_collect.mp3` - 收集音效

---

### 1.2 植物选择卡片栏 ⭐⭐⭐⭐⭐
**优先级**: 最高  
**预计工作量**: 3-4 小时

#### 功能需求
- [ ] 顶部卡片栏 UI
- [ ] 显示植物成本和冷却
- [ ] 点击选择植物
- [ ] 拖拽或点击放置
- [ ] 阳光不足时禁用
- [ ] 使用后进入冷却

#### 技术实现
```javascript
// SeedCard.js - 植物卡片
class SeedCard extends Phaser.GameObjects.Container {
  constructor(scene, x, y, plantType, cost) {
    super(scene, x, y)
    
    this.plantType = plantType
    this.cost = cost
    this.onCooldown = false
    this.cooldownTime = 5000 // 5秒
    
    // 卡片背景
    this.bg = scene.add.rectangle(0, 0, 50, 70, 0x8B4513)
    this.add(this.bg)
    
    // 植物图标
    this.icon = scene.add.image(0, -10, 'sprites', `${plantType}.png`)
    this.add(this.icon)
    
    // 成本显示
    this.costText = scene.add.text(0, 20, cost.toString(), {
      fontSize: '16px',
      fill: '#FFD700'
    }).setOrigin(0.5)
    this.add(this.costText)
    
    // 冷却遮罩
    this.cooldownMask = scene.add.rectangle(0, 0, 50, 70, 0x000000, 0.5)
    this.cooldownMask.setVisible(false)
    this.add(this.cooldownMask)
    
    this.setInteractive({ useHandCursor: true })
    this.on('pointerdown', () => this.select())
  }
  
  select() {
    if (this.scene.sunCount >= this.cost && !this.onCooldown) {
      this.scene.selectedPlant = this.plantType
      this.scene.startPlantPlacement(this.plantType)
    }
  }
  
  startCooldown() {
    this.onCooldown = true
    this.cooldownMask.setVisible(true)
    
    this.scene.time.delayedCall(this.cooldownTime, () => {
      this.onCooldown = false
      this.cooldownMask.setVisible(false)
    })
  }
}

// PlayScene.js - 创建卡片栏
createSeedBar() {
  this.seedCards = []
  const plants = [
    { type: 'sunflower', cost: 50 },
    { type: 'peashooter', cost: 100 },
    { type: 'wallnut', cost: 50 }
  ]
  
  plants.forEach((plant, index) => {
    const card = new SeedCard(this, 80 + index * 60, 35, plant.type, plant.cost)
    this.add.existing(card)
    this.seedCards.push(card)
  })
}
```

#### 所需素材
- `card_bg.png` - 卡片背景（可程序生成）
- `card_peashooter.png` - 豌豆射手卡片图标
- `card_sunflower.png` - 向日葵卡片图标
- `card_wallnut.png` - 坚果墙卡片图标
- `sun_icon.png` - 阳光图标（30x30px）
- `card_select.mp3` - 选择卡片音效

---

### 1.3 铲子工具 ⭐⭐⭐⭐
**优先级**: 高  
**预计工作量**: 1-2 小时

#### 功能需求
- [ ] 铲子按钮 UI
- [ ] 点击激活铲子模式
- [ ] 点击植物铲除
- [ ] 铲除动画和音效

#### 技术实现
```javascript
// Shovel tool
createShovelButton() {
  this.shovelBtn = this.add.image(450, 35, 'sprites', 'shovel.png')
    .setInteractive({ useHandCursor: true })
  
  this.shovelBtn.on('pointerdown', () => {
    this.shovelMode = !this.shovelMode
    this.shovelBtn.setTint(this.shovelMode ? 0xFFFF00 : 0xFFFFFF)
  })
}

handleTap(pointer) {
  if (this.shovelMode) {
    // 检查是否点击了植物
    const plant = this.getPlantAt(pointer.x, pointer.y)
    if (plant) {
      this.removePlant(plant)
      this.shovelMode = false
      this.shovelBtn.clearTint()
    }
  } else {
    // 正常放置植物逻辑
    this.placePlant(pointer)
  }
}

removePlant(plant) {
  // 播放铲除动画
  this.sounds.plantRemove.play()
  
  this.tweens.add({
    targets: plant,
    alpha: 0,
    scale: 0.5,
    duration: 300,
    onComplete: () => plant.destroy()
  })
}
```

#### 所需素材
- `shovel_idle_01.png` ~ `shovel_idle_03.png` - 铲子待机
- `shovel_dig_01.png` ~ `shovel_dig_04.png` - 铲除动画
- `plant_remove.mp3` - 铲除音效

---

### 1.4 关卡进度系统 ⭐⭐⭐⭐
**优先级**: 高  
**预计工作量**: 2 小时

#### 功能需求
- [ ] 顶部进度条显示
- [ ] 旗帜表示波次
- [ ] 最后一波提示
- [ ] 胜利判定

#### 技术实现
```javascript
// Level progress
initLevelProgress() {
  this.totalWaves = 5
  this.currentWave = 0
  this.zombiesPerWave = 10
  
  // 进度条背景
  this.progressBarBg = this.add.rectangle(245, 15, 200, 15, 0x333333)
  
  // 进度条填充
  this.progressBarFill = this.add.rectangle(145, 15, 0, 13, 0x00FF00)
    .setOrigin(0, 0.5)
  
  // 旗帜图标
  this.flags = []
  for (let i = 0; i < this.totalWaves; i++) {
    const flag = this.add.image(150 + i * 40, 15, 'sprites', 'flag.png')
      .setScale(0.5)
    this.flags.push(flag)
  }
}

startNextWave() {
  this.currentWave++
  this.updateProgressBar()
  
  if (this.currentWave === this.totalWaves) {
    this.showFinalWaveWarning()
  }
  
  // 生成一波僵尸
  this.spawnWave()
}

updateProgressBar() {
  const progress = this.currentWave / this.totalWaves
  this.progressBarFill.width = 200 * progress
}

checkVictory() {
  if (this.currentWave >= this.totalWaves && this.zombies.countActive(true) === 0) {
    this.levelComplete()
  }
}
```

#### 所需素材
- `progress_bar_bg.png` - 进度条背景（200x20px）
- `progress_bar_fill.png` - 进度条填充（可程序生成）
- `flag.png` - 旗帜图标（30x25px，可选飘扬动画 4-6 帧）
- `wave_start.mp3` - 新一波开始音效
- `level_complete.mp3` - 关卡完成音效

---

### 1.5 向日葵完整实现 ⭐⭐⭐⭐
**优先级**: 高  
**预计工作量**: 2 小时

#### 功能需求
- [ ] 向日葵动画
- [ ] 定期生产阳光
- [ ] 阳光从花中冒出

#### 技术实现
```javascript
// Sunflower.js
export default class Sunflower extends Plant {
  constructor(scene, x, y) {
    super(scene, x, y, 'sunflower')
    
    this.gameData = {
      row: scene.rowForY(y),
      col: scene.colForX(x),
      health: 5,
      lastSunProduced: 0,
      sunProductionRate: 20000 // 20秒
    }
    
    // 注册更新
    scene.events.on('update', this.update, this)
  }
  
  update(time, delta) {
    if (time - this.gameData.lastSunProduced > this.gameData.sunProductionRate) {
      this.produceSun()
      this.gameData.lastSunProduced = time
    }
  }
  
  produceSun() {
    // 播放生产动画
    this.play('sunflower-produce')
    
    // 延迟生成阳光
    this.scene.time.delayedCall(1000, () => {
      const sun = new Sun(this.scene, this.x, this.y - 20, 'flower')
      this.scene.add.existing(sun)
    })
  }
}
```

#### 所需素材
- `sunflower_idle_01.png` ~ `sunflower_idle_12.png` - 待机动画
- `sunflower_produce_01.png` ~ `sunflower_produce_08.png` - 生产阳光动画

---

## 🚀 Phase 2: 内容扩展（P1）

### 2.1 坚果墙 (Wall-nut)
**预计工作量**: 1 小时
- 高生命值植物
- 受伤阶段动画
- 阻挡僵尸前进

### 2.2 路障/铁桶僵尸
**预计工作量**: 2 小时
- 额外护甲值
- 护甲被破坏动画
- 更高的挑战性

### 2.3 暂停菜单
**预计工作量**: 1-2 小时
- ESC 键暂停
- 继续/重新开始/退出选项
- 半透明遮罩

### 2.4 改进动画系统
**预计工作量**: 2-3 小时
- 所有角色流畅动画
- 过渡效果
- 粒子特效基础

---

## 🌟 Phase 3: 体验优化（P2）

### 3.1 更多植物（5-8种）
- 寒冰射手
- 双发射手
- 樱桃炸弹
- 土豆雷
- 大嘴花

### 3.2 更多僵尸（4-6种）
- 读报僵尸
- 撑杆跳僵尸
- 橄榄球僵尸
- 舞王僵尸

### 3.3 视觉特效
- 爆炸特效
- 击中特效
- 冰冻特效
- 数字伤害显示

### 3.4 音频完善
- 背景音乐
- 完整音效库
- 音量控制

---

## 📊 开发时间估算

| 阶段 | 功能 | 预计时间 | 优先级 |
|------|------|----------|--------|
| Phase 1 | 阳光系统 | 2-3h | P0 |
| Phase 1 | 植物卡片栏 | 3-4h | P0 |
| Phase 1 | 铲子工具 | 1-2h | P0 |
| Phase 1 | 关卡进度 | 2h | P0 |
| Phase 1 | 向日葵完善 | 2h | P0 |
| **Phase 1 总计** | | **10-13h** | |
| Phase 2 | 坚果墙 | 1h | P1 |
| Phase 2 | 新僵尸类型 | 2h | P1 |
| Phase 2 | 暂停菜单 | 1-2h | P1 |
| Phase 2 | 动画改进 | 2-3h | P1 |
| **Phase 2 总计** | | **6-8h** | |
| Phase 3 | 更多内容 | 10-15h | P2 |

**总计**: 约 26-36 小时开发时间（不含素材创作）

---

## 🎨 素材准备清单（按优先级）

### 立即需要（Phase 1）
1. 阳光动画（8+6 帧）
2. 向日葵完整动画（12+8 帧）
3. 植物卡片图标（3-5 个）
4. 铲子动画（3+4 帧）
5. 进度条和旗帜
6. 新增音效（5-8 个）

### 后续需要（Phase 2-3）
- 见 ASSETS_REQUIREMENTS.md 完整清单

---

## 💻 代码架构建议

### 新增文件结构
```
src/
├── models/
│   ├── pea.js          ✅ 已有
│   ├── plant.js        ✅ 已有
│   ├── zombie.js       ✅ 已有
│   ├── sun.js          ⬜ 新建
│   ├── sunflower.js    ⬜ 新建
│   └── wallnut.js      ⬜ 新建
├── ui/
│   ├── SeedCard.js     ⬜ 新建
│   ├── ProgressBar.js  ⬜ 新建
│   └── PauseMenu.js    ⬜ 新建
├── scenes/
│   ├── BootScene.js    ✅ 已有
│   ├── TitleScene.js   ✅ 已有
│   ├── PlayScene.js    ✅ 需增强
│   └── OverScene.js    ✅ 已有
└── main.js             ✅ 已有
```

---

## 🎮 游戏体验目标

### 核心循环
1. 收集阳光（从天掉落 + 向日葵生产）
2. 选择植物卡片
3. 在草地放置植物
4. 抵御僵尸进攻
5. 完成所有波次获胜

### 难度曲线
- Wave 1-2: 少量普通僵尸
- Wave 3-4: 增加数量，引入路障僵尸
- Wave 5: 大量僵尸，混合类型

### 策略深度
- 向日葵经济 vs 防御植物平衡
- 不同植物的协同作用
- 资源管理（阳光）

---

## ✅ 下一步行动

**建议立即开始 Phase 1**：

1. **第一步**: 实现阳光系统（最核心的游戏机制）
2. **第二步**: 添加植物选择卡片栏
3. **第三步**: 实现向日葵生产阳光
4. **第四步**: 添加铲子工具
5. **第五步**: 实现关卡进度和胜利条件

完成 Phase 1 后，游戏将具备完整的可玩性！

---

**准备好了吗？告诉我你想先从哪个功能开始实现！** 🚀
