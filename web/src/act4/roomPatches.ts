import type { ImagePatch, PatchContext } from '@/engine'
import {
  THRONE_CHAMBER_HEALED,
  THRONE_CHAMBER_JUSTICE,
  THRONE_CHAMBER_REDEMPTION,
  THRONE_CHAMBER_SACRIFICE,
  THRONE_CHAMBER_SHATTERED,
} from './rooms/throneDescriptions'
import { PARENTS_VAULT_AFTER } from './rooms/vaultDescriptions'
import {
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_MEMORY_ORBS_MENDED,
  FLAG_ACT4_SERVANTS_FREED,
  FLAG_ACT4_SHADOW_REVEAL_HEARD,
  FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED,
  FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED,
} from './Act4StoryFlags'

/** Whether the room `roomKey` now carries one of the `texts` as its description (the text it computes from the story). */
function roomSays(
  c: PatchContext,
  roomKey: string,
  texts: readonly string[],
): boolean {
  return texts.includes(
    c.state.allRooms[roomKey]?.descriptionFor(c.state) ?? '',
  )
}

/**
 * The declared patches of each room of Act 4, by room key: the small changes
 * the room's picture needs (a thing taken or gone, a thing changed, a way
 * opened), each linked to the named area of the thing it is about. The base
 * picture shows the room as the game starts, so a thing there at the start
 * has a taken or gone patch and a thing that turns up later an appears patch.
 * A room with no small change has no entry.
 */
