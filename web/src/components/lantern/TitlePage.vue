<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId } from 'vue'
import { parseTitle } from '@/lantern/parseTitle'
import { continueLine, filled, newestLoadable } from '@/lantern/saveCard'
import type { SaveSlot } from '@/types/bridge'
import { useFocusTrap } from '@/composables/useFocusTrap'

/**
 * The game's title page, before the first act: the RetroQuest ASCII art
 * (scaled to the screen, hidden from screen readers, who hear the title;
 * a plain wordmark under 400px wide, where the art gets too small), the
 * music credits and Start. Enter on Start or Escape goes on.
 *
 * A returning player has `saves` (the quick save, the slots in use and the saves
 * made under a name): the
 * page then offers Continue (the newest save that can be loaded, named under
 * the word), New game and Load game, and Escape does nothing. When every
 * save is from an older version there is no Continue and New game is the
 * main button. `error` is why the last load from here failed.
 *
 * `musicInfo` is the credit of the music actually playing (a take chosen in
 * Content Studio has its own), as the layout's music player holds it; until
 * the player has a track, the credits in the game's own `text` stand.
 */
const props = withDefaults(
  defineProps<{
    text: string
    musicInfo?: string
    saves?: SaveSlot[]
    error?: string
  }>(),
  { musicInfo: '', saves: () => [], error: '' },
)
const emit = defineEmits<{ start: []; continue: []; load: [] }>()
const hasSaves = computed(() => props.saves.some(filled))
const newest = computed(() => newestLoadable(props.saves))
const loadButton = ref<HTMLButtonElement | null>(null)

/** Put focus on Load game (after its window closed). */
function focusLoad(): void {
  loadButton.value?.focus()
}
defineExpose({ focusLoad })
const titleId = useId()
const page = ref<HTMLElement | null>(null)
const trap = useFocusTrap(page)
const screen = computed(() => parseTitle(props.text))
const credits = computed(() =>
  props.musicInfo
    ? props.musicInfo
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    : screen.value.credits,
)

/** A credit line as text, or as a link when it names a web address. */
function credit(line: string): { text: string; href: string | null } {
  const url = /(https?:\/\/\S+)/.exec(line)?.[1] ?? null
  return { text: line, href: url }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.stopPropagation()
    if (!hasSaves.value) emit('start')
  } else trap.onKeydown(event)
}

onMounted(() => nextTick(trap.focusFirst))
</script>

<template>
  <section
    ref="page"
    class="lq-title-page"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    tabindex="-1"
    @keydown="onKeydown"
  >
    <div class="lq-title-inner">
      <span class="lq-welcome">Welcome to</span>
      <h2 :id="titleId" class="lq-sr-only">RetroQuest</h2>
      <span class="lq-wordmark" aria-hidden="true">RetroQuest</span>
      <pre v-if="screen.art" class="lq-art" aria-hidden="true">{{
        screen.art
      }}</pre>
      <p v-if="credits.length" class="lq-credits">
        <span class="lq-credits-label">Music</span>
        <template v-for="(line, index) in credits" :key="index">
          <a
            v-if="credit(line).href"
            :href="credit(line).href!"
            target="_blank"
            rel="noopener"
            >{{ line }}</a
          >
          <span v-else>{{ line }}</span>
        </template>
      </p>
      <p v-if="error" class="lq-title-error" role="alert">{{ error }}</p>
      <template v-if="!hasSaves">
        <button
          type="button"
          class="lq-title-start"
          data-autofocus
          @click="emit('start')"
        >
          Start
        </button>
      </template>
      <template v-else>
        <button
          v-if="newest"
          type="button"
          class="lq-title-start"
          data-autofocus
          @click="emit('continue')"
        >
          Continue
          <span class="lq-title-line">{{ continueLine(newest) }}</span>
        </button>
        <button
          type="button"
          :class="newest ? 'lq-title-second' : 'lq-title-start'"
          :data-autofocus="newest ? undefined : ''"
          @click="emit('start')"
        >
          New game
        </button>
        <button
          ref="loadButton"
          type="button"
          class="lq-title-second"
          @click="emit('load')"
        >
          Load game
        </button>
      </template>
    </div>
  </section>
</template>

<style scoped>
.lq-title-page {
  position: fixed;
  inset: 0;
  z-index: 70;
  overflow-y: auto;
  display: flex;
  background: var(--lq-bg);
  color: var(--lq-fg);
  font-family: var(--lq-font-ui);
}
.lq-title-page:focus {
  outline: none;
}
.lq-title-inner {
  width: 100%;
  max-width: 760px;
  margin: auto;
  padding: 40px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  text-align: center;
}
.lq-welcome {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--lq-muted);
}
/* About 100 characters wide: scale the type to the screen. The lines differ
   in length, so they start at the left edge (centred, they would skew). */
.lq-art {
  margin: 0;
  text-align: left;
  max-width: 100%;
  overflow: hidden;
  font-family: var(--lq-font-mono, monospace);
  font-size: min(12px, calc((100vw - 32px) / 62));
  line-height: 1.15;
  color: var(--lq-accent-text);
}
.lq-wordmark {
  display: none;
  font-family: var(--lq-font-display);
  font-size: 44px;
  line-height: 1.1;
  color: var(--lq-accent-text);
}
/* Under 400px the art would be under 6px: a wordmark reads better. */
@media (max-width: 399px) {
  .lq-wordmark {
    display: block;
  }
  .lq-art {
    display: none;
  }
}
.lq-credits {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  color: var(--lq-muted);
}
.lq-credits-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.lq-credits a {
  color: var(--lq-accent-text);
}
.lq-title-start {
  min-width: 200px;
  min-height: 52px;
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
.lq-title-line {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  font-weight: 400;
  opacity: 0.85;
}
.lq-title-second {
  min-width: 200px;
  height: 48px;
  padding: 0 28px;
  border: 1px solid var(--lq-accent-line);
  border-radius: 12px;
  background: transparent;
  color: var(--lq-accent-text);
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.lq-title-error {
  margin: 0;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--lq-failure-soft);
  color: var(--lq-failure);
  font-size: 14px;
}
.lq-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
