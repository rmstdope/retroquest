<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { displayName } from '@/lantern/displayName'
import { exitArrow } from '@/lantern/exitArrow'
import {
  VERBS,
  buildCommand,
  targetsFor,
  type ActionContext,
  type Verb,
} from '@/lantern/actions'

/**
 * The Lantern action composer: tap a verb, pick its targets as chips and
 * "Do it" — or switch to Type and write the command. A live preview shows the
 * command the game will receive. Focus follows the sentence: verb → choices →
 * Do it → back to the verb.
 */
const game = useGameStore()
const settings = useSettingsStore()

const mode = ref(settings.startMode)
const verb = ref<Verb | null>(null)
const args = ref<Array<string | null>>([])
const chosenSlot = ref<number | null>(null)
const showMore = ref(false)
const typed = ref('')
const root = ref<HTMLElement | null>(null)

const context = computed<ActionContext>(() => ({
  roomItems: game.items,
  characters: game.characters,
  inventory: game.bagEntries,
  spells: game.spellEntries,
  exits: game.exits,
  wares: game.roomWares,
}))

const mainVerbs = VERBS.filter((v) => v.group === 'main' && v.id !== 'go')
const moreVerbs = VERBS.filter((v) => v.group === 'more')
const exits = computed(() => Object.entries(game.exits))

/** Drop chosen targets that are no longer available (e.g. after another command). */
watch(context, () => {
  const current = verb.value
  if (!current) return
  current.slots.forEach((slot, index) => {
    const value = args.value[index]
    if (!value || isText(index)) return
    const available = targetsFor(slot, context.value)
    if (!available.some((target) => target.value === value)) {
      args.value[index] = null
    }
  })
})

/** Moving to another room puts a half-built command away (user decision). */
watch(
  () => game.roomName,
  () => clear(),
)

/** The verb used last, so focus can return to it (e.g. after a pop-up). */
const lastVerbId = ref<string | null>(null)

function isText(index: number): boolean {
  return verb.value?.slots[index]?.sources.includes('text') ?? false
}

/** The slot whose choices are shown: the one tapped, else the first empty one. */
const activeSlot = computed<number | null>(() => {
  if (!verb.value) return null
  if (chosenSlot.value !== null) return chosenSlot.value
  const empty = verb.value.slots.findIndex(
    (_, index) => !isText(index) && !args.value[index],
  )
  return empty >= 0 ? empty : null
})

const targets = computed(() =>
  verb.value && activeSlot.value !== null
    ? targetsFor(verb.value.slots[activeSlot.value], context.value)
    : [],
)

const command = computed(() =>
  verb.value ? buildCommand(verb.value, args.value) : null,
)
const preview = computed(() => {
  if (!verb.value) return ''
  if (command.value) return command.value
  const parts = [verb.value.words]
  verb.value.slots.forEach((slot, index) => {
    const value = args.value[index]?.trim()
    if (!value) return
    if (slot.joiner) parts.push(slot.joiner)
    parts.push(value)
  })
  return `${parts.join(' ')} …`
})

function labelFor(index: number): string {
  const value = args.value[index]
  if (!value) return verb.value?.slots[index].optional ? 'optional' : 'choose…'
  const match = targetsFor(verb.value!.slots[index], context.value).find(
    (target) => target.value === value,
  )
  return match?.label ?? displayName(value)
}

/** Accessible name of a slot pill: the word before it plus its current value. */
function slotName(index: number): string {
  const word = verb.value!.slots[index].joiner ?? verb.value!.label
  return `${word}: ${labelFor(index)}`
}

/** Whether the active slot is optional and filled, so "None" can clear it. */
const canClear = computed(
  () =>
    activeSlot.value !== null &&
    !!verb.value?.slots[activeSlot.value].optional &&
    !!args.value[activeSlot.value],
)

/**
 * After the DOM updates, focus the first element matching one of `selectors`
 * — unless the command opened a pop-up, which keeps the focus.
 */
function focusFirst(...selectors: string[]): void {
  void nextTick(() => {
    if (game.showModal) return
    for (const selector of selectors) {
      const element = root.value?.querySelector<HTMLElement>(selector)
      if (element) {
        element.focus()
        return
      }
    }
  })
}

/**
 * Put keyboard focus in the composer: the command box in Type mode, else the
 * verb used last (or the first verb).
 */
function focus(): void {
  const selectors =
    mode.value === 'type'
      ? ['input[aria-label="Command"]']
      : [`[data-verb="${lastVerbId.value}"]`, '.lq-verb']
  for (const selector of selectors) {
    const element = root.value?.querySelector<HTMLElement>(selector)
    if (element) {
      element.focus()
      return
    }
  }
}

defineExpose({ focus })

function run(text: string): void {
  if (!game.acceptInput) return
  game.submitCommand(text)
}

/** Move, keeping focus in the go row even when the new room has other exits. */
function go(direction: string): void {
  run(`go ${direction}`)
  focusFirst(`[data-exit="${direction}"]`, '.lq-exit-btn', '.lq-verb')
}

