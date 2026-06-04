/**
 * 优化功能使用示例
 * 演示如何使用新添加的性能优化工具
 */

import { 
  ObjectPool, 
  PerformanceMonitor, 
  Logger, 
  globalLogger,
  LOG_LEVELS,
  clamp,
  distance,
  throttle,
  debounce,
  Storage,
  generateUniqueId
} from '../utilities';
import FloatingTextManager from '../objects/FloatingText/FloatingTextManager';
import HealthBarManager from '../objects/Managers/HealthBarManager';

// 创建模块日志器
const logger = globalLogger.createChild('ExampleScene');

export default class OptimizationExamples {
  constructor(scene) {
    this.scene = scene;
    
    // 1. 性能监控器
    this.perfMonitor = new PerformanceMonitor(scene, {
      enabled: true,
      showOverlay: false  // 开发时可设为 true
    });
    
    // 2. 浮动文本管理器
    this.floatingTextManager = new FloatingTextManager(scene);
    
    // 3. 血条管理器
    this.healthBarManager = new HealthBarManager(scene);
    
    // 4. 对象池示例（投射物）
    this.projectilePool = new ObjectPool(
      // 创建函数
      () => {
        return scene.add.circle(0, 0, 5, 0xff0000);
      },
      // 重置函数
      (projectile, x, y, targetX, targetY) => {
        projectile.setPosition(x, y);
        projectile.setVisible(true);
        projectile._targetX = targetX;
        projectile._targetY = targetY;
      },
      10  // 初始池大小
    );
    
    // 5. 节流和防抖示例
    this.handleMouseMove = throttle((pointer) => {
      logger.debug('Mouse moved:', pointer.x, pointer.y);
    }, 100);
    
    this.handleResize = debounce(() => {
      logger.info('Window resized');
    }, 300);
  }

  /**
   * 示例1：使用浮动文本显示伤害
   */
  showDamageExample(target, damage, isCrit = false) {
    this.floatingTextManager.show({
      text: isCrit ? `CRIT ${damage}!` : `${damage}`,
      x: target.x,
      y: target.y,
      position: 'above',
      animation: isCrit ? 'explode' : 'up',
      size: isCrit ? 3 : 1,
      color: isCrit ? 0xff0000 : 0xffffff,
      timeToLive: isCrit ? 1500 : 1000
    });
  }

  /**
   * 示例2：批量更新血条
   */
  updateAllHealthBars(characters) {
    // 开始批量更新
    this.healthBarManager.beginBatchUpdate();
    
    characters.forEach(character => {
      const id = character.getName() || generateUniqueId('char');
      
      // 更新血条值
      this.healthBarManager.updateValue(
        id, 
        character.stat.hp(), 
        character.stat.maxHp()
      );
      
      // 更新血条位置（跟随角色）
      this.healthBarManager.setPosition(
        id,
        character.x - 16,
        character.y - 20
      );
      
      // 根据战斗状态显示/隐藏
      const inCombat = character.combat.isInCombat();
      this.healthBarManager.setVisible(id, inCombat || character === this.scene.player);
    });
    
    // 结束批量更新并应用所有更改
    this.healthBarManager.endBatchUpdate();
  }

  /**
   * 示例3：使用对象池发射投射物
   */
  fireProjectile(fromX, fromY, toX, toY) {
    // 从池中获取投射物
    const projectile = this.projectilePool.get(fromX, fromY, toX, toY);
    
    // 计算移动方向
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const speed = 300;
    
    // 设置物理属性
    this.scene.physics.velocityFromRotation(angle, speed, projectile.body.velocity);
    
    // 到达目标后释放回池
    this.scene.time.delayedCall(1000, () => {
      projectile.setVisible(false);
      this.projectilePool.release(projectile);
    });
  }

  /**
   * 示例4：保存和加载游戏数据
   */
  saveGame(gameState) {
    const saveData = {
      timestamp: Date.now(),
      player: gameState.player.serialize(),
      inventory: gameState.player.inventory.getItems(),
      equipment: gameState.player.equipment.getEquippedItems(),
      questProgress: gameState.questLog?.getActiveQuests() || []
    };
    
    const success = Storage.set('rpg_savegame', saveData);
    
    if (success) {
      logger.info('Game saved successfully');
      this.showFloatingText('Game Saved!', 0x00ff00);
    } else {
      logger.error('Failed to save game');
      this.showFloatingText('Save Failed!', 0xff0000);
    }
  }

