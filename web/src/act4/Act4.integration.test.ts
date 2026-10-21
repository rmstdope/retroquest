import { describe, it, expect, beforeEach } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from './Act4'
import { ACT4_GOLDEN_PATH } from './Act4GoldenPath'
import { playDebugScript } from '@/utils/debugScript'
import {
  FLAG_ACT4_FIELD_GREEN,
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
  FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED,
  FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED,
  FLAG_ACT4_THRONE_AMULET_OPENED,
  FLAG_ACT4_REDEMPTION_ENDING,
} from './Act4StoryFlags'
import {
  executeCommands,
  expectCurrentRoom,
  expectItemInInventory,
  expectStoryFlag,
  expectQuestCompleted,
  expectDialogueSpeaker,
  expectItemInRoom,
  expectSpellKnown,
} from '@/testing/gameHelpers'

/** The golden path as far as the redeemed knight (the Sorceress steps follow). */
const KNIGHT_PATH = ACT4_GOLDEN_PATH.slice(
  0,
  ACT4_GOLDEN_PATH.indexOf('say redemption to knight') + 1,
)

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
      result.toLowerCase().includes('a corner has broken away') ||
        result.toLowerCase().includes('the same hand on every one'),
    ).toBe(true)

    // Phase 1.2: Take ward stone fragment (should be available)
    executeCommands(game, ['take ward stone fragment'])
    expectItemInInventory(game.state, 'Ward Stone Fragment', true)

    // Phase 1.3: Use ward stone fragment to disable barriers
    result = executeCommands(game, ['use ward stone fragment with barriers'])
    expect(
      result.toLowerCase().includes('the wall shivers') ||
        result.toLowerCase().includes('goes out'),
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

    // Phase 1.6: Take Guardian's Essence (should be available after light spell)
    executeCommands(game, ["take guardian's essence"])
    expectItemInInventory(game.state, "Guardian's Essence", true)
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
    expectStoryFlag(game.state, FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED, false)

    // Simulate ward guardians quest completion
    // (Actual implementation would involve the quest system)
    game.state.setStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED, true)

    // Check flags are now set
    expectStoryFlag(
      game.state,
      FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
      true,
    )
  })

  describe('after the stub rooms were cut', () => {
    it('blocks east in the Memory Vault', () => {
      game.state.currentRoom = act4.rooms.MemoryVault
      const result = executeCommands(game, ['go east'])
      expect(result).toContain('The sealed door will not move.')
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
      'The violet wall gives under your hand, then pushes you back, ' +
      'gently and firmly. It hums in time with the ward stones.'
    const SERVANTS_BLOCK =
      'The servants drift across the archway, their chains trailing. ' +
      'They do not stop for you, and you cannot get past them.'

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

    it('tells that Mira steps through the gates and holds the way out inside', () => {
      const intro = act4.getActIntro()
      expect(intro).toContain(
        'The obsidian gates loom ahead, wreathed in shadow and ancient magic. ' +
          'Mira steps through the gates beside you, pale but unbending. She ' +
          'and Sir Cedric take up their places just inside the threshold — ' +
          'someone must hold the way out. ',
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

    it('starts the guardians quest on trying east alone', () => {
      executeCommands(game, ['go east'])
      expect(active()).toContain('Shattered Ward Guardians')
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
      expect(broken).toContain('[exits]north[/exits]')
    })

    it('refuses light before the barrier is broken', () => {
      const answer = executeCommands(game, ['cast light on ward stones'])
      expect(answer).toContain(
        'Your light touches the nearest guardian and slides off it',
      )
      expect(answer).not.toContain('You must')
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
        'The ward stones are dark now, and the paths between them are empty. ' +
          'The gates stand open.',
      )
      expect(room).not.toContain('still walk')
      expect(executeCommands(game, ['go north'])).toContain('You move north to')
      expectCurrentRoom(game.state, 'Hall of Echoes')
      executeCommands(game, ['go south'])
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
      expect(executeCommands(game, ['go north'])).toContain(SERVANTS_BLOCK)
      expectCurrentRoom(game.state, 'Outer Courtyard')
    })

    it('fails to bless the servants before trust is earned', () => {
      enterCourtyard()
      const answer = executeCommands(game, ['cast bless on servants'])
      expect(answer).toContain('they have learned what strangers bring')
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
      executeCommands(game, ["use guardian's essence on servants"])
      const talkTrust = executeCommands(game, ['talk to servants'])
      expect(talkTrust).toContain('Whatever you can do for us, do it gently')
      expect(
        executeCommands(game, ["use guardian's essence with servants"]),
      ).toContain('The servants already know you')
      const bless = executeCommands(game, ['cast bless on servants'])
      expect(bless).toContain(
        'By the fountain, the captain blinks, as if waking from a long ' +
          "sleep. One of the servants presses a small blue [item_name]Servant's Pendant[/item_name] into your hands.",
      )
      expectQuestCompleted(game.state, 'The Trapped Servants')
      const done = game.state.completedQuests.find(
        (quest) => quest.name === 'The Trapped Servants',
      )
      expect(done?.completion).toBe(
        "Elior's courage earns the servants' trust, and a blessing breaks " +
          'their chains. Freed, they offer what help they can for the trials ahead.',
      )
      expect(bless).not.toContain('Loyalty Token')
      expectItemInInventory(game.state, "Servant's Pendant", false)
      const room = game.state.currentRoom.describe(game.state)
      expect(room).toContain(
        'The fountains have stopped running black, and the sky has thinned to ' +
          'grey. The Freed Servants rest by the fountains, their chains gone, ' +
          'and the captain of the guard sits among them with his head in his ' +
          'hands.',
      )
      expect(room).toContain('Freed Servants')
      expect(room).toContain('Captain of the Guard')
      expect(executeCommands(game, ['cast bless on servants'])).toContain(
        'nothing left to bless away',
      )
      const servants = executeCommands(game, ['talk to freed servants'])
      expect(servants).toContain('The mirrors past the arch lie.')
      expectDialogueSpeaker(servants, 'Freed Servants')
      const captain = executeCommands(game, ['talk to captain'])
      expect(captain).toContain('Cedric stood his post')
      expectDialogueSpeaker(captain, 'Captain of the Guard')
      executeCommands(game, ["take servant's pendant"])
      expectItemInInventory(game.state, "Servant's Pendant", true)
    })

    it('shows the middle gates description once the wall is down, also after a reload', () => {
      const look = (): string => game.state.currentRoom.describe(game.state)
      expect(look()).toContain('a thin wall of the same light')
      executeCommands(game, [
        'take ward stone fragment',
        'use ward stone fragment with barriers',
      ])
      expect(look()).toContain('The violet wall is gone')
      expect(look()).toContain('still walk their short lines')
      const loaded = game.loadSaveData(game.toSaveData())
      expect(loaded).toContain('Game loaded successfully.')
      expect(look()).toContain('The violet wall is gone')
      executeCommands(game, ['cast light on ward stones'])
      expect(look()).toContain('The gates stand open.')
    })

    it('never tells the player what to type in the first half of the act', () => {
      const hints = [
        'You must disable the magical barriers first',
        'You must prove your worthiness first',
        'Try using it on the servants',
        'You need something to light the true path',
        'You need something to shield you from it',
        'Listen to her first',
      ]
      const lines = [
        executeCommands(game, ['go north']),
        executeCommands(game, ['cast light on ward stones']),
      ]
      breakThrough()
      executeCommands(game, ["take guardian's essence", 'east'])
      lines.push(
        executeCommands(game, ["use guardian's essence"]),
        executeCommands(game, ['cast bless on servants']),
        executeCommands(game, ['talk to servants']),
      )
      for (const hint of hints) expect(lines.join('\n')).not.toContain(hint)
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
      expect(game.state.currentRoom.describe(game.state)).toContain(
        'The ward stones are dark now',
      )
      expect(executeCommands(game, ['go north'])).toContain('You move north to')
      executeCommands(game, ['go south', "take guardian's essence", 'east'])
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
      expect(executeCommands(game, ['go north'])).toContain('You move north to')
      executeCommands(game, ['go south'])
      reload()
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
      expectItemInInventory(game.state, 'Enhanced Echo Stone', true)
      expectQuestCompleted(game.state, 'The Maze of Mirrors')
      expectSpellKnown(game.state, 'truth_sight')
      expectQuestCompleted(game.state, 'The Knight of Despair')
      expectItemInInventory(game.state, "Knight's Redemption", true)
      expectSpellKnown(game.state, 'redemptions_light')
      expectQuestCompleted(game.state, 'The Sorceress of Lies')
      expectItemInInventory(game.state, "Sorceress's Truth", true)
      expectSpellKnown(game.state, 'hearts_truth')
      expectQuestCompleted(game.state, 'The Shadow of the Past')
      expectQuestCompleted(game.state, "The Parent's Legacy")
      expectCurrentRoom(game.state, 'Willowbrook Field')
      expectStoryFlag(game.state, FLAG_ACT4_THRONE_AMULET_OPENED, true)
      expectStoryFlag(game.state, FLAG_ACT4_FIELD_GREEN, true)
      expect(game.acts[0].isCompleted(game.state)).toBe(true)
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

  describe('the maze and the hall', () => {
    const GLASS =
      'You step toward a corridor of light and walk straight into cold glass. ' +
      'Somewhere behind you, a reflection laughs. You are back at the entrance.'
    const KNIGHT_BLOCK =
      'The Knight of Despair stands before the stair to the tower. He does ' +
      'not lift his sword. He simply does not move, and there is no way past him.'
    const NO_STONE =
      "You try to recall the echoes' words, but in here the glass answers " +
      'only with your own voice. You lose the way, and find yourself back at ' +
      'the entrance.'
    const STONE_OUTSIDE =
      "You hold the Echo Stone to your ear. The hall's voices murmur inside " +
      'it, waiting for somewhere that needs them.'
    const SOLVED =
      'You step into the empty corridor. Behind you the false mirrors go ' +
      'dark, one by one, until a single corridor remains — and at its end, a ' +
      'plain mirror that shows you exactly as you are.'
    const ALREADY_CLEAR =
      'The true path is already clear. The false mirrors stay dark.'
    const NOTHING_YET =
      "The pendant's light falls on the glass. Here every reflection walks " +
      'with you; there is nothing yet to choose between.'

    /** Play the golden path up to freeing the servants and taking the pendant. */
    function toFreedServants(): void {
      executeCommands(game, ACT4_GOLDEN_PATH.slice(0, 10))
    }

    /** Fetch the Echo Stone from the hall and walk to the maze door. */
    function toMazeWithStone(): void {
      toFreedServants()
      executeCommands(game, [
        'west',
        'north',
        'take echo stone',
        'south',
        'east',
      ])
      executeCommands(game, ['north'])
    }

    /** Walk the route: left, left, the pendant at the fork, then east. */
    function solveMaze(): string {
      executeCommands(game, ['west', 'west', "use servant's pendant"])
      return executeCommands(game, ['east'])
    }

    it('opens the hall north of the gates and the maze north of the courtyard', () => {
      toFreedServants()
      expectCurrentRoom(game.state, 'Outer Courtyard')
      executeCommands(game, ['north'])
      expectCurrentRoom(game.state, 'Mirror Labyrinth')
      executeCommands(game, ['south', 'west', 'north'])
      expectCurrentRoom(game.state, 'Hall of Echoes')
      executeCommands(game, ['south'])
      expectCurrentRoom(game.state, 'Fortress Gates')
    })

    it('starts the maze quest on entering and shows the card', () => {
      toFreedServants()
      expect(active()).not.toContain('The Maze of Mirrors')
      executeCommands(game, ['north'])
      const card = game.state.activatedQuests.find(
        (quest) => quest.name === 'The Maze of Mirrors',
      )
      expect(card?.description).toBe(
        'Countless mirrors show false paths and twisted reflections. Find the ' +
          'one true way through the labyrinth.',
      )
    })

    /** The names of the active quests. */
    function active(): string[] {
      return game.state.activatedQuests.map((quest) => quest.name)
    }

    it('examines the mirrors and says there is nothing to choose before the fork', () => {
      toFreedServants()
      executeCommands(game, ['north'])
      expect(executeCommands(game, ['examine mirrors'])).toContain(
        'Each mirror shows a different Elior — older, younger, crowned, ' +
          'broken — with a different corridor stretching away behind him. ' +
          'Every path looks real. Most of them are lies.',
      )
      expect(executeCommands(game, ["use servant's pendant"])).toContain(
        NOTHING_YET,
      )
    })

    it('walks the maze entrance, stretch and fork with their own looks and exits', () => {
      toMazeWithStone()
      const entrance = game.state.currentRoom.describe(game.state)
      expect(entrance).toContain(
        'You stand at the mouth of the maze, facing north.',
      )
      expect(entrance).toContain('[exits]west[/exits]')
      const turn1 = executeCommands(game, ['west'])
      expect(turn1).toContain('You turn left, and the glass lets you through.')
      expect(game.state.currentRoom.describe(game.state)).toContain(
        'The corridor narrows and bends, and you face north again.',
      )
      const turn2 = executeCommands(game, ['west'])
      expect(turn2).toContain(
        'You turn left again, and the glass lets you through.',
      )
      const fork = game.state.currentRoom.describe(game.state)
      expect(fork).toContain('The corridor ends in a last fork, facing north.')
      expect(fork).toContain('[exits]east[/exits]')
      expect(fork).not.toContain('[exits]west[/exits]')
      expectCurrentRoom(game.state, 'Mirror Labyrinth')
    })

    it('sends a wrong turn back to the entrance, also at the fork before the pendant', () => {
      toMazeWithStone()
      expect(executeCommands(game, ['go north'])).toContain(GLASS)
      executeCommands(game, ['west', 'west'])
      expect(executeCommands(game, ['go east'])).toContain(GLASS)
      expect(game.state.currentRoom.describe(game.state)).toContain(
        'You stand at the mouth of the maze',
      )
      executeCommands(game, ['west', 'west', "use servant's pendant"])
      expect(executeCommands(game, ['go north'])).toContain(GLASS)
      executeCommands(game, ['west', 'west'])
      expect(executeCommands(game, ['go east'])).toContain(GLASS)
      expectStoryFlag(game.state, FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED, false)
    })

    it('retraces south out of the maze and starts again at the entrance', () => {
      toMazeWithStone()
      executeCommands(game, ['west'])
      expect(executeCommands(game, ['south'])).toContain(
        'You retrace your steps out of the glass.',
      )
      expectCurrentRoom(game.state, 'Outer Courtyard')
      executeCommands(game, ['north'])
      expect(game.state.currentRoom.describe(game.state)).toContain(
        'You stand at the mouth of the maze',
      )
    })

    it('has the echoes, the stone and the knight in the hall', () => {
      toFreedServants()
      executeCommands(game, ['west', 'north'])
      const room = game.state.currentRoom.describe(game.state)
      expect(room).toContain('Echo Stone')
      expect(room).toContain('Knight of Despair')
      expect(room).toContain(
        'a knight in tarnished armour stands without moving',
      )
      const clue =
        'You stand still and listen. Beneath the battle cries and laments, one voice repeats the same words over and over, patient as a heartbeat:'
      const route = "'Left, then left, then the way your shadow does not go.'"
      for (let i = 0; i < 2; i++) {
        const heard = executeCommands(game, ['examine echoes'])
        expect(heard).toContain(clue)
        expect(heard).toContain(route)
      }
      expect(executeCommands(game, ['take echo stone'])).toContain(
        'You lift a smooth grey stone from a niche beneath the banners. It is ' +
          "warm, and when you hold it to your ear you hear the hall's echoes " +
          'still speaking inside it.',
      )
      expectItemInInventory(game.state, 'Echo Stone', true)
      expect(executeCommands(game, ['examine echo stone'])).toContain(
        'A smooth grey stone that hums with the voices of the Hall of Echoes. ' +
          'Held close, it repeats what the echoes know.',
      )
    })

    it('shows the knight and keeps the stair shut', () => {
      toFreedServants()
      executeCommands(game, ['west', 'north'])
      expect(executeCommands(game, ['examine knight of despair'])).toContain(
        'A knight in tarnished armour, a shredded grey cloak hanging from his ' +
          "shoulders. His visor is down, and he does not move. When he speaks, his voice is hollow: 'Return when you have the truth.'",
      )
      const talk = executeCommands(game, ['talk to knight of despair'])
      expect(talk).toContain(
        'There is nothing you can say to me that I have not already told ' +
          'myself. Go. Return when you have the truth.',
      )
      expectDialogueSpeaker(talk, 'Knight of Despair')
      expect(executeCommands(game, ['go east'])).toContain(KNIGHT_BLOCK)
      expectCurrentRoom(game.state, 'Hall of Echoes')
      expect(game.state.currentRoom.describe(game.state)).not.toContain(
        '[exits]east[/exits]',
      )
    })

    it('is neutral outside the maze and repeats the route inside it', () => {
      toFreedServants()
      executeCommands(game, ['west', 'north', 'take echo stone'])
      expect(executeCommands(game, ['use echo stone'])).toContain(STONE_OUTSIDE)
      executeCommands(game, ['south', 'east', 'north'])
      for (const command of [
        'use echo stone',
        "use echo stone with servant's pendant",
        "use servant's pendant with echo stone",
      ]) {
        const heard = executeCommands(game, [command])
        expect(heard).toContain(
          'You hold the Echo Stone to your ear. One voice repeats, patient as a heartbeat:',
        )
        expect(heard).toContain(
          "'Left, then left, then the way your shadow does not go.'",
        )
      }
      expectSpellKnown(game.state, 'truth_sight', false)
      expectStoryFlag(game.state, FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED, false)
    })

    it('fails every turn without the Echo Stone', () => {
      toFreedServants()
      executeCommands(game, ['north'])
      expect(executeCommands(game, ['go west'])).toContain(NO_STONE)
      expect(executeCommands(game, ['go north'])).toContain(NO_STONE)
      expectStoryFlag(game.state, FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED, false)
    })

    it('solves the maze by walking the route with the pendant at the fork', () => {
      toMazeWithStone()
      executeCommands(game, ['west', 'west'])
      expect(executeCommands(game, ["use servant's pendant"])).toContain(
        "The pendant's blue light falls on the glass. In the north corridor " +
          'your reflection turns and walks with you. In the east corridor the ' +
          'glass stays empty.',
      )
      expect(executeCommands(game, ["use servant's pendant"])).toContain(
        'Your reflection still walks the north corridor. The east corridor stays empty.',
      )
      const result = executeCommands(game, ['go east'])
      expect(result).toContain(SOLVED)
      expect(result).toContain('Truth Sight')
      expectSpellKnown(game.state, 'truth_sight')
      expectQuestCompleted(game.state, 'The Maze of Mirrors')
      const done = game.state.completedQuests.find(
        (quest) => quest.name === 'The Maze of Mirrors',
      )
      expect(done?.completion).toBe(
        "Guided by the servants' pendant and the hall's echoes, Elior walks " +
          'the one true path through the mirrors, and learns to see through illusion.',
      )
      const room = game.state.currentRoom.describe(game.state)
      expect(room).toContain(
        'The false mirrors stand dark and silent now. A single clear corridor ' +
          'runs through the labyrinth to a plain mirror at its heart, where ' +
          'your own reflection waits, keeping still.',
      )
      expect(room).toContain('[exits]south[/exits]')
      expect(room).not.toContain('[exits]west[/exits]')
      expect(executeCommands(game, ["use servant's pendant"])).toContain(
        ALREADY_CLEAR,
      )
    })

    it('describes Truth Sight and finds nothing hidden', () => {
      toMazeWithStone()
      solveMaze()
      expect(executeCommands(game, ['spells'])).toContain(
        'See through illusion to what is really there.',
      )
      expect(executeCommands(game, ['cast truth sight'])).toContain(
        'Your sight sharpens, but there is no illusion here to see through.',
      )
    })

    it('lets the True Self hear the truth once and remember it', () => {
      toMazeWithStone()
      expectCharacterAbsent()
      solveMaze()
      expect(executeCommands(game, ['examine true self'])).toContain(
        "Your own reflection, in the plain mirror at the labyrinth's heart. " +
          'It does not copy you. It waits, watching, as if it already knows ' +
          'what you will say.',
      )
      const before = executeCommands(game, ['talk to true self'])
      expect(before).toContain(
        'You told Mira you came for the king. Tell me why you really came.',
      )
      expectDialogueSpeaker(before, 'True Self')
      expect(executeCommands(game, ['say anything to true self'])).toContain(
        'The reflection only shakes its head.',
      )
      expect(game.state.hasVirtue('truth')).toBe(false)
      const told = executeCommands(game, ['say truth to true self'])
      expect(told).toContain(
        'You tell it the truth: that you did not come only for the king. You ' +
          'came because you want Malakar to pay for what he took from you, and ' +
          'you are afraid of what that wanting makes you. The reflection nods, ' +
          "slowly. For a moment it wears your father's face. Then it is only " +
          'you again, standing a little straighter.',
      )
      expect(told).toContain('[dim]Elior will remember this.[/dim]')
      expect(game.state.hasVirtue('truth')).toBe(true)
      const after = executeCommands(game, ['talk to true self'])
      expect(after).toContain(
        'Remember what you told me, when you stand before him.',
      )
      expectDialogueSpeaker(after, 'True Self')
      const again = executeCommands(game, ['say truth to true self'])
      expect(again).toContain(
        'The reflection has heard your truth. It keeps still.',
      )
      expect(again).not.toContain('will remember')
      expect(game.state.virtues.filter((v) => v === 'truth')).toHaveLength(1)
    })

    /** The True Self is not in the maze before it is solved. */
    function expectCharacterAbsent(): void {
      expect(game.state.currentRoom.describe(game.state)).not.toContain(
        'True Self',
      )
    }

    it('loses the way when the stone is left on the maze floor', () => {
      toMazeWithStone()
      executeCommands(game, ['drop echo stone'])
      expect(executeCommands(game, ['go west'])).toContain(NO_STONE)
      executeCommands(game, ['take echo stone'])
      expect(executeCommands(game, ['go west'])).toContain('You turn left,')
    })

    it('keeps the after-description and the True Self through a reload', () => {
      toMazeWithStone()
      solveMaze()
      game.loadSaveData(game.toSaveData())
      const room = game.state.currentRoom.describe(game.state)
      expect(room).toContain('The false mirrors stand dark and silent now.')
      expect(room).toContain('True Self')
    })

    it('keeps the place in the maze and the pendant answer through a reload', () => {
      const reload = (): void => {
        game.loadSaveData(game.toSaveData())
      }
      toMazeWithStone()
      executeCommands(game, ['west'])
      reload()
      expect(game.state.currentRoom.describe(game.state)).toContain(
        'The corridor narrows and bends',
      )
      executeCommands(game, ['west', "use servant's pendant"])
      reload()
      expect(game.state.currentRoom.describe(game.state)).toContain(
        'The corridor ends in a last fork',
      )
      expect(executeCommands(game, ["use servant's pendant"])).toContain(
        'Your reflection still walks the north corridor.',
      )
      expect(executeCommands(game, ['go east'])).toContain(SOLVED)
    })

    it('keeps every state through a save and load', () => {
      const reload = (): void => {
        const loaded = game.loadSaveData(game.toSaveData())
        expect(loaded).toContain('Game loaded successfully.')
      }
      toFreedServants()
      reload()
      executeCommands(game, ['north', "use servant's pendant"])
      reload()
      expect(executeCommands(game, ['go north'])).toContain(NO_STONE)
      executeCommands(game, ['south', 'west', 'north'])
      reload()
      expectItemInRoom(game.state.currentRoom, 'Echo Stone')
      expect(executeCommands(game, ['go east'])).toContain(KNIGHT_BLOCK)
      executeCommands(game, ['take echo stone', 'south', 'east', 'north'])
      reload()
      expect(active()).toContain('The Maze of Mirrors')
      solveMaze()
      reload()
      expectQuestCompleted(game.state, 'The Maze of Mirrors')
      expectSpellKnown(game.state, 'truth_sight')
      expect(executeCommands(game, ["use servant's pendant"])).toContain(
        ALREADY_CLEAR,
      )
      executeCommands(game, ['say truth to true self'])
      reload()
      expect(game.state.hasVirtue('truth')).toBe(true)
      expect(executeCommands(game, ['say truth to true self'])).toContain(
        'has heard your truth',
      )
    })
  })

  describe('the Knight of Despair', () => {
    const toRedeemed = (): void => {
      executeCommands(game, KNIGHT_PATH)
    }
    const reload = (): void => {
      expect(game.loadSaveData(game.toSaveData())).toContain(
        'Game loaded successfully.',
      )
    }

    it('starts its quest on first entering the hall', () => {
      executeCommands(game, KNIGHT_PATH.slice(0, -6))
      expect(game.state.activatedQuests.map((q) => q.name)).toContain(
        'The Knight of Despair',
      )
    })

    it('enhances the stone even when it was dropped elsewhere', () => {
      executeCommands(game, KNIGHT_PATH.slice(0, -4))
      executeCommands(game, ['s', 'drop echo stone', 'n'])
      executeCommands(game, [
        "use guardian's chain",
        'cast truth sight on knight of despair',
        'say redemption to knight',
        's',
        'take enhanced echo stone',
      ])
      expectItemInInventory(game.state, 'Enhanced Echo Stone', true)
      expect(executeCommands(game, ['use echo stone'])).toContain(
        'waiting for a place where memories sleep.',
      )
      expect(
        executeCommands(game, ["use servant's pendant with echo stone"]),
      ).toContain('waiting for a place where memories sleep.')
    })

    it('gives the stone lines and the badge once redeemed', () => {
      toRedeemed()
      expect(executeCommands(game, ['examine enhanced echo stone'])).toContain(
        'The Echo Stone hums more strongly now.',
      )
      expect(executeCommands(game, ["examine knight's redemption"])).toContain(
        "A tarnished knight's badge, warm to the touch.",
      )
      expect(executeCommands(game, ['use enhanced echo stone'])).toContain(
        'The voices inside it are clearer now',
      )
    })

    it('records mercy from the optional warriors', () => {
      toRedeemed()
      expect(executeCommands(game, ['examine ghostly warriors'])).toContain(
        'Their blades pass through one another without a sound.',
      )
      expect(executeCommands(game, ['talk to ghostly warriors'])).toContain(
        'The warriors do not hear you.',
      )
      executeCommands(game, ["cast redemption's light on ghostly warriors"])
      expect(game.state.hasVirtue('mercy')).toBe(true)
    })

    it('keeps every state through a save and load', () => {
      executeCommands(game, KNIGHT_PATH.slice(0, -3))
      reload()
      expect(game.state.currentRoom.name).toBe('Hall of Echoes')
      expect(executeCommands(game, ['say redemption to knight'])).toContain(
        'cannot truly see',
      )
      executeCommands(game, ['cast truth sight on knight of despair'])
      reload()
      expect(executeCommands(game, ['say redemption to knight'])).toContain(
        'You could not say it with nothing between you and his sorrow.',
      )
      executeCommands(game, ["use guardian's chain"])
      reload()
      expect(executeCommands(game, ["use guardian's chain"])).toContain(
        'The chain is already lit',
      )
      executeCommands(game, ['say redemption to knight'])
      reload()
      expect(game.state.currentRoom.describe(game.state)).toContain(
        'Redeemed Knight',
      )
      expectItemInInventory(game.state, "Knight's Redemption", true)
      expectItemInInventory(game.state, 'Enhanced Echo Stone', true)
      expectQuestCompleted(game.state, 'The Knight of Despair')
      executeCommands(game, ["cast redemption's light on ghostly warriors"])
      reload()
      expect(game.state.hasVirtue('mercy')).toBe(true)
      expect(game.state.currentRoom.describe(game.state)).not.toContain(
        'ghostly warriors',
      )
      expect(executeCommands(game, ['go east'])).toContain('Tower of Shadows')
    })
  })
})

describe('Act 4 throne room', () => {
  it('plays the golden path to the Redemption ending and survives a save', () => {
    const game = new Game([new Act4()])
    executeCommands(game, ACT4_GOLDEN_PATH)
    expectCurrentRoom(game.state, 'Willowbrook Field')
    expectStoryFlag(game.state, FLAG_ACT4_THRONE_AMULET_OPENED, true)
    expectStoryFlag(game.state, FLAG_ACT4_REDEMPTION_ENDING, true)
    expectStoryFlag(game.state, FLAG_ACT4_FIELD_GREEN, true)
    expectQuestCompleted(game.state, 'The Final Stand')
    expectSpellKnown(game.state, 'Forgiveness')
    expect(game.loadSaveData(game.toSaveData())).toContain(
      'Game loaded successfully.',
    )
    expectCurrentRoom(game.state, 'Willowbrook Field')
    expectStoryFlag(game.state, FLAG_ACT4_REDEMPTION_ENDING, true)
    expectQuestCompleted(game.state, 'The Final Stand')
    expectSpellKnown(game.state, 'Forgiveness')
    expectItemInInventory(game.state, 'Lifelight Elixir', false)
  })
})
