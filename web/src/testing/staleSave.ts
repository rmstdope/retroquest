/**
 * Helper for the one-per-act "stale save" test. An older save holds the
 * wording the game had when it was written; loading it must give every object
 * the current wording (`refreshSavedText`). The test lists the objects and the
 * fields whose wording has changed, makes those stale in a running game, saves,
 * loads the save into a new game, and returns one line per field that does not
 * match a freshly built game's, so a failure names every mismatch at once.
 */
import { Game, type GameState } from '@/engine'

/** The wording every stale field is made to hold before the save is written. */
export const STALE_TEXT = 'STALE TEXT'

/** A constructor of some content class, as a way to find its one instance. */
type ContentClass = abstract new (...args: never[]) => object

/** One object whose saved wording is refreshed on load, and the fields that hold it. */
export interface StaleTextCase {
  /** The class of the object; the first instance found in the game is used. */
  target: ContentClass
  /** The fields that hold wording, such as `description`, `completion` or `name`. */
  fields: string[]
  /**
   * Also compare what examining the object says. For an object whose
   * `examine` words itself from the current game rather than from the saved
   * field: the stale field must not leak into what the player reads. The case
   * then stales `fields` (which may be none) as usual, and the saved
   * `description` is staled too, so that a leak shows.
   */
  examine?: boolean
}

/** What a stale-save check needs: a way to build the game and the cases to check. */
export interface StaleSaveOptions {
  /** Builds a new game of the act under test. */
  makeGame: () => Game
  /** Puts the game in the state the cases need (items carried, spells known); run on every game built. */
  prepare?: (game: Game) => void
  /** The objects and fields to make stale. */
  cases: StaleTextCase[]
}

/** Every content object a game holds: rooms, what is in them, what is carried, spells and quests. */
function contentObjects(state: GameState): object[] {
  const rooms = Object.values(state.allRooms)
  return [
    ...rooms,
    ...rooms.flatMap((room) => room.items),
    ...rooms.flatMap((room) => room.characters),
    ...state.inventory,
    ...state.knownSpells,
    ...state.nonActivatedQuests,
    ...state.activatedQuests,
    ...state.completedQuests,
  ]
}

/** The first object of the case's class in the state, or undefined when there is none. */
function locate(
  state: GameState,
  target: ContentClass,
): Record<string, unknown> | undefined {
  return contentObjects(state).find((object) => object instanceof target) as
    | Record<string, unknown>
    | undefined
}

/** The value with every string in it, however deep, replaced by the stale marker. */
function stale(value: unknown): unknown {
  if (typeof value === 'string') return STALE_TEXT
  if (Array.isArray(value)) return value.map(stale)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, stale(entry)]),
    )
  }
  return value
}

/** The case's fields, and what examining the object says when the case asks for it, as comparable text. */
function read(
  object: Record<string, unknown>,
  { fields, examine }: StaleTextCase,
  state: GameState,
): string[] {
  const texts = fields.map((field) => JSON.stringify(object[field]))
  if (examine) {
    const examined = (object as { examine(state: GameState): string }).examine(
      state,
    )
    texts.push(JSON.stringify(examined))
  }
  return texts
}

/** A game built and prepared as the options say. */
function build(options: StaleSaveOptions): Game {
  const game = options.makeGame()
  options.prepare?.(game)
  return game
}

/**
 * Make the cases' fields stale in a game, save it, load the save into a new
 * game and list every field that does not hold the wording of a freshly built
 * game, as `ClassName.field`. A class missing from a game is a mismatch too.
 */
export function staleSaveMismatches(options: StaleSaveOptions): string[] {
  const source = build(options)
  const expected = build(options)
  const unstaled: string[] = []
  for (const { target, fields, examine } of options.cases) {
    const object = locate(source.state, target)
    if (!object) continue
    const saved = examine ? [...fields, 'description'] : fields
    for (const field of saved) {
      const made = stale(object[field])
      if (JSON.stringify(made) === JSON.stringify(object[field]))
        unstaled.push(`${target.name}.${field}: nothing to make stale`)
      object[field] = made
    }
  }
  const loaded = options.makeGame()
  const answer = loaded.loadSaveData(source.toSaveData())
  if (!answer.includes('loaded')) return [`the save did not load: ${answer}`]
  const mismatches: string[] = [...unstaled]
  for (const staleCase of options.cases) {
    const { target, fields } = staleCase
    const want = locate(expected.state, target)
    const got = locate(loaded.state, target)
    if (!want || !got) {
      mismatches.push(`${target.name}: not found in the game`)
      continue
    }
    const wanted = read(want, staleCase, expected.state)
    const actual = read(got, staleCase, loaded.state)
    const names = staleCase.examine ? [...fields, 'examine()'] : fields
    names.forEach((name, i) => {
      if (actual[i] !== wanted[i]) mismatches.push(`${target.name}.${name}`)
    })
  }
  return mismatches
}
