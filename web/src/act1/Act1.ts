import { Act, characterName, type GameState } from '@/engine'
import { TheDream } from './rooms/TheDream'
import { EliorsCottage } from './rooms/EliorsCottage'
import { VegetableField } from './rooms/VegetableField'
import { ChickenCoop } from './rooms/ChickenCoop'
import { VillageSquare } from './rooms/VillageSquare'
import { MirasHut } from './rooms/MirasHut'
import { BlacksmithsForge } from './rooms/BlacksmithsForge'
import { GeneralStore } from './rooms/GeneralStore'
import { VillageWell } from './rooms/VillageWell'
import { AbandonedShed } from './rooms/AbandonedShed'
import { OldMill } from './rooms/OldMill'
import { Riverbank } from './rooms/Riverbank'
import { ForestPath } from './rooms/ForestPath'
import { HiddenGlade } from './rooms/HiddenGlade'
import { VillageChapel } from './rooms/VillageChapel'
import { RoadToGreendale } from './rooms/RoadToGreendale'
import { Hearth } from './items/Hearth'
import { Lantern } from './items/Lantern'
import { Bucket } from './items/Bucket'
import { WitheredCarrot } from './items/WitheredCarrot'
import { Bread } from './items/Bread'
import { Scenery } from './items/Scenery'
import { Vines } from './items/Vines'
import { HintOfMagicQuest } from './quests/HintOfMagic'
import { CuriosityKilledTheCatQuest } from './quests/CuriosityKilledTheCat'
import { FishingExpeditionQuest } from './quests/FishingExpedition'
import { KnowYourVillageQuest } from './quests/KnowYourVillage'
import { LetThereBeLightQuest } from './quests/LetThereBeLight'
import { MagicForRealQuest } from './quests/MagicForReal'
import { MagnetFishingExpeditionQuest } from './quests/MagnetFishingExpedition'
import { OhDeerOhDeerQuest } from './quests/OhDeerOhDeer'
import { PreparingForTheRoadQuest } from './quests/PreparingForTheRoad'
import { FadedPhotographQuest } from './quests/FadedPhotograph'
import { ShadowsOverWillowbrookQuest } from './quests/ShadowsOverWillowbrook'
import {
  FLAG_LANTERN_LIT,
  FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED,
  FLAG_VEGETABLE_FIELD_WATERED,
} from './Act1StoryFlags'
import { ACT1_CLASSES } from './classes'
import { ACT1_GOLDEN_PATH } from './Act1GoldenPath'
import { Shopkeeper } from './characters/Shopkeeper'
import { Blacksmith } from './characters/Blacksmith'
import { Villager } from './characters/Villager'

/** Act 1: The Call to Adventure, set in the village of Willowbrook. */
export class Act1 extends Act {
  constructor() {
    const rooms = {
      TheDream: new TheDream(),
      EliorsCottage: new EliorsCottage(),
      VegetableField: new VegetableField(),
      ChickenCoop: new ChickenCoop(),
      VillageSquare: new VillageSquare(),
      MirasHut: new MirasHut(),
      BlacksmithsForge: new BlacksmithsForge(),
      GeneralStore: new GeneralStore(),
      VillageWell: new VillageWell(),
      AbandonedShed: new AbandonedShed(),
      OldMill: new OldMill(),
      Riverbank: new Riverbank(),
      ForestPath: new ForestPath(),
      HiddenGlade: new HiddenGlade(),
      VillageChapel: new VillageChapel(),
      RoadToGreendale: new RoadToGreendale(),
    }
    const quests = [
      new ShadowsOverWillowbrookQuest(),
      new HintOfMagicQuest(),
      new CuriosityKilledTheCatQuest(),
      new FishingExpeditionQuest(),
      new KnowYourVillageQuest(),
      new LetThereBeLightQuest(),
      new MagicForRealQuest(),
      new MagnetFishingExpeditionQuest(),
      new OhDeerOhDeerQuest(),
      new PreparingForTheRoadQuest(),
      new FadedPhotographQuest(),
    ]
    super({
      name: 'Act1',
      rooms,
      quests,
      musicFile: 'Conquest - Market (freetouse.com).mp3',
      musicInfo:
        'Market by Conquest\nSource: https://freetouse.com/music\nCopyright Free Background Music',
      classes: ACT1_CLASSES,
      goldenPath: ACT1_GOLDEN_PATH,
    })
  }

