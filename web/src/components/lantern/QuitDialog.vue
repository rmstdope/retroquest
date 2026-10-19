<script setup lang="ts">
import { useGameStore } from '@/stores/useGameStore'
import LanternDialog from './LanternDialog.vue'

/**
 * Asked when the player types `quit` or `exit`: save first (quick save),
 * quit without saving, or go back to the game. Quitting starts a new game
 * from Act I (a browser tab cannot close itself).
 */
const game = useGameStore()

function cancel(): void {
  game.quitAsked = false
}

function saveAndQuit(): void {
  game.saveGame()
  game.restartGame()
}
</script>

<template>
  <LanternDialog title="Quit game?" eyebrow="Game" @close="cancel">
    <p class="lq-quit-text">
      Save before you go? Anything since your last save is lost otherwise. A new
      game then starts from Act I.
    </p>
    <template #footer>
      <div class="lq-quit-buttons">
        <button type="button" class="lq-quit-primary" @click="saveAndQuit">
          Save and quit
        </button>
        <button type="button" class="lq-quit-plain" @click="game.restartGame()">
          Quit without saving
        </button>
        <button
          type="button"
          class="lq-quit-plain"
          data-autofocus
          @click="cancel"
        >
          Cancel
        </button>
      </div>
    </template>
  </LanternDialog>
</template>

<style scoped>
.lq-quit-text {
  margin: 0;
  font-family: var(--lq-font-prose);
  font-size: var(--lq-story-size);
  line-height: var(--lq-story-line-height);
  color: var(--lq-prose);
}
.lq-quit-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.lq-quit-primary,
.lq-quit-plain {
  flex: 1 1 140px;
  min-height: 48px;
  padding: 0 16px;
  border-radius: var(--lq-radius);
  font: inherit;
  font-size: 15px;
  cursor: pointer;
}
.lq-quit-primary {
  border: none;
  background: var(--lq-accent);
  color: var(--lq-on-accent);
  font-weight: 600;
}
.lq-quit-plain {
  border: 1px solid var(--lq-line2);
  background: transparent;
  color: var(--lq-fg);
}
</style>
