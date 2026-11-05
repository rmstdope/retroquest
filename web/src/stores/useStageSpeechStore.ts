import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import type { Turn } from './useGameStore'
import { useNarrationStore } from './useNarrationStore'
import { useSceneStore } from './useSceneStore'
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
 * another room clears it; when the talk itself moved him, its lines start a
 * fresh conversation. Any other turn clears it too, and shows the words
 * it has (Elior's journal, a reply to a spell) on their own. The lines of each turn are the quotes of its answer
 * (`speechLines`), shown as the narrator reaches them when the turn is
 * narrated, and otherwise one at a time by a reading pause (`readingPauseMs`);
 * `revealAll` shows the rest of the turn at once. An unnarrated talk that
 * moves Elior says when its scene may change (`SceneChange`): once the lines
 * before it are read, or at once when the turn is shown whole. Lines a new
 * command cut off before they appeared (`noteSeen` remembers the rest) are not
 * cleared by it: they stay, dimmed as the turn before, unless it leaves the room.
 */

/** Where an unnarrated turn's scene changes: before unit `unit`, by calling `reached` once. */
export interface SceneChange {
  /** The first unit told after the change; it and the units after it wait until then. */
  unit: number
  /** Begins the change; called once, when the lines before it are read or the turn is shown whole or cleared. */
  reached: () => void
}

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
  /** Whether it was on the picture before a newer turn came (`noteSeen`). */
  seen: boolean
  /** Whether a newer turn that cut it off kept it (`observe`): the next turn lets it go once seen. */
  carried: boolean
}

