<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Chapter } from '@/lantern/chapter'
import { parseTurn, type TurnBlock } from '@/lantern/parseTurn'
import { displayName } from '@/lantern/displayName'
import { actFolder } from '@/lantern/narrationManifest'
import { POPUP_NARRATION_ID } from '@/lantern/narrationUnits'
import { useReadAlong } from '@/composables/useReadAlong'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * A full-screen chapter page between acts: the intro opens an act (title,
 * text with a drop cap, Begin); the completion closes one with its quests,
 * spells and places, and leads on to the next act (the last act's page
 * finishes the game instead).
 *
 * The page is read aloud when the act has recordings (`useNarrationStore`,
 * started by the layout): unit 0 is the title, unit `i + 1` is body block `i`.
 * A block appears when its voice starts and is marked while spoken, with the
 * spoken word lit; a tap on the text hurries the voice, a second one skips.
 * The kicker, numbers and button are always there. While the act's recordings
 * are still loading the title and text are held back (their room kept) so
 * unspoken text never flashes.
 */
const props = defineProps<{ chapter: Chapter; titleId: string }>()
const emit = defineEmits<{ continue: [] }>()
const button = ref<HTMLButtonElement | null>(null)

const narration = useNarrationStore()
const settings = useSettingsStore()
const root = ref<HTMLElement | null>(null)
const { shown, isSpeaking, html } = useReadAlong(() => POPUP_NARRATION_ID, root)
const folder = computed(() => actFolder(props.chapter.act))
/**
 * The body's blocks as shown: the markup each is rendered from (a quote, an
 * event or a failure keeps its tag so it looks as the engine marked it; a
 * checklist is one line per item) and, for a quote whose speaker differs from
 * the previous quote's, the name above it.
 */
const blocks = computed(() => {
  let previous: string | null = null
  return parseTurn(props.chapter.body).map((block: TurnBlock) => {
    const speaker =
      block.kind === 'dialogue' && block.speaker && block.speaker !== previous
        ? displayName(block.speaker)
        : null
    if (block.kind === 'dialogue') previous = block.speaker
    return { markup: shownMarkup(block), speaker }
  })
})

/** The markup a block is rendered from. */
function shownMarkup(block: TurnBlock): string {
  if (block.kind === 'text') return block.markup
  if (block.kind === 'checklist')
    return block.items
      .map((item) => {
        const tag = item.done ? 'success' : 'pending'
        return `[${tag}]${item.markup}[/${tag}]`
      })
      .join('\n')
  return `[${block.kind}]${block.markup}[/${block.kind}]`
}
const held = computed(
  () =>
    settings.narrationOn &&
    !!folder.value &&
    narration.manifestFor(folder.value) === null,
)
onMounted(() => {
  if (folder.value) void narration.preload(folder.value)
})

/** A tap on the page's text or title (buttons and links excepted) steers the voice. */
function onTextClick(event: MouseEvent): void {
  const target = event.target instanceof Element ? event.target : null
  if (!target?.closest('button, a')) narration.tap()
}

const intro = computed(() => props.chapter.kind === 'intro')
const kicker = computed(() =>
  intro.value ? props.chapter.act : `${props.chapter.act} complete`,
)
const action = computed(() => {
  if (intro.value) return 'Begin'
  if (props.chapter.final) return 'Finish the game'
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
  <div ref="root" class="lq-chapter">
    <div
      class="lq-chapter-inner"
      :class="{ 'lq-held': held }"
      @click="onTextClick"
    >
      <span class="lq-chapter-kicker">{{ kicker }}</span>
      <h2
        :id="titleId"
        class="lq-chapter-title"
        :class="{ 'lq-speaking': isSpeaking(0) }"
        data-unit="0"
      >
        <!-- eslint-disable vue/no-v-html -->
        <span v-html="html(chapter.title, 0)"></span>
        <!-- eslint-enable vue/no-v-html -->
      </h2>
      <div class="lq-ornament" aria-hidden="true">
        <span class="lq-rule"></span><span class="lq-diamond">◆</span
        ><span class="lq-rule"></span>
      </div>

      <div class="lq-chapter-body" :class="{ 'lq-chapter-closing': !intro }">
        <template v-for="(block, index) in blocks" :key="index">
          <p
            v-if="shown(index + 1)"
            class="lq-chapter-block"
            :class="{ 'lq-speaking': isSpeaking(index + 1) }"
            :data-unit="index + 1"
          >
            <span v-if="block.speaker" class="lq-chapter-speaker">{{
              block.speaker
            }}</span>
            <!-- eslint-disable vue/no-v-html -->
            <span v-html="html(block.markup, index + 1)"></span>
            <!-- eslint-enable vue/no-v-html -->
          </p>
        </template>
      </div>

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
.lq-chapter-block {
  margin: 0 0 0.8em;
}
.lq-chapter-speaker {
  display: block;
  margin-bottom: 2px;
  font-family: var(--lq-font-ui);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lq-character);
}
.lq-chapter-block.lq-speaking {
  box-shadow: inset 2px 0 0 var(--lq-accent);
}
.lq-chapter-title.lq-speaking {
  text-shadow: 0 0 18px var(--lq-accent-soft);
}
/* Held while the act's recordings load: no flash of unspoken text. */
.lq-held .lq-chapter-title,
.lq-held .lq-chapter-body {
  visibility: hidden;
}
/* The spoken word. */
.lq-chapter :deep(.lq-w-now) {
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
  border-radius: 3px;
  box-shadow: 0 0 0 2px var(--lq-accent-soft);
}
.lq-chapter-body:not(.lq-chapter-closing)
  > .lq-chapter-block:first-of-type::first-letter {
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
