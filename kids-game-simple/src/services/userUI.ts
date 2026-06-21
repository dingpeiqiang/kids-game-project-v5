/**
 * userUI.ts — 用户系统 UI 模块
 * 负责：登录/注册弹窗、我的页面（含用户运营+游戏数据看板）
 */
import { userService } from './userService'
import { getLevelByExp, getLevelProgress, ALL_ACHIEVEMENTS } from '../types/user'
import { GAMES } from '../games/gameRegistry'


// ============================================================
// 工具：显示确认对话框
// ============================================================
export function showConfirm(message: string, title: string = '提示'): Promise<boolean> {
  return new Promise((resolve) => {
    const existing = document.getElementById('ugp-confirm-overlay')
    if (existing) {
      existing.remove()
    }
    
    const overlay = document.createElement('div')
    overlay.id = 'ugp-confirm-overlay'
    overlay.className = 'ugp-confirm-overlay'
    
    overlay.innerHTML = `
      <div class="ugp-confirm-card">
        <div class="ugp-confirm-title">${title}</div>
        <div class="ugp-confirm-message">${message}</div>
        <div class="ugp-confirm-buttons">
          <button class="ugp-confirm-btn ugp-confirm-cancel">取消</button>
          <button class="ugp-confirm-btn ugp-confirm-ok">确定</button>
        </div>
      </div>
    `
    
    document.body.appendChild(overlay)
    
    requestAnimationFrame(() => overlay.classList.add('show'))
    
    const cancelBtn = overlay.querySelector('.ugp-confirm-cancel') as HTMLElement
    const okBtn = overlay.querySelector('.ugp-confirm-ok') as HTMLElement
    
    const handleClose = (result: boolean) => {
      overlay.classList.remove('show')
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          overlay.remove()
        }
      }, 300)
      resolve(result)
    }
    
    cancelBtn.addEventListener('click', () => handleClose(false))
    okBtn.addEventListener('click', () => handleClose(true))
  })
}

// ============================================================
// 工具：显示 Toast 提示
// ============================================================
export function showToast(msg: string, type: 'success' | 'error' | 'info' = 'info') {
  const existing = document.getElementById('ugp-toast')
  if (existing) {
    // 强制移除旧的 toast
    existing.remove()
  }
  
  const el = document.createElement('div')
  el.id = 'ugp-toast'
  el.className = `ugp-toast ugp-toast-${type}`
  el.textContent = msg
  document.body.appendChild(el)
  
  // 显示动画
  requestAnimationFrame(() => el.classList.add('show'))
  
  // 确保3秒后一定消失
  setTimeout(() => {
    el.classList.remove('show')
    setTimeout(() => {
      // 再次检查元素是否存在，避免重复移除
      if (document.body.contains(el)) {
        el.remove()
      }
    }, 300)
  }, 3000)
}

// ============================================================
// 登录/注册弹窗
// ============================================================
export class AuthModal {
  private el: HTMLElement | null = null
  private mode: 'login' | 'register' = 'login'
  private onSuccess?: () => void
  private overlayBound = false
  requireLogin = false // 是否强制登录模式（禁止关闭）

  open(onSuccess?: () => void) {
    this.onSuccess = onSuccess
    if (!this.el) this.mount()
    this.el!.classList.add('show')
    this.renderPanel()
  }

  close(force: boolean = false) {
    // 强制登录模式下禁止关闭（除非是登录成功强制关闭）
    if (this.requireLogin && !force) {
      showToast('请先登录')
      return
    }
    if (force) {
      this.requireLogin = false
    }
    this.el?.classList.remove('show')
  }

  private mount() {
    this.el = document.createElement('div')
    this.el.className = 'ugp-auth-overlay'
    this.el.id = 'ugp-auth-overlay'
    document.body.appendChild(this.el)

    // 登录成功前不允许关闭
  }

  private renderPanel() {
    if (!this.el) return
    const accounts = userService.getAccountList()
    const isLogin = this.mode === 'login'

    this.el.innerHTML = `
      <div class="ugp-auth-card">
        <div class="ugp-auth-header">
          <div class="ugp-auth-logo" style="flex:1;text-align:center">🎮 解压竞技</div>
        </div>

        <div class="ugp-auth-tabs">
          <div class="ugp-tab ${isLogin ? 'active' : ''}" data-tab="login">登录</div>
          <div class="ugp-tab ${!isLogin ? 'active' : ''}" data-tab="register">注册</div>
        </div>

        <div class="ugp-auth-body">
          ${isLogin ? this.loginPanel(accounts) : this.registerPanel()}
        </div>
      </div>
    `

    this.bindOverlayEvents()
  }

