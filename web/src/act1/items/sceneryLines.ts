/**
 * The things Act I's room descriptions name that can be examined: for each
 * room, the chips it shows, the words that answer to them and the line
 * examine reads, in the order the chips appear. Lines that follow the story
 * read the game state when they are examined, so a load never needs to
 * refresh them. The table is code, not saved state: a saved `Scenery` keeps
 * its key and chip label, and takes the rest from here.
 */
import { writing, type GameState, type Room } from '@/engine'
import {
  FLAG_COOP_KEY_FELL,
  FLAG_PATCHES_FOUND,
  FLAG_PATCHES_RETURNED,
  FLAG_VEGETABLE_FIELD_WATERED,
} from '../Act1StoryFlags'
import { Candle } from './Candle'
import { Key } from './Key'
import { Mechanism } from './Mechanism'

/** When a chip first shows, if not from the first visit. */
export type SceneryAppearance = 'open' | 'cut'

/** One examinable thing: its chip label, typed words and examine line. */
export interface SceneryDef {
  /** The unique id a saved `Scenery` keeps, `<Room>.<thing>`. */
  key: string
  /** The chip label, which is also a typed word. */
  name: string
  /** The other typed words. */
  aliases: string[]
  /** The line examine reads now. */
  line: (gameState: GameState) => string
  /** `open` once the shed door is unlocked, `cut` once the vines are cut. */
  appears?: SceneryAppearance
}

/** A thing whose line never changes. */
function plain(
  key: string,
  name: string,
  aliases: string[],
  text: string,
  appears?: SceneryAppearance,
): SceneryDef {
  return { key, name, aliases, line: () => text, appears }
}

/** A thing whose line follows the game state when it is examined. */
function staged(
  key: string,
  name: string,
  aliases: string[],
  line: (gameState: GameState) => string,
): SceneryDef {
  return { key, name, aliases, line }
}

/** Whether the shed's door has been unlocked, read without importing the room. */
function shedOpen(gameState: GameState): boolean {
  const shed: Room | null = gameState.getRoom('Abandoned Shed')
  return shed !== null && 'locked' in shed && shed.locked === false
}

/** Whether the key has fallen from the coop's rafter. */
function keyFell(gameState: GameState): boolean {
  return (
    gameState.getStoryFlag(FLAG_COOP_KEY_FELL) ||
    gameState.currentRoom.items.some((item) => item instanceof Key) ||
    gameState.inventory.some((item) => item instanceof Key) ||
    shedOpen(gameState)
  )
}

/** Whether the room the player is in holds a lit candle. */
function candleLit(gameState: GameState): boolean {
  return gameState.currentRoom.items.some(
    (item) => item instanceof Candle && item.isLit,
  )
}

/** Whether the stranger's mechanism in this room is jammed. */
function mechanismJammed(gameState: GameState): boolean {
  return gameState.currentRoom.items.some(
    (item) => item instanceof Mechanism && item.repaired,
  )
}

/** Whether `light` has lifted the glade's darkness. */
function gladeLit(gameState: GameState): boolean {
  const room = gameState.currentRoom
  return 'lightSpellCast' in room && room.lightSpellCast === true
}

/** The refrain carved on the glade's stone, word for word. */
const REFRAIN = 'Power follows purpose; purpose follows truth.'

