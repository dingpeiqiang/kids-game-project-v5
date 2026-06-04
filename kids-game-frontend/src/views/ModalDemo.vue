<template>
  <div class="modal-demo-page">
    <div class="demo-header">
      <h1>🎨 全新儿童友好弹窗组件演示</h1>
      <p class="subtitle">健康 · 快乐 · 美感 · 柔和</p>
    </div>

    <div class="demo-section">
      <h2>🌈 按类型展示</h2>
      <div class="button-grid">
        <button class="demo-btn" @click="showModal('default')">
          <span class="btn-emoji">💡</span>
          <span class="btn-label">默认提示</span>
        </button>
        <button class="demo-btn btn-success" @click="showModal('success')">
          <span class="btn-emoji">🎉</span>
          <span class="btn-label">成功提示</span>
        </button>
        <button class="demo-btn btn-warning" @click="showModal('warning')">
          <span class="btn-emoji">⚠️</span>
          <span class="btn-label">警告提示</span>
        </button>
        <button class="demo-btn btn-danger" @click="showModal('danger')">
          <span class="btn-emoji">😱</span>
          <span class="btn-label">危险提示</span>
        </button>
        <button class="demo-btn btn-info" @click="showModal('info')">
          <span class="btn-emoji">ℹ️</span>
          <span class="btn-label">信息提示</span>
        </button>
        <button class="demo-btn btn-question" @click="showModal('question')">
          <span class="btn-emoji">❓</span>
          <span class="btn-label">询问提示</span>
        </button>
        <button class="demo-btn btn-celebrate" @click="showModal('celebrate')">
          <span class="btn-emoji">🎊</span>
          <span class="btn-label">庆祝提示</span>
        </button>
      </div>
    </div>

    <div class="demo-section">
      <h2>📐 按尺寸展示</h2>
      <div class="button-grid">
        <button class="demo-btn" @click="showSizeModal('sm')">
          <span class="btn-emoji">📱</span>
          <span class="btn-label">小尺寸</span>
        </button>
        <button class="demo-btn" @click="showSizeModal('md')">
          <span class="btn-emoji">💻</span>
          <span class="btn-label">中等尺寸</span>
        </button>
        <button class="demo-btn" @click="showSizeModal('lg')">
          <span class="btn-emoji">🖥️</span>
          <span class="btn-label">大尺寸</span>
        </button>
        <button class="demo-btn" @click="showSizeModal('xl')">
          <span class="btn-emoji">📺</span>
          <span class="btn-label">超大尺寸</span>
        </button>
      </div>
    </div>

    <div class="demo-section">
      <h2>🎯 特殊场景</h2>
      <div class="button-grid">
        <button class="demo-btn" @click="showConfirmModal">
          <span class="btn-emoji">✅</span>
          <span class="btn-label">确认对话框</span>
        </button>
        <button class="demo-btn" @click="showCustomIconModal">
          <span class="btn-emoji">🎮</span>
          <span class="btn-label">自定义图标</span>
        </button>
        <button class="demo-btn" @click="showRichContentModal">
          <span class="btn-emoji">📝</span>
          <span class="btn-label">富文本内容</span>
        </button>
        <button class="demo-btn" @click="showNoButtonModal">
          <span class="btn-emoji">👀</span>
          <span class="btn-label">无按钮弹窗</span>
        </button>
      </div>
    </div>

    <!-- 弹窗组件 -->
    <KidUnifiedModalV2
      v-model:show="modalVisible"
      :type="modalConfig.type"
      :title="modalConfig.title"
      :message="modalConfig.content"
      :closable="true"
      :confirm-text="modalConfig.confirmText"
      :cancel-text="modalConfig.cancelText"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    >
      <div v-if="modalConfig.richContent" class="rich-content">
        <h4>🎁 恭喜你完成了挑战！</h4>
        <p>你获得了：</p>
        <ul>
          <li>⭐ 金币 x 100</li>
          <li>🏆 经验值 x 50</li>
          <li>🎖️ 成就徽章 x 1</li>
        </ul>
        <p class="highlight">继续加油，解锁更多关卡！</p>
      </div>
    </KidUnifiedModalV2>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import KidUnifiedModalV2 from '@/components/ui/KidUnifiedModalV2.vue'

