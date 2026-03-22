<template>
  <section class="my-themes">
    <div class="section-header">
      <h2 class="section-title">
        <span class="title-icon">{{ mode === 'admin' ? '🛡️' : '🎨' }}</span>
        <span class="title-text">{{ mode === 'admin' ? '主题管理' : '我的主题' }}</span>
      </h2>
      <p v-if="mode !== 'admin'" class="section-desc">展示我创作的主题（支持上架、下架、编辑等操作）</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载主题...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="themes.length === 0" class="empty-state">
      <div class="empty-illustration">🎨</div>
      <h3>暂无主题</h3>
      <p>请先从主题商店下载一个主题，然后基于它进行DIY</p>
    </div>

    <!-- 主题列表 -->
    <div v-else class="my-themes-grid">
      <ThemeCard
        v-for="theme in themes"
        :key="theme.id || theme.themeId"
        :theme="theme"
        :mode="mode"
      >
        <!-- ⭐ 后台管理模式：显示审批功能 -->
        <template #actions v-if="mode === 'admin'">
          <!-- 待审核主题：显示审批按钮 -->
          <template v-if="theme.status === 'pending'">
            <button class="btn-action btn-approve" @click="handleApprove(theme, true)">✅ 通过</button>
            <button class="btn-action btn-reject" @click="handleApprove(theme, false)">❌ 拒绝</button>
          </template>
          <!-- 已上线/已下架主题：显示常规操作 -->
          <template v-else>
            <button class="btn-action btn-view" @click="handleView(theme)">👁️ 查看</button>
            <button class="btn-action btn-edit" @click="handleEdit(theme)">✏️ 编辑</button>
            <button class="btn-action btn-toggle" @click="handleToggle(theme)" :disabled="isToggling">
              {{ theme.status === 'on_sale' ? '📥 下架' : '📤 上架' }}
            </button>
            <button class="btn-action btn-delete" @click="handleDelete(theme)">🗑️ 删除</button>
          </template>
        </template>

        <!-- ⭐ 创作者中心模式：显示创作相关功能 -->
        <template #actions v-else>
          <!-- 官方主题操作 -->
          <template v-if="theme.source === 'official'">
            <button class="btn-action btn-view" @click="handleView(theme)">👁️ 查看</button>
            <button class="btn-action btn-diy" @click="handleDIY(theme)">✨ DIY</button>
            <button v-if="!theme.isDefault" class="btn-action btn-use" @click="handleUse(theme)">🎯 使用</button>
          </template>

          <!-- 我的主题操作 -->
          <template v-else-if="theme.source === 'mine' || !theme.source">
            <template v-if="theme.status === 'pending'">
              <div class="pending-hint">
                <span class="pending-icon">⏳</span>
                <span class="pending-text">审核中，请稍候...</span>
              </div>
            </template>
            <template v-else>
              <button class="btn-action btn-view" @click="handleView(theme)">👁️ 查看</button>
              <button class="btn-action btn-diy" @click="handleDIY(theme)">✨ DIY</button>
              <button class="btn-action btn-toggle" @click="handleToggle(theme)" :disabled="isToggling">
                {{ theme.status === 'on_sale' ? '⬇️ 下架' : '⬆️ 上架' }}
              </button>
              <button class="btn-action btn-edit" @click="handleEdit(theme)">✏️ 修改</button>
              <button class="btn-action btn-delete" @click="handleDelete(theme)">🗑️ 删除</button>
              <button v-if="!theme.isDefault" class="btn-action btn-use" @click="handleUse(theme)">🎯 使用</button>
            </template>
          </template>

          <!-- 已购主题操作 -->
          <template v-else-if="theme.source === 'purchased'">
            <button class="btn-action btn-view" @click="handleView(theme)">👁️ 查看</button>
            <button class="btn-action btn-diy" @click="handleDIY(theme)">✨ DIY</button>
            <button v-if="!theme.isDefault" class="btn-action btn-use" @click="handleUse(theme)">🎯 使用</button>
          </template>
        </template>
      </ThemeCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { CloudThemeInfo } from '@/core/theme/ThemeManager';
