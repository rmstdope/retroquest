import type { ImagePatch } from '../roomPatches'

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
    },
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
    },
    {
      id: 'ward-stone-fragment-appears',
      title: 'Ward Stone Fragment appears',
      text: 'Add the ward stone fragment to the picture.',
      area: 'ward-stone-fragment',
    },
    {
      id: 'guardians-chain-appears',
      title: "Guardian's Chain appears",
      text: "Add the guardian's chain to the picture.",
      area: 'guardians-chain',
    },
    {
      id: 'guardians-essence-appears',
      title: "Guardian's Essence appears",
      text: "Add the guardian's essence to the picture.",
      area: 'guardians-essence',
    },
    {
      id: 'ward-stones-dark',
      title: 'Ward stones dark',
      text: 'Darken the three ward stones: no violet glow.',
      area: 'ward-stones',
    },
  ],
  OuterCourtyard: [
    {
      id: 'exit-north-open',
      title: 'Way north open',
      text: 'Show the way north open and passable.',
      area: 'exit-north',
    },
    {
      id: 'trapped-servants-freed',
      title: 'Servants freed',
      text: 'Show the servants freed from their trap and standing free.',
      area: 'trapped-servants',
    },
    {
      id: 'servants-pendant-appears',
      title: "Servant's Pendant appears",
      text: "Add the servant's pendant to the picture.",
      area: 'servants-pendant',
    },
  ],
  MirrorLabyrinth: [
    {
      id: 'exit-north-closed',
      title: 'Way north closed',
      text: 'Show the way north closed off.',
      area: 'exit-north',
    },
    {
      id: 'exit-east-closed',
      title: 'Way east closed',
      text: 'Show the way east closed off.',
      area: 'exit-east',
    },
    {
      id: 'exit-west-closed',
      title: 'Way west closed',
      text: 'Show the way west closed off.',
      area: 'exit-west',
    },
    {
      id: 'true-self-appears',
      title: 'True Self appears',
      text: 'Add True Self to the picture.',
      area: 'true-self',
    },
  ],
  HallOfEchoes: [
    {
      id: 'echo-stone-taken',
      title: 'Echo Stone taken',
      text: 'Remove the echo stone from the picture.',
      area: 'echo-stone',
    },
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
    },
    {
      id: 'knight-of-despair-redeemed',
      title: 'Knight redeemed',
      text: 'Show the knight redeemed, his dark bearing lifted.',
      area: 'knight-of-despair',
    },
    {
      id: 'ghostly-warriors-appears',
      title: 'Ghostly Warriors appears',
      text: 'Add Ghostly Warriors to the picture.',
      area: 'ghostly-warriors',
    },
  ],
  TowerOfShadows: [
    {
      id: 'whispers-gone',
      title: 'Whispers gone',
      text: 'Remove Whispers from the picture.',
      area: 'whispers',
    },
    {
      id: 'exit-up-open',
      title: 'Way up open',
      text: 'Show the way up open and passable.',
      area: 'exit-up',
    },
    {
      id: 'exit-in-open',
      title: 'Way in open',
      text: 'Show the way in open and passable.',
      area: 'exit-in',
    },
  ],
  ChamberOfWhispers: [
    {
      id: 'exit-north-open',
      title: 'Way north open',
      text: 'Show the way north open and passable.',
      area: 'exit-north',
    },
    {
      id: 'sorceress-of-lies-unmasked',
      title: 'Sorceress unmasked',
      text: 'Show the sorceress unmasked, her false face gone.',
      area: 'sorceress-of-lies',
    },
  ],
  MemoryVault: [
    {
      id: 'exit-east-open',
      title: 'Way east open',
      text: 'Show the way east open and passable.',
      area: 'exit-east',
    },
    {
      id: 'shadow-of-the-past-revealed',
      title: 'Shadow revealed',
      text: 'Show the shadow of the past in its full shape.',
      area: 'shadow-of-the-past',
    },
    {
      id: 'memory-orbs-whole',
      title: 'Memory orbs whole',
      text: 'Show the glass orbs whole and still, not cracked.',
      area: 'memory-orbs',
    },
  ],
  ParentsVault: [
    {
      id: 'exit-north-open',
      title: 'Way north open',
      text: 'Show the way north open and passable.',
      area: 'exit-north',
    },
    {
      id: 'memories-dimmed',
      title: 'Memories dimmed',
      text: 'Dim the memory lanterns hanging in the air.',
      area: 'memories',
    },
  ],
  ThroneChamber: [
    {
      id: 'exit-north-open',
      title: 'Way north open',
      text: 'Show the way north open and passable.',
      area: 'exit-north',
    },
    {
      id: 'wound-closed',
      title: 'Wound closed',
      text: 'Close the wound in the air: only clear air where it was.',
      area: 'wound',
    },
    {
      id: 'crystal-prison-shattered',
      title: 'Crystal prison shattered',
      text: 'Show the crystal prison broken into shards around King Alden.',
      area: 'crystal-prison',
    },
    {
      id: 'malakar-healed',
      title: 'Malakar healed',
      text: 'Show Malakar sitting, the grey gone from his face.',
      area: 'malakar',
    },
  ],
}
