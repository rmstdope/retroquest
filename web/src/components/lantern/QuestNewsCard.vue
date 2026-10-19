<script setup lang="ts">
import { computed, ref } from 'vue'
import type { QuestNews } from '@/lantern/parseQuestNews'
import { renderMarkup } from '@/utils/theme'

/**
 * Quest news inside the story (non-blocking): a new quest is a card with its
 * description; an update is a one-line banner that expands to show the
 * newest part, since updates come often.
 */
const props = defineProps<{ news: QuestNews }>()
const open = ref(false)

const kicker = computed(() => `New ${props.news.main ? 'main' : 'side'} quest`)
</script>

<template>
  <section
    v-if="news.kind === 'new'"
    class="lq-quest-card"
    :aria-label="`${kicker}: ${news.name}`"
  >
    <span class="lq-kicker">{{ kicker }}</span>
    <span class="lq-quest-title">{{ news.name }}</span>
    <!-- eslint-disable vue/no-v-html -->
    <p class="lq-quest-body" v-html="renderMarkup(news.text)"></p>
    <!-- eslint-enable vue/no-v-html -->
  </section>

  <div v-else class="lq-update-wrap">
    <button
      type="button"
      class="lq-update"
      :aria-expanded="open ? 'true' : 'false'"
      @click="open = !open"
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
