import { apiShopProducts, apiShopPurchase, apiTaskList, apiTaskClaim } from '../services/apiClient'
import { userService } from '../services/userService'
import { showToast } from '../services/userUI'

export type TaskRow = {
  taskId: number
  taskCode?: string
  taskName: string
  taskDesc?: string
  targetValue: number
  progress: number
  coinsReward?: number
  expReward?: number
  status: number
}

const TASK_ICONS: Record<string, string> = {
  daily_sign_in: '📅',
  daily_play_3: '🎮',
}

function taskIcon(code?: string) {
  return (code && TASK_ICONS[code]) || '🎯'
}

function syncWalletDom() {
  const u = userService.current
  const coinEl = document.getElementById('coinCount')
  const studyEl = document.getElementById('studyCoinCount')
  if (coinEl) coinEl.textContent = String(u?.coins ?? 0)
  if (studyEl) studyEl.textContent = String(u?.studyCoins ?? 0)
  window.dispatchEvent(new CustomEvent('ugp:userChange'))
}

function ensureShopOverlay() {
  if (document.getElementById('shop-overlay')) return
  const el = document.createElement('div')
  el.id = 'shop-overlay'
  el.className = 'econ-overlay'
  el.innerHTML = `
    <div class="econ-card shop-card">
      <div class="econ-header">
        <span class="econ-title">商城</span>
        <button type="button" class="econ-close" id="shopClose" aria-label="关闭">×</button>
      </div>
      <p class="econ-hint">100 金币可兑换 1 游学币，金币主要通过完成任务获得</p>
      <div id="shopProductList" class="shop-list">加载中...</div>
    </div>
  `
  document.body.appendChild(el)
  el.addEventListener('click', e => {
    if (e.target === el) closeShop()
  })
  document.getElementById('shopClose')?.addEventListener('click', () => closeShop())
}

function ensureTaskOverlay() {
  if (document.getElementById('task-overlay')) return
  const el = document.createElement('div')
  el.id = 'task-overlay'
  el.className = 'econ-overlay'
  el.innerHTML = `
    <div class="econ-card task-card">
      <div class="econ-header">
        <span class="econ-title">任务中心</span>
        <button type="button" class="econ-close" id="taskClose" aria-label="关闭">×</button>
      </div>
      <div id="taskCenterList" class="task-list">加载中...</div>
    </div>
  `
  document.body.appendChild(el)
  el.addEventListener('click', e => {
    if (e.target === el) closeTaskCenter()
  })
  document.getElementById('taskClose')?.addEventListener('click', () => closeTaskCenter())
}

export async function openShop() {
  if (!userService.isLoggedIn) {
    showToast('请先登录后使用商城', 'info')
    return
  }
  ensureShopOverlay()
  document.getElementById('shop-overlay')!.classList.add('show')
  await renderShopProducts()
}

export function closeShop() {
  document.getElementById('shop-overlay')?.classList.remove('show')
}

export async function renderShopProducts(containerId = 'shopProductList') {
  const listEl = document.getElementById(containerId)
  if (!listEl) return
  listEl.innerHTML = '<div class="econ-loading">加载商品...</div>'
  const res = await apiShopProducts()
  if (!res.ok || !res.data?.length) {
    listEl.innerHTML = '<div class="econ-empty">暂无商品</div>'
    return
  }
  listEl.innerHTML = res.data
    .map(p => {
      const id = Number(p.productId)
      const name = String(p.productName ?? '商品')
      const price = Number(p.priceCoins ?? 100)
      const grant = Number(p.grantStudyCoins ?? 1)
      return `
        <div class="shop-item">
          <div class="shop-item-info">
            <div class="shop-item-name">${name}</div>
            <div class="shop-item-desc">${price} 金币 → ${grant} 游学币</div>
          </div>
          <button type="button" class="btn btn-primary shop-buy-btn" data-product-id="${id}">兑换</button>
        </div>
      `
    })
    .join('')

  listEl.querySelectorAll('.shop-buy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const productId = Number((btn as HTMLElement).dataset.productId)
      const b = btn as HTMLButtonElement
      b.disabled = true
      const buy = await apiShopPurchase(productId, 1)
      b.disabled = false
      if (buy.ok && buy.data) {
        const w = buy.data.wallet as { coins?: number; studyCoins?: number } | undefined
        if (userService.current && w) {
          if (w.coins != null) userService.current.coins = w.coins
          if (w.studyCoins != null) userService.current.studyCoins = w.studyCoins
          userService.saveUser(userService.current)
        } else {
          await userService.refreshStudyCoins()
        }
        syncWalletDom()
        showToast('兑换成功！', 'success')
      } else {
        showToast(buy.msg || String(buy.data?.message ?? '兑换失败'), 'error')
      }
    })
  })
}

export async function openTaskCenter() {
  if (!userService.isLoggedIn) {
    showToast('请先登录查看任务', 'info')
    return
  }
  ensureTaskOverlay()
  document.getElementById('task-overlay')!.classList.add('show')
  await renderTaskList()
}

