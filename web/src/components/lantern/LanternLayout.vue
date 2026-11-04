<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { renderMarkup } from '@/utils/theme'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useStageSpeechStore } from '@/stores/useStageSpeechStore'
import { useArrivalStore } from '@/stores/useArrivalStore'
import { useSceneStore } from '@/stores/useSceneStore'
import { useFlightStore } from '@/stores/useFlightStore'
import { firstQuestUnit } from '@/lantern/narrationUnits'
import { sceneBlock } from '@/lantern/stageArrival'
import { parseTurn } from '@/lantern/parseTurn'
import { decideHurryKey } from '@/lantern/hurryKeys'
import {
  END_SLACK,
  ResizeLanding,
  type StoryGeometry,
} from '@/lantern/ResizeLanding'
import { useLanternPresentation } from '@/composables/useLanternPresentation'
import { useAudio } from '@/composables/useAudio'
import { useActMusic } from '@/composables/useActMusic'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { nameActions, type NameAction } from '@/lantern/nameActions'
import { parseCountedName } from '@/lantern/inventoryChanges'
import { useStoryFollow } from '@/composables/useStoryFollow'
import { STAGE_BUBBLES, useBubbleAges } from '@/composables/useBubbleAges'
import { useNarrationPaper } from '@/composables/useNarrationPaper'
import {
  SHORT_QUERY,
  useMediaQuery,
  KEYBOARD_QUERY,
  WIDE_QUERY,
  SIDES_QUERY,
} from '@/composables/useMediaQuery'
import ActionComposer from './ActionComposer.vue'
import ArrivalOnPicture from './ArrivalOnPicture.vue'
import AcquiredFlight from './AcquiredFlight.vue'
import ChapterPage from './ChapterPage.vue'
import CompassPanel from './CompassPanel.vue'
import DockBar from './DockBar.vue'
import EndScreen from './EndScreen.vue'
import FinishDialog from './FinishDialog.vue'
import JournalDrawer from './JournalDrawer.vue'
import JournalPanel from './JournalPanel.vue'
import LanternDialog from './LanternDialog.vue'
import GameMenu, { type InfoKind, type MenuKind } from './GameMenu.vue'
import QuestDialog, { type QuestView } from './QuestDialog.vue'
import QuitDialog from './QuitDialog.vue'
import SaveLoadDialog from './SaveLoadDialog.vue'
import SettingsDialog from './SettingsDialog.vue'
import LanternHeader from './LanternHeader.vue'
import RoomPlate from './RoomPlate.vue'
import SaveToast from './SaveToast.vue'
import SectionNav, { type Section } from './SectionNav.vue'
import StageButtons from './StageButtons.vue'
import StagePicture from './StagePicture.vue'
import StageSpeech from './StageSpeech.vue'
import ColumnTurn from './ColumnTurn.vue'
import StoryDrawer from './StoryDrawer.vue'
import StoryNameMenu from './StoryNameMenu.vue'
import { NAME_SELECTOR, useNameStops } from '@/composables/useNameStops'
import StoryTurn from './StoryTurn.vue'
import TitlePage from './TitlePage.vue'

/**
 * Shell of the Lantern UI (the only UI; old `?ui=` links open it too): header, story (one
 * StoryTurn per turn) and the action composer. On laptops (≥1024 × 560) the
 * room is played on its picture, which fills the play area: a plate (room
 * and who and what is here) top-left, the buttons Bag, Spells, Quests, Story
 * so far and Map top-right (the journal and the story open as a drawer from
 * the right, the map beneath its button), the narrator's words up the left
 * side and the actions as one row along the bottom.
 * The left side is the narration paper: the turns since the last room change
 * (`useNarrationPaper`), each told as one bubble per paragraph like the speech
 * on the right (`StoryTurn`), the newest bubble lit and older ones dimmed
 * (`useBubbleAges`); the command is not echoed (Story so far keeps it), and
 * quest news told in the middle leaves nothing here. The newest turn grows as
 * the narrator reaches each part and, when it is taller than the room under
 * the plate, scrolls with a "More below" pill. One "▾ Hide" on its own line at the bottom centre of the picture (or N,
 * or Escape when nothing is narrated) clears both the narrator's bubbles and
 * the speech, leaving a "▴ Show" tab in its place; the tab, N or the next turn
 * that tells something
 * brings both back as they were, and every turn is read in the story drawer.
 * Under about 1100 px wide (a laptop window too narrow for two sides, and
 * every phone's picture stage) there is no side for speech: the cards and the
 * chat-style lines share one column over the picture, in the order they
 * happened (`ColumnTurn`), about 620px wide in the middle on a laptop window
 * and across the picture on a phone, down to the same Hide and Show.
 * The first time the player walks into a room its arrival is told on the
 * middle of the picture instead (`ArrivalOnPicture`, `useArrivalStore`): the
 * words are clear (no Hide or Show) and the bubbles come back when the
 * arrival clears (the room itself having been told in the middle). Enter or Space goes on, a click on the
 * picture too; Escape, the tab, an action or typing clear it at once.
 * Smaller screens that are not short (a phone upright) play the same stage
 * arranged for a tall screen: the plate across the top with "⟲ Story so far"
 * (the whole story over the stage), the one column over the picture
 * and the folded bar above the section tabs (Story, Bag, Spells, Quests, Map);
 * the actions are a sheet (at most 62% of the height) over the picture that
 * folds after every turn. A short screen (a phone on its side) keeps the text
 * page, with the tabs in the header and the same sheet folded into the bar,
 * which also folds when an answer does not fit beside it.
 * A new turn opens at its start, with a "More below" pill while the story
 * goes on below the visible part.
 * After the last act, Finish the game asks to save (FinishDialog), then
 * only the end screen shows; the act's music keeps playing under it.
 * A player's command, and the arrival that opens an act, is narrated when the
 * act has recordings and narration is on (`useNarrationStore`):
 * `useLanternPresentation` starts it with the new turn (and reads a chapter
 * page, and decides what stops either), a click on
 * the story hurries it (two skip), Space/Enter hurry while focus is not on a
 * field or a control (Space also on the folded bar's Actions and the actions panel's buttons; an arrival on the picture goes on a part instead), Escape skips (also in the command box, unless its word
 * list is open), and a pop-up stops it. Building a command (typing, verbs,
 * targets) never stops it: only the complete command cuts in.
 * While a command is narrated the panels (plate, buttons, map, drawer, the
 * header's room and counts) keep the state from before it and switch as the
 * voice reaches them (`usePanelHold`), and so do the command box's word list
 * and the target chips; only pressing in one of those panels first shows the
 * rest of the turn at once. Opening another section or a name's menu does not.
 * On the picture stage a move to a room with another picture is a change of
 * scene (`useSceneStore`, `StagePicture`): the old picture goes dark, the new
 * one rises, the room's name changes in the dark, and the move's words and
 * narrator wait until the picture is up; Enter, a click on the picture, a
 * press in a panel or a new command bring the new room up at once. A talk
 * that moves Elior (answering the dream's voice) is told over the old picture
 * and changes scene partway (`sceneBlock`), before the narrator's last
 * paragraph on the sides: when the narrator reaches it, or, unnarrated, once
 * the lines before it are read; a speaker's line after it comes in the new room.
 */
