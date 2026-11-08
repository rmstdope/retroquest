import type { ImagePatch } from '../roomPatches'

/**
 * The declared patches of each room of Act 1, by room key: the small changes
 * the room's picture needs (a thing taken or gone, a thing changed, a way
 * opened), each linked to the named area of the thing it is about. A room
 * with no small change has no entry.
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
      id: 'faded-photograph-taken',
      title: 'Faded Photograph taken',
      text: 'Remove the faded photograph from the picture.',
      area: 'faded-photograph',
    },
    {
      id: 'lantern-lit',
      title: 'Lantern lit',
      text: 'Light the lantern on the table: a small warm flame in the glass.',
      area: 'lantern',
    },
    {
      id: 'eliors-journal-appears',
      title: "Elior's Journal appears",
      text: "Add Elior's journal to the picture.",
      area: 'eliors-journal',
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
      id: 'key-taken',
      title: 'Key taken',
      text: 'Remove the key from the picture.',
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
  ],
  AbandonedShed: [
    {
      id: 'broken-shovel-taken',
      title: 'Broken Shovel taken',
      text: 'Remove the broken shovel from the picture.',
      area: 'broken-shovel',
    },
    {
      id: 'patches-gone',
      title: 'Patches gone',
      text: 'Remove Patches from the picture.',
      area: 'patches',
    },
    {
      id: 'fishing-rod-taken',
      title: 'Fishing Rod taken',
      text: 'Remove the fishing rod from the picture.',
      area: 'fishing-rod',
    },
    {
      id: 'magnet-taken',
      title: 'Magnet taken',
      text: 'Remove the magnet from the picture.',
      area: 'magnet',
    },
    {
      id: 'mysterious-box-appears',
      title: 'Mysterious Box appears',
      text: 'Add the mysterious box to the picture.',
      area: 'mysterious-box',
    },
  ],
  OldMill: [
    {
      id: 'millstone-fragment-taken',
      title: 'Millstone Fragment taken',
      text: 'Remove the millstone fragment from the picture.',
      area: 'millstone-fragment',
    },
  ],
  Riverbank: [
    {
      id: 'mothers-letter-taken',
      title: "Mother's Letter taken",
      text: "Remove the mother's letter from the picture.",
      area: 'mothers-letter',
    },
  ],
  ForestPath: [
    {
      id: 'stick-taken',
      title: 'Stick taken',
      text: 'Remove the stick from the picture.',
      area: 'stick',
    },
    {
      id: 'wild-berries-taken',
      title: 'Wild Berries taken',
      text: 'Remove the wild berries from the picture.',
      area: 'wild-berries',
    },
    {
      id: 'vines-cut',
      title: 'Vines cut',
      text: 'Show the vines cut away from the alcove behind them.',
      area: 'vines',
    },
    {
      id: 'snare-appears',
      title: 'Snare appears',
      text: 'Add the snare to the picture.',
      area: 'snare',
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
      id: 'rare-flower-taken',
      title: 'Rare Flower taken',
      text: 'Remove the rare flower from the picture.',
      area: 'rare-flower',
    },
  ],
  VillageChapel: [
    {
      id: 'locket-taken',
      title: 'Locket taken',
      text: 'Remove the locket from the picture.',
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
