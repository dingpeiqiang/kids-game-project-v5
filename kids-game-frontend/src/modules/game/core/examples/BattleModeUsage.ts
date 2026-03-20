/**
 * 对战模式使用示例
 *
 * 演示如何使用 LocalBattleMode 和 OnlineBattleMode 进行对战
 */

import { LocalBattleMode, OnlineBattleMode, GameModeType } from '../../core/modes';
import { Player } from '../../core/interfaces';
import { ArithmeticGameV2 } from '../../arithmetic/ArithmeticGameV2';

// ============================================================================
// 示例1: 本地对抗模式（单机多人）
// ============================================================================

/**
 * 本地对抗模式设置
 *
 * 场景：两个玩家在同一台设备上对战
 * - 玩家1 使用 WASD 键
 * - 玩家2 使用方向键
 */
async function setupLocalBattleMode() {
  console.log('=== 设置本地对抗模式 ===');

  // 1. 创建本地对抗模式实例
  const battleMode = new LocalBattleMode({
    modeType: GameModeType.LOCAL_BATTLE,
    modeName: 'Local Battle',
    maxPlayers: 2,
    supportAI: false,
  });

  // 初始化模式
  await battleMode.initialize({
    modeType: GameModeType.LOCAL_BATTLE,
    modeName: 'Local Battle',
    maxPlayers: 2,
    supportAI: false,
  });

  // 2. 创建玩家1
  const player1: Player = {
    id: 'player1',
    name: 'Player 1',
    score: 0,
    lives: 3,
    isReady: true,
    properties: {
      inputKeys: ['W', 'A', 'S', 'D'],  // 玩家1的按键
      color: '#FF6B9D',
    },
  };

  // 3. 创建玩家2
  const player2: Player = {
    id: 'player2',
    name: 'Player 2',
    score: 0,
    lives: 3,
    isReady: true,
    properties: {
      inputKeys: ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'],  // 玩家2的按键
      color: '#4ECDC4',
    },
  };

  // 4. 添加玩家到模式
  battleMode.addPlayer(player1);
  battleMode.addPlayer(player2);

  // 5. 创建一个游戏实例（注意：只需要一个！）
  const game = new ArithmeticGameV2('game-container');

  // 6. 初始化游戏
  await game.initialize(game.getGameConfig(), battleMode);

  // 7. 添加玩家到游戏的玩家状态服务
  const playerStateService = game.getPlayerStateService();
  playerStateService.addPlayer(player1);
  playerStateService.addPlayer(player2);

  // 8. 启动游戏
  game.start();

  // 9. 处理玩家输入
  // 当玩家1操作时
  const input1 = {
    playerId: 'player1',
    action: 'answer',
    answer: 5,  // 玩家1选择答案5
    timestamp: Date.now(),
  };

  battleMode.handlePlayerAction('player1', input1);

  // 当玩家2操作时
  const input2 = {
    playerId: 'player2',
    action: 'answer',
    answer: 7,  // 玩家2选择答案7
    timestamp: Date.now(),
  };

  battleMode.handlePlayerAction('player2', input2);

  console.log('本地对抗模式设置完成！');
  console.log('当前玩家:', battleMode.getPlayers());
  console.log('当前回合:', battleMode.getCurrentTurnPlayerId());

  return { game, battleMode };
}

// ============================================================================
// 示例2: 网络对抗模式（在线对战）
// ============================================================================

/**
 * 网络对抗模式设置
 *
 * 场景：两个玩家在不同设备上通过互联网对战
 * - 每个设备只需要一个游戏实例
 * - 模式负责网络通信和状态同步
 */
