/** An act's chapter heading and text, read from the engine's intro. */
export interface ActIntro {
  /** "Act I" (empty when the intro has no title line). */
  act: string
  /** "The Call to Adventure" (empty when the intro has no title line). */
  title: string
  /** The intro without its title line (engine markup). */
  body: string
}

/** "[bold]ACT 1: THE CALL TO ADVENTURE[/bold]" — the first line of every intro. */
const TITLE_LINE = /^\[bold\]ACT\s+(\w+):\s*(.+?)\[\/bold\]\s*/
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI']
/** Words kept lower case inside a title. */
const SMALL_WORDS = new Set([
  'a',
  'an',
  'and',
  'at',
  'for',
  'in',
  'of',
  'on',
  'or',
  'the',
  'to',
])

function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) =>
      index > 0 && SMALL_WORDS.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ')
}

export function parseActIntro(text: string): ActIntro {
  const match = TITLE_LINE.exec(text)
  if (!match) return { act: '', title: '', body: text }
  const number = Number(match[1])
  const numeral = Number.isNaN(number)
    ? match[1]
    : (ROMAN[number - 1] ?? match[1])
  return {
    act: `Act ${numeral}`,
    title: titleCase(match[2].trim()),
    body: text.slice(match[0].length).trim(),
  }
}

/** Where the engine's act-complete text starts, after the act's last answer. */
const CONGRATULATIONS = 'Congratulations'

/** The act-complete text without the last answer (already shown in the story). */
export function actCompleteText(text: string): string {
  const start = text.indexOf(CONGRATULATIONS)
  return start < 0 ? text : text.slice(start).trim()
}
