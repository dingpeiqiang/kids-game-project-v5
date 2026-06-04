<template>
  <button
    class="kid-button"
    :class="[`size-${size}`, `variant-${variant}`, { disabled, loading }]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="loading-icon">⏳</span>
    <span v-if="icon" class="icon">{{ icon }}</span>
    <span class="text">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'base' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
}

defineProps<Props>();

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

function handleClick(event: MouseEvent) {
  emit('click', event);
}
</script>

<style scoped>
.kid-button {
  border: none;
  border-radius: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: bold;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.kid-button:hover:not(.disabled):not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.kid-button:active:not(.disabled):not(:disabled) {
  transform: translateY(-1px);
}

/* Variants */
.variant-primary {
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8E53 100%);
  color: white;
}

.variant-secondary {
  background: linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%);
  color: white;
}

.variant-success {
  background: linear-gradient(135deg, #4ECDC4 0%, #95E1D3 100%);
  color: white;
}

.variant-danger {
  background: linear-gradient(135deg, #FF6B9D 0%, #C44569 100%);
  color: white;
}

/* Sizes */
.size-sm {
  padding: 10px 20px;
  font-size: 0.9rem;
}

.size-base {
  padding: 12px 24px;
  font-size: 1rem;
}

.size-lg {
  padding: 15px 30px;
  font-size: 1.1rem;
}

.size-xl {
  padding: 18px 36px;
  font-size: 1.25rem;
}

/* Disabled state */
.kid-button.disabled,
.kid-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading state */
.kid-button.loading {
  pointer-events: none;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.icon {
  font-size: 1.2em;
}

.text {
  display: inline-block;
}
</style>
