<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Turn } from '@/stores/useGameStore'
import type { Chip } from '@/lantern/inventoryChanges'
import { parseTurn, type TurnBlock } from '@/lantern/parseTurn'
import { newQuestKicker, questCompleteKicker } from '@/lantern/questNews'
import { firstQuestUnit as firstQuestOf } from '@/lantern/narrationUnits'
import QuestNewsCard from './QuestNewsCard.vue'
import { displayName } from '@/lantern/displayName'
import { renderMarkup } from '@/utils/theme'
import StoryArrival from './StoryArrival.vue'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useReadAlong } from '@/composables/useReadAlong'
import { arrivesOnPicture } from '@/lantern/stageArrival'

/**
 * One turn in the Lantern story: the command echo, the answer's blocks and
 * chips. While the turn is narrated (`useNarrationStore`) a block, the room
 * arrival or a quest card appears when its voice starts, is marked while it is
 * spoken and has the spoken word lit; the chips wait for the end. Unit `i`
 * is block `i`; then the arrival, then the quest cards (as `turnUnits`).
 *
 * As a narration card (`card`, the laptop stage's left column) the turn is a
 * paper card: the command first, then what the narrator tells. What belongs to
 * other places is left out: a character's quotes in a conversation (they are
 * on the right, as `useStageSpeechStore` decides) and the description of a
 * room told in the middle of the picture on a first visit; a look, a revisit
 * and a load tell the room here, as a bare description. A card with nothing
 * but the command is slim, and one that only holds silent information has a
 * red edge. The quest cards stay on it for now.
 */
const props = defineProps<{ turn: Turn; card?: boolean }>()
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

const { shown, isSpeaking, html } = useReadAlong(() => props.turn.id, root)
/** The unit of the room arrival, and of the first quest card. */
const arrivalUnit = computed(() =>
  props.turn.arrival ? blocks.value.length : -1,
)
const firstQuestUnit = computed(() => firstQuestOf(props.turn))

const blocks = computed(() => parseTurn(props.turn.text))

/** The quotes of a conversation turn go to the speech on the right (the store's own rule). */
const speechTurn = computed(
  () => !!props.turn.addressed && props.turn.description?.moved !== true,
)
/** Whether a block is left to the speech on the right: only on a card, only a named speaker's quote. */
function onSpeech(block: TurnBlock): boolean {
  return (
    !!props.card &&
    speechTurn.value &&
    block.kind === 'dialogue' &&
    !!block.speaker
  )
}
/** The room's description is told in the middle of the picture, not on the card. */
const arrivalInMiddle = computed(() => arrivesOnPicture(props.turn))
/** The card tells the room as a bare description. */
const roomOnCard = computed(
  () => !!props.card && !!props.turn.arrival && !arrivalInMiddle.value,
)
/** Nothing on the card but the command. */
const slim = computed(
  () =>
    !!props.card &&
    !blocks.value.some((block) => !onSpeech(block)) &&
    !roomOnCard.value &&
    !chips.value.length &&
    !props.turn.quests?.length,
)
/** Only silent information: a red-edged card. */
const errorCard = computed(() => {
  if (!props.card || roomOnCard.value) return false
  const told = blocks.value.filter((block) => !onSpeech(block))
  return (
    told.length > 0 &&
    told.every((block) => block.kind === 'failure') &&
    !chips.value.length &&
    !props.turn.quests?.length
  )
})

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

const chips = computed(() => [
  ...props.turn.gained.map((chip) => ({ chip, sign: '+', spoken: 'Gained' })),
  ...props.turn.lost.map((chip) => ({ chip, sign: '−', spoken: 'Lost' })),
])

function chipLabel(chip: Chip): string {
  const count = chip.count > 1 ? ` ×${chip.count}` : ''
  return `${displayName(chip.name)}${count}`
}
</script>

<template>
  <article
    ref="root"
    class="lq-turn"
    :class="{
      'lq-card': card,
      'lq-slim': slim,
      'lq-card-error': errorCard,
    }"
    data-testid="turn"
  >
    <div v-if="turn.command" class="lq-command" data-testid="command">
      › {{ turn.command }}
    </div>

    <template v-for="(block, index) in blocks" :key="index">
      <template v-if="shown(index) && !onSpeech(block)">
        <!-- eslint-disable vue/no-v-html -->
        <p
          v-if="block.kind === 'text'"
          class="lq-block-text"
          :class="{ 'lq-speaking': isSpeaking(index), 'lq-appear': fade }"
          :data-unit="index"
          v-html="html(block.markup, index)"
        ></p>
        <p
          v-else-if="block.kind === 'event'"
          class="lq-block-event"
          :class="{ 'lq-appear': fade }"
          :data-unit="index"
        >
          <span class="lq-diamond" aria-hidden="true">◆</span>
          <span v-html="renderMarkup(block.markup)"></span>
        </p>
        <p
          v-else-if="block.kind === 'failure'"
          class="lq-block-failure"
          :class="{ 'lq-speaking': isSpeaking(index), 'lq-appear': fade }"
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
          :class="{ 'lq-speaking': isSpeaking(index), 'lq-appear': fade }"
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
          :class="{ 'lq-appear': fade }"
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
      v-if="turn.arrival && shown(arrivalUnit) && !(card && arrivalInMiddle)"
      :arrival="turn.arrival"
      :command="turn.command"
      :stayed="!turn.description?.moved"
      :bare="card"
      :name-html="html(turn.arrival.room, arrivalUnit, 0, 1)"
      :description-html="html(turn.arrival.description, arrivalUnit, 1)"
      :class="{ 'lq-speaking': isSpeaking(arrivalUnit), 'lq-appear': fade }"
      :data-unit="arrivalUnit"
    />

    <div
      v-if="chips.length"
      class="lq-chips"
      :class="{ 'lq-pending': narration.narrates(turn.id) }"
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

    <template
      v-for="(news, index) in turn.quests ?? []"
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
        :body-html="html(news.text, firstQuestUnit + index, 2)"
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
/* A narration card on the laptop stage: a paper strip with a tan edge. */
.lq-turn.lq-card {
  max-width: none;
  flex: 0 0 auto;
  padding: 12px 16px;
  border-radius: 4px 10px 10px 4px;
  border-left: 4px solid var(--lq-line2);
  background: color-mix(in srgb, var(--lq-surface) 95%, transparent);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
  pointer-events: auto;
}
.lq-card.lq-slim {
  padding-block: 7px;
}
.lq-card.lq-slim .lq-command {
  margin: 0;
}
.lq-card.lq-card-error {
  border-left-color: var(--lq-failure);
  background: color-mix(in srgb, var(--lq-failure-soft) 96%, transparent);
}
.lq-card.lq-card-error .lq-block-failure {
  padding: 0;
  background: none;
}
/* Older cards dim as older speech does: one step, then a further one (kept readable over the picture). */
.lq-card.lq-age-prev {
  opacity: 0.6;
}
.lq-card.lq-age-old {
  opacity: 0.4;
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
