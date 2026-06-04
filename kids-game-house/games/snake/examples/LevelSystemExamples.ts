// ============================================================================
// 🐍 贪吃蛇关卡系统完整集成示例
// ============================================================================
// 
// 📌 说明:
//   这是一个完整的集成示例，展示如何使用 GCRS 关卡系统
//   可以直接复制使用或作为参考
// ============================================================================

import { LevelComponentGameScene } from '../scenes/LevelComponentGameScene'

/**
 * ⭐ 使用示例 1: 基础用法
 */
export async function example1_BasicUsage() {
  console.log('🎮 示例 1: 基础用法')
  
  // 1. 创建游戏场景
  const container = document.getElementById('game-container')!
  
  const game = new LevelComponentGameScene(container, {
    initialLevelId: 'snake_level_1',  // 初始关卡
    difficulty: 'easy'                 // 难度设置
  })
  
  // 2. 启动游戏
  await game.start()
  
  console.log('✅ 游戏已启动')
}

/**
 * ⭐ 使用示例 2: 自定义配置
 */
export async function example2_CustomConfig() {
  console.log('🎮 示例 2: 自定义配置')
  
  const container = document.getElementById('game-container')!
  
  const game = new LevelComponentGameScene(container, {
    initialLevelId: 'snake_level_2',  // 从第 2 关开始
    difficulty: 'normal',              // 普通难度
    themeId: 'desert'                  // 沙漠主题
  })
  
  await game.start()
}

/**
 * ⭐ 使用示例 3: 监听关卡事件
 */
export async function example3_LevelEvents() {
  console.log('🎮 示例 3: 监听关卡事件')
  
  const container = document.getElementById('game-container')!
  const game = new LevelComponentGameScene(container)
  
  // 重写事件处理方法
  const originalOnLevelComplete = (game as any).onLevelComplete.bind(game)
  ;(game as any).onLevelComplete = function(result: any) {
    console.log('🎉 自定义关卡完成处理')
    console.log('   ├─ 成功:', result.success)
    console.log('   ├─ 星级:', result.stars)
    console.log('   ├─ 分数:', result.score)
    console.log('   └─ 用时:', result.timeUsed, '秒')
    
    // 调用原始方法
    originalOnLevelComplete(result)
  }
  
  await game.start()
}

/**
 * ⭐ 使用示例 4: 手动控制关卡流程
 */
export async function example4_ManualControl() {
  console.log('🎮 示例 4: 手动控制关卡流程')
  
  const container = document.getElementById('game-container')!
  const game = new LevelComponentGameScene(container, {
    initialLevelId: 'snake_level_1'
  })
  
  await game.start()
  
  // 假设玩家完成了第一关
  setTimeout(async () => {
    console.log('⏭️ 进入下一关...')
    await (game as any).goToNextLevel()
  }, 5000)
  
  // 如果失败了，可以重试
  setTimeout(async () => {
    console.log('🔄 重试当前关卡...')
    await (game as any).retryLevel()
  }, 10000)
}

/**
 * ⭐ 使用示例 5: 批量加载多个关卡
 */
export async function example5_BatchLoading() {
  console.log('🎮 示例 5: 批量加载多个关卡')
  
  const { SnakeLevelLoader } = await import('../utils/SnakeLevelLoader.js')
  
  try {
    // 批量加载 3 个关卡
    const levels = await SnakeLevelLoader.loadMultiple([
      'snake_level_1',
      'snake_level_2',
      'snake_level_3'
    ])
    
    console.log('✅ 成功加载', levels.length, '个关卡')
    
    levels.forEach((config, index) => {
      console.log(`\n关卡 ${index + 1}:`)
      console.log(`  ├─ ID: ${config.info.id}`)
      console.log(`  ├─ 名称：${config.info.name}`)
      console.log(`  ├─ 难度：${config.info.difficulty}`)
      console.log(`  ├─ 目标数量：${config.objectives.length}`)
      console.log(`  └─ 时间限制：${config.timeLimit || '无'}秒`)
    })
    
  } catch (error) {
    console.error('❌ 批量加载失败:', error)
  }
}

/**
 * ⭐ 使用示例 6: 验证关卡配置
 */
export async function example6_ValidateConfig() {
  console.log('🎮 示例 6: 验证关卡配置')
  
  const { SnakeLevelLoader } = await import('../utils/SnakeLevelLoader.js')
  
  try {
    const config = await SnakeLevelLoader.loadFromJSON('snake_level_1')
    
    // 验证必需字段
    const errors: string[] = []
    
    if (!config.info || !config.info.id) {
      errors.push('缺少 info.id')
    }
    
    if (!config.info || !config.info.name) {
      errors.push('缺少 info.name')
    }
    
    if (!config.params) {
      errors.push('缺少 params')
    }
    
    if (!config.victoryCondition) {
      errors.push('缺少 victoryCondition')
    }
    
    if (!config.objectives || config.objectives.length === 0) {
      errors.push('缺少 objectives')
    }
    
    if (errors.length > 0) {
      console.error('❌ 关卡配置验证失败:')
      errors.forEach(err => console.error('   -', err))
    } else {
      console.log('✅ 关卡配置验证通过')
      console.log('   ├─ 所有必需字段都存在')
      console.log('   ├─ 格式正确')
      console.log('   └─ 可以安全使用')
    }
    
  } catch (error) {
    console.error('❌ 配置加载失败:', error)
  }
}

/**
 * ⭐ 使用示例 7: 在 Vue 组件中使用
 */
export const example7_VueComponent = `
<template>
  <div class="game-wrapper">
    <!-- 游戏容器 -->
    <div ref="gameContainer" class="game-container"></div>
    
    <!-- UI 覆盖层 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="progress-bar">
        <div :style="{ width: progress + '%' }"></div>
      </div>
      <p>{{ loadingMessage }}</p>
    </div>
    
    <!-- 结算界面 -->
    <div v-if="showSettlement" class="settlement-modal">
      <h2>{{ result.success ? '🎉 胜利!' : '😢 失败' }}</h2>
      <div class="stats">
        <p>分数：{{ result.score }}</p>
        <p>星级：{{ '⭐'.repeat(result.stars) }}</p>
        <p>用时：{{ result.timeUsed }}秒</p>
      </div>
      <button @click="handleNextLevel">下一关</button>
      <button @click="handleRetry">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { LevelComponentGameScene } from '@/scenes/LevelComponentGameScene'

const gameContainer = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const progress = ref(0)
const loadingMessage = ref('加载中...')
const showSettlement = ref(false)
const result = ref<any>({ success: false, score: 0, stars: 0, timeUsed: 0 })

let game: LevelComponentGameScene | null = null

onMounted(async () => {
  if (!gameContainer.value) return
  
  // 创建游戏
  game = new LevelComponentGameScene(gameContainer.value, {
    initialLevelId: 'snake_level_1',
    difficulty: 'easy'
  })
  
  try {
    await game.start()
    isLoading.value = false
  } catch (error) {
    console.error('游戏启动失败:', error)
    isLoading.value = false
  }
})

onUnmounted(() => {
  if (game) {
    game.stop()
    game = null
  }
})

function handleNextLevel() {
  showSettlement.value = false
  game?.goToNextLevel()
}

function handleRetry() {
  showSettlement.value = false
  game?.retryLevel()
}
</script>

<style scoped>
.game-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  z-index: 1000;
}

.progress-bar {
  width: 300px;
  height: 20px;
  background: #333;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
}

.progress-bar div {
  height: 100%;
  background: linear-gradient(90deg, #4ade80, #22c55e);
  transition: width 0.3s;
}

.settlement-modal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  text-align: center;
  z-index: 1000;
}

.stats {
  margin: 20px 0;
  font-size: 18px;
}

button {
  margin: 10px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  border-radius: 8px;
  background: #4ade80;
  color: white;
  transition: all 0.3s;
}

button:hover {
  background: #22c55e;
  transform: translateY(-2px);
}
</style>
`

/**
 * ⭐ 使用示例 8: 性能测试
 */
