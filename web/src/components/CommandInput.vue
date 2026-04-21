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
const activeSuggestionIndex = ref(-1)
const inputEl = ref<HTMLInputElement | null>(null)

function onKeyEnter() {
  if (activeSuggestionIndex.value >= 0 && suggestions.value.length > 0) {
    applySuggestion(suggestions.value[activeSuggestionIndex.value])
    return
  }
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
  if (!props.acceptInput) return
  e.preventDefault()

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
  activeSuggestionIndex.value = -1
}

function onKeyArrowDown() {
  if (suggestions.value.length === 0) return
  activeSuggestionIndex.value =
    (activeSuggestionIndex.value + 1) % suggestions.value.length
}

function onKeyArrowUp() {
  if (suggestions.value.length === 0) return
  activeSuggestionIndex.value =
    (activeSuggestionIndex.value - 1 + suggestions.value.length) %
    suggestions.value.length
}

function onKeyEscape() {
  closeSuggestions()
}

function applySuggestion(candidate: string) {
  const tokens = commandInput.value.trimEnd().split(' ')
  tokens[tokens.length - 1] = candidate
  const { newInput } = props.tabComplete(tokens.join(' ') + ' ')
  commandInput.value = newInput
  closeSuggestions()
  nextTick(() => inputEl.value?.focus())
}

function closeSuggestions() {
  suggestions.value = []
  activeSuggestionIndex.value = -1
}
</script>

<template>
  <div>
    <!-- Quick Action Bar -->
    <div
      class="flex gap-1.5 px-3 py-2 border-t border-border bg-bg-secondary shrink-0 overflow-x-auto max-[375px]:px-2 max-[375px]:py-1.5"
    >
      <button
        aria-label="Look"
        class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-chip-bg border border-border text-text-primary cursor-pointer text-sm whitespace-nowrap transition-colors hover:bg-chip-hover max-md:px-2.5 max-md:min-h-11 max-md:min-w-11"
        @click="$emit('submitCommand', 'look')"
      >
        👀<span class="max-md:hidden"> Look</span>
      </button>
      <button
        aria-label="Search"
        class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-chip-bg border border-border text-text-primary cursor-pointer text-sm whitespace-nowrap transition-colors hover:bg-chip-hover max-md:px-2.5 max-md:min-h-11 max-md:min-w-11"
        @click="$emit('submitCommand', 'search')"
      >
        🔍<span class="max-md:hidden"> Search</span>
      </button>
      <button
        aria-label="Inventory"
        class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-chip-bg border border-border text-text-primary cursor-pointer text-sm whitespace-nowrap transition-colors hover:bg-chip-hover max-md:px-2.5 max-md:min-h-11 max-md:min-w-11"
        @click="$emit('submitCommand', 'inventory')"
      >
        🎒<span class="max-md:hidden"> Inventory</span>
      </button>
      <button
        aria-label="Spells"
        class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-chip-bg border border-border text-text-primary cursor-pointer text-sm whitespace-nowrap transition-colors hover:bg-chip-hover max-md:px-2.5 max-md:min-h-11 max-md:min-w-11"
        @click="$emit('submitCommand', 'spells')"
      >
        ✨<span class="max-md:hidden"> Spells</span>
      </button>
      <button
        aria-label="Help"
        class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-chip-bg border border-border text-text-primary cursor-pointer text-sm whitespace-nowrap transition-colors hover:bg-chip-hover max-md:px-2.5 max-md:min-h-11 max-md:min-w-11"
        @click="$emit('submitCommand', 'help')"
      >
        ❓<span class="max-md:hidden"> Help</span>
      </button>
    </div>

    <!-- Input Bar -->
    <div
      class="relative flex gap-2 px-3 py-2.5 bg-bg-secondary border-t border-border shrink-0"
    >
      <input
        :id="'cmd-input'"
        ref="inputEl"
        v-model="commandInput"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="completions-list"
        :aria-expanded="suggestions.length > 0"
        :aria-activedescendant="
          activeSuggestionIndex >= 0
            ? `completion-${suggestions[activeSuggestionIndex]}`
            : undefined
        "
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
        @keydown.tab="onKeyTab"
        @keydown.escape="onKeyEscape"
        @keydown.arrow-down.prevent="onKeyArrowDown"
        @keydown.arrow-up.prevent="onKeyArrowUp"
        @blur="closeSuggestions"
      />

      <!-- Tab-completion suggestion dropdown -->
      <ul
        v-if="suggestions.length > 0"
        id="completions-list"
        class="absolute bottom-full left-3 mb-1 min-w-40 rounded-lg border border-border bg-bg-secondary shadow-lg z-50 overflow-hidden"
        role="listbox"
        aria-label="Completions"
      >
        <li
          v-for="(s, idx) in suggestions"
          :id="`completion-${s}`"
          :key="s"
          :aria-selected="idx === activeSuggestionIndex"
          :class="{ 'bg-chip-hover': idx === activeSuggestionIndex }"
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
