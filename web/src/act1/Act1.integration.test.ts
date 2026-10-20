import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from './Act1'
import { ACT1_GOLDEN_PATH } from './Act1GoldenPath'
import { MysteriousBox } from './items/MysteriousBox'
import {
  executeCommands,
  expectCharacterInRoom,
  expectCurrentRoom,
  expectItemInInventory,
  expectItemInRoom,
  expectQuests,
  expectSpellKnown,
  expectStoryFlag,
} from '@/testing/gameHelpers'

const MAIN = 'Shadows Over Willowbrook'

describe('Act 1 golden path', () => {
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
    executeCommands(game, ['take bread', 'talk to grandmother'])
    expectSpellKnown(state, 'revive', false)
    expectItemInInventory(state, 'bread')
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
    expect(state.isQuestCompleted('The Faded Photograph')).toBe(true)

    // Step 2: Vegetable Field
    executeCommands(game, ['go south', 'take rusty hoe'])
    expectQuests(state, [MAIN, 'Magic for real', 'Know your village'])
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

    // Step 7: Vegetable Field
    executeCommands(game, ['go west', 'go west', 'use hoe'])
    expectCurrentRoom(state, 'Vegetable Field')
    expectItemInInventory(state, 'coin')

    // Step 7.5: Mira's Hut for encouragement and hints
    executeCommands(game, ['go north', 'go east', 'go north'])
    expectCurrentRoom(state, "Mira's Hut")
    expectCharacterInRoom(room(), 'mira')
    executeCommands(game, ['talk to mira'])
    expectQuests(state, [MAIN, 'Magic for real', 'Know your village'])

    // Step 8: General Store - buy rope
    executeCommands(game, ['go south', 'go east'])
    expectCurrentRoom(state, 'General Store')
    executeCommands(game, ['take apple', 'take rope', 'take matches'])
    expectItemInInventory(state, 'apple', false)
    expectItemInInventory(state, 'rope', false)
    expectItemInInventory(state, 'matches', false)
    executeCommands(game, ['talk to shopkeeper', 'buy rope from shopkeeper'])
    expectItemInInventory(state, 'apple')
    expectItemInInventory(state, 'rope')
    expectItemInInventory(state, 'coin', false)

    // Step 9: Abandoned Shed - use key
    executeCommands(game, ['go south', 'go west', 'go south'])
    expectQuests(state, [
      MAIN,
      'Magic for real',
      'Know your village',
      'Curiosity killed the cat',
    ])
    expectCurrentRoom(state, 'Abandoned Shed')
    expectItemInRoom(room(), 'mysterious box', false)

    executeCommands(game, ['search'])
    expectItemInRoom(room(), 'fishing rod', false)
    expectItemInRoom(room(), 'magnet', false)

    expectQuests(state, [
      MAIN,
      'Magic for real',
      'Know your village',
      'Curiosity killed the cat',
    ])
    executeCommands(game, ['use key with door'])
    expectQuests(state, [MAIN, 'Magic for real', 'Know your village'])
    expectItemInInventory(state, 'key', false)
    expectItemInRoom(room(), 'mysterious box')

    executeCommands(game, ['search'])
    expectItemInRoom(room(), 'fishing rod')
    expectItemInRoom(room(), 'magnet')

    executeCommands(game, ['take fishing rod', 'take magnet'])
    expectItemInInventory(state, 'fishing rod')
    expectItemInRoom(room(), 'fishing rod', false)
    expectItemInInventory(state, 'magnet')
    expectItemInRoom(room(), 'magnet', false)

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
    expectQuests(state, [MAIN, 'Magic for real', 'Know your village'])
    executeCommands(game, ['give millstone fragment to blacksmith'])
    expectItemInInventory(state, 'millstone fragment', false)
    expectQuests(state, [
      MAIN,
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
      'Magic for real',
      'Know your village',
      'Oh deer, oh deer',
      'Fishing expedition',
    ])
    executeCommands(game, ['use fishing rod with river'])
    expectItemInInventory(state, 'fish')
    expectQuests(state, [
      MAIN,
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
    expectItemInInventory(state, 'sharp knife', false)
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

  it('survives a save and load round-trip at the end', () => {
    const game = new Game([new Act1()])
    game.commandParser.parse('cheat act 1')
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

describe('cheat act 1', () => {
  it('completes every side quest and leaves only the main quest active', () => {
    const act = new Act1()
    const game = new Game([act])
    const expectedSideQuests = act.quests
      .filter((q) => !q.isMain())
      .map((q) => q.name)
      .sort()

    game.commandParser.parse('cheat act 1')
    while (game.state.nextActivatedQuest()) {
      // drain
    }
    while (game.state.nextUpdatedQuest()) {
      // drain
    }
    while (game.state.nextCompletedQuest()) {
      // drain
    }

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
    viaCheat.commandParser.parse('cheat act 1')
    expect(viaCheat.state.storyFlags).toEqual(viaPath.state.storyFlags)
    expect(viaCheat.state.currentRoom.name).toBe(viaPath.state.currentRoom.name)
  })
})
