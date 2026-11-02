<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { speakerColor } from '@/lantern/stageSpeech'

/**
 * A speaker's small round portrait beside their first line: the face cut from
 * the top of the upright portrait file. Until the file is there (none are
 * made yet, or it fails to load) a circle in the character's
 * own steady colour shows their initial in white instead. Decorative: the
 * words are in the story band.
 */
const props = defineProps<{
  /** The name the game shows for the speaker. */
  name: string
  /** The portrait's URL, or '' when the character has none. */
  src: string
}>()

/** The file is missing or broken. */
const failed = ref(false)
/** The file has loaded, so it can cover the circle. */
const loaded = ref(false)
watch(
  () => props.src,
  () => {
    failed.value = false
    loaded.value = false
  },
)

const initial = computed(() => props.name.trim().charAt(0).toUpperCase())
</script>

<template>
  <div class="lq-portrait" data-testid="portrait">
    <div
      class="lq-card"
      :style="{ background: speakerColor(name) }"
      data-testid="portrait-card"
    >
      <span class="lq-initial">{{ initial }}</span>
    </div>
    <img
      v-if="src && !failed"
      :key="src"
      class="lq-face"
      :class="{ 'lq-face-loaded': loaded }"
      :src="src"
      alt=""
      @load="loaded = true"
      @error="failed = true"
    />
  </div>
</template>

<style scoped>
/* A fixed size (46px, or what `--lq-portrait` says: 32px on the phone's column): the portrait does not scale with the window. */
.lq-portrait {
  position: relative;
  flex: none;
  width: var(--lq-portrait, 46px);
  height: var(--lq-portrait, 46px);
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  box-sizing: border-box;
}
.lq-card {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}
.lq-initial {
  font-family: var(--lq-font-display);
  font-weight: 600;
  font-size: 20px;
  color: #fff;
}
.lq-face {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
  opacity: 0;
  transition: opacity calc(0.25s * var(--lq-motion)) ease-out;
}
.lq-face-loaded {
  opacity: 1;
}
</style>
