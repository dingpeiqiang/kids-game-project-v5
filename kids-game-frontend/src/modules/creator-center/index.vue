<template>
  <div class="creator-center-container">
    <!-- 顶部导航栏 -->
    <BaseHeader
      variant="kids"
      :showThemeSwitcher="false"
      :showBack="true"
      :username="username"
      :avatar="userAvatar"
      :user-role="userRole"
      @back="goBack"
    >
      <template #left>
        <button class="back-home-btn" @click="goBack" title="返回首页">
          <span class="back-icon">←</span>
          <span>返回</span>
        </button>
      </template>
    </BaseHeader>

    <!-- 主内容区 -->
    <main class="creator-main">
      <!-- 标签页导航 -->
      <div class="tabs-navigation">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-button"
          :class="{ active: currentTab === tab.id }"
          @click="currentTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <!-- 统一筛选器 -->
      <div class="theme-filters">
        <!-- 第一行：应用/游戏筛选 -->
        <div class="filter-row">
          <div class="filter-group">
            <span class="filter-label">适用范围：</span>
            <button 
              class="filter-btn" 
              :class="{ active: filterOwnerType === 'APPLICATION' }"
              @click="handleOwnerTypeChange('APPLICATION')"
            >
              <span class="filter-icon">📱</span>
              <span>应用主题</span>
            </button>
            <button 
              class="filter-btn" 
              :class="{ active: filterOwnerType === 'GAME' }"
              @click="handleOwnerTypeChange('GAME')"
            >
              <span class="filter-icon">🎮</span>
              <span>游戏主题</span>
            </button>
          </div>
          
          <!-- 游戏选择器（仅当选择游戏主题时显示） -->
          <div v-if="filterOwnerType === 'GAME'" class="game-selector-inline">
            <span class="filter-label">选择游戏：</span>
            <div class="game-select-wrapper">
              <!-- 全部游戏按钮 -->
              <button 
                class="game-select-all-btn"
                :class="{ active: selectedGameId === null || selectedGameId === undefined }"
                @click="handleSelectAllGames"
                title="显示所有游戏主题"
              >
                🎮 全部
              </button>
              
              <!-- Element Plus Select 组件（支持搜索过滤） -->
              <el-select
                v-model="selectedGameId"
                filterable
                placeholder="请选择游戏"
                clearable
                style="flex: 1; min-width: 200px;"
                @change="handleGameSelectChange"
              >
                <el-option
                  v-for="game in filteredGames"
                  :key="game.gameId"
                  :label="`${game.gameName} (${game.gameCode})`"
                  :value="game.gameId"
                />
              </el-select>
            </div>
          </div>
        </div>
        
        <!-- 第二行：主题来源筛选（仅在"主题仓库"和"主题商店"显示） -->
        <div v-if="currentTab !== 'mine'" class="filter-row">
          <div class="filter-group">
            <span class="filter-label">主题来源：</span>
            <button 
              class="filter-btn source-btn"
              :class="{ active: themeSourceFilter === 'all' }"
              @click="handleSourceFilterChange('all')"
            >
              <span>全部</span>
            </button>
            <button 
              class="filter-btn source-btn"
              :class="{ active: themeSourceFilter === 'official' }"
              @click="handleSourceFilterChange('official')"
            >
              <span class="filter-icon">🏛️</span>
              <span>官方</span>
            </button>
            <button 
              class="filter-btn source-btn"
              :class="{ active: themeSourceFilter === 'purchased' }"
              @click="handleSourceFilterChange('purchased')"
            >
              <span class="filter-icon">🛒</span>
              <span>购买</span>
            </button>
            <button 
              class="filter-btn source-btn"
              :class="{ active: themeSourceFilter === 'mine' }"
              @click="handleSourceFilterChange('mine')"
            >
              <span class="filter-icon">🎨</span>
              <span>我的</span>
            </button>
          </div>
        </div>
        
        <!-- 统计信息 -->
        <div class="stats-info">
          <span class="stat-item">
            主题总数：<strong>{{ allThemes.length }}</strong>
          </span>
          <span class="stat-item">
            适用范围：<strong>{{ filterOwnerType === 'APPLICATION' ? '应用主题' : '游戏主题' }}</strong>
          </span>
          <span v-if="filterOwnerType === 'GAME' && selectedGameCode" class="stat-item">
            当前游戏：<strong>{{ games.find(g => g.gameId === selectedGameId)?.gameName || selectedGameCode }}</strong>
          </span>
          <span v-if="currentTab !== 'mine'" class="stat-item">
            来源：<strong>{{ 
              themeSourceFilter === 'all' ? '全部' : 
              themeSourceFilter === 'official' ? '官方' : 
              themeSourceFilter === 'purchased' ? '购买' : '我的' 
            }}</strong>
          </span>
        </div>
      </div>

      <!-- 我的主题管理（使用合并后的主题列表） -->
      <MyThemesManagement
        v-if="currentTab === 'my-themes'"
        :themes="allThemes"
        :loading="loadingMyThemes"
        @diy="handleDIYTheme"
        @view="handleViewTheme"
        @use="handleUseTheme"
        @toggle="handleToggleSale"
        @edit="handleEdit"
        @delete="handleDelete"
        @stats="handleStats"
      />

      <!-- ⭐ 我的主题（仅显示当前用户创建的主题，支持完整管理功能） -->
      <MyThemesManagement
        v-if="currentTab === 'mine'"
        :themes="myThemesOnly"
        :loading="loadingMyThemesOnly"
        @diy="handleDIYTheme"
        @view="handleViewTheme"
        @use="handleUseTheme"
        @toggle="handleToggleSale"
        @edit="handleEdit"
        @delete="handleDelete"
        @stats="handleStats"
      />

      <!-- 主题商店（使用合并后的主题列表） -->
      <ThemeStore
        v-if="currentTab === 'store'"
        :themes="allThemes"
        :loading="loadingStore"
        @preview="handlePreview"
        @buy="handleBuy"
        @download="handleDownload"
      />
      
      <!-- ⭐ 分页控件 -->
      <div v-if="pagination.totalPages > 1" class="pagination-container">
        <button
          :disabled="pagination.current <= 1"
          @click="goToPage(pagination.current - 1)"
          class="btn-page"
        >
          ⬅️ 上一页
        </button>
        
        <div class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            :class="['page-number', { active: page === pagination.current }]"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        
        <button
          :disabled="pagination.current >= pagination.totalPages"
          @click="goToPage(pagination.current + 1)"
          class="btn-page"
        >
          下一页 ➡️
        </button>
        
        <span class="pagination-info">
          共 {{ pagination.total }} 条，第 {{ pagination.current }} / {{ pagination.totalPages }} 页
        </span>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessageBox, ElMessage } from 'element-plus';
