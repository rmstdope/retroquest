/** The vanished king, the framed Cedric and the Malakar reveal in Greendale (rq-roe.3). */
import { describe, it, expect } from 'vitest'
import { Game, Quest, findMarkupProblems } from '@/engine'
import { Act2 } from './Act2'
import {
  FLAG_CEDRIC_RECOGNISED_SIGIL,
  FLAG_CEDRIKS_HONOR_ACCEPTED,
  FLAG_CEDRIKS_HONOR_COMPLETED,
  FLAG_COURT_HERALD_FORMAL_PRESENTATION,
  FLAG_EXAMINED_SECRET_DOCUMENTS,
  FLAG_FOUND_LOST_CARAVAN,
  FLAG_NYX_TRIALS_PASSED,
  FLAG_READ_SQUIRES_DIARY,
  FLAG_SHOWED_JOURNAL_TO_HISTORIANS,
  FLAG_SPOKEN_TO_SIR_CEDRIC,
} from './Act2StoryFlags'
import { SecretDocuments } from './items/SecretDocuments'
import { SquiresDiary } from './items/SquiresDiary'
import { CedricksLostHonorQuest } from './quests/CedricksLostHonorQuest'
import { SirCedric } from './characters/SirCedric'
import { CaravanMasterThorne } from './characters/CaravanMasterThorne'
import { executeCommands } from '@/testing/gameHelpers'

/** A game with the player standing in the named room. */
function gameIn(room: string): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms[room]
  return game
}

/** Talk to a character in the current room and check the markup. */
function talk(game: Game, who: string): string {
  const answer = game.commandParser.parse(`talk to ${who}`)
  expect(findMarkupProblems(answer)).toEqual([])
  return answer
}

/** Sir Cedric as the Castle Courtyard holds him. */
function cedricOf(game: Game): SirCedric {
  const cedric = game.state.allRooms.CastleCourtyard.characters.find(
    (c) => c instanceof SirCedric,
  )
  if (!(cedric instanceof SirCedric)) throw new Error('no Sir Cedric')
  return cedric
}

const PREPARATION = 'How goes your preparation?'

describe('castle rooms show the missing king', () => {
  it('Castle Approach has empty posts and a missing standard', () => {
    const d = gameIn('CastleApproach').state.currentRoom.description
    expect(d).toContain('Fewer guards than the posts were built for patrol')
    expect(d).toContain('The royal standard is gone from the highest spire.')
    expect(d).toContain('colorful banners snap in the wind.')
    expect(d).not.toContain('ceremonial armor')
  })

  it('Castle Courtyard has half-empty stalls', () => {
    const d = gameIn('CastleCourtyard').state.currentRoom.description
    expect(d).toContain(
      "half its stalls stand empty since the king's own guard rode out to search for him.",
    )
  })

  it('Great Hall has an empty throne and barred doors that are scenery', () => {
    const game = gameIn('GreatHall')
    const d = game.state.currentRoom.description
    expect(d).toContain("the king's throne stands empty on a raised dais")
    expect(d).toContain('Behind it, the doors to the throne room are barred.')
    expect(d).toContain('for now, the Lord Commander holds it alone.')
    expect(executeCommands(game, ['examine doors'])).not.toMatch(/barred/)
    expect(game.state.currentRoom.name).toBe('Great Hall')
    executeCommands(game, ['go north'])
    expect(game.state.currentRoom.name).toBe('Great Hall')
  })
})

