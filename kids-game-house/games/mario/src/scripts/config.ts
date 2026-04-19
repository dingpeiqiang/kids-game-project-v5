/**
 * 游戏配置
 */
export default {
  /**
   * 游戏结束时间（秒）
   */
  playTime: 60 * 3,
  /**
   * 玩家生命数
   */
  lives: 3,
  /**
   * 玩家初始位置
   */
  initX: 16 * 6,
  initY: 100,
  /**
   * 游戏说明
   */
  helpText: 'ARROW KEYS MOVE\n\nZ TO FIRE',
  /**
   * 关卡配置
   */
  levels: [
    { id: 1, name: 'World 1-1', mapKey: 'map-level1', mapFile: 'assets/maps/super-mario.json' },
    { id: 2, name: 'World 1-2', mapKey: 'map-level2', mapFile: 'assets/maps/level2.json' },
    // 后续关卡示例：
    // { id: 3, name: 'World 1-3', mapKey: 'map-level3', mapFile: 'assets/maps/level3.json' },
  ],
}
