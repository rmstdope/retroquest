<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { usePanelFlash } from '@/composables/usePanelFlash'
import { displayName } from '@/lantern/displayName'

/**
 * The plate in the stage's top-left corner: "You are in", the room's name and
 * under it who and what is here as chips (characters blue, items green). A
 * chip is a button the layout opens the name menu for (it carries the engine's
 * name). Many chips wrap onto more lines and the plate grows downward; a long
 * name wraps; with nothing here the plate shows only the name. The plate is
 * never read aloud: the room's name and description are read in the story.
 * Folded (a short screen with a conversation on the picture), the plate is one
 * row: the name, the chips in a single row that fades at its right edge and
 * slides sideways, then "⟲ Story so far"; "You are in" is hidden. The same
 * elements stay in the same order, so folding never moves focus.
 */
const props = defineProps<{ storyButton?: boolean; folded?: boolean }>()
const emit = defineEmits<{ story: [] }>()
const game = useGameStore()
const storyEl = ref<HTMLButtonElement | null>(null)
const { flashing, endFlash } = usePanelFlash(['place'])

/**
 * Who and what is here, each with a key unique within the list: a room can
 * hold several things of one name (three Mounted Lanterns), so the key adds
 * how many of that name came before.
 */
const here = computed(() => {
  const seen: Record<string, number> = {}
  return [
    ...game.characters.map((name) => ({ name, kind: 'character' })),
    ...game.items.map((name) => ({ name, kind: 'item' })),
  ].map((entry) => {
    const base = `${entry.kind}:${entry.name}`
    const count = seen[base] ?? 0
    seen[base] = count + 1
    return { ...entry, key: `${base}:${count}` }
  })
})

/** The plate has just opened again from folded: it eases in once. */
const opening = ref(false)
watch(
  () => props.folded,
  (folded, wasFolded) => {
    if (wasFolded && !folded) opening.value = true
  },
)

/** An animation ended: the flash, or the ease of opening. */
function onAnimationEnd(event: AnimationEvent): void {
  if (event.animationName === 'lq-plate-fold') opening.value = false
  else endFlash()
}

/** Put focus on "⟲ Story so far" (the story so far has just been closed). */
function focusStoryButton(): void {
  storyEl.value?.focus()
}

defineExpose({ focusStoryButton })
</script>

<template>
  <section
    class="lq-plate"
    :class="{
      'lq-flash': flashing,
      'lq-plate-folded': props.folded,
      'lq-plate-opening': opening,
    }"
    aria-label="Current location"
    @animationend.self="onAnimationEnd"
  >
    <span class="lq-label" :aria-hidden="props.folded ? true : undefined">
      You are in
    </span>
    <h2 class="lq-room-name" :class="{ 'lq-room-name-pad': props.storyButton }">
      {{ game.roomName }}
    </h2>
    <div v-if="here.length" class="lq-here">
      <button
        v-for="entry in here"
        :key="entry.key"
        type="button"
        class="lq-here-chip"
        :class="`lq-here-${entry.kind}`"
        :data-name-kind="entry.kind"
        :data-name="entry.name"
        aria-haspopup="menu"
      >
        {{ displayName(entry.name) }}
      </button>
    </div>
    <!-- After the chips in the Tab order; drawn in the plate's top-right corner. -->
    <button
      v-if="props.storyButton"
      ref="storyEl"
      type="button"
      class="lq-story-so-far"
      @click="emit('story')"
    >
      ⟲ Story so far
    </button>
  </section>
</template>

<style scoped>
.lq-plate {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  border-radius: var(--lq-radius);
  border: 1px solid var(--lq-line);
  background: color-mix(in srgb, var(--lq-surface) 93%, transparent);
  box-shadow: 0 6px 24px rgb(0 0 0 / 0.25);
}
.lq-label {
  font-family: var(--lq-font-ui);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--lq-muted);
}
.lq-room-name {
  margin: 0;
  overflow-wrap: anywhere;
  font-family: var(--lq-font-display);
  font-size: calc(24px * var(--lq-display-scale));
  font-weight: 500;
  color: var(--lq-fg);
}
/* On the phone stage "⟲ Story so far" sits in the plate's top-right corner. */
.lq-plate {
  position: relative;
}
.lq-story-so-far {
  position: absolute;
  top: 8px;
  right: 8px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--lq-line);
  border-radius: 16px;
  background: var(--lq-raised);
  color: var(--lq-accent-text);
  font: inherit;
  font-family: var(--lq-font-ui);
  font-size: 13px;
  cursor: pointer;
}
/* A long name wraps before the button, not under it. */
.lq-room-name-pad {
  padding-top: 8px;
}
.lq-here {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.lq-here-chip {
  height: 30px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font: inherit;
  font-family: var(--lq-font-ui);
  font-size: 13px;
  cursor: pointer;
}
/* Folded: one row; the names slide sideways under a fade at the right edge. */
.lq-plate-folded {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 6px 8px 6px 16px;
}
.lq-plate-folded,
.lq-plate-opening {
  animation: lq-plate-fold calc(0.2s * var(--lq-motion)) ease-out;
}
.lq-plate-folded .lq-label {
  display: none;
}
.lq-plate-folded .lq-room-name {
  flex: 0 0 auto;
  padding-top: 0;
  font-size: calc(20px * var(--lq-display-scale));
  white-space: nowrap;
}
.lq-plate-folded .lq-here {
  flex: 1 1 0;
  min-width: 0;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  /* Room after the last name, so scrolled to the end it is clear of the fade. */
  padding-inline-end: 28px;
  mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent);
}
.lq-plate-folded .lq-here::-webkit-scrollbar {
  display: none;
}
.lq-plate-folded .lq-here-chip {
  flex: 0 0 auto;
}
.lq-plate-folded .lq-story-so-far {
  position: static;
  flex: 0 0 auto;
}
@keyframes lq-plate-fold {
  from {
    opacity: 0.4;
  }
}
.lq-here-character {
  border: 1px solid var(--lq-character-line);
  background: var(--lq-character-soft);
  color: var(--lq-character);
}
.lq-here-item {
  border: 1px solid var(--lq-item-line);
  background: var(--lq-item-soft);
  color: var(--lq-item);
}
</style>
