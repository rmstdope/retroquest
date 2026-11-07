<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useArrivalStore } from '@/stores/useArrivalStore'
import { useStageSpeechStore } from '@/stores/useStageSpeechStore'
import { useCommandCompletion } from '@/composables/useCommandCompletion'
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
 * The Lantern action composer: tap a verb and pick its targets as chips — the
 * command is performed as soon as the last choice is made, so there is no
 * "Do it" in Actions mode (Say sends on Enter in its words box when the person
 * was tapped first). Or switch to Type and write the command. On the stage
 * (`stage`) the verbs are one row (Look to Give, More… and ⌨ Type; Buy,
 * Open, Close, Cast, Cast on and Rest behind More…) with the sentence being
 * built as one slim row above it, the choices standing where the blank is and
 * a ✕ at the end. Elsewhere the sentence is a box with its choices below and
 * a Cancel button, and a live preview shows the command the game will
 * receive. Focus follows the sentence: verb → choices → back to the verb. On phones it is a sheet that can fold away
 * (`foldable` shows a hide button that emits `fold`). In Type mode its root
 * carries `lq-typing`, so the sheet can let the completion list (which opens
 * above the command box on the stage, above the whole sheet on phones) show
 * outside it.
 */
const props = defineProps<{
  foldable?: boolean
  stage?: boolean
  /** The laptop's Hide is on the picture: words showing, not hidden, no arrival. */
  wordsShowing?: boolean
}>()
const emit = defineEmits<{ fold: [] }>()
const game = useGameStore()
const settings = useSettingsStore()
const narration = useNarrationStore()
const arrival = useArrivalStore()
const speech = useStageSpeechStore()

const mode = ref(settings.startMode)
const verb = ref<Verb | null>(null)
const args = ref<Array<string | null>>([])
const chosenSlot = ref<number | null>(null)
const showMore = ref(false)
const typed = ref('')
const root = ref<HTMLElement | null>(null)
/** Whether the cursor is in the command box (then Escape is shown on Actions). */
const inBox = ref(false)

const context = computed<ActionContext>(() => ({
  roomItems: game.items,
  characters: game.characters,
  inventory: game.bagEntries,
  spells: game.spellEntries,
  exits: game.exits,
  wares: game.roomWares,
}))

/** The verbs on the stage's one row; the other action verbs wait behind More…. */
const STAGE_ROW = [
  'look',
  'examine',
  'search',
  'take',
  'use',
  'usewith',
  'talk',
  'say',
  'give',
]
const actionVerbs = VERBS.filter((v) => v.group === 'main' && v.id !== 'go')
const mainVerbs = computed(() =>
  props.stage
    ? actionVerbs.filter((v) => STAGE_ROW.includes(v.id))
    : actionVerbs,
)
const moreVerbs = computed(() =>
  props.stage
    ? actionVerbs.filter((v) => !STAGE_ROW.includes(v.id))
    : VERBS.filter((v) => v.group === 'more'),
)
/** Whether the verb used last waits behind More… (so More… is what shakes). */
const lastIsMore = computed(() =>
  moreVerbs.value.some((v) => v.id === lastVerbId.value),
)
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
  if (!value) return 'choose…'
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

/** The sentence's first words on the stage's row: "Talk to", "Use", "Cast". */
const leadWords = computed(() => {
  const words = verb.value?.words ?? ''
  return words.charAt(0).toUpperCase() + words.slice(1)
})

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

/** Switch between Actions and Type (the folded dock opens either). */
function setMode(next: 'actions' | 'type'): void {
  mode.value = next
}

/**
 * Type (the stage's ⌨ Type, the panel's switch): switch to the command box
 * and put the cursor in it, so the first letters typed land there (the stage's
 * button is gone once the box shows, which would otherwise leave focus on the
 * page).
 */
function chooseType(): void {
  mode.value = 'type'
  focusFirst('input[aria-label="Command"]')
}

/**
 * Actions (the stage's button, the panel's switch): switch back to the verbs
 * and put focus on the verb used last (or the first verb), so the keyboard
 * carries on (the stage's button is gone once the verbs show, which would
 * otherwise leave focus on the page).
 */
function chooseActions(): void {
  mode.value = 'actions'
  focusFirst(`[data-verb="${lastVerbId.value}"]`, '.lq-verbs .lq-verb')
}

