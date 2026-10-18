<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import ActionComposer from './ActionComposer.vue'
import LanternHeader from './LanternHeader.vue'
import StoryTurn from './StoryTurn.vue'

/**
 * Shell of the Lantern UI (shown with `?ui=lantern`): header, story (one
 * StoryTurn per turn) and the action composer.
 */
const game = useGameStore()
const storyEl = ref<HTMLElement | null>(null)
const continueButton = ref<HTMLButtonElement | null>(null)
const composer = ref<InstanceType<typeof ActionComposer> | null>(null)

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && game.showModal) game.dismissModal()
}

onMounted(() => {
  document.documentElement.setAttribute('data-ui', 'lantern')
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  document.documentElement.removeAttribute('data-ui')
  document.removeEventListener('keydown', onKeydown)
})

// Show a new turn from its start (jsdom has no scrollIntoView).
watch(
  () => game.turns.length,
  () => {
    storyEl.value?.lastElementChild?.scrollIntoView?.({ block: 'start' })
  },
  { flush: 'post' },
)

// Move keyboard focus into each pop-up as it opens, and back to the
// actions when the last one closes.
watch(
  () => game.showModal,
  (open) => {
    if (open) continueButton.value?.focus()
    else composer.value?.focus()
  },
  { flush: 'post' },
)
</script>

<template>
  <div class="lq-root">
    <LanternHeader />

    <main class="lq-main">
      <section ref="storyEl" class="lq-story" aria-label="Story">
        <h2 class="lq-sr-only">Story</h2>
        <StoryTurn v-for="turn in game.turns" :key="turn.id" :turn="turn" />
      </section>

      <ActionComposer ref="composer" />
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
        <button
          ref="continueButton"
          type="button"
          class="lq-send"
          @click="game.dismissModal()"
        >
          Continue
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.lq-root {
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
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
  /* Without this the story grows past the shell instead of scrolling in it. */
  min-height: 0;
  overflow-y: auto;
  /* Contains visually hidden (absolutely positioned) screen-reader text, which
     would otherwise extend the page below the shell. */
  position: relative;
  display: flex;
  flex-direction: column;
  gap: calc(18px * var(--lq-density));
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
.lq-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
