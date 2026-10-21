import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import {
  FLAG_HEALERS_APPRENTICE_ACCEPTED,
  FLAG_HEALERS_APPRENTICE_COMPLETED,
  FLAG_KNOWS_ELENA_CURSE,
  FLAG_ELENA_HEALED,
  FLAG_INNKEEPERS_DAUGHTER_COMPLETED,
  FLAG_LYRIA_SILVER_LEAVES_GIVEN,
} from '../Act2StoryFlags'
import { MasterHealerLyria } from './MasterHealerLyria'
import { CrystalFocus } from '../items/CrystalFocus'
import { GreaterHealSpell } from '../spells/GreaterHealSpell'
import { HealingHerbs } from '../items/HealingHerbs'
import { WalkingStick } from '../items/WalkingStick'
import { SilverLeaves } from '../items/SilverLeaves'
import {
  executeCommands,
  expectDialogueSpeaker,
  expectMarkupWellFormed,
  expectNoSpeechOutsideDialogue,
} from '@/testing/gameHelpers'

const SPEAKER = 'Master Healer Lyria'

/** An Act II game for Lyria's dialogue. */
function createGame(): Game {
  return new Game([new Act2()])
}

/** The answer is well formed and Lyria speaks every dialogue. */
function expectLyriaSpeaks(answer: string): void {
  expectMarkupWellFormed(answer)
  expectDialogueSpeaker(answer, SPEAKER)
  expectNoSpeechOutsideDialogue(answer)
}

/** The text with its markup tags removed. */
function plain(text: string): string {
  return text.replace(/\[\/?[a-z_]+\]/g, '')
}

const HERB_ASK =
  'Bring me healing herbs, good ones, and I will let you watch me work.'
const CARRYING_STAGE = "Lyria's eyes go straight to the bundle in your hands."
const CARRYING_SPEECH = 'Are those from the old families?'
const REMINDER_LINE =
  "He's holding on. The herbs bought him days, not weeks. Find me that focus."
const BED_SCENE = 'a carter lies grey under a blanket'
const BED_ASK = 'wherever the old scholars hid their books'
const TEACHING_STAGE =
  "Lyria takes the Crystal Focus to the carter's bed and sets it on his chest."
const HAND_BACK =
  "Bring me healing herbs first. Then we'll see what this is for."

/** A game where Lyria has been given the healing herbs. */
function gameAfterHerbs(): Game {
  const game = createGame()
  const herbs = new HealingHerbs()
  game.state.addItemToInventory(herbs)
  new MasterHealerLyria().giveItem(game.state, herbs)
  return game
}

