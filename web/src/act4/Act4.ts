import { Act, type GameState } from '@/engine'
import { AncientAmulet } from './items/AncientAmulet'
import { LifelightElixir } from './items/LifelightElixir'
import { FortressGates } from './rooms/FortressGates'
import { OuterCourtyard } from './rooms/OuterCourtyard'
import { MirrorLabyrinth } from './rooms/MirrorLabyrinth'
import { HallOfEchoes } from './rooms/HallOfEchoes'
import { TowerOfShadows } from './rooms/TowerOfShadows'
import { ChamberOfWhispers } from './rooms/ChamberOfWhispers'
import { MemoryVault } from './rooms/MemoryVault'
import { ParentsVault } from './rooms/ParentsVault'
import { ThroneChamer } from './rooms/ThroneChamer'
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
import { FLAG_ACT4_FIELD_GREEN, FLAG_ACT4_MAIN_STARTED } from './Act4StoryFlags'
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
      ThroneChamer: new ThroneChamer(),

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

  /** Return the introductory text for Act IV. */
  override getActIntro(): string {
    return (
      '[bold]ACT IV: THE FINAL CONFRONTATION[/bold]\n\n' +
      "With the Lifelight Elixir in hand, you stand before Malakar's fortress. " +
      'The obsidian gates loom ahead, wreathed in shadow and ancient magic. ' +
      'Mira steps through the gates beside you, pale but unbending. She and ' +
      'Sir Cedric take up their places just inside the threshold — someone ' +
      'must hold the way out. From here, you go on alone. ' +
      'This is the culmination of your journey—a test of courage, wisdom, and ' +
      'selflessness that will determine the fate of the kingdom.\n\n' +
      'The final confrontation awaits. Every choice you make will echo through ' +
      'eternity.\n\n' +
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

    // The main quest starts when the act opens
    gameState.setStoryFlag(FLAG_ACT4_MAIN_STARTED, true)

    // Set starting room to Fortress Gates
    if ('FortressGates' in this.rooms) {
      gameState.currentRoom = this.rooms.FortressGates
    }
  }
}