async function setupOnlineBattleMode(isHost: boolean) {
  console.log('=== 设置网络对抗模式 ===');
  console.log(`角色: ${isHost ? '主机' : '客机'}`);

  // 1. 创建网络对抗模式实例
  const onlineMode = new OnlineBattleMode({
    modeType: GameModeType.ONLINE_BATTLE,
    modeName: 'Online Battle',
    maxPlayers: 2,
    supportAI: false,
    roomId: 'room_' + Date.now(),  // 房间ID
    serverUrl: 'ws://localhost:8080',
  });

  // 初始化模式
  await onlineMode.initialize({
    modeType: GameModeType.ONLINE_BATTLE,
    modeName: 'Online Battle',
    maxPlayers: 2,
    supportAI: false,
    roomId: 'room_' + Date.now(),
    serverUrl: 'ws://localhost:8080',
  });

  // 2. 创建本地玩家（每个设备只有自己的玩家）
  const localPlayer: Player = {
    id: isHost ? 'host_player' : 'guest_player',
    name: isHost ? 'Host Player' : 'Guest Player',
    score: 0,
    lives: 3,
    isReady: true,
    properties: {
      isHost: isHost,
    },
  };

  // 3. 设置本地玩家
  onlineMode.setLocalPlayer(localPlayer);
  onlineMode.addPlayer(localPlayer);

  // 4. 创建对手玩家（远程玩家，由网络同步）
  const remotePlayer: Player = {
    id: isHost ? 'guest_player' : 'host_player',
    name: isHost ? 'Guest Player' : 'Host Player',
    score: 0,
    lives: 3,
    isReady: false,  // 等待远程连接
    properties: {
      isHost: !isHost,
    },
  };

  onlineMode.setOpponent(remotePlayer);

  // 5. 创建游戏实例（每个设备一个）
  const game = new ArithmeticGameV2('game-container');

  // 6. 初始化游戏
  await game.initialize(game.getGameConfig(), onlineMode);

  // 7. 添加本地玩家到游戏的玩家状态服务
  const playerStateService = game.getPlayerStateService();
  playerStateService.addPlayer(localPlayer);

  // 8. 订阅网络事件
  onlineMode.on('opponent_move', (data) => {
    console.log('对手移动:', data);
    // 渲染对手的操作
  });

  onlineMode.on('opponent_score_change', (data) => {
    console.log('对手分数变化:', data);
    // 更新对手分数显示
  });

  onlineMode.on('opponent_lives_change', (data) => {
    console.log('对手生命值变化:', data);
    // 更新对手生命值显示
  });

  onlineMode.on('network_game_over', (data) => {
    console.log('游戏结束:', data);
    // 显示游戏结束界面
  });

  // 9. 启动游戏（会自动连接服务器）
  try {
    await onlineMode.start();
    game.start();

    console.log('网络连接成功！');
    console.log('本地玩家:', onlineMode.getLocalPlayer());
    console.log('网络延迟:', onlineMode.getLatency(), 'ms');
  } catch (error) {
    console.error('网络连接失败:', error);
  }

  // 10. 处理本地玩家输入
  const localInput = {
    playerId: localPlayer.id,
    action: 'answer',
    answer: 5,
    timestamp: Date.now(),
  };

  // 通过模式处理操作，模式会自动同步给对手
  battleMode.handlePlayerAction(localPlayer.id, localInput);

  console.log('网络对抗模式设置完成！');

  return { game, onlineMode };
}

// ============================================================================
// 示例3: 组队模式（4人对战）
// ============================================================================

/**
 * 组队模式设置
 *
 * 场景：4个玩家分成2个队伍对战
 * - 队伍1: 玩家1 + 玩家2
 * - 队伍2: 玩家3 + 玩家4
 */
