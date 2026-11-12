<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { usePanelFlash } from '@/composables/usePanelFlash'

/**
 * The room's name in the stage's top-left corner, written on the picture: no
 * card, light serif with a soft dark glow (dark ink on the paper backdrop,
 * `bare`). Who and what is here is not listed: the picture marks them. The
 * name stays for as long as the player is in the room; `away` fades it out
 * while something is told over the picture (the room's title, an arrival) and
 * it fades back in when that settles. The plate is never read aloud: the
 * room's name and description are read in the story. On the tall-screen stage
 * (`storyButton`) "⟲ Story so far" stands to the right of the name, and stays
 * while the name is away. Compact (a phone on its side) is smaller.
 */
const props = defineProps<{
  storyButton?: boolean
  compact?: boolean
  away?: boolean
  bare?: boolean
}>()
const emit = defineEmits<{ story: [] }>()
const game = useGameStore()
const storyEl = ref<HTMLButtonElement | null>(null)
const { flashing, endFlash } = usePanelFlash(['place'])

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
      'lq-plate-compact': props.compact,
      'lq-plate-away': props.away,
      'lq-plate-bare': props.bare,
    }"
    aria-label="Current location"
    @animationend.self="endFlash"
  >
    <h2 class="lq-room-name">{{ game.roomName }}</h2>
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
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.lq-room-name {
  flex: 0 1 auto;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--lq-font-display);
  font-size: calc(20px * var(--lq-display-scale));
  font-weight: 500;
  color: var(--lq-picture-ink);
  text-shadow: var(--lq-picture-glow);
  /* Fades back in as the room's title settles. */
  transition: opacity calc(1.5s * var(--lq-motion)) ease;
}
/* Gone at once when something is told over the picture. */
.lq-plate-away .lq-room-name {
  opacity: 0;
  transition: none;
}
.lq-plate-bare .lq-room-name {
  color: var(--lq-fg);
  text-shadow: none;
}
.lq-plate-compact .lq-room-name {
  font-size: calc(16px * var(--lq-display-scale));
}
.lq-story-so-far {
  flex: 0 0 auto;
  margin-left: auto;
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
</style>
