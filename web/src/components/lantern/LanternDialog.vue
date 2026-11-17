<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useFocusTrap } from '@/composables/useFocusTrap'
import KeyLine, { type KeyHint } from './KeyLine.vue'

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
 * actions instead). `wide` gives a body that needs room, like the map, a
 * panel at least 680px wide that grows to fit its body, up to the window
 * (on a phone it is the full-width sheet like any other). `centered` keeps
 * the panel in the middle of the screen on a phone too, as the pause menu
 * and the quit question are. `keyLine` is the quiet line of keys at the foot
 * (a keyboard player only). `startOnPanel` starts focus on the dialog itself,
 * so no ring shows (a screen with nothing to select). `scrollKeys` lets ↑ ↓
 * (a line), Page Up and Page Down (a page), Home and End scroll the body.
 * `glass` makes the panel a pane of frosted glass, as the title page's dock
 * is: the game shows blurred through it and through a lighter shade, the
 * panel is narrower and rounder, and it rises in as it opens (at once under
 * Reduce motion). It follows the theme like any other panel.
 */
const props = withDefaults(
  defineProps<{
    title: string
    eyebrow?: string
    closable?: boolean
    restoreFocus?: boolean
    wide?: boolean
    centered?: boolean
    keyLine?: KeyHint[]
    startOnPanel?: boolean
    scrollKeys?: boolean
    glass?: boolean
  }>(),
  {
    eyebrow: '',
    closable: true,
    restoreFocus: true,
    wide: false,
    centered: false,
    keyLine: () => [],
    startOnPanel: false,
    scrollKeys: false,
    glass: false,
  },
)
const emit = defineEmits<{ close: [] }>()
const titleId = useId()
const panel = ref<HTMLElement | null>(null)
const trap = useFocusTrap(panel)
const content = ref<HTMLElement | null>(null)

/** One line of scrolling, in pixels. */
const LINE = 40

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.stopPropagation()
    emit('close')
    return
  }
  if (props.scrollKeys && scroll(event)) return
  trap.onKeydown(event)
}

/** Scroll the body for a scroll key; true when the key was one. */
function scroll(event: KeyboardEvent): boolean {
  const body = content.value
  if (!body) return false
  const page = body.clientHeight * 0.9
  const by: Record<string, number> = {
    ArrowDown: LINE,
    ArrowUp: -LINE,
    PageDown: page,
    PageUp: -page,
  }
  if (event.key === 'Home') body.scrollTo?.({ top: 0 })
  else if (event.key === 'End') body.scrollTo?.({ top: body.scrollHeight })
  else if (event.key in by) body.scrollBy?.({ top: by[event.key] })
  else return false
  event.preventDefault()
  return true
}

function onBackdrop(): void {
  if (props.closable) emit('close')
  else trap.focusFirst()
}

let opener: HTMLElement | null = null
onMounted(() => {
  opener = document.activeElement as HTMLElement | null
  void nextTick(() =>
    props.startOnPanel
      ? panel.value?.focus({ preventScroll: true })
      : trap.focusFirst(),
  )
})
onBeforeUnmount(() => {
  if (props.restoreFocus && opener?.isConnected) opener.focus()
})

defineExpose({ focusFirst: trap.focusFirst })
</script>

<template>
  <div
    class="lq-dialog-layer"
    :class="{ 'lq-dialog-centered': centered, 'lq-dialog-glass': glass }"
  >
    <div class="lq-dialog-scrim" aria-hidden="true" @click="onBackdrop"></div>
    <section
      ref="panel"
      class="lq-dialog-panel"
      :class="{ 'lq-dialog-wide': wide }"
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
      <div ref="content" class="lq-dialog-content">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="lq-dialog-foot">
        <slot name="footer" />
      </footer>
      <KeyLine v-if="keyLine.length" class="lq-dialog-keys" :hints="keyLine" />
    </section>
  </div>
</template>

<style scoped>
.lq-dialog-layer {
  position: fixed;
  inset: 0;
  z-index: var(--lq-z-page-dialogs);
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
.lq-dialog-wide {
  width: auto;
  min-width: min(680px, 100%);
  max-width: 100%;
}
/* A wide body keeps room for its scrollbar, so it never also scrolls sideways. */
.lq-dialog-wide .lq-dialog-content {
  scrollbar-gutter: stable;
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
  /* Room for the 6px reach of the cream ring when a row is scrolled to an edge. */
  scroll-padding-block: 10px;
}
.lq-dialog-keys {
  flex: 0 0 auto;
  padding: 0 22px 12px;
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
  .lq-dialog-wide {
    width: 100%;
    min-width: 0;
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
/* The pause menu and the quit question stay in the middle on a phone, too. */
@media (max-width: 639px) {
  .lq-dialog-layer.lq-dialog-centered {
    align-items: center;
    padding: 16px;
  }
  .lq-dialog-centered .lq-dialog-panel {
    max-height: 84dvh;
    border: 1px solid var(--lq-accent-line);
    border-radius: 18px;
    box-shadow: 0 30px 60px rgb(0 0 0 / 0.45);
  }
  .lq-dialog-centered .lq-dialog-grabber {
    display: none;
  }
  .lq-dialog-centered .lq-dialog-head {
    padding: 18px 16px 14px 22px;
  }
  .lq-dialog-centered .lq-dialog-title {
    font-size: calc(24px * var(--lq-display-scale));
  }
  .lq-dialog-centered .lq-dialog-content {
    padding: 18px 22px 22px;
  }
  .lq-dialog-centered .lq-dialog-foot {
    padding: 10px 22px 14px;
  }
}
/* A pane of frosted glass, as on the title page: the game shows through, blurred. */
.lq-dialog-glass .lq-dialog-scrim {
  background: rgb(5 8 11 / 0.42);
}
.lq-dialog-glass .lq-dialog-panel {
  max-width: 420px;
  border: 1px solid color-mix(in srgb, var(--lq-fg) 16%, transparent);
  border-radius: 22px;
  background: color-mix(in srgb, var(--lq-surface) 62%, transparent);
  backdrop-filter: blur(18px) saturate(1.3);
  box-shadow:
    0 20px 60px rgb(0 0 0 / 0.45),
    inset 0 1px 0 rgb(255 255 255 / 0.08);
  animation: lq-dialog-rise calc(0.24s * var(--lq-motion)) ease-out;
}
.lq-dialog-glass .lq-dialog-head {
  padding-bottom: 4px;
  border-bottom: none;
}
.lq-dialog-glass .lq-dialog-content {
  padding-top: 14px;
}
@keyframes lq-dialog-rise {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
}
</style>