  /** 事件委托：避免 renderPanel 多次调用导致同一按钮叠多个 login 请求 */
  private bindOverlayEvents() {
    if (!this.el || this.overlayBound) return
    this.overlayBound = true

    this.el.addEventListener('click', (e) => {
      const t = e.target as HTMLElement
      const tab = t.closest('.ugp-tab') as HTMLElement | null
      if (tab) {
        this.mode = tab.getAttribute('data-tab') as 'login' | 'register'
        this.renderPanel()
        return
      }
      if (t.closest('#btnDoLogin')) {
        void this.doLogin()
        return
      }
      if (t.closest('#btnDoRegister')) {
        void this.doRegister()
        return
      }
      const acct = t.closest('.ugp-acct-item') as HTMLElement | null
      if (acct) {
        const uid = acct.getAttribute('data-uid')!
        userService.switchAccount(uid)
        // 检查切换是否成功（token 是否有效）
        if (userService.isLoggedIn) {
          this.close(true)
          showToast(`欢迎回来，${userService.current?.username}！`, 'success')
        } else {
          showToast('登录状态已失效，请重新登录', 'error')
          // 强制刷新面板显示登录表单
          this.renderPanel()
        }
        return
      }
      const kidOption = t.closest('#userTypeKid')
      const parentOption = t.closest('#userTypeParent')
      if (kidOption) {
        this._selectedUserType = 'KID'
        document.getElementById('userTypeKid')?.classList.add('selected')
        document.getElementById('userTypeParent')?.classList.remove('selected')
      } else if (parentOption) {
        this._selectedUserType = 'PARENT'
        document.getElementById('userTypeParent')?.classList.add('selected')
        document.getElementById('userTypeKid')?.classList.remove('selected')
      }
    })

    this.el.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key !== 'Enter') return
      const target = e.target as HTMLElement
      if (target.id === 'ugp-login-pass') void this.doLogin()
      if (target.id === 'ugp-reg-pass') void this.doRegister()
    })

    this.el.addEventListener('input', (e) => {
      const target = e.target as HTMLElement
      if (target.id !== 'ugp-reg-user') return
      const usernameInput = target as HTMLInputElement
      const usernameHint = document.getElementById('usernameHint')
      if (!usernameHint) return
      const validation = this.validateUsername(usernameInput.value)
      if (usernameInput.value.length === 0) {
        usernameHint.textContent = ''
        usernameHint.className = 'ugp-field-hint'
      } else if (validation.valid) {
        usernameHint.textContent = '✓ 账号格式正确'
        usernameHint.className = 'ugp-field-hint ugp-hint-success'
      } else {
        usernameHint.textContent = validation.message
        usernameHint.className = 'ugp-field-hint ugp-hint-error'
      }
    })
  }

  private _selectedUserType: 'KID' | 'PARENT' = 'KID'

  private loginPanel(accounts: ReturnType<typeof userService.getAccountList>) {
    const accountList = accounts.length > 0 ? `
      <div class="ugp-acct-list-label">本机账号快速登录</div>
      <div class="ugp-acct-list">
        ${accounts.map(a => {
          const lv = getLevelByExp(a.exp)
          return `<div class="ugp-acct-item" data-uid="${a.id}">
            <div class="ugp-acct-avatar">${a.avatar}</div>
            <div class="ugp-acct-info">
              <div class="ugp-acct-name">${a.username}</div>
              <div class="ugp-acct-lv" style="color:${lv.color}">${lv.icon} Lv.${lv.level} ${lv.name}</div>
            </div>
            <div class="ugp-acct-arrow">›</div>
          </div>`
        }).join('')}
      </div>
      <div class="ugp-divider">或输入账号</div>
    ` : ''

    return `
      ${accountList}
      <div class="ugp-field">
        <label>账号</label>
        <input id="ugp-login-user" class="ugp-input" type="text" placeholder="输入您的账号" maxlength="12" autocomplete="username" />
      </div>
      <div class="ugp-field">
        <label>密码</label>
        <input id="ugp-login-pass" class="ugp-input" type="password" placeholder="输入密码" maxlength="16" autocomplete="current-password" />
      </div>
      <div class="ugp-error" id="authError"></div>
      <button class="ugp-btn ugp-btn-primary" id="btnDoLogin">登录</button>
    `
  }

  private registerPanel() {
    return `
      <div class="ugp-field">
        <label>账号 <span class="ugp-hint">字母/数字/下划线，4-12位</span></label>
        <input id="ugp-reg-user" class="ugp-input" type="text" placeholder="设置登录账号" maxlength="12" autocomplete="username" />
        <div class="ugp-field-hint" id="usernameHint"></div>
      </div>
      <div class="ugp-field">
        <label>昵称 <span class="ugp-hint">显示名称，2-12个字符</span></label>
        <input id="ugp-reg-nickname" class="ugp-input" type="text" placeholder="起个好听的昵称" maxlength="12" />
      </div>
      <div class="ugp-field">
        <label>密码 <span class="ugp-hint">4-16个字符</span></label>
        <input id="ugp-reg-pass" class="ugp-input" type="password" placeholder="设置密码" maxlength="16" autocomplete="new-password" />
      </div>
      <div class="ugp-field">
        <label>确认密码</label>
        <input id="ugp-reg-pass2" class="ugp-input" type="password" placeholder="再次输入密码" maxlength="16" autocomplete="new-password" />
      </div>
      <div class="ugp-field">
        <label>用户类型 <span class="ugp-hint">请选择您的身份</span></label>
        <div class="ugp-user-type-selector">
          <div class="ugp-user-type-option" data-type="KID" id="userTypeKid">
            <div class="ugp-type-icon">👶</div>
            <div class="ugp-type-name">儿童</div>
            <div class="ugp-type-desc">玩游戏、赚金币</div>
          </div>
          <div class="ugp-user-type-option" data-type="PARENT" id="userTypeParent">
            <div class="ugp-type-icon">👨‍👩‍👧</div>
            <div class="ugp-type-name">家长</div>
            <div class="ugp-type-desc">管理孩子游戏时间</div>
          </div>
        </div>
      </div>
      <div class="ugp-reg-gift">🎁 注册即送金币 x50、游学币 x5</div>
      <div class="ugp-error" id="authError"></div>
      <button class="ugp-btn ugp-btn-primary" id="btnDoRegister">立即注册</button>
    `
  }

  private validateUsername(username: string): { valid: boolean; message: string } {
    if (!username || username.length === 0) {
      return { valid: false, message: '请输入账号' }
    }
    
    if (username.length < 4) {
      return { valid: false, message: '账号至少4个字符' }
    }
    
    if (username.length > 12) {
      return { valid: false, message: '账号最多12个字符' }
    }
    
    // 只允许字母、数字、下划线，且必须以字母或数字开头
    const pattern = /^[a-zA-Z0-9][a-zA-Z0-9_]*$/
    if (!pattern.test(username)) {
      return { valid: false, message: '只能包含字母、数字和下划线' }
    }
    
    return { valid: true, message: '' }
  }

  private async doLogin() {
    const user = (document.getElementById('ugp-login-user') as HTMLInputElement)?.value || ''
    const pass = (document.getElementById('ugp-login-pass') as HTMLInputElement)?.value || ''
    const errorEl = document.getElementById('authError')
    const btn = document.getElementById('btnDoLogin') as HTMLButtonElement | null

    if (btn) { btn.disabled = true; btn.textContent = '登录中...' }

    try {
      const res = await userService.login(user, pass)
      if (res.ok) {
        this.close(true)
        // 刷新由 userService.login → ugp:userChange 统一触发，避免重复请求 game-records
        showToast(res.msg, 'success')
      } else {
        if (errorEl) { errorEl.textContent = res.msg; errorEl.style.display = 'block' }
      }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '登录' }
    }
  }

  private async doRegister() {
    const username = (document.getElementById('ugp-reg-user') as HTMLInputElement)?.value.trim() || ''
    const nickname = (document.getElementById('ugp-reg-nickname') as HTMLInputElement)?.value.trim() || ''
    const pass = (document.getElementById('ugp-reg-pass') as HTMLInputElement)?.value || ''
    const pass2 = (document.getElementById('ugp-reg-pass2') as HTMLInputElement)?.value || ''
    const errorEl = document.getElementById('authError')
    const btn = document.getElementById('btnDoRegister') as HTMLButtonElement | null
    
    // 获取用户类型（默认为 KID）
    const userType = this._selectedUserType
    console.log('[AuthModal] 注册信息:', { username, nickname, userType })
    
    // 验证用户类型
    if (!userType || (userType !== 'KID' && userType !== 'PARENT')) {
      if (errorEl) { errorEl.textContent = '请选择用户类型'; errorEl.style.display = 'block' }
      return
    }

    // 验证账号格式
    const usernameValidation = this.validateUsername(username)
    if (!usernameValidation.valid) {
      if (errorEl) { errorEl.textContent = usernameValidation.message; errorEl.style.display = 'block' }
      return
    }

    // 验证昵称
    if (!nickname || nickname.length < 2) {
      if (errorEl) { errorEl.textContent = '昵称长度至少2个字符'; errorEl.style.display = 'block' }
      return
    }
    
    if (nickname.length > 12) {
      if (errorEl) { errorEl.textContent = '昵称长度最多12个字符'; errorEl.style.display = 'block' }
      return
    }

    // 验证密码
    if (pass !== pass2) {
      if (errorEl) { errorEl.textContent = '两次密码不一致'; errorEl.style.display = 'block' }
      return
    }

    if (pass.length < 4 || pass.length > 16) {
      if (errorEl) { errorEl.textContent = '密码长度4-16个字符'; errorEl.style.display = 'block' }
      return
    }

    if (btn) { btn.disabled = true; btn.textContent = '注册中...' }

    try {
      console.log('[AuthModal] 调用 userService.register', { username, userType })
      const res = await userService.register(username, pass, nickname, userType)
      console.log('[AuthModal] 注册结果:', res)
      if (res.ok) {
        this.close(true)
        showToast(res.msg, 'success')
      } else {
        if (errorEl) { errorEl.textContent = res.msg; errorEl.style.display = 'block' }
      }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '立即注册' }
    }
  }
}

