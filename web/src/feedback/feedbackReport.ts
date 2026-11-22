import type { BeaconError } from './beacon'

/** The most characters the feedback box takes (the service's limit on a report's text). */
export const FEEDBACK_MAX = 5000

/** The fewest letters a report needs before Send is live. */
export const FEEDBACK_MIN_LETTERS = 3

/** The longest heading a report may have. */
const HEADING_MAX = 120

/** The longest version label the service takes. */
const VERSION_MAX = 64

/** How many letters and digits `text` holds (spaces, marks and punctuation do not count). */
export function lettersIn(text: string): number {
  return (text.match(/[\p{L}\p{N}]/gu) ?? []).length
}

/**
 * The report's heading, made from the first line of what the player wrote: cut at a word to at
 * most 120 characters (hard, when a single word is longer than that).
 */
export function headingFrom(text: string): string {
  const line =
    text
      .split('\n')
      .map((candidate) => candidate.trim())
      .find((candidate) => candidate !== '') ?? ''
  if (line.length <= HEADING_MAX) return line
  const cut = line.slice(0, HEADING_MAX + 1)
  const space = cut.lastIndexOf(' ')
  return space > 0 ? cut.slice(0, space).trimEnd() : line.slice(0, HEADING_MAX)
}

/**
 * The version field of a report: the game's version, then the act and the room, since the service
 * has no fields of their own for those. At most 64 characters; the room is cut first.
 */
export function versionLabel(
  version: string,
  act: string,
  room: string,
): string {
  const label = [version, act, room].filter((part) => part !== '').join(' · ')
  return label.slice(0, VERSION_MAX).trimEnd()
}

/** What the player reads when the service did not take the report; `pictured` says one was sent. */
export function failureText(error: BeaconError, pictured: boolean): string {
  switch (error.code) {
    case 'rate_limited': {
      const minutes = Math.max(1, Math.ceil(error.retryAfterSeconds / 60))
      return (
        'Too many reports just now. Try again in ' +
        `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`
      )
    }
    case 'network':
    case 'request_timeout':
      return (
        "Couldn't reach the feedback service. " +
        'Check your connection and try again.'
      )
    case 'too_large':
      if (pictured)
        return (
          'The picture of the screen is too large to send. ' +
          'Untick it and try again.'
        )
      return "Something went wrong and it wasn't sent. Try again later."
    default:
      return "Something went wrong and it wasn't sent. Try again later."
  }
}