import BaseHeader from '@/components/layout/BaseHeader.vue';
import { useUserStore } from '@/core/store';

// 导入子组件
import MyThemesManagement from './components/MyThemesManagement.vue';
import ThemeStore from './components/ThemeStore.vue';

import { themeApi, gameApi } from '@/services';
import type { CloudThemeInfo } from '@/core/theme/ThemeManager';
import { dialog } from '@/composables/useDialog';
import { getCurrentUserId } from '@/utils/auth';
import { ThemePreferenceUtil } from '@/core/utils/theme-preference.util';
import { themeManager } from '@/core/theme/ThemeManager';
import { ADMIN_PATHS } from '@kids-game/shared';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 获取用户信息 - 家长登录
const username = computed(() => userStore.parentUsername || '用户');
const userRole = computed(() => '家长');
const userAvatar = computed(() => userStore.parentAvatar || '👨‍👩‍👧');

// 标签页配置（简化版）
const tabs = [
  { id: 'my-themes', label: '主题仓库', icon: '🏪' },  // ⭐ 主题仓库：展示所有可用主题（官方+购买+我的）
  { id: 'mine', label: '我的主题', icon: '🎨' },       // ⭐ 我的主题：仅展示当前账号创建的主题（可管理）
  { id: 'store', label: '主题商店', icon: '🛍️' },
];

// 当前标签页
const currentTab = ref('my-themes');

// 数据状态
const officialThemes = ref<Array<any>>([]); // 官方主题（从商店获取）
const myThemes = ref<CloudThemeInfo[]>([]); // 自己创建的主题
const purchasedThemes = ref<CloudThemeInfo[]>([]); // 已购买的主题

// ⭐ 新增：分页状态
const pagination = ref({
  current: 1,
  size: 20,
  total: 0,
  totalPages: 0
});

// 筛选状态
const filterOwnerType = ref<'GAME' | 'APPLICATION'>('APPLICATION'); // APPLICATION: 应用主题，GAME: 游戏主题
const themeSourceFilter = ref<'all' | 'official' | 'purchased' | 'mine'>('all'); // 主题来源筛选
const selectedGameId = ref<number>();
const selectedGameCode = ref<string>();
const games = ref<Array<{ gameId: number; gameName: string; gameCode: string }>>([]);

// ⭐ 游戏模糊检索相关
const gameSearchKeyword = ref('');
const filteredGames = ref<Array<{ gameId: number; gameName: string; gameCode: string }>>([]);

// 合并后的主题列表
const allThemes = ref<any[]>([]);

// ⭐ 我的主题专用数据（仅当前用户创建的）
const myThemesOnly = ref<any[]>([]);

// 加载状态
const loadingMyThemes = ref(false);
const loadingMyThemesOnly = ref(false);  // ⭐ 我的主题加载状态
const loadingPurchasedThemes = ref(false);
const loadingStore = ref(false);
const loadingGames = ref(false);

// 生命周期
onMounted(() => {
  // 从 URL 参数中读取 tab
  const tabFromQuery = route.query.tab as string;
  if (tabFromQuery && tabs.some(t => t.id === tabFromQuery)) {
    currentTab.value = tabFromQuery;
  }

  loadGamesList();
  // 初始加载时根据当前标签页加载主题
  if (currentTab.value === 'mine') {
    loadMyThemesOnly();
  } else {
    reloadCurrentData();
  }
});

// ⭐ 监听标签页变化，加载对应数据
watch(currentTab, (newTab, oldTab) => {
  if (newTab === 'mine') {
    loadMyThemesOnly();
  } else if (oldTab === 'mine') {
    // 从"我的主题"切换到其他标签时，刷新数据
    reloadCurrentData();
  }
});

// ⭐ 监听筛选条件变化，在"我的主题"页面重新加载数据
watch([filterOwnerType, selectedGameId], () => {
  if (currentTab.value === 'mine') {
    loadMyThemesOnly();
  }
});

