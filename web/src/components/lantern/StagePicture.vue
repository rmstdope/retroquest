<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useReducedMotion } from '@/composables/useReducedMotion'
import type { MotionSpec } from '@/lantern/roomMotion'
import {
  createMotionScene,
  type MotionScene,
  type PictureSize,
} from '@/lantern/roomMotionScene'
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
 * picture waits (up to a second, counted from the dark of a change of scene,
 * never during the fade-out) for the ones still loading. A load (the scene
 * store is reset) lays the saved story's patches the same way, in the
 * room Elior already stands in too. When the story changes the room Elior stands in, a patch
 * fades in or out slowly (a little over a second, at once under Reduce motion);
 * a patch that cannot be fetched is left out, and one that is slow fades in
 * when it comes. Nothing of the next room's patches shows over the old picture.
 * The picture, its patches and the movement over it drift together: they
 * ease slowly in and back (about 26 seconds each way, to about 3% larger),
 * afresh with each room, and whatever is put in the default slot (the
 * clickable things) drifts with them and stays exactly on what it marks. The
 * movement (`motion`, see `roomMotion.ts`) is drawn on a canvas over the
 * picture and its patches, under the dimming and the dark of a change of
 * scene, so it goes into the dark with the picture; a room entered is run
 * ahead, so it is already under way as the dark lifts, and what the story
 * changes in the room Elior stands in fades out and in (about a second). A
 * movement whose spot has no placed box is simply not in `motion`. Under
 * Reduce motion there is neither drift nor canvas, as the room looked before.
 * It says (`pictured`) whether a picture is up or only the backdrop, for the
 * text told over it. Purely decorative: hidden from assistive technology, and
 * nothing in it takes a click or the keyboard.
 */
const props = withDefaults(
  defineProps<{
    src: string
    patches?: string[]
    motion?: MotionSpec[]
    pictureSize?: PictureSize
  }>(),
  {
    patches: () => [],
    motion: () => [],
    pictureSize: () => ({ width: 1920, height: 1080 }),
  },
)
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
  /** Laid at nothing, and about to start its fade in (its start timer is running). */
  starting?: boolean
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

/**
 * Run `then` once the patches have loaded (now, if they have), or after
 * `PATCH_WAIT_MS` without them. With `inTheDark`, that second is counted from
 * the moment the stage is dark (the change of scene), not from now.
 */
function whenPatchesSettled(
  then: () => void,
  onWait?: () => void,
  inTheDark = false,
): void {
  clearTimeout(patchTimer)
  patchTimer = undefined
  patchWait = null
  if (patchesSettled()) return then()
  onWait?.()
  const turn = scene.turn
  const run = (): void => {
    clearTimeout(patchTimer)
    patchTimer = undefined
    patchWait = null
    // A change of scene that ended (skipped) or gave way to another is not this wait's.
    if (inTheDark && scene.turn !== turn) return
    then()
  }
  patchWait = run
  if (!inTheDark || scene.phase === 'dark') startPatchTimer()
}

/** Start counting the second the picture waits for its patches. */
function startPatchTimer(): void {
  if (patchWait && patchTimer === undefined)
    patchTimer = setTimeout(patchWait, PATCH_WAIT_MS)
}

// The second a room waits for its patches in a change of scene is spent in the dark.
watch(
  () => scene.phase,
  (phase) => {
    if (phase === 'dark') startPatchTimer()
  },
)

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

/** Whether the stage has just been started afresh (a load): the room's patches are laid, not faded. */
let restoring = false
let restoreTimer: ReturnType<typeof setTimeout> | undefined

// A load (the scene store is reset): what the saved story has changed is already there.
watch(
  () => scene.shown === null,
  (reset) => {
    if (!reset) return
    restoring = true
    // The load is over after a second at the latest, or once its patches are laid.
    clearTimeout(restoreTimer)
    restoreTimer = setTimeout(() => {
      restoring = false
    }, PATCH_WAIT_MS)
  },
  { flush: 'sync' },
)

