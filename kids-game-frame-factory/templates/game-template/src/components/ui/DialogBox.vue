<template>
  <div class="dialog-box" v-if="visible">
    <div class="dialog-content">
      <h3 class="character-name">{{ characterName }}</h3>
      <p class="message-text">{{ currentMessage }}</p>
      <button @click="nextMessage" class="next-btn">Next</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  messages: string[]
  characterName: string
}>()

const emit = defineEmits(['done'])

const visible = ref(false)
const currentIndex = ref(0)
const currentMessage = ref('')

watch(() => props.messages, (newMessages) => {
  if (newMessages && newMessages.length > 0) {
    visible.value = true
    currentIndex.value = 0
    currentMessage.value = newMessages[0]
  } else {
    visible.value = false
  }
}, { immediate: true })

const nextMessage = () => {
  if (currentIndex.value < props.messages.length - 1) {
    currentIndex.value++
    currentMessage.value = props.messages[currentIndex.value]
  } else {
    visible.value = false
    emit('done')
  }
}
</script>

<style scoped>
.dialog-box {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-width: 600px;
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid #fff;
  padding: 20px;
  color: white;
  font-family: 'Press Start 2P', monospace;
  z-index: 100;
}

.character-name {
  margin-top: 0;
  color: #ffd700;
}

.next-btn {
  margin-top: 10px;
  padding: 5px 10px;
  background: #4ade80;
  border: none;
  cursor: pointer;
  font-family: inherit;
}
</style>
