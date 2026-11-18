<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  ref,
  watch,
} from 'vue'
import { GAME_NAME } from '@/engine'
import { useGameStore } from '@/stores/useGameStore'
import { renderMarkup } from '@/utils/theme'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useStageSpeechStore } from '@/stores/useStageSpeechStore'
import { useArrivalStore } from '@/stores/useArrivalStore'
import { useCommandBox } from '@/composables/useCommandBox'
import { useRoomTitleStore } from '@/stores/useRoomTitleStore'
import { useSceneStore } from '@/stores/useSceneStore'
import { usePassageStore } from '@/stores/usePassageStore'
import { useAreaNamesStore } from '@/stores/useAreaNamesStore'
import { useFlightStore } from '@/stores/useFlightStore'
import { useBeltStore } from '@/stores/useBeltStore'
import { firstQuestUnit } from '@/lantern/narrationUnits'
import { sceneBlock } from '@/lantern/stageArrival'
import { parseTurn } from '@/lantern/parseTurn'
import { HurryKeys, aimOf } from '@/lantern/hurryKeys'
import {
  decidePointerPress,
  type PointerPress,
  type PointerPressAction,
  type PressKind,
} from '@/lantern/pointerPress'
import { wayCursor } from '@/lantern/wayCursor'
import type { NamedSpot } from '@/lantern/areaNames'
import {
  END_SLACK,
  ResizeLanding,
  type StoryGeometry,
} from '@/lantern/ResizeLanding'
import { useLanternPresentation } from '@/composables/useLanternPresentation'
import { useHoldToSkip, type HoldRingSpot } from '@/composables/useHoldToSkip'
import { useAudio } from '@/composables/useAudio'
import { useSizeWatch } from '@/composables/useSizeWatch'
import { useActMusic } from '@/composables/useActMusic'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { useFullscreen } from '@/composables/useFullscreen'
import { nameActions, type NameAction } from '@/lantern/nameActions'
import { parseCountedName } from '@/lantern/inventoryChanges'
import { useStoryFollow } from '@/composables/useStoryFollow'
import {
  FADING_COLUMNS,
  FADING_LINES,
  useFadeOnceRead,
} from '@/composables/useFadeOnceRead'
import { FADE_LEDGER } from '@/lantern/lineFade'
import { useNarrationPaper } from '@/composables/useNarrationPaper'
import {
  SHORT_QUERY,
  PHONE_QUERY,
  PORTRAIT_QUERY,
  useMediaQuery,
  KEYBOARD_QUERY,
  WIDE_QUERY,
  SIDES_QUERY,
} from '@/composables/useMediaQuery'
import CommandBox from './CommandBox.vue'
import F1Note from './F1Note.vue'
import ArrivalOnPicture from './ArrivalOnPicture.vue'
import AreaNames from './AreaNames.vue'
import AreaPress from './AreaPress.vue'
import PressRing from './PressRing.vue'
import {
  ringActions,
  visibleBox,
  type HandVerb,
  type RingSubject,
} from '@/lantern/pressRing'
import BeltOfPictures from './BeltOfPictures.vue'
import HandStrip from './HandStrip.vue'
import {
  carriedRing,
  pressedOnBelt,
  subjectOf,
  handCommand,
  type BeltPicture,
} from '@/lantern/belt'
import type { ActionContext } from '@/lantern/actions'
import type { AreaThing } from '@/lantern/areaThings'
import AcquiredFlight from './AcquiredFlight.vue'
import ChapterPage from './ChapterPage.vue'
import CompassPanel from './CompassPanel.vue'
import BiggerMapDialog from './BiggerMapDialog.vue'
import EndScreen from './EndScreen.vue'
import FinishDialog from './FinishDialog.vue'
import JournalDrawer from './JournalDrawer.vue'
import JournalPanel from './JournalPanel.vue'
import LanternDialog from './LanternDialog.vue'
import GameMenu, {
  type InfoKind,
  type JourneyKind,
  type MenuEntry,
  type MenuKind,
} from './GameMenu.vue'
import QuestDialog, { type QuestView } from './QuestDialog.vue'
import QuitDialog from './QuitDialog.vue'
import type { KeyHint } from './KeyLine.vue'
import SaveLoadDialog from './SaveLoadDialog.vue'
import SettingsDialog from './SettingsDialog.vue'
import RoomPlate from './RoomPlate.vue'
import RoomTitle from './RoomTitle.vue'
import SceneInterlude from './SceneInterlude.vue'
import HoldRing from './HoldRing.vue'
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
import TurnPage from './TurnPage.vue'
import { newestLoadable } from '@/lantern/saveCard'
import type { SaveSlot } from '@/types/bridge'

/**
 * Shell of the Lantern UI (the only UI; old `?ui=` links open it too): no top bar, story (one
 * StoryTurn per turn) and, on a keyboard, the typing box (F1). On laptops (≥1024 × 560) the
 * room is played on its picture, which fills the play area: the room's name
 * top-left (`RoomPlate`; who and what is here are marked on the picture), the round ☰
 * (the menu) top-right, the narrator's words up the left side. The menu opens
 * the journey first: the Journal (the story so far) and the Quests open as a
 * drawer from the right, the Map as the bigger map's window; J, Q and M open
 * them from the game as well, and what the menu opened comes back to it when
 * it closes. There is no action bar: Look, Search, Rest and Hint open from the room's name, and F1 brings up a typing box at the foot of the picture (not on a phone).
 * The left side is the narration paper: the turns since the last room change
 * (`useNarrationPaper`), each told as one bubble per paragraph like the speech
 * on the right (`StoryTurn`); every bubble and line on the picture fades away
 * 5 s after it has been read, its room closing (`useFadeOnceRead`), and the
 * Hide goes once none is left; the command is not echoed (the journal keeps it), and
 * quest news told in the middle leaves nothing here. The newest turn grows as
 * the narrator reaches each part and, when it is taller than the room under
 * the plate, scrolls with a "More below" pill. One "▾ Hide" on its own line at the bottom centre of the picture (or N)
 * clears both the narrator's bubbles and
 * the speech, leaving a "▴ Show" tab in its place; the tab, N
 * or the next turn that tells something
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
 * picture too; the tab, an action or typing clear it at once.
 * A phone (a touch screen whose shorter side is under 600 px) is played
 * sideways: held upright it shows only the turn page (`TurnPage`) over the
 * game, which waits behind it, inert and unchanged (the layout does not
 * depend on how the phone is held); on its side it is the laptop stage made
 * small: the plate top left, ☰ top right, and
 * the words up the left side.
 * Other smaller screens that are not short (a tablet upright, a narrow window)
 * play the same stage arranged for a tall screen: the plate across the top
 * with "⟲ Journal" (the whole story over the stage),
 * and the one column over the picture above the section tabs (Story, Bag,
 * Spells, Quests, Map). A short mouse window keeps the text page, with the
 * tabs on top (and ☰ in the corner), the room's plate, and the
 * typing box at the foot.
 * A new turn opens at its start, with a "More below" pill while the story
 * goes on below the visible part; in the one column each line said after
 * comes whole into view, pushing the older lines up (rq-r7ct).
 * After the last act, Finish the game asks to save (FinishDialog), then
 * only the end screen shows; the act's music keeps playing under it.
 * A player's command, and the arrival that opens an act, is narrated when the
 * act has recordings and narration is on (`useNarrationStore`):
 * `useLanternPresentation` starts it with the new turn (and reads a chapter
 * page, and decides what stops either), a click on
 * the story hurries it (two skip, and a press held skips the whole telling),
 * Space/Enter hurry while focus is not on a
 * field or a control (Space also on the folded bar's Actions and the actions panel's buttons; an arrival on the picture goes on a part instead; held, they skip the whole telling), Escape does not skip,
 * and a pop-up stops it. The menu (☰, or Escape when nothing else takes it) and anything opened from it pause the
 * narration where it is until it closes (`useNarrationStore.pause`), and F switches full screen. Building a command (typing, verbs,
 * targets) never stops it: only the complete command cuts in.
 * While a command is narrated the panels (plate, buttons, map, drawer) keep the state from before it and switch as the
 * voice reaches them (`usePanelHold`), and so do the command box's word list
 * and the target chips, unless the command moved the player: nothing in the
 * room just left can be addressed, so those offer the room the player is in
 * (`game.commandPlace`). Only pressing in one of those panels first shows the
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
const passage = usePassageStore()
const roomTitle = useRoomTitleStore()
const names = useAreaNamesStore()
const belt = useBeltStore()
/** The marks and names layer, which knows where the ways out are. */
const areaNamesEl = ref<InstanceType<typeof AreaNames> | null>(null)
/** The direction of the open way out under the pointer, or null: the stage shows its arrow. */
const pointingWay = ref<string | null>(null)
/** The direction of the open way whose mark or name the pointer is over, or null; a new room or the names going clears it. */
const nameWay = ref<string | null>(null)
/** A press on an open way goes now: the game takes actions and no scene is changing or waiting. */
const wayGoes = computed<boolean>(
  () => game.acceptInput && scene.turn === null && !speech.sceneChange,
)
/** The arrow over an open way: only while a press would go (the game takes actions, no scene is changing or waiting). */
const wayArrow = computed<string | null>(() =>
  wayGoes.value ? (nameWay.value ?? pointingWay.value) : null,
)
/** A laptop screen (≥1024 × 560): the stage with its action row along the bottom. */
const laptop = useMediaQuery(WIDE_QUERY)
const short = useMediaQuery(SHORT_QUERY)
/** A phone: a touch screen whose shorter side is under 600 pixels. Phones are played sideways. */
const phone = useMediaQuery(PHONE_QUERY)
const portrait = useMediaQuery(PORTRAIT_QUERY)
/** A phone held upright: the turn page covers the game, which waits behind it (the layout is the sideways one either way, so nothing behind changes). */
const turnPage = computed(() => phone.value && portrait.value)
/** A phone: the laptop stage made small, everything floating on the picture (played on its side; upright the turn page covers it). */
const sideways = computed(() => phone.value)
/** The stage with a plate and buttons floating on the picture: a laptop, or a phone on its side. */
const wide = computed(() => laptop.value || sideways.value)
/** A short screen that is not a phone (a mouse window dragged low): the text page. */
const textPage = computed(() => short.value && !phone.value)
/** Any other screen (a tablet, a narrow window) that is not short: the picture stage, arranged for a tall screen. */
const phoneStage = computed(() => !wide.value && !textPage.value)
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
/** The cursor is in a text field (the command box): no key steers the voice there. */
const fieldFocused = ref(false)
/** The hint under the story: none in the command box, where Space is a letter. */
const hintText = computed(() => {
  if (!keyboardPlayer.value) return 'Tap to hurry · hold to skip'
  return fieldFocused.value ? '' : 'Space to hurry · hold to skip'
})

/** The Type-mode command box: where Space is a letter, so no hint names a key. */
const COMMAND_BOX = '.lq-type-input'