function pickVerb(next: Verb): void {
  lastVerbId.value = next.id
  // Tapping the selected verb again puts the builder away (like Cancel).
  if (verb.value?.id === next.id) {
    reset()
    return
  }
  if (next.slots.length === 0) {
    run(next.words)
    reset()
    // A More… verb disappears as the list folds; focus its toggle instead.
    focusFirst(`[data-verb="${next.id}"]`, '[data-more]')
    return
  }
  verb.value = next
  args.value = next.slots.map(() => null)
  chosenSlot.value = null
  focusFirst('.lq-text-slot', '.lq-target', '.lq-do')
}

function pickTarget(value: string | null): void {
  if (activeSlot.value === null) return
  args.value[activeSlot.value] = value
  chosenSlot.value = null
  focusFirst('.lq-target', '.lq-do')
}

/** Close the builder and give focus back to the verb that opened it. */
function reset(): void {
  if (verb.value) focusFirst(`[data-verb="${verb.value.id}"]`)
  clear()
}

/** Close the builder without moving focus. */
function clear(): void {
  verb.value = null
  args.value = []
  chosenSlot.value = null
  showMore.value = false
}

/** Enter in a text slot: run the command if complete, else go on to the choices. */
function textEntered(): void {
  if (command.value) doIt()
  else focusFirst('.lq-target', '.lq-do')
}

function doIt(): void {
  if (!command.value) return
  run(command.value)
  reset()
}

function submitTyped(): void {
  const text = typed.value.trim()
  if (!text) return
  run(text)
  typed.value = ''
}
</script>

<template>
  <section
    ref="root"
    class="lq-composer"
    aria-label="Actions"
    @keydown.escape="verb && reset()"
  >
    <div class="lq-composer-top">
      <div role="group" aria-label="Input mode" class="lq-seg">
        <button
          type="button"
          :aria-pressed="mode === 'actions' ? 'true' : 'false'"
          class="lq-seg-btn"
          @click="mode = 'actions'"
        >
          Actions
        </button>
        <button
          type="button"
          :aria-pressed="mode === 'type' ? 'true' : 'false'"
          class="lq-seg-btn"
          @click="mode = 'type'"
        >
          Type
        </button>
      </div>
      <span
        v-if="verb"
        class="lq-preview"
        data-testid="preview"
        aria-live="polite"
        >{{ preview }}</span
      >
    </div>

    <template v-if="mode === 'actions'">
      <div v-if="exits.length" class="lq-go-row">
        <span class="lq-row-label">Go</span>
        <button
          v-for="[dir, room] in exits"
          :key="dir"
          type="button"
          class="lq-exit-btn"
          :aria-label="`Go ${dir} to ${room}`"
          :data-exit="dir"
          :disabled="!game.acceptInput"
          @click="go(dir)"
        >
          <span aria-hidden="true"
            >{{ exitArrow(dir) }} {{ displayName(dir) }}</span
          >
          <span class="lq-exit-room" aria-hidden="true">{{ room }}</span>
        </button>
      </div>

      <div v-if="verb" class="lq-builder">
        <div class="lq-sentence">
          <span class="lq-word">{{ verb.label }}</span>
          <template v-for="(slot, index) in verb.slots" :key="index">
            <span v-if="slot.joiner" class="lq-joiner">{{ slot.joiner }}</span>
            <input
              v-if="isText(index)"
              v-model="args[index]"
              class="lq-text-slot"
              :aria-label="verb.id === 'say' ? 'Words to say' : 'Text'"
              placeholder="words…"
              @keydown.enter.prevent="textEntered"
            />
            <button
              v-else
              type="button"
              class="lq-slot"
              :class="{ 'lq-slot-active': activeSlot === index }"
              :aria-label="slotName(index)"
              @click="chosenSlot = index"
            >
              {{ labelFor(index) }}
            </button>
          </template>
        </div>

        <div
          v-if="activeSlot !== null"
          class="lq-targets"
          role="group"
          :aria-label="`Choices for ${slotName(activeSlot)}`"
        >
          <button
            v-for="target in targets"
            :key="target.value"
            type="button"
            class="lq-target"
            :class="`lq-target-${target.kind}`"
            @click="pickTarget(target.value)"
          >
            {{ target.label }}
          </button>
          <button
            v-if="canClear"
            type="button"
            class="lq-target lq-target-none"
            @click="pickTarget(null)"
          >
            None
          </button>
          <span v-if="!targets.length && !canClear" class="lq-empty"
            >Nothing to {{ verb.label.toLowerCase() }} here</span
          >
        </div>

        <div class="lq-builder-actions">
          <button type="button" class="lq-cancel" @click="reset">Cancel</button>
          <button
            type="button"
            class="lq-do"
            :disabled="!command || !game.acceptInput"
            @click="doIt"
          >
            Do it
          </button>
        </div>
      </div>

      <div class="lq-verbs">
        <button
          v-for="v in mainVerbs"
          :key="v.id"
          type="button"
          class="lq-verb"
          :class="{ 'lq-verb-on': verb?.id === v.id }"
          :aria-pressed="verb?.id === v.id ? 'true' : 'false'"
          :data-verb="v.id"
          :disabled="!game.acceptInput"
          @click="pickVerb(v)"
        >
          {{ v.label }}
        </button>
        <button
          type="button"
          class="lq-verb"
          data-more
          :aria-expanded="showMore ? 'true' : 'false'"
          @click="showMore = !showMore"
        >
          More…
        </button>
        <template v-if="showMore">
          <button
            v-for="v in moreVerbs"
            :key="v.id"
            type="button"
            class="lq-verb"
            :disabled="!game.acceptInput"
            @click="pickVerb(v)"
          >
            {{ v.label }}
          </button>
        </template>
      </div>
    </template>

    <form v-else class="lq-type-row" @submit.prevent="submitTyped">
      <input
        v-model="typed"
        class="lq-type-input"
        aria-label="Command"
        placeholder="What do you do?"
        autocomplete="off"
        :disabled="!game.acceptInput"
      />
      <button type="submit" class="lq-do" :disabled="!game.acceptInput">
        Do it
      </button>
    </form>
  </section>
