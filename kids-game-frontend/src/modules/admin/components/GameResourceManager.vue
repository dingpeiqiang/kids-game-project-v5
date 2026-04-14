<template>
  <div class="game-resource-manager">
    <!-- 调试信息 -->
    <div style="background: yellow; padding: 10px; margin-bottom: 10px;">
      <strong>调试信息：</strong>
      <div>selectedGame: {{ selectedGame || '(空)' }}</div>
      <div>selectedTheme: {{ selectedTheme || '(空)' }}</div>
      <div>games.length: {{ games.length }}</div>
      <div>themes.length: {{ themes.length }}</div>
      <div>resources.length: {{ resources.length }}</div>
    </div>
    
    <!-- 顶部操作栏 -->
    <div class="action-bar">
      <div class="game-selector">
        <label>选择游戏：</label>
        <select v-model="selectedGame" @change="loadGameResources" class="select-game">
          <option value="">-- 请选择游戏 --</option>
          <option v-for="game in games" :key="game.gameId" :value="game.gameId">
            {{ game.gameName }}
          </option>
        </select>
      </div>
      
      <div class="theme-selector" v-if="selectedGame">
        <label>选择主题：</label>
        <select v-model="selectedTheme" @change="loadThemeResources" class="select-theme">
          <option value="">-- 请选择主题 --</option>
          <option v-for="theme in themes" :key="theme.themeId" :value="theme.themeId">
            {{ theme.themeName }}
          </option>
        </select>
      </div>
      
      <div class="actions" v-if="selectedGame && selectedTheme">
        <button @click="regenerateResources" class="btn-regenerate" :disabled="regenerating">
          {{ regenerating ? '⏳ 生成中...' : '🔄 重新生成资源' }}
        </button>
        <button @click="refreshPreview" class="btn-refresh">
          🔃 刷新预览
        </button>
        <button @click="applyResources" class="btn-apply" :disabled="applying">
          {{ applying ? '⏳ 应用中...' : '✅ 应用资源' }}
        </button>
      </div>
    </div>
    
    <!-- 资源预览区域 -->
    <div class="resource-preview" v-if="selectedGame && selectedTheme">
      <h3 class="section-title">📦 资源预览 ({{ resources.length }} 个文件)</h3>
      
      <div class="resource-grid">
        <div 
          v-for="resource in resources" 
          :key="resource.name"
          class="resource-card"
          @click="showResourceDetail(resource)"
        >
          <div class="resource-image">
            <img 
              :src="resource.previewUrl" 
              :alt="resource.name"
              @error="handleImageError"
            />
          </div>
          <div class="resource-info">
            <div class="resource-name">{{ resource.name }}</div>
            <div class="resource-meta">
              <span class="size">{{ formatFileSize(resource.size) }}</span>
              <span class="dimensions">{{ resource.width }}x{{ resource.height }}</span>
            </div>
            <div class="resource-status" :class="resource.status">
              {{ getStatusText(resource.status) }}
            </div>
          </div>
          <div class="resource-actions">
            <button @click.stop="regenerateSingle(resource)" class="btn-small">
              🔄 重生成
            </button>
            <button @click.stop="previewResource(resource)" class="btn-small">
              👁️ 预览
            </button>
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
            :src="selectedResource.previewUrl" 
            :alt="selectedResource.name"
          />
        </div>
        <div class="detail-info">
          <h4>{{ selectedResource.name }}</h4>
          <div class="info-row">
            <span class="label">文件大小：</span>
            <span class="value">{{ formatFileSize(selectedResource.size) }}</span>
          </div>
          <div class="info-row">
            <span class="label">尺寸：</span>
            <span class="value">{{ selectedResource.width }} x {{ selectedResource.height }}</span>
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
          
          <div class="comparison" v-if="selectedResource.originalUrl">
            <h5>📊 对比原版本</h5>
            <div class="compare-images">
              <div class="compare-item">
                <p>原版本</p>
                <img :src="selectedResource.originalUrl" alt="Original" />
              </div>
              <div class="compare-arrow">➡️</div>
              <div class="compare-item">
                <p>新版本</p>
                <img :src="selectedResource.previewUrl" alt="New" />
              </div>
            </div>
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
          {{ progressCurrent }} / {{ progressTotal }} ({{ progressPercent }}%)
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
    <div class="empty-state" v-if="!selectedGame || !selectedTheme">
      <div class="empty-icon">🎮</div>
      <h3>请选择游戏和主题</h3>
      <p>选择一个游戏和主题来查看和管理资源</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import KidUnifiedModalV2 from '@/components/ui/KidUnifiedModalV2.vue';
