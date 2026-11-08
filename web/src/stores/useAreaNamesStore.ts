import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useGameStore } from './useGameStore'
import { useSettingsStore } from './useSettingsStore'

/**
 * Whether the marks and names of what is in the room's picture are showing,
 * and where the pointer is over the picture (for the one name that follows
 * it). Showing is for the room Elior stands in: walking to another room, a
 * load or a new act starts it afresh, off unless the Always setting is on;
 * turning that setting on puts the names up at once. Nothing here is saved:
 * only the Always setting is, with the other Settings.
 */
export const useAreaNamesStore = defineStore('areaNames', () => {
  const game = useGameStore()
  const settings = useSettingsStore()

  /** Whether the marks and names are showing in this room. */
  const showing = ref(settings.alwaysShowNames)
  /** The pointer over the picture, in the stage's pixels; null when it is not over it. */
  const pointer = ref<{ x: number; y: number } | null>(null)

  /** Show them, or take them away, for this room. */
  function toggle(): void {
    showing.value = !showing.value
  }

  /** Take them away for this room. */
  function turnOff(): void {
    showing.value = false
  }

  // Each room arrives as a clean painting (with the Always setting, a named one).
  watch(
    () => [game.gameNumber, game.roomName] as const,
    () => {
      showing.value = settings.alwaysShowNames
      pointer.value = null
    },
  )
  watch(
    () => settings.alwaysShowNames,
    (always) => {
      showing.value = always
    },
  )

  return { showing, pointer, toggle, turnOff }
})