import { useConfirm } from '@/composables/useDialog';
import ThemeCard from '@/core/theme/components/ThemeCard.vue';

// Props - 支持模式切换
const props = defineProps<{
  themes: any[];
  loading?: boolean;
  mode?: 'creator' | 'admin'; // 'creator': 创作者中心，'admin': 后台管理
}>();

// Emits - 后台管理模式下不需要的 emit
const emit = defineEmits<{
  create: [];
  view: [theme: any];
  diy: [theme: any];
  use: [theme: any];
  toggle: [theme: CloudThemeInfo];
  edit: [theme: CloudThemeInfo];
  stats: [theme: CloudThemeInfo];
  delete: [theme: CloudThemeInfo];
  approve: [theme: CloudThemeInfo, approved: boolean]; // 后台管理专用：审批主题
}>();

// 操作锁
const isToggling = ref(false);

// 格式化日期
function formatDate(date: string | number | undefined) {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return 'N/A';
  }
}

// 获取封面样式
function getCoverStyle(theme: any) {
  // 优先使用渐变背景，确保即使 thumbnailUrl 无效也不会空白
  const gradientBg = { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };

  if (theme.thumbnailUrl && theme.thumbnailUrl.trim()) {
    return {
      backgroundImage: `url(${theme.thumbnailUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      ...gradientBg, // 同时设置渐变作为图片加载失败的兜底
    };
  }
  return gradientBg;
}

// 获取类型图标
function getOwnerTypeIcon(ownerType?: 'GAME' | 'APPLICATION'): string {
  if (ownerType === 'GAME') return '🎮';
  return '📱';
}

// 获取类型文本
function getOwnerTypeText(ownerType?: 'GAME' | 'APPLICATION'): string {
  if (ownerType === 'GAME') return '游戏主题';
  return '应用主题';
}

// 获取类型样式类名
function getOwnerTypeClass(ownerType?: 'GAME' | 'APPLICATION'): string {
  if (ownerType === 'GAME') return 'game';
  return 'application';
}

// 查看主题
function handleView(theme: any) {
  emit('view', theme);
}

// DIY 主题
function handleDIY(theme: any) {
  emit('diy', theme);
}

// 使用主题
function handleUse(theme: any) {
  emit('use', theme);
}

// 处理切换上下架
async function handleToggle(theme: CloudThemeInfo) {
  if (isToggling.value) return;
  
  isToggling.value = true;
  try {
    emit('toggle', theme);
  } finally {
    isToggling.value = false;
  }
}

// 处理编辑
function handleEdit(theme: CloudThemeInfo) {
  emit('edit', theme);
}

// 处理审批（后台管理专用）
function handleApprove(theme: CloudThemeInfo, approved: boolean) {
  emit('approve', theme, approved);
}

// 处理查看数据
function handleStats(theme: CloudThemeInfo) {
  emit('stats', theme);
}

// 处理删除
async function handleDelete(theme: CloudThemeInfo) {
  const confirmed = await useConfirm({ message: `确定要删除主题"${theme.name}"吗？此操作不可恢复!`, title: '删除确认', confirmVariant: 'danger' });
  if (confirmed) emit('delete', theme);
}
</script>

<style scoped lang="scss">
// 页面标题
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  color: #2d3748;

  .title-icon {
    font-size: 28px;
  }
}

// 加载/空状态
.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #4ECDC4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-illustration {
  font-size: 64px;
  margin-bottom: 16px;
}

// 主题卡片网格
.my-themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

// 审核中提示
.pending-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(234, 179, 8, 0.1) 100%);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #d97706;
  grid-column: 1 / -1;

  .pending-icon {
    font-size: 14px;
    animation: pulse 2s ease-in-out infinite;
  }

  .pending-text {
    color: #92400e;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 响应式
@media (max-width: 640px) {
  .my-themes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
