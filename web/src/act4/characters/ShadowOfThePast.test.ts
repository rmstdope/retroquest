import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { ACT4_GOLDEN_PATH } from '../Act4GoldenPath'
import {
  FLAG_ACT4_MEMORY_ORBS_MENDED,
  FLAG_ACT4_PARENTS_LEGACY_COMPLETED,
  FLAG_ACT4_PARENTS_LEGACY_STARTED,
  FLAG_ACT4_SHADOW_MASK_SHOWN,
  FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED,
  FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED,
  FLAG_ACT4_VAULT_DOOR_OPENED,
} from '../Act4StoryFlags'
import {
  executeCommands,
  expectDialogueSpeaker,
  expectItemInInventory,
  expectQuestCompleted,
  expectStoryFlag,
} from '@/testing/gameHelpers'

/** The golden path as far as the Sorceress's redemption. */
const TO_VAULT = ACT4_GOLDEN_PATH.slice(
  0,
  ACT4_GOLDEN_PATH.indexOf('say understanding to sorceress') + 1,
)

const MUTE = "The shadow's lips move, but the vault swallows the sound."
const WAITS = 'The Shadow waits, as it has waited for years.'
const NOT_MENDED_PATIENCE =
  'The Shadow cannot hear you. The memories around it are too broken.'
const NO_HOPE =
  'The Shadow shakes its head. “Patience is for those who still have hope. I have none left.”'
const NO_SEE =
  'You hold out the mask, but the Shadow cannot see it through the broken memories.'
const DARK_DOOR = 'The sealed door will not move. Its runes are dark.'
const WAITING_DOOR =
  'The door is sealed. Its runes glow faintly, waiting for the amulet.'
const DARK_AMULET =
  'You hold the amulet to the door, but its runes stay dark. Something in this vault is not ready to let you in.'
const NORTH_SHUT =
  'The door to the north is shut. The lanterns are still waiting for you.'

/** A game with Elior just inside the Memory Vault. */
function inVault(): Game {
  const game = new Game([new Act4()])
  executeCommands(game, [...TO_VAULT, 'n'])
  return game
}

function mended(): Game {
  const game = inVault()
  executeCommands(game, ['use enhanced echo stone with memory orbs'])
  return game
}

function masked(): Game {
  const game = mended()
  executeCommands(game, ["use sorceress's truth"])
  return game
}

function answered(): Game {
  const game = masked()
  executeCommands(game, ['say patience to shadow'])
  return game
}

function reload(game: Game): void {
  expect(game.loadSaveData(game.toSaveData())).toContain(
    'Game loaded successfully.',
  )
}

