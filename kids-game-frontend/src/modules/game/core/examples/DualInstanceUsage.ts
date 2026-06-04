import { LocalBattleModeDual } from '../modes/LocalBattleModeDual';
import { ArithmeticGameV2 } from '../../arithmetic/ArithmeticGameV2';

/**
 * 本地对抗模式 - 双独立实例示例
 * 
 * 演示如何使用 LocalBattleModeDual 创建两个完全隔离的游戏实例
 */

// ==================== 示例1：算数游戏本地对抗 ====================
async function exampleArithmeticLocalBattle() {
  console.log('=== 示例1：算数游戏本地对抗 ===');

  // 1. 创建模式
  const battleMode = new LocalBattleModeDual({
    splitType: 'vertical', // 垂直分屏（左/右）
  });

  // 2. 获取容器
  const container = document.getElementById('game-container');
  if (!container) {
    console.error('Container not found');
    return;
  }

  // 3. 初始化模式（设置物理切屏）
  await battleMode.initialize({}, container);

  // 4. 添加玩家
  battleMode.addPlayer({
    id: 'player1',
    name: '玩家1',
    score: 0,
    lives: 3,
    isReady: true,
  });

  battleMode.addPlayer({
    id: 'player2',
    name: '玩家2',
    score: 0,
    lives: 3,
    isReady: true,
  });

  // 5. 创建并启动两个独立游戏
  // 关键：游戏创建函数每次都创建新实例，确保隔离
  await battleMode.createAndStartGames(
    // 游戏创建函数（接收容器，返回新实例）
    (gameContainer: HTMLElement) => {
      return new ArithmeticGameV2(gameContainer);
    },
    // 玩家1的游戏配置
    {
      gameType: 'arithmetic',
      difficulty: 'medium',
      player: {
        id: 'player1',
        name: '玩家1',
      },
      timeLimit: 60,
    },
    // 玩家2的游戏配置
    {
      gameType: 'arithmetic',
      difficulty: 'medium',
      player: {
        id: 'player2',
        name: '玩家2',
      },
      timeLimit: 60,
    }
  );

  // 6. 监听规则判定事件
  battleMode.on('battle_end', (data: any) => {
    console.log('=== 对战结束 ===');
    console.log('获胜者:', data.winner);
    console.log('玩家1得分:', data.player1.score);
    console.log('玩家2得分:', data.player2.score);

    if (data.winner === 'player1') {
      alert(`🎉 玩家1获胜！(${data.player1.score} vs ${data.player2.score})`);
    } else if (data.winner === 'player2') {
      alert(`🎉 玩家2获胜！(${data.player2.score} vs ${data.player1.score})`);
    } else {
      alert(`🤝 平局！(${data.player1.score} vs ${data.player2.score})`);
    }
  });

  // 7. 控制按钮
  const pauseBtn = document.getElementById('pause-btn');
  const resumeBtn = document.getElementById('resume-btn');
  const restartBtn = document.getElementById('restart-btn');

  pauseBtn?.addEventListener('click', () => {
    battleMode.pauseGames();
  });

  resumeBtn?.addEventListener('click', () => {
    battleMode.resumeGames();
  });

  restartBtn?.addEventListener('click', () => {
    battleMode.restartGames();
  });

  // 8. 页面卸载时清理
  window.addEventListener('beforeunload', async () => {
    await battleMode.cleanup();
  });
}

// ==================== 示例2：实时查看两个游戏状态 ====================
async function exampleMonitorGameStates() {
  console.log('=== 示例2：实时监控游戏状态 ===');

  const battleMode = new LocalBattleModeDual({
    splitType: 'horizontal', // 水平分屏（上/下）
  });

  const container = document.getElementById('game-container');
  await battleMode.initialize({}, container);

  await battleMode.createAndStartGames(
    (gameContainer: HTMLElement) => new ArithmeticGameV2(gameContainer),
    { gameType: 'arithmetic', difficulty: 'easy', player: { id: 'player1', name: '玩家1' } },
    { gameType: 'arithmetic', difficulty: 'easy', player: { id: 'player2', name: '玩家2' } }
  );

  // 定时打印两个游戏的状态对比
  const monitorInterval = setInterval(() => {
    const combinedState = battleMode.getCombinedState();
    
    console.log('=== 状态对比 ===');
    console.log('玩家1:', {
      分数: combinedState.game1?.score || 0,
      生命: combinedState.game1?.lives || 0,
      活跃: combinedState.comparison?.player1Active ? '是' : '否',
    });
    
    console.log('玩家2:', {
      分数: combinedState.game2?.score || 0,
      生命: combinedState.game2?.lives || 0,
      活跃: combinedState.comparison?.player2Active ? '是' : '否',
    });
    
    console.log('差距:', {
      分数差: combinedState.comparison?.scoreDifference || 0,
      生命差: combinedState.comparison?.livesDifference || 0,
    });
  }, 2000);

  // 对战结束后停止监控
  battleMode.on('battle_end', () => {
    clearInterval(monitorInterval);
  });
}

