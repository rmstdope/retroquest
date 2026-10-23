<script setup lang="ts">
import { computed, ref } from 'vue'
import type { QuestNews } from '@/lantern/questNews'
import { useReadAlong } from '@/composables/useReadAlong'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { POPUP_NARRATION_ID } from '@/lantern/narrationUnits'

/**
 * The quest-complete pop-up's body (the one quest moment that blocks): a
 * check seal, the completion text and how many of the act's quests are
 * done. Which quest it is ("Side quest complete", its name) is in the
 * dialog's fixed header, so it stays in view while a long text scrolls.
 *
 * The completion text is read aloud like a quest card (`useNarrationStore`,
 * narrated by the layout): marked while spoken, the spoken word lit. A tap on
 * the text hurries the voice, a second one skips it.
 */
const props = defineProps<{ news: QuestNews }>()

const root = ref<HTMLElement | null>(null)
const narration = useNarrationStore()
const { isSpeaking, html } = useReadAlong(() => POPUP_NARRATION_ID, root)

const percent = computed(() => {
  const progress = props.news.progress
  return progress && progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0
})
</script>

<template>
  <div ref="root" class="lq-complete">
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
    <!-- eslint-disable vue/no-v-html -->
    <p
      class="lq-complete-text"
      :class="{ 'lq-speaking': isSpeaking(0) }"
      data-unit="0"
      @click="narration.tap()"
      v-html="html(news.text, 0)"
    ></p>
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
.lq-complete-text {
  margin: 8px 0 0;
  max-width: 52ch;
  font-family: var(--lq-font-prose);
  font-style: italic;
  font-size: var(--lq-story-size);
  line-height: var(--lq-story-line-height);
  color: var(--lq-prose);
}
/* The text being read: an amber rule at its left edge, as in the story. */
.lq-complete-text.lq-speaking {
  box-shadow: inset 2px 0 0 var(--lq-accent);
}
/* The spoken word. */
.lq-complete :deep(.lq-w-now) {
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
  border-radius: 3px;
  box-shadow: 0 0 0 2px var(--lq-accent-soft);
}
/* Short screens (phone landscape): no room for the seal. */
@media (max-height: 519px) {
  .lq-seal {
    display: none;
  }
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
