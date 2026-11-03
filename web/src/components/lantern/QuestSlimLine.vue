<script setup lang="ts">
import { computed, useId } from 'vue'
import type { QuestNews } from '@/lantern/questNews'
import { newsSlimHeading } from '@/lantern/stageArrival'
import { useGameStore } from '@/stores/useGameStore'

/**
 * The slim line the story (outside the stage's narration cards, which keep
 * nothing) shows for a piece of quest news once it has been told in the
 * middle of the picture: an amber line with a round mark
 * (a tick for a completion), the heading, " · ", the quest's name in bold, and
 * "Open in journal" at its right end, which opens the journal at that quest.
 * The button is described by the line, so several lines are told apart.
 */
const props = defineProps<{ news: QuestNews }>()
const game = useGameStore()
const lineId = useId()
const heading = computed(() => newsSlimHeading(props.news))
</script>

<template>
  <div class="lq-slim-news" data-testid="news-line">
    <span :id="lineId" class="lq-slim-text">
      <span class="lq-slim-mark" aria-hidden="true">{{
        news.kind === 'completed' ? '✓' : ''
      }}</span>
      {{ heading }} · <strong>{{ news.name }}</strong>
    </span>
    <button
      type="button"
      class="lq-open-journal"
      :aria-describedby="lineId"
      @click="game.openQuestInJournal(news.name)"
    >
      Open in journal
    </button>
  </div>
</template>

<style scoped>
.lq-slim-news {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 4px 4px 4px 10px;
  border-radius: 8px;
  border: 1px solid var(--lq-accent-line);
  background: var(--lq-accent-soft);
  font-family: var(--lq-font-ui);
  font-size: calc(14px * var(--lq-text-scale));
  line-height: 1.35;
  color: var(--lq-accent-text);
}
.lq-slim-text {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0 6px;
  min-width: 0;
}
.lq-slim-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--lq-accent);
  color: #fff;
  font-size: 12px;
}
.lq-slim-text strong {
  color: var(--lq-fg);
}
.lq-open-journal {
  margin-left: auto;
  min-height: 44px;
  padding: 0 10px;
  border: 0;
  background: transparent;
  color: var(--lq-accent-text);
  font: inherit;
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;
  white-space: nowrap;
}
</style>
