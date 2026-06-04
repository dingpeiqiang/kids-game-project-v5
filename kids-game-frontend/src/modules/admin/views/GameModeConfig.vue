<template>
  <div class="game-mode-config p-6">
    <h2 class="text-2xl font-bold mb-6 text-gray-800">游戏模式配置</h2>
    
    <!-- 游戏选择 -->
    <div class="mb-6 bg-white p-4 rounded-lg shadow">
      <label class="block text-sm font-medium text-gray-700 mb-2">选择游戏</label>
      <select 
        v-model="selectedGameId" 
        @change="loadGameModes"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">请选择游戏</option>
        <option v-for="game in games" :key="game.gameId" :value="game.gameId">
          {{ game.gameName }} ({{ game.gameCode }})
        </option>
      </select>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <p class="mt-2 text-gray-600">加载中...</p>
    </div>
    
    <!-- 模式列表 -->
    <div v-if="selectedGameId && !loading" class="space-y-4">
      <div 
        v-for="mode in modeConfigs" 
        :key="mode.id"
        class="bg-white rounded-lg shadow p-5 border-l-4"
        :class="mode.enabled ? 'border-green-500' : 'border-gray-300'"
      >
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="text-lg font-semibold text-gray-800">{{ mode.modeName }}</h3>
            <p class="text-sm text-gray-500">类型：{{ mode.modeType }}</p>
          </div>
          <label class="flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              v-model="mode.enabled"
              @change="saveModeConfig(mode)"
              class="sr-only"
            />
            <div 
              class="relative w-14 h-7 rounded-full transition-colors duration-200 ease-in-out"
              :class="mode.enabled ? 'bg-green-500' : 'bg-gray-300'"
            >
              <div 
                class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform duration-200 ease-in-out shadow"
                :class="mode.enabled ? 'transform translate-x-7' : 'translate-x-0'"
              ></div>
            </div>
            <span class="ml-2 text-sm font-medium" :class="mode.enabled ? 'text-green-600' : 'text-gray-500'">
              {{ mode.enabled ? '已启用' : '已禁用' }}
            </span>
          </label>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">排序权重</label>
            <input 
              type="number" 
              v-model.number="mode.sortOrder"
              @blur="saveModeConfig(mode)"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">配置 ID</label>
            <div class="px-3 py-2 bg-gray-50 rounded text-sm text-gray-600">
              {{ mode.id }}
            </div>
          </div>
        </div>
        
        <!-- 配置 JSON 编辑 -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="block text-xs font-medium text-gray-600">模式配置 (JSON)</label>
            <button 
              @click="formatJson(mode)"
              class="text-xs text-blue-600 hover:text-blue-800"
            >
              格式化
            </button>
          </div>
          <textarea 
            v-model="mode.configJson"
            @blur="saveModeConfig(mode)"
            rows="6"
            class="w-full px-3 py-2 border border-gray-300 rounded font-mono text-xs bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            spellcheck="false"
          ></textarea>
          <p class="mt-1 text-xs text-gray-500">提示：可配置 AI 难度、响应延迟等参数</p>
        </div>
        
        <!-- 操作按钮 -->
        <div class="mt-4 flex justify-end space-x-2">
          <button 
            @click="deleteModeConfig(mode)"
            class="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
          >
            删除配置
          </button>
        </div>
      </div>
      
      <!-- 添加新模式 -->
      <div class="bg-white rounded-lg shadow p-5 border-2 border-dashed border-gray-300">
        <h3 class="text-lg font-semibold text-gray-700 mb-3">添加新模式</h3>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">模式类型</label>
            <select 
              v-model="newMode.modeType"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="single_player">单机模式</option>
              <option value="local_battle">本地对抗</option>
              <option value="online_battle">网络对抗</option>
              <option value="team">组队模式</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">模式名称</label>
            <input 
              type="text" 
              v-model="newMode.modeName"
              class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="例如：闯关模式"
            />
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">默认配置 (JSON)</label>
          <textarea 
            v-model="newMode.configJson"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded font-mono text-xs bg-gray-50 focus:ring-2 focus:ring-blue-500"
          >{}</textarea>
        </div>
        <button 
          @click="addNewMode"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          + 添加模式配置
        </button>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-if="selectedGameId && !loading && modeConfigs.length === 0" class="text-center py-12 bg-white rounded-lg shadow">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
      </svg>
      <p class="mt-2 text-gray-600">该游戏暂无模式配置</p>
      <p class="text-sm text-gray-500 mt-1">请点击下方"添加新模式"来配置</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { gameModeApi } from '@/services/game-mode-api.service';
