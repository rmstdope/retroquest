/**
 * The family keepsakes (rq-woez): what Grandmother, Mira and the fisherman
 * answer when Elior hands over his parents' ring, letter, photograph or the
 * travel cloak. Each answer is in character, the item stays with Elior and
 * nothing else changes.
 */
import { describe, expect, it } from 'vitest'
import { Character, Game, characterName, speech } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from './Act1'
import { Fisherman } from './characters/Fisherman'
import { Grandmother } from './characters/Grandmother'
import { Mira } from './characters/Mira'
import { AncientAmulet } from './items/AncientAmulet'
import { Bread } from './items/Bread'
import { FadedPhotograph } from './items/FadedPhotograph'
import { MothersLetter } from './items/MothersLetter'
import { Rope } from './items/Rope'
import { ShinyRing } from './items/ShinyRing'
import { TravelCloak } from './items/TravelCloak'

/** Strips the attribution line `attributeSpeech` adds before a quoted line. */
function withoutLabel(text: string): string {
  return text
    .replace(/ ?\n?\[character_name\][^\n]*\[\/character_name\]\n/, ' ')
    .trim()
}

const GRANDMOTHER = `Your ${characterName('grandmother')}`
const MIRA = characterName('Mira')

const RING_TO_GRANDMOTHER =
  `${GRANDMOTHER} takes the ring, and her hands go still on it. ` +
  speech(
    "Your mother's. Your father walked to Greendale and back in a day to fetch that.",
  ) +
  ' She turns it once, so the letters inside catch the light, and gives it back. ' +
  speech("Keep it, love. That one doesn't go on a shelf.")

const LETTER_TO_GRANDMOTHER =
  'She reads it standing, and then again. Her mouth goes thin at one line, and she does not say which. ' +
  speech("That's her, all over. Telling you what to do from wherever she is.") +
  '\nShe folds it along its creases and hands it back. ' +
  speech('Keep it dry. And do as she says.') +
  ' She turns back to the hearth, where the next loaf is rising.'

const LETTER_TO_MIRA_BEFORE =
  `${MIRA} reads it to the end, and her thumb stays on one line. ` +
  speech('She always did trust me with more than I asked for.') +
  '\nShe hands it back. ' +
  speech(
    'When you are ready, Elior. Not before. Those are her words, and they are mine.',
  )

const LETTER_TO_MIRA_AFTER =
  `${MIRA} reads it, then looks at the [item_name]amulet[/item_name] you carry. ` +
  speech('I kept it. Now you keep it.') +
  '\nShe hands the letter back. ' +
  speech('And mind what she says about answering questions.')

const PHOTOGRAPH_TO_MIRA =
  `${MIRA} holds it by the edges, the way you do, and looks at it a long time. ` +
  speech('You were a loud baby.') +
  ' She gives it back. That is all she says.'

const CLOAK_TO_GRANDMOTHER =
  `${GRANDMOTHER} pushes it back into your arms. ` +
  speech(
    'I kept that in paper all these years so you could hand it back to me? She left it for you. Wear it.',
  )

const LETTER_TO_FISHERMAN =
  `The ${characterName('fisherman')} knows the paper before he reads a word, and does not read it. ` +
  speech(
    "So you lifted the stone. I sat by it more years than I'll own to, lad, and never once did. Wasn't mine to.",
  )

