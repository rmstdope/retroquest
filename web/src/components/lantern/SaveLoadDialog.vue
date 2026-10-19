<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { actLabel, savedWhen } from '@/lantern/saveCard'
import type { SaveSlot } from '@/types/bridge'
import LanternDialog from './LanternDialog.vue'

/**
 * Save or load a game: the 8 slots (and, when loading, the quick save
 * first) as cards with the act, room, quests and time. An empty slot saves
 * at once; replacing a save or loading one asks first, inside its card.
 * A load closes the dialog; a save stays, marked "Just saved".
 */
const props = defineProps<{ mode: 'save' | 'load' }>()
const emit = defineEmits<{ close: [] }>()
const game = useGameStore()

const QUICK = 0
const saving = computed(() => props.mode === 'save')
const version = ref(0) // bumped after a save so the cards are read again
const asking = ref<number | null>(null)
const justSaved = ref<number | null>(null)
const list = ref<HTMLElement | null>(null)

const cards = computed<SaveSlot[]>(() => {
  void version.value
  const slots = game.getSaveSlots()
  const quick = saving.value ? null : game.getQuickSave()
  return quick ? [quick, ...slots] : slots
})

function filled(card: SaveSlot): boolean {
  return card.room !== null
}

function badge(card: SaveSlot): string {
  return card.slot === QUICK ? 'Q' : String(card.slot)
}

function percent(card: SaveSlot): number {
  const q = card.quests
  return q && q.total > 0 ? Math.round((q.completed / q.total) * 100) : 0
}

/** Focus a slot's card (after its question's buttons went away). */
async function focusSlot(slot: number): Promise<void> {
  await nextTick()
  list.value
    ?.querySelector<HTMLElement>(`[data-slot="${slot}"] .lq-slot-btn`)
    ?.focus()
}

async function save(slot: number): Promise<void> {
  game.saveToSlot(slot)
  asking.value = null
  justSaved.value = slot
  version.value++
  await focusSlot(slot)
}

function cancel(slot: number): void {
  asking.value = null
  void focusSlot(slot)
}

function load(slot: number): void {
  if (slot === QUICK) game.loadGame()
  else game.loadFromSlot(slot)
  emit('close')
}

/** Ask in the card, with focus on Cancel (the safe answer). */
async function ask(slot: number): Promise<void> {
  asking.value = slot
  await nextTick()
  list.value?.querySelector<HTMLElement>('.lq-ask-cancel')?.focus()
}

function pick(card: SaveSlot): void {
  justSaved.value = null
  if (saving.value && !filled(card)) void save(card.slot)
  else void ask(card.slot)
}

function confirm(card: SaveSlot): void {
  if (saving.value) void save(card.slot)
  else load(card.slot)
}

const slotName = (card: SaveSlot) =>
  card.slot === QUICK ? 'the quick save' : `slot ${card.slot}`
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
    <ul ref="list" class="lq-slots">
      <li
        v-for="card in cards"
        :key="card.slot"
        :data-slot="card.slot"
        class="lq-slot"
        :class="{
          'lq-slot-filled': filled(card),
          'lq-slot-on': asking === card.slot || justSaved === card.slot,
        }"
      >
        <button
          type="button"
          class="lq-slot-btn"
          :disabled="!saving && !filled(card)"
          :aria-label="
            filled(card)
              ? `${saving ? 'Save to' : 'Load'} ${slotName(card)}: ${actLabel(card.act)}, ${card.room}`
              : `${saving ? 'Save to' : 'Empty'} ${slotName(card)}`
          "
          @click="pick(card)"
        >
          <span
            class="lq-slot-badge"
            :class="{ 'lq-slot-quick': card.slot === QUICK }"
            aria-hidden="true"
            >{{ badge(card) }}</span
          >
          <span class="lq-slot-main" aria-hidden="true">
            <template v-if="filled(card)">
              <span class="lq-slot-act">{{ actLabel(card.act) }}</span>
              <span class="lq-slot-room">{{ card.room }}</span>
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
            </template>
            <span v-else class="lq-slot-empty">{{
              saving ? 'Empty slot · tap to save here' : 'Empty slot'
            }}</span>
          </span>
          <span v-if="justSaved === card.slot" class="lq-new">Just saved</span>
        </button>
        <div
          v-if="asking === card.slot"
          class="lq-ask"
          role="group"
          :aria-label="`${saving ? 'Replace' : 'Load'} ${slotName(card)}`"
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
              @click="cancel(card.slot)"
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
    <p class="lq-footnote">Saves are kept in this browser only.</p>
  </LanternDialog>
</template>

<style scoped>
.lq-intro {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--lq-muted);
}
.lq-slots {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 8px;
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
