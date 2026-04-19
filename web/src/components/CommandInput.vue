<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  acceptInput: boolean
}>()

const emit = defineEmits<{
  submitCommand: [command: string]
  advanceTurn: []
}>()

const commandInput = ref('')

function onKeyEnter() {
  emit('submitCommand', commandInput.value)
  commandInput.value = ''
}

function onSendClick() {
  emit('submitCommand', commandInput.value)
  commandInput.value = ''
}
</script>

<template>
  <div>
    <!-- Quick Action Bar -->
    <div class="quick-actions">
      <button class="quick-action-btn" @click="$emit('submitCommand', 'look')">
        👀 Look
      </button>
      <button
        class="quick-action-btn"
        @click="$emit('submitCommand', 'search')"
      >
        🔍 Search
      </button>
      <button
        class="quick-action-btn"
        @click="$emit('submitCommand', 'inventory')"
      >
        🎒 Inventory
      </button>
      <button
        class="quick-action-btn"
        @click="$emit('submitCommand', 'spells')"
      >
        ✨ Spells
      </button>
      <button class="quick-action-btn" @click="$emit('submitCommand', 'help')">
        ❓ Help
      </button>
    </div>

    <!-- Input Bar -->
    <div class="input-bar">
      <input
        v-model="commandInput"
        type="text"
        :placeholder="
          acceptInput ? 'What do you want to do?' : 'Press Enter to continue'
        "
        :readonly="!acceptInput"
        :class="{ 'input-accept-off': !acceptInput }"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        autofocus
        @keydown.enter="acceptInput ? onKeyEnter() : $emit('advanceTurn')"
      />
      <button class="send-btn" :disabled="!acceptInput" @click="onSendClick()">
        Send
      </button>
    </div>
  </div>
</template>
