<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  fanLayout,
  FAN_PILL,
  RING_BUTTON,
  ringLayout,
  sayCommand,
  type Point,
  type HandVerb,
  type RingAction,
  type RingSubject,
} from '@/lantern/pressRing'

/**
 * The ring of round action buttons round a thing or person pressed on the
 * picture, with its name in the middle in its usual colour. `at` is the spot
 * pressed and `bounds` the picture, both in the layer's pixels; the ring
 * slides inward to stay inside. Pressing an action that has second choices
 * (Use with…, Give…, Cast on…, Buy…) lights it, dims the others and fans the
 * choices out as name pills on its outer side; Say… opens a words box. A
 * command is sent with `pick` and nothing else is sent or saved. Escape steps
 * back (fan or box to the ring, ring closed, with `close(true)`); Tab closes;
 * a press anywhere outside closes and nothing else happens with it. Arrow
 * keys go round the ring and up and down a fan; focus lands on the first
 * action when it opens. The ring may be round a carried thing or spell on
 * the belt (`RingSubject`, a spell in purple); an action that takes it in hand
 * (Use with…, Give…, Cast on…) says `hand` with its verb and sends nothing.
 * Reduce motion is carried by `--lq-motion`.
 */
const props = defineProps<{
  thing: RingSubject
  actions: RingAction[]
  at: Point
  bounds: { w: number; h: number }
}>()
const emit = defineEmits<{
  pick: [command: string]
  hand: [verb: HandVerb]
  close: [byKey: boolean]
}>()

const root = ref<HTMLElement | null>(null)
/** The action whose choices or words box are shown. */
const openedId = ref<string | null>(null)
const opened = computed<RingAction | null>(
  () => props.actions.find((a) => a.id === openedId.value) ?? null,
)
const words = ref('')
const wordsBox = ref<HTMLInputElement | null>(null)
const layout = computed(() =>
  ringLayout(props.at, props.actions.length, props.bounds),
)
const fan = computed(() => {
  const action = opened.value
  if (!action) return null
  const index = props.actions.findIndex((a) => a.id === action.id)
  const from = layout.value.buttons[index]
  if (!from) return null
  return fanLayout(
    from,
    action.say ? 1 : (action.choices?.length ?? 0),
    props.bounds,
    layout.value.center,
  )
})
const fanStyle = computed(() => {
  const f = fan.value
  if (!f) return {}
  return {
    top: `${f.top}px`,
    maxHeight: `${f.height}px`,
    ...(f.side === 'right'
      ? { left: `${f.x}px` }
      : { right: `${props.bounds.w - f.x}px` }),
  }
})

/** The buttons of the ring, or the pills of the fan that is open. */
function stops(): HTMLElement[] {
  const scope = opened.value
    ? root.value?.querySelector('.lq-ring-fan')
    : root.value
  return [
    ...(scope?.querySelectorAll<HTMLElement>(
      opened.value ? '[role="menuitem"]' : '.lq-ring-coin',
    ) ?? []),
  ]
}

/** Run an action: a command goes out at once, one that takes the subject in hand says so, others open their fan or box. */
function press(action: RingAction): void {
  if (action.command) {
    emit('pick', action.command)
    return
  }
  if (action.hand) {
    emit('hand', action.hand)
    return
  }
  openedId.value = action.id
  words.value = ''
  void nextTick(() => {
    if (action.say) wordsBox.value?.focus()
    else stops()[0]?.focus()
  })
}

/** Send the words typed in the box to the person; nothing while it is empty. */
function say(): void {
  const command = sayCommand(words.value, props.thing)
  if (command) emit('pick', command)
}

/** Step back from a fan or box to the ring, the button focused again. */
function stepBack(): void {
  const action = opened.value
  openedId.value = null
  void nextTick(() =>
    root.value
      ?.querySelector<HTMLElement>(`[data-ring-action="${action?.id}"]`)
      ?.focus(),
  )
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    if (opened.value) stepBack()
    else emit('close', true)
    return
  }
  if (event.key === 'Tab') {
    event.preventDefault()
    event.stopPropagation()
    emit('close', true)
    return
  }
  // Nothing typed or pressed in the ring reaches the keys of the game (S, the words key).
  event.stopPropagation()
  if (event.target instanceof HTMLInputElement) return
  const down = event.key === 'ArrowDown'
  const up = event.key === 'ArrowUp'
  const forward = opened.value ? down : down || event.key === 'ArrowRight'
  const backward = opened.value ? up : up || event.key === 'ArrowLeft'
  if (!forward && !backward) return
  event.preventDefault()
  const list = stops()
  const index = list.indexOf(document.activeElement as HTMLElement)
  const next = forward
    ? (index + 1) % list.length
    : (index - 1 + list.length) % list.length
  list[next]?.focus()
}

/** The click that ends a press outside the ring is not let through to anything. */
function swallowClick(): void {
  const stop = (click: Event): void => {
    click.stopPropagation()
    click.preventDefault()
  }
  document.addEventListener('click', stop, { capture: true, once: true })
  setTimeout(() => document.removeEventListener('click', stop, true), 600)
}

function onOutside(event: PointerEvent): void {
  if (root.value?.contains(event.target as Node)) return
  swallowClick()
  emit('close', false)
}