// 加载游戏列表（从后端API 获取）
async function loadGamesList() {
  loadingGames.value = true;
  try {
    // ⭐ 使用统一 API 服务
    const gamesList = await gameApi.getList();

    if (gamesList && gamesList.length > 0) {
      games.value = gamesList.map((game: any) => ({
        gameId: game.gameId,
        gameName: game.gameName,
        gameCode: game.gameCode,
      }));
      console.log('[CreatorCenter] 游戏列表加载成功:', games.value.length);
    } else {
      console.error('[CreatorCenter] 游戏列表加载失败');
      games.value = [];
    }

    // 默认选择第一个游戏
    if (games.value.length > 0 && filterOwnerType.value === 'GAME') {
      selectedGameId.value = games.value[0].gameId;
      selectedGameCode.value = games.value[0].gameCode;
    }
    
    // 初始化过滤后的游戏列表（显示全部）
    filteredGames.value = [...games.value];
  } catch (error) {
    console.error('[CreatorCenter] 加载游戏列表失败:', error);
    // 开发环境使用备用数据，生产环境应该提示用户错误
    if (import.meta.env.DEV) {
      console.warn('[CreatorCenter] 使用开发环境备用游戏列表');
      games.value = [
        { gameId: 1, gameName: '飞机大战', gameCode: 'plane-shooter' },
        { gameId: 2, gameName: '贪吃蛇大冒险', gameCode: 'snake-vue3' },
        { gameId: 3, gameName: '超级染色体', gameCode: 'chromosome' },
        { gameId: 4, gameName: '算术大战', gameCode: 'arithmetic' },
        { gameId: 5, gameName: '植物大战僵尸', gameCode: 'plants-vs-zombie' },
      ];
    } else {
      games.value = [];
    }
  } finally {
    loadingGames.value = false;
  }
}

// 加载我的主题
async function loadMyThemes() {
  loadingMyThemes.value = true;
  try {
    // 检查用户是否登录
    const userId = getCurrentUserId();
    if (!userId || userId === 0) {
      console.warn('[CreatorCenter] 用户未登录，无法加载我的主题');
      myThemes.value = [];
      return;
    }

    // 不再传递creatorId参数，后端会从认证信息中获取用户ID
    const themes = await themeApi.getMyThemes();
    myThemes.value = themes || [];
    console.log('[CreatorCenter] 我的主题加载成功:', myThemes.value.length, 'userId:', userId);
  } catch (error) {
    console.error('[CreatorCenter] 加载我的主题失败:', error);
    myThemes.value = [];
  } finally {
    loadingMyThemes.value = false;
  }
}

// ⭐ 加载仅当前用户创建的主题（用于"我的主题"标签）
// 注意：调用 getMyThemes() 获取所有创建的主题（不限状态），而不是 getMyAvailableThemes（只返回 on_sale）
// ⭐ 支持"适用范围"筛选：应用主题 vs 游戏主题（后端筛选）
async function loadMyThemesOnly() {
  loadingMyThemesOnly.value = true;
  try {
    const userId = getCurrentUserId();
    if (!userId || userId === 0) {
      console.warn('[CreatorCenter] 用户未登录，无法加载我的主题');
      myThemesOnly.value = [];
      return;
    }

    // ⭐ 调用支持筛选参数的接口，后端根据 ownerType 和 ownerId 进行筛选
    const params: any = {};
    if (filterOwnerType.value) {
      params.ownerType = filterOwnerType.value;
      // 如果是游戏主题且选择了具体游戏，传递 ownerId
      if (filterOwnerType.value === 'GAME' && selectedGameId.value) {
        params.ownerId = selectedGameId.value;
      }
    }

    console.log('[CreatorCenter] 调用 getMyThemes 参数:', params);
    const allCreatedThemes = await themeApi.getMyThemes(params);

    console.log('[CreatorCenter] getMyThemes 返回结果:', allCreatedThemes, '长度:', (allCreatedThemes || []).length);

    // 获取当前用户的主题偏好设置
    const userPreferences = await themeApi.getUserPreferences(userId).catch(() => ({ list: [] }));

    // 创建一个用于快速查找当前使用主题的映射
    const preferenceMap = new Map();
    (userPreferences.list || []).forEach((pref: any) => {
      const key = `${pref.ownerType}_${pref.ownerId}`;
      preferenceMap.set(key, pref.themeId);
    });

    myThemesOnly.value = (allCreatedThemes || []).map((theme: any) => {
      const ownerType = theme.ownerType || 'GAME';
      const ownerId = theme.gameId || theme.ownerId;
      const themeId = theme.themeId || theme.id;
      const key = `${ownerType}_${ownerId}`;

      console.log('[CreatorCenter] 处理主题数据:', {
        themeId,
        ownerType,
        ownerId,
        originalTheme: theme
      });

      return {
        ...theme,
        source: 'mine',  // 强制标记为"我的"
        sourceLabel: '我的',
        sourceIcon: '🎨',
        isCurrent: preferenceMap.get(key) === themeId, // 判断是否为当前使用的主题
      };
    });


    console.log('[CreatorCenter] 我的主题(仅创建)加载成功:', myThemesOnly.value.length, {
      filterOwnerType: filterOwnerType.value,
      selectedGameId: selectedGameId.value
    });
  } catch (error) {
    console.error('[CreatorCenter] 加载我的主题失败:', error);
    myThemesOnly.value = [];
  } finally {
    loadingMyThemesOnly.value = false;
  }
}

