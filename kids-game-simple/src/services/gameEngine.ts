// 游戏引擎服务 - 积分、Buff、连击系统
import type { Buff, GameState } from '../types'
import { audioService } from './audio'
import { storageService } from './storage'

type ScoreCallback = (score: number, x: number, y: number, isCrit: boolean, isCombo: boolean) => void
type CritCallback = () => void
type BuffCallback = (buff: Buff) => void
type ComboCallback = (combo: number) => void
type ComboBreakCallback = () => void
type MessageCallback = (message: string) => void

export class GameEngine {
  private state: GameState = {
    running: false,
    score: 0,
    combo: 0,
    buffs: {},
    crits: 0,
    sessionCoins: 0,
  }
  /** 壳层暂停：对局仍算进行中，但各游戏循环应跳过逻辑更新 */
  private _paused = false
  private _isVictory = false
  private _gameStats: any = null  // 游戏统计数据
  private _orientation: 'portrait' | 'landscape' = 'portrait'

  setOrientation(orientation: 'portrait' | 'landscape') {
    this._orientation = orientation
  }

  get orientation(): 'portrait' | 'landscape' {
    return this._orientation
  }

  private onScoreFly?: ScoreCallback
  private onCritFlash?: CritCallback
  private onBuffPopup?: BuffCallback
  private onComboShow?: ComboCallback
  private onComboBreak?: ComboBreakCallback
  private onMessage?: MessageCallback

  setCallbacks(cb: {
    onScoreFly?: ScoreCallback
    onCritFlash?: CritCallback
    onBuffPopup?: BuffCallback
    onComboShow?: ComboCallback
    onComboBreak?: ComboBreakCallback
    onMessage?: MessageCallback
  }) {
    this.onScoreFly = cb.onScoreFly
    this.onCritFlash = cb.onCritFlash
    this.onBuffPopup = cb.onBuffPopup
    this.onComboShow = cb.onComboShow
    this.onComboBreak = cb.onComboBreak
    this.onMessage = cb.onMessage
  }

  start() {
    this.state = {
      running: false,
      score: 0,
      combo: 0,
      buffs: {},
      crits: 0,
      sessionCoins: 0,
    }
    this.state.running = true
    this._paused = false
    this._isVictory = false
    this._gameStats = null
  }

  stop() {
    this.state.running = false
    this._paused = false
  }

  pause() {
    if (!this.state.running) return
    this._paused = true
  }

  resume() {
    if (!this.state.running) return
    this._paused = false
  }

  isPaused() {
    return this._paused
  }

  /** 游戏循环应同时检查 isRunning() && !isPaused() */
  canTick() {
    return this.state.running && !this._paused
  }

  getScore() {
    return this.state.score
  }

  /** 3D 停车等整局结算类游戏直接写入最终得分 */
  setScore(score: number) {
    this.state.score = Math.max(0, Math.round(score))
  }

  getCombo() {
    return this.state.combo
  }

  getCrits() {
    return this.state.crits
  }

  addScore(base: number, x: number, y: number) {
    if (!this.state.running) return 0

    let earned = base
    let isCrit = false
    let isCombo = false

    // 随机暴击 10-20%
    if (Math.random() < 0.15) {
      const mult = 1.5 + Math.random() * 3.5
      earned = Math.round(earned * mult)
      isCrit = true
      this.state.crits++
      this.onCritFlash?.()
      audioService.crit()
    }

    // Buff 加成
    Object.values(this.state.buffs).forEach(b => {
      earned = Math.round(earned * b.mult)
    })

    // 连击加成
    this.state.combo++
    let comboMult = 1
    if (this.state.combo >= 20) comboMult = 1.5
    else if (this.state.combo >= 15) comboMult = 1.3
    else if (this.state.combo >= 10) comboMult = 1.2
    else if (this.state.combo >= 5) comboMult = 1.1
    if (comboMult > 1) isCombo = true
    earned = Math.round(earned * comboMult)

    this.state.score += earned

    // 飘字
    this.onScoreFly?.(earned, x, y, isCrit, isCombo)
    if (!isCrit) audioService.pop()

    // 连击环
    if (this.state.combo >= 3) {
      this.onComboShow?.(this.state.combo)
    }

    return earned
  }

  breakCombo() {
    if (this.state.combo >= 5) {
      audioService.lose()
      this.onComboBreak?.()
    }
    this.state.combo = 0
  }

  triggerRandomBuff() {
    if (Math.random() > 0.4) return

    const buffs: Buff[] = [
      { id: 'double', icon: '⚡', text: '双倍积分!', dur: 3000, mult: 2 },
      { id: 'safe',   icon: '🛡️', text: '失误保护!', dur: 5000, mult: 1 },
      { id: 'slow',   icon: '⏱️', text: '减速效果!', dur: 4000, mult: 1.5 },
      { id: 'mega',   icon: '💥', text: '全屏消除!', dur: 0, mult: 3 },
    ]

    const buff = buffs[Math.floor(Math.random() * buffs.length)]
    this.state.buffs[buff.id] = buff
    this.onBuffPopup?.(buff)
    audioService.buff()

    if (buff.dur > 0) {
      let remaining = buff.dur
      const timer = setInterval(() => {
        remaining -= 500
        if (remaining <= 0 || !this.state.buffs[buff.id]) {
          clearInterval(timer)
          delete this.state.buffs[buff.id]
        }
      }, 500)
    } else {
      setTimeout(() => {
        delete this.state.buffs[buff.id]
      }, 2000)
    }
  }

  hasBuff(id: string) {
    return !!this.state.buffs[id]
  }

  getBuffs() {
    return this.state.buffs
  }

  endGame() {
    this.state.running = false
  }

  setMessage(message: string) {
    this.onMessage?.(message)
  }

  isRunning() {
    return this.state.running
  }

  setVictory(v: boolean) { this._isVictory = v }
  isVictory() { return this._isVictory }
  
  // 设置游戏统计数据
  setGameStats(stats: any) {
    this._gameStats = stats
  }
  
  // 获取游戏统计数据
  getGameStats() {
    return this._gameStats
  }
}

export const gameEngine = new GameEngine()
