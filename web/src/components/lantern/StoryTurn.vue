<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Turn } from '@/stores/useGameStore'
import type { Chip } from '@/lantern/inventoryChanges'
import { parseTurn, type TurnBlock } from '@/lantern/parseTurn'
import { newQuestKicker, questCompleteKicker } from '@/lantern/questNews'
import { questTextHtml } from '@/lantern/questTextHtml'
import { firstQuestUnit as firstQuestOf } from '@/lantern/narrationUnits'
import QuestNewsCard from './QuestNewsCard.vue'
import QuestSlimLine from './QuestSlimLine.vue'
import { useArrivalStore } from '@/stores/useArrivalStore'
import { displayName } from '@/lantern/displayName'
import { renderMarkup } from '@/utils/theme'
import StoryArrival from './StoryArrival.vue'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useSceneStore } from '@/stores/useSceneStore'
import { useReadAlong } from '@/composables/useReadAlong'
import { arrivesOnPicture, recordOnlyFrom } from '@/lantern/stageArrival'
import type { CardPiece } from '@/lantern/columnPieces'
import { toldAsSpeech } from '@/lantern/stageSpeech'

/**
 * One turn in the Lantern story: the command echo, the answer's blocks and
 * chips. While the turn is narrated (`useNarrationStore`) a block, the room
 * arrival or a quest card appears when its voice starts, is marked while it is
 * spoken and has the spoken word lit; the chips wait for the end. Unit `i`
 * is block `i`; then the arrival, then the quest cards (as `turnUnits`).
 *
 * As a narration card (`card`, the laptop stage's left column) the turn is
 * what the narrator tells, one bubble (`lq-bubble`) for each paragraph, as the
 * speech on the right has one for each line: an event, a failure (red-edged)
 * and a room told as a bare description are bubbles of their own, and so is
 * what the bag lost (its chips). A gained item or spell is not on the card:
 * it flies to its button instead (`AcquiredFlight`). The command the player typed is not echoed, nor the closing arrival
 * line of a talk that moved Elior ("You are in …", `recordOnlyFrom`). What belongs to other
 * places is left out: a character's quotes in a conversation (they are on the
 * right, as `useStageSpeechStore` decides), the description of a room told in
 * the middle of the picture on a first visit (a look, a revisit and a load
 * tell the room here) and quest news, which the stage tells in the middle of
 * the picture (`useArrivalStore`) and Story so far and the journal keep. A
 * card with nothing to tell renders nothing.
 *
 * In the single column of a phone or a narrow window (`piece`, see
 * `columnPieces`) the turn is told as several cards with the spoken lines
 * between them, and each card is one `StoryTurn` that tells only its piece:
 * its blocks, and the room, chips and news only when the piece carries them.
 * A piece with nothing to show yet renders nothing.
 *
 * A talk that took Elior to another room keeps on its card only what it told
 * in the new room (`useSceneStore.firstUnit`): its command and the words
 * before the change go with the old room. The full record keeps them.
 */
const props = defineProps<{
  turn: Turn
  card?: boolean
  /** Tell only this piece of the turn (the single column's card). */
  piece?: CardPiece
  /** The full record (Story so far): quest news is always shown as its cards, and the learned spells' lines stay. */
  record?: boolean
}>()
const narration = useNarrationStore()
const root = ref<HTMLElement | null>(null)
/** Whether this turn is narrated, kept once it has been so the fade only plays for the first showing. */
const fade = ref(narration.narrates(props.turn.id))
watch(
  () => narration.narrates(props.turn.id),
  (narrated) => {
    if (narrated) fade.value = true
  },
)

const { shown, isSpeaking, html, mark } = useReadAlong(
  () => props.turn.id,
  root,
)
/** The unit of the room arrival, and of the first quest card. */
const arrivalUnit = computed(() =>
  props.turn.arrival ? blocks.value.length : -1,
)
const firstQuestUnit = computed(() => firstQuestOf(props.turn))
const arrivalStore = useArrivalStore()
/** The turn's quest news was told in the middle of the picture: the story keeps slim lines instead of cards (a narration card keeps nothing). */
const newsInMiddle = computed(
  () => !props.record && arrivalStore.told.includes(props.turn.id),
)
/** Its news is still to be told (waiting or up): nothing of it shows on the card yet. */
const newsPending = computed(
  () => !props.record && arrivalStore.newsPending(props.turn.id),
)
/** How many quest cards the story shows for the turn (none on a narration card, nor while the news is told in the middle). */
const questCount = computed(() => props.turn.quests?.length ?? 0)
const questCards = computed(() =>
  props.card || newsInMiddle.value || newsPending.value || !newsHere.value
    ? 0
    : questCount.value,
)

/** The answer's blocks: the whole record, or what the card shows once the learned spells are told in the middle. */
const blocks = computed(() =>
  parseTurn(
    props.record ? (props.turn.fullText ?? props.turn.text) : props.turn.text,
  ),
)

/**
 * Whether a block is left to the speech on the right: only on a card, only a
 * named speaker's quote that the turn tells as speech (the store's own rule,
 * `toldAsSpeech`).
 */
function onSpeech(block: TurnBlock): boolean {
  return (
    !!props.card &&
    !props.piece &&
    block.kind === 'dialogue' &&
    !!block.speaker &&
    toldAsSpeech(props.turn, block.speaker)
  )
}
const scene = useSceneStore()
/** The first block the card tells: where the talk's room changed, or null (always null outside a card). */
const firstBlock = computed(() =>
  props.card && !props.record ? scene.firstUnit(props.turn.id) : null,
)
/** The first block only the record tells (a moving talk's "You are in …"), on a card; every block elsewhere. */
const recordFrom = computed(() =>
  props.card && !props.record
    ? recordOnlyFrom(props.turn, blocks.value)
    : blocks.value.length,
)
/** Whether the piece (if any) tells block `index`, it was told in the room the card is in, and it is not left to the record. */
function inPiece(index: number): boolean {
  if (firstBlock.value !== null && index < firstBlock.value) return false
  if (index >= recordFrom.value) return false
  return !props.piece || props.piece.blocks.includes(index)
}
/** The room's description is told in the middle of the picture, not on the card. */
const arrivalInMiddle = computed(() => arrivesOnPicture(props.turn))
/** The card tells the room as a bare description. */
const roomOnCard = computed(
  () =>
    !!props.card &&
    !!props.turn.arrival &&
    !arrivalInMiddle.value &&
    roomHere.value,
)

/** Label a quote only when its speaker differs from the previous quote's. */
const speakerLabels = computed(() => {
  let previous: string | null = null
  return blocks.value.map((block) => {
    if (block.kind !== 'dialogue') return null
    const label =
      block.speaker && block.speaker !== previous ? block.speaker : null
    previous = block.speaker
    return label
  })
})

/** The bag's changes; a narration card has only its losses (a gained thing flies to its button, `AcquiredFlight`). */
const chips = computed(() =>
  props.piece && !props.piece.chips
    ? []
    : [
        ...(props.card ? [] : props.turn.gained).map((chip) => ({
          chip,
          sign: '+',
          spoken: 'Gained',
        })),
        ...props.turn.lost.map((chip) => ({
          chip,
          sign: '−',
          spoken: 'Lost',
        })),
      ],
)

/** Whether the piece (if any) carries the room told as a description. */
const roomHere = computed(() => !props.piece || props.piece.arrival)
/** Whether the piece (if any) carries the turn's quest news. */
const newsHere = computed(() => !props.piece || props.piece.news)
/** Whether the piece (if any) starts with the command. */
const commandHere = computed(
  () => !props.card && (!props.piece || props.piece.command),
)

/** A card (or a piece of one) with no bubble to show yet: no card at all. */
const hollow = computed(
  () =>
    !!props.card &&
    !blocks.value.some(
      (block, index) => inPiece(index) && shown(index) && !onSpeech(block),
    ) &&
    !(roomOnCard.value && shown(arrivalUnit.value)) &&
    !chips.value.length &&
    !questCards.value,
)

function chipLabel(chip: Chip): string {
  const count = chip.count > 1 ? ` ×${chip.count}` : ''
  return `${displayName(chip.name)}${count}`
}
</script>

<template>
  <article
    v-if="!hollow"
    ref="root"
    class="lq-turn"
    :class="{ 'lq-card': card }"
    data-testid="turn"
  >
    <div
      v-if="turn.command && commandHere"
      class="lq-command"
      data-testid="command"
    >
      › {{ turn.command }}
    </div>

    <template v-for="(block, index) in blocks" :key="index">
      <template v-if="inPiece(index) && shown(index) && !onSpeech(block)">
        <!-- eslint-disable vue/no-v-html -->
        <p
          v-if="block.kind === 'text'"
          class="lq-block-text"
          :class="{
            'lq-speaking': isSpeaking(index),
            'lq-appear': fade,
            'lq-bubble': card,
          }"
          :data-unit="index"
          v-html="html(block.markup, index)"
        ></p>
        <p
          v-else-if="block.kind === 'event'"
          class="lq-block-event"
          :class="{ 'lq-appear': fade, 'lq-bubble lq-bubble-event': card }"
          :data-unit="index"
        >
          <span class="lq-diamond" aria-hidden="true">◆</span>
          <span v-html="renderMarkup(block.markup)"></span>
        </p>
        <p
          v-else-if="block.kind === 'failure'"
          class="lq-block-failure"
          :class="{
            'lq-speaking': isSpeaking(index),
            'lq-appear': fade,
            'lq-bubble lq-bubble-failure': card,
          }"
          :data-unit="index"
        >
          <span v-if="card" class="lq-failure-mark" aria-hidden="true">⊝</span>
          <svg
            v-else
            class="lq-failure-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12h8" />
          </svg>
          <span v-html="html(block.markup, index)"></span>
        </p>
        <blockquote
          v-else-if="block.kind === 'dialogue'"
          class="lq-block-dialogue"
          :class="{
            'lq-speaking': isSpeaking(index),
            'lq-appear': fade,
            'lq-bubble': card,
          }"
          :data-unit="index"
        >
          <div v-if="speakerLabels[index]" class="lq-speaker">
            {{ displayName(speakerLabels[index] ?? '') }}
          </div>
          <p class="lq-quote" v-html="html(block.markup, index)"></p>
        </blockquote>
        <ul
          v-else-if="block.kind === 'checklist'"
          class="lq-block-checklist"
          :class="{ 'lq-appear': fade, 'lq-bubble': card }"
          :data-unit="index"
        >
          <li
            v-for="(item, itemIndex) in block.items"
            :key="itemIndex"
            :class="item.done ? 'lq-check-done' : 'lq-check-pending'"
          >
            <span class="lq-check-mark" aria-hidden="true">{{
              item.done ? '✓' : ''
            }}</span>
            <span v-html="renderMarkup(item.markup)"></span>
            <span class="lq-sr-only">{{ item.done ? 'done' : 'not yet' }}</span>
          </li>
        </ul>
        <!-- eslint-enable vue/no-v-html -->
      </template>
    </template>

    <StoryArrival
      v-if="
        turn.arrival &&
        roomHere &&
        shown(arrivalUnit) &&
        !(card && arrivalInMiddle)
      "
      :arrival="turn.arrival"
      :command="turn.command"
      :stayed="!turn.description?.moved"
      :bare="card"
      :name-html="html(turn.arrival.room, arrivalUnit, 0, 1)"
      :description-html="html(turn.arrival.description, arrivalUnit, 1)"
      :class="{
        'lq-speaking': isSpeaking(arrivalUnit),
        'lq-appear': fade,
        'lq-bubble': card,
      }"
      :data-unit="arrivalUnit"
    />

    <div
      v-if="chips.length"
      class="lq-chips"
      :class="{
        'lq-pending': narration.narrates(turn.id),
        'lq-bubble': card,
      }"
      role="group"
      aria-label="Changes"
    >
      <span
        v-for="({ chip, sign, spoken }, index) in chips"
        :key="index"
        class="lq-chip"
        :class="[
          `lq-chip-${chip.kind}`,
          sign === '+' ? 'lq-chip-gained' : 'lq-chip-lost',
        ]"
        data-testid="chip"
        ><span aria-hidden="true">{{ sign }}&nbsp;</span
        ><span class="lq-sr-only">{{ `${spoken} ` }}</span
        >{{ chipLabel(chip) }}</span
      >
    </div>

    <template v-if="!card && newsHere && (newsInMiddle || newsPending)">
      <template v-if="newsInMiddle && !newsPending">
        <QuestSlimLine
          v-for="(news, index) in turn.quests ?? []"
          :key="`news-${index}`"
          :news="news"
        />
      </template>
    </template>
    <template
      v-for="(news, index) in questCards ? (turn.quests ?? []) : []"
      :key="`quest-${index}`"
    >
      <QuestNewsCard
        v-if="shown(firstQuestUnit + index)"
        :news="news"
        :kicker-html="
          html(
            news.kind === 'completed'
              ? questCompleteKicker(news.main)
              : newQuestKicker(news.main),
            firstQuestUnit + index,
            0,
            1,
          )
        "
        :name-html="html(news.name, firstQuestUnit + index, 1, 2)"
        :body-html="mark(questTextHtml(news.text), firstQuestUnit + index, 2)"
        :class="{
          'lq-speaking': isSpeaking(firstQuestUnit + index),
          'lq-appear': fade,
        }"
        :data-unit="firstQuestUnit + index"
      />
    </template>
  </article>
</template>

<style scoped>
/* A narration card: the turn's bubbles one under another, as the speech on
   the right has its lines. The card itself has no frame, but takes the
   presses and the wheel between its bubbles as the story's. */
.lq-turn.lq-card {
  max-width: none;
  flex: 0 0 auto;
  gap: 8px;
  align-items: flex-start;
  pointer-events: auto;
}
/* One paragraph (or event, failure, room, chips, checklist, quote) of the
   narrator: a bubble like a line of speech, edged in the narrator's tan. It
   overrides each block's own padding, margin and corners, so every bubble is
   shaped alike. */
.lq-turn .lq-bubble {
  margin: 0;
  max-width: 100%;
  box-sizing: border-box;
  padding: 9px 14px;
  border-radius: 10px;
  border: 1px solid var(--lq-line2);
  background: color-mix(in srgb, var(--lq-surface) 96%, transparent);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
  pointer-events: auto;
}
.lq-turn .lq-bubble.lq-bubble-failure {
  border-color: var(--lq-failure);
  background: color-mix(in srgb, var(--lq-failure-soft) 96%, transparent);
}
/* The bubble being read wears the speech's read-along ring instead of the
   rule at the left edge, so its words stay where they were. */
.lq-turn .lq-bubble.lq-speaking {
  margin-left: 0;
  padding-left: 14px;
  box-shadow:
    0 0 0 2px var(--lq-accent),
    0 2px 10px rgba(0, 0, 0, 0.18);
}
.lq-turn .lq-bubble.lq-bubble-failure.lq-speaking {
  box-shadow:
    0 0 0 2px var(--lq-failure),
    0 2px 10px rgba(0, 0, 0, 0.18);
}
/* Older bubbles dim as older speech does: one step, then a further one (see `useBubbleAges`). */
.lq-bubble[data-age='prev'] {
  opacity: 0.55;
}
.lq-bubble[data-age='old'] {
  opacity: 0.3;
}
.lq-failure-mark {
  flex: 0 0 auto;
  font-size: 1.1em;
  line-height: 1.3;
}
.lq-turn {
  display: flex;
  flex-direction: column;
  gap: calc(10px * var(--lq-density));
  max-width: 68ch;
}
.lq-command {
  font-family: var(--lq-font-mono);
  font-size: calc(12px * var(--lq-text-scale));
  color: var(--lq-muted);
  overflow-wrap: anywhere;
}
.lq-block-text,
.lq-quote {
  margin: 0;
  font-family: var(--lq-font-prose);
  font-size: var(--lq-story-size);
  line-height: var(--lq-story-line-height);
  color: var(--lq-prose);
  overflow-wrap: break-word;
  hyphens: auto;
}
.lq-block-event {
  margin: 0;
  display: flex;
  gap: 10px;
  align-items: baseline;
  font-family: var(--lq-font-ui);
  font-size: calc(14px * var(--lq-text-scale));
  color: var(--lq-muted);
}
.lq-diamond {
  color: var(--lq-accent);
  font-size: 9px;
  position: relative;
  top: -1px;
}
.lq-block-failure {
  margin: 0;
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--lq-failure-soft);
  color: var(--lq-failure);
  font-family: var(--lq-font-ui);
  font-size: calc(15px * var(--lq-text-scale));
  line-height: 1.45;
}
.lq-failure-icon {
  flex: 0 0 auto;
  margin-top: 3px;
}
.lq-block-dialogue {
  margin: 0 0 0 14px;
  padding-left: 12px;
}
.lq-speaker {
  font-family: var(--lq-font-ui);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lq-character);
  font-weight: 600;
  margin-bottom: 2px;
}
.lq-quote {
  font-style: italic;
  color: var(--lq-fg);
}
.lq-block-checklist {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: var(--lq-font-ui);
  font-size: calc(15px * var(--lq-text-scale));
}
.lq-block-checklist li {
  display: flex;
  align-items: center;
  gap: 10px;
}
.lq-check-mark {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}
.lq-check-done {
  color: var(--lq-fg);
}
.lq-check-done .lq-check-mark {
  background: var(--lq-item-soft);
  color: var(--lq-success);
  border: 1px solid var(--lq-item-line);
}
.lq-check-pending {
  color: var(--lq-muted);
}
.lq-check-pending .lq-check-mark {
  border: 1.5px dashed var(--lq-muted);
}
.lq-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.lq-chip {
  flex: 0 0 auto;
  height: 32px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-family: var(--lq-font-ui);
  font-size: 13px;
  white-space: nowrap;
}
.lq-chip-item {
  border: 1px solid var(--lq-item-line);
  background: var(--lq-item-soft);
  color: var(--lq-item);
}
.lq-chip-spell {
  border: 1px solid var(--lq-spell-line);
  background: var(--lq-spell-soft);
  color: var(--lq-spell);
}
.lq-appear {
  animation: lq-appear calc(0.25s * var(--lq-motion)) ease-out both;
}
@keyframes lq-appear {
  from {
    opacity: 0;
  }
}
/* A clue failure being read: a red rule at the box's left edge (the shared
   speaking rule in lantern.css, in the failure colour). */
.lq-block-failure.lq-speaking {
  --lq-rule-width: 3px;
  --lq-rule-colour: var(--lq-failure);
}
/* The rule sits left of the words, which stay where they were. */
.lq-block-text.lq-speaking {
  padding-left: 12px;
  margin-left: -12px;
}
.lq-turn :deep(.lq-block-failure .lq-w-now) {
  background: color-mix(in srgb, var(--lq-failure) 28%, transparent);
  color: var(--lq-failure);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--lq-failure) 28%, transparent);
}
.lq-quest-card.lq-speaking {
  border-color: var(--lq-accent);
  box-shadow: 0 0 0 1px var(--lq-accent);
}
/* The spoken word. */
.lq-turn :deep(.lq-w-now) {
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
  border-radius: 3px;
  box-shadow: 0 0 0 2px var(--lq-accent-soft);
}
/* Chips wait for the end of the narration but keep their room. */
.lq-chips.lq-pending {
  visibility: hidden;
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
