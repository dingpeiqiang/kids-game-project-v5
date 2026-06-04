import { UnifiedModeManager } from '../manager/UnifiedModeManager';
import { GameModeType } from '../interfaces';
import { ArithmeticGameV2 } from '../../arithmetic/ArithmeticGameV2';

/**
 * 阶段1使用示例 - 单人模式基础架构
 */

// ==================== 示例1：基础单人模式 ====================
async function example1_BasicSinglePlayer() {
  console.log('=== 示例1：基础单人模式 ===');

  // 1. 创建模式管理器
  const modeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);

  // 2. 设置游戏规则
  modeManager.setRuleConfig({
    aiDifficulty: 'medium',
    timeLimit: 60,
    maxLives: 3,
    winScore: 100,
  });

  // 3. 获取容器
  const container = document.getElementById('game-container');
  if (!container) {
    console.error('Container not found');
    return;
  }

  // 4. 创建游戏实例（1个游戏实例 + 1个玩家）
  const gameInstances = await modeManager.createGameInstances({
    gameCreator: (gameContainer) => new ArithmeticGameV2(gameContainer),
    container: container,
    playerConfigs: [
      {
        playerId: 'player1',
        name: '玩家1',
        config: {
          gameType: 'arithmetic',
          difficulty: 'medium',
        },
      },
    ],
  });

  console.log(`创建的游戏实例数量: ${gameInstances.length}`);
  console.log(`游戏实例ID: ${gameInstances[0].id}`);
  console.log(`关联的玩家: ${gameInstances[0].playerIds.join(', ')}`);

  // 5. 启动游戏
  await modeManager.startAllGames();

  // 6. 监听游戏事件
  modeManager.on('game_started', (data) => {
    console.log('游戏已启动:', data);
  });

  modeManager.on('score_changed', (data) => {
    console.log('分数变化:', data);
  });

  modeManager.on('game_state_changed', (data) => {
    console.log('游戏状态变化:', data);
  });

  modeManager.on('game_ended', (data) => {
    console.log('游戏结束:', data);
    console.log('最终得分:', data.result.score);
  });

  modeManager.on('player_won', (data) => {
    console.log('玩家获胜！', data);
    alert(`🎉 恭喜 ${data.playerId} 获胜！得分: ${data.score}`);
  });
}

// ==================== 示例2：控制游戏生命周期 ====================
async function example2_GameLifecycle() {
  console.log('=== 示例2：控制游戏生命周期 ===');

  const modeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);
  modeManager.setRuleConfig({
    aiDifficulty: 'easy',
    timeLimit: 30,
  });

  const container = document.getElementById('game-container');
  if (!container) return;

  await modeManager.createGameInstances({
    gameCreator: (gameContainer) => new ArithmeticGameV2(gameContainer),
    container: container,
    playerConfigs: [
      {
        playerId: 'player1',
        name: '玩家1',
        config: { gameType: 'arithmetic' },
      },
    ],
  });

  // 启动游戏
  await modeManager.startAllGames();
  console.log('✅ 游戏已启动');

  // 10秒后暂停
  setTimeout(async () => {
    await modeManager.pauseAllGames();
    console.log('⏸️ 游戏已暂停');
  }, 10000);

  // 15秒后恢复
  setTimeout(async () => {
    await modeManager.resumeAllGames();
    console.log('▶️ 游戏已恢复');
  }, 15000);

  // 20秒后重启
  setTimeout(async () => {
    await modeManager.restartAllGames();
    console.log('🔄 游戏已重启');
  }, 20000);

  // 30秒后停止
  setTimeout(async () => {
    await modeManager.stopAllGames();
    console.log('⏹️ 游戏已停止');
  }, 30000);

  // 35秒后销毁
  setTimeout(async () => {
    await modeManager.destroyAllGames();
    console.log('🗑️ 游戏已销毁');
  }, 35000);
}

// ==================== 示例3：实时监控游戏状态 ====================
async function example3_RealtimeMonitoring() {
  console.log('=== 示例3：实时监控游戏状态 ===');

  const modeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);
  modeManager.setRuleConfig({
    aiDifficulty: 'medium',
    timeLimit: 60,
    maxLives: 3,
  });

  const container = document.getElementById('game-container');
  if (!container) return;

  await modeManager.createGameInstances({
    gameCreator: (gameContainer) => new ArithmeticGameV2(gameContainer),
    container: container,
    playerConfigs: [
      {
        playerId: 'player1',
        name: '玩家1',
        config: { gameType: 'arithmetic' },
      },
    ],
  });

  await modeManager.startAllGames();

  // 定时打印游戏状态
  const monitorInterval = setInterval(() => {
    const stats = modeManager.getStatistics();
    const gameInstanceId = stats.gameStates[0][0];
    const gameState = stats.gameStates[0][1];

    console.log('=== 游戏状态 ===');
    console.log('模式类型:', stats.modeType);
    console.log('玩家数量:', stats.playerCount);
    console.log('游戏实例数量:', stats.gameInstanceCount);
    console.log('玩家信息:', stats.players);
    console.log('游戏状态:', gameState);
    console.log('规则配置:', stats.ruleConfig);
    console.log('------------------');
  }, 3000);

  // 游戏结束后停止监控
  modeManager.once('game_ended', () => {
    clearInterval(monitorInterval);
    console.log('游戏结束，停止监控');
  });
}

