<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="manage-modal" @click.stop>
      <!-- 头部 -->
      <div class="modal-header">
        <h3 class="modal-title">🛡️ 管控中心</h3>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>

      <div v-if="isLoading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else class="modal-body">
        <!-- 左侧：孩子列表 -->
        <aside class="kids-sidebar">
          <div class="sidebar-title">
            <span>👶</span>
            <span>我的孩子</span>
          </div>

          <div v-if="children && children.length > 0" class="kids-list">
            <div
              v-for="kid in children"
              :key="kid.kidId"
              class="kid-card"
              :class="{ active: selectedKidId === kid.kidId }"
              @click="selectKid(kid)"
            >
              <div class="kid-avatar-large">{{ kid.avatar || '👦' }}</div>
              <div class="kid-info">
                <div class="kid-name">{{ kid.nickname || kid.username }}</div>
                <div class="kid-stats">
                  <span class="stat-badge authorized">
                    ✓ {{ getAuthorizedCount(kid.kidId) }}个游戏
                  </span>
                  <span class="stat-badge blocked" v-if="getBlockedCount(kid.kidId) > 0">
                    ✕ {{ getBlockedCount(kid.kidId) }}个屏蔽
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-kids">
            <span>📋</span>
            <p>还没有绑定孩子</p>
            <button @click="$emit('bindChild')" class="add-kid-btn">添加孩子</button>
          </div>
        </aside>

        <!-- 右侧：管理内容 -->
        <main class="manage-content" v-if="selectedKid">
          <!-- 孩子信息栏 -->
          <div class="kid-info-bar">
            <div class="kid-info-main">
              <div class="kid-avatar-medium">{{ selectedKid.avatar || '👦' }}</div>
              <div class="kid-details">
                <h4 class="kid-name-large">{{ selectedKid.nickname || selectedKid.username }}</h4>
                <p class="kid-username">@{{ selectedKid.username }}</p>
              </div>
            </div>
            <div class="kid-summary">
              <div class="summary-item">
                <span class="summary-icon">🎮</span>
                <div class="summary-content">
                  <span class="summary-value">{{ allGames.length }}</span>
                  <span class="summary-label">全部游戏</span>
                </div>
              </div>
              <div class="summary-item">
                <span class="summary-icon authorized">✓</span>
                <div class="summary-content">
                  <span class="summary-value authorized">{{ getAuthorizedCount(selectedKid.kidId) }}</span>
                  <span class="summary-label">已授权</span>
                </div>
              </div>
              <div class="summary-item">
                <span class="summary-icon blocked">✕</span>
                <div class="summary-content">
                  <span class="summary-value blocked">{{ getBlockedCount(selectedKid.kidId) }}</span>
                  <span class="summary-label">已屏蔽</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 管理标签页 -->
          <div class="manage-tabs">
            <button
              v-for="tab in manageTabs"
              :key="tab.id"
              class="manage-tab"
              :class="{ active: currentManageTab === tab.id }"
              @click="currentManageTab = tab.id"
            >
              <span class="tab-icon">{{ tab.icon }}</span>
              <span class="tab-label">{{ tab.label }}</span>
            </button>
          </div>

          <!-- 游戏授权管理 -->
          <div v-show="currentManageTab === 'games'" class="tab-content games-tab">
            <!-- 操作栏 -->
            <div class="action-bar">
              <div class="search-box">
                <input
                  v-model="searchKeyword"
                  type="text"
                  placeholder="搜索游戏..."
                  class="search-input"
                />
              </div>
              <div class="filter-buttons">
                <button
                  @click="filterMode = 'all'"
                  class="filter-btn"
                  :class="{ active: filterMode === 'all' }"
                >
                  全部 ({{ allGames.length }})
                </button>
                <button
                  @click="filterMode = 'authorized'"
                  class="filter-btn"
                  :class="{ active: filterMode === 'authorized' }"
                >
                  已授权 ({{ getAuthorizedCount(selectedKid.kidId) }})
                </button>
                <button
                  @click="filterMode = 'blocked'"
                  class="filter-btn"
                  :class="{ active: filterMode === 'blocked' }"
                >
                  已屏蔽 ({{ getBlockedCount(selectedKid.kidId) }})
                </button>
              </div>
              <button
                v-if="filterMode !== 'all'"
                @click="batchToggleGames"
                class="batch-btn"
                :disabled="filteredGames.length === 0"
              >
                {{ filterMode === 'blocked' ? '🔓 批量解锁' : '🔒 批量屏蔽' }}
              </button>
            </div>

            <!-- 游戏列表 -->
            <div class="games-list">
              <div
                v-for="game in filteredGames"
                :key="game.gameId"
                class="game-item"
                :class="{ blocked: isGameBlocked(selectedKid.kidId, game.gameId) }"
              >
                <div class="game-cover">
                  <span class="game-emoji">{{ getGameEmoji(game.category) }}</span>
                  <div v-if="isGameBlocked(selectedKid.kidId, game.gameId)" class="blocked-badge">已屏蔽</div>
                </div>
                <div class="game-details">
                  <h5 class="game-title">{{ game.gameName }}</h5>
                  <div class="game-meta">
                    <span class="game-category">{{ getCategoryName(game.category) }}</span>
                    <span class="game-grade">{{ getGradeName(game.grade) }}</span>
                  </div>
                  <div class="game-progress">
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        :class="{
                          authorized: !isGameBlocked(selectedKid.kidId, game.gameId),
                          blocked: isGameBlocked(selectedKid.kidId, game.gameId)
                        }"
                        :style="{ width: isGameBlocked(selectedKid.kidId, game.gameId) ? '0%' : '100%' }"
                      ></div>
                    </div>
                    <span class="progress-text">
                      {{ isGameBlocked(selectedKid.kidId, game.gameId) ? '已屏蔽' : '已授权' }}
                    </span>
                  </div>
                </div>
                <div class="game-action">
                  <button
                    @click="toggleGameBlock(game.gameId)"
                    class="toggle-btn"
                    :class="{
                      blocked: isGameBlocked(selectedKid.kidId, game.gameId),
                      authorized: !isGameBlocked(selectedKid.kidId, game.gameId)
                    }"
                  >
                    <span class="toggle-icon">
                      {{ isGameBlocked(selectedKid.kidId, game.gameId) ? '🔓' : '🔒' }}
                    </span>
                    <span class="toggle-text">
                      {{ isGameBlocked(selectedKid.kidId, game.gameId) ? '解锁' : '屏蔽' }}
                    </span>
                  </button>
                </div>
              </div>

              <div v-if="filteredGames.length === 0" class="empty-games">
                <span class="empty-icon">🎮</span>
                <p>{{ getEmptyText() }}</p>
              </div>
            </div>
          </div>

          <!-- 规则设置 -->
          <div v-show="currentManageTab === 'rules'" class="tab-content rules-tab">
            <div class="rules-container">
              <!-- 时长限制 -->
              <div class="rule-section">
                <div class="rule-header">
                  <span class="rule-icon">⏱️</span>
                  <h5>时长限制</h5>
                </div>
                <div class="rule-content">
                  <div class="rule-item">
                    <label class="rule-label">
                      每日游戏时长
                      <span class="rule-value">{{ rules.dailyDuration || 0 }} 分钟</span>
                    </label>
                    <input
                      v-model.number="rules.dailyDuration"
                      type="range"
                      min="0"
                      max="720"
                      step="15"
                      class="rule-slider"
                    />
                  </div>
                  <div class="rule-item">
                    <label class="rule-label">
                      单次游戏时长
                      <span class="rule-value">{{ rules.singleDuration || 0 }} 分钟</span>
                    </label>
                    <input
                      v-model.number="rules.singleDuration"
                      type="range"
                      min="0"
                      max="120"
                      step="5"
                      class="rule-slider"
                    />
                  </div>
                </div>
              </div>

              <!-- 时间段限制 -->
              <div class="rule-section">
                <div class="rule-header">
                  <span class="rule-icon">🕐</span>
                  <h5>时间段限制</h5>
                </div>
                <div class="rule-content">
                  <div class="rule-item">
                    <label class="rule-label">允许游戏时段</label>
                    <div class="time-range-inputs">
                      <div class="time-input-wrapper">
                        <label>开始</label>
                        <input
                          v-model="rules.startTime"
                          type="time"
                          class="time-input"
                        />
                      </div>
                      <span class="time-separator">至</span>
                      <div class="time-input-wrapper">
                        <label>结束</label>
                        <input
                          v-model="rules.endTime"
                          type="time"
                          class="time-input"
                        />
                      </div>
                    </div>
                    <p class="rule-hint">留空则不限制</p>
                  </div>
                </div>
              </div>

              <!-- 疲劳点系统 -->
              <div class="rule-section">
                <div class="rule-header">
                  <span class="rule-icon">⭐</span>
                  <h5>疲劳点系统</h5>
                </div>
                <div class="rule-content">
                  <div class="rule-item">
                    <label class="toggle-switch">
                      <input v-model="rules.enableFatiguePoints" type="checkbox" />
                      <span class="toggle-slider"></span>
                      <span class="toggle-label">启用疲劳点系统</span>
                    </label>
                  </div>
                  <div v-if="rules.enableFatiguePoints" class="rule-item">
                    <label class="rule-label">
                      每日疲劳点上限
                      <span class="rule-value">{{ rules.maxFatiguePoints || 10 }} 点</span>
                    </label>
                    <input
                      v-model.number="rules.maxFatiguePoints"
                      type="range"
                      min="1"
                      max="20"
                      class="rule-slider"
                    />
                    <p class="rule-hint">建议设置为 5-10 点</p>
                  </div>
                </div>
              </div>

              <!-- 保存按钮 -->
              <div class="rules-actions">
                <button @click="saveRules" class="save-rules-btn" :disabled="isSaving">
                  {{ isSaving ? '保存中...' : '💾 保存设置' }}
                </button>
              </div>
            </div>
          </div>
        </main>

        <!-- 未选择孩子时的提示 -->
        <div v-else class="no-kid-selected">
          <span class="empty-icon">👶</span>
          <p>请从左侧选择一个孩子开始管理</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Game {
  gameId: number;
  gameName: string;
  category: string;
  grade: string;
}

