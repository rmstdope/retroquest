<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { renderMarkup } from '@/utils/theme'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import {
  POPUP_NARRATION_ID,
  chapterUnits,
  firstQuestUnit,
  turnUnits,
} from '@/lantern/narrationUnits'
import { actFolder } from '@/lantern/narrationManifest'
import { useAudio } from '@/composables/useAudio'
import { useActMusic } from '@/composables/useActMusic'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { nameActions, type NameAction } from '@/lantern/nameActions'
import { parseCountedName } from '@/lantern/inventoryChanges'
import {
  SHORT_QUERY,
  useMediaQuery,
  KEYBOARD_QUERY,
  WIDE_QUERY,
} from '@/composables/useMediaQuery'
import ActionComposer from './ActionComposer.vue'
import ChapterPage from './ChapterPage.vue'
import CompassPanel from './CompassPanel.vue'
import DockBar from './DockBar.vue'
import EndScreen from './EndScreen.vue'
import FinishDialog from './FinishDialog.vue'
import JournalPanel from './JournalPanel.vue'
import LanternDialog from './LanternDialog.vue'
import GameMenu, { type InfoKind, type MenuKind } from './GameMenu.vue'
import QuestDialog, { type QuestView } from './QuestDialog.vue'
import QuitDialog from './QuitDialog.vue'
import SaveLoadDialog from './SaveLoadDialog.vue'
import SettingsDialog from './SettingsDialog.vue'
import LanternHeader from './LanternHeader.vue'
import RoomCard from './RoomCard.vue'
import SaveToast from './SaveToast.vue'
import SectionNav, { type Section } from './SectionNav.vue'
import StoryNameMenu from './StoryNameMenu.vue'
import StoryTurn from './StoryTurn.vue'
import TitlePage from './TitlePage.vue'

/**
 * Shell of the Lantern UI (the only UI; old `?ui=` links open it too): header, story (one
 * StoryTurn per turn) and the action composer. On laptops (≥1024 × 560) a
 * room card sits above the story and the map and journal in a side column.
 * Smaller screens show one section at a time (Story, Bag, Spells, Quests,
 * Map) with section tabs at the bottom, or in the header when short.
 * There the actions are a sheet (at most 62% of the height) that folds into
 * a one-row bar: by hand, or by itself only when an answer does not fit
 * beside it (always on short screens, where it also starts folded).
 * A new turn opens at its start, with a "More below" pill while the story
 * goes on below the visible part.
 * After the last act, Finish the game asks to save (FinishDialog), then
 * only the end screen shows; the act's music keeps playing under it.
 * A player's command, and the arrival that opens an act, is narrated when the
 * act has recordings and narration is on (`useNarrationStore`): the layout
 * starts it with the new turn, a click on
 * the story hurries it (two skip), Space/Enter hurry and Escape skips while
 * focus is not on a field or a control, and a pop-up stops it.
 */
const game = useGameStore()
const settings = useSettingsStore()
const narration = useNarrationStore()
const wide = useMediaQuery(WIDE_QUERY)
const short = useMediaQuery(SHORT_QUERY)
/** A mouse and keyboard: the narration hint names keys instead of taps. */
const keyboardPlayer = useMediaQuery(KEYBOARD_QUERY)
const hintText = computed(() =>
  keyboardPlayer.value
    ? 'Space to hurry · Esc to skip'
    : 'Tap to hurry · double-tap to skip',
)
const section = ref<Section>('story')
const dockOpen = ref(!short.value)
watch(short, (isShort) => {
  if (isShort) dockOpen.value = false
})

// "Open in journal" on a phone: show the Quests section (it opens the quest).
watch(
  () => game.questToOpen,
  (name) => {
    if (name && !wide.value) section.value = 'quests'
  },
)

// A new game (after quit) starts on the story, with the journal and the
// actions afresh (they are keyed by the game number).
watch(
  () => game.gameNumber,
  () => {
    section.value = 'story'
  },
)

// The laptop shows everything at once; coming back from it starts on the story.
watch(wide, (isWide) => {
  if (isWide) section.value = 'story'
})
const storyEl = ref<HTMLElement | null>(null)
/** Unread story below the visible part (a long turn opens at its start). */
const moreBelow = ref(false)
const moreBelowButton = ref<HTMLButtonElement | null>(null)
/** Slack so rounding never leaves the pill up at the very end. */
const END_SLACK = 8
/** A story sliver (beside the open sheet on a small phone) has no room for it. */
const PILL_ROOM = 96

/**
 * Show the pill while story text continues below the visible part. When it
 * goes while focused (pressed to the end), focus moves on to the actions.
 */
function updateMoreBelow(): void {
  const story = storyEl.value
  const hadFocus =
    !!moreBelowButton.value && document.activeElement === moreBelowButton.value
  moreBelow.value =
    !!story &&
    story.clientHeight >= PILL_ROOM &&
    story.scrollTop + story.clientHeight < story.scrollHeight - END_SLACK
  if (hadFocus && !moreBelow.value) focusActions()
}

/** Scroll on by almost a screen, keeping a line or two for context. */
function readOn(): void {
  const story = storyEl.value
  if (!story) return
  const still =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--lq-motion')
      .trim() === '0'
  story.scrollBy({
    top: story.clientHeight - 48,
    behavior: still ? 'auto' : 'smooth',
  })
}
const composer = ref<InstanceType<typeof ActionComposer> | null>(null)
const dock = ref<InstanceType<typeof DockBar> | null>(null)

/** Focus the actions: the open composer, or the folded bar's Actions button. */
function focusActions(): void {
  if (!wide.value && !dockOpen.value) dock.value?.focus()
  else composer.value?.focus()
}

async function fold(): Promise<void> {
  dockOpen.value = false
  await nextTick()
  dock.value?.focus()
}

async function openDock(mode: 'actions' | 'type'): Promise<void> {
  composer.value?.setMode(mode)
  dockOpen.value = true
  await nextTick()
  composer.value?.focus()
}

/** Whether the newest turn is taller than the story area beside the actions. */
function answerTooLong(): boolean {
  const story = storyEl.value
  const last = story?.lastElementChild as HTMLElement | null | undefined
  return !!story && !!last && last.offsetHeight > story.clientHeight
}

// The story also changes size without scrolling: the sheet opens or folds,
// the window turns, a section is shown again, the room card grows.
let storyResize: ResizeObserver | undefined

/** Keys that steer the narration; see `onNarrationKey`. */
function onNarrationKey(event: KeyboardEvent): void {
  if (!narration.isNarrating || event.defaultPrevented) return
  if (event.ctrlKey || event.metaKey || event.altKey) return
  const hurries = event.key === ' ' || event.key === 'Enter'
  if (!hurries && event.key !== 'Escape') return
  // A menu or dialog has its own keys (Escape closes it first).
  if (
    game.showModal ||
    game.showTitle ||
    game.quitAsked ||
    game.shownQuest ||
    gameDialog.value ||
    nameMenu.value
  )
    return
  const target = event.target instanceof Element ? event.target : null
  if (target?.closest('input, textarea, select, [contenteditable]')) return
  // Space and Enter keep their meaning on a button or a link.
  if (hurries && target?.closest('button, a, [role="button"]')) return
  event.preventDefault()
  if (hurries) narration.hurry()
  else narration.skipAll()
}

onMounted(() => {
  document.addEventListener('keydown', onNarrationKey)
  // The game opens with its first act intro already showing.
  if (game.showModal) void nextTick(focusPopUp)
  if (typeof ResizeObserver !== 'undefined' && storyEl.value) {
    storyResize = new ResizeObserver(updateMoreBelow)
    storyResize.observe(storyEl.value)
  }
})
onUnmounted(() => {
  document.removeEventListener('keydown', onNarrationKey)
  narration.skipAll()
  storyResize?.disconnect()
})

// Larger or smaller text changes how much of the turn is still below.
watch(() => settings.textSize, updateMoreBelow, { flush: 'post' })

// The running act's recordings load in good time for its first answer.
watch(
  () => game.narrationFolder,
  (folder) => {
    if (folder) void narration.preload(folder)
  },
  { immediate: true },
)

// A new answer cuts in on the one being narrated, then is narrated itself
// when it is a player's command or an act's opening arrival in an act with
// recordings (never behind a pop-up). Runs before the story renders, so nothing flashes unspoken.
watch(
  () => game.turns.at(-1)?.id,
  () => {
    narration.skipAll()
    const turn = game.turns.at(-1)
    const folder = game.narrationFolder
    const manifest = folder ? narration.manifestFor(folder) : null
    if (!turn?.narrate || !folder || !manifest || game.showModal) return
    narration.begin(
      turn.id,
      turnUnits(turn, !!turn.firstVisit, manifest),
      folder,
    )
  },
)

// The act-complete page waits while the act's last turn is read aloud (a
// pop-up would cut the voice off), then opens; with nothing to read, at once.
game.setActEndGate(
  (turn) =>
    !!turn.narrate &&
    settings.narrationOn &&
    !!game.narrationFolder &&
    !!narration.manifestFor(game.narrationFolder),
)
watch(
  () => [game.actEndPending, narration.isNarrating] as const,
  ([pending, narrating]) => {
    if (pending && !narrating) game.resumeActEnd()
  },
  { flush: 'post' },
)
onUnmounted(() => game.setActEndGate(null))

// Each quest card's chime rings when the card shows: as the narration reaches
// it, or at once with its turn (cards shown together ring once). A new turn
// shows the previous one whole, so chimes still owed ring then.
let chimeTurn: { id: number; cards: number } | null = null
let stopChime: (() => void) | null = null
watch(
  () => game.turns.at(-1)?.id,
  () => {
    stopChime?.()
    stopChime = null
    if (chimeTurn)
      game.ringQuestSounds(
        chimeTurn.id,
        Array.from({ length: chimeTurn.cards }, (_, index) => index),
      )
    const turn = game.turns.at(-1)
    const cards = turn?.quests?.length ?? 0
    chimeTurn = turn && cards ? { id: turn.id, cards } : null
    if (!turn || !cards) return
    const first = firstQuestUnit(turn)
    stopChime = watch(
      () =>
        Array.from({ length: cards }, (_, index) =>
          narration.revealed(turn.id, first + index),
        ),
      (shown) => {
        const now = shown.flatMap((on, index) => (on ? [index] : []))
        game.ringQuestSounds(turn.id, now)
      },
      { immediate: true },
    )
  },
)

// A pop-up, or a new game, stops the voice (a pop-up's own narration follows).
watch(
  () => [game.showModal, game.gameNumber] as const,
  ([open]) => {
    if (open || narration.isNarrating) narration.skipAll()
  },
)

// A new game counts its narrated turns (for the hint) from the start.
watch(() => game.gameNumber, narration.resetGame)

// Switching narration off in Settings ends the turn being spoken.
watch(
  () => settings.narrationOn,
  (on) => {
    if (!on) narration.skipAll()
  },
)

// A chapter page is read aloud when its act has recordings; one page
// following another cuts in on it, and closing the last one stops the voice;
// a page under the title page is read once that is gone. Declared after the watch above so the old voice is cut
// first, and before the render so nothing flashes unspoken.
watch(
  () => [game.showModal, game.modalChapter, game.showTitle] as const,
  async ([open, chapter, title]) => {
    narration.skipAll()
    // The game's first chapter page waits under the title page.
    if (!open || title || !chapter) return
    const folder = actFolder(chapter.act)
    if (!folder) return
    await narration.preload(folder)
    // Still the same page once the recordings are in?
    if (!game.showModal || game.modalChapter !== chapter) return
    const manifest = narration.manifestFor(folder)
    if (!manifest) return
    narration.begin(POPUP_NARRATION_ID, chapterUnits(chapter, manifest), folder)
  },
)

/** Leave a chapter page: its voice stops, then the game goes on (also for Escape). */
function continueFromChapter(): void {
  narration.skipAll()
  game.continueChapter()
}

// Show a new turn from its start (jsdom has no scrollIntoView). A command
// run from another section (Use, Cast, Go) first brings the story back, and
// focus moves to the actions as the pressed button has gone (likewise for
// the folded bar's exit buttons, which change with the room). Follows the
// newest turn's id: at the turn cap the count stops changing.
watch(
  () => game.turns.at(-1)?.id,
  async () => {
    const away = !wide.value && section.value !== 'story'
    section.value = 'story'
    await nextTick()
    storyEl.value?.lastElementChild?.scrollIntoView?.({ block: 'start' })
    const folds =
      !wide.value && dockOpen.value && (short.value || answerTooLong())
    if (folds) {
      dockOpen.value = false
      await nextTick()
    }
    updateMoreBelow()
    const lost =
      !wide.value && !dockOpen.value && document.activeElement === document.body
    if ((away || folds || lost) && !game.showModal) focusActions()
  },
  { flush: 'post' },
)

// The quest chime and fanfare (sound settings apply).
game.setAudioPlayer(useAudio())
const music = useActMusic()

// --- Game menu, Stats and Help (dialogs the player opens) ---
const gameDialog = ref<'menu' | MenuKind | null>(null)
const INFO_TITLES: Record<InfoKind, string> = { stats: 'Stats', help: 'Help' }
let dialogOpener: HTMLElement | null = null

function openGameDialog(kind: 'menu' | MenuKind): void {
  if (!gameDialog.value)
    dialogOpener = document.activeElement as HTMLElement | null
  gameDialog.value = kind
}

// A game pop-up closes the player's dialogs (they do not come back after).
watch(
  () => game.showModal,
  (open) => {
    if (!open) return
    gameDialog.value = null
    game.shownQuest = null
  },
)

/** Closing the last one gives focus back to what opened the first one. */
async function closeGameDialog(): Promise<void> {
  gameDialog.value = null
  await nextTick()
  if (document.activeElement === document.body && dialogOpener?.isConnected)
    dialogOpener.focus()
}

/** The quest whose details are open, from the active or completed list. */
const shownQuestView = computed<QuestView | null>(() => {
  const name = game.shownQuest
  if (!name) return null
  return (
    [...game.activeQuests, ...game.completedQuests].find(
      (quest) => quest.name === name,
    ) ?? null
  )
})

/** Help's entry for narration (the engine's help lists commands only). */
const NARRATION_HELP =
  '\n[bold]Narration:[/bold] tap the story or press Space to hurry the current line; ' +
  'double-tap or press Esc to show the rest at once. Any action cuts in. ' +
  'Turn narration off in Settings.\n'

/** Stats or Help as HTML (Help ends with the music credits). */
const infoHtml = computed(() => {
  const kind = gameDialog.value
  if (kind !== 'stats' && kind !== 'help') return ''
  const html = renderMarkup(game.readInfo(kind))
  return kind === 'help'
    ? html + renderMarkup(NARRATION_HELP) + music.buildAttributionHtml()
    : html
})

// --- Names in the story: click one for a small menu of what fits ---
const nameMenu = ref<{
  actions: NameAction[]
  x: number
  top: number
  bottom: number
} | null>(null)
/** Where focus goes when the menu closes: the chip, or what had focus. */
let focusBeforeMenu: HTMLElement | null = null

/**
 * A click on an item or character name in the story, or on a Here chip
 * (which carries the engine's name), opens its menu.
 */
function onNameClick(event: MouseEvent): void {
  const name = (event.target as HTMLElement).closest<HTMLElement>(
    '.theme-item_name, .theme-character_name, [data-name-kind]',
  )
  if (!name || !game.acceptInput) return
  const kind =
    name.dataset.nameKind === 'character' ||
    name.classList.contains('theme-character_name')
      ? 'character'
      : 'item'
  const actions = nameActions(
    kind,
    name.dataset.name ?? name.textContent ?? '',
    {
      characters: game.characters,
      items: game.items,
      bag: game.rawInventory.map((entry) => parseCountedName(entry.name).name),
      spells: game.spellEntries.map((entry) => parseCountedName(entry).name),
      shortNames: game.shortNames,
    },
  )
  if (!actions.length) return
  const box = name.getBoundingClientRect()
  // A chip takes focus back (Safari does not focus a clicked button).
  focusBeforeMenu =
    name instanceof HTMLButtonElement
      ? name
      : (document.activeElement as HTMLElement | null)
  nameMenu.value = { actions, x: box.left, top: box.top, bottom: box.bottom }
}

/**
 * Focus goes back without scrolling (a scroll away also closes the menu).
 * When nothing had it (a mouse click on text) and a key closed the menu,
 * it goes to the actions; a click or scroll leaves it be (on a phone,
 * focusing the composer could open the keyboard).
 */
function closeNameMenu(byKey: boolean): void {
  nameMenu.value = null
  if (focusBeforeMenu?.isConnected && focusBeforeMenu !== document.body)
    focusBeforeMenu.focus({ preventScroll: true })
  else if (byKey) void nextTick(focusActions)
}

/** Run the picked action; focus goes on to the actions, as after a command. */
function runNameAction(command: string): void {
  nameMenu.value = null
  game.submitCommand(command)
  void nextTick(focusActions)
}

/** A click on the story: a tap for the narration (names keep their menu), then the name menu. */
function onStoryClick(event: MouseEvent): void {
  const target = event.target instanceof Element ? event.target : null
  if (
    !target?.closest(
      'button, a, [data-name-kind], .theme-item_name, .theme-character_name',
    )
  )
    narration.tap()
  onNameClick(event)
}

const chapterPage = ref<InstanceType<typeof ChapterPage> | null>(null)

/** Leave the title page for the first act's chapter page. */
async function startGame(): Promise<void> {
  game.dismissTitle()
  await nextTick()
  focusPopUp()
}
const chapterDialog = ref<HTMLElement | null>(null)
const chapterTrap = useFocusTrap(chapterDialog)

/**
 * A chapter page keeps Tab inside, and Escape goes on like its button (also
 * after a click on its text, which focuses the page itself).
 */
function onChapterKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.stopPropagation()
    continueFromChapter()
  } else chapterTrap.onKeydown(event)
}

// Closing the save dialog puts focus back on the last chapter's button.
watch(
  () => game.finishAsked,
  (asked) => {
    if (!asked && game.showModal) chapterPage.value?.focus()
  },
  { flush: 'post' },
)

/** Focus the open chapter page's button. */
function focusPopUp(): void {
  // The title page comes first; the page under it gets focus after Start.
  if (game.showTitle) return
  chapterPage.value?.focus()
}

// Move keyboard focus into each pop-up as it opens or one follows another
// (one chapter page, then the next), and back to the actions when the last
// one closes.
watch(
  () => [game.showModal, game.modalChapter] as const,
  ([open], [wasOpen]) => {
    if (open) focusPopUp()
    else if (wasOpen) focusActions()
  },
  { flush: 'post' },
)
</script>

<template>
  <div class="lq-root">
    <!-- The game has ended: nothing but the end screen. -->
    <EndScreen
      v-if="game.ending"
      :text="game.ending.text"
      :saved="game.ending.saved"
    />
    <template v-else>
      <LanternHeader
        :compact="!wide"
        @menu="openGameDialog('menu')"
        @open="openGameDialog"
      >
        <template v-if="!wide && short" #nav>
          <SectionNav v-model="section" class="lq-nav-top" />
        </template>
      </LanternHeader>

      <main class="lq-main" :class="{ 'lq-wide': wide }">
        <RoomCard v-if="wide" class="lq-card" @click="onNameClick" />
        <div v-show="wide || section === 'story'" class="lq-story-wrap">
          <section
            ref="storyEl"
            class="lq-story"
            aria-label="Story"
            @click="onStoryClick"
            @scroll.passive="updateMoreBelow"
          >
            <h2 class="lq-sr-only">Story</h2>
            <StoryTurn v-for="turn in game.turns" :key="turn.id" :turn="turn" />
          </section>
          <p
            v-if="narration.hintVisible"
            class="lq-narration-hint"
            :class="{ 'lq-hint-raised': moreBelow }"
          >
            {{ hintText }}
          </p>
          <button
            v-if="moreBelow"
            ref="moreBelowButton"
            type="button"
            class="lq-more-below"
            @click="readOn"
          >
            More below <span aria-hidden="true">↓</span>
          </button>
        </div>

        <ActionComposer
          v-show="wide || (section === 'story' && dockOpen)"
          :key="`composer-${game.gameNumber}`"
          ref="composer"
          class="lq-composer"
          :class="{ 'lq-sheet': !wide }"
          :foldable="!wide"
          @fold="fold"
        />
        <DockBar
          v-if="!wide && section === 'story' && !dockOpen"
          ref="dock"
          @open="openDock"
        />

        <template v-if="!wide">
          <CompassPanel v-if="section === 'map'" heading />
          <JournalPanel
            v-else-if="section !== 'story'"
            :key="`journal-${game.gameNumber}`"
            :tab="section"
            class="lq-section-view"
          />
        </template>

        <aside v-if="wide" class="lq-aside" aria-label="Map and journal">
          <CompassPanel />
          <JournalPanel
            :key="`journal-${game.gameNumber}`"
            class="lq-journal-panel"
          />
        </aside>
      </main>

      <SectionNav
        v-if="!wide && !short"
        v-model="section"
        class="lq-nav-bottom"
      />

      <SaveToast />

      <StoryNameMenu
        v-if="nameMenu"
        :actions="nameMenu.actions"
        :x="nameMenu.x"
        :top="nameMenu.top"
        :bottom="nameMenu.bottom"
        @pick="runNameAction"
        @close="closeNameMenu"
      />

      <!-- The game's title page, over the first act's chapter page. -->
      <TitlePage
        v-if="game.showTitle"
        :text="game.titleText"
        @start="startGame"
      />

      <!-- Dialogs the player opens (a game pop-up takes precedence). -->
      <template v-if="!game.showModal">
        <QuitDialog v-if="game.quitAsked" />
        <QuestDialog
          v-else-if="shownQuestView"
          :key="shownQuestView.name"
          :quest="shownQuestView"
          @close="game.shownQuest = null"
        />
        <GameMenu
          v-else-if="gameDialog === 'menu'"
          @close="closeGameDialog"
          @open="openGameDialog"
        />
        <SettingsDialog
          v-else-if="gameDialog === 'settings'"
          @close="closeGameDialog"
        />
        <SaveLoadDialog
          v-else-if="gameDialog === 'save' || gameDialog === 'load'"
          :mode="gameDialog"
          @close="closeGameDialog"
        />
        <LanternDialog
          v-else-if="gameDialog"
          :key="gameDialog"
          :title="INFO_TITLES[gameDialog]"
          eyebrow="RetroQuest"
          @close="closeGameDialog"
        >
          <!-- eslint-disable vue/no-v-html -->
          <div class="lq-info" v-html="infoHtml"></div>
          <!-- eslint-enable vue/no-v-html -->
        </LanternDialog>
      </template>

      <!-- Act intro / act complete: a full-screen chapter page. Each chapter
         is a new page, so it opens at its top. -->
      <section
        v-if="game.showModal && game.modalChapter"
        ref="chapterDialog"
        class="lq-chapter-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lq-dialog-title"
        tabindex="-1"
        @keydown="onChapterKeydown"
      >
        <ChapterPage
          :key="`${game.modalChapter.kind} ${game.modalChapter.act}`"
          ref="chapterPage"
          :chapter="game.modalChapter"
          title-id="lq-dialog-title"
          @continue="continueFromChapter()"
        />
      </section>

      <!-- Save before finishing, over the last act's chapter page. -->
      <FinishDialog v-if="game.showModal && game.finishAsked" />
    </template>
  </div>
</template>

<style scoped>
.lq-root {
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--lq-bg);
  color: var(--lq-fg);
  font-family: var(--lq-font-ui);
}
.lq-main {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}
.lq-wide {
  max-width: 1240px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  grid-template-rows: auto minmax(0, 1fr) auto;
  column-gap: 20px;
}
.lq-wide .lq-card,
.lq-wide .lq-story-wrap,
.lq-wide .lq-composer {
  grid-column: 1;
}
/* An expanded long room scrolls inside the card instead of pushing the story
   and the actions out of the window. */
.lq-wide .lq-card {
  max-height: 40vh;
  overflow-y: auto;
}
.lq-aside {
  grid-column: 2;
  grid-row: 1 / -1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.lq-sheet {
  flex: 0 0 auto;
  max-height: 62dvh;
  overflow-y: auto;
}
/* Type mode is too short to need the scroll, and a scrolling sheet would clip
   the completion list that opens above the command box (rq-mvd). */
.lq-sheet.lq-typing {
  overflow-y: visible;
}
.lq-journal-panel,
.lq-section-view {
  flex: 1;
}
.lq-nav-bottom {
  flex: 0 0 auto;
  border-top: 1px solid var(--lq-line);
  background: var(--lq-surface);
  padding-bottom: env(safe-area-inset-bottom);
}
.lq-story-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
}
.lq-narration-hint {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  margin: 0;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid var(--lq-line);
  background: var(--lq-raised);
  color: var(--lq-muted);
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  animation: lq-hint-in calc(0.3s * var(--lq-motion)) ease;
}
.lq-narration-hint.lq-hint-raised {
  bottom: 56px;
}
@keyframes lq-hint-in {
  from {
    opacity: 0;
  }
}
.lq-more-below {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  height: 36px;
  padding: 0 16px;
  border-radius: 18px;
  border: 1px solid var(--lq-accent-line);
  background: var(--lq-surface);
  color: var(--lq-accent-text);
  font: inherit;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 6px 18px rgb(0 0 0 / 0.3);
}
/* The pill stays slim; its touch target is 44px tall like the other controls. */
.lq-more-below::before {
  content: '';
  position: absolute;
  inset: -4px 0;
}
.lq-story {
  flex: 1;
  /* Without this the story grows past the shell instead of scrolling in it. */
  min-height: 0;
  overflow-y: auto;
  /* Contains visually hidden (absolutely positioned) screen-reader text, which
     would otherwise extend the page below the shell. */
  position: relative;
  display: flex;
  flex-direction: column;
  gap: calc(18px * var(--lq-density));
}
.lq-send {
  width: 100%;
  height: 48px;
  padding: 0 18px;
  border: none;
  border-radius: var(--lq-radius);
  background: var(--lq-accent);
  color: var(--lq-on-accent);
  font-weight: 600;
  cursor: pointer;
}
.lq-chapter-dialog {
  position: fixed;
  inset: 0;
  z-index: 50;
}
/* Not a Tab stop: it takes focus when its text is clicked, so Escape and
   Tab keep working. */
.lq-chapter-dialog:focus {
  outline: none;
}
.lq-info {
  font-family: var(--lq-font-ui);
  font-size: 14px;
  line-height: 1.55;
  color: var(--lq-prose);
  white-space: pre-wrap;
  /* The divider colour of the music credits' markup. */
  --border-color: var(--lq-line);
}
.lq-info :deep(a) {
  color: var(--lq-accent-text);
  text-decoration: underline;
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
