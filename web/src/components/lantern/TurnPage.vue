<script setup lang="ts">
/**
 * The page an upright phone shows instead of the game: the game is played
 * sideways, and a web page cannot rotate an iPhone itself. It covers every
 * screen (title page, chapter pages, pop-ups); the layout puts the game
 * behind it out of reach and leaves its state alone, so turning the phone
 * brings it back exactly as it was. Nothing on it moves.
 */
</script>

<template>
  <div
    class="lq-turn-page"
    role="dialog"
    aria-modal="true"
    aria-labelledby="lq-turn-title"
  >
    <svg
      class="lq-turn-icon"
      width="118"
      height="118"
      viewBox="0 0 118 118"
      fill="none"
      stroke="currentColor"
      stroke-width="4"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="38" y="16" width="42" height="78" rx="7" />
      <path d="M14 78c0-24 8-40 24-50" />
      <path d="M28 24l11 3-3 11" />
    </svg>
    <h2 id="lq-turn-title" class="lq-turn-heading">
      Turn your phone on its side
    </h2>
    <p class="lq-turn-line">
      RetroQuest is played with the phone held sideways, so the whole room fits.
    </p>
    <p class="lq-turn-small">
      If nothing happens, check that your phone's rotation lock is off.
    </p>
  </div>
</template>

<style scoped>
.lq-turn-page {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 36px;
  text-align: center;
  background: var(--lq-bg);
  color: var(--lq-fg);
}
.lq-turn-icon {
  color: var(--lq-accent);
}
.lq-turn-heading {
  margin: 0;
  font-family: var(--lq-font-display, serif);
  font-size: 27px;
  font-weight: 600;
  line-height: 1.2;
}
.lq-turn-line {
  margin: 0;
  font-size: 17px;
  line-height: 1.45;
  color: var(--lq-prose);
}
.lq-turn-small {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  color: var(--lq-muted);
}
</style>