import { gameApi } from '@/services/game-api.service';
import { useConfirm } from '@/composables/useDialog';
import type { GameModeConfiguration } from '@/modules/game/types/game.types';
import { toast } from '@/services/toast.service';

const games = ref<any[]>([]);
const selectedGameId = ref<number | null>(null);
const modeConfigs = ref<GameModeConfiguration[]>([]);
const loading = ref(false);

const newMode = ref<Partial<GameModeConfiguration>>({
  modeType: 'single_player',
  modeName: '',
  enabled: true,
 configJson: '{}',
  sortOrder: 0,
});

// 加载游戏列表
onMounted(async () => {
  await loadGames();
});

async function loadGames() {
  try {
  const gameList = await gameApi.getList();
    games.value = gameList.filter(g => g.status === 1); // 只显示启用的游戏
  } catch (error) {
  console.error('加载游戏列表失败:', error);
    toast.error('加载游戏列表失败');
  }
}

async function loadGameModes() {
  if (!selectedGameId.value) {
   modeConfigs.value = [];
    return;
  }
  
  loading.value = true;
  try {
   modeConfigs.value = await gameModeApi.getModeConfigs(selectedGameId.value);
  } catch (error) {
  console.error('加载模式配置失败:', error);
    toast.error('加载模式配置失败');
  } finally {
    loading.value = false;
  }
}

async function saveModeConfig(config: GameModeConfiguration) {
  try {
    await gameModeApi.saveModeConfig(config);
    toast.success('保存成功');
  } catch (error) {
  console.error('保存模式配置失败:', error);
    toast.error('保存失败');
  }
}

async function deleteModeConfig(config: GameModeConfiguration) {
  const confirmed = await useConfirm({ message: `确定要删除"${config.modeName}"吗？`, title: '删除确认', confirmVariant: 'danger' });
  if (!confirmed) return;
  
  try {
    await gameModeApi.deleteModeConfig(config.gameId, config.modeType);
    toast.success('删除成功');
    await loadGameModes();
  } catch (error) {
  console.error('删除模式配置失败:', error);
    toast.error('删除失败');
  }
}

async function addNewMode() {
  if (!selectedGameId.value) {
    toast.error('请先选择游戏');
    return;
  }
  
  if (!newMode.value.modeName) {
    toast.error('请输入模式名称');
    return;
  }
  
  try {
   const config: GameModeConfiguration = {
      id: 0,
      gameId: selectedGameId.value,
    modeType: newMode.value.modeType!,
    modeName: newMode.value.modeName,
     enabled: newMode.value.enabled ?? true,
    configJson: newMode.value.configJson || '{}',
      sortOrder: newMode.value.sortOrder || 0,
     createTime: Date.now(),
      updateTime: Date.now(),
    };
    
    await gameModeApi.saveModeConfig(config);
    toast.success('添加成功');
    
    // 重置表单
    newMode.value = {
     modeType: 'single_player',
     modeName: '',
     enabled: true,
     configJson: '{}',
      sortOrder: 0,
    };
    
    await loadGameModes();
  } catch (error) {
  console.error('添加模式配置失败:', error);
    toast.error('添加失败');
  }
}

function formatJson(config: GameModeConfiguration) {
  try {
  const parsed = JSON.parse(config.configJson);
   config.configJson= JSON.stringify(parsed, null, 2);
  } catch (error) {
   toast.error('JSON 格式错误');
  }
}
</script>

<style scoped>
.game-mode-config {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
