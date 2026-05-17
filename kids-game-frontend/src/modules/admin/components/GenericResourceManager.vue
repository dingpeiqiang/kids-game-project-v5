<template>
  <div class="generic-resource-manager">
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <div class="game-selector">
        <label>选择游戏：</label>
        <select v-model="selectedGame" @change="onGameChange" class="select-game">
          <option value="">-- 请选择游戏 --</option>
          <option v-for="game in games" :key="game.gameId" :value="game.gameId">
            {{ game.gameName }}
          </option>
        </select>
      </div>
      
      <div class="theme-selector" v-if="selectedGame">
        <label>选择主题：</label>
        <select v-model="selectedTheme" @change="onThemeChange" class="select-theme">
          <option value="">-- 请选择主题 --</option>
          <option v-for="theme in themes" :key="theme.themeId" :value="theme.themeId">
            {{ theme.themeName }}
          </option>
        </select>
      </div>
      
      <div class="actions" v-if="resourceManager">
        <button @click="regenerateAllResources" class="btn-regenerate" :disabled="isGenerating">
          {{ isGenerating ? '⏳ 生成中...' : '🔄 重新生成所有资源' }}
        </button>
        <button @click="refreshPreviews" class="btn-refresh">
          🔃 刷新预览
        </button>
        <button @click="applyResources" class="btn-apply" :disabled="isApplying">
          {{ isApplying ? '⏳ 应用中...' : '✅ 应用资源' }}
        </button>
      </div>
    </div>
    
    <!-- 资源分组展示 -->
    <div class="resource-groups" v-if="resourceManager && groups.length > 0">
      <div 
        v-for="(group, index) in groups" 
        :key="index"
        class="resource-group"
      >
        <!-- 分组标题 -->
        <div class="group-header" @click="toggleGroup(index)">
          <span class="group-icon">{{ group.icon || '📁' }}</span>
          <h3 class="group-title">{{ group.name }}</h3>
          <span class="group-count">{{ group.resources.length }} 个资源</span>
          <span class="group-toggle">{{ expandedGroups[index] ? '▼' : '▶' }}</span>
        </div>
        
        <!-- 分组内容 -->
        <div v-show="expandedGroups[index]" class="group-content">
          <div class="resource-grid">
            <div 
              v-for="resource in getGroupResources(group.name)" 
              :key="resource.key"
              class="resource-card"
              @click="showResourceDetail(resource)"
            >
              <div class="resource-image">
                <img 
                  v-if="resource.type === 'image'"
                  :src="resource.previewUrl" 
                  :alt="resource.alias"
                  @error="handleImageError"
                />
                <div v-else-if="resource.type === 'audio'" class="audio-placeholder">
                  🎵
                </div>
                <div v-else-if="resource.type === 'json'" class="json-placeholder">
                  📄
                </div>
                <div v-else class="default-placeholder">
                  📦
                </div>
              </div>
              <div class="resource-info">
                <div class="resource-name">{{ resource.alias }}</div>
                <div class="resource-key">{{ resource.key }}</div>
                <div class="resource-meta">
                  <span class="size" v-if="resource.size">{{ resource.size.width }}x{{ resource.size.height }}</span>
                  <span class="format">{{ resource.format }}</span>
                </div>
                <div class="resource-status" :class="resource.status">
                  {{ getStatusText(resource.status) }}
                </div>
              </div>
              <div class="resource-actions">
                <button @click.stop="regenerateSingle(resource)" class="btn-small" :disabled="isGenerating">
                  🔄 重生成
                </button>
                <button @click.stop="previewResource(resource)" class="btn-small">
                  👁️ 预览
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 资源详情弹窗 -->
    <KidUnifiedModalV2
      v-model:show="showDetailModal"
      title="📄 资源详情"
      icon="🖼️"
      size="lg"
      :closable="true"
      confirm-text="✅ 采纳此版本"
      cancel-text="关闭"
      @confirm="adoptResource"
    >
      <div v-if="selectedResource" class="resource-detail">
        <div class="detail-image">
          <img 
            v-if="selectedResource.type === 'image'"
            :src="selectedResource.previewUrl" 
            :alt="selectedResource.alias"
          />
          <div v-else-if="selectedResource.type === 'audio'" class="audio-detail">
            <p>🎵 音频文件</p>
            <audio controls :src="selectedResource.previewUrl"></audio>
          </div>
          <div v-else class="file-detail">
            <p>📄 文件预览</p>
            <a :href="selectedResource.previewUrl" target="_blank">打开文件</a>
          </div>
        </div>
        <div class="detail-info">
          <h4>{{ selectedResource.alias }}</h4>
          <div class="info-row">
            <span class="label">资源Key：</span>
            <span class="value">{{ selectedResource.key }}</span>
          </div>
          <div class="info-row">
            <span class="label">类型：</span>
            <span class="value">{{ selectedResource.type }}</span>
          </div>
          <div class="info-row" v-if="selectedResource.size">
            <span class="label">尺寸：</span>
            <span class="value">{{ selectedResource.size.width }} x {{ selectedResource.size.height }}</span>
          </div>
          <div class="info-row">
            <span class="label">格式：</span>
            <span class="value">{{ selectedResource.format }}</span>
          </div>
          <div class="info-row">
            <span class="label">状态：</span>
            <span class="value" :class="selectedResource.status">
              {{ getStatusText(selectedResource.status) }}
            </span>
          </div>
          <div class="info-row" v-if="selectedResource.generatedAt">
            <span class="label">生成时间：</span>
            <span class="value">{{ formatDate(selectedResource.generatedAt) }}</span>
          </div>
          <div class="info-row" v-if="selectedResource.prompt">
            <span class="label">提示词：</span>
            <span class="value prompt-text">{{ selectedResource.prompt }}</span>
          </div>
        </div>
      </div>
    </KidUnifiedModalV2>
    
    <!-- 生成进度弹窗 -->
    <KidUnifiedModalV2
      v-model:show="showProgressModal"
      title="⏳ 资源生成进度"
      icon="⏳"
      size="md"
      :closable="false"
      :showFooter="false"
    >
      <div class="progress-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: progressPercent + '%' }"
          ></div>
        </div>
        <div class="progress-text">
          {{ generationProgress.current }} / {{ generationProgress.total }} ({{ progressPercent }}%)
        </div>
        <div class="progress-message">{{ progressMessage }}</div>
        
        <div class="log-container" v-if="generationLogs.length > 0">
          <h5>生成日志：</h5>
          <div class="logs">
            <div 
              v-for="(log, index) in generationLogs" 
              :key="index"
              class="log-item"
              :class="log.type"
            >
              {{ log.message }}
            </div>
          </div>
        </div>
      </div>
    </KidUnifiedModalV2>
    
    <!-- 空状态 -->
    <div class="empty-state" v-if="!resourceManager">
      <div class="empty-icon">🎮</div>
      <h3>请选择游戏和主题</h3>
      <p>选择一个游戏和主题来查看和管理资源</p>
    </div>
    
    <!-- 加载状态 -->
    <div class="loading-state" v-if="isLoading">
      <div class="loading-icon">⏳</div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import KidUnifiedModalV2 from '@/components/ui/KidUnifiedModalV2.vue';