/** Every room's examinable things, by the room's key in the act. */
export const SCENERY_BY_ROOM: Record<string, SceneryDef[]> = {
  EliorsCottage: [
    plain(
      'EliorsCottage.table',
      'table',
      [],
      'A sturdy table, scrubbed pale. ' +
        'There are knife marks at one end, where the bread is always cut.',
    ),
    plain(
      'EliorsCottage.shelves',
      'shelves',
      ['trinkets'],
      'Trinkets crowd the shelves: a chipped cup, a carved bird, ' +
        'a shell from a sea you have never seen. ' +
        'Grandmother dusts around them and never moves them.',
    ),
    plain(
      'EliorsCottage.books',
      'books',
      [],
      'Old books with soft, cracked spines, most of them almanacs. ' +
        'They have been read more than they have been dusted.',
    ),
  ],
  VegetableField: [
    staged('VegetableField.crops', 'crops', ['rows', 'leaves'], (gs) =>
      gs.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED)
        ? 'Young leaves, green and cool, stand up from the rows. ' +
          'The stalks bend in the breeze and come back.'
        : 'The leaves curl brown at the edges and break when you touch them. ' +
          'The stalks are still standing.',
    ),
    staged('VegetableField.earth', 'earth', ['soil', 'ground'], (gs) =>
      gs.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED)
        ? 'The earth is dark and gives under your boot. ' +
          'Water still shines in the furrows.'
        : 'The earth is cracked into plates. It is dry a finger deep.',
    ),
  ],
  ChickenCoop: [
    plain(
      'ChickenCoop.coop',
      'coop',
      ['planks'],
      'The planks have been patched with whatever came to hand: ' +
        'a cupboard door, part of a cart.',
    ),
    plain(
      'ChickenCoop.nests',
      'nests',
      ['straw'],
      'Straw nests in a row along the wall, ' +
        'each pressed into the shape of the hen that keeps it.',
    ),
    staged('ChickenCoop.rafter', 'rafter', [], (gs) =>
      keyFell(gs)
        ? 'Only dust and a few feathers on the rafter now.'
        : 'The rafter is high and dusty. ' +
          'Something on it catches the light, out of your reach.',
    ),
  ],
  VillageSquare: [
    plain(
      'VillageSquare.fountain',
      'fountain',
      ['basin'],
      'Water trickles from the mouth of a stone fish into the basin. ' +
        'The rim is worn smooth where people sit, ' +
        'but no one is sitting there today.',
    ),
    plain(
      'VillageSquare.cobblestones',
      'cobblestones',
      ['cobbles'],
      'Old cobbles, rounded by feet and cartwheels. ' +
        'A few have been lifted and never put back.',
    ),
    plain(
      'VillageSquare.noticeBoard',
      'notice board',
      ['board'],
      'Notices pinned over notices, most too faded to read. ' +
        'The newest is about a lost cat.',
    ),
    plain(
      'VillageSquare.marketStalls',
      'market stalls',
      ['stalls', 'market'],
      'Half the stalls are bare boards with the awnings rolled up. ' +
        'The ones still open sell bread, onions and very little else.',
    ),
  ],
  MirasHut: [
    plain(
      'MirasHut.bundles',
      'bundles',
      ['lavender', 'sage', 'roots', 'rafters'],
      'Lavender, sage and roots hang drying in bundles, ' +
        'each tied with the same green thread.',
    ),
    plain(
      'MirasHut.bottles',
      'bottles',
      ['shelves'],
      "Every bottle is labelled in Mira's small, upright hand. " +
        'Some of the labels are older than you are.',
    ),
  ],
  BlacksmithsForge: [
    plain(
      'BlacksmithsForge.coals',
      'coals',
      ['hearth'],
      'The coals glow orange under a crust of grey. ' +
        'Borin feeds them without looking.',
    ),
    plain(
      'BlacksmithsForge.anvil',
      'anvil',
      [],
      'The anvil is bright on top and black everywhere else. ' +
        'It rings for a long time after each blow.',
    ),
    plain(
      'BlacksmithsForge.hinges',
      'hinges',
      ['ploughshares', 'walls'],
      'Hinges and ploughshares hang on the walls, ' +
        'each tied with a scrap of cloth with a name on it. ' +
        'You know most of the names.',
    ),
    plain(
      'BlacksmithsForge.hammer',
      'hammer',
      [],
      "Borin's hammer. The handle is dark where his hand goes.",
    ),
  ],
  GeneralStore: [
    plain(
      'GeneralStore.trinkets',
      'trinkets',
      ['shelves'],
      'Between the rope and the apples sit trinkets nobody has bought in years: ' +
        'a brass bell, a doll with one shoe, a tin of buttons.',
    ),
    plain(
      'GeneralStore.jars',
      'jars',
      [],
      'Jars of nails, buttons and boiled sweets, every lid dusted.',
    ),
    staged('GeneralStore.counter', 'counter', [], (gs) =>
      gs.getStoryFlag(FLAG_PATCHES_RETURNED)
        ? 'Patches sleeps on her folded blanket at the end of the counter. ' +
          'One ear turns toward you.'
        : 'The counter is worn into a dip where things are set down. ' +
          'A folded blanket lies at one end, with cat hair on it.',
    ),
  ],
  VillageWell: [
    plain(
      'VillageWell.moss',
      'moss',
      ['stones'],
      'Moss grows thick on the north side of the stones, ' +
        'where the sun never reaches.',
    ),
  ],
  AbandonedShed: [
    plain(
      'AbandonedShed.boards',
      'boards',
      [],
      'Grey boards, warped and grimy. Light comes through the cracks in thin lines.',
    ),
    plain(
      'AbandonedShed.workbench',
      'workbench',
      ['bench'],
      'A long workbench, its top cut and scorched by years of work. ' +
        'Pegs above it still hold the shapes of tools in the dust.',
      'open',
    ),
    {
      ...staged('AbandonedShed.crates', 'crates', [], (gs) =>
        gs.getStoryFlag(FLAG_PATCHES_FOUND)
          ? 'Broken crates, stacked any way, ' +
            'and a hollow in the dust behind them just the size of a cat.'
          : 'Broken crates, stacked any way. ' +
            'Something small shifts behind them, and goes still.',
      ),
      appears: 'open',
    },
    plain(
      'AbandonedShed.tools',
      'tools',
      [],
      'Rusty tools, laid in careful rows long ago and scattered since.',
      'open',
    ),
    plain(
      'AbandonedShed.shelves',
      'shelves',
      [],
      'Dusty shelves above the workbench: ' +
        'jars of screws, a coil of wire, a candle stub.',
      'open',
    ),
  ],
  OldMill: [
    plain(
      'OldMill.sails',
      'sails',
      [],
      'The sails turn slowly. One is torn, and it slaps on every turn.',
    ),
    staged('OldMill.gears', 'gears', ['cobwebs'], (gs) =>
      mechanismJammed(gs)
        ? 'Wooden gears, furred with dust. The mill is quiet now.'
        : "Wooden gears, furred with dust and cobwebs. They don't move; " +
          'the whirring comes from the iron thing among them.',
    ),
    plain(
      'OldMill.millstone',
      'millstone',
      [],
      "The millstone is so heavy you can't think how it was brought here. " +
        'It has not turned in a long time.',
    ),
  ],
  Riverbank: [
    plain(
      'Riverbank.reeds',
      'reeds',
      [],
      "Tall reeds lean with the current. A heron's tracks run through the mud between them.",
    ),
    plain(
      'Riverbank.crate',
      'crate',
      [],
      "The fisherman's crate, turned upside down. " +
        'He has sat on it so long it has his shape.',
    ),
    plain(
      'Riverbank.bend',
      'bend',
      [],
      'The river slows at the bend and runs deep and dark under the far bank.',
    ),
  ],
  ForestPath: [
    plain(
      'ForestPath.trees',
      'trees',
      ['canopy', 'branches'],
      'Pines and old birches, their branches meeting overhead. ' +
        'The light comes down in pieces.',
    ),
    plain(
      'ForestPath.moss',
      'moss',
      ['ground', 'leaves'],
      "Soft moss over the roots, and last autumn's leaves.",
    ),
    plain(
      'ForestPath.birds',
      'birds',
      [],
      'Small brown birds. They move off ahead of you, branch by branch.',
    ),
    plain(
      'ForestPath.alcove',
      'alcove',
      [],
      'A small hollow under the bank, sheltered by roots.',
      'cut',
    ),
  ],
  HiddenGlade: [
    staged(
      'HiddenGlade.mossyStone',
      'mossy stone',
      ['stone', 'inscription'],
      (gs) =>
        gladeLit(gs)
          ? 'The runes stand out clear on the mossy stone. ' +
            'Beneath them, in a plainer hand:' +
            writing(REFRAIN)
          : 'A waist-high stone, furred with moss. ' +
            "Writing is cut into it, but the shadow lies so deep you can't make out a letter.",
    ),
    plain(
      'HiddenGlade.brambles',
      'brambles',
      [],
      'The brambles grow thick around the edge of the clearing.',
    ),
    staged('HiddenGlade.grass', 'grass', [], (gs) =>
      gladeLit(gs)
        ? 'Tall grass stirs in the breeze.'
        : 'The grass is grey and still, though there is a breeze above the branches.',
    ),
  ],
  VillageChapel: [
    plain(
      'VillageChapel.altar',
      'altar',
      [],
      'A plain stone altar under a white cloth, darned at one corner. ' +
        'The priest keeps it very straight.',
    ),
    plain(
      'VillageChapel.bellRope',
      'bell rope',
      [],
      'The rope is old and soft with handling. ' +
        'It hangs straight down from a hole in the ceiling, ' +
        'and nobody is touching it.',
    ),
    plain(
      'VillageChapel.mark',
      'mark over the door',
      ['mark', 'shape', 'carving'],
      'A tree under two moons, cut into the stone over the door. ' +
        'The weather has worn it almost smooth.',
    ),
    plain(
      'VillageChapel.pews',
      'pews',
      [],
      'Worn wooden pews, the ends polished pale by hands. ' +
        'The front one has a cushion; the rest do not.',
    ),
    staged('VillageChapel.darkCorner', 'dark corner', ['corner'], (gs) =>
      candleLit(gs)
        ? 'In the candlelight it is only a corner: old stone, and a gap low in the wall.'
        : 'The corner by the altar is so dark that your eyes slide off it.',
    ),
  ],
  RoadToGreendale: [
    plain(
      'RoadToGreendale.oaks',
      'oaks',
      ['trees'],
      'Old oaks, their branches meeting over the road. ' +
        'Their roots have lifted its edges.',
    ),
    plain(
      'RoadToGreendale.cart',
      'cart',
      [],
      "The merchant's cart, its canvas patched and roped down. " +
        'There is not much under it now.',
    ),
    plain(
      'RoadToGreendale.mare',
      'mare',
      ['horse'],
      'A thin grey mare. ' +
        'She grazes with one hind hoof lifted: the one without a shoe.',
    ),
  ],
}

/** Every definition by key. */
export const SCENERY_BY_KEY: Record<string, SceneryDef> = Object.fromEntries(
  Object.values(SCENERY_BY_ROOM)
    .flat()
    .map((def) => [def.key, def]),
)