import { ElMessage } from 'element-plus';

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

interface Resource {
  name: string;
  path: string;
  previewUrl: string;
  originalUrl?: string;
  size: number;
  width: number;
  height: number;
  format: string;
  status: 'new' | 'modified' | 'unchanged';
  generatedAt?: string;
}

interface GenerationLog {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

// 状态
const route = useRoute();
const games = ref<Game[]>([]);
const themes = ref<Theme[]>([]);
const resources = ref<Resource[]>([]);
const selectedGame = ref('');
const selectedTheme = ref('');
const selectedResource = ref<Resource | null>(null);

// 标记是否需要自动选择
const pendingAutoSelect = ref({
  gameId: '',
  themeId: ''
});

// 弹窗状态
const showDetailModal = ref(false);
const showProgressModal = ref(false);

// 生成状态
const regenerating = ref(false);
const applying = ref(false);
const progressCurrent = ref(0);
const progressTotal = ref(0);
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

// 加载游戏资源
const loadGameResources = async () => {
  selectedTheme.value = '';
  resources.value = [];
  await loadThemes();
};

// 加载主题资源
const loadThemeResources = async () => {
  if (!selectedGame.value || !selectedTheme.value) return;
  
  try {
    // TODO: 调用 API 获取资源列表
    const basePath = `/games/${selectedGame.value}/public/themes/${selectedTheme.value}/assets/scene`;
    
    // 模拟资源列表
    resources.value = [
      {
        name: 'peashooter.png',
        path: `${basePath}/peashooter.png`,
        previewUrl: `/games/${selectedGame.value}/public/themes/${selectedTheme.value}/assets/scene/peashooter.png?t=${Date.now()}`,
        size: 138979,
        width: 320,
        height: 320,
        format: 'PNG',
        status: 'unchanged',
      },
      {
        name: 'sunflower.png',
        path: `${basePath}/sunflower.png`,
        previewUrl: `/games/${selectedGame.value}/public/themes/${selectedTheme.value}/assets/scene/sunflower.png?t=${Date.now()}`,
        size: 217239,
        width: 320,
        height: 320,
        format: 'PNG',
        status: 'unchanged',
      },
      // ... 更多资源
    ];
  } catch (error) {
    console.error('加载资源失败:', error);
    ElMessage.error('加载资源失败');
  }
};

// 重新生成所有资源
const regenerateResources = async () => {
  regenerating.value = true;
  showProgressModal.value = true;
  progressCurrent.value = 0;
  progressTotal.value = 17; // PVZ 有 17 个资源
  progressPercent.value = 0;
  progressMessage.value = '准备生成资源...';
  generationLogs.value = [];
  
  try {
    // TODO: 调用后端 API 触发资源生成
    // 这里模拟生成过程
    for (let i = 0; i < 17; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      progressCurrent.value = i + 1;
      progressPercent.value = Math.round((i + 1) / 17 * 100);
      progressMessage.value = `正在生成资源 ${i + 1}/17...`;
      
      addLog('info', `生成资源 ${i + 1}/17`);
    }
    
    addLog('success', '所有资源生成完成！');
    ElMessage.success('资源生成成功');
    
    // 重新加载资源
    await loadThemeResources();
  } catch (error) {
    console.error('生成资源失败:', error);
    addLog('error', `生成失败: ${error instanceof Error ? error.message : String(error)}`);
    ElMessage.error('生成资源失败');
  } finally {
    regenerating.value = false;
    setTimeout(() => {
      showProgressModal.value = false;
    }, 1000);
  }
};

// 重新生成单个资源
const regenerateSingle = async (resource: Resource) => {
  try {
    addLog('info', `重新生成: ${resource.name}`);
    
    // TODO: 调用 API 重新生成单个资源
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 更新资源预览
    resource.previewUrl = `${resource.path}?t=${Date.now()}`;
    resource.status = 'new';
    resource.generatedAt = new Date().toISOString();
    
    addLog('success', `${resource.name} 生成成功`);
    ElMessage.success(`${resource.name} 重新生成成功`);
  } catch (error) {
    console.error('重新生成失败:', error);
    addLog('error', `${resource.name} 生成失败`);
    ElMessage.error('重新生成失败');
  }
};

// 应用资源
const applyResources = async () => {
  applying.value = true;
  
  try {
    // TODO: 调用 API 应用资源（替换原游戏的素材）
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    ElMessage.success('资源应用成功！已替换原游戏素材');
    
    // 标记所有资源为 unchanged
    resources.value.forEach(r => {
      r.status = 'unchanged';
    });
  } catch (error) {
    console.error('应用资源失败:', error);
    ElMessage.error('应用资源失败');
  } finally {
    applying.value = false;
  }
};

// 刷新预览
const refreshPreview = () => {
  resources.value.forEach(resource => {
    resource.previewUrl = `${resource.path}?t=${Date.now()}`;
  });
  ElMessage.success('预览已刷新');
};

// 显示资源详情
const showResourceDetail = (resource: Resource) => {
  selectedResource.value = resource;
  showDetailModal.value = true;
};

// 预览资源
const previewResource = (resource: Resource) => {
  window.open(resource.previewUrl, '_blank');
};

// 采纳资源
const adoptResource = () => {
  if (selectedResource.value) {
    selectedResource.value.status = 'new';
    ElMessage.success(`已采纳 ${selectedResource.value.name}`);
  }
  showDetailModal.value = false;
};

// 添加日志
const addLog = (type: GenerationLog['type'], message: string) => {
  generationLogs.value.push({ type, message, });
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

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
};

// 获取状态文本
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    new: '✨ 新生成',
    modified: '✏️ 已修改',
    unchanged: '✓ 未变化',
  };
  return statusMap[status] || status;
};