/** Follows where the cursor is, for the hint. */
function onFocusChange(event: FocusEvent): void {
  // Focus is going to `relatedTarget` when it leaves, and to the target when it enters.
  const next = event.type === 'focusout' ? event.relatedTarget : event.target
  fieldFocused.value =
    next instanceof Element && next.matches('input, textarea')
}
const section = ref<Section>('story')
/** The drawer open beside the stage (the quests, or the journal: the story so far), or null. */
const drawerTab = ref<'quests' | 'story' | null>(null)
/** The button in the stage's corner (☰), measured for a sideways phone's plate. */
const stageButtons = ref<InstanceType<typeof StageButtons> | null>(null)
/** Whether the open drawer was opened from the menu, which its closing brings back. */
const drawerFromMenu = ref(false)
/** What had focus when a drawer was opened from the game, which gets it back when the drawer closes. */
let drawerOpener: HTMLElement | null = null
const plate = ref<InstanceType<typeof RoomPlate> | null>(null)
/** Whether the room's picture is up (otherwise the paper backdrop), for the arrival's ink. */
const pictured = ref(false)
/** A keyboard can type here: every screen but a phone (touch, small), which plays by pointing only. */
const canType = computed(() => !phone.value)
/** The typing box (F1 brings it up and hides it): hidden whenever a game begins. */
const commandBox = useCommandBox(canType, () => dialogOpen())
const typingOpen = commandBox.open
/** Whether the start-of-game note about F1 is up. */
const f1NoteShown = ref(false)
/** A new game has begun and its opening pop-up is up: the note waits for it to close. */
let f1NotePending = false
/** Show the note, unless this is a phone. */
function showF1Note(): void {
  f1NotePending = false
  f1NoteShown.value = canType.value
}
watch(
  () => game.showModal,
  (shown) => {
    if (!shown && f1NotePending) showF1Note()
  },
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
  roomTitle.reset()
  drawerTab.value = null
  speech.clear()
  scene.reset()
  clearArrival()
})

/** The room's title is told only where the room is played on its picture. */
watch(
  () => staged.value,
  (onStage) => {
    roomTitle.staged = onStage
  },
  { immediate: true },
)
/**
 * Whether the room's name in the corner steps away: a room just walked into
 * waits to be told (its picture still rising), or its title, or a first
 * visit's arrival, is told over the picture (news alone leaves it).
 */
const plateAway = computed(
  () => roomTitle.waiting || roomTitle.name !== null || arrival.tellsRoom,
)
/** Any key or press settles the room's title into the corner at once; the key or press still does what it does. */
function settleRoomTitle(): void {
  if (roomTitle.name !== null) roomTitle.settle()
}
onMounted(() => {
  window.addEventListener('keydown', settleRoomTitle, true)
  window.addEventListener('pointerdown', settleRoomTitle, true)
})
onUnmounted(() => {
  window.removeEventListener('keydown', settleRoomTitle, true)
  window.removeEventListener('pointerdown', settleRoomTitle, true)
  roomTitle.settle()
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

/** J or Q in the game: opens that drawer (closing the other), or closes it if it is the one open. */
function toggleDrawer(tab: 'quests' | 'story'): void {
  if (drawerTab.value === tab) {
    closeDrawer()
    return
  }
  if (!drawerTab.value)
    drawerOpener =
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body
        ? document.activeElement
        : null
  // A drawer the menu opened, switched for the other: its closing comes back to the other's tile.
  if (drawerFromMenu.value)
    menuEntry.value = tab === 'story' ? 'journal' : 'quests'
  drawerTab.value = tab
}

/**
 * Close the drawer. One opened from the menu brings the menu back, focus on
 * its tile; otherwise focus goes back to the typing box when it is up, else to
 * what had it when the drawer opened (on a phone, the plate's story button).
 */
function closeDrawer(): void {
  const tab = drawerTab.value
  if (drawerFromMenu.value) {
    drawerFromMenu.value = false
    drawerTab.value = null
    focusMenuEntry.value = menuEntry.value
    gameDialog.value = 'menu'
    return
  }
  drawerTab.value = null
  if (!tab) return
  if (typingOpen.value) void nextTick(focusActions)
  // On a phone the story so far was opened from the plate.
  else if (phoneStage.value)
    void nextTick(() => plate.value?.focusStoryButton())
  else if (drawerOpener?.isConnected) {
    const back = drawerOpener
    void nextTick(() => back.focus({ preventScroll: true }))
  }
  drawerOpener = null
}

// A drawer that goes some other way (a turn played, a press outside it) leaves the menu, and what had focus, behind for good.
watch(drawerTab, (tab) => {
  if (tab) return
  drawerOpener = null
  if (!drawerFromMenu.value) return
  drawerFromMenu.value = false
  menuEntry.value = null
})

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
      '.lq-drawer, .lq-story-drawer, .lq-buttons, .lq-name-menu, .lq-story-so-far, .lq-nav-bottom, .lq-dialog-layer',
    )
  )
    return
  drawerTab.value = null
}

/** The direction of the way out a press on the picture is on (its painted place, mark or name), or null. */
function wayPressed(event: MouseEvent): string | null {
  const target = event.target instanceof Element ? event.target : null
  const marked = target?.closest<HTMLElement>('[data-way]')?.dataset.way
  if (marked) return marked
  // A mark or name of a thing (stepped clear of a panel it may stand over another thing's way) is a press on its thing.
  if (target?.closest('[data-area-mark], [data-area-name]')) return null
  return (
    areaNamesEl.value?.wayAt(event.clientX, event.clientY)?.direction ?? null
  )
}

/** Go the way out in `direction` at once, as a press on its dot or its painted place does. */
function goWay(direction: string): void {
  narration.skipAll()
  belt.emptyHand()
  game.submitCommand(`go ${direction}`)
}

/**
 * A press on the picture itself shows the rest of an unnarrated turn's speech
 * at once, and a narrated turn is tapped on like the story, whether or not
 * anyone speaks in it (one block hurried; held, it skips the telling).
 */
function onPicturePress(event: MouseEvent): void {
  if (!(event.target instanceof Element)) return
  if (!event.target.closest('.lq-stage-picture')) return
  const way = wayPressed(event)
  pressOn('picture', { way: way !== null }, way)
}

watch(
  () => drawerTab.value !== null,
  (open) => {
    if (open) document.addEventListener('pointerdown', onOutsidePress)
    else document.removeEventListener('pointerdown', onOutsidePress)
  },
)
onUnmounted(() => document.removeEventListener('pointerdown', onOutsidePress))

/** What the belt of pictures last measured at the foot of the picture (the folded tab's height while it is put away). */
const beltMeasured = ref(0)
/** The height the story keeps clear of: the belt's, and the folded tab's too except on a sideways phone, which keeps its own room for it. */
const beltHeight = computed(() =>
  belt.away && sideways.value ? 0 : beltMeasured.value,
)
/** The room the typing box takes at the foot of the picture, with its gap. */
const BOX_ROOM = 64
/** How far above the foot of the picture the belt stands: above the typing box while it is up, else at the foot (a sideways phone keeps 8px). */
const beltBottom = computed(() =>
  laptop.value ? boxRoom.value : sideways.value ? 8 : 16 + boxRoom.value,
)
/** The belt starts at the picture's left edge. */
const beltLeft = computed(() => 0)
/** How far up from the foot of the picture the belt's top lies: what the names and press areas must keep clear of (none while the belt is away: the picture's foot is then the floor, then the action row alone on a laptop). */
const footCover = computed(() =>
  beltHeight.value > 0 && !belt.away
    ? beltBottom.value + beltHeight.value
    : laptop.value
      ? boxRoom.value
      : 0,
)

/** The room the typing box takes at the foot of the picture while it is up, which the story drawer and the words stop above. */
const boxRoom = computed(() =>
  staged.value && typingOpen.value ? BOX_ROOM : 0,
)

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
 * cards, or on the two-sided laptop stage the speech beside them, with a line
 * of them not yet faded away.
 */
const wordsVisible = computed(
  () =>
    (paper.visible.value || (twoSides.value && speech.visible.length > 0)) &&
    fading.live.value > 0,
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
 * Hide or show the words from a key (N). Focus on the Hide or inside
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
  // An arrival on the picture holds the paper away; Enter, Space or the tab end it.
  if (arrival.active) return
  const target = event.target instanceof Element ? event.target : null
  if (target?.closest('input, textarea, select, [contenteditable]')) return
  event.preventDefault()
  setWordsHidden(!paper.hidden.value)
}
/** The picture's size when the manifest does not say (the studio's default). */
const DEFAULT_PICTURE_SIZE = { width: 1920, height: 1080 }

/** The "◎ Show what's here": a placed thing in the room and no change of scene under way. */
const showNamesButton = computed(
  () =>
    staged.value &&
    game.roomAreas.things.length > 0 &&
    scene.phase === 'idle' &&
    !game.ending,
)
/** Whether the marks and names are up (and the picture is steady enough to hold them). */
const namesUp = computed(() => names.showing && scene.phase === 'idle')
/** The arrival words were folded away by showing the names, and come back when the names go. */
const arrivalFolded = ref(false)
/** The words were folded away by showing the names, and come back when the names go. */
const foldedForNames = ref(false)
/** Changes when what the names keep clear of moves: the words, a drawer, the names' own count. */
const namesRelayout = computed(() =>
  [
    paper.visible.value,
    paper.hidden.value,
    arrival.active,
    speech.visible.length,
    drawerTab.value,
    sideways.value,
    laptop.value,
    game.roomAreas.things.length,
    settings.textSize,
  ].join('|'),
)

/** Show the marks and names, or take them away. Showing them folds the words away (not under the Always setting), and the words come back with taking them away. */
function toggleNames(): void {
  if (names.showing) {
    names.turnOff()
    return
  }
  names.toggle()
  // Arrival words on the picture are words over it: they fold away as to Hide, still read aloud, and come back.
  if (!settings.alwaysShowNames && arrival.active) arrivalFolded.value = true
  if (!settings.alwaysShowNames && showHide.value) {
    paper.hide()
    foldedForNames.value = true
  }
}

// The words come back when the names go, by whatever way they went.
watch(
  () => names.showing,
  (up) => {
    if (up) return
    arrivalFolded.value = false
    if (!foldedForNames.value) return
    foldedForNames.value = false
    if (paper.hidden.value) paper.show()
  },
)
// An arrival that ended has nothing left to fold.
watch(
  () => arrival.active,
  (active) => {
    if (!active) arrivalFolded.value = false
  },
)
// Bringing the words back oneself ends the fold.
watch(
  () => paper.hidden.value,
  (hidden) => {
    if (!hidden) foldedForNames.value = false
  },
)

/** Where focus was before B took it to the belt, for Escape to give it back. */
let beltReturn: HTMLElement | null = null

/** Focus left the belt: where it came from is forgotten, so a later Escape does not jump back to a stale place. */
function onFocusIn(event: FocusEvent): void {
  if (!beltEl.value?.root?.contains(event.target as Node)) beltReturn = null
}

/**
 * B goes to the belt (bringing it up if it was put away), focus on the first
 * picture; B again, with focus on the belt, switches between Bag and Spells.
 * Not while typing, with a dialog or ring up, or where there is no picture.
 */