describe('Master Healer Lyria dialogue markup', () => {
  it('asks for healing herbs on every talk before the herbs', () => {
    const game = createGame()
    const lyria = new MasterHealerLyria()

    for (let i = 0; i < 2; i++) {
      const answer = lyria.talkTo(game.state)
      expect(plain(answer)).toContain(HERB_ASK)
      expect(plain(answer)).not.toContain('Crystal Focus')
      expectLyriaSpeaks(answer)
    }
  })

  it('gives the same herb ask when the player carries the focus only', () => {
    const game = createGame()
    game.state.addItemToInventory(new CrystalFocus())

    const answer = new MasterHealerLyria().talkTo(game.state)

    expect(plain(answer)).toContain(HERB_ASK)
    expect(plain(answer)).not.toContain('That crystal focus!')
    expectLyriaSpeaks(answer)
  })

  it('invites the player to hand over carried herbs, even with the focus', () => {
    const game = createGame()
    game.state.addItemToInventory(new HealingHerbs())
    game.state.addItemToInventory(new CrystalFocus())

    const answer = new MasterHealerLyria().talkTo(game.state)

    expect(plain(answer)).toContain(CARRYING_STAGE)
    expect(plain(answer)).toContain(CARRYING_SPEECH)
    expect(plain(answer)).not.toContain(HERB_ASK)
    expectLyriaSpeaks(answer)
  })

  it('reminds the player of the focus between herbs and focus', () => {
    const game = gameAfterHerbs()
    const lyria = new MasterHealerLyria()

    for (let i = 0; i < 2; i++) {
      const answer = lyria.talkTo(game.state)
      expect(plain(answer)).toContain(REMINDER_LINE)
      expectLyriaSpeaks(answer)
    }
  })

  it('keeps her line after the apprenticeship', () => {
    const game = createGame()
    game.state.setStoryFlag(FLAG_HEALERS_APPRENTICE_ACCEPTED, true)
    game.state.setStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED, true)

    const answer = new MasterHealerLyria().talkTo(game.state)

    expect(plain(answer)).toContain('truly a master of the healing arts')
    expectLyriaSpeaks(answer)
  })

  it('plays the bed scene when given the herbs', () => {
    const game = createGame()
    const herbs = new HealingHerbs()
    game.state.addItemToInventory(herbs)

    const answer = new MasterHealerLyria().giveItem(game.state, herbs)

    expect(plain(answer)).toContain(
      'Lyria unties the bundle and breathes it in.',
    )
    expect(plain(answer)).toContain(BED_SCENE)
    expect(plain(answer)).toContain(BED_ASK)
    expect(game.state.hasItem('healing herbs')).toBe(false)
    expect(game.state.getStoryFlag(FLAG_HEALERS_APPRENTICE_ACCEPTED)).toBe(true)
    expect(game.state.getStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED)).toBe(
      false,
    )
    expect(game.state.hasSpell('greater_heal')).toBe(false)
    expectLyriaSpeaks(answer)
  })

  it('teaches greater heal over the bed when given the focus after the herbs', () => {
    const game = gameAfterHerbs()
    const focus = new CrystalFocus()
    game.state.addItemToInventory(focus)

    const answer = new MasterHealerLyria().giveItem(game.state, focus)

    expect(plain(answer)).toContain(TEACHING_STAGE)
    expect(plain(answer)).toContain('Watch my hands, not the light.')
    expect(answer).toContain('You learn [spell_name]greater heal[/spell_name].')
    expect(plain(answer)).toContain('Quest Complete: The Healer')
    expect(plain(answer)).not.toContain('truly earned the title')
    expect(game.state.hasItem('Crystal Focus')).toBe(false)
    expect(game.state.getStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED)).toBe(
      true,
    )
    expect(game.state.hasSpell('greater_heal')).toBe(true)
    expectLyriaSpeaks(answer)
  })

  it('hands the focus back when given before the herbs', () => {
    const game = createGame()
    const focus = new CrystalFocus()
    game.state.addItemToInventory(focus)

    const answer = new MasterHealerLyria().giveItem(game.state, focus)

    expect(plain(answer)).toContain(HAND_BACK)
    expect(game.state.hasItem('Crystal Focus')).toBe(true)
    expect(game.state.getStoryFlag(FLAG_HEALERS_APPRENTICE_ACCEPTED)).toBe(
      false,
    )
    expect(game.state.hasSpell('greater_heal')).toBe(false)
    expectLyriaSpeaks(answer)
  })

  it('still refuses other gifts', () => {
    const game = createGame()
    const stick = new WalkingStick()
    game.state.addItemToInventory(stick)

    const answer = new MasterHealerLyria().giveItem(game.state, stick)

    expect(plain(answer)).toContain('too busy to receive any gifts')
  })

  it('starts the quest at the bed and completes it over the focus', () => {
    const game = createGame()
    game.state.currentRoom = game.state.allRooms.HealersHouse
    game.state.addItemToInventory(new HealingHerbs())
    game.state.addItemToInventory(new CrystalFocus())

    executeCommands(game, ['give healing herbs to master healer lyria'])
    expect(game.state.activatedQuests.map((q) => q.name)).toContain(
      "The Healer's Apprentice",
    )
    const second = executeCommands(game, [
      'give crystal focus to master healer lyria',
    ])

    expect(plain(second)).toContain('Quest Complete')
    expect(game.state.activatedQuests.map((q) => q.name)).not.toContain(
      "The Healer's Apprentice",
    )
    expect(game.state.hasSpell('greater_heal')).toBe(true)
  })
})

describe('Lyria apprenticeship across a save', () => {
  it('keeps the herbs given, never replays the bed scene and still teaches', () => {
    const game = createGame()
    game.state.currentRoom = game.state.allRooms.HealersHouse
    game.state.addItemToInventory(new HealingHerbs())
    game.state.addItemToInventory(new CrystalFocus())
    executeCommands(game, ['give healing herbs to master healer lyria'])
    const reloaded = createGame()
    expect(reloaded.loadSaveData(game.toSaveData())).toContain('loaded')

    const talk = executeCommands(reloaded, ['talk to master healer lyria'])
    const teach = executeCommands(reloaded, [
      'give crystal focus to master healer lyria',
    ])

    expect(plain(talk)).toContain(REMINDER_LINE)
    expect(plain(talk)).not.toContain(BED_SCENE)
    expect(plain(teach)).toContain(TEACHING_STAGE)
    expect(reloaded.state.hasSpell('greater_heal')).toBe(true)
  })
})

