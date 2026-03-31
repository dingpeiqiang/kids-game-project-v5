<template>
  <div class="editor-root fixed inset-0 flex flex-col" style="background:#0a1210; padding-top: env(safe-area-inset-top, 0); z-index: 99999; pointer-events: auto;">
    <!-- ═══ 顶部工具栏 ═══ -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h1 class="toolbar-title">🗺️ 地图编辑器</h1>
        <span class="toolbar-size">13 × 13</span>
      </div>
      <div class="toolbar-center">
        <button class="tb-btn tb-save" @click="saveMap" title="保存到 localStorage">
          💾 <span class="btn-text">保存</span>
        </button>
        <button class="tb-btn tb-load" @click="loadMap" title="从 localStorage 加载">
          📂 <span class="btn-text">加载</span>
        </button>
        <button class="tb-btn tb-export" @click="exportJSON" title="导出 JSON 文件">
          📤 <span class="btn-text">导出</span>
        </button>
        <button class="tb-btn tb-import" @click="triggerImport" title="导入 JSON 文件">
          📥 <span class="btn-text">导入</span>
        </button>
        <button class="tb-btn tb-clear" @click="clearMap" title="清空地图">
          🗑️ <span class="btn-text">清空</span>
        </button>
      </div>
      <div class="toolbar-right">
        <button class="tb-btn tb-close" @click="closeEditor" title="关闭">
          ✕
        </button>
      </div>
    </div>

    <!-- ═══ 主体区域 ═══ -->
    <div class="editor-body">
      <!-- 左侧面板：Tile 选择 -->
      <div class="panel-left">
        <h3 class="panel-heading">图块类型</h3>
        <div class="tile-palette">
          <button
            v-for="tile in tileTypes"
            :key="tile.type"
            class="palette-item"
            :class="{ 'palette-active': selectedTile === tile.type }"
            @click="selectedTile = tile.type"
          >
            <span class="palette-icon">{{ tile.icon }}</span>
            <span class="palette-label">{{ tile.label }}</span>
          </button>
        </div>

        <h3 class="panel-heading" style="margin-top:20px;">地图信息</h3>
        <div class="map-stats">
          <div class="stat-row"><span class="stat-label">砖墙</span><span class="stat-val brick-color">{{ countTile(1) }}</span></div>
          <div class="stat-row"><span class="stat-label">钢墙</span><span class="stat-val steel-color">{{ countTile(2) }}</span></div>
          <div class="stat-row"><span class="stat-label">水域</span><span class="stat-val water-color">{{ countTile(3) }}</span></div>
          <div class="stat-row"><span class="stat-label">草地</span><span class="stat-val grass-color">{{ countTile(4) }}</span></div>
          <div class="stat-row"><span class="stat-label">基地</span><span class="stat-val base-color">{{ countTile(5) }}</span></div>
          <div class="stat-row stat-total"><span class="stat-label">总计</span><span class="stat-val">{{ totalTiles }}</span></div>
        </div>

        <h3 class="panel-heading" style="margin-top:20px;">操作提示</h3>
        <div class="tips">
          <p>🖱️ 左键 — 放置图块</p>
          <p>🖱️ 右键 — 擦除图块</p>
          <p>🔄 滚轮 — 切换类型</p>
        </div>
      </div>

      <!-- 中间网格画布 -->
      <div class="grid-area">
        <div class="grid-scroll">
          <div class="grid-container">
            <div
              v-for="(row, ry) in grid"
              :key="ry"
              class="grid-row"
            >
              <div
                v-for="(cell, cx) in row"
                :key="cx"
                class="grid-cell"
                :class="cellClass(cell)"
                :title="`${cx},${ry} ${cellName(cell)}`"
                @mousedown.prevent="paintCell(cx, ry, $event)"
                @mouseenter="paintDrag(cx, ry, $event)"
                @contextmenu.prevent
              >
                <span v-if="cell > 0" class="cell-icon">{{ tileIcon(cell) }}</span>
                <!-- 玩家出生点标记 -->
                <span v-if="cx === 6 && ry === 11 && cell === 0" class="spawn-marker">🎯</span>
                <!-- 敌人出生点标记 -->
                <span v-if="ry === 0 && [0,6,12].includes(cx) && cell === 0" class="enemy-marker">💀</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <Transition name="toast">
      <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
    </Transition>

    <!-- 隐藏的文件输入 -->
    <input ref="fileInput" type="file" accept=".json" class="hidden" @change="handleImport" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// ── 常量 ──
