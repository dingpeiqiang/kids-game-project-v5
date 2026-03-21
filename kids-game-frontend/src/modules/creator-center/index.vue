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
            <select 
              class="game-select"
              :value="selectedGameId"
              @change="handleGameSelectChange"
            >
              <option value="">请选择游戏</option>
              <option 
                v-for="game in games" 
                :key="game.gameId" 
                :value="game.gameId"
              >
                {{ game.gameName }}
              </option>
            </select>
          </div>
        </div>
        
        <!-- 第二行：主题来源筛选 -->
        <div class="filter-row">
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
          <span class="stat-item">
            来源: <strong>{{ 
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

      <!-- 主题商店（使用合并后的主题列表） -->
      <ThemeStore
        v-if="currentTab === 'store'"
        :themes="allThemes"
        :loading="loadingStore"
        @preview="handlePreview"
        @buy="handleBuy"
        @download="handleDownload"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
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

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 获取用户信息 - 家长登录
const username = computed(() => userStore.parentUsername || '用户');
const userRole = computed(() => '家长');
const userAvatar = computed(() => userStore.parentAvatar || '👨‍👩‍👧');

// 标签页配置（简化版）
const tabs = [
  { id: 'my-themes', label: '我的主题', icon: '🎨' },
  { id: 'store', label: '主题商店', icon: '🛍️' },
];

// 当前标签页
const currentTab = ref('my-themes');

// 数据状态
const officialThemes = ref<Array<any>>([]); // 官方主题（从商店获取）
const myThemes = ref<CloudThemeInfo[]>([]);

// 筛选状态
const filterOwnerType = ref<'GAME' | 'APPLICATION'>('APPLICATION'); // APPLICATION: 应用主题，GAME: 游戏主题
const themeSourceFilter = ref<'all' | 'official' | 'purchased' | 'mine'>('all'); // 主题来源筛选
const selectedGameId = ref<number>();
const selectedGameCode = ref<string>();
const games = ref<Array<{ gameId: number; gameName: string; gameCode: string }>>([]);

// 合并后的主题列表
const allThemes = ref<any[]>([]);

// 加载状态
const loadingMyThemes = ref(false);
const loadingStore = ref(false);
const loadingGames = ref(false);

// 生命周期
onMounted(() => {
  // 从 URL 参数中读取 tab
  const tabFromQuery = route.query.tab as string;
  if (tabFromQuery && tabs.some(t => t.id === tabFromQuery)) {
    currentTab.value = tabFromQuery;
  }
  
  loadAllData();
  loadGamesList();
});

// 加载所有数据
async function loadAllData() {
  // 串行加载，确保顺序执行
  await loadMyThemes();
  await loadStoreThemes();  // 先加载商店主题，这会设置 allThemes.value
  await loadGamesList();

  // 初始加载后合并我的主题
  console.log('[CreatorCenter] loadAllData - 合并前 allThemes.length:', allThemes.value.length);
  const themes: any[] = [...allThemes.value];
  myThemes.value.forEach((theme: any) => {
    const exists = themes.find(t => t.themeId === theme.themeId);
    if (!exists) {
      themes.push({
        ...theme,
        source: 'mine',
        sourceLabel: '我的',
        sourceIcon: '🎨',
      });
    }
  });
  allThemes.value = themes;
  console.log('[CreatorCenter] loadAllData - 合并后 allThemes.length:', allThemes.value.length);
}

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
  } catch (error) {
    console.error('[CreatorCenter] 加载游戏列表失败:', error);
    // 使用备用数据
    games.value = [
      { gameId: 1, gameName: '飞机大战', gameCode: 'plane-shooter' },
      { gameId: 2, gameName: '贪吃蛇大冒险', gameCode: 'snake-vue3' },
      { gameId: 3, gameName: '超级染色体', gameCode: 'chromosome' },
      { gameId: 4, gameName: '算术大战', gameCode: 'arithmetic' },
      { gameId: 5, gameName: '植物大战僵尸', gameCode: 'plants-vs-zombie' },
    ];
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
    // 在开发环境下可以使用模拟数据
    if (import.meta.env.DEV) {
      console.log('[CreatorCenter] 使用开发模式模拟数据');
      myThemes.value = getMockThemes();
    } else {
      myThemes.value = [];
    }
  } finally {
    loadingMyThemes.value = false;
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

    // 使用 ownerType + ownerId
    officialThemes.value = themes.map((theme: any) => ({
      ...theme,
      ownerType: theme.ownerType || 'GAME',
      ownerId: theme.ownerId ?? theme.gameId,
      source: 'official',
      sourceLabel: '官方',
      sourceIcon: '🏛️',
    }));

    // 直接设置为显示的主题
    allThemes.value = officialThemes.value;

    console.log('[CreatorCenter] 商店主题加载成功:', officialThemes.value.length, '条');
  } catch (error) {
    console.error('[CreatorCenter] 加载商店主题失败:', error);
    // 在开发环境下可以使用模拟数据
    if (import.meta.env.DEV) {
      console.log('[CreatorCenter] 使用开发模式模拟商店数据');
      officialThemes.value = getMockStoreThemes();
      allThemes.value = officialThemes.value;
    } else {
      // 生产环境下显示空状态
      officialThemes.value = [];
      allThemes.value = [];
    }
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
  
  // 重新筛选
  reloadCurrentData();
}

// 主题来源筛选处理函数
function handleSourceFilterChange(source: 'all' | 'official' | 'purchased' | 'mine') {
  themeSourceFilter.value = source;
  
  // 重新筛选
  reloadCurrentData();
}

// 游戏选择处理函数
function handleGameSelectChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const gameId = Number(target.value);
  const game = games.value.find(g => g.gameId === gameId);
  
  if (game) {
    selectedGameId.value = game.gameId;
    selectedGameCode.value = game.gameCode;
    reloadCurrentData();
  }
}

