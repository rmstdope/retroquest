<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { useSceneStore } from '@/stores/useSceneStore'

/**
 * The room's picture as the stage: it fills its box and is trimmed at the
 * edges (never banded). A paper backdrop stands in where the room has no
 * picture yet, or while it loads, or when the file is not there. When the
 * player walks, the next picture is loaded out of sight. If the layout has
 * begun a change of scene (`useSceneStore`), a dark veil comes down over the
 * old picture (about a second), the new picture (or the backdrop) is put in
 * place in the dark and the veil lifts (about a second); the stage reports
 * the picture ready to the store. Otherwise (the first picture, a load, an act
 * starting) the new picture fades in over the old one (about a third of a
 * second, at once under Reduce motion) and the old picture goes once the fade
 * is over. In dark mode the picture is dimmed.
 * It says (`pictured`) whether a picture is up or only the backdrop, for the
 * text told over it. Purely decorative: hidden from assistive technology.
 */
const props = defineProps<{ src: string }>()
const emit = defineEmits<{ pictured: [shown: boolean] }>()

/** How long the old picture stays under the fading new one. */
const FADE_MS = 350

const scene = useSceneStore()
const shown = ref('')
const leaving = ref('')
const loading = ref(props.src)
/** The picture that has loaded during a change of scene and waits for the dark. */
const waiting = ref<string | null>(null)
let leaveTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => !!shown.value,
  (up) => emit('pictured', up),
  { immediate: true },
)

// Tell the scene which picture is up once nothing is loading (and again after a reset).
watch(
  () => [shown.value, loading.value, scene.shown] as const,
  ([up, next, settled]) => {
    if (!next && (settled === null || settled !== up)) scene.settled(up)
  },
  { immediate: true },
)

// After the layout's watchers, so a change of scene it begins is seen here.
watch(
  () => props.src,
  (src) => {
    loading.value = src
    waiting.value = null
    // The next room has no picture: the backdrop is back at once, or in the dark.
    if (!src && scene.turn === null) {
      shown.value = ''
      leaving.value = ''
    }
  },
  { flush: 'post' },
)

// The dark is reached: the new picture (or the backdrop) takes its place.
watch(
  () => [scene.phase, scene.target] as const,
  ([phase, target]) => {
    if (phase === 'in' || phase === 'idle') putInPlace(target)
  },
)

/** Put the picture the change of scene brought (or the backdrop) in place, without a dissolve. */
function putInPlace(target: string): void {
  if (waiting.value === null && target !== '') return
  clearTimeout(leaveTimer)
  leaving.value = ''
  shown.value = waiting.value ?? ''
  waiting.value = null
  if (shown.value === loading.value) loading.value = ''
}

/** The picture being loaded is ready: it fades in over the shown one, or waits for the dark. */
function onLoaded(): void {
  if (scene.turn !== null) {
    waiting.value = loading.value
    scene.targetReady(true)
    return
  }
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
  if (scene.turn !== null) {
    scene.targetReady(false)
    return
  }
  shown.value = ''
  leaving.value = ''
}

onUnmounted(() => clearTimeout(leaveTimer))
</script>

<template>
  <div
    class="lq-stage-picture"
    :class="`lq-scene-${scene.phase}`"
    aria-hidden="true"
  >
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
    <div class="lq-veil"></div>
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
/* The dark a change of scene goes through: down over the old picture, lifting off the new. */
.lq-veil {
  position: absolute;
  inset: 0;
  background: #000;
  opacity: 0;
  pointer-events: none;
}
.lq-scene-out .lq-veil {
  opacity: 1;
  transition: opacity calc(1s * var(--lq-motion)) linear;
}
.lq-scene-dark .lq-veil {
  opacity: 1;
}
.lq-scene-in .lq-veil {
  opacity: 0;
  transition: opacity calc(1s * var(--lq-motion)) linear;
}
@keyframes lq-picture-in {
  from {
    opacity: 0;
  }
}
</style>
