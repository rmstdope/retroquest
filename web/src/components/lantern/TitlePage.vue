<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId } from 'vue'
import { parseTitle } from '@/lantern/parseTitle'
import { useFocusTrap } from '@/composables/useFocusTrap'

/**
 * The game's title page, before the first act: the RetroQuest ASCII art
 * (scaled to the screen, hidden from screen readers, who hear the title),
 * the music credits and Start. Enter on Start or Escape goes on.
 */
const props = defineProps<{ text: string }>()
const emit = defineEmits<{ start: [] }>()
const titleId = useId()
const page = ref<HTMLElement | null>(null)
const trap = useFocusTrap(page)
const screen = computed(() => parseTitle(props.text))

/** A credit line as text, or as a link when it names a web address. */
function credit(line: string): { text: string; href: string | null } {
  const url = /(https?:\/\/\S+)/.exec(line)?.[1] ?? null
  return { text: line, href: url }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.stopPropagation()
    emit('start')
  } else trap.onKeydown(event)
}

onMounted(() => nextTick(trap.focusFirst))
</script>

<template>
  <section
    ref="page"
    class="lq-title-page"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    tabindex="-1"
    @keydown="onKeydown"
  >
    <div class="lq-title-inner">
      <span class="lq-welcome">Welcome to</span>
      <h2 :id="titleId" class="lq-sr-only">RetroQuest</h2>
      <pre v-if="screen.art" class="lq-art" aria-hidden="true">{{
        screen.art
      }}</pre>
      <p v-if="screen.credits.length" class="lq-credits">
        <span class="lq-credits-label">Music</span>
        <template v-for="(line, index) in screen.credits" :key="index">
          <a
            v-if="credit(line).href"
            :href="credit(line).href!"
            target="_blank"
            rel="noopener"
            >{{ line }}</a
          >
          <span v-else>{{ line }}</span>
        </template>
      </p>
      <button
        type="button"
        class="lq-title-start"
        data-autofocus
        @click="emit('start')"
      >
        Start
      </button>
    </div>
  </section>
</template>

<style scoped>
.lq-title-page {
  position: fixed;
  inset: 0;
  z-index: 70;
  overflow-y: auto;
  display: flex;
  background: var(--lq-bg);
  color: var(--lq-fg);
  font-family: var(--lq-font-ui);
}
.lq-title-page:focus {
  outline: none;
}
.lq-title-inner {
  width: 100%;
  max-width: 760px;
  margin: auto;
  padding: 40px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  text-align: center;
}
.lq-welcome {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--lq-muted);
}
/* About 100 characters wide: scale the type to the screen. */
.lq-art {
  margin: 0;
  max-width: 100%;
  overflow: hidden;
  font-family: var(--lq-font-mono, monospace);
  font-size: min(12px, calc((100vw - 32px) / 62));
  line-height: 1.15;
  color: var(--lq-accent-text);
}
.lq-credits {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  color: var(--lq-muted);
}
.lq-credits-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.lq-credits a {
  color: var(--lq-accent-text);
}
.lq-title-start {
  min-width: 200px;
  height: 52px;
  padding: 0 28px;
  border: none;
  border-radius: 12px;
  background: var(--lq-accent);
  color: var(--lq-on-accent);
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.lq-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
