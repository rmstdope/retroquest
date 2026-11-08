import type { ImagePatch } from '../roomPatches'

/**
 * The declared patches of each room of Act 2, by room key: the small changes
 * the room's picture needs (a thing taken or gone, a thing changed, a way
 * opened), each linked to the named area of the thing it is about. A room
 * with no small change has no entry.
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
      id: 'entry-pass-taken',
      title: 'Entry Pass taken',
      text: 'Remove the entry pass from the picture.',
      area: 'entry-pass',
    },
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
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
      id: 'city-map-taken',
      title: 'City Map taken',
      text: 'Remove the city map from the picture.',
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
      id: 'forest-survival-kit-gone',
      title: 'Forest Survival Kit gone',
      text: 'Remove the forest survival kit from the picture.',
      area: 'forest-survival-kit',
    },
    {
      id: 'enhanced-lantern-gone',
      title: 'Enhanced Lantern gone',
      text: 'Remove the enhanced lantern from the picture.',
      area: 'enhanced-lantern',
    },
    {
      id: 'quality-rope-gone',
      title: 'Quality Rope gone',
      text: 'Remove the quality rope from the picture.',
      area: 'quality-rope',
    },
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
      id: 'travelers-journal-taken',
      title: "Traveler's Journal taken",
      text: "Remove the traveler's journal from the picture.",
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
      id: 'squires-diary-taken',
      title: "Squire's Diary taken",
      text: "Remove the squire's diary from the picture.",
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
      id: 'crystal-focus-taken',
      title: 'Crystal Focus taken',
      text: 'Remove the crystal focus from the picture.',
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
  ],
  AncientGrove: [
    {
      id: 'silver-leaves-taken',
      title: 'Silver Leaves taken',
      text: 'Remove the silver leaves from the picture.',
      area: 'silver-leaves',
    },
    {
      id: 'exit-south-open',
      title: 'Way south open',
      text: 'Show the way south open and passable.',
      area: 'exit-south',
    },
  ],
  WhisperingGlade: [
    {
      id: 'crystal-clear-water-taken',
      title: 'Crystal-Clear Water taken',
      text: 'Remove the crystal-clear water from the picture.',
      area: 'crystal-clear-water',
    },
    {
      id: 'moonflowers-taken',
      title: 'Moonflowers taken',
      text: 'Remove the moonflowers from the picture.',
      area: 'moonflowers',
    },
  ],
}