async function setupTeamMode() {
  console.log('=== 设置组队模式 ===');

  // 1. 创建组队模式实例
  const teamMode = new TeamMode({
    modeType: GameModeType.TEAM,
    modeName: 'Team Battle',
    maxPlayers: 4,
    supportAI: false,
    teamCount: 2,
  });

  // 初始化模式
  await teamMode.initialize({
    modeType: GameModeType.TEAM,
    modeName: 'Team Battle',
    maxPlayers: 4,
    supportAI: false,
    teamCount: 2,
  });

  // 2. 创建4个玩家
  const players: Player[] = [
    {
      id: 'player1',
      name: 'Player 1',
      score: 0,
      lives: 3,
      isReady: true,
    },
    {
      id: 'player2',
      name: 'Player 2',
      score: 0,
      lives: 3,
      isReady: true,
    },
    {
      id: 'player3',
      name: 'Player 3',
      score: 0,
      lives: 3,
      isReady: true,
    },
    {
      id: 'player4',
      name: 'Player 4',
      score: 0,
      lives: 3,
      isReady: true,
    },
  ];

  // 3. 添加玩家到模式
  players.forEach(player => teamMode.addPlayer(player));

  // 4. 分配玩家到队伍
  teamMode.assignPlayerToTeam('player1', 'team_1');
  teamMode.assignPlayerToTeam('player2', 'team_1');
  teamMode.assignPlayerToTeam('player3', 'team_2');
  teamMode.assignPlayerToTeam('player4', 'team_2');

  // 5. 创建游戏实例（仍然只需要一个！）
  const game = new ArithmeticGameV2('game-container');

  // 6. 初始化游戏
  await game.initialize(game.getGameConfig(), teamMode);

  // 7. 添加所有玩家到游戏的玩家状态服务
  const playerStateService = game.getPlayerStateService();
  players.forEach(player => playerStateService.addPlayer(player));

  // 8. 启动游戏
  game.start();

  // 9. 处理玩家输入
  teamMode.handlePlayerAction('player1', { action: 'move', direction: 'left' });
  teamMode.handlePlayerAction('player3', { action: 'move', direction: 'right' });

  // 10. 查看队伍信息
  const teams = teamMode.getTeams();
  console.log('队伍信息:', teams);

  const teamRanking = teamMode.getTeamRanking();
  console.log('队伍排名:', teamRanking);

  console.log('组队模式设置完成！');

  return { game, teamMode };
}

// ============================================================================
// 示例4: 模式切换
// ============================================================================

/**
 * 模式切换示例
 *
 * 演示如何在不同模式之间切换
 */
async function switchModeExample() {
  console.log('=== 模式切换示例 ===');

  // 1. 创建游戏
  const game = new ArithmeticGameV2('game-container');

  // 2. 创建并启动单机模式
  const singlePlayerMode = new SinglePlayerMode();
  await singlePlayerMode.initialize({
    modeType: GameModeType.SINGLE_PLAYER,
    modeName: 'Single Player',
    maxPlayers: 2,
    supportAI: true,
  });

  // 添加玩家
  const player: Player = {
    id: 'player1',
    name: 'Player 1',
    score: 0,
    lives: 3,
    isReady: true,
  };

  singlePlayerMode.addPlayer(player);
  await game.initialize(game.getGameConfig(), singlePlayerMode);
  game.start();

  console.log('当前模式: 单机模式');

  // 3. 玩家想切换到网络对战
  console.log('切换到网络对战模式...');

  // 4. 停止当前游戏
  game.stop();

  // 5. 创建网络对战模式
  const onlineMode = new OnlineBattleMode();
  await onlineMode.initialize({
    modeType: GameModeType.ONLINE_BATTLE,
    modeName: 'Online Battle',
    maxPlayers: 2,
    supportAI: false,
    roomId: 'room_' + Date.now(),
    serverUrl: 'ws://localhost:8080',
  });

  // 6. 设置新模式
  game.setGameMode(onlineMode);

  // 7. 重新初始化并启动
  onlineMode.setLocalPlayer(player);
  onlineMode.addPlayer(player);

  const playerStateService = game.getPlayerStateService();
  playerStateService.addPlayer(player);

  await onlineMode.start();
  game.start();

  console.log('当前模式: 网络对战模式');
}

// ============================================================================
// 使用示例
// ============================================================================

// 运行示例
async function runExamples() {
  try {
    // 示例1: 本地对抗模式
    const { game: localGame, battleMode } = await setupLocalBattleMode();

    // 示例2: 网络对抗模式（主机端）
    const { game: hostGame, onlineMode: hostMode } = await setupOnlineBattleMode(true);

    // 示例2: 网络对抗模式（客机端）
    const { game: guestGame, onlineMode: guestMode } = await setupOnlineBattleMode(false);

    // 示例3: 组队模式
    const { game: teamGame, teamMode } = await setupTeamMode();

    // 示例4: 模式切换
    await switchModeExample();

  } catch (error) {
    console.error('示例运行失败:', error);
  }
}

// 导出示例函数
export {
  setupLocalBattleMode,
  setupOnlineBattleMode,
  setupTeamMode,
  switchModeExample,
  runExamples,
};

// 类型导入（用于其他文件）
import { TeamMode } from '../../core/modes';
import { SinglePlayerMode } from '../../core/modes';
