<template>
  <section class="quick-access-section">
    <div class="quick-access-grid">
      <div @click="$emit('manage')" class="quick-access-card manage-card">
        <div class="quick-icon">🛡️</div>
        <h4 class="quick-title">管控中心</h4>
        <p class="quick-desc">管理儿童游戏</p>
      </div>
      <div @click="$emit('records')" class="quick-access-card record-card">
        <div class="quick-icon">📊</div>
        <h4 class="quick-title">游戏记录</h4>
        <p class="quick-desc">查看游玩记录</p>
      </div>
      <div @click="$emit('answerRecords')" class="quick-access-card answer-record-card">
        <div class="quick-icon">📝</div>
        <h4 class="quick-title">答题记录</h4>
        <p class="quick-desc">查看答题情况</p>
      </div>
      <div @click="$emit('settings')" class="quick-access-card settings-card">
        <div class="quick-icon">⚙️</div>
        <h4 class="quick-title">设置</h4>
        <p class="quick-desc">管控规则设置</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineEmits<{
  manage: [];
  records: [];
  answerRecords: [];
  settings: [];
}>();
</script>

<style scoped>
.quick-access-section {
  margin-bottom: 2rem;
}

.quick-access-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.quick-access-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.quick-access-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.quick-icon {
  font-size: 2.5rem;
}

.quick-title {
  margin: 0;
  font-size: 1rem;
  font-weight: bold;
  color: #333;
}

.quick-desc {
  margin: 0;
  font-size: 0.8rem;
  color: #666;
}

.manage-card:hover {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.record-card:hover {
  border-color: #667eea;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
}

.answer-record-card:hover {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.settings-card:hover {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
}

@media (max-width: 768px) {
  .quick-access-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