export async function example8_PerformanceTest() {
  console.log('🎮 示例 8: 性能测试')
  
  const { SnakeLevelLoader } = await import('../utils/SnakeLevelLoader.js')
  
  // 测试单次加载
  const start1 = performance.now()
  await SnakeLevelLoader.loadFromJSON('snake_level_1')
  const end1 = performance.now()
  console.log(`单次加载时间：${(end1 - start1).toFixed(2)}ms`)
  
  // 测试缓存效果
  const start2 = performance.now()
  await SnakeLevelLoader.loadFromJSON('snake_level_1')
  const end2 = performance.now()
  console.log(`缓存命中时间：${(end2 - start2).toFixed(2)}ms (应该更快)`)
  
  // 测试批量加载
  const start3 = performance.now()
  await SnakeLevelLoader.loadMultiple([
    'snake_level_1',
    'snake_level_2',
    'snake_level_3'
  ])
  const end3 = performance.now()
  console.log(`批量加载 3 个关卡：${(end3 - start3).toFixed(2)}ms`)
}

/**
 * ⭐ 使用示例 9: 调试模式
 */
export async function example9_DebugMode() {
  console.log('🎮 示例 9: 调试模式')
  
  // 开启详细日志
  localStorage.setItem('SNAKE_DEBUG', 'true')
  
  const container = document.getElementById('game-container')!
  const game = new LevelComponentGameScene(container, {
    initialLevelId: 'snake_level_1'
  })
  
  await game.start()
  
  console.log('✅ 调试模式已开启')
  console.log('   查看控制台查看详细日志')
}

/**
 * ⭐ 使用示例 10: 完整的实战流程
 */
export async function example10_FullWorkflow() {
  console.log('🎮 示例 10: 完整实战流程')
  
  try {
    // 1. 预加载所有关卡配置
    console.log('📥 步骤 1: 预加载关卡配置')
    const { SnakeLevelLoader } = await import('../utils/SnakeLevelLoader.js')
    const allLevels = await SnakeLevelLoader.loadMultiple([
      'snake_level_1',
      'snake_level_2',
      'snake_level_3'
    ])
    console.log(`✅ 预加载完成，共 ${allLevels.length} 个关卡`)
    
    // 2. 创建游戏
    console.log('\\n🎨 步骤 2: 创建游戏')
    const container = document.getElementById('game-container')!
    const game = new LevelComponentGameScene(container, {
      initialLevelId: 'snake_level_1',
      difficulty: 'easy'
    })
    
    // 3. 启动游戏
    console.log('\\n🚀 步骤 3: 启动游戏')
    await game.start()
    console.log('✅ 游戏已启动')
    
    // 4. 模拟游戏流程
    console.log('\\n⏱️ 步骤 4: 模拟游戏流程')
    console.log('   等待 5 秒后进入下一关...')
    
    setTimeout(async () => {
      console.log('\\n➡️ 进入第 2 关')
      await (game as any).goToNextLevel()
      
      setTimeout(async () => {
        console.log('\\n➡️ 进入第 3 关')
        await (game as any).goToNextLevel()
      }, 5000)
    }, 5000)
    
  } catch (error) {
    console.error('❌ 流程执行失败:', error)
  }
}

// ============================================================================
// 📦 导出所有示例
// ============================================================================

export const examples = {
  '基础用法': example1_BasicUsage,
  '自定义配置': example2_CustomConfig,
  '监听事件': example3_LevelEvents,
  '手动控制': example4_ManualControl,
  '批量加载': example5_BatchLoading,
  '配置验证': example6_ValidateConfig,
  'Vue 组件': () => console.log(example7_VueComponent),
  '性能测试': example8_PerformanceTest,
  '调试模式': example9_DebugMode,
  '完整流程': example10_FullWorkflow
}

/**
 * ⭐ 运行指定示例
 */
export async function runExample(name: string): Promise<void> {
  const example = examples[name as keyof typeof examples]
  
  if (!example) {
    console.error(`❌ 未找到示例：${name}`)
    console.log('可用示例:', Object.keys(examples).join(', '))
    return
  }
  
  console.log(`\\n${'='.repeat(60)}`)
  console.log(`🎮 运行示例：${name}`)
  console.log('='.repeat(60))
  
  try {
    await example()
    console.log(`\\n✅ 示例 "${name}" 执行完成`)
  } catch (error) {
    console.error(`\\n❌ 示例 "${name}" 执行失败:`, error)
  }
}