import { ElMessage } from 'element-plus';
import { createResourceManager, GenericResourceManager, ResourceStatus } from '../utils/generic-resource-manager';
import type { ResourceItem } from '../utils/generic-resource-manager';
import type { ResourceManagerConfig, ResourceGroupConfig } from '../types/resource-manager-config';
import { ResourceType } from '../types/resource-manager-config';

interface Game {
  gameId: string;
  gameName: string;
  gameType: string;
}

interface Theme {
  themeId: string;
  themeName: string;
  status: string;
}

interface GenerationLog {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

// 状态
const route = useRoute();
const games = ref<Game[]>([]);
const themes = ref<Theme[]>([]);
const selectedGame = ref('');
const selectedTheme = ref('');
const resourceManager = ref<GenericResourceManager | null>(null);
const groups = ref<ResourceGroupConfig[]>([]);
const expandedGroups = ref<boolean[]>([]);
const selectedResource = ref<ResourceItem | null>(null);
const isLoading = ref(false);

// 弹窗状态
const showDetailModal = ref(false);
const showProgressModal = ref(false);

// 生成状态
const isGenerating = ref(false);
const isApplying = ref(false);
const generationProgress = ref({ current: 0, total: 0 });
const progressPercent = ref(0);
const progressMessage = ref('');
const generationLogs = ref<GenerationLog[]>([]);

// 加载游戏列表
const loadGames = async () => {
  try {
    // TODO: 调用 API 获取游戏列表
    const response = await fetch('/api/admin/games');
    if (response.ok) {
      games.value = await response.json();
    }
  } catch (error) {
    console.error('加载游戏列表失败:', error);
    // 模拟数据
    games.value = [
      { gameId: 'pvz', gameName: '植物大战僵尸', gameType: 'tower-defense' },
      { gameId: 'snake', gameName: '贪吃蛇', gameType: 'arcade' },
    ];
  }
};

// 加载主题列表
const loadThemes = async () => {
  if (!selectedGame.value) return;
  
  try {
    // TODO: 调用 API 获取主题列表
    const response = await fetch(`/api/admin/themes?gameId=${selectedGame.value}`);
    if (response.ok) {
      themes.value = await response.json();
    }
  } catch (error) {
    console.error('加载主题列表失败:', error);
    // 模拟数据
    themes.value = [
      { themeId: 'pvz', themeName: 'PVZ 默认主题', status: 'on_sale' },
    ];
  }
};

// 游戏改变
const onGameChange = async () => {
  selectedTheme.value = '';
  resourceManager.value = null;
  groups.value = [];
  await loadThemes();
};

// 主题改变
const onThemeChange = async () => {
  if (!selectedGame.value || !selectedTheme.value) return;
  
  isLoading.value = true;
  
  try {
    // 创建资源配置
    const config: ResourceManagerConfig = {
      gameConfig: {
        gameId: selectedGame.value,
        gameName: games.value.find(g => g.gameId === selectedGame.value)?.gameName || '',
        themeId: selectedTheme.value,
        themeName: themes.value.find(t => t.themeId === selectedTheme.value)?.themeName || '',
        themeBasePath: `/themes/${selectedTheme.value}`,
        groups: []
      },
      enableAIGeneration: true,
      enableAudioEditing: true,
      enableSpriteSheetMaker: true
    };
    
    // 创建资源管理器
    const manager = createResourceManager(config);
    
    // 设置事件监听
    manager.setEvents({
      onConfigLoaded: (config) => {
        console.log('[ResourceManager] 配置加载成功', config);
      },
      onResourcesUpdated: (resources) => {
        console.log('[ResourceManager] 资源列表更新', resources.length);
      },
      onGenerationProgress: (current, total, resource) => {
        generationProgress.value = { current, total };
        progressPercent.value = Math.round((current / total) * 100);
        progressMessage.value = `正在生成: ${resource.alias}`;
        addLog('info', `生成资源 ${current}/${total}: ${resource.alias}`);
      },
      onGenerationComplete: (success, resources) => {
        isGenerating.value = false;
        progressMessage.value = success ? '生成完成！' : '生成完成，部分失败';
        addLog(success ? 'success' : 'warning', `批量生成完成`);
        
        setTimeout(() => {
          showProgressModal.value = false;
        }, 1500);
      },
      onError: (error) => {
        console.error('[ResourceManager] 错误:', error);
        ElMessage.error(error.message);
      }
    });
    
    // 初始化
    await manager.initialize();
    
    resourceManager.value = manager;
    groups.value = manager.getGroups();
    expandedGroups.value = groups.value.map(() => true); // 默认全部展开
    
    ElMessage.success('资源加载成功');
  } catch (error) {
    console.error('初始化资源管理器失败:', error);
    ElMessage.error('加载资源失败');
  } finally {
    isLoading.value = false;
  }
};

// 切换分组展开/折叠
const toggleGroup = (index: number) => {
  expandedGroups.value[index] = !expandedGroups.value[index];
};

// 获取分组资源
const getGroupResources = (groupName: string): ResourceItem[] => {
  if (!resourceManager.value) return [];
  return resourceManager.value.getResourcesByGroup(groupName);
};

// 重新生成所有资源
const regenerateAllResources = async () => {
  if (!resourceManager.value) return;
  
  isGenerating.value = true;
  showProgressModal.value = true;
  generationProgress.value = { current: 0, total: resourceManager.value.getTotalResourceCount() };
  progressPercent.value = 0;
  progressMessage.value = '准备生成资源...';
  generationLogs.value = [];
  
  try {
    await resourceManager.value.regenerateAllResources();
  } catch (error) {
    console.error('生成资源失败:', error);
    ElMessage.error('生成资源失败');
  }
};

// 重新生成单个资源
const regenerateSingle = async (resource: ResourceItem) => {
  if (!resourceManager.value) return;
  
  try {
    addLog('info', `重新生成: ${resource.alias}`);
    
    const success = await resourceManager.value.regenerateResource(resource.key);
    
    if (success) {
      addLog('success', `${resource.alias} 生成成功`);
      ElMessage.success(`${resource.alias} 重新生成成功`);
    } else {
      addLog('error', `${resource.alias} 生成失败`);
      ElMessage.error('重新生成失败');
    }
  } catch (error) {
    console.error('重新生成失败:', error);
    addLog('error', `${resource.alias} 生成失败`);
    ElMessage.error('重新生成失败');
  }
};

// 应用资源
const applyResources = async () => {
  if (!resourceManager.value) return;
  
  isApplying.value = true;
  
  try {
    const success = await resourceManager.value.applyResources();
    
    if (success) {
      ElMessage.success('资源应用成功！已替换原游戏素材');
    } else {
      ElMessage.error('应用资源失败');
    }
  } catch (error) {
    console.error('应用资源失败:', error);
    ElMessage.error('应用资源失败');
  } finally {
    isApplying.value = false;
  }
};

// 刷新预览
const refreshPreviews = () => {
  if (!resourceManager.value) return;
  
  resourceManager.value.refreshPreviews();
  ElMessage.success('预览已刷新');
};

// 显示资源详情
const showResourceDetail = (resource: ResourceItem) => {
  selectedResource.value = resource;
  showDetailModal.value = true;
};

// 预览资源
const previewResource = (resource: ResourceItem) => {
  if (resource.previewUrl) {
    window.open(resource.previewUrl, '_blank');
  }
};

// 采纳资源
const adoptResource = () => {
  if (selectedResource.value) {
    selectedResource.value.status = ResourceStatus.UNCHANGED;
    ElMessage.success(`已采纳 ${selectedResource.value.alias}`);
  }
  showDetailModal.value = false;
};

// 添加日志
const addLog = (type: GenerationLog['type'], message: string) => {
  generationLogs.value.push({ type, message });
  // 自动滚动到底部
  setTimeout(() => {
    const logContainer = document.querySelector('.logs');
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }, 100);
};

// 图片加载错误处理
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaXoOazleWKoOi9veWbvueJhzwvdGV4dD48L3N2Zz4=';
};

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
};