defineExpose({ focus, setMode })

// "Not like that": the verb used last (in Actions mode the sentence is cleared
// on sending) or Type's Do it gives a short shake when a command fails (it
// does not move when motion is reduced, see .lq-shake). The shake ends after
// its length even when nothing showed it (no verb used yet, the sheet folded),
// so a later verb does not shake for an old failure. Only commands sent
// from here shake: a failed move from the compass or a journal Use does not.
const SHAKE_MS = 320 // the length of the lq-shake animation
const shaking = ref(false)
let shakeTimer: ReturnType<typeof setTimeout> | undefined
let sentHere = false
watch(
  () => game.turns.at(-1),
  (turn) => {
    const mine = sentHere
    sentHere = false
    if (!mine || !turn?.command || !turn.text.includes('[failure]')) return
    shaking.value = true
    clearTimeout(shakeTimer)
    shakeTimer = setTimeout(() => (shaking.value = false), SHAKE_MS)
  },
)

/**
 * Hint is dimmed (aria-disabled, so it keeps focus) while the game takes no move or a turn is being read aloud.
 * An arrival on the picture does not dim it: a press cuts the arrival short (the layout clears it as the click goes down) and gives the hint, as Look does.
 */
const hintBusy = computed<boolean>(
  () => !game.acceptInput || (narration.isNarrating && !arrival.active),
)

/**
 * Press Hint: send the existing `hint` command as a typed one would go. It
 * leaves a half-built action and typed text alone, and adds no message.
 */
function pressHint(): void {
  if (!hintBusy.value) game.submitCommand('hint')
}

function run(text: string): void {
  if (!game.acceptInput) return
  sentHere = true
  game.submitCommand(text)
  // Its answer (if any) is seen before the next tick; a command without one
  // (a save) must not mark a later answer from elsewhere as ours.
  void nextTick(() => (sentHere = false))
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
  focusFirst('.lq-text-slot', '.lq-target')
}

function pickTarget(value: string): void {
  if (activeSlot.value === null) return
  args.value[activeSlot.value] = value
  chosenSlot.value = null
  if (command.value) {
    doIt()
    return
  }
  focusFirst('.lq-target', '.lq-text-slot')
}

/** Close the builder and give focus back to the verb that opened it. */
function reset(): void {
  // A More… verb is gone once the list folds; focus its toggle instead.
  const id = verb.value?.id
  clear()
  if (id) focusFirst(`[data-verb="${id}"]`, '[data-more]')
}

/**
 * Tap on More…: opens or folds the list. Folding while the sentence began with
 * a verb from behind More… puts that sentence away (as Cancel would), so a
 * lit verb is never hidden; a main-row verb's sentence is left alone.
 */
function toggleMore(): void {
  if (
    showMore.value &&
    verb.value &&
    moreVerbs.value.some((v) => v.id === verb.value?.id)
  ) {
    reset()
    return
  }
  showMore.value = !showMore.value
}

/** Close the builder without moving focus. */
function clear(): void {
  verb.value = null
  args.value = []
  chosenSlot.value = null
  showMore.value = false
}

/** Escape puts a half-built command away — unless it is continuing a pop-up. */
function putAway(event: KeyboardEvent): void {
  if (!verb.value || game.showModal) return
  // Consumed here: the story's narration must not also take this Escape.
  event.preventDefault()
  reset()
}

/**
 * Escape in the command box takes one step back per press: close the word list
 * (the text stays), then clear the text, then leave the box for the verbs. An
 * Escape that already has a job (the narrator, an arrival, or words on the
 * laptop's picture for the layout to hide; on a phone a speech) or a box that
 * takes no input is left alone. Every step but the list's own is consumed here
 * so the layout does not also act.
 */
function onTypedEscape(event: KeyboardEvent): void {
  if (completion.open.value) {
    event.preventDefault()
    completion.close()
    return
  }
  if (
    !game.acceptInput ||
    narration.isNarrating ||
    arrival.active ||
    (props.stage ? props.wordsShowing : speech.visible.length)
  )
    return
  event.preventDefault()
  // A held key takes one step only, not all of them.
  if (event.repeat) return
  if (typed.value) {
    typed.value = ''
    return
  }
  chooseActions()
}

/** Enter in a text slot: run the command if complete, else go on to the choices. */
function textEntered(): void {
  if (command.value) doIt()
  else focusFirst('.lq-target')
}

