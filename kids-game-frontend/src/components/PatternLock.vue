<template>
  <div class="pattern-lock-container">
    <div class="pattern-lock-header">
      <h2 class="pattern-title">{{ title }}</h2>
      <p class="pattern-subtitle">{{ subtitle }}</p>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-message">
      <span class="error-icon">❌</span>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- 图案绘制区域 -->
    <div 
      class="pattern-grid-container"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @mousedown="handleMouseDown"
    >
      <svg 
        class="pattern-svg"
        :viewBox="`0 0 ${gridSize} ${gridSize}`"
        :width="gridSize"
        :height="gridSize"
      >
        <!-- 连接线 -->
        <polyline
          v-if="currentPattern.length > 1"
          :points="linePoints"
          class="pattern-line"
          fill="none"
          stroke="url(#lineGradient)"
          stroke-width="6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        
        <!-- 渐变定义 -->
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#667eea" />
            <stop offset="100%" stop-color="#764ba2" />
          </linearGradient>
          <radialGradient id="pointActiveGradient">
            <stop offset="0%" stop-color="#764ba2" />
            <stop offset="100%" stop-color="#667eea" />
          </radialGradient>
        </defs>

        <!-- 图案点 -->
        <g v-for="(row, rowIndex) in 3" :key="rowIndex">
          <g v-for="(col, colIndex) in 3" :key="`${rowIndex}-${colIndex}`">
            <!-- 外圈 -->
            <circle
              :cx="getPointX(colIndex)"
              :cy="getPointY(rowIndex)"
              :r="outerRadius"
              :class="[
                'pattern-point-outer',
                { 'pattern-point-active': isPointActive(rowIndex, colIndex) }
              ]"
            />
            <!-- 内圈 -->
            <circle
              :cx="getPointX(colIndex)"
              :cy="getPointY(rowIndex)"
              :r="innerRadius"
              :class="[
                'pattern-point-inner',
                { 'pattern-point-active': isPointActive(rowIndex, colIndex) }
              ]"
            />
          </g>
        </g>
      </svg>

      <!-- 当前选中的点提示 -->
      <div v-if="currentPattern.length > 0" class="pattern-hint">
        已连接 {{ currentPattern.length }} 个点
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="pattern-actions">
      <button 
        v-if="showReset && currentPattern.length > 0" 
        class="reset-btn"
        @click="resetPattern"
      >
        🔄 重置
      </button>
    </div>

    <!-- 提示信息 -->
    <div class="pattern-tips">
      <p>💡 至少连接4个点</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { PatternPoint } from '@/utils/pattern-lock.util';
import { patternToString, isValidPattern } from '@/utils/pattern-lock.util';

// Props
interface Props {
  title?: string;
  subtitle?: string;
  confirmMode?: boolean; // 是否为确认模式（用于设置图案时确认）
  showReset?: boolean;
  disableSubmit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '图案解锁',
  subtitle: '请绘制解锁图案',
  confirmMode: false,
  showReset: true,
  disableSubmit: false,
});

// Emits
const emit = defineEmits<{
  (e: 'complete', pattern: string): void;
  (e: 'valid', valid: boolean): void;
  (e: 'error', message: string): void;
}>();

// 状态
const gridSize = ref(280); // 网格大小
const outerRadius = 24; // 外圈半径
const innerRadius = 12; // 内圈半径
const padding = 40; // 内边距
const currentPattern = ref<PatternPoint[]>([]);
const isDrawing = ref(false);
const errorMessage = ref('');

// 计算属性
const cellSize = computed(() => {
  return (gridSize.value - padding * 2) / 2;
});

const linePoints = computed(() => {
  return currentPattern.value
    .map(p => `${getPointX(p.col)},${getPointY(p.row)}`)
    .join(' ');
});

// 方法
function getPointX(col: number): number {
  return padding + col * cellSize.value;
}

function getPointY(row: number): number {
  return padding + row * cellSize.value;
}

function isPointActive(row: number, col: number): boolean {
  return currentPattern.value.some(p => p.row === row && p.col === col);
}

function getPointAtPosition(x: number, y: number): PatternPoint | null {
  const cell = cellSize.value;
  const pad = padding.value;
  
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const pointX = pad + col * cell;
      const pointY = pad + row * cell;
      const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));
      
      if (distance <= outerRadius + 10) {
        return { row, col };
      }
    }
  }
  
  return null;
}