// 获取状态文本
const getStatusText = (status: ResourceStatus): string => {
  const statusMap: Record<string, string> = {
    [ResourceStatus.NEW]: '✨ 新生成',
    [ResourceStatus.MODIFIED]: '✏️ 已修改',
    [ResourceStatus.UNCHANGED]: '✓ 未变化',
    [ResourceStatus.ERROR]: '❌ 错误'
  };
  return statusMap[status] || status;
};

// 初始化
onMounted(() => {
  console.log('[GenericResourceManager] 组件挂载');
  
  // 从 URL 参数中获取 gameId 和 themeId
  const gameId = route.query.gameId as string;
  const themeId = route.query.themeId as string;
  
  console.log('[GenericResourceManager] URL 参数:', { gameId, themeId });
  
  if (gameId) {
    selectedGame.value = gameId;
    
    // 加载主题列表
    setTimeout(() => {
      loadThemes();
      
      // 如果有主题 ID，也自动选择
      if (themeId) {
        setTimeout(() => {
          selectedTheme.value = themeId;
          onThemeChange();
        }, 300);
      }
    }, 300);
  }
  
  // 加载游戏列表
  loadGames();
});
</script>

<style scoped>
.generic-resource-manager {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.action-bar {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.game-selector,
.theme-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.select-game,
.select-theme {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  min-width: 200px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.btn-regenerate,
.btn-refresh,
.btn-apply {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-regenerate {
  background: #409eff;
  color: white;
}

.btn-regenerate:hover:not(:disabled) {
  background: #66b1ff;
}

.btn-regenerate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-refresh {
  background: #67c23a;
  color: white;
}

.btn-refresh:hover {
  background: #85ce61;
}

.btn-apply {
  background: #e6a23c;
  color: white;
}

.btn-apply:hover:not(:disabled) {
  background: #ebb563;
}

.btn-apply:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.resource-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.resource-group {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  background: #f5f7fa;
  cursor: pointer;
  transition: background 0.3s;
}

.group-header:hover {
  background: #e4e7ed;
}

.group-icon {
  font-size: 24px;
}

.group-title {
  flex: 1;
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.group-count {
  font-size: 12px;
  color: #909399;
}

.group-toggle {
  font-size: 12px;
  color: #909399;
}

.group-content {
  padding: 20px;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.resource-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.resource-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #409eff;
}

.resource-image {
  width: 100%;
  height: 200px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.resource-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.audio-placeholder,
.json-placeholder,
.default-placeholder {
  font-size: 48px;
}

.resource-info {
  padding: 12px;
}

.resource-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  word-break: break-all;
}

.resource-key {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  font-family: monospace;
}

.resource-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.resource-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.resource-status.new {
  background: #e1f3d8;
  color: #67c23a;
}

.resource-status.modified {
  background: #fdf6ec;
  color: #e6a23c;
}

.resource-status.unchanged {
  background: #f4f4f5;
  color: #909399;
}

.resource-status.error {
  background: #fef0f0;
  color: #f56c6c;
}

.resource-actions {
  display: flex;
  gap: 8px;
  padding: 0 12px 12px;
}

.btn-small {
  flex: 1;
  padding: 6px;
  border: 1px solid #dcdfe6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.btn-small:hover:not(:disabled) {
  background: #f5f7fa;
  border-color: #409eff;
  color: #409eff;
}

.btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.resource-detail {
  display: flex;
  gap: 20px;
}

.detail-image {
  flex: 1;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.detail-image img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
}

.audio-detail,
.file-detail {
  text-align: center;
}

.audio-detail audio {
  width: 100%;
  margin-top: 20px;
}

.detail-info {
  flex: 1;
}

.detail-info h4 {
  margin: 0 0 15px;
  font-size: 18px;
  color: #303133;
}

.info-row {
  display: flex;
  margin-bottom: 10px;
  font-size: 14px;
}

.info-row .label {
  width: 100px;
  color: #909399;
}

.info-row .value {
  flex: 1;
  color: #303133;
  font-weight: 500;
}

.prompt-text {
  font-size: 12px;
  color: #606266;
  line-height: 1.6;
  word-break: break-word;
}

.progress-container {
  padding: 20px;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #e4e7ed;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  transition: width 0.3s;
}

.progress-text {
  text-align: center;
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.progress-message {
  text-align: center;
  font-size: 14px;
  color: #409eff;
  margin-bottom: 20px;
}

.log-container {
  margin-top: 20px;
}

.log-container h5 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #303133;
}

.logs {
  max-height: 200px;
  overflow-y: auto;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 10px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-item {
  padding: 4px 0;
  border-bottom: 1px solid #e4e7ed;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item.info {
  color: #409eff;
}

.log-item.success {
  color: #67c23a;
}

.log-item.warning {
  color: #e6a23c;
}

.log-item.error {
  color: #f56c6c;
}

.empty-state,
.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-icon,
.loading-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state h3,
.loading-state p {
  margin: 0 0 10px;
  font-size: 20px;
  color: #606266;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}
</style>
