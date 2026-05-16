import './styles/main.css'
import type { Game, Buff } from './types'
import { GAMES, GAME_GUIDES, MOCK_RANK_DATA, GAME_CATEGORIES } from './data/games'
import { isGameVisible, getGameDisplayConfig } from './data/game-config'
import { storageService } from './services/storage'
import { audioService } from './services/audio'
import { gameEngine } from './services/gameEngine'
import { userService } from './services/userService'
import { AuthModal, MePanel, showToast, injectUserStyles } from './services/userUI'
import { apiGetBatchUserRank } from './services/apiClient'
import { getTopList, type LeaderboardEntry } from './services/leaderboardService'
import { initEliminate } from './games/eliminate'
import { initDodge } from './games/dodge'
import { initSort } from './games/sort'
import { initPop } from './games/pop'
import { initStack3D } from './games/stack3d'
import { initTower3D } from './games/tower3d'
import { initFruitSlice } from './games/fruitSlice'
import { initJewelMatch } from './games/jewelMatch'
import { initBouncePath } from './games/bouncePath'
import { initNeonRun } from './games/neonRun'
import { initTetris } from './games/tetris'
import { initCookieCut } from './games/cookieCut/index'
import { initStarCatcher } from './games/starCatcher'
import { initBubbleShooter } from './games/bubbleShooter'
import { initSlimeJump } from './games/slimeJump'
import { initColorTap } from './games/colorTap'
import { initStack } from './games/stack'
import { initSpaceShooter } from './games/spaceShooter'
import { initTowerDefense } from './games/towerDefense'
import { initMemoryMatch } from './games/memoryMatch'
import { initSnake } from './games/snake'
import { initWhackMole } from './games/whackMole'
import { initRacingRun } from './games/racingRun'
import { initRpgShooter } from './games/rpgShooter'
import { initRpgShooterTD } from './games/rpgShooterTowerDefense/init'
import { initDragonShooter } from './games/dragonShooter'

class App {
  private currentGame: Game | null = null
  private guideSkipped: boolean = false
  private authModal: AuthModal
  private mePanel: MePanel
  // 缓存排行榜数据，避免频繁请求
  private rankCache: Map<string, LeaderboardEntry[]> = new Map()

  constructor() {
    this.authModal = new AuthModal()
    this.mePanel = new MePanel(this.authModal)
  }

  // 数据统一走 userService（已登录）或 storageService（兼容游客）
  private get store() {
    return userService.isLoggedIn ? userService.current! : storageService.get()
  }

  init() {
    // 注入用户系统样式
    injectUserStyles()

    // 音频需在用户交互后初始化（浏览器自动播放策略）
    const initAudio = () => {
      audioService.initOnGesture()
      document.removeEventListener('click', initAudio)
      document.removeEventListener('touchstart', initAudio)
    }
    document.addEventListener('click', initAudio, { once: true })
    document.addEventListener('touchstart', initAudio, { once: true })

    this.renderUI()
    this.bindEvents()
    this.bindGameCallbacks()

    // 监听用户变更事件（登出、异步恢复登录等）
    window.addEventListener('ugp:userChange', () => this.onUserChange())

    // 等待异步会话恢复完成后，再决定是否弹出登录框
    setTimeout(() => {
      if (!userService.isLoggedIn) {
        this.authModal.open(() => this.onUserChange())
      }
    }, 1200) // 给后端恢复会话 1.2s 时间

    // 检查每日奖励
    const data = storageService.get()
    if (data.hasDoubleCard) {
      setTimeout(() => this.showDailyPop(), 800)
    }

    // 隐藏loading
    setTimeout(() => {
      const loading = document.getElementById('loading')
      loading?.classList.add('hide')
    }, 500)
  }

