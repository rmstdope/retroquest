<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useBeltPicture } from '@/composables/useBeltPicture'

/** How long the old picture takes to fade into the new one (ms), before reduced motion. */
const FADE_MS = 500

/**
 * The face of a thing or spell: its picture once Content Studio has made it and
 * it has loaded, else what the slot holds (the first letter on the belt, the
 * bag sign or sparkle on a flight card). The picture is decorative, so it is
 * hidden from a screen reader; it replaces the slot with no fade. A picture
 * that is not made yet or fails to load leaves the slot as it is. Where `fade`
 * is set, a change from one picture to another (a lantern lit, a bucket
 * filled) fades the old into the new over half a second and says `changed`, so
 * the place can glow once; loading, a different thing, reduced motion and a
 * state whose picture is not made all swap with no fade and no event.
 */
const props = defineProps<{
  kind: 'item' | 'spell'
  /** The engine's name for the thing or spell. */
  name: string
  /** The class the picture carries, set by the place that shows it. */
  pictureClass: string
  /** Fade between pictures when the state changes in play; off where a copy of the face is shown. */
  fade?: boolean
}>()
const emit = defineEmits<{
  /** The picture changed to another one, with the fade under way. */
  changed: []
}>()
const url = useBeltPicture(
  () => props.kind,
  () => props.name,
)
/** Whether the player chose reduced motion, which sets the page's `--lq-motion` to 0. */
function motionReduced(): boolean {
  const motion = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--lq-motion'),
  )
  return motion === 0
}
/** The picture fading out, while it does. */
const leaving = ref<string | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined
watch(url, (now, before) => {
  if (!props.fade || motionReduced() || !now || !before || now === before)
    return
  leaving.value = before
  emit('changed')
  clearTimeout(timer)
  timer = setTimeout(() => {
    leaving.value = null
  }, FADE_MS)
})
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <img
    v-if="leaving"
    :src="leaving"
    :class="[pictureClass, 'lq-face-out']"
    alt=""
    aria-hidden="true"
  />
  <img
    v-if="url"
    :src="url"
    :class="[pictureClass, { 'lq-face-in': leaving }]"
    alt=""
    aria-hidden="true"
  />
  <slot v-else />
</template>

<style scoped>
/* The old picture lies over the new and fades out; the new one fades in under it (instant at once under reduced motion, where --lq-motion is 0). */
.lq-face-out {
  position: absolute;
  inset: 0;
  animation: lq-face-out calc(500ms * var(--lq-motion, 1)) ease both;
}
.lq-face-in {
  animation: lq-face-in calc(500ms * var(--lq-motion, 1)) ease both;
}
@keyframes lq-face-out {
  to {
    opacity: 0;
  }
}
@keyframes lq-face-in {
  from {
    opacity: 0;
  }
}
</style>
