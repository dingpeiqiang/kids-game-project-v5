<template>
  <div class="unified-modal-v2-demo">
    <h1>🎨 统一弹窗组件 V2 演示</h1>
    <p class="description">KidUnifiedModalV2 - 整合项目中所有弹窗功能的统一超级弹窗组件</p>

    <!-- 基础用法 -->
    <section class="demo-section">
      <h2>📦 基础用法（模板方式）</h2>
      <div class="demo-buttons">
        <button @click="showSimpleInfo" class="demo-btn">简单信息提示</button>
        <button @click="showSuccess" class="demo-btn success">成功提示</button>
        <button @click="showWarning" class="demo-btn warning">警告提示</button>
        <button @click="showError" class="demo-btn error">错误提示</button>
      </div>
    </section>

    <!-- 确认框 -->
    <section class="demo-section">
      <h2>✅ 确认框</h2>
      <div class="demo-buttons">
        <button @click="showQuestion" class="demo-btn">普通确认</button>
        <button @click="showDangerAction" class="demo-btn danger">危险操作确认</button>
        <button @click="showCustomConfirm" class="demo-btn">自定义确认框</button>
      </div>
    </section>

    <!-- 游戏相关 -->
    <section class="demo-section">
      <h2>🎮 游戏相关弹窗</h2>
      <div class="demo-buttons">
        <button @click="showGameResult" class="demo-btn">游戏结算</button>
        <button @click="showReward" class="demo-btn success">奖励弹窗</button>
        <button @click="showLevelUp" class="demo-btn warning">升级弹窗</button>
        <button @click="showGameOver" class="demo-btn error">游戏结束</button>
      </div>
    </section>

    <!-- 高级用法 -->
    <section class="demo-section">
      <h2>🚀 高级用法</h2>
      <div class="demo-buttons">
        <button @click="showCustomContent" class="demo-btn">自定义内容</button>
        <button @click="showLargeModal" class="demo-btn">超大尺寸</button>
        <button @click="showClosableModal" class="demo-btn">可关闭弹窗</button>
        <button @click="showMultipleActions" class="demo-btn">多个操作按钮</button>
      </div>
    </section>

    <!-- 编程式调用 -->
    <section class="demo-section">
      <h2>💻 编程式调用 (Composable)</h2>
      <div class="demo-buttons">
        <button @click="useComposableDemo" class="demo-btn">使用 modal 对象</button>
        <button @click="usePromiseDemo" class="demo-btn">Promise 方式</button>
      </div>
    </section>

    <!-- 演示弹窗 -->
    <KidUnifiedModalV2
      v-model:show="showModal"
      :title="modalConfig.title"
      :type="modalConfig.type"
      :icon="modalConfig.icon"
      :size="modalConfig.size"
      :stats="modalConfig.stats"
      :actions="modalConfig.actions"
      :closable="modalConfig.closable"
      :close-on-click-overlay="modalConfig.closeOnClickOverlay"
      @confirm="handleConfirm"
      @cancel="handleCancel"
      @close="handleClose"
    >
      <div v-if="modalConfig.customContent" v-html="modalConfig.customContent"></div>
    </KidUnifiedModalV2>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import KidUnifiedModalV2, { type Stat, type Action } from '@/components/ui/KidUnifiedModalV2.vue';
import { showUnifiedModalV2, modal } from '@/composables/useUnifiedModalV2';

const showModal = ref(false);
const modalConfig = ref<any>({
  title: '',
  type: 'info',
  icon: '',
  size: 'md',
  stats: [],
  actions: [],
  closable: false,
  closeOnClickOverlay: false,
  customContent: '',
  subtitle: '',
});

// ===== 基础用法 =====
function showSimpleInfo() {
  modalConfig.value = {
    title: '提示信息',
    type: 'info',
    icon: 'ℹ️',
    size: 'md',
    closable: true,
  };
  showModal.value = true;
}

function showSuccess() {
  modalConfig.value = {
    title: '操作成功',
    type: 'success',
    icon: '✅',
    size: 'md',
  };
  showModal.value = true;
}

function showWarning() {
  modalConfig.value = {
    title: '温馨提示',
    type: 'warning',
    icon: '⚠️',
    size: 'md',
  };
  showModal.value = true;
}

function showError() {
  modalConfig.value = {
    title: '出错了',
    type: 'error',
    icon: '❌',
    size: 'md',
  };
  showModal.value = true;
}

// ===== 确认框 =====
function showQuestion() {
  modalConfig.value = {
    title: '确认操作',
    type: 'question',
    icon: '🤔',
    size: 'md',
    closable: false,
  };
  showModal.value = true;
}

function showDangerAction() {
  modalConfig.value = {
    title: '危险操作',
    type: 'warning',
    icon: '⚠️',
    size: 'md',
    closable: false,
  };
  showModal.value = true;
}

function showCustomConfirm() {
  modalConfig.value = {
    title: '自定义确认',
    type: 'question',
    size: 'md',
    closable: true,
  };
  showModal.value = true;
}