interface Kid {
  kidId: number;
  username: string;
  nickname?: string;
  avatar?: string;
}

interface Rules {
  dailyDuration: number;
  singleDuration: number;
  startTime: string;
  endTime: string;
  enableFatiguePoints: boolean;
  maxFatiguePoints: number;
}

const props = defineProps<{
  show: boolean;
  allGames: Game[];
  children?: Kid[];
  isLoading: boolean;
  rules: Rules;
}>();

const emit = defineEmits<{
  close: [];
  bindChild: [];
  blockGame: [kidId: number, gameId: number];
  unblockGame: [kidId: number, gameId: number];
  saveRules: [];
}>();

const selectedKid = ref<Kid | null>(null);
const selectedKidId = ref<number | null>(null);
const currentManageTab = ref('games');
const filterMode = ref<'all' | 'authorized' | 'blocked'>('all');
const searchKeyword = ref('');
const isSaving = ref(false);

// 存储每个孩子的被屏蔽游戏ID列表
const kidBlockedGames = ref<Map<number, number[]>>(new Map());

const manageTabs = ref([
  { id: 'games', label: '游戏管理', icon: '🎮' },
  { id: 'rules', label: '规则设置', icon: '⚙️' },
]);

// 获取某个孩子的被屏蔽游戏列表
function getBlockedGameIds(kidId: number): number[] {
  return kidBlockedGames.value.get(kidId) || [];
}