const GRID_SIZE = 13
const STORAGE_KEY = 'tank-battle-map-editor'

const tileTypes = [
  { type: 1, label: '砖墙', icon: '🧱', color: '#8B4513' },
  { type: 2, label: '钢墙', icon: '🔩', color: '#708090' },
  { type: 3, label: '水域', icon: '🌊', color: '#1E90FF' },
  { type: 4, label: '草地', icon: '🌿', color: '#228B22' },
  { type: 5, label: '基地', icon: '🏠', color: '#FFD700' },
]

const typeToName: Record<number, string> = { 0: '空地', 1: '砖墙', 2: '钢墙', 3: '水域', 4: '草地', 5: '基地' }
const typeToIcon: Record<number, string> = { 0: '', 1: '🧱', 2: '🔩', 3: '🌊', 4: '🌿', 5: '🏠' }

// 经典坦克大战关卡（默认地图）
const CLASSIC_LEVEL: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0],
  [2,1,0,1,2,0,1,0,2,1,0,1,2],
  [1,1,0,1,1,0,1,0,1,1,0,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,0,2,1,0,1,2,0,1,1,0],
  [0,1,0,0,0,1,0,1,0,0,0,1,0],
  [1,1,0,1,0,0,0,0,0,1,0,1,1],
  [0,0,0,1,0,1,2,1,0,1,0,0,0],
  [0,1,0,1,0,1,1,1,0,1,0,1,0],
  [0,1,0,0,0,0,0,0,0,0,0,1,0],
  [0,0,0,0,0,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,1,5,1,0,0,0,0,0],
]

// ── 状态 ──
const selectedTile = ref(1)
const isMouseDown = ref(false)
const eraseMode = ref(false)
const toastMsg = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

// 网格数据 0=空 1=砖墙 2=钢墙 3=水 4=草 5=基地
const grid = ref<number[][]>(CLASSIC_LEVEL.map(row => [...row]))

function createEmptyGrid(): number[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0))
}

// ── 计算属性 ──
const totalTiles = computed(() => grid.value.flat().filter(c => c > 0).length)

function countTile(type: number): number {
  return grid.value.flat().filter(c => c === type).length
}

function tileIcon(type: number): string {
  return typeToIcon[type] || ''
}

function cellName(type: number): string {
  return typeToName[type] || '空地'
}

function cellClass(type: number): Record<string, boolean> {
  return {
    'cell-empty': type === 0,
    'cell-brick': type === 1,
    'cell-steel': type === 2,
    'cell-water': type === 3,
    'cell-grass': type === 4,
    'cell-base': type === 5,
    'cell-spawn': false,
  }
}

// ── 绘制逻辑 ──
const paintCell = (cx: number, cy: number, event: MouseEvent) => {
  isMouseDown.value = true
  eraseMode.value = event.button === 2 // 右键 = 擦除
  applyPaint(cx, cy)
}

const paintDrag = (cx: number, cy: number, _event: MouseEvent) => {
  if (!isMouseDown.value) return
  applyPaint(cx, cy)
}

const applyPaint = (cx: number, cy: number) => {
  // 基地唯一性：放置新基地时清除旧的
  if (selectedTile.value === 5 && !eraseMode.value) {
    const hasBase = grid.value.flat().includes(5)
    if (hasBase) {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (grid.value[r][c] === 5) grid.value[r][c] = 0
        }
      }
    }
  }

  if (eraseMode.value) {
    grid.value[cy][cx] = 0
  } else {
    grid.value[cy][cx] = selectedTile.value
  }
}

const onMouseUp = () => {
  isMouseDown.value = false
  eraseMode.value = false
}

// 滚轮切换 tile 类型
const onWheel = (e: WheelEvent) => {
  e.preventDefault()
  const idx = tileTypes.findIndex(t => t.type === selectedTile.value)
  const dir = e.deltaY > 0 ? 1 : -1
  const next = (idx + dir + tileTypes.length) % tileTypes.length
  selectedTile.value = tileTypes[next].type
}