const game = useGameStore()
const settings = useSettingsStore()
const narration = useNarrationStore()
const speech = useStageSpeechStore()
const arrival = useArrivalStore()
const scene = useSceneStore()
const wide = useMediaQuery(WIDE_QUERY)
const short = useMediaQuery(SHORT_QUERY)
/** A phone (or any screen under the laptop stage) that is not short: the picture stage, arranged for a tall screen. */
const phoneStage = computed(() => !wide.value && !short.value)
/** The room is played on its picture: the laptop stage or the phone's. */
const staged = computed(() => wide.value || phoneStage.value)
/** The laptop window is wide enough for the narrator on one side and speech on the other. */
const sides = useMediaQuery(SIDES_QUERY)
/** The laptop stage with a side each for the narrator and for speech. */
const twoSides = computed(() => wide.value && sides.value)
/** Everything is told in one column over the picture: a phone, or a laptop window too narrow for two sides. */
const column = computed(() => staged.value && !twoSides.value)
/** A mouse and keyboard: the narration hint names keys instead of taps. */
const keyboardPlayer = useMediaQuery(KEYBOARD_QUERY)
/** The cursor is in a text field (the command box): only Esc steers the voice there. */
const fieldFocused = ref(false)
const hintText = computed(() => {
  if (!keyboardPlayer.value) return 'Tap to hurry · double-tap to skip'
  return fieldFocused.value ? 'Esc to skip' : 'Space to hurry · Esc to skip'
})

/** The Type-mode command box: the one field where Esc skips the voice. */
const COMMAND_BOX = '.lq-type-input'

/** Follows where the cursor is, for the hint. */
function onFocusChange(event: FocusEvent): void {
  // Focus is going to `relatedTarget` when it leaves, and to the target when it enters.
  const next = event.type === 'focusout' ? event.relatedTarget : event.target
  fieldFocused.value =
    next instanceof Element && next.matches('input, textarea')
}
const section = ref<Section>('story')
/** What is open on the stage (a journal tab, the story or the map), or null. */
const drawerTab = ref<'bag' | 'spells' | 'quests' | 'story' | 'map' | null>(
  null,
)
const stageButtons = ref<InstanceType<typeof StageButtons> | null>(null)
const plate = ref<InstanceType<typeof RoomPlate> | null>(null)
/** Whether the room's picture is up (otherwise the paper backdrop), for the arrival's ink. */
const pictured = ref(false)
/** The actions sheet: every screen starts with it folded into the bar. */
const dockOpen = ref(false)
// A phone turned on its side shows the text page with the sheet folded.
watch(short, (isShort) => {
  if (isShort) dockOpen.value = false
})
/** The phone's sheet is up over the picture. */
const sheetOpen = computed(
  () => phoneStage.value && section.value === 'story' && dockOpen.value,
)

// "Open in journal": the Quests drawer on the stage, the Quests section on a phone.
watch(
  () => game.questToOpen,
  (name) => {
    if (!name) return
    if (wide.value) drawerTab.value = 'quests'
    else {
      drawerTab.value = null
      section.value = 'quests'
    }
  },
)

// A new game (after quit) starts on the story, with the journal and the
// actions afresh (they are keyed by the game number), the drawer closed (and
// the map, which the buttons are keyed by).
watch(
  () => game.gameNumber,
  () => {
    section.value = 'story'
  },
)

/** What starts the stage afresh: a new game, a load, or a new act. */
const stageKey = computed(
  () => `${game.gameNumber}-${game.loadNumber}-${game.musicActName}`,
)
watch(stageKey, () => {
  drawerTab.value = null
  speech.clear()
  scene.reset()
  clearArrival()
})

/** End the arrival on the picture at once (a narrator still telling it stops, see `useArrivalStore.clear`). */
function clearArrival(): void {
  arrival.clear()
}

/**
 * The command box: ends an arrival that is up, but leaves news still waiting for the turn's words alone (typing ahead must not cut the narrator off).
 * A click takes it on the way down, before the button plays its turn: on the way up it would end the arrival that turn just began.
 */
function clearShownArrival(): void {
  if (arrival.active) arrival.clear()
}

/** A stage button: opens its drawer or the map (closing what was open), or closes it if lit. */
function toggleDrawer(
  tab: 'bag' | 'spells' | 'quests' | 'story' | 'map',
): void {
  if (drawerTab.value === tab) closeDrawer()
  else drawerTab.value = tab
}

/** Close the drawer; focus goes back to its lit button (the tab it was on). */
function closeDrawer(): void {
  const tab = drawerTab.value
  drawerTab.value = null
  if (!tab) return
  // On a phone the story so far was opened from the plate.
  if (phoneStage.value) void nextTick(() => plate.value?.focusStoryButton())
  else void stageButtons.value?.focusButton(tab)
}

// A turn played closes the story drawer; the turn then plays on the stage.
watch(
  () => game.turns.at(-1)?.id,
  () => {
    if (drawerTab.value === 'story') drawerTab.value = null
  },
)

/** A press outside what is open closes it and goes on doing what it does. */
function onOutsidePress(event: Event): void {
  if (!drawerTab.value) return
  const target = event.target instanceof Element ? event.target : null
  if (
    target?.closest(
      '.lq-drawer, .lq-story-drawer, .lq-buttons, .lq-name-menu, .lq-story-so-far, .lq-nav-bottom',
    )
  )
    return
  drawerTab.value = null
}

/**
 * A press on the picture itself shows the rest of an unnarrated turn's speech
 * at once; while there is speech, a narrated turn is tapped on like the story
 * (one block hurried, a double tap skips the turn).
 */
function onPicturePress(event: MouseEvent): void {
  if (!(event.target instanceof Element)) return
  if (!event.target.closest('.lq-stage-picture')) return
  // During a change of scene a click brings the new room up at once.
  if (scene.turn !== null) return scene.skip()
  speech.revealAll()
  if (speech.conversation) narration.tap()
}

watch(
  () => drawerTab.value !== null,
  (open) => {
    if (open) document.addEventListener('pointerdown', onOutsidePress)
    else document.removeEventListener('pointerdown', onOutsidePress)
  },
)
onUnmounted(() => document.removeEventListener('pointerdown', onOutsidePress))

/** The height of the action row, which the story drawer stops above. */
const actionsHeight = ref(0)
let actionsResize: ResizeObserver | undefined
/** The frame that applies the action row's new height, while one is waiting. */
let actionsFrame = 0

// The laptop shows everything at once; coming back from it starts on the story.
// Turning the phone, or changing the stage, starts the stage afresh.
watch(wide, (isWide) => {
  if (isWide) section.value = 'story'
  drawerTab.value = null
  // What was said stays when the picture stays staged (a phone widening to a
  // laptop, or the reverse): the `staged` watcher clears it when it does not.
  clearArrival()
})
watch(staged, () => {
  drawerTab.value = null
  speech.clear()
  clearArrival()
})