// ============================================================
// 我的页面（完整版：运营 + 游戏数据看板）
// ============================================================
export class MePanel {
  private el: HTMLElement | null = null
  private authModal: AuthModal
  private eventsBound = false
  private pageContainerId: string | null = null

  constructor(authModal: AuthModal) {
    this.authModal = authModal
  }

  open() {
    this.pageContainerId = null
    if (!this.el) this.mount()
    this.el!.classList.add('show')
    this.render()
  }

  close() {
    this.el?.classList.remove('show')
  }

  renderInto(containerId: string) {
    this.pageContainerId = containerId
    const container = document.getElementById(containerId)
    if (!container) return
    const u = userService.current
    if (!u) {
      container.innerHTML = `
        <div class="ugp-me-container ugp-not-login">
          <div class="ugp-nl-icon">👤</div>
          <div class="ugp-nl-title">尚未登录</div>
          <div class="ugp-nl-desc">登录后可保存游戏数据、查看成就和排行</div>
          <button class="ugp-btn ugp-btn-primary" id="btnNlLoginPage">登录 / 注册</button>
        </div>
      `
      document.getElementById('btnNlLoginPage')?.addEventListener('click', () => {
        this.authModal.open(() => { this.renderInto(containerId) })
      })
      return
    }
    container.innerHTML = this.getContentHTML()
    this.bindPageEvents(container)
  }