function addPoint(point: PatternPoint): boolean {
  // 检查是否已添加
  if (isPointActive(point.row, point.col)) {
    return false;
  }
  
  currentPattern.value.push(point);
  checkPatternValidity();
  return true;
}

function checkPatternValidity(): void {
  const valid = isValidPattern(currentPattern.value);
  emit('valid', valid);
  
  if (valid) {
    errorMessage.value = '';
  }
}

function resetPattern(): void {
  currentPattern.value = [];
  errorMessage.value = '';
  emit('valid', false);
}

function submitPattern(): void {
  if (!isValidPattern(currentPattern.value)) {
    errorMessage.value = '请至少连接4个不同的点';
    emit('error', '请至少连接4个不同的点');
    return;
  }
  
  const patternStr = patternToString(currentPattern.value);
  emit('complete', patternStr);
}

// 触摸事件处理
function handleTouchStart(event: TouchEvent): void {
  event.preventDefault();
  isDrawing.value = true;
  processTouch(event.touches[0]);
}

function handleTouchMove(event: TouchEvent): void {
  if (!isDrawing.value) return;
  event.preventDefault();
  processTouch(event.touches[0]);
}

function handleTouchEnd(): void {
  if (!isDrawing.value) return;
  isDrawing.value = false;
  
  if (currentPattern.value.length > 0) {
    submitPattern();
  }
}

function processTouch(touch: Touch): void {
  const svg = document.querySelector('.pattern-svg');
  if (!svg) return;
  
  const rect = svg.getBoundingClientRect();
  const scaleX = gridSize.value / rect.width;
  const scaleY = gridSize.value / rect.height;
  
  const x = (touch.clientX - rect.left) * scaleX;
  const y = (touch.clientY - rect.top) * scaleY;
  
  const point = getPointAtPosition(x, y);
  if (point) {
    addPoint(point);
  }
}

// 鼠标事件处理
function handleMouseDown(event: MouseEvent): void {
  isDrawing.value = true;
  processMouse(event);
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDrawing.value) return;
    processMouse(e);
  };
  
  const handleMouseUp = () => {
    isDrawing.value = false;
    if (currentPattern.value.length > 0) {
      submitPattern();
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

function processMouse(event: MouseEvent): void {
  const svg = document.querySelector('.pattern-svg');
  if (!svg) return;
  
  const rect = svg.getBoundingClientRect();
  const scaleX = gridSize.value / rect.width;
  const scaleY = gridSize.value / rect.height;
  
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  
  const point = getPointAtPosition(x, y);
  if (point) {
    addPoint(point);
  }
}

// 监听模式变化时重置
watch(() => props.confirmMode, () => {
  resetPattern();
});
</script>

<style scoped>
.pattern-lock-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
}

.pattern-lock-header {
  text-align: center;
  margin-bottom: 2rem;
}

.pattern-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.pattern-subtitle {
  font-size: 1rem;
  color: #666;
  margin: 0;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  animation: shake 0.5s ease-in-out;
}

.error-icon {
  font-size: 1.2rem;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.pattern-grid-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
}

.pattern-svg {
  max-width: 100%;
  height: auto;
}

.pattern-point-outer {
  fill: none;
  stroke: #e5e7eb;
  stroke-width: 2;
  transition: all 0.2s ease;
}

.pattern-point-outer.pattern-point-active {
  stroke: #667eea;
  stroke-width: 3;
}

.pattern-point-inner {
  fill: #f3f4f6;
  stroke: #d1d5db;
  stroke-width: 2;
  transition: all 0.2s ease;
}

.pattern-point-inner.pattern-point-active {
  fill: url(#pointActiveGradient);
  stroke: #764ba2;
  stroke-width: 2;
  animation: pointPop 0.3s ease-out;
}

@keyframes pointPop {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.pattern-line {
  animation: lineDraw 0.1s ease-out;
}

@keyframes lineDraw {
  from { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}

.pattern-hint {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #667eea;
  font-weight: 500;
}

.pattern-actions {
  margin-top: 1.5rem;
}

.reset-btn {
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  color: #666;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.reset-btn:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.pattern-tips {
  margin-top: 1rem;
  text-align: center;
}

.pattern-tips p {
  font-size: 0.85rem;
  color: #9ca3af;
  margin: 0;
}

/* 响应式 */
@media (max-width: 480px) {
  .pattern-lock-container {
    padding: 1.5rem;
    border-radius: 20px;
  }
  
  .pattern-title {
    font-size: 1.5rem;
  }
}
</style>