// ==================== 示例3：动态调整难度 ====================
async function exampleDynamicDifficulty() {
  console.log('=== 示例3：动态调整难度 ===');

  const battleMode = new LocalBattleModeDual({ splitType: 'vertical' });
  const container = document.getElementById('game-container');
  await battleMode.initialize({}, container);

  // 玩家1用简单难度，玩家2用困难难度
  await battleMode.createAndStartGames(
    (gameContainer: HTMLElement) => new ArithmeticGameV2(gameContainer),
    { gameType: 'arithmetic', difficulty: 'easy', player: { id: 'player1', name: '新手玩家' } },
    { gameType: 'arithmetic', difficulty: 'hard', player: { id: 'player2', name: '高手玩家' } }
  );

  battleMode.on('battle_end', (data: any) => {
    console.log('=== 动态难度对战结束 ===');
    console.log('简单难度玩家得分:', data.player1.score);
    console.log('困难难度玩家得分:', data.player2.score);
    
    if (data.player1.score > data.player2.score) {
      console.log('新手玩家获胜！');
    } else {
      console.log('高手玩家获胜！');
    }
  });
}

// ==================== 示例4：多轮对战 ====================
async function exampleMultiRoundBattle() {
  console.log('=== 示例4：多轮对战 ===');

  const battleMode = new LocalBattleModeDual({ splitType: 'vertical' });
  const container = document.getElementById('game-container');
  await battleMode.initialize({}, container);

  let round = 1;
  const maxRounds = 3;
  const scores: { player1: number; player2: number } = { player1: 0, player2: 0 };

  const playRound = async () => {
    console.log(`=== 第 ${round} 轮 ===`);

    // 添加玩家
    battleMode.addPlayer({
      id: 'player1',
      name: '玩家1',
      score: 0,
      lives: 3,
      isReady: true,
    });

    battleMode.addPlayer({
      id: 'player2',
      name: '玩家2',
      score: 0,
      lives: 3,
      isReady: true,
    });

    // 创建游戏
    await battleMode.createAndStartGames(
      (gameContainer: HTMLElement) => new ArithmeticGameV2(gameContainer),
      { gameType: 'arithmetic', difficulty: 'medium', player: { id: 'player1', name: '玩家1' }, timeLimit: 30 },
      { gameType: 'arithmetic', difficulty: 'medium', player: { id: 'player2', name: '玩家2' }, timeLimit: 30 }
    );

    // 等待本轮结束
    return new Promise<void>((resolve) => {
      battleMode.once('battle_end', (data: any) => {
        // 累计得分
        scores.player1 += data.player1.score;
        scores.player2 += data.player2.score;
        
        console.log(`第 ${round} 轮结果: 玩家1=${data.player1.score}, 玩家2=${data.player2.score}`);
        console.log(`累计得分: 玩家1=${scores.player1}, 玩家2=${scores.player2}`);
        
        // 销毁游戏实例
        battleMode.destroyGames();
        
        // 下一轮
        round++;
        if (round <= maxRounds) {
          setTimeout(() => playRound(), 1000); // 1秒后开始下一轮
        } else {
          // 最终结果
          console.log('=== 最终结果 ===');
          if (scores.player1 > scores.player2) {
            console.log(`🏆 玩家1获胜！(${scores.player1} vs ${scores.player2})`);
          } else if (scores.player2 > scores.player1) {
            console.log(`🏆 玩家2获胜！(${scores.player2} vs ${scores.player1})`);
          } else {
            console.log(`🤝 平局！(${scores.player1} vs ${scores.player2})`);
          }
        }
        
        resolve();
      });
    });
  };

  await playRound();
}

// ==================== 导出示例 ====================
export {
  exampleArithmeticLocalBattle,
  exampleMonitorGameStates,
  exampleDynamicDifficulty,
  exampleMultiRoundBattle,
};

// ==================== HTML 模板（用于前端页面） ====================
export const battleModeTemplate = `
<div id="game-container" style="width: 100%; height: 80vh; position: relative;"></div>

<div style="margin-top: 20px; text-align: center;">
  <button id="pause-btn" style="padding: 10px 20px; margin: 0 10px; font-size: 16px;">
    ⏸️ 暂停
  </button>
  <button id="resume-btn" style="padding: 10px 20px; margin: 0 10px; font-size: 16px;">
    ▶️ 继续
  </button>
  <button id="restart-btn" style="padding: 10px 20px; margin: 0 10px; font-size: 16px;">
    🔄 重开
  </button>
</div>

<div id="status-display" style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
  <h3>对战状态</h3>
  <div id="player1-status">玩家1: 准备中...</div>
  <div id="player2-status">玩家2: 准备中...</div>
</div>
`;
