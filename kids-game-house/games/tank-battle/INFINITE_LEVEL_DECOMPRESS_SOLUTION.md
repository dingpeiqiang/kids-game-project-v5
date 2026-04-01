# ♾️ 无限关卡解压系统完整方案

## ✅ 问题解决

### **核心矛盾**
- **无限关卡** = 程序化生成（运行时动态创建）
- **解压功能** = 需要预定义的 JSON 配置文件

### **解决方案**
**"种子 + 模板"混合架构**
- 使用**确定性算法**确保相同种子产生相同关卡
- 支持**导出为 JSON**用于后端存储
- 支持**从种子实时解压**减少存储压力

---

## 📋 **架构设计**

### **1. 核心组件**

```
InfiniteLevelDecompressor (解压器)
    ├── generateDecompressibleLevel()  // 生成可解压数据
    ├── decompressFromSeed()           // 从种子解压
    ├── exportToJSON()                 // 导出 JSON
    ├── importFromJSON()               // 导入 JSON
    └── exportBatch()                  // 批量导出
```

---

### **2. 数据流程**

```
┌─────────────────────────────────────────────────────┐
│  方式 A: 实时生成 + 缓存                            │
├─────────────────────────────────────────────────────┤
│  输入：levelNumber                                  │
│    ↓                                                │
│  计算种子：seed = f(levelNumber)                   │
│    ↓                                                │
│  生成配置：config = generate(seed)                 │
│    ↓                                                │
│  缓存到 Map: seedDatabase.set(seed, config)        │
│    ↓                                                │
│  输出：ILevelConfig                                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  方式 B: 从后端加载 JSON                            │
├─────────────────────────────────────────────────────┤
│  输入：JSON 字符串                                   │
│    ↓                                                │
│  解析：data = JSON.parse(json)                     │
│    ↓                                                │
│  验证：checksum == calculateChecksum(data.config)  │
│    ↓                                                │
│  缓存：seedDatabase.set(data.seed, data)           │
│    ↓                                                │
│  输出：ILevelConfig                                 │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 **使用示例**

### **场景 1: 实时生成并缓存（推荐）**

```typescript
import { InfiniteLevelDecompressor } from './InfiniteLevelDecompressor'

export class TankGameScene extends Phaser.Scene {
  private decompressor = new InfiniteLevelDecompressor()
  
  async playLevel(levelNumber: number): Promise<void> {
    // 生成可解压的关卡数据
    const data = this.decompressor.generateDecompressibleLevel(levelNumber)
    
    console.log(`🎮 第 ${levelNumber} 关`)
    console.log(`   种子：${data.seed}`)
    console.log(`   敌人：${data.config.params.enemyCount}个`)
    console.log(`   校验和：${data.checksum}`)
    
    // 运行关卡
    await this.orchestrator.runLevel(data.config)
  }
}
```

---

### **场景 2: 从种子快速解压**

```typescript
// 已知种子的情况下（比如从服务器获取）
async playLevelFromSeed(seed: number): Promise<void> {
  // 从种子解压关卡
  const config = this.decompressor.decompressFromSeed(seed)
  
  if (!config) {
    console.error('❌ 解压失败')
    return
  }
  
  console.log(`✅ 成功解压种子 ${seed} 的关卡`)
  console.log(`   难度：${config.info.difficulty}`)
  console.log(`   敌人：${config.params.enemyCount}个`)
  
  await this.orchestrator.runLevel(config)
}
```

---

### **场景 3: 导出为 JSON（后端存储）**

```typescript
// 在 Node.js 环境中批量生成并导出
const decompressor = new InfiniteLevelDecompressor()

// 导出单个关卡
const level1JSON = decompressor.exportToJSON(1)
fs.writeFileSync('levels/infinite_level_1.json', level1JSON)

// 批量导出前 100 关
const batchJSON = decompressor.exportBatch(1, 100)
fs.writeFileSync('levels/infinite_levels_1-100.json', batchJSON)
```

**生成的 JSON 格式：**

```json
{
  "seed": 1103527590,
  "levelNumber": 1,
  "config": {
    "info": {
      "id": "infinite_level_1",
      "name": "无尽模式 - 第 1 关",
      "difficulty": "easy",
      ...
    },
    "params": {
      "enemyCount": 7,
      "spawnInterval": 2900,
      "timeLimit": 175,
      ...
    },
    ...
  },
  "checksum": "chk_a1b2c3d4",
  "exportedAt": "2026-03-31T12:00:00.000Z"
}
```

---

### **场景 4: 从 JSON 导入（客户端加载）**

```typescript
async loadCustomLevel(jsonString: string): Promise<void> {
  const data = this.decompressor.importFromJSON(jsonString)
  
  if (!data) {
    console.error('❌ 导入失败：校验和不匹配或格式错误')
    return
  }
  
  console.log(`✅ 成功导入自定义关卡`)
  console.log(`   名称：${data.config.info.name}`)
  console.log(`   难度：${data.config.info.difficulty}`)
  
  await this.orchestrator.runLevel(data.config)
}
```

---

### **场景 5: 混合模式（最佳实践）**

```typescript
export class TankGameManager {
  private decompressor = new InfiniteLevelDecompressor()
  private remoteLevelsCache = new Map<number, ILevelConfig>()
  
