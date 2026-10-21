import { Act, type GameState, dialogue } from '@/engine'
import { AncientAmulet } from './items/AncientAmulet'
import { LifelightElixir } from './items/LifelightElixir'
import { LoyaltyToken } from './items/LoyaltyToken'
import { WardStone } from './items/WardStone'
import { Whispers } from './characters/Whispers'
import { FortressGates } from './rooms/FortressGates'
import { OuterCourtyard } from './rooms/OuterCourtyard'
import { MirrorLabyrinth } from './rooms/MirrorLabyrinth'
import { HallOfEchoes } from './rooms/HallOfEchoes'
import { TowerOfShadows } from './rooms/TowerOfShadows'
import { ChamberOfWhispers } from './rooms/ChamberOfWhispers'
import { MemoryVault } from './rooms/MemoryVault'
import { ParentsVault } from './rooms/ParentsVault'
import { ThroneChamber } from './rooms/ThroneChamber'
import { WillowbrookField } from './rooms/WillowbrookField'
import { Light } from './spells/Light'
import { Bless } from './spells/Bless'
import { TheFinalStand } from './quests/TheFinalStand'
import { ShatteredWardGuardians } from './quests/ShatteredWardGuardians'
import { TheTrappedServants } from './quests/TheTrappedServants'
import { TheMazeOfMirrors } from './quests/TheMazeOfMirrors'
import { TheKnightOfDespair } from './quests/TheKnightOfDespair'
import { TheSorceressOfLies } from './quests/TheSorceressOfLies'
import { TheShadowOfThePast } from './quests/TheShadowOfThePast'
import { TheParentsLegacy } from './quests/TheParentsLegacy'
import {
  FLAG_ACT4_FIELD_GREEN,
  FLAG_ACT4_MAIN_STARTED,
  FLAG_ACT4_TOWER_STAIR_OPEN,
  LEGACY_FLAG_ACT4_LOYALTY_TOKEN_RAISED,
} from './Act4StoryFlags'
import { ENDING_HOOKS, endingPlayed } from './endings'
import { ACT4_CLASSES } from './classes'
import { ACT4_GOLDEN_PATH } from './Act4GoldenPath'

/** Act 4 of RetroQuest: The Final Confrontation. */
export class Act4 extends Act {
  constructor() {
    const rooms = {
      // Fortress entrance
      FortressGates: new FortressGates(),
      OuterCourtyard: new OuterCourtyard(),

      // Inner fortress
      MirrorLabyrinth: new MirrorLabyrinth(),
      HallOfEchoes: new HallOfEchoes(),
      TowerOfShadows: new TowerOfShadows(),
      ChamberOfWhispers: new ChamberOfWhispers(),
      MemoryVault: new MemoryVault(),
      ParentsVault: new ParentsVault(),

      // Final area (entered north from the Parents' Vault)
      ThroneChamber: new ThroneChamber(),

      // The end of the story, entered north from the Throne Chamber
      WillowbrookField: new WillowbrookField(),
    }

    super({
      name: 'Act4',
      rooms,
      // The main quest and the side quests of the stretch that is built so far
      quests: [
        new TheFinalStand(),
        new ShatteredWardGuardians(),
        new TheTrappedServants(),
        new TheMazeOfMirrors(),
        new TheKnightOfDespair(),
        new TheSorceressOfLies(),
        new TheShadowOfThePast(),
        new TheParentsLegacy(),
      ],
      musicFile: 'Conquest - The Silver Grail (freetouse.com).mp3',
      musicInfo:
        'Music track: The Silver Grail by Conquest\n' +
        'Source: https://freetouse.com/music\n' +
        'Music for Videos (Free Download)\n',
      classes: ACT4_CLASSES,
      goldenPath: ACT4_GOLDEN_PATH,
    })
  }

