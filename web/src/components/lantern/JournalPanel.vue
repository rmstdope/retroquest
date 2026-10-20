<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { displayName } from '@/lantern/displayName'
import { parseCountedName } from '@/lantern/inventoryChanges'
import { renderMarkup } from '@/utils/theme'

/**
 * The journal beside the story on laptops: Bag, Spells and Quests tabs.
 * Bag rows can be used and spells cast directly, and tapping a row's text
 * expands its full description (the toggle is named by that visible text, so
 * screen readers hear the description); a quest row opens its details
 * (QuestDialog, via the store's `showQuest`). A dot marks a tab with
 * something new until it is opened. The tabs follow the WAI-ARIA tabs
 * pattern: one tab stop, Left/Right (wrapping), Home and End select a tab.
 * Phones show one tab at a time from their section tabs (the `tab` prop):
 * then there is no tab row, just a heading.
 */
type Tab = 'bag' | 'spells' | 'quests'

const props = defineProps<{ tab?: Tab }>()
const TITLES: Record<Tab, string> = {
  bag: 'Bag',
  spells: 'Spells',
  quests: 'Quests',
}
const game = useGameStore()
const active = ref<Tab>(props.tab ?? 'bag')
const expanded = ref<Set<string>>(new Set())
const tabButtons = ref<HTMLButtonElement[]>([])

const bag = computed(() =>
  game.rawInventory.map((entry) => {
    const { name, count } = parseCountedName(entry.name)
    return { name, count, label: displayName(name), note: entry.description }
  }),
)
const spells = computed(() =>
  game.rawSpells.map((entry) => {
    const { name } = parseCountedName(entry.name)
    return { name, label: displayName(name), note: entry.description }
  }),
)
const quests = computed(() => [...game.activeQuests, ...game.completedQuests])

const tabs = computed(() => [
  {
    id: 'bag' as const,
    label: `Bag · ${bag.value.length}`,
    dot: game.bagHasNew,
  },
  {
    id: 'spells' as const,
    label: `Spells · ${spells.value.length}`,
    dot: game.spellsHaveNew,
  },
  {
    id: 'quests' as const,
    label: `Quests · ${game.activeQuests.length} active`,
    dot: game.questsHaveNew,
  },
])

watch(
  () => props.tab,
  (tab) => {
    if (tab) active.value = tab
  },
)

// Seeing a tab clears its "new" dot, including news that arrives while open.
watch(
  [
    active,
    () => game.bagHasNew,
    () => game.spellsHaveNew,
    () => game.questsHaveNew,
  ],
  () => {
    if (active.value === 'bag' && game.bagHasNew) game.markSeen('bag')
    if (active.value === 'spells' && game.spellsHaveNew) game.markSeen('spells')
    if (active.value === 'quests' && game.questsHaveNew) game.markSeen('quests')
  },
  { immediate: true },
)

// "Open in journal" from the story: go to that quest's row (so closing its
// details comes back to it) and open its details.
const root = ref<HTMLElement | null>(null)
watch(
  () => game.questToOpen,
  async (name) => {
    if (!name) return
    game.questToOpen = null
    active.value = 'quests'
    await nextTick()
    const row = [
      ...(root.value?.querySelectorAll<HTMLElement>('.lq-quest-row') ?? []),
    ].find((b) => b.dataset.quest === name)
    row?.scrollIntoView?.({ block: 'nearest' })
    row?.focus()
    game.showQuest(name)
  },
  { immediate: true },
)

const TAB_KEYS: Record<string, (index: number, count: number) => number> = {
  ArrowRight: (i, n) => (i + 1) % n,
  ArrowLeft: (i, n) => (i - 1 + n) % n,
  Home: () => 0,
  End: (_i, n) => n - 1,
}

async function onTabKey(event: KeyboardEvent, index: number): Promise<void> {
  const move = TAB_KEYS[event.key]
  if (!move) return
  event.preventDefault()
  const next = tabs.value[move(index, tabs.value.length)].id
  active.value = next
  await nextTick()
  // A v-for ref array is not guaranteed to follow the list order.
  tabButtons.value.find((b) => b.id === `lq-tab-${next}`)?.focus()
}

function run(command: string): void {
  if (game.acceptInput) game.submitCommand(command)
}

/** Expand or collapse a Bag or Spells row (keys are prefixed: bag:, spell:). */
function toggle(name: string): void {
  const next = new Set(expanded.value)
  if (next.has(name)) next.delete(name)
  else next.add(name)
  expanded.value = next
}
</script>

<template>
  <section ref="root" class="lq-journal" aria-label="Journal">
    <h2 v-if="tab" class="lq-journal-title">
      {{ TITLES[tab] }}
    </h2>
    <div v-else class="lq-tabs" role="tablist" aria-label="Journal">
      <button
        v-for="(t, index) in tabs"
        :id="`lq-tab-${t.id}`"
        ref="tabButtons"
        :key="t.id"
        type="button"
        role="tab"
        class="lq-tab"
        :aria-selected="active === t.id ? 'true' : 'false'"
        :aria-controls="active === t.id ? `lq-panel-${t.id}` : undefined"
        :tabindex="active === t.id ? 0 : -1"
        @click="active = t.id"
        @keydown="onTabKey($event, index)"
      >
        {{ t.label
        }}<span v-if="t.dot && active !== t.id" class="lq-dot"
          ><span class="lq-sr-only"> (new)</span></span
        >
      </button>
    </div>

    <div
      class="lq-panel"
      v-bind="
        tab
          ? {}
          : {
              id: `lq-panel-${active}`,
              role: 'tabpanel',
              tabindex: 0,
              'aria-labelledby': `lq-tab-${active}`,
            }
      "
    >
      <template v-if="active === 'bag'">
        <p v-if="!bag.length" class="lq-empty">Your bag is empty.</p>
        <ul v-else class="lq-rows">
          <li v-for="item in bag" :key="item.name" class="lq-row">
            <button
              type="button"
              class="lq-row-text"
              :aria-expanded="
                expanded.has(`bag:${item.name}`) ? 'true' : 'false'
              "
              @click="toggle(`bag:${item.name}`)"
            >
              <span class="lq-row-name lq-row-item"
                >{{ item.label
                }}<template v-if="item.count > 1">
                  ×{{ item.count }}</template
                ></span
              >
              <!-- eslint-disable vue/no-v-html -->
              <span
                :class="
                  expanded.has(`bag:${item.name}`)
                    ? 'lq-row-note-full'
                    : 'lq-row-note'
                "
                v-html="renderMarkup(item.note)"
              ></span>
              <!-- eslint-enable vue/no-v-html -->
            </button>
            <button
              type="button"
              class="lq-row-btn"
              :aria-label="`Use ${item.label}`"
              :disabled="!game.acceptInput"
              @click="run(`use ${item.name}`)"
            >
              Use
            </button>
          </li>
        </ul>
      </template>

      <template v-else-if="active === 'spells'">
        <p v-if="!spells.length" class="lq-empty">You know no spells yet.</p>
        <ul v-else class="lq-rows">
          <li v-for="spell in spells" :key="spell.name" class="lq-row">
            <button
              type="button"
              class="lq-row-text"
              :aria-expanded="
                expanded.has(`spell:${spell.name}`) ? 'true' : 'false'
              "
              @click="toggle(`spell:${spell.name}`)"
            >
              <span class="lq-row-name lq-row-spell">{{ spell.label }}</span>
              <!-- eslint-disable vue/no-v-html -->
              <span
                :class="
                  expanded.has(`spell:${spell.name}`)
                    ? 'lq-row-note-full'
                    : 'lq-row-note'
                "
                v-html="renderMarkup(spell.note)"
              ></span>
              <!-- eslint-enable vue/no-v-html -->
            </button>
            <button
              type="button"
              class="lq-row-btn"
              :aria-label="`Cast ${spell.label}`"
              :disabled="!game.acceptInput"
              @click="run(`cast ${spell.name}`)"
            >
              Cast
            </button>
          </li>
        </ul>
      </template>

      <template v-else>
        <p v-if="!quests.length" class="lq-empty">No quests yet.</p>
        <ul v-else class="lq-rows">
          <li v-for="quest in quests" :key="quest.name" class="lq-quest">
            <button
              type="button"
              class="lq-quest-row"
              :data-quest="quest.name"
              aria-haspopup="dialog"
              @click="game.showQuest(quest.name)"
            >
              <span class="lq-quest-name">{{ quest.name }}</span>
              <span
                v-if="quest.main && !quest.done"
                class="lq-badge lq-badge-main"
                >Main</span
              >
              <span v-if="quest.done" class="lq-badge lq-badge-done">Done</span>
            </button>
          </li>
        </ul>
      </template>
    </div>
  </section>
</template>

<style scoped>
.lq-journal {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: var(--lq-radius);
  border: 1px solid var(--lq-line);
  background: var(--lq-surface);
  font-family: var(--lq-font-ui);
}
.lq-journal-title {
  margin: 0;
  padding: 12px 16px 4px;
  font-family: var(--lq-font-display);
  font-size: calc(20px * var(--lq-display-scale));
  font-weight: 500;
  color: var(--lq-fg);
}
.lq-tabs {
  display: flex;
  gap: 4px;
  padding: 4px 12px 0;
  border-bottom: 1px solid var(--lq-line);
}
.lq-tab {
  position: relative;
  min-height: 44px;
  padding: 0 10px;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--lq-muted);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.lq-tab[aria-selected='true'] {
  color: var(--lq-fg);
  border-bottom-color: var(--lq-accent);
}
.lq-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-left: 6px;
  border-radius: 4px;
  background: var(--lq-accent);
  vertical-align: middle;
}
.lq-panel {
  min-height: 0;
  overflow-y: auto;
  padding: 4px 16px 12px;
}
.lq-rows {
  list-style: none;
  margin: 0;
  padding: 0;
}
.lq-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: calc(10px * var(--lq-density)) 0;
  border-bottom: 1px solid var(--lq-line);
}
.lq-row-text {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.lq-row-note-full {
  display: block;
  font-size: 12px;
  color: var(--lq-muted);
}
.lq-row-name {
  display: block;
  font-size: 15px;
}
.lq-row-item {
  color: var(--lq-item);
}
.lq-row-spell {
  color: var(--lq-spell);
}
.lq-row-note {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 12px;
  color: var(--lq-muted);
}
.lq-row-btn {
  flex: 0 0 auto;
  min-height: 44px;
  min-width: 56px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--lq-line2);
  background: transparent;
  color: var(--lq-fg);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.lq-row-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.lq-quest {
  border-bottom: 1px solid var(--lq-line);
}
.lq-quest-row {
  width: 100%;
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border: none;
  background: none;
  color: var(--lq-fg);
  font: inherit;
  font-size: 15px;
  text-align: left;
  cursor: pointer;
}
.lq-quest-name {
  flex: 1;
  min-width: 0;
}
.lq-badge {
  flex: 0 0 auto;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
}
.lq-badge-main {
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
  border: 1px solid var(--lq-accent-line);
}
.lq-badge-done {
  color: var(--lq-muted);
  border: 1px solid var(--lq-line);
}
.lq-empty {
  margin: 12px 0;
  font-size: 13px;
  color: var(--lq-muted);
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
