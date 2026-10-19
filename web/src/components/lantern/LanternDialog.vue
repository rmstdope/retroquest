<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useFocusTrap } from '@/composables/useFocusTrap'

/**
 * The Lantern dialog frame: centred on laptops, a bottom sheet on phones
 * (under 640px wide, with a grabber). The header (eyebrow, title, close)
 * stays put while the body scrolls; buttons go in the footer slot. Focus
 * stays inside while it is open; Escape, the close button and the backdrop
 * emit `close` (the backdrop only when there is a close button: a game
 * pop-up goes on with its own button or Escape, not a stray tap, which
 * just puts focus back in the dialog). Focus starts on an element marked
 * `data-autofocus`, else on the first focusable one, else on the dialog
 * itself (it takes focus when its text is clicked, so Escape and Tab keep
 * working). On close it gives focus back to what had it when it opened,
 * unless `restoreFocus` is off (the game's own pop-ups send it to the
 * actions instead).
 */
const props = withDefaults(
  defineProps<{
    title: string
    eyebrow?: string
    closable?: boolean
    restoreFocus?: boolean
  }>(),
  { eyebrow: '', closable: true, restoreFocus: true },
)
const emit = defineEmits<{ close: [] }>()
const titleId = useId()
const panel = ref<HTMLElement | null>(null)
const trap = useFocusTrap(panel)

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.stopPropagation()
    emit('close')
    return
  }
  trap.onKeydown(event)
}

function onBackdrop(): void {
  if (props.closable) emit('close')
  else trap.focusFirst()
}

let opener: HTMLElement | null = null
onMounted(() => {
  opener = document.activeElement as HTMLElement | null
  void nextTick(trap.focusFirst)
})
onBeforeUnmount(() => {
  if (props.restoreFocus && opener?.isConnected) opener.focus()
})

defineExpose({ focusFirst: trap.focusFirst })
</script>

<template>
  <div class="lq-dialog-layer">
    <div class="lq-dialog-scrim" aria-hidden="true" @click="onBackdrop"></div>
    <section
      ref="panel"
      class="lq-dialog-panel"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      :aria-labelledby="titleId"
      @keydown="onKeydown"
    >
      <div class="lq-dialog-grabber" aria-hidden="true"></div>
      <header class="lq-dialog-head">
        <div class="lq-dialog-heading">
          <span v-if="eyebrow" class="lq-dialog-eyebrow">{{ eyebrow }}</span>
          <h2 :id="titleId" class="lq-dialog-title">{{ title }}</h2>
        </div>
        <button
          v-if="closable"
          type="button"
          class="lq-dialog-close"
          aria-label="Close"
          @click="emit('close')"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>
      <div class="lq-dialog-content">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="lq-dialog-foot">
        <slot name="footer" />
      </footer>
    </section>
  </div>
</template>

<style scoped>
.lq-dialog-layer {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.lq-dialog-scrim {
  position: absolute;
  inset: 0;
  background: rgb(5 8 11 / 0.72);
}
.lq-dialog-panel {
  position: relative;
  width: 100%;
  max-width: 560px;
  max-height: 84vh;
  max-height: 84dvh;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  border: 1px solid var(--lq-accent-line);
  background: var(--lq-surface);
  color: var(--lq-fg);
  font-family: var(--lq-font-ui);
  box-shadow: 0 30px 60px rgb(0 0 0 / 0.45);
}
/* Not a Tab stop: it only holds focus when nothing inside can. */
.lq-dialog-panel:focus {
  outline: none;
}
.lq-dialog-grabber {
  display: none;
}
.lq-dialog-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px 14px 22px;
  border-bottom: 1px solid var(--lq-line);
}
.lq-dialog-heading {
  flex: 1;
  min-width: 0;
}
.lq-dialog-eyebrow {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--lq-accent-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lq-dialog-title {
  margin: 2px 0 0;
  font-family: var(--lq-font-display);
  font-size: calc(24px * var(--lq-display-scale));
  font-weight: 500;
  line-height: 1.15;
  overflow-wrap: anywhere;
}
.lq-dialog-close {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 22px;
  background: transparent;
  color: var(--lq-muted);
  cursor: pointer;
}
.lq-dialog-content {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 22px 22px;
}
.lq-dialog-foot {
  flex: 0 0 auto;
  padding: 10px 22px 14px;
  border-top: 1px solid var(--lq-line);
}
/* Phones: a bottom sheet with a grabber. */
@media (max-width: 639px) {
  .lq-dialog-layer {
    align-items: flex-end;
    padding: 0;
  }
  .lq-dialog-panel {
    max-width: none;
    max-height: 90dvh;
    border: none;
    border-top: 1px solid var(--lq-accent-line);
    border-radius: 18px 18px 0 0;
    box-shadow: 0 -20px 40px rgb(0 0 0 / 0.45);
  }
  .lq-dialog-grabber {
    display: block;
    flex: 0 0 auto;
    width: 36px;
    height: 4px;
    margin: 8px auto 0;
    border-radius: 2px;
    background: var(--lq-line2);
  }
  .lq-dialog-head {
    padding: 10px 12px 12px 16px;
  }
  .lq-dialog-title {
    font-size: calc(21px * var(--lq-display-scale));
  }
  .lq-dialog-content {
    padding: 14px 16px 16px;
  }
  .lq-dialog-foot {
    padding: 10px 16px calc(14px + env(safe-area-inset-bottom));
  }
}
</style>
