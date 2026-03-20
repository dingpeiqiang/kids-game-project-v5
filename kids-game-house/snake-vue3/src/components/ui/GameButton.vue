<template>
  <button
    @click="handleClick"
    :class="[
      'btn-bounce px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg',
      colorClass,
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl active:scale-95'
    ]"
    :disabled="disabled"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAudioStore } from '@/stores/audio'

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  disabled?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

const audioStore = useAudioStore()

const colorClass = computed(() => {
  switch (props.variant) {
    case 'primary': return 'bg-gradient-to-r from-green-400 to-green-500 text-white'
    case 'secondary': return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'
    case 'danger': return 'bg-gradient-to-r from-red-400 to-red-500 text-white'
    case 'success': return 'bg-gradient-to-r from-blue-400 to-blue-500 text-white'
    default: return 'bg-gradient-to-r from-green-400 to-green-500 text-white'
  }
})

const handleClick = () => {
  if (!props.disabled) {
    audioStore.playClickSound()
    emit('click')
  }
}
</script>
