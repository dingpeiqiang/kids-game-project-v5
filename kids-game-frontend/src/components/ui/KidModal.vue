<template>
  <KidUnifiedModalV2
    :show="show"
    :title="title"
    :type="type"
    :icon="icon"
    :size="size"
    :width="width"
    :closable="closable"
    :close-on-click-overlay="closeOnClickOverlay"
    :show-footer="showFooter"
    :show-cancel="showCancel"
    :show-confirm="showConfirm"
    :cancel-text="cancelText"
    :confirm-text="confirmText"
    :confirm-variant="confirmVariant"
    :show-decorations="showDecorations"
    :content-max-height="contentMaxHeight"
    @update:show="handleUpdateShow"
    @cancel="handleCancel"
    @confirm="handleConfirm"
    @close="handleClose"
  >
    <!-- 自定义 header slot -->
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <!-- 主体内容 -->
    <slot />

    <!-- 自定义 footer slot -->
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </KidUnifiedModalV2>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import KidUnifiedModalV2 from './KidUnifiedModalV2.vue';

interface Props {
  show: boolean;
  title?: string;
  /** 弹窗类型 */
  type?: 'info' | 'success' | 'warning' | 'error' | 'question' | 'result' | 'reward' | 'levelup' | 'gameover';
  /** 自定义图标 */
  icon?: string;
  /** 尺寸：sm/md/lg/xl */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 自定义宽度 */
  width?: string;
  /** 是否显示右上角关闭按钮 */
  closable?: boolean;
  /** 是否显示底部按钮区域 */
  showFooter?: boolean;
  /** 是否显示取消按钮 */
  showCancel?: boolean;
  /** 是否显示确认按钮 */
  showConfirm?: boolean;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'success' | 'danger' | 'warning';
  closeOnClickOverlay?: boolean;
  /** 是否显示装饰元素 */
  showDecorations?: boolean;
  /** 内容区域最大高度 */
  contentMaxHeight?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  size: 'md',
  closable: true,
  showFooter: false,
  showCancel: true,
  showConfirm: true,
  confirmText: '确定',
  cancelText: '取消',
  confirmVariant: 'primary',
  closeOnClickOverlay: true,
  showDecorations: true,
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  confirm: [];
  cancel: [];
  close: [];
}>();

function handleUpdateShow(val: boolean) {
  emit('update:show', val);
}

function handleConfirm() {
  emit('confirm');
}

function handleCancel() {
  emit('cancel');
  emit('update:show', false);
}

function handleClose() {
  emit('close');
}
</script>
