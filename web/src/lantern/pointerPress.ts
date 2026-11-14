/**
 * Who owns a press of the pointer while the story is told.
 *
 * A click or tap on the room's picture, a thing on it, a picture of the belt,
 * a way out's dot showing through the words, the speech or the story text
 * can bring a change of scene up, go a way, hurry the narrator, open a ring
 * or do nothing. This module is the one place that decides which, from what
 * the press landed on and what is going on; the layout only describes the
 * press and carries out the answer, as it does for keys with `hurryKeys.ts`.
 *
 * Three different questions sit behind "the story is told", and they are
 * inputs here, named for what they differ in: `scene` (a change of scene is
 * under way), `sceneChange` (a talk still to change the scene) and `telling`
 * (the narrator reads or speech is still coming; a room's words on the
 * picture and an arrival are not part of it, so an unnarrated arrival lets a
 * thing act). The hold to skip has its own, wider "told" that also counts
 * those, and asks this module only whether a thing on the picture acts.
 */

/** What a press landed on. */
export type PressKind =
  | 'picture'
  | 'thing'
  | 'belt'
  | 'exit-dot'
  | 'speech'
  | 'story'

/** A press as the layout hears it: what it landed on, and what is going on. */
export interface PointerPress {
  /** What the press landed on. */
  kind: PressKind
  /** A change of scene is under way (`scene.turn` is set). */
  scene: boolean
  /** A talk still to change the scene has moved the player: the old room is still shown. */
  sceneChange: boolean
  /** The narrator reads, or speech is still coming. */
  telling: boolean
  /** The game takes input. */
  acceptInput: boolean
  /** The change of scene is not idle (rising, falling or in the dark). */
  sceneBusy: boolean
  /** A dialog, drawer or sheet is in the way. */
  blocked: boolean
  /** For the picture and a way's dot: a way out was pressed. For a thing: a way out lies under the press, and the press is not on the thing's own mark. */
  way: boolean
  /** A thing is in hand on the belt. */
  hand: boolean
  /** For the story: the press landed on a button, link or name, which keeps it. */
  onControl: boolean
}

/** A press of `kind` on a quiet stage (nothing told, the game takes input), with `over` set: what a press that depends on nothing else is described with. */
export function quietPress(
  kind: PressKind,
  over: Partial<PointerPress> = {},
): PointerPress {
  return {
    kind,
    scene: false,
    sceneChange: false,
    telling: false,
    acceptInput: true,
    sceneBusy: false,
    blocked: false,
    way: false,
    hand: false,
    onControl: false,
    ...over,
  }
}

/** What a press does. */
export type PointerPressAction =
  /** Let go the words in the dark, or bring the new room up at once. */
  | 'continue-scene'
  /** Bring the new room of a talk up, never walking from the old one. */
  | 'scene-now'
  /** Go the way out that was pressed. */
  | 'go-way'
  /** Show the rest of the speech at once and tap the narrator on. */
  | 'hurry'
  /** Tap the narrator on. */
  | 'tap'
  /** Send what is in hand to the thing. */
  | 'send-hand'
  /** Open the thing's ring. */
  | 'open-ring'
  /** Nothing: the press is left to whatever it landed on. */
  | 'none'

/** What a press does, in a form the layout can carry out. */
export interface PointerPressDecision {
  /** What the press does. */
  action: PointerPressAction
}

/** Whether the game takes a move from a press on the picture or the belt now. */
function takesMove(press: PointerPress): boolean {
  return (
    press.acceptInput &&
    !press.sceneBusy &&
    !press.scene &&
    !press.telling &&
    !press.blocked
  )
}

/** A thing's press: its ring, or what is in hand, when the game takes a move. */
function thingPress(press: PointerPress): PointerPressDecision {
  if (press.way || !takesMove(press)) return { action: 'none' }
  return { action: press.hand ? 'send-hand' : 'open-ring' }
}

/** A belt picture's press: a scene first, then hurry the words, then like a thing. */
function beltPress(press: PointerPress): PointerPressDecision {
  if (press.telling) return { action: 'hurry' }
  if (!takesMove(press)) return { action: 'none' }
  return { action: press.hand ? 'send-hand' : 'open-ring' }
}

/**
 * Decide what a press does while the story is told. A change of scene (or a
 * talk's still to come) comes up first, for the picture, the belt and a way's
 * dot, and a press never walks from the old room. After that a way goes at
 * once, the words are hurried, or a thing takes the press.
 */
export function decidePointerPress(press: PointerPress): PointerPressDecision {
  switch (press.kind) {
    case 'speech':
      return { action: 'hurry' }
    case 'story':
      return { action: press.onControl ? 'none' : 'tap' }
    case 'thing':
      return thingPress(press)
    default:
      break
  }
  if (press.scene) return { action: 'continue-scene' }
  if (press.sceneChange) return { action: 'scene-now' }
  if (press.kind === 'belt') return beltPress(press)
  if (press.kind === 'exit-dot')
    return { action: press.way && press.acceptInput ? 'go-way' : 'none' }
  if (press.way && press.acceptInput) return { action: 'go-way' }
  return { action: 'hurry' }
}
