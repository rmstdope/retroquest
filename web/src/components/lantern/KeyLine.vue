<script setup lang="ts">
import { KEYBOARD_QUERY, useMediaQuery } from '@/composables/useMediaQuery'

/** One group of the key line: the keys to press, and the word for what they do. */
export interface KeyHint {
  keys: string[]
  word: string
}

/**
 * The quiet key line at the foot of a keyboard-driven screen, bottom right:
 * small key caps followed by a short word ("↑ ↓ move · Enter choose · Esc
 * back"). Shown only to a keyboard player (a mouse or trackpad), on the same
 * terms as Settings' "Press F to switch it on or off" line; a touch player
 * never sees it. It wraps onto two lines on a narrow window.
 */
defineProps<{ hints: KeyHint[] }>()
const keyboardPlayer = useMediaQuery(KEYBOARD_QUERY)
</script>

<template>
  <p v-if="keyboardPlayer" class="lq-keyline">
    <span v-for="hint in hints" :key="hint.word" class="lq-keygroup">
      <kbd v-for="key in hint.keys" :key="key" class="lq-key">{{ key }}</kbd
      >{{ hint.word }}
    </span>
  </p>
</template>

<style scoped>
.lq-keyline {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px 14px;
  font-size: 12px;
  color: var(--lq-muted);
}
.lq-keygroup {
  white-space: nowrap;
}
.lq-key {
  display: inline-block;
  min-width: 20px;
  margin-right: 4px;
  padding: 1px 6px;
  border: 1px solid var(--lq-line2);
  border-bottom-width: 2px;
  border-radius: 5px;
  font: inherit;
  font-size: 11px;
  color: var(--lq-fg);
  text-align: center;
}
.lq-key + .lq-key {
  margin-left: 0;
}
</style>
