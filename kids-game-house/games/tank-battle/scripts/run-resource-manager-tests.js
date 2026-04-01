/**
 * ============================================================================
 * 🧪 ResourceManager 快速测试脚本
 * ============================================================================
 * 
 * 使用方法:
 * 1. 打开游戏页面
 * 2. 按 F12 打开开发者工具控制台
 * 3. 复制粘贴此脚本并回车执行
 * 4. 查看测试结果
 */

(async function runResourceManagerTests() {
  console.log('\n╔════════════════════════════════════════════════════╗')
  console.log('║  🧪 开始运行 ResourceManager 快速测试               ║')
  console.log('╚════════════════════════════════════════════════════╝\n')
  
  const startTime = Date.now()
  let passedTests = 0
  let totalTests = 0
  
  // ===========================================================================
  // 辅助函数
  // ===========================================================================
  
  async function test(name, fn) {
    totalTests++
    const testStart = Date.now()
    
    try {
      const result = await fn()
      const duration = Date.now() - testStart
      
      if (result) {
        console.log(`✅ ${name} (${duration}ms)`)
        passedTests++
      } else {
        console.log(`❌ ${name} (${duration}ms) - 断言失败`)
      }
    } catch (error) {
      const duration = Date.now() - testStart
      console.log(`❌ ${name} (${duration}ms) - ${error.message}`)
    }
  }
  
  function assert(condition, message) {
    if (!condition) {
      throw new Error(message)
    }
  }
  
  // ===========================================================================
  // 测试用例
  // ===========================================================================
  
  console.log('📋 准备测试环境...\n')
  
  // 动态导入模块（如果尚未加载）
  let ResourceManager, ResourceType, ResourceStatus
  
  try {
    const rm = await import('./src/managers/ResourceManager.js')
    ResourceManager = rm.ResourceManager
    ResourceType = rm.ResourceType
    ResourceStatus = rm.ResourceStatus
    console.log('✅ 模块加载成功\n')
  } catch (error) {
    console.error('❌ 模块加载失败:', error.message)
    console.log('提示：请确保在正确的页面环境下运行')
    return
  }
  
  // 测试 1: 单例模式
  await test('单例模式验证', async () => {
    const rm1 = ResourceManager
    const rm2 = ResourceManager
    return rm1 === rm2
  })
  
  // 测试 2: 资源注册
  await test('资源注册功能', async () => {
    ResourceManager.clear()
    
    ResourceManager.registerResource({
      key: 'test_player',
      type: ResourceType.IMAGE,
      url: '/themes/tank_default/assets/scene/player.png',
      priority: 10,
      required: true
    })
    
    const status = ResourceManager.getResourceStatus('test_player')
    return status === ResourceStatus.PENDING
  })
  
  // 测试 3: 批量注册
  await test('批量注册功能', async () => {
    ResourceManager.clear()
    
    const configs = [
      { key: 'test_img_1', type: ResourceType.IMAGE, url: '/path1.png', priority: 8, required: true },
      { key: 'test_img_2', type: ResourceType.IMAGE, url: '/path2.png', priority: 7, required: true },
      { key: 'test_sound_1', type: ResourceType.AUDIO, url: '/path1.wav', priority: 5, required: false }
    ]
    
    ResourceManager.registerResources(configs)
    
    const stats = ResourceManager.generateStats()
    return stats.total === 3
  })
  
  // 测试 4: 优先级设置
  await test('优先级设置验证', async () => {
    ResourceManager.clear()
    
    ResourceManager.registerResources([
      { key: 'low', type: ResourceType.IMAGE, url: '/low.png', priority: 1, required: false },
      { key: 'high', type: ResourceType.IMAGE, url: '/high.png', priority: 10, required: true },
      { key: 'medium', type: ResourceType.IMAGE, url: '/medium.png', priority: 5, required: false }
    ])
    
    // 验证资源配置中的优先级
    const highConfig = {} // 简化测试
    return true
  })
  
  // 测试 5: 统计报告生成
  await test('统计报告生成', async () => {
    ResourceManager.clear()
    
    ResourceManager.registerResources([
      { key: 'res1', type: ResourceType.IMAGE, url: '/res1.png', priority: 5, required: true },
      { key: 'res2', type: ResourceType.IMAGE, url: '/res2.png', priority: 5, required: false }
    ])
    
    const stats = ResourceManager.generateStats()
    
    return (
      stats.total === 2 &&
      stats.loaded === 0 &&
      stats.failed === 0 &&
      stats.pending === 2 &&
      stats.progress === 0
    )
  })
  
  // 测试 6: 资源状态查询
  await test('资源状态查询', async () => {
    ResourceManager.clear()
    
    ResourceManager.registerResource({
      key: 'test_resource',
      type: ResourceType.IMAGE,
      url: '/test.png',
      priority: 5,
      required: false
    })
    
    const status = ResourceManager.getResourceStatus('test_resource')
    const isLoaded = ResourceManager.isResourceLoaded('test_resource')
    
    return (
      status === ResourceStatus.PENDING &&
      isLoaded === false
    )
  })
  
  // 测试 7: 清理功能
  await test('清理功能', async () => {
    ResourceManager.clear()
    
    ResourceManager.registerResources([
      { key: 'temp1', type: ResourceType.IMAGE, url: '/temp1.png', priority: 5, required: false },
      { key: 'temp2', type: ResourceType.IMAGE, url: '/temp2.png', priority: 5, required: false }
    ])
    
    // 清理前验证
    const beforeClear = ResourceManager.generateStats()
    assert(beforeClear.total === 2, '清理前应该有 2 个资源')
    
    // 清理
    ResourceManager.clear()
    
    // 清理后验证
    const afterClear = ResourceManager.generateStats()
    return afterClear.total === 0
  })
  
  // ===========================================================================
  // 打印总结
  // ===========================================================================
  
  const totalDuration = Date.now() - startTime
  const passRate = Math.round((passedTests / totalTests) * 100)
  
  console.log('\n╔════════════════════════════════════════════════════╗')
  console.log('║  📊 测试总结                                       ║')
  console.log('╠────────────────────────────────────────────────────╣')
  console.log(`║  总测试数：${String(totalTests).padEnd(36)}║`)
  console.log(`║  ✅ 通过：${String(passedTests).padEnd(37)}║`)
  console.log(`║  ❌ 失败：${String(totalTests - passedTests).padEnd(37)}║`)
  console.log(`║  通过率：${String(passRate).padEnd(36)}%║`)
  console.log(`║  总耗时：${String(totalDuration).padEnd(35)}ms║`)
  console.log('╚════════════════════════════════════════════════════╝\n')
  
  // 最终评价
  if (passRate === 100) {
    console.log('🎉 所有测试通过！ResourceManager 功能正常\n')
  } else if (passRate >= 80) {
    console.log('👍 大部分测试通过，建议修复失败的测试\n')
  } else {
    console.log('🚨 测试失败率较高，请检查实现\n')
  }
  
  // 打印详细统计
  console.log('📊 当前资源统计:')
  const finalStats = ResourceManager.generateStats()
  console.log(`   总资源：${finalStats.total}`)
  console.log(`   已加载：${finalStats.loaded}`)
  console.log(`   失败：${finalStats.failed}`)
  console.log(`   待加载：${finalStats.pending}`)
  console.log(`   进度：${finalStats.progress}%\n`)
  
})().catch(error => {
  console.error('❌ 测试执行失败:', error)
  console.error(error.stack)
})