/** The conversation on the picture. */
export const useStageSpeechStore = defineStore('stageSpeech', () => {
  const narration = useNarrationStore()
  const scene = useSceneStore()
  const conversation = ref<{ with: string; lines: StageLine[] } | null>(null)
  /**
   * The newest turns taken in, oldest first (three tell the ages apart),
   * whether or not anyone spoke in them.
   */
  const recentTurns = ref<number[]>([])
  let nextKey = 1
  let timer: ReturnType<typeof setTimeout> | undefined
  /** The scene change the unnarrated turn being read waits to reach, and that turn, if any. */
  const sceneChange = shallowRef<(SceneChange & { turnId: number }) | null>(
    null,
  )

  /** Whether a line is on the picture now. */
  function isShown(line: StageLine): boolean {
    if (!line.narrated)
      return line.shown && !scene.holds(line.turnId, line.unit)
    if (!narration.revealed(line.turnId, line.unit)) return false
    // A quote is one recording: its later paragraphs wait for the narrator's word.
    const now = narration.speaking(line.turnId)
    if (!now || now.unit !== line.unit || !now.aligned) return true
    return line.firstWord === 0 || now.offset + now.word >= line.firstWord
  }

  /** Whether a line was said after its talk's room changed (or the room never did): the picture keeps it. */
  function kept(line: StageLine): boolean {
    const first = scene.firstUnit(line.turnId)
    // Elior's own words (unit -1) come before the change too.
    return first === null || line.unit >= first
  }

  /** The lines on the picture now, in the order they were said. */
  const visible = computed(
    () =>
      conversation.value?.lines.filter((line) => kept(line) && isShown(line)) ??
      [],
  )

  /**
   * Whether everything said in turn `turnId` is on the picture (also when it
   * said nothing there): what quest news told after the words waits for. A
   * turn whose scene is still to change has not told everything yet.
   */
  function told(turnId: number): boolean {
    if (sceneChange.value?.turnId === turnId) return false
    return (
      conversation.value?.lines
        .filter((line) => line.turnId === turnId && kept(line))
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
   * cleared of) was shown long ago. Nothing of a turn that moves Elior shows
   * while the picture of its move is still changing (`useSceneStore`), also
   * before the conversation has taken the turn in.
   */
  function lineShown(turnId: number, unit: number, firstWord: number): boolean {
    if (scene.holds(turnId, unit)) return false
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

  /** Wait with turn `turn`'s words from `change`'s unit on until its scene changes (none: nothing waits). */
  function holdScene(turn: Turn, change: SceneChange | null): void {
    if (!change) return
    sceneChange.value = { ...change, turnId: turn.id }
    scene.wait(turn.id, change.unit)
  }

  /** The scene of the turn being read changes now, if it is still to (once). */
  function changeSceneNow(): void {
    const change = sceneChange.value
    if (!change) return
    sceneChange.value = null
    scene.unwait()
    change.reached()
  }

  /**
   * Release the next line of an unnarrated turn after the reading pause of the
   * one before it; the scene change waiting before the next line (or at the
   * end of the lines) comes after that pause instead, and the lines go on.
   */
  function release(previous: StageLine | null): void {
    clearTimeout(timer)
    const next = conversation.value?.lines.find(
      (line) => !line.narrated && !line.shown,
    )
    const change = sceneChange.value
    const atScene = !!change && (!next || next.unit >= change.unit)
    if (!next && !atScene) return
    const wait = previous ? readingPauseMs(previous.markup) : 0
    const show = (): void => {
      if (atScene) changeSceneNow()
      if (!next) return
      next.shown = true
      release(next)
    }
    if (wait === 0) show()
    else timer = setTimeout(show, wait)
  }

  /**
   * Remember which lines are on the picture now: a new turn calls it before it
   * cuts in on the rest, so the lines it cut off are known (see `observe`).
   */
  function noteSeen(): void {
    for (const line of conversation.value?.lines ?? [])
      if (isShown(line)) line.seen = true
  }

  /** The lines the picture keeps of every turn that still had a line to show when the new turn came. */
  function cutOff(): StageLine[] {
    const lines = (conversation.value?.lines ?? []).filter(kept)
    const turns = new Set(
      lines.filter((line) => !line.seen).map((line) => line.turnId),
    )
    return lines.filter((line) => turns.has(line.turnId))
  }

  /** Clear the picture but keep `lines` (none: a plain clear), in a conversation with `partner` when given. */
  function restart(lines: StageLine[], partner: string | null): void {
    const before = conversation.value?.with ?? null
    clear()
    const name = partner ?? (lines.length ? before : null)
    if (name)
      conversation.value = {
        with: name,
        lines: lines.map((line) => Object.assign(line, { carried: true })),
      }
  }

  /** Show the rest of the turn's lines at once. */
  function revealAll(): void {
    clearTimeout(timer)
    for (const line of conversation.value?.lines ?? []) line.shown = true
    changeSceneNow()
  }

  /** Clear the picture; the story keeps everything said, and a scene still to change changes now. */
  function clear(): void {
    clearTimeout(timer)
    conversation.value = null
    changeSceneNow()
  }

  /**
   * Take a new turn in: the previous turn's lines show in full first. A turn
   * that ends in another room clears the conversation, and starts a new one
   * when it addressed someone (the talk itself moved Elior); one that
   * addresses no one clears it too and shows its own quotes on their own
   * (`toldAsSpeech`); one that addresses someone else starts a new one; one
   * that addresses the same character adds to it. `change` is where the
   * scene of an unnarrated talk that moves Elior changes (see `SceneChange`).
   * Whatever it clears, it keeps the lines of a turn it cut off before they
   * all appeared, unless it moved Elior; the next turn lets them go once
   * they have been seen.
   */
  function observe(turn: Turn, change: SceneChange | null = null): void {
    recentTurns.value = [...recentTurns.value, turn.id].slice(-3)
    // An unnarrated line's showing is its own (no skip of the narrator touches
    // it), so it is noted here too; a narrated one only by the earlier `noteSeen`.
    for (const line of conversation.value?.lines ?? [])
      if (!line.narrated && isShown(line)) line.seen = true
    // Kept lines go once seen, as the turn that kept them would have cleared them.
    if (conversation.value)
      conversation.value.lines = conversation.value.lines.filter(
        (line) => !line.carried || !line.seen,
      )
    const moved = turn.description?.moved === true
    // Lines cut off before they appeared stay (shown now), unless Elior left the room.
    const cut = moved ? [] : cutOff()
    revealAll()
    const addressed = turn.addressed ?? null
    const said = toldAsSpeech(turn) ? speechLines(parseTurn(turn.text)) : []
    // Leaving the room ends the conversation; a talk that moved Elior starts a new one.
    if (!addressed && (moved || !said.length)) {
      // Nothing is said on the picture: a scene to change changes at once.
      holdScene(turn, change)
      return restart(cut, null)
    }
    // A turn that addresses no one shows its own words, on their own.
    const partner = addressed ?? ELIOR
    if (
      moved ||
      !addressed ||
      conversation.value?.with.toLowerCase() !== partner.toLowerCase()
    )
      restart(cut, partner)
    holdScene(turn, change)
    const narrated = narration.narrates(turn.id)
    // Elior's own words come first and need no narrator or pause.
    const own = addressed ? eliorLine(turn.command) : null
    const lines = [
      ...(own
        ? [
            {
              ...own,
              narrated: false,
              shown: true,
              seen: false,
              carried: false,
            },
          ]
        : []),
      ...said.map((line) => ({
        ...line,
        narrated,
        shown: false,
        seen: false,
        carried: false,
      })),
    ].map((line) => ({ ...line, turnId: turn.id, key: nextKey++ }))
    conversation.value?.lines.push(...lines)
    release(
      conversation.value?.lines.find(
        (line) => line.shown && line.turnId === turn.id,
      ) ?? null,
    )
  }

  /**
   * How far back turn `turnId` was told, every turn counting: `new` for the
   * newest, `prev` for the one before it, `old` for any earlier one. The
   * speech on the picture dims by this, a turn with no speech included.
   */
  function ageOf(turnId: number): 'new' | 'prev' | 'old' {
    const back =
      recentTurns.value.length - 1 - recentTurns.value.indexOf(turnId)
    return back === 0 ? 'new' : back === 1 ? 'prev' : 'old'
  }

  return {
    conversation,
    visible,
    ageOf,
    isSpeaking,
    told,
    lineShown,
    lineSpeaking,
    revealAll,
    changeSceneNow,
    noteSeen,
    clear,
    observe,
  }
})
