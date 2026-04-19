<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = defineProps<{
  acceptInput: boolean
  tabComplete: (input: string) => { newInput: string; candidates: string[] }
}>()

const emit = defineEmits<{
  submitCommand: [command: string]
  advanceTurn: []
}>()

const commandInput = ref('')
const suggestions = ref<string[]>([])
const inputEl = ref<HTMLInputElement | null>(null)

function onKeyEnter() {
  closeSuggestions()
  emit('submitCommand', commandInput.value)
  commandInput.value = ''
}

function onSendClick() {
  closeSuggestions()
  emit('submitCommand', commandInput.value)
  commandInput.value = ''
}

function onKeyTab(e: KeyboardEvent) {
  e.preventDefault()
  if (!props.acceptInput) return

  const { newInput, candidates } = props.tabComplete(commandInput.value)

  if (candidates.length === 0) {
    closeSuggestions()
    return
  }

  if (candidates.length === 1) {
    commandInput.value = newInput
    closeSuggestions()
    return
  }

  // Multiple candidates — show dropdown
  commandInput.value = newInput
  suggestions.value = candidates
}

function onKeyEscape() {
  closeSuggestions()
}

function applySuggestion(candidate: string) {
  const tokens = commandInput.value.trimEnd().split(' ')
  tokens[tokens.length - 1] = candidate
  commandInput.value = tokens.join(' ') + ' '
  closeSuggestions()
  nextTick(() => inputEl.value?.focus())
}

function closeSuggestions() {
  suggestions.value = []
}
</script>

<template>
  <div>
    <!-- Quick Action Bar -->
    <div
      class="flex gap-1.5 px-3 py-2 border-t border-border bg-bg-secondary shrink-0 overflow-x-auto max-[375px]:px-2 max-[375px]:py-1.5"
    >
      <button
        class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-chip-bg border border-border text-text-primary cursor-pointer text-sm whitespace-nowrap transition-colors hover:bg-chip-hover max-[375px]:min-h-11 max-[375px]:min-w-11 max-[375px]:px-3 max-[375px]:py-2"
        @click="$emit('submitCommand', 'look')"
      >
        👀 Look
      </button>
      <button
        class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-chip-bg border border-border text-text-primary cursor-pointer text-sm whitespace-nowrap transition-colors hover:bg-chip-hover max-[375px]:min-h-11 max-[375px]:min-w-11 max-[375px]:px-3 max-[375px]:py-2"
        @click="$emit('submitCommand', 'search')"
      >
        🔍 Search
      </button>
      <button
        class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-chip-bg border border-border text-text-primary cursor-pointer text-sm whitespace-nowrap transition-colors hover:bg-chip-hover max-[375px]:min-h-11 max-[375px]:min-w-11 max-[375px]:px-3 max-[375px]:py-2"
        @click="$emit('submitCommand', 'inventory')"
      >
        🎒 Inventory
      </button>
      <button
        class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-chip-bg border border-border text-text-primary cursor-pointer text-sm whitespace-nowrap transition-colors hover:bg-chip-hover max-[375px]:min-h-11 max-[375px]:min-w-11 max-[375px]:px-3 max-[375px]:py-2"
        @click="$emit('submitCommand', 'spells')"
      >
        ✨ Spells
      </button>
      <button
        class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-chip-bg border border-border text-text-primary cursor-pointer text-sm whitespace-nowrap transition-colors hover:bg-chip-hover max-[375px]:min-h-11 max-[375px]:min-w-11 max-[375px]:px-3 max-[375px]:py-2"
        @click="$emit('submitCommand', 'help')"
      >
        ❓ Help
      </button>
    </div>

    <!-- Input Bar -->
    <div
      class="relative flex gap-2 px-3 py-2.5 bg-bg-secondary border-t border-border shrink-0"
    >
      <input
        ref="inputEl"
        v-model="commandInput"
        type="text"
        :placeholder="
          acceptInput ? 'What do you want to do?' : 'Press Enter to continue'
        "
        :readonly="!acceptInput"
        :class="{ 'opacity-50 cursor-default': !acceptInput }"
        class="flex-1 px-3.5 py-2.5 rounded-lg border border-border bg-bg-input text-text-primary text-[0.95rem] outline-none transition-colors focus:border-accent placeholder:text-text-secondary max-[375px]:min-h-11"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        autofocus
        @keydown.enter="acceptInput ? onKeyEnter() : $emit('advanceTurn')"
        @keydown.tab.prevent="onKeyTab"
        @keydown.escape="onKeyEscape"
        @blur="closeSuggestions"
      />

      <!-- Tab-completion suggestion dropdown -->
      <ul
        v-if="suggestions.length > 0"
        class="absolute bottom-full left-3 mb-1 min-w-40 rounded-lg border border-border bg-bg-secondary shadow-lg z-50 overflow-hidden"
        role="listbox"
        aria-label="Completions"
      >
        <li
          v-for="s in suggestions"
          :key="s"
          class="px-4 py-2 text-[0.9rem] text-text-primary cursor-pointer hover:bg-chip-hover"
          role="option"
          @mousedown.prevent="applySuggestion(s)"
        >
          {{ s }}
        </li>
      </ul>

      <button
        class="px-5 py-2.5 rounded-lg bg-accent text-white border-none cursor-pointer text-[0.95rem] font-semibold transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-default max-[375px]:min-h-11 max-[375px]:min-w-11"
        :disabled="!acceptInput"
        @click="onSendClick()"
      >
        Send
      </button>
    </div>
  </div>
</template>