  private mount() {
    this.el = document.createElement('div')
    this.el.id = 'ugp-me-panel'
    this.el.className = 'ugp-me-overlay'
    document.body.appendChild(this.el)
  }

  private getContentHTML(): string {
    const u = userService.current!
    const lv = getLevelByExp(u.exp)
    const lvProgress = getLevelProgress(u.exp)
    const nextLv = lv.level < 8 ? ` → Lv.${lv.level + 1}` : ''
    const today = new Date().toDateString()
    const canSign = u.dailyRewardCollected !== today

    const activity = userService.getRecentActivity(7)
    const maxCount = Math.max(...activity.map(a => a.count), 1)
    const activityBars = activity.map(a => {
      const h = Math.max(4, Math.round(a.count / maxCount * 48))
      return `<div class="act-col">
        <div class="act-bar" style="height:${h}px;background:${a.count > 0 ? lv.color : '#e0e0e0'}" title="${a.count}局"></div>
        <div class="act-label">${a.date}</div>
      </div>`
    }).join('')

    const topGames = userService.getTopGames(5)
    const topGameRows = topGames.map((g, i) => {
      const info = GAMES.find(x => x.id === g.gameId)
      return `<div class="top-game-row">
        <div class="tg-rank">${['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</div>
        <div class="tg-name">${info?.name || g.gameId}</div>
        <div class="tg-score">${g.score.toLocaleString()}</div>
      </div>`
    }).join('') || '<div class="no-data">暂无游戏记录</div>'

    const achievements = userService.getAchievements()
    const unlockedAch = achievements.filter(a => a.unlocked)
    const lockedAch = achievements.filter(a => !a.unlocked)

    const recentRecords = (u.gameRecords || []).slice(0, 8)
    const recordRows = recentRecords.map(r => {
      const info = GAMES.find(x => x.id === r.gameId)
      const dt = new Date(r.playedAt)
      const timeStr = `${dt.getMonth()+1}/${dt.getDate()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
      return `<div class="record-row ${r.isNewBest ? 'record-best' : ''}">
        <div class="rec-game">${info?.name || r.gameId}</div>
        <div class="rec-score">${r.score.toLocaleString()} ${r.isNewBest ? '<span class="rec-badge">新纪录</span>' : ''}</div>
        <div class="rec-time">${timeStr}</div>
      </div>`
    }).join('') || '<div class="no-data">暂无战绩记录</div>'

    const totalPlays = u.gameRecords?.length || 0
    const bestScore = Math.max(...Object.values(u.bestScores || {}), 0)
    const gamesCount = Object.keys(u.bestScores || {}).length

    return `
      <div class="ugp-me-container">
        <div class="ugp-me-content">

          <div class="ugp-me-hero">
            <div class="ugp-me-ava">${u.avatar}</div>
            <div class="ugp-me-hero-info">
              <div class="ugp-me-name">${u.username}</div>
              <div class="ugp-me-lv" style="color:${lv.color}">${lv.icon} Lv.${lv.level} ${lv.name}${nextLv}</div>
              <div class="ugp-me-exp-bar-wrap">
                <div class="ugp-me-exp-bar" style="width:${lvProgress}%;background:${lv.color}"></div>
              </div>
              <div class="ugp-me-exp-text">${u.exp} EXP · ${lvProgress}%</div>
            </div>
            <div class="ugp-me-coins-badge">💰 ${u.coins}</div>
          </div>

          <div class="ugp-stats-row">
            <div class="ugp-stat"><div class="ugp-stat-val">${totalPlays}</div><div class="ugp-stat-lbl">总局数</div></div>
            <div class="ugp-stat"><div class="ugp-stat-val">${gamesCount}</div><div class="ugp-stat-lbl">游戏种类</div></div>
            <div class="ugp-stat"><div class="ugp-stat-val">${bestScore > 0 ? bestScore.toLocaleString() : '-'}</div><div class="ugp-stat-lbl">历史最高</div></div>
            <div class="ugp-stat"><div class="ugp-stat-val">${u.consecutiveLoginDays}</div><div class="ugp-stat-lbl">连续登录</div></div>
          </div>

          <div class="ugp-section">
            <div class="ugp-section-title">📅 每日签到</div>
            <div class="ugp-sign-card">
              <div class="ugp-sign-info">
                <div class="ugp-sign-days">连续 <b>${u.consecutiveLoginDays}</b> 天登录</div>
                <div class="ugp-sign-tip">${canSign ? `今日奖励：${50 + Math.min(u.consecutiveLoginDays-1,6)*10} 金币` : '今日已签到 ✓'}</div>
              </div>
              <button class="ugp-sign-btn ${canSign ? 'active' : 'done'}" id="btnSignIn">
                ${canSign ? '🎁 签到领奖' : '✓ 已签到'}
              </button>
            </div>
            <div class="ugp-sign-week">
              ${[1,2,3,4,5,6,7].map(d => {
                const done = u.consecutiveLoginDays >= d
                return `<div class="ugp-sign-day ${done ? 'done' : ''}">
                  <div class="ugp-sign-day-icon">${done ? '✓' : d}</div>
                  <div class="ugp-sign-day-coins">+${50 + (d-1)*10}</div>
                </div>`
              }).join('')}
            </div>
          </div>

          <div class="ugp-section">
            <div class="ugp-section-title">📊 近7日游戏</div>
            <div class="ugp-activity">${activityBars}</div>
          </div>

          <div class="ugp-section">
            <div class="ugp-section-title">🏆 我的最高分 Top5</div>
            <div class="ugp-top-games">${topGameRows}</div>
          </div>

          <div class="ugp-section">
            <div class="ugp-section-title">🕹️ 最近战绩</div>
            <div class="ugp-records">${recordRows}</div>
          </div>

          <div class="ugp-section">
            <div class="ugp-section-title">🏅 成就 ${unlockedAch.length}/${achievements.length}</div>
            <div class="ugp-ach-grid">
              ${[...unlockedAch, ...lockedAch].map(a => `
                <div class="ugp-ach-item ${a.unlocked ? 'unlocked' : ''}">
                  <div class="ugp-ach-icon">${a.icon}</div>
                  <div class="ugp-ach-name">${a.name}</div>
                  <div class="ugp-ach-desc">${a.desc}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="ugp-section">
            <div class="ugp-section-title">⚙️ 设置</div>
            <div class="ugp-settings">
              <div class="ugp-set-item" id="btnMeResetGuide"><span>📖 重置游戏引导</span><span>›</span></div>
              <div class="ugp-set-item ugp-set-danger" id="btnMeLogout"><span>🚪 退出登录</span><span>›</span></div>
              <div class="ugp-set-item ugp-set-danger" id="btnMeClearData"><span>🗑️ 清除账号数据</span><span>›</span></div>
            </div>
          </div>

        </div>
        <div class="ugp-me-footer">
          <button class="ugp-me-close-btn" id="btnCloseMe2">关闭</button>
        </div>
      </div>
    `
  }

  render() {
    if (!this.el) return
    const u = userService.current
    if (!u) {
      this.renderNotLogin()
      return
    }
    this.el.innerHTML = this.getContentHTML()
    this.bindMeEvents()
  }

  private renderNotLogin() {
    if (!this.el) return
    this.el.innerHTML = `
      <div class="ugp-me-container ugp-not-login">
        <div class="ugp-nl-icon">👤</div>
        <div class="ugp-nl-title">尚未登录</div>
        <div class="ugp-nl-desc">登录后可保存游戏数据、查看成就和排行</div>
        <button class="ugp-btn ugp-btn-primary" id="btnNlLogin">登录 / 注册</button>
        <button class="ugp-btn ugp-btn-ghost2" id="btnNlClose" style="margin-top:8px">关闭</button>
      </div>
    `
    document.getElementById('btnNlLogin')?.addEventListener('click', () => {
      this.close()
      this.authModal.open(() => { this.open() })
    })
    document.getElementById('btnNlClose')?.addEventListener('click', () => this.close())
  }

  private reRender() {
    if (this.pageContainerId) {
      this.renderInto(this.pageContainerId)
    } else {
      this.render()
    }
  }

  private bindPageEvents(container: HTMLElement) {
    container.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement

      if (target.closest('#btnCloseMe2')) return

      if (target.closest('#btnSignIn')) {
        const res = await userService.collectDailyReward()
        if (res.ok) {
          showToast(res.msg!, 'success')
          this.reRender()
        } else {
          showToast(res.msg, 'info')
        }
        return
      }

      if (target.closest('#btnMeResetGuide')) {
        if (await showConfirm('确定重置所有游戏引导吗？')) {
          const u = userService.current
          if (u) {
            u.guideSkipped = {}
            userService.saveUser(u)
            showToast('引导已重置', 'success')
          }
        }
        return
      }

      if (target.closest('#btnMeLogout')) {
        console.log('[MePanel] Logout button clicked')
        if (await showConfirm('确定退出登录？')) {
          console.log('[MePanel] User confirmed logout')
          try {
            await userService.logout()
            console.log('[MePanel] Logout successful')
            showToast('已退出登录', 'info')
            this.reRender()
            window.dispatchEvent(new CustomEvent('ugp:userChange'))
            this.authModal.open(() => {
              this.reRender()
            })
          } catch (e) {
            console.error('[MePanel] Logout error:', e)
            showToast('退出登录失败', 'error')
          }
        } else {
          console.log('[MePanel] User cancelled logout')
        }
        return
      }

      if (target.closest('#btnMeClearData')) {
        if (await showConfirm('警告：将清除该账号所有游戏数据！此操作不可撤销！', '警告')) {
          const u = userService.current
          if (u) {
            u.coins = 0; u.exp = 0; u.bestScores = {}
            u.gameRecords = []; u.achievements = []; u.items = {}
            userService.saveUser(u)
            showToast('数据已清除', 'success')
            this.reRender()
          }
        }
        return
      }
    })
  }

  private bindMeEvents() {
    if (!this.el || this.eventsBound) return

    this.eventsBound = true

    this.el.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement

      if (target.closest('#btnCloseMe2')) {
        this.close()
        return
      }

      if (target.closest('#btnSignIn')) {
        const res = await userService.collectDailyReward()
        if (res.ok) {
          showToast(res.msg!, 'success')
          this.reRender()
        } else {
          showToast(res.msg, 'info')
        }
        return
      }

      if (target.closest('#btnMeResetGuide')) {
        if (await showConfirm('确定重置所有游戏引导吗？')) {
          const u = userService.current
          if (u) {
            u.guideSkipped = {}
            userService.saveUser(u)
            showToast('引导已重置', 'success')
          }
        }
        return
      }

      if (target.closest('#btnMeLogout')) {
        console.log('[MePanel] Logout button clicked')
        if (await showConfirm('确定退出登录？')) {
          console.log('[MePanel] User confirmed logout')
          try {
            await userService.logout()
            console.log('[MePanel] Logout successful')
            showToast('已退出登录', 'info')
            this.reRender()
            window.dispatchEvent(new CustomEvent('ugp:userChange'))
            this.authModal.open(() => {
              window.dispatchEvent(new CustomEvent('ugp:userChange'))
              this.reRender()
            })
          } catch (e) {
            console.error('[MePanel] Logout error:', e)
            showToast('退出登录失败', 'error')
          }
        } else {
          console.log('[MePanel] User cancelled logout')
        }
        return
      }

      if (target.closest('#btnMeClearData')) {
        if (await showConfirm('警告：将清除该账号所有游戏数据！此操作不可撤销！', '警告')) {
          const u = userService.current
          if (u) {
            u.coins = 0; u.exp = 0; u.bestScores = {}
            u.gameRecords = []; u.achievements = []; u.items = {}
            userService.saveUser(u)
            showToast('数据已清除', 'success')
            this.reRender()
          }
        }
        return
      }
    })
  }
}