// ==================== 示例4：获取玩家和游戏实例信息 ====================
async function example4_GetInfo() {
  console.log('=== 示例4：获取玩家和游戏实例信息 ===');

  const modeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);

  const container = document.getElementById('game-container');
  if (!container) return;

  await modeManager.createGameInstances({
    gameCreator: (gameContainer) => new ArithmeticGameV2(gameContainer),
    container: container,
    playerConfigs: [
      {
        playerId: 'player1',
        name: '玩家1',
        config: { gameType: 'arithmetic' },
      },
    ],
  });

  // 获取玩家信息
  const player = modeManager.getPlayer('player1');
  console.log('玩家信息:', player);

  // 获取所有玩家
  const allPlayers = modeManager.getAllPlayers();
  console.log('所有玩家:', allPlayers);

  // 获取游戏实例
  const gameInstance = modeManager.getGameInstance('game_single');
  console.log('游戏实例:', gameInstance);

  // 获取所有游戏实例
  const allGameInstances = modeManager.getAllGameInstances();
  console.log('所有游戏实例:', allGameInstances);

  // 获取游戏状态
  const gameState = modeManager.getGameState('game_single');
  console.log('游戏状态:', gameState);

  // 获取所有游戏状态
  const allGameStates = modeManager.getAllGameStates();
  console.log('所有游戏状态:', allGameStates);

  // 获取统计信息
  const stats = modeManager.getStatistics();
  console.log('统计信息:', stats);
}

// ==================== 示例5：不同难度的单人模式 ====================
async function example5_DifferentDifficulties() {
  console.log('=== 示例5：不同难度的单人模式 ===');

  // 简单难度
  const easyModeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);
  easyModeManager.setRuleConfig({
    aiDifficulty: 'easy',
    aiResponseDelay: 2000, // AI响应延迟2秒
    timeLimit: 60,
    maxLives: 5,
  });

  // 中等难度
  const mediumModeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);
  mediumModeManager.setRuleConfig({
    aiDifficulty: 'medium',
    aiResponseDelay: 1500, // AI响应延迟1.5秒
    timeLimit: 60,
    maxLives: 3,
  });

  // 困难难度
  const hardModeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);
  hardModeManager.setRuleConfig({
    aiDifficulty: 'hard',
    aiResponseDelay: 1000, // AI响应延迟1秒
    timeLimit: 60,
    maxLives: 1,
  });

  console.log('简单难度配置:', easyModeManager.getRuleConfig());
  console.log('中等难度配置:', mediumModeManager.getRuleConfig());
  console.log('困难难度配置:', hardModeManager.getRuleConfig());
}

// ==================== 示例6：清理资源 ====================
async function example6_Cleanup() {
  console.log('=== 示例6：清理资源 ===');

  const modeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);

  const container = document.getElementById('game-container');
  if (!container) return;

  await modeManager.createGameInstances({
    gameCreator: (gameContainer) => new ArithmeticGameV2(gameContainer),
    container: container,
    playerConfigs: [
      {
        playerId: 'player1',
        name: '玩家1',
        config: { gameType: 'arithmetic' },
      },
    ],
  });

  await modeManager.startAllGames();

  // 页面卸载时清理资源
  window.addEventListener('beforeunload', async () => {
    console.log('页面即将卸载，清理资源...');
    await modeManager.destroyAllGames();
    console.log('✅ 资源清理完成');
  });

  // 或者手动清理
  const cleanupBtn = document.getElementById('cleanup-btn');
  cleanupBtn?.addEventListener('click', async () => {
    console.log('手动清理资源...');
    await modeManager.destroyAllGames();
    console.log('✅ 资源清理完成');
    alert('游戏资源已清理');
  });
}