/** A tap on a section tab: the Story tab shown already puts the story so far away; leaving the Story tab does too. */
function onSectionPress(pressed: Section): void {
  if (pressed === 'story' && drawerTab.value === 'story') drawerTab.value = null
}
watch(section, (now) => {
  if (now !== 'story' && drawerTab.value === 'story') drawerTab.value = null
})
const storyEl = ref<HTMLElement | null>(null)
const mainEl = ref<HTMLElement | null>(null)
const paperEl = ref<HTMLElement | null>(null)
const contentEl = ref<HTMLElement | null>(null)
const tabEl = ref<HTMLButtonElement | null>(null)

/** The narration paper of the stage, a column of cards (see `useNarrationPaper`). */
const paper = useNarrationPaper(
  () => game.turns,
  () => stageKey.value,
  () => staged.value,
  () => twoSides.value,
  // A talk that moves Elior keeps the cards before it until its scene changes (`scene.cut`).
  (turn) =>
    scene.firstUnit(turn.id) === null &&
    sceneBlock(turn, parseTurn(turn.text)) >= 0,
)
/** What the story pane holds: the narration cards on the stage, every turn elsewhere. */
const storyTurns = computed(() =>
  staged.value ? paper.shownTurns.value : game.turns,
)
/** The paper is slid down, leaving its tab. */
const paperAway = computed(
  () =>
    staged.value &&
    paper.visible.value &&
    (paper.hidden.value || arrival.active),
)
/**
 * Something is on the picture for the one Hide to clear: the narrator's
 * cards, or on the two-sided laptop stage the speech beside them.
 */
const wordsVisible = computed(
  () => paper.visible.value || (twoSides.value && speech.visible.length > 0),
)
/** The "▾ Hide": the words are showing and no arrival holds them away. */
const showHide = computed(
  () =>
    staged.value &&
    wordsVisible.value &&
    !paper.hidden.value &&
    !arrival.active,
)
/** The "▴ Show" that brings the words back (not during an arrival). */
const showTab = computed(
  () =>
    staged.value && wordsVisible.value && paper.hidden.value && !arrival.active,
)
/** The Hide button, which hands focus to the tab. */
const hideEl = ref<HTMLButtonElement | null>(null)

/** Hide the words (the column, or both sides); focus goes to the tab they leave. */
async function hidePaper(): Promise<void> {
  paper.hide()
  await nextTick()
  tabEl.value?.focus()
}

/**
 * Hide or show the words from a key (N, Escape). Focus on the Hide or inside
 * the cards follows to the tab when they go, and focus on the tab follows to
 * Hide when they come back; focus anywhere else (the command box) stays.
 */
function setWordsHidden(hide: boolean): void {
  const active = document.activeElement
  const focusWasInside =
    !!active && (active === hideEl.value || !!paperEl.value?.contains(active))
  const focusWasOnTab = !!active && active === tabEl.value
  if (hide) paper.hide()
  else paper.show()
  if (focusWasInside && hide) void nextTick(() => tabEl.value?.focus())
  else if (focusWasOnTab && !hide) void showPaper()
}

/** Bring the paper back; focus goes to its Hide button. */
async function showPaper(): Promise<void> {
  // The tab also ends an arrival told on the picture, which holds the paper away.
  clearArrival()
  paper.show()
  await nextTick()
  hideEl.value?.focus()
}

/** The keys N steers: only on the stage, only with words (or the tab) to steer. */
function onPaperKey(event: KeyboardEvent): void {
  if (event.key !== 'n' && event.key !== 'N') return
  if (event.defaultPrevented || event.repeat) return
  if (event.ctrlKey || event.metaKey || event.altKey) return
  if (!staged.value || !wordsVisible.value || dialogOpen()) return
  // An arrival on the picture holds the paper away; Escape, Enter or the tab end it.
  if (arrival.active) return
  const target = event.target instanceof Element ? event.target : null
  if (target?.closest('input, textarea, select, [contenteditable]')) return
  event.preventDefault()
  setWordsHidden(!paper.hidden.value)
}
/** The story is held still and follows the word while an answer is read. */
const { held: storyHeld, moveTo: moveStory, refollow } = useStoryFollow(storyEl)
/** Unread story below the visible part (a long turn opens at its start). */
const moreBelow = ref(false)
const moreBelowButton = ref<HTMLButtonElement | null>(null)
/** A story sliver (beside the open sheet on a small phone) has no room for it. */
const PILL_ROOM = 96

/**
 * Show the pill while story text continues below the visible part (the blank
 * room the story keeps at its end for the narration hint does not count).
 * When it goes while focused (pressed to the end), focus moves on to the
 * actions.
 */
function updateMoreBelow(): void {
  const story = storyEl.value
  const hadFocus =
    !!moreBelowButton.value && document.activeElement === moreBelowButton.value
  const trailing = story
    ? parseFloat(getComputedStyle(story).paddingBottom) || 0
    : 0
  moreBelow.value =
    !!story &&
    story.clientHeight >= PILL_ROOM &&
    story.scrollTop + story.clientHeight <
      story.scrollHeight - trailing - END_SLACK
  if (hadFocus && !moreBelow.value) focusActions()
  resizeLanding.note()
}

/** Scroll on by almost a screen, keeping a line or two for context. */
function readOn(): void {
  const story = storyEl.value
  if (!story) return
  endLanding()
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

/**
 * The story's element for the game's newest turn, or null when that turn
 * shows nothing there (a talk told only as speech, a turn not reached yet):
 * then nothing is scrolled to, measured or followed for it.
 */
function newestTurnEl(): HTMLElement | null {
  const id = game.turns.at(-1)?.id
  if (id === undefined) return null
  return (
    contentEl.value?.querySelector<HTMLElement>(`[data-turn="${id}"]`) ?? null
  )
}

/** Whether the newest turn is taller than the story area beside the actions. */
function answerTooLong(): boolean {
  const story = storyEl.value
  const last = newestTurnEl()
  return !!story && !!last && last.offsetHeight > story.clientHeight
}

/**
 * Keeps the player's reading place across a crossing of 1100 px. It owns the
 * view, the decision and the landing; the layout only measures the story for
 * it and moves the story where it says.
 */
const resizeLanding = new ResizeLanding({
  measure: (): StoryGeometry | null => {
    const story = storyEl.value
    const content = contentEl.value
    if (!story || !content) return null
    const pane = story.getBoundingClientRect()
    return {
      paneHeight: pane.bottom - pane.top,
      moreBelow: moreBelow.value,
      turns: Array.from(content.children, (turn) => {
        const rect = turn.getBoundingClientRect()
        return {
          top: rect.top - pane.top,
          bottom: rect.bottom - pane.top,
          height: rect.height,
        }
      }),
    }
  },
  measureTarget: (
    index: number | 'newest',
  ): { top: number; height: number } | null => {
    const story = storyEl.value
    const content = contentEl.value
    const turn =
      index === 'newest' ? content?.lastElementChild : content?.children[index]
    if (!story || !turn) return null
    const rect = turn.getBoundingClientRect()
    return {
      top: rect.top - story.getBoundingClientRect().top,
      height: rect.height,
    }
  },
  scrollTop: (): number => storyEl.value?.scrollTop ?? 0,
  land: (top: number): void => {
    moveStory(top, false)
    if (storyHeld.value) refollow()
    updateMoreBelow()
  },
  windowSize: (): string => `${window.innerWidth}x${window.innerHeight}`,
})

/** Stop landing: the player has taken the story over, or a new turn has come. */
function endLanding(): void {
  resizeLanding.end()
}

/** Keys that scroll the story, and so take it over from the landing. */
const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
])

