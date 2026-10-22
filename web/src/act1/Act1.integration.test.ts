import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from './Act1'
import { playDebugScript } from '@/utils/debugScript'
import { ACT1_GOLDEN_PATH } from './Act1GoldenPath'
import { MysteriousBox } from './items/MysteriousBox'
import { FreshBread } from './items/FreshBread'
import { VIRTUE_MERCY, VIRTUE_SELFLESS, VIRTUE_TRUTH } from './Act1StoryFlags'
import {
  executeCommands,
  expectMarkupWellFormed,
  expectCharacterInRoom,
  expectCurrentRoom,
  expectItemInInventory,
  expectItemInRoom,
  expectQuestCompleted,
  expectQuests,
  expectSpellKnown,
  expectStoryFlag,
} from '@/testing/gameHelpers'

const MAIN = 'Shadows Over Willowbrook'
const PHOTO = 'The Faded Photograph'
const CAT = 'Curiosity killed the cat'

describe('Act 1 golden path', () => {
  it('carries only the watered field into later acts', () => {
    expect(new Act1().carriedFlags()).toEqual(['vegetable_field_watered'])
  })

  it('can be completed from start to finish', () => {
    const game = new Game([new Act1()])
    const state = game.state
    const room = () => state.currentRoom
    executeCommands(game, ['look'])

    // Step 1: Elior's Cottage
    expectQuests(state, [MAIN, 'Hint of Magic'])
    expectItemInRoom(room(), 'bread', false)
    expectItemInRoom(room(), "Elior's Journal", false)
    executeCommands(game, ['use lantern'])
    expectItemInRoom(room(), 'bread')
    expectItemInRoom(room(), "Elior's Journal")
    executeCommands(game, ['take bread', 'take lantern', 'talk to grandmother'])
    expectSpellKnown(state, 'revive', false)
    expectItemInInventory(state, 'bread')
    expectItemInInventory(state, 'lantern (lit)')
    expectItemInRoom(room(), 'bread', false)
    expectQuests(state, [MAIN, 'Hint of Magic'])
    executeCommands(game, ['use journal', 'talk to grandmother'])
    expectSpellKnown(state, 'revive')
    expectQuests(state, [MAIN, 'Magic for real'])
    executeCommands(game, [
      'search',
      'take faded photograph',
      'examine faded photograph',
      'give faded photograph to grandmother',
    ])
    expect(state.isQuestCompleted(PHOTO)).toBe(false)

    // Step 2: Vegetable Field
    executeCommands(game, ['go south', 'take rusty hoe'])
    expectQuests(state, [MAIN, PHOTO, 'Magic for real', 'Know your village'])
    expectCurrentRoom(state, 'Vegetable Field')
    expectItemInInventory(state, 'rusty hoe')
    expectItemInRoom(room(), 'rusty hoe', false)

    executeCommands(game, ['use hoe', 'take knife', 'cast revive'])
    expectItemInInventory(state, 'coin')
    expectItemInInventory(state, 'dull knife')
    const inventoryAfterFirstHoeUse = state.inventory.length
    executeCommands(game, ['use hoe'])
    expect(state.inventory.length, 'using hoe again adds nothing').toBe(
      inventoryAfterFirstHoeUse,
    )

    // Step 3: Chicken Coop
    executeCommands(game, ['go south', 'use bread with chicken'])
    expectCurrentRoom(state, 'Chicken Coop')
    expectItemInInventory(state, 'bread', false)
    expectItemInRoom(room(), 'key')
    executeCommands(game, ['take key'])
    expectItemInInventory(state, 'key')
    executeCommands(game, ['take egg'])
    expectItemInInventory(state, 'egg')
    expectItemInRoom(room(), 'egg', false)

    // Step 4: Village Square
    executeCommands(game, ['go north', 'go north', 'go east'])
    expectCurrentRoom(state, 'Village Square')
    executeCommands(game, ['take bucket', 'talk to villager'])
    expectItemInInventory(state, 'bucket')

    // Step 5: Village Well
    executeCommands(game, ['go west', 'go south', 'go east'])
    expectCurrentRoom(state, 'Village Well')
    executeCommands(game, ['examine well', 'use bucket with well'])
    expectItemInInventory(state, 'bucket (full)')

    // Step 6: Blacksmith's Forge
    executeCommands(game, ['go east'])
    expectCurrentRoom(state, "Blacksmith's Forge")
    executeCommands(game, ['talk to blacksmith', 'give coin to blacksmith'])
    expectItemInInventory(state, 'coin', false)
    expectItemInInventory(state, 'dull knife', false)
    expectItemInInventory(state, 'sharp knife')

    // Step 7: Abandoned Shed - use key, find Patches
    executeCommands(game, ['go west', 'go south'])
    expectQuests(state, [
      MAIN,
      PHOTO,
      'Magic for real',
      'Know your village',
      CAT,
    ])
    expectCurrentRoom(state, 'Abandoned Shed')
    expectItemInRoom(room(), 'mysterious box', false)

    executeCommands(game, ['search'])
    expectItemInRoom(room(), 'fishing rod', false)
    expectItemInRoom(room(), 'magnet', false)

    executeCommands(game, ['use key with door'])
    expectItemInInventory(state, 'key', false)
    expectItemInRoom(room(), 'mysterious box')
    expectCharacterInRoom(room(), 'patches')
    expectQuests(state, [
      MAIN,
      PHOTO,
      'Magic for real',
      'Know your village',
      CAT,
    ])

    executeCommands(game, ['talk to patches'])
    expectCharacterInRoom(room(), 'patches', false)
    expectStoryFlag(state, 'patches_found', true)

    // The shed is dark: the lit lantern Elior carries lets him search it
    expect(executeCommands(game, ['search'])).toContain('lantern')
    expectItemInRoom(room(), 'fishing rod')
    expectItemInRoom(room(), 'magnet')

    executeCommands(game, ['take fishing rod', 'take magnet'])
    expectItemInInventory(state, 'fishing rod')
    expectItemInRoom(room(), 'fishing rod', false)
    expectItemInInventory(state, 'magnet')
    expectItemInRoom(room(), 'magnet', false)

    // Step 7.5: Mira's Hut for encouragement and hints
    executeCommands(game, [
      'go north',
      'go west',
      'go north',
      'go east',
      'go north',
    ])
    expectCurrentRoom(state, "Mira's Hut")
    expectCharacterInRoom(room(), 'mira')
    executeCommands(game, ['talk to mira'])
    expectQuests(state, [
      MAIN,
      PHOTO,
      'Magic for real',
      'Know your village',
      CAT,
    ])

    // Step 8: General Store - return Patches, buy rope
    executeCommands(game, ['go south', 'go east'])
    expectCurrentRoom(state, 'General Store')
    executeCommands(game, ['take apple', 'take rope', 'take matches'])
    expectItemInInventory(state, 'apple', false)
    expectItemInInventory(state, 'rope', false)
    expectItemInInventory(state, 'matches', false)
    executeCommands(game, ['talk to shopkeeper'])
    expectItemInInventory(state, 'coin')
    expectCharacterInRoom(room(), 'patches')
    expectQuestCompleted(state, CAT)
    expectQuests(state, [MAIN, PHOTO, 'Magic for real', 'Know your village'])
    executeCommands(game, ['buy rope from shopkeeper'])
    expectItemInInventory(state, 'apple')
    expectItemInInventory(state, 'rope')
    expectItemInInventory(state, 'coin', false)

    // Step 9: back past the Abandoned Shed
    executeCommands(game, ['go south', 'go west', 'go south'])
    expectCurrentRoom(state, 'Abandoned Shed')
    expectCharacterInRoom(room(), 'patches', false)

    // Step 10: Old Mill - use rope, take millstone fragment
    executeCommands(game, ['go south'])
    expectCurrentRoom(state, 'Old Mill')
    executeCommands(game, ['use rope with mechanism'])
    expectItemInInventory(state, 'rope', false)
    expectItemInRoom(room(), 'millstone fragment')
    executeCommands(game, ['take millstone fragment'])
    expectItemInInventory(state, 'millstone fragment')
    expectItemInRoom(room(), 'millstone fragment', false)

    // Step 11: back to the Blacksmith's Forge
    executeCommands(game, ['go north', 'go north', 'go east'])
    expectCurrentRoom(state, "Blacksmith's Forge")
    expectQuests(state, [MAIN, PHOTO, 'Magic for real', 'Know your village'])
    executeCommands(game, ['give millstone fragment to blacksmith'])
    expectItemInInventory(state, 'millstone fragment', false)
    expectQuests(state, [
      MAIN,
      PHOTO,
      'Magic for real',
      'Know your village',
      'Oh deer, oh deer',
    ])

    // Step 12: Riverbank
    executeCommands(game, ['go west', 'go south', 'go south', 'go east'])
    expectCurrentRoom(state, 'Riverbank')
    executeCommands(game, ['use fishing rod with river'])
    expectItemInInventory(state, 'fish', false)
    executeCommands(game, ['talk to fisherman'])
    expectQuests(state, [
      MAIN,
      PHOTO,
      'Magic for real',
      'Know your village',
      'Oh deer, oh deer',
      'Fishing expedition',
    ])
    executeCommands(game, ['use fishing rod with river'])
    expectItemInInventory(state, 'fish')
    expectQuests(state, [
      MAIN,
      PHOTO,
      'Magic for real',
      'Know your village',
      'Oh deer, oh deer',
      'Fishing expedition',
    ])
    executeCommands(game, ['give fish to fisherman'])
    expectItemInInventory(state, 'fish', false)
    expectSpellKnown(state, 'purify')
    expectQuests(state, [
      MAIN,
      PHOTO,
      'Magic for real',
      'Know your village',
      'Oh deer, oh deer',
    ])
    executeCommands(game, ['give faded photograph to fisherman'])
    expectStoryFlag(state, 'fisherman_told_of_tin', true)
    expectItemInRoom(room(), "mother's letter", false)
    executeCommands(game, ['search'])
    expectItemInRoom(room(), "mother's letter")
    executeCommands(game, ['take letter'])
    expectItemInInventory(state, "mother's letter")
    expectQuests(state, [
      MAIN,
      PHOTO,
      'Magic for real',
      'Know your village',
      'Oh deer, oh deer',
    ])
    executeCommands(game, ['examine letter'])
    expectQuestCompleted(state, PHOTO)
    expectQuests(state, [
      MAIN,
      'Magic for real',
      'Know your village',
      'Oh deer, oh deer',
    ])

    // Step 13: Forest Path
    executeCommands(game, ['go south'])
    expectCurrentRoom(state, 'Forest Path')
    expectItemInRoom(room(), 'vines')
    expectItemInRoom(room(), 'stick', false)
    expectItemInInventory(state, 'sharp knife')
    executeCommands(game, ['use sharp knife with vines'])
    expectItemInRoom(room(), 'vines', false)
    expectItemInInventory(state, 'sharp knife')
    expectItemInRoom(room(), 'stick')
    executeCommands(game, ['take stick'])
    expectItemInInventory(state, 'stick')
    expectItemInRoom(room(), 'stick', false)

    // Step 14: Hidden Glade
    executeCommands(game, ['go south'])
    expectCurrentRoom(state, 'Hidden Glade')
    expectCharacterInRoom(room(), 'deer', false)
    expectItemInRoom(room(), 'rare flower', false)
    expectQuests(state, [
      MAIN,
      'Magic for real',
      'Know your village',
      'Oh deer, oh deer',
    ])
    executeCommands(game, ['rest'])
    expectCharacterInRoom(room(), 'deer')
    expectItemInRoom(room(), 'rare flower')
    expectQuests(state, [MAIN, 'Magic for real', 'Know your village'])
    executeCommands(game, ['take rare flower'])
    expectItemInInventory(state, 'rare flower')
    expectItemInRoom(room(), 'rare flower', false)
    expectCharacterInRoom(room(), 'deer')

    // Step 15: Village Chapel (first visit, part 1)
    executeCommands(game, ['go south'])
    expectCurrentRoom(state, 'Village Chapel')
    expectItemInRoom(room(), 'candle')
    executeCommands(game, ['talk to priest'])
    expectQuests(state, [
      MAIN,
      'Magic for real',
      'Know your village',
      'Let there be light',
    ])

    // Step 16: General Store (matches)
    executeCommands(game, [
      'go north',
      'go north',
      'go north',
      'go west',
      'go north',
      'go north',
      'go east',
      'go north',
    ])
    expectCurrentRoom(state, 'General Store')
    expectItemInRoom(room(), 'matches')
    executeCommands(game, ['talk to shopkeeper'])
    expectItemInInventory(state, 'matches')
    expectItemInRoom(room(), 'matches', false)

    // Step 17: Village Chapel (first visit, part 2)
    executeCommands(game, [
      'go south',
      'go west',
      'go south',
      'go south',
      'go east',
      'go south',
      'go south',
      'go south',
    ])
    expectCurrentRoom(state, 'Village Chapel')
    expectItemInRoom(room(), 'locket', false)
    expectItemInInventory(state, 'matches')
    expectQuests(state, [
      MAIN,
      'Magic for real',
      'Know your village',
      'Let there be light',
    ])
    executeCommands(game, ['use candle with matches'])
    expectItemInRoom(room(), 'locket')
    expectQuests(state, [MAIN, 'Magic for real', 'Know your village'])
    executeCommands(game, ['take locket'])
    expectItemInInventory(state, 'locket')
    expectItemInRoom(room(), 'locket', false)
    expectSpellKnown(state, 'bless')

    // Step 18: back to Mira's Hut
    executeCommands(game, [
      'go north',
      'go north',
      'go north',
      'go west',
      'go north',
      'go north',
      'go east',
      'go north',
      'go west',
      'go north',
    ])
    expectCurrentRoom(state, "Mira's Hut")
    expectQuests(state, [MAIN, 'Magic for real', 'Know your village'])
    executeCommands(game, ['give rare flower to mira'])
    expectItemInInventory(state, 'rare flower', false)
    expectSpellKnown(state, 'heal')
    expectSpellKnown(state, 'unlock')
    expectSpellKnown(state, 'light')
    expectStoryFlag(state, 'magic_fully_unlocked', true)
    expectQuests(state, [MAIN, 'Know your village', 'Preparing for the road'])

    // Step 19: Abandoned Shed (second visit)
    executeCommands(game, [
      'go south',
      'go west',
      'go south',
      'go east',
      'go south',
    ])
    expectCurrentRoom(state, 'Abandoned Shed')
    expectItemInRoom(room(), 'mysterious box')
    const box = game.findItem('mysterious box', { inventory: false })
    expect(box, 'Mysterious Box in Abandoned Shed').toBeInstanceOf(
      MysteriousBox,
    )
    if (!(box instanceof MysteriousBox)) return
    expect(box.locked, 'box locked at first').toBe(true)
    executeCommands(game, ['cast unlock on mysterious box'])
    expect(box.locked, 'box unlocked by the spell').toBe(false)
    expectItemInRoom(room(), 'map', false)
    executeCommands(game, ['open mysterious box'])
    expectItemInInventory(state, 'map')
    expectItemInRoom(room(), 'map', false)

    // Step 20: back to the Vegetable Field
    executeCommands(game, ['go north', 'go west'])
    expectCurrentRoom(state, 'Vegetable Field')
    expectItemInRoom(room(), 'Withered carrot')
    executeCommands(game, ['cast revive on Withered carrot'])
    expectItemInRoom(room(), 'Withered carrot', false)
    expectItemInRoom(room(), 'Fresh Carrot')
    executeCommands(game, ['take carrot'])
    expectItemInInventory(state, 'fresh carrot')
    expectItemInRoom(room(), 'fresh carrot', false)

    // Step 21: Village Well, the shiny ring
    executeCommands(game, ['go east'])
    expectCurrentRoom(state, 'Village Well')
    expectItemInInventory(state, 'fishing rod')
    expectItemInInventory(state, 'magnet')
    expectItemInInventory(state, 'stick')
    executeCommands(game, ['use fishing rod with magnet'])
    expectItemInInventory(state, 'fishing rod', false)
    expectItemInInventory(state, 'magnet', false)
    expectItemInInventory(state, 'magnetic fishing rod')
    expectQuests(state, [
      MAIN,
      'Know your village',
      'Preparing for the road',
      'Magnet fishing expedition',
    ])
    executeCommands(game, ['use magnetic fishing rod with stick'])
    expectItemInInventory(state, 'magnetic fishing rod', false)
    expectItemInInventory(state, 'stick', false)
    expectItemInInventory(state, 'extended magnetic fishing rod')
    executeCommands(game, ['use extended magnetic fishing rod with well'])
    expectItemInInventory(state, 'shiny ring', false)
    expectItemInInventory(state, 'extended magnetic fishing rod')
    expectQuests(state, [
      MAIN,
      'Know your village',
      'Magnet fishing expedition',
      'Preparing for the road',
    ])
    executeCommands(game, [
      'cast purify on well',
      'use extended magnetic fishing rod with well',
    ])
    expectItemInInventory(state, 'shiny ring')
    expectItemInInventory(state, 'extended magnetic fishing rod', false)
    expectItemInInventory(state, 'rune token')
    expectStoryFlag(state, 'found_rune_token', true)
    expectQuests(state, [MAIN, 'Know your village', 'Preparing for the road'])

    // Step 22: Hidden Glade (second visit)
    executeCommands(game, [
      'go south',
      'go south',
      'go east',
      'go south',
      'go south',
    ])
    expectCurrentRoom(state, 'Hidden Glade')
    executeCommands(game, ['cast light'])
    expectSpellKnown(state, 'grow')

    // Step 23: Forest Path
    executeCommands(game, ['go north'])
    expectCurrentRoom(state, 'Forest Path')
    expectItemInRoom(room(), 'wild berries', false)
    executeCommands(game, ['cast grow on bush'])
    expectItemInRoom(room(), 'wild berries')
    executeCommands(game, ['take wild berries'])
    expectItemInInventory(state, 'wild berries')
    expectItemInRoom(room(), 'wild berries', false)

    // Step 24: Elior's Cottage
    executeCommands(game, [
      'go north',
      'go west',
      'go north',
      'go north',
      'go west',
      'go north',
    ])
    expectCurrentRoom(state, "Elior's Cottage")
    expectItemInInventory(state, 'locket')
    executeCommands(game, ['give locket to grandmother'])
    expectItemInInventory(state, 'locket', false)
    expectItemInInventory(state, 'travel cloak')

    // Step 25: Village Chapel (prepare for the journey)
    executeCommands(game, [
      'go south',
      'go east',
      'go south',
      'go south',
      'go east',
      'go south',
      'go south',
      'go south',
    ])
    expectCurrentRoom(state, 'Village Chapel')
    executeCommands(game, ['cast bless'])
    expectStoryFlag(state, 'journey_bless_completed', true)

    // Step 26: Road to Greendale
    expectQuests(state, [MAIN, 'Know your village', 'Preparing for the road'])
    executeCommands(game, ['go east'])
    expectQuests(state, [MAIN, 'Preparing for the road'])
    expectCurrentRoom(state, 'Road to Greendale')
    expectItemInInventory(state, 'shiny ring')
    executeCommands(game, ['give shiny ring to merchant'])
    expectItemInInventory(state, 'shiny ring', false)
    expectItemInInventory(state, 'wandering boots')
    expectQuests(state, [MAIN])

    // Step 27: Mira's Hut (final visit)
    executeCommands(game, [
      'go west',
      'go north',
      'go north',
      'go north',
      'go west',
      'go north',
      'go north',
      'go west',
      'go north',
      'go east',
      'go north',
    ])
    expectCurrentRoom(state, "Mira's Hut")
    for (const name of [
      'travel cloak',
      'wild berries',
      'apple',
      'egg',
      'fresh carrot',
      'wandering boots',
      'map',
    ]) {
      expectItemInInventory(state, name)
    }
    for (const spell of [
      'revive',
      'purify',
      'bless',
      'heal',
      'unlock',
      'light',
      'grow',
    ]) {
      expectSpellKnown(state, spell)
    }
    expectStoryFlag(state, 'journey_bless_completed', true)
    executeCommands(game, ['give rune token to mira'])
    expectStoryFlag(state, 'mira_named_fouling_sigil', true)
    expectItemInInventory(state, 'rune token')
    executeCommands(game, ['talk to mira'])
    expectItemInInventory(state, 'ancient amulet')

    // Step 28: Road to Greendale (departure)
    executeCommands(game, [
      'go south',
      'go west',
      'go south',
      'go east',
      'go south',
      'go south',
      'go east',
      'go south',
      'go south',
      'go south',
      'go east',
    ])
    expectCurrentRoom(state, 'Road to Greendale')
    expectItemInInventory(state, 'map')
    expectItemInInventory(state, 'ancient amulet')
    executeCommands(game, ['use map'])
    expect(
      game.acts[game.currentAct].isCompleted(state),
      'Act I completed',
    ).toBe(true)
  })

  it('ends on the hook, on the farewell and on the complete page, also after a load', () => {
    const hook =
      "The amulet was your parents'. And someone has come to Willowbrook looking for it."
    const game = new Game([new Act1()])
    game.newTurn()
    game.newTurn()
    game.handleInput('cheat act 1')
    game.newTurn()
    game.handleInput('use map')
    const answer = game.getResultText()
    expect(answer).toContain('Aren')
    expect(answer).toContain(
      "You tuck your parents' amulet beneath your mother's cloak, and set forth.",
    )
    game.newTurn()
    expect(game.isGameOver()).toBe(true)
    expect(game.getActCompleteText()).toMatch(
      new RegExp(`^${hook}\\n\\nCongratulations — you have completed Act 1`),
    )
    const fresh = new Game([new Act1()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
    // A loaded, finished act shows its complete page on the next turn.
    for (let turn = 0; turn < 3; turn++) fresh.newTurn()
    expect(fresh.getActCompleteText()).toBe(game.getActCompleteText())
  })

  it('survives a save and load round-trip at the end', () => {
    const game = new Game([new Act1()])
    expectMarkupWellFormed(game.commandParser.parse('cheat act 1'))
    const data = game.toSaveData()
    const fresh = new Game([new Act1()])
    expect(fresh.loadSaveData(data)).toContain('loaded')
    expect(fresh.state.currentRoom.name).toBe(game.state.currentRoom.name)
    expect(fresh.state.inventory.map((i) => i.name)).toEqual(
      game.state.inventory.map((i) => i.name),
    )
    expect(fresh.state.storyFlags).toEqual(game.state.storyFlags)
  })
})

describe('Act 1 optional watering of the Vegetable Field', () => {
  it('lets Elior refill the bucket from the purified well and revive the field', () => {
    const game = new Game([new Act1()])
    const ringFished = ACT1_GOLDEN_PATH.lastIndexOf(
      'use extended magnetic fishing rod with well',
    )
    executeCommands(game, ACT1_GOLDEN_PATH.slice(0, ringFished + 1))
    expectCurrentRoom(game.state, 'Village Well')

    executeCommands(game, ['use bucket with well', 'go west', 'use bucket'])

    expectStoryFlag(game.state, 'vegetable_field_watered', true)
    expect(game.state.currentRoom.description).toContain('green crops')
    expect(game.state.getQuest(MAIN)?.description).toContain(
      '[room_name]Vegetable Field[/room_name] back to life',
    )
  })
})

describe('Act 1 with the alternative choices', () => {
  /**
   * The golden path, but Elior keeps his mother's ring (trading the forge's
   * horseshoe for the boots) and lets Patches stay with grandmother.
   */
  function alternativePath(): string[] {
    const path = [...ACT1_GOLDEN_PATH]
    path.splice(path.indexOf('talk to blacksmith') + 1, 0, 'take horseshoe')
    // From the shed: north to the well, west to the field, north to the cottage.
    const home = path.indexOf('talk to patches') + 6
    expect(path[home]).toBe('go north')
    path.splice(home + 1, 0, 'say stay to grandmother')
    path.splice(path.indexOf('buy rope from shopkeeper'), 1)
    path[path.indexOf('give shiny ring to merchant')] =
      'give horseshoe to merchant'
    return path
  }

  it('can be completed with the ring kept and Patches staying home', () => {
    const game = new Game([new Act1()])
    const state = game.state
    executeCommands(game, alternativePath())
    expectStoryFlag(state, 'kept_mothers_ring', true)
    expectStoryFlag(state, 'patches_stayed_with_grandmother', true)
    expectStoryFlag(state, 'patches_returned', false)
    expectQuestCompleted(state, CAT)
    expectItemInInventory(state, 'shiny ring')
    expectItemInInventory(state, 'wandering boots')
    expectCurrentRoom(state, 'Road to Greendale')

    const farewell = executeCommands(game, ['use map'])
    expect(farewell).toContain('you kept her ring')
    expect(farewell).toContain('claimed your pillow')
    expect(
      game.acts[game.currentAct].isCompleted(state),
      'Act I completed',
    ).toBe(true)
  })

  it('keeps the choices through a save and load round-trip', () => {
    const game = new Game([new Act1()])
    executeCommands(game, alternativePath())
    const fresh = new Game([new Act1()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
    const farewell = executeCommands(fresh, ['use map'])
    expect(farewell).toContain('you kept her ring')
    expect(farewell).toContain('claimed your pillow')
  })
})

describe('Act 1 with the optional virtue moments', () => {
  /** The golden path with the fox kit freed right after the vines are cut. */
  function pathWithKit(): string[] {
    const path = [...ACT1_GOLDEN_PATH]
    path.splice(
      path.indexOf('use sharp knife with vines') + 1,
      0,
      'use sharp knife with snare',
    )
    return path
  }

  /** Play the path with all three moments, and return the game, on the Road. */
  function gameWithAllThree(): Game {
    const game = new Game([new Act1()])
    const path = pathWithKit()
    const purified = path.lastIndexOf('cast purify on well')
    executeCommands(game, path.slice(0, purified + 1))
    // Tilda asks about the clean well, then Elior tells her the truth.
    const well = game.state.currentRoom
    game.state.currentRoom = game.state.allRooms.VillageSquare
    executeCommands(game, ['talk to tilda', 'say truth to tilda'])
    game.state.currentRoom = well
    executeCommands(game, path.slice(purified + 1))
    // Grandmother's loaf is off the golden path; Elior carries it here.
    game.state.addItemToInventory(new FreshBread())
    executeCommands(game, ['give fresh bread to merchant'])
    return game
  }

  it('records mercy, truth and selflessness without changing the golden path', () => {
    const game = gameWithAllThree()

    expect(game.state.virtues.sort()).toEqual(
      [VIRTUE_MERCY, VIRTUE_SELFLESS, VIRTUE_TRUTH].sort(),
    )
    expectCurrentRoom(game.state, 'Road to Greendale')
    executeCommands(game, ['use map'])
    expect(
      game.acts[game.currentAct].isCompleted(game.state),
      'Act I completed',
    ).toBe(true)
  })

  it('keeps the record through a save and load, and shows nothing again', () => {
    const game = gameWithAllThree()
    const fresh = new Game([new Act1()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')

    expect(fresh.state.virtues.sort()).toEqual(game.state.virtues.sort())
    expect(executeCommands(fresh, ['talk to merchant'])).not.toContain(
      'remembered',
    )
    expect(executeCommands(fresh, ['talk to merchant'])).not.toContain(
      'Forgive me',
    )
  })

  it('records nothing when every moment is skipped, and the act still completes', () => {
    const game = new Game([new Act1()])
    executeCommands(game, ACT1_GOLDEN_PATH)

    expect(game.state.virtues).toEqual([])
    expect(executeCommands(game, ['talk to merchant'])).toContain(
      "Forgive me if I'm short, friend.",
    )
    executeCommands(game, ['use map'])
    expect(
      game.acts[game.currentAct].isCompleted(game.state),
      'Act I completed',
    ).toBe(true)
  })
})

describe('cheat act 1', () => {
  it('completes every side quest and leaves only the main quest active', () => {
    const act = new Act1()
    const game = new Game([act])
    const expectedSideQuests = act.quests
      .filter((q) => !q.isMain())
      .map((q) => q.name)
      .sort()

    expectMarkupWellFormed(game.commandParser.parse('cheat act 1'))
    game.state.settleQuests()

    const activeMain = game.state.activatedQuests
      .filter((q) => q.isMain())
      .map((q) => q.name)
    const activeSide = game.state.activatedQuests
      .filter((q) => !q.isMain())
      .map((q) => q.name)
    expect(activeMain).toEqual([MAIN])
    expect(activeSide).toEqual([])
    const completedSide = game.state.completedQuests
      .filter((q) => !q.isMain())
      .map((q) => q.name)
      .sort()
    expect(completedSide).toEqual(expectedSideQuests)
  })
})

describe('Act 1 golden path as declared by the act', () => {
  it('is what cheat act 1 plays', () => {
    const viaPath = new Game([new Act1()])
    executeCommands(viaPath, ACT1_GOLDEN_PATH)
    const viaCheat = new Game([new Act1()])
    executeCommands(viaCheat, ['cheat act 1'])
    expect(viaCheat.state.storyFlags).toEqual(viaPath.state.storyFlags)
    expect(viaCheat.state.currentRoom.name).toBe(viaPath.state.currentRoom.name)
  })
})

describe('debug act1', () => {
  it('plays the golden path, up to its last command, which completes the act', async () => {
    const game = new Game([new Act1()])
    const shown: string[] = []
    await playDebugScript('act1', {
      play: (command) => executeCommands(game, [command]),
      running: () => true,
      show: (text) => shown.push(text),
      goldenPath: (n) => game.goldenPath(n),
    })
    expect(shown.join('\n')).not.toContain('[failure]')
    expect(game.state.currentRoom.name).toBe('Road to Greendale')
    const act = game.acts[game.currentAct]
    expect(act.isCompleted(game.state)).toBe(false)

    executeCommands(game, ['use map'])
    expect(act.isCompleted(game.state)).toBe(true)
  })
})