</template>

<style scoped>
.lq-composer {
  display: flex;
  flex-direction: column;
  gap: calc(10px * var(--lq-density) + 2px);
  padding: 12px;
  border-radius: var(--lq-radius);
  border: 1px solid var(--lq-line);
  background: var(--lq-surface);
  font-family: var(--lq-font-ui);
}
.lq-composer-top {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.lq-seg {
  display: inline-flex;
  flex: 0 0 auto;
  padding: 3px;
  border-radius: 12px;
  background: var(--lq-bg);
  border: 1px solid var(--lq-line);
}
.lq-seg-btn {
  min-height: 44px;
  padding: 0 14px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: var(--lq-muted);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.lq-seg-btn[aria-pressed='true'] {
  background: var(--lq-raised);
  color: var(--lq-fg);
  font-weight: 600;
}
.lq-preview {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--lq-font-mono);
  font-size: 12px;
  color: var(--lq-muted);
}
.lq-go-row,
.lq-targets {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
}
.lq-row-label {
  flex: 0 0 auto;
  font-size: 12px;
  color: var(--lq-muted);
}
.lq-exit-btn {
  flex: 0 0 auto;
  min-height: 44px;
  padding: 2px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid var(--lq-accent-line);
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
}
.lq-exit-room {
  font-weight: 400;
  color: var(--lq-fg);
}
.lq-builder {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid var(--lq-accent-line);
  background: var(--lq-bg);
}
.lq-sentence {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.lq-word,
.lq-joiner {
  font-family: var(--lq-font-display);
  font-size: calc(18px * var(--lq-display-scale));
  color: var(--lq-fg);
}
.lq-joiner {
  color: var(--lq-muted);
}
.lq-slot,
.lq-text-slot {
  min-height: 44px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px dashed var(--lq-line2);
  background: transparent;
  color: var(--lq-fg);
  font: inherit;
  font-size: 14px;
}
.lq-slot {
  cursor: pointer;
}
.lq-slot-active {
  border-style: solid;
  border-color: var(--lq-accent);
}
.lq-text-slot {
  min-width: 0;
  width: 14ch;
}
.lq-target {
  flex: 0 0 auto;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 999px;
  font: inherit;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
}
.lq-target-item {
  border: 1px solid var(--lq-item-line);
  background: var(--lq-item-soft);
  color: var(--lq-item);
}
.lq-target-character {
  border: 1px solid var(--lq-character-line);
  background: var(--lq-character-soft);
  color: var(--lq-character);
}
.lq-target-spell {
  border: 1px solid var(--lq-spell-line);
  background: var(--lq-spell-soft);
  color: var(--lq-spell);
}
.lq-target-none {
  border: 1px dashed var(--lq-line2);
  background: transparent;
  color: var(--lq-fg);
}
.lq-target-exit {
  border: 1px solid var(--lq-accent-line);
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
}
.lq-empty {
  font-size: 13px;
  color: var(--lq-muted);
}
.lq-builder-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.lq-cancel {
  min-height: 44px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--lq-line2);
  background: transparent;
  color: var(--lq-fg);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.lq-do {
  min-height: 44px;
  padding: 0 18px;
  border: none;
  border-radius: 10px;
  background: var(--lq-accent);
  color: var(--lq-on-accent);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.lq-verbs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 6px;
}
.lq-verb {
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid var(--lq-line);
  background: var(--lq-raised);
  color: var(--lq-fg);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.lq-verb-on {
  background: var(--lq-accent);
  color: var(--lq-on-accent);
  border-color: var(--lq-accent);
}
.lq-type-row {
  display: flex;
  gap: 8px;
}
.lq-type-input {
  flex: 1;
  min-width: 0;
  height: 48px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--lq-accent-line);
  background: var(--lq-bg);
  color: var(--lq-fg);
  font-family: var(--lq-font-mono);
  font-size: 16px;
}
button:disabled,
input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
