<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue'
import type { QuestNews } from '@/lantern/questNews'
import { useGameStore } from '@/stores/useGameStore'
import { renderMarkup } from '@/utils/theme'

/**
 * Quest news inside the story (non-blocking): a new quest is a card with its
 * description; an update is a one-line banner that expands to show the
 * newest part, since updates come often. Opening it scrolls the revealed
 * part into view, as the banner often sits at the bottom of the story.
 * A card's "Open in journal" button is described by its quest name, so two
 * cards in view are told apart. A completed quest stays as a record (its
 * pop-up comes first), with the act's quest count.
 */
const props = defineProps<{
  news: QuestNews
  /** The card's text as HTML with its words marked, while it is read aloud. */
  bodyHtml?: string
}>()
const open = ref(false)
const game = useGameStore()
const updateBody = ref<HTMLElement | null>(null)
const titleId = useId()

async function toggle(): Promise<void> {
  open.value = !open.value
  if (!open.value) return
  await nextTick()
  updateBody.value?.scrollIntoView?.({ block: 'nearest' })
}

const kind = computed(() => (props.news.main ? 'main' : 'side'))
const kicker = computed(() => `New ${kind.value} quest`)
const doneLabel = computed(() => {
  const label = `${props.news.main ? 'Main' : 'Side'} quest complete`
  const progress = props.news.progress
  return progress
    ? `${label} · ${progress.completed} of ${progress.total}`
    : label
})
</script>

<template>
  <section
    v-if="news.kind === 'new'"
    class="lq-quest-card"
    :aria-label="`${kicker}: ${news.name}`"
  >
    <span class="lq-kicker">{{ kicker }}</span>
    <span :id="titleId" class="lq-quest-title">{{ news.name }}</span>
    <!-- eslint-disable vue/no-v-html -->
    <p class="lq-quest-body" v-html="bodyHtml ?? renderMarkup(news.text)"></p>
    <!-- eslint-enable vue/no-v-html -->
    <button
      type="button"
      class="lq-open-journal"
      :aria-describedby="titleId"
      @click="game.openQuestInJournal(news.name)"
    >
      Open in journal
    </button>
  </section>

  <section
    v-else-if="news.kind === 'completed'"
    class="lq-record"
    :aria-label="`${news.main ? 'Main' : 'Side'} quest complete: ${news.name}`"
  >
    <span class="lq-seal" aria-hidden="true">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
    <span class="lq-record-main">
      <span class="lq-kicker">{{ doneLabel }}</span>
      <span class="lq-quest-title">{{ news.name }}</span>
      <!-- eslint-disable vue/no-v-html -->
      <span class="lq-record-text" v-html="renderMarkup(news.text)"></span>
      <!-- eslint-enable vue/no-v-html -->
    </span>
  </section>

  <div v-else class="lq-update-wrap">
    <button
      type="button"
      class="lq-update"
      :aria-expanded="open ? 'true' : 'false'"
      @click="toggle"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
      </svg>
      <span class="lq-update-text"
        >Quest updated · <strong>{{ news.name }}</strong></span
      >
      <span class="lq-update-toggle" aria-hidden="true">{{
        open ? 'Hide ▴' : 'Show ▾'
      }}</span>
    </button>
    <!-- eslint-disable vue/no-v-html -->
    <p
      v-if="open"
      ref="updateBody"
      class="lq-quest-body lq-update-body"
      v-html="renderMarkup(news.text)"
    ></p>
    <!-- eslint-enable vue/no-v-html -->
  </div>
</template>

<style scoped>
.lq-quest-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 16px;
  border-radius: var(--lq-radius);
  border: 1px solid var(--lq-accent-line);
  background: var(--lq-accent-soft);
}
.lq-kicker {
  font-family: var(--lq-font-ui);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lq-accent-text);
}
.lq-quest-title {
  font-family: var(--lq-font-display);
  font-size: calc(22px * var(--lq-display-scale));
  font-weight: 500;
  color: var(--lq-fg);
}
.lq-quest-body {
  margin: 4px 0 0;
  font-family: var(--lq-font-prose);
  font-size: calc(15px * var(--lq-text-scale));
  line-height: var(--lq-story-line-height);
  color: var(--lq-prose);
}
.lq-open-journal {
  align-self: flex-start;
  min-height: 44px;
  margin-top: 8px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid var(--lq-accent-line);
  background: transparent;
  color: var(--lq-accent-text);
  font-family: var(--lq-font-ui);
  font-size: 13px;
  cursor: pointer;
}
.lq-record {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: var(--lq-radius);
  border: 1px solid var(--lq-accent-line);
  background: var(--lq-accent-soft);
}
.lq-seal {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: var(--lq-accent);
  color: var(--lq-on-accent);
}
.lq-record-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.lq-record .lq-quest-title {
  font-size: calc(18px * var(--lq-display-scale));
}
.lq-record-text {
  margin-top: 2px;
  font-family: var(--lq-font-prose);
  font-style: italic;
  font-size: calc(14px * var(--lq-text-scale));
  line-height: var(--lq-story-line-height);
  color: var(--lq-prose);
}
.lq-update {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--lq-accent-line);
  background: transparent;
  color: var(--lq-accent-text);
  font-family: var(--lq-font-ui);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}
.lq-update-text {
  flex: 1;
  min-width: 0;
}
.lq-update-toggle {
  font-size: 12px;
  color: var(--lq-muted);
}
.lq-update-body {
  padding: 4px 14px 0;
}
</style>
