<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { actLabel, cardKey, filled, savedWhen } from '@/lantern/saveCard'
import type { SaveSlot } from '@/types/bridge'
import LanternDialog from './LanternDialog.vue'

/**
 * Save or load a game: the 8 slots (and, when loading, the quick save
 * first) as cards with the act, room, quests and time. An empty slot saves
 * at once; replacing a save or loading one asks first, inside its card.
 * A load closes the dialog; a save stays, marked "Just saved" (or the
 * dialog says the save failed). A save from an older version is dimmed with
 * its reason: it cannot be picked to load, but its slot can be saved over.
 * Escape in a question cancels it first; the next Escape closes the dialog.
 * When loading, the saves the player made under a name (`save <name>`) follow
 * the slots under "Saves you named", newest first, as cards with a pencil
 * mark, the name as the headline and the same details; they load like a slot.
 * Opened from the title page (`fromTitle`) no game is in play, so a picked
 * save loads at once, with no question, and a failed load stays here with
 * the engine's line.
 */
const props = defineProps<{ mode: 'save' | 'load'; fromTitle?: boolean }>()
const emit = defineEmits<{ close: [] }>()
const game = useGameStore()

const QUICK = 0
const NAMED_HEADING = 'Saves you named'
const OUTDATED = "Made by an older version · can't be loaded"
const saving = computed(() => props.mode === 'save')
const version = ref(0) // bumped after a save so the cards are read again
/** The key (`cardKey`) of the card asking, or just saved. */
const asking = ref<string | number | null>(null)
const justSaved = ref<string | number | null>(null)
const saveFailed = ref(false)
const list = ref<HTMLElement | null>(null)

const cards = computed<SaveSlot[]>(() => {
  void version.value
  const slots = game.getSaveSlots()
  const quick = saving.value ? null : game.getQuickSave()
  return quick ? [quick, ...slots] : slots
})

/** The named saves, newest first; none when saving (a name is typed). */
const namedCards = computed<SaveSlot[]>(() => {
  void version.value
  return saving.value ? [] : game.getNamedSaves()
})

const groups = computed(() => [
  { id: 'slots', heading: '', cards: cards.value },
  ...(namedCards.value.length > 0
    ? [{ id: 'named', heading: NAMED_HEADING, cards: namedCards.value }]
    : []),
])

function badge(card: SaveSlot): string {
  if (card.name !== undefined) return '✎'
  return card.slot === QUICK ? 'Q' : String(card.slot)
}

/** "Act III · Mount Ember" for a named card, or '' when it has neither. */
function whereLine(card: SaveSlot): string {
  return [actLabel(card.act), card.room].filter(Boolean).join(' · ')
}

function percent(card: SaveSlot): number {
  const q = card.quests
  return q && q.total > 0 ? Math.round((q.completed / q.total) * 100) : 0
}

/** Focus a card (after its question's buttons went away). */
async function focusSlot(key: string | number): Promise<void> {
  await nextTick()
  list.value
    ?.querySelector<HTMLElement>(`[data-slot="${key}"] .lq-slot-btn`)
    ?.focus()
}

async function save(slot: number): Promise<void> {
  // While the act's last turn is read, a save opens the act page instead
  // (nothing to save until the next act begins): leave the way clear.
  const held = game.actEndPending
  const ok = game.saveToSlot(slot)
  if (held) {
    emit('close')
    return
  }
  asking.value = null
  justSaved.value = ok ? slot : null
  saveFailed.value = !ok
  version.value++
  await focusSlot(slot)
}

function cancel(card: SaveSlot): void {
  asking.value = null
  void focusSlot(cardKey(card))
}

function load(card: SaveSlot): void {
  if (card.name !== undefined) game.loadNamedGame(card.name)
  else if (card.slot === QUICK) game.loadGame()
  else game.loadFromSlot(card.slot)
  emit('close')
}

/** Ask in the card, with focus on Cancel (the safe answer). */
async function ask(card: SaveSlot): Promise<void> {
  asking.value = cardKey(card)
  await nextTick()
  list.value?.querySelector<HTMLElement>('.lq-ask-cancel')?.focus()
}

function pick(card: SaveSlot): void {
  justSaved.value = null
  if (props.fromTitle) {
    const loaded =
      card.name === undefined
        ? game.loadFromTitle(card.slot)
        : game.loadFromTitle(card.slot, card.name)
    if (loaded) emit('close')
    return
  }
  if (saving.value && !filled(card)) void save(card.slot)
  else void ask(card)
}

