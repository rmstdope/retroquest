/**
 * Named points in a list of commands. A golden path is written with marks
 * among its steps (`'@took-bucket'`), so that something placed at a point of
 * the path (an optional scene of the narration script) names the point and
 * stays with it when steps are added or removed elsewhere. A mark moves only
 * where it is moved in the source.
 */

/** What a step that is a mark, not a command, starts with. */
const MARK = '@'

/** A path's commands and its marks: each mark's name to the index of the command it follows (-1: before the first). */
export interface MarkedPath {
  commands: string[]
  marks: Record<string, number>
}

/** Records the mark `name` at `index`, refusing a name already taken. */
function addMark(
  marks: Record<string, number>,
  name: string,
  index: number,
): void {
  if (Object.hasOwn(marks, name))
    throw new Error(`the path has two marks named ${MARK}${name}`)
  marks[name] = index
}

/** Splits `steps` into the commands and the marks (steps starting `@`) among them. */
export function markedPath(steps: string[]): MarkedPath {
  const commands: string[] = []
  const marks: Record<string, number> = {}
  for (const step of steps) {
    if (!step.startsWith(MARK)) {
      commands.push(step)
      continue
    }
    const name = step.slice(MARK.length)
    if (!name) throw new Error(`a mark of the path has no name: "${step}"`)
    addMark(marks, name, commands.length - 1)
  }
  return { commands, marks }
}

/** The paths played one after another as one, each mark still after its own command. */
export function joinPaths(...paths: MarkedPath[]): MarkedPath {
  const commands: string[] = []
  const marks: Record<string, number> = {}
  for (const path of paths) {
    for (const [name, index] of Object.entries(path.marks))
      addMark(marks, name, commands.length + index)
    commands.push(...path.commands)
  }
  return { commands, marks }
}