// ── 保存/加载 ──
const saveMap = () => {
  const data = {
    version: 1,
    gridSize: GRID_SIZE,
    timestamp: Date.now(),
    grid: grid.value,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  showToast('💾 地图已保存')
}

const loadMap = () => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    showToast('⚠️ 没有找到已保存的地图')
    return
  }
  try {
    const data = JSON.parse(raw)
    if (data.grid && data.grid.length === GRID_SIZE) {
      grid.value = data.grid
      showToast('📂 地图已加载')
    } else {
      showToast('⚠️ 地图数据格式不兼容')
    }
  } catch {
    showToast('⚠️ 解析失败')
  }
}

const clearMap = () => {
  if (confirm === undefined) return // 类型检查
  grid.value = createEmptyGrid()
  showToast('🗑️ 地图已清空')
}

// ── 导出/导入 ──
const exportJSON = () => {
  const data = {
    version: 1,
    gridSize: GRID_SIZE,
    timestamp: Date.now(),
    grid: grid.value,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tank_map_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  showToast('📤 JSON 已导出')
}

const triggerImport = () => {
  fileInput.value?.click()
}

const handleImport = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      if (data.grid && data.grid.length === GRID_SIZE) {
        grid.value = data.grid
        showToast('📥 地图已导入')
      } else {
        showToast('⚠️ 文件格式不兼容（需要 13×13 网格）')
      }
    } catch {
      showToast('⚠️ JSON 解析失败')
    }
  }
  reader.readAsText(file)
  input.value = '' // 重置，允许再次选择同一文件
}

// ── Toast ──
let toastTimer: ReturnType<typeof setTimeout> | null = null
const showToast = (msg: string) => {
  toastMsg.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 2000)
}

// ── 关闭 ──
const closeEditor = () => {
  window.dispatchEvent(new CustomEvent('tiled-editor-close'))
}

// ── 生命周期 ──
onMounted(() => {
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('wheel', onWheel, { passive: false })
})

