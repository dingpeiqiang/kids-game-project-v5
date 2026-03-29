/**
 * 游戏基础配置
 *
 * 修改说明：
 *   - GAME_CODE：与数据库 t_game.game_code 字段保持一致
 *   - GAME_NAME：游戏显示名称
 *
 * ⚠️ 在 init-game 脚本运行时，puzzle 会被替换为实际游戏代码
 */

// 游戏唯一标识码（与数据库 t_game.game_code 一致）
export const GAME_CODE = 'puzzle'

// 游戏名称
export const GAME_NAME = '拼图游戏'

// 游戏版本
export const GAME_VERSION = '1.0.0'

// 后端 API 基础地址
export const API_BASE_URL = 'http://localhost:8080'