describe('the castle people mention the king every time', () => {
  it('Castle Guard Captain, on every talk', () => {
    const game = gameIn('CastleApproach')
    for (let i = 0; i < 2; i++) {
      const a = talk(game, 'castle guard captain')
      expect(a).toContain('Welcome to the castle grounds.')
      expect(a).toContain('ask no questions about the king.')
      expect(a).toContain(
        'The Lord Commander rules in his name until he returns.',
      )
    }
  })

  it('Herald, before the pass only', () => {
    const game = gameIn('CastleApproach')
    const before = talk(game, 'herald')
    expect(before).toContain(
      'Since King Alden vanished, half the court has gone home',
    )
    const herald = game.state.currentRoom.characters.find(
      (c) => c.name === 'herald',
    )
    if (!herald || !('receivedPass' in herald)) throw new Error('no herald')
    herald.receivedPass = true
    expect(talk(game, 'herald')).not.toContain('vanished')
  })

  it('Court Herald, in both states', () => {
    const game = gameIn('GreatHall')
    const sentence =
      "Petitions that were the king's go to the Lord Commander now, by his order, until His Majesty is found."
    expect(talk(game, 'court herald')).toContain(sentence)
    game.state.setStoryFlag(FLAG_COURT_HERALD_FORMAL_PRESENTATION, true)
    expect(talk(game, 'court herald')).toContain(sentence)
  })

  it('Historians, until the journal is shown', () => {
    const game = gameIn('GreatHall')
    const a = talk(game, 'historians')
    expect(a).toContain(
      'We have searched every record for a king who simply vanished',
    )
    game.state.setStoryFlag(FLAG_SHOWED_JOURNAL_TO_HISTORIANS, true)
    expect(talk(game, 'historians')).not.toContain('vanished')
  })
})

describe('Lord Commander', () => {
  it('greets with the vanished king', () => {
    const a = talk(gameIn('GreatHall'), 'lord commander')
    expect(a).toContain(
      'since King Alden vanished, I hold his court in his name.',
    )
    expect(a).toContain('you bring it to me first.')
  })

  it('knows of the papers once they are examined', () => {
    const game = gameIn('GreatHall')
    game.state.setStoryFlag(FLAG_EXAMINED_SECRET_DOCUMENTS, true)
    expect(talk(game, 'lord commander')).toContain(
      "I am told you carry papers touching on Sir Cedric's case, and on the night His Majesty vanished.",
    )
  })

  it('hands unexamined papers back and keeps them in the bag', () => {
    const game = gameIn('GreatHall')
    const docs = new SecretDocuments()
    game.state.inventory.push(docs)
    const a = game.commandParser.parse(
      'give secret documents to lord commander',
    )
    expect(a).toContain('hands them back')
    expect(a).toContain('Read them and know what you bring me, then return.')
    expect(game.state.inventory).toContain(docs)
  })

  it('reads the name aloud for the examined papers', () => {
    const game = gameIn('GreatHall')
    const docs = new SecretDocuments()
    game.state.inventory.push(docs)
    game.state.setStoryFlag(FLAG_READ_SQUIRES_DIARY, true)
    docs.examine(game.state)
    const a = game.commandParser.parse(
      'give secret documents to lord commander',
    )
    expect(findMarkupProblems(a)).toEqual([])
    expect(a).toContain('By the will of Malakar.')
    expect(a).toContain("Malakar is a name from children's tales.")
    expect(a).toContain(
      'I hereby restore his knighthood and strike the charge from the record.',
    )
    expect(a).not.toContain('Thornfield')
    expect(a).not.toContain('*')
    expect(a).toContain('[success]')
    expect(game.state.inventory).not.toContain(docs)
    expect(game.state.getStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED)).toBe(true)
    expect(talk(game, 'lord commander')).toContain(
      'I have sent riders to Heavensforth for the watchman who wrote it.',
    )
  })
})

