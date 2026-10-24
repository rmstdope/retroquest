/**
 * Elior's optional answer to Mira's confession: the key words that recognise
 * the two answers, her replies, and the gate line each answer leaves behind.
 * The answer itself is remembered in two story flags, so nothing here is saved.
 */
import { characterName, speech } from '@/engine'

/** How Elior answers the confession. */
export type MiraAnswer = 'forgive' | 'reproach'

/** The grey line that follows Mira's invitation to answer. */
export const MIRA_ANSWER_REMINDER =
  '[dim](Answer her with: say i forgive you or say you should have told ' +
  'me to Mira.)[/dim]'

/** Mira's invitation to answer, in the confession. */
export const MIRA_ANSWER_INVITATION =
  'Say what you need to say to me, Elior. I would rather hear it now.'

/** Her reply once an answer has been given (either one, again). */
export const MIRA_ANSWER_REPEAT = 'I heard you, Elior. I will not forget it.'

/** Her gate line, replacing the second one, for each answer. */
export const MIRA_GATE_LINES: Record<MiraAnswer, string> = {
  forgive:
    'You forgave me in the hut, and I mean to earn it. Your parents ' +
    'walked into the dark without me once. I am coming with you.',
  reproach:
    'You were right in the hut: I should have told you. So I will tell ' +
    'you this plainly. I am coming with you.',
}

/**
 * The answer in the words Elior says (case-insensitive). "forgive" wins over
 * "should have told" / "should have said"; anything else is null.
 */
export function miraAnswerIn(words: string): MiraAnswer | null {
  const lower = words.toLowerCase()
  if (lower.includes('forgive')) return 'forgive'
  if (lower.includes('should have told') || lower.includes('should have said'))
    return 'reproach'
  return null
}

/** Mira's reply to a first answer: the echo, her reaction and her line. */
export function miraAnswerReply(answer: MiraAnswer): string {
  if (answer === 'forgive') {
    return [
      `${characterName('Mira')} closes her eyes. For a moment she looks ` +
        'younger, and very tired.',
      speech(
        'Thank you. I did not dare ask for that. I will try to deserve it.',
      ),
    ].join('\n')
  }
  return [
    `${characterName('Mira')} does not look away.`,
    speech(
      'I should have. I chose the seal over you every day, and I would ' +
        'choose it again. But I am sorry for every one of those days.',
    ),
  ].join('\n')
}
