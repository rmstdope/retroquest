import type { ImagePatch } from '../roomPatches'

/**
 * The declared patches of each room of Act 2, by room key: the small changes
 * the room's picture needs (a thing taken or gone, a thing changed, a way
 * opened), each linked to the named area of the thing it is about. The base
 * picture shows the room as the game starts, so a thing there at the start
 * has a taken or gone patch and a thing that turns up later an appears patch.
 * A room with no small change has no entry.
 */
export const ACT2_ROOM_PATCHES: Record<string, ImagePatch[]> = {
  MountainPath: [
    {
      id: 'mountain-flower-taken',
      title: 'Mountain Flower taken',
      text: 'Remove the mountain flower from the picture.',
      area: 'mountain-flower',
    },
    {
      id: 'walking-stick-taken',
      title: 'Walking Stick taken',
      text: 'Remove the walking stick from the picture.',
      area: 'walking-stick',
    },
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
    },
    {
      id: 'entry-pass-appears',
      title: 'Entry Pass appears',
      text: 'Add the entry pass to the picture.',
      area: 'entry-pass',
    },
  ],
  GreendaleGates: [
    {
      id: 'gate-captain-gone',
      title: 'Gate Captain gone',
      text: 'Remove Gate Captain from the picture.',
      area: 'gate-captain',
    },
    {
      id: 'exit-north-open',
      title: 'Way north open',
      text: 'Show the way north open and passable.',
      area: 'exit-north',
    },
    {
      id: 'city-map-appears',
      title: 'City Map appears',
      text: 'Add the city map to the picture.',
      area: 'city-map',
    },
  ],
  MainSquare: [
    {
      id: 'merchants-flyer-taken',
      title: "Merchant's Flyer taken",
      text: "Remove the merchant's flyer from the picture.",
      area: 'merchants-flyer',
    },
  ],
  MarketDistrict: [
    {
      id: 'forest-survival-kit-appears',
      title: 'Forest Survival Kit appears',
      text: 'Add the forest survival kit to the picture.',
      area: 'forest-survival-kit',
    },
    {
      id: 'enhanced-lantern-appears',
      title: 'Enhanced Lantern appears',
      text: 'Add the enhanced lantern to the picture.',
      area: 'enhanced-lantern',
    },
    {
      id: 'quality-rope-appears',
      title: 'Quality Rope appears',
      text: 'Add the quality rope to the picture.',
      area: 'quality-rope',
    },
  ],
  SilverStagInn: [
    {
      id: 'room-key-gone',
      title: 'Room Key gone',
      text: 'Remove the room key from the picture.',
      area: 'room-key',
    },
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
    },
  ],
  InnRooms: [
    {
      id: 'coins-taken',
      title: 'Coins taken',
      text: 'Remove the coins from the picture.',
      area: 'coins',
    },
    {
      id: 'travelers-journal-appears',
      title: "Traveler's Journal appears",
      text: "Add the traveler's journal to the picture.",
      area: 'travelers-journal',
    },
  ],
  CastleApproach: [
    {
      id: 'exit-west-open',
      title: 'Way west open',
      text: 'Show the way west open and passable.',
      area: 'exit-west',
    },
  ],
  CastleCourtyard: [
    {
      id: 'squires-diary-appears',
      title: "Squire's Diary appears",
      text: "Add the squire's diary to the picture.",
      area: 'squires-diary',
    },
  ],
  ResidentialQuarter: [
    {
      id: 'exit-secret-passage-open',
      title: 'Way secret_passage open',
      text: 'Show the way secret_passage open and passable.',
      area: 'exit-secret-passage',
    },
  ],
  HiddenLibrary: [
    {
      id: 'crystal-focus-appears',
      title: 'Crystal Focus appears',
      text: 'Add the crystal focus to the picture.',
      area: 'crystal-focus',
    },
  ],
  ForestTransition: [
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
    },
  ],
  ForestEntrance: [
    {
      id: 'enchanted-acorn-taken',
      title: 'Enchanted Acorn taken',
      text: 'Remove the enchanted acorn from the picture.',
      area: 'enchanted-acorn',
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
      id: 'ravine-appears',
      title: 'Ravine appears',
      text: 'Add the ravine to the picture.',
      area: 'ravine',
    },
    {
      id: 'caravan-appears',
      title: 'Caravan appears',
      text: 'Add the caravan to the picture.',
      area: 'caravan',
    },
    {
      id: 'forest-sprites-aside',
      title: 'Forest sprites drawn aside',
      text: 'Move the forest sprites away from the southern path, among the trees.',
      area: 'forest-sprites',
    },
  ],
  AncientGrove: [
    {
      id: 'exit-south-open',
      title: 'Way south open',
      text: 'Show the way south open and passable.',
      area: 'exit-south',
    },
    {
      id: 'ancient-tree-spirit-appears',
      title: 'Ancient Tree Spirit appears',
      text: 'Add Ancient Tree Spirit to the picture.',
      area: 'ancient-tree-spirit',
    },
    {
      id: 'silver-leaves-appears',
      title: 'Silver Leaves appears',
      text: 'Add the silver leaves to the picture.',
      area: 'silver-leaves',
    },
  ],
  WhisperingGlade: [
    {
      id: 'water-nymphs-appears',
      title: 'Water Nymphs appears',
      text: 'Add Water Nymphs to the picture.',
      area: 'water-nymphs',
    },
    {
      id: 'crystal-clear-water-appears',
      title: 'Crystal-Clear Water appears',
      text: 'Add the crystal-clear water to the picture.',
      area: 'crystal-clear-water',
    },
    {
      id: 'moonflowers-appears',
      title: 'Moonflowers appears',
      text: 'Add the moonflowers to the picture.',
      area: 'moonflowers',
    },
  ],
  HeartOfTheForest: [
    {
      id: 'nyx-appears',
      title: 'Nyx appears',
      text: 'Add Nyx to the picture.',
      area: 'nyx',
    },
  ],
}
