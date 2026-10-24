/**
 * What Mira says when Elior asks her about his past with `say <topic> to
 * mira`: the four topics and the words that name them, her evasions before
 * the confession, her honest answers after it, and the grey reminder that
 * tells the player the command. Which set she uses depends only on whether
 * she has confessed, so nothing here is saved.
 */
import { characterName, dialogue, speech } from '@/engine'

/** A subject Elior can ask Mira about. */
export type MiraTopic = 'parents' | 'malakar' | 'amulet' | 'grandmother'

/** The topics in priority order, each with the words that name it. */
const TOPIC_WORDS: ReadonlyArray<readonly [MiraTopic, RegExp]> = [
  ['parents', /\b(parents|mother|father|mum|dad|aren(?!['’]t)|lysa)\b/i],
  ['malakar', /\bmalakar\b/i],
  ['amulet', /\bamulet\b/i],
  ['grandmother', /\b(grandmother|grandma|gran|granny)\b/i],
]

/** The grey line that follows each invitation to ask her. */
export const MIRA_TOPICS_REMINDER =
  '[dim](Ask her with: say parents, say malakar, say amulet or say ' +
  'grandmother to Mira.)[/dim]'

/** Her evasions before the confession; each gives a little away. */
const DODGES: Record<MiraTopic, string> = {
  parents: 'Later, Elior. Not here.',
  malakar: 'A name in the old books. Let us keep it there a while longer.',
  amulet:
    'Keep it close and keep it hidden. That is all it asks of you, for now.',
  grandmother:
    'She loves you more than you know. Ask her yourself, when we are home.',
}

/** Her honest answers after the confession. */
const ANSWERS: Record<MiraTopic, string> = {
  parents:
    'Aren laughed with his whole chest, and Lysa always crossed her sevens. ' +
    'They did not die, Elior. They became the ward, and they are in it ' +
    'still.',
  malakar:
    'He was their closest friend, and my teacher too. Something broke in ' +
    'him that none of us could mend, and he tore at time itself. Whatever ' +
    'he is now, I remember the man who taught me my first circle.',
  amulet:
    'It is the anchor of their ward. As long as you carry it, the ward ' +
    'holds. That is why his agent walked our lanes looking for it.',
  grandmother:
    "She is Lysa's mother, and she kept the secret with me all these " +
    'years. It cost her more than it cost me. Be gentle with her when you ' +
    'are home.',
}

/**
 * The topic named in the words Elior says (whole words, any case), or null.
 * When several are named, the first in the order parents, malakar, amulet,
 * grandmother wins.
 */
export function miraTopicIn(words: string): MiraTopic | null {
  for (const [topic, pattern] of TOPIC_WORDS) {
    if (pattern.test(words)) return topic
  }
  return null
}

/**
 * Mira's reply to a topic: the evasion before the confession, the honest
 * answer after it, and for no topic (null) the same shake of the head either
 * way.
 */
export function miraTopicReply(
  topic: MiraTopic | null,
  confessed: boolean,
): string {
  if (topic === null) {
    return (
      `${characterName('Mira')} shakes her head.` +
      '\n' +
      speech(
        'Ask me of your parents, Malakar, the amulet or your ' +
          'grandmother, Elior.',
      )
    )
  }
  return dialogue('Mira', confessed ? ANSWERS[topic] : DODGES[topic])
}
