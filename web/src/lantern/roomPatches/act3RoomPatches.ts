import type { ImagePatch } from '../roomPatches'

/**
 * The declared patches of each room of Act 3, by room key: the small changes
 * the room's picture needs (a thing taken or gone, a thing changed, a way
 * opened), each linked to the named area of the thing it is about. A room
 * with no small change has no entry.
 */
export const ACT3_ROOM_PATCHES: Record<string, ImagePatch[]> = {
  MirasHut: [
    {
      id: 'healing-herbs-gone',
      title: 'Healing Herbs gone',
      text: 'Remove the healing herbs from the picture.',
      area: 'healing-herbs',
    },
    {
      id: 'mira-gone',
      title: 'Mira gone',
      text: 'Remove Mira from the picture.',
      area: 'mira',
    },
    {
      id: 'lifelight-elixir-taken',
      title: 'Lifelight Elixir taken',
      text: 'Remove the lifelight elixir from the picture.',
      area: 'lifelight-elixir',
    },
  ],
  TidalCauseway: [
    {
      id: 'mira-gone',
      title: 'Mira gone',
      text: 'Remove Mira from the picture.',
      area: 'mira',
    },
    {
      id: 'sea-sealed-letter-taken',
      title: 'Sea-Sealed Letter taken',
      text: 'Remove the sea-sealed letter from the picture.',
      area: 'sea-sealed-letter',
    },
    {
      id: 'rusted-locker-key-taken',
      title: 'Rusted Locker Key taken',
      text: 'Remove the rusted locker key from the picture.',
      area: 'rusted-locker-key',
    },
  ],
  ShorelineMarkers: [
    {
      id: 'polished-shell-taken',
      title: 'Polished Shell taken',
      text: 'Remove the polished shell from the picture.',
      area: 'polished-shell',
    },
    {
      id: 'moon-rune-shards-taken',
      title: 'Moon Rune Shards taken',
      text: 'Remove the moon rune shards from the picture.',
      area: 'moon-rune-shards',
    },
  ],
  OuterWards: [
    {
      id: 'warding-pillars-purified',
      title: 'Pillars purified',
      text: 'Show the warding pillars cleansed, their glow clear and steady.',
      area: 'warding-pillars',
    },
  ],
  CollapsedPier: [
    {
      id: 'weathered-coin-taken',
      title: 'Weathered Coin taken',
      text: 'Remove the weathered coin from the picture.',
      area: 'weathered-coin',
    },
    {
      id: 'prism-lantern-taken',
      title: 'Prism Lantern taken',
      text: 'Remove the prism lantern from the picture.',
      area: 'prism-lantern',
    },
  ],
  SubmergedAntechamber: [
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
    },
    {
      id: 'lantern-bracket-mounted',
      title: 'Lantern mounted',
      text: 'Show a lit lantern mounted in the bracket on the wall.',
      area: 'lantern-bracket',
    },
  ],
  SanctumOfTheTide: [
    {
      id: 'exit-east-closed',
      title: 'Way east closed',
      text: 'Show the way east closed off.',
      area: 'exit-east',
    },
    {
      id: 'crystal-of-light-taken',
      title: 'Crystal of Light taken',
      text: 'Remove the crystal of light from the picture.',
      area: 'crystal-of-light',
    },
  ],
  LowerSwitchbacks: [
    {
      id: 'emberwater-canteen-taken',
      title: 'Emberwater Canteen taken',
      text: 'Remove the emberwater canteen from the picture.',
      area: 'emberwater-canteen',
    },
    {
      id: 'mira-gone',
      title: 'Mira gone',
      text: 'Remove Mira from the picture.',
      area: 'mira',
    },
    {
      id: 'brass-mirror-segment-taken',
      title: 'Brass Mirror Segment taken',
      text: 'Remove the brass mirror segment from the picture.',
      area: 'brass-mirror-segment',
    },
  ],
  ObsidianOutcrops: [
    {
      id: 'brass-mirror-segment-taken',
      title: 'Brass Mirror Segment taken',
      text: 'Remove the brass mirror segment from the picture.',
      area: 'brass-mirror-segment',
    },
    {
      id: 'binding-resin-taken',
      title: 'Binding Resin taken',
      text: 'Remove the binding resin from the picture.',
      area: 'binding-resin',
    },
  ],
  MirrorTerraces: [
    {
      id: 'brass-mirror-segment-taken',
      title: 'Brass Mirror Segment taken',
      text: 'Remove the brass mirror segment from the picture.',
      area: 'brass-mirror-segment',
    },
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
    },
  ],
  FumarolePassages: [
    {
      id: 'vent-stone-taken',
      title: 'Vent Stone taken',
      text: 'Remove the vent stone from the picture.',
      area: 'vent-stone',
    },
    {
      id: 'exit-south-open',
      title: 'Way south open',
      text: 'Show the way south open and passable.',
      area: 'exit-south',
    },
  ],
  EmberGallery: [
    {
      id: 'ash-fern-taken',
      title: 'Ash-Fern taken',
      text: 'Remove the ash-fern from the picture.',
      area: 'ash-fern',
    },
    {
      id: 'cooled-slag-taken',
      title: 'Cooled Slag taken',
      text: 'Remove the cooled slag from the picture.',
      area: 'cooled-slag',
    },
  ],
  CavernMouth: [
    {
      id: 'mira-gone',
      title: 'Mira gone',
      text: 'Remove Mira from the picture.',
      area: 'mira',
    },
  ],
  ToolCache: [
    {
      id: 'reinforced-braces-taken',
      title: 'Reinforced Braces taken',
      text: 'Remove the reinforced braces from the picture.',
      area: 'reinforced-braces',
    },
    {
      id: 'support-straps-taken',
      title: 'Support Straps taken',
      text: 'Remove the support straps from the picture.',
      area: 'support-straps',
    },
    {
      id: 'wedge-blocks-taken',
      title: 'Wedge Blocks taken',
      text: 'Remove the wedge blocks from the picture.',
      area: 'wedge-blocks',
    },
    {
      id: 'supply-crate-appears',
      title: 'Supply Crate appears',
      text: 'Add the supply crate to the picture.',
      area: 'supply-crate',
    },
  ],
  CollapsedGalleries: [
    {
      id: 'fallen-rock-gone',
      title: 'Fallen Rock gone',
      text: 'Remove the fallen rock from the picture.',
      area: 'fallen-rock',
    },
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
    },
  ],
  EchoChambers: [
    {
      id: 'old-oath-scrolls-taken',
      title: 'Old Oath Scrolls taken',
      text: 'Remove the old oath scrolls from the picture.',
      area: 'old-oath-scrolls',
    },
    {
      id: 'resonant-chant-rubbings-taken',
      title: 'Resonant Chant Rubbings taken',
      text: 'Remove the resonant chant rubbings from the picture.',
      area: 'resonant-chant-rubbings',
    },
  ],
  StillnessVestibule: [
    {
      id: 'stillwater-phial-taken',
      title: 'Stillwater Phial taken',
      text: 'Remove the stillwater phial from the picture.',
      area: 'stillwater-phial',
    },
    {
      id: 'quiet-charm-taken',
      title: 'Quiet Charm taken',
      text: 'Remove the quiet charm from the picture.',
      area: 'quiet-charm',
    },
    {
      id: 'wandering-phantoms-gone',
      title: 'Wandering Phantoms gone',
      text: 'Remove Wandering Phantoms from the picture.',
      area: 'wandering-phantoms',
    },
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
    },
  ],
  DragonsHall: [
    {
      id: 'dragons-scale-taken',
      title: "Dragon's Scale taken",
      text: "Remove the dragon's scale from the picture.",
      area: 'dragons-scale',
    },
  ],
}