describe('Lyria with saves and the curse during the apprenticeship', () => {
  it('keeps a finished apprenticeship from an old save', () => {
    const game = createGame()
    game.state.setStoryFlag(FLAG_HEALERS_APPRENTICE_ACCEPTED, true)
    game.state.setStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED, true)
    game.state.learnSpell(new GreaterHealSpell())
    const reloaded = createGame()
    expect(reloaded.loadSaveData(game.toSaveData())).toContain('loaded')

    const answer = new MasterHealerLyria().talkTo(reloaded.state)

    expect(plain(answer)).toContain('truly a master of the healing arts')
    expect(reloaded.state.hasSpell('greater_heal')).toBe(true)
  })

  it('gives the curse reminder before the focus reminder', () => {
    const game = gameAfterHerbs()
    game.state.setStoryFlag(FLAG_KNOWS_ELENA_CURSE, true)
    const lyria = new MasterHealerLyria()
    lyria.talkTo(game.state)

    const answer = plain(lyria.talkTo(game.state))

    expect(answer.indexOf('Elena still?')).toBeLessThan(
      answer.indexOf(REMINDER_LINE),
    )
  })
})

const DIAGNOSIS_STAGE =
  '[character_name]Lyria[/character_name] looks up from her mortar, and something in your face makes her ' +
  'set the pestle down.'
const DIAGNOSIS_START = "You've been to the Silver Stag. Marcus's girl, Elena."
const DIAGNOSIS_MIDDLE =
  'First she must be made strong, or what comes after will kill her; that ' +
  'wants a deeper healing than I can give alone. Then the mark must be ' +
  'washed in water no shadow has ever touched. You will find none in this ' +
  'city; every well here has seen the dark. And last, the thing must be ' +
  'unbound. Not broken: unbound, with the old kind of unbinding,'
const DIAGNOSIS_END =
  'the kind the scholars wrote down before any of us were born.'
const REMINDER =
  'Elena still? Strengthen her, wash her in untouched water, then unbind ' +
  'it. In that order, or not at all.'
const USUAL = 'Welcome to my house of healing'

describe("Lyria explains how Elena's curse is lifted (rq-nun)", () => {
  it('knows nothing of the curse until it is known: usual reply only', () => {
    const game = createGame()
    const answer = new MasterHealerLyria().talkTo(game.state)
    expect(answer).toContain(USUAL)
    expect(answer).not.toContain(DIAGNOSIS_STAGE)
    expect(answer).not.toContain(REMINDER)
  })

  it('gives the diagnosis first and the usual reply after, once Elena has spoken', () => {
    const game = createGame()
    game.state.setStoryFlag(FLAG_KNOWS_ELENA_CURSE, true)
    const answer = new MasterHealerLyria().talkTo(game.state)
    expect(answer.startsWith('[character_name]Lyria[/character_name]')).toBe(
      true,
    )
    expect(answer).toContain(DIAGNOSIS_STAGE)
    expect(answer).toContain(DIAGNOSIS_START)
    expect(answer).toContain(DIAGNOSIS_MIDDLE)
    expect(answer).toContain(DIAGNOSIS_END)
    expect(answer.indexOf(DIAGNOSIS_END)).toBeLessThan(answer.indexOf(USUAL))
    expectLyriaSpeaks(answer)
  })

  it("gives the diagnosis after the first heal too, without Elena's first talk", () => {
    const game = createGame()
    game.state.setStoryFlag(FLAG_ELENA_HEALED, true)
    expect(new MasterHealerLyria().talkTo(game.state)).toContain(
      DIAGNOSIS_START,
    )
  })

  it('repeats only the one-line reminder on later talks', () => {
    const game = createGame()
    const lyria = new MasterHealerLyria()
    game.state.setStoryFlag(FLAG_KNOWS_ELENA_CURSE, true)
    lyria.talkTo(game.state)
    const later = lyria.talkTo(game.state)
    expect(later).not.toContain(DIAGNOSIS_START)
    expect(later).toContain(REMINDER)
    expect(later.indexOf(REMINDER)).toBeLessThan(later.indexOf(USUAL))
    expectLyriaSpeaks(later)
  })

  it('gives neither once Elena is cured', () => {
    const game = createGame()
    const lyria = new MasterHealerLyria()
    game.state.setStoryFlag(FLAG_KNOWS_ELENA_CURSE, true)
    lyria.talkTo(game.state)
    game.state.setStoryFlag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED, true)
    const answer = lyria.talkTo(game.state)
    expect(answer).toContain(USUAL)
    expect(answer).not.toContain(REMINDER)
    expect(answer).not.toContain(DIAGNOSIS_START)
  })

  it('does not repeat or skip the diagnosis across a save and load', () => {
    const game = createGame()
    game.state.setStoryFlag(FLAG_KNOWS_ELENA_CURSE, true)
    const lyria = new MasterHealerLyria()
    const before = new Game([new Act2()])
    before.loadSaveData(game.toSaveData())
    expect(lyria.talkTo(before.state)).toContain(DIAGNOSIS_START)
    const after = new Game([new Act2()])
    after.loadSaveData(before.toSaveData())
    const answer = lyria.talkTo(after.state)
    expect(answer).not.toContain(DIAGNOSIS_START)
    expect(answer).toContain(REMINDER)
  })
})

