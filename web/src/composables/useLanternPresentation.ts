import { onUnmounted, watch } from 'vue'
import { useGameStore, type Turn } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useArrivalStore } from '@/stores/useArrivalStore'
import { useSceneStore } from '@/stores/useSceneStore'
import { useStageSpeechStore } from '@/stores/useStageSpeechStore'
import {
  POPUP_NARRATION_ID,
  chapterUnits,
  ownWordsClip,
  readsArrival,
  turnUnits,
} from '@/lantern/narrationUnits'
import { actFolder } from '@/lantern/narrationManifest'
import {
  arrivalParts,
  arrivesOnPicture,
  newsOnPicture,
  newsParts,
  readingTimeMs,
  sceneBlock,
} from '@/lantern/stageArrival'
import { parseTurn } from '@/lantern/parseTurn'
import { usePanelHold } from './usePanelHold'

/** What the layout tells the coordinator about the stage it renders. */
export interface PresentationStage {
  /** The room is played on its picture (the laptop stage or the phone's). */
  staged: () => boolean
  /** The game's "less motion" setting (or the system's) is on: no change of scene. */
  motionReduced: () => boolean
}

/** The operations the layout's controls call; the coordinator keeps their order. */
export interface LanternPresentation {
  /** Bring a change of scene (running, or a talk's still to come) up at once: a press in a held panel. */
  bringSceneUp(): void
  /** Show the rest of a held turn at once (a press in a held panel); true when something was held. */
  catchUpPanels(): boolean
  /** Leave the chapter page: its voice stops first, then the game goes on (its button, Escape). */
  continueChapter(): void
}

/**
 * Coordinates when the Lantern's presentations start and what stops them, so
 * the layout does not have to know the order. Call it once, during the
 * layout's setup: it watches the game and keeps watching until the layout
 * goes. Where its watchers share a trigger with each other or with the
 * layout's, they run in the order declared: these in the order here, after
 * the layout's declared before the call and before those after it. The
 * layout calls it where its new-turn watcher stood, so the story's new turn
 * is cut in on after the layout's own drawer watcher and before its item
 * flights and quest chimes.
 *
 * The story policy: a new turn first brings up the change of scene of the
 * turn before and cuts in on everything still told of it (speech, arrival,
 * narration), then begins its own narration, and tells its conversation,
 * arrival and news at once or, when it moves to another picture, once that
 * picture is up. A narrated talk that moves Elior changes scene where the
 * narrator stops for it, unnarrated once the lines before it are read; a
 * change that completes after a newer turn has come starts nothing. The
 * panels follow the voice (`usePanelHold`), the room's name changes at the
 * dark, and the voice stops when narration is switched off or the layout
 * goes.
 *
 * The chapter page (pop-up) policy: the running act's recordings load in good
 * time; a pop-up or a new game stops the story's voice and closing the pop-up
 * never resumes it; a chapter page is read once its act's recordings are in,
 * if it is still the page shown (one page replaced or closed while they
 * loaded reads nothing of the old one), and never under the title page;
 * leaving a page stops its voice before the game goes on. The act-complete
 * page waits while the act's last turn is read aloud.
 *
 * The stores keep their own state and timers; this only says when to use them.
 */