function onBeltKey(event: KeyboardEvent): void {
  if (event.key !== 'b' && event.key !== 'B') return
  if (event.defaultPrevented || event.repeat) return
  if (event.ctrlKey || event.metaKey || event.altKey) return
  if (!staged.value || dialogOpen() || ring.value || game.ending) return
  const target = event.target instanceof Element ? event.target : null
  if (target?.closest('input, textarea, select, [contenteditable]')) return
  event.preventDefault()
  const onBelt = !!beltEl.value?.root?.contains(document.activeElement)
  if (onBelt) belt.show(belt.list === 'bag' ? 'spells' : 'bag')
  else {
    beltReturn =
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body
        ? document.activeElement
        : null
    if (belt.away) belt.bringBack()
  }
  void beltEl.value?.focusBelt()
}

/** S shows or hides the names (the laptop only, where there is a button, never while typing or with a dialog up). */
function onNamesKey(event: KeyboardEvent): void {
  if (event.key !== 's' && event.key !== 'S') return
  if (event.defaultPrevented || event.repeat) return
  if (event.ctrlKey || event.metaKey || event.altKey) return
  if (!laptop.value || !showNamesButton.value || dialogOpen()) return
  const target = event.target instanceof Element ? event.target : null
  if (target?.closest('input, textarea, select, [contenteditable]')) return
  event.preventDefault()
  toggleNames()
}

/** Escape steps back from what is in hand and from the belt (S, not Escape, takes the names away); a dialog that is up shuts first. */
function onNamesEscape(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return
  if (dialogOpen() || ring.value) return
  // What is in hand goes down first (focus back on its picture on the belt); then, on the belt, focus goes back to where it was.
  if (belt.hand) {
    event.preventDefault()
    event.stopImmediatePropagation()
    cancelHand()
    return
  }
  const onBelt = beltEl.value?.root?.contains(document.activeElement)
  if (onBelt) {
    // Back to where focus was before the belt; with nothing there, the show button (the things on the picture take no keyboard focus).
    event.preventDefault()
    event.stopImmediatePropagation()
    const back =
      beltReturn?.isConnected && beltReturn !== document.body
        ? beltReturn
        : mainEl.value?.querySelector<HTMLElement>('.lq-show-names')
    beltReturn = null
    back?.focus({ preventScroll: true })
    return
  }
}

/** The pointer leaves the stage: no name follows it, no way's arrow shows. */
function onStageLeave(): void {
  names.pointer = null
  wordsDot.value = null
  nameWay.value = null
}

// A new room, or the names going, takes the way's name from under a pointer that has not moved: its arrow goes too.
watch([() => game.musicRoomKey, namesUp], () => {
  nameWay.value = null
})

/** The pointer moves over the stage: with a mouse (on any width, 1000px included) over the bare picture, the name of the thing under it follows. */
function onStagePointer(event: PointerEvent): void {
  const target = event.target instanceof Element ? event.target : null
  nameWay.value =
    target?.closest<HTMLElement>('[data-way]')?.dataset.way ?? null
  if (event.pointerType === 'touch' || !target?.closest('.lq-stage-picture')) {
    names.pointer = null
    return
  }
  names.pointer = { x: event.clientX, y: event.clientY }
}

/** The dot showing through the words' faded edge that the pointer rests on, or null: the words then have the pressable cursor. */
const wordsDot = ref<NamedSpot | null>(null)

/** The cursor over the words: the hand, or an open way's arrow, while a dot shows through them under the pointer. */
const wordsCursor = computed<{ cursor?: string }>(() => {
  const dot = wordsDot.value
  if (!dot) return {}
  if (dot.kind !== 'exit') return { cursor: 'pointer' }
  return dot.direction && wayGoes.value
    ? { cursor: wayCursor(dot.direction) }
    : {}
})

/**
 * The pointer moves over the words, which lie outside the stage: resting on a
 * mark that shows through a card's faded edge points at it as over the
 * picture (rq-riv9) and gives the words its pressable cursor (rq-njoa);
 * anywhere else on the words nothing is pointed at.
 */
function onWordsPointer(event: PointerEvent): void {
  const dot = areaNamesEl.value?.spotAt(event.clientX, event.clientY) ?? null
  wordsDot.value = event.pointerType !== 'touch' ? dot : null
  names.pointer = wordsDot.value ? { x: event.clientX, y: event.clientY } : null
}

/**
 * A press or tap on a dot that shows through the words' faded edge is a press
 * on its thing, as on the picture, and never hurries the narration (rq-njoa);
 * a press anywhere else on the words goes on to the cards as before.
 */
function onWordsPress(event: MouseEvent): void {
  const dot = areaNamesEl.value?.spotAt(event.clientX, event.clientY)
  if (!dot) return
  event.stopPropagation()
  event.preventDefault()
  if (dot.kind === 'exit') {
    const way = dot.direction || null
    pressOn('exit-dot', { way: way !== null }, way)
    return
  }
  onAreaPress(
    { areaId: dot.areaId, name: dot.name, label: dot.label, kind: dot.kind },
    { x: event.clientX, y: event.clientY },
    true,
  )
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
const commandBoxEl = ref<InstanceType<typeof CommandBox> | null>(null)
/** Put the cursor back in the typing box, when it is up. */
function focusActions(): void {
  if (passage.phase !== 'idle') return
  if (typingOpen.value) commandBoxEl.value?.focus()
}

/** The typing box asked to be hidden (Escape in it). */
function hideBox(): void {
  commandBox.hide()
}
// The box takes the cursor when it comes up, and a note about it is no longer needed.
watch(typingOpen, (open) => {
  if (open) f1NoteShown.value = false
})

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
const storyResize = useSizeWatch(
  () => {
    resizeLanding.reland()
    updateMoreBelow()
    refollow()
  },
  { inReport: true },
)
const contentResize = useSizeWatch(
  () => {
    resizeLanding.reland()
    keepAtFoot()
  },
  { inReport: true },
)

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

/** Who owns a key that may hurry the story, and the pause after a telling. */
const hurryKeys = new HurryKeys()

/**
 * Keys that steer the narration: describe the press and let `hurryKeys` say
 * who owns it (the pause after a telling and the aim at a button are its
 * own), then carry out its answer.
 */
function onNarrationKey(event: KeyboardEvent): void {
  // A key held to skip repeats: its repeats are the hold's and take no step.
  if (event.repeat && hold.keyHeld(event.key)) {
    event.preventDefault()
    return
  }
  const target = event.target instanceof Element ? event.target : null
  const decision = hurryKeys.decide({
    key: event.key,
    repeat: event.repeat,
    modified: event.ctrlKey || event.metaKey || event.altKey,
    handled: event.defaultPrevented,
    emptyBoxEnter: isEmptyBoxEnter(event),
    dialogOpen: dialogOpen(),
    inField: !!target?.closest('input, textarea, select, [contenteditable]'),
    onControl: !!target?.closest('button, a, [role="button"], summary'),
    ...aimOf(target),
    onPaperTab: !!target?.closest('.lq-paper-tab'),
    inOpenList: !!target?.closest('[aria-expanded="true"]'),
    scene: scene.turn !== null,
    // News held while the lines before it are read takes the keys as if it were up.
    arrival: arrival.active || arrival.holding,
    narrating: narration.isNarrating,
  })
  // Enter or Space that goes on takes its step now; held, it skips the rest.
  // Aimed at a field or a button it keeps its own press, unless the story took it.
  if (
    !event.repeat &&
    (event.key === 'Enter' || event.key === ' ') &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    beingTold() &&
    (decision
      ? ['skip-scene', 'arrival-next', 'hurry'].includes(decision.action)
      : !event.defaultPrevented &&
        !target?.closest(
          'input, textarea, select, [contenteditable], button, a, [role="button"], summary',
        ))
  )
    hold.keyDown(event.key, keyHoldSpot())
  if (!decision) return
  if (decision.consume) {
    event.preventDefault()
    spaceTaken = decision.swallowSpaceUp
  }
  switch (decision.action) {
    case 'skip-scene':
      presentation.continueScene()
      break
    case 'arrival-next':
      arrival.next()
      break
    case 'swallow':
      break
    case 'hurry':
      narration.hurry()
      break
  }
}

/**
 * A Space went on an arrival, a change of scene or (from the folded bar's
 * Actions or an action button) a narration, or was swallowed in the pause after
 * an arrival or a hurry: its key-up must not press the focused button.
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
  document.addEventListener('keydown', onNamesKey)
  document.addEventListener('keydown', onBeltKey)
  document.addEventListener('keydown', onJourneyKey)
  document.addEventListener('focusin', onFocusIn)
  document.addEventListener('keydown', onNamesEscape, true)
  document.addEventListener('keyup', onSpaceUp)
  document.addEventListener('keyup', onHoldKeyUp)
  document.addEventListener('focusin', onFocusChange)
  document.addEventListener('focusout', onFocusChange)
  // The game opens with its first act intro already showing.
  if (game.showModal) void nextTick(focusPopUp)
  if (storyEl.value) {
    storyResize.observe(storyEl.value)
    // The turns also settle after a crossing; a reading's new paragraphs must not jump the follow.
    if (contentEl.value) contentResize.observe(contentEl.value)
  }
})

/** The laptop's room plate, under which the narration cards stop. */
const widePlate = ref<InstanceType<typeof RoomPlate> | null>(null)
/** Where the cards' column ends at the top: the plate's foot and a gap (px from the stage's top). */
const cardsTop = ref(140)
/** The stage's top margin the plate stands at, and the gap kept under it (px). */
const PLATE_TOP = 16
/** A sideways phone's plate stands closer to the edge. */
const PLATE_TOP_SIDEWAYS = 8
const PLATE_GAP = 12
/**
 * Follows the plate's height, on the next frame: the cards' column is resized
 * and observed too, and resizing it while the plate's change is delivered
 * loops the observers.
 */
const widePlateResize = useSizeWatch(() => {
  const el = widePlate.value?.$el
  if (el instanceof HTMLElement)
    cardsTop.value =
      (sideways.value ? PLATE_TOP_SIDEWAYS : PLATE_TOP) +
      el.offsetHeight +
      PLATE_GAP
})
watch(
  widePlate,
  (current) => {
    const el = current?.$el
    widePlateResize.retarget(...(el instanceof HTMLElement ? [el] : []))
  },
  { flush: 'post' },
)

/** The phone's plate height, which the arrival on the picture stays clear of. */
const plateHeight = ref(108)
const plateResize = useSizeWatch(
  () => {
    const el = plate.value?.$el
    if (el instanceof HTMLElement) plateHeight.value = el.offsetHeight
  },
  { inReport: true },
)
watch(
  plate,
  (current) => {
    const el = current?.$el
    plateResize.retarget(...(el instanceof HTMLElement ? [el] : []))
  },
  { flush: 'post' },
)

/** How wide the stage's top-right buttons stand: a sideways phone's plate ends before them. */
const stageButtonsWidth = ref(0)
/** Follows the buttons' width, on the next frame, as the plate's: the plate is observed too. */
const stageButtonsResize = useSizeWatch(() => {
  const el = stageButtons.value?.$el
  if (el instanceof HTMLElement) stageButtonsWidth.value = el.offsetWidth
})
watch(
  stageButtons,
  (current) => {
    const el = current?.$el
    stageButtonsResize.retarget(...(el instanceof HTMLElement ? [el] : []))
  },
  { flush: 'post' },
)

onUnmounted(() => {
  document.removeEventListener('keydown', noteEmptyBoxEnter, true)
  document.removeEventListener('keydown', onNarrationKey)
  document.removeEventListener('keydown', onPaperKey)
  document.removeEventListener('keydown', onNamesKey)
  document.removeEventListener('keydown', onBeltKey)
  document.removeEventListener('keydown', onJourneyKey)
  document.removeEventListener('focusin', onFocusIn)
  document.removeEventListener('keydown', onNamesEscape, true)
  document.removeEventListener('keyup', onSpaceUp)
  document.removeEventListener('keyup', onHoldKeyUp)
  document.removeEventListener('focusin', onFocusChange)
  document.removeEventListener('focusout', onFocusChange)
  resizeLanding.dispose()
})

// Larger or smaller text changes how much of the turn is still below.
watch(() => settings.textSize, updateMoreBelow, { flush: 'post' })

// A reading that ends (above all a skip) draws the rest of the turn at once,
// which grows the story without scrolling it (the room kept for the hint
// moves from below the story into its end, so nothing moves).
// On the laptop's cards a reading cut short leaves the newest card at its
// start in view: the turn grew after the pane was last moved, and the older
// cards must not keep the column.
// (In the one column the lines it shows then push on to its last line, as
// every line said does: `showNewestLine`.)
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

/** The whole game (the hold to skip listens for presses in it). */
const rootEl = ref<HTMLElement | null>(null)
/** The lines on the picture (narrator's and speech) fade away once read, held while the words are hidden; `live` counts those left. */
const fading = useFadeOnceRead(
  rootEl,
  FADING_LINES,
  () => paper.hidden.value,
  FADING_COLUMNS,
)
// The columns read which lines are out of sight from it, never from the DOM.
provide(FADE_LEDGER, fading.ledger)
/**
 * Whether the story is being told: a change of scene, a talk still to change
 * it, words still coming, the narrator reading, or a room's words on the
 * picture. Only then does a held press or key skip it all.
 */
function beingTold(): boolean {
  return (
    !dialogOpen() &&
    (scene.turn !== null ||
      speech.sceneChange !== null ||
      telling.value ||
      narration.isNarrating ||
      arrival.active ||
      arrival.holding)
  )
}
/** Press (or Enter, or Space) and hold to skip the whole telling; a tap is one step. */
const hold = useHoldToSkip({
  root: () => rootEl.value,
  telling: beingTold,
  // A thing on the picture opens its ring whenever a press takes a move (an unnarrated arrival, say); otherwise its press is the hold's.
  thingIdle: () => decidePointerPress(pressOf('thing')).action === 'none',
  skip: () => presentation.skipTelling(),
})
/** Where a held press shows its ring, while it does. */
const holdRing = hold.ring
/** A held key's ring stands in the middle of the stage (or of the window, with no stage). */
function keyHoldSpot(): HoldRingSpot {
  const box = stageEl.value?.getBoundingClientRect()
  if (box && box.width > 0)
    return { x: box.left + box.width / 2, y: box.top + box.height * 0.7 }
  return { x: window.innerWidth / 2, y: window.innerHeight * 0.7 }
}
/** A key held down for the hold is let go. */
function onHoldKeyUp(event: KeyboardEvent): void {
  hold.keyUp(event.key)
}

const flights = useFlightStore()
/** The newest turn whose lost and gained things have flown (or were let be): each turn's fly once. */
let flownTurn = game.turns.at(-1)?.id ?? null
// A new command stops what is still flying (its counts are already up).
watch(
  () => game.turns.at(-1)?.id,
  () => flights.clear(),
)
// On the picture stage, a turn's lost items leave the Bag first, then its
// gained items and spells fly to the Bag and Spells buttons, once the turn
// lets go of them (as their counts change) and the middle of the picture is
// clear: no news or arrival told or waiting there, no change of scene, and no
// pop-up over it.
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
    // A turn a load brought back flew its things when it was played.
    const leaving = turn.lost.filter((chip) => chip.kind === 'item')
    if (
      staged.value &&
      !turn.restored &&
      (turn.gained.length || leaving.length)
    )
      flights.launch(turn.gained, leaving, motionReduced())
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
  // The room name and its pills (Hint among them) act on the first press, wherever they stand: a pill cuts an arrival short and sends its command.
  if (target.closest('.lq-name-btn, .lq-pill')) return
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
/** The last turn whose spell sound has rung (its news came up, or was cut short). */
let spellRungTurn: number | null = null
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
    if (up.spell) {
      spellRungTurn = up.turnId
      game.ringSpellSound()
    } else game.ringQuestSounds(up.turnId, [up.index])
  },
)