// 获取某个孩子的授权游戏数量
function getAuthorizedCount(kidId: number): number {
  const blockedIds = getBlockedGameIds(kidId);
  return props.allGames.filter(game => !blockedIds.includes(game.gameId)).length;
}

// 获取某个孩子的屏蔽游戏数量
function getBlockedCount(kidId: number): number {
  return getBlockedGameIds(kidId).length;
}

// 判断某个游戏是否被屏蔽
function isGameBlocked(kidId: number, gameId: number): boolean {
  return getBlockedGameIds(kidId).includes(gameId);
}

// 过滤后的游戏列表
const filteredGames = computed(() => {
  let games = props.allGames;

  // 搜索过滤
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase();
    games = games.filter(game =>
      game.gameName.toLowerCase().includes(keyword) ||
      getCategoryName(game.category).toLowerCase().includes(keyword)
    );
  }

  // 模式过滤
  const blockedIds = selectedKid.value ? getBlockedGameIds(selectedKid.value.kidId) : [];
  if (filterMode.value === 'authorized') {
    games = games.filter(game => !blockedIds.includes(game.gameId));
  } else if (filterMode.value === 'blocked') {
    games = games.filter(game => blockedIds.includes(game.gameId));
  }

  return games;
});

// 选择孩子
function selectKid(kid: Kid) {
  selectedKid.value = kid;
  selectedKidId.value = kid.kidId;
  // 初始化该孩子的屏蔽列表（如果还没有）
  if (!kidBlockedGames.value.has(kid.kidId)) {
    kidBlockedGames.value.set(kid.kidId, []);
  }
}

