import { GameStatePanel } from '../components/GameStatePanel';
import { UnifiedModeManager } from '../manager/UnifiedModeManager';
import { GameModeType } from '../interfaces';
import { ArithmeticGameV2 } from '../../arithmetic/ArithmeticGameV2';

/**
 * 游戏状态面板使用示例
 */

// ==================== 示例1：单人模式状态面板 ====================
async function example1_SinglePlayerPanel() {
  console.log('=== 示例1：单人模式状态面板 ===');

  const container = document.getElementById('game-container');
  if (!container) return;

  // 1. 创建模式管理器
  const modeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);
  modeManager.setRuleConfig({
    aiDifficulty: 'medium',
    timeLimit: 60,
    maxLives: 3,
  });

  // 2. 创建状态面板
  const statePanel = new GameStatePanel({
    container: container,
    modeType: GameModeType.SINGLE_PLAYER,
    showPlayerInfo: true,
    showScore: true,
    showLives: true,
    showTime: true,
    showComparison: false, // 单人模式不需要对比
    refreshInterval: 1000,
  });

  // 3. 绑定模式管理器
  statePanel.bindModeManager(modeManager);

  // 4. 创建并启动游戏
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

  // 5. 监听游戏结束
  modeManager.on('player_won', (data) => {
    console.log('玩家获胜！', data);
    setTimeout(() => {
      statePanel.destroy();
    }, 3000);
  });
}

// ==================== 示例2：本地对抗模式状态面板 ====================
async function example2_LocalBattlePanel() {
  console.log('=== 示例2：本地对抗模式状态面板 ===');

  const container = document.getElementById('game-container');
  if (!container) return;

  // 1. 创建模式管理器
  const modeManager = new UnifiedModeManager(GameModeType.LOCAL_BATTLE);
  modeManager.setRuleConfig({
    timeLimit: 60,
    maxLives: 3,
  });

  // 2. 创建状态面板（启用对比）
  const statePanel = new GameStatePanel({
    container: container,
    modeType: GameModeType.LOCAL_BATTLE,
    showPlayerInfo: true,
    showScore: true,
    showLives: true,
    showTime: true,
    showComparison: true, // 对抗模式显示对比
    refreshInterval: 500, // 更快的刷新频率
  });

  // 3. 绑定模式管理器
  statePanel.bindModeManager(modeManager);

  // 4. 创建并启动游戏
  await modeManager.createGameInstances({
    gameCreator: (gameContainer) => new ArithmeticGameV2(gameContainer),
    container: container,
    playerConfigs: [
      {
        playerId: 'player1',
        name: '玩家1',
        config: { gameType: 'arithmetic', difficulty: 'medium' },
      },
      {
        playerId: 'player2',
        name: '玩家2',
        config: { gameType: 'arithmetic', difficulty: 'medium' },
      },
    ],
  });

  await modeManager.startAllGames();

  // 5. 监听对战结束
  modeManager.on('battle_ended', (data) => {
    console.log('对战结束！', data);
    setTimeout(() => {
      statePanel.destroy();
    }, 3000);
  });
}

// ==================== 示例3：多人模式状态面板 ====================
async function example3_MultiplayerPanel() {
  console.log('=== 示例3：多人模式状态面板 ===');

  const container = document.getElementById('game-container');
  if (!container) return;

  // 1. 创建模式管理器
  const modeManager = new UnifiedModeManager(GameModeType.MULTIPLAYER);
  modeManager.setRuleConfig({
    timeLimit: 90,
    maxLives: 2,
  });

  // 2. 创建状态面板
  const statePanel = new GameStatePanel({
    container: container,
    modeType: GameModeType.MULTIPLAYER,
    showPlayerInfo: true,
    showScore: true,
    showLives: true,
    showTime: true,
    showComparison: false, // 多人模式不需要对比
    refreshInterval: 800,
  });

  // 3. 绑定模式管理器
  statePanel.bindModeManager(modeManager);

  // 4. 创建并启动游戏（3个玩家）
  await modeManager.createGameInstances({
    gameCreator: (gameContainer) => new ArithmeticGameV2(gameContainer),
    container: container,
    playerConfigs: [
      {
        playerId: 'player1',
        name: '玩家1',
        config: { gameType: 'arithmetic' },
      },
      {
        playerId: 'player2',
        name: '玩家2',
        config: { gameType: 'arithmetic' },
      },
      {
        playerId: 'player3',
        name: '玩家3',
        config: { gameType: 'arithmetic' },
      },
    ],
  });

  await modeManager.startAllGames();

  // 5. 监听游戏结束
  modeManager.on('game_ended', (data) => {
    console.log('游戏结束！', data);
    setTimeout(() => {
      statePanel.destroy();
    }, 3000);
  });
}

