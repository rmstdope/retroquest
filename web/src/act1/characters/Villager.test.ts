import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { Act1 } from '../Act1'
import { Villager } from './Villager'
import { FLAG_VILLAGER_TALKED_TO } from '../Act1StoryFlags'
import { AncientAmulet } from '../items/AncientAmulet'
import { Well } from '../items/Well'
import { expectDialogueSpeaker } from '@/testing/gameHelpers'

/** An Act I game with Elior standing in the Village Square. */
function gameInSquare(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.VillageSquare
  return game
}

describe('Villager dialogue markup', () => {
  it('shows each rumour as well-formed dialogue spoken by Tilda', () => {
    const game = gameInSquare()
    const villager = game.state.currentRoom.characters.find(
      (c) => c instanceof Villager,
    ) as Villager
    const rumours = villager.dialogueOptions
    for (let i = 0; i < rumours.length + 1; i++) {
      const answer = game.commandParser.parse('talk to villager')
      expect(answer).toContain(rumours[i % rumours.length])
      expectDialogueSpeaker(answer, 'Tilda')
      expect(findMarkupProblems(answer)).toEqual([])
    }
  })

  it('carries the amulet and the mill in her cloaked-stranger rumour, second in her cycle of five', () => {
    const villager = gameInSquare().state.currentRoom.characters.find(
      (c) => c instanceof Villager,
    ) as Villager

    expect(villager.dialogueOptions).toHaveLength(5)
    expect(villager.dialogueOptions[1]).toBe(
      'Last night, someone spotted a cloaked stranger near the old well, asking after ' +
        'an old amulet, from a family that left. Nobody would tell him a thing, ' +
        'and he took the road to the mill.',
    )
  })

  it('records that a villager has been talked to', () => {
    const game = gameInSquare()
    game.commandParser.parse('talk to villager')
    expect(game.state.getStoryFlag(FLAG_VILLAGER_TALKED_TO)).toBe(true)
  })
})

describe('Tilda, the baker’s wife', () => {
  it('answers to her name as well as to villager', () => {
    const game = gameInSquare()

    const answer = game.commandParser.parse('talk to tilda')

    expect(answer).toContain("the baker's wife")
    expectDialogueSpeaker(answer, 'Tilda')
    expect(game.state.getStoryFlag(FLAG_VILLAGER_TALKED_TO)).toBe(true)
  })

  it('is called Tilda after loading a save made while she was called villager', () => {
    const game = gameInSquare()
    const old = game.state.currentRoom.characters.find(
      (c) => c instanceof Villager,
    ) as Villager
    old.name = 'villager'

    const loaded = new Game([new Act1()])
    loaded.loadSaveData(game.toSaveData())

    expect(loaded.state.currentRoom.characters.map((c) => c.name)).toContain(
      'Tilda',
    )
    expect(loaded.commandParser.parse('talk to tilda')).toContain(
      "the baker's wife",
    )
  })

  it('asks whether Elior cleaned the well, once, then goes back to her rumours', () => {
    const game = gameInSquare()
    const well = game.state.allRooms.VillageWell.items.find(
      (item) => item instanceof Well,
    ) as Well
    well.isPurified = true

    const first = game.commandParser.parse('talk to villager')
    const second = game.commandParser.parse('talk to villager')

    expect(first).toContain("The water's clean! Was that you?")
    expectDialogueSpeaker(first, 'Tilda')
    expect(findMarkupProblems(first)).toEqual([])
    expect(second).not.toContain("The water's clean!")
  })

  it('sees the amulet and knows Elior is leaving', () => {
    const game = gameInSquare()
    game.state.addItemToInventory(new AncientAmulet())

    const answer = game.commandParser.parse('talk to tilda')

    expect(answer).toContain("you're leaving, aren't you?")
    expectDialogueSpeaker(answer, 'Tilda')
    expect(findMarkupProblems(answer)).toEqual([])
  })
})
