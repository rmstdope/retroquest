import type { ImagePatch } from '@/engine'
import { FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE } from './Act2StoryFlags'

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
      when: 'absent',
    },
    {
      id: 'walking-stick-taken',
      title: 'Walking Stick taken',
      text: 'Remove the walking stick from the picture.',
      area: 'walking-stick',
      when: 'absent',
    },
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
      when: 'present',
    },
    {
      id: 'entry-pass-appears',
      title: 'Entry Pass appears',
      text: 'Add the entry pass to the picture.',
      area: 'entry-pass',
      when: 'present',
    },
  ],
  GreendaleGates: [
    {
      id: 'gate-captain-gone',
      title: 'Gate Captain gone, way north open',
      text: 'Remove Gate Captain from the picture and show the way north open and passable.',
      area: 'gate-captain',
      // He leaves in the turn the way north opens, so one patch shows both.
      when: 'absent',
    },
    {
      id: 'city-map-appears',
      title: 'City Map appears',
      text: 'Add the city map to the picture.',
      area: 'city-map',
      when: 'present',
      // The map turns up only after the captain has gone.
      over: 'gate-captain-gone',
      layer: 1,
    },
  ],
  MainSquare: [
    {
      id: 'merchants-flyer-taken',
      title: "Merchant's Flyer taken",
      text: "Remove the merchant's flyer from the picture.",
      area: 'merchants-flyer',
      when: 'absent',
    },
  ],
  MarketDistrict: [
    {
      id: 'forest-survival-kit-appears',
      title: 'Forest Survival Kit appears',
      text: 'Add the forest survival kit to the picture.',
      area: 'forest-survival-kit',
      when: 'present',
    },
    {
      id: 'enhanced-lantern-appears',
      title: 'Enhanced Lantern appears',
      text: 'Add the enhanced lantern to the picture.',
      area: 'enhanced-lantern',
      when: 'present',
    },
    {
      id: 'quality-rope-appears',
      title: 'Quality Rope appears',
      text: 'Add the quality rope to the picture.',
      area: 'quality-rope',
      when: 'present',
    },
  ],
  SilverStagInn: [
    {
      id: 'room-key-gone',
      title: 'Room Key gone',
      text: 'Remove the room key from the picture.',
      area: 'room-key',
      when: 'absent',
    },
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
      when: 'present',
      // The key is bought before it opens the door, so the way lies over the key's patch.
      over: 'room-key-gone',
      layer: 1,
    },
  ],
  InnRooms: [
    {
      id: 'coins-taken',
      title: 'Coins taken',
      text: 'Remove the coins from the picture.',
      area: 'coins',
      when: 'absent',
    },
    {
      id: 'travelers-journal-appears',
      title: "Traveler's Journal appears",
      text: "Add the traveler's journal to the picture.",
      area: 'travelers-journal',
      when: 'present',
    },
  ],
  CastleApproach: [
    {
      id: 'exit-west-open',
      title: 'Way west open',
      text: 'Show the way west open and passable.',
      area: 'exit-west',
      when: 'present',
    },
  ],
  CastleCourtyard: [
    {
      id: 'squires-diary-appears',
      title: "Squire's Diary appears",
      text: "Add the squire's diary to the picture.",
      area: 'squires-diary',
      when: 'present',
    },
  ],
  ResidentialQuarter: [
    {
      id: 'exit-secret-passage-open',
      title: 'Way secret_passage open',
      text: 'Show the way secret_passage open and passable.',
      area: 'exit-secret-passage',
      when: 'present',
    },
  ],
  HiddenLibrary: [
    {
      id: 'crystal-focus-appears',
      title: 'Crystal Focus appears',
      text: 'Add the crystal focus to the picture.',
      area: 'crystal-focus',
      when: 'present',
    },
  ],
  ForestTransition: [
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
      when: 'present',
    },
  ],
  ForestEntrance: [
    {
      id: 'enchanted-acorn-taken',
      title: 'Enchanted Acorn taken',
      text: 'Remove the enchanted acorn from the picture.',
      area: 'enchanted-acorn',
      when: 'absent',
    },
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
      when: 'present',
    },
    {
      id: 'ravine-appears',
      title: 'Ravine appears',
      text: 'Add the ravine to the picture.',
      area: 'ravine',
      when: 'present',
    },
    {
      id: 'caravan-appears',
      title: 'Caravan appears',
      text: 'Add the caravan to the picture.',
      area: 'caravan',
      when: 'present',
      // The rope is used on the ravine, so the caravan lies over it.
      over: 'ravine-appears',
      layer: 1,
    },
    {
      id: 'forest-sprites-aside',
      title: 'Forest sprites drawn aside, way south open',
      text:
        'Move the forest sprites away from the southern path, among the trees, ' +
        'and show the way south open and passable.',
      area: 'forest-sprites',
      // The charm that draws them aside is what opens the way south, so one patch shows both.
      when: (c) =>
        c.state.getStoryFlag(FLAG_PROTECTIVE_CHARM_USED_FOREST_ENTRANCE),
    },
  ],
  AncientGrove: [
    {
      id: 'exit-south-open',
      title: 'Way south open',
      text: 'Show the way south open and passable.',
      area: 'exit-south',
      when: 'present',
      // The way opens only once the spirit is awake, and its picture reaches
      // the spirit's trunk, so it is painted on the spirit's result.
      over: 'ancient-tree-spirit-appears',
      layer: 1,
    },
    {
      id: 'ancient-tree-spirit-appears',
      title: 'Ancient Tree Spirit appears',
      text: 'Add Ancient Tree Spirit to the picture.',
      area: 'ancient-tree-spirit',
      when: 'present',
    },
    {
      id: 'silver-leaves-appears',
      title: 'Silver Leaves appears',
      text: 'Add the silver leaves to the picture.',
      area: 'silver-leaves',
      when: 'present',
      // The spirit gives the leaves, so they lie over its patch. They lie on
      // the ground, the opened path included, and show while the way is shut
      // too, so they lie above the way but not over it.
      over: 'ancient-tree-spirit-appears',
      layer: 2,
    },
  ],
  WhisperingGlade: [
    {
      id: 'water-nymphs-appears',
      title: 'Water Nymphs appears',
      text: 'Add Water Nymphs to the picture.',
      area: 'water-nymphs',
      when: 'present',
    },
    {
      id: 'crystal-clear-water-appears',
      title: 'Crystal-Clear Water appears',
      text: 'Add the crystal-clear water to the picture.',
      area: 'crystal-clear-water',
      when: 'present',
      // The nymphs bring it, so it lies over their patch.
      over: 'water-nymphs-appears',
      layer: 1,
    },
    {
      id: 'moonflowers-appears',
      title: 'Moonflowers appears',
      text: 'Add the moonflowers to the picture.',
      area: 'moonflowers',
      when: 'present',
      // The nymphs bring it, so it lies over their patch.
      over: 'water-nymphs-appears',
      layer: 1,
    },
  ],
  HeartOfTheForest: [
    {
      id: 'nyx-appears',
      title: 'Nyx appears',
      text: 'Add Nyx to the picture.',
      area: 'nyx',
      when: 'present',
    },
  ],
}