// ==================== 示例4：自定义状态面板 ====================
async function example4_CustomizedPanel() {
  console.log('=== 示例4：自定义状态面板 ===');

  const container = document.getElementById('game-container');
  if (!container) return;

  const modeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);

  // 创建自定义面板
  const statePanel = new GameStatePanel({
    container: container,
    modeType: GameModeType.SINGLE_PLAYER,
    showPlayerInfo: true,  // 显示玩家信息
    showScore: true,        // 显示分数
    showLives: false,       // 不显示生命值
    showTime: false,        // 不显示时间
    showComparison: false,   // 不显示对比
    refreshInterval: 2000,   // 2秒刷新一次
  });

  statePanel.bindModeManager(modeManager);

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
}

// ==================== 示例5：动态切换显示内容 ====================
async function example5_DynamicPanel() {
  console.log('=== 示例5：动态切换显示内容 ===');

  const container = document.getElementById('game-container');
  if (!container) return;

  const modeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);

  // 创建面板
  const statePanel = new GameStatePanel({
    container: container,
    modeType: GameModeType.SINGLE_PLAYER,
    refreshInterval: 1000,
  });

  statePanel.bindModeManager(modeManager);

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

  // 添加控制按钮
  document.getElementById('toggle-lives-btn')?.addEventListener('click', () => {
    statePanel.updateConfig({ showLives: true });
    console.log('显示生命值');
  });

  document.getElementById('toggle-time-btn')?.addEventListener('click', () => {
    statePanel.updateConfig({ showTime: true });
    console.log('显示时间');
  });

  document.getElementById('hide-all-btn')?.addEventListener('click', () => {
    statePanel.updateConfig({
      showLives: false,
      showTime: false,
    });
    console.log('隐藏生命值和时间');
  });
}

// ==================== 示例6：显示/隐藏面板 ====================
async function example6_ShowHidePanel() {
  console.log('=== 示例6：显示/隐藏面板 ===');

  const container = document.getElementById('game-container');
  if (!container) return;

  const modeManager = new UnifiedModeManager(GameModeType.SINGLE_PLAYER);

  const statePanel = new GameStatePanel({
    container: container,
    modeType: GameModeType.SINGLE_PLAYER,
  });

  statePanel.bindModeManager(modeManager);

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

  // 控制按钮
  document.getElementById('show-panel-btn')?.addEventListener('click', () => {
    statePanel.show();
    console.log('显示面板');
  });

  document.getElementById('hide-panel-btn')?.addEventListener('click', () => {
    statePanel.hide();
    console.log('隐藏面板');
  });
}

