<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useSizeWatch } from '@/composables/useSizeWatch'
import type { MotionSpec } from '@/lantern/roomMotion'
import {
  createMotionScene,
  type MotionScene,
  type PictureSize,
} from '@/lantern/roomMotionScene'

/**
 * The movement over the title page's painting: a canvas that fills its box,
 * where the painting `src` is shown trimmed to fill it, and on which the
 * effects the team tuned for the title picture (`motion`, see
 * `roomMotion.ts`) are drawn, under way from the first frame. The canvas is
 * the page's scenery and nothing more: hidden from assistive technology,
 * taking no click and no key. With no movement there is no canvas, and under
 * Reduce motion the canvas goes at once (and comes back, run afresh, when it
 * is switched off). The painting is also loaded here as an image, for the
 * effects that redraw it (pond ripples); until it has loaded they draw nothing.
 */
const props = withDefaults(
  defineProps<{
    motion: MotionSpec[]
    src: string
    pictureSize?: PictureSize
  }>(),
  { pictureSize: () => ({ width: 1920, height: 1080 }) },
)

const reduced = useReducedMotion()
const canvasEl = ref<HTMLCanvasElement | null>(null)
let scene: MotionScene = createMotionScene()
let frame = 0
let lastFrame = 0
let picture: HTMLImageElement | null = null
const sizeWatch = useSizeWatch(sizeCanvas, { inReport: true })

/** Tell the canvas how many pixels to have and the scene how big the canvas is. */
function sizeCanvas(): void {
  const el = canvasEl.value
  if (!el || el.clientWidth === 0 || el.clientHeight === 0) return
  const ratio = Math.min(2, globalThis.devicePixelRatio || 1)
  el.width = Math.round(el.clientWidth * ratio)
  el.height = Math.round(el.clientHeight * ratio)
  scene.resize(el.clientWidth, el.clientHeight, props.pictureSize)
}

/** One frame: move the scene on and draw it. */
function drawFrame(now: number): void {
  frame = 0
  const el = canvasEl.value
  if (!el || reduced.value) return
  const ms = lastFrame ? Math.min(100, now - lastFrame) : 1000 / 60
  lastFrame = now
  scene.step(ms)
  const ctx = el.getContext('2d')
  if (ctx) {
    const ratio = el.width / Math.max(1, el.clientWidth)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    scene.draw(ctx)
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

/** Take the movement away at once. */
function stopFrames(): void {
  cancelAnimationFrame(frame)
  frame = 0
}

/** Hand the scene the effects, run ahead so they are under way from the first frame. */
function setUp(): void {
  scene = createMotionScene()
  sizeCanvas()
  scene.setSource(
    picture && picture.complete && picture.naturalWidth > 0
      ? {
          image: picture,
          width: picture.naturalWidth,
          height: picture.naturalHeight,
        }
      : null,
  )
  scene.setEffects(props.motion, true)
}

/** Load the painting for the effects that redraw it. */
function loadPicture(): void {
  picture = null
  if (typeof Image !== 'function' || !props.src) return
  const image = new Image()
  image.onload = () => {
    if (picture !== image) return
    scene.setSource({
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
    })
  }
  picture = image
  image.src = props.src
}

watch(
  () => props.src,
  () => {
    loadPicture()
    if (canvasEl.value) setUp()
  },
  { immediate: true },
)
watch(
  () => props.motion,
  () => {
    if (canvasEl.value) scene.setEffects(props.motion, true)
  },
)
watch(() => props.pictureSize, sizeCanvas)
watch(reduced, (now) => (now ? stopFrames() : undefined))
watch(
  canvasEl,
  (el) => {
    sizeWatch.retarget(...(el ? [el] : []))
    if (!el) {
      stopFrames()
      return
    }
    setUp()
    startFrames()
  },
  { flush: 'post' },
)

onBeforeUnmount(stopFrames)
</script>

<template>
  <canvas
    v-if="motion.length > 0 && !reduced"
    ref="canvasEl"
    class="lq-title-motion"
    aria-hidden="true"
  ></canvas>
</template>

<style scoped>
.lq-title-motion {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
