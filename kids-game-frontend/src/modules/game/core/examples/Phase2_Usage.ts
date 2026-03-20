/**
 * 阶段2: 本地对抗模式使用示例
 * 
 * 展示如何使用本地对抗模式进行双人同屏对战
 */

import { UnifiedModeManager } from '../manager/UnifiedModeManager';
import { GameStatePanel } from '../components/GameStatePanel';
import { GameModeType } from '../interfaces';

// ==================== 示例1: 基础本地对抗 ====================
export async function example1_BasicLocalBattle() {
  console.log('=== 示例1: 基础本地对抗 ===');

  // 1. 创建模式管理器
  const modeManager = new UnifiedModeManager(GameModeType.LOCAL_BATTLE);

  // 2. 设置规则
  modeManager.setRuleConfig({
    timeLimit: 120, // 2分钟
    maxLives: 3,
    winScore: 100,
  });

  // 3. 创建游戏实例（需要实现游戏创建函数）
  const gameCreator = (container: HTMLElement) => {
    // 这里应该返回游戏实例
    // 例如：new ArithmeticGameV2(container);
    return {} as any;
  };

  await modeManager.createGameInstances({
    gameCreator,
    container: document.getElementById('game-container') as HTMLElement,
    playerConfigs: [
      { playerId: 'player1', name: '玩家1', config: { difficulty: 'easy' } },
      { playerId: 'player2', name: '玩家2', config: { difficulty: 'medium' } },
    ],
  });

  // 4. 启动游戏
  await modeManager.startAllGames();

  // 5. 监听对战结束
  modeManager.on('battle_ended', (data) => {
    console.log('对战结束:', data);
    const { winner, player1, player2 } = data;
    alert(`对战结束！\n${player1.name}: ${player1.score}分\n${player2.name}: ${player2.score}分\n${winner === 'draw' ? '平局!' : `获胜者: ${winner}`}`);
  });
}

// ==================== 示例2: 垂直分屏 ====================
export async function example2_VerticalSplitScreen() {
  console.log('=== 示例2: 垂直分屏 ===');

  const modeManager = new UnifiedModeManager(GameModeType.LOCAL_BATTLE);

  // 创建游戏实例（默认使用垂直分屏）
  await modeManager.createGameInstances({
    gameCreator: (container) => new (class Game {})() as any,
    container: document.getElementById('game-container') as HTMLElement,
    playerConfigs: [
      { playerId: 'player1', name: '玩家1', config: {} },
      { playerId: 'player2', name: '玩家2', config: {} },
    ],
  });

  // 垂直分屏布局：
  // +------------------+------------------+
  // |                  |                  |
  // |   玩家1区域      |   玩家2区域      |
  // |   (左侧50%)      |   (右侧50%)      |
  // |   粉色背景       |   青色背景       |
  // |                  |                  |
  // +------------------+------------------+

  await modeManager.startAllGames();
}

// ==================== 示例3: 水平分屏 ====================
export async function example3_HorizontalSplitScreen() {
  console.log('=== 示例3: 水平分屏 ===');

  const modeManager = new UnifiedModeManager(GameModeType.LOCAL_BATTLE);

  // 创建游戏实例（需要手动设置水平分屏）
  await modeManager.createGameInstances({
    gameCreator: (container) => new (class Game {})() as any,
    container: document.getElementById('game-container') as HTMLElement,
    playerConfigs: [
      { playerId: 'player1', name: '玩家1', config: {} },
      { playerId: 'player2', name: '玩家2', config: {} },
    ],
  });

  // 水平分屏布局：
  // +----------------------------------+
  // |                                  |
  // |   玩家1区域 (上半部分50%)         |
  // |   粉色背景                       |
  // +----------------------------------+
  // |                                  |
  // |   玩家2区域 (下半部分50%)         |
  // |   青色背景                       |
  // +----------------------------------+

  await modeManager.startAllGames();
}

// ==================== 示例4: 使用游戏状态面板 ====================
export async function example4_WithStatePanel() {
  console.log('=== 示例4: 使用游戏状态面板 ===');

  const modeManager = new UnifiedModeManager(GameModeType.LOCAL_BATTLE);
  const statePanel = new GameStatePanel({
    container: document.getElementById('state-panel-container') as HTMLElement,
    modeType: GameModeType.LOCAL_BATTLE,
    showPlayerInfo: true,
    showScore: true,
    showLives: true,
    showTime: true,
    showComparison: true, // 显示对战状态
    refreshInterval: 1000, // 每秒刷新
  });

  // 绑定模式管理器
  statePanel.bindModeManager(modeManager);

  // 创建游戏实例
  await modeManager.createGameInstances({
    gameCreator: (container) => new (class Game {})() as any,
    container: document.getElementById('game-container') as HTMLElement,
    playerConfigs: [
      { playerId: 'player1', name: '小明', config: { difficulty: 'easy' } },
      { playerId: 'player2', name: '小红', config: { difficulty: 'medium' } },
    ],
  });

  // 启动游戏
  await modeManager.startAllGames();

  // 状态面板会自动显示：
  // - 玩家信息（名称、头像等）
  // - 实时得分
  // - 生命值
  // - 游戏时间
  // - 对战状态（领先玩家、分数差、生命差）
}

