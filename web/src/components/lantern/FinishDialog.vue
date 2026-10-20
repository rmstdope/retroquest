<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import LanternDialog from './LanternDialog.vue'

/**
 * Asked over the last act's chapter page when the player presses Finish the
 * game: save first (the quick slot, as Save and quit does) or finish without
 * saving, then the end screen. Closing it (✕, Escape, a tap outside) goes
 * back to the chapter page. If the save fails, the dialog stays and says so.
 */
const game = useGameStore()
const saveFailed = ref(false)

function saveAndFinish(): void {
  saveFailed.value = !game.finishGame(true)
}
</script>

<template>
  <LanternDialog
    title="Save before you finish?"
    eyebrow="The end"
    @close="game.cancelFinish()"
  >
    <p class="lq-finish-text">
      This was the last act. Save now and you can load your finished game later.
    </p>
    <p v-if="saveFailed" class="lq-finish-error" role="alert">
      Your game could not be saved. You can try again, or finish without saving.
    </p>
    <template #footer>
      <div class="lq-finish-buttons">
        <button
          type="button"
          class="lq-finish-primary"
          data-autofocus
          @click="saveAndFinish"
        >
          Save and finish
        </button>
        <button
          type="button"
          class="lq-finish-plain"
          @click="game.finishGame(false)"
        >
          Finish without saving
        </button>
      </div>
    </template>
  </LanternDialog>
</template>

<style scoped>
.lq-finish-text {
  margin: 0;
  font-family: var(--lq-font-prose);
  font-size: var(--lq-story-size);
  line-height: var(--lq-story-line-height);
  color: var(--lq-prose);
}
.lq-finish-error {
  margin: 12px 0 0;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--lq-failure-soft);
  color: var(--lq-failure);
  font-size: 14px;
}
.lq-finish-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.lq-finish-primary,
.lq-finish-plain {
  flex: 1 1 140px;
  min-height: 48px;
  padding: 0 16px;
  border-radius: var(--lq-radius);
  font: inherit;
  font-size: 15px;
  cursor: pointer;
}
.lq-finish-primary {
  border: none;
  background: var(--lq-accent);
  color: var(--lq-on-accent);
  font-weight: 600;
}
.lq-finish-plain {
  border: 1px solid var(--lq-line2);
  background: transparent;
  color: var(--lq-fg);
}
</style>
