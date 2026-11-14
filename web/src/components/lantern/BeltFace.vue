<script setup lang="ts">
import { useBeltPicture } from '@/composables/useBeltPicture'

/**
 * The face of a thing or spell: its picture once Content Studio has made it and
 * it has loaded, else what the slot holds (the first letter on the belt, the
 * bag sign or sparkle on a flight card). The picture is decorative, so it is
 * hidden from a screen reader; it replaces the slot with no fade. A picture
 * that is not made yet or fails to load leaves the slot as it is.
 */
const props = defineProps<{
  kind: 'item' | 'spell'
  /** The engine's name for the thing or spell. */
  name: string
  /** The class the picture carries, set by the place that shows it. */
  pictureClass: string
}>()
const url = useBeltPicture(
  () => props.kind,
  () => props.name,
)
</script>

<template>
  <img v-if="url" :src="url" :class="pictureClass" alt="" aria-hidden="true" />
  <slot v-else />
</template>