// News cut short before its spell came up (a hold on the held news,
// a new command) still rings the spell's sound as it goes, as the quest cards
// still ring theirs. A turn no longer in the story (a new game, or a load,
// which brings back the save's story in its place) rings nothing.
watch(
  () => {
    const turn = game.turns.at(-1)
    return turn?.spells?.length && arrival.newsPending(turn.id) ? turn.id : null
  },
  (_pending, before) => {
    if (before === null || before === undefined || before === spellRungTurn)
      return
    if (!game.turns.some((turn) => turn.id === before && turn.spells?.length))
      return
    spellRungTurn = before
    game.ringSpellSound()
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
    // Opened at its start, the story no longer rests at its foot.
    noteFoot()
    updateMoreBelow()
    // The cursor goes back to the typing box when the new turn took it away.
    const lost = document.activeElement === document.body
    if ((away || lost) && !game.showModal) focusActions()
  },
  { flush: 'post' },
)

/**
 * Bring the newest line said in the one column whole into view, pushing the
 * older lines up to the foot of the story (rq-r7ct): never so far that its
 * own top leaves, and never back (`footTop`). So the lines fading away
 * above it never move what still shows. A story being read is moved by its
 * follow instead, and nothing moves while the story is out of sight (another
 * section is open) or no line is said.
 */
async function showNewestLine(): Promise<void> {
  await nextTick()
  const story = storyEl.value
  const said = speech.visible.at(-1)
  if (
    !column.value ||
    storyHeld.value ||
    section.value !== 'story' ||
    !story ||
    !said
  )
    return
  lineShown = said.key
  const top = footTop(story)
  if (top === null) return
  if (top > story.scrollTop) moveStory(top, false)
  noteFoot()
  updateMoreBelow()
}

/**
 * Where the story rests at its foot, the room kept below the newest line too
 * (a pane short of its foot would close that gap as the rows above it go,
 * moving what still shows), but never past that line's top. Null while no
 * line said is drawn in the story.
 */
function footTop(story: HTMLElement): number | null {
  const said = speech.visible.at(-1)
  const newest =
    said &&
    story.querySelector<HTMLElement>(
      `[data-turn="${said.turnId}"] [data-key="line-${said.unit}-${said.firstWord}"]`,
    )
  if (!newest) return null
  const pane = story.getBoundingClientRect()
  const line = newest.getBoundingClientRect()
  const paddingTop = parseFloat(getComputedStyle(story).paddingTop) || 0
  return Math.min(
    story.scrollHeight - story.clientHeight,
    story.scrollTop + line.top - (pane.top + paddingTop),
  )
}

/** Whether the story rests at its foot, so stays there as its content changes size (`keepAtFoot`). */
let atFoot = false

/** Note whether the story is at its foot: the player scrolling back leaves it. */
function noteFoot(): void {
  const story = storyEl.value
  atFoot =
    !!story && story.scrollTop >= story.scrollHeight - story.clientHeight - 1
}

/**
 * Keep the one column at its foot (never past the newest line's top) while
 * its content changes size (a run's name stepping down to its next line takes
 * room), so the lines still showing stay where they are.
 */
function keepAtFoot(): void {
  const story = storyEl.value
  if (!atFoot || !column.value || !story || section.value !== 'story') return
  // A window crossing lands the story where the player was reading instead.
  if (resizeLanding.landing) return
  const top = footTop(story)
  // Also while a turn is read: `moveStory` tells the follow where it belongs.
  if (top !== null && Math.abs(top - story.scrollTop) > 1) moveStory(top, false)
}

// A line has left sight (or come back, or taken its room away): once the
// columns have drawn the change (a run's name stepping down), keep the story
// at its foot before the next frame, so what still shows never moves, not even
// for a frame.
watch(() => fading.ledger.version.value, keepAtFoot, { flush: 'post' })

/** The story scrolled: what is below, and whether it is still at its foot. */
function onStoryScroll(): void {
  updateMoreBelow()
  noteFoot()
}
/** The key of the newest line last brought into view (`showNewestLine`). */
let lineShown: number | undefined
// Each new line (also the rest of a talk shown at once by a press or a skip,
// which so ends at its last line) brings the newest line into view, and so
// does the story shown again after another section, if a line was said
// meanwhile: a player who scrolled back to read keeps their place otherwise.
watch(() => speech.visible.at(-1)?.key, showNewestLine, { flush: 'post' })
watch(section, (now) => {
  if (now === 'story' && speech.visible.at(-1)?.key !== lineShown)
    void showNewestLine()
})

// The quest chime and fanfare (sound settings apply).
game.setAudioPlayer(useAudio())
const music = useActMusic()

// --- Game menu, Stats and Help (dialogs the player opens) ---
const gameDialog = ref<'menu' | MenuKind | null>(null)

// --- Pressing a thing on the picture, or a picture on the belt: a ring of what can be done with it ---
/** The ring that is open: what it is round (a thing of the room, or a picture on the belt), the spot pressed and the picture's size, in the stage's pixels. */
const ring = ref<{
  thing: RingSubject
  from: 'room' | 'belt'
  at: { x: number; y: number }
  bounds: { w: number; h: number }
  /** The part of the picture that can be seen, in the stage's pixels: the layer the ring is drawn in. */
  layer: { left: number; top: number; width: number; height: number }
} | null>(null)
const stageEl = ref<HTMLElement | null>(null)
/** The belt of pictures, for focus. */
const beltEl = ref<InstanceType<typeof BeltOfPictures> | null>(null)
/** What the Actions row would offer now: the ring reads the same lists. */
const ringContext = computed<ActionContext>(() => ({
  roomItems: game.items,
  characters: game.characters,
  inventory: game.bagEntries,
  spells: game.spellEntries,
  exits: game.exits,
  wares: game.roomWares,
}))
/** The actions on the open ring, read live so what is gone leaves it. */
const ringItems = computed(() => {
  const open = ring.value
  if (!open) return []
  if (open.from === 'belt') {
    const placed = game.roomAreas.things.filter(
      (thing) => thing.kind !== 'exit',
    ).length
    return carriedRing(open.thing, ringContext.value, placed)
  }
  return ringActions(open.thing as AreaThing, ringContext.value)
})
/** The words are still being told: a press hurries them and opens no ring. */
const telling = computed(
  () =>
    narration.isNarrating ||
    (speech.conversation?.lines.some((line) => !line.shown) ?? false),
)
/** A press of `kind` as `decidePointerPress` hears it: the story's state now, with the details of this press in `over`. */
function pressOf(
  kind: PressKind,
  over: Partial<PointerPress> = {},
): PointerPress {
  return {
    kind,
    scene: scene.turn !== null,
    sceneChange: speech.sceneChange !== null,
    telling: telling.value,
    acceptInput: game.acceptInput,
    sceneBusy: scene.phase !== 'idle',
    blocked: dialogOpen() || drawerTab.value !== null,
    way: false,
    hand: belt.hand !== null,
    onControl: false,
    ...over,
  }
}

