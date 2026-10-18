<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { renderMarkup } from '@/utils/theme'
import LanternHeader from './LanternHeader.vue'

/**
 * Shell of the Lantern UI (shown with `?ui=lantern`). The story list and the
 * plain command box are temporary: the story view (step 11) and the action
 * composer (step 12) replace them.
 */
const game = useGameStore()
const command = ref('')

onMounted(() => {
  document.documentElement.setAttribute('data-ui', 'lantern')
})
onUnmounted(() => {
  document.documentElement.removeAttribute('data-ui')
})

function submit(): void {
  const text = command.value.trim()
  if (!text) return
  game.submitCommand(text)
  command.value = ''
}
</script>

<template>
  <div class="lq-root">
    <LanternHeader />

    <main class="lq-main">
      <section class="lq-story" aria-label="Story">
        <article
          v-for="turn in game.turns"
          :key="turn.id"
          class="lq-turn"
          data-testid="turn"
        >
          <div v-if="turn.command" class="lq-command">› {{ turn.command }}</div>
          <!-- eslint-disable vue/no-v-html -->
          <p class="lq-text" v-html="renderMarkup(turn.text)"></p>
          <!-- eslint-enable vue/no-v-html -->
        </article>
      </section>

      <form class="lq-input-row" @submit.prevent="submit">
        <input
          v-model="command"
          class="lq-input"
          aria-label="Command"
          placeholder="What do you do?"
          autocomplete="off"
          :disabled="!game.acceptInput"
        />
        <button type="submit" class="lq-send" :disabled="!game.acceptInput">
          Do it
        </button>
      </form>
    </main>

    <!-- Temporary pop-up for act intros and quest news; steps 15–17 replace it. -->
    <div v-if="game.showModal" class="lq-scrim">
      <section
        class="lq-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lq-dialog-title"
      >
        <h2 id="lq-dialog-title" class="lq-dialog-title">
          {{ game.modalTitle }}
        </h2>
        <!-- eslint-disable vue/no-v-html -->
        <div class="lq-dialog-body" v-html="game.modalBody"></div>
        <!-- eslint-enable vue/no-v-html -->
        <button type="button" class="lq-send" @click="game.dismissModal()">
          Continue
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.lq-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--lq-bg);
  color: var(--lq-fg);
  font-family: var(--lq-font-ui);
}
.lq-main {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}
.lq-story {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: calc(18px * var(--lq-density));
}
.lq-turn {
  display: flex;
  flex-direction: column;
  gap: calc(10px * var(--lq-density));
}
.lq-command {
  font-family: var(--lq-font-mono);
  font-size: 12px;
  color: var(--lq-muted);
}
.lq-text {
  margin: 0;
  font-family: var(--lq-font-prose);
  font-size: var(--lq-story-size);
  line-height: var(--lq-story-line-height);
  color: var(--lq-prose);
}
.lq-input-row {
  display: flex;
  gap: 8px;
}
.lq-input {
  flex: 1;
  min-width: 0;
  height: 48px;
  padding: 0 12px;
  border-radius: var(--lq-radius);
  border: 1px solid var(--lq-accent-line);
  background: var(--lq-surface);
  color: var(--lq-fg);
  font-family: var(--lq-font-mono);
  font-size: 16px;
}
.lq-send {
  height: 48px;
  padding: 0 18px;
  border: none;
  border-radius: var(--lq-radius);
  background: var(--lq-accent);
  color: var(--lq-on-accent);
  font-weight: 600;
  cursor: pointer;
}
.lq-send:disabled,
.lq-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.lq-scrim {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgb(5 8 11 / 0.72);
}
.lq-dialog {
  width: 100%;
  max-width: 560px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border-radius: 18px;
  border: 1px solid var(--lq-accent-line);
  background: var(--lq-surface);
  color: var(--lq-fg);
}
.lq-dialog-title {
  margin: 0;
  font-family: var(--lq-font-display);
  font-weight: 500;
  font-size: calc(24px * var(--lq-display-scale));
}
.lq-dialog-body {
  min-height: 0;
  overflow-y: auto;
  font-family: var(--lq-font-prose);
  font-size: var(--lq-story-size);
  line-height: var(--lq-story-line-height);
  color: var(--lq-prose);
}
</style>