/** Keys pressed in the story: a scrolling key ends the landing, then the name keys have their say. */
function onStoryKeydown(event: KeyboardEvent): void {
  if (SCROLL_KEYS.has(event.key)) endLanding()
  onNameKeydown(event)
}

/**
 * The window crossing about 1100 px redraws the story's turns (the column or
 * the cards) in the same pane; `ResizeLanding` re-forms the story where the
 * player was reading. The view is taken before the redraw and landed after
 * it, again each time the pane or its turns change size, and on every frame,
 * while the browser settles the new layout. A change from the picture stage
 * to the text page (the window becoming short) lands only a player at the
 * newest, on the newest: the two list different turns, so an older turn's
 * place does not carry over, and the stage keeps its cards its own way.
 */
watch(
  [column, staged],
  async ([_column, nowStaged], [_wasColumn, wasStaged]) => {
    const toText = nowStaged !== wasStaged
    const view = resizeLanding.capture()
    if (toText && (nowStaged || !view.atNewest)) return
    const content = contentEl.value
    if (!storyEl.value || !content) return
    // A stage with no card still opens a text page with every turn on it.
    if (!toText && content.children.length === 0) return
    resizeLanding.end()
    await nextTick()
    resizeLanding.begin(view)
  },
  { flush: 'pre' },
)

// The story also changes size without scrolling: the sheet opens or folds,
// the window turns, a section is shown again, the room card grows.
let storyResize: ResizeObserver | undefined
let contentResize: ResizeObserver | undefined

/** Whether a pop-up, menu or dialog is open (it has its own keys). */
function dialogOpen(): boolean {
  return !!(
    game.showModal ||
    game.showTitle ||
    game.quitAsked ||
    game.shownQuest ||
    gameDialog.value ||
    nameMenu.value
  )
}

/** Enter presses that found a command box with nothing typed in it. */
const emptyBoxEnters = new WeakSet<Event>()

/**
 * Note, before the command box handles it, an Enter pressed in an empty
 * command box: the box sends and clears itself first, so by the time
 * `onNarrationKey` hears the key the box is empty either way.
 */
function noteEmptyBoxEnter(event: KeyboardEvent): void {
  if (
    event.key === 'Enter' &&
    event.target instanceof HTMLInputElement &&
    event.target.matches(COMMAND_BOX) &&
    event.target.value === ''
  )
    emptyBoxEnters.add(event)
}

/** Whether this is Enter pressed in a command box with nothing typed. */
function isEmptyBoxEnter(event: KeyboardEvent): boolean {
  return emptyBoxEnters.has(event)
}

/**
 * Keys that steer the narration: describe the press and let `decideHurryKey`
 * say who owns it, then carry out its answer.
 */
function onNarrationKey(event: KeyboardEvent): void {
  const target = event.target instanceof Element ? event.target : null
  const decision = decideHurryKey({
    key: event.key,
    repeat: event.repeat,
    modified: event.ctrlKey || event.metaKey || event.altKey,
    handled: event.defaultPrevented,
    emptyBoxEnter: isEmptyBoxEnter(event),
    dialogOpen: dialogOpen(),
    inField: !!target?.closest('input, textarea, select, [contenteditable]'),
    onControl: !!target?.closest('button, a, [role="button"], summary'),
    onFoldedActions: !!target?.closest('.lq-dock-open'),
    onActionButton: !!target?.closest('.lq-composer button'),
    onPaperTab: !!target?.closest('.lq-paper-tab'),
    inOpenList: !!target?.closest('[aria-expanded="true"]'),
    scene: scene.turn !== null,
    arrival: arrival.active,
    narrating: narration.isNarrating,
    canHide: staged.value && wordsVisible.value && !paper.hidden.value,
  })
  if (!decision) return
  if (decision.consume) {
    event.preventDefault()
    spaceTaken = decision.swallowSpaceUp
  }
  switch (decision.action) {
    case 'skip-scene':
      scene.skip()
      break
    case 'hide-words':
      setWordsHidden(true)
      break
    case 'arrival-next':
      arrival.next()
      break
    case 'arrival-clear':
      arrival.clear()
      narration.skipAll()
      break
    case 'hurry':
      narration.hurry()
      break
    case 'skip-all':
      narration.skipAll()
      break
  }
}

/**
 * A Space went on an arrival, a change of scene or (from the folded bar's
 * Actions or an action button) a narration: its key-up must not press the focused button.
 */
let spaceTaken = false

/** Swallow the key-up of a Space that `onNarrationKey` used to go on. */
function onSpaceUp(event: KeyboardEvent): void {
  if (!spaceTaken || event.key !== ' ') return
  spaceTaken = false
  event.preventDefault()
}

onMounted(() => {
  fieldFocused.value = !!document.activeElement?.matches(COMMAND_BOX)
  resizeLanding.start()
  document.addEventListener('keydown', noteEmptyBoxEnter, true)
  document.addEventListener('keydown', onNarrationKey)
  document.addEventListener('keydown', onPaperKey)
  document.addEventListener('keyup', onSpaceUp)
  document.addEventListener('focusin', onFocusChange)
  document.addEventListener('focusout', onFocusChange)
  // The game opens with its first act intro already showing.
  if (game.showModal) void nextTick(focusPopUp)
  if (typeof ResizeObserver !== 'undefined' && storyEl.value) {
    storyResize = new ResizeObserver(() => {
      resizeLanding.reland()
      updateMoreBelow()
      refollow()
    })
    storyResize.observe(storyEl.value)
    // The turns also settle after a crossing; a reading's new paragraphs must not jump the follow.
    if (contentEl.value) {
      contentResize = new ResizeObserver(() => resizeLanding.reland())
      contentResize.observe(contentEl.value)
    }
  }
})

/** The least height (px) the column needs to show the newest line's speaker and first line whole. */
const MIN_SPEECH_ROOM = 120
/**
 * The phone's room plate is folded to one row. It folds when a conversation is
 * on the picture under an open column of words and the column's room
 * (its height) is under `MIN_SPEECH_ROOM`; then it stays
 * folded, so it does not fold and open line by line, until the conversation
 * is cleared or the narration is hidden. Nothing is saved.
 */
const plateFolded = ref(false)

/** The column's room as last measured (px). */
const speechRoom = ref(Number.POSITIVE_INFINITY)
let columnResize: ResizeObserver | undefined
watch(
  paperEl,
  (el) => {
    columnResize?.disconnect()
    if (!el || typeof ResizeObserver === 'undefined') return
    columnResize = new ResizeObserver(() => {
      speechRoom.value = el.clientHeight
    })
    columnResize.observe(el)
  },
  { flush: 'post' },
)
onUnmounted(() => columnResize?.disconnect())

