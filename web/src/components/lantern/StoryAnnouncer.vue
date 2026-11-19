<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { Turn } from '@/stores/useGameStore'
import { announcementsOf } from '@/lantern/storyAnnouncement'
import { useNarrationStore } from '@/stores/useNarrationStore'

/**
 * Tells a screen reader each new story turn as it appears, without moving the
 * player's place: a visually hidden polite live region (`role="log"`) that
 * gets one paragraph for each bubble of the turn (`announcementsOf`: its own
 * words, sentences spaced, a quote as "Speaker: line"). Nothing shows, and
 * hiding the words (▾ Hide) changes nothing. The turns already there when it
 * appears (a load) are not told, and a turn the recorded narration voice is
 * telling is left out so the two never talk over each other (the story still
 * holds it). Room arrivals and quest news keep the way they are spoken now.
 */
const props = defineProps<{ turns: Turn[] }>()
const narration = useNarrationStore()
/** Paragraphs kept in the log: the newest turns only. */
const KEPT = 12
const lines = ref<{ key: number; text: string }[]>([])
let key = 0
let told = props.turns.at(-1)?.id ?? 0

watch(
  () => props.turns.at(-1)?.id ?? 0,
  async () => {
    const fresh = props.turns.filter((turn) => turn.id > told)
    told = Math.max(told, ...fresh.map((turn) => turn.id))
    // Narration begins a moment after its turn appears.
    await nextTick()
    for (const turn of fresh) {
      if (narration.narrates(turn.id)) continue
      for (const text of announcementsOf(turn.text))
        lines.value.push({ key: key++, text })
    }
    lines.value = lines.value.slice(-KEPT)
  },
)
</script>

<template>
  <div class="lq-sr-only" role="log" aria-live="polite">
    <p v-for="line in lines" :key="line.key">{{ line.text }}</p>
  </div>
</template>

<style scoped>
/* Read by assistive technology only. */
.lq-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