// 加载已购买的主题
async function loadPurchasedThemes() {
  loadingPurchasedThemes.value = true;
  try {
    // 检查用户是否登录
    const userId = getCurrentUserId();
    if (!userId || userId === 0) {
      console.warn('[CreatorCenter] 用户未登录，无法加载已购买主题');
      purchasedThemes.value = [];
      return;
    }

    // 后端从认证信息中获取用户ID
    const themes = await themeApi.getPurchasedThemes();
    purchasedThemes.value = themes || [];
    console.log('[CreatorCenter] 已购买主题加载成功:', purchasedThemes.value.length, 'userId:', userId);
  } catch (error) {
    console.error('[CreatorCenter] 加载已购买主题失败:', error);
    purchasedThemes.value = [];
  } finally {
    loadingPurchasedThemes.value = false;
  }
}

// 加载商店主题（包含官方主题）
async function loadStoreThemes() {
  loadingStore.value = true;
  try {
    // 后端支持的参数：ownerType, ownerId, status, page, pageSize
    const params: any = {
      status: 'on_sale',
      page: 1,
      pageSize: 100
    };

    if (filterOwnerType.value === 'GAME') {
      params.ownerType = 'GAME';
      if (selectedGameId.value) {
        params.ownerId = selectedGameId.value;
      }
    } else if (filterOwnerType.value === 'APPLICATION') {
      params.ownerType = 'APPLICATION';
    }

    console.log('[CreatorCenter] 查询主题参数:', params);

    // 调用后端 API - 现在返回统一的分页格式 {list, total}
    const result = await themeApi.getList(params);

    // 使用统一的分页数据格式
    const themes = result.list || [];

    // 使用 ownerType + ownerId，并映射显示字段
    // ⭐ 根据 isOfficial 字段判断是否为官方主题
    officialThemes.value = themes.map((theme: any) => ({
      ...theme,
      // 映射显示字段（ThemeStore 用 name/author）
      name: theme.themeName || theme.name,
      author: theme.authorName || theme.author,
      ownerType: theme.ownerType || 'GAME',
      ownerId: theme.ownerId ?? theme.gameId,
      // ⭐ 根据 isOfficial 字段设置来源
      source: theme.isOfficial ? 'official' : 'purchased',
      sourceLabel: theme.isOfficial ? '官方' : '已购',
      sourceIcon: theme.isOfficial ? '🏛️' : '🛒',
    }));

    // 直接设置为显示的主题
    allThemes.value = officialThemes.value;

    console.log('[CreatorCenter] 商店主题加载成功:', officialThemes.value.length, '条');
  } catch (error) {
    console.error('[CreatorCenter] 加载商店主题失败:', error);
    officialThemes.value = [];
    allThemes.value = [];
  } finally {
    loadingStore.value = false;
  }
}

// 筛选功能处理函数 ⭐ NEW
function handleOwnerTypeChange(ownerType: 'GAME' | 'APPLICATION') {
  filterOwnerType.value = ownerType;

  // 重置游戏选择
  if (ownerType === 'GAME' && games.value.length > 0) {
    selectedGameId.value = games.value[0].gameId;
    selectedGameCode.value = games.value[0].gameCode;
  } else {
    selectedGameId.value = undefined;
    selectedGameCode.value = undefined;
  }

  // 根据当前标签页重新筛选
  if (currentTab.value === 'mine') {
    loadMyThemesOnly();
  } else {
    reloadCurrentData();
  }
}

// 主题来源筛选处理函数
function handleSourceFilterChange(source: 'all' | 'official' | 'purchased' | 'mine') {
  themeSourceFilter.value = source;

  // 根据当前标签页重新筛选
  if (currentTab.value === 'mine') {
    loadMyThemesOnly();
  } else {
    reloadCurrentData();
  }
}

// ⭐ 选择全部游戏
function handleSelectAllGames() {
  selectedGameId.value = undefined;
  selectedGameCode.value = undefined;
  gameSearchKeyword.value = '';
  filteredGames.value = [...games.value];
  
  console.log('[CreatorCenter] 选择全部游戏');
  
  // 重新加载数据
  if (currentTab.value === 'mine') {
    loadMyThemesOnly();
  } else {
    reloadCurrentData();
  }
}

// ⭐ 游戏模糊检索
function filterGames() {
  const keyword = gameSearchKeyword.value.trim().toLowerCase();
  
  if (!keyword) {
    filteredGames.value = [...games.value];
  } else {
    filteredGames.value = games.value.filter(game => {
      const nameMatch = game.gameName.toLowerCase().includes(keyword);
      const codeMatch = game.gameCode.toLowerCase().includes(keyword);
      return nameMatch || codeMatch;
    });
  }
  
  console.log('[CreatorCenter] 游戏搜索结果:', filteredGames.value.length, '个匹配项');
}

// 游戏选择处理函数
function handleGameSelectChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const gameId = Number(target.value);
  const game = games.value.find(g => g.gameId === gameId);

  if (game) {
    selectedGameId.value = game.gameId;
    selectedGameCode.value = game.gameCode;

    // 根据当前标签页重新筛选
    if (currentTab.value === 'mine') {
      loadMyThemesOnly();
    } else {
      reloadCurrentData();
    }
  }
}