// 切换游戏的屏蔽状态
async function toggleGameBlock(gameId: number) {
  if (!selectedKid.value) return;

  const kidId = selectedKid.value.kidId;
  const isBlocked = isGameBlocked(kidId, gameId);

  try {
    if (isBlocked) {
      await emit('unblockGame', kidId, gameId);
      // 更新本地状态
      const blockedIds = getBlockedGameIds(kidId);
      const index = blockedIds.indexOf(gameId);
      if (index > -1) {
        blockedIds.splice(index, 1);
        kidBlockedGames.value.set(kidId, blockedIds);
      }
    } else {
      await emit('blockGame', kidId, gameId);
      // 更新本地状态
      const blockedIds = getBlockedGameIds(kidId);
      blockedIds.push(gameId);
      kidBlockedGames.value.set(kidId, blockedIds);
    }
  } catch (error) {
    console.error('操作失败:', error);
  }
}

// 批量切换游戏状态
async function batchToggleGames() {
  if (!selectedKid.value || filteredGames.value.length === 0) return;

  const kidId = selectedKid.value.kidId;
  const shouldBlock = filterMode.value === 'authorized';

  for (const game of filteredGames.value) {
    const isBlocked = isGameBlocked(kidId, game.gameId);
    if (isBlocked !== shouldBlock) {
      if (shouldBlock) {
        await emit('blockGame', kidId, game.gameId);
      } else {
        await emit('unblockGame', kidId, game.gameId);
      }
    }
  }
}

// 保存规则
async function saveRules() {
  isSaving.value = true;
  try {
    await emit('saveRules');
  } finally {
    isSaving.value = false;
  }
}

// 获取游戏emoji
function getGameEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    'creative': '🎨',
    'puzzle': '🧩',
    'math': '🔢',
    'adventure': '⚔️',
  };
  return emojiMap[category] || '🎮';
}

// 获取分类名称
function getCategoryName(category: string): string {
  const categoryMap: Record<string, string> = {
    'creative': '手工',
    'puzzle': '益智',
    'math': '数学',
    'adventure': '冒险',
  };
  return categoryMap[category] || category;
}

// 获取年级名称
function getGradeName(grade: string): string {
  const gradeMap: Record<string, string> = {
    '1': '小班',
    '2': '中班',
    '3': '大班',
    '4': '一年级',
    '5': '二年级',
    '6': '三年级',
  };
  return gradeMap[grade] || grade;
}

// 获取空状态文本
function getEmptyText(): string {
  if (searchKeyword.value.trim()) {
    return '没有找到匹配的游戏';
  }
  switch (filterMode.value) {
    case 'authorized':
      return '还没有授权任何游戏';
    case 'blocked':
      return '还没有屏蔽任何游戏';
    default:
      return '暂无游戏';
  }
}

// 监听children变化，自动选择第一个孩子
watch(() => props.children, (newChildren) => {
  if (newChildren && newChildren.length > 0 && !selectedKid.value) {
    selectKid(newChildren[0]);
  }
}, { immediate: true });
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.manage-modal {
  background: white;
  border-radius: 20px;
  width: 95vw;
  max-width: 1400px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
}

/* 头部 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 2px solid #f3f4f6;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 20px 0 0;
}

.modal-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

/* 加载状态 */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #666;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 主体内容 */
.modal-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左侧孩子列表 */
.kids-sidebar {
  width: 320px;
  background: #f9fafb;
  border-right: 2px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-title {
  padding: 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.kids-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.kid-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.kid-card:hover {
  border-color: #667eea;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.kid-card.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #e0e7ff 0%, #f0f9ff 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.kid-avatar-large {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  flex-shrink: 0;
}

.kid-info {
  flex: 1;
  min-width: 0;
}

.kid-info .kid-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.kid-stats {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.stat-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.stat-badge.authorized {
  background: #dcfce7;
  color: #166534;
}

.stat-badge.blocked {
  background: #fee2e2;
  color: #dc2626;
}

.empty-kids {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #999;
  text-align: center;
}

.empty-kids .empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-kids p {
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.add-kid-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.add-kid-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 右侧管理内容 */
.manage-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 孩子信息栏 */
.kid-info-bar {
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 2px solid #e5e7eb;
}

.kid-info-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.kid-avatar-medium {
  font-size: 3rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.kid-details .kid-name-large {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  color: #333;
  font-weight: 600;
}

.kid-details .kid-username {
  color: #666;
  font-size: 0.9rem;
}

.kid-summary {
  display: flex;
  gap: 1.5rem;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.summary-icon {
  font-size: 1.5rem;
}

.summary-icon.authorized {
  color: #10b981;
}

.summary-icon.blocked {
  color: #ef4444;
}

.summary-content {
  display: flex;
  flex-direction: column;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: #333;
}

.summary-value.authorized {
  color: #10b981;
}

.summary-value.blocked {
  color: #ef4444;
}

.summary-label {
  font-size: 0.75rem;
  color: #666;
}

/* 管理标签页 */
.manage-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 2px solid #e5e7eb;
}

.manage-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: transparent;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  transition: all 0.3s;
}

.manage-tab:hover {
  background: #f9fafb;
}

.manage-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tab-icon {
  font-size: 1.25rem;
}

/* 标签内容 */
.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

/* 游戏列表 */
.action-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
}

.filter-btn {
  padding: 0.5rem 1rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: #666;
  transition: all 0.3s;
}

.filter-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.filter-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.batch-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.3s;
}

.batch-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.batch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.games-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.game-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.3s;
}

.game-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.game-item.blocked {
  background: #fef2f2;
  border-color: #fecaca;
}

.game-cover {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border-radius: 10px;
  flex-shrink: 0;
}

.game-emoji {
  font-size: 2.5rem;
}

.blocked-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
}

