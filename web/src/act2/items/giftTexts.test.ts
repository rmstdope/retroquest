import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { DruidicCharm } from './DruidicCharm'
import { EnchantedAcorn } from './EnchantedAcorn'
import { ForestHeartCrystal } from './ForestHeartCrystal'
import { NaturesCharm } from './NaturesCharm'
import { NyxToken } from './NyxToken'
import { OfferingAltar } from './OfferingAltar'
import { ProtectiveCharm } from './ProtectiveCharm'

/** The wording the navigator approved for the charms, the acorn and Nyx's gifts. */
const TEXTS = {
  druidic:
    'A pendant of dark oak on a leather cord, bound with silver wire, with an ' +
    'oak leaf carved on its face. It hung over the door of the Silver Stag for ' +
    'longer than there has been a Silver Stag.',
  protective:
    "A twist of braided grass, bark and a bird's bone: the hermit's mark. It " +
    "tells the forest you are under the hermit's protection.",
  natures:
    'A small wooden charm, dark with handling, carved with a sword laid ' +
    "across a branch. Sir Cedric's family has kept it since the knights first " +
    'made pacts with the forest spirits.',
  acorn:
    'An acorn, perfectly shaped, with fine veins of silver running through ' +
    'the shell like roots. It is warm, as if someone had just been holding it.',
  token:
    'A small crystal on a cord of plaited grass. Turn it in the light and it ' +
    'is green as summer leaves, then brown as autumn, then white as snow.',
  crystal:
    'A crystal the size of a plum. Inside it, tiny lights drift like ' +
    'fireflies over a forest you could almost walk into. Held close, it ' +
    'sounds like wind in leaves.',
}

describe("the charms and Nyx's gifts", () => {
  it('describe each gift plainly, and examining a charm adds nothing', () => {
    const game = new Game([new Act2()])
    expect(new DruidicCharm().description).toBe(TEXTS.druidic)
    expect(new DruidicCharm().examine(game.state)).toBe(TEXTS.druidic)
    expect(new ProtectiveCharm().description).toBe(TEXTS.protective)
    expect(new NaturesCharm().description).toBe(TEXTS.natures)
    expect(new NyxToken().description).toBe(TEXTS.token)
    expect(new ForestHeartCrystal().description).toBe(TEXTS.crystal)
  })

  it('keeps the druidic charm warm in the hand wherever it is used', () => {
    const game = new Game([new Act2()])
    expect(new DruidicCharm().use(game.state)).toBe(
      'The charm is warm from your hand.',
    )
  })

  it('keeps the protective charm light away from the forest entrance', () => {
    const game = new Game([new Act2()])
    expect(new ProtectiveCharm().use(game.state)).toBe(
      'The braided grass is dry and light in your hand.',
    )
  })
})

describe('the enchanted acorn', () => {
  it('no longer says what it is for', () => {
    const game = new Game([new Act2()])
    const acorn = new EnchantedAcorn()
    expect(acorn.description).toBe(TEXTS.acorn)
    expect(acorn.examine(game.state)).toBe(TEXTS.acorn)
    game.state.currentRoom = game.state.allRooms.ForestEntrance
    expect(acorn.pickedUp(game.state)).toBe(
      'It is warm in your palm. The forest sprites go quiet, all at once, ' +
        'and watch you put it away.',
    )
    const idle =
      'The [item_name]acorn[/item_name] lies warm and still in your hand.'
    expect(acorn.use(game.state)).toBe(idle)
    game.state.currentRoom = game.state.allRooms.MainSquare
    expect(acorn.use(game.state)).toBe(idle)
  })
})

describe('Act2.afterLoad', () => {
  it('gives older saves the new wording of the altar, charms, acorn and gifts', () => {
    const game = new Game([new Act2()])
    const gifts = [
      new DruidicCharm(),
      new ProtectiveCharm(),
      new NaturesCharm(),
      new EnchantedAcorn(),
      new NyxToken(),
      new ForestHeartCrystal(),
    ]
    const fresh = gifts.map((item) => item.description)
    for (const item of gifts) item.description = 'old text'
    game.state.inventory.push(...gifts)
    const altar = game.state.allRooms.HeartOfTheForest.items.find(
      (item) => item instanceof OfferingAltar,
    )
    if (!altar) throw new Error('the altar is missing')
    altar.description = 'old text'

    new Act2().afterLoad(game.state)

    expect(gifts.map((item) => item.description)).toEqual(fresh)
    expect(altar.description).toContain('Three hollows are carved')
  })
})
