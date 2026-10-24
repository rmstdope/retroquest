import { describe, it, expect } from 'vitest'
import {
  Game,
  type Room,
  characterName,
  dialogue,
  event,
  speech,
} from '@/engine'
import { Act3 } from '../Act3'
import { executeCommands } from '@/testing/gameHelpers'
import {
  FLAG_ACT3_CHARRED_INSCRIPTION_READ,
  FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
  FLAG_ACT3_ECHOES_QUEST_STARTED,
  FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED,
  FLAG_ACT3_MAIN_COMPLETED,
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_MIRA_CONFESSED,
  FLAG_ACT3_MIRA_FORGIVEN,
  FLAG_ACT3_MIRA_GATE_TALKED,
  FLAG_ACT3_MIRA_REPROACHED,
  FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
  FLAG_ACT3_SEA_SEALED_LETTER_READ,
} from '../Act3StoryFlags'
import { Mira } from './Mira'
import { MIRA_TOPICS_REMINDER } from '../MiraTopics'
import {
  MIRA_ANSWER_INVITATION,
  MIRA_ANSWER_REMINDER,
  MIRA_ANSWER_REPEAT,
  MIRA_GATE_LINES,
  miraAnswerReply,
} from '../MiraAnswers'
import { SirCedric } from './SirCedric'
import { CrystalOfLight } from '../items/CrystalOfLight'
import { DragonsScale } from '../items/DragonsScale'
import { LifelightElixir } from '../items/LifelightElixir'
import { PhoenixFeather } from '../items/PhoenixFeather'

/** Whether a character with the given (lowercase) name is in the room. */
function hasCharacterNamed(room: Room, name: string): boolean {
  return room.characters.some((c) => c.name.toLowerCase() === name)
}

/** Whether an item with the given name lies in the room. */
function hasItemNamed(room: Room, name: string): boolean {
  return room.items.some((item) => item.name === name)
}

/** Mark every non-main quest complete for a Warding Rite scenario. */
function completeNonMainQuests(game: Game): void {
  const pendingQuests = [
    ...game.state.nonActivatedQuests,
    ...game.state.activatedQuests,
  ]
  game.state.completedQuests.push(
    ...pendingQuests.filter((quest) => !quest.isMain()),
  )
  game.state.nonActivatedQuests = game.state.nonActivatedQuests.filter(
    (quest) => quest.isMain(),
  )
  game.state.activatedQuests = game.state.activatedQuests.filter((quest) =>
    quest.isMain(),
  )
}

