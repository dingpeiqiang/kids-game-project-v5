<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="show" class="kid-unified-modal-overlay" @click="handleOverlayClick">
        <Transition name="modal">
          <div 
            v-if="show" 
            class="kid-unified-modal" 
            :class="[`type-${type}`, `size-${size}`]"
            :style="customStyle"
            @click.stop
          >
            <!-- 关闭按钮 -->
            <button v-if="closable" class="modal-close-btn" @click="handleClose">
              <span>×</span>
            </button>

            <!-- 装饰元素 -->
            <div v-if="showDecorations" class="modal-decorations">
              <span class="decoration decoration-1">✨</span>
              <span class="decoration decoration-2">🌟</span>
              <span class="decoration decoration-3">💫</span>
            </div>

            <!-- 头部图标/表情 -->
            <div v-if="resolvedIcon" class="modal-icon-wrapper">
              <div class="modal-icon">
                {{ resolvedIcon }}
              </div>
            </div>

            <!-- 标题 -->
            <h2 v-if="title" class="modal-title">{{ title }}</h2>

            <!-- 副标题/描述 -->
            <p v-if="subtitle" class="modal-subtitle">{{ subtitle }}</p>

            <!-- 内容区域 -->
            <div class="modal-content" :style="contentMaxHeight">
              <slot>
                <!-- 默认显示统计数据 -->
                <div v-if="stats && stats.length > 0" class="modal-stats">
                  <div
                    v-for="(stat, index) in stats"
                    :key="index"
                    class="stat-item"
                    :style="{ animationDelay: `${index * 0.1}s` }"
                  >
                    <span class="stat-label">{{ stat.label }}</span>
                    <span class="stat-value">{{ stat.value }}</span>
                  </div>
                </div>
              </slot>
            </div>

            <!-- 操作按钮 -->
            <div v-if="shouldShowActions" class="modal-actions" :class="[`layout-${actionsLayout}`]">
              <slot name="actions">
                <slot name="footer">
                  <button
                    v-if="showCancel && !hasActions"
                    class="modal-action variant-secondary"
                    @click="handleCancel"
                  >
                    {{ cancelText }}
                  </button>
                  <button
                    v-if="showConfirm && !hasActions"
                    class="modal-action"
                    :class="`variant-${confirmVariant}`"
                    @click="handleConfirm"
                  >
                    {{ confirmText }}
                  </button>
                </slot>
              </slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, onUnmounted, type CSSProperties } from 'vue';

/**
 * 统计数据接口
 */
export interface Stat {
  label: string;
  value: string | number;
}

/**
 * 操作按钮接口
 */
export interface Action {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  onClick: () => void;
}

/**
 * Props 定义
 */
interface Props {
  /** 是否显示弹窗 */
  show: boolean;
  /** 弹窗标题 */
  title?: string;
  /** 副标题/描述 */
  subtitle?: string;
  /** 弹窗类型 */
  type?: 'info' | 'success' | 'warning' | 'error' | 'question' | 'result' | 'reward' | 'levelup' | 'gameover';
  /** 自定义图标 Emoji，不传则根据 type 自动匹配 */
  icon?: string;
  /** 弹窗尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 自定义宽度（优先级高于 size） */
  width?: string;
  /** 统计数据（用于游戏结算等场景） */
  stats?: Stat[];
  /** 操作按钮列表 */
  actions?: Action[];
  /** 按钮布局方式 */
  actionsLayout?: 'horizontal' | 'vertical';
  /** 点击遮罩是否关闭 */
  closeOnClickOverlay?: boolean;
  /** 是否显示关闭按钮 */
  closable?: boolean;
  /** 是否显示装饰元素 */
  showDecorations?: boolean;
  /** 是否显示底部按钮区域（使用默认按钮） */
  showFooter?: boolean;
  /** 是否显示取消按钮 */
  showCancel?: boolean;
  /** 是否显示确认按钮 */
  showConfirm?: boolean;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 确认按钮文本 */
  confirmText?: string;
  /** 确认按钮样式 */
  confirmVariant?: 'primary' | 'success' | 'danger' | 'warning';
  /** 内容区域最大高度 */
  contentMaxHeight?: string;
  /** 自定义样式 */
  style?: CSSProperties;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  size: 'md',
  stats: () => [],
  actions: () => [],
  actionsLayout: 'vertical',
  closeOnClickOverlay: false,
  closable: false,
  showDecorations: true,
  showFooter: false,
  showCancel: true,
  showConfirm: true,
  cancelText: '取消',
  confirmText: '确定',
  confirmVariant: 'primary',
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  confirm: [];
  cancel: [];
  close: [];
}>();

