<template>
  <div class="game-management">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <div class="search-filters">
        <input
          v-model="filters.gameName"
          placeholder="搜索游戏名称..."
          class="search-input"
          @keyup.enter="loadGames"
        />
        
        <select v-model="filters.category" class="filter-select">
          <option value="">全部分类</option>
          <option value="math">数学</option>
          <option value="chinese">语文</option>
          <option value="english">英语</option>
          <option value="science">科学</option>
        </select>
        
        <select v-model="filters.status" class="filter-select">
          <option value="">全部状态</option>
          <option value="1">启用</option>
          <option value="0">禁用</option>
        </select>
        
        <button @click="loadGames" class="btn-search">🔍 搜索</button>
      </div>
      
      <div class="batch-actions">
        <button @click="showCreateModal = true" class="btn-create">
          ➕ 新建游戏
        </button>
        <button 
          v-if="selectedGames.length > 0"
          @click="batchPublish" 
          class="btn-batch"
        >
          📤 批量上架
        </button>
        <button 
          v-if="selectedGames.length > 0"
          @click="batchDelete" 
          class="btn-delete"
        >
          🗑️ 批量删除
        </button>
      </div>
    </div>
    
    <!-- 游戏列表（卡片视图） -->
    <div class="game-grid">
      <div 
        v-for="game in games" 
        :key="game.gameId" 
        class="game-card"
        :class="{ 'disabled': game.status === 0 }"
      >
        <div class="card-checkbox">
          <input 
            type="checkbox" 
            :checked="selectedGames.includes(game.gameId)"
            @change="toggleSelection(game.gameId)"
          />
        </div>
        
        <div class="card-cover" :style="getCoverStyle(game.coverUrl, game.category)">
          <span class="cover-icon">{{ getGameIcon(game.category) }}</span>
        </div>
        
        <div class="card-body">
          <div class="game-title">{{ game.gameName }}</div>
          
          <div class="game-meta">
            <span class="tag category">{{ getCategoryText(game.category || '') }}</span>
            <span class="tag grade">{{ game.grade || '-' }}</span>
          </div>
          
          <div class="game-stats">
            <span>👥 {{ game.onlineCount || 0 }}人在线</span>
            <span>📊 排序：{{ game.sortOrder || '-' }}</span>
          </div>
          
          <div class="status-badge" :class="game.status === 1 ? 'enabled' : 'disabled'">
            {{ game.status === 1 ? '✓ 已上架' : '✗ 已下架' }}
          </div>
        </div>
        
        <div class="card-actions">
          <button @click="editGame(game)" class="btn-edit">✏️ 编辑</button>
          <button 
            @click="openModeConfig(game)" 
            class="btn-mode"
            title="配置游戏模式"
          >
            🎮 模式
          </button>
          <button 
            @click="openThemeManagement(game)" 
            class="btn-theme"
            title="管理游戏主题"
          >
            🎨 主题
          </button>
          <button 
            @click="toggleGameStatus(game)" 
            class="btn-toggle"
          >
            {{ game.status === 1 ? '📥 下架' : '📤 上架' }}
          </button>
          <button @click="viewStats(game)" class="btn-stats">📈 统计</button>
        </div>
      </div>
    </div>
    
    <!-- 分页 -->
    <div class="pagination">
      <button 
        :disabled="pagination.current <= 1"
        @click="goToPage(pagination.current - 1)"
      >
        ⬅️ 上一页
      </button>
      
      <span class="page-info">
        第 {{ pagination.current }} / {{ pagination.totalPages }} 页
        （共 {{ pagination.total }} 个游戏）
      </span>
      
      <button 
        :disabled="pagination.current >= pagination.totalPages"
        @click="goToPage(pagination.current + 1)"
      >
        下一页 ➡️
      </button>
      
      <select v-model="pagination.size" @change="loadGames" class="page-size">
        <option :value="10">10 个/页</option>
        <option :value="20">20 个/页</option>
        <option :value="50">50 个/页</option>
      </select>
    </div>
    
    <!-- 创建/编辑弹窗 -->
    <GameFormModal
      v-model:show="showCreateModal"
      :is-editing="false"
      :initial-data="{}"
      @submit="submitForm"
    />
    <GameFormModal
      v-model:show="showEditModal"
      :is-editing="true"
      :initial-data="formData"
      @submit="submitForm"
    />
    
    <!-- 统计信息弹窗 -->
    <KidModal
      v-model:show="showStatsModal"
      :title="`📈 ${currentGame?.gameName} - 统计数据`"
      size="md"
      :show-footer="false"
    >
      <div class="stats-grid" v-if="gameStats">
        <div class="stat-item">
          <div class="stat-value">{{ gameStats.totalPlayCount }}</div>
          <div class="stat-label">总游玩次数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ gameStats.todayPlayCount }}</div>
          <div class="stat-label">今日游玩次数</div>
        </div>
        <div class="stat-item" v-if="gameStats.averageScore && gameStats.averageScore > 0">
          <div class="stat-value">{{ gameStats.averageScore.toFixed(1) }}</div>
          <div class="stat-label">平均分数</div>
        </div>
        <div class="stat-item" v-if="gameStats.satisfactionRate && gameStats.satisfactionRate > 0">
          <div class="stat-value">{{ gameStats.satisfactionRate.toFixed(1) }}%</div>
          <div class="stat-label">满意度</div>
        </div>
      </div>
    </KidModal>

    <!-- 游戏主题管理弹窗 -->
    <KidModal
      v-model:show="showThemeModal"
      :title="`🎨 ${currentGame?.gameName} - 主题管理`"
      size="lg"
      closable
      :show-footer="false"
    >
      <!-- 主题列表 -->
      <div class="theme-list">
        <div v-for="theme in gameThemes" :key="theme.themeId" class="theme-card">
          <div class="theme-cover" :style="getThemeCoverStyle(theme.thumbnailUrl)">
            <span v-if="theme.isDefault" class="default-badge">默认</span>
          </div>
          
          <div class="theme-info">
            <div class="theme-name">{{ theme.themeName }}</div>
            <div class="theme-meta">
              <span class="tag author">👤 {{ theme.authorName }}</span>
              <span class="tag price">💰 {{ theme.price || 0 }}币</span>
            </div>
            <div class="theme-stats">
              <span>📥 {{ theme.downloadCount || 0 }}次</span>
              <span>💵 {{ theme.totalRevenue || 0 }}币</span>
            </div>
            <div class="status-badge" :class="theme.status">
              {{ getThemeStatusText(theme.status) }}
            </div>
          </div>
          
          <div class="theme-actions">
            <button @click="editGameTheme(theme)" class="btn-edit">✏️ 编辑</button>
            <button @click="toggleThemeStatus(theme)" class="btn-toggle">
              {{ theme.status === 'on_sale' ? '📥 下架' : '📤 上架' }}
            </button>
            <button @click="setAsDefault(theme)" class="btn-default" :class="{ active: theme.isDefault }">
              ⭐ 设为默认
            </button>
            <button @click="deleteGameTheme(theme)" class="btn-delete">🗑️ 删除</button>
          </div>
        </div>
        
        <div v-if="gameThemes.length === 0" class="empty-state">
          <span class="empty-icon">🎨</span>
          <p>暂无主题，点击"添加主题"或"创建主题"</p>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="theme-actions-bar">
        <button @click="showThemeSelector = true" class="btn-add-theme">
          ➕ 添加主题
        </button>
        <button @click="showCreateThemeForm = true" class="btn-create-theme">
          ✨ 创建主题
        </button>
      </div>
    </KidModal>
    
    <!-- 主题选择器 -->
    <ThemeSelector
      :show="showThemeSelector"
      :game-info="currentGame"
      @close="showThemeSelector = false"
      @added="onThemesAdded"
      @removed="onThemeRemoved"
      @default-set="onDefaultSet"
    />
    
    <!-- 创建/编辑主题表单弹窗 -->
    <KidModal
      v-model:show="showCreateThemeForm"
      :title="editingTheme ? '✏️ 编辑主题' : '➕ 创建主题'"
      size="lg"
      closable
      show-footer
      confirm-text="💾 保存"
      cancel-text="取消"
      @confirm="submitThemeForm"
    >
      <div class="form-group">
        <label class="form-label">主题名称 *</label>
        <input v-model="themeFormData.themeName" type="text" class="form-input" placeholder="请输入主题名称" />
      </div>
      
      <div class="form-group">
        <label class="form-label">作者名称</label>
        <input v-model="themeFormData.authorName" type="text" class="form-input" placeholder="官方" />
      </div>
      
      <div class="form-group">
        <label class="form-label">价格（游戏币）</label>
        <input v-model.number="themeFormData.price" type="number" class="form-input" placeholder="0 表示免费" min="0" />
      </div>
      
      <div class="form-group">
        <label class="form-label">缩略图 URL</label>
        <input v-model="themeFormData.thumbnailUrl" type="text" class="form-input" placeholder="https://..." />
      </div>
      
      <div class="form-group">
        <label class="form-label">描述</label>
        <textarea v-model="themeFormData.description" class="form-textarea" placeholder="主题描述..." rows="3"></textarea>
      </div>
      
      <div class="form-group">
        <label class="form-label">主题配置 JSON *</label>
        <div class="json-editor-hint">包含 assets 和 styles 的完整配置</div>
        <textarea 
          v-model="themeFormData.configJson" 
          class="form-textarea code-editor" 
          placeholder='{"default": {"assets": {...}, "styles": {...}}}'
          rows="10"
        ></textarea>
      </div>
      
      <div class="form-group">
        <label class="form-label">状态</label>
        <select v-model="themeFormData.status" class="form-select">
          <option value="pending">审核中</option>
          <option value="on_sale">上架</option>
          <option value="offline">下架</option>
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label">
          <input v-model="themeFormData.isDefault" type="checkbox" />
          设为默认主题
        </label>
      </div>
    </KidModal>
    
    <!-- 游戏模式配置弹窗 -->
    <KidModal
      v-model:show="showModeConfigModal"
      :title="`🎮 ${currentGame?.gameName} - 模式配置`"
      size="xl"
      closable
      :show-footer="true"
      show-confirm
      :show-cancel="false"
      confirm-text="关闭"
      @confirm="showModeConfigModal = false"
    >
              </div>
            </div>
          </div>

          <!-- 模式列表内容在KidModal slot中 -->
      <div class="mode-list">
        <div v-for="(config, index) in modeConfigs" :key="config.id || index" class="mode-card">
          <div class="mode-card-header">
            <div class="mode-card-title">
              <span class="mode-icon">🎯</span>
              <div>
                <div class="mode-name">{{ config.modeName }}</div>
                <div class="mode-type-badge">{{ config.modeType }}</div>
              </div>
            </div>
            <label class="mode-switch">
              <input type="checkbox" v-model="config.enabled" @change="saveModeConfig(config)" />
              <span class="switch-slider"></span>
            </label>
          </div>
              
          <div class="mode-card-body">
            <!-- 基础配置 -->
            <div class="config-row">
              <div class="config-field">
                <label>
                  <span class="label-icon">📊</span>
                  排序权重
                </label>
                <input
                  type="number"
                  v-model.number="config.sortOrder"
                  @blur="saveModeConfig(config)"
                  class="form-input"
                  placeholder="数字越小越靠前"
                />
              </div>
            </div>

            <!-- 核心配置（简化版） -->
            <template v-if="config.modeType === 'single_player'">
              <div class="config-group-title">核心配置</div>
              <div class="config-row">
                <div class="config-field">
                  <label>
                    <span class="label-icon">🤖</span>
                    AI 难度
                  </label>
                  <select
                    v-model="config.aiDifficulty"
                    @change="saveModeConfig(config)"
                    class="form-input"
                  >
                    <option value="easy">简单</option>
                    <option value="medium">中等</option>
                    <option value="hard">困难</option>
                    <option value="expert">专家</option>
                  </select>
                </div>
              </div>
            </template>

            <template v-if="config.modeType === 'local_battle'">
              <div class="config-group-title">核心配置</div>
              <div class="config-row">
                <div class="config-field">
                  <label>
                    <span class="label-icon">⏱️</span>
                    回合时间 (秒)
                  </label>
                  <input
                    type="number"
                    v-model.number="config.timeLimit"
                    @blur="saveModeConfig(config)"
                    class="form-input"
                    min="10"
                    max="300"
                    placeholder="默认 60"
                  />
                </div>
                <div class="config-field">
                  <label>
                    <span class="label-icon">❓</span>
                    题目数量
                  </label>
                  <input
                    type="number"
                    v-model.number="config.questionCount"
                    @blur="saveModeConfig(config)"
                    class="form-input"
                    min="5"
                    max="50"
                    placeholder="默认 10"
                  />
                </div>
              </div>
            </template>

            <template v-if="config.modeType === 'team_battle'">
              <div class="config-group-title">核心配置</div>
              <div class="config-row">
                <div class="config-field">
                  <label>
                    <span class="label-icon">👥</span>
                    每队人数
                  </label>
                  <input
                    type="number"
                    v-model.number="config.playersPerTeam"
                    @blur="saveModeConfig(config)"
                    class="form-input"
                    min="1"
                    max="10"
                    placeholder="默认 2"
                  />
                </div>
                <div class="config-field">
                  <label>
                    <span class="label-icon">🏆</span>
                    获胜条件
                  </label>
                  <select
                    v-model="config.winCondition"
                    @change="saveModeConfig(config)"
                    class="form-input"
                  >
                    <option value="score">目标分数</option>
                    <option value="time">限时模式</option>
                  </select>
                </div>
              </div>
            </template>

            <template v-if="config.modeType === 'multiplayer_battle'">
              <div class="config-group-title">核心配置</div>
              <div class="config-row">
                <div class="config-field">
                  <label>
                    <span class="label-icon">👥</span>
                    最大玩家数
                  </label>
                  <input
                    type="number"
                    v-model.number="config.maxPlayers"
                    @blur="saveModeConfig(config)"
                    class="form-input"
                    min="2"
                    max="100"
                    placeholder="默认 10"
                  />
                </div>
                <div class="config-field">
                  <label>
                    <span class="label-icon">🏆</span>
                    获胜条件
                  </label>
                  <select
                    v-model="config.winCondition"
                    @change="saveModeConfig(config)"
                    class="form-input"
                  >
                    <option value="time">限时排名</option>
                    <option value="score">目标分数</option>
                    <option value="survival">幸存模式</option>
                  </select>
                </div>
              </div>
            </template>

            <template v-if="config.modeType === 'network_battle'">
              <div class="config-group-title">核心配置</div>
              <div class="config-row">
                <div class="config-field">
                  <label>
                    <span class="label-icon">🌐</span>
                    服务器区域
                  </label>
                  <select
                    v-model="config.serverRegion"
                    @change="saveModeConfig(config)"
                    class="form-input"
                  >
                    <option value="cn">中国</option>
                    <option value="us">美国</option>
                    <option value="eu">欧洲</option>
                    <option value="asia">亚洲</option>
                  </select>
                </div>
                <div class="config-field">
                  <label>
                    <span class="label-icon">🔄</span>
                    最大延迟 (ms)
                  </label>
                  <input
                    type="number"
                    v-model.number="config.maxLatency"
                    @blur="saveModeConfig(config)"
                    class="form-input"
                    min="50"
                    max="1000"
                    step="50"
                    placeholder="默认 300"
                  />
                </div>
              </div>
            </template>

            <!-- 高级配置：保留完整选项 -->
            <div class="config-advanced">
              <button
                @click="toggleAdvanced(config)"
                class="btn-advanced-toggle"
                :class="{ active: config.showAdvanced }"
              >
                <span class="toggle-icon">{{ config.showAdvanced ? '▼' : '▶' }}</span>
                高级配置
              </button>
              <div v-if="config.showAdvanced" class="advanced-content">
                <textarea
                  v-model="config.configJson"
                  @blur="saveModeConfig(config)"
                  rows="6"
                  class="form-textarea"
                  placeholder='编辑 JSON 配置'
                ></textarea>
              </div>
            </div>
          </div>
              
          <div class="mode-card-footer">
            <button @click="deleteModeConfig(config)" class="btn-delete">
              🗑️ 删除此模式
            </button>
          </div>
        </div>
                
        <!-- 空状态 -->
        <div v-if="modeConfigs.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <p class="empty-text">暂无模式配置</p>
          <p class="empty-hint">点击"添加新模式"按钮创建第一个模式</p>
        </div>
      </div>

      <!-- 底部操作按钮（需要通过 footer slot 处理） -->
      <template #footer>
        <button @click="showAddModeModal = true" class="btn-add-mode">
          ➕ 添加新模式
        </button>
      </template>
    </KidModal>

    <!-- 添加模式选择弹窗 -->
    <KidModal
      v-model:show="showAddModeModal"
      title="🎮 选择游戏模式"
      size="md"
      closable
      show-footer
      confirm-text="✓ 添加模式"
      cancel-text="取消"
      :show-confirm="!!(selectedModeType && newModeName)"
      @confirm="confirmAddMode"
    >
      <div class="mode-selector-grid">
        <div
          v-for="mode in availableModes"
          :key="mode.type"
          class="mode-option-card"
          :class="{ selected: selectedModeType === mode.type }"
          @click="selectedModeType = mode.type"
        >
          <div class="mode-option-icon">{{ mode.icon }}</div>
          <div class="mode-option-name">{{ mode.name }}</div>
          <div class="mode-option-desc">{{ mode.desc }}</div>
        </div>
      </div>

      <div v-if="selectedModeType" class="mode-simple-config">
        <div class="config-field">
          <label>
            <span class="label-icon">📝</span>
            模式名称
          </label>
          <input
            type="text"
            v-model="newModeName"
            class="form-input"
            placeholder="例如：简单模式"
          />
        </div>
      </div>
    </KidModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { adminApi, type Game, type GameStats } from '@/services/admin-api.service';