onMounted(() => {
  document.addEventListener('pointerdown', onOutside, true)
  void nextTick(() => stops()[0]?.focus({ preventScroll: true }))
})
onBeforeUnmount(() =>
  document.removeEventListener('pointerdown', onOutside, true),
)
</script>

<template>
  <div
    ref="root"
    class="lq-press-ring"
    role="menu"
    :aria-label="thing.label"
    @keydown="onKeydown"
  >
    <span
      class="lq-ring-name"
      :class="`lq-ring-${thing.kind}`"
      :style="{ left: `${layout.center.x}px`, top: `${layout.center.y}px` }"
      aria-hidden="true"
      >{{ thing.label }}</span
    >
    <button
      v-for="(action, index) in actions"
      :key="action.id"
      type="button"
      role="menuitem"
      class="lq-ring-coin"
      :class="{
        'lq-ring-on': opened?.id === action.id,
        'lq-ring-dim': opened && opened.id !== action.id,
      }"
      :data-ring-action="action.id"
      :aria-haspopup="action.choices || action.say ? 'menu' : undefined"
      :aria-expanded="
        action.choices || action.say
          ? opened?.id === action.id
            ? 'true'
            : 'false'
          : undefined
      "
      :style="{
        left: `${layout.buttons[index].x}px`,
        top: `${layout.buttons[index].y}px`,
        width: `${RING_BUTTON}px`,
        height: `${RING_BUTTON}px`,
      }"
      @click="press(action)"
    >
      <i aria-hidden="true">{{ action.icon }}</i>{{ action.label }}
    </button>
    <div
      v-if="fan && opened"
      class="lq-ring-fan"
      :class="[`lq-ring-fan-${fan.side}`, { 'lq-ring-scrolls': fan.scrolls }]"
      role="menu"
      :aria-label="opened.label.replace('…', '')"
      :style="fanStyle"
    >
      <form v-if="opened.say" class="lq-ring-say" @submit.prevent="say">
        <input
          ref="wordsBox"
          v-model="words"
          type="text"
          placeholder="words…"
          aria-label="words"
          autocomplete="off"
        />
        <button type="submit" class="lq-ring-pill">Say</button>
      </form>
      <template v-else>
        <button
          v-for="(choice, index) in opened.choices"
          :key="choice.command"
          type="button"
          role="menuitem"
          class="lq-ring-pill"
          :style="{
            height: `${FAN_PILL}px`,
            [fan.side === 'right' ? 'marginLeft' : 'marginRight']:
              `${Math.abs(index - (fan.visible - 1) / 2) * 4}px`,
          }"
          @click="emit('pick', choice.command)"
        >
          {{ choice.label }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.lq-press-ring {
  position: absolute;
  inset: 0;
  z-index: 40;
  pointer-events: none;
  overflow: hidden;
}
.lq-ring-name {
  position: absolute;
  transform: translate(-50%, -50%);
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 5px 10px;
  border: 1px solid;
  border-radius: 999px;
  font: 600 13px/1 var(--lq-font-ui);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.35);
}
.lq-ring-scenery {
  background: var(--lq-raised);
  color: var(--lq-fg);
  border-color: var(--lq-line);
}
.lq-ring-item {
  background: var(--lq-item-soft);
  color: var(--lq-item);
  border-color: var(--lq-item-line);
}
.lq-ring-spell {
  background: var(--lq-spell-soft);
  color: var(--lq-spell);
  border-color: var(--lq-spell-line);
}
.lq-ring-character {
  background: var(--lq-character-soft);
  color: var(--lq-character);
  border-color: var(--lq-character-line);
}
.lq-ring-coin {
  position: absolute;
  transform: translate(-50%, -50%);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 50%;
  border: 1px solid var(--lq-line);
  background: var(--lq-raised);
  color: var(--lq-fg);
  box-shadow: 0 6px 16px rgb(0 0 0 / 0.3);
  font: 600 11px/1.15 var(--lq-font-ui);
  cursor: pointer;
  pointer-events: auto;
  transition: opacity calc(0.15s * var(--lq-motion)) ease;
}
.lq-ring-coin i {
  font-style: normal;
  font-size: 19px;
}
.lq-ring-coin:focus-visible,
.lq-ring-pill:focus-visible {
  outline: 3px solid var(--lq-accent);
  outline-offset: 2px;
}
.lq-ring-on {
  background: var(--lq-accent-soft);
  border-color: var(--lq-accent);
  color: var(--lq-accent-text);
}
.lq-ring-dim {
  opacity: 0.55;
}
.lq-ring-fan {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  scrollbar-width: thin;
  pointer-events: auto;
}
.lq-ring-fan-right {
  align-items: flex-start;
  /* Room for the curve's margins, so no name is cut short. */
  padding-right: 12px;
}
.lq-ring-fan-left {
  align-items: flex-end;
  padding-left: 12px;
}
.lq-ring-pill {
  flex: none;
  max-width: 100%;
  box-sizing: border-box;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--lq-line);
  background: var(--lq-raised);
  color: var(--lq-fg);
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.2);
  font: 13px var(--lq-font-ui);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
.lq-ring-say {
  display: flex;
  gap: 6px;
  align-items: center;
}
.lq-ring-say input {
  width: 150px;
  height: 32px;
  box-sizing: border-box;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--lq-line);
  background: var(--lq-raised);
  color: var(--lq-fg);
  font: 16px var(--lq-font-ui);
}
</style>