describe('Mira', () => {
  it('has a name and the basic talk interface', () => {
    new Game([new Act3()])
    const m = new Mira()
    expect(m.name.toLowerCase()).toBe('mira')
  })

  it('starts the main quest on the first talk', () => {
    const game = new Game([new Act3()])
    const m = new Mira()
    expect(game.state.getStoryFlag(FLAG_ACT3_MAIN_STARTED)).toBe(false)

    const out = m.talkTo(game.state)

    expect(game.state.getStoryFlag(FLAG_ACT3_MAIN_STARTED)).toBe(true)
    expect(out).toContain('Three relics')
    expect(out).toContain('take this, and read it')
    const keepsakeNoteInInventory = game.state.inventory.some(
      (item) => item.name === 'Keepsake Note',
    )
    expect(keepsakeNoteInInventory).toBe(true)
  })

  it('opens the first talk in five speech lines with the hand-over between the third and fourth', () => {
    const game = new Game([new Act3()])
    const out = new Mira().talkTo(game.state)
    const speeches = out.match(/\[dialogue\].*?\[\/dialogue\]/g) ?? []
    expect(speeches).toEqual([
      "[dialogue]Elior. Malakar is draining King Alden's life to break " +
        "Eldoria's wards, and the king grows weaker every day.[/dialogue]",
      '[dialogue]Three relics can stand against him: the Crystal of Light, ' +
        "the Phoenix Feather and the Dragon's Scale. We will fetch them one " +
        'at a time.[/dialogue]',
      '[dialogue]Before we go, take this, and read it. Then we can leave.' +
        '[/dialogue]',
      '[dialogue]Say the word, and I will draw the first circle.[/dialogue]',
      '[dialogue]On the road, ask me what you need to. I may not be able to ' +
        'answer all of it yet.[/dialogue]',
    ])
    expect(out.endsWith(MIRA_TOPICS_REMINDER)).toBe(true)
    const handOver = out.indexOf('Mira hands you a small, worn piece')
    expect(handOver).toBeGreaterThan(out.indexOf('take this, and read it'))
    expect(handOver).toBeLessThan(out.indexOf('Say the word'))
  })

  it('tells the Crystal purpose at the Tidal Causeway', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.currentRoom = game.state.allRooms.TidalCauseway
    const out = new Mira().talkTo(game.state)
    expect(out).toContain(
      'answers to courage. It parts veils and steadies the spirit. When you stand',
    )
  })

  it('hints or teleports at the Tidal Causeway', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.currentRoom = game.state.allRooms.TidalCauseway
    const m = new Mira()
    // ensure crystal not acquired -> hint
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, false)
    const hint = m.talkTo(game.state)
    expect(hint).toContain('Crystal of Light')

    // crystal acquired but letter not read -> should require letter to be read
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, false)
    const out = m.talkTo(game.state)
    expect(out).toContain('seek the traces your parents left behind')
    expect(out).not.toContain('You arrive at')

    // letter read -> should teleport to Lower Switchbacks
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    const origin = game.state.currentRoom
    origin.characters.push(m)
    const sc = new SirCedric()
    origin.characters.push(sc)

    const res = m.talkTo(game.state)

    expect(res).toContain('You arrive at')
    expect(game.state.currentRoom.characters).toContain(m)
    expect(hasCharacterNamed(game.state.currentRoom, 'sir cedric')).toBe(true)
  })

  it('teleports from the Tidal Causeway to the Lower Switchbacks', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.currentRoom = game.state.allRooms.TidalCauseway
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    const m = new Mira()
    game.state.currentRoom.characters.push(m)

    const out = m.talkTo(game.state)

    expect(
      out.includes('LowerSwitchbacks') ||
        game.state.currentRoom.name.includes('Lower Switchbacks'),
    ).toBe(true)
  })

  it('only gives lore at the Lower Switchbacks', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.currentRoom = game.state.allRooms.LowerSwitchbacks
    const m = new Mira()
    game.state.currentRoom.characters.push(m)

    const out = m.talkTo(game.state)

    expect(out).toContain('Here, Wisdom is taught in embers.')
    expect(out).not.toContain('second virtue')
    expect(out.toLowerCase()).toContain('wisdom')
    expect(out.toLowerCase()).toContain('phoenix')
    expect(out).not.toContain('You arrive at')
    expect(game.state.currentRoom.characters).toContain(m)
  })

  it('teleports from the Lower Switchbacks to the Cavern Mouth', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.currentRoom = game.state.allRooms.LowerSwitchbacks
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, false)

    const m = new Mira()
    // without inscription read - should require reading it first
    let out = m.talkTo(game.state)
    expect(out).toContain(
      'discover the words your parents left burned into stone',
    )
    expect(out).not.toContain('You arrive at')

    // inscription read - should allow teleport
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
    game.state.currentRoom.characters.push(m)
    const sc = new SirCedric()
    game.state.currentRoom.characters.push(sc)

    out = m.talkTo(game.state)

    expect(out).toContain('You arrive at')
    expect(
      out.includes('Cavern Mouth') ||
        game.state.currentRoom.name.includes('CavernMouth'),
    ).toBe(true)
    expect(game.state.currentRoom.characters).toContain(m)
    expect(hasCharacterNamed(game.state.currentRoom, 'sir cedric')).toBe(true)
  })

  it('requires the elixir at the hut before the fortress teleport', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.setStoryFlag(FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED, true)
    game.state.setStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED, true) // Note read
    game.state.currentRoom = game.state.allRooms.MirasHut
    const m = new Mira()

    // without elixir in inventory - should urge to take it
    let out = m.talkTo(game.state)
    expect(out).toContain('take the Lifelight Elixir')
    expect(out).toContain('before we depart')
    expect(out).not.toContain('You arrive at')

    // with elixir in inventory - should allow teleport
    game.state.inventory.push(new LifelightElixir())
    game.state.currentRoom.characters.push(m)
    const sc = new SirCedric()
    game.state.currentRoom.characters.push(sc)

    out = m.talkTo(game.state)

    expect(out).toContain('final journey')
    expect(out).toContain(
      "I know the road. I walked it as a girl, when it was the Wardens' hall and not his fortress. Your parents made the relics there, at a workbench under the dome.",
    )
    expect(out).toContain('You arrive at')
  })

  describe('at the Fortress Entrance', () => {
    function atGate(): { game: Game; mira: Mira } {
      const game = new Game([new Act3()])
      game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
      game.state.currentRoom = game.state.allRooms.FortressEntrance
      return { game, mira: new Mira() }
    }

    it('plays the coming-along scene on the first talk', () => {
      const { game, mira } = atGate()

      const out = mira.talkTo(game.state)

      expect(out).toContain('You speak with')
      expect(out).toContain(
        'Mira leans on the cold stone of the gate. Her hands are still ' +
          'shaking from the last circle.',
      )
      expect(out).toContain('I know how I look, Elior.')
      expect(out).toContain('I am coming with you.')
      expect(out).not.toContain('I will await your return')
      expect(out).not.toContain('must rest and recover')
      expect(out).not.toContain('You arrive at')
      expect(game.state.getStoryFlag(FLAG_ACT3_MIRA_GATE_TALKED)).toBe(true)
    })

    it('gives only the short line on every later talk', () => {
      const { game, mira } = atGate()
      mira.talkTo(game.state)

      const out = mira.talkTo(game.state)

      expect(out).toContain('You speak with')
      expect(out).toContain(
        'I am right behind you, Elior. The gates will not open themselves.',
      )
      expect(out).not.toContain('I know how I look')
      expect(out).not.toContain('Mira leans on the cold stone')
    })

    it('remembers the first talk across a save and load', () => {
      const { game, mira } = atGate()
      mira.talkTo(game.state)
      const fresh = new Game([new Act3()])
      fresh.loadSaveData(game.toSaveData())

      const out = new Mira().talkTo(fresh.state)

      expect(out).toContain('I am right behind you')
      expect(out).not.toContain('I know how I look')
    })

    it('plays the full scene after loading a save made before the first talk', () => {
      const { game } = atGate()
      const fresh = new Game([new Act3()])
      fresh.loadSaveData(game.toSaveData())

      const out = new Mira().talkTo(fresh.state)

      expect(out).toContain('I know how I look')
    })
  })

  it('creates the elixir and removes the relics', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED, true) // Note read
    game.state.currentRoom = game.state.allRooms.MirasHut
    completeNonMainQuests(game)

    // Add items to different locations to test removal from inventory and room
    game.state.inventory.push(new CrystalOfLight())
    game.state.inventory.push(new PhoenixFeather())
    game.state.currentRoom.items.push(new DragonsScale())

    expect(game.state.hasItem('Crystal of Light')).toBe(true)
    expect(game.state.hasItem('Phoenix Feather')).toBe(true)
    expect(hasItemNamed(game.state.currentRoom, "Dragon's Scale")).toBe(true)

    const m = new Mira()
    m.talkTo(game.state) // the confession
    const out = m.talkTo(game.state)

    expect(out).toContain('three relics resonate')
    expect(out.includes('Warding Rite') || out.includes('elixir')).toBe(true)
    expect(out).toContain('Lifelight Elixir')

    expect(game.state.hasItem('Crystal of Light')).toBe(false)
    expect(game.state.hasItem('Phoenix Feather')).toBe(false)
    expect(hasItemNamed(game.state.currentRoom, "Dragon's Scale")).toBe(false)
    expect(hasItemNamed(game.state.currentRoom, 'Lifelight Elixir')).toBe(true)
  })

  it('does not perform the Warding Rite while any non-main quest remains', () => {
    for (const questName of [
      'Echoes of the Hidden Bond',
      'Oath of Stillness',
    ]) {
      const game = new Game([new Act3()])
      game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
      game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
      game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
      game.state.setStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, true)
      game.state.setStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED, true)
      game.state.currentRoom = game.state.allRooms.MirasHut
      const incompleteQuest = game.state.nonActivatedQuests.find(
        (quest) => quest.name === questName,
      )
      if (!incompleteQuest) throw new Error(`Missing quest: ${questName}`)
      game.state.nonActivatedQuests =
        questName === 'Echoes of the Hidden Bond' ? [incompleteQuest] : []
      game.state.activatedQuests =
        questName === 'Oath of Stillness' ? [incompleteQuest] : []

      const out = new Mira().talkTo(game.state)

      expect(out).toContain('Something is still left undone')
      expect(game.state.getStoryFlag(FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED)).toBe(
        false,
      )
      expect(game.state.getStoryFlag(FLAG_ACT3_MAIN_COMPLETED)).toBe(false)
      expect(hasItemNamed(game.state.currentRoom, 'Lifelight Elixir')).toBe(
        false,
      )
    }
  })

  it('completes The Three Virtues when the Warding Rite is performed', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED, true)
    game.state.currentRoom = game.state.allRooms.MirasHut
    completeNonMainQuests(game)

    const m = new Mira()
    m.talkTo(game.state) // the confession
    const out = m.talkTo(game.state)

    expect(out).toContain('three relics resonate')
    expect(game.state.getStoryFlag(FLAG_ACT3_MAIN_COMPLETED)).toBe(true)
  })

  it('uses the healing herbs in the Warding Rite and takes them from the hut', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED, true)
    game.state.currentRoom = game.state.allRooms.MirasHut
    completeNonMainQuests(game)
    const m = new Mira()
    m.talkTo(game.state) // the confession
    expect(hasItemNamed(game.state.currentRoom, 'healing herbs')).toBe(true)

    const out = m.talkTo(game.state)

    const herbsLine = event(
      'Mira takes the healing herbs from the shelf and presses the sachets ' +
        'into your hands. Their resin-sweet scent steadies your breath as ' +
        'the starlight tightens around the relics.',
    )
    const arranging = out.indexOf('Mira carefully arranges')
    const herbs = out.indexOf(herbsLine)
    const incantation = out.indexOf('By light and flame')
    expect(herbs).toBeGreaterThan(arranging)
    expect(incantation).toBeGreaterThan(herbs)
    expect(out.indexOf('The three relics dissolve')).toBeGreaterThan(
      incantation,
    )
    expect(out.indexOf('It is done.')).toBeGreaterThan(
      out.indexOf('The three relics dissolve'),
    )
    expect(hasItemNamed(game.state.currentRoom, 'healing herbs')).toBe(false)
    expect(game.state.hasItem('healing herbs')).toBe(false)
  })

  it('requires the note to be read in the hut', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.currentRoom = game.state.allRooms.MirasHut

    const out = new Mira().talkTo(game.state)

    expect(out).toContain('read the note')
    expect(out).toContain('important guidance')
    expect(out).not.toContain('three relics')
    expect(!out.includes('teleport') || !out.includes('You arrive at')).toBe(
      true,
    )
  })

  it('requires the charred inscription read at the Lower Switchbacks', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, false)
    game.state.currentRoom = game.state.allRooms.LowerSwitchbacks

    const out = new Mira().talkTo(game.state)

    expect(out).toContain(
      'discover the words your parents left burned into stone',
    )
    expect(out).toContain('ember heights')
    expect(out).not.toContain('You arrive at')
  })

  it('requires the sea-sealed letter read at the Tidal Causeway', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, false)
    game.state.currentRoom = game.state.allRooms.TidalCauseway

    const out = new Mira().talkTo(game.state)

    expect(out).toContain('seek the traces your parents left behind')
    expect(out).toContain('sunken ruins')
    expect(out).not.toContain('You arrive at')
  })

  it('points to the ember heights, not the caverns, before the sea-sealed letter is read', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, false)
    game.state.currentRoom = game.state.allRooms.TidalCauseway

    const out = new Mira().talkTo(game.state)

    expect(out).not.toContain('caverns')
    expect(out).toContain('ember heights')
  })

  it('offers no next circle at the Cavern Mouth before the scale is won', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, false)
    game.state.currentRoom = game.state.allRooms.CavernMouth

    const out = new Mira().talkTo(game.state)

    expect(out).toContain("The miners' plight is a test of selflessness")
    expect(out).not.toContain('circle')
    expect(out).not.toContain('You arrive at')
  })
})

