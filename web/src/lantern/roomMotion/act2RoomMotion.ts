import type { RoomEffect } from '../roomMotion'

/**
 * The movement over each painted room of Act 2, by room key, chosen by looking at
 * each painting and its story; the comment says what the painting shows. A room
 * with no entry, or an empty one, only drifts.
 */
export const ACT2_ROOM_MOTION: Record<string, RoomEffect[]> = {
  // high mountain air: low mist, no broadleaf trees
  MountainPath: [{ kind: 'mist' }],
  // a bright gate in the town wall
  GreendaleGates: [{ kind: 'dust' }],
  // the fountain of the square
  MainSquare: [{ kind: 'dust' }, { kind: 'water' }],
  // a busy street of stalls
  MarketDistrict: [{ kind: 'dust' }],
  // a hall lit from the window
  SilverStagInn: [{ kind: 'dust' }],
  // a room with sun through the window
  InnRooms: [{ kind: 'dust' }],
  // a cool store with light from the window
  MerchantsWarehouse: [{ kind: 'dust' }],
  // an avenue with trees
  CastleApproach: [{ kind: 'dust' }, { kind: 'leaves' }],
  // a courtyard under two big trees
  CastleCourtyard: [{ kind: 'dust' }, { kind: 'leaves' }],
  // coloured light falling on the floor
  GreatHall: [{ kind: 'dust' }],
  // small gardens and trees
  ResidentialQuarter: [{ kind: 'dust' }, { kind: 'leaves' }],
  // a hearth fire with herbs hanging over it
  HealersHouse: [{ kind: 'dust' }, { kind: 'fire' }, { kind: 'embers' }],
  // light from the window over the books
  HiddenLibrary: [{ kind: 'dust' }],
  // pines and the standing stones
  ForestTransition: [{ kind: 'dust' }, { kind: 'mist' }],
  // the deep wood, hazy and green
  ForestEntrance: [{ kind: 'dust' }, { kind: 'leaves' }, { kind: 'mist' }],
  // great old trees in the light
  AncientGrove: [{ kind: 'dust' }, { kind: 'leaves' }],
  // a stream running through a glade, with fireflies
  WhisperingGlade: [{ kind: 'dust' }, { kind: 'water' }, { kind: 'fireflies' }],
  // the oldest trees, and lights among them
  HeartOfTheForest: [{ kind: 'dust' }, { kind: 'fireflies' }],
}