// 根据 type 自动推导图标，优先使用 icon prop
const resolvedIcon = computed(() => {
  if (props.icon !== undefined) return props.icon;
  
  const icons: Record<string, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    question: '🤔',
    result: '🎯',
    reward: '🎁',
    levelup: '⬆️',
    gameover: '😢',
  };
  
  return icons[props.type] ?? '';
});

// 判断是否有操作按钮
const hasActions = computed(() => {
  return props.actions && props.actions.length > 0;
});

// 判断是否显示按钮区域（只要有取消或确认按钮就显示）
const shouldShowActions = computed(() => {
  return hasActions.value || props.showFooter || props.showCancel || props.showConfirm;
});

// 计算尺寸对应的 max-width
const sizeMap: Record<string, string> = {
  sm: '380px',
  md: '500px',
  lg: '650px',
  xl: '800px',
};

const customStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {};
  if (props.width) {
    style.maxWidth = props.width;
  } else {
    style.maxWidth = sizeMap[props.size];
  }
  return style;
});

const contentMaxHeight = computed<CSSProperties>(() => {
  const style: CSSProperties = {};
  if (props.contentMaxHeight) {
    style.maxHeight = props.contentMaxHeight;
    style.overflowY = 'auto';
  }
  return style;
});

// 处理遮罩点击
function handleOverlayClick() {
  if (props.closeOnClickOverlay) {
    handleClose();
  }
}

// 关闭按钮处理
function handleClose() {
  emit('update:show', false);
  emit('close');
}

// 取消按钮处理
function handleCancel() {
  emit('cancel');
  emit('update:show', false);
}

// 确认按钮处理
function handleConfirm() {
  emit('confirm');
}

// ESC 键关闭逻辑
function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape' || event.keyCode === 27) {
    // 如果有取消按钮（通常是第一个），则触发取消
    if (props.actions && props.actions.length > 0) {
      props.actions[0].onClick();
    } else if (props.showCancel) {
      handleCancel();
    } else {
      handleClose();
    }
  }
}

// 监听 show 状态，管理 body 滚动和键盘事件
watch(() => props.show, (newValue) => {
  if (newValue) {
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscapeKey);
  } else {
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleEscapeKey);
  }
}, { immediate: true });

// 组件卸载时清理
onUnmounted(() => {
  document.body.style.overflow = '';
  document.removeEventListener('keydown', handleEscapeKey);
});
</script>

<style scoped lang="scss">
.kid-unified-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  animation: overlayFade 0.3s ease-out;
}

@keyframes overlayFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.kid-unified-modal {
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 
    0 12px 32px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow-x: hidden;
}

// 关闭按钮
.modal-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #dcdfe6;
  background: #ffffff;
  color: #909399;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  
  &:hover {
    background: #f5f7fa;
    border-color: #c0c4cc;
    color: #606266;
    transform: none;
  }
  
  &:active {
    background: #e4e7ed;
  }
}

// 装饰元素（简化版）
.modal-decorations {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
  overflow: hidden;
  height: 0;
  
  .decoration {
    display: none;
  }
}

// 图标包装器
.modal-icon-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  position: relative;
}

.modal-icon {
  font-size: 3rem;
  text-align: center;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  position: relative;
}