onUnmounted(() => {
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('wheel', onWheel)
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<style scoped>
/* ── 工具栏 ── */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 12px;
  background: linear-gradient(180deg, #162018 0%, #0f1a12 100%);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
  position: relative;
  z-index: 9999;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.toolbar-title {
  color: #fbbf24;
  font-size: 15px;
  font-weight: 800;
  margin: 0;
}
.toolbar-size {
  color: #6b7280;
  font-size: 11px;
  background: rgba(255,255,255,0.06);
  padding: 2px 8px;
  border-radius: 6px;
}
.toolbar-center {
  display: flex;
  gap: 6px;
}
.toolbar-right {
  display: flex;
  gap: 6px;
}
.tb-btn {
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.06);
  color: #d1d5db;
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
}
.tb-btn:hover { background: rgba(255,255,255,0.14); }
.tb-btn:active { transform: scale(0.96); }
.tb-save  { border-color: rgba(34,197,94,0.3); color: #86efac; }
.tb-load  { border-color: rgba(96,165,250,0.3); color: #93c5fd; }
.tb-export { border-color: rgba(168,85,247,0.3); color: #c4b5fd; }
.tb-import { border-color: rgba(251,191,36,0.3); color: #fcd34d; }
.tb-clear { border-color: rgba(239,68,68,0.25); color: #fca5a5; }
.tb-close {
  width: 32px; height: 32px; padding: 0;
  display: flex; align-items: center; justify-content: center;
  border-color: rgba(239,68,68,0.3); color: #f87171; font-size: 14px;
}
.tb-close:hover { background: rgba(239,68,68,0.2); }

/* ── 主体 ── */
.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ── 左侧面板 ── */
.panel-left {
  width: 180px;
  flex-shrink: 0;
  padding: 14px 10px;
  background: rgba(0,0,0,0.25);
  border-right: 1px solid rgba(255,255,255,0.06);
  overflow-y: auto;
}
.panel-heading {
  color: #9ca3af;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 8px 0;
}
.tile-palette {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.palette-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: #d1d5db;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.12s;
  text-align: left;
}
.palette-item:hover { background: rgba(255,255,255,0.06); }
.palette-active {
  border-color: #fbbf24 !important;
  background: rgba(251,191,36,0.1) !important;
  color: #fbbf24 !important;
}
.palette-icon { font-size: 18px; flex-shrink: 0; }
.palette-label { font-weight: 600; }

/* ── 地图统计 ── */
.map-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(255,255,255,0.03);
}
.stat-label { font-size: 12px; color: #9ca3af; }
.stat-val { font-size: 12px; font-weight: 700; color: #e5e7eb; }
.brick-color { color: #d97706 !important; }
.steel-color { color: #94a3b8 !important; }
.water-color { color: #60a5fa !important; }
.grass-color { color: #4ade80 !important; }
.base-color { color: #fbbf24 !important; }
.stat-total {
  margin-top: 4px;
  border-top: 1px solid rgba(255,255,255,0.08);
  padding-top: 6px;
}

/* ── 操作提示 ── */
.tips { font-size: 11px; color: #6b7280; line-height: 1.8; }
.tips p { margin: 0; }

/* ── 网格区域 ── */
.grid-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 16px;
}
.grid-scroll {
  display: flex;
  align-items: center;
  justify-content: center;
}
.grid-container {
  display: inline-grid;
  grid-template-columns: repeat(13, 1fr);
  gap: 2px;
  padding: 8px;
  background: rgba(255,255,255,0.02);
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.06);
}
.grid-row {
  display: contents;
}
.grid-cell {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.08s, transform 0.08s;
  user-select: none;
  position: relative;
}
.grid-cell:hover { transform: scale(1.06); z-index: 2; }

.cell-empty {
  background: rgba(26,77,46,0.3);
  border: 1px solid rgba(255,255,255,0.04);
}
.cell-empty:hover { background: rgba(26,77,46,0.6); }

.cell-brick {
  background: linear-gradient(145deg, #8B4513, #A0522D);
  border: 1px solid rgba(139,69,19,0.5);
  box-shadow: inset 0 1px 2px rgba(255,255,255,0.15);
}
.cell-steel {
  background: linear-gradient(145deg, #708090, #4a5568);
  border: 1px solid rgba(112,128,144,0.5);
  box-shadow: inset 0 1px 2px rgba(255,255,255,0.2);
}
.cell-water {
  background: linear-gradient(145deg, #1E90FF, #1565C0);
  border: 1px solid rgba(30,144,255,0.4);
  animation: waterShimmer 2s ease-in-out infinite;
}
.cell-grass {
  background: linear-gradient(145deg, #228B22, #1a6b1a);
  border: 1px solid rgba(34,139,34,0.4);
}
.cell-base {
  background: linear-gradient(145deg, #FFD700, #FFA000);
  border: 1px solid rgba(255,215,0,0.5);
  box-shadow: 0 0 12px rgba(255,215,0,0.25);
}

.cell-icon {
  font-size: 20px;
  line-height: 1;
  pointer-events: none;
}
.spawn-marker {
  font-size: 14px;
  opacity: 0.5;
  pointer-events: none;
}
.enemy-marker {
  font-size: 12px;
  opacity: 0.35;
  pointer-events: none;
}

@keyframes waterShimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.75; }
}

/* ── Toast ── */
.toast {
  position: fixed;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 24px;
  background: rgba(0,0,0,0.85);
  color: #fbbf24;
  font-size: 13px;
  font-weight: 600;
  border-radius: 12px;
  border: 1px solid rgba(251,191,36,0.3);
  backdrop-filter: blur(8px);
  z-index: 100;
  pointer-events: none;
}
.toast-enter-active { transition: all 0.25s ease-out; }
.toast-leave-active { transition: all 0.15s ease-in; }
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(12px); }
.toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-8px); }

/* ── 滚动条 ── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

/* ── 响应式 ── */
@media (max-width: 640px) {
  .panel-left { width: 140px; padding: 10px 6px; }
  .grid-cell { width: 28px; height: 28px; }
  .cell-icon { font-size: 14px; }
  .spawn-marker { font-size: 10px; }
  .toolbar-center {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .tb-btn {
    padding: 4px 8px;
    font-size: 11px;
  }
  .tb-btn .btn-text { display: none; }
}
</style>