/**
 * Decide a press of `kind` and carry out the answers that need nothing of the
 * press itself (a scene brought up, a way gone, the words hurried or the
 * narrator tapped on). `way` is the direction pressed, for `go-way`. The
 * answer comes back so a thing or a belt picture can take its ring or hand.
 */
function pressOn(
  kind: PressKind,
  over: Partial<PointerPress> = {},
  way: string | null = null,
): PointerPressAction {
  const { action } = decidePointerPress(pressOf(kind, over))
  switch (action) {
    case 'continue-scene':
      presentation.continueScene()
      break
    case 'scene-now':
      speech.changeSceneNow()
      break
    case 'go-way':
      if (way !== null) goWay(way)
      break
    case 'hurry':
      speech.revealAll()
      narration.tap()
      break
    case 'tap':
      narration.tap()
      break
  }
  return action
}

/** Where a ring pressed at `at` (in the window) is drawn: in the part of the picture the typing box and phone plate leave, so no button or name hides under them. */
function ringPlacement(
  stage: DOMRect,
  at: { x: number; y: number },
): Pick<NonNullable<typeof ring.value>, 'at' | 'bounds' | 'layer'> {
  const covers = [
    ...(stageEl.value?.parentElement?.querySelectorAll<HTMLElement>(
      '.lq-stage-box, .lq-phone-plate',
    ) ?? []),
  ].map((el) => el.getBoundingClientRect())
  const seen = visibleBox(stage, covers)
  return {
    at: { x: at.x - seen.left, y: at.y - seen.top },
    bounds: { w: seen.width, h: seen.height },
    layer: {
      left: seen.left - stage.left,
      top: seen.top - stage.top,
      width: seen.width,
      height: seen.height,
    },
  }
}

/** Bumped when the window is resized, so the caption is placed again. */
const windowTick = ref(0)
/** The window changed size: the caption follows the belt. */
function onWindowResize(): void {
  windowTick.value++
}
onMounted(() => window.addEventListener('resize', onWindowResize))
onUnmounted(() => window.removeEventListener('resize', onWindowResize))
/** The belt picture whose caption shows, as the belt says. */
const beltCaption = ref<BeltPicture | null>(null)
/** Where the caption lies: centred over the belt, one line higher while a Hide or Show button stands above the belt (over the words, like the ring). */
function captionStyle(): Record<string, string> {
  void windowTick.value
  const parent = stageEl.value?.parentElement?.getBoundingClientRect()
  const belt = beltEl.value?.root?.getBoundingClientRect()
  if (!parent || !belt) return { visibility: 'hidden' }
  const lift = showHide.value || showTab.value ? ' + var(--lq-hide-line)' : ''
  return {
    left: `${belt.left + belt.width / 2 - parent.left}px`,
    bottom: `calc(${parent.bottom - belt.top + 6}px${lift})`,
  }
}

/** A thing of the picture is pressed, at `at` in the window: send what is in hand to it, or open its ring, if the game takes a move and the words have settled. `onMark` says the press is on the thing's own mark or name, which may stand over another way. */
function onAreaPress(
  thing: AreaThing,
  at: { x: number; y: number },
  onMark = false,
): void {
  const box = stageEl.value?.getBoundingClientRect()
  if (!box || !staged.value) return
  // A way out smaller than the thing it lies on is the press's: the stage takes it (`onPicturePress`).
  // A press on a thing's own mark or name is its thing's, wherever the mark stands.
  const wayUnder = !onMark && !!areaNamesEl.value?.wayAt(at.x, at.y)
  const answer = pressOn('thing', { way: wayUnder })
  if (answer === 'send-hand' && belt.hand) {
    sendHand(handCommand(belt.hand, thing))
  } else if (answer === 'open-ring') {
    ring.value = {
      thing,
      from: 'room',
      ...ringPlacement(box, at),
    }
  }
}

/** A picture of the belt is pressed, at `at` in the window: another thing for what is in hand, or its own ring. While the words are told it hurries them instead. */
function onBeltPress(picture: BeltPicture, at: { x: number; y: number }): void {
  const box = stageEl.value?.getBoundingClientRect()
  if (!box || !staged.value) return
  const answer = pressOn('belt')
  if (answer === 'send-hand' && belt.hand) {
    const command = pressedOnBelt(belt.hand, picture)
    if (command) sendHand(command)
  } else if (answer === 'open-ring') {
    ring.value = {
      thing: subjectOf(picture),
      from: 'belt',
      ...ringPlacement(box, at),
    }
  }
}

/** Where focus returns to when the ring or the hand is gone: the thing or picture, or if it has gone the show button (for the belt, its first picture). */
function focusAfterRing(areaId: string): void {
  if (areaId.startsWith('belt:')) {
    const key = areaId.slice('belt:'.length)
    if (beltEl.value?.has(key)) void beltEl.value.focusPicture(key)
    else void beltEl.value?.focusBelt()
    return
  }
  const thing = stageEl.value?.querySelector<HTMLElement>(
    `[data-area-press="${areaId}"]`,
  )
  const target =
    thing ?? mainEl.value?.querySelector<HTMLElement>('.lq-show-names')
  target?.focus({ preventScroll: true })
}

/** Close the ring; Escape (or Tab) puts focus back on the thing. */
function closeRing(byKey: boolean): void {
  const id = ring.value?.thing.areaId
  ring.value = null
  if (byKey && id) void nextTick(() => nextTick(() => focusAfterRing(id)))
}

/** Send a command as a typed one, with the ring and the hand put away, and put focus back on `id`'s thing (or the show button, or the belt's first picture, once it has gone). */
function sendFrom(command: string, id: string | undefined): void {
  ring.value = null
  belt.emptyHand()
  game.submitCommand(command)
  if (!id) return
  void nextTick(() => nextTick(() => focusAfterRing(id)))
  // The thing may go with the answer (taken, used up): focus then moves on.
  pendingFocus = id
  clearTimeout(pendingTimer)
  pendingTimer = setTimeout(() => (pendingFocus = null), 600)
}

/** Send the ring's command. */
function runRing(command: string): void {
  sendFrom(command, ring.value?.thing.areaId)
}

/** Send what the hand was holding; focus goes back to its picture on the belt, or the belt's first picture if it has gone. */
function sendHand(command: string): void {
  sendFrom(command, handFrom ?? undefined)
}

/** The ring's Use with…, Give… or Cast on…: close it and put the thing or spell in hand; focus goes to ✕ Cancel (the picture's things take no keyboard focus). */
function takeInHand(verb: HandVerb): void {
  const open = ring.value
  ring.value = null
  if (!open) return
  belt.takeInHand({
    kind: open.thing.kind === 'spell' ? 'spell' : 'item',
    name: open.thing.name,
    label: open.thing.label,
    verb,
  })
  handFrom = open.thing.areaId
  // The things on the picture take no keyboard focus, so the keyboard waits on the hand's Cancel.
  void nextTick(() =>
    nextTick(() =>
      stageEl.value
        ?.querySelector<HTMLElement>('[data-hand-cancel]')
        ?.focus({ preventScroll: true }),
    ),
  )
}

/** The belt picture the hand was taken from, where focus returns to when the hand is put down. */
let handFrom: string | null = null

/** Put the hand down without sending anything; focus goes back to the picture it was taken from. */
function cancelHand(): void {
  const id = handFrom
  belt.emptyHand()
  if (id) void nextTick(() => nextTick(() => focusAfterRing(id)))
}

/** The thing a command was run from, while focus may still need to find it or the show button. */
let pendingFocus: string | null = null
let pendingTimer: ReturnType<typeof setTimeout> | undefined
watch(
  () => [game.turns.length, game.roomAreas.things] as const,
  () => {
    if (pendingFocus === null) return
    const active = document.activeElement
    if (!active || active === document.body || !active.isConnected)
      focusAfterRing(pendingFocus)
  },
  { flush: 'post' },
)
onUnmounted(() => clearTimeout(pendingTimer))

// The ring closes when the move is no longer the game's to take, the room or scene changes, a pop-up or panel comes over, or its thing leaves.
watch(
  () =>
    [
      game.acceptInput,
      scene.phase,
      game.showModal,
      game.showTitle,
      gameDialog.value,
      drawerTab.value,
      section.value,
      game.roomName,
      staged.value,
    ] as const,
  () => {
    ring.value = null
  },
)
watch(
  () => game.roomAreas.things,
  (things) => {
    const open = ring.value
    if (
      open &&
      open.from === 'room' &&
      !things.some((t) => t.areaId === open.thing.areaId)
    )
      ring.value = null
  },
)
// A ring on the belt closes when its picture leaves the belt.
watch(
  () => [game.bagEntries, game.spellEntries] as const,
  () => {
    const open = ring.value
    if (open?.from === 'belt' && !beltEl.value?.has(open.thing.areaId.slice(5)))
      ring.value = null
  },
  { flush: 'post' },
)

// The hand is put down, nothing sent, when the game moves on: any command (ours included), a way out, a change of scene, a pop-up or dialog, a new game, load or act, or the thing or spell in hand being lost.
watch(
  () =>
    [
      stageKey.value,
      scene.phase,
      game.showModal,
      game.showTitle,
      gameDialog.value,
      game.roomName,
      game.turns.at(-1)?.id,
      staged.value,
    ] as const,
  () => belt.emptyHand(),
)
watch(
  () => [game.bagEntries, game.spellEntries] as const,
  ([bag, spells]) => {
    const held = belt.hand
    if (!held) return
    const carried = (held.kind === 'item' ? bag : spells).map(
      (entry) => parseCountedName(entry).name,
    )
    if (!carried.includes(held.name)) belt.emptyHand()
  },
)

/** Help has nothing to select: the arrows scroll it. */
const HELP_KEYS: KeyHint[] = [
  { keys: ['↑', '↓'], word: 'scroll' },
  { keys: ['Esc'], word: 'back' },
]
const INFO_TITLES: Record<InfoKind, string> = { help: 'Help' }
let dialogOpener: HTMLElement | null = null
/** The menu entry a window or the quit question was opened from, which gets focus when it closes and the menu comes back. */
const menuEntry = ref<MenuEntry | null>(null)

