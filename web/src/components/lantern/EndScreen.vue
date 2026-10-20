<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { renderMarkup } from '@/utils/theme'

/**
 * The end of the game, full-screen and with nothing to press: "The end",
 * the thanks, the game's final answer as prose (left out when empty) and a
 * quiet line saying whether the game was saved. Focus starts on the title,
 * so a screen reader begins with the thank-you. It scrolls within itself.
 */
const props = defineProps<{ text: string; saved: boolean }>()
const title = ref<HTMLElement | null>(null)

const hasText = computed(() => props.text.trim() !== '')
const foot = computed(() =>
  props.saved
    ? 'Your game is saved in the quick slot.'
    : 'This game was not saved.',
)

onMounted(() => {
  title.value?.focus({ preventScroll: true })
})
</script>

<template>
  <div class="lq-end">
    <div class="lq-end-inner">
      <span class="lq-end-kicker">The end</span>
      <h1 ref="title" class="lq-end-title" tabindex="-1">
        Thank you for playing RetroQuest
      </h1>
      <div class="lq-ornament" aria-hidden="true">
        <span class="lq-rule"></span><span class="lq-diamond">◆</span
        ><span class="lq-rule"></span>
      </div>

      <!-- eslint-disable vue/no-v-html -->
      <div v-if="hasText" class="lq-end-body" v-html="renderMarkup(text)"></div>
      <!-- eslint-enable vue/no-v-html -->

      <p class="lq-end-foot">{{ foot }}</p>
    </div>
  </div>
</template>

<style scoped>
.lq-end {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  background: var(--lq-bg);
  color: var(--lq-fg);
  font-family: var(--lq-font-ui);
}
.lq-end-inner {
  width: 100%;
  max-width: 640px;
  margin: auto;
  padding: 48px 24px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.lq-end-kicker {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--lq-accent-text);
}
.lq-end-title {
  margin: 10px 0 0;
  font-family: var(--lq-font-display);
  font-weight: 400;
  font-size: clamp(32px, 6vw, 56px);
  line-height: 1.05;
  color: var(--lq-fg);
}
.lq-end-title:focus {
  outline: none;
}
.lq-ornament {
  width: 220px;
  margin: 18px 0 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.lq-rule {
  flex: 1;
  height: 1px;
  background: var(--lq-line2);
}
.lq-diamond {
  font-size: 10px;
  color: var(--lq-accent);
}
.lq-end-body {
  width: 100%;
  text-align: left;
  font-family: var(--lq-font-prose);
  font-size: calc(17px * var(--lq-text-scale));
  line-height: 1.7;
  color: var(--lq-prose);
}
.lq-end-foot {
  margin: 32px 0 0;
  font-size: 13px;
  color: var(--lq-muted);
}
</style>
