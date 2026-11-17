<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useCommandCompletion } from '@/composables/useCommandCompletion'

/**
 * The typing box, for playing by keyboard: a slim box at the foot of the
 * picture, brought up with F1 (see `useCommandBox`). It takes the cursor when
 * it appears. Enter sends the command (or applies a highlighted word of the
 * list), the answer comes as usual and the box stays up, empty and focused.
 * Typing is allowed while the game is busy, but Enter then waits and keeps the
 * text. Tab completes as the old Type box did. Escape closes an open word
 * list first and otherwise asks to hide the box (`hide`), taking the key so
 * the menu does not also open; F1 hides it too (the composable's job).
 */
const emit = defineEmits<{ hide: [] }>()
const game = useGameStore()
const typed = ref('')
const input = ref<HTMLInputElement | null>(null)
const listId = 'lq-completions'

const completion = useCommandCompletion(
  typed,
  (text) => game.completionState(text),
  (text) => game.tabComplete(text).newInput,
  () => game.acceptInput,
)

/** Put the cursor in the box. */
function focus(): void {
  input.value?.focus()
}
onMounted(focus)
defineExpose({ focus })

/** Send the typed command, unless it is empty or the game is busy. */
function submit(): void {
  completion.close()
  const text = typed.value.trim()
  if (!text || !game.acceptInput) return
  game.submitCommand(text)
  typed.value = ''
}

/** Enter: apply a highlighted match, else send. */
function onEnter(): void {
  if (!completion.applyActive()) submit()
}

/** Escape: close the word list, else hide the box; the key is taken either way. */
function onEscape(event: KeyboardEvent): void {
  event.preventDefault()
  event.stopPropagation()
  if (completion.open.value) completion.close()
  else if (!event.repeat) emit('hide')
}
</script>

<template>
  <form class="lq-box" aria-label="Typing box" @submit.prevent="submit">
    <span class="lq-box-mark" aria-hidden="true">›</span>
    <div class="lq-box-field">
      <input
        ref="input"
        v-model="typed"
        class="lq-type-input"
        aria-label="Command"
        placeholder="Type a command…"
        autocomplete="off"
        role="combobox"
        aria-autocomplete="list"
        :aria-controls="listId"
        :aria-expanded="completion.open.value"
        :aria-activedescendant="
          completion.activeIndex.value >= 0
            ? `${listId}-${completion.activeIndex.value}`
            : undefined
        "
        @keydown.tab="completion.onTab"
        @keydown.down.prevent="completion.onArrowDown"
        @keydown.up.prevent="completion.onArrowUp"
        @keydown.escape="onEscape"
        @keydown.enter.prevent="onEnter"
        @blur="completion.close()"
      />
      <ul
        v-if="completion.open.value"
        :id="listId"
        class="lq-completions"
        role="listbox"
        aria-label="Matching words"
      >
        <li
          v-if="completion.noMatch.value"
          class="lq-completion-none"
          role="option"
          aria-disabled="true"
          aria-selected="false"
        >
          No match for “{{ completion.word.value }}”
        </li>
        <li
          v-for="(word, index) in completion.suggestions.value"
          :id="`${listId}-${index}`"
          :key="word"
          role="option"
          class="lq-completion"
          :aria-selected="index === completion.activeIndex.value"
          @mousedown.prevent="completion.apply(word)"
        >
          <b>{{ word.slice(0, completion.word.value.length) }}</b
          >{{ word.slice(completion.word.value.length) }}
        </li>
      </ul>
    </div>
    <kbd class="lq-box-tag" aria-hidden="true">F1 hides</kbd>
  </form>
</template>

<style scoped>
.lq-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: var(--lq-radius);
  border: 1px solid var(--lq-accent-line);
  background: var(--lq-surface);
  font-family: var(--lq-font-ui);
}
.lq-box-mark {
  flex: 0 0 auto;
  color: var(--lq-accent-text);
  font-family: var(--lq-font-mono);
  font-size: 18px;
}
.lq-box-field {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
}
.lq-type-input {
  flex: 1;
  min-width: 0;
  height: 36px;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--lq-fg);
  font-family: var(--lq-font-mono);
  font-size: 16px;
}
.lq-box-tag {
  flex: 0 0 auto;
  padding: 1px 6px;
  border: 1px solid var(--lq-line2);
  border-bottom-width: 2px;
  border-radius: 5px;
  background: var(--lq-bg);
  color: var(--lq-muted);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
}
.lq-completions {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + 10px);
  z-index: 5; /* local */
  margin: 0;
  padding: 4px;
  list-style: none;
  max-height: 220px;
  overflow-y: auto;
  border-radius: 10px;
  border: 1px solid var(--lq-line2);
  background: var(--lq-raised);
  box-shadow: 0 10px 24px rgb(0 0 0 / 0.3);
}
.lq-completion,
.lq-completion-none {
  min-height: 40px;
  line-height: 40px;
  padding: 0 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 8px;
  font-family: var(--lq-font-mono);
  font-size: 14px;
  color: var(--lq-fg);
  cursor: pointer;
}
.lq-completion b {
  font-weight: 700;
  color: var(--lq-accent-text);
}
.lq-completion-none {
  /* Wraps rather than cutting off the word typed in a narrow box (rq-6ga3). */
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 20px;
  padding-block: 10px;
  font-style: italic;
  color: var(--lq-muted);
  cursor: default;
}
.lq-completion[aria-selected='true'] {
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
}
</style>