// ==================== 示例5: 实时监控游戏状态 ====================
export async function example5_RealtimeMonitoring() {
  console.log('=== 示例5: 实时监控游戏状态 ===');

  const modeManager = new UnifiedModeManager(GameModeType.LOCAL_BATTLE);

  await modeManager.createGameInstances({
    gameCreator: (container) => new (class Game {})() as any,
    container: document.getElementById('game-container') as HTMLElement,
    playerConfigs: [
      { playerId: 'player1', name: '玩家1', config: {} },
      { playerId: 'player2', name: '玩家2', config: {} },
    ],
  });

  // 启动游戏
  await modeManager.startAllGames();

  // 每秒获取游戏状态
  const monitorInterval = setInterval(() => {
    const battleData = (modeManager as any).getLocalBattleData?.();
    
    if (battleData) {
      console.log('=== 游戏状态 ===');
      console.log(`${battleData.player1.name}: ${battleData.player1.score}分, ${battleData.player1.lives}生命`);
      console.log(`${battleData.player2.name}: ${battleData.player2.score}分, ${battleData.player2.lives}生命`);
      console.log(`游戏进行中: ${battleData.isRunning}`);
    }
  }, 1000);

  // 对战结束清理
  modeManager.on('battle_ended', () => {
    clearInterval(monitorInterval);
  });
}

// ==================== 示例6: 不同难度对战 ====================
export async function example6_DifferentDifficulty() {
  console.log('=== 示例6: 不同难度对战 ===');

  const modeManager = new UnifiedModeManager(GameModeType.LOCAL_BATTLE);

  await modeManager.createGameInstances({
    gameCreator: (container) => new (class Game {})() as any,
    container: document.getElementById('game-container') as HTMLElement,
    playerConfigs: [
      { 
        playerId: 'player1', 
        name: '小明（新手）', 
        config: { difficulty: 'easy', gameType: 'arithmetic' } 
      },
      { 
        playerId: 'player2', 
        name: '小红（高手）', 
        config: { difficulty: 'hard', gameType: 'arithmetic' } 
      },
    ],
  });

  await modeManager.startAllGames();

  // 两个玩家使用不同难度，公平性可能需要调整
  // 可以在规则判定中考虑难度系数
}

// ==================== 示例7: 差异化配置 ====================
export async function example7_CustomConfig() {
  console.log('=== 示例7: 差异化配置 ===');

  const modeManager = new UnifiedModeManager(GameModeType.LOCAL_BATTLE);

  // 为两个玩家设置不同的配置
  await modeManager.createGameInstances({
    gameCreator: (container) => new (class Game {})() as any,
    container: document.getElementById('game-container') as HTMLElement,
    playerConfigs: [
      {
        playerId: 'player1',
        name: '玩家1',
        config: {
          gameType: 'arithmetic',
          difficulty: 'medium',
          timePerQuestion: 10,
          maxQuestions: 10,
        },
      },
      {
        playerId: 'player2',
        name: '玩家2',
        config: {
          gameType: 'arithmetic',
          difficulty: 'hard',
          timePerQuestion: 8,
          maxQuestions: 15,
        },
      },
    ],
  });

  await modeManager.startAllGames();
}

// ==================== 示例8: 胜负判定规则 ====================
export async function example8_WinnerDetermination() {
  console.log('=== 示例8: 胜负判定规则 ===');

  const modeManager = new UnifiedModeManager(GameModeType.LOCAL_BATTLE);

  await modeManager.createGameInstances({
    gameCreator: (container) => new (class Game {})() as any,
    container: document.getElementById('game-container') as HTMLElement,
    playerConfigs: [
      { playerId: 'player1', name: '玩家1', config: {} },
      { playerId: 'player2', name: '玩家2', config: {} },
    ],
  });

  await modeManager.startAllGames();

  // 监听对战结束事件
  modeManager.on('battle_ended', (data) => {
    console.log('=== 对战结果 ===');
    console.log('获胜者:', data.winner);
    console.log('获胜原因:', data.reason);

    // reason 可能的值：
    // - 'player1_lives_depleted': 玩家1生命值耗尽，玩家2获胜
    // - 'player2_lives_depleted': 玩家2生命值耗尽，玩家1获胜
    // - 'both_lives_depleted': 两人都耗尽，平局
    // - 'score_comparison': 分数对比
    // - 'score_tie': 分数相同，平局

    if (data.winner === 'draw') {
      console.log('平局！');
    } else {
      console.log(`${data.winner} 获胜！`);
    }

    console.log('玩家1得分:', data.player1.score);
    console.log('玩家2得分:', data.player2.score);
  });
}

