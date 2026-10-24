/**
 * Sir Cedric's lines in Act III, written once: the helpers that attribute his
 * speech and narration, and the scenes other characters and items play when
 * he is in the room (his reactions, the vow, the caverns, the fortress gate).
 */
import { type GameState, characterName, dialogue, speech } from '@/engine'

/** The name he is shown under, in room listings and in every line. */
export const CEDRIC_NAME = 'Sir Cedric'

/** One spoken line of Sir Cedric, as attributed speech. */
export function cedricSays(words: string): string {
  return dialogue(CEDRIC_NAME, words)
}

/** A narration line that starts with his name, e.g. "Sir Cedric looks away.". */
export function cedricDoes(rest: string): string {
  return `${characterName(CEDRIC_NAME)} ${rest}`
}

/** Whether Sir Cedric stands in the room the player is in. */
export function cedricIsHere(gameState: GameState): boolean {
  return gameState.currentRoom.getCharacterByName('cedric') !== null
}

/**
 * The text to append to a scene when he is in the room: a newline and the
 * text, or nothing at all when he is not there.
 */
export function cedricAdds(gameState: GameState, text: string): string {
  return cedricIsHere(gameState) ? `\n${text}` : ''
}

/** His reaction to the first "the king is weaker" beat (leaving the Ruins). */
export const CEDRIC_KING_WEAKER_1 =
  cedricDoes('looks away, toward the mountain.') +
  '\n' +
  cedricSays(
    'I had the wall that night. I heard nothing. ' +
      'Every day he is weaker, I hear it.',
  )

/** His reaction to the second "the king is weaker" beat (leaving the mountain). */
export const CEDRIC_KING_WEAKER_2 =
  `${characterName(CEDRIC_NAME)}'s hand goes to his sword hilt and stays there.` +
  '\n' +
  cedricSays('Weaker still. And I stood on a mountain, waiting on a bird.')

/** His reaction to the third "the king is weaker" beat (leaving the caverns). */
export const CEDRIC_KING_WEAKER_3 =
  cedricDoes('says nothing for a long moment.') +
  '\n' +
  cedricSays('He was taken on my watch. He will not die on it.')

/** He steps toward the vents when the heat ward is tried too early. */
export const CEDRIC_HEAT_WARD =
  cedricDoes('steps toward the vents; the heat drives him back a pace.') +
  '\n' +
  cedricSays('Between breaths, then. I have run through worse than this.')

/** His answer to the Phoenix Guardian's talk of patience. */
export const CEDRIC_PATIENCE = cedricSays(
  'Patience. The king has had nothing from us but patience.',
)

/** He looks at the ground when the Phoenix speaks of the Warden who had none. */
export const CEDRIC_FEATHER_GLANCE = `Beside you, ${characterName(CEDRIC_NAME)} looks at the ground.`

/** He holds the beam while the braces are set. */
export const CEDRIC_BRACES = cedricDoes(
  'takes the beam on his shoulder and holds it while you set it.',
)

/** He drives the last wedge block home. */
export const CEDRIC_WEDGE = cedricDoes(
  'drives the last block home with the flat of his shield.',
)

/** His offer to stay with the miners, their answer and his nod. */
export const CEDRIC_STAY_BEHIND =
  cedricDoes('sets down the last beam and does not step away from it.') +
  '\n' +
  cedricSays('Someone should stay until the braces settle. I will.') +
  '\n' +
  `The ${characterName('oldest miner')} puts a grey hand on his arm.` +
  ' ' +
  speech(
    'You have a king to fetch, ser. We have stood in worse holes than ' +
      'this one.',
  ) +
  '\n' +
  cedricDoes('looks at him for a long moment, then nods.')

/** What he does and says as the circle sets them down at the fortress. */
export const CEDRIC_GATE_ARRIVAL =
  cedricDoes('stands looking up at the gates.') +
  '\n' +
  cedricSays(
    'If I had held the door that night, we would not be standing at this one.',
  ) +
  '\n' +
  'Words carved beneath the runes of a sunlit glade come back to you.'

/** The same gate line when he is talked to again, and the hint with it. */
export const CEDRIC_GATE_TALK =
  cedricSays(
    'If I had held the door that night, we would not be standing at this one.',
  ) +
  '\n' +
  'Words carved beneath the runes of a sunlit glade come back to you.'

/** What he says to words that are not the refrain. */
export const CEDRIC_NOT_NOW =
  cedricDoes('shakes his head.') + ' ' + speech('Not now. Not here.')
