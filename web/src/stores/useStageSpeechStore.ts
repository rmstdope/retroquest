import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Turn } from './useGameStore'
import { useNarrationStore } from './useNarrationStore'
import { parseTurn } from '@/lantern/parseTurn'
import {
  eliorLine,
  readingPauseMs,
  speechLines,
  type SpeechLine,
} from '@/lantern/stageSpeech'

/**
 * The conversation shown on the room's picture (never saved). A command that
 * addresses a character starts or continues a conversation with them; any
 * other turn clears it, and so does addressing someone else (which starts a
 * fresh one). The lines of each turn are the quotes of its answer
 * (`speechLines`), shown as the narrator reaches them when the turn is
 * narrated, and otherwise one at a time by a reading pause (`readingPauseMs`);
 * `revealAll` shows the rest of the turn at once.
 */

/** One line of the conversation, with where it came from and whether it is shown. */
export interface StageLine extends SpeechLine {
  /** The turn it was said in. */
  turnId: number
  /** Unique within the session, for rendering. */
  key: number
  /** Whether the turn is narrated, so the narrator decides when the line shows. */
  narrated: boolean
  /** For an unnarrated turn: whether its reading pause has passed. */
  shown: boolean
}

/** The conversation on the picture. */
export const useStageSpeechStore = defineStore('stageSpeech', () => {
  const narration = useNarrationStore()
  const conversation = ref<{ with: string; lines: StageLine[] } | null>(null)
  let nextKey = 1
  /** The room the last observed turn ended in. */
  let lastRoom: string | null = null
  let timer: ReturnType<typeof setTimeout> | undefined

  /** Whether a line is on the picture now. */
  function isShown(line: StageLine): boolean {
    return line.narrated
      ? narration.revealed(line.turnId, line.unit)
      : line.shown
  }

  /** The lines on the picture now, in the order they were said. */
  const visible = computed(
    () => conversation.value?.lines.filter(isShown) ?? [],
  )

  /** The last character on the right to have spoken, or null. */
  const rightSpeaker = computed(
    () =>
      [...visible.value].reverse().find((line) => line.side === 'right')
        ?.speaker ?? null,
  )

  /** Whether Elior has a line yet (the left portrait stands from then on). */
  const leftSpeaking = computed(() =>
    visible.value.some((line) => line.side === 'left'),
  )

  /** Whether a line is the one being read aloud now. */
  function isSpeaking(line: StageLine): boolean {
    return line.narrated && narration.speaking(line.turnId)?.unit === line.unit
  }

  /** Release the next line of an unnarrated turn after the reading pause of the one before it. */
  function release(previous: StageLine | null): void {
    clearTimeout(timer)
    const next = conversation.value?.lines.find(
      (line) => !line.narrated && !line.shown,
    )
    if (!next) return
    const wait = previous ? readingPauseMs(previous.markup) : 0
    const show = (): void => {
      next.shown = true
      release(next)
    }
    if (wait === 0) show()
    else timer = setTimeout(show, wait)
  }

  /** Show the rest of the turn's lines at once. */
  function revealAll(): void {
    clearTimeout(timer)
    for (const line of conversation.value?.lines ?? []) line.shown = true
  }

  /** Clear the picture; the story keeps everything said. */
  function clear(): void {
    clearTimeout(timer)
    conversation.value = null
  }

  /**
   * Take a new turn in: the previous turn's lines show in full first. A turn
   * that addresses no one, or ends in another room, clears the conversation; one that addresses someone
   * else starts a new one; one that addresses the same character adds to it.
   */
  function observe(turn: Turn): void {
    revealAll()
    const moved = lastRoom !== null && lastRoom !== turn.room
    lastRoom = turn.room
    const addressed = turn.addressed ?? null
    // Leaving the room ends the conversation, even when the talk itself moved Elior.
    if (!addressed || moved) return clear()
    if (conversation.value?.with.toLowerCase() !== addressed.toLowerCase()) {
      clear()
      conversation.value = { with: addressed, lines: [] }
    }
    const narrated = narration.narrates(turn.id)
    // Elior's own words come first and need no narrator or pause.
    const own = eliorLine(turn.command)
    const lines = [
      ...(own ? [{ ...own, narrated: false, shown: true }] : []),
      ...speechLines(parseTurn(turn.text)).map((line) => ({
        ...line,
        narrated,
        shown: false,
      })),
    ].map((line) => ({ ...line, turnId: turn.id, key: nextKey++ }))
    conversation.value?.lines.push(...lines)
    release(
      conversation.value?.lines.find(
        (line) => line.shown && line.turnId === turn.id,
      ) ?? null,
    )
  }

  return {
    conversation,
    visible,
    rightSpeaker,
    leftSpeaking,
    isSpeaking,
    revealAll,
    clear,
    observe,
  }
})
