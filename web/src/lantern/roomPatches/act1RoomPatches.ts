import type { ImagePatch } from '../roomPatches'

/**
 * The declared patches of each room of Act 1, by room key: the small changes
 * the room's picture needs (a thing taken or gone, a thing changed, a way
 * opened), each linked to the named area of the thing it is about. The base
 * picture shows the room as the game starts, so a thing there at the start
 * has a taken or gone patch and a thing that turns up later an appears patch.
 * A room with no small change has no entry.
 */
export const ACT1_ROOM_PATCHES: Record<string, ImagePatch[]> = {
  EliorsCottage: [
    {
      id: 'bread-taken',
      title: 'Bread taken',
      text: 'Remove the bread from the picture.',
      area: 'bread',
    },
    {
      id: 'exit-south-open',
      title: 'Way south open',
      text: 'Show the way south open and passable.',
      area: 'exit-south',
    },
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
    },
    {
      id: 'lantern-lit',
      title: 'Lantern lit',
      text: 'Light the lantern on the table: a small warm flame in the glass.',
      area: 'lantern',
    },
    {
      id: 'patches-appears',
      title: 'Patches appears',
      text: 'Add Patches to the picture.',
      area: 'patches',
    },
    {
      id: 'eliors-journal-appears',
      title: "Elior's Journal appears",
      text: "Add Elior's journal to the picture.",
      area: 'eliors-journal',
    },
    {
      id: 'faded-photograph-appears',
      title: 'Faded Photograph appears',
      text: 'Add the faded photograph to the picture.',
      area: 'faded-photograph',
    },
  ],
  VegetableField: [
    {
      id: 'rusty-hoe-taken',
      title: 'Rusty Hoe taken',
      text: 'Remove the rusty hoe from the picture.',
      area: 'rusty-hoe',
    },
    {
      id: 'dull-knife-taken',
      title: 'Dull Knife taken',
      text: 'Remove the dull knife from the picture.',
      area: 'dull-knife',
    },
    {
      id: 'withered-carrot-fresh',
      title: 'Carrot freshened',
      text: 'Make the carrot in the field green and fresh instead of withered.',
      area: 'withered-carrot',
    },
  ],
  ChickenCoop: [
    {
      id: 'egg-taken',
      title: 'Egg taken',
      text: 'Remove the egg from the picture.',
      area: 'egg',
    },
    {
      id: 'feather-taken',
      title: 'Feather taken',
      text: 'Remove the feather from the picture.',
      area: 'feather',
    },
    {
      id: 'key-appears',
      title: 'Key appears',
      text: 'Add the key to the picture.',
      area: 'key',
    },
  ],
  VillageSquare: [
    {
      id: 'bucket-taken',
      title: 'Bucket taken',
      text: 'Remove the bucket from the picture.',
      area: 'bucket',
    },
  ],
  MirasHut: [
    {
      id: 'ancient-amulet-gone',
      title: 'Ancient Amulet gone',
      text: 'Remove the ancient amulet from the picture.',
      area: 'ancient-amulet',
    },
  ],
  BlacksmithsForge: [
    {
      id: 'horseshoe-taken',
      title: 'Horseshoe taken',
      text: 'Remove the horseshoe from the picture.',
      area: 'horseshoe',
    },
  ],
  GeneralStore: [
    {
      id: 'rope-gone',
      title: 'Rope gone',
      text: 'Remove the rope from the picture.',
      area: 'rope',
    },
    {
      id: 'matches-gone',
      title: 'Matches gone',
      text: 'Remove the matches from the picture.',
      area: 'matches',
    },
    {
      id: 'patches-appears',
      title: 'Patches appears',
      text: 'Add Patches to the picture.',
      area: 'patches',
    },
  ],
  AbandonedShed: [
    {
      id: 'mysterious-box-appears',
      title: 'Mysterious Box appears',
      text: 'Add the mysterious box to the picture.',
      area: 'mysterious-box',
    },
    {
      id: 'broken-shovel-appears',
      title: 'Broken Shovel appears',
      text: 'Add the broken shovel to the picture.',
      area: 'broken-shovel',
    },
    {
      id: 'patches-appears',
      title: 'Patches appears',
      text: 'Add Patches to the picture.',
      area: 'patches',
    },
    {
      id: 'fishing-rod-appears',
      title: 'Fishing Rod appears',
      text: 'Add the fishing rod to the picture.',
      area: 'fishing-rod',
    },
    {
      id: 'magnet-appears',
      title: 'Magnet appears',
      text: 'Add the magnet to the picture.',
      area: 'magnet',
    },
  ],
  OldMill: [
    {
      id: 'millstone-fragment-appears',
      title: 'Millstone Fragment appears',
      text: 'Add the millstone fragment to the picture.',
      area: 'millstone-fragment',
    },
  ],
  Riverbank: [
    {
      id: 'mothers-letter-appears',
      title: "Mother's Letter appears",
      text: "Add the mother's letter to the picture.",
      area: 'mothers-letter',
    },
  ],
  ForestPath: [
    {
      id: 'vines-cut',
      title: 'Vines cut',
      text: 'Show the vines cut away from the alcove behind them.',
      area: 'vines',
    },
    {
      id: 'stick-appears',
      title: 'Stick appears',
      text: 'Add the stick to the picture.',
      area: 'stick',
    },
    {
      id: 'snare-appears',
      title: 'Snare appears',
      text: 'Add the snare to the picture.',
      area: 'snare',
    },
    {
      id: 'wild-berries-appears',
      title: 'Wild Berries appears',
      text: 'Add the wild berries to the picture.',
      area: 'wild-berries',
    },
  ],
  HiddenGlade: [
    {
      id: 'shiny-pebble-taken',
      title: 'Shiny Pebble taken',
      text: 'Remove the shiny pebble from the picture.',
      area: 'shiny-pebble',
    },
    {
      id: 'rare-flower-appears',
      title: 'Rare Flower appears',
      text: 'Add the rare flower to the picture.',
      area: 'rare-flower',
    },
    {
      id: 'deer-appears',
      title: 'Deer appears',
      text: 'Add Deer to the picture.',
      area: 'deer',
    },
  ],
  VillageChapel: [
    {
      id: 'locket-appears',
      title: 'Locket appears',
      text: 'Add the locket to the picture.',
      area: 'locket',
    },
  ],
  RoadToGreendale: [
    {
      id: 'rusty-saw-taken',
      title: 'Rusty Saw taken',
      text: 'Remove the rusty saw from the picture.',
      area: 'rusty-saw',
    },
  ],
}
