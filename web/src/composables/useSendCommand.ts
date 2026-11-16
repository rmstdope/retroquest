import { computed, type ComputedRef } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import { useArrivalStore } from '@/stores/useArrivalStore'

/**
 * How a button on the stage (Hint, and the room name's Look, Search and Rest)
 * sends one of the game's existing commands. The button is dimmed
 * (`aria-disabled`, so it keeps focus) while the game takes no command or a
 * turn is being read aloud; an arrival on the picture does not dim it, and a
 * press cuts the arrival short before the command goes.
 */
export function useSendCommand(): {
  busy: ComputedRef<boolean>
  send: (command: string) => void
} {
  const game = useGameStore()
  const narration = useNarrationStore()
  const arrival = useArrivalStore()

  const busy = computed<boolean>(
    () => !game.acceptInput || (narration.isNarrating && !arrival.active),
  )

  /** Send `command` unless busy, ending an arrival that is up (and its voice) first. */
  function send(command: string): void {
    if (busy.value) return
    if (arrival.active) arrival.clear()
    game.submitCommand(command)
  }

  return { busy, send }
}