/** Open the menu (a button, Escape), or a window from it (then its entry is remembered). */
function openGameDialog(kind: 'menu' | MenuKind): void {
  // ☰ over a drawer the menu opened: the menu is opened afresh, and that drawer goes.
  if (kind === 'menu' && drawerFromMenu.value) putDrawerAway()
  if (!gameDialog.value)
    dialogOpener = document.activeElement as HTMLElement | null
  menuEntry.value = kind === 'menu' ? null : kind
  if (kind === 'menu') focusMenuEntry.value = null
  gameDialog.value = kind
}

/**
 * An entry of the menu: a window opens in its place (the map among them), or
 * the journal or the quests open as their drawer beside the stage while the
 * menu waits; closing either comes back to the menu, focus on its entry.
 */
function openFromMenu(kind: MenuKind): void {
  if (kind === 'map' && drawerTab.value) putDrawerAway()
  if (kind !== 'journal' && kind !== 'quests') {
    openGameDialog(kind)
    return
  }
  const tab = kind === 'journal' ? 'story' : 'quests'
  if (!drawerFor(tab)) {
    // A section of the page, which stays: nothing to come back from.
    void closeAllGameDialogs()
    section.value = tab
    return
  }
  menuEntry.value = kind
  gameDialog.value = null
  drawerFromMenu.value = true
  // On a tall screen the journal lies over the story: the story is the section shown.
  if (tab === 'story') section.value = 'story'
  drawerTab.value = tab
}

/**
 * Whether the journal or the quests open as a drawer here: both on the
 * laptop's (and the sideways phone's) stage; on a tall screen's stage the
 * journal does (over the stage, as its plate button opens it) and the quests
 * are a section; on the text page both are sections.
 */
function drawerFor(tab: 'quests' | 'story'): boolean {
  return tab === 'story' ? staged.value : wide.value
}

/** Close the open drawer without coming back to anything. */
function putDrawerAway(): void {
  drawerFromMenu.value = false
  drawerTab.value = null
  drawerOpener = null
}

/**
 * M in the game: the bigger map, which closes back to the game. Focus then
 * goes to what had it before a drawer the map puts away: before one the game
 * opened, what had focus then; before one the menu opened, what opened the menu.
 */
function openMapFromGame(): void {
  const fromMenu = drawerFromMenu.value
  const before = drawerTab.value && !fromMenu ? drawerOpener : null
  if (drawerTab.value) putDrawerAway()
  if (!fromMenu)
    dialogOpener =
      before ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null)
  menuEntry.value = null
  gameDialog.value = 'map'
}

/**
 * J, Q and M: the journal, the quests and the bigger map, as the menu's tiles
 * open them. In the game the drawers toggle (J on the quests switches to the
 * journal) and M opens the map, and where the quests or the journal are a
 * section of the page the key shows that section; in the menu they open what
 * its tile does, so closing comes back to it; on the map M closes it. Not in a
 * text field, not with Ctrl, ⌘ or Alt, and not while the title, a chapter, the
 * quit question, a quest, a name's menu, the end or a ring is up.
 */
function onJourneyKey(event: KeyboardEvent): void {
  const kinds: Record<string, JourneyKind> = {
    j: 'journal',
    q: 'quests',
    m: 'map',
  }
  const kind = kinds[event.key.toLowerCase()]
  if (!kind || event.defaultPrevented || event.repeat) return
  if (event.ctrlKey || event.metaKey || event.altKey) return
  const target = event.target instanceof Element ? event.target : null
  if (target?.closest('input, textarea, select, [contenteditable]')) return
  if (ring.value || game.ending || game.showModal || game.showTitle) return
  if (game.quitAsked || game.shownQuest || nameMenu.value) return
  if (gameDialog.value === 'map' && kind === 'map') {
    event.preventDefault()
    void closeGameDialog()
    return
  }
  if (gameDialog.value === 'menu') {
    event.preventDefault()
    openFromMenu(kind)
    return
  }
  if (gameDialog.value) return
  event.preventDefault()
  if (kind === 'map') {
    openMapFromGame()
    return
  }
  const tab = kind === 'journal' ? 'story' : 'quests'
  if (!drawerFor(tab)) {
    section.value = tab
    return
  }
  // On a tall screen the journal lies over the story: J from another section goes back to it.
  if (tab === 'story' && section.value !== 'story') section.value = 'story'
  toggleDrawer(tab)
}

/** Quit asked from the menu: the question takes its place, and Cancel brings it back. */
function askQuitFromMenu(): void {
  menuEntry.value = 'quit'
  game.quitAsked = true
}

/** The quit question was cancelled: back to the menu it came from, or to the game. */
function cancelQuit(): void {
  game.quitAsked = false
  if (gameDialog.value === 'menu') focusMenuEntry.value = 'quit'
}

/** The entry of the menu that takes focus when it comes back (null: Save). */
const focusMenuEntry = ref<MenuEntry | null>(null)

// A game pop-up closes the player's dialogs (they do not come back after).
watch(
  () => game.showModal,
  (open) => {
    if (!open) return
    gameDialog.value = null
    game.shownQuest = null
  },
)

/** Closing the menu gives focus back to what opened it, or to the typing box when it is up. */
async function closeGameDialog(): Promise<void> {
  // A window opened from the menu goes back to the menu, focus on its entry.
  if (gameDialog.value !== 'menu' && menuEntry.value) {
    focusMenuEntry.value = menuEntry.value
    gameDialog.value = 'menu'
    return
  }
  await closeAllGameDialogs()
}

/** Everything the menu opened is closed and the game goes on (a slot saved or loaded, the menu closed): focus goes to the typing box when it is up, else back to what opened the menu. */
async function closeAllGameDialogs(): Promise<void> {
  gameDialog.value = null
  menuEntry.value = null
  focusMenuEntry.value = null
  await nextTick()
  if (typingOpen.value) focusActions()
  else if (
    document.activeElement === document.body &&
    dialogOpener?.isConnected
  )
    dialogOpener.focus()
}

// A new game (quitting to the main menu) leaves nothing of the menu behind.
watch(
  () => game.gameNumber,
  () => {
    gameDialog.value = null
    menuEntry.value = null
    focusMenuEntry.value = null
  },
)

// The narration waits, mid-line, while the menu or anything from it is open
// (a drawer it opened too); the music and the room's sounds play on. The map
// opened from the game (M) is not the menu: like the drawers it lets the voice
// read on and catches up.
watch(
  () =>
    (gameDialog.value !== null &&
      !(gameDialog.value === 'map' && menuEntry.value === null)) ||
    drawerFromMenu.value ||
    game.quitAsked,
  (open) => (open ? narration.pause() : narration.resume()),
)

const fullscreen = useFullscreen()

/**
 * Keys that belong to no one thing: Escape opens the menu when nothing else
 * took it (what is open closes first, and the command box and the belt step
 * back first: they consume their Escape), but not on the title page, a
 * chapter page, a game pop-up, the end screen or the turn page; F switches
 * full screen on and off, except in a text field. A held key acts once.
 */
function onMenuKey(event: KeyboardEvent): void {
  if (event.defaultPrevented || event.repeat) return
  if (event.ctrlKey || event.metaKey || event.altKey) return
  if (event.key === 'Escape') {
    if (
      game.ending ||
      turnPage.value ||
      dialogOpen() ||
      ring.value ||
      document.querySelector('.lq-dialog-layer')
    )
      return
    event.preventDefault()
    openGameDialog('menu')
    return
  }
  if (event.key !== 'f' && event.key !== 'F') return
  const target = event.target instanceof Element ? event.target : null
  if (target?.closest('input, textarea, select, [contenteditable]')) return
  if (!fullscreen.supported) return
  fullscreen.toggle()
}
onMounted(() => document.addEventListener('keydown', onMenuKey))
onUnmounted(() => document.removeEventListener('keydown', onMenuKey))

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
  '\n[bold]Narration:[/bold] Tap the story or press Space to hurry the current line; ' +
  'hold to show the rest at once. Any action cuts in. ' +
  'Set its volume, down to silent, in Settings.\n'

/** Help's line for the key that closes what is open, or opens the menu (laptop only). */
const ESCAPE_KEY_HELP = "\nEsc — close what's open, or open the menu\n"

/** Help's line for the full-screen key (laptop only, where full screen works). */
const FULLSCREEN_KEY_HELP = '\nF — full screen on or off\n'

/** Help's line for the key that hides the narration paper (laptop only). */
const NARRATION_KEY_HELP = '\nN — hide or show the words\n'

/** Help's line for the key that shows or hides the names on the picture (laptop only). */
const NAMES_KEY_HELP = "\nS — show or hide what's here\n"

/** Help's line for the room's name, which opens Look, Search and Rest. */
const ROOM_NAME_HELP = "\nPress the room's name for Look, Search and Rest.\n"

/** Help's line for F1, the typing box (where a keyboard can type). */
const TYPING_BOX_HELP =
  '\nPress F1 to type commands instead; F1 again hides the box.\n'

