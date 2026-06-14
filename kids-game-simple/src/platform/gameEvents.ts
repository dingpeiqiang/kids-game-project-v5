/**
 * 平台级游戏事件名与载荷类型（全局事件总线契约）
 */
export const GameEvents = {
  SCORE_ADD: 'game:score:add',
  SCORE_SET: 'game:score:set',
  HP_DAMAGE: 'game:hp:damage',
  HP_HEAL: 'game:hp:heal',
  PAUSE_REQUEST: 'game:pause:request',
  PAUSE: 'game:pause',
  RESUME: 'game:resume',
  GAME_OVER: 'game:over',
  GAME_VICTORY: 'game:victory',
  COMBO_BREAK: 'game:combo:break',
  BUFF_TRIGGER: 'game:buff:trigger',
  SHELL_BACK: 'shell:back',
  SHELL_PAUSE: 'shell:pause',
  SHELL_EXIT_CONFIRM: 'shell:exit:confirm',
} as const

export type GameEventName = (typeof GameEvents)[keyof typeof GameEvents]

export interface ScoreAddPayload {
  amount: number
  x: number
  y: number
  source?: string
}

export interface ScoreSetPayload {
  score: number
  source?: string
}

export interface HpChangePayload {
  amount: number
  reason?: string
}

export interface GameOverPayload {
  victory: boolean
  score?: number
  stats?: Record<string, unknown>
}

export type GameEventPayloadMap = {
  [GameEvents.SCORE_ADD]: ScoreAddPayload
  [GameEvents.SCORE_SET]: ScoreSetPayload
  [GameEvents.HP_DAMAGE]: HpChangePayload
  [GameEvents.HP_HEAL]: HpChangePayload
  [GameEvents.PAUSE_REQUEST]: { source?: string }
  [GameEvents.PAUSE]: { source?: string }
  [GameEvents.RESUME]: { source?: string }
  [GameEvents.GAME_OVER]: GameOverPayload
  [GameEvents.GAME_VICTORY]: GameOverPayload
  [GameEvents.COMBO_BREAK]: Record<string, never>
  [GameEvents.BUFF_TRIGGER]: { buffId: string }
  [GameEvents.SHELL_BACK]: Record<string, never>
  [GameEvents.SHELL_PAUSE]: Record<string, never>
  [GameEvents.SHELL_EXIT_CONFIRM]: { confirmed: boolean }
}