<template>
  <div class="game-play-result">
    <div class="game-play-result__card">
      <div class="game-play-result__icon" :class="tierClass">{{ resultIcon }}</div>
      <p class="game-play-result__title">{{ displayTitle }}</p>
      <p class="game-play-result__score">{{ score }}</p>
      <p class="game-play-result__best">历史最高: {{ prevBest }}</p>

      <div v-if="statsLines.length" class="game-play-result__stats">
        <div v-for="(line, i) in statsLines" :key="i" class="stat-item">{{ line }}</div>
      </div>

      <div v-if="rankDisplay" class="game-play-result__rank">
        <span class="rank-badge" :style="{ color: rankColor }">{{ rankDisplay.badge }}</span>
        <span class="rank-text">{{ rankLine }}</span>
      </div>

      <div v-if="buffTags.length" class="game-play-result__buffs">
        <span v-for="(tag, i) in buffTags" :key="i" class="buff-tag">{{ tag }}</span>
      </div>

      <p v-if="syncedHint" class="game-play-result__synced">{{ syncedHint }}</p>

      <div class="game-play-result__actions">
        <button type="button" class="game-play-result__btn" @click="emit('back')">
          {{ labels.back }}
        </button>
        <button type="button" class="game-play-result__btn game-play-result__btn--primary" @click="emit('replay')">
          {{ labels.replay }}
        </button>
      </div>
      <button type="button" class="game-play-result__reset-guide" @click="emit('reset-guide')">
        重看游戏引导
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { GAME_PLAY_SHELL } from '@simple/constants/gamePlayShell';
import { rankBadgeColor } from '@simple/app/rankDisplay';
import type { GameResultStats } from '@simple/types/gameResult';

const props = defineProps<{
  score: number;
  victory?: boolean;
  prevBest?: number;
  stats?: GameResultStats | null;
  rankBadge?: string;
  rankText?: string;
  serverRank?: number | null;
  synced?: boolean;
  crits?: number;
  combo?: number;
}>();

const emit = defineEmits<{
  back: [];
  replay: [];
  'reset-guide': [];
}>();

const labels = GAME_PLAY_SHELL.labels;

const prevBest = computed(() => props.prevBest ?? 0);

const isNewBest = computed(
  () => props.score > prevBest.value && props.score > 0,
);

const tierClass = computed(() => {
  if (props.victory) return 'tier-best';
  if (isNewBest.value) return 'tier-best';
  if (props.score >= (prevBest.value || 0) * 0.6 && prevBest.value > 0) return 'tier-good';
  return 'tier-basic';
});

const resultIcon = computed(() => {
  if (props.victory) return '\u{1F389}';
  if (isNewBest.value) return '\u{1F3C6}';
  if (tierClass.value === 'tier-good') return '\u2B50';
  return '\u{1F3AE}';
});

const displayTitle = computed(() => {
  if (props.victory) return '恭喜通关!';
  if (isNewBest.value) return '新纪录!';
  if (tierClass.value === 'tier-good') return '很棒!';
  return labels.resultTitle;
});

const MEDALS = ['\u{1F947}', '\u{1F948}', '\u{1F949}'] as const;

const statsLines = computed(() => {
  const s = props.stats;
  if (!s) return [];
  const lines: string[] = [];
  if (s.maxCombo && s.maxCombo > 0) lines.push(`\u{1F525} 最大连击: ${s.maxCombo}`);
  if (s.totalKills && s.totalKills > 0) lines.push(`\u{1F3AF} 总击杀: ${s.totalKills}`);
  if (s.gameTime && s.gameTime > 0) {
    const m = Math.floor(s.gameTime / 60);
    const sec = s.gameTime % 60;
    lines.push(`\u23F1\uFE0F 游戏时长: ${m}:${String(sec).padStart(2, '0')}`);
  }
  if (s.level && s.level > 0) lines.push(`\u{1F4CA} 等级: ${s.level}`);
  if (s.won) lines.push('\u{1F389} 通关成功!');
  return lines;
});

const rankDisplay = computed(() => {
  if (props.serverRank != null && props.serverRank > 0) {
    const r = props.serverRank;
    const badge = r <= 3 ? MEDALS[r - 1] : `#${r}`;
    return { badge, text: `当前排名 ${r} 位` };
  }
  if (props.rankBadge && props.rankText) {
    return { badge: props.rankBadge, text: props.rankText };
  }
  return null;
});

const rankLine = computed(() => rankDisplay.value?.text ?? '');
const rankColor = computed(() =>
  props.serverRank != null ? rankBadgeColor(props.serverRank) : '#5b9bd5',
);

const buffTags = computed(() => {
  const tags: string[] = [];
  if (props.crits && props.crits > 0) tags.push(`\u26A1暴击 x${props.crits}`);
  if (props.combo && props.combo >= 10) tags.push(`\u{1F525}连击 x${props.combo}`);
  return tags;
});

const syncedHint = computed(() => (props.synced ? '本局奖励已同步' : ''));
</script>

<style scoped>
.game-play-result {
  position: absolute;
  inset: 0;
  z-index: 160;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  padding: 16px;
}

.game-play-result__card {
  background: #fff;
  color: #0f172a;
  padding: 24px 32px;
  border-radius: 16px;
  text-align: center;
  min-width: 260px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
}

.game-play-result__icon {
  font-size: 2.5rem;
  margin-bottom: 4px;
}

.game-play-result__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.game-play-result__score {
  margin: 12px 0 4px;
  font-size: 2.25rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: #4d96ff;
}

.game-play-result__best {
  margin: 0 0 12px;
  font-size: 0.85rem;
  color: #64748b;
}

.game-play-result__stats {
  margin: 12px 0;
  padding: 12px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  text-align: left;
  font-size: 0.85rem;
}

.stat-item {
  margin: 4px 0;
}

.game-play-result__rank {
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.rank-badge {
  font-size: 1.5rem;
}

.rank-text {
  font-size: 0.9rem;
  color: #334155;
}

.game-play-result__buffs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-bottom: 8px;
}

.buff-tag {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 8px;
  background: #eef2ff;
  color: #4338ca;
}

.game-play-result__synced {
  font-size: 0.8rem;
  color: #16a34a;
  margin: 0 0 8px;
}

.game-play-result__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.game-play-result__btn {
  padding: 8px 18px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
}

.game-play-result__btn--primary {
  background: #4d96ff;
  color: #fff;
  border-color: #4d96ff;
}

.game-play-result__reset-guide {
  margin-top: 12px;
  border: none;
  background: none;
  font-size: 11px;
  color: #bbb;
  cursor: pointer;
  text-decoration: underline;
}
</style>