watch(
  () =>
    [
      speech.visible.length > 0,
      paper.visible.value && !paperAway.value,
      phoneStage.value && section.value === 'story',
      speechRoom.value < MIN_SPEECH_ROOM,
    ] as const,
  ([talking, paperOpen, onPicture, cramped]) => {
    if (!talking || !paperOpen || !onPicture) plateFolded.value = false
    else if (cramped) plateFolded.value = true
  },
  { flush: 'post' },
)

/** The laptop's room plate, under which the narration cards stop. */
const widePlate = ref<InstanceType<typeof RoomPlate> | null>(null)
/** Where the cards' column ends at the top: the plate's foot and a gap (px from the stage's top). */
const cardsTop = ref(140)
/** The stage's top margin the plate stands at, and the gap kept under it (px). */
const PLATE_TOP = 16
const PLATE_GAP = 12
let widePlateResize: ResizeObserver | undefined
/** The frame that applies the plate's new height, while one is waiting. */
let widePlateFrame = 0
watch(
  widePlate,
  (current) => {
    widePlateResize?.disconnect()
    cancelAnimationFrame(widePlateFrame)
    const el = current?.$el
    if (typeof ResizeObserver === 'undefined' || !(el instanceof HTMLElement))
      return
    // On the next frame: the cards' column is resized and observed too, and
    // resizing it while the plate's change is delivered loops the observers.
    widePlateResize = new ResizeObserver(() => {
      cancelAnimationFrame(widePlateFrame)
      widePlateFrame = requestAnimationFrame(() => {
        cardsTop.value = PLATE_TOP + el.offsetHeight + PLATE_GAP
      })
    })
    widePlateResize.observe(el)
  },
  { flush: 'post' },
)
onUnmounted(() => {
  widePlateResize?.disconnect()
  cancelAnimationFrame(widePlateFrame)
})

// The narrator's bubbles and the column's lines dim by how far back they were told, as speech does.
useBubbleAges(contentEl, STAGE_BUBBLES)

/** The phone's plate height, which the arrival on the picture stays clear of. */
const plateHeight = ref(108)
let plateResize: ResizeObserver | undefined
watch(
  plate,
  (current) => {
    plateResize?.disconnect()
    const el = current?.$el
    if (typeof ResizeObserver === 'undefined' || !(el instanceof HTMLElement))
      return
    plateResize = new ResizeObserver(() => {
      plateHeight.value = el.offsetHeight
    })
    plateResize.observe(el)
  },
  { flush: 'post' },
)
onUnmounted(() => plateResize?.disconnect())

// The action row is a new element after a new game: follow the current one.
watch(
  composer,
  (current) => {
    actionsResize?.disconnect()
    cancelAnimationFrame(actionsFrame)
    const actions = current?.$el
    if (
      typeof ResizeObserver === 'undefined' ||
      !(actions instanceof HTMLElement)
    )
      return
    // On the next frame, as the plate's: the cards' column ends above the row.
    actionsResize = new ResizeObserver(() => {
      cancelAnimationFrame(actionsFrame)
      actionsFrame = requestAnimationFrame(() => {
        actionsHeight.value = actions.offsetHeight
      })
    })
    actionsResize.observe(actions)
  },
  { flush: 'post' },
)
onUnmounted(() => {
  document.removeEventListener('keydown', noteEmptyBoxEnter, true)
  document.removeEventListener('keydown', onNarrationKey)
  document.removeEventListener('keydown', onPaperKey)
  document.removeEventListener('keyup', onSpaceUp)
  document.removeEventListener('focusin', onFocusChange)
  document.removeEventListener('focusout', onFocusChange)
  storyResize?.disconnect()
  contentResize?.disconnect()
  resizeLanding.dispose()
  actionsResize?.disconnect()
  cancelAnimationFrame(actionsFrame)
})

// Larger or smaller text changes how much of the turn is still below.
watch(() => settings.textSize, updateMoreBelow, { flush: 'post' })

// A reading that ends (above all a skip) draws the rest of the turn at once,
// which grows the story without scrolling it (the room kept for the hint
// moves from below the story into its end, so nothing moves).
// On the laptop's cards a reading cut short leaves the newest card at its
// start in view: the turn grew after the pane was last moved, and the older
// cards must not keep the column.
watch(storyHeld, async (held) => {
  if (held) return
  await nextTick()
  const latest = newestTurnEl()
  if (staged.value && !narration.readToEnd && latest && storyEl.value) {
    const top =
      latest.getBoundingClientRect().top -
      storyEl.value.getBoundingClientRect().top +
      storyEl.value.scrollTop
    // Only forward: a long card already read past its start stays where it is.
    if (top > storyEl.value.scrollTop) moveStory(top, false)
  }
  updateMoreBelow()
})

/** When the story's and the chapter pages' presentations start, and what stops them. */
const presentation = useLanternPresentation({
  staged: () => staged.value,
  motionReduced,
})

const flights = useFlightStore()
/** The newest turn whose gained things have flown (or were let be): each turn's fly once. */
let flownTurn = game.turns.at(-1)?.id ?? null
// A new command stops what is still flying (its counts are already up).
watch(
  () => game.turns.at(-1)?.id,
  () => flights.clear(),
)
// On the picture stage, a turn's gained items and spells fly to the Bag and
// Spells buttons once the turn lets go of them (as their counts change) and
// the middle of the picture is clear: no news or arrival told or waiting
// there, no change of scene, and no pop-up over it.
watch(
  () => {
    const turn = game.turns.at(-1)
    const clear =
      arrival.turnId === null && scene.turn === null && !game.showModal
    return turn && clear && !game.groupHeld('stock') ? turn.id : null
  },
  (id) => {
    const turn = game.turns.at(-1)
    if (id === null || !turn || id === flownTurn) return
    flownTurn = id
    if (staged.value && turn.gained.length) flights.launch(turn.gained)
  },
)

// The picture and music follow the room at once on the picture stage.
watch(staged, (on) => game.setScenePicture(on), { immediate: true })
onUnmounted(() => game.setScenePicture(false))

/** Whether the game's "less motion" setting (or the system's) is on: no change of scene. */
function motionReduced(): boolean {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue('--lq-motion')
      .trim() === '0'
  )
}

/**
 * A press on something in a held panel (room card, map, journal, the exits
 * bar) only brings the panels up to date; the player presses again to act.
 * The stage buttons are not a held panel: they open their drawers at once.
 */
function onPanelPress(event: MouseEvent): void {
  const target = event.target instanceof Element ? event.target : null
  if (!target?.closest('[data-panel] :is(button, a, [role="button"])')) return
  // A press during a change of scene (or before a talk's) brings the new room up first.
  presentation.bringSceneUp()
  // Opening the sheet changes nothing the voice holds: it never waits for it.
  if (target.closest('.lq-dock-open, .lq-dock-icon')) return
  if (!presentation.catchUpPanels()) return
  event.stopPropagation()
  event.preventDefault()
}