import { gameModeApi } from '@/services/game-mode-api.service';
import { themeApi } from '@/services/theme-api.service';
import type { GameModeConfiguration } from '@/modules/game/types/game.types';
import GameFormModal from '@/components/ui/GameFormModal.vue';
import KidModal from '@/components/ui/KidModal.vue';
import ThemeSelector from './ThemeSelector.vue';
import { dialog, useConfirm } from '@/composables/useDialog';

// 数据
const games = ref<Game[]>([]);
const loading = ref(false);
const selectedGames = ref<number[]>([]);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showStatsModal = ref(false);
const showModeConfigModal = ref(false); // 模式配置弹窗
const showThemeModal = ref(false); // 主题管理弹窗
const showThemeSelector = ref(false); // 主题选择器弹窗
const showCreateThemeForm = ref(false); // 创建/编辑主题表单弹窗
const gameThemes = ref<any[]>([]); // 当前游戏的主题列表
const editingTheme = ref<any>(null); // 正在编辑的主题

const themeFormData = reactive({
  themeName: '',
  authorName: '官方',
  price: 0,
  thumbnailUrl: '',
  description: '',
  configJson: '',
  status: 'pending',
  isDefault: false,
});
const showAddModeModal = ref(false); // 添加模式选择弹窗
const isEditing = ref(false);
const currentGame = ref<Game | null>(null);
const gameStats = ref<GameStats | null>(null);
const modeConfigs = ref<GameModeConfiguration[]>([]); // 当前游戏的模式配置
const selectedModeType = ref(''); // 选中的模式类型
const newModeName = ref(''); // 新模式名称

