<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'

/**
 * The room's picture as the stage: it fills its box and is trimmed at the
 * edges (never banded). A paper backdrop stands in where the room has no
 * picture yet, or while it loads, or when the file is not there. When the
 * player walks, the next picture is loaded out of sight and then fades in over
 * the old one (about a third of a second, at once under Reduce motion); the
 * old picture goes once the fade is over. In dark mode the picture is dimmed.
 * Purely decorative: hidden from assistive technology.
 */
const props = defineProps<{ src: string }>()

/** How long the old picture stays under the fading new one. */
const FADE_MS = 350

const shown = ref('')
const leaving = ref('')
const loading = ref(props.src)
let leaveTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.src,
  (src) => {
    loading.value = src
    // The next room has no picture: the backdrop is back at once.
    if (!src) {
      shown.value = ''
      leaving.value = ''
    }
  },
)

/** The picture being loaded is ready: it fades in over the shown one. */
function onLoaded(): void {
  clearTimeout(leaveTimer)
  leaving.value = shown.value
  shown.value = loading.value
  loading.value = ''
  leaveTimer = setTimeout(() => {
    leaving.value = ''
  }, FADE_MS)
}

/** The picture is not there (yet): the backdrop stays. */
function onMissing(): void {
  loading.value = ''
  shown.value = ''
  leaving.value = ''
}

onUnmounted(() => clearTimeout(leaveTimer))
</script>

<template>
  <div class="lq-stage-picture" aria-hidden="true">
    <div class="lq-backdrop"></div>
    <img
      v-if="leaving && leaving !== shown"
      :key="`out-${leaving}`"
      class="lq-pic"
      :src="leaving"
      alt=""
    />
    <img
      v-if="shown"
      :key="`in-${shown}`"
      class="lq-pic lq-pic-in"
      :src="shown"
      alt=""
    />
    <img
      v-if="loading"
      :key="`load-${loading}`"
      class="lq-loading"
      :src="loading"
      alt=""
      @load="onLoaded"
      @error="onMissing"
    />
    <div class="lq-dim"></div>
  </div>
</template>

<style scoped>
.lq-stage-picture {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: var(--lq-bg);
}
.lq-backdrop {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 40%,
    var(--lq-surface),
    var(--lq-raised)
  );
}
.lq-pic {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.lq-pic-in {
  animation: lq-picture-in calc(0.33s * var(--lq-motion)) ease;
}
.lq-loading {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
.lq-dim {
  position: absolute;
  inset: 0;
  background: #000;
  opacity: var(--lq-picture-dim, 0);
  pointer-events: none;
}
@keyframes lq-picture-in {
  from {
    opacity: 0;
  }
}
</style>
