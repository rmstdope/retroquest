/**
 * The narration manifest: for every recorded block, its clip and the timing of
 * each spoken word.
 *
 * Each act's recordings sit in `public/audio/narration/act<N>/` with a
 * `manifest.json` of this shape, keyed by `narrationKey`. The word timings
 * refer to `narrationWords` of the block, so the story view can light the
 * shown word that is being spoken.
 */

import { narrationKey, narrationText } from './narrationKey'

/** One shown word and when it is spoken, in seconds from the clip's start. */
export interface NarrationWord {
  word: string
  start: number
  end: number
}

/** One recorded block: its audio file, voice, length and word timings. */
export interface NarrationClip {
  /** File name inside the act's narration folder. */
  file: string
  /** The speaker whose voice it is (lower case). */
  speaker: string
  /** Length of the clip in seconds. */
  duration: number
  /** One entry per word of `narrationWords`, in order. */
  words: NarrationWord[]
}

/** Every recorded block of an act, by `narrationKey`. */
export type NarrationManifest = Record<string, NarrationClip>

/** The words of a block as the story view shows them: whitespace-separated, punctuation attached. */
export function narrationWords(markup: string): string[] {
  const text = narrationText(markup)
  return text ? text.split(' ') : []
}

/**
 * The recording of one voiced block, or null when there is none. `speaker` and
 * `markup` are one block as `turnBlocks`, `introBlocks` or `questCardBlocks`
 * give it (`UNSIGNED` for unsigned writing), not a whole answer.
 */
export function findClip(
  manifest: NarrationManifest,
  speaker: string,
  markup: string,
): NarrationClip | null {
  if (!narrationText(markup)) return null
  return manifest[narrationKey(speaker, markup)] ?? null
}
