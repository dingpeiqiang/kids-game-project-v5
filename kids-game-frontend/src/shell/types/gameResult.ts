/** 结算面板展示用的对局统计（各游戏 payload 可部分填充） */
export interface GameResultStats {
  maxCombo?: number
  totalKills?: number
  gameTime?: number
  level?: number
  won?: boolean
  [key: string]: unknown
}