  private renderUI() {
    const data = storageService.get()
    const u = userService.current
    const avatarContent = u ? u.avatar : '我'
    const coinVal = u ? u.coins : data.coins
    const app = document.getElementById('app')!
    app.innerHTML = `
      <!-- Loading -->
      <div id="loading">
        <div class="loader"></div>
        <p>正在加载平台...</p>
      </div>

      <!-- 顶部栏 -->
      <div class="top-bar" id="topBar">
        <div class="logo">解压竞技</div>
        <div class="top-right">
          <div class="coin-display">
            <div class="coin-icon">★</div>
            <span id="coinCount">${coinVal}</span>
          </div>
          <div class="user-avatar" id="userAvatar" title="${u ? u.username : '点击登录'}">${avatarContent}</div>
        </div>
      </div>

      <!-- 主界面 -->
      <div class="main-container" id="mainView">
        <div class="daily-banner" id="dailyBanner">
          <div class="banner-label">每日惊喜</div>
          <div class="banner-title">今日可领取双倍积分卡!</div>
          <div class="banner-sub">已连续登录 ${u ? u.consecutiveLoginDays : data.loginDays} 天，加油!</div>
          <div class="banner-tag">
            <div class="tag-num" id="todayGames">${u ? u.todayGames : data.todayGames}</div>
            <div class="tag-label">今日游戏</div>
          </div>
        </div>

        <div id="categorySections"></div>
      </div>

      <!-- 底部导航 -->
      <div class="bottom-nav" id="bottomNav">
        <div class="nav-item active" data-page="home">
          <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          首页
        </div>
        <div class="nav-item" data-page="rank">
          <svg viewBox="0 0 24 24"><path d="M7.5 21H2V9l10-7 10 7v12h-5.5v-7h-9v7zm7-11.5L18.5 17H15v-7.5z"/></svg>
          排行
        </div>
        <div class="nav-item" data-page="me">
          <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          我的
        </div>
      </div>

      <!-- Buff 飘窗 -->
      <div class="buff-popup" id="buffPopup">
        <div class="buff-icon" id="buffIcon">⚡</div>
        <div class="buff-text" id="buffText">双倍积分!</div>
        <div class="buff-time" id="buffTime">3s</div>
      </div>

      <!-- 暴击闪屏 -->
      <div class="crit-flash" id="critFlash"></div>

      <!-- 连击环 -->
      <div class="combo-ring" id="comboRing">
        <div class="combo-num" id="comboNum">0</div>
        <div class="combo-label">连击</div>
      </div>

      <!-- 游戏画布层 -->
      <div id="game-layer"><div id="gameCanvas"></div></div>

      <!-- 结果弹窗 -->
      <div id="result-overlay">
        <div class="result-card">
          <div class="result-icon" id="resultIcon"></div>
          <div class="result-title" id="resultTitle">本局结束!</div>
          <div class="result-score" id="resultScore">0</div>
          <div class="result-best" id="resultBest">历史最高: 0</div>
          
          <!-- 游戏统计数据 -->
          <div class="result-stats" id="resultStats" style="display:none; margin:12px 0; padding:12px; background:linear-gradient(135deg,#f8f9fa,#e9ecef); border-radius:12px;"></div>
          
          <div class="result-rank" id="resultRank" style="display:none">
            <div class="rank-badge" id="rankBadge"></div>
            <div class="rank-text" id="rankText"></div>
          </div>
          <div class="buff-list" id="resultBuffs"></div>
          <div class="btn-group">
            <button class="btn btn-secondary" id="btnBack">返回大厅</button>
            <button class="btn btn-primary" id="btnReplay">再来一局</button>
          </div>
          <div style="margin-top:12px">
            <a href="#" id="btnResetGuide" style="font-size:11px;color:#bbb;text-decoration:none">重看游戏引导</a>
          </div>
        </div>
      </div>

      <!-- 排行榜 -->
      <div id="rank-overlay">
        <div class="rank-panel">
          <div class="rank-header">
            <div class="rank-title">🏆 排行榜</div>
            <div class="rank-close" id="rankClose">✕</div>
          </div>
          
          <!-- 游戏选择器 -->
          <div class="rank-game-selector">
            <select id="rankGameSelect" class="rank-game-select">
              <option value="">-- 选择游戏 --</option>
            </select>
          </div>
          
          <div class="rank-tabs">
            <div class="rank-tab active" data-tab="global">全局</div>
            <div class="rank-tab" data-tab="daily">今日</div>
            <div class="rank-tab" data-tab="friend">好友</div>
          </div>
          
          <!-- 我的排名卡片 -->
          <div class="my-rank-card" id="myRankCard" style="display:none;">
            <div class="my-rank-info">
              <div class="my-rank-label">我的排名</div>
              <div class="my-rank-value" id="myRankPosition">-</div>
            </div>
            <div class="my-rank-score">
              <div class="my-rank-label">分数</div>
              <div class="my-rank-value" id="myRankScore">0</div>
            </div>
            <button class="my-rank-btn" id="btnScrollToMyRank">
              📍 定位到我的排名
            </button>
          </div>
          
          <div class="rank-list" id="rankList"></div>
        </div>
      </div>

      <!-- 每日奖励 -->
      <div id="daily-overlay">
        <div class="daily-card">
          <div class="dc-icon">🎁</div>
          <div class="dc-title">每日登录奖励</div>
          <div class="dc-desc">恭喜你今日首次游戏！获得双倍积分卡 x1，下次游戏自动生效!</div>
          <button class="dc-btn" id="btnCloseDaily">收下奖励</button>
        </div>
      </div>

      <!-- 玩法引导 -->
      <div id="guide-overlay">
        <div class="guide-card">
          <!-- 游戏名称和图标 -->
          <div class="guide-header">
            <div class="guide-icon" id="guideIcon">🎯</div>
            <div class="guide-title-section">
              <div class="guide-name" id="guideName">游戏名称</div>
              <div class="guide-desc" id="guideDesc">游戏描述</div>
            </div>
          </div>
          
          <!-- 玩法说明 -->
          <div class="guide-ops" id="guideOps"></div>
          
          <!-- 小技巧 -->
          <div class="guide-tips" id="guideTips"></div>
          
          <!-- 跳过选项 -->
          <div class="guide-skip">
            <label><input type="checkbox" id="guideSkipCheck">不再显示本游戏引导</label>
          </div>
          
          <!-- 开始按钮 -->
          <button class="guide-btn" id="btnStartGame">开始游戏</button>
        </div>
      </div>

    `

    // 渲染游戏卡片
    this.renderGameCards()
  }

  private async renderGameCards() {
    const container = document.getElementById('categorySections')!
    
    // ⭐ 停止所有预览动画 + 断开旧 Observer
    this.previewAnimFrames.forEach((rafId) => cancelAnimationFrame(rafId))
    this.previewAnimFrames.clear()
    if (this.previewObserver) {
      this.previewObserver.disconnect()
      this.previewObserver = null
    }
    
    // ⭐ 清空现有内容，避免重复渲染
    container.innerHTML = ''
    
    const bestScores = userService.isLoggedIn
      ? (userService.current?.bestScores || {})
      : storageService.get().bestScores

    // 如果已登录,批量获取排名数据
    let rankMap: Record<string, number | null> = {}
    if (userService.isLoggedIn && userService.current) {
      try {
        // simple-game的游戏ID是字符串，需要转换为数字ID（只获取可见游戏的排名）
        const visibleGames = GAMES.filter(g => isGameVisible(g.id))
        const gameIds = visibleGames.map(g => this.convertGameIdToNumber(g.id))
        const userId = parseInt(userService.current.id)
        
        console.log('[App] 获取批量排名', { userId, gameCount: gameIds.length })
        
        if (gameIds.length > 0 && userId) {
          const res = await apiGetBatchUserRank(userId, gameIds)
          if (res.ok && res.data) {
            console.log('[App] 批量排名返回:', Object.keys(res.data).length, '个游戏')
            console.log('[App] 原始数据:', res.data)
            // 将数字ID映射回字符串ID
            visibleGames.forEach(game => {
              const numericId = this.convertGameIdToNumber(game.id)
              if (res.data![numericId]) {
                const rankData = res.data![numericId]
                rankMap[game.id] = rankData.hasRecord ? rankData.rank : null
                if (rankData.hasRecord) {
                  console.log(`[App] ${game.id} (ID:${numericId}) 排名:`, rankData.rank, '分数:', rankData.score)
                }
              } else {
                rankMap[game.id] = null
              }
            })
          }
        }
      } catch (e) {
        console.error('[App] 获取排名失败:', e)
      }
    }

    GAME_CATEGORIES.forEach(cat => {
      const gamesInCat = GAMES
        .filter(g => g.category === cat.id && isGameVisible(g.id))
        .sort((a, b) => getGameDisplayConfig(a.id).order - getGameDisplayConfig(b.id).order)
      if (gamesInCat.length === 0) return

      // 分类标题
      const titleEl = document.createElement('div')
      titleEl.className = 'section-title'
      titleEl.innerHTML = `<span class="cat-label" style="--cat-color:${cat.color}">${cat.icon} ${cat.label}</span><span class="cat-count">${gamesInCat.length}款</span>`
      container.appendChild(titleEl)

      // 游戏网格
      const grid = document.createElement('div')
      grid.className = 'game-grid'
      const gamesToPreview: Game[] = []
      gamesInCat.forEach((game) => {
        const best = bestScores[game.id] || 0
        const rank = rankMap[game.id] !== undefined ? rankMap[game.id] : null
        const card = this.createGameCard(game, best, rank)
        grid.appendChild(card)
        gamesToPreview.push(game)
      })
      container.appendChild(grid)
      // ⭐ DOM 已挂载到 document，再启动预览动画
      gamesToPreview.forEach(game => this.renderPreview(game))
    })
  }

