/**
 * The words of the pictures of Act 1 whose description is not the room's own
 * description: where the room's words carry the story (a well too deep to
 * reach, a carving worn smooth) the words stay as they are, and the picture's
 * description on the image list says what the game says. Declared by room key,
 * then picture variant ('' is the room's own picture); a picture without an
 * entry is described by the room's description. `Act1.pictureText` reads it.
 */
export const ACT1_PICTURE_TEXTS: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  VillageWell: {
    '':
      'An old stone well stands between the field and the forge, its stones ' +
      'worn smooth by countless hands. A narrow stone shaft drops into ' +
      'darkness, and the water lies far below, out of reach. Moss creeps up ' +
      'the sides.',
  },
  VillageChapel: {
    '':
      'A small stone chapel at the end of the village lane. Its stained ' +
      'glass windows cast colours across the worn pews, and the air is cool ' +
      'and smells of candle wax. A kindly priest tends the altar. By the ' +
      'door the bell rope hangs straight and still. Above the door a faint ' +
      'carving, worn almost smooth, shows a tree under two moons. A dark ' +
      'corner by the altar swallows the light.',
  },
  GeneralStore: {
    // The store's one picture is painted from the shut text; the shutters
    // patch shows the open store.
    '':
      'A cluttered shop with the shutters half down. Rope, apples and ' +
      'trinkets crowd the shelves in the gloom. Hemlock stands at his ' +
      'counter, sorting apples, and keeps glancing at the lane to the chapel.',
  },
  AbandonedShed: {
    inside:
      'The inside of a rickety shed at the edge of Willowbrook, in ' +
      'near-darkness: light comes only through thin cracks between the ' +
      'grimy boards. Rusty tools and broken crates are scattered about a ' +
      'long workbench, and a thick layer of dust covers everything. The air ' +
      'smells of old earth and lamp oil. No cat lies in view; at most a pair ' +
      'of eyes glints behind the crates.',
  },
}