// 重新加载筛选后的数据
async function reloadCurrentData() {
  // 先调用后端 API 获取官方主题
  await loadStoreThemes();
  
  // 然后合并我的主题（根据筛选条件）
  const themes: any[] = [...allThemes.value];
  
  // 如果筛选条件包含"我的"，添加我的主题
  if (themeSourceFilter.value === 'all' || themeSourceFilter.value === 'mine') {
    myThemes.value.forEach((theme: any) => {
      // 避免重复
      const exists = themes.find(t => t.themeId === theme.themeId);
      if (!exists) {
        themes.push({
          ...theme,
          source: 'mine',
          sourceLabel: '我的',
          sourceIcon: '🎨',
        });
      }
    });
  }
  
  allThemes.value = themes;
  console.log('[CreatorCenter] 主题列表更新:', themes.length, '条');
}

// 事件处理函数
function goBack() {
  router.push('/parent');
}

function handleViewTheme(theme: any) {
  console.log('[CreatorCenter] 查看主题:', theme);
  dialog.info(`查看主题：${theme.name || theme.themeName}\n${theme.description || '暂无描述'}`);
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
    console.log('[CreatorCenter] 创建新主题 - 跳转到GTRS编辑器');
  }

  router.push({
    path: '/creator-center/gtrs-editor',
    query
  });
}

function handleUseTheme(theme: any) {
  console.log('[CreatorCenter] 使用主题:', theme);
  dialog.success(`已应用主题：${theme.name || theme.themeName}`);
  // TODO: 应用主题到游戏
  // themeManager.applyTheme(theme);
}

function handleToggleSale(theme: CloudThemeInfo) {
  console.log('[CreatorCenter] 切换销售状态:', theme);

  const newStatus = theme.status !== 'on_sale';
  const action = newStatus ? '上架' : '下架';

  ElMessageBox.confirm(
    `确定要${action}主题「${theme.name || theme.themeName}」吗？`,
    '确认操作',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    const success = await themeManager.toggleThemeSale(theme.id, newStatus);
    if (success) {
      ElMessage.success(`${action}成功！`);
      // 刷新列表以同步状态
      await loadAllData();
    } else {
      ElMessage.error('操作失败，请重试');
    }
  }).catch(() => {
    // 用户取消
  });
}

function handleEdit(theme: CloudThemeInfo) {
  console.log('[CreatorCenter] 编辑主题:', theme);
  // TODO: 打开编辑表单
}

function handleDelete(theme: CloudThemeInfo) {
  console.log('[CreatorCenter] 删除主题:', theme);
  // TODO: 调用 API 删除
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

// 开发模式下的模拟主题数据（我的主题）
function getMockThemes(): CloudThemeInfo[] {
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
      ownerId: null,
      gameCode: '',
      gameName: '',
      createdAt: '2024-01-20T14:45:00Z',
      source: 'mine',
      sourceLabel: '我的',
      sourceIcon: '🎨'
    }
  ];
}

// 开发模式下的模拟商店主题数据
function getMockStoreThemes(): CloudThemeInfo[] {
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
      ownerId: null,
      gameCode: '',
      gameName: '',
      createdAt: '2024-01-10T09:00:00Z',
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
      ownerId: null,
      gameCode: '',
      gameName: '',
      createdAt: '2024-01-18T16:20:00Z',
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

.game-select {
  padding: 8px 12px;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  color: #4a5568;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  min-width: 150px;
  
  &:focus {
    outline: none;
    border-color: #4ECDC4;
  }
  
  &:hover {
    border-color: #cbd5e0;
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