// 重新加载筛选后的数据 ⭐ 后端分页版本
async function reloadCurrentData() {
  console.log('[CreatorCenter] reloadCurrentData 开始，当前筛选条件:', {
    themeSourceFilter: themeSourceFilter.value,
    filterOwnerType: filterOwnerType.value,
    selectedGameId: selectedGameId.value
  });

  loadingMyThemes.value = true;

  try {
    // ⭐ 核心改进：使用后端分页和过滤
    const params = {
      ownerType: filterOwnerType.value,
      ownerId: selectedGameId.value || undefined,
      source: themeSourceFilter.value,  // ⭐ 传递来源筛选给后端
      page: 1,                           // ⭐ 重置到第一页
      pageSize: 20
    };

    console.log('[CreatorCenter] 调用 getMyAvailableThemes 参数:', params);

    // ⭐ 后端返回分页数据：{list, total, pageNum, pageSize}
    const result = await themeApi.getMyAvailableThemes(params);

    console.log('[CreatorCenter] 可用主题数据:', result);

    if (!result || !result.list) {
      console.warn('[CreatorCenter] 返回数据格式异常:', result);
      allThemes.value = [];
      pagination.value.total = 0;
      pagination.value.current = 1;
      pagination.value.totalPages = 0;
      return;
    }

    // 获取当前用户的主题偏好设置
    const currentUserId = getCurrentUserId();
    let userPreferences: any = { list: [] };

    // 只有当用户已登录时才获取偏好设置
    if (currentUserId && currentUserId !== 0) {
      try {
        userPreferences = await themeApi.getUserPreferences(currentUserId);
      } catch (error) {
        console.warn('[CreatorCenter] 获取用户偏好失败，使用空数据:', error);
      }
    }

    // 创建一个用于快速查找当前使用主题的映射
    const preferenceMap = new Map();
    (userPreferences.list || []).forEach((pref: any) => {
      const key = `${pref.ownerType}_${pref.ownerId}`;
      preferenceMap.set(key, pref.themeId);
    });

    // ⭐ 为每个主题添加来源标识和当前使用状态（用于 UI 显示）
    allThemes.value = result.list.map((theme: any) => {
      let source: string;
      let sourceLabel: string;
      let sourceIcon: string;

      if (theme.isOfficial) {
        source = 'official';
        sourceLabel = '官方';
        sourceIcon = '🏛️';
      } else if (theme.authorId === currentUserId) {
        source = 'mine';
        sourceLabel = '我的';
        sourceIcon = '🎨';
      } else {
        source = 'purchased';
        sourceLabel = '购买';
        sourceIcon = '🛒';
      }

      const ownerType = theme.ownerType || 'GAME';
      const ownerId = theme.gameId || theme.ownerId;
      const themeId = theme.themeId || theme.id;
      const key = `${ownerType}_${ownerId}`;

      return {
        ...theme,
        source,
        sourceLabel,
        sourceIcon,
        isCurrent: preferenceMap.get(key) === themeId, // 判断是否为当前使用的主题
      };
    });

    // ⭐ 更新分页信息
    pagination.value.total = result.total || 0;
    pagination.value.current = (result as any).pageNum || 1;
    pagination.value.totalPages = Math.ceil((result.total || 0) / ((result as any).pageSize || 20));

    console.log('[CreatorCenter] 主题列表更新:', allThemes.value.length, '条，总数:', result.total, {
      filterOwnerType: filterOwnerType.value,
      selectedGameId: selectedGameId.value,
      themeSourceFilter: themeSourceFilter.value
    });

  } catch (error) {
    console.error('[CreatorCenter] 加载主题失败:', error);
    ElMessage.error('加载主题失败，请稍后重试');
    allThemes.value = [];
    pagination.value.total = 0;
    pagination.value.current = 1;
    pagination.value.totalPages = 0;
  } finally {
    loadingMyThemes.value = false;
  }
}





// 事件处理函数
function goBack() {
  router.push(ADMIN_PATHS.dashboard);
}

function handleViewTheme(theme: any) {
  console.log('[CreatorCenter] 查看主题:', theme);
  
  // ⭐ 复用到 GTRS 编辑器，使用 view 模式
  const query: Record<string, string> = {
    mode: 'view'  // 查看模式
  };
  
  // 传递主题 ID 用于加载主题配置
  if (theme.themeId || theme.id) {
    query.themeId = String(theme.themeId || theme.id);
  }
  
  // 传递游戏 ID（如果有）
  if (theme.gameId) {
    query.gameId = String(theme.gameId);
  }
  
  router.push({
    path: ADMIN_PATHS.gtrsEditor,
    query
  });
}

function handleDIYTheme(theme?: any) {
  // ⭐ 统一跳转到 GTRS 主题编辑器
  // 传入theme时传递主题ID（用于加载原主题配置）和 gameId（用于新主题的 ownerId）
  const query: Record<string, string> = {};

  if (theme) {
    // 基于已有主题 DIY → 创建新主题，携带原主题ID和游戏ID
    console.log('[CreatorCenter] DIY主题 - 跳转到GTRS编辑器:', {
      themeId: theme.themeId || theme.id,
      gameId: theme.gameId,
      gameCode: theme.gameCode,
      themeName: theme.name || theme.themeName
    });
    query.themeId = String(theme.themeId || theme.id);
    if (theme.gameId) {
      query.gameId = String(theme.gameId);
    }
  } else {
    // 创建新主题
    console.log('[CreatorCenter] 创建新主题 - 跳转到 GTRS 编辑器');
  }

  router.push({
    path: '/creator-center/gtrs-editor',
    query
  });
}

