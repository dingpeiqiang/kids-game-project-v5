<template>
  <div class="banner-slider">
    <div class="banner-container" :style="{ transform: `translateX(-${currentIndex * 100}%)` }">
      <div
        v-for="banner in banners"
        :key="banner.id"
        class="banner-slide"
        :style="{ backgroundColor: banner.backgroundColor }"
        :data-game-id="banner.gameId"
        :data-route="banner.route"
      >
        <div class="banner-content">
          <h2 class="banner-title">{{ banner.title }}</h2>
          <p class="banner-description">{{ banner.description }}</p>
          <button class="banner-button" @click="handleBannerClick(banner)">
            <span class="button-icon">{{ banner.buttonIcon }}</span>
            <span class="button-text">{{ banner.buttonText }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 轮播指示器 -->
    <div class="banner-indicators">
      <div
        v-for="(banner, index) in banners"
        :key="index"
        class="indicator"
        :class="{ active: index === currentIndex }"
        @click="goToSlide(index)"
      ></div>
    </div>

    <!-- 左右箭头 -->
    <button class="banner-arrow banner-arrow-prev" @click="prevSlide">
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
      </svg>
    </button>
    <button class="banner-arrow banner-arrow-next" @click="nextSlide">
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { BannerConfig } from '@/core/config/home.types';

interface Props {
  banners: BannerConfig[];
  autoplay?: boolean;
  interval?: number;
}

const props = withDefaults(defineProps<Props>(), {
  autoplay: true,
  interval: 5000,
});

const emit = defineEmits<{
  click: [banner: BannerConfig];
}>();

const currentIndex = ref(0);
let autoplayTimer: number | null = null;

function startAutoplay(): void {
  if (!props.autoplay || props.banners.length <= 1) return;

  stopAutoplay();
  autoplayTimer = window.setInterval(() => {
    nextSlide();
  }, props.interval);
}

function stopAutoplay(): void {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
}

function nextSlide(): void {
  currentIndex.value = (currentIndex.value + 1) % props.banners.length;
}

function prevSlide(): void {
  currentIndex.value = (currentIndex.value - 1 + props.banners.length) % props.banners.length;
}

function goToSlide(index: number): void {
  currentIndex.value = index;
}

function handleBannerClick(banner: BannerConfig): void {
  emit('click', banner);
}

onMounted(() => {
  startAutoplay();
});

onBeforeUnmount(() => {
  stopAutoplay();
});
</script>

<style scoped>
.banner-slider {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 20px;
  margin-bottom: 30px;
}

.banner-container {
  display: flex;
  transition: transform 0.5s ease;
}

.banner-slide {
  min-width: 100%;
  padding: 40px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-content {
  text-align: center;
}

.banner-title {
  font-size: 2rem;
  font-weight: bold;
  margin: 0 0 10px;
}

.banner-description {
  font-size: 1.1rem;
  margin: 0 0 20px;
  opacity: 0.95;
}

.banner-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 30px;
  background: white;
  color: #333;
  border: none;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.banner-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.button-icon {
  font-size: 1.2rem;
}

.banner-indicators {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

.indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
}

.indicator:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: scale(1.2);
}

.indicator.active {
  background: white;
  transform: scale(1.3);
}

.banner-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
  color: white;
}

.banner-arrow:hover {
  background: rgba(255, 255, 255, 0.6);
  transform: translateY(-50%) scale(1.1);
}

.banner-arrow-prev {
  left: 20px;
}

.banner-arrow-next {
  right: 20px;
}

@media (max-width: 768px) {
  .banner-slide {
    padding: 30px 20px;
  }

  .banner-title {
    font-size: 1.5rem;
  }

  .banner-description {
    font-size: 0.9rem;
  }

  .banner-button {
    padding: 10px 20px;
    font-size: 0.9rem;
  }

  .banner-arrow {
    width: 32px;
    height: 32px;
  }
}
</style>
