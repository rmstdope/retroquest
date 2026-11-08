import type { RoomEffect } from '../roomMotion'

/**
 * The movement over each painted room of Act 1, by room key, chosen by looking at
 * each painting and its story; the comment says what the painting shows. A room
 * with no entry, or an empty one, only drifts.
 */
export const ACT1_ROOM_MOTION: Record<string, RoomEffect[]> = {
  // a storm over a wet street: low mist
  TheDream: [{ kind: 'mist' }],
  // a hearth fire and sunlight through the window
  EliorsCottage: [{ kind: 'dust' }, { kind: 'fire' }],
  // dry dust over cracked earth
  VegetableField: [{ kind: 'dust' }],
  // sun through trees over straw
  ChickenCoop: [{ kind: 'dust' }, { kind: 'leaves' }],
  // a fountain, and trees at the back
  VillageSquare: [{ kind: 'dust' }, { kind: 'water' }],
  // sunlight through the window over the herbs
  MirasHut: [{ kind: 'dust' }],
  // a forge fire, its smoke and its sparks
  BlacksmithsForge: [
    { kind: 'dust' },
    { kind: 'fire' },
    { kind: 'smoke' },
    { kind: 'embers' },
  ],
  // sunlit shelves
  GeneralStore: [{ kind: 'dust' }],
  // a summer meadow
  VillageWell: [{ kind: 'dust' }],
  // an old shed under trees
  AbandonedShed: [{ kind: 'dust' }, { kind: 'leaves' }],
  // flour in the air by the mill
  OldMill: [{ kind: 'dust' }],
  // a calm river with insects over it: low mist
  Riverbank: [{ kind: 'mist' }],
  // a sunlit wood
  ForestPath: [{ kind: 'dust' }, { kind: 'leaves' }],
  // a glade among trees
  HiddenGlade: [{ kind: 'dust' }, { kind: 'leaves' }],
  // light through the coloured windows
  // and the altar candle once it is lit
  VillageChapel: [{ kind: 'dust' }, { kind: 'fire', whilePatch: 'candle-lit' }],
  // a road under trees
  RoadToGreendale: [{ kind: 'dust' }, { kind: 'leaves' }],
}