export const ACT4_ROOM_PATCHES: Record<string, ImagePatch[]> = {
  FortressGates: [
    {
      id: 'exit-north-open',
      title: 'Way north open',
      text: 'Show the way north open and passable.',
      area: 'exit-north',
      when: 'present',
    },
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
      when: 'present',
    },
    {
      id: 'ward-stone-fragment-appears',
      title: 'Ward Stone Fragment appears',
      text: 'Add the ward stone fragment to the picture.',
      area: 'ward-stone-fragment',
      when: 'present',
    },
    {
      id: 'guardians-chain-appears',
      title: "Guardian's Chain appears",
      text: "Add the guardian's chain to the picture.",
      area: 'guardians-chain',
      when: 'present',
    },
    {
      id: 'guardians-essence-appears',
      title: "Guardian's Essence appears",
      text: "Add the guardian's essence to the picture.",
      area: 'guardians-essence',
      when: 'present',
    },
    {
      id: 'ward-stones-dark',
      title: 'Ward stones dark',
      text: 'Darken the three ward stones: no violet glow.',
      area: 'ward-stones',
      when: (c) =>
        c.state.getStoryFlag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED),
    },
  ],
  OuterCourtyard: [
    {
      id: 'exit-north-open',
      title: 'Way north open',
      text: 'Show the way north open and passable.',
      area: 'exit-north',
      when: 'present',
    },
    {
      id: 'trapped-servants-freed',
      title: 'Servants freed',
      text: 'Show the servants freed from their trap and standing free.',
      area: 'trapped-servants',
      when: (c) => c.state.getStoryFlag(FLAG_ACT4_SERVANTS_FREED),
    },
    {
      id: 'servants-pendant-appears',
      title: "Servant's Pendant appears",
      text: "Add the servant's pendant to the picture.",
      area: 'servants-pendant',
      when: 'present',
    },
  ],
  MirrorLabyrinth: [
    {
      id: 'exit-north-closed',
      title: 'Way north closed',
      text: 'Show the way north closed off.',
      area: 'exit-north',
      when: 'absent',
    },
    {
      id: 'exit-east-closed',
      title: 'Way east closed',
      text: 'Show the way east closed off.',
      area: 'exit-east',
      when: 'absent',
    },
    {
      id: 'exit-west-closed',
      title: 'Way west closed',
      text: 'Show the way west closed off.',
      area: 'exit-west',
      when: 'absent',
    },
    {
      id: 'true-self-appears',
      title: 'True Self appears',
      text: 'Add True Self to the picture.',
      area: 'true-self',
      when: 'present',
    },
  ],
  HallOfEchoes: [
    {
      id: 'echo-stone-taken',
      title: 'Echo Stone taken',
      text: 'Remove the echo stone from the picture.',
      area: 'echo-stone',
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
      id: 'knight-of-despair-redeemed',
      title: 'Knight redeemed',
      text: 'Show the knight redeemed, his dark bearing lifted.',
      area: 'knight-of-despair',
      when: (c) => c.state.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED),
    },
    {
      id: 'ghostly-warriors-appears',
      title: 'Ghostly Warriors appears',
      text: 'Add Ghostly Warriors to the picture.',
      area: 'ghostly-warriors',
      when: 'present',
    },
  ],
  TowerOfShadows: [
    {
      id: 'whispers-gone',
      title: 'Whispers gone',
      text: 'Remove Whispers from the picture.',
      area: 'whispers',
      when: 'absent',
    },
    {
      id: 'exit-up-open',
      title: 'Way up open',
      text: 'Show the way up open and passable.',
      area: 'exit-up',
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
  ChamberOfWhispers: [
    {
      id: 'exit-north-open',
      title: 'Way north open',
      text: 'Show the way north open and passable.',
      area: 'exit-north',
      when: 'present',
    },
    {
      id: 'sorceress-of-lies-unmasked',
      title: 'Sorceress unmasked',
      text: 'Show the sorceress unmasked, her false face gone.',
      area: 'sorceress-of-lies',
      when: (c) => c.state.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED),
    },
  ],
  MemoryVault: [
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
      when: 'present',
    },
    {
      id: 'shadow-of-the-past-revealed',
      title: 'Shadow revealed',
      text: 'Show the shadow of the past in its full shape.',
      area: 'shadow-of-the-past',
      when: (c) => c.state.getStoryFlag(FLAG_ACT4_SHADOW_REVEAL_HEARD),
    },
    {
      id: 'memory-orbs-whole',
      title: 'Memory orbs whole',
      text: 'Show the glass orbs whole and still, not cracked.',
      area: 'memory-orbs',
      when: (c) => c.state.getStoryFlag(FLAG_ACT4_MEMORY_ORBS_MENDED),
    },
  ],
  ParentsVault: [
    {
      id: 'exit-north-open',
      title: 'Way north open',
      text: 'Show the way north open and passable.',
      area: 'exit-north',
      when: 'present',
    },
    {
      id: 'memories-dimmed',
      title: 'Memories dimmed',
      text: 'Dim the memory lanterns hanging in the air.',
      area: 'memories',
      when: (c) => roomSays(c, 'ParentsVault', [PARENTS_VAULT_AFTER]),
    },
  ],
  ThroneChamber: [
    {
      id: 'exit-north-open',
      title: 'Way north open',
      text: 'Show the way north open and passable.',
      area: 'exit-north',
      when: 'present',
    },
    {
      id: 'wound-closed',
      title: 'Wound closed',
      text: 'Close the wound in the air: only clear air where it was.',
      area: 'wound',
      when: (c) =>
        roomSays(c, 'ThroneChamber', [
          THRONE_CHAMBER_REDEMPTION,
          THRONE_CHAMBER_SACRIFICE,
        ]),
    },
    {
      id: 'crystal-prison-shattered',
      title: 'Crystal prison shattered',
      text: 'Show the crystal prison broken into shards around King Alden.',
      area: 'crystal-prison',
      when: (c) =>
        roomSays(c, 'ThroneChamber', [
          THRONE_CHAMBER_SHATTERED,
          THRONE_CHAMBER_REDEMPTION,
          THRONE_CHAMBER_JUSTICE,
          THRONE_CHAMBER_SACRIFICE,
        ]),
      layer: 1,
    },
    {
      id: 'malakar-healed',
      title: 'Malakar healed',
      text: 'Show Malakar sitting, the grey gone from his face.',
      area: 'malakar',
      when: (c) =>
        roomSays(c, 'ThroneChamber', [
          THRONE_CHAMBER_HEALED,
          THRONE_CHAMBER_REDEMPTION,
        ]),
      layer: 2,
    },
    {
      id: 'wound-sealed',
      title: 'Wound sealed',
      text: 'Replace the wound with a seal of gold and pale light hanging in the air, Malakar held inside it.',
      area: 'wound',
      when: (c) => roomSays(c, 'ThroneChamber', [THRONE_CHAMBER_JUSTICE]),
      layer: 3,
    },
    {
      id: 'malakar-kneeling',
      title: 'Malakar kneeling',
      text: 'Show Malakar kneeling before the king, grey and powerless.',
      area: 'malakar',
      when: (c) => roomSays(c, 'ThroneChamber', [THRONE_CHAMBER_SACRIFICE]),
      layer: 4,
    },
  ],
}