  /** Return the introductory text for Act IV: the companions' goodbye at the gate. */
  override getActIntro(): string {
    return (
      '[bold]ACT IV: THE FINAL CONFRONTATION[/bold]\n\n' +
      "With the Lifelight Elixir in hand, you stand before Malakar's fortress. " +
      'The obsidian gates loom ahead, wreathed in shadow and ancient magic. ' +
      'Mira steps through the gates beside you, pale but unbending. She and ' +
      'Sir Cedric take up their places just inside the threshold — someone ' +
      'must hold the way out. A small light settles on the gatepost: Nyx, ' +
      'keeping close.\n\n' +
      dialogue(
        'Mira',
        "Someone has to keep the way out open, and that's me. So come back " +
          'through it.',
      ) +
      '\n' +
      dialogue(
        'Sir Cedric',
        'I held a gate once and lost a king behind it. I will not lose this ' +
          'one, or you.',
      ) +
      '\n' +
      dialogue(
        'Nyx',
        "I'll be the light at the edge of your eye. Don't look for me. Just " +
          'know.',
      ) +
      '\n\n' +
      'Mira presses something into your hand: a small silver medallion, two ' +
      'hands clasped on its face. Sir Cedric lays his hand over hers; the ' +
      'light on the gatepost leans in.\n\n' +
      dialogue(
        'Mira',
        "If it goes quiet in there, say our names. We'll hear.",
      ) +
      '\n\n' +
      'The halls beyond are yours to walk, but you will not be far from ' +
      'them.\n\n' +
      "Let's begin. (Type 'help' for a list of commands.)\n"
    )
  }

  /** The line that opens the complete page, naming the ending played. */
  override getCompletionHook(gameState: GameState): string {
    const ending = endingPlayed(gameState)
    return ending ? ENDING_HOOKS[ending] : ''
  }

  /** Act IV, and the game, ends when grow has greened the field. */
  override isCompleted(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT4_FIELD_GREEN)
  }

  /** After Sacrifice the lost spells are gone, not merely unknown. */
  override unknownSpell(
    gameState: GameState,
    _spellName: string,
  ): string | null {
    return endingPlayed(gameState) === 'sacrifice'
      ? '[failure]That magic is gone from you now.[/failure]'
      : null
  }

  /**
   * Saves from before the friends were named to the whispers: the old flag
   * for the raised token now means the stair is open, a tower still barred
   * gets its whispers, and the Loyalty Token (once found in the courtyard) is
   * moved into the pack. Saves from before the three ward stones stood at the
   * Fortress Gates get them back, so the gates can still be solved.
   */
  override afterLoad(gameState: GameState): void {
    const gates = gameState.allRooms.FortressGates
    if (gates && !gates.getItemByName('Right Stone')) {
      for (const side of ['left', 'middle', 'right'] as const) {
        gates.addItem(new WardStone(side))
      }
    }
    const legacyOpen = gameState.getStoryFlag(
      LEGACY_FLAG_ACT4_LOYALTY_TOKEN_RAISED,
    )
    if (legacyOpen) gameState.setStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN, true)
    const tower = gameState.allRooms.TowerOfShadows
    // An old save is one that has the legacy flag, or a barred tower with no whispers
    let oldSave = legacyOpen
    if (
      tower &&
      !gameState.getStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN) &&
      !tower.getCharacterByName('whispers')
    ) {
      tower.addCharacter(new Whispers())
      oldSave = true
    }
    if (oldSave && !gameState.hasItem('Loyalty Token')) {
      const room = Object.values(gameState.allRooms).find((r) =>
        r.getItemByName('Loyalty Token'),
      )
      const token = room?.removeItem('Loyalty Token')
      gameState.addItemToInventory(token ?? new LoyaltyToken())
    }
  }

  /** Setup initial state for Act IV. */
  override setupGameState(gameState: GameState): void {
    // Add basic spells that player needs for phase 1
    const lightSpell = new Light()
    const blessSpell = new Bless()

    // Add spells to known spells if not already known
    if (!gameState.hasSpell(lightSpell.id)) {
      gameState.learnSpell(lightSpell)
    }
    if (!gameState.hasSpell(blessSpell.id)) {
      gameState.learnSpell(blessSpell)
    }

    // Mira gave Elior the amulet at the end of Act I; it opens the Memory Vault's door
    gameState.addItemToInventory(new AncientAmulet())
    // The Lifelight Elixir from Act III: its one use is the choice in the throne room
    gameState.addItemToInventory(new LifelightElixir())
    // The companions' Loyalty Token, handed over at the gate in the intro
    gameState.addItemToInventory(new LoyaltyToken())

    // The main quest starts when the act opens
    gameState.setStoryFlag(FLAG_ACT4_MAIN_STARTED, true)

    // Set starting room to Fortress Gates
    if ('FortressGates' in this.rooms) {
      gameState.currentRoom = this.rooms.FortressGates
    }
  }
}