  loadGame() {
    const saveData = Storage.get('rpg_savegame');
    
    if (!saveData) {
      logger.warn('No save data found');
      return null;
    }
    
    logger.info('Game loaded from', new Date(saveData.timestamp).toLocaleString());
    return saveData;
  }

  /**
   * 示例5：性能监控和报告
   */
  startPerformanceMonitoring() {
    // 每秒记录一次性能数据
    this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        const stats = this.perfMonitor.getStats();
        
        // 如果FPS过低，发出警告
        if (stats.fps < 30) {
          logger.warn('Low FPS detected:', stats.fps);
        }
        
        // 如果内存使用过高，发出警告
        if (stats.memoryUsed > 200) {
          logger.warn('High memory usage:', stats.memoryUsed, 'MB');
        }
      },
      loop: true
    });
  }

  exportPerformanceReport() {
    const report = this.perfMonitor.exportReport();
    
    // 可以发送到服务器或保存到本地
    Storage.set('perf_report', report);
    logger.info('Performance report exported');
    
    return report;
  }

  /**
   * 示例6：使用工具函数
   */
  utilityFunctionsExample() {
    // 限制数值范围
    const health = clamp(150, 0, 100);  // 返回 100
    
    // 计算距离
    const dist = distance(0, 0, 3, 4);  // 返回 5
    
    // 随机选择
    const items = ['sword', 'shield', 'potion'];
    const randomItem = items[Math.floor(Math.random() * items.length)];
    
    // 生成唯一ID
    const uniqueId = generateUniqueId('item');  // "item_1234567890_abc123def"
    
    // 深拷贝对象
    const original = { a: 1, b: { c: 2 } };
    const copy = JSON.parse(JSON.stringify(original));  // 旧方法
    // 或使用我们的工具（支持更多类型）
    
    logger.debug('Utility examples completed');
  }

  /**
   * 示例7：日志系统高级用法
   */
  loggingExamples() {
    // 不同级别的日志
    logger.debug('Debug information');
    logger.info('Normal info');
    logger.warn('Warning message');
    logger.error('Error occurred');
    
    // 性能计时
    logger.time('expensive-operation');
    // ... 执行耗时操作 ...
    logger.timeEnd('expensive-operation');
    
    // 分组日志
    logger.group('Combat Round');
    logger.info('Player attacks');
    logger.info('Enemy counter-attacks');
    logger.groupEnd();
    
    // 断言
    logger.assert(health > 0, 'Health should be positive');
    
    // 表格输出
    logger.table([
      { name: 'Sword', damage: 10 },
      { name: 'Axe', damage: 15 }
    ]);
    
    // 导出日志
    const jsonLog = logger.exportToJSON();
    const csvLog = logger.exportToCSV();
  }

  /**
   * 示例8：显示浮动文本（简化版）
   */
  showFloatingText(text, color = 0xffffff) {
    this.floatingTextManager.show({
      text: text,
      position: 'below',
      color: color,
      fixedToCamera: true,
      timeToLive: 2000
    });
  }

  /**
   * 清理资源
   */
  destroy() {
    this.floatingTextManager.clearAll();
    this.healthBarManager.clearAll();
    this.projectilePool.releaseAll();
    this.perfMonitor.destroy();
    
    logger.info('Optimization examples cleaned up');
  }
}

// 在 DungeonScene 中的集成示例
/*
import OptimizationExamples from './path/to/OptimizationExamples';

export default class DungeonScene extends Phaser.Scene {
  create() {
    // ... 现有代码 ...
    
    // 初始化优化系统
    this.optimization = new OptimizationExamples(this);
    
    // 启动性能监控
    this.optimization.startPerformanceMonitoring();
  }
  
  update() {
    // ... 现有代码 ...
    
    // 批量更新血条
    const characters = this.characters.getChildren();
    this.optimization.updateAllHealthBars(characters);
  }
  
  // 在显示伤害时使用
  showDamage(target, damage, isCrit) {
    this.optimization.showDamageExample(target, damage, isCrit);
  }
}
*/