function confirm(card: SaveSlot): void {
  if (saving.value) void save(card.slot)
  else load(card)
}

const slotName = (card: SaveSlot) =>
  card.name ?? (card.slot === QUICK ? 'the quick save' : `slot ${card.slot}`)

/** The card's name: what it does, then what the card shows (if known). */
function cardLabel(card: SaveSlot): string {
  const name = slotName(card)
  if (!filled(card)) return `${saving.value ? 'Save to' : 'Empty'} ${name}`
  const quests = card.quests
    ? `${card.quests.completed} of ${card.quests.total} quests`
    : ''
  const details = [
    actLabel(card.act),
    card.room,
    quests,
    savedWhen(card.timestamp),
  ]
    .filter(Boolean)
    .join(', ')
  const action = `${saving.value ? 'Save to' : 'Load'} ${name}`
  const label = details ? `${action}: ${details}` : action
  return card.outdated ? `${label}. ${OUTDATED}` : label
}
</script>

<template>
  <LanternDialog
    :title="saving ? 'Save game' : 'Load game'"
    eyebrow="Game"
    @close="emit('close')"
  >
    <p class="lq-intro">
      {{
        saving
          ? 'Pick a slot. A slot in use asks before it is replaced.'
          : 'Pick a save to go back to.'
      }}
    </p>
    <p v-if="saveFailed" class="lq-save-error" role="alert">
      Your game could not be saved: this browser's storage is full or blocked.
    </p>
    <p
      v-if="fromTitle && game.titleLoadError"
      class="lq-save-error"
      role="alert"
    >
      {{ game.titleLoadError }}
    </p>
    <div ref="list">
      <template v-for="group in groups" :key="group.id">
        <h3 v-if="group.heading" class="lq-named-heading">
          {{ group.heading }}
        </h3>
        <ul class="lq-slots" :class="{ 'lq-named': group.id === 'named' }">
          <li
            v-for="card in group.cards"
            :key="cardKey(card)"
            :data-slot="cardKey(card)"
            class="lq-slot"
            :class="{
              'lq-slot-filled': filled(card),
              'lq-slot-old': card.outdated,
              'lq-slot-on':
                asking === cardKey(card) || justSaved === cardKey(card),
            }"
          >
            <button
              type="button"
              class="lq-slot-btn"
              :disabled="!saving && (!filled(card) || card.outdated)"
              :aria-label="cardLabel(card)"
              @click="pick(card)"
            >
              <span
                class="lq-slot-badge"
                :class="{ 'lq-slot-quick': card.slot === QUICK }"
                aria-hidden="true"
                >{{ badge(card) }}</span
              >
              <span class="lq-slot-main" aria-hidden="true">
                <template v-if="card.name !== undefined">
                  <span class="lq-slot-room">{{ card.name }}</span>
                  <span class="lq-slot-meta">
                    <span>{{
                      whereLine(card) || savedWhen(card.timestamp)
                    }}</span>
                  </span>
                  <span v-if="whereLine(card)" class="lq-slot-meta">
                    <template v-if="card.quests">
                      <span class="lq-track"
                        ><span
                          class="lq-fill"
                          :style="{ width: `${percent(card)}%` }"
                        ></span
                      ></span>
                      <span
                        >{{ card.quests.completed }} of
                        {{ card.quests.total }} quests</span
                      >
                    </template>
                    <span>{{ savedWhen(card.timestamp) }}</span>
                  </span>
                  <span v-if="card.outdated" class="lq-slot-why">{{
                    OUTDATED
                  }}</span>
                </template>
                <template v-else-if="filled(card)">
                  <span class="lq-slot-act">{{ actLabel(card.act) }}</span>
                  <span class="lq-slot-room">{{
                    card.room ?? 'Quick save'
                  }}</span>
                  <span class="lq-slot-meta">
                    <template v-if="card.quests">
                      <span class="lq-track"
                        ><span
                          class="lq-fill"
                          :style="{ width: `${percent(card)}%` }"
                        ></span
                      ></span>
                      <span
                        >{{ card.quests.completed }} of
                        {{ card.quests.total }} quests</span
                      >
                    </template>
                    <span>{{ savedWhen(card.timestamp) }}</span>
                  </span>
                  <span v-if="card.outdated" class="lq-slot-why">{{
                    OUTDATED
                  }}</span>
                </template>
                <span v-else class="lq-slot-empty">{{
                  saving ? 'Empty slot · tap to save here' : 'Empty slot'
                }}</span>
              </span>
              <span v-if="card.outdated" class="lq-slot-lock" aria-hidden="true"
                >⊘</span
              >
              <span v-if="justSaved === cardKey(card)" class="lq-new"
                >Just saved</span
              >
            </button>
            <div
              v-if="asking === cardKey(card)"
              class="lq-ask"
              role="group"
              :aria-label="`${saving ? 'Replace' : 'Load'} ${slotName(card)}`"
              @keydown.escape.stop="cancel(card)"
            >
              <span class="lq-ask-text">{{
                saving
                  ? 'Replace this save with your current game?'
                  : 'Load this save? Anything since your last save is lost.'
              }}</span>
              <span class="lq-ask-buttons">
                <button
                  type="button"
                  class="lq-ask-cancel"
                  @click="cancel(card)"
                >
                  Cancel
                </button>
                <button type="button" class="lq-ask-ok" @click="confirm(card)">
                  {{ saving ? 'Replace' : 'Load' }}
                </button>
              </span>
            </div>
          </li>
        </ul>
      </template>
    </div>
    <p class="lq-footnote">Saves are kept in this browser only.</p>
  </LanternDialog>
