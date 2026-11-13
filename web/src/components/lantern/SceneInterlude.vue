<script setup lang="ts">
import { ref } from 'vue'
import { useSceneStore } from '@/stores/useSceneStore'
import { useReadAlong } from '@/composables/useReadAlong'

/**
 * The paragraph that tells a move (the dream's "The dark lets go of you…"),
 * told in the middle of the dark between the old picture and the new one
 * (`useSceneStore`'s interlude): light serif with the soft dark glow of words
 * on the picture, the spoken word lit while the narrator reads it, and the
 * hint under it. It fades in as the dark is reached and slowly out once it
 * is read, still in the dark, before the new picture rises. Presses pass
 * through to the stage, where a click (or Enter) ends it the same way: its
 * words fade, then the new room rises. The paragraph is also in the story, which
 * keeps it; the layer is a polite live region for screen readers.
 */
const props = defineProps<{ phone?: boolean }>()
const scene = useSceneStore()
const root = ref<HTMLElement | null>(null)
const { html } = useReadAlong(() => scene.interlude?.turn ?? 0, root)
</script>

<template>
  <div ref="root" class="lq-interlude-layer" aria-live="polite">
    <Transition name="lq-interlude">
      <div
        v-if="scene.interlude"
        :key="`${scene.interlude.turn}-${scene.interlude.unit}`"
        class="lq-interlude"
        data-testid="scene-interlude"
      >
        <!-- eslint-disable vue/no-v-html -->
        <p
          class="lq-interlude-text"
          :data-unit="scene.interlude.unit"
          v-html="html(scene.interlude.markup, scene.interlude.unit)"
        ></p>
        <!-- eslint-enable vue/no-v-html -->
        <p class="lq-interlude-hint">
          {{
            props.phone
              ? 'Tap to continue · Hold to skip'
              : 'Click to continue · Hold to skip'
          }}
        </p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.lq-interlude-layer {
  position: absolute;
  inset: 0;
  /* Above the words over the picture (z-index 2); presses go through. */
  z-index: 3;
  pointer-events: none;
}
.lq-interlude {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 72px 24px 140px;
  text-align: center;
  color: var(--lq-picture-ink);
  text-shadow: var(--lq-picture-glow);
  /* Names and other tags keep the dark theme's light colours in the dark. */
  --lq-fg: #ece6d6;
  --lq-muted: #a39d8e;
}
.lq-interlude-text {
  max-width: 760px;
  margin: 0;
  font-family: var(--lq-font-prose);
  font-size: calc(22px * var(--lq-text-scale, 1));
  line-height: 1.5;
}
.lq-interlude :deep(.lq-w-now) {
  background: rgb(242 158 0 / 0.45);
  border-radius: 3px;
  box-shadow: 0 0 0 2px rgb(242 158 0 / 0.45);
}
.lq-interlude-hint {
  margin: 0;
  padding: 4px 12px;
  border-radius: 12px;
  background: rgb(10 10 10 / 0.6);
  font-family: var(--lq-font-ui);
  font-size: 12px;
  color: #d8d0c0;
  text-shadow: none;
}
.lq-interlude-enter-active {
  transition: opacity calc(0.6s * var(--lq-motion)) ease;
}
/* Slowly, in the dark: the new picture rises only once the words are gone (INTERLUDE_FADE_MS). */
.lq-interlude-leave-active {
  transition: opacity calc(1.2s * var(--lq-motion)) ease-in;
}
.lq-interlude-enter-from,
.lq-interlude-leave-to {
  opacity: 0;
}
</style>
