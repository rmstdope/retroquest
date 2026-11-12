import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { arrivesOnPicture } from '@/lantern/stageArrival'
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
 * heading. The name switches as the narrator reaches the room (the game
 * store's held `roomName`), so the title follows the voice. Nothing is saved.
 */
export const useRoomTitleStore = defineStore('roomTitle', () => {
  const game = useGameStore()
  const scene = useSceneStore()

  /** The name the title shows while it is up; null when settled. */
  const name = ref<string | null>(null)
  /** Whether the room is played on its picture (the layout says): no title on the text page. */
  const staged = ref(false)
  /** The arrival last greeted (or let pass): the game, the load and the room. */
  let greeted = ''
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

  watch(
    () =>
      [
        `${game.gameNumber}-${game.loadNumber}-${game.roomName}`,
        game.roomName !== '' &&
          !game.showModal &&
          scene.phase === 'idle' &&
          scene.shown !== null,
        staged.value,
      ] as const,
    ([key, ready, onStage]) => {
      if (!ready || key === greeted) return
      greeted = key
      const latest = game.turns.at(-1)
      if (!onStage || (latest && arrivesOnPicture(latest))) settle()
      else greet(game.roomName)
    },
    { immediate: true },
  )

  return { name, staged, greet, settle }
})