describe('Mira confesses before the Warding Rite', () => {
  /** A game in Mira's Hut with everything complete and the confession unheard. */
  function readyForConfession(questsDone = true): Game {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED, true)
    game.state.currentRoom = game.state.allRooms.MirasHut
    if (questsDone) completeNonMainQuests(game)
    return game
  }

  const OLD_DESCRIPTION = 'The village healer returns with renewed purpose.'
  const NEW_DESCRIPTION =
    "The village healer — and, you know now, the Wardens' pupil, who " +
    'stayed in Willowbrook for your sake. She meets your eyes more easily ' +
    'than before.'

  it('plays the whole confession on one talk without the rite', () => {
    const game = readyForConfession()

    const out = executeCommands(game, ['talk to mira'])

    const expected = [
      event('You speak with ' + characterName('Mira') + '.'),
      event(
        "Mira's hands stop above the three relics. She does not begin the rite.",
      ),
      speech(
        'Before I join them, Elior, there is something you must hear from me, and not from a stone or a dragon.',
      ),
      speech('You noticed. I saw you notice.'),
      speech(
        "I knew your parents. Not as a healer knows a neighbour. I was their pupil — Aren's, Lysa's, and Malakar's. The three of them taught me everything I know of circles and wards.",
      ),
      speech(
        'When Aren and Lysa poured themselves into the ward, someone had to stay with the child it hid. I came to Willowbrook as its healer, and I have watched over you every day since.',
      ),
      speech(
        "Your grandmother knew. She is Lysa's mother, and she kept the secret with me.",
      ),
      event(
        'For a moment you cannot speak. Then the words come out harder than you meant them.',
      ),
      dialogue('Elior', "Why didn't you tell me?"),
      speech(
        "Because the seal could not bear it. Malakar's cloaked agent walked Willowbrook's lanes searching for the amulet, and any word of who you were could have reached him.",
      ),
      speech(
        'Lyria wrote to me from Greendale, about a girl with a mask on her wrist. I burned the letter. If I had gone, I would have shown Greendale what the healer at Willowbrook can do, with his agent in both towns and you in one of them. I have never been so ashamed of anything.',
      ),
      speech(
        'I am telling you now because you have earned the truth. The amulet you carry is the anchor of the ward your parents became.',
      ),
      speech(MIRA_ANSWER_INVITATION),
      MIRA_ANSWER_REMINDER,
      event('She looks down at the relics, and then back at you.'),
      speech('When you are ready, tell me, and I will begin the Warding Rite.'),
      speech(
        'And ask me anything you like now — about your parents, Malakar, the amulet, your grandmother. I will not hide from you again.',
      ),
      MIRA_TOPICS_REMINDER,
    ].join('\n')
    expect(out).toBe(expected)
    expect(game.state.getStoryFlag(FLAG_ACT3_MIRA_CONFESSED)).toBe(true)
    expect(game.state.getStoryFlag(FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED)).toBe(
      false,
    )
  })

  it('performs the rite on the next talk, even after leaving and returning', () => {
    const game = readyForConfession()
    executeCommands(game, ['talk to mira'])
    const hut = game.state.currentRoom
    game.state.currentRoom = game.state.allRooms.TidalCauseway
    game.state.currentRoom = hut

    const out = executeCommands(game, ['talk to mira'])

    expect(out).toContain('three relics resonate')
    expect(out).not.toContain('there is something you must hear')
    expect(game.state.getStoryFlag(FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED)).toBe(
      true,
    )
  })

  it('shows nothing of the confession while quests remain', () => {
    const game = readyForConfession(false)

    const out = executeCommands(game, ['talk to mira'])

    expect(out).toContain('Something is still left undone')
    expect(out).not.toContain('pupil')
    expect(game.state.getStoryFlag(FLAG_ACT3_MIRA_CONFESSED)).toBe(false)
  })

  it('skips the confession for a game whose rite was already performed', () => {
    const game = readyForConfession()
    game.state.setStoryFlag(FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED, true)

    const out = executeCommands(game, ['talk to mira'])

    expect(out).not.toContain('pupil')
    expect(game.state.getStoryFlag(FLAG_ACT3_MIRA_CONFESSED)).toBe(false)
  })

  it('changes her description from the confession on', () => {
    const game = readyForConfession()
    expect(executeCommands(game, ['look at mira'])).toContain(OLD_DESCRIPTION)

    executeCommands(game, ['talk to mira'])

    const out = executeCommands(game, ['look at mira'])
    expect(out).toContain(NEW_DESCRIPTION)
    expect(out).not.toContain(OLD_DESCRIPTION)
  })

  it('keeps the confession state through a save and load', () => {
    const game = readyForConfession()
    executeCommands(game, ['talk to mira'])

    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())

    expect(executeCommands(fresh, ['look at mira'])).toContain(NEW_DESCRIPTION)
    expect(executeCommands(fresh, ['talk to mira'])).toContain(
      'three relics resonate',
    )
  })
})