async function handleUseTheme(theme: any) {
  try {
    const userId = getCurrentUserId();
    const ownerType = theme.ownerType || 'GAME';
    const ownerId = theme.gameId || theme.ownerId;
    const themeId = theme.themeId || theme.id || theme.themeId;
    
    if (!userId) {
      dialog.error('请先登录');
      return;
    }
    
    if (!ownerId || !themeId) {
      dialog.error('主题信息不完整，无法应用');
      return;
    }
    
    ElMessage.info(`正在应用主题 ${theme.name || theme.themeName}...`);
    
    // 1. 调用后端 API 保存偏好
    const success = await themeApi.saveUserPreference(ownerType, ownerId, themeId);
    
    if (!success) {
      throw new Error('保存用户偏好失败');
    }
    
    // 2. 更新本地缓存
    ThemePreferenceUtil.saveLocal(ownerType, ownerId, themeId);
    
    // 3. 应用主题到当前页面（如果 ThemeManager 已集成）
    try {
      await themeManager.switchUserTheme(userId, ownerType, ownerId, themeId);
    } catch (error) {
      console.warn('[handleUseTheme] ThemeManager 切换主题失败，但偏好已保存:', error);
    }
    
    ElMessage.success(`已应用主题：${theme.name || theme.themeName}`);
    
    // 4. 根据当前标签页刷新对应的数据
    if (currentTab.value === 'mine') {
      // 我的主题标签：重新加载 myThemesOnly
      await loadMyThemesOnly();
    } else {
      // 其他标签：重新加载 allThemes
      await reloadCurrentData();
    }
    
  } catch (error: any) {
    console.error('[handleUseTheme] 应用主题失败:', error);
    ElMessage.error('应用主题失败：' + (error.message || '未知错误'));
  }
}

function handleToggleSale(theme: CloudThemeInfo) {
  console.log('[CreatorCenter] 切换销售状态:', theme);

  const newStatus = theme.status !== 'on_sale';
  const action = newStatus ? '上架' : '下架';

  ElMessageBox.confirm(
    `确定要${action}主题「${theme.name}」吗？`,
    '确认操作',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      // 调用切换上下架 API
      await themeApi.toggleSale(String(theme.id), newStatus);

      ElMessage.success(`${action}成功！`);
      // 根据当前标签页刷新列表以同步状态
      if (currentTab.value === 'mine') {
        await loadMyThemesOnly();
      } else {
        await reloadCurrentData();
      }
    } catch (error: any) {
      console.error('[CreatorCenter] 切换销售状态失败:', error);
      ElMessage.error('操作失败：' + (error.response?.data?.message || error.message || '未知错误'));
    }
  }).catch(() => {
    // 用户取消
  });
}

function handleEdit(theme: CloudThemeInfo) {
  console.log('[CreatorCenter] 编辑主题:', theme);
  
  // ⭐ 编辑模式：传递 themeId 和 gameId，但不生成新主题 ID
  const query: Record<string, string> = {};
  
  // 兼容不同版本的 CloudThemeInfo 接口
  const themeId = (theme as any).themeId || theme.id;
  if (themeId) {
    query.themeId = String(themeId);
  }
  if (theme.gameId) {
    query.gameId = String(theme.gameId);
  }
  
  // 添加一个标记，表示这是编辑模式（非 DIY）
  query.mode = 'edit';
  
  router.push({
    path: '/creator-center/gtrs-editor',
    query
  });
}

function handleDelete(theme: CloudThemeInfo) {
  console.log('[CreatorCenter] 删除主题:', theme);

  // 显示确认对话框
  ElMessageBox.confirm(
    `确定要删除主题"${theme.name}"吗？此操作不可恢复！`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      // 调用删除 API
      await themeApi.delete(String(theme.id));

      // 删除成功后从列表中移除
      const index = myThemes.value.findIndex(t => t.id === theme.id);
      if (index !== -1) {
        myThemes.value.splice(index, 1);
      }

      // 同时从合并列表中移除
      const allIndex = allThemes.value.findIndex(t => t.id === theme.id);
      if (allIndex !== -1) {
        allThemes.value.splice(allIndex, 1);
      }

      // ⭐ 同时从我的主题列表中移除
      const mineIndex = myThemesOnly.value.findIndex(t => t.id === theme.id);
      if (mineIndex !== -1) {
        myThemesOnly.value.splice(mineIndex, 1);
      }

      ElMessage.success('删除成功！');
    } catch (error: any) {
      console.error('[CreatorCenter] 删除主题失败:', error);
      ElMessage.error('删除失败：' + (error.response?.data?.message || error.message || '未知错误'));
    }
  }).catch(() => {
    // 用户取消
  });
}

function handleStats(theme: CloudThemeInfo) {
  console.log('[CreatorCenter] 查看数据统计:', theme);
  // TODO: 打开数据统计面板
}

function handlePreview(theme: CloudThemeInfo) {
  console.log('[CreatorCenter] 预览主题:', theme);
  // TODO: 打开预览窗口
}

