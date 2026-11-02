import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Turn } from './useGameStore'
import { useNarrationStore } from './useNarrationStore'
import { parseTurn } from '@/lantern/parseTurn'
import {
  ELIOR,
  eliorLine,
  readingPauseMs,
  speechLines,
  toldAsSpeech,
  type SpeechLine,
} from '@/lantern/stageSpeech'

/**
 * The conversation shown on the room's picture (never saved). A command that
 * addresses a character starts or continues a conversation with them, and
 * addressing someone else starts a fresh one. A turn that moves Elior to
 * another room clears it. Any other turn clears it too, and shows only Elior's
 * own words (such as his journal) when it has any. The lines of each turn are the quotes of its answer
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
  let timer: ReturnType<typeof setTimeout> | undefined

  /** Whether a line is on the picture now. */
  function isShown(line: StageLine): boolean {
    if (!line.narrated) return line.shown
    if (!narration.revealed(line.turnId, line.unit)) return false
    // A quote is one recording: its later paragraphs wait for the narrator's word.
    const now = narration.speaking(line.turnId)
    if (!now || now.unit !== line.unit || !now.aligned) return true
    return line.firstWord === 0 || now.offset + now.word >= line.firstWord
  }

  /** The lines on the picture now, in the order they were said. */
  const visible = computed(
    () => conversation.value?.lines.filter(isShown) ?? [],
  )

  /**
   * Whether everything said in turn `turnId` is on the picture (also when it
   * said nothing there): what quest news told after the words waits for.
   */
  function told(turnId: number): boolean {
    return (
      conversation.value?.lines
        .filter((line) => line.turnId === turnId)
        .every(isShown) ?? true
    )
  }

  /** Whether a line is the one being read aloud now. */
  function isSpeaking(line: StageLine): boolean {
    const now = narration.speaking(line.turnId)
    if (!line.narrated || now?.unit !== line.unit) return false
    // Without matching word timings the paragraph read is unknown: ring the quote.
    if (!now.aligned) return true
    // The newest paragraph shown of the quote being read is the one being read.
    const later = conversation.value?.lines.some(
      (other) =>
        other.turnId === line.turnId &&
        other.unit === line.unit &&
        other.firstWord > line.firstWord &&
        isShown(other),
    )
    return !later
  }

  /** The conversation's line a turn's unit and paragraph made, if the conversation still holds it. */
  function lineAt(
    turnId: number,
    unit: number,
    firstWord: number,
  ): StageLine | undefined {
    return conversation.value?.lines.find(
      (line) =>
        line.turnId === turnId &&
        line.unit === unit &&
        line.firstWord === firstWord,
    )
  }

  /**
   * Whether the line a turn made (by unit and first word) is on the page now.
   * A line the conversation no longer holds (an older turn, or one it was
   * cleared of) was shown long ago.
   */
  function lineShown(turnId: number, unit: number, firstWord: number): boolean {
    const line = lineAt(turnId, unit, firstWord)
    return !line || isShown(line)
  }

  /** Whether that line is the one being read aloud now. */
  function lineSpeaking(
    turnId: number,
    unit: number,
    firstWord: number,
  ): boolean {
    const line = lineAt(turnId, unit, firstWord)
    return !!line && isSpeaking(line)
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
   * that ends in another room clears the conversation; one that addresses no
   * one clears it too and shows only Elior's own quotes (`toldAsSpeech`); one
   * that addresses someone else starts a new one; one that addresses the same
   * character adds to it.
   */
  function observe(turn: Turn): void {
    revealAll()
    const moved = turn.description?.moved === true
    const addressed = turn.addressed ?? null
    const said = speechLines(parseTurn(turn.text)).filter((line) =>
      toldAsSpeech(turn, line.speaker),
    )
    // Leaving the room ends the conversation, even when the talk itself moved Elior.
    if (moved || (!addressed && !said.length)) return clear()
    // A turn that addresses no one shows only Elior's own words, on their own.
    const partner = addressed ?? ELIOR
    if (
      !addressed ||
      conversation.value?.with.toLowerCase() !== partner.toLowerCase()
    ) {
      clear()
      conversation.value = { with: partner, lines: [] }
    }
    const narrated = narration.narrates(turn.id)
    // Elior's own words come first and need no narrator or pause.
    const own = addressed ? eliorLine(turn.command) : null
    const lines = [
      ...(own ? [{ ...own, narrated: false, shown: true }] : []),
      ...said.map((line) => ({
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
    isSpeaking,
    told,
    lineShown,
    lineSpeaking,
    revealAll,
    clear,
    observe,
  }
})