  override getActIntro(): string {
    return (
      '[bold]ACT 1: THE CALL TO ADVENTURE[/bold]\n\n' +
      `You are ${characterName('Elior')}, a farmer boy in the village of Willowbrook, on the outskirts of Eldoria. ` +
      `Your ${characterName('grandmother')} raised you after your parents vanished, and your days are the crops, the hens and the weather.\n` +
      '\nTonight the weather is a storm, and a light that is not lightning has split the sky over the fields. ' +
      'Sleep, when it comes, is not quiet.\n'
    )
  }

  /** The hook that opens Act I's complete page: the amulet and the search for it. */
  override getCompletionHook(): string {
    return (
      "The amulet was your parents'. " +
      'And someone has come to Willowbrook looking for it.'
    )
  }

  /**
   * Bring older saves up to date: drop the matches the store's wares still
   * sell, name the villager Tilda, the smith Borin and the shopkeeper
   * Hemlock, and give the cottage the hearth it lacked, and give every room the
   * examinable things it names (the shed's once its door is open, the forest
   * path's alcove and cut vines once the vines are cut). Rooms and items
   * whose saved wording changed refresh it themselves (`refreshSavedText`).
   */
  override afterLoad(gameState: GameState): void {
    const rooms = gameState.allRooms
    if (!rooms.EliorsCottage.getItemByName('hearth')) {
      rooms.EliorsCottage.addItem(new Hearth())
    }
    this.restoreCottageLoaf(gameState)
    this.migrateLegacyItemState(gameState)
    this.restoreLanternLit(gameState)
    for (const [roomKey, room] of Object.entries(rooms)) {
      Scenery.ensure(room, roomKey)
    }
    const shed = rooms.AbandonedShed
    if (shed instanceof AbandonedShed && !shed.locked) {
      Scenery.ensure(shed, 'AbandonedShed', 'open')
    }
    const path = rooms.ForestPath
    if (!path.items.some((item) => item instanceof Vines)) {
      Scenery.ensure(path, 'ForestPath', 'cut')
    }
    for (const room of Object.values(gameState.allRooms)) {
      for (const character of room.characters) {
        if (character instanceof Shopkeeper) {
          character.migrateLegacyWares()
          character.migrateLegacyName()
          character.migrateLegacyRope(gameState)
        }
        if (character instanceof Villager) character.migrateLegacyName()
        if (character instanceof Blacksmith) character.migrateLegacyName()
      }
    }
  }

  /**
   * Give the bucket, the carrot and the lantern of an older save the state
   * field they now keep, read from how they were then told apart.
   */
  private migrateLegacyItemState(gameState: GameState): void {
    const items = [
      ...gameState.inventory,
      ...Object.values(gameState.allRooms).flatMap((room) => room.items),
    ]
    for (const item of items) {
      if (
        item instanceof Bucket ||
        item instanceof WitheredCarrot ||
        item instanceof Lantern
      ) {
        item.migrateLegacyState()
      }
    }
  }

  /**
   * Saves made while the lantern was still unlit never had the loaf, which
   * used to appear only on lighting it; it now lies in the cottage from the
   * start. A lit lantern means the loaf was already revealed (and maybe eaten
   * by the chickens), so only an unlit one gets it back, and never while
   * Elior already carries it.
   */
  private restoreCottageLoaf(gameState: GameState): void {
    const cottage = gameState.allRooms.EliorsCottage
    const lantern = cottage.items.find((item) => item instanceof Lantern)
    const carriesBread = gameState.inventory.some(
      (item) => item instanceof Bread,
    )
    if (
      lantern instanceof Lantern &&
      !lantern.isLit() &&
      !carriesBread &&
      !cottage.getItemByName('bread')
    ) {
      cottage.addItem(new Bread())
    }
  }

  /**
   * Saves made before the lantern raised FLAG_LANTERN_LIT get it from the
   * lantern itself, lit wherever it now lies or is carried.
   */
  private restoreLanternLit(gameState: GameState): void {
    const items = [
      ...gameState.inventory,
      ...Object.values(gameState.allRooms).flatMap((room) => room.items),
    ]
    if (items.some((item) => item instanceof Lantern && item.isLit())) {
      gameState.setStoryFlag(FLAG_LANTERN_LIT, true)
    }
  }

  override isCompleted(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED)
  }

  /** Whether the field was watered travels to the epilogue, which remembers it. */
  override carriedFlags(): string[] {
    return [FLAG_VEGETABLE_FIELD_WATERED]
  }
}