.game-details {
  flex: 1;
  min-width: 0;
}

.game-title {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #333;
  font-weight: 600;
}

.game-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.game-category,
.game-grade {
  font-size: 0.8rem;
  color: #666;
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  border-radius: 6px;
}

.game-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s;
}

.progress-fill.authorized {
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
}

.progress-fill.blocked {
  background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
}

.progress-text {
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
}

.game-action {
  flex-shrink: 0;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 2px solid;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.3s;
}

.toggle-btn.authorized {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #d97706;
}

.toggle-btn.authorized:hover {
  background: #fde68a;
}

.toggle-btn.blocked {
  background: #dcfce7;
  border-color: #10b981;
  color: #059669;
}

.toggle-btn.blocked:hover {
  background: #bbf7d0;
}

.toggle-icon {
  font-size: 1rem;
}

.empty-games {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #999;
}

.empty-games .empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

/* 规则设置 */
.rules-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.rule-section {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.rule-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-bottom: 2px solid #e5e7eb;
}

.rule-header h5 {
  margin: 0;
  font-size: 1rem;
  color: #333;
  font-weight: 600;
}

.rule-icon {
  font-size: 1.5rem;
}

.rule-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.rule-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.rule-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  color: #333;
}

.rule-value {
  color: #667eea;
  font-weight: 600;
}

.rule-slider {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
}

.rule-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.rule-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.time-range-inputs {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.time-input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-input-wrapper label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.time-input {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.time-input:focus {
  outline: none;
  border-color: #667eea;
}

.time-separator {
  color: #666;
  font-weight: 500;
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 10px;
  transition: all 0.3s;
}

.toggle-switch:hover {
  background: #f3f4f6;
}

.toggle-switch input {
  display: none;
}

.toggle-slider {
  width: 50px;
  height: 26px;
  background: #cbd5e1;
  border-radius: 13px;
  position: relative;
  transition: all 0.3s;
}

.toggle-switch input:checked + .toggle-slider {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.toggle-slider::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  top: 3px;
  left: 3px;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked + .toggle-slider::after {
  left: 27px;
}

.toggle-label {
  font-weight: 500;
  color: #333;
}

.rule-hint {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
}

.rules-actions {
  padding-top: 1rem;
}

.save-rules-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.save-rules-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.save-rules-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 未选择孩子 */
.no-kid-selected {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  background: #f9fafb;
}

.no-kid-selected .empty-icon {
  font-size: 6rem;
  margin-bottom: 1rem;
}

.no-kid-selected p {
  font-size: 1.1rem;
}

/* 响应式 */
@media (max-width: 1024px) {
  .manage-modal {
    flex-direction: column;
    max-height: 95vh;
  }

  .kids-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 2px solid #e5e7eb;
    max-height: 250px;
  }

  .kid-info-bar {
    padding: 1rem;
  }

  .kid-avatar-medium {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }

  .kid-summary {
    gap: 0.75rem;
  }

  .summary-item {
    padding: 0.5rem 0.75rem;
  }

  .summary-value {
    font-size: 1rem;
  }
}

@media (max-width: 768px) {
  .modal-header {
    padding: 1rem;
  }

  .modal-title {
    font-size: 1.2rem;
  }

  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-buttons {
    overflow-x: auto;
  }

  .filter-btn {
    white-space: nowrap;
  }

  .game-item {
    flex-direction: column;
    align-items: stretch;
  }

  .game-cover {
    width: 100%;
    height: 100px;
  }

  .game-action {
    width: 100%;
  }

  .toggle-btn {
    width: 100%;
    justify-content: center;
  }

  .time-range-inputs {
    flex-direction: column;
  }

  .time-separator {
    display: none;
  }
}
</style>