/** The story changed the room Elior stands in: patches fade in and out. */
function fadePatches(): void {
  if (!shown.value || shown.value !== props.src) return
  if (restoring) {
    layPatchesStill()
    // The load's patches are laid: the next change is the story's.
    if (patchesSettled()) restoring = false
    return
  }
  const wanted = readyPatches.value
  for (const layer of layers.value) {
    // A patch that came with the picture leaves with the slow fade too.
    layer.still = false
    if (!wanted.includes(layer.src)) layer.on = false
  }
  for (const src of wanted) {
    const layer = layers.value.find((l) => l.src === src)
    if (layer) {
      // A patch laid a moment ago keeps its start: turning it on now would skip its fade.
      if (!layer.starting) layer.on = true
      continue
    }
    layers.value.push({ src, on: false, still: false, starting: true })
    // The reactive layer, so the change shows.
    const added = layers.value[layers.value.length - 1]
    patchTimers.push(
      setTimeout(() => {
        added.starting = false
        added.on = readyPatches.value.includes(added.src)
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
      true,
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

const reduced = useReducedMotion()
const root = ref<HTMLElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)
/** Whether the canvas is on the page: movement applies (or is still fading out), a picture is up and motion is not reduced. */
const canvasUp = ref(false)
let motionScene: MotionScene = createMotionScene()
let frame = 0
let lastFrame = 0
let observer: ResizeObserver | undefined

/** Tell the scene how big the canvas is, and the canvas how many pixels to have. */
function sizeCanvas(): void {
  const el = canvasEl.value
  if (!el || el.clientWidth === 0 || el.clientHeight === 0) return
  const ratio = Math.min(2, globalThis.devicePixelRatio || 1)
  el.width = Math.round(el.clientWidth * ratio)
  el.height = Math.round(el.clientHeight * ratio)
  motionScene.resize(el.clientWidth, el.clientHeight, props.pictureSize)
}

/** One frame: move the scene on and draw it; the loop ends when there is nothing left to show. */
function drawFrame(now: number): void {
  frame = 0
  const el = canvasEl.value
  if (!el || reduced.value) return
  const ms = lastFrame ? Math.min(100, now - lastFrame) : 1000 / 60
  lastFrame = now
  motionScene.step(ms)
  const ctx = el.getContext('2d')
  if (ctx) {
    const ratio = el.width / Math.max(1, el.clientWidth)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    motionScene.draw(ctx)
  }
  if (props.motion.length === 0 && motionScene.isEmpty()) {
    canvasUp.value = false
    return
  }
  frame = requestAnimationFrame(drawFrame)
}

/** Start the frames if there is a canvas and none are running. */
function startFrames(): void {
  if (frame || !canvasEl.value || typeof requestAnimationFrame !== 'function')
    return
  lastFrame = 0
  frame = requestAnimationFrame(drawFrame)
}

/**
 * Bring the scene in step with the room and the story. Only the picture that
 * is up is moved over: the old room keeps its own movement until the dark. A
 * new picture (or Reduce motion turned off) starts a scene afresh, run ahead.
 */
function syncMotion(fresh: boolean): void {
  if (reduced.value || !shown.value || shown.value !== props.src) {
    if (reduced.value || !shown.value) stopMotion()
    return
  }
  if (fresh) {
    motionScene = createMotionScene()
    sizeCanvas()
  }
  motionScene.setEffects(props.motion, fresh)
  canvasUp.value = props.motion.length > 0 || !motionScene.isEmpty()
  startFrames()
}

/** Take the movement off the page at once. */
function stopMotion(): void {
  cancelAnimationFrame(frame)
  frame = 0
  canvasUp.value = false
  motionScene = createMotionScene()
}

watch(shown, () => syncMotion(true), { flush: 'post' })
watch(
  () => props.motion,
  () => syncMotion(false),
  { flush: 'post' },
)
watch(reduced, (now) => (now ? stopMotion() : syncMotion(true)), {
  flush: 'post',
})
watch(
  canvasEl,
  (el) => {
    observer?.disconnect()
    if (!el) return
    sizeCanvas()
    if (typeof ResizeObserver === 'function' && root.value) {
      observer = new ResizeObserver(sizeCanvas)
      observer.observe(root.value)
    }
    startFrames()
  },
  { flush: 'post' },
)
watch(() => props.pictureSize, sizeCanvas, { flush: 'post' })

onUnmounted(() => {
  cancelAnimationFrame(frame)
  observer?.disconnect()
  clearTimeout(leaveTimer)
  clearTimeout(patchTimer)
  clearTimeout(restoreTimer)
  for (const timer of patchTimers) clearTimeout(timer)
})
</script>

<template>
  <div ref="root" class="lq-stage-picture" :class="`lq-scene-${scene.phase}`">
    <div class="lq-backdrop" aria-hidden="true"></div>
    <img
      v-if="leaving && leaving !== shown"
      :key="`out-${leaving}`"
      class="lq-pic"
      :src="leaving"
      alt=""
    />
    <div
      :key="`drift-${shown}`"
      class="lq-drift"
      :class="{ 'lq-drift-on': shown && !reduced }"
    >
      <img
        v-if="shown"
        :key="`in-${shown}`"
        class="lq-pic lq-pic-in"
        :src="shown"
        alt=""
      />
      <img
        v-for="layer in layers"
        :key="layer.src"
        class="lq-pic lq-patch"
        :class="{ 'lq-patch-on': layer.on, 'lq-patch-still': layer.still }"
        :src="layer.src"
        alt=""
      />
      <canvas
        v-if="canvasUp"
        ref="canvasEl"
        class="lq-motion"
        aria-hidden="true"
      ></canvas>
      <slot></slot>
    </div>
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
      v-for="url in patchLoaders"
      :key="`patch-${url}`"
      class="lq-patch-loading"
      :src="url"
      alt=""
      @load="onPatchLoaded(url)"
      @error="onPatchMissing(url)"
    />
    <div class="lq-dim" aria-hidden="true"></div>
    <div class="lq-veil" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
.lq-stage-picture {
  position: absolute;
  inset: 0;
  z-index: -1;
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
.lq-drift {
  /* What is put in the slot stays under the dim and the veil. */
  isolation: isolate;
  position: absolute;
  inset: 0;
}
.lq-drift-on {
  animation: lq-drift 26s ease-in-out infinite alternate;
}
.lq-motion {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
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
@keyframes lq-drift {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.03) translate(-0.5%, -0.3%);
  }
}
@keyframes lq-picture-in {
  from {
    opacity: 0;
  }
}
</style>
