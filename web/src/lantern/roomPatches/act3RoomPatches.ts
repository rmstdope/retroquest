import type { ImagePatch } from '../roomPatches'
import {
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
  FLAG_ACT3_MIRRORS_MENDED,
} from '@/act3/Act3StoryFlags'
import { flagOf } from '../patchRules'

/**
 * The declared patches of each room of Act 3, by room key: the small changes
 * the room's picture needs (a thing taken or gone, a thing changed, a way
 * opened), each linked to the named area of the thing it is about. The base
 * picture shows the room as the game starts, so a thing there at the start
 * has a taken or gone patch and a thing that turns up later an appears patch.
 * A room with no small change has no entry.
 */
export const ACT3_ROOM_PATCHES: Record<string, ImagePatch[]> = {
  MirasHut: [
    {
      id: 'healing-herbs-gone',
      title: 'Healing Herbs gone',
      text: 'Remove the healing herbs from the picture.',
      area: 'healing-herbs',
      when: 'absent',
    },
    {
      id: 'mira-gone',
      title: 'Mira gone',
      text: 'Remove Mira from the picture.',
      area: 'mira',
      when: 'absent',
    },
    {
      id: 'lifelight-elixir-appears',
      title: 'Lifelight Elixir appears',
      text: 'Add the lifelight elixir to the picture.',
      area: 'lifelight-elixir',
      when: 'present',
    },
  ],
  TidalCauseway: [
    {
      id: 'mira-appears',
      title: 'Mira appears',
      text: 'Add Mira to the picture.',
      area: 'mira',
      when: 'present',
    },
    {
      id: 'sea-sealed-letter-appears',
      title: 'Sea-Sealed Letter appears',
      text: 'Add the sea-sealed letter to the picture.',
      area: 'sea-sealed-letter',
      when: 'present',
    },
    {
      id: 'rusted-locker-key-appears',
      title: 'Rusted Locker Key appears',
      text: 'Add the rusted locker key to the picture.',
      area: 'rusted-locker-key',
      when: 'present',
    },
  ],
  ShorelineMarkers: [
    {
      id: 'polished-shell-taken',
      title: 'Polished Shell taken',
      text: 'Remove the polished shell from the picture.',
      area: 'polished-shell',
      when: 'absent',
    },
    {
      id: 'moon-rune-shards-appears',
      title: 'Moon Rune Shards appears',
      text: 'Add the moon rune shards to the picture.',
      area: 'moon-rune-shards',
      when: 'present',
    },
  ],
  OuterWards: [
    {
      id: 'warding-pillars-purified',
      title: 'Pillars purified',
      text: 'Show the warding pillars cleansed, their glow clear and steady.',
      area: 'warding-pillars',
      when: (c) => flagOf(c.things.get('warding-pillars'), 'purified'),
    },
  ],
  CollapsedPier: [
    {
      id: 'weathered-coin-taken',
      title: 'Weathered Coin taken',
      text: 'Remove the weathered coin from the picture.',
      area: 'weathered-coin',
      when: 'absent',
    },
    {
      id: 'prism-lantern-appears',
      title: 'Prism Lantern appears',
      text: 'Add the prism lantern to the picture.',
      area: 'prism-lantern',
      when: 'present',
    },
  ],
  SubmergedAntechamber: [
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
      when: 'present',
    },
    {
      id: 'lantern-bracket-mounted',
      title: 'Lantern mounted',
      text: 'Show a lit lantern mounted in the bracket on the wall.',
      area: 'lantern-bracket',
      when: (c) => flagOf(c.things.get('lantern-bracket'), 'hasLantern'),
    },
    {
      id: 'lantern-bracket-appears',
      title: 'Lantern Bracket appears',
      text: 'Add the lantern bracket to the picture.',
      area: 'lantern-bracket',
      when: 'present',
    },
  ],
  SanctumOfTheTide: [
    {
      id: 'exit-east-closed',
      title: 'Way east closed',
      text: 'Show the way east closed off.',
      area: 'exit-east',
      when: 'absent',
    },
    {
      id: 'crystal-of-light-appears',
      title: 'Crystal of Light appears',
      text: 'Add the crystal of light to the picture.',
      area: 'crystal-of-light',
      when: 'present',
    },
  ],
  LowerSwitchbacks: [
    {
      id: 'emberwater-canteen-taken',
      title: 'Emberwater Canteen taken',
      text: 'Remove the emberwater canteen from the picture.',
      area: 'emberwater-canteen',
      when: 'absent',
    },
    {
      id: 'mira-appears',
      title: 'Mira appears',
      text: 'Add Mira to the picture.',
      area: 'mira',
      when: 'present',
    },
    {
      id: 'brass-mirror-segment-appears',
      title: 'Brass Mirror Segment appears',
      text: 'Add the brass mirror segment to the picture.',
      area: 'brass-mirror-segment',
      when: 'present',
    },
  ],
  ObsidianOutcrops: [
    {
      id: 'brass-mirror-segment-appears',
      title: 'Brass Mirror Segment appears',
      text: 'Add the brass mirror segment to the picture.',
      area: 'brass-mirror-segment',
      when: 'present',
    },
    {
      id: 'binding-resin-appears',
      title: 'Binding Resin appears',
      text: 'Add the binding resin to the picture.',
      area: 'binding-resin',
      when: 'present',
    },
  ],
  MirrorTerraces: [
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
      when: 'present',
    },
    {
      id: 'brass-mirror-segment-appears',
      title: 'Brass Mirror Segment appears',
      text: 'Add the brass mirror segment to the picture.',
      area: 'brass-mirror-segment',
      when: 'present',
    },
    {
      id: 'mirror-mount-mended',
      title: 'Mirror mount mended',
      text: 'Show the mirror mount whole, holding its mirrors upright.',
      area: 'mirror-mount',
      when: (c) => c.state.getStoryFlag(FLAG_ACT3_MIRRORS_MENDED),
    },
  ],
  FumarolePassages: [
    {
      id: 'vent-stone-taken',
      title: 'Vent Stone taken',
      text: 'Remove the vent stone from the picture.',
      area: 'vent-stone',
      when: 'absent',
    },
    {
      id: 'exit-south-open',
      title: 'Way south open',
      text: 'Show the way south open and passable.',
      area: 'exit-south',
      when: 'present',
    },
    {
      id: 'exit-out-open',
      title: 'Way out open',
      text: 'Show the way out open and passable.',
      area: 'exit-out',
      when: 'present',
    },
    {
      id: 'exit-in-open',
      title: 'Way in open',
      text: 'Show the way in open and passable.',
      area: 'exit-in',
      when: 'present',
    },
  ],
  EmberGallery: [
    {
      id: 'ash-fern-appears',
      title: 'Ash-Fern appears',
      text: 'Add the ash-fern to the picture.',
      area: 'ash-fern',
      when: 'present',
    },
    {
      id: 'cooled-slag-appears',
      title: 'Cooled Slag appears',
      text: 'Add the cooled slag to the picture.',
      area: 'cooled-slag',
      when: 'present',
    },
  ],
  PhoenixCrater: [
    {
      id: 'phoenix-appears',
      title: 'Phoenix appears',
      text: 'Add Phoenix to the picture.',
      area: 'phoenix',
      when: 'present',
    },
  ],
  CavernMouth: [
    {
      id: 'mira-appears',
      title: 'Mira appears',
      text: 'Add Mira to the picture.',
      area: 'mira',
      when: 'present',
    },
  ],
  ToolCache: [
    {
      id: 'supply-crate-appears',
      title: 'Supply Crate appears',
      text: 'Add the supply crate to the picture.',
      area: 'supply-crate',
      when: 'present',
    },
    {
      id: 'reinforced-braces-appears',
      title: 'Reinforced Braces appears',
      text: 'Add the reinforced braces to the picture.',
      area: 'reinforced-braces',
      when: 'present',
    },
    {
      id: 'support-straps-appears',
      title: 'Support Straps appears',
      text: 'Add the support straps to the picture.',
      area: 'support-straps',
      when: 'present',
    },
    {
      id: 'wedge-blocks-appears',
      title: 'Wedge Blocks appears',
      text: 'Add the wedge blocks to the picture.',
      area: 'wedge-blocks',
      when: 'present',
    },
  ],
  CollapsedGalleries: [
    {
      id: 'fallen-rock-gone',
      title: 'Fallen Rock gone',
      text: 'Remove the fallen rock from the picture.',
      area: 'fallen-rock',
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
      id: 'miners-appears',
      title: 'Miners appears',
      text: 'Add Miners to the picture.',
      area: 'miners',
      when: 'present',
    },
    {
      id: 'tobin-appears',
      title: 'Tobin appears',
      text: 'Add Tobin to the picture.',
      area: 'tobin',
      when: 'present',
    },
  ],
  EchoChambers: [
    {
      id: 'old-oath-scrolls-appears',
      title: 'Old Oath Scrolls appears',
      text: 'Add the old oath scrolls to the picture.',
      area: 'old-oath-scrolls',
      when: 'present',
    },
    {
      id: 'resonant-chant-rubbings-appears',
      title: 'Resonant Chant Rubbings appears',
      text: 'Add the resonant chant rubbings to the picture.',
      area: 'resonant-chant-rubbings',
      when: 'present',
    },
  ],
  StillnessVestibule: [
    {
      id: 'stillwater-phial-taken',
      title: 'Stillwater Phial taken',
      text: 'Remove the stillwater phial from the picture.',
      area: 'stillwater-phial',
      when: 'absent',
    },
    {
      id: 'quiet-charm-taken',
      title: 'Quiet Charm taken',
      text: 'Remove the quiet charm from the picture.',
      area: 'quiet-charm',
      when: 'absent',
    },
    {
      id: 'wandering-phantoms-gone',
      title: 'Wandering Phantoms gone',
      text: 'Remove Wandering Phantoms from the picture.',
      area: 'wandering-phantoms',
      when: 'absent',
    },
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
      when: 'present',
    },
  ],
  DragonsHall: [
    {
      id: 'dragons-scale-appears',
      title: "Dragon's Scale appears",
      text: "Add the dragon's scale to the picture.",
      area: 'dragons-scale',
      when: 'present',
    },
    {
      id: 'sigils-dimmed',
      title: 'Sigils dimmed',
      text: 'Dim the sigils around the dragon and split the nearest ring with a crack.',
      area: 'sigils',
      when: (c) => c.state.getStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED),
    },
  ],
  FortressEntrance: [
    {
      id: 'mira-appears',
      title: 'Mira appears',
      text: 'Add Mira to the picture.',
      area: 'mira',
      when: 'present',
    },
  ],
}