const modalVisible = ref(false)
const modalConfig = ref({
  title: '',
  content: '',
  type: 'info' as any,
  confirmText: '确定',
  cancelText: '取消',
  richContent: false
})

function showModal(type: string) {
  const configs: Record<string, any> = {
    default: {
      title: '温馨提示',
      content: '这是一个默认的提示弹窗，采用了简洁的设计风格，看起来很舒适呢！',
      type: 'info'
    },
    success: {
      title: '太棒了！',
      content: '恭喜你成功完成了任务！你的表现非常出色，继续保持哦！',
      type: 'success'
    },
    warning: {
      title: '注意啦！',
      content: '你的体力值快要用完了，建议休息一下，健康第一！',
      type: 'warning'
    },
    danger: {
      title: '哎呀！',
      content: '这个操作可能会删除你的数据，确定要继续吗？三思而后行哦！',
      type: 'error'
    },
    info: {
      title: '小贴士',
      content: '每天学习一点点，进步看得见！保持良好的学习习惯很重要哦~',
      type: 'info'
    },
    question: {
      title: '想问问你',
      content: '你今天学习了吗？记得每天都要进步一点点哦！',
      type: 'question'
    },
    celebrate: {
      title: '恭喜恭喜！',
      content: '🎉 太棒了！你已经连续学习7天了，获得"学习小达人"称号！',
      type: 'success'
    }
  }

  Object.assign(modalConfig.value, configs[type], {
    confirmText: '确定',
    cancelText: '取消',
    richContent: false
  })
  modalVisible.value = true
}

function showSizeModal(size: string) {
  const sizeNames: Record<string, string> = {
    sm: '小',
    md: '中等',
    lg: '大',
    xl: '超大'
  }
  
  modalConfig.value = {
    title: `${sizeNames[size]}尺寸弹窗`,
    content: `这是一个${sizeNames[size]}尺寸的弹窗示例。不同尺寸适用于不同的内容场景，选择合适的尺寸可以让界面更加美观。`,
    type: 'info',
    confirmText: '知道了',
    cancelText: '取消',
    richContent: false
  }
  modalVisible.value = true
}

function showConfirmModal() {
  modalConfig.value = {
    title: '确认退出',
    content: '你确定要退出游戏吗？退出后当前进度将不会保存哦！',
    type: 'question',
    confirmText: '确定退出',
    cancelText: '继续玩',
    richContent: false
  }
  modalVisible.value = true
}

function showCustomIconModal() {
  modalConfig.value = {
    title: '游戏时间',
    content: '你的游戏时间已经达到30分钟啦！建议休息一下，保护眼睛哦！',
    type: 'warning',
    confirmText: '继续玩',
    cancelText: '休息一下',
    richContent: false
  }
  modalVisible.value = true
}

function showRichContentModal() {
  modalConfig.value = {
    title: '奖励领取',
    content: '',
    type: 'success',
    confirmText: '太棒了！',
    cancelText: '',
    richContent: true
  }
  modalVisible.value = true
}

function showNoButtonModal() {
  modalConfig.value = {
    title: '自动关闭提示',
    content: '这个弹窗会自动关闭，请稍等...',
    type: 'info',
    confirmText: '',
    cancelText: '',
    richContent: false
  }
  modalVisible.value = true
  
  // 3秒后自动关闭
  setTimeout(() => {
    modalVisible.value = false
  }, 3000)
}

function handleConfirm() {
  console.log('确认按钮被点击')
  modalVisible.value = false
}

