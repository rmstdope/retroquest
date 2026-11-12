<script setup lang="ts">
import { useRoomTitleStore } from '@/stores/useRoomTitleStore'

/**
 * The room's title over the middle of the picture, like a title in a film:
 * "You are in" in small capitals over the room's name and a thin rule, light
 * serif with the soft dark glow of words written on the picture (dark ink on
 * the paper backdrop, `bare`). It fades in, and while it fades out the
 * corner's name fades in (`RoomPlate`); with reduced motion neither fades.
 * Presses pass through it to what is beneath, and it is not read aloud: the
 * room's name is read in the story. `useRoomTitleStore` says when it is up.
 */
const props = defineProps<{ bare?: boolean; small?: boolean }>()
const title = useRoomTitleStore()
</script>

<template>
  <Transition name="lq-room-title">
    <div
      v-if="title.name !== null"
      class="lq-room-title"
      :class="{
        'lq-room-title-bare': props.bare,
        'lq-room-title-small': props.small,
      }"
      data-testid="room-title"
      aria-hidden="true"
    >
      <span class="lq-room-title-kicker">You are in</span>
      <span class="lq-room-title-name">{{ title.name }}</span>
      <span class="lq-room-title-rule"></span>
    </div>
  </Transition>
</template>

<style scoped>
.lq-room-title {
  position: absolute;
  left: 10%;
  right: 10%;
  /* Its middle at 38% of the picture's height. */
  top: 38%;
  transform: translateY(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  pointer-events: none;
  color: var(--lq-picture-ink);
  text-shadow: var(--lq-picture-glow);
}
.lq-room-title-kicker {
  font-family: var(--lq-font-ui);
  font-size: 12px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}
.lq-room-title-name {
  font-family: var(--lq-font-display);
  font-size: calc(44px * var(--lq-display-scale));
  font-weight: 500;
  line-height: 1.15;
  overflow-wrap: anywhere;
}
.lq-room-title-small .lq-room-title-name {
  font-size: calc(28px * var(--lq-display-scale));
}
.lq-room-title-rule {
  width: 120px;
  height: 1px;
  margin-top: 4px;
  background: linear-gradient(
    90deg,
    transparent,
    rgb(255 230 180 / 0.8),
    transparent
  );
}
.lq-room-title-bare {
  color: var(--lq-fg);
  text-shadow: none;
}
.lq-room-title-enter-active {
  transition: opacity calc(0.6s * var(--lq-motion)) ease-out;
}
.lq-room-title-leave-active {
  transition: opacity calc(1.5s * var(--lq-motion)) ease-in;
}
.lq-room-title-enter-from,
.lq-room-title-leave-to {
  opacity: 0;
}
</style>