// ==================== 示例7：完整的状态管理流程 ====================
async function example7_CompleteFlow() {
  console.log('=== 示例7：完整的状态管理流程 ===');

  const container = document.getElementById('game-container');
  if (!container) return;

  // 1. 选择模式
  const modeSelect = document.getElementById('mode-select') as HTMLSelectElement;
  const modeType: GameModeType = modeSelect?.value as GameModeType || GameModeType.SINGLE_PLAYER;

  // 2. 创建模式管理器
  const modeManager = new UnifiedModeManager(modeType);

  // 3. 根据模式设置规则
  if (modeType === GameModeType.SINGLE_PLAYER) {
    modeManager.setRuleConfig({
      aiDifficulty: 'medium',
      timeLimit: 60,
      maxLives: 3,
    });
  } else if (modeType === GameModeType.LOCAL_BATTLE) {
    modeManager.setRuleConfig({
      timeLimit: 60,
      maxLives: 3,
    });
  }

  // 4. 创建状态面板
  const statePanel = new GameStatePanel({
    container: container,
    modeType: modeType,
    showPlayerInfo: true,
    showScore: true,
    showLives: true,
    showTime: true,
    showComparison: modeType === GameModeType.LOCAL_BATTLE || modeType === GameModeType.ONLINE_BATTLE,
    refreshInterval: 1000,
  });

  statePanel.bindModeManager(modeManager);

  // 5. 根据模式创建游戏实例
  let playerConfigs: any[];

  if (modeType === GameModeType.SINGLE_PLAYER) {
    playerConfigs = [
      {
        playerId: 'player1',
        name: '玩家1',
        config: { gameType: 'arithmetic' },
      },
    ];
  } else if (modeType === GameModeType.LOCAL_BATTLE) {
    playerConfigs = [
      {
        playerId: 'player1',
        name: '玩家1',
        config: { gameType: 'arithmetic' },
      },
      {
        playerId: 'player2',
        name: '玩家2',
        config: { gameType: 'arithmetic' },
      },
    ];
  }

  await modeManager.createGameInstances({
    gameCreator: (gameContainer) => new ArithmeticGameV2(gameContainer),
    container: container,
    playerConfigs: playerConfigs,
  });

  await modeManager.startAllGames();

  // 6. 监听游戏结束
  if (modeType === GameModeType.SINGLE_PLAYER) {
    modeManager.on('player_won', (data) => {
      console.log('玩家获胜！', data);
      setTimeout(() => statePanel.destroy(), 5000);
    });
  } else if (modeType === GameModeType.LOCAL_BATTLE) {
    modeManager.on('battle_ended', (data) => {
      console.log('对战结束！', data);
      setTimeout(() => statePanel.destroy(), 5000);
    });
  }

  // 7. 页面卸载时清理
  window.addEventListener('beforeunload', () => {
    statePanel.destroy();
    modeManager.destroyAllGames();
  });
}

// ==================== 导出示例 ====================
export {
  example1_SinglePlayerPanel,
  example2_LocalBattlePanel,
  example3_MultiplayerPanel,
  example4_CustomizedPanel,
  example5_DynamicPanel,
  example6_ShowHidePanel,
  example7_CompleteFlow,
};

// ==================== HTML 模板 ====================
export const gameStatePanelTemplate = `
<div id="game-container" style="width: 100%; height: 80vh; position: relative; background: #f0f0f0;"></div>

<div style="margin-top: 20px; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
  <h3 style="margin: 0 0 15px 0; color: #333;">控制面板</h3>
  
  <div style="margin-bottom: 15px;">
    <label style="margin-right: 10px;">选择模式：</label>
    <select id="mode-select" style="padding: 8px; border-radius: 4px; border: 1px solid #ddd;">
      <option value="SINGLE_PLAYER">单人模式</option>
      <option value="LOCAL_BATTLE">本地对抗</option>
      <option value="MULTIPLAYER">多人模式</option>
    </select>
    <button id="start-game-btn" style="padding: 8px 16px; margin-left: 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
      开始游戏
    </button>
  </div>

  <div style="display: flex; gap: 10px; flex-wrap: wrap;">
    <button id="toggle-lives-btn" style="padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;">
      显示生命值
    </button>
    <button id="toggle-time-btn" style="padding: 8px 16px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer;">
      显示时间
    </button>
    <button id="hide-all-btn" style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
      隐藏额外信息
    </button>
    <button id="show-panel-btn" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
      显示面板
    </button>
    <button id="hide-panel-btn" style="padding: 8px 16px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer;">
      隐藏面板
    </button>
  </div>
</div>

<div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
  <h3 style="margin: 0 0 10px 0; color: #1976d2;">游戏状态面板特性</h3>
  <ul style="margin: 0; padding-left: 20px; color: #555;">
    <li>✅ 支持单人/多人/对战模式</li>
    <li>✅ 实时更新游戏状态</li>
    <li>✅ 自定义显示内容</li>
    <li>✅ 对抗模式显示对比</li>
    <li>✅ 可显示/隐藏面板</li>
  </ul>
</div>
`;
