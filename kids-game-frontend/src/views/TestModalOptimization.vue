<template>
  <div class="test-page">
    <h1>弹窗样式优化测试</h1>
    <p>测试优化后的弹窗组件是否与 Element Plus 风格协调</p>
    
    <div class="test-section">
      <h2>1. 基本弹窗测试</h2>
      <div class="button-group">
        <button @click="showInfoModal" class="test-btn">信息弹窗</button>
        <button @click="showSuccessModal" class="test-btn success">成功弹窗</button>
        <button @click="showWarningModal" class="test-btn warning">警告弹窗</button>
        <button @click="showErrorModal" class="test-btn error">错误弹窗</button>
      </div>
    </div>
    
    <div class="test-section">
      <h2>2. 游戏管理相关弹窗</h2>
      <div class="button-group">
        <button @click="showGameFormModal" class="test-btn">游戏表单弹窗</button>
        <button @click="showStatsModal" class="test-btn">统计信息弹窗</button>
        <button @click="showConfirmModal" class="test-btn warning">确认删除弹窗</button>
      </div>
    </div>
    
    <div class="test-section">
      <h2>3. 与 Element Plus 对比</h2>
      <div class="button-group">
        <button @click="showElementDialog" class="test-btn element">Element Plus 弹窗</button>
        <button @click="showCustomDialog" class="test-btn custom">优化后弹窗</button>
      </div>
    </div>
    
    <!-- 优化后的弹窗 -->
    <KidModal
      v-model:show="showStats"
      title="游戏统计数据"
      size="md"
      :show-footer="false"
    >
      <div class="stats-content">
        <p>这是一个模拟游戏管理中的统计信息弹窗</p>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">1,234</div>
            <div class="stat-label">总游玩次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">89</div>
            <div class="stat-label">今日游玩</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">85%</div>
            <div class="stat-label">平均完成度</div>
          </div>
        </div>
      </div>
    </KidModal>
    
    <!-- Element Plus 弹窗 -->
    <el-dialog v-model="showElement" title="Element Plus 弹窗" width="500px">
      <p>这是标准的 Element Plus 弹窗</p>
      <p>用于对比样式协调性</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showElement = false">取消</el-button>
          <el-button type="primary" @click="showElement = false">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElDialog, ElButton } from 'element-plus'
import { dialog } from '@/composables/useDialog'
import KidModal from '@/components/ui/KidModal.vue'

const showStats = ref(false)
const showElement = ref(false)

// 基本弹窗测试
const showInfoModal = () => {
  dialog.info('这是一个信息提示弹窗，用于展示一般信息')
}

const showSuccessModal = () => {
  dialog.success('操作成功！游戏数据已保存')
}

const showWarningModal = () => {
  dialog.warning('请注意：这个操作可能会影响游戏平衡')
}

const showErrorModal = () => {
  dialog.error('操作失败：无法连接到游戏服务器')
}

// 游戏管理相关弹窗
const showGameFormModal = () => {
  dialog.info('模拟游戏表单弹窗 - 用于创建/编辑游戏')
}

const showStatsModal = () => {
  showStats.value = true
}

const showConfirmModal = async () => {
  const confirmed = await dialog.danger('确定要删除这个游戏吗？此操作不可恢复')
  if (confirmed) {
    dialog.success('游戏已删除')
  }
}

// 对比测试
const showElementDialog = () => {
  showElement.value = true
}

const showCustomDialog = () => {
  dialog.info('这是优化后的自定义弹窗，应该与 Element Plus 风格协调')
}
</script>

<style scoped>
.test-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background: #f8f9fa;
  min-height: 100vh;
}

h1 {
  color: #303133;
  margin-bottom: 8px;
}

p {
  color: #606266;
  margin-bottom: 32px;
}

.test-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

h2 {
  color: #303133;
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 18px;
}

.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.test-btn {
  padding: 10px 20px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: white;
  color: #606266;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.test-btn:hover {
  border-color: #c0c4cc;
  background: #f5f7fa;
}

.test-btn.success {
  border-color: #c2e7b0;
  background: #f0f9eb;
  color: #67c23a;
}

.test-btn.warning {
  border-color: #f3d19e;
  background: #fdf6ec;
  color: #e6a23c;
}

.test-btn.error {
  border-color: #fab6b6;
  background: #fef0f0;
  color: #f56c6c;
}

.test-btn.element {
  border-color: #409eff;
  background: #ecf5ff;
  color: #409eff;
}

.test-btn.custom {
  border-color: #8b5cf6;
  background: #f3f0ff;
  color: #8b5cf6;
}

.stats-content {
  text-align: center;
}

.stats-grid {
  display: flex;
  justify-content: space-around;
  margin-top: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}
</style>