// ==================== 示例7：完整的单人游戏流程 ====================
async function example7_CompleteFlow() {
  console.log('=== 示例7：完整的单人游戏流程 ===');

  const modeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);

  // 1. 配置规则
  modeManager.setRuleConfig({
    aiDifficulty: 'medium',
    timeLimit: 60,
    maxLives: 3,
    winScore: 100,
  });

  // 2. 创建游戏
  const container = document.getElementById('game-container');
  if (!container) return;

  const gameInstances = await modeManager.createGameInstances({
    gameCreator: (gameContainer) => new ArithmeticGameV2(gameContainer),
    container: container,
    playerConfigs: [
      {
        playerId: 'player1',
        name: '玩家1',
        config: { gameType: 'arithmetic' },
      },
    ],
  });

  // 3. 设置事件监听
  modeManager.on('game_started', () => {
    console.log('🎮 游戏开始！');
    updateStatus('游戏进行中...');
  });

  modeManager.on('score_changed', (data) => {
    console.log(`💰 得分: ${data.score}`);
    updateScore(data.score);
  });

  modeManager.on('game_state_changed', (data) => {
    console.log('📊 状态更新:', data);
    updateLives(data.state.lives);
  });

  modeManager.on('game_ended', (data) => {
    console.log('🏁 游戏结束', data);
    updateStatus('游戏结束');
  });

  modeManager.on('player_won', (data) => {
    console.log('🏆 获胜！', data);
    alert(`🎉 恭喜 ${data.playerId} 获胜！\n得分: ${data.score}`);
  });

  // 4. 启动游戏
  await modeManager.startAllGames();

  // 5. 添加控制按钮
  document.getElementById('pause-btn')?.addEventListener('click', async () => {
    await modeManager.pauseAllGames();
    updateStatus('游戏已暂停');
  });

  document.getElementById('resume-btn')?.addEventListener('click', async () => {
    await modeManager.resumeAllGames();
    updateStatus('游戏进行中...');
  });

  document.getElementById('restart-btn')?.addEventListener('click', async () => {
    await modeManager.restartAllGames();
    updateStatus('游戏重新开始');
  });

  // 6. 页面卸载时清理
  window.addEventListener('beforeunload', async () => {
    await modeManager.destroyAllGames();
  });

  // 辅助函数
  function updateStatus(text: string) {
    const statusEl = document.getElementById('status-display');
    if (statusEl) statusEl.textContent = text;
  }

  function updateScore(score: number) {
    const scoreEl = document.getElementById('score-display');
    if (scoreEl) scoreEl.textContent = `得分: ${score}`;
  }

  function updateLives(lives: number) {
    const livesEl = document.getElementById('lives-display');
    if (livesEl) livesEl.textContent = `生命: ${lives}`;
  }
}

// ==================== 导出示例 ====================
export {
  example1_BasicSinglePlayer,
  example2_GameLifecycle,
  example3_RealtimeMonitoring,
  example4_GetInfo,
  example5_DifferentDifficulties,
  example6_Cleanup,
  example7_CompleteFlow,
};

// ==================== HTML 模板 ====================
export const phase1Template = `
<div id="game-container" style="width: 100%; height: 80vh; position: relative; background: #f0f0f0;"></div>

<div style="margin-top: 20px; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
    <div>
      <span id="status-display" style="font-size: 18px; font-weight: bold;">准备中...</span>
    </div>
    <div>
      <span id="score-display" style="margin-right: 20px; font-size: 16px;">得分: 0</span>
      <span id="lives-display" style="font-size: 16px;">生命: 3</span>
    </div>
  </div>

  <div style="display: flex; justify-content: center; gap: 10px;">
    <button id="pause-btn" style="padding: 10px 20px; font-size: 16px; border: none; border-radius: 5px; background: #ff9800; color: white; cursor: pointer;">
      ⏸️ 暂停
    </button>
    <button id="resume-btn" style="padding: 10px 20px; font-size: 16px; border: none; border-radius: 5px; background: #4caf50; color: white; cursor: pointer;">
      ▶️ 继续
    </button>
    <button id="restart-btn" style="padding: 10px 20px; font-size: 16px; border: none; border-radius: 5px; background: #2196f3; color: white; cursor: pointer;">
      🔄 重开
    </button>
    <button id="cleanup-btn" style="padding: 10px 20px; font-size: 16px; border: none; border-radius: 5px; background: #f44336; color: white; cursor: pointer;">
      🗑️ 清理
    </button>
  </div>
</div>

<div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
  <h3 style="margin: 0 0 10px 0; color: #1976d2;">阶段1：单人模式基础架构</h3>
  <ul style="margin: 0; padding-left: 20px; color: #555;">
    <li>✅ 统一模式管理器</li>
    <li>✅ 单人模式策略（1个游戏实例 + 1个玩家）</li>
    <li>✅ 游戏实例生命周期管理</li>
    <li>✅ 数据收集和规则判定</li>
  </ul>
</div>
`;