// Each quest card's chime rings when the card shows: as the narration reaches
// it, or at once with its turn (cards shown together ring once). News told in
// the middle rings as each piece comes up instead. A new turn
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
    // News told in the middle rings as each piece comes up (below).
    if (arrival.told.includes(turn.id)) return
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

// A piece of news told in the middle rings as it comes up: a spell's own
// sound, or a quest's chime or fanfare. The same piece up again (its part is
// rebuilt when the narrator ends) rings nothing.
let ringedNews = ''
watch(
  () => arrival.newsUp,
  (up) => {
    if (!up) {
      ringedNews = ''
      return
    }
    const key = `${up.turnId}-${up.spell ? 'spell' : 'quest'}-${up.index}`
    if (key === ringedNews) return
    ringedNews = key
    if (up.spell) game.ringSpellSound()
    else game.ringQuestSounds(up.turnId, [up.index])
  },
)

// Show a new turn from its start (jsdom has no scrollIntoView). A command
// run from another section (Use, Cast, Go) first brings the story back, and
// focus moves to the actions as the pressed button has gone (likewise for
// the folded bar's exit buttons, which change with the room). Follows the
// newest turn's id: at the turn cap the count stops changing.
watch(
  () => game.turns.at(-1)?.id,
  async () => {
    endLanding()
    const away = !wide.value && section.value !== 'story'
    section.value = 'story'
    await nextTick()
    const latest = newestTurnEl()
    // A held story is moved only through `moveStory`, which knows where it belongs.
    if (storyHeld.value && latest && storyEl.value)
      moveStory(
        latest.getBoundingClientRect().top -
          storyEl.value.getBoundingClientRect().top +
          storyEl.value.scrollTop,
        false,
      )
    else latest?.scrollIntoView?.({ block: 'start' })
    // Every answer is read on the picture: the phone's sheet folds after each turn.
    const folds =
      !wide.value &&
      dockOpen.value &&
      (phoneStage.value || short.value || answerTooLong())
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

/** Help's line for the key that hides the narration paper (laptop only). */
const NARRATION_KEY_HELP = '\nN — hide or show the words\n'

/** Stats or Help as HTML (Help ends with the music credits). */
const infoHtml = computed(() => {
  const kind = gameDialog.value
  if (kind !== 'stats' && kind !== 'help') return ''
  const html = renderMarkup(game.readInfo(kind))
  return kind === 'help'
    ? html +
        renderMarkup(NARRATION_HELP) +
        (wide.value ? renderMarkup(NARRATION_KEY_HELP) : '') +
        music.buildAttributionHtml()
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

/** The menu actions of a name in the story or a Here chip: none when it is not here. */
function actionsOf(name: HTMLElement): NameAction[] {
  const kind =
    name.dataset.nameKind === 'character' ||
    name.classList.contains('theme-character_name')
      ? 'character'
      : 'item'
  return nameActions(kind, name.dataset.name ?? name.textContent ?? '', {
    characters: game.characters,
    items: game.items,
    bag: game.rawInventory.map((entry) => parseCountedName(entry.name).name),
    spells: game.spellEntries.map((entry) => parseCountedName(entry).name),
    shortNames: game.shortNames,
  })
}

/**
 * Open the menu of `name`, if the game takes input and the name has one.
 * A pointer open leaves no focus on the name (a Tab stop takes focus on a
 * click): as before, closing by key then goes to the actions.
 */
function openNameMenu(name: HTMLElement, pointer = false): void {
  if (!game.acceptInput) return
  const actions = actionsOf(name)
  if (!actions.length) return
  const box = name.getBoundingClientRect()
  // A chip takes focus back (Safari does not focus a clicked button).
  if (
    pointer &&
    name === document.activeElement &&
    !(name instanceof HTMLButtonElement)
  )
    name.blur()
  focusBeforeMenu =
    name instanceof HTMLButtonElement
      ? name
      : (document.activeElement as HTMLElement | null)
  nameMenu.value = { actions, x: box.left, top: box.top, bottom: box.bottom }
}

/**
 * A click on an item or character name in the story, or on a Here chip
 * (which carries the engine's name), opens its menu.
 */
function onNameClick(event: MouseEvent): void {
  const name = (event.target as HTMLElement).closest<HTMLElement>(
    '.theme-item_name, .theme-character_name, [data-name-kind]',
  )
  if (name) openNameMenu(name, event.detail > 0)
}

/** Enter or Space on a name that is a Tab stop opens its menu, as a click does. */
function onNameKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Enter' && event.key !== ' ') return
  if (event.ctrlKey || event.metaKey || event.altKey) return
  const name = (event.target as HTMLElement).closest<HTMLElement>(
    '[role="button"][tabindex]',
  )
  if (!name?.matches(NAME_SELECTOR)) return
  event.preventDefault()
  openNameMenu(name)
}

// Names in the story are Tab stops (see useNameStops) while they have a menu.
const { sync: syncNameStops } = useNameStops(mainEl, {
  wide: () => staged.value,
  reachable: (name) => actionsOf(name).length > 0,
})
watch(
  () => [
    game.turns.length,
    game.turns.at(-1)?.id,
    game.characters,
    game.items,
    game.rawInventory,
    game.spellEntries,
    wide.value,
    staged.value,
    section.value,
    drawerTab.value,
  ],
  () => void nextTick(syncNameStops),
  { deep: true },
)

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
    presentation.continueChapter()
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
        :hide-room="phoneStage"
        @menu="openGameDialog('menu')"
        @open="openGameDialog"
      >
        <template v-if="!wide && short" #nav>
          <SectionNav v-model="section" class="lq-nav-top" />
        </template>
      </LanternHeader>

      <main
        ref="mainEl"
        class="lq-main"
        :class="{
          'lq-wide': wide,
          'lq-staged': staged,
          'lq-phone': phoneStage,
        }"
        :style="phoneStage ? { '--lq-plate-h': `${plateHeight}px` } : {}"
        @click.capture="onPanelPress"
      >
        <div
          v-if="staged"
          v-show="section === 'story'"
          class="lq-stage"
          :style="{ '--lq-actions-h': `${actionsHeight}px` }"
          @click="onPicturePress"
        >
          <StagePicture :src="game.roomPicture" @pictured="pictured = $event" />
          <ArrivalOnPicture :pictured="pictured" :phone="phoneStage" />
          <RoomPlate
            v-if="wide"
            ref="widePlate"
            class="lq-stage-plate"
            data-panel
            @click="onNameClick"
          />
          <StageButtons
            v-if="wide"
            :key="`buttons-${stageKey}`"
            ref="stageButtons"
            class="lq-stage-buttons"
            :drawer="drawerTab"
            @journal="toggleDrawer"
            @story="toggleDrawer('story')"
            @map="toggleDrawer('map')"
            @close="closeDrawer"
          />
          <JournalDrawer
            v-if="drawerTab && drawerTab !== 'story' && drawerTab !== 'map'"
            :key="`drawer-${stageKey}`"
            :tab="drawerTab"
            @select="drawerTab = $event"
            @close="closeDrawer"
          />
          <StoryDrawer
            v-else-if="drawerTab === 'story'"
            :key="`story-${stageKey}`"
            :phone="phoneStage"
            @click="onNameClick"
            @keydown="onNameKeydown"
            @close="closeDrawer"
          />
        </div>
        <RoomPlate
          v-if="phoneStage"
          v-show="section === 'story'"
          ref="plate"
          class="lq-phone-plate"
          data-panel
          story-button
          :folded="plateFolded"
          @click="onNameClick"
          @story="drawerTab = 'story'"
        />
        <StageSpeech
          v-if="twoSides"
          v-show="section === 'story'"
          class="lq-above-hide"
          :class="{ 'lq-covered': sheetOpen }"
          :away="paper.hidden.value || arrival.active"
        />
        <div
          v-show="
            staged
              ? paper.visible.value && section === 'story'
              : section === 'story'
          "
          ref="paperEl"
          class="lq-story-wrap"
          :class="{
            'lq-cards': staged,
            'lq-one-column': column,
            'lq-hint-room': storyHeld,
            'lq-paper-away': paperAway,
            'lq-covered': sheetOpen,
          }"
          :style="
            wide
              ? {
                  top: `${cardsTop}px`,
                  bottom: `calc(${actionsHeight}px + var(--lq-hide-line) + 12px)`,
                }
              : {}
          "
          :inert="paperAway || undefined"
        >
          <section
            ref="storyEl"
            class="lq-story"
            tabindex="-1"
            aria-label="Story"
            @click="onStoryClick"
            @keydown="onStoryKeydown"
            @scroll.passive="updateMoreBelow"
            @wheel.passive="endLanding"
            @touchstart.passive="endLanding"
            @pointerdown.passive="endLanding"
          >
            <h2 class="lq-sr-only">Story</h2>
            <div ref="contentEl" class="lq-paper-content">
              <template v-for="turn in storyTurns" :key="turn.id">
                <ColumnTurn v-if="column" :turn="turn" :data-turn="turn.id" />
                <StoryTurn
                  v-else
                  :turn="turn"
                  :card="staged"
                  :data-turn="turn.id"
                />
              </template>
            </div>
          </section>
          <p
            v-if="narration.hintVisible"
            class="lq-narration-hint"
            :class="{ 'lq-hint-raised': moreBelow && !storyHeld }"
          >
            {{ hintText }}
          </p>
          <button
            v-if="moreBelow && !storyHeld"
            ref="moreBelowButton"
            type="button"
            class="lq-more-below"
            @click="readOn"
          >
            More below <span aria-hidden="true">↓</span>
          </button>
        </div>
        <div
          v-if="staged"
          v-show="section === 'story'"
          class="lq-paper-tabrow"
          :class="{ 'lq-covered': sheetOpen }"
        >
          <button
            v-if="showHide"
            ref="hideEl"
            type="button"
            class="lq-words-hide"
            :title="wide ? 'Hide the words (N)' : undefined"
            :aria-keyshortcuts="wide ? 'N' : undefined"
            @click="hidePaper"
          >
            ▾ Hide
          </button>
          <button
            v-if="showTab"
            ref="tabEl"
            type="button"
            class="lq-paper-tab"
            :title="wide ? 'Show the words (N)' : undefined"
            :aria-keyshortcuts="wide ? 'N' : undefined"
            @click="showPaper"
          >
            ▴ Show
          </button>
        </div>

        <!-- Choosing an action or typing clears an arrival on the picture. Typing
             listens bubbling, not capture: a render before the command box's own
             v-model has read the text would give the first typed character back.
             A click is captured, so a turn the click plays keeps the arrival it starts. -->
        <div v-if="sheetOpen" class="lq-scrim" aria-hidden="true"></div>
        <ActionComposer
          v-show="wide || (section === 'story' && dockOpen)"
          :key="`composer-${game.gameNumber}`"
          ref="composer"
          class="lq-composer"
          :class="{ 'lq-sheet': !wide, 'lq-sheet-over': phoneStage }"
          :foldable="!wide"
          :stage="wide"
          :words-showing="showHide"
          @click.capture="clearShownArrival"
          @input="clearShownArrival"
          @fold="fold"
        />
        <DockBar
          v-if="!wide && section === 'story' && !dockOpen"
          ref="dock"
          data-panel
          @open="openDock"
        />

        <template v-if="!wide">
          <div
            v-if="phoneStage && section !== 'story'"
            class="lq-phone-section"
          >
            <CompassPanel v-if="section === 'map'" heading data-panel />
            <JournalPanel
              v-else
              :key="`journal-${game.gameNumber}`"
              :tab="section"
              class="lq-section-view"
              data-panel
            />
          </div>
          <template v-else>
            <CompassPanel v-if="section === 'map'" heading data-panel />
            <JournalPanel
              v-else-if="section !== 'story'"
              :key="`journal-${game.gameNumber}`"
              :tab="section"
              class="lq-section-view"
              data-panel
            />
          </template>
        </template>
      </main>

      <SectionNav
        v-if="phoneStage"
        v-model="section"
        class="lq-nav-bottom"
        @press="onSectionPress"
      />
      <AcquiredFlight v-if="staged" />

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
        :music-info="music.musicInfo.value"
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
          :music-info="music.musicInfo.value"
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
          @continue="presentation.continueChapter()"
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
  /* Clipped, not just hidden: a hidden paper slid below the stage (or a
     scrollIntoView inside it) must never scroll the whole page up. */
  overflow: clip;
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
/* The stage: the room's picture fills the play area, the story band and the
   actions sit along its bottom. The stage itself is behind them (it makes no
   stacking context of its own, so the drawer in it rises above them). */
.lq-staged {
  position: relative;
  max-width: none;
  padding: 0;
  gap: 0;
}
.lq-stage {
  position: absolute;
  inset: 0;
}
.lq-stage-plate {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 1;
  max-width: min(360px, 40%);
}
.lq-stage-buttons {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 4;
  max-width: 55%;
}
.lq-staged .lq-story-wrap {
  flex: 0 0 auto;
  max-height: 50%;
  margin-top: auto;
  /* The paper glides as it grows (its height is set from its content). */
  transition:
    height calc(0.2s * var(--lq-motion)) ease,
    transform calc(0.2s * var(--lq-motion)) ease;
  z-index: 2;
  padding: 0 24px;
  background: color-mix(in srgb, var(--lq-surface) 96%, transparent);
  border-top: 1px solid var(--lq-line);
}
.lq-staged .lq-story {
  padding-top: 14px;
}
/* The laptop: the narrator's cards up the left side of the picture, from just
   under the plate down to the actions, as wide as the drawing (520px) but never
   more than 40% of the stage, so a narrow window shares its width with the
   speech. Only the cards take presses; the picture stays pressable around them. */
.lq-staged .lq-story-wrap.lq-cards {
  position: absolute;
  left: 16px;
  width: min(520px, 40%);
  max-height: none;
  margin: 0;
  padding: 0;
  justify-content: flex-end;
  background: none;
  border-top: none;
  pointer-events: none;
  transition: opacity calc(0.2s * var(--lq-motion)) ease;
}
.lq-cards .lq-story {
  flex: 0 1 auto;
  gap: 8px;
  /* The top padding keeps the fade on empty space, so a lone card is fully lit. */
  padding: 16px 12px var(--lq-cards-story-end) 12px;
  /* The oldest card leaves at the top under a soft fade. */
  mask-image: linear-gradient(to bottom, transparent, #000 16px);
  scrollbar-width: none;
}
.lq-cards .lq-story::-webkit-scrollbar {
  display: none;
}
.lq-cards .lq-paper-content {
  gap: 8px;
}
.lq-staged .lq-story-wrap.lq-cards.lq-paper-away {
  opacity: 0;
  visibility: hidden;
  /* Fades out, then leaves reach (as the paper did when it slid down). */
  transition:
    opacity calc(0.2s * var(--lq-motion)) ease,
    visibility 0s linear calc(0.2s * var(--lq-motion));
}
/* The one column (a phone, a narrow laptop) keeps the hint in the cards, so
   while a turn is read the cards keep the hint's room below the words. Written
   as specific as the cards' own `padding: 0`, which would otherwise win (rq-x720);
   with the cards' story end padding it ends the words exactly where the
   let-go story's blank room ends them, so nothing moves when the reading ends.
   Two sides need no room: the hint sits on the Hide line below the cards. */
.lq-staged .lq-story-wrap.lq-cards.lq-one-column.lq-hint-room {
  padding-bottom: calc(var(--lq-hint-room) - var(--lq-cards-story-end));
}
.lq-cards .lq-narration-hint {
  left: 12px;
  bottom: 8px;
  transform: none;
}
.lq-cards .lq-more-below {
  left: 12px;
  transform: none;
  bottom: 8px;
  pointer-events: auto;
}
.lq-cards .lq-narration-hint.lq-hint-raised {
  bottom: 56px;
}
/* A laptop with two sides: the hint leaves the cards for the Hide's own line
   below them, at the Hide's height (28px tall, 6px above the actions; the
   cards end the Hide line and 12px above the actions), so it never lies over
   the newest card. More below stays in the cards, so the hint never rises. */
.lq-wide .lq-cards:not(.lq-one-column) .lq-narration-hint,
.lq-wide .lq-cards:not(.lq-one-column) .lq-narration-hint.lq-hint-raised {
  bottom: calc(6px - var(--lq-hide-line) - 12px);
  line-height: 16px;
}
/* One column over the picture, on a laptop window too narrow for two sides:
   in the middle, about 620px wide, so lines stay a comfortable length and the
   picture shows at both sides. */
.lq-staged .lq-story-wrap.lq-cards.lq-one-column {
  left: max(16px, calc(50% - 310px));
  width: min(620px, calc(100% - 32px));
}
/* The phone: the plate across the top, then the one column across the width
   (8px margins) down to the Hide line above the folded bar; the sheet is over the picture. */
.lq-phone .lq-story-wrap.lq-cards.lq-one-column {
  --lq-portrait: 32px;
  position: relative;
  left: auto;
  width: auto;
  flex: 1 1 0;
  min-height: 0;
  margin: 0 8px var(--lq-hide-line);
}
.lq-phone-plate {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  margin: 8px 8px 0;
}
/* The stage: one Hide on its own slim line at the foot of the picture, just
   above the actions (the laptop's row, the phone's folded bar), the words
   ending above it; hidden, the "▴ Show" tab rests in its place. Both sit at
   the bottom centre. */
.lq-staged {
  --lq-hide-line: 40px;
}
.lq-staged .lq-paper-tab {
  right: auto;
  left: 50%;
  transform: translateX(-50%);
}
.lq-above-hide {
  margin-bottom: var(--lq-hide-line);
}
.lq-words-hide {
  position: absolute;
  left: 50%;
  bottom: 6px;
  transform: translateX(-50%);
  height: 28px;
  padding: 0 14px;
  border: 1px solid var(--lq-line);
  border-radius: 14px;
  background: var(--lq-raised);
  color: var(--lq-muted);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
}
.lq-words-hide:hover {
  color: var(--lq-fg);
}
.lq-words-hide:focus-visible,
.lq-paper-tab:focus-visible {
  outline: 2px solid var(--lq-accent);
  outline-offset: 2px;
}
.lq-phone :deep(.lq-dock) {
  position: relative;
  z-index: 3;
  margin: 8px;
}
.lq-phone .lq-sheet-over {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  border-radius: 14px 14px 0 0;
}
.lq-scrim {
  position: absolute;
  inset: 0;
  z-index: 4;
  background: rgb(0 0 0 / 0.45);
}
/* Under the open sheet the paper and the speech are covered. */
.lq-covered {
  visibility: hidden;
}
.lq-phone-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 16px;
}
.lq-paper-content {
  display: flex;
  flex-direction: column;
  gap: calc(18px * var(--lq-density));
}
/* A zero-height row on the edge of the actions, so the tab rests on them. */
.lq-paper-tabrow {
  position: relative;
  z-index: 3;
  flex: 0 0 0;
}
/* The row (and the actions after it) rests at the foot of the stage when
   nothing in the flow above it takes the room: no words yet, or the column
   of a laptop window lying over the picture. */
.lq-paper-tabrow {
  margin-top: auto;
}
.lq-paper-tab {
  position: absolute;
  right: 16px;
  bottom: 0;
  height: 32px;
  padding: 0 14px;
  border: 1px solid var(--lq-line);
  border-bottom: none;
  border-radius: 10px 10px 0 0;
  background: color-mix(in srgb, var(--lq-surface) 96%, transparent);
  color: var(--lq-accent-text);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.lq-wide .lq-composer {
  position: relative;
  z-index: 3;
  flex: 0 0 auto;
  border-radius: 0;
  border-width: 1px 0 0;
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
/* Room for the narration hint: its 12px from the bottom, its ~30px pill
   (12px text, 5px padding, 1px border) and a 6px gap above it.
   While a story turn is read, the story ends above that room, so no word
   being read (above all the last one in view) sits under the hint. Kept for
   the whole reading, hint or not, so a scroll attempt that brings the hint up
   never resizes the held story; the raised hint (More below) never shows
   while held. Otherwise the same room is blank space at the end of the
   story, so the furthest the story scrolls is the same in both cases and the
   words never move when a reading starts or lets go. */
.lq-story-wrap {
  --lq-hint-room: 48px;
  /* The cards' story padding below the newest card (the held room counts it). */
  --lq-cards-story-end: 6px;
}
.lq-story-wrap.lq-hint-room {
  padding-bottom: var(--lq-hint-room);
}
.lq-story-wrap:not(.lq-hint-room) .lq-story {
  padding-bottom: var(--lq-hint-room);
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
  /* Room left of the words for the rule of a paragraph being read, which sits
     12px out (StoryTurn): a scrolling story clips whatever sticks out of it.
     The words stay where they were. */
  margin-left: -12px;
  padding-left: 12px;
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
