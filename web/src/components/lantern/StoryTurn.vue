<script setup lang="ts">
import { computed } from 'vue'
import type { Turn } from '@/stores/useGameStore'
import type { Chip } from '@/lantern/inventoryChanges'
import { parseTurn } from '@/lantern/parseTurn'
import { displayName } from '@/lantern/displayName'
import { renderMarkup } from '@/utils/theme'

/** One turn in the Lantern story: the command echo, the answer's blocks and chips. */
const props = defineProps<{ turn: Turn }>()

const blocks = computed(() => parseTurn(props.turn.text))

const chips = computed(() => [
  ...props.turn.gained.map((chip) => ({ chip, sign: '+' })),
  ...props.turn.lost.map((chip) => ({ chip, sign: '−' })),
])

function chipLabel(sign: string, chip: Chip): string {
  const count = chip.count > 1 ? ` ×${chip.count}` : ''
  return `${sign} ${displayName(chip.name)}${count}`
}
</script>

<template>
  <article class="lq-turn" data-testid="turn">
    <div v-if="turn.command" class="lq-command" data-testid="command">
      › {{ turn.command }}
    </div>

    <template v-for="(block, index) in blocks" :key="index">
      <!-- eslint-disable vue/no-v-html -->
      <p
        v-if="block.kind === 'text'"
        class="lq-block-text"
        v-html="renderMarkup(block.markup)"
      ></p>
      <p v-else-if="block.kind === 'event'" class="lq-block-event">
        <span class="lq-diamond" aria-hidden="true">◆</span>
        <span v-html="renderMarkup(block.markup)"></span>
      </p>
      <p v-else-if="block.kind === 'failure'" class="lq-block-failure">
        <svg
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
        <span v-html="renderMarkup(block.markup)"></span>
      </p>
      <blockquote
        v-else-if="block.kind === 'dialogue'"
        class="lq-block-dialogue"
      >
        <div v-if="block.speaker" class="lq-speaker">
          {{ displayName(block.speaker) }}
        </div>
        <p class="lq-quote" v-html="renderMarkup(block.markup)"></p>
      </blockquote>
      <ul v-else-if="block.kind === 'checklist'" class="lq-block-checklist">
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

    <div v-if="chips.length" class="lq-chips" aria-label="Changes">
      <span
        v-for="({ chip, sign }, index) in chips"
        :key="index"
        class="lq-chip"
        :class="[
          `lq-chip-${chip.kind}`,
          sign === '+' ? 'lq-chip-gained' : 'lq-chip-lost',
        ]"
        data-testid="chip"
        >{{ chipLabel(sign, chip) }}</span
      >
    </div>
  </article>
</template>

<style scoped>
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
  border: 1.5px dashed var(--lq-line2);
}
.lq-chips {
  display: flex;
  gap: 6px;
  overflow-x: auto;
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
.lq-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