// ============================================================
// 注入全局 CSS
// ============================================================
export function injectUserStyles() {
  if (document.getElementById('ugp-styles')) return
  const style = document.createElement('style')
  style.id = 'ugp-styles'
  style.textContent = `
/* ===== Toast ===== */
.ugp-toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(20px);
  background:rgba(30,30,30,0.88);color:#fff;padding:10px 22px;border-radius:24px;font-size:14px;
  z-index:9999;opacity:0;transition:all 0.3s;pointer-events:none;white-space:nowrap;backdrop-filter:blur(8px)}
.ugp-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.ugp-toast-success{background:rgba(46,125,50,0.92)}
.ugp-toast-error{background:rgba(198,40,40,0.92)}

/* ===== 确认对话框 ===== */
.ugp-confirm-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:2000;
  display:none;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
.ugp-confirm-overlay.show{display:flex}
.ugp-confirm-card{background:#fff;border-radius:20px;width:min(340px,88vw);padding:24px;
  box-shadow:0 20px 60px rgba(0,0,0,0.2);animation:slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)}
.ugp-confirm-title{font-size:18px;font-weight:700;color:#333;text-align:center;margin-bottom:10px}
.ugp-confirm-message{font-size:15px;color:#666;text-align:center;line-height:1.6;margin-bottom:24px}
.ugp-confirm-buttons{display:flex;gap:12px}
.ugp-confirm-btn{flex:1;border:none;outline:none;border-radius:12px;padding:13px;font-size:15px;
  font-weight:600;cursor:pointer;transition:all 0.15s}
.ugp-confirm-btn:active{transform:scale(0.97)}
.ugp-confirm-cancel{background:#f5f5f5;color:#666}
.ugp-confirm-cancel:hover{background:#eee}
.ugp-confirm-ok{background:#5b9bd5;color:#fff}
.ugp-confirm-ok:hover{background:#4a8ac4}

/* ===== 登录弹窗 ===== */
.ugp-auth-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:1000;
  display:none;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
.ugp-auth-overlay.show{display:flex}
.ugp-auth-card{background:#fff;border-radius:24px;width:min(380px,92vw);padding:0 0 24px;
  box-shadow:0 20px 60px rgba(0,0,0,0.2);animation:slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)}
.ugp-auth-header{display:flex;align-items:center;justify-content:center;
  padding:24px 24px 0}
.ugp-auth-logo{font-size:20px;font-weight:700;color:#5b9bd5;letter-spacing:0.5px}
.ugp-auth-close{width:28px;height:28px;border-radius:50%;background:#f5f5f5;display:flex;
  align-items:center;justify-content:center;cursor:pointer;font-size:13px;color:#888}
.ugp-auth-tabs{display:flex;margin:16px 24px 0;gap:0;border-radius:12px;overflow:hidden;
  background:#f5f6f8;padding:3px}
.ugp-tab{flex:1;text-align:center;padding:10px 8px;cursor:pointer;
  font-size:14px;font-weight:600;color:#888;transition:all 0.25s;
  border-radius:10px;border:none;background:transparent;user-select:none}
.ugp-tab.active{color:#5b9bd5;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.08)}
.ugp-auth-body{padding:16px 24px 0;display:flex;flex-direction:column;gap:12px}
.ugp-field{display:flex;flex-direction:column;gap:6px}
.ugp-field label{font-size:13px;font-weight:600;color:#555;display:flex;align-items:center;gap:6px}
.ugp-hint{font-size:11px;color:#aaa;font-weight:400}
.ugp-field-hint{font-size:11px;margin-top:2px;transition:all 0.2s;min-height:16px}
.ugp-hint-success{color:#4caf50}
.ugp-hint-error{color:#e53935}
.ugp-input{border:1.5px solid #e8e8e8;border-radius:10px;padding:10px 14px;font-size:14px;
  outline:none;transition:border 0.2s;background:#fafafa}
.ugp-input:focus{border-color:#5b9bd5;background:#fff}
.ugp-error{color:#e53935;font-size:12px;display:none;padding:2px 0}
.ugp-btn{border:none;outline:none;border-radius:12px;padding:12px;font-size:15px;
  font-weight:600;cursor:pointer;transition:all 0.15s;width:100%}
.ugp-btn:active{transform:scale(0.97)}
.ugp-btn-primary{background:#5b9bd5;color:#fff}
.ugp-btn-primary:hover{background:#4a8ac4}
.ugp-btn-ghost{background:#f5f5f5;color:#666}
.ugp-btn-ghost2{background:transparent;color:#aaa;font-size:13px}
.ugp-divider{text-align:center;color:#bbb;font-size:12px;position:relative}
.ugp-divider::before,.ugp-divider::after{content:'';position:absolute;top:50%;width:30%;height:1px;background:#eee}
.ugp-divider::before{left:0}.ugp-divider::after{right:0}
.ugp-reg-gift{background:#fff8e7;border:1px solid #f5c842;border-radius:10px;
  padding:10px 14px;font-size:13px;color:#c8860a;text-align:center}
/* 用户类型选择器 */
.ugp-user-type-selector{display:flex;gap:10px;margin-top:6px}
.ugp-user-type-option{flex:1;padding:12px;border:2px solid #e8e8e8;border-radius:12px;
  cursor:pointer;transition:all 0.2s;text-align:center;background:#fafafa}
.ugp-user-type-option:hover{border-color:#5b9bd5;background:#f0f6ff}
.ugp-user-type-option.selected{border-color:#5b9bd5;background:#e8f0fe;box-shadow:0 0 0 3px rgba(91,155,213,0.1)}
.ugp-type-icon{font-size:28px;margin-bottom:6px}
.ugp-type-name{font-size:14px;font-weight:600;color:#333;margin-bottom:4px}
.ugp-type-desc{font-size:11px;color:#888}
.ugp-guest-notice{display:flex;gap:10px;padding:12px;background:#fff3e0;border:1px solid #ffcc80;
  border-radius:10px;margin-top:4px}
.ugp-guest-icon{font-size:20px;flex-shrink:0}
.ugp-guest-text{flex:1}
.ugp-guest-title{font-size:13px;font-weight:600;color:#e65100;margin-bottom:4px}
.ugp-guest-desc{font-size:11px;color:#bf3602;line-height:1.5}
/* 账号列表 */
.ugp-acct-list-label{font-size:12px;color:#aaa;font-weight:600;letter-spacing:0.5px}
.ugp-acct-list{display:flex;flex-direction:column;gap:8px;max-height:180px;overflow-y:auto}
.ugp-acct-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;
  background:#f8f9fa;cursor:pointer;transition:all 0.2s}
.ugp-acct-item:hover{background:#e8f0fe;transform:translateX(2px)}
.ugp-acct-avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#5b9bd5,#8ec5fc);
  display:flex;align-items:center;justify-content:center;font-size:20px}
.ugp-acct-info{flex:1}
.ugp-acct-name{font-size:14px;font-weight:600;color:#333}
.ugp-acct-lv{font-size:11px;margin-top:2px}
.ugp-acct-arrow{color:#ccc;font-size:18px}

/* ===== 我的面板 ===== */
.ugp-me-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:500;
  display:none;align-items:flex-end;justify-content:center;backdrop-filter:blur(4px)}
.ugp-me-overlay.show{display:flex}
.ugp-me-container{background:#f8f9fa;border-radius:24px 24px 0 0;width:min(480px,100vw);
  max-height:90vh;display:flex;flex-direction:column;animation:slideUp 0.35s ease}
.ugp-me-content{flex:1;overflow-y:auto;padding:20px 20px 0}
.ugp-me-content::-webkit-scrollbar{width:0}
.ugp-me-footer{padding:12px 20px 24px;border-top:1px solid #eee;background:#f8f9fa;border-radius:0 0 0 0}
.ugp-me-close-btn{width:100%;border:none;outline:none;background:#5b9bd5;color:#fff;
  border-radius:12px;padding:13px;font-size:15px;font-weight:600;cursor:pointer}

/* 未登录状态 */
.ugp-not-login{align-items:center;justify-content:center;padding:60px 32px;border-radius:24px 24px 0 0;
  display:flex;flex-direction:column;gap:16px;background:#fff}
.ugp-nl-icon{font-size:64px}
.ugp-nl-title{font-size:22px;font-weight:700;color:#333}
.ugp-nl-desc{font-size:14px;color:#888;text-align:center;line-height:1.6}

/* Hero 卡 */
.ugp-me-hero{background:linear-gradient(135deg,#5b9bd5,#8ec5fc);border-radius:16px;
  padding:20px;display:flex;align-items:flex-start;gap:14px;color:#fff;position:relative;margin-bottom:16px}
.ugp-me-ava{width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.25);
  display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0}
.ugp-me-hero-info{flex:1;min-width:0}
.ugp-me-name{font-size:18px;font-weight:700}
.ugp-me-lv{font-size:12px;margin-top:3px;opacity:0.95}
.ugp-me-exp-bar-wrap{background:rgba(255,255,255,0.3);border-radius:6px;height:5px;margin-top:8px;overflow:hidden}
.ugp-me-exp-bar{height:100%;border-radius:6px;transition:width 0.6s ease;min-width:4px}
.ugp-me-exp-text{font-size:10px;opacity:0.8;margin-top:4px}
.ugp-me-coins-badge{background:rgba(0,0,0,0.2);border-radius:12px;padding:6px 12px;
  font-size:13px;font-weight:700;position:absolute;top:16px;right:16px}

/* 统计行 */
.ugp-stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}
.ugp-stat{background:#fff;border-radius:12px;padding:12px 6px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
.ugp-stat-val{font-size:18px;font-weight:700;color:#333}
.ugp-stat-lbl{font-size:10px;color:#aaa;margin-top:3px}

/* 通用 Section */
.ugp-section{background:#fff;border-radius:16px;padding:16px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.05)}
.ugp-section-title{font-size:14px;font-weight:700;color:#333;margin-bottom:12px}

/* 签到 */
.ugp-sign-card{display:flex;align-items:center;justify-content:space-between;
  background:#f8f9fa;border-radius:12px;padding:14px;margin-bottom:12px}
.ugp-sign-days{font-size:14px;font-weight:600;color:#333}
.ugp-sign-days b{color:#5b9bd5;font-size:18px}
.ugp-sign-tip{font-size:12px;color:#888;margin-top:4px}
.ugp-sign-btn{border:none;outline:none;border-radius:10px;padding:10px 16px;
  font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s}
.ugp-sign-btn.active{background:#5b9bd5;color:#fff}
.ugp-sign-btn.done{background:#e8f5e9;color:#4caf50;cursor:default}
.ugp-sign-week{display:flex;justify-content:space-between;gap:4px}
.ugp-sign-day{flex:1;text-align:center;background:#f0f0f0;border-radius:8px;padding:6px 2px}
.ugp-sign-day.done{background:#e3f2fd}
.ugp-sign-day-icon{font-size:12px;font-weight:700;color:#999}
.ugp-sign-day.done .ugp-sign-day-icon{color:#5b9bd5}
.ugp-sign-day-coins{font-size:9px;color:#bbb;margin-top:2px}
.ugp-sign-day.done .ugp-sign-day-coins{color:#5b9bd5}

/* 活跃度图 */
.ugp-activity{display:flex;align-items:flex-end;justify-content:space-between;gap:4px;height:70px;padding-top:4px}
.act-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px}
.act-bar{width:100%;border-radius:4px;transition:height 0.4s ease;min-height:4px}
.act-label{font-size:9px;color:#bbb;white-space:nowrap}

/* Top 游戏 */
.ugp-top-games{display:flex;flex-direction:column;gap:8px}
.top-game-row{display:flex;align-items:center;gap:12px;padding:8px 10px;
  background:#f8f9fa;border-radius:10px}
.tg-rank{font-size:16px;width:24px;text-align:center}
.tg-name{flex:1;font-size:14px;font-weight:500;color:#333}
.tg-score{font-size:14px;font-weight:700;color:#5b9bd5}

/* 战绩 */
.ugp-records{display:flex;flex-direction:column;gap:6px;max-height:240px;overflow-y:auto}
.record-row{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:8px;
  padding:8px 10px;background:#f8f9fa;border-radius:10px}
.record-row.record-best{background:#fff8e7;border-left:3px solid #f5c842}
.rec-game{font-size:13px;color:#333;font-weight:500}
.rec-score{font-size:13px;font-weight:700;color:#5b9bd5;display:flex;align-items:center;gap:4px}
.rec-badge{background:#f5c842;color:#333;font-size:9px;padding:1px 5px;border-radius:4px;font-weight:700}
.rec-time{font-size:10px;color:#bbb;white-space:nowrap}

/* 成就 */
.ugp-ach-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.ugp-ach-item{background:#f8f9fa;border-radius:12px;padding:10px 8px;text-align:center;
  transition:all 0.2s;filter:grayscale(1);opacity:0.5}
.ugp-ach-item.unlocked{filter:none;opacity:1;background:#f0f7ff;border:1px solid #5b9bd520}
.ugp-ach-icon{font-size:24px;margin-bottom:4px}
.ugp-ach-name{font-size:11px;font-weight:700;color:#333}
.ugp-ach-desc{font-size:9px;color:#aaa;margin-top:2px;line-height:1.3}

/* 设置 */
.ugp-settings{display:flex;flex-direction:column;gap:2px}
.ugp-set-item{display:flex;align-items:center;justify-content:space-between;
  padding:12px 14px;border-radius:10px;cursor:pointer;font-size:14px;color:#333;
  transition:background 0.15s}
.ugp-set-item:hover{background:#f5f5f5}
.ugp-set-danger{color:#e53935}

/* 通用 */
.no-data{text-align:center;color:#ccc;font-size:13px;padding:16px}
@keyframes slideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
  `
  document.head.appendChild(style)
}
