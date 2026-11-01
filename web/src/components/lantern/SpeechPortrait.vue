<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { speakerColor } from '@/lantern/stageSpeech'

/**
 * A speaker's portrait at the edge of the picture: upright (3:4), with the
 * name across its foot. Until the portrait file is there (none are made yet,
 * Elior has none, or it fails to load) a card of the same size in the
 * character's own steady colour shows their initial instead. The side that is
 * not speaking is dimmed. Decorative: the words are in the story band.
 */
const props = defineProps<{
  /** The name the game shows for the speaker. */
  name: string
  /** The portrait's URL, or '' when the character has none. */
  src: string
  /** Whether this side is not the one speaking. */
  dim: boolean
}>()

/** The file is missing or broken. */
const failed = ref(false)
/** The file has loaded, so it can cover the card. */
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
  <div class="lq-portrait" :class="{ 'lq-dim': dim }" data-testid="portrait">
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
    <div class="lq-foot">{{ name }}</div>
  </div>
</template>

<style scoped>
.lq-portrait {
  position: relative;
  width: var(--lq-portrait-w);
  height: calc(var(--lq-portrait-w) * 4 / 3);
  border-radius: 12px;
  border: 3px solid var(--lq-surface);
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  transition: opacity calc(0.25s * var(--lq-motion)) ease-out;
}
.lq-dim {
  opacity: 0.55;
  filter: saturate(0.6);
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
  font-size: calc(var(--lq-portrait-w) * 0.42);
  color: #fff;
}
.lq-face {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity calc(0.25s * var(--lq-motion)) ease-out;
}
.lq-face-loaded {
  opacity: 1;
}
.lq-foot {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 5px 8px;
  background: rgba(20, 16, 10, 0.6);
  color: #fff8e8;
  font-family: var(--lq-font-ui);
  font-size: calc(13px * var(--lq-text-scale));
  font-weight: 700;
  overflow-wrap: anywhere;
}
</style>