// 监听游戏列表加载完成，自动选择
watch(games, (newGames) => {
  if (newGames.length > 0 && pendingAutoSelect.value.gameId) {
    console.log('[ResourceManager] 游戏列表已加载，尝试自动选择:', pendingAutoSelect.value.gameId);
    
    // 查找匹配的游戏
    const game = newGames.find(g => g.gameId === pendingAutoSelect.value.gameId);
    if (game) {
      console.log('[ResourceManager] 找到游戏:', game);
      selectedGame.value = game.gameId;
      
      // 加载主题列表
      setTimeout(() => {
        loadThemes();
        
        // 如果有主题 ID，也自动选择
        if (pendingAutoSelect.value.themeId) {
          setTimeout(() => {
            const theme = themes.value.find(t => t.themeId === pendingAutoSelect.value.themeId);
            if (theme) {
              console.log('[ResourceManager] 找到主题:', theme);
              selectedTheme.value = theme.themeId;
              loadThemeResources();
            }
          }, 300);
        }
      }, 300);
      
      // 清空待处理标志
      pendingAutoSelect.value = { gameId: '', themeId: '' };
    } else {
      console.warn('[ResourceManager] 未找到游戏:', pendingAutoSelect.value.gameId);
      console.log('[ResourceManager] 可用游戏:', newGames.map(g => g.gameId));
    }
  }
}, { deep: true });

// 初始化
onMounted(() => {
  console.log('[ResourceManager] 组件挂载');
  
  // 从 URL 参数中获取 gameId 和 themeId
  const gameId = route.query.gameId as string;
  const themeId = route.query.themeId as string;
  
  console.log('[ResourceManager] URL 参数:', { gameId, themeId });
  
  if (gameId) {
    // 保存待处理的自动选择信息
    pendingAutoSelect.value = { gameId, themeId };
  }
  
  // 加载游戏列表
  loadGames();
});
</script>

<style scoped>
.game-resource-manager {
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

.section-title {
  margin: 20px 0 15px;
  font-size: 18px;
  color: #303133;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.resource-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s;
}

.resource-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

.resource-info {
  padding: 12px;
}

.resource-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  word-break: break-all;
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

.btn-small:hover {
  background: #f5f7fa;
  border-color: #409eff;
  color: #409eff;
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
}

.detail-image img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
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

.comparison {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.comparison h5 {
  margin: 0 0 15px;
  font-size: 16px;
  color: #303133;
}

.compare-images {
  display: flex;
  align-items: center;
  gap: 15px;
}

.compare-item {
  flex: 1;
  text-align: center;
}

.compare-item p {
  margin: 0 0 10px;
  font-size: 14px;
  color: #606266;
}

.compare-item img {
  max-width: 100%;
  max-height: 200px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.compare-arrow {
  font-size: 24px;
  color: #409eff;
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 10px;
  font-size: 20px;
  color: #606266;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}
</style>