describe('Sir Cedric', () => {
  it('is unchanged before the Training Master', () => {
    const game = gameIn('CastleCourtyard')
    cedricOf(game).cedricTrustsElior = true
    game.state.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
    const a = talk(game, 'sir cedric')
    expect(a).toContain(PREPARATION)
    expect(a).not.toContain('I will not make excuses.')
  })

  it("keeps the await line unchanged before the Knight's Test is done", () => {
    const game = gameIn('CastleCourtyard')
    game.state.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
    game.state.setStoryFlag(FLAG_CEDRIKS_HONOR_ACCEPTED, true)
    const a = talk(game, 'sir cedric')
    expect(a).toContain('I await your demonstration')
    expect(a).not.toContain('I will not make excuses.')
  })

  it('owns the disgrace every time, without saying he was framed', () => {
    const game = gameIn('CastleCourtyard')
    cedricOf(game).cedricTrustsElior = true
    game.state.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
    game.state.setStoryFlag(FLAG_CEDRIKS_HONOR_ACCEPTED, true)
    for (let i = 0; i < 2; i++) {
      const a = talk(game, 'sir cedric')
      expect(a).toContain(PREPARATION)
      expect(a).toContain("Sir Cedric's jaw tightens.")
      expect(a).toContain("I held the king's wall the night he vanished")
      expect(a).not.toMatch(/framed/)
    }
  })

  it('doubts the name on the first talk after the honour, then repeats briefly', () => {
    const game = gameIn('CastleCourtyard')
    cedricOf(game).cedricTrustsElior = true
    game.state.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
    game.state.setStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED, true)
    const first = talk(game, 'sir cedric')
    expect(first).toContain('the king was not lost on my watch. He was taken')
    expect(first).toContain('My grandmother frightened me with that name')
    expect(first).toContain('Do you remember what I told you in the yard?')
    expect(first).not.toContain('Please accept this Nature')
    const later = talk(game, 'sir cedric')
    expect(later).toContain('the king, and whoever wears that old name.')
  })

  it('keeps one of the three charms back at the send-off, once', () => {
    const game = gameIn('CastleCourtyard')
    game.state.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
    game.state.completedQuests.push(
      new Quest({ name: "The Knight's Test", description: '', completion: '' }),
    )
    const first = talk(game, 'sir cedric')
    expect(first).toContain('we must be prepared.')
    expect(first).toContain(
      '[character_name]Sir Cedric[/character_name] hesitates, then rests a ' +
        'hand on a small pouch at his belt.',
    )
    expect(first).toContain('My family has kept a charm for generations')
    expect(first).toContain('one of three that can call the sprite Nyx')
    expect(first).toContain(
      'I will not hand an heirloom of my house to someone I have known for a day.',
    )
    const later = talk(game, 'sir cedric')
    expect(later).toContain(PREPARATION)
    expect(later).not.toContain('charm')
    expect(later).not.toContain('heirloom')
  })

  it('refers to the refusal when the charm is given after the ruling', () => {
    const game = gameIn('CastleCourtyard')
    cedricOf(game).cedricTrustsElior = true
    game.state.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
    game.state.setStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED, true)
    const a = talk(game, 'sir cedric')
    expect(a).toContain('withdraws an ancient wooden charm')
    expect(a).toContain('I have known you long enough now. Take Nature')
    expect(a).toContain('it is one of the three that call Nyx.')
    expect(a).toContain('I mean to find him.')
  })

  it('gives the charm without a callback when he never refused it', () => {
    const game = gameIn('CastleCourtyard')
    game.state.setStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC, true)
    game.state.setStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED, true)
    const a = talk(game, 'sir cedric')
    expect(a).toContain('withdraws an ancient wooden charm')
    expect(a).toContain("Please accept this Nature's Charm.")
    expect(a).toContain('A day ago I would not have given it')
    expect(a).not.toContain('in the yard')
    expect(a).not.toContain('Do you remember')
  })

  it('keeps the Nyx line first', () => {
    const game = gameIn('CastleCourtyard')
    game.state.setStoryFlag(FLAG_CEDRIKS_HONOR_ACCEPTED, true)
    game.state.setStoryFlag(FLAG_CEDRIC_RECOGNISED_SIGIL, true)
    game.state.setStoryFlag(FLAG_NYX_TRIALS_PASSED, true)
    expect(talk(game, 'sir cedric')).toContain(
      'I sense something extraordinary',
    )
  })
})

