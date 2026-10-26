/**
 * Act I's stock replies (rq-bio): what a person answers to a gift they do not
 * want, to a purchase they cannot fill, and what the game says of something
 * that is not there (the cast-on-person lines are unchanged and pinned by
 * `narrationCoverage.test.ts`). Each
 * names who answered, never the thing the player named, so one fixed sentence
 * serves every item and can be recorded once.
 */
import { describe, expect, it } from 'vitest'
import { Character, Game, characterName, speech } from '@/engine'
import { Act1 } from './Act1'
import { FLAG_PATCHES_RETURNED } from './Act1StoryFlags'
import { Blacksmith } from './characters/Blacksmith'
import { Deer } from './characters/Deer'
import { Fisherman } from './characters/Fisherman'
import { Grandmother } from './characters/Grandmother'
import { Merchant } from './characters/Merchant'
import { Mira } from './characters/Mira'
import { Patches } from './characters/Patches'
import { Priest } from './characters/Priest'
import { Shopkeeper } from './characters/Shopkeeper'
import { Villager } from './characters/Villager'
import { Rope } from './items/Rope'
import { Stick } from './items/Stick'

/** A character and the gift refusal it gives for any item it has no use for. */
const REFUSALS: [string, () => Character, string][] = [
  [
    'Tilda',
    () => new Villager(),
    `${characterName('Tilda')} shakes her head politely. It isn't something she needs.`,
  ],
  [
    'the priest',
    () => new Priest(),
    `The ${characterName('priest')} shakes his head politely. It isn't something he needs.`,
  ],
  [
    'the deer',
    () => new Deer(),
    `The ${characterName('deer')} sniffs at it and turns its head away.`,
  ],
  [
    'Grandmother',
    () => new Grandmother(),
    `${characterName('Grandmother')} turns it over in her hands. ` +
      speech("I'm not sure what to do with this, dear."),
  ],
  [
    'Mira',
    () => new Mira(),
    `${characterName('Mira')} regards it, then shakes her head gently. ` +
      speech('I have no need for this, child.'),
  ],
  [
    'the blacksmith',
    () => new Blacksmith(),
    `The ${characterName('blacksmith')} gives it a glance and hands it back. ` +
      speech("I don't have a use for this, lad."),
  ],
  [
    'the fisherman',
    () => new Fisherman(),
    `The ${characterName('fisherman')} eyes it with mild curiosity, then shrugs.`,
  ],
  [
    'the merchant',
    () => new Merchant(),
    `The ${characterName('merchant')} weighs it in his palm and hands it back. ` +
      speech('Not interested in that, friend.'),
  ],
  [
    'Patches',
    () => new Patches(),
    `${characterName('Patches')} sniffs at your offering from the shadows and stays put. ` +
      'Perhaps she would rather hear her name.',
  ],
]

/** Strips the attribution line `attributeSpeech` adds before a quoted line. */
function withoutLabel(text: string): string {
  return text
    .replace(/\n?\[character_name\][^\n]*\[\/character_name\]\n/, ' ')
    .trim()
}

describe('Act I stock replies', () => {
  describe.each(REFUSALS)(
    'giving %s something unwanted',
    (_who, make, text) => {
      it('answers with one fixed sentence whatever the item is', () => {
        const game = new Game([new Act1()])
        const person = make()
        const rope = new Rope()
        const stick = new Stick()
        const first = withoutLabel(person.giveItem(game.state, rope))
        const second = withoutLabel(person.giveItem(game.state, stick))
        expect(first).toBe(text)
        expect(second).toBe(text)
      })
    },
  )

  it('has the shopkeeper say he does not carry what is not stocked', () => {
    const game = new Game([new Act1()])
    game.state.setStoryFlag(FLAG_PATCHES_RETURNED, true)
    const shopkeeper = new Shopkeeper()
    const reply = withoutLabel(shopkeeper.buyItem(game.state, 'dragon'))
    expect(reply).toBe(speech("Sorry, friend, that's not something I carry."))
    expect(withoutLabel(shopkeeper.buyItem(game.state, 'unicorn'))).toBe(reply)
  })

  it('has those who sell nothing say so, naming only themselves', () => {
    const game = new Game([new Act1()])
    expect(new Villager().buyItem(game.state, 'rope')).toBe(
      `${characterName('Tilda')} has nothing to sell you.`,
    )
    expect(new Priest().buyItem(game.state, 'rope')).toBe(
      `The ${characterName('priest')} has nothing to sell you.`,
    )
  })

  it('says only that something is not there, never the word typed', () => {
    const game = new Game([new Act1()])
    expect(game.examine('dragon')).toBe("You don't see that here.")
    expect(game.examine('unicorn')).toBe("You don't see that here.")
  })
})
