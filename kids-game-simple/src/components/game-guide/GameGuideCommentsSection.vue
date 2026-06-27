<template>
  <div class="guide-comments">
    <div class="guide-comments__header">
      <span class="guide-comments__title">�� 游戏评论</span>
      <span v-if="stats.count > 0" class="guide-comments__stats">
        {{ stats.count }} 条 · 均分 {{ stats.avgScore }}
      </span>
    </div>

    <div v-if="userService.isLoggedIn" class="guide-comments__input">
      <div class="guide-comments__stars">
        <button
          v-for="n in 5"
          :key="n"
          type="button"
          class="star"
          :class="{ active: n <= rating }"
          @click="rating = n"
        >
          ★
        </button>
      </div>
      <textarea
        v-model="content"
        maxlength="200"
        placeholder="分享你的游戏感受..."
        rows="2"
      />
      <button type="button" class="guide-comments__submit" :disabled="submitting" @click="onSubmit">
        发布评论
      </button>
    </div>
    <p v-else class="guide-comments__login-hint">登录后可发表评论</p>

    <div class="guide-comments__list">
      <p v-if="loading" class="guide-comments__muted">加载中…</p>
      <p v-else-if="comments.length === 0" class="guide-comments__muted">暂无评论，快来发表第一条吧！</p>
      <div v-for="c in comments" :key="c.id" class="guide-comments__item">
        <div class="guide-comments__item-head">
          <span class="guide-comments__name">{{ c.nickname || c.username }}</span>
          <span class="guide-comments__rating">{{ '★'.repeat(c.score) }}</span>
        </div>
        <p class="guide-comments__body">{{ c.content }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { GameCommentData } from '@simple/services/apiClient'
import { fetchGameGuideComments, submitGameGuideComment } from '@simple/services/gameGuideComments'
import { userService } from '@simple/services/userService'

const props = defineProps<{
  gameCode: string
}>()

const loading = ref(true)
const submitting = ref(false)
const rating = ref(0)
const content = ref('')
const comments = ref<GameCommentData[]>([])
const stats = ref({ count: 0, avgScore: 0 })

async function load() {
  loading.value = true
  try {
    const data = await fetchGameGuideComments(props.gameCode)
    comments.value = data.comments
    stats.value = { count: data.count, avgScore: data.avgScore }
  } finally {
    loading.value = false
  }
}

async function onSubmit() {
  submitting.value = true
  try {
    const ok = await submitGameGuideComment(props.gameCode, content.value, rating.value)
    if (ok) {
      content.value = ''
      rating.value = 0
      await load()
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => void load())
watch(() => props.gameCode, () => void load())
</script>

<style scoped>
.guide-comments {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  text-align: left;
}
.guide-comments__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.guide-comments__title {
  font-weight: 700;
  font-size: 0.95rem;
}
.guide-comments__stats {
  font-size: 0.75rem;
  color: #888;
}
.guide-comments__stars {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}
.star {
  border: none;
  background: none;
  font-size: 1.25rem;
  color: #ddd;
  cursor: pointer;
  padding: 0;
}
.star.active {
  color: #f5a623;
}
.guide-comments__input textarea {
  width: 100%;
  box-sizing: border-box;
  border-radius: 8px;
  border: 1px solid #ddd;
  padding: 8px;
  font-size: 0.9rem;
  resize: vertical;
}
.guide-comments__submit {
  margin-top: 8px;
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 8px;
  background: #4d96ff;
  color: #fff;
  cursor: pointer;
}
.guide-comments__submit:disabled {
  opacity: 0.6;
}
.guide-comments__login-hint {
  font-size: 0.85rem;
  color: #888;
  margin: 0 0 12px;
}
.guide-comments__muted {
  font-size: 0.85rem;
  color: #999;
  margin: 8px 0;
}
.guide-comments__item {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}
.guide-comments__item-head {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: 4px;
}
.guide-comments__name {
  font-weight: 600;
}
.guide-comments__rating {
  color: #f5a623;
}
.guide-comments__body {
  margin: 0;
  font-size: 0.85rem;
  color: #444;
  line-height: 1.4;
}
</style>