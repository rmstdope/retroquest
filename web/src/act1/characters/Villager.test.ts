import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { Act1 } from '../Act1'
import { Villager } from './Villager'
import { FLAG_VILLAGER_TALKED_TO, VIRTUE_TRUTH } from '../Act1StoryFlags'
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

  it('carries the amulet and the mill in her cloaked-stranger rumour, second in her cycle of six', () => {
    const villager = gameInSquare().state.currentRoom.characters.find(
      (c) => c instanceof Villager,
    ) as Villager

    expect(villager.dialogueOptions).toHaveLength(6)
    expect(villager.dialogueOptions[1]).toBe(
      'Last night, someone spotted a cloaked stranger near the old well, asking after ' +
        'an old amulet, from a family that left. Nobody would tell him a thing, ' +
        'and he took the road to the mill.',
    )
  })

  it('uses Malakar as a village byword in her third rumour, the way a bogeyman is named', () => {
    const villager = gameInSquare().state.currentRoom.characters.find(
      (c) => c instanceof Villager,
    ) as Villager

    expect(villager.dialogueOptions[2]).toBe(
      "The animals are restless. My neighbor's dog howled at nothing for hours, and the " +
        'chickens refuse to leave their coop after dusk. ' +
        "Malakar's weather, my mother would have called it, and knocked on wood.",
    )
  })

  it('tells the current second rumour after loading a save that holds the old one', () => {
    const game = gameInSquare()
    const villager = game.state.currentRoom.characters.find(
      (c) => c instanceof Villager,
    ) as Villager
    villager.dialogueOptions[1] = 'Folks say he vanished when the moon went.'
    villager.dialogueIndex = 1
    const fresh = new Game([new Act1()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
    const loaded = fresh.state.allRooms.VillageSquare.characters.find(
      (c) => c instanceof Villager,
    ) as Villager

    expect(loaded.dialogueOptions[1]).toContain('asking after an old amulet')
    expect(loaded.dialogueIndex).toBe(1)
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
    expectDialogueSpeaker(loaded.commandParser.parse('talk to tilda'), 'Tilda')
  })

  it('asks whether Elior cleaned the well, once, then goes back to her rumours', () => {
    const game = gameInSquare()
    const well = game.state.allRooms.VillageWell.items.find(
      (item) => item instanceof Well,
    ) as Well
    well.isPurified = true

    const first = game.commandParser.parse('talk to villager')
    const second = game.commandParser.parse('talk to villager')

    expect(first).toContain("The water's clean! Was that you, ")
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

/** An Act I game in the square with the well purified and Tilda already asked. */
function gameWhereTildaHasAsked(): Game {
  const game = gameInSquare()
  const well = game.state.allRooms.VillageWell.items.find(
    (item) => item instanceof Well,
  ) as Well
  well.isPurified = true
  game.commandParser.parse('talk to tilda')
  return game
}

const REMEMBERED_TRUTH = '[event]✦ Truth — this will be remembered[/event]'

describe('Tilda and the truth about the well', () => {
  it('asks her rewritten question, leaving open who cleaned the well', () => {
    const game = gameInSquare()
    const well = game.state.allRooms.VillageWell.items.find(
      (item) => item instanceof Well,
    ) as Well
    well.isPurified = true

    const answer = game.commandParser.parse('talk to tilda')

    expect(answer).toContain(
      "The water's clean! Was that you, [character_name]Elior[/character_name]? " +
        "No — don't tell me, you've that look about you. " +
        "I've not had dough rise so light in a year.",
    )
    expect(answer).not.toContain("word's all round the square")
  })

  it('takes the truth: her reply, then the remembered line, and records it', () => {
    const game = gameWhereTildaHasAsked()

    const answer = game.commandParser.parse('say truth to tilda')

    expect(answer).toContain(
      'You tell [character_name]Tilda[/character_name] it was you: ' +
        'a spell, and a little help from the healer.',
    )
    expect(answer).toContain("I'll not tell a soul if you'd rather I didn't.")
    expect(answer.indexOf(REMEMBERED_TRUTH)).toBeGreaterThan(
      answer.indexOf("I'll not tell a soul"),
    )
    expect(game.state.hasVirtue(VIRTUE_TRUTH)).toBe(true)
    expect(findMarkupProblems(answer)).toEqual([])
    expectDialogueSpeaker(answer, 'Tilda')
  })

  it('says "secret\'s safe" the second time, with no second remembered line', () => {
    const game = gameWhereTildaHasAsked()
    game.commandParser.parse('say truth to tilda')

    const answer = game.commandParser.parse('say truth to tilda')

    expect(answer).toContain(
      "I know, love. Your secret's safe with me, and so's your loaf.",
    )
    expect(answer).not.toContain('remembered')
    expect(game.state.virtues.filter((v) => v === VIRTUE_TRUTH)).toHaveLength(1)
  })

  it('has lost her when the truth comes before she has asked, and records nothing', () => {
    const game = gameInSquare()

    const answer = game.commandParser.parse('say truth to tilda')

    expect(answer).toContain("The truth about what, love? You've lost me.")
    expect(game.state.hasVirtue(VIRTUE_TRUTH)).toBe(false)
  })

  it('has lost her too when the well is clean but she has not asked yet', () => {
    const game = gameInSquare()
    const well = game.state.allRooms.VillageWell.items.find(
      (item) => item instanceof Well,
    ) as Well
    well.isPurified = true

    expect(game.commandParser.parse('say truth to tilda')).toContain(
      "You've lost me.",
    )
    expect(game.state.hasVirtue(VIRTUE_TRUTH)).toBe(false)
  })

  it('credits the spring once when Elior says nothing, then goes back to rumours', () => {
    const game = gameWhereTildaHasAsked()

    const spring = game.commandParser.parse('talk to tilda')
    const next = game.commandParser.parse('talk to tilda')

    expect(spring).toContain(
      "Not a word, eh? Then it'll be the old spring clearing itself, " +
        'like my gran always said it would. Funny old world.',
    )
    expect(next).not.toContain('old spring clearing itself')
    expect(next).toContain('Have you seen the fields?')
  })

  it('still takes the truth after her spring line', () => {
    const game = gameWhereTildaHasAsked()
    game.commandParser.parse('talk to tilda')

    const answer = game.commandParser.parse('say truth to tilda')

    expect(answer).toContain(REMEMBERED_TRUTH)
    expect(game.state.hasVirtue(VIRTUE_TRUTH)).toBe(true)
  })

  it('never says the spring line once the truth is told', () => {
    const game = gameWhereTildaHasAsked()
    game.commandParser.parse('say truth to tilda')

    const answer = game.commandParser.parse('talk to tilda')

    expect(answer).not.toContain('spring clearing itself')
    expect(answer).toContain('Have you seen the fields?')
  })

  it('answers other words as before', () => {
    const game = gameWhereTildaHasAsked()

    expect(game.commandParser.parse('say hello to tilda')).toContain(
      "don't seem to understand",
    )
  })

  it('keeps her farewell when Elior carries the amulet', () => {
    const game = gameWhereTildaHasAsked()
    game.state.addItemToInventory(new AncientAmulet())

    expect(game.commandParser.parse('talk to tilda')).toContain(
      "you're leaving, aren't you?",
    )
  })
})

describe('Tilda and the king', () => {
  it('tells, last in her cycle of six, that the king is ill and the flour cart has stopped', () => {
    const villager = gameInSquare().state.currentRoom.characters.find(
      (c) => c instanceof Villager,
    ) as Villager

    expect(villager.dialogueOptions).toHaveLength(6)
    expect(villager.dialogueOptions[5]).toContain(
      "the king's taken to his bed in Greendale",
    )
    expect(villager.dialogueOptions[5]).toContain('the flour cart')
  })
})

describe('Tilda and the chapel bell', () => {
  it('remembers the bell ringing years back, with no hand on the rope, not lately', () => {
    const villager = gameInSquare().state.currentRoom.characters.find(
      (c) => c instanceof Villager,
    ) as Villager
    const bell = villager.dialogueOptions.find((rumour) =>
      rumour.includes('chapel bell'),
    )

    expect(bell).toContain('Years back, at midnight, with no hand on the rope.')
    expect(bell).not.toContain('rang by itself at midnight.')
  })
})
