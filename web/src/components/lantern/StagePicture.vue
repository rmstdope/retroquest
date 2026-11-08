<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
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
 * Patches (`patches`, the URLs of the transparent pictures the story's changes
 * to the room call for) are laid over the picture, trimmed and dimmed with it.
 * Those there when the picture comes up are there without a fade, and the
 * picture waits (up to a second, in the dark of a change of scene) for the
 * ones still loading. When the story changes the room Elior stands in, a patch
 * fades in or out slowly (a little over a second, at once under Reduce motion);
 * a patch that cannot be fetched is left out, and one that is slow fades in
 * when it comes. Nothing of the next room's patches shows over the old picture.
 * It says (`pictured`) whether a picture is up or only the backdrop, for the
 * text told over it. Purely decorative: hidden from assistive technology.
 */
const props = withDefaults(defineProps<{ src: string; patches?: string[] }>(), {
  patches: () => [],
})
const emit = defineEmits<{ pictured: [shown: boolean] }>()

/** How long the old picture stays under the fading new one. */
const FADE_MS = 350
/** How long a patch takes to fade in or out (the stylesheet's, with a margin before it is let go). */
const PATCH_FADE_MS = 1300
/** How long the picture waits for its patches to load before it comes up without them. */
const PATCH_WAIT_MS = 1000
/** How long a patch just laid waits before it starts to fade in. */
const PATCH_START_MS = 20

const scene = useSceneStore()
const shown = ref('')
const leaving = ref('')
const loading = ref(props.src)
/** The picture that has loaded during a change of scene and waits for the dark. */
const waiting = ref<string | null>(null)
let leaveTimer: ReturnType<typeof setTimeout> | undefined

/** One patch laid over the picture: `on` is its full strength, `still` that it came with the picture. */
interface PatchLayer {
  src: string
  on: boolean
  still: boolean
}
const layers = ref<PatchLayer[]>([])
/** The patches that have loaded, and those that cannot be fetched. */
const loadedPatches = ref<string[]>([])
const failedPatches = ref<string[]>([])
/** The asked-for patches that are there to lay. */
const readyPatches = computed(() =>
  props.patches.filter((url) => loadedPatches.value.includes(url)),
)
/** The asked-for patches that can still be fetched, for the hidden loaders. */
const patchLoaders = computed(() =>
  props.patches.filter((url) => !failedPatches.value.includes(url)),
)
/** What waits for the patches to load: it runs when they have, or after `PATCH_WAIT_MS`. */
let patchWait: (() => void) | null = null
let patchTimer: ReturnType<typeof setTimeout> | undefined
const patchTimers: ReturnType<typeof setTimeout>[] = []

/** Whether every asked-for patch has loaded or failed. */
function patchesSettled(): boolean {
  return props.patches.every(
    (url) =>
      loadedPatches.value.includes(url) || failedPatches.value.includes(url),
  )
}

/** Run `then` once the patches have loaded (now, if they have), or after `PATCH_WAIT_MS` without them. */
function whenPatchesSettled(then: () => void, onWait?: () => void): void {
  clearTimeout(patchTimer)
  patchWait = null
  if (patchesSettled()) return then()
  onWait?.()
  const run = (): void => {
    clearTimeout(patchTimer)
    patchWait = null
    then()
  }
  patchWait = run
  patchTimer = setTimeout(run, PATCH_WAIT_MS)
}

watch([loadedPatches, failedPatches, () => props.patches], () => {
  if (patchWait && patchesSettled()) patchWait()
})

/** The patch at `url` has loaded. */
function onPatchLoaded(url: string): void {
  if (!loadedPatches.value.includes(url))
    loadedPatches.value = [...loadedPatches.value, url]
}

/** The patch at `url` cannot be fetched: it is left out, with no message. */
function onPatchMissing(url: string): void {
  if (!failedPatches.value.includes(url))
    failedPatches.value = [...failedPatches.value, url]
}

/** The patches come up with the picture, without a fade. */
function layPatchesStill(): void {
  for (const timer of patchTimers.splice(0)) clearTimeout(timer)
  layers.value = shown.value
    ? readyPatches.value.map((src) => ({ src, on: true, still: true }))
    : []
}

/** The story changed the room Elior stands in: patches fade in and out. */
function fadePatches(): void {
  if (!shown.value || shown.value !== props.src) return
  const wanted = readyPatches.value
  for (const layer of layers.value) {
    // A patch that came with the picture leaves with the slow fade too.
    layer.still = false
    if (!wanted.includes(layer.src)) layer.on = false
  }
  for (const src of wanted) {
    const layer = layers.value.find((l) => l.src === src)
    if (layer) {
      layer.on = true
      continue
    }
    layers.value.push({ src, on: false, still: false })
    // The reactive layer, so the change shows.
    const added = layers.value[layers.value.length - 1]
    patchTimers.push(
      setTimeout(() => {
        added.on = true
      }, PATCH_START_MS),
    )
  }
  patchTimers.push(
    setTimeout(() => {
      layers.value = layers.value.filter(
        (l) => l.on || readyPatches.value.includes(l.src),
      )
    }, PATCH_FADE_MS),
  )
}

watch(() => shown.value, layPatchesStill)
watch(readyPatches, fadePatches)

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
  if (waiting.value === null && shown.value === target) return
  // A picture not loaded yet (a skip) leaves the backdrop until it is, never the old room.
  clearTimeout(leaveTimer)
  leaving.value = ''
  shown.value = waiting.value ?? ''
  waiting.value = null
  if (shown.value === loading.value) loading.value = ''
}

/** The picture being loaded is ready: it fades in over the shown one, or waits for the dark. */
function onLoaded(): void {
  const next = loading.value
  if (scene.turn !== null) {
    waiting.value = next
    // The dark waits a little for the room's patches, so they are there as it rises.
    whenPatchesSettled(
      () => scene.targetReady(true),
      () => scene.awaitMore(PATCH_WAIT_MS * 2),
    )
    return
  }
  // The picture comes up with its patches, or without those that are slow.
  whenPatchesSettled(() => {
    if (loading.value !== next) return
    clearTimeout(leaveTimer)
    leaving.value = shown.value
    shown.value = loading.value
    loading.value = ''
    leaveTimer = setTimeout(() => {
      leaving.value = ''
    }, FADE_MS)
  })
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

onUnmounted(() => {
  clearTimeout(leaveTimer)
  clearTimeout(patchTimer)
  for (const timer of patchTimers) clearTimeout(timer)
})
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
    <img
      v-for="layer in layers"
      :key="layer.src"
      class="lq-pic lq-patch"
      :class="{ 'lq-patch-on': layer.on, 'lq-patch-still': layer.still }"
      :src="layer.src"
      alt=""
    />
    <img
      v-for="url in patchLoaders"
      :key="`patch-${url}`"
      class="lq-patch-loading"
      :src="url"
      alt=""
      @load="onPatchLoaded(url)"
      @error="onPatchMissing(url)"
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
.lq-patch {
  opacity: 0;
  transition: opacity calc(1.2s * var(--lq-motion)) ease;
  pointer-events: none;
}
.lq-patch-on {
  opacity: 1;
}
.lq-patch-still {
  transition: none;
}
.lq-loading,
.lq-patch-loading {
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