describe('the trail to the papers', () => {
  it('Training Master tells the night of the vanishing, later talks unchanged', () => {
    const game = gameIn('CastleCourtyard')
    const first = talk(game, 'training master')
    expect(first).toContain('the night His Majesty vanished')
    expect(first).toContain("The watch's story was… too neat.")
    expect(first).toContain(
      'there are papers somewhere'.replace(
        'there are',
        "I've heard rumors that there are",
      ),
    )
    expect(first).not.toContain('Thornfield')
    expect(talk(game, 'training master')).toContain(
      "You're looking into Sir Cedric's",
    )
  })

  it('Squires whisper after the quest is accepted', () => {
    const game = gameIn('CastleCourtyard')
    game.state.setStoryFlag(FLAG_CEDRIKS_HONOR_ACCEPTED, true)
    const a = talk(game, 'squires')
    expect(a).toContain('whoever took the king walked in through the gap.')
    expect(a).toContain('We found a diary under the stone benches')
  })

  it('the diary reads the new entries', () => {
    const game = gameIn('CastleCourtyard')
    const diary = new SquiresDiary()
    expect(diary.description).toContain('the night the king vanished.')
    game.state.inventory.push(diary)
    const a = executeCommands(game, ["use squire's diary"])
    expect(findMarkupProblems(a)).toEqual([])
    expect(a).toContain('The morning after the king vanished:')
    expect(a).toContain('Some days later:')
    expect(a).toContain('Last entry:')
    expect(a).toContain('took the road to Heavensforth')
    expect(a).toContain('The diary points to papers sent from Heavensforth')
    expect(a).not.toContain('Thornfield')
    expect(a).not.toContain('*')
    expect(a).toContain('you place it back')
  })

  it('Thorne explains how the papers came to be on the caravan', () => {
    const game = gameIn('MerchantsWarehouse')
    game.state.setStoryFlag(FLAG_FOUND_LOST_CARAVAN, true)
    const a = new CaravanMasterThorne().talkTo(game.state)
    expect(a).toContain(
      'a frightened man in Heavensforth paid him to carry these',
    )
    expect(a).toContain('Thorne hands you a stack of')
    expect(a).not.toContain('years ago')
  })

  it('the documents read as a confession and the paying letter', () => {
    const game = gameIn('GreatHall')
    const docs = new SecretDocuments()
    expect(docs.description).toBe(
      'A sealed packet of papers: a sworn confession and a letter closed with black wax.',
    )
    expect(docs.examine(game.state)).toContain(
      'without knowing whose night, you cannot make sense of them.',
    )
    expect(game.state.getStoryFlag(FLAG_EXAMINED_SECRET_DOCUMENTS)).toBe(false)
    game.state.setStoryFlag(FLAG_READ_SQUIRES_DIARY, true)
    const a = docs.examine(game.state)
    expect(a).toContain(
      "twisted rune, the same kind of rune as the token you fished out of Willowbrook's well",
    )
    expect(a).toContain('a name in an old script you cannot read.')
    expect(game.state.getStoryFlag(FLAG_EXAMINED_SECRET_DOCUMENTS)).toBe(true)
  })
})

describe("Cedric's Lost Honor journal", () => {
  it('tells the new story at each stage and at completion', () => {
    const game = new Game([new Act2()])
    const quest = new CedricksLostHonorQuest()
    quest.checkUpdate(game.state)
    expect(quest.description).toContain('after the night King Alden vanished')
    game.state.setStoryFlag(FLAG_READ_SQUIRES_DIARY, true)
    quest.checkUpdate(game.state)
    expect(quest.description).toContain('fled to Heavensforth')
    game.state.setStoryFlag(FLAG_EXAMINED_SECRET_DOCUMENTS, true)
    quest.checkUpdate(game.state)
    expect(quest.description).toContain(
      'Present them to the Lord Commander in the Great Hall',
    )
    expect(quest.completion).toContain("written in Malakar's name.")
    const all = quest.description + quest.completion
    expect(all).not.toContain('Thornfield')
  })
})