describe('Mira topics', () => {
  it('dodges a topic before the confession and repeats it word for word', () => {
    const game = new Game([new Act3()])
    const first = new Mira().sayTo(game.state, 'parents')
    expect(first).toBe(dialogue('Mira', 'Later, Elior. Not here.'))
    expect(new Mira().sayTo(game.state, 'parents')).toBe(first)
  })

  it('answers honestly once she has confessed, in any room', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MIRA_CONFESSED, true)
    for (const key of ['MirasHut', 'FortressEntrance']) {
      const room = game.state.allRooms[key]
      game.state.currentRoom = room
      if (!room.characters.some((c) => c instanceof Mira)) {
        room.characters.push(new Mira())
      }
      expect(executeCommands(game, ['say gran to mira'])).toContain(
        "She is Lysa's mother",
      )
    }
  })

  it('answers through the say command and fails when she is absent', () => {
    const game = new Game([new Act3()])
    expect(executeCommands(game, ['say malakar to mira'])).toContain(
      'A name in the old books',
    )
    game.state.currentRoom = game.state.allRooms['TidalCauseway']
    expect(executeCommands(game, ['say malakar to mira'])).toContain(
      "There is no character named '[character_name]mira[/character_name]' here to speak to.",
    )
  })

  it('ends the confession with the invitation and the grey reminder', () => {
    const game = new Game([new Act3()])
    const out = new Mira().talkTo(game.state)
    expect(out).toContain('Say the word')
    completeNonMainQuests(game)
    game.state.setStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED, true)
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, true)
    const confession = new Mira().talkTo(game.state)
    expect(confession.endsWith(MIRA_TOPICS_REMINDER)).toBe(true)
    expect(confession).toContain(
      speech(
        'And ask me anything you like now — about your parents, Malakar, ' +
          'the amulet, your grandmother. I will not hide from you again.',
      ),
    )
  })
})

