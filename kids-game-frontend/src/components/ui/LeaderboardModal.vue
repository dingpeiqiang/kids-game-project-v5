<template>
  <div class="leaderboard-modal-mask" @click.self="$emit('close')">
    <div class="leaderboard-modal">
      <!-- 头部 -->
      <div class="modal-header">
        <h2 class="modal-title">🏆 排行榜</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <!-- 内容 -->
      <div class="modal-body">
        <LeaderboardPanel 
          :game-id="gameId"
          :current-user-id="currentUserId"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LeaderboardPanel from './LeaderboardPanel.vue';

interface Props {
  gameId: number;
  currentUserId?: number;
}

defineProps<Props>();
defineEmits<{
  close: [];
}>();
</script>

<style scoped>
.leaderboard-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.leaderboard-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.modal-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: white;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-body {
  height: calc(80vh - 100px);
  overflow-y: auto;
}
</style>