// 筛选条件
const filters = reactive({
  gameName: '',
  category: '',
  status: '' as any
});

// 分页
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0,
  totalPages: 0
});

// 表单数据
const formData = reactive<any>({
  gameName: '',
  category: '',
  grade: '',
  gameCode: '',
  iconUrl: '',
  coverUrl: '',
  resourceUrl: '',
  modulePath: '',
  description: '',
  sortOrder: 0,
  consumePointsPerMinute: 1,
  status: 1
});

// 加载游戏列表
async function loadGames() {
  loading.value = true;
  try {
    const result = await adminApi.getGameList({
      gameName: filters.gameName,
      category: filters.category,
      status: filters.status,
      page: pagination.current,
      size: pagination.size
    });
    
    games.value = result.records;
    pagination.total = result.total;
    pagination.totalPages = Math.ceil(result.total / pagination.size);
  } catch (error) {
    console.error('加载游戏列表失败:', error);
  } finally {
    loading.value = false;
  }
}

// 切换选择
function toggleSelection(gameId: number) {
  const index = selectedGames.value.indexOf(gameId);
  if (index > -1) {
    selectedGames.value.splice(index, 1);
  } else {
    selectedGames.value.push(gameId);
  }
}

// 编辑游戏
function editGame(game: Game) {
  isEditing.value = true;
  currentGame.value = game;
  
  Object.assign(formData, {
    gameName: game.gameName,
    category: game.category,
    grade: game.grade,
    gameCode: game.gameCode,
    iconUrl: game.iconUrl,
    coverUrl: game.coverUrl,
    resourceUrl: (game as any).resourceUrl,
    modulePath: (game as any).modulePath,
    description: game.description,
    sortOrder: (game as any).sortOrder,
    consumePointsPerMinute: (game as any).consumePointsPerMinute,
    status: game.status
  });
  
  showEditModal.value = true;
}

// 切换游戏状态
async function toggleGameStatus(game: Game) {
  const newStatus = game.status === 1 ? 0 : 1;
  const action = newStatus === 1 ? '上架' : '下架';
  
  const confirmed = await useConfirm({ message: `确定要${action}游戏"${game.gameName}"吗？`, title: '确认操作' });
  if (!confirmed) return;
  
  try {
    await adminApi.updateGameStatus(game.gameId, newStatus);
    await loadGames();
  } catch (error) {
    console.error(`${action}游戏失败:`, error);
    await dialog.error(`${action}游戏失败，请重试`);
  }
}

// 查看统计
async function viewStats(game: Game) {
  currentGame.value = game;
  try {
   gameStats.value = await adminApi.getGameStats(game.gameId);
    showStatsModal.value = true;
  } catch (error) {
   console.error('加载统计数据失败:', error);
  }
}

// 打开模式配置弹窗
async function openModeConfig(game: Game) {
  currentGame.value = game;
  modeConfigs.value = [];
  showModeConfigModal.value = true;

  try {
    // 加载游戏的模式配置
   modeConfigs.value = await gameModeApi.getModeConfigs(game.gameId);

    // 初始化每个配置的可视化字段
   modeConfigs.value.forEach(config => initConfigFields(config));
  } catch (error) {
   console.error('加载模式配置失败:', error);
    // 如果没有配置，显示空数组
   modeConfigs.value = [];
  }
}

// 打开主题管理弹窗
async function openThemeManagement(game: Game) {
  currentGame.value = game;
  gameThemes.value = [];
  showThemeModal.value = true;

  try {
    // 加载游戏的主题列表 - 使用 themeApi
    const response = await themeApi.getList({
      ownerType: 'GAME',
      ownerId: game.gameId,
      status: undefined  // 获取所有状态的主题
    });
    
    // 使用统一的 PageData 格式
    gameThemes.value = response.list || [];
  } catch (error: any) {
    console.error('[GameManagement] 加载主题列表失败:', error);
    gameThemes.value = [];
  }
}