function doIt(): void {
  if (!command.value || !game.acceptInput) return
  run(command.value)
  reset()
}

function submitTyped(): void {
  completion.close()
  const text = typed.value.trim()
  if (!text) return
  run(text)
  typed.value = ''
}

// Type mode: the word list from the engine's completion tree, live while typing.
const completion = useCommandCompletion(
  typed,
  (input) => game.completionState(input),
  (input) => game.tabComplete(input).newInput,
  () => game.acceptInput,
)

/** Switching away from Type puts the word list and the Escape mark away. */
watch(mode, () => {
  completion.close()
  // A box that is removed fires no blur.
  inBox.value = false
})
const completionListId = 'lq-completions'

/** Keep the highlighted match visible when the list scrolls. */
watch(
  completion.activeIndex,
  (index) => {
    if (index < 0) return
    root.value
      ?.querySelector(`#${completionListId}-${index}`)
      ?.scrollIntoView?.({ block: 'nearest' })
  },
  { flush: 'post' },
)

/** The cursor left the command box: the list and the Escape mark go. */
function onBoxBlur(): void {
  inBox.value = false
  completion.close()
}

/**
 * A press on the panel's switch, or on the stage's Actions, while typing
 * keeps the cursor in the box: a blur would take the Escape mark away and
 * narrow the button under the pointer, so the click would miss. Its click
 * moves focus where it belongs.
 */
function keepBoxFocus(event: MouseEvent): void {
  if (inBox.value) event.preventDefault()
}

/** Enter in the command box: apply a highlighted match, else send. */
function onTypedEnter(): void {
  if (!completion.applyActive()) submitTyped()
}
</script>

<template>
  <section
    ref="root"
    class="lq-composer"
    :class="{ 'lq-typing': mode === 'type', 'lq-on-stage': stage }"
    aria-label="Actions"
    @keydown.escape="putAway"
  >
    <div v-if="!stage" class="lq-composer-top">
      <div role="group" aria-label="Input mode" class="lq-seg">
        <button
          type="button"
          :aria-pressed="mode === 'actions' ? 'true' : 'false'"
          class="lq-seg-btn"
          :aria-keyshortcuts="inBox ? 'Escape' : undefined"
          @mousedown="keepBoxFocus"
          @click="chooseActions"
        >
          Actions<kbd v-if="inBox" class="lq-esc" aria-hidden="true">Esc</kbd>
        </button>
        <button
          type="button"
          :aria-pressed="mode === 'type' ? 'true' : 'false'"
          class="lq-seg-btn"
          @mousedown="keepBoxFocus"
          @click="chooseType"
        >
          Type
        </button>
      </div>
      <button
        type="button"
        class="lq-hint"
        aria-label="Hint"
        :aria-disabled="hintBusy"
        :class="{ 'lq-busy': hintBusy }"
        @click="pressHint"
      >
        💡 Hint
      </button>
      <button
        v-if="foldable"
        type="button"
        class="lq-fold"
        aria-label="Hide actions"
        @click="emit('fold')"
      >
        ▾
      </button>
      <span
        v-if="verb"
        class="lq-preview"
        data-testid="preview"
        aria-live="polite"
        >{{ preview }}</span
      >
    </div>

    <template v-if="mode === 'actions'">
      <div v-if="exits.length && !stage" class="lq-go-row">
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

      <div v-if="verb && !stage" class="lq-builder">
        <div class="lq-sentence">
          <span class="lq-word">{{ leadWords }}</span>
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
            :disabled="!game.acceptInput"
            @click="pickTarget(target.value)"
          >
            {{ target.label }}
          </button>
          <span v-if="!targets.length" class="lq-empty"
            >Nothing to {{ verb.label.toLowerCase() }} here</span
          >
        </div>

        <div class="lq-builder-actions">
          <button type="button" class="lq-cancel" @click="reset">Cancel</button>
        </div>
      </div>

      <div v-if="verb && stage" class="lq-row">
        <span class="lq-word">{{ leadWords }}</span>
        <template v-for="(slot, index) in verb.slots" :key="index">
          <span v-if="slot.joiner" class="lq-joiner">{{ slot.joiner }}</span>
          <input
            v-if="isText(index)"
            v-model="args[index]"
            class="lq-text-slot"
            aria-label="Words to say"
            placeholder="words…"
            @keydown.enter.prevent="textEntered"
          />
          <span
            v-else-if="activeSlot === index"
            class="lq-row-choices"
            role="group"
            :aria-label="`Choices for ${slotName(index)}`"
          >
            <button
              v-for="target in targets"
              :key="target.value"
              type="button"
              class="lq-target"
              :class="`lq-target-${target.kind}`"
              :disabled="!game.acceptInput"
              @click="pickTarget(target.value)"
            >
              {{ target.label }}
            </button>
            <span v-if="!targets.length" class="lq-empty"
              >Nothing to {{ verb.label.toLowerCase() }} here</span
            >
          </span>
          <button
            v-else-if="args[index]"
            type="button"
            class="lq-slot"
            :aria-label="slotName(index)"
            @click="chosenSlot = index"
          >
            {{ labelFor(index) }}
          </button>
          <span v-else class="lq-blank">…</span>
        </template>
        <button
          type="button"
          class="lq-close"
          aria-label="Cancel"
          @click="reset"
        >
          ✕
        </button>
      </div>

      <div class="lq-verbs">
        <button
          v-for="v in mainVerbs"
          :key="v.id"
          type="button"
          class="lq-verb"
          :class="{
            'lq-verb-on': verb?.id === v.id,
            'lq-shake': shaking && !verb && lastVerbId === v.id,
          }"
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
          :class="{ 'lq-shake': shaking && !verb && lastIsMore }"
          data-more
          :aria-expanded="showMore ? 'true' : 'false'"
          @click="toggleMore"
        >
          More…
        </button>
        <template v-if="showMore">
          <button
            v-for="v in moreVerbs"
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
        </template>
        <button
          v-if="stage"
          type="button"
          class="lq-verb"
          data-type
          aria-label="Type"
          @click="chooseType"
        >
          ⌨ Type
        </button>
        <button
          v-if="stage"
          type="button"
          class="lq-hint"
          aria-label="Hint"
          :aria-disabled="hintBusy"
          :class="{ 'lq-busy': hintBusy }"
          @click="pressHint"
        >
          💡 Hint
        </button>
      </div>
    </template>

    <form v-else class="lq-type-row" @submit.prevent="submitTyped">
      <button
        v-if="stage"
        type="button"
        class="lq-verb"
        data-actions
        :aria-keyshortcuts="inBox ? 'Escape' : undefined"
        @mousedown="keepBoxFocus"
        @click="chooseActions"
      >
        Actions<kbd v-if="inBox" class="lq-esc" aria-hidden="true">Esc</kbd>
      </button>
      <div class="lq-type-field">
        <input
          v-model="typed"
          class="lq-type-input"
          aria-label="Command"
          placeholder="What do you do?"
          autocomplete="off"
          role="combobox"
          aria-autocomplete="list"
          :aria-controls="completionListId"
          :aria-expanded="completion.open.value"
          :aria-activedescendant="
            completion.activeIndex.value >= 0
              ? `${completionListId}-${completion.activeIndex.value}`
              : undefined
          "
          :disabled="!game.acceptInput"
          @keydown.tab="completion.onTab"
          @keydown.down.prevent="completion.onArrowDown"
          @keydown.up.prevent="completion.onArrowUp"
          @keydown.escape="onTypedEscape"
          @keydown.enter.prevent="onTypedEnter"
          @focus="inBox = true"
          @blur="onBoxBlur"
        />
        <ul
          v-if="completion.open.value"
          :id="completionListId"
          class="lq-completions"
          role="listbox"
          aria-label="Matching words"
        >
          <li
            v-if="completion.noMatch.value"
            class="lq-completion-none"
            role="option"
            aria-disabled="true"
            aria-selected="false"
          >
            No match for “{{ completion.word.value }}”
          </li>
          <li
            v-for="(word, index) in completion.suggestions.value"
            :id="`${completionListId}-${index}`"
            :key="word"
            role="option"
            class="lq-completion"
            :aria-selected="index === completion.activeIndex.value"
            @mousedown.prevent="completion.apply(word)"
          >
            <b>{{ word.slice(0, completion.word.value.length) }}</b
            >{{ word.slice(completion.word.value.length) }}
          </li>
        </ul>
      </div>
      <button
        type="submit"
        class="lq-do"
        :class="{ 'lq-shake': shaking }"
        :disabled="!game.acceptInput"
      >
        {{ stage ? 'Do it ▸' : 'Do it' }}
      </button>
      <button
        v-if="stage"
        type="button"
        class="lq-hint"
        aria-label="Hint"
        :aria-disabled="hintBusy"
        :class="{ 'lq-busy': hintBusy }"
        @click="pressHint"
      >
        💡 Hint
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
.lq-hint {
  flex: 0 0 auto;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--lq-line);
  background: var(--lq-raised);
  color: var(--lq-fg);
  font: inherit;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
}
/* The far right of the stage's verb row (the typing row's field already
   fills the space before it); the phone sheet's top row puts it just left of
   the fold button. */
