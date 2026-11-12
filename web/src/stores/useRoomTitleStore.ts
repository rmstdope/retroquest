import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { arrivesOnPicture, newsOnPicture } from '@/lantern/stageArrival'
import { useGameStore } from './useGameStore'
import { useSceneStore } from './useSceneStore'

/** How long the room's title stays over the picture before it settles into the corner (ms): about 0.6 s to fade in, then 3 s. */
export const ROOM_TITLE_MS = 3600

/**
 * The room's title over the middle of the picture: the player walks into a
 * room, or a game is loaded, and the room's name is told there ("You are in")
 * before it settles as the small name in the corner (`RoomPlate`). A room is
 * greeted once per arrival, when the stage shows (`staged`), no chapter page
 * covers it and its picture is up (after a change of scene). A first visit is
 * not greeted here: its arrival is told on the picture with the name as its
 * heading. Nor is a turn whose news (a learned spell, quest news) is told in
 * the middle of the picture: the title would show through the news card, so
 * the name goes straight to the corner. The name switches as the narrator reaches the room (the game
 * store's held `roomName`), so the title follows the voice; walking on before
 * a change of scene is up greets only the room the player ends in. Nothing is saved.
 */
export const useRoomTitleStore = defineStore('roomTitle', () => {
  const game = useGameStore()
  const scene = useSceneStore()

  /** The name the title shows while it is up; null when settled. */
  const name = ref<string | null>(null)
  /** Whether the room is played on its picture (the layout says): no title on the text page. */
  const staged = ref(false)
  /** The room changed (or a game was started or loaded) and has not been greeted or let pass yet. */
  let pending = false
  let timer: ReturnType<typeof setTimeout> | undefined

  /** Put the title up for `room`, settling after `ROOM_TITLE_MS`. */
  function greet(room: string): void {
    clearTimeout(timer)
    name.value = room
    timer = setTimeout(settle, ROOM_TITLE_MS)
  }

  /** Settle the title into the corner now. */
  function settle(): void {
    clearTimeout(timer)
    timer = undefined
    name.value = null
  }

  /**
   * The picture that was up when the stage last started afresh, while it may
   * still be the one settled: the stage settles it again at once, before the
   * new room's picture has begun to load. Null once another has settled, and
   * never the backdrop ('').
   */
  let stale: string | null = null

  /** The stage starts afresh (a new game, a load, a new act): settle, and greet the room once its own picture is up. */
  function reset(): void {
    settle()
    pending = true
    // The paper backdrop is never stale: it is what a room without a painted
    // picture settles on again, and it shows no other room.
    stale = scene.shown || null
  }

  /** Whether a greeting can be shown now: a room, no chapter page, and its picture up after any change of scene. */
  function ready(): boolean {
    if (stale !== null && scene.shown !== null && scene.shown !== stale)
      stale = null
    // The old picture settled again after a load into a room with another one.
    if (stale !== null && scene.shown === stale && game.roomPicture !== stale)
      return false
    return (
      game.roomName !== '' &&
      !game.showModal &&
      scene.phase === 'idle' &&
      scene.shown !== null
    )
  }

  /**
   * Greet the room waiting for it, or let it pass: on the text page, on a
   * first visit, whose arrival is headed by the name, or on a turn that tells
   * news in the middle (a played turn: a load's turns tell none again).
   */
  function consider(): void {
    if (!pending || !ready()) return
    pending = false
    const latest = game.turns.at(-1)
    const middleTaken =
      !!latest &&
      (arrivesOnPicture(latest) || (!!latest.narrate && newsOnPicture(latest)))
    if (!staged.value || middleTaken) settle()
    else greet(game.roomName)
  }

  watch(
    () => [game.gameNumber, game.loadNumber, game.roomName] as const,
    () => {
      pending = true
      consider()
    },
    { immediate: true },
  )
  watch(
    () =>
      [
        game.showModal,
        scene.phase,
        scene.shown,
        game.roomPicture,
        staged.value,
      ] as const,
    consider,
  )

  return { name, staged, greet, settle, reset }
})