describe('older saves', () => {
  /** Save a game whose Act II text is the old wording, load it into a new game. */
  function loadOldSave(
    prepare: (game: Game, quest: CedricksLostHonorQuest) => void,
  ): Game {
    const game = new Game([new Act2()])
    const state = game.state
    state.allRooms.CastleApproach.description = 'old Thornfield approach'
    state.allRooms.CastleCourtyard.description = 'old Thornfield courtyard'
    state.allRooms.GreatHall.description = 'old Thornfield hall'
    const docs = new SecretDocuments()
    docs.description = 'old Thornfield text'
    state.inventory.push(docs)
    const diary = new SquiresDiary()
    diary.description = 'old Thornfield diary'
    state.allRooms.CastleCourtyard.items.push(diary)
    const quest = state.getQuest("Cedric's Lost Honor")
    if (!(quest instanceof CedricksLostHonorQuest)) throw new Error('no quest')
    quest.description = 'old Thornfield journal'
    quest.completion = 'old Thornfield completion'
    prepare(game, quest)
    const loaded = new Game([new Act2()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')
    return loaded
  }

  /** Everything the player can read that once spoke of Thornfield Pass. */
  function readable(game: Game): string {
    const state = game.state
    const quest = state.getQuest("Cedric's Lost Honor")
    if (!quest) throw new Error('no quest')
    const d = quest.details()
    return JSON.stringify([
      state.allRooms.CastleApproach.description,
      state.allRooms.CastleCourtyard.description,
      state.allRooms.GreatHall.description,
      state.inventory.map((i) => i.description),
      state.allRooms.CastleCourtyard.items.map((i) => i.description),
      quest.description,
      quest.completion,
      d,
    ])
  }

  it('read in the new words when the quest has not started', () => {
    const loaded = loadOldSave(() => {})
    const text = readable(loaded)
    expect(text).not.toContain('Thornfield')
    expect(text).toContain('Fewer guards than the posts were built for')
    expect(text).toContain('A sealed packet of papers')
    expect(text).toContain('the night the king vanished')
  })

  it('rebuild an active journal, earlier entries included', () => {
    const loaded = loadOldSave((game, quest) => {
      const state = game.state
      state.nonActivatedQuests.splice(
        state.nonActivatedQuests.indexOf(quest),
        1,
      )
      state.activatedQuests.push(quest)
      state.setStoryFlag(FLAG_READ_SQUIRES_DIARY, true)
      state.setStoryFlag(FLAG_EXAMINED_SECRET_DOCUMENTS, true)
      quest.earlierStages = ['old Thornfield one', 'old Thornfield two']
      quest.latestStage = 'old Thornfield three'
    })
    const text = readable(loaded)
    expect(text).not.toContain('Thornfield')
    expect(text).toContain('Present them to the Lord Commander')
    expect(text).toContain('fled to Heavensforth')
  })

  it('read the new completion text for a completed quest', () => {
    const loaded = loadOldSave((game, quest) => {
      const state = game.state
      state.nonActivatedQuests.splice(
        state.nonActivatedQuests.indexOf(quest),
        1,
      )
      state.completedQuests.push(quest)
      quest.completed = true
      state.setStoryFlag(FLAG_READ_SQUIRES_DIARY, true)
      quest.earlierStages = ['old Thornfield one']
      quest.latestStage = 'old Thornfield two'
    })
    const text = readable(loaded)
    expect(text).not.toContain('Thornfield')
    expect(text).toContain("written in Malakar's name.")
  })

  it('does not report news for a quest that has not started', () => {
    const loaded = loadOldSave((game) => {
      game.state.setStoryFlag(FLAG_READ_SQUIRES_DIARY, true)
    })
    const quest = loaded.state.getQuest("Cedric's Lost Honor")
    if (!(quest instanceof CedricksLostHonorQuest)) throw new Error('no quest')
    expect(quest.squiresInfoAdded).toBe(false)
  })
})
