<script setup lang="ts">
import { useId } from 'vue'
import { useGameStore } from '@/stores/useGameStore'

/**
 * The buttons in the stage's top-right corner: the round ✎ (Send feedback, also on F2)
 * beside the round ☰, which opens the
 * menu, holding the journey (Journal, Quests and Map, also on J, Q and M) and
 * the game's windows. It carries the amber dot while a quest has news, since
 * the Quests lie inside the menu. (Hint is the last of the room menu's pills,
 * top left; the Bag and Spells are the belt of pictures at the picture's
 * foot.) It is press-only: nothing opens on hover.
 */
defineProps<{
  /** A sideways phone: a smaller button. */
  compact?: boolean
}>()
const emit = defineEmits<{ menu: []; feedback: [] }>()
const game = useGameStore()
/** The hidden words ☰ is described by while a quest has news. */
const newsId = useId()
</script>

<template>
  <div class="lq-buttons" :class="{ 'lq-compact': compact }">
    <div class="lq-button-row">
      <button
        type="button"
        class="lq-stage-btn lq-menu-btn"
        data-lq-obstacle="panel"
        data-button="feedback"
        title="Send feedback"
        aria-label="Send feedback"
        aria-keyshortcuts="F2"
        @click="emit('feedback')"
      >
        <span aria-hidden="true">✎</span>
      </button>
      <button
        type="button"
        class="lq-stage-btn lq-menu-btn"
        data-lq-obstacle="panel"
        data-button="menu"
        title="Menu"
        aria-label="Menu"
        :aria-describedby="game.questsHaveNew ? newsId : undefined"
        @click="emit('menu')"
      >
        ☰<span
          v-if="game.questsHaveNew"
          class="lq-dot"
          aria-hidden="true"
        ></span>
      </button>
      <span :id="newsId" class="lq-sr-only">A quest has news</span>
    </div>
  </div>
</template>

<style scoped>
.lq-buttons {
  display: flex;
  justify-content: flex-end;
}
.lq-button-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
.lq-stage-btn.lq-busy {
  opacity: 0.5;
  cursor: not-allowed;
}
.lq-stage-btn {
  position: relative;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--lq-line2);
  background: color-mix(in srgb, var(--lq-surface) 93%, transparent);
  color: var(--lq-fg);
  font: inherit;
  font-family: var(--lq-font-ui);
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.2);
}
.lq-menu-btn {
  width: 44px;
  padding: 0;
  font-size: 18px;
}
/* A sideways phone: smaller buttons. */
.lq-compact .lq-button-row {
  gap: 4px;
}
.lq-compact .lq-stage-btn {
  min-height: 40px;
  padding: 0 10px;
  font-size: 12px;
}
.lq-compact .lq-menu-btn {
  width: 40px;
  padding: 0;
  font-size: 16px;
}
/* A quest's news: the amber dot in ☰'s corner. */
.lq-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--lq-accent);
}
/* Read by assistive technology only. */
.lq-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