  private createGameCard(game: Game, best: number, rank: number | null) {
    const card = document.createElement('div')
    card.className = 'game-card'
    card.dataset.gameId = game.id
    
    // 排名显示
    let rankDisplay = ''
    if (rank !== null) {
      // 有排名
      let rankIcon = '🏅'
      let rankClass = ''
      if (rank === 1) { rankIcon = '🥇'; rankClass = 'rank-gold' }
      else if (rank === 2) { rankIcon = '🥈'; rankClass = 'rank-silver' }
      else if (rank === 3) { rankIcon = '🥉'; rankClass = 'rank-bronze' }
      
      rankDisplay = `
        <div class="card-rank ${rankClass}" title="你的排名">
          ${rankIcon} 第${rank}名
        </div>
      `
    } else {
      // 无记录
      rankDisplay = `
        <div class="card-rank card-rank-empty" title="尚未游玩">
          📝 无记录
        </div>
      `
    }
    
    card.innerHTML = `
      <div class="card-cover">
        <canvas id="preview_${game.id}" width="320" height="200"></canvas>
        <div class="card-tag">${game.tag}</div>
        ${getGameDisplayConfig(game.id).badge ? `<div class="card-badge">${getGameDisplayConfig(game.id).badge}</div>` : ''}
      </div>
      <div class="card-info">
        <div class="card-name">${game.name}</div>
        <div class="card-desc">${game.desc}</div>
        <div class="card-meta">
          <span class="card-players">👥 ${game.players}</span>
          <span class="card-best" data-game-id="${game.id}" title="点击查看${game.name}排行榜">
            ★ ${best > 0 ? best.toLocaleString() : '-'}
          </span>
        </div>
        ${rankDisplay}
      </div>
    `
    
    // 绑定排名点击事件
    const bestEl = card.querySelector('.card-best')
    bestEl?.addEventListener('click', (e) => {
      e.stopPropagation()  // 阻止进入游戏
      // 显示该游戏的排行榜
      this.showRankForGame(game.id)
    })
    
    return card
  }

  // preview 动画管理：只对视口内卡片运行动画，离开视口则停止
  private previewAnimFrames: Map<string, number> = new Map()
  private previewObserver: IntersectionObserver | null = null