describe('family keepsakes', () => {
  const CASES: [
    string,
    () => Character,
    () => ShinyRing | MothersLetter | FadedPhotograph | TravelCloak,
    string,
  ][] = [
    [
      'letter to Grandmother',
      () => new Grandmother(),
      () => new MothersLetter(),
      LETTER_TO_GRANDMOTHER,
    ],
    [
      'letter to Mira before the amulet',
      () => new Mira(),
      () => new MothersLetter(),
      LETTER_TO_MIRA_BEFORE,
    ],
    [
      'photograph to Mira',
      () => new Mira(),
      () => new FadedPhotograph(),
      PHOTOGRAPH_TO_MIRA,
    ],
    [
      'cloak to Grandmother',
      () => new Grandmother(),
      () => new TravelCloak(),
      CLOAK_TO_GRANDMOTHER,
    ],
    [
      'letter to the fisherman',
      () => new Fisherman(),
      () => new MothersLetter(),
      LETTER_TO_FISHERMAN,
    ],
  ]

  it.each(CASES)(
    'answers %s in character, keeps the item and changes nothing',
    (_name, person, item, expected) => {
      const game = new Game([new Act1()])
      const gift = item()
      game.state.addItemToInventory(gift)
      const flagsBefore = JSON.stringify(game.state.storyFlags)
      const who = person()
      const first = withoutLabel(who.giveItem(game.state, gift))
      const second = withoutLabel(who.giveItem(game.state, gift))
      expect(first).toBe(expected)
      expect(second).toBe(expected)
      expect(game.state.inventory).toContain(gift)
      // Reading the letter is the reader's own act, not the give's.
      expect(JSON.stringify(game.state.storyFlags)).toBe(flagsBefore)
    },
  )

  it('answers the ring to Grandmother as before from the second gift on, keeping the item', () => {
    const game = new Game([new Act1()])
    const ring = new ShinyRing()
    game.state.addItemToInventory(ring)
    new Grandmother().giveItem(game.state, ring)
    const again = withoutLabel(new Grandmother().giveItem(game.state, ring))
    expect(again).toBe(RING_TO_GRANDMOTHER)
    expect(game.state.inventory).toContain(ring)
  })

  it('answers the same whether or not the ring was examined', () => {
    const game = new Game([new Act1()])
    const ring = new ShinyRing()
    game.state.addItemToInventory(ring)
    // The first gift tells the story of the well; compare the later answers.
    new Grandmother().giveItem(game.state, ring)
    const unexamined = withoutLabel(
      new Grandmother().giveItem(game.state, ring),
    )
    ring.examine(game.state)
    const examined = withoutLabel(new Grandmother().giveItem(game.state, ring))
    expect(examined).toBe(unexamined)
  })

  it('answers the same whether or not the letter was read', () => {
    const game = new Game([new Act1()])
    const letter = new MothersLetter()
    game.state.addItemToInventory(letter)
    const unread = withoutLabel(new Grandmother().giveItem(game.state, letter))
    letter.examine(game.state)
    const read = withoutLabel(new Grandmother().giveItem(game.state, letter))
    expect(read).toBe(unread)
  })

  it('has Grandmother turn to nothing that is gone once the loaf is taken', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.EliorsCottage
    const letter = new MothersLetter()
    game.state.addItemToInventory(letter)
    const withLoaf = withoutLabel(
      new Grandmother().giveItem(game.state, letter),
    )
    executeCommands(game, ['take bread'])
    expect(
      game.state.allRooms.EliorsCottage.items.some((i) => i instanceof Bread),
    ).toBe(false)
    const withoutLoaf = withoutLabel(
      new Grandmother().giveItem(game.state, letter),
    )
    expect(withoutLoaf).not.toContain('the bread')
    expect(withoutLoaf).toBe(withLoaf)
  })

  it('labels Grandmother and the fisherman as the speakers', () => {
    const game = new Game([new Act1()])
    const letter = new MothersLetter()
    game.state.addItemToInventory(letter)
    for (const who of [new Grandmother(), new Fisherman()]) {
      expect(who.giveItem(game.state, letter)).toContain('[character_name]')
    }
  })

  it('has Mira answer the letter differently once Elior carries the amulet', () => {
    const game = new Game([new Act1()])
    const letter = new MothersLetter()
    game.state.addItemToInventory(letter)
    game.state.addItemToInventory(new AncientAmulet())
    const answer = withoutLabel(new Mira().giveItem(game.state, letter))
    expect(answer).toBe(LETTER_TO_MIRA_AFTER)
    expect(game.state.inventory).toContain(letter)
  })

  it('has Mira answer the photograph the same once Elior carries the amulet', () => {
    const game = new Game([new Act1()])
    const photo = new FadedPhotograph()
    game.state.addItemToInventory(photo)
    game.state.addItemToInventory(new AncientAmulet())
    expect(withoutLabel(new Mira().giveItem(game.state, photo))).toBe(
      PHOTOGRAPH_TO_MIRA,
    )
  })

  it('keeps the stock reply for any other item', () => {
    const game = new Game([new Act1()])
    const rope = new Rope()
    for (const who of [new Grandmother(), new Mira(), new Fisherman()]) {
      expect(withoutLabel(who.giveItem(game.state, rope))).not.toMatch(
        /Greendale|Wear it|loud baby|Wasn't mine/,
      )
    }
  })
})
