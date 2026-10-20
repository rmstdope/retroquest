/**
 * Act I text follows the markup conventions on every answer of the golden
 * path: every character is named through `[character_name]`, spoken and
 * written words sit in `[dialogue]` without quote marks of their own, and no
 * quoted speech is left in the narration.
 */
import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { expectNoSpeechOutsideDialogue } from '@/testing/gameHelpers'
import { Act1 } from './Act1'
import { ACT1_GOLDEN_PATH } from './Act1GoldenPath'

const CHARACTER_WORDS =
  /\b(Elior|Mira|Hemlock|Patches|Borin|Tilda|grandmother|shopkeeper|blacksmith|priest|fisherman|merchant|villager|deer)\b/i
const NAMED_SPANS =
  /\[(character_name|room_name|item_name|spell_name|quest_name)\][\s\S]*?\[\/\1\]/g
const DIALOGUE_BLOCK = /\[dialogue\]([\s\S]*?)\[\/dialogue\]/g

/** Every answer of the golden path, each paired with the command that gave it. */
function goldenPathAnswers(): { command: string; answer: string }[] {
  const game = new Game([new Act1()])
  return ACT1_GOLDEN_PATH.map((command) => {
    const answer = game.commandParser.parse(command)
    game.state.settleQuests()
    return { command, answer }
  })
}

describe('Act I markup conventions', () => {
  const answers = goldenPathAnswers()

  it('names every character through [character_name]', () => {
    for (const { command, answer } of answers) {
      const bare = answer.replace(NAMED_SPANS, '').match(CHARACTER_WORDS)
      expect(bare?.[0], `bare name after "${command}": ${answer}`).toBe(
        undefined,
      )
    }
  })

  it('keeps quoted speech out of the narration', () => {
    for (const { answer } of answers) expectNoSpeechOutsideDialogue(answer)
  })

  it('writes dialogue without quote marks of its own', () => {
    for (const { command, answer } of answers) {
      for (const [, words] of answer.matchAll(DIALOGUE_BLOCK)) {
        expect(words.trim(), `quoted dialogue after "${command}"`).not.toMatch(
          /^['"]|['"]$/,
        )
      }
    }
  })
})