  private initPreviewObserver() {
    if (this.previewObserver) return
    this.previewObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const canvas = entry.target as HTMLCanvasElement
        const gameId = canvas.id.replace('preview_', '')
        if (entry.isIntersecting) {
          // 进入视口 → 启动动画
          if (!this.previewAnimFrames.has(gameId)) {
            const game = GAMES.find(g => g.id === gameId)
            if (game) this.startPreviewAnimation(game, canvas)
          }
        } else {
          // 离开视口 → 停止动画
          this.stopPreviewAnimation(gameId)
        }
      })
    }, { rootMargin: '100px' })
  }

  private stopPreviewAnimation(gameId: string) {
    const rafId = this.previewAnimFrames.get(gameId)
    if (rafId) {
      cancelAnimationFrame(rafId)
      this.previewAnimFrames.delete(gameId)
    }
  }

  private startPreviewAnimation(game: Game, canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!
    const [c1, c2] = game.color.split(',')
    const grad = ctx.createLinearGradient(0, 0, 320, 200)
    grad.addColorStop(0, c1)
    grad.addColorStop(1, c2)

    const items = Array.from({ length: 6 }, (_, i) => ({
      x: 40 + i * 42,
      y: 80 + Math.sin(i) * 30,
      r: 14,
      vx: (Math.random() - 0.5) * 0.5,
    }))

    let frame = 0
    const animate = () => {
      if (!document.getElementById('preview_' + game.id)) {
        this.previewAnimFrames.delete(game.id)
        return
      }
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 320, 200)
      items.forEach((it, i) => {
        it.x += it.vx
        if (it.x < 20 || it.x > 300) it.vx *= -1
        ctx.globalAlpha = 0.8
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(it.x, it.y + Math.sin(frame * 0.05 + i) * 6, it.r, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 0.9
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 18px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('▶', 160, 110)
      frame++
      this.previewAnimFrames.set(game.id, requestAnimationFrame(animate))
    }
    this.previewAnimFrames.set(game.id, requestAnimationFrame(animate))
  }

  private renderPreview(game: Game) {
    const canvas = document.getElementById('preview_' + game.id) as HTMLCanvasElement
    if (!canvas) return

    // 先画一帧静态画面（避免白屏）
    const ctx = canvas.getContext('2d')!
    const [c1, c2] = game.color.split(',')
    const grad = ctx.createLinearGradient(0, 0, 320, 200)
    grad.addColorStop(0, c1)
    grad.addColorStop(1, c2)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 320, 200)
    ctx.globalAlpha = 0.9
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('▶', 160, 110)
    ctx.globalAlpha = 1

    // 用 IntersectionObserver 懒加载动画
    this.initPreviewObserver()
    this.previewObserver!.observe(canvas)
  }

  private bindEvents() {
    // 游戏卡片点击
    document.addEventListener('click', e => {
      const card = (e.target as HTMLElement).closest('.game-card')
      if (card) {
        const gameId = (card as HTMLElement & { dataset: { gameId?: string } }).dataset.gameId
        if (!gameId) return
        const game = GAMES.find(g => g.id === gameId)
        if (game) {
          e.preventDefault()
          this.launchGame(game)
        }
      }
    })

    // 导航
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.getAttribute('data-page')
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'))
        item.classList.add('active')
        
        if (page === 'rank') {
          this.showRank()
        } else if (page === 'me') {
          this.mePanel.open()
        } else {
          this.closeRank()
        }
      })
    })

    // 结果弹窗
    document.getElementById('btnBack')?.addEventListener('click', () => this.closeResult())
    document.getElementById('btnReplay')?.addEventListener('click', () => this.replayGame())
    document.getElementById('btnResetGuide')?.addEventListener('click', e => {
      e.preventDefault()
      if (this.currentGame) {
        if (userService.isLoggedIn) userService.resetGuide(this.currentGame.id)
        else storageService.resetGuide(this.currentGame.id)
      }
      this.closeResult()
    })

    // 排行榜
    document.getElementById('rankClose')?.addEventListener('click', () => this.closeRank())
    document.querySelectorAll('.rank-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.rank-tab').forEach(t => t.classList.remove('active'))
        tab.classList.add('active')
        
        // 获取当前选择的游戏
        const select = document.getElementById('rankGameSelect') as HTMLSelectElement
        const gameId = select?.value || ''
        
        this.renderRank(tab.getAttribute('data-tab') || 'global', gameId)
      })
    })
    
    // 定位到我的排名
    document.getElementById('btnScrollToMyRank')?.addEventListener('click', () => {
      const myRankItem = document.getElementById('myRankItem')
      if (myRankItem) {
        myRankItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // 高亮闪烁效果
        myRankItem.classList.add('highlight-me')
        setTimeout(() => {
          myRankItem.classList.remove('highlight-me')
        }, 2000)
      }
    })

    // 每日奖励
    document.getElementById('btnCloseDaily')?.addEventListener('click', () => this.closeDailyPop())

    // 玩法引导
    document.getElementById('btnStartGame')?.addEventListener('click', () => this.closeGuide())

    // 用户头像 — 已登录打开我的页面，未登录弹登录框
    document.getElementById('userAvatar')?.addEventListener('click', () => {
      if (userService.isLoggedIn) {
        this.mePanel.open()
      } else {
        this.authModal.open(() => this.onUserChange())
      }
    })
  }

  private bindGameCallbacks() {
    gameEngine.setCallbacks({
      onScoreFly: (score, x, y, isCrit, isCombo) => {
        this.showScoreFly(score, x, y, isCrit, isCombo)
      },
      onCritFlash: () => {
        const el = document.getElementById('critFlash')!
        el.classList.add('show')
        setTimeout(() => el.classList.remove('show'), 600)
      },
      onBuffPopup: (buff) => {
        const popup = document.getElementById('buffPopup')!
        document.getElementById('buffIcon')!.textContent = buff.icon
        document.getElementById('buffText')!.textContent = buff.text
        document.getElementById('buffTime')!.textContent = buff.dur > 0 ? Math.round(buff.dur / 1000) + 's' : ''
        popup.classList.add('show')

        if (buff.dur > 0) {
          let remaining = buff.dur
          const timer = setInterval(() => {
            remaining -= 500
            if (remaining <= 0) {
              clearInterval(timer)
              popup.classList.remove('show')
            } else {
              document.getElementById('buffTime')!.textContent = Math.round(remaining / 1000) + 's'
            }
          }, 500)
        }
      },
      onComboShow: (combo) => {
        const ring = document.getElementById('comboRing')!
        document.getElementById('comboNum')!.textContent = String(combo)
        ring.classList.add('show')
        setTimeout(() => ring.classList.remove('show'), 1500)
      },
      onComboBreak: () => {
        // handled in gameEngine
      }
    })
  }

  private launchGame(game: Game) {
    this.currentGame = game
    audioService.click()

    const guideSkipped = userService.isLoggedIn
      ? (userService.current?.guideSkipped || {})[game.id]
      : storageService.get().guideSkipped[game.id]

    if (!guideSkipped) {
      this.showGameGuide(game)
    } else {
      this.startGame()
    }
  }

  private showGameGuide(game: Game) {
    const guide = GAME_GUIDES[game.id]
    if (!guide) {
      this.startGame()
      return
    }

    document.getElementById('guideIcon')!.textContent = guide.icon
    document.getElementById('guideName')!.textContent = guide.name
    document.getElementById('guideDesc')!.textContent = guide.desc

    const opsEl = document.getElementById('guideOps')!
    opsEl.innerHTML = guide.ops.map(op => `
      <div class="guide-op">
        <div class="guide-op-icon" style="background:${game.color.split(',')[0]}20">${op.icon}</div>
        <div class="guide-op-text">${op.text}</div>
      </div>
    `).join('')

    const tipsEl = document.getElementById('guideTips')!
    tipsEl.innerHTML = `
      <div class="guide-tips-title">${guide.tipsTitle}</div>
      <div class="guide-tips-text">${guide.tips}</div>
    `

    ;(document.getElementById('guideSkipCheck') as HTMLInputElement).checked = false
    document.getElementById('guide-overlay')!.classList.add('show')
    
    // 添加点击背景关闭功能（关闭引导但不进入游戏）
    const overlay = document.getElementById('guide-overlay')!
    const guideCard = overlay.querySelector('.guide-card')!
    
    const handleOverlayClick = (e: MouseEvent) => {
      // 如果点击的是背景（不是卡片内容），则关闭引导并取消进入游戏
      if (e.target === overlay) {
        this.cancelGuide(overlay as HTMLElement, handleOverlayClick)
      }
    }
    
    overlay.addEventListener('click', handleOverlayClick)
  }

  private closeGuide() {
    const skipCheck = (document.getElementById('guideSkipCheck') as HTMLInputElement).checked
    if (skipCheck && this.currentGame) {
      if (userService.isLoggedIn) userService.skipGuide(this.currentGame.id)
      else storageService.skipGuide(this.currentGame.id)
    }
    document.getElementById('guide-overlay')!.classList.remove('show')
    setTimeout(() => this.startGame(), 300)
  }

  private cancelGuide(overlay: HTMLElement, handler: (e: MouseEvent) => void) {
    // 点击背景关闭引导 → 取消进入游戏，回到首页
    overlay.removeEventListener('click', handler)
    document.getElementById('guide-overlay')!.classList.remove('show')
    this.currentGame = null
  }

  private startGame() {
    if (!this.currentGame) return

    gameEngine.start()

    document.getElementById('game-layer')!.classList.add('show')
    document.getElementById('topBar')!.style.display = 'none'
    document.getElementById('bottomNav')!.style.display = 'none'
    document.getElementById('mainView')!.style.display = 'none'

    const hasDoubleCard = userService.isLoggedIn
      ? userService.current?.hasDoubleCard
      : storageService.get().hasDoubleCard

    if (hasDoubleCard) {
      setTimeout(() => {
        gameEngine.triggerRandomBuff()
      }, 500)
    }

    const canvas = document.getElementById('gameCanvas')!
    const W = 400, H = 600
    // 根据屏幕计算缩放比例（spaceShooter 使用全屏，其他游戏保留边距）
    const isSpaceShooter = this.currentGame.id === 'spaceShooter'
    
    let displayW: number, displayH: number
    
    if (isSpaceShooter) {
      // 太空射击游戏：使用 Phaser ScaleManager ENVELOP 模式
      // Phaser 会自动创建 canvas 并处理缩放适配，无需手动创建
      canvas.innerHTML = ''  // 清空，Phaser 会自行创建 DOM
      console.log('[App] spaceShooter 使用 Phaser ENVELOP 模式，设计分辨率 400x600')
    } else {
      // 其他游戏：保持宽高比，不超出屏幕
      const widthRatio = window.innerWidth / W
      const heightRatio = window.innerHeight * 0.85 / H
      const scale = Math.min(widthRatio, heightRatio)
      displayW = W * scale
      displayH = H * scale
    }
    
    // 非 spaceShooter 游戏的 Canvas 创建
    if (!isSpaceShooter) {
      // 添加 image-rendering 防止模糊
      canvas.innerHTML = `<canvas id="mainGameCanvas" width="${W}" height="${H}" style="width:${displayW}px;height:${displayH}px;display:block;-webkit-image-rendering:pixelated;image-rendering:pixelated;image-rendering:crisp-edges"></canvas>`
    }

    switch (this.currentGame.id) {
      case 'eliminate': initEliminate(gameEngine, () => this.endGame()); break
      case 'dodge':     initDodge(gameEngine, () => this.endGame()); break
      case 'sort':      initSort(gameEngine, () => this.endGame()); break
      case 'pop':       initPop(gameEngine, () => this.endGame()); break
      case 'stack3d':   initStack3D(gameEngine, () => this.endGame()); break
      case 'tower3d':    initTower3D(gameEngine, () => this.endGame()); break
      case 'fruitSlice': initFruitSlice(gameEngine, () => this.endGame()); break
      case 'jewelMatch': initJewelMatch(gameEngine, () => this.endGame()); break
      case 'bouncePath': initBouncePath(gameEngine, () => this.endGame()); break
      case 'neonRun': initNeonRun(gameEngine, () => this.endGame()); break
      case 'tetris': initTetris(gameEngine, () => this.endGame()); break
            case 'cookieCut': initCookieCut(gameEngine, () => this.endGame(), 1); break
      case 'starCatcher': initStarCatcher(gameEngine, () => this.endGame()); break
      case 'bubbleShooter': initBubbleShooter(gameEngine, () => this.endGame()); break
      case 'slimeJump': initSlimeJump(gameEngine, () => this.endGame()); break
      case 'colorTap': initColorTap(gameEngine, () => this.endGame()); break
      case 'stack': initStack(gameEngine, () => this.endGame()); break
      case 'spaceShooter': initSpaceShooter(gameEngine, () => this.endGame()); break
      case 'towerDefense': initTowerDefense(gameEngine, () => this.endGame()); break
      case 'memoryMatch': initMemoryMatch(gameEngine, () => this.endGame()); break
      case 'snake': initSnake(gameEngine, () => this.endGame()); break
      case 'whackMole': initWhackMole(gameEngine, () => this.endGame()); break
      case 'racingRun': initRacingRun(gameEngine, () => this.endGame()); break
      case 'rpgShooter': initRpgShooter(gameEngine, () => this.endGame()); break
      case 'rpgShooterTD': initRpgShooterTD(gameEngine, () => this.endGame()); break
      case 'dragonShooter': initDragonShooter(gameEngine, () => this.endGame()); break
    }
  }

  private async endGame() {
    gameEngine.stop()
    gameEngine.endGame()
    if (!this.currentGame) return

    const gameId = this.currentGame.id
    const score = gameEngine.getScore()
    const prevBest = (userService.isLoggedIn ? userService.current?.bestScores[gameId] : undefined)
      ?? storageService.get().bestScores[gameId]
      ?? 0

    // ⚡ 先显示结果弹窗，再异步同步分数（避免网络阻塞导致卡住）
    this.showResult(gameId, score, prevBest)

    // 异步记录战绩（不阻塞弹窗显示）
    this.syncScoreAsync(gameId, score, prevBest)
  }

  private showResult(gameId: string, score: number, prevBest: number) {
    // 获取游戏统计数据
    const gameStats = gameEngine.getGameStats()
    
    // 金币
    const coinsEarned = Math.round(score / 10)
    if (userService.isLoggedIn) {
      userService.addCoins(coinsEarned)
      userService.incrementGames()
    } else {
      storageService.addCoins(coinsEarned)
      storageService.incrementGames()
    }

    // 更新UI
    const dispCoins = userService.isLoggedIn ? userService.current!.coins : storageService.get().coins
    const dispGames = userService.isLoggedIn ? userService.current!.todayGames : storageService.get().todayGames
    document.getElementById('coinCount')!.textContent = String(dispCoins)
    document.getElementById('todayGames')!.textContent = String(dispGames)

    // 计算排名（本地）
    const rankInfo = this.calculateRank(score)
    
    // 结果弹窗
    const pct = prevBest > 0 ? Math.round(score / prevBest * 100) : 100
    const isVictory = gameEngine.isVictory()
    let tier = 'basic', icon = '🎮', title = '继续加油'
    if (isVictory) {
      tier = 'best'; icon = '🎉'; title = '恭喜通关!'
      audioService.win()
    } else if (score > prevBest && score > 0) {
      tier = 'best'; icon = '🏆'; title = '新纪录!'
      audioService.win()
    } else if (pct >= 60) {
      tier = 'good'; icon = '⭐'; title = '很棒!'
    }

    const resultIcon = document.getElementById('resultIcon')!
    resultIcon.className = 'result-icon ' + tier
    resultIcon.textContent = icon
    document.getElementById('resultTitle')!.textContent = title
    document.getElementById('resultScore')!.textContent =
      score + (coinsEarned > 0 ? ' +' + coinsEarned + '💰' : '')
    document.getElementById('resultBest')!.textContent = '历史最高: ' + (prevBest || 0)

    // 显示游戏统计数据（如果有）
    const statsEl = document.getElementById('resultStats')
    if (statsEl && gameStats) {
      statsEl.style.display = 'block'
      let statsHtml = ''
      if (gameStats.maxCombo > 0) {
        statsHtml += `<div class="stat-item">🔥 最大连击: <b>${gameStats.maxCombo}</b></div>`
      }
      if (gameStats.totalKills > 0) {
        statsHtml += `<div class="stat-item">💀 总击杀: <b>${gameStats.totalKills}</b></div>`
      }
      if (gameStats.gameTime > 0) {
        const minutes = Math.floor(gameStats.gameTime / 60)
        const seconds = gameStats.gameTime % 60
        statsHtml += `<div class="stat-item">⏱️ 游戏时长: <b>${minutes}:${seconds.toString().padStart(2, '0')}</b></div>`
      }
      if (gameStats.level > 0) {
        statsHtml += `<div class="stat-item">📊 等级: <b>${gameStats.level}</b></div>`
      }
      if (gameStats.won) {
        statsHtml += `<div class="stat-item" style="color:#FFD700">🎉 通关成功!</div>`
      }
      statsEl.innerHTML = statsHtml
    } else if (statsEl) {
      statsEl.style.display = 'none'
    }

    // 显示排名信息（先用本地排名，后端同步后更新）
    const rankEl = document.getElementById('resultRank')!
    const rankBadgeEl = document.getElementById('rankBadge')!
    const rankTextEl = document.getElementById('rankText')!

    if (rankInfo) {
      rankEl.style.display = 'block'
      rankBadgeEl.textContent = rankInfo.badge
      rankTextEl.innerHTML = rankInfo.text

      if (rankInfo.rank <= 3) {
        rankBadgeEl.style.color = rankInfo.rank === 1 ? '#FFD700' : rankInfo.rank === 2 ? '#C0C0C0' : '#CD7F32'
      } else {
        rankBadgeEl.style.color = '#5b9bd5'
      }
    } else {
      rankEl.style.display = 'none'
    }

    // Buff明细
    const buffsEl = document.getElementById('resultBuffs')!
    buffsEl.innerHTML = ''
    if (gameEngine.getCrits() > 0) {
      buffsEl.innerHTML += `<span class="buff-tag crit">⚡暴击 x${gameEngine.getCrits()}</span>`
    }
    if (gameEngine.getCombo() >= 10) {
      buffsEl.innerHTML += `<span class="buff-tag">🔥连击 x${gameEngine.getCombo()}</span>`
    }

    document.getElementById('result-overlay')!.classList.add('show')
  }

  private async syncScoreAsync(gameId: string, score: number, prevBest: number) {
    console.log('[App] syncScoreAsync - 检查登录状态', { isLoggedIn: userService.isLoggedIn, gameId, score })
    if (userService.isLoggedIn) {
      try {
        // 获取游戏统计数据
        const gameStats = gameEngine.getGameStats()
        
        console.log('[App] 调用 userService.recordGameResult...')
        const result = await userService.recordGameResult(gameId, score, gameStats)
        console.log('[App] recordGameResult 返回结果:', result)
        if (result.synced && result.rank) {
          // 后端同步成功，更新排名显示
          const rankEl = document.getElementById('resultRank')
          const rankBadgeEl = document.getElementById('rankBadge')
          const rankTextEl = document.getElementById('rankText')
          if (rankEl && rankBadgeEl && rankTextEl) {
            rankEl.style.display = 'block'
            const badge = result.rank <= 3 ? ['🥇', '🥈', '🥉'][result.rank - 1] : `#${result.rank}`
            rankBadgeEl.textContent = badge
            rankTextEl.innerHTML = `当前排名 <b>${result.rank}</b> 位`
            rankBadgeEl.style.color = result.rank === 1 ? '#FFD700' : result.rank === 2 ? '#C0C0C0' : result.rank === 3 ? '#CD7F32' : '#5b9bd5'
          }
        }
        
        // 清除该游戏的排行榜缓存
        this.clearRankCache(gameId)
      } catch (e) {
        console.warn('[App] 分数同步失败:', e)
        // 不阻塞，静默失败
      }
    } else {
      // 游客模式：更新本地分数
      storageService.updateBest(gameId, score)
    }

    // 金币
    const coinsEarned = Math.round(score / 10)
    if (userService.isLoggedIn) {
      userService.addCoins(coinsEarned)
      userService.incrementGames()
    } else {
      storageService.addCoins(coinsEarned)
      storageService.incrementGames()
    }

    // 更新UI
    const dispCoins = userService.isLoggedIn ? userService.current!.coins : storageService.get().coins
    const dispGames = userService.isLoggedIn ? userService.current!.todayGames : storageService.get().todayGames
    document.getElementById('coinCount')!.textContent = String(dispCoins)
    document.getElementById('todayGames')!.textContent = String(dispGames)

    // 计算排名
    const rankInfo = this.calculateRank(score)
    
    // 结果弹窗
    const pct = prevBest > 0 ? Math.round(score / prevBest * 100) : 100
    const isVictory = gameEngine.isVictory()
    let tier = 'basic', icon = '🎮', title = '继续加油'
    if (isVictory) {
      tier = 'best'; icon = '🎉'; title = '恭喜通关!'
      audioService.win()
    } else if (score > prevBest && score > 0) {
      tier = 'best'; icon = '🏆'; title = '新纪录!'
      audioService.win()
    } else if (pct >= 60) {
      tier = 'good'; icon = '⭐'; title = '很棒!'
    }

    const resultIcon = document.getElementById('resultIcon')!
    resultIcon.className = 'result-icon ' + tier
    resultIcon.textContent = icon
    document.getElementById('resultTitle')!.textContent = title
    document.getElementById('resultScore')!.textContent =
      score + (coinsEarned > 0 ? ' +' + coinsEarned + '💰' : '')
    document.getElementById('resultBest')!.textContent = '历史最高: ' + (prevBest || 0)

    // 显示排名信息（优先使用后端同步的排名）
    const rankEl = document.getElementById('resultRank')!
    const rankBadgeEl = document.getElementById('rankBadge')!
    const rankTextEl = document.getElementById('rankText')!

    if (rankInfo) {
      // 使用计算的排名信息
      rankEl.style.display = 'block'
      rankBadgeEl.textContent = rankInfo.badge
      rankTextEl.innerHTML = rankInfo.text

      // 根据排名设置颜色
      if (rankInfo.rank <= 3) {
        rankBadgeEl.style.color = rankInfo.rank === 1 ? '#FFD700' : rankInfo.rank === 2 ? '#C0C0C0' : '#CD7F32'
      } else {
        rankBadgeEl.style.color = '#5b9bd5'
      }
    } else {
      rankEl.style.display = 'none'
    }

    // Buff明细
    const buffsEl = document.getElementById('resultBuffs')!
    buffsEl.innerHTML = ''
    if (gameEngine.getCrits() > 0) {
      buffsEl.innerHTML += `<span class="buff-tag crit">⚡暴击 x${gameEngine.getCrits()}</span>`
    }
    if (gameEngine.getCombo() >= 10) {
      buffsEl.innerHTML += `<span class="buff-tag">🔥连击 x${gameEngine.getCombo()}</span>`
    }

    document.getElementById('result-overlay')!.classList.add('show')
  }

  private calculateRank(score: number): { rank: number; badge: string; text: string } | null {
    if (!this.currentGame || score <= 0) return null
    
    // 获取排行榜数据
    let items = MOCK_RANK_DATA.slice()
    const myName = userService.isLoggedIn ? (userService.current?.username || '玩家') : '玩家'
    
    // 添加玩家当前分数
    const playerEntry = { name: myName, score: score }
    items.push(playerEntry)
    
    // 排序
    items.sort((a, b) => b.score - a.score)
    
    // 找到玩家排名
    const rank = items.findIndex(item => item.name === myName) + 1
    
    if (rank <= 0) return null
    
    // 生成排名信息
    let badge = ''
    let text = ''
    
    if (rank === 1) {
      badge = '🥇'
      text = '<strong style="color:#FFD700;font-size:18px">第 1 名</strong><br><span style="font-size:12px;color:#999">太厉害了！全球第一！</span>'
    } else if (rank === 2) {
      badge = '🥈'
      text = '<strong style="color:#C0C0C0;font-size:18px">第 2 名</strong><br><span style="font-size:12px;color:#999">非常棒！仅次于冠军！</span>'
    } else if (rank === 3) {
      badge = '🥉'
      text = '<strong style="color:#CD7F32;font-size:18px">第 3 名</strong><br><span style="font-size:12px;color:#999">优秀！登上领奖台！</span>'
    } else if (rank <= 10) {
      badge = '🏅'
      text = `<strong style="font-size:16px">第 ${rank} 名</strong><br><span style="font-size:12px;color:#999">进入前10，继续保持！</span>`
    } else if (rank <= 50) {
      badge = '🎖️'
      text = `<strong style="font-size:16px">第 ${rank} 名</strong><br><span style="font-size:12px;color:#999">前50名，表现不错！</span>`
    } else {
      badge = '📊'
      text = `<strong style="font-size:16px">第 ${rank} 名</strong><br><span style="font-size:12px;color:#999">继续加油，挑战更高排名！</span>`
    }
    
    return { rank, badge, text }
  }

  private closeResult() {
    document.getElementById('result-overlay')!.classList.remove('show')
    this.exitGame()
  }

  private replayGame() {
    document.getElementById('result-overlay')!.classList.remove('show')
    // 清理可能残留的 Phaser DOM（spaceShooter 等）
    document.getElementById('phaser-space-shooter')?.remove()
    document.getElementById('gameCanvas')!.innerHTML = ''
    this.startGame()
  }

  private exitGame() {
    document.getElementById('game-layer')!.classList.remove('show')
    document.getElementById('gameCanvas')!.innerHTML = ''
    // 清理可能残留的游戏 DOM
    document.getElementById('phaser-space-shooter')?.remove()
    document.getElementById('dragon-shooter-wrapper')?.remove()
    document.getElementById('topBar')!.style.display = 'flex'
    document.getElementById('bottomNav')!.style.display = 'flex'
    document.getElementById('mainView')!.style.display = 'block'
    this.currentGame = null

    // 刷新卡片上的最高分
    this.refreshBestScores()
  }

  private refreshBestScores() {
    const bestScores = userService.isLoggedIn
      ? (userService.current?.bestScores || {})
      : storageService.get().bestScores
    document.querySelectorAll('.game-card').forEach(card => {
      const gameId = card.getAttribute('data-gameId')
      if (gameId) {
        const bestEl = card.querySelector('.card-best')
        if (bestEl) {
          const best = bestScores[gameId] || 0
          bestEl.textContent = '★ ' + (best > 0 ? best : '-')
        }
      }
    })
  }

  private showScoreFly(score: number, x: number, y: number, isCrit: boolean, isCombo: boolean) {
    const el = document.createElement('div')
    el.className = 'score-fly'
    el.textContent = '+' + score
    el.style.left = x + 'px'
    el.style.top = y + 'px'
    if (isCrit) {
      el.style.color = '#ff7043'
      el.style.fontSize = '26px'
      el.textContent += ' ⚡'
    } else if (isCombo) {
      el.style.color = '#5b9bd5'
      el.style.fontSize = '22px'
    }
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 1000)
  }

  private showRank() {
    document.getElementById('rank-overlay')!.classList.add('show')
    
    // 初始化游戏选择器
    this.initRankGameSelector()
    
    // 默认显示第一个有分数的游戏
    const bestScores = userService.isLoggedIn
      ? (userService.current?.bestScores || {})
      : storageService.get().bestScores
    const gamesWithScores = Object.entries(bestScores)
      .filter(([_, score]) => score > 0)
      .map(([gameId]) => gameId)
    
    if (gamesWithScores.length > 0) {
      const select = document.getElementById('rankGameSelect') as HTMLSelectElement
      select.value = gamesWithScores[0]
      this.renderRank('global', gamesWithScores[0])
    } else {
      this.renderRank('global', '')
    }
  }

  // 显示指定游戏的排行榜
  private showRankForGame(gameId: string) {
    document.getElementById('rank-overlay')!.classList.add('show')
    
    // 初始化游戏选择器
    this.initRankGameSelector()
    
    // 设置选择器为指定游戏
    const select = document.getElementById('rankGameSelect') as HTMLSelectElement
    select.value = gameId
    
    // 渲染该游戏的排行榜
    this.renderRank('global', gameId)
  }

  private closeRank() {
    document.getElementById('rank-overlay')!.classList.remove('show')
  }

  // 初始化排行榜游戏选择器
  private initRankGameSelector() {
    const select = document.getElementById('rankGameSelect') as HTMLSelectElement
    if (!select) return
    
    // 清空现有选项（保留第一个）
    select.innerHTML = '<option value="">-- 选择游戏 --</option>'
    
    // 添加所有可见游戏选项
    GAMES.filter(g => isGameVisible(g.id)).forEach(game => {
      const option = document.createElement('option')
      option.value = game.id
      option.textContent = game.name
      select.appendChild(option)
    })
    
    // 绑定变化事件
    select.onchange = () => {
      const activeTab = document.querySelector('.rank-tab.active')
      const tabType = activeTab?.getAttribute('data-tab') || 'global'
      this.renderRank(tabType, select.value)
    }
  }

  private async renderRank(type: string, gameId?: string) {
    const list = document.getElementById('rankList')!
    
    console.log('[App] renderRank 被调用', { type, gameId, isLoggedIn: userService.isLoggedIn })
    
    // 显示加载状态
    list.innerHTML = '<div style="text-align:center;padding:40px;color:#aaa;">加载中...</div>'
    
    let items: { name: string; score: number }[] = []
    
    // 如果有 gameId，从后端获取排行榜
    if (gameId && userService.isLoggedIn) {
      try {
        // 将字符串 gameId 转换为数字 ID（使用与 userService 相同的哈希函数）
        const numericGameId = this.convertGameIdToNumber(gameId)
        console.log('[App] 转换后的 gameId:', numericGameId)
        
        // 确定排行类型
        let rankType: 'ALL' | 'DAILY' | 'MONTHLY' | 'YEARLY' = 'ALL'
        if (type === 'daily') rankType = 'DAILY'
        else if (type === 'monthly') rankType = 'MONTHLY'
        else if (type === 'yearly') rankType = 'YEARLY'
        
        // 获取缓存 key
        const cacheKey = `${gameId}_${rankType}`
        console.log('[App] 缓存 key:', cacheKey, '缓存存在:', this.rankCache.has(cacheKey))
        
        // 检查缓存
        let leaderboardData: LeaderboardEntry[]
        if (this.rankCache.has(cacheKey)) {
          leaderboardData = this.rankCache.get(cacheKey)!
          console.log('[App] 使用缓存的排行榜数据:', cacheKey, '条数:', leaderboardData.length)
        } else {
          // 从后端获取
          console.log('[App] 从后端获取排行榜...', { gameId: numericGameId, rankType })
          const result = await getTopList(numericGameId, rankType, 50)
          leaderboardData = result.list
          // 缓存 30 秒
          this.rankCache.set(cacheKey, leaderboardData)
          setTimeout(() => this.rankCache.delete(cacheKey), 30000)
          console.log('[App] 从后端获取排行榜数据成功:', cacheKey, leaderboardData.length, '条')
        }
        
        // 转换为前端格式
        items = leaderboardData.map(entry => ({
          name: entry.nickname || entry.username,
          score: entry.score
        }))
        console.log('[App] 排行榜数据转换完成，共', items.length, '条')
      } catch (e) {
        console.error('[App] 获取排行榜失败:', e)
        // 失败时使用模拟数据
        items = MOCK_RANK_DATA.slice()
      }
    } else {
      console.log('[App] 使用模拟数据', { hasGameId: !!gameId, isLoggedIn: userService.isLoggedIn })
      // 没有 gameId 或未登录，使用模拟数据
      items = MOCK_RANK_DATA.slice()
    }

    if (type === 'daily' && items.length > 0) {
      items = items.map(x => ({ ...x, score: Math.round(x.score * 0.7 + Math.random() * 500) }))
    }
    if (type === 'friend') {
      items = items.slice(0, 8)
    }

    const bestScores = userService.isLoggedIn
      ? (userService.current?.bestScores || {})
      : storageService.get().bestScores
    const myName = userService.isLoggedIn ? (userService.current?.username || '玩家') : '玩家'
    
    // 获取指定游戏的分数
    const myBest = gameId ? (bestScores[gameId] || 0) : 0
    
    // 更新我的排名卡片
    const myRankCard = document.getElementById('myRankCard')!
    const myRankPosition = document.getElementById('myRankPosition')!
    const myRankScore = document.getElementById('myRankScore')!
    
    if (myBest > 0 && type === 'global') {
      // 将玩家添加到列表中
      const meIdx = items.findIndex(i => i.name === myName)
      if (meIdx >= 0) {
        items[meIdx].score = myBest
      } else {
        items.push({ name: myName, score: myBest })
      }
      
      // 显示我的排名卡片
      myRankCard.style.display = 'flex'
      myRankScore.textContent = myBest.toLocaleString()
    } else {
      myRankCard.style.display = 'none'
    }

    // 排序
    items.sort((a, b) => b.score - a.score)
    
    // 计算我的排名
    if (myBest > 0 && type === 'global') {
      const myRank = items.findIndex(i => i.name === myName) + 1
      myRankPosition.textContent = myRank > 0 ? `#${myRank}` : '-'
    }

    // 渲染列表
    list.innerHTML = items.map((item, i) => {
      const num = i + 1
      let cls = '', topIcon = ''
      if (num === 1) { cls = 'gold'; topIcon = '🥇' }
      else if (num === 2) { cls = 'silver'; topIcon = '🥈' }
      else if (num === 3) { cls = 'bronze'; topIcon = '🥉' }
      
      // 如果是玩家，添加特殊标识
      const isMe = item.name === myName
      const meClass = isMe ? ' rank-me' : ''
      const meBadge = isMe ? '<span class="me-badge">我</span>' : ''
      
      return `
        <div class="rank-item${meClass}" id="${isMe ? 'myRankItem' : ''}">
          <div class="rank-num ${cls} top3">${topIcon || num}</div>
          <div class="rank-avatar">${item.name[0]}</div>
          <div class="rank-name">
            ${item.name}
            ${meBadge}
          </div>
          <div class="rank-score">${item.score.toLocaleString()}</div>
        </div>
      `
    }).join('')
  }

  // ── 将字符串游戏 ID 转换为数字 ID ──────────────────────────────
  private convertGameIdToNumber(gameId: string): number {
    // 使用与 userService 相同的哈希函数
    let hash = 0
    for (let i = 0; i < gameId.length; i++) {
      const char = gameId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash) % 10000 + 1 // 生成 1-10000 之间的数字
  }

  // ── 清除指定游戏的排行榜缓存 ───────────────────────────────────
  private clearRankCache(gameId: string) {
    console.log('[App] 清除排行榜缓存:', gameId)
    // 清除所有类型的缓存（ALL, DAILY, MONTHLY, YEARLY）
    const types = ['ALL', 'DAILY', 'MONTHLY', 'YEARLY']
    types.forEach(type => {
      const cacheKey = `${gameId}_${type}`
      const had = this.rankCache.has(cacheKey)
      this.rankCache.delete(cacheKey)
      if (had) {
        console.log('[App] 已清除缓存:', cacheKey)
      }
    })
  }

  private showDailyPop() {
    document.getElementById('daily-overlay')!.classList.add('show')
  }

  private closeDailyPop() {
    document.getElementById('daily-overlay')!.classList.remove('show')
  }

  /** 用户登录/退出后刷新顶部栏 */
  private onUserChange() {
    const u = userService.current
    const avatarEl = document.getElementById('userAvatar')
    const coinEl = document.getElementById('coinCount')
    const todayEl = document.getElementById('todayGames')
    if (avatarEl) avatarEl.textContent = u ? u.avatar : '我'
    if (coinEl) coinEl.textContent = String(u ? u.coins : storageService.get().coins)
    if (todayEl) todayEl.textContent = String(u ? u.todayGames : storageService.get().todayGames)
    this.refreshBestScores()
    
    // 重新渲染游戏列表以显示排名
    console.log('[App] 用户状态变更，重新渲染游戏列表')
    this.renderGameCards()
  }
  
  // 更新道具数量显示
}

export const app = new App()