export function useLanternPresentation(
  stage: PresentationStage,
): LanternPresentation {
  const game = useGameStore()
  const settings = useSettingsStore()
  const narration = useNarrationStore()
  const arrival = useArrivalStore()
  const scene = useSceneStore()
  const speech = useStageSpeechStore()
  const panelHold = usePanelHold()

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
      // The change of scene of the move before is brought up first (its words are
      // told, then cut in on below); a talk still to change scene lets go of its words.
      // What the picture shows is noted first: the lines cut off below stay (`observe`).
      speech.noteSeen()
      speech.changeSceneNow()
      scene.skip()
      arrival.clear()
      narration.skipAll()
      const turn = game.turns.at(-1)
      const folder = game.narrationFolder
      const manifest = folder ? narration.manifestFor(folder) : null
      const onPicture =
        !!turn && stage.staged() && !game.showModal && arrivesOnPicture(turn)
      // News (a learned spell, then quest news) is told in the middle too, after
      // the turn's words (and its arrival). The learned lines leave the card
      // first: the narration and the story read the turn's text after this.
      // A turn a load brought back was told when it was played.
      const news =
        !!turn &&
        !turn.restored &&
        stage.staged() &&
        !game.showModal &&
        newsOnPicture(turn)
      const spells = news && !!turn?.spells?.length
      if (turn && spells) game.tellSpellsInMiddle(turn.id)
      // The units the narration plays; the arrival on the picture waits to read
      // its description while events that nobody speaks are read, and a quest
      // piece nobody speaks is read before the next one.
      const unitOptions = { readSilentNews: news, spellNews: spells }
      let units =
        turn?.narrate && (manifest || onPicture)
          ? turnUnits(turn, readsArrival(turn), manifest ?? {}, unitOptions)
          : []
      const parts = turn && onPicture ? arrivalParts(turn, units) : []
      const events = parts[0]?.kind === 'events' && !parts[0].voiced
      if (turn?.narrate && events)
        units = turnUnits(turn, readsArrival(turn), manifest ?? {}, {
          ...unitOptions,
          arrivalPauseMs: readingTimeMs(
            parts[0].lines.map((line) => line.markup).join(' '),
          ),
        })
      if (turn && news) parts.push(...newsParts(turn, units))
      // A move to a room with another picture is a change of scene: the words
      // and the narrator wait until the new picture is fully up.
      const changing =
        !!turn &&
        stage.staged() &&
        !game.showModal &&
        !stage.motionReduced() &&
        scene.shown !== null &&
        game.roomPicture !== scene.shown
      // A talk that moves Elior keeps the old picture and changes scene partway.
      const sceneAt =
        !!turn &&
        !turn.restored &&
        !changing &&
        stage.staged() &&
        !game.showModal &&
        scene.shown !== null
          ? sceneBlock(turn, parseTurn(turn.text))
          : -1
      if (turn?.narrate && folder && manifest && !game.showModal)
        narration.begin(
          turn.id,
          units,
          folder,
          changing,
          sceneAt,
          ownWordsClip(turn, manifest),
        )
      if (turn && changing) scene.begin(turn.id, game.roomPicture, tellTurn)
      else tellTurn()
      /** The conversation, the arrival and the narrator of the turn: now, or once its picture is up. */
      function tellTurn(): void {
        if (!turn) return
        // The room's name goes with the picture (at the dark, or here when skipped
        // or with no fade); a talk's goes where its scene changes (`changeScene`).
        if (
          changing ||
          (stage.staged() &&
            !game.showModal &&
            stage.motionReduced() &&
            sceneAt < 0)
        )
          game.releasePanels(turn.id, ['place'], true)
        if (changing) narration.start(turn.id)
        // The conversation on the picture (laptop only) follows the turn; it reads
        // the narration just begun, so it comes after it and before the news
        // that waits for it.
        const unnarratedScene =
          sceneAt >= 0 && !narration.narrates(turn.id)
            ? { unit: sceneAt, reached: () => changeScene(turn, sceneAt) }
            : null
        if (stage.staged()) speech.observe(turn, unnarratedScene)
        if (parts.length)
          arrival.show(turn.id, parts, narration.narrates(turn.id))
        // Its panels wait for the voice, or, with none to wait for, change now.
        if (narration.narrates(turn.id)) panelHold.track(turn)
        else if (!unnarratedScene) panelHold.settle(turn)
      }
    },
  )

  /** The latest talk that moves Elior and where its room changes, until it has. */
  let talkCut: { turn: number; at: number } | null = null
  watch(
    () => game.turns.at(-1),
    (turn) => {
      const at = turn ? sceneBlock(turn, parseTurn(turn.text)) : -1
      talkCut = turn && at >= 0 ? { turn: turn.id, at } : null
    },
    { flush: 'sync' },
  )
  // The music moves with the room: when the talk's does (its scene changes, it is
  // skipped, a newer command cuts in), what it told in the old room leaves the screen.
  watch(
    () => game.musicRoomKey,
    () => {
      if (!talkCut) return
      scene.cut(talkCut.turn, talkCut.at)
      talkCut = null
    },
    { flush: 'sync' },
  )

  // A narrated talk that moves Elior changes scene where the narrator stops for it.
  watch(
    () => {
      const turn = game.turns.at(-1)
      return turn && narration.atSceneChange(turn.id) ? turn : null
    },
    (turn) => {
      if (turn) changeScene(turn, sceneBlock(turn, parseTurn(turn.text)))
    },
  )

  /**
   * The scene of talk `turn` changes now, before its block `at`: what it told
   * in the old room leaves the screen, the music and the picture move to the
   * new room through the dark, and the rest of the talk waits until the
   * picture is up. Under Reduce motion, or with the same picture,
   * they (and the room's name) move at once with no fade. Nothing happens once a
   * newer turn has come.
   */
  function changeScene(turn: Turn, at: number): void {
    if (game.turns.at(-1)?.id !== turn.id) return
    game.releaseMusic(turn.id)
    const narrated = narration.narrates(turn.id)
    const up = (): void => {
      // A newer turn brings this one up only to cut in on it: no voice starts.
      if (game.turns.at(-1)?.id !== turn.id) return
      if (narrated) narration.passSceneChange(turn.id)
      else panelHold.settle(turn)
    }
    if (game.roomPicture !== scene.shown && !stage.motionReduced())
      scene.begin(turn.id, game.roomPicture, up, at)
    else {
      game.releasePanels(turn.id, ['place'], true)
      up()
    }
  }

  // The room's name (the place panels) changes at the darkest moment of a change of scene.
  watch(
    () => scene.darkTurn,
    (id) => {
      if (id !== null) game.releasePanels(id, ['place'], true)
    },
  )

  // The panels of a narrated command are held for this layout; leaving lets go.
  game.setPanelHold(true)
  // The voice stops when the layout goes (before the panels are let go).
  onUnmounted(() => narration.skipAll())
  onUnmounted(() => game.setPanelHold(false))

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

  // A pop-up, or a new game, stops the voice (a pop-up's own narration follows).
  watch(
    () => [game.showModal, game.gameNumber] as const,
    ([open]) => {
      if (open || narration.isNarrating) narration.skipAll()
    },
  )

  // A new game counts its narrated turns (for the hint) from the start.
  watch(() => game.gameNumber, narration.resetGame)
  // A new game forgets which turns told their news in the middle.
  watch(() => game.gameNumber, arrival.reset)

  // Switching narration off in Settings ends the turn being spoken.
  watch(
    () => settings.narrationOn,
    (on) => {
      if (!on) {
        narration.skipAll()
        arrival.clear()
      }
    },
  )

  // A chapter page is read aloud when its act has recordings; one page
  // following another cuts in on it, and closing the last one stops the voice;
  // a page under the title page is read once that is gone. Declared after the
  // watch above so the old voice is cut first, and before the render so
  // nothing flashes unspoken.
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
      narration.begin(
        POPUP_NARRATION_ID,
        chapterUnits(chapter, manifest),
        folder,
      )
    },
  )

  /** A change of scene running, or a talk's still to come, is brought up now. */
  function bringSceneUp(): void {
    speech.changeSceneNow()
    scene.skip()
  }

  /** Leave a chapter page: its voice stops, then the game goes on. */
  function continueChapter(): void {
    narration.skipAll()
    game.continueChapter()
  }

  return { bringSceneUp, catchUpPanels: panelHold.catchUp, continueChapter }
}
