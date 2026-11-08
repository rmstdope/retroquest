import type { ImagePatch } from '../roomPatches'

/**
 * The declared patches of each room of Act 4, by room key: the small changes
 * the room's picture needs (a thing taken or gone, a thing changed, a way
 * opened), each linked to the named area of the thing it is about. A room
 * with no small change has no entry.
 */
export const ACT4_ROOM_PATCHES: Record<string, ImagePatch[]> = {
  FortressGates: [
    {
      id: 'guardians-chain-taken',
      title: "Guardian's Chain taken",
      text: "Remove the guardian's chain from the picture.",
      area: 'guardians-chain',
    },
    {
      id: 'guardians-essence-taken',
      title: "Guardian's Essence taken",
      text: "Remove the guardian's essence from the picture.",
      area: 'guardians-essence',
    },
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
  ],
  OuterCourtyard: [
    {
      id: 'servants-pendant-taken',
      title: "Servant's Pendant taken",
      text: "Remove the servant's pendant from the picture.",
      area: 'servants-pendant',
    },
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
  ],
  ParentsVault: [
    {
      id: 'exit-north-open',
      title: 'Way north open',
      text: 'Show the way north open and passable.',
      area: 'exit-north',
    },
  ],
  ThroneChamber: [
    {
      id: 'exit-north-open',
      title: 'Way north open',
      text: 'Show the way north open and passable.',
      area: 'exit-north',
    },
  ],
}
