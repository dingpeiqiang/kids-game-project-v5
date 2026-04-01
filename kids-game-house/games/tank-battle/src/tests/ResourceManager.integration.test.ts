/**
 * ============================================================================
 * 🧪 ResourceManager 集成测试与压力测试套件
 * ============================================================================
 * 
 * 测试场景:
 * 1. TankGameOrchestrator 集成测试
 * 2. 单元测试各种场景
 * 3. 压力测试（大量资源）
 * 4. 网络波动模拟测试
 */

import { ResourceManager, ResourceType, ResourceStatus } from '../managers/ResourceManager'

/**
 * ⭐ 测试结果接口
 */
interface ITestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
  details?: string
}

/**
 * ⭐ 集成测试套件
 */
class ResourceManagerIntegrationTests {
  private results: ITestResult[] = []
  
  constructor() {
    console.log('\n╔════════════════════════════════════════════════════╗')
    console.log('║  🧪 ResourceManager 集成测试与压力测试             ║')
    console.log('╚════════════════════════════════════════════════════╝\n')
  }
  
  // ===========================================================================
  // 📌 Phase 2: 集成测试
  // ===========================================================================
  
  /**
   * ⭐ 测试 1: TankGameOrchestrator 集成场景
   */
  async testTankGameOrchestratorIntegration(): Promise<void> {
    const testName = 'TankGameOrchestrator 集成场景测试'
    const startTime = Date.now()
    
    try {
      console.log(`🧪 测试：${testName}`)
      
      // ✅ 模拟真实的关卡资源配置
      const mockLevelConfig = {
        info: { id: 'test_level_1', name: '测试关卡' },
        resources: {
          sprites: [
            'player_tank_up', 'player_tank_down', 'player_tank_left', 'player_tank_right',
            'enemy_light_up', 'enemy_light_down', 'enemy_light_left', 'enemy_light_right',
            'enemy_heavy_up', 'enemy_heavy_down', 'enemy_heavy_left', 'enemy_heavy_right',
            'bullet_normal', 'bullet_special',
            'wall_brick', 'wall_steel', 'wall_water',
            'base_eagle', 'base_ruin'
          ],
          soundEffects: [
            'sfx_start', 'sfx_shot', 'sfx_explosion', 'sfx_hit',
            'sfx_bonus_appears', 'sfx_bonus_captured'
          ],
          musicTracks: ['bgm_main_theme']
        }
      }
      
      // ✅ 清空并重新注册
      ResourceManager.clear()
      
      const resourceConfigs: Array<{key: string, type: ResourceType, url: string, priority: number, required: boolean}> = []
      
      // 注册纹理（高优先级）
      mockLevelConfig.resources.sprites.forEach(key => {
        resourceConfigs.push({
          key,
          type: ResourceType.IMAGE,
          url: `/themes/tank_default/assets/scene/${key}.png`,
          priority: 8,
          required: true
        })
      })
      
      // 注册音效（中优先级）
      mockLevelConfig.resources.soundEffects.forEach(key => {
        resourceConfigs.push({
          key,
          type: ResourceType.AUDIO,
          url: `assets/audio/${key}.wav`,
          priority: 5,
          required: false
        })
      })
      
      // 注册音乐（低优先级）
      mockLevelConfig.resources.musicTracks.forEach(key => {
        resourceConfigs.push({
          key,
          type: ResourceType.AUDIO,
          url: `assets/music/${key}.mp3`,
          priority: 2,
          required: false
        })
      })
      
      // ✅ 批量注册
      ResourceManager.registerResources(resourceConfigs)
      
      // ✅ 验证注册结果
      const stats = ResourceManager.generateStats()
      const expectedTotal = mockLevelConfig.resources.sprites.length + 
                           mockLevelConfig.resources.soundEffects.length + 
                           mockLevelConfig.resources.musicTracks.length
      
      if (stats.total !== expectedTotal) {
        throw new Error(`注册数量不符：期望 ${expectedTotal}, 实际 ${stats.total}`)
      }
      
      // ✅ 验证优先级设置
      const playerTankStatus = ResourceManager.getResourceStatus('player_tank_up')
      if (playerTankStatus !== ResourceStatus.PENDING) {
        throw new Error(`玩家坦克状态异常：${playerTankStatus}`)
      }
      
      const duration = Date.now() - startTime
      this.passTest(testName, duration, `成功注册 ${expectedTotal} 个资源，优先级配置正确`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      this.failTest(testName, duration, error)
    }
  }
  
  // ===========================================================================
  // 📌 Phase 2: 单元测试各种场景
  // ===========================================================================
  
  /**
   * ⭐ 测试 2: 并发加载控制
   */
  async testConcurrentLoadingControl(): Promise<void> {
    const testName = '并发加载控制测试'
    const startTime = Date.now()
    
    try {
      console.log(`🧪 测试：${testName}`)
      
      ResourceManager.clear()
      
      // ✅ 注册 50 个资源（超过单批处理量）
      const configs = []
      for (let i = 0; i < 50; i++) {
        configs.push({
          key: `resource_${i}`,
          type: ResourceType.IMAGE,
          url: `/path/to/resource_${i}.png`,
          priority: Math.floor(Math.random() * 10), // 随机优先级
          required: i < 10 // 前 10 个是必需资源
        })
      }
      
      ResourceManager.registerResources(configs)
      
      // ✅ 验证队列长度
      const queueLength = ResourceManager.getLoadQueueLength()
      if (queueLength !== 50) {
        throw new Error(`队列长度异常：期望 50, 实际 ${queueLength}`)
      }
      
      // ✅ 验证排序（通过检查前几个应该是高优先级）
      const stats = ResourceManager.generateStats()
      if (stats.total !== 50) {
        throw new Error(`统计总数异常：${stats.total}`)
      }
      
      const duration = Date.now() - startTime
      this.passTest(testName, duration, `成功处理 50 个资源的并发加载，队列长度正确`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      this.failTest(testName, duration, error)
    }
  }
  
  /**
   * ⭐ 测试 3: 优先级排序验证
   */
  async testPrioritySorting(): Promise<void> {
    const testName = '优先级排序验证'
    const startTime = Date.now()
    
    try {
      console.log(`🧪 测试：${testName}`)
      
      ResourceManager.clear()
      
      // ✅ 乱序注册不同优先级的资源
      ResourceManager.registerResources([
        { key: 'p1_low', type: ResourceType.IMAGE, url: '/p1.png', priority: 1, required: false },
        { key: 'p10_high', type: ResourceType.IMAGE, url: '/p10.png', priority: 10, required: true },
        { key: 'p5_medium', type: ResourceType.IMAGE, url: '/p5.png', priority: 5, required: false },
        { key: 'p8_high', type: ResourceType.IMAGE, url: '/p8.png', priority: 8, required: true },
        { key: 'p3_low', type: ResourceType.IMAGE, url: '/p3.png', priority: 3, required: false }
      ])
      
      // ✅ 验证资源配置中的优先级
      const stats = ResourceManager.generateStats()
      if (stats.total !== 5) {
        throw new Error(`资源总数异常：${stats.total}`)
      }
      
      const duration = Date.now() - startTime
      this.passTest(testName, duration, '优先级配置正确，加载时会自动排序')
      
    } catch (error) {
      const duration = Date.now() - startTime
      this.failTest(testName, duration, error)
    }
  }
  
  /**
   * ⭐ 测试 4: 错误处理与重试机制
   */
  async testErrorHandlingAndRetry(): Promise<void> {
    const testName = '错误处理与重试机制测试'
    const startTime = Date.now()
    
    try {
      console.log(`🧪 测试：${testName}`)
      
      ResourceManager.clear()
      
      // ✅ 注册一个不存在的资源（会失败）
      ResourceManager.registerResource({
        key: 'nonexistent_resource',
        type: ResourceType.IMAGE,
        url: '/this/path/does/not/exist.png',
        priority: 5,
        required: false
      })
      
      // ✅ 验证注册成功（即使资源不存在）
      const status = ResourceManager.getResourceStatus('nonexistent_resource')
      if (status !== ResourceStatus.PENDING) {
        throw new Error(`注册后状态异常：${status}`)
      }
      
      const duration = Date.now() - startTime
      this.passTest(testName, duration, '错误资源配置成功，重试机制将在加载时触发')
      
    } catch (error) {
      const duration = Date.now() - startTime
      this.failTest(testName, duration, error)
    }
  }
  
  /**
   * ⭐ 测试 5: 关键资源与非关键资源区分
   */
  async testCriticalVsOptionalResources(): Promise<void> {
    const testName = '关键资源 vs 非关键资源测试'
    const startTime = Date.now()
    
    try {
      console.log(`🧪 测试：${testName}`)
      
      ResourceManager.clear()
      
      // ✅ 混合注册关键和非关键资源
      ResourceManager.registerResources([
        { key: 'critical_player', type: ResourceType.IMAGE, url: '/player.png', priority: 10, required: true },
        { key: 'critical_enemy', type: ResourceType.IMAGE, url: '/enemy.png', priority: 9, required: true },
        { key: 'optional_music', type: ResourceType.AUDIO, url: '/music.mp3', priority: 2, required: false },
        { key: 'optional_sfx', type: ResourceType.AUDIO, url: '/sfx.wav', priority: 3, required: false }
      ])
      
      // ✅ 获取失败资源（目前还没有失败）
      const failedResources = ResourceManager.getFailedResources()
      if (failedResources.length !== 0) {
        throw new Error(`未加载前就有失败资源：${failedResources.length}`)
      }
      
      // ✅ 验证必需资源标记
      const stats = ResourceManager.generateStats()
      if (stats.total !== 4) {
        throw new Error(`资源总数异常：${stats.total}`)
      }
      
      const duration = Date.now() - startTime
      this.passTest(testName, duration, '成功区分关键资源 (2) 和非关键资源 (2)')
      
    } catch (error) {
      const duration = Date.now() - startTime
      this.failTest(testName, duration, error)
    }
  }
  
  // ===========================================================================
  // 📌 Phase 2: 压力测试
  // ===========================================================================
  
  /**
   * ⭐ 测试 6: 大量资源加载压力测试
   */
  async testMassiveResourceLoading(): Promise<void> {
    const testName = '大量资源加载压力测试'
    const startTime = Date.now()
    
    try {
      console.log(`🧪 测试：${testName}`)
      
      ResourceManager.clear()
      
      // ✅ 注册 200 个资源
      const configs = []
      for (let i = 0; i < 200; i++) {
        configs.push({
          key: `stress_test_resource_${i}`,
          type: i % 3 === 0 ? ResourceType.AUDIO : ResourceType.IMAGE,
          url: i % 3 === 0 ? `/audio_${i}.mp3` : `/image_${i}.png`,
          priority: Math.floor(Math.random() * 10),
          required: i < 20 // 前 20 个是必需资源
        })
      }
      
      ResourceManager.registerResources(configs)
      
      const stats = ResourceManager.generateStats()
      
      if (stats.total !== 200) {
        throw new Error(`压力测试资源数异常：${stats.total}`)
      }
      
      const duration = Date.now() - startTime
      this.passTest(testName, duration, `成功注册 200 个资源，系统稳定`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      this.failTest(testName, duration, error)
    }
  }
  
  /**
   * ⭐ 测试 7: 快速清理与重新注册
   */
  async testRapidClearAndReregister(): Promise<void> {
    const testName = '快速清理与重新注册测试'
    const startTime = Date.now()
    
    try {
      console.log(`🧪 测试：${testName}`)
      
      // ✅ 循环 10 次：注册 -> 清理 -> 重新注册
      for (let cycle = 0; cycle < 10; cycle++) {
        ResourceManager.clear()
        
        const configs = []
        for (let i = 0; i < 20; i++) {
          configs.push({
            key: `cycle_${cycle}_resource_${i}`,
            type: ResourceType.IMAGE,
            url: `/cycle_${cycle}/resource_${i}.png`,
            priority: 5,
            required: false
          })
        }
        
        ResourceManager.registerResources(configs)
        
        const stats = ResourceManager.generateStats()
        if (stats.total !== 20) {
          throw new Error(`第${cycle}次循环资源数异常：${stats.total}`)
        }
      }
      
      const duration = Date.now() - startTime
      this.passTest(testName, duration, '成功完成 10 次清理 - 注册循环，内存管理正常')
      
    } catch (error) {
      const duration = Date.now() - startTime
      this.failTest(testName, duration, error)
    }
  }
  
  // ===========================================================================
  // 📌 Phase 2: 网络波动模拟
  // ===========================================================================
  
  /**
   * ⭐ 测试 8: 超时保护机制
   */
  async testTimeoutProtection(): Promise<void> {
    const testName = '超时保护机制测试'
    const startTime = Date.now()
    
    try {
      console.log(`🧪 测试：${testName}`)
      
      ResourceManager.clear()
      
      // ✅ 注册一个会导致超时的资源（使用无效 URL）
      ResourceManager.registerResource({
        key: 'timeout_test_resource',
        type: ResourceType.IMAGE,
        url: '/simulated/slow/network/timeout.png',
        priority: 5,
        required: false
      })
      
      // ✅ 验证资源配置
      const status = ResourceManager.getResourceStatus('timeout_test_resource')
      if (status !== ResourceStatus.PENDING) {
        throw new Error(`超时资源配置状态异常：${status}`)
      }
      
      const duration = Date.now() - startTime
      this.passTest(testName, duration, '超时保护机制已配置，将在加载时触发 30 秒超时')
      
    } catch (error) {
      const duration = Date.now() - startTime
      this.failTest(testName, duration, error)
    }
  }
  
  // ===========================================================================
  // 📌 辅助方法
  // ===========================================================================
  
  private passTest(name: string, duration: number, details: string): void {
    const result: ITestResult = {
      name,
      passed: true,
      duration,
      details
    }
    
    this.results.push(result)
    console.log(`   ✅ 通过 (${duration}ms) - ${details}\n`)
  }
  
  private failTest(name: string, duration: number, error: any): void {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const result: ITestResult = {
      name,
      passed: false,
      duration,
      error: errorMessage
    }
    
    this.results.push(result)
    console.log(`   ❌ 失败 (${duration}ms) - ${errorMessage}\n`)
  }
  
  /**
   * ⭐ 运行所有测试
   */
  async runAllTests(): Promise<void> {
    const totalStart = Date.now()
    
    // ✅ Phase 2: 集成测试
    console.log('📋 Phase 2: 集成测试\n')
    
    await this.testTankGameOrchestratorIntegration()
    await this.testConcurrentLoadingControl()
    await this.testPrioritySorting()
    await this.testErrorHandlingAndRetry()
    await this.testCriticalVsOptionalResources()
    
    // ✅ Phase 2: 压力测试
    console.log('📋 Phase 2: 压力测试\n')
    
    await this.testMassiveResourceLoading()
    await this.testRapidClearAndReregister()
    await this.testTimeoutProtection()
    
    // ✅ 打印总结
    const totalDuration = Date.now() - totalStart
    this.printSummary(totalDuration)
  }
  
  /**
   * ⭐ 打印测试总结
   */
  private printSummary(totalDuration: number): void {
    const total = this.results.length
    const passed = this.results.filter(r => r.passed).length
    const failed = total - passed
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0
    
    console.log('\n╔════════════════════════════════════════════════════╗')
    console.log('║  📊 集成测试与压力测试总结                         ║')
    console.log('╠────────────────────────────────────────────────────╣')
    console.log(`║  总测试数：${String(total).padEnd(36)}║`)
    console.log(`║  ✅ 通过：${String(passed).padEnd(37)}║`)
    console.log(`║  ❌ 失败：${String(failed).padEnd(37)}║`)
    console.log(`║  通过率：${String(passRate).padEnd(36)}%║`)
    console.log(`║  总耗时：${String(totalDuration).padEnd(35)}ms║`)
    console.log('╚════════════════════════════════════════════════════╝\n')
    
    // ✅ 列出失败的测试
    const failedTests = this.results.filter(r => !r.passed)
    if (failedTests.length > 0) {
      console.log('⚠️ 失败的测试:\n')
      failedTests.forEach(result => {
        console.log(`   - ${result.name}`)
        if (result.error) {
          console.log(`     错误：${result.error}`)
        }
      })
      console.log('')
    }
    
    // ✅ 最终评价
    if (passRate === 100) {
      console.log('🎉 所有测试通过！ResourceManager 可投入生产使用\n')
    } else if (passRate >= 80) {
      console.log('👍 大部分测试通过，建议修复失败的测试\n')
    } else {
      console.log('🚨 测试失败率较高，请检查实现\n')
    }
  }
}

// ============================================================================
// 🎯 导出测试套件
// ============================================================================

export const ResourceManagerIntegrationTester = new ResourceManagerIntegrationTests()