function handleBuy(theme: CloudThemeInfo) {
  console.log('[CreatorCenter] 购买主题:', theme);
  // TODO: 调用购买 API
}

function handleDownload(themeId: string) {
  console.log('[CreatorCenter] 下载主题:', themeId);
  // TODO: 调用下载 API
}

// ⭐ 翻页函数
function goToPage(page: number) {
  if (page < 1 || page > pagination.value.totalPages) return;
  
  console.log('[CreatorCenter] 翻页:', page);
  pagination.value.current = page;
  reloadCurrentDataWithPage(page);
}

// ⭐ 带页码的重新加载
async function reloadCurrentDataWithPage(page: number) {
  try {
    const params = {
      ownerType: filterOwnerType.value,
      ownerId: selectedGameId.value || undefined,
      source: themeSourceFilter.value,
      page: page,
      pageSize: 20
    };

    console.log('[CreatorCenter] 加载第', page, '页，参数:', params);

    const result = await themeApi.getMyAvailableThemes(params);
    
    const currentUserId = getCurrentUserId();
    allThemes.value = result.list.map((theme: any) => {
      let source: string;
      let sourceLabel: string;
      let sourceIcon: string;

      if (theme.isOfficial) {
        source = 'official';
        sourceLabel = '官方';
        sourceIcon = '🏛️';
      } else if (theme.authorId === currentUserId) {
        source = 'mine';
        sourceLabel = '我的';
        sourceIcon = '🎨';
      } else {
        source = 'purchased';
        sourceLabel = '购买';
        sourceIcon = '🛒';
      }

      return {
        ...theme,
        source,
        sourceLabel,
        sourceIcon,
      };
    });

    pagination.value.total = result.total;
    pagination.value.current = (result as any).pageNum || 1;
    pagination.value.totalPages = Math.ceil(result.total / ((result as any).pageSize || 20));

    console.log('[CreatorCenter] 第', page, '页加载完成，总数:', result.total);
  } catch (error) {
    console.error('[CreatorCenter] 加载主题失败:', error);
    allThemes.value = [];
  }
}

// ⭐ 计算可见的页码
const visiblePages = computed(() => {
  const pages: number[] = [];
  const current = pagination.value.current;
  const total = pagination.value.totalPages;
  
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
    pages.push(i);
  }
  
  return pages;
});

// 开发模式下的模拟主题数据（我的主题）
function getMockThemes(): any[] {
  return [
    {
      id: 'mock-1',
      themeId: 1001,
      key: 'mock_theme_blue',
      name: '蓝色海洋主题',
      themeName: '蓝色海洋主题',
      author: '开发者',
      authorName: '开发者',
      price: 0,
      thumbnail: 'https://via.placeholder.com/300x200/667eea/ffffff?text=Blue+Ocean',
      thumbnailUrl: 'https://via.placeholder.com/300x200/667eea/ffffff?text=Blue+Ocean',
      description: '这是一个模拟的蓝色海洋主题',
      downloadCount: 42,
      rating: 4.5,
      status: 'on_sale',
      ownerType: 'GAME',
      ownerId: 2,
      gameCode: 'snake-vue3',
      gameName: '贪吃蛇大冒险',
      createdAt: '2024-01-15T10:30:00Z',
      source: 'mine',
      sourceLabel: '我的',
      sourceIcon: '🎨'
    },
    {
      id: 'mock-2',
      themeId: 1002,
      key: 'mock_theme_green',
      name: '绿色森林主题',
      themeName: '绿色森林主题',
      author: '测试用户',
      authorName: '测试用户',
      price: 10,
      thumbnail: 'https://via.placeholder.com/300x200/48bb78/ffffff?text=Green+Forest',
      thumbnailUrl: 'https://via.placeholder.com/300x200/48bb78/ffffff?text=Green+Forest',
      description: '这是一个模拟的绿色森林主题',
      downloadCount: 25,
      rating: 4.2,
      status: 'pending',
      ownerType: 'APPLICATION',
      ownerId: null as any,
      gameCode: '',
      gameName: '',
      createdAt: '2024-01-20T14:45:00Z' as any,
      source: 'mine',
      sourceLabel: '我的',
      sourceIcon: '🎨'
    }
  ];
}