// 主题添加成功回调
function onThemesAdded(themeIds: number[]) {
  console.log('[GameManagement] 添加主题成功:', themeIds);
  if (currentGame.value) {
    openThemeManagement(currentGame.value);
  }
}

// 主题移除成功回调
function onThemeRemoved(themeId: number) {
  console.log('[GameManagement] 移除主题成功:', themeId);
  if (currentGame.value) {
    openThemeManagement(currentGame.value);
  }
}

// 设置默认主题成功回调
function onDefaultSet(themeId: number) {
  console.log('[GameManagement] 设置默认主题成功:', themeId);
  if (currentGame.value) {
    openThemeManagement(currentGame.value);
  }
}

// 获取主题封面样式
function getThemeCoverStyle(thumbnailUrl?: string) {
  if (thumbnailUrl) {
    return {
      backgroundImage: `url(${thumbnailUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
}

// 获取主题状态文本
function getThemeStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    on_sale: '✓ 上架中',
    offline: '✗ 已下架',
    pending: '⏳ 审核中',
  };
  return statusMap[status] || status;
}

// 编辑游戏主题
function editGameTheme(theme: any) {
  editingTheme.value = theme;
  Object.assign(themeFormData, {
    themeName: theme.themeName,
    authorName: theme.authorName,
    price: theme.price,
    thumbnailUrl: theme.thumbnailUrl,
    description: theme.description,
    configJson: typeof theme.configJson === 'string' ? theme.configJson : JSON.stringify(theme.configJson),
    status: theme.status,
    isDefault: theme.isDefault,
  });
  showCreateThemeForm.value = true;
}

// 切换主题状态
async function toggleThemeStatus(theme: any) {
  const newStatus = theme.status === 'on_sale' ? 'offline' : 'on_sale';
  const onSale = newStatus === 'on_sale';
  const action = onSale ? '上架' : '下架';
  
  const confirmed = await useConfirm({ message: `确定要${action}主题"${theme.themeName}"吗？`, title: '确认操作' });
  if (!confirmed) return;
  
  try {
    // 使用 themeApi
    await themeApi.toggleSale(theme.themeId || theme.id, onSale);
    
    await dialog.success(`${action}成功！`);
    if (currentGame.value) await openThemeManagement(currentGame.value);
  } catch (error: any) {
    console.error('[GameManagement] 切换主题状态失败:', error);
    await dialog.error('操作失败：' + (error.response?.data?.msg || error.message));
  }
}

// 设为默认主题
async function setAsDefault(theme: any) {
  const confirmed = await useConfirm({ message: `确定要将"${theme.themeName}"设为默认主题吗？`, title: '确认操作' });
  if (!confirmed) return;
  
  try {
    // 使用 themeApi
    await themeApi.setDefault(theme.themeId || theme.id);
    
    await dialog.success('设置成功！');
    if (currentGame.value) await openThemeManagement(currentGame.value);
  } catch (error: any) {
    console.error('[GameManagement] 设置默认主题失败:', error);
    await dialog.error('操作失败：' + (error.response?.data?.msg || error.message));
  }
}

// 删除游戏主题
async function deleteGameTheme(theme: any) {
  const confirmed = await useConfirm({ message: `确定要删除主题"${theme.themeName}"吗？此操作不可恢复！`, title: '删除确认', confirmVariant: 'danger' });
  if (!confirmed) return;
  
  try {
    // 使用 themeApi
    await themeApi.delete(theme.themeId || theme.id);
    
    await dialog.success('删除成功！');
    if (currentGame.value) await openThemeManagement(currentGame.value);
  } catch (error: any) {
    console.error('[GameManagement] 删除主题失败:', error);
    await dialog.error('删除失败：' + (error.response?.data?.msg || error.message));
  }
}

// 提交主题表单
async function submitThemeForm() {
  if (!themeFormData.themeName) {
    await dialog.warning('请输入主题名称');
    return;
  }
  
  if (!currentGame.value) {
    await dialog.error('游戏信息丢失，请重试');
    return;
  }
  
  try {
    let configJsonObj;
    try {
      configJsonObj = typeof themeFormData.configJson === 'string' 
        ? JSON.parse(themeFormData.configJson) 
        : themeFormData.configJson;
    } catch (e) {
      await dialog.error('主题配置 JSON 格式错误，请检查');
      return;
    }
    
    const payload = {
      name: themeFormData.themeName,
      author: themeFormData.authorName,
      price: themeFormData.price || 0,
      thumbnail: themeFormData.thumbnailUrl,
      description: themeFormData.description,
      config: configJsonObj,
    };
    
    // 使用 themeApi
    if (editingTheme.value) {
      await themeApi.update(editingTheme.value.themeId || editingTheme.value.id, payload);
    } else {
      await themeApi.upload(payload);
    }
    
    await dialog.success('保存成功！');
    showCreateThemeForm.value = false;
    editingTheme.value = null;
    if (currentGame.value) await openThemeManagement(currentGame.value);
  } catch (error: any) {
    console.error('[GameManagement] 保存主题失败:', error);
    await dialog.error('保存失败：' + (error.response?.data?.msg || error.message));
  }
}

// 保存模式配置
async function saveModeConfig(config: GameModeConfiguration) {
  try {
   // 从可视化字段构建 JSON
   const parsed = JSON.parse(config.configJson || '{}');

   // 根据模式类型更新对应的字段
   if (config.modeType === 'single_player') {
    parsed.aiDifficulty = config.aiDifficulty;
    parsed.aiResponseDelay = config.aiResponseDelay;
   }

   if (config.modeType === 'local_battle') {
    parsed.timeLimit = config.timeLimit;
    parsed.questionCount = config.questionCount;
    parsed.allowDuplicateQuestions = config.allowDuplicateQuestions;
   }

   if (config.modeType === 'team_battle') {
    parsed.playersPerTeam = config.playersPerTeam;
    parsed.winCondition = config.winCondition;
    parsed.targetScore = config.targetScore;
    parsed.gameDuration = config.gameDuration;
   }

   if (config.modeType === 'multiplayer_battle') {
    parsed.maxPlayers = config.maxPlayers;
    parsed.winCondition = config.winCondition;
    parsed.allowLateJoin = config.allowLateJoin;
    parsed.showEliminationAnimation = config.showEliminationAnimation;
   }

   if (config.modeType === 'network_battle') {
    parsed.serverRegion = config.serverRegion;
    parsed.maxLatency = config.maxLatency;
    parsed.enableRollback = config.enableRollback;
    parsed.showLeaderboard = config.showLeaderboard;
   }

   // 更新 JSON 字符串
   config.configJson = JSON.stringify(parsed, null, 2);
   config.gameId = currentGame.value?.gameId;

    await gameModeApi.saveModeConfig(config);

    // 重新加载配置
   if (currentGame.value) {
      await openModeConfig(currentGame.value);
    }
  } catch (error) {
   console.error('保存模式配置失败:', error);
    await dialog.error('保存失败，请重试');
  }
}

// 删除模式配置
async function deleteModeConfig(config: GameModeConfiguration) {
  const confirmed = await useConfirm({ message: `确定要删除"${config.modeName}"吗？`, title: '删除确认', confirmVariant: 'danger' });
  if (!confirmed) return;
  
  try {
    await gameModeApi.deleteModeConfig(config.gameId, config.modeType);
    
    // 重新加载配置
   if (currentGame.value) {
      await openModeConfig(currentGame.value);
    }
  } catch (error) {
   console.error('删除模式配置失败:', error);
    await dialog.error('删除失败，请重试');
  }
}

// 添加新模式
async function addNewMode() {
  showAddModeModal.value = true;
  selectedModeType.value = '';
  newModeName.value = '';
}

// 确认添加模式
async function confirmAddMode() {
  if (!selectedModeType.value || !newModeName.value) {
    return;
  }

  // 根据模式类型设置默认配置
  const defaultConfigs: Record<string, any> = {
    single_player: {
      aiDifficulty: 'medium',
      aiResponseDelay: 2000
    },
    local_battle: {
      timeLimit: 60,
      questionCount: 10
    },
    team_battle: {
      playersPerTeam: 2,
      winCondition: 'score',
      targetScore: 100
    },
    multiplayer_battle: {
      maxPlayers: 10,
      winCondition: 'time'
    },
    network_battle: {
      serverRegion: 'cn',
      maxLatency: 300
    }
  };

  const config = defaultConfigs[selectedModeType.value] || {};

  const newConfig: GameModeConfiguration = {
    id: 0,
    gameId: currentGame.value?.gameId || 0,
    modeType: selectedModeType.value,
    modeName: newModeName.value,
    enabled: true,
    configJson: JSON.stringify(config),
    sortOrder: modeConfigs.value.length + 1,
    createTime: Date.now(),
    updateTime: Date.now(),
    showAdvanced: false,
    ...config
  };

  try {
    await gameModeApi.saveModeConfig(newConfig);
    showAddModeModal.value = false;

    // 重新加载配置
    if (currentGame.value) {
      await openModeConfig(currentGame.value);
    }
  } catch (error) {
    console.error('添加模式失败:', error);
    await dialog.error('添加失败，请重试');
  }
}

// 可用的模式列表
const availableModes = [
  { type: 'single_player', name: '单人模式', icon: '👤', desc: '与 AI 对战' },
  { type: 'local_battle', name: '本地对抗', icon: '👥', desc: '同设备双人对战' },
  { type: 'team_battle', name: '组队模式', icon: '🤝', desc: '组队合作对战' },
  { type: 'multiplayer_battle', name: '多人乱斗', icon: '⚔️', desc: '多人在线对战' },
  { type: 'network_battle', name: '网络对战', icon: '🌐', desc: '跨区域对战' }
];

// 切换高级配置显示
function toggleAdvanced(config: GameModeConfiguration) {
  config.showAdvanced = !config.showAdvanced;
}

// 初始化配置的额外字段
function initConfigFields(config: GameModeConfiguration) {
  // 解析 JSON 并填充到可视化字段
  try {
    const parsed = JSON.parse(config.configJson || '{}');

    // 单人模式字段
    if (config.modeType === 'single_player') {
      config.aiDifficulty = parsed.aiDifficulty || 'medium';
      config.aiResponseDelay = parsed.aiResponseDelay || 2000;
    }

    // 本地对抗字段
    if (config.modeType === 'local_battle') {
      config.timeLimit = parsed.timeLimit || 60;
      config.questionCount = parsed.questionCount || 10;
      config.allowDuplicateQuestions = parsed.allowDuplicateQuestions || false;
    }

    // 组队模式字段
    if (config.modeType === 'team_battle') {
      config.playersPerTeam = parsed.playersPerTeam || 2;
      config.winCondition = parsed.winCondition || 'score';
      config.targetScore = parsed.targetScore || 100;
      config.gameDuration = parsed.gameDuration || 5;
    }

    // 多人乱斗字段
    if (config.modeType === 'multiplayer_battle') {
      config.maxPlayers = parsed.maxPlayers || 10;
      config.winCondition = parsed.winCondition || 'time';
      config.allowLateJoin = parsed.allowLateJoin !== false;
      config.showEliminationAnimation = parsed.showEliminationAnimation !== false;
    }

    // 网络对战字段
    if (config.modeType === 'network_battle') {
      config.serverRegion = parsed.serverRegion || 'cn';
      config.maxLatency = parsed.maxLatency || 300;
      config.enableRollback = parsed.enableRollback || false;
      config.showLeaderboard = parsed.showLeaderboard !== false;
    }

  } catch (e) {
    console.error('解析配置 JSON 失败:', e);
  }

  // 初始化高级配置显示状态
  if (config.showAdvanced === undefined) {
    config.showAdvanced = false;
  }
}

// 提交表单
async function submitForm() {
  try {
    if (isEditing.value && currentGame.value) {
      await adminApi.updateGame(currentGame.value.gameId, formData);
    } else {
      await adminApi.createGame(formData);
    }
    
    closeModals();
    await loadGames();
  } catch (error) {
    console.error('操作失败:', error);
    await dialog.error('操作失败，请重试');
  }
}

// 批量上架
async function batchPublish() {
  const confirmed = await useConfirm({ message: `确定要批量上架选中的 ${selectedGames.value.length} 个游戏吗？`, title: '批量上架' });
  if (!confirmed) return;
  
  try {
    for (const gameId of selectedGames.value) {
      await adminApi.updateGameStatus(gameId, 1);
    }
    selectedGames.value = [];
    await loadGames();
  } catch (error) {
    console.error('批量上架失败:', error);
  }
}

// 批量删除
async function batchDelete() {
  const confirmed = await useConfirm({ message: `确定要删除选中的 ${selectedGames.value.length} 个游戏吗？此操作不可恢复！`, title: '批量删除', confirmVariant: 'danger' });
  if (!confirmed) return;
  
  try {
    await adminApi.batchDeleteGames(selectedGames.value);
    selectedGames.value = [];
    await loadGames();
  } catch (error) {
    console.error('批量删除失败:', error);
  }
}

// 分页
function goToPage(page: number) {
  pagination.current = page;
  loadGames();
}

// 关闭弹窗
function closeModals() {
  showCreateModal.value = false;
  showEditModal.value = false;
  showStatsModal.value = false;
  isEditing.value = false;
  currentGame.value = null;
  Object.assign(formData, {
    gameName: '',
    category: '',
    grade: '',
    gameCode: '',
    iconUrl: '',
    coverUrl: '',
    resourceUrl: '',
    modulePath: '',
    description: '',
    sortOrder: 0,
    consumePointsPerMinute: 1,
    status: 1
  });
}

// 工具函数
function getCategoryText(category: string): string {
  const maps: Record<string, string> = {
    math: '🔢 数学',
    chinese: '📖 语文',
    english: '🔤 英语',
    science: '🔬 科学'
  };
  return maps[category] || category;
}

// 获取游戏图标
function getGameIcon(category: string): string {
  const iconMap: Record<string, string> = {
    math: '🔢',
    chinese: '📖',
    english: '🔤',
    science: '🔬',
    arithmetic: '➕',
    creative: '🎨',
    puzzle: '🧩',
    logic: '🧠',
    memory: '🧠',
    reaction: '⚡'
  };
  return iconMap[category] || '🎮';
}

// 获取封面样式
function getCoverStyle(coverUrl: string | undefined, category: string) {
  if (coverUrl && !coverUrl.includes('cdn.example.com')) {
    return {
      backgroundImage: `url(${coverUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  }

  // 使用渐变背景
  const gradients: Record<string, string> = {
    math: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    chinese: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    english: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    science: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    arithmetic: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    creative: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    puzzle: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    logic: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    memory: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    reaction: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  };

  return {
    backgroundImage: gradients[category] || gradients.math,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  };
}

// 初始化
onMounted(() => {
  loadGames();
});
</script>

<style scoped>
.game-management {
  padding: 2rem;
  background: #f5f7fa;
  min-height: 100vh;
}

/* ========== 顶部操作栏 ========== */
.action-bar {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-filters {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-input,
.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.3s;
}

.search-input:focus,
.filter-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-input {
  width: 200px;
}

.btn-search {
  padding: 0.5rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-search:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.batch-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-create,
.btn-batch,
.btn-delete {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.btn-create {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-batch {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-delete {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.btn-create:hover,
.btn-batch:hover,
.btn-delete:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* ========== 游戏网格 ========== */
.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.game-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  position: relative;
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.game-card.disabled {
  opacity: 0.6;
  filter: grayscale(0.5);
}

.card-checkbox {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 10;
}

.card-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.card-cover {
  width: 100%;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.card-cover::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  animation: coverShimmer 4s linear infinite;
}

@keyframes coverShimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(0deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(360deg);
  }
}

.cover-icon {
  font-size: 4rem;
  position: relative;
  z-index: 1;
  opacity: 0.9;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.card-body {
  padding: 1rem;
}

.game-title {
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.75rem;
}

.game-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.tag {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.tag.category {
  background: #dbeafe;
  color: #1e40af;
}

.tag.grade {
  background: #fef3c7;
  color: #92400e;
}

.game-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.75rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
}

.status-badge.enabled {
  background: #dcfce7;
  color: #166534;
}

.status-badge.disabled {
  background: #fee2e2;
  color: #991b1b;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #f0f0f0;
}

.btn-edit,
.btn-mode,
.btn-toggle,
.btn-stats {
  flex: 1;
  min-width: 80px;
  padding: 0.6rem 0.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.btn-edit {
  background: linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%);
 color: #4f46e5;
}

.btn-edit:hover {
  background: linear-gradient(135deg, #c7d2fe 0%, #bfdbfe 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
}

.btn-mode {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
 color: white;
}

.btn-mode:hover {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-toggle {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
 color: #92400e;
}

.btn-toggle:hover {
  background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(146, 64, 14, 0.2);
}

.btn-stats {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
 color: #374151;
}

.btn-stats:hover {
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(55, 65, 81, 0.2);
}

/* ========== 分页 ========== */
.pagination {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.pagination button {
  padding: 0.5rem 1.25rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.pagination button:not(:disabled):hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.page-size {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
}

/* ========== 弹窗 ========== */
.stats-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: modal-slide-in 0.3s ease-out;
}

.stats-modal h3 {
  padding: 1.5rem;
  margin: 0;
  border-bottom: 1px solid #e2e8f0;
  font-size: 1.25rem;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
}

.btn-close {
  width: 100%;
  padding: 0.75rem;
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.3s;
}

.btn-close:hover {
  background: #e5e7eb;
}

@keyframes modal-slide-in {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== 淡入淡出动画 ========== */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ========== 响应式设计 ========== */
@media (max-width: 768px) {
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-filters,
  .batch-actions {
    flex-direction: column;
  }
  
  .search-input {
    width: 100%;
  }
  
  .game-grid {
    grid-template-columns: 1fr;
  }
  
  .card-actions {
    flex-wrap: wrap;
  }
}

/* ========== 模态框遮罩 ========== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fade-in 0.3s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modal-slide-in {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ========== 淡入淡出过渡 ========== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ========== 模式配置弹窗 - 重新设计 ========== */
.mode-config-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modal-slide-in 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px 16px 0 0;
 color: white;
}

.modal-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.btn-close-icon {
  background: rgba(255, 255, 255, 0.2);
  border: none;
 color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-close-icon:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

.mode-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 模式卡片 */
.mode-card {
  background: #f9fafb;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.3s;
}

.mode-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.mode-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.mode-card-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mode-icon {
  font-size: 1.5rem;
}

.mode-name {
  font-size: 1.1rem;
  font-weight: 600;
 color: #1f2937;
  margin-bottom: 0.25rem;
}

.mode-type-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
 color: white;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

/* 开关按钮 */
.mode-switch {
  position: relative;
  width: 52px;
  height: 28px;
  display: inline-block;
}

.mode-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .3s;
  border-radius: 28px;
}

.switch-slider:before {
  position: absolute;
 content: "";
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

input:checked + .switch-slider {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

input:checked + .switch-slider:before {
  transform: translateX(24px);
}

/* 卡片主体 */
.mode-card-body {
  padding: 1.5rem;
}

.config-group-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #667eea;
  margin: 1.5rem 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.config-group-title:first-child {
  margin-top: 0;
}

.config-row {
  margin-bottom: 1.25rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.config-field {
  margin-bottom: 1.25rem;
}

.config-field:last-child {
  margin-bottom: 0;
}

.config-field label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
 color: #374151;
  font-size: 0.9rem;
}

.label-icon {
  font-size: 1rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  resize: vertical;
  transition: all 0.2s;
  background: #f9fafb;
}

.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: white;
}

.form-input:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

/* 高级配置区域 */
.config-advanced {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px dashed #d1d5db;
}

.btn-advanced-toggle {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-advanced-toggle:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.btn-advanced-toggle.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.toggle-icon {
  font-size: 0.7rem;
  transition: transform 0.2s;
}

.btn-advanced-toggle.active .toggle-icon {
  transform: rotate(90deg);
}

.advanced-content {
  margin-top: 1rem;
  animation: slide-down 0.3s ease-out;
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 开关按钮样式 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  margin-left: 0.5rem;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

input:checked + .toggle-slider {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

/* 配置字段组 */
.config-field > label {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ========== 添加模式选择弹窗 ========== */
.add-mode-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modal-slide-in 0.3s ease-out;
}

.mode-selector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.mode-option-card {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-option-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.mode-option-card.selected {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

.mode-option-card.selected .mode-option-name,
.mode-option-card.selected .mode-option-desc {
  color: white;
}

.mode-option-icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
}

.mode-option-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.mode-option-desc {
  font-size: 0.85rem;
  color: #6b7280;
}

.mode-simple-config {
  background: #f3f4f6;
  padding: 1.5rem;
  border-radius: 12px;
}

.mode-simple-config .config-field {
  margin-bottom: 0;
}

.btn-confirm {
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}

.btn-confirm:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  opacity: 0.6;
}

/* ========== 简化配置区域 ========== */
.mode-card-body .config-row:has(+ .config-row):not(:first-child) {
  margin-top: 1.5rem;
}

.config-field:last-child {
  margin-bottom: 0;
}

/* 卡片底部 */
.mode-card-footer {
  padding: 1rem 1.5rem;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.btn-delete {
  padding: 0.6rem 1.25rem;
  background: #fee2e2;
 color: #dc2626;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-delete:hover {
  background: #fecaca;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220, 38, 38, 0.2);
}

/* 空状态 */
.empty-state {
 text-align: center;
  padding: 4rem 2rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px dashed #d1d5db;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 1.1rem;
 color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.empty-hint {
  font-size: 0.9rem;
 color: #9ca3af;
}

/* 模态框底部 */
.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 16px 16px;
}

.btn-add-mode {
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
 color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-add-mode:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-cancel {
  padding: 0.875rem 2rem;
  background: #f3f4f6;
 color: #374151;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

/* ========== 响应式设计 - 补充 ========== */
@media (max-width: 768px) {
  .pagination {
    flex-wrap: wrap;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}

/* ========== 游戏主题管理样式 ========== */
.theme-management-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modal-slide-in 0.3s ease-out;
}

.theme-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  max-height: 500px;
  overflow-y: auto;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 12px;
}

.theme-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.theme-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.theme-cover {
  height: 140px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.default-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.4);
}

.theme-info {
  padding: 1rem;
}

.theme-name {
  font-size: 16px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 0.75rem;
}

.theme-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 0.75rem;
}

.theme-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 0.75rem;
}

.theme-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.theme-actions button {
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
}

.theme-actions button:hover {
  background: #f9fafb;
}

.btn-theme {
  color: #ec4899;
  border-color: #ec4899;
}

.btn-default {
  color: #f59e0b;
  border-color: #f59e0b;
}

.btn-default.active {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  border-color: transparent;
}

.actions-bar {
  display: flex;
  justify-content: center;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn-create-theme {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-create-theme:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(236, 72, 153, 0.4);
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
}

.empty-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.theme-form-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
}

.code-editor {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
}
</style>