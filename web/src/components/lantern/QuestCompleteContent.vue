<script setup lang="ts">
import { computed } from 'vue'
import type { QuestNews } from '@/lantern/parseQuestNews'
import { renderMarkup } from '@/utils/theme'

/**
 * The quest-complete pop-up's content (the one quest moment that blocks):
 * a check seal, which kind of quest, its name as the dialog title, the
 * completion text and how many of the act's quests are done.
 */
const props = defineProps<{ news: QuestNews; titleId: string }>()

const kicker = computed(
  () => `${props.news.main ? 'Main' : 'Side'} quest complete`,
)
const percent = computed(() => {
  const progress = props.news.progress
  return progress && progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0
})
</script>

<template>
  <div class="lq-complete">
    <span class="lq-seal" aria-hidden="true">
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
    <span class="lq-kicker">{{ kicker }}</span>
    <h2 :id="titleId" class="lq-complete-title">{{ news.name }}</h2>
    <!-- eslint-disable vue/no-v-html -->
    <p class="lq-complete-text" v-html="renderMarkup(news.text)"></p>
    <!-- eslint-enable vue/no-v-html -->
    <div v-if="news.progress" class="lq-complete-progress">
      <span
        class="lq-track"
        role="progressbar"
        aria-label="Quests completed"
        :aria-valuenow="news.progress.completed"
        aria-valuemin="0"
        :aria-valuemax="news.progress.total"
        ><span class="lq-fill" :style="{ width: `${percent}%` }"></span
      ></span>
      <span class="lq-complete-count"
        >{{ news.progress.completed }} of {{ news.progress.total }} quests</span
      >
    </div>
  </div>
</template>

<style scoped>
.lq-complete {
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 8px 4px 4px;
}
.lq-seal {
  flex: 0 0 auto;
  width: 60px;
  height: 60px;
  margin: 6px 0 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 30px;
  background: var(--lq-accent);
  color: var(--lq-on-accent);
  box-shadow:
    0 0 0 6px var(--lq-accent-soft),
    0 0 0 7px var(--lq-accent-line);
}
.lq-kicker {
  font-family: var(--lq-font-ui);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lq-accent-text);
}
.lq-complete-title {
  margin: 2px 0 0;
  font-family: var(--lq-font-display);
  font-size: calc(28px * var(--lq-display-scale));
  font-weight: 500;
  color: var(--lq-fg);
}
.lq-complete-text {
  margin: 8px 0 0;
  max-width: 52ch;
  font-family: var(--lq-font-prose);
  font-style: italic;
  font-size: var(--lq-story-size);
  line-height: var(--lq-story-line-height);
  color: var(--lq-prose);
}
.lq-complete-progress {
  width: 100%;
  max-width: 360px;
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.lq-track {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: var(--lq-line);
  overflow: hidden;
}
.lq-fill {
  display: block;
  height: 8px;
  background: var(--lq-accent);
}
.lq-complete-count {
  font-family: var(--lq-font-ui);
  font-size: 12px;
  color: var(--lq-muted);
}
</style>