</template>

<style scoped>
.lq-intro {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--lq-muted);
}
.lq-save-error {
  margin: 0 0 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--lq-failure-soft);
  color: var(--lq-failure);
  font-size: 14px;
}
.lq-slots {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 8px;
}
.lq-named-heading {
  margin: 18px 0 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lq-muted);
}
.lq-slot {
  overflow: hidden;
  border-radius: 12px;
  border: 1px dashed var(--lq-line2);
}
.lq-slot-filled {
  border-style: solid;
  background: var(--lq-raised);
}
.lq-slot-old {
  background: transparent;
}
.lq-slot-on {
  border-color: var(--lq-accent-line);
  background: var(--lq-accent-soft);
}
.lq-slot-btn {
  width: 100%;
  min-height: 64px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: none;
  background: none;
  color: var(--lq-fg);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.lq-slot-btn:disabled {
  opacity: 0.55;
  cursor: default;
}
.lq-slot-badge {
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 17px;
  border: 1px solid var(--lq-line2);
  font-family: var(--lq-font-display);
  font-size: 16px;
  color: var(--lq-muted);
}
.lq-slot-filled .lq-slot-badge {
  border-color: var(--lq-accent-line);
  color: var(--lq-accent-text);
}
.lq-slot .lq-slot-quick {
  border: none;
  background: var(--lq-accent);
  color: var(--lq-on-accent);
}
.lq-slot-old .lq-slot-badge {
  border-color: var(--lq-line2);
  color: var(--lq-muted);
}
.lq-slot-old .lq-slot-quick {
  background: var(--lq-line2);
  color: var(--lq-muted);
}
.lq-slot-old .lq-slot-main {
  opacity: 0.6;
}
.lq-slot-old .lq-slot-act {
  color: var(--lq-muted);
}
.lq-slot-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.lq-slot-act {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lq-accent-text);
}
.lq-slot-room {
  font-family: var(--lq-font-display);
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lq-slot-meta {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 10px;
  font-size: 12px;
  color: var(--lq-muted);
}
.lq-track {
  width: 48px;
  height: 4px;
  border-radius: 2px;
  background: var(--lq-line);
  overflow: hidden;
}
.lq-fill {
  display: block;
  height: 4px;
  background: var(--lq-accent);
}
.lq-slot-why {
  margin-top: 4px;
  font-size: 12px;
  color: var(--lq-failure);
}
.lq-slot-lock {
  flex: 0 0 auto;
  font-size: 15px;
  color: var(--lq-muted);
}
.lq-slot-empty {
  font-size: 13px;
  color: var(--lq-muted);
}
.lq-new {
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 600;
  color: var(--lq-accent-text);
}
.lq-ask {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--lq-accent-line);
}
.lq-ask-text {
  flex: 1 1 180px;
  font-size: 13px;
}
.lq-ask-buttons {
  display: flex;
  gap: 8px;
}
.lq-ask-cancel,
.lq-ask-ok {
  min-height: 44px;
  padding: 0 14px;
  border-radius: 10px;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.lq-ask-cancel {
  border: 1px solid var(--lq-line2);
  background: transparent;
  color: var(--lq-fg);
}
.lq-ask-ok {
  border: none;
  background: var(--lq-accent);
  color: var(--lq-on-accent);
  font-weight: 600;
}
.lq-footnote {
  margin: 14px 0 0;
  font-size: 12px;
  color: var(--lq-muted);
}
</style>
