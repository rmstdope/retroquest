<script setup lang="ts">
import { computed, ref } from 'vue'
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
 */
const props = defineProps<{ storyButton?: boolean }>()
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

/** Put focus on "⟲ Story so far" (the story so far has just been closed). */
function focusStoryButton(): void {
  storyEl.value?.focus()
}

defineExpose({ focusStoryButton })
</script>

<template>
  <section
    class="lq-plate"
    :class="{ 'lq-flash': flashing }"
    aria-label="Current location"
    @animationend.self="endFlash"
  >
    <div class="lq-plate-top">
      <span class="lq-label">You are in</span>
      <button
        v-if="props.storyButton"
        ref="storyEl"
        type="button"
        class="lq-story-so-far"
        @click="emit('story')"
      >
        ⟲ Story so far
      </button>
    </div>
    <h2 class="lq-room-name">{{ game.roomName }}</h2>
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
/* The label, and on the phone stage "⟲ Story so far" in the top-right corner. */
.lq-plate-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.lq-story-so-far {
  height: 32px;
  margin: -6px -6px -6px 0;
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
