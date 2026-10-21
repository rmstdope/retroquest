import { describe, it, expect } from 'vitest'
import { characterName, dialogue, event, speech } from '@/engine'
import { MIRA_TOPICS_REMINDER, miraTopicIn, miraTopicReply } from './MiraTopics'

const miraSays = (words: string): string => dialogue('Mira', words)

const FALLBACK =
  event(`${characterName('Mira')} shakes her head.`) +
  '\n' +
  speech(
    'Ask me of your parents, Malakar, the amulet or your grandmother, Elior.',
  )

describe('miraTopicIn', () => {
  it.each([
    ['parents', 'parents'],
    ['my mother', 'parents'],
    ['Father', 'parents'],
    ['mum', 'parents'],
    ['DAD', 'parents'],
    ['Aren', 'parents'],
    ['lysa', 'parents'],
    ['Malakar', 'malakar'],
    ['the amulet', 'amulet'],
    ['grandmother', 'grandmother'],
    ['grandma', 'grandmother'],
    ['gran', 'grandmother'],
    ['Granny', 'grandmother'],
  ])('recognises "%s" as %s', (words, topic) => {
    expect(miraTopicIn(words)).toBe(topic)
  })

  it('matches whole words only', () => {
    expect(miraTopicIn('the arena')).toBeNull()
    expect(miraTopicIn('the weather')).toBeNull()
    expect(miraTopicIn("aren't you tired")).toBeNull()
  })

  it('picks the first topic in the fixed order when several are named', () => {
    expect(miraTopicIn('mother and malakar')).toBe('parents')
    expect(miraTopicIn('amulet and gran')).toBe('amulet')
    expect(miraTopicIn('gran and malakar')).toBe('malakar')
  })
})

describe('miraTopicReply', () => {
  it('dodges each topic before the confession', () => {
    expect(miraTopicReply('parents', false)).toBe(
      miraSays('Later, Elior. Not here.'),
    )
    expect(miraTopicReply('malakar', false)).toBe(
      miraSays('A name in the old books. Let us keep it there a while longer.'),
    )
    expect(miraTopicReply('amulet', false)).toBe(
      miraSays(
        'Keep it close and keep it hidden. That is all it asks of you, for now.',
      ),
    )
    expect(miraTopicReply('grandmother', false)).toBe(
      miraSays(
        'She loves you more than you know. Ask her yourself, when we are home.',
      ),
    )
  })

  it('answers each topic honestly after the confession', () => {
    expect(miraTopicReply('parents', true)).toBe(
      miraSays(
        'Aren laughed with his whole chest, and Lysa always crossed her ' +
          'sevens. They did not die, Elior. They became the ward, and they ' +
          'are in it still.',
      ),
    )
    expect(miraTopicReply('malakar', true)).toBe(
      miraSays(
        'He was their closest friend, and my teacher too. Something broke ' +
          'in him that none of us could mend, and he tore at time itself. ' +
          'Whatever he is now, I remember the man who taught me my first ' +
          'circle.',
      ),
    )
    expect(miraTopicReply('amulet', true)).toBe(
      miraSays(
        'It is the anchor of their ward. As long as you carry it, the ward ' +
          'holds. That is why his agent walked our lanes looking for it.',
      ),
    )
    expect(miraTopicReply('grandmother', true)).toBe(
      miraSays(
        "She is Lysa's mother, and she kept the secret with me all these " +
          'years. It cost her more than it cost me. Be gentle with her when ' +
          'you are home.',
      ),
    )
  })

  it('gives the same fallback before and after the confession', () => {
    expect(miraTopicReply(null, false)).toBe(FALLBACK)
    expect(miraTopicReply(null, true)).toBe(FALLBACK)
  })

  it('names the words to type in the grey reminder', () => {
    expect(MIRA_TOPICS_REMINDER).toBe(
      '[dim](Ask her with: say parents, say malakar, say amulet or say ' +
        'grandmother to Mira.)[/dim]',
    )
  })
})