// ==================== 示例9: 多轮对战 ====================
export async function example9_MultiRound() {
  console.log('=== 示例9: 多轮对战 ===');

  const modeManager = new UnifiedModeManager(GameModeType.LOCAL_BATTLE);
  let round = 1;
  const scores = { player1: 0, player2: 0 };

  // 开始一轮对战
  async function startRound() {
    console.log(`=== 第 ${round} 轮对战 ===`);

    await modeManager.createGameInstances({
      gameCreator: (container) => new (class Game {})() as any,
      container: document.getElementById('game-container') as HTMLElement,
      playerConfigs: [
        { playerId: 'player1', name: '玩家1', config: {} },
        { playerId: 'player2', name: '玩家2', config: {} },
      ],
    });

    await modeManager.startAllGames();
  }

  // 监听对战结束
  modeManager.on('battle_ended', (data) => {
    if (data.winner === 'player1') {
      scores.player1++;
    } else if (data.winner === 'player2') {
      scores.player2++;
    }

    console.log(`第 ${round} 轮结束: 玩家1 ${scores.player1} - 玩家2 ${scores.player2}`);

    // 清理当前轮
    modeManager.destroyAllGames();

    // 开始下一轮
    round++;
    if (round <= 3) {
      setTimeout(startRound, 2000);
    } else {
      // 最终结果
      console.log('=== 最终结果 ===');
      console.log(`玩家1: ${scores.player1} 胜`);
      console.log(`玩家2: ${scores.player2} 胜`);
      
      if (scores.player1 > scores.player2) {
        alert('玩家1 获得最终胜利！');
      } else if (scores.player2 > scores.player1) {
        alert('玩家2 获得最终胜利！');
      } else {
        alert('最终平局！');
      }
    }
  });

  // 开始第一轮
  await startRound();
}

// ==================== 示例10: 完整流程 ====================
export async function example10_CompleteFlow() {
  console.log('=== 示例10: 完整流程 ===');

  const container = document.getElementById('game-container') as HTMLElement;
  const statePanelContainer = document.getElementById('state-panel-container') as HTMLElement;

  // 1. 创建模式管理器
  const modeManager = new UnifiedModeManager(GameModeType.LOCAL_BATTLE);

  // 2. 创建游戏状态面板
  const statePanel = new GameStatePanel({
    container: statePanelContainer,
    modeType: GameModeType.LOCAL_BATTLE,
    showPlayerInfo: true,
    showScore: true,
    showLives: true,
    showTime: true,
    showComparison: true,
    refreshInterval: 1000,
  });

  // 3. 绑定模式管理器
  statePanel.bindModeManager(modeManager);

  // 4. 设置游戏规则
  modeManager.setRuleConfig({
    timeLimit: 120,
    maxLives: 3,
    winScore: 100,
  });

  // 5. 创建游戏实例
  await modeManager.createGameInstances({
    gameCreator: (container) => new (class Game {})() as any,
    container: container,
    playerConfigs: [
      { playerId: 'player1', name: '玩家1', config: { difficulty: 'medium' } },
      { playerId: 'player2', name: '玩家2', config: { difficulty: 'medium' } },
    ],
  });

  // 6. 启动游戏
  await modeManager.startAllGames();

  // 7. 监听游戏事件
  modeManager.on('game_started', (data) => {
    console.log('游戏开始:', data);
  });

  modeManager.on('score_updated', (data) => {
    console.log('分数更新:', data);
  });

  modeManager.on('battle_ended', (data) => {
    console.log('对战结束:', data);
    
    // 显示结果
    const result = `
      对战结束！
      
      ${data.player1.name}: ${data.player1.score}分
      ${data.player2.name}: ${data.player2.score}分
      
      ${data.winner === 'draw' ? '平局！' : `获胜者: ${data.winner}`}
      原因: ${data.reason}
    `;
    alert(result);

    // 清理
    statePanel.destroy();
    modeManager.destroyAllGames();
  });

  console.log('本地对抗游戏已启动！');
}

// ==================== 导出所有示例 ====================
export const LocalBattleExamples = {
  example1_BasicLocalBattle,
  example2_VerticalSplitScreen,
  example3_HorizontalSplitScreen,
  example4_WithStatePanel,
  example5_RealtimeMonitoring,
  example6_DifferentDifficulty,
  example7_CustomConfig,
  example8_WinnerDetermination,
  example9_MultiRound,
  example10_CompleteFlow,
};

// ==================== HTML模板 ====================
export const LocalBattleHTMLTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>本地对抗模式示例</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
    }
    #game-container {
      width: 100vw;
      height: 100vh;
      position: relative;
    }
    #state-panel-container {
      position: absolute;
      top: 70px;
      right: 20px;
      z-index: 1000;
    }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <div id="state-panel-container"></div>
  
  <script>
    // 运行示例
    import { LocalBattleExamples } from './Phase2_Usage.ts';
    LocalBattleExamples.example10_CompleteFlow();
  </script>
</body>
</html>
`;