export function closeTaskCenter() {
  document.getElementById('task-overlay')?.classList.remove('show')
}

function taskStatusLabel(row: TaskRow): string {
  if (row.status >= 2) return '已领取'
  if (row.status === 1) return '可领取'
  return `${row.progress}/${row.targetValue}`
}

function mapTaskRow(raw: Record<string, unknown>): TaskRow {
  return {
    taskId: Number(raw.taskId),
    taskCode: String(raw.taskCode ?? ''),
    taskName: String(raw.taskName ?? '任务'),
    taskDesc: raw.taskDesc ? String(raw.taskDesc) : undefined,
    targetValue: Number(raw.targetValue ?? 1),
    progress: Number(raw.progress ?? 0),
    coinsReward: Number(raw.coinsReward ?? 0),
    expReward: Number(raw.expReward ?? 0),
    status: Number(raw.status ?? 0),
  }
}

export async function fetchTasksForBanner(): Promise<TaskRow[]> {
  if (!userService.isLoggedIn) return []
  const res = await apiTaskList()
  if (!res.ok || !res.data) return []
  return res.data.map(r => mapTaskRow(r as Record<string, unknown>)).slice(0, 3)
}

export function bannerTaskView(t: TaskRow) {
  const pct = Math.min(100, Math.round((t.progress / Math.max(1, t.targetValue)) * 100))
  return {
    id: String(t.taskId),
    icon: taskIcon(t.taskCode),
    name: t.taskName,
    current: t.progress,
    target: t.targetValue,
    percent: pct,
    status: t.status >= 2 ? '已领取' : t.status === 1 ? '可领取' : `${t.progress}/${t.targetValue}`,
    canClaim: t.status === 1,
    taskId: t.taskId,
  }
}

export async function renderTaskList(containerId = 'taskCenterList') {
  const listEl = document.getElementById(containerId)
  if (!listEl) return
  listEl.innerHTML = '<div class="econ-loading">加载任务...</div>'
  const res = await apiTaskList()
  if (!res.ok) {
    listEl.innerHTML = `<div class="econ-empty">${res.msg || '加载失败，请稍后重试'}</div>`
    return
  }
  if (!res.data?.length) {
    listEl.innerHTML = '<div class="econ-empty">暂无任务</div>'
    return
  }
  const rows = res.data.map(r => mapTaskRow(r as Record<string, unknown>))

  listEl.innerHTML = rows
    .map(t => {
      const pct = Math.min(100, Math.round((t.progress / Math.max(1, t.targetValue)) * 100))
      const canClaim = t.status === 1
      const done = t.status >= 2
      return `
        <div class="task-item ${done ? 'task-done' : ''}">
          <div class="task-item-head">
            <span class="task-item-name">${taskIcon(t.taskCode)} ${t.taskName}</span>
            <span class="task-reward">+${t.coinsReward} 金币 ${t.expReward ? `+${t.expReward} 经验` : ''}</span>
          </div>
          ${t.taskDesc ? `<div class="task-item-desc">${t.taskDesc}</div>` : ''}
          <div class="db-task-bar"><div class="db-task-progress" style="width:${pct}%"></div></div>
          <div class="task-item-foot">
            <span>${taskStatusLabel(t)}</span>
            ${canClaim ? `<button type="button" class="btn btn-primary task-claim-btn" data-task-id="${t.taskId}">领取</button>` : ''}
          </div>
        </div>
      `
    })
    .join('')

  listEl.querySelectorAll('.task-claim-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const taskId = Number((btn as HTMLElement).dataset.taskId)
      const b = btn as HTMLButtonElement
      b.disabled = true
      const claim = await apiTaskClaim(taskId)
      b.disabled = false
      if (claim.ok && claim.data && (claim.data as Record<string, unknown>).success === true) {
        const w = (claim.data as Record<string, unknown>).wallet as { coins?: number; studyCoins?: number; exp?: number } | undefined
        if (userService.current && w) {
          if (w.coins != null) userService.current.coins = w.coins
          if (w.studyCoins != null) userService.current.studyCoins = w.studyCoins
          if (w.exp != null) userService.current.exp = w.exp
          userService.saveUser(userService.current)
        }
        syncWalletDom()
        showToast('任务奖励已领取', 'success')
        await renderTaskList(containerId)
        window.dispatchEvent(new CustomEvent('ugp:tasksRefresh'))
      } else {
        showToast(String((claim.data as Record<string, unknown>)?.message ?? claim.msg ?? '领取失败'), 'error')
      }
    })
  })
}

export function bindEconomyButtons() {
  ensureShopOverlay()
  ensureTaskOverlay()
  const bind = (id: string, fn: () => void) => {
    const el = document.getElementById(id)
    if (el && !el.dataset.bound) {
      el.dataset.bound = '1'
      el.addEventListener('click', () => fn())
    }
  }
  bind('btnOpenShop', () => openShop())
  bind('btnHubShop', () => openShop())
  bind('btnTaskCenter', () => openTaskCenter())
  bind('btnHubTask', () => openTaskCenter())
}