/** Stats or Help as HTML (Help ends with the music credits). */
const infoHtml = computed(() => {
  if (gameDialog.value !== 'help') return ''
  return (
    renderMarkup(game.readInfo('help')) +
    renderMarkup(NARRATION_HELP) +
    renderMarkup(ROOM_NAME_HELP) +
    (canType.value ? renderMarkup(TYPING_BOX_HELP) : '') +
    (laptop.value
      ? renderMarkup(ESCAPE_KEY_HELP) +
        (fullscreen.supported ? renderMarkup(FULLSCREEN_KEY_HELP) : '') +
        renderMarkup(NARRATION_KEY_HELP) +
        renderMarkup(NAMES_KEY_HELP)
      : '') +
    music.buildAttributionHtml()
  )
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
 * it goes to the typing box (when it is up); a click or scroll leaves it be (on a phone,
 * focusing the typing box could open the keyboard).
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
  pressOn('story', {
    onControl: !!target?.closest(
      'button, a, [data-name-kind], .theme-item_name, .theme-character_name',
    ),
  })
  onNameClick(event)
}

const chapterPage = ref<InstanceType<typeof ChapterPage> | null>(null)

/** Leave the title page for the first act's chapter page. */
function startGame(): void {
  // The title fades out and the intro rises; focus lands once it is up.
  game.startFromTitle(() => {
    focusPopUp()
    // A new game: tell keyboard players about F1 once its opening pop-up is read.
    if (game.showModal) f1NotePending = true
    else showF1Note()
  })
}

/** The first press on the fading screen only brings the new one up; a press on the title, the intro or the picture does nothing more. */
const PASSAGE_ONLY_SKIPS =
  '.lq-title-page, .lq-chapter-dialog, .lq-stage-picture'

/** A click while the screen is fading into a game brings it up at once, and does only that on the title, the intro or the picture. */
function onPassageClick(event: MouseEvent): void {
  if (!passage.skip()) return
  const target = event.target instanceof Element ? event.target : null
  if (target?.closest(PASSAGE_ONLY_SKIPS)) {
    event.preventDefault()
    event.stopPropagation()
  }
}

/** Enter while the screen is fading into a game brings it up at once, and does nothing else (not even the intro's button). */
function onPassageKey(event: KeyboardEvent): void {
  if (event.key !== 'Enter') return
  const target = event.target instanceof Element ? event.target : null
  if (target?.closest('input, textarea, select, [contenteditable]')) return
  if (!passage.skip()) return
  event.preventDefault()
  event.stopPropagation()
}

// Plain listeners, in the capture phase, so they run before every other press handler.
onMounted(() => {
  rootEl.value?.addEventListener('click', onPassageClick, true)
  rootEl.value?.addEventListener('keydown', onPassageKey, true)
})
onUnmounted(() => {
  rootEl.value?.removeEventListener('click', onPassageClick, true)
  rootEl.value?.removeEventListener('keydown', onPassageKey, true)
})

// The dark reached: the new room's picture is awaited, so the dark lifts only when it is ready (or the paper backdrop, none).
watch(
  () => passage.phase,
  (phase) => {
    if (phase !== 'dark') return
    const src = game.roomPicture
    if (!src) return passage.pictureReady()
    const picture = new Image()
    picture.onload = picture.onerror = (): void => passage.pictureReady()
    picture.src = src
  },
)

// Once the screen is fully up, focus lands where it does today (nothing takes it during the fade).
watch(
  () => passage.phase,
  (phase, was) => {
    if (phase !== 'idle' || was === 'idle' || game.showTitle) return
    void nextTick(() => (game.showModal ? focusPopUp() : focusActions()))
  },
)
const titlePage = ref<InstanceType<typeof TitlePage> | null>(null)
/** The Load game window is open over the title page. */
const titleLoad = ref(false)
/** The saves the title page offers (quick save, slots, named saves), read each time it opens. */
const titleSaves = ref<SaveSlot[]>([])
watch(
  () => game.showTitle,
  (shown) => {
    titleLoad.value = false
    if (!shown) return
    try {
      const quick = game.getQuickSave()
      const slots = [...game.getSaveSlots(), ...game.getNamedSaves()]
      titleSaves.value = quick ? [quick, ...slots] : slots
    } catch {
      // Saves that cannot be read count as none: the title page offers Start.
      titleSaves.value = []
    }
  },
  { immediate: true, flush: 'sync' },
)

/** Continue: load the newest save that can be loaded, a named one by its name. */
function continueFromTitle(): void {
  const newest = newestLoadable(titleSaves.value)
  if (newest?.name !== undefined) game.loadFromTitle(newest.slot, newest.name)
  else if (newest) game.loadFromTitle(newest.slot)
}

/** Open the Load game window over the title page, with no old failure showing. */
function openTitleLoad(): void {
  game.titleLoadError = ''
  titleLoad.value = true
}

/** The Load game window closed: back to the title page, focus on Load game. */
async function closeTitleLoad(): Promise<void> {
  titleLoad.value = false
  await nextTick()
  titlePage.value?.focusLoad()
}
const chapterDialog = ref<HTMLElement | null>(null)
const chapterTrap = useFocusTrap(chapterDialog)

/**
 * A chapter page keeps Tab inside (also after a click on its text, which
 * focuses the page itself). Escape does nothing here: only its button goes on.
 */
function onChapterKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') event.stopPropagation()
  else chapterTrap.onKeydown(event)
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
  if (game.showTitle || passage.phase !== 'idle') return
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
  <div ref="rootEl" class="lq-root">
    <HoldRing v-if="holdRing" :spot="holdRing" :still="motionReduced()" />
    <!-- The game, out of reach (and untouched) while a phone is held upright. -->
    <div class="lq-game" :inert="turnPage || undefined">
      <!-- The game has ended: nothing but the end screen. -->
      <EndScreen
        v-if="game.ending"
        :text="game.ending.text"
        :saved="game.ending.saved"
      />
      <template v-else>
        <!-- A short window with no picture: the section tabs on top, under the menu button. -->
        <SectionNav v-if="textPage" v-model="section" class="lq-nav-top" />
        <button
          v-if="!wide"
          type="button"
          class="lq-float-menu"
          data-lq-obstacle="keep-clear"
          title="Menu"
          aria-label="Menu"
          @click="openGameDialog('menu')"
        >
          ☰
        </button>

        <main
          ref="mainEl"
          class="lq-main"
          :class="{
            'lq-wide': wide,
            'lq-staged': staged,
            'lq-phone': phoneStage,
            'lq-sideways': sideways,
            'lq-titled': roomTitle.name !== null,
          }"
          :style="{
            ...(phoneStage ? { '--lq-plate-h': `${plateHeight}px` } : {}),
            '--lq-belt-h': `${beltHeight}px`,
            '--lq-actions-h': `${boxRoom}px`,
          }"
          @click.capture="onPanelPress"
        >
          <div
            v-if="staged"
            v-show="section === 'story'"
            ref="stageEl"
            class="lq-stage"
            :style="{
              '--lq-stage-buttons-w': `${stageButtonsWidth}px`,
              '--lq-belt-bottom': `${beltBottom}px`,
              '--lq-belt-left': `${beltLeft}px`,
              ...(belt.hand ? { cursor: 'crosshair' } : {}),
              ...(wayArrow ? { cursor: wayCursor(wayArrow) } : {}),
            }"
            @click="onPicturePress"
            @pointermove="onStagePointer"
            @pointerleave="onStageLeave"
          >
            <ArrivalOnPicture
              :pictured="pictured"
              :phone="phoneStage"
              :sideways="sideways"
              :away="arrivalFolded"
              :lift="beltHeight"
            />
            <RoomPlate
              v-if="wide"
              ref="widePlate"
              class="lq-stage-plate"
              data-lq-obstacle="panel"
              :compact="sideways"
              :bare="!pictured"
              :away="plateAway"
              data-panel
            />
            <StageButtons
              v-if="wide"
              :key="`buttons-${stageKey}`"
              ref="stageButtons"
              :compact="sideways"
              class="lq-stage-buttons"
              @menu="openGameDialog('menu')"
            />
            <!-- The typing box (F1) and the note about F1 stand at the foot of the picture, where the action bar used to be. -->
            <CommandBox
              v-if="typingOpen && staged"
              :key="`box-${game.gameNumber}`"
              ref="commandBoxEl"
              class="lq-stage-box"
              data-lq-obstacle="keep-clear"
              @input="clearShownArrival"
              @hide="hideBox"
            />
            <F1Note
              v-else-if="f1NoteShown && staged"
              class="lq-stage-note"
              @done="f1NoteShown = false"
            />
            <!-- After the plate and the buttons, so the things on the picture are Tab stops right after them; the picture itself lies beneath everything (z-index). -->
            <StagePicture
              :src="game.roomPicture"
              :patches="game.roomPatchUrls"
              :motion="game.roomMotion"
              :picture-size="game.roomPictureSize"
              @pictured="pictured = $event"
            >
              <AreaNames
                ref="areaNamesEl"
                :closed-ways="game.roomAreas.closedWays"
                :things="game.roomAreas.things"
                :boxes="game.roomAreas.boxes"
                :picture-size="game.roomPictureSize ?? DEFAULT_PICTURE_SIZE"
                :showing="namesUp"
                :pointer="scene.phase === 'idle' ? names.pointer : null"
                :foot-cover="footCover"
                :ring-open="ring !== null"
                :relayout="namesRelayout"
                @pointing="pointingWay = $event"
                @press="onAreaPress"
              />
              <AreaPress
                :things="game.roomAreas.things"
                :boxes="game.roomAreas.boxes"
                :picture-size="game.roomPictureSize ?? DEFAULT_PICTURE_SIZE"
                @press="onAreaPress"
              />
            </StagePicture>
            <BeltOfPictures
              ref="beltEl"
              :key="`belt-${stageKey}`"
              :compact="sideways"
              :caption-for="
                ring?.from === 'belt' ? ring.thing.areaId.slice(5) : null
              "
              @press="onBeltPress"
              @measure="beltMeasured = $event"
              @caption="beltCaption = $event"
            />
            <HandStrip
              v-if="belt.hand"
              :hand="belt.hand"
              :ghost="laptop"
              class="lq-hand-strip"
              @cancel="cancelHand"
            />
          </div>
          <!-- The drawers lie beside the stage, not in it: the stage keeps its layers to itself, so a drawer inside it lay under the belt and under everything drawn over the stage (the words, Hide and Show, the bar, the room's title). -->
          <JournalDrawer
            v-if="staged && drawerTab === 'quests'"
            :key="`drawer-${stageKey}`"
            @close="closeDrawer"
          />
          <StoryDrawer
            v-else-if="staged && drawerTab === 'story'"
            :key="`story-${stageKey}`"
            :phone="phoneStage"
            @click="onNameClick"
            @keydown="onNameKeydown"
            @close="closeDrawer"
          />
          <!-- The caption of the picture pointed at: over the words, above the belt and the Hide or Show button. -->
          <div
            v-if="beltCaption"
            class="lq-belt-caption"
            :style="captionStyle()"
          >
            <b :class="`lq-belt-cap-${beltCaption.kind}`">{{
              beltCaption.label
            }}</b>
            <!-- eslint-disable vue/no-v-html -->
            <span v-html="renderMarkup(beltCaption.note)"></span>
            <!-- eslint-enable vue/no-v-html -->
          </div>
          <!-- Over the words and the bars, drawn only in the part of the picture they leave. -->
          <div
            v-if="ring"
            class="lq-ring-layer"
            :style="{
              left: `${ring.layer.left}px`,
              top: `${ring.layer.top}px`,
              width: `${ring.layer.width}px`,
              height: `${ring.layer.height}px`,
            }"
          >
            <PressRing
              :key="ring.thing.areaId"
              :thing="ring.thing"
              :actions="ringItems"
              :at="ring.at"
              :bounds="ring.bounds"
              @pick="runRing"
              @hand="takeInHand"
              @close="closeRing"
            />
          </div>
          <!-- Over the picture, and over the words beside it (the stage isolates its own layers). -->
          <SceneInterlude
            v-if="staged"
            v-show="section === 'story'"
            :phone="phoneStage"
          />
          <RoomTitle
            v-if="staged"
            v-show="section === 'story'"
            :bare="!pictured"
            :small="!laptop"
          />
          <RoomPlate
            v-if="textPage"
            v-show="section === 'story'"
            class="lq-text-plate"
            data-panel
            bare
          />
          <RoomPlate
            v-if="phoneStage"
            v-show="section === 'story'"
            ref="plate"
            class="lq-phone-plate"
            data-lq-obstacle="panel"
            data-panel
            story-button
            :bare="!pictured"
            :away="plateAway"
            @story="drawerTab = 'story'"
          />
          <StageSpeech
            v-if="twoSides"
            v-show="section === 'story'"
            class="lq-above-hide"
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
            }"
            :style="{
              ...(wide
                ? {
                    top: `${cardsTop}px`,
                    bottom: sideways
                      ? 'calc(var(--lq-hide-line) + 60px + var(--lq-belt-h))'
                      : `calc(${boxRoom}px + var(--lq-belt-h) + var(--lq-hide-line) + 12px)`,
                  }
                : {}),
              ...wordsCursor,
            }"
            :inert="paperAway || undefined"
            @click.capture="onWordsPress"
            @pointermove="onWordsPointer"
            @pointerleave="onStageLeave"
          >
            <section
              ref="storyEl"
              class="lq-story"
              data-lq-clip
              tabindex="-1"
              aria-label="Story"
              @click="onStoryClick"
              @keydown="onStoryKeydown"
              @scroll.passive="onStoryScroll"
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
              v-if="narration.hintVisible && hintText"
              class="lq-narration-hint"
              data-lq-obstacle="words"
              :class="{ 'lq-hint-raised': moreBelow && !storyHeld }"
            >
              {{ hintText }}
            </p>
            <button
              v-if="moreBelow && !storyHeld"
              ref="moreBelowButton"
              type="button"
              class="lq-more-below"
              data-lq-obstacle="words"
              @click="readOn"
            >
              More below <span aria-hidden="true">↓</span>
            </button>
          </div>
          <div
            v-if="staged"
            v-show="section === 'story'"
            class="lq-paper-tabrow"
          >
            <button
              v-if="showHide"
              ref="hideEl"
              type="button"
              class="lq-words-hide"
              data-lq-obstacle="panel"
              :title="laptop ? 'Hide the words (N)' : undefined"
              :aria-keyshortcuts="laptop ? 'N' : undefined"
              @click="hidePaper"
            >
              ▾ Hide
            </button>
            <button
              v-if="showTab"
              ref="tabEl"
              type="button"
              class="lq-paper-tab"
              data-lq-obstacle="panel"
              :title="laptop ? 'Show the words (N)' : undefined"
              :aria-keyshortcuts="laptop ? 'N' : undefined"
              @click="showPaper"
            >
              ▴ Show
            </button>
            <button
              v-if="showNamesButton"
              type="button"
              class="lq-show-names"
              data-lq-obstacle="panel"
              :class="{
                'lq-show-names-on': namesUp,
                'lq-show-names-typing': typingOpen,
              }"
              :aria-pressed="namesUp ? 'true' : 'false'"
              :title="laptop ? 'Show what\'s here (S)' : undefined"
              :aria-keyshortcuts="laptop ? 'S' : undefined"
              @click="toggleNames"
            >
              {{ namesUp ? '◎ Showing' : "◎ Show what's here" }}
            </button>
          </div>

          <!-- The typing box on a screen with no picture stage (the short mouse window's text page); on the stage it stands in the picture. Typing clears an arrival on the picture. -->
          <CommandBox
            v-if="typingOpen && !staged"
            :key="`box-${game.gameNumber}`"
            ref="commandBoxEl"
            class="lq-text-box"
            @input="clearShownArrival"
            @hide="hideBox"
          />
          <F1Note
            v-else-if="f1NoteShown && !staged"
            class="lq-text-note"
            @done="f1NoteShown = false"
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
          ref="titlePage"
          :saves="titleSaves"
          :error="game.titleLoadError"
          :motion="game.titleMotion"
          :zoom="game.titleZoom"
          :picture-size="game.titlePictureSize"
          @start="startGame"
          @continue="continueFromTitle"
          @load="openTitleLoad"
        />
        <!-- Load game from the title page: above it, and a pick loads at once. -->
        <div v-if="game.showTitle && titleLoad" class="lq-over-title">
          <SaveLoadDialog mode="load" from-title @close="closeTitleLoad" />
        </div>

        <!-- Dialogs the player opens (a game pop-up takes precedence). -->
        <template v-if="!game.showModal">
          <QuitDialog v-if="game.quitAsked" @cancel="cancelQuit" />
          <QuestDialog
            v-else-if="shownQuestView"
            :key="shownQuestView.name"
            :quest="shownQuestView"
            @close="game.shownQuest = null"
          />
          <GameMenu
            v-else-if="gameDialog === 'menu'"
            :focus="focusMenuEntry"
            @close="closeAllGameDialogs"
            @open="openFromMenu"
            @quit="askQuitFromMenu"
          />
          <BiggerMapDialog
            v-else-if="gameDialog === 'map'"
            @close="closeGameDialog"
            @done="closeAllGameDialogs"
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
            @done="closeAllGameDialogs"
          />
          <LanternDialog
            v-else-if="gameDialog === 'help'"
            :key="gameDialog"
            :title="INFO_TITLES[gameDialog]"
            :eyebrow="GAME_NAME"
            :key-line="HELP_KEYS"
            glass
            start-on-panel
            scroll-keys
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
    <!-- The dark the screen goes through into a started or loaded game. -->
    <div
      class="lq-passage"
      :class="`lq-passage-${passage.phase}`"
      aria-hidden="true"
    ></div>
    <!-- A phone held upright: the game waits behind this page. -->
    <TurnPage v-if="turnPage" />
  </div>
</template>

<style scoped>
/* The dark of a passage into a game: over the whole screen, down over the old one and lifting off the new. */
.lq-passage {
  position: fixed;
  inset: 0;
  z-index: var(--lq-z-page-passage);
  background: #000;
  opacity: 0;
  pointer-events: none;
}
.lq-passage-out {
  opacity: 1;
  transition: opacity calc(1.5s * var(--lq-motion)) linear;
}
.lq-passage-dark {
  opacity: 1;
}
.lq-passage-in {
  opacity: 0;
  transition: opacity calc(1.5s * var(--lq-motion)) linear;
}
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
.lq-game {
  display: contents;
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
   actions sit along its bottom. The stage keeps its layers to itself (its own
   stacking context, below), so it lies behind them all; the drawers lie
   beside it, over them. */
.lq-staged {
  position: relative;
  max-width: none;
  padding: 0;
  gap: 0;
}
.lq-stage {
  position: absolute;
  inset: 0;
  /* The picture is drawn last in the markup (for the Tab order) and lies beneath the rest. */
  isolation: isolate;
}
.lq-ring-layer {
  position: absolute;
  z-index: var(--lq-z-page-press-ring-layer);
  pointer-events: none;
}
.lq-belt-caption {
  position: absolute;
  z-index: var(--lq-z-page-belt-caption);
  transform: translateX(-50%);
  max-width: min(520px, 92%);
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--lq-line);
  background: var(--lq-surface);
  color: var(--lq-fg);
  font-size: 13px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.25);
  pointer-events: none;
}
.lq-belt-caption b {
  margin-right: 8px;
}
.lq-belt-cap-item {
  color: var(--lq-item);
}
.lq-belt-cap-spell {
  color: var(--lq-spell);
}
.lq-titled :deep(.lq-area-names) {
  opacity: 0.25;
}
.lq-stage-plate {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: var(--lq-z-stage-plate);
  max-width: min(360px, 40%);
}
.lq-stage-buttons {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: var(--lq-z-stage-buttons);
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
  z-index: var(--lq-z-page-words);
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
  z-index: var(--lq-z-page-phone-plate);
  flex: 0 0 auto;
  /* The right margin leaves the corner to the menu button, so "⟲ Journal" sits beside it. */
  margin: 8px 60px 0 8px;
}
/* What is left beside "⟲ Journal" is narrow, so a long room name wraps rather than being cut off. */
.lq-phone-plate :deep(.lq-room-name) {
  white-space: normal;
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
  margin-bottom: calc(
    var(--lq-hide-line) + var(--lq-belt-h, 0px) + var(--lq-actions-h, 0px)
  );
}
/* The belt stands at the foot of the picture, and the words and the buttons over them rise above it. */
.lq-staged .lq-paper-tabrow {
  transform: translateY(
    calc(-1 * (var(--lq-belt-h, 0px) + var(--lq-actions-h, 0px)))
  );
}
.lq-phone .lq-story-wrap.lq-cards.lq-one-column {
  margin-bottom: calc(
    var(--lq-hide-line) + var(--lq-belt-h, 0px) + var(--lq-actions-h, 0px)
  );
}
/* The strip saying what the next press does: under the top row, in the middle of the picture. */
.lq-stage .lq-hand-strip {
  top: 76px;
}
.lq-sideways .lq-stage .lq-hand-strip {
  top: 56px;
}
.lq-phone .lq-stage .lq-hand-strip {
  top: calc(var(--lq-plate-h, 108px) + 16px);
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
/* The show button: the same line as Hide, in the foot-right corner on every screen. */
.lq-show-names {
  position: absolute;
  right: 8px;
  bottom: 6px;
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
/* At phone width the typing box's word list spans the whole box and would run under the pill, so the pill steps aside while the box is open (rq-ttg0). */
@media (max-width: 639px) {
  .lq-show-names-typing {
    visibility: hidden;
  }
}
.lq-show-names:hover {
  color: var(--lq-fg);
}
.lq-show-names-on {
  border-color: var(--lq-accent-line);
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
}
.lq-show-names:focus-visible {
  outline: 2px solid var(--lq-accent);
  outline-offset: 2px;
}
.lq-words-hide:hover {
  color: var(--lq-fg);
}
.lq-words-hide:focus-visible,
.lq-paper-tab:focus-visible {
  outline: 2px solid var(--lq-accent);
  outline-offset: 2px;
}
/* The menu button where the stage has no row of buttons (a tall stage, the text page): in the corner, over the page. */
.lq-float-menu {
  position: fixed;
  top: 8px;
  right: 8px;
  z-index: var(--lq-z-page-float-menu);
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid var(--lq-line2);
  background: color-mix(in srgb, var(--lq-surface) 93%, transparent);
  color: var(--lq-fg);
  font: inherit;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.2);
}
/* The tabs of the text page leave the corner to the menu button. */
.lq-nav-top {
  padding-right: 60px;
}
.lq-sideways .lq-stage-plate {
  top: 8px;
  left: 8px;
  /* Ends 8px before the buttons, however wide their counts and dots make them. */
  max-width: min(
    360px,
    38%,
    calc(100% - 8px - var(--lq-stage-buttons-w) - 16px)
  );
}
.lq-sideways .lq-stage-buttons {
  top: 8px;
  right: 8px;
  max-width: 60%;
}
.lq-sideways.lq-staged .lq-story-wrap.lq-cards.lq-one-column {
  left: 8px;
  width: min(46%, 420px);
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
  z-index: var(--lq-z-page-paper-tab-row);
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
.lq-stage-box,
.lq-stage-note {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
}
.lq-stage-box {
  z-index: var(--lq-z-stage-command-box);
  width: 60%;
}
.lq-stage-note {
  z-index: var(--lq-z-stage-f1-note);
}
.lq-text-note {
  align-self: center;
  margin: 8px;
}
.lq-text-box {
  flex: 0 0 auto;
  margin: 8px;
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
/* The Load game window opened from the title page sits above it. */
.lq-over-title :deep(.lq-dialog-layer) {
  z-index: var(--lq-z-page-title-load);
}
.lq-chapter-dialog {
  position: fixed;
  inset: 0;
  z-index: var(--lq-z-page-chapter);
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