describe('Elior answers the confession', () => {
  /** A game just after the confession, in Mira's Hut with the rite pending. */
  function confessed(): Game {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.setStoryFlag(FLAG_ACT3_MIRA_CONFESSED, true)
    game.state.currentRoom = game.state.allRooms.MirasHut
    game.state.currentRoom.characters.push(new Mira())
    return game
  }

  it('plays the forgiveness reply and remembers it', () => {
    const game = confessed()
    const out = executeCommands(game, ['say i forgive you to mira'])
    expect(out).toBe(miraAnswerReply('forgive'))
    expect(game.state.getStoryFlag(FLAG_ACT3_MIRA_FORGIVEN)).toBe(true)
    expect(game.state.getStoryFlag(FLAG_ACT3_MIRA_REPROACHED)).toBe(false)
  })

  it('plays the reproach reply and remembers it', () => {
    const game = confessed()
    const out = executeCommands(game, ['say You should have told me to mira'])
    expect(out).toBe(miraAnswerReply('reproach'))
    expect(game.state.getStoryFlag(FLAG_ACT3_MIRA_REPROACHED)).toBe(true)
    expect(game.state.getStoryFlag(FLAG_ACT3_MIRA_FORGIVEN)).toBe(false)
  })

  it('lets the first answer stand', () => {
    const game = confessed()
    executeCommands(game, ['say i forgive you to mira'])
    const again = executeCommands(game, ['say you should have told me to mira'])
    expect(again).toBe(dialogue('Mira', MIRA_ANSWER_REPEAT))
    expect(game.state.getStoryFlag(FLAG_ACT3_MIRA_REPROACHED)).toBe(false)
    expect(executeCommands(game, ['say i forgive you to mira'])).toBe(
      dialogue('Mira', MIRA_ANSWER_REPEAT),
    )
  })

  it('lets a first reproach stand against a later forgiveness', () => {
    const game = confessed()
    executeCommands(game, ['say you should have told me to mira'])
    expect(executeCommands(game, ['say i forgive you to mira'])).toBe(
      dialogue('Mira', MIRA_ANSWER_REPEAT),
    )
    expect(game.state.getStoryFlag(FLAG_ACT3_MIRA_FORGIVEN)).toBe(false)
  })

  it('does not recognise the answers before the confession', () => {
    const game = confessed()
    game.state.setStoryFlag(FLAG_ACT3_MIRA_CONFESSED, false)
    const out = executeCommands(game, ['say i forgive you to mira'])
    expect(out).toContain('shakes her head.')
    expect(game.state.getStoryFlag(FLAG_ACT3_MIRA_FORGIVEN)).toBe(false)
  })

  it('does not recognise the answers once the rite is performed', () => {
    const game = confessed()
    game.state.setStoryFlag(FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED, true)
    const out = executeCommands(game, ['say i forgive you to mira'])
    expect(out).toContain('shakes her head.')
    expect(game.state.getStoryFlag(FLAG_ACT3_MIRA_FORGIVEN)).toBe(false)
  })

  it('keeps the topic replies when no answer is given', () => {
    const game = confessed()
    expect(executeCommands(game, ['say amulet to mira'])).toContain(
      'It is the anchor of their ward.',
    )
  })

  it('remembers the answer through a save and load', () => {
    const game = confessed()
    executeCommands(game, ['say i forgive you to mira'])
    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())
    expect(fresh.state.getStoryFlag(FLAG_ACT3_MIRA_FORGIVEN)).toBe(true)
  })

  describe('at the fortress gate, first talk', () => {
    function gateTalk(flag: string | null): string {
      const game = new Game([new Act3()])
      game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
      game.state.currentRoom = game.state.allRooms.FortressEntrance
      if (flag) game.state.setStoryFlag(flag, true)
      return new Mira().talkTo(game.state)
    }
    const ORIGINAL = speech(
      'Your parents walked into the dark without me once. I will not let you do the same. Go with courage, wisdom, and selflessness—I am coming with you.',
    )

    it('keeps the original second line with no answer', () => {
      expect(gateTalk(null)).toContain(ORIGINAL)
    })

    it('uses the forgiveness line', () => {
      const out = gateTalk(FLAG_ACT3_MIRA_FORGIVEN)
      expect(out).toContain(speech(MIRA_GATE_LINES.forgive))
      expect(out).not.toContain(ORIGINAL)
      expect(out).toContain('I know how I look, Elior.')
    })

    it('uses the reproach line', () => {
      const out = gateTalk(FLAG_ACT3_MIRA_REPROACHED)
      expect(out).toContain(speech(MIRA_GATE_LINES.reproach))
      expect(out).not.toContain(ORIGINAL)
    })

    it('gives the short line on later talks whatever the answer', () => {
      const game = new Game([new Act3()])
      game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
      game.state.currentRoom = game.state.allRooms.FortressEntrance
      game.state.setStoryFlag(FLAG_ACT3_MIRA_FORGIVEN, true)
      const mira = new Mira()
      mira.talkTo(game.state)
      expect(mira.talkTo(game.state)).toContain('I am right behind you')
    })
  })
})
