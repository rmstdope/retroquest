<script setup lang="ts">
import { useSendCommand } from '@/composables/useSendCommand'

/**
 * The Hint button: "💡 Hint", or the round 💡 alone (accessible name "Hint")
 * when `compact` (a phone on its side, or the phone plate). It sends the
 * existing `hint` command and is dimmed, but still focusable, while the game
 * is busy (see `useSendCommand`).
 */
defineProps<{ compact?: boolean }>()
const { busy, send } = useSendCommand()
</script>

<template>
  <button
    type="button"
    class="lq-hint-btn"
    data-hurry="command"
    aria-label="Hint"
    :aria-disabled="busy"
    :class="{ 'lq-busy': busy }"
    @click="send('hint')"
  >
    💡<template v-if="!compact"> Hint</template>
  </button>
</template>

<style scoped>
.lq-hint-btn.lq-busy {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