  /**
   * 智能加载关卡
   */
  async loadLevel(levelNumber: number): Promise<ILevelConfig> {
    // 1. 检查本地缓存
    const cached = this.remoteLevelsCache.get(levelNumber)
    if (cached) {
      console.log(`✅ 从本地缓存加载第 ${levelNumber} 关`)
      return cached
    }
    
    // 2. 尝试从远程服务器获取 JSON
    try {
      const response = await fetch(`/api/levels/infinite/${levelNumber}`)
      if (response.ok) {
        const jsonData = await response.json()
        const data = this.decompressor.importFromJSON(JSON.stringify(jsonData))
        
        if (data) {
          console.log(`✅ 从服务器加载第 ${levelNumber} 关`)
          this.remoteLevelsCache.set(levelNumber, data.config)
          return data.config
        }
      }
    } catch (error) {
      console.warn('⚠️ 远程加载失败，切换到本地生成')
    }
    
    // 3. 降级方案：本地实时生成
    console.log(`🔄 本地生成第 ${levelNumber} 关`)
    const data = this.decompressor.generateDecompressibleLevel(levelNumber)
    this.remoteLevelsCache.set(levelNumber, data.config)
    return data.config
  }
}
```

---

## 📊 **三种策略对比**

| 策略 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **实时生成** | • 无需存储<br>• 无限关卡<br>• 零延迟 | • 无法跨设备同步<br>• 无法分享 | 单机模式、测试环境 |
| **后端存储 JSON** | • 可跨设备同步<br>• 可分享关卡<br>• 防篡改 | • 需要存储空间<br>• 需要网络请求 | 在线模式、排行榜 |
| **混合模式** | • 最佳体验<br>• 离线可用<br>• 支持社交 | • 实现复杂度高 | **推荐生产环境** |

---

## 🗄️ **后端数据库设计**

### **表结构**

```sql
CREATE TABLE infinite_levels (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  level_number INT NOT NULL UNIQUE,
  seed BIGINT NOT NULL,
  config_json JSON NOT NULL,
  checksum VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_seed (seed),
  INDEX idx_level_number (level_number)
);
```

---

### **API 接口**

```typescript
// GET /api/levels/infinite/:levelNumber
async getLevel(req: Request, res: Response) {
  const { levelNumber } = req.params
  
  // 1. 查询数据库
  const level = await db.query(
    'SELECT * FROM infinite_levels WHERE level_number = ?',
    [levelNumber]
  )
  
  if (level) {
    return res.json({
      success: true,
      data: level
    })
  }
  
  // 2. 不存在则实时生成
  const decompressor = new InfiniteLevelDecompressor()
  const data = decompressor.generateDecompressibleLevel(parseInt(levelNumber))
  
  // 3. 保存到数据库
  await db.execute(
    'INSERT INTO infinite_levels (level_number, seed, config_json, checksum) VALUES (?, ?, ?, ?)',
    [data.levelNumber, data.seed, JSON.stringify(data.config), data.checksum]
  )
  
  return res.json({
    success: true,
    data,
    generated: true  // 标记为新生成的
  })
}

// POST /api/levels/infinite/batch-generate
async batchGenerate(req: Request, res: Response) {
  const { startLevel, endLevel } = req.body
  
  const decompressor = new InfiniteLevelDecompressor()
  const levels = []
  
  for (let i = startLevel; i <= endLevel; i++) {
    const data = decompressor.generateDecompressibleLevel(i)
    levels.push(data)
  }
  
  // 批量插入
  await db.transaction(async (tx) => {
    for (const level of levels) {
      await tx.execute(
        'INSERT IGNORE INTO infinite_levels (level_number, seed, config_json, checksum) VALUES (?, ?, ?, ?)',
        [level.levelNumber, level.seed, JSON.stringify(level.config), level.checksum]
      )
    }
  })
  
  return res.json({
    success: true,
    count: levels.length
  })
}
```

---

## ⚙️ **高级功能**

### **1. 每日挑战（固定种子）**

```typescript
generateDailyChallenge(date: Date): ILevelConfig[] {
  // 使用日期作为种子
  const seed = date.getFullYear() * 10000 + 
               (date.getMonth() + 1) * 100 + 
               date.getDate()
  
  const decompressor = new InfiniteLevelDecompressor()
  const levels: ILevelConfig[] = []
  
  // 生成今日 10 关挑战
  for (let i = 0; i < 10; i++) {
    const levelSeed = seed + i  // 每关不同种子
    const config = decompressor.decompressFromSeed(levelSeed)
    if (config) {
      levels.push(config)
    }
  }
  
  return levels
}
```

---

### **2. 关卡分享代码**

```typescript
// 生成分享码
generateShareCode(levelNumber: number): string {
  const data = this.decompressor.generateDecompressibleLevel(levelNumber)
  
  // 编码为短字符串（Base36）
  const shareCode = data.seed.toString(36).toUpperCase()
  return `TK-${shareCode}`
}

