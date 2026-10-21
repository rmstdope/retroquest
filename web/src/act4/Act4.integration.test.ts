import { describe, it, expect, beforeEach } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from './Act4'
import { ACT4_GOLDEN_PATH } from './Act4GoldenPath'
import { playDebugScript } from '@/utils/debugScript'
import {
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
  FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED,
  FLAG_ACT4_GUARDIANS_CHAIN_ACQUIRED,
  FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED,
} from './Act4StoryFlags'
import {
  executeCommands,
  expectCurrentRoom,
  expectItemInInventory,
  expectStoryFlag,
  expectQuestCompleted,
  expectDialogueSpeaker,
  expectItemInRoom,
} from '@/testing/gameHelpers'

describe('Act 4 integration', () => {
  let act4: Act4
  let game: Game

  beforeEach(() => {
    act4 = new Act4()
    act4.musicFile = ''
    game = new Game([act4])
  })

  it('initializes correctly', () => {
    expect(act4).not.toBeNull()
    expect(typeof act4.rooms, 'rooms is a record').toBe('object')
    expect(Array.isArray(act4.quests), 'quests is a list').toBe(true)
    expect(act4.getActIntro()).not.toBeNull()
  })

  it('can be loaded into a Game', () => {
    expect(game).not.toBeNull()
    expect(game.acts).toHaveLength(1)
    expect(game.acts[0]).toBe(act4)
  })

  it('golden path phase 1: fortress breach', () => {
    // Steps 1-3 of the golden path:
    // 1. Fortress Gates - Ward guardians quest
    // 2. Outer Courtyard - Trapped servants quest
    // 3. Mirror Labyrinth - Initial incomplete visit

    // Should start in Fortress Gates
    expectCurrentRoom(game.state, 'Fortress Gates')

    // Phase 1.1: Examine ward stones to understand the mechanism
    let result = executeCommands(game, ['examine ward stones'])
    expect(
      result.toLowerCase().includes('shadow guardians') ||
        result.toLowerCase().includes('anchor points'),
    ).toBe(true)

    // Phase 1.2: Take ward stone fragment (should be available)
    executeCommands(game, ['take ward stone fragment'])
    expectItemInInventory(game.state, 'Ward Stone Fragment', true)

    // Phase 1.3: Use ward stone fragment to disable barriers
    result = executeCommands(game, ['use ward stone fragment with barriers'])
    expect(
      result.toLowerCase().includes('disable') ||
        result.toLowerCase().includes('barrier'),
    ).toBe(true)

    // Phase 1.4: Cast light to dispel shadow guardians
    result = executeCommands(game, ['cast light on ward stones'])
    expect(
      result.toLowerCase().includes('dispel') ||
        result.toLowerCase().includes('banish') ||
        result.toLowerCase().includes('guardians'),
    ).toBe(true)

    // Quest should be completed and Guardian's Essence obtained
    expectStoryFlag(
      game.state,
      FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
      true,
    )

    // Phase 1.5: Take Guardian's Chain for later protection
    executeCommands(game, ["take guardian's chain"])
    expectItemInInventory(game.state, "Guardian's Chain", true)
    expectStoryFlag(game.state, FLAG_ACT4_GUARDIANS_CHAIN_ACQUIRED, true)

    // Phase 1.6: Take Guardian's Essence (should be available after light spell)
    executeCommands(game, ["take guardian's essence"])
    expectItemInInventory(game.state, "Guardian's Essence", true)
    expectStoryFlag(game.state, FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED, true)
  })

  it('has the required items available in Fortress Gates', () => {
    // Start at Fortress Gates
    expectCurrentRoom(game.state, 'Fortress Gates')

    // Check that we can take ward stone fragment
    executeCommands(game, ['take ward stone fragment'])
    expectItemInInventory(game.state, 'Ward Stone Fragment', true)

    // Check that we can take guardian's chain
    executeCommands(game, ["take guardian's chain"])
    expectItemInInventory(game.state, "Guardian's Chain", true)
  })

  it('has working room transitions in phase 1', () => {
    // Start in Fortress Gates
    expectCurrentRoom(game.state, 'Fortress Gates')

    // Move to Outer Courtyard (the barrier must be down first)
    executeCommands(game, [
      'take ward stone fragment',
      'use ward stone fragment with barriers',
      'east',
    ])
    expectCurrentRoom(game.state, 'Outer Courtyard')

    // Return to Fortress Gates
    executeCommands(game, ['west'])
    expectCurrentRoom(game.state, 'Fortress Gates')
  })

  it('sets story flags correctly during phase 1', () => {
    // Initially no flags should be set
    expectStoryFlag(
      game.state,
      FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
      false,
    )
    expectStoryFlag(game.state, FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED, false)
    expectStoryFlag(game.state, FLAG_ACT4_GUARDIANS_CHAIN_ACQUIRED, false)
    expectStoryFlag(game.state, FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED, false)

    // Simulate ward guardians quest completion
    // (Actual implementation would involve the quest system)
    game.state.setStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED, true)
    game.state.setStoryFlag(FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT4_GUARDIANS_CHAIN_ACQUIRED, true)

    // Check flags are now set
    expectStoryFlag(
      game.state,
      FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
      true,
    )
    expectStoryFlag(game.state, FLAG_ACT4_GUARDIANS_ESSENCE_ACQUIRED, true)
    expectStoryFlag(game.state, FLAG_ACT4_GUARDIANS_CHAIN_ACQUIRED, true)
  })

  describe('after the stub rooms were cut', () => {
    it('blocks east in the Memory Vault', () => {
      game.state.currentRoom = act4.rooms.MemoryVault
      const result = executeCommands(game, ['go east'])
      expect(result).toContain("You can't go that way.")
      expectCurrentRoom(game.state, 'Memory Vault')
    })

    it('loads an Act 4 save made now', () => {
      const result = game.loadSaveData(game.toSaveData())
      expect(result).toContain('Game loaded successfully.')
    })

    it('refuses a save made while the cut rooms existed', () => {
      const oldSave = game
        .toSaveData()
        .replace('"c":"Act4.OuterCourtyard"', '"c":"Act4.RoyalGardens"')
      expect(oldSave).toContain('RoyalGardens')
      game.state.currentRoom = act4.rooms.MemoryVault
      const result = game.loadSaveData(oldSave)
      expect(result).toContain('Failed to load game: ')
      expect(result).toContain('unknown class: Act4.RoyalGardens')
      expectCurrentRoom(game.state, 'Memory Vault')
    })
  })

  describe('the gates and the courtyard', () => {
    const BARRIER_THROWS_BACK =
      'A shimmering barrier of dark energy throws you back. ' +
      'It pulses in rhythm with the ward stones.'
    const HALL_NOT_YET =
      'Beyond the gates to the north, a great hall lies in darkness, ' +
      'its doorway heaped with fallen stone. There is no way through — not yet.'
    const MAZE_NOT_YET =
      'The archway to the north is choked with fallen stone. ' +
      'There is no way through — not yet.'

    /** The names of the active quests. */
    function active(): string[] {
      return game.state.activatedQuests.map((quest) => quest.name)
    }

    /** Break the barrier and banish the guardians. */
    function breakThrough(): void {
      executeCommands(game, [
        'take ward stone fragment',
        'use ward stone fragment with barriers',
        'cast light on ward stones',
      ])
    }

    /** Break through and walk into the courtyard. */
    function enterCourtyard(): void {
      breakThrough()
      executeCommands(game, ["take guardian's essence", 'east'])
    }

    it('tells that Mira and Sir Cedric stay at the threshold', () => {
      const intro = act4.getActIntro()
      expect(intro).toContain(
        'The obsidian gates loom ahead, wreathed in shadow and ancient magic. ' +
          'Mira and Sir Cedric take up their places at the threshold — someone ' +
          'must hold the way out. From here, you go on alone. ' +
          'This is the culmination',
      )
    })

    it('starts the main quest when the act opens', () => {
      executeCommands(game, ['look'])
      expect(active()).toEqual(['The Final Stand'])
      const quest = game.state.activatedQuests[0]
      expect(quest.isMain()).toBe(true)
      expect(quest.description).toBe(
        "Malakar's fortress stands before you, and somewhere inside King " +
          'Alden is held captive. Break through its defences and face the sorcerer.',
      )
    })

    it('throws the player back at the barrier and starts the guardians quest', () => {
      const north = executeCommands(game, ['go north'])
      expect(north).toContain(BARRIER_THROWS_BACK)
      expectCurrentRoom(game.state, 'Fortress Gates')
      expect(active()).toContain('Shattered Ward Guardians')
      const east = executeCommands(game, ['go east'])
      expect(east).toContain(BARRIER_THROWS_BACK)
      expectCurrentRoom(game.state, 'Fortress Gates')
    })

    it('starts the guardians quest on examining the ward stones', () => {
      expect(active()).not.toContain('Shattered Ward Guardians')
      executeCommands(game, ['examine ward stones'])
      expect(active()).toContain('Shattered Ward Guardians')
      const card = game.state.activatedQuests.find(
        (quest) => quest.name === 'Shattered Ward Guardians',
      )
      expect(card?.description).toBe(
        'Shadow guardians and a barrier of dark energy bar the way into the ' +
          'fortress. Find what feeds them, and break their hold on the gates.',
      )
    })

    it('shows no exits at the gates until the barrier is broken', () => {
      const before = game.state.currentRoom.describe(game.state)
      expect(before).not.toContain('Exits:')
      executeCommands(game, [
        'take ward stone fragment',
        'use ward stone fragment with barriers',
      ])
      const broken = game.state.currentRoom.describe(game.state)
      expect(broken).toContain('[exits]east[/exits]')
      expect(broken).not.toContain('[exits]north[/exits]')
    })

    it('refuses light before the barrier is broken', () => {
      const answer = executeCommands(game, ['cast light on ward stones'])
      expect(answer).toContain('You must disable the magical barriers first.')
      expectStoryFlag(
        game.state,
        FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
        false,
      )
    })

    it('completes the guardians quest and changes the gates', () => {
      breakThrough()
      expectQuestCompleted(game.state, 'Shattered Ward Guardians')
      const done = game.state.completedQuests.find(
        (quest) => quest.name === 'Shattered Ward Guardians',
      )
      expect(done?.completion).toBe(
        "Elior's light breaks the guardians' hold on the gates. The ward " +
          "stones fall dark, and the way into Malakar's fortress lies open.",
      )
      const room = game.state.currentRoom.describe(game.state)
      expect(room).toContain(
        'The ward stones stand dark and silent now, and the barrier is gone. ' +
          'Whispers of forgotten souls still echo from deep within the fortress.',
      )
      expect(room).not.toContain('Spectral guardians drift')
      expect(executeCommands(game, ['go north'])).toContain(HALL_NOT_YET)
      expectCurrentRoom(game.state, 'Fortress Gates')
      expectItemInInventory(game.state, "Guardian's Essence", false)
      executeCommands(game, ["take guardian's essence"])
      expectItemInInventory(game.state, "Guardian's Essence", true)
    })

    it('starts the servants quest on entering the courtyard', () => {
      enterCourtyard()
      expect(active()).toContain('The Trapped Servants')
      const room = game.state.currentRoom.describe(game.state)
      expect(room).toContain(
        'By the dry fountain a soldier in a soot-black royal tabard stands ' +
          'rigid, staring at nothing.',
      )
      expect(executeCommands(game, ['go north'])).toContain(MAZE_NOT_YET)
      expectCurrentRoom(game.state, 'Outer Courtyard')
    })

    it('fails to bless the servants before trust is earned', () => {
      enterCourtyard()
      const answer = executeCommands(game, ['cast bless on servants'])
      expect(answer).toContain('do not trust you enough')
      expectStoryFlag(game.state, FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED, false)
    })

    it('leaves the captain muddled until the servants are freed', () => {
      enterCourtyard()
      const examine = executeCommands(game, ['examine captain'])
      expect(examine).toContain(
        'A captain of the royal guard, his tabard black with soot. His eyes ' +
          'are open but see nothing, and his hand rests on a sword he has ' +
          'forgotten how to draw.',
      )
      const talk = executeCommands(game, ['talk to captain'])
      expect(talk).toContain('I held the gate for King Alden once.')
      expectDialogueSpeaker(talk, 'Captain of the Guard')
    })

    it('frees the servants, wakes the captain and leaves the gifts to take', () => {
      enterCourtyard()
      executeCommands(game, ["use guardian's essence with servants"])
      const talkTrust = executeCommands(game, ['talk to servants'])
      expect(talkTrust).toContain('use your compassion')
      expect(
        executeCommands(game, ["use guardian's essence with servants"]),
      ).toContain('already recognize your worthiness')
      const bless = executeCommands(game, ['cast bless on servants'])
      expect(bless).toContain(
        "freed from Malakar's curse. By the fountain, the captain blinks, " +
          'as if waking from a long sleep. In gratitude, they offer you',
      )
      expectQuestCompleted(game.state, 'The Trapped Servants')
      const done = game.state.completedQuests.find(
        (quest) => quest.name === 'The Trapped Servants',
      )
      expect(done?.completion).toBe(
        "Elior's courage earns the servants' trust, and a blessing breaks " +
          'their chains. Freed, they offer what help they can for the trials ahead.',
      )
      expectItemInInventory(game.state, 'Loyalty Token', false)
      expectItemInInventory(game.state, "Servant's Pendant", false)
      const room = game.state.currentRoom.describe(game.state)
      expect(room).toContain(
        'The black tears in the fountains have dried, and the storm overhead ' +
          'has thinned to grey. The Freed Servants rest by the fountains, their ' +
          'chains gone, and the captain of the guard sits among them with his ' +
          'head in his hands.',
      )
      expect(room).toContain('Freed Servants')
      expect(room).toContain('Captain of the Guard')
      expect(executeCommands(game, ['cast bless on servants'])).toContain(
        'already been freed',
      )
      const servants = executeCommands(game, ['talk to freed servants'])
      expect(servants).toContain('Thank you for our freedom!')
      expectDialogueSpeaker(servants, 'Freed Servants')
      const captain = executeCommands(game, ['talk to captain'])
      expect(captain).toContain(
        'The night the king was taken, Cedric stood his post',
      )
      expectDialogueSpeaker(captain, 'Captain of the Guard')
      executeCommands(game, ['take loyalty token', "take servant's pendant"])
      expectItemInInventory(game.state, 'Loyalty Token', true)
      expectItemInInventory(game.state, "Servant's Pendant", true)
    })

    it('keeps every state through a save and load', () => {
      const reload = (): void => {
        const loaded = game.loadSaveData(game.toSaveData())
        expect(loaded).toContain('Game loaded successfully.')
      }
      executeCommands(game, ['go north'])
      reload()
      expect(active()).toContain('Shattered Ward Guardians')
      breakThrough()
      reload()
      expectQuestCompleted(game.state, 'Shattered Ward Guardians')
      expect(executeCommands(game, ['go north'])).toContain(HALL_NOT_YET)
      executeCommands(game, ["take guardian's essence", 'east'])
      reload()
      expect(game.state.currentRoom.describe(game.state)).toContain(
        'By the dry fountain',
      )
      executeCommands(game, [
        "use guardian's essence with servants",
        'cast bless on servants',
      ])
      reload()
      expect(game.state.currentRoom.describe(game.state)).toContain(
        'head in his hands',
      )
      expect(executeCommands(game, ['talk to captain'])).toContain(
        'I remember now.',
      )
      expect(executeCommands(game, ['go north'])).toContain(MAZE_NOT_YET)
      executeCommands(game, ['take loyalty token'])
      reload()
      expectItemInInventory(game.state, 'Loyalty Token', true)
      expectItemInInventory(game.state, "Servant's Pendant", false)
      expectItemInRoom(game.state.currentRoom, "Servant's Pendant")
    })
  })

  describe('golden path', () => {
    it('plays through the Fortress Gates ward fight', () => {
      executeCommands(game, ACT4_GOLDEN_PATH)
      expectStoryFlag(
        game.state,
        FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
        true,
      )
      expectItemInInventory(game.state, "Guardian's Chain", true)
      expectItemInInventory(game.state, "Guardian's Essence", true)
      expectStoryFlag(game.state, FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED, true)
      expectItemInInventory(game.state, 'Loyalty Token', true)
      expectItemInInventory(game.state, "Servant's Pendant", true)
      expectCurrentRoom(game.state, 'Outer Courtyard')
    })

    it('is what cheat act 4 plays', () => {
      const viaPath = new Game([new Act4()])
      executeCommands(viaPath, ACT4_GOLDEN_PATH)
      const viaCheat = new Game([new Act4()])
      executeCommands(viaCheat, ['cheat act 4'])
      expect(viaCheat.state.storyFlags).toEqual(viaPath.state.storyFlags)
      expect(viaCheat.state.currentRoom.name).toBe(
        viaPath.state.currentRoom.name,
      )
    })

    it('is played by debug act4 without a failure', async () => {
      const shown: string[] = []
      await playDebugScript('act4', {
        play: (command) => executeCommands(game, [command]),
        running: () => true,
        show: (text) => shown.push(text),
        goldenPath: (n) => game.goldenPath(n),
      })
      expect(shown.join('\n')).not.toContain('[failure]')
      expectStoryFlag(
        game.state,
        FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
        true,
      )
      expectStoryFlag(game.state, FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED, true)
    })

    it('survives a save and load round-trip at the end', () => {
      executeCommands(game, ACT4_GOLDEN_PATH)
      const fresh = new Game([new Act4()])
      expect(fresh.loadSaveData(game.toSaveData())).toContain(
        'Game loaded successfully.',
      )
      expect(fresh.state.storyFlags).toEqual(game.state.storyFlags)
      expectCurrentRoom(fresh.state, game.state.currentRoom.name)
      expectItemInInventory(fresh.state, "Guardian's Chain", true)
      expectItemInInventory(fresh.state, 'Loyalty Token', true)
    })
  })
})