// ===== 游戏相关 =====
function showGameResult() {
  const stats: Stat[] = [
    { label: '得分', value: 1500 },
    { label: '连击', value: 25 },
    { label: '时间', value: '2:30' },
  ];
  
  const actions: Action[] = [
    { text: '再来一局', variant: 'primary', onClick: () => console.log('Restart') },
    { text: '返回首页', variant: 'secondary', onClick: () => console.log('Home') },
  ];
  
  modalConfig.value = {
    title: '游戏结束',
    type: 'result',
    icon: '🎯',
    size: 'lg',
    stats,
    actions,
  };
  showModal.value = true;
}

function showReward() {
  modalConfig.value = {
    title: '恭喜获得奖励',
    type: 'reward',
    icon: '🎁',
    size: 'md',
    subtitle: '获得 100 趣乐币！',
  };
  showModal.value = true;
}

function showLevelUp() {
  modalConfig.value = {
    title: '恭喜升级',
    type: 'levelup',
    icon: '⬆️',
    size: 'md',
    subtitle: '当前等级：Lv.5',
  };
  showModal.value = true;
}

function showGameOver() {
  const stats: Stat[] = [
    { label: '最终得分', value: 850 },
    { label: '击败敌人', value: 12 },
    { label: '存活时间', value: '5:20' },
  ];
  
  modalConfig.value = {
    title: '游戏结束',
    type: 'gameover',
    icon: '😢',
    size: 'lg',
    stats,
  };
  showModal.value = true;
}

// ===== 高级用法 =====
function showCustomContent() {
  modalConfig.value = {
    title: '自定义内容',
    type: 'info',
    size: 'md',
    closable: true,
    customContent: `
      <div style="padding: 20px; text-align: center;">
        <p style="font-size: 16px; margin-bottom: 16px;">这是一个自定义内容的弹窗</p>
        <p style="color: #666;">你可以在这里放置任何 HTML 内容</p>
        <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
          <span style="font-size: 32px;">🎨</span>
          <span style="font-size: 32px;">🎉</span>
          <span style="font-size: 32px;">✨</span>
        </div>
      </div>
    `,
  };
  showModal.value = true;
}

function showLargeModal() {
  modalConfig.value = {
    title: '超大尺寸弹窗',
    type: 'info',
    size: 'xl',
    closable: true,
    customContent: `
      <div style="padding: 20px;">
        <p>这是一个超大尺寸的弹窗，可以容纳更多内容。</p>
        <p>适用于需要展示大量信息的场景。</p>
        <ul style="text-align: left; margin-top: 16px;">
          <li>特性 1: 支持各种尺寸</li>
          <li>特性 2: 丰富的动画效果</li>
          <li>特性 3: 完全可定制</li>
          <li>特性 4: 响应式设计</li>
        </ul>
      </div>
    `,
  };
  showModal.value = true;
}

function showClosableModal() {
  modalConfig.value = {
    title: '可关闭的弹窗',
    type: 'info',
    size: 'md',
    closable: true,
    closeOnClickOverlay: true,
    customContent: '<div style="padding: 20px; text-align: center;">点击右上角 × 或点击遮罩关闭</div>',
  };
  showModal.value = true;
}

function showMultipleActions() {
  const actions: Action[] = [
    { text: '取消', variant: 'secondary', onClick: () => console.log('Cancel') },
    { text: '稍后', variant: 'warning', onClick: () => console.log('Later') },
    { text: '确定', variant: 'primary', onClick: () => console.log('Confirm') },
  ];
  
  modalConfig.value = {
    title: '多个操作按钮',
    type: 'question',
    size: 'md',
    actions,
    actionsLayout: 'horizontal',
  };
  showModal.value = true;
}

// ===== 编程式调用 =====
async function useComposableDemo() {
  await modal.success('操作成功！');
}

async function usePromiseDemo() {
  const confirmed = await modal.question('确定要执行这个操作吗？');
  if (confirmed) {
    alert('用户确认了操作');
  } else {
    alert('用户取消了操作');
  }
}

// ===== 事件处理 =====
function handleConfirm() {
  console.log('确认按钮被点击');
  showModal.value = false;
}

function handleCancel() {
  console.log('取消按钮被点击');
  showModal.value = false;
}

function handleClose() {
  console.log('弹窗被关闭');
  showModal.value = false;
}
</script>

<style scoped lang="scss">
.unified-modal-v2-demo {
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #ff69b4 0%, #ffd700 25%, #00bfff 50%, #ff1493 75%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .description {
    text-align: center;
    color: #666;
    font-size: 1.1rem;
    margin-bottom: 3rem;
  }
  
  .demo-section {
    margin-bottom: 3rem;
    
    h2 {
      font-size: 1.8rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 1.5rem;
      text-align: center;
    }
  }
  
  .demo-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
  }
  
  .demo-btn {
    padding: 1rem 2rem;
    border: none;
    border-radius: 16px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
    color: #333;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    
    &:hover {
      transform: translateY(-4px) scale(1.05);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }
    
    &.success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }
    
    &.warning {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }
    
    &.error {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }
    
    &.danger {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
      color: white;
    }
  }
}
</style>