// 标题
.modal-title {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #303133;
  text-align: center;
  line-height: 1.4;
}

// 副标题
.modal-subtitle {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  text-align: center;
  color: #606266;
  font-weight: 400;
  line-height: 1.6;
}

// 内容区域
.modal-content {
  margin-bottom: 1.5rem;
  min-height: 20px;
}

// 统计数据
.modal-stats {
  display: flex;
  justify-content: space-around;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #909399;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #303133;
}

// 操作按钮
.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 1.5rem;
}

.modal-actions.layout-vertical {
  flex-direction: column;
}

.modal-actions.layout-horizontal {
  justify-content: center;
  flex-wrap: wrap;
}

.modal-action {
  flex: 1;
  min-width: 120px;
  padding: 0.75rem 1.25rem;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

.modal-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.modal-action:active {
  transform: translateY(0);
}

// 按钮变体
.modal-action.variant-primary {
  background: #409eff;
  border-color: #409eff;
  color: white;
}

.modal-action.variant-secondary {
  background: #f4f4f5;
  border-color: #d4d4d8;
  color: #606266;
}

.modal-action.variant-success {
  background: #67c23a;
  border-color: #67c23a;
  color: white;
}

.modal-action.variant-danger {
  background: #f56c6c;
  border-color: #f56c6c;
  color: white;
}

.modal-action.variant-warning {
  background: #e6a23c;
  border-color: #e6a23c;
  color: white;
}

// 类型特定样式
.kid-unified-modal.type-info .modal-title { 
  color: #409eff;
}

.kid-unified-modal.type-success .modal-title { 
  color: #67c23a;
}

.kid-unified-modal.type-warning .modal-title { 
  color: #e6a23c;
}

.kid-unified-modal.type-error .modal-title { 
  color: #f56c6c;
}

.kid-unified-modal.type-question .modal-title { 
  color: #8b5cf6;
}

.kid-unified-modal.type-result .modal-title { 
  color: #667eea;
}

.kid-unified-modal.type-reward .modal-title { 
  color: #fbbf24;
}

.kid-unified-modal.type-levelup .modal-title { 
  color: #10b981;
}

.kid-unified-modal.type-gameover .modal-title { 
  color: #6b7280;
}

// 遮罩过渡
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

// 弹窗过渡
.modal-enter-active {
  transition: all 0.3s ease;
}

.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

// 响应式设计
@media (max-width: 768px) {
  .kid-unified-modal {
    padding: 1.5rem;
    max-width: 100%;
    
    .modal-decorations .decoration {
      font-size: 18px;
    }
  }

  .modal-icon { 
    font-size: 3.5rem;
  }
  
  .modal-title { 
    font-size: 1.75rem; 
    margin-bottom: 0.5rem;
  }
  
  .modal-subtitle { 
    font-size: 0.95rem;
    padding: 10px 14px;
    margin-bottom: 1rem;
  }

  .modal-stats {
    flex-direction: column;
    gap: 1rem;
  }

  .stat-value { 
    font-size: 1.4rem; 
  }

  .modal-actions.layout-horizontal {
    flex-direction: column;
  }
  
  .modal-action {
    min-width: 100%;
    padding: 0.875rem 1.5rem;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .kid-unified-modal {
    border-width: 2px;
    padding: 1.25rem;
  }
  
  .modal-icon { 
    font-size: 3rem; 
    margin-bottom: 0.75rem;
  }
  
  .modal-title { 
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
  
  .modal-subtitle {
    font-size: 0.9rem;
    padding: 8px 12px;
    margin-bottom: 0.875rem;
  }
  
  .modal-action {
    padding: 0.75rem 1.25rem;
    font-size: 0.9rem;
  }
}

// 滚动条美化
.kid-unified-modal::-webkit-scrollbar {
  width: 8px;
}

.kid-unified-modal::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

.kid-unified-modal::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #ff69b4, #ffd700);
  border-radius: 10px;
}

.kid-unified-modal::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #ff1493, #ff69b4);
}
</style>
