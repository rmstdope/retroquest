<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Chapter } from '@/lantern/chapter'
import { renderMarkup } from '@/utils/theme'

/**
 * A full-screen chapter page between acts: the intro opens an act (title,
 * text with a drop cap, Begin); the completion closes one with its quests,
 * spells and places, and leads on to the next act.
 */
const props = defineProps<{ chapter: Chapter; titleId: string }>()
const emit = defineEmits<{ continue: [] }>()
const button = ref<HTMLButtonElement | null>(null)

const intro = computed(() => props.chapter.kind === 'intro')
const kicker = computed(() =>
  intro.value ? props.chapter.act : `${props.chapter.act} complete`,
)
const action = computed(() => {
  if (intro.value) return 'Begin'
  return props.chapter.nextAct
    ? `Continue to ${props.chapter.nextAct}`
    : 'Continue'
})
const stats = computed(() => {
  const s = props.chapter.stats
  if (!s) return []
  return [
    {
      value: `${s.questsCompleted} / ${s.questsTotal}`,
      label: 'Quests completed',
    },
    { value: String(s.spells), label: 'Spells known' },
    { value: String(s.places), label: 'Places visited' },
  ]
})

/** Put keyboard focus on the page's button, leaving the page at its title. */
function focus(): void {
  button.value?.focus({ preventScroll: true })
}

defineExpose({ focus })
</script>

<template>
  <div class="lq-chapter">
    <div class="lq-chapter-inner">
      <span class="lq-chapter-kicker">{{ kicker }}</span>
      <h2 :id="titleId" class="lq-chapter-title">{{ chapter.title }}</h2>
      <div class="lq-ornament" aria-hidden="true">
        <span class="lq-rule"></span><span class="lq-diamond">◆</span
        ><span class="lq-rule"></span>
      </div>

      <!-- eslint-disable vue/no-v-html -->
      <div
        class="lq-chapter-body"
        :class="{ 'lq-chapter-closing': !intro }"
        v-html="renderMarkup(chapter.body)"
      ></div>
      <!-- eslint-enable vue/no-v-html -->

      <div v-if="stats.length" class="lq-stats">
        <div v-for="stat in stats" :key="stat.label" class="lq-stat">
          <span class="lq-stat-value">{{ stat.value }}</span>
          <span class="lq-stat-label">{{ stat.label }}</span>
        </div>
      </div>

      <button
        ref="button"
        type="button"
        class="lq-chapter-button"
        @click="emit('continue')"
      >
        {{ action }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.lq-chapter {
  height: 100%;
  overflow-y: auto;
  display: flex;
  background: var(--lq-bg);
  color: var(--lq-fg);
  font-family: var(--lq-font-ui);
}
.lq-chapter-inner {
  width: 100%;
  max-width: 640px;
  margin: auto;
  padding: 48px 24px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.lq-chapter-kicker {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--lq-accent-text);
}
.lq-chapter-title {
  margin: 10px 0 0;
  font-family: var(--lq-font-display);
  font-weight: 400;
  font-size: clamp(32px, 6vw, 56px);
  line-height: 1.05;
  color: var(--lq-fg);
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
.lq-chapter-body {
  width: 100%;
  text-align: left;
  font-family: var(--lq-font-prose);
  font-size: calc(17px * var(--lq-text-scale));
  line-height: 1.7;
  color: var(--lq-prose);
}
.lq-chapter-body:not(.lq-chapter-closing)::first-letter {
  float: left;
  padding: 6px 10px 0 0;
  font-family: var(--lq-font-display);
  font-size: 64px;
  line-height: 0.85;
  color: var(--lq-accent-text);
}
.lq-chapter-closing {
  text-align: center;
  font-style: italic;
}
.lq-stats {
  margin: 20px 0 8px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}
.lq-stat {
  min-width: 120px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid var(--lq-line);
  background: var(--lq-surface);
}
.lq-stat-value {
  font-family: var(--lq-font-display);
  font-size: 30px;
  color: var(--lq-accent-text);
}
.lq-stat-label {
  font-size: 12px;
  color: var(--lq-muted);
}
.lq-chapter-button {
  margin-top: 24px;
  min-width: 200px;
  height: 52px;
  padding: 0 28px;
  border: none;
  border-radius: 12px;
  background: var(--lq-accent);
  color: var(--lq-on-accent);
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
</style>