describe('The Shadow of the Past', () => {
  it('starts its quest on entering the vault, mute and faceless', () => {
    const game = inVault()
    expectStoryFlag(game.state, FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED, true)
    expect(game.state.activatedQuests.map((q) => q.name)).toContain(
      'The Shadow of the Past',
    )
    expect(game.state.currentRoom.description).toContain(
      'a shadowy figure wavers between existence and void',
    )
    expect(executeCommands(game, ['talk to shadow'])).toContain(MUTE)
    expect(executeCommands(game, ['examine shadow'])).toContain(
      'It is the shape of a man, thin as smoke. It reaches for the orbs, and they slip through its fingers.',
    )
    expect(executeCommands(game, ['examine memory orbs'])).toContain(
      'The orbs are cracked and clouded.',
    )
  })

  it('fails out of order, and the door and the amulet stay dark', () => {
    const game = inVault()
    expect(executeCommands(game, ["use sorceress's truth"])).toContain(NO_SEE)
    expect(executeCommands(game, ['say patience to shadow'])).toContain(
      NOT_MENDED_PATIENCE,
    )
    expect(executeCommands(game, ['say hello to shadow'])).toContain(WAITS)
    expect(executeCommands(game, ['go east'])).toContain(DARK_DOOR)
    expect(executeCommands(game, ['use ancient amulet on door'])).toContain(
      DARK_AMULET,
    )
    expect(executeCommands(game, ['examine door'])).toContain(
      'It has no handle and no keyhole.',
    )
  })

  it('mends the orbs with the stone and the voice is recognised', () => {
    const game = inVault()
    const text = executeCommands(game, ['use enhanced echo stone'])
    expect(text).toContain('for the first time it has a face.')
    expectDialogueSpeaker(text, 'Shadow of the Past')
    expect(text).toContain('Elior. You came.')
    expect(text).toContain('It is the voice from your dream')
    expectStoryFlag(game.state, FLAG_ACT4_MEMORY_ORBS_MENDED, true)
    expect(game.state.currentRoom.description).toContain(
      'The orbs hang whole and still now',
    )
    expect(game.state.currentRoom.describe(game.state)).toContain(
      '[character_name]Shadow of the Past[/character_name]',
    )
    expect(executeCommands(game, ['use enhanced echo stone'])).toContain(
      'The orbs are whole. The stone lies quiet in your hand.',
    )
    expect(executeCommands(game, ['talk to shadow of the past'])).toContain(
      'I was Malakar, once.',
    )
    expect(executeCommands(game, ['examine shadow'])).toContain(
      'His face is kind and very tired.',
    )
    expect(executeCommands(game, ['examine orbs'])).toContain(
      'Whole now. In one, three young Wardens',
    )
    expect(executeCommands(game, ['say patience to shadow'])).toContain(NO_HOPE)
  })

  it('takes the mask once, and Elior keeps it', () => {
    const game = mended()
    const text = executeCommands(game, ["use sorceress's truth with shadow"])
    expect(text).toContain('gives it back.')
    expectDialogueSpeaker(text, 'Shadow of the Past')
    expect(text).toContain('Never by force.')
    expectItemInInventory(game.state, "Sorceress's Truth", true)
    expectStoryFlag(game.state, FLAG_ACT4_SHADOW_MASK_SHOWN, true)
    expect(executeCommands(game, ["use sorceress's truth"])).toContain(
      'The Shadow has seen the mask. It is enough.',
    )
    expect(executeCommands(game, ['talk to shadow'])).toContain(
      'The Phoenix asked us once',
    )
  })

  it('is answered by patience, and the door answers the amulet', () => {
    const game = masked()
    expect(executeCommands(game, ['say hello to shadow'])).toContain(WAITS)
    const text = executeCommands(game, ['say patience to shadow'])
    expect(text).toContain('You can wait a little longer, for me.')
    expectDialogueSpeaker(text, 'Shadow of the Past')
    expectQuestCompleted(game.state, 'The Shadow of the Past')
    expectStoryFlag(game.state, FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED, true)
    expect(executeCommands(game, ['say patience to shadow'])).toContain(
      'The Shadow has its answer. It nods towards the door to the east.',
    )
    expect(executeCommands(game, ['talk to shadow'])).toContain(
      'Go east, Elior.',
    )
    expect(executeCommands(game, ['examine door'])).toContain(
      'The runes glow faintly now',
    )
    expect(executeCommands(game, ['go east'])).toContain(WAITING_DOOR)
    expect(executeCommands(game, ['use ancient amulet on door'])).toContain(
      'the stone rolls aside without a sound.',
    )
    expectStoryFlag(game.state, FLAG_ACT4_VAULT_DOOR_OPENED, true)
    expect(executeCommands(game, ['use ancient amulet on door'])).toContain(
      'The door already stands open.',
    )
    expect(executeCommands(game, ['go east'])).toContain("Parents' Vault")
    expect(executeCommands(game, ['go west'])).toContain('Memory Vault')
  })

  it('keeps every state through a save and load', () => {
    for (const make of [inVault, mended, masked, answered]) {
      const game = make()
      const before = {
        flags: { ...game.state.storyFlags },
        description: game.state.currentRoom.description,
        shadow: game.state.currentRoom.characters[0].name,
      }
      reload(game)
      expect(game.state.storyFlags).toEqual(before.flags)
      expect(game.state.currentRoom.description).toBe(before.description)
      expect(game.state.currentRoom.characters[0].name).toBe(before.shadow)
    }
    const game = answered()
    reload(game)
    expect(executeCommands(game, ['use ancient amulet on door'])).toContain(
      'rolls aside',
    )
  })
})

describe("The Parent's Legacy", () => {
  /** A game with the door open and Elior inside the Parents' Vault. */
  function inParentsVault(): Game {
    const game = answered()
    executeCommands(game, ['use ancient amulet on door', 'e'])
    return game
  }

  it('starts on entering, and the way north is shut', () => {
    const game = inParentsVault()
    expectStoryFlag(game.state, FLAG_ACT4_PARENTS_LEGACY_STARTED, true)
    expect(game.state.activatedQuests.map((q) => q.name)).toContain(
      "The Parent's Legacy",
    )
    expect(game.state.currentRoom.description).toContain(
      'the saddest and warmest room in the fortress.',
    )
    expect(executeCommands(game, ['go north'])).toContain(NORTH_SHUT)
    expect(game.state.currentRoom.name).toBe("Parents' Vault")
  })

  it('plays the memories once, completes, and opens the way north', () => {
    const game = inParentsVault()
    const text = executeCommands(game, ['examine memories'])
    expect(text).toContain('a dark-haired man laughing at something Lysa said')
    expect(text).toContain('The baby is you.')
    expectDialogueSpeaker(text, 'Lysa')
    expect(text).toContain('Hold it shut, Aren. Hide him. That is enough.')
    expect(text.indexOf('A dark year.')).toBeLessThan(
      text.indexOf('Hold it shut'),
    )
    expectQuestCompleted(game.state, "The Parent's Legacy")
    expectStoryFlag(game.state, FLAG_ACT4_PARENTS_LEGACY_COMPLETED, true)
    expect(game.state.currentRoom.description).toContain(
      'The lanterns hang dim and still now',
    )
    expect(executeCommands(game, ['examine memories'])).toContain(
      'The lanterns are dim now.',
    )
    reload(game)
    expect(game.state.currentRoom.description).toContain('hang dim and still')
    expect(executeCommands(game, ['go north'])).toContain('Throne Chamber')
  })
})