const LEAVES_GIVE =
  'Lyria turns one leaf toward the window, and for a moment she forgets to ' +
  'breathe. Silverbark. From the old tree itself, not a cutting. I have ' +
  'only ever read of these. She lays them in a shallow dish as if they ' +
  'might bruise. Steeped, a single leaf breaks a fever in a night. ' +
  'Greendale will have a gentler winter because of you, Elior.'
const WINDOWSILL =
  'The dish of silver leaves sits on the windowsill where the light can reach it.'

/** A game where the player carries the silver leaves. */
function gameWithLeaves(): Game {
  const game = createGame()
  game.state.addItemToInventory(new SilverLeaves())
  return game
}

describe('Master Healer Lyria and the silver leaves', () => {
  it('takes the leaves, says what they are for and sets the flag', () => {
    const game = gameWithLeaves()

    const answer = new MasterHealerLyria().giveItem(
      game.state,
      new SilverLeaves(),
    )

    expect(plain(answer)).toBe(LEAVES_GIVE)
    expectMarkupWellFormed(answer)
    expect(game.state.hasItem('silver leaves')).toBe(false)
    expect(game.state.getStoryFlag(FLAG_LYRIA_SILVER_LEAVES_GIVEN)).toBe(true)
  })

  it('takes them through the game command, before and after the herbs', () => {
    for (const herbsFirst of [false, true]) {
      const game = herbsFirst ? gameAfterHerbs() : createGame()
      game.state.addItemToInventory(new SilverLeaves())
      game.state.currentRoom.addCharacter(new MasterHealerLyria())

      const out = executeCommands(game, [
        'give silver leaves to master healer lyria',
      ])

      expect(plain(out)).toContain('Silverbark.')
      expect(game.state.hasItem('silver leaves')).toBe(false)
    }
  })

  it('leaves her talk unchanged until the leaves are given', () => {
    const game = gameWithLeaves()

    expect(plain(new MasterHealerLyria().talkTo(game.state))).not.toContain(
      WINDOWSILL,
    )
  })

  it('ends every later talk with the windowsill line, in every state', () => {
    const setups: Array<(game: Game) => void> = [
      () => {},
      (game) => game.state.addItemToInventory(new HealingHerbs()),
      (game) => game.state.setStoryFlag(FLAG_HEALERS_APPRENTICE_ACCEPTED, true),
      (game) =>
        game.state.setStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED, true),
      (game) => game.state.setStoryFlag(FLAG_KNOWS_ELENA_CURSE, true),
    ]
    for (const setup of setups) {
      const game = gameWithLeaves()
      new MasterHealerLyria().giveItem(game.state, new SilverLeaves())
      setup(game)
      const lyria = new MasterHealerLyria()

      for (let i = 0; i < 2; i++) {
        const answer = lyria.talkTo(game.state)
        expect(plain(answer).endsWith('\n\n' + WINDOWSILL)).toBe(true)
        expectMarkupWellFormed(answer)
      }
    }
  })
})