function handleCancel() {
  console.log('取消按钮被点击')
}
</script>

<style scoped lang="scss">
.modal-demo-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFF0F5 0%, #F0F8FF 50%, #FFF5EE 100%);
  padding: 40px 20px;
}

.demo-header {
  text-align: center;
  margin-bottom: 48px;
  animation: slideDown 0.6s ease-out;

  h1 {
    font-size: 36px;
    font-weight: 700;
    background: linear-gradient(135deg, #FF69B4, #FFB6C1, #87CEEB, #98FB98);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 16px 0;
    text-shadow: 0 2px 8px rgba(255, 105, 180, 0.2);
  }

  .subtitle {
    font-size: 18px;
    color: #888;
    margin: 0;
    letter-spacing: 2px;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.demo-section {
  max-width: 1200px;
  margin: 0 auto 48px;
  animation: slideUp 0.6s ease-out;

  h2 {
    font-size: 24px;
    color: #FF69B4;
    margin: 0 0 24px 0;
    text-align: center;
    position: relative;
    padding-bottom: 16px;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100px;
      height: 3px;
      background: linear-gradient(90deg, transparent, #FFB6C1, transparent);
      border-radius: 2px;
    }
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding: 0 20px;
}

.demo-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px 20px;
  border: none;
  border-radius: 24px;
  background: white;
  box-shadow: 
    0 4px 12px rgba(255, 182, 193, 0.2),
    0 2px 6px rgba(135, 206, 250, 0.1);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(135deg, #FFB6C1, #87CEEB, #98FB98);
    border-radius: 26px;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 
      0 8px 24px rgba(255, 182, 193, 0.3),
      0 4px 12px rgba(135, 206, 250, 0.2);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(-2px);
  }

  .btn-emoji {
    font-size: 32px;
    animation: bounce 2s ease-in-out infinite;
  }

  .btn-label {
    font-size: 16px;
    font-weight: 600;
    color: #666;
  }

  &.btn-success:hover {
    box-shadow: 0 8px 24px rgba(144, 238, 144, 0.4);
  }

  &.btn-warning:hover {
    box-shadow: 0 8px 24px rgba(255, 215, 0, 0.4);
  }

  &.btn-danger:hover {
    box-shadow: 0 8px 24px rgba(255, 107, 107, 0.4);
  }

  &.btn-info:hover {
    box-shadow: 0 8px 24px rgba(135, 206, 250, 0.4);
  }

  &.btn-question:hover {
    box-shadow: 0 8px 24px rgba(255, 182, 193, 0.4);
  }

  &.btn-celebrate:hover {
    box-shadow: 0 8px 24px rgba(221, 160, 221, 0.4);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.rich-content {
  text-align: left;
  width: 100%;

  h4 {
    font-size: 20px;
    color: #FF69B4;
    margin: 0 0 16px 0;
  }

  p {
    font-size: 16px;
    color: #666;
    margin: 12px 0;
    line-height: 1.6;

    &.highlight {
      color: #FF69B4;
      font-weight: 600;
      margin-top: 16px;
    }
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 16px 0;

    li {
      font-size: 16px;
      color: #666;
      padding: 8px 0;
      line-height: 1.6;
    }
  }
}

@media (max-width: 768px) {
  .demo-header h1 {
    font-size: 28px;
  }

  .demo-header .subtitle {
    font-size: 16px;
  }

  .demo-section h2 {
    font-size: 20px;
  }

  .button-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 0 12px;
  }

  .demo-btn {
    padding: 20px 16px;

    .btn-emoji {
      font-size: 28px;
    }

    .btn-label {
      font-size: 14px;
    }
  }
}

@media (max-width: 480px) {
  .modal-demo-page {
    padding: 24px 16px;
  }

  .demo-header {
    margin-bottom: 32px;

    h1 {
      font-size: 24px;
    }
  }

  .demo-section {
    margin-bottom: 32px;
  }

  .button-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