.lq-hint.lq-busy {
  opacity: 0.5;
  cursor: not-allowed;
}
.lq-verbs .lq-hint {
  margin-left: auto;
}
.lq-composer-top .lq-hint {
  order: 1;
  margin-left: auto;
}
.lq-composer-top .lq-hint + .lq-fold {
  margin-left: 0;
}
.lq-fold {
  order: 1;
  margin-left: auto;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid var(--lq-line2);
  background: transparent;
  color: var(--lq-fg);
  font: inherit;
  font-size: 16px;
  cursor: pointer;
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
/* Movement scales with --lq-motion, so reduced motion keeps it still. */
.lq-shake {
  animation: lq-shake 0.32s ease-in-out;
}
@keyframes lq-shake {
  20%,
  60% {
    transform: translateX(calc(-4px * var(--lq-motion)));
  }
  40%,
  80% {
    transform: translateX(calc(4px * var(--lq-motion)));
  }
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
/* On the stage the verbs are one row over the picture, and the sentence being
   built is one slim row just above it (it comes first in the markup). It wraps
   only when the choices need a second line, whole choices at a time. */
.lq-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
}
.lq-row .lq-slot {
  border-style: solid;
  border-color: var(--lq-accent);
}
.lq-row-choices {
  display: contents;
}
.lq-blank {
  color: var(--lq-muted);
}
.lq-close {
  margin-left: auto;
  min-width: 44px;
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid var(--lq-line2);
  background: transparent;
  color: var(--lq-fg);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.lq-on-stage {
  background: color-mix(in srgb, var(--lq-surface) 93%, transparent);
}
.lq-on-stage .lq-verbs {
  display: flex;
  flex-wrap: wrap;
}
.lq-on-stage .lq-verb {
  flex: 0 1 auto;
  padding: 0 16px;
}
.lq-verbs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(62px, 1fr));
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
.lq-type-field {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
}
.lq-completions {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + 6px);
  z-index: 5;
  margin: 0;
  padding: 4px;
  list-style: none;
  max-height: 220px;
  overflow-y: auto;
  border-radius: 10px;
  border: 1px solid var(--lq-line2);
  background: var(--lq-raised);
  box-shadow: 0 10px 24px rgb(0 0 0 / 0.3);
}
/* On the phone's sheet the list opens above the whole sheet, not just the
   command box, so it never covers the sheet's top row (Hint and the
   Actions/Type switch, rq-k8p5): the field stops being its anchor and the
   sheet (positioned by the layout) is. */
.lq-composer:not(.lq-on-stage) .lq-type-field {
  position: static;
}
.lq-composer:not(.lq-on-stage) .lq-completions {
  left: 12px;
  right: 12px;
}
.lq-completion {
  min-height: 40px;
  line-height: 40px;
  padding: 0 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: 8px;
  font-family: var(--lq-font-mono);
  font-size: 14px;
  color: var(--lq-fg);
  cursor: pointer;
}
.lq-completion b {
  font-weight: 700;
  color: var(--lq-accent-text);
}
.lq-completion-none {
  min-height: 40px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 14px;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  line-height: 40px;
  color: var(--lq-muted);
}
.lq-completion[aria-selected='true'] {
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
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
/* The Escape key-cap on Actions; touch screens have no Esc key. */
.lq-esc {
  margin-left: 6px;
  padding: 1px 6px;
  border: 1px solid var(--lq-line2);
  border-bottom-width: 2px;
  border-radius: 5px;
  background: var(--lq-bg);
  color: var(--lq-muted);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
}
@media (hover: none) {
  .lq-esc {
    display: none;
  }
}
button:disabled,
input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