// 从分享码解压
decompressFromShareCode(code: string): ILevelConfig | null {
  try {
    // 解析分享码
    const seedStr = code.replace('TK-', '')
    const seed = parseInt(seedStr, 36)
    
    return this.decompressor.decompressFromSeed(seed)
  } catch (error) {
    console.error('❌ 无效的分享码')
    return null
  }
}

// 使用示例
const shareCode = generateShareCode(50)
console.log(`分享第 50 关：${shareCode}`)  // TK-A1B2C3

// 好友输入分享码
const friendLevel = decompressFromShareCode('TK-A1B2C3')
if (friendLevel) {
  console.log('✅ 成功加载好友分享的关卡')
}
```

---

### **3. 进度保存与同步**

```typescript
interface PlayerProgress {
  playerId: string
  maxUnlockedLevel: number
  completedLevels: number[]
  bestScores: Map<number, number>
  lastSyncTime: number
}

// 保存进度
saveProgress(progress: PlayerProgress): void {
  localStorage.setItem('tank_progress', JSON.stringify({
    ...progress,
    bestScores: Array.from(progress.bestScores.entries())
  }))
}

// 加载进度
loadProgress(): PlayerProgress | null {
  const saved = localStorage.getItem('tank_progress')
  if (!saved) return null
  
  const data = JSON.parse(saved)
  return {
    ...data,
    bestScores: new Map(data.bestScores)
  }
}

// 同步到服务器
async syncProgress(progress: PlayerProgress): Promise<boolean> {
  try {
    const response = await fetch('/api/progress/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress)
    })
    
    return response.ok
  } catch (error) {
    console.error('❌ 同步失败')
    return false
  }
}
```

---

## 📈 **性能优化策略**

### **1. 预生成缓存池**

```typescript
class LevelCachePool {
  private cache: Map<number, ILevelConfig> = new Map()
  private readonly POOL_SIZE = 100  // 预生成 100 关
  
  constructor() {
    this.warmup()
  }
  
  /**
   * 预热缓存
   */
  async warmup(): Promise<void> {
    console.log('🔥 预热缓存...')
    
    const decompressor = new InfiniteLevelDecompressor()
    
    // 预生成前 100 关
    for (let i = 1; i <= this.POOL_SIZE; i++) {
      const data = decompressor.generateDecompressibleLevel(i)
      this.cache.set(i, data.config)
    }
    
    console.log(`✅ 缓存预热完成：${this.cache.size} 关`)
  }
  
  /**
   * 获取关卡（优先缓存）
   */
  getLevel(levelNumber: number): ILevelConfig | undefined {
    return this.cache.get(levelNumber)
  }
  
  /**
   * 后台扩展缓存
   */
  async extendCache(upTo: number): Promise<void> {
    const decompressor = new InfiniteLevelDecompressor()
    
    for (let i = this.cache.size + 1; i <= upTo; i++) {
      const data = decompressor.generateDecompressibleLevel(i)
      this.cache.set(i, data.config)
      
      // 每 10 关暂停一下避免阻塞
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
  }
}
```

---

### **2. 懒加载 + 预加载结合**

```typescript
class SmartLevelLoader {
  private currentLevel = 1
  private preloadAhead = 5  // 预加载后面 5 关
  
  async playLevel(levelNumber: number): Promise<void> {
    // 1. 立即加载当前关卡
    const config = await this.loadLevel(levelNumber)
    await this.runLevel(config)
    
    // 2. 后台预加载后续关卡
    this.preloadNextLevels(levelNumber)
  }
  
  private async preloadNextLevels(currentLevel: number): Promise<void> {
    for (let i = 1; i <= this.preloadAhead; i++) {
      const nextLevel = currentLevel + i
      
      // 异步预加载（不阻塞）
      this.loadLevel(nextLevel).catch(console.warn)
      
      // 间隔 100ms 避免阻塞主线程
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}
```

---

## ✅ **完整性检查**

| 功能 | 状态 | 说明 |
|------|------|------|
| **确定性生成** | ✅ | 相同种子=相同关卡 |
| **实时解压** | ✅ | 从种子生成配置 |
| **JSON 导出** | ✅ | 支持后端存储 |
| **JSON 导入** | ✅ | 支持客户端加载 |
| **校验和验证** | ✅ | 防篡改机制 |
| **批量导出** | ✅ | 一次性生成多关 |
| **缓存机制** | ✅ | Map 缓存加速 |
| **混合模式** | ✅ | 本地 + 远程 |
| **分享码** | ✅ | Base36 编码 |
| **每日挑战** | ✅ | 日期种子 |
| **TODO** | ❌ | 零遗留 |

---

## 🎊 **总结**

无限关卡解压系统实现了：
- ✅ **程序化生成** - 理论上无限的关卡
- ✅ **确定性算法** - 相同种子产生相同关卡
- ✅ **JSON 导出/导入** - 支持后端存储和分享
- ✅ **混合架构** - 本地生成 + 远程加载
- ✅ **完整性验证** - 校验和防篡改
- ✅ **性能优化** - 缓存池、预加载

**彻底解决了无限关卡与解压功能的冲突！** ♾️✨