// 开发模式下的模拟商店主题数据
function getMockStoreThemes(): any[] {
  return [
    {
      id: 'store-mock-1',
      themeId: 2001,
      key: 'official_theme_ocean',
      name: '官方海洋主题',
      themeName: '官方海洋主题',
      author: '官方团队',
      authorName: '官方团队',
      price: 0,
      thumbnail: 'https://via.placeholder.com/300x200/4ECDC4/ffffff?text=Official+Ocean',
      thumbnailUrl: 'https://via.placeholder.com/300x200/4ECDC4/ffffff?text=Official+Ocean',
      description: '官方提供的海洋主题，适合所有游戏',
      downloadCount: 156,
      rating: 4.8,
      status: 'on_sale',
      ownerType: 'APPLICATION',
      ownerId: null as any,
      gameCode: '',
      gameName: '',
      createdAt: '2024-01-10T09:00:00Z' as any,
      source: 'official',
      sourceLabel: '官方',
      sourceIcon: '🏛️'
    },
    {
      id: 'store-mock-2',
      themeId: 2002,
      key: 'official_theme_jungle',
      name: '官方丛林主题',
      themeName: '官方丛林主题',
      author: '官方团队',
      authorName: '官方团队',
      price: 5,
      thumbnail: 'https://via.placeholder.com/300x200/48bb78/ffffff?text=Official+Jungle',
      thumbnailUrl: 'https://via.placeholder.com/300x200/48bb78/ffffff?text=Official+Jungle',
      description: '官方提供的丛林主题，专为冒险类游戏设计',
      downloadCount: 89,
      rating: 4.6,
      status: 'on_sale',
      ownerType: 'GAME',
      ownerId: 2,
      gameCode: 'snake-vue3',
      gameName: '贪吃蛇大冒险',
      createdAt: '2024-01-12T14:30:00Z',
      source: 'official',
      sourceLabel: '官方',
      sourceIcon: '🏛️'
    },
    {
      id: 'store-mock-3',
      themeId: 2003,
      key: 'user_theme_space',
      name: '星空主题',
      themeName: '星空主题',
      author: '星空创作者',
      authorName: '星空创作者',
      price: 15,
      thumbnail: 'https://via.placeholder.com/300x200/764ba2/ffffff?text=Space+Theme',
      thumbnailUrl: 'https://via.placeholder.com/300x200/764ba2/ffffff?text=Space+Theme',
      description: '用户创作的星空主题，充满神秘感',
      downloadCount: 67,
      rating: 4.7,
      status: 'on_sale',
      ownerType: 'APPLICATION',
      ownerId: null as any,
      gameCode: '',
      gameName: '',
      createdAt: '2024-01-18T16:20:00Z' as any,
      source: 'official',
      sourceLabel: '官方',
      sourceIcon: '🏛️'
    },
    {
      id: 'store-mock-4',
      themeId: 2004,
      key: 'user_theme_cartoon',
      name: '卡通乐园主题',
      themeName: '卡通乐园主题',
      author: '卡通大师',
      authorName: '卡通大师',
      price: 8,
      thumbnail: 'https://via.placeholder.com/300x200/f093fb/ffffff?text=Cartoon+Park',
      thumbnailUrl: 'https://via.placeholder.com/300x200/f093fb/ffffff?text=Cartoon+Park',
      description: '适合儿童游戏的卡通风格主题',
      downloadCount: 124,
      rating: 4.9,
      status: 'on_sale',
      ownerType: 'GAME',
      ownerId: 1,
      gameCode: 'plane-shooter',
      gameName: '飞机大战',
      createdAt: '2024-01-22T11:15:00Z',
      source: 'official',
      sourceLabel: '官方',
      sourceIcon: '🏛️'
    }
  ];
}
</script>

<style scoped lang="scss">
.creator-center-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
}

.back-home-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(78, 205, 196, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: #4a5568;
  font-weight: 500;

  &:hover {
    background: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
  }
}

.back-icon {
  font-size: 18px;
}

.creator-main {
  flex: 1;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.tabs-navigation {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
  overflow-x: auto;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: #718096;
  font-weight: 500;
  font-size: 15px;
  white-space: nowrap;

  &:hover {
    background: rgba(78, 205, 196, 0.1);
    color: #4ECDC4;
  }

  &.active {
    background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
  }
}

.tab-icon {
  font-size: 18px;
}

.tab-label {
  font-size: 15px;
}

/* 筛选器样式 */
.theme-filters {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  
  &:last-of-type {
    margin-bottom: 0;
  }
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-label {
  font-weight: 600;
  color: #4a5568;
  font-size: 14px;
  margin-right: 4px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  color: #4a5568;
  font-weight: 500;
  font-size: 13px;

  &:hover {
    background: #edf2f7;
    border-color: #cbd5e0;
  }

  &.active {
    background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
    border-color: #4ECDC4;
    color: white;
    box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
  }
  
  &.source-btn {
    min-width: 70px;
    justify-content: center;
  }
}

.filter-icon {
  font-size: 14px;
}

.game-selector-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.game-select-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 600px;
}

.game-select-all-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  color: #4a5568;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  
  &:hover {
    background: #edf2f7;
    border-color: #cbd5e0;
    transform: translateY(-1px);
  }
  
  &.active {
    background: #4ECDC4;
    border-color: #4ECDC4;
    color: white;
    box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
  }
}

.stats-info {
  display: flex;
  gap: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  color: #718096;
  font-size: 14px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;

  strong {
    color: #4a5568;
    font-weight: 600;
  }
}

/* ⭐ 分页控件样式 */
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  margin-top: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-page {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  color: #4a5568;
  font-weight: 500;
  font-size: 14px;

  &:hover:not(:disabled) {
    background: #edf2f7;
    border-color: #cbd5e0;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f7fafc;
  }
}

.page-numbers {
  display: flex;
  gap: 8px;
}

.page-number {
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  color: #4a5568;
  font-weight: 500;
  font-size: 14px;

  &:hover {
    background: #edf2f7;
    border-color: #cbd5e0;
    transform: translateY(-1px);
  }

  &.active {
    background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
    border-color: #4ECDC4;
    color: white;
    box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
  }
}

.pagination-info {
  color: #718096;
  font-size: 14px;
  font-weight: 500;
  margin-left: 12px;
}

/* DIY 面板样式 */
.diy-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  overflow-y: auto;
}
</style>
