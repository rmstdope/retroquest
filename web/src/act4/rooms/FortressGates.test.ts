import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_BARRIERS_DISABLED,
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED,
  FLAG_ACT4_WHISPERS_MIRA_NAMED,
} from '../Act4StoryFlags'
import { WardStoneFragment } from '../items/WardStoneFragment'
import { FortressGates } from './FortressGates'
import {
  executeCommands,
  expectDialogueSpeaker,
  expectItemInInventory,
  expectQuestCompleted,
} from '@/testing/gameHelpers'

/** The fragment's answer to being picked up: it stays by the stone. */
const FRAGMENT_REFUSAL =
  'The cold of the fragment bites at your fingers, and you let it lie by the stone.'

/** Create an Act IV game standing at the Fortress Gates. */
function createGame(): Game {
  const act = new Act4()
  act.musicFile = ''
  return new Game([act])
}

/** The names of the items lying in the current room. */
function roomItems(game: Game): string[] {
  return game.state.currentRoom.items.map((item) => item.name)
}

describe('FortressGates', () => {
  it('starts with three stones and no fragment or chain on the ground', () => {
    const game = createGame()
    expect(game.state.currentRoom).toBeInstanceOf(FortressGates)
    const items = roomItems(game)
    expect(items).toEqual(
      expect.arrayContaining(['Left Stone', 'Middle Stone', 'Right Stone']),
    )
    expect(items).not.toContain('Ward Stone Fragment')
    expect(items).not.toContain("Guardian's Chain")
    expect(items).not.toContain("Guardian's Essence")
  })

  it('names the three stones in the arrival description', () => {
    const game = createGame()
    const text = game.state.currentRoom.descriptionFor(game.state)
    expect(text).toContain(
      'three ward stones, left, middle and right, swell and fade with it.',
    )
    expect(text).toContain('You stand just inside the fortress gates.')
    expect(text).not.toContain('malevolent')
  })

  it('shows the Warden sigil and Mira keeping the way out, before and after', () => {
    const game = createGame()
    const sigil =
      'On the arch behind you, under the black, an older carving shows through: a sun rising over three linked rings.'
    const mira =
      'Just inside the threshold [character_name]Mira[/character_name] keeps the way out, her back to the gatepost.'
    const before = game.state.currentRoom.descriptionFor(game.state)
    expect(before).toContain(sigil)
    expect(before).toContain(mira)
    executeCommands(game, ['cast light on right ward stone'])
    const after = game.state.currentRoom.descriptionFor(game.state)
    expect(after).toContain(
      'The ward stones are dark, and the violet wall is gone; the ways north and east lie open.',
    )
    expect(after).toContain(sigil)
    expect(after).toContain(mira)
    expect(after).not.toContain('Whispers of')
  })

  describe('before the gates fall', () => {
    it('names the odd stone when the ward stones are examined', () => {
      const game = createGame()
      const answer = executeCommands(game, ['examine ward stones'])
      expect(answer).toContain('the right stone brightens a breath after')
      expect(
        game.state.getStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED),
      ).toBe(true)
    })

    it('examines each stone on its own', () => {
      const game = createGame()
      expect(executeCommands(game, ['examine left stone'])).toContain(
        'The left stone swells and fades with the barrier, exactly on the beat.',
      )
      expect(executeCommands(game, ['examine middle ward stone'])).toContain(
        'The middle stone swells and fades with the barrier',
      )
      expect(executeCommands(game, ['examine right stone'])).toContain(
        'The right stone brightens a breath after the barrier does',
      )
    })

    it('refuses light on all the stones and light without a target', () => {
      const game = createGame()
      expect(executeCommands(game, ['cast light on ward stones'])).toContain(
        'They drink it together and keep their count.',
      )
      expect(executeCommands(game, ['cast light'])).toContain(
        'Your light falls on the guardians and slides off them.',
      )
      expect(game.state.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)).toBe(false)
      expect(
        game.state.getStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED),
      ).toBe(false)
      expect(
        executeCommands(game, ['cast light on ward stones']),
      ).not.toContain('You must')
    })

    it('answers light on a wrong stone and can be repeated', () => {
      const game = createGame()
      for (let i = 0; i < 2; i++) {
        expect(executeCommands(game, ['cast light on left stone'])).toContain(
          'The stone drinks your light and pulses brighter, and the ' +
            'guardians lean closer for a moment. The barrier keeps its rhythm.',
        )
      }
      expect(executeCommands(game, ['cast light on middle stone'])).toContain(
        'The stone drinks your light',
      )
      expect(game.state.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)).toBe(false)
      expect(
        game.state.getStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED),
      ).toBe(false)
    })

    it('throws the player back at the barrier and starts the guardians quest', () => {
      const game = createGame()
      const throwBack =
        'The violet wall throws you back. It swells and fades in time with ' +
        'the ward stones.'
      expect(executeCommands(game, ['go north'])).toContain(throwBack)
      expect(game.state.currentRoom.name).toBe('Fortress Gates')
      expect(game.state.activatedQuests.map((quest) => quest.name)).toContain(
        'Shattered Ward Guardians',
      )
      expect(executeCommands(game, ['go east'])).toContain(throwBack)
      expect(game.state.currentRoom.name).toBe('Fortress Gates')
    })
  })

  describe('light on the right stone', () => {
    it('solves everything in one cast, without examining first', () => {
      const game = createGame()
      const answer = executeCommands(game, ['cast light on right stone'])
      expect(answer).toContain(
        'Your light finds the right stone between its beats.',
      )
      expect(answer).toContain("guardian's essence[/item_name]")
      expect(answer).toContain(
        "They thin to smoke, and where they drifted lie the [item_name]guardian's chain[/item_name] that bound them and a small, steady light: the [item_name]guardian's essence[/item_name].",
      )
      expect(answer).not.toContain('are gone, and')
      expect(game.state.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)).toBe(true)
      expect(
        game.state.getStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_STARTED),
      ).toBe(true)
      expectQuestCompleted(game.state, 'Shattered Ward Guardians')
      expect(roomItems(game)).toEqual(
        expect.arrayContaining([
          'Ward Stone Fragment',
          "Guardian's Chain",
          "Guardian's Essence",
        ]),
      )
      const room = game.state.currentRoom
      expect(room.getExits(game.state)).toEqual({
        north: 'HallOfEchoes',
        east: 'OuterCourtyard',
      })
      expect(room.descriptionFor(game.state)).toContain(
        'The ward stones are dark, and the violet wall is gone',
      )
    })

    it('lets the player take the chain and essence, and leaves the fragment by the stone', () => {
      const game = createGame()
      executeCommands(game, ['cast light on right stone'])
      executeCommands(game, [
        "take guardian's chain",
        "take guardian's essence",
      ])
      expectItemInInventory(game.state, "Guardian's Chain", true)
      expectItemInInventory(game.state, "Guardian's Essence", true)
      expect(executeCommands(game, ['take ward stone fragment'])).toContain(
        FRAGMENT_REFUSAL,
      )
      expectItemInInventory(game.state, 'Ward Stone Fragment', false)
      expect(roomItems(game)).toContain('Ward Stone Fragment')
    })

    it('can still examine the fragment by the stone', () => {
      const game = createGame()
      executeCommands(game, ['cast light on right stone'])
      expect(executeCommands(game, ['examine ward stone fragment'])).toContain(
        'A jagged piece of the right ward stone, carved with half a rune.',
      )
    })

    it('leaves the fragment by the stone in a save from when it could be taken', () => {
      const game = createGame()
      executeCommands(game, ['cast light on right stone'])
      const lying = game.state.currentRoom.items.find(
        (item) => item instanceof WardStoneFragment,
      )
      if (!lying) throw new Error('The fragment did not fall')
      lying.canBeCarried = true
      const reloaded = new Game([new Act4()])
      reloaded.loadSaveData(game.toSaveData())
      expect(executeCommands(reloaded, ['take ward stone fragment'])).toContain(
        FRAGMENT_REFUSAL,
      )
      expectItemInInventory(reloaded.state, 'Ward Stone Fragment', false)
    })

    it('loads a save that already carries the fragment', () => {
      const game = createGame()
      executeCommands(game, ['cast light on right stone'])
      const room = game.state.currentRoom
      const carried = room.items.find(
        (item) => item instanceof WardStoneFragment,
      )
      if (!carried) throw new Error('The fragment did not fall')
      room.items = room.items.filter((item) => item !== carried)
      game.state.inventory.push(carried)
      const reloaded = new Game([new Act4()])
      reloaded.loadSaveData(game.toSaveData())
      expectItemInInventory(reloaded.state, 'Ward Stone Fragment', true)
      expect(
        executeCommands(reloaded, ['examine ward stone fragment']),
      ).toContain(
        'A jagged piece of the right ward stone, carved with half a rune.',
      )
    })

    it('cannot use the fragment on the barrier any more', () => {
      const game = createGame()
      executeCommands(game, ['cast light on right stone'])
      const answer = executeCommands(game, [
        'use ward stone fragment with barriers',
      ])
      expect(answer).toContain("can't use")
    })

    it('keeps the solved gates through a save and load', () => {
      const game = createGame()
      executeCommands(game, [
        'cast light on right stone',
        "take guardian's chain",
      ])
      const reloaded = new Game([new Act4()])
      reloaded.loadSaveData(game.toSaveData())
      expect(roomItems(reloaded)).toContain("Guardian's Essence")
      expect(roomItems(reloaded)).not.toContain("Guardian's Chain")
      expect(executeCommands(reloaded, ['examine ward stones'])).toContain(
        'Three ward stones, dark and silent.',
      )
    })

    it('keeps the unsolved gates through a save and load', () => {
      const game = createGame()
      const reloaded = new Game([new Act4()])
      reloaded.loadSaveData(game.toSaveData())
      expect(
        executeCommands(reloaded, ['cast light on right stone']),
      ).toContain('Your light finds the right stone')
    })
  })

  describe('the guardians and the barrier answer light (rq-4hdc)', () => {
    /** The guardians' look while the barrier stands: it follows the stones. */
    const GUARDIANS_BEFORE =
      'They drift between the stones and never cross the violet wall. ' +
      'When the stones swell, the guardians thicken; when the stones fade, ' +
      'they thin with them.'

    it('answers examine, light and bless on the guardians before the gates fall', () => {
      const game = createGame()
      for (const name of ['guardians', 'shadow guardians', 'guardian']) {
        expect(executeCommands(game, [`examine ${name}`])).toBe(
          GUARDIANS_BEFORE,
        )
      }
      expect(executeCommands(game, ['cast light on guardians'])).toContain(
        'Your light falls on the guardians and slides off them. They ' +
          'stand on the barrier, and the barrier stands on the stones.',
      )
      expect(executeCommands(game, ['cast bless on guardians'])).toContain(
        'The blessing slides off the guardians as the light does. ' +
          'What holds them here is not in them.',
      )
      expect(executeCommands(game, ['take guardians'])).toContain(
        'Your hand passes through the nearest guardian, cold as a cellar.',
      )
      expect(game.state.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)).toBe(false)
    })

    it('answers light on the barrier in-world before the gates fall', () => {
      const game = createGame()
      const answer = executeCommands(game, ['cast light on barriers'])
      expect(answer).toContain(
        'Your light sinks into the violet wall and is gone. The wall swells ' +
          'and fades as before, in time with the stones.',
      )
      expect(answer).not.toContain('no special effect')
      expect(game.state.getStoryFlag(FLAG_ACT4_BARRIERS_DISABLED)).toBe(false)
    })

    it('says the guardians and the wall are gone once the gates fall', () => {
      const game = createGame()
      executeCommands(game, ['cast light on right stone'])
      expect(executeCommands(game, ['examine guardians'])).toBe(
        'The guardians are gone. Nothing drifts between the dark stones now.',
      )
      expect(executeCommands(game, ['cast light on guardians'])).toContain(
        'The shadow guardians have already been banished. The way forward is clear.',
      )
      expect(executeCommands(game, ['cast bless on guardians'])).toContain(
        'The guardians are gone. There is nothing here for the blessing to reach.',
      )
      expect(executeCommands(game, ['take guardians'])).toContain(
        'Nothing of the guardians is left to take.',
      )
      const barrier = executeCommands(game, ['cast light on barriers'])
      expect(barrier).toContain(
        'The violet wall is gone. Your light falls on an open way.',
      )
      expect(barrier).not.toContain('no special effect')
    })

    it('gives a save made before the guardians existed its guardians back', () => {
      const game = createGame()
      game.state.currentRoom.removeItem('guardians')
      expect(roomItems(game)).not.toContain('Shadow Guardians')
      const reloaded = new Game([new Act4()])
      reloaded.loadSaveData(game.toSaveData())
      expect(executeCommands(reloaded, ['examine guardians'])).toBe(
        GUARDIANS_BEFORE,
      )
    })
  })

  describe('a save made before the stones existed', () => {
    it('gets its three stones back on load and can still be solved', () => {
      const game = createGame()
      const gates = game.state.currentRoom
      for (const side of ['left', 'middle', 'right']) {
        gates.removeItem(`${side} stone`)
      }
      expect(roomItems(game)).not.toContain('Right Stone')
      const reloaded = new Game([new Act4()])
      reloaded.loadSaveData(game.toSaveData())
      expect(roomItems(reloaded)).toEqual(
        expect.arrayContaining(['Left Stone', 'Middle Stone', 'Right Stone']),
      )
      executeCommands(reloaded, ['cast light on right stone'])
      expectQuestCompleted(reloaded.state, 'Shattered Ward Guardians')
    })
  })

  describe('after the gates fall', () => {
    /** A game where the right stone has been lit. */
    function solved(): Game {
      const game = createGame()
      executeCommands(game, ['cast light on right stone'])
      return game
    }

    it('describes the stones as dark', () => {
      const game = solved()
      expect(executeCommands(game, ['examine ward stones'])).toContain(
        'Three ward stones, dark and silent. The right one is missing a piece ' +
          'of its face.',
      )
      expect(executeCommands(game, ['examine left stone'])).toContain(
        'The left stone is dark.',
      )
      expect(executeCommands(game, ['cast light on middle stone'])).toContain(
        'The stone is dark. Your light shows only its runes.',
      )
      expect(executeCommands(game, ['cast light on right stone'])).toContain(
        'The stone is dark.',
      )
      expect(executeCommands(game, ['cast light on ward stones'])).toContain(
        'The ward stones are dark.',
      )
    })

    it('answers a bare light with the banished line', () => {
      expect(executeCommands(solved(), ['cast light'])).toContain(
        'The shadow guardians have already been banished. The way forward is clear.',
      )
    })
  })

  describe('Mira and Sir Cedric at the gate', () => {
    const MIRA_DOWN =
      "The way out stays open. I'll be right here when you come back through it."
    const MIRA_TOWER =
      "I heard you. Up there, in the dark. I said we'd hear, and I did."
    const NOBODY = 'There is no character named'

    it('names both beside the wall, and only Mira once it has fallen', () => {
      const game = createGame()
      const up = game.state.currentRoom.descriptionFor(game.state)
      expect(up).toContain(
        'her back to the gatepost. [character_name]Sir Cedric[/character_name] stands beside her, his eyes on the guardians.',
      )
      executeCommands(game, ['cast light on right ward stone'])
      const down = game.state.currentRoom.descriptionFor(game.state)
      expect(down).toContain(
        'her back to the gatepost. [character_name]Sir Cedric[/character_name] has gone on ahead, into the hall.',
      )
      expect(down).not.toContain('stands beside her')
    })

    it('examines both while the wall stands', () => {
      const game = createGame()
      expect(executeCommands(game, ['examine mira'])).toContain(
        'Mira, her back to the gatepost. Her hands are still unsteady from the circle.',
      )
      expect(executeCommands(game, ['examine cedric'])).toContain(
        'Sir Cedric, his sword drawn and his eyes on the guardians.',
      )
    })

    it('has Mira say the same wall-up line every time', () => {
      const game = createGame()
      for (let i = 0; i < 2; i++) {
        const out = executeCommands(game, ['talk to mira'])
        expect(out).toContain(
          "I'm fine. My hands will stop in a while. Go on. I'm not going anywhere.",
        )
        expectDialogueSpeaker(out, 'Mira')
      }
    })

    it('has Sir Cedric answer to both names, with one line', () => {
      const game = createGame()
      for (const name of ['cedric', 'sir cedric']) {
        const out = executeCommands(game, [`talk to ${name}`])
        expect(out).toContain(
          'Shadow does not tire, and neither do I. When that wall comes down, I will be a step behind you.',
        )
        expectDialogueSpeaker(out, 'Sir Cedric')
      }
    })

    it('sends Cedric on ahead when the wall falls; Mira stays', () => {
      const game = createGame()
      executeCommands(game, ['cast light on right ward stone'])
      expect(executeCommands(game, ['talk to cedric'])).toContain(NOBODY)
      expect(executeCommands(game, ['talk to mira'])).toContain(MIRA_DOWN)
    })

    it('gives the tower line once, only after naming Mira, and keeps that over a save', () => {
      const plain = createGame()
      executeCommands(plain, ['cast light on right ward stone'])
      expect(executeCommands(plain, ['talk to mira'])).not.toContain(MIRA_TOWER)

      const game = createGame()
      game.state.setStoryFlag(FLAG_ACT4_WHISPERS_MIRA_NAMED, true)
      expect(executeCommands(game, ['talk to mira'])).not.toContain(MIRA_TOWER)
      executeCommands(game, ['cast light on right ward stone'])
      expect(executeCommands(game, ['talk to mira'])).toContain(MIRA_TOWER)
      game.loadSaveData(game.toSaveData())
      const after = executeCommands(game, ['talk to mira'])
      expect(after).not.toContain(MIRA_TOWER)
      expect(after).toContain(MIRA_DOWN)
    })

    it('restores a solved gate without Cedric and an old one with both', () => {
      const game = createGame()
      const gates = game.state.currentRoom
      gates.characters.length = 0
      game.loadSaveData(game.toSaveData())
      expect(executeCommands(game, ['talk to cedric'])).toContain(
        'Shadow does not tire',
      )
      expect(executeCommands(game, ['talk to mira'])).toContain(
        "I'm fine. My hands will stop in a while.",
      )
      executeCommands(game, ['cast light on right ward stone'])
      game.state.currentRoom.characters.length = 0
      game.loadSaveData(game.toSaveData())
      expect(executeCommands(game, ['talk to cedric'])).toContain(NOBODY)
      expect(executeCommands(game, ['talk to mira'])).toContain(
        'The way out stays open.',
      )
    })
  })
})
