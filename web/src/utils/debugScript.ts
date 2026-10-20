/**
 * Helpers for the dev-only `debug <name>` command, which plays a list of game
 * commands as if the player had typed them: `act<N>` plays act N's golden
 * path, any other name a file `web/debug-scripts/<name>.txt`.
 */

/** One command of a debug script and the line it came from. */
export interface DebugLine {
  /** 1-based line number in the script file, or position in a golden path. */
  line: number
  command: string
}

const SCRIPT_NAME_PATTERN = /^[a-z0-9_-]+$/

/** True for a script name that is safe to turn into a file name. */
export function isDebugScriptName(name: string): boolean {
  return SCRIPT_NAME_PATTERN.test(name)
}

/** The commands of a script: one per line, `#` comments and blank lines skipped. */
export function parseDebugScript(text: string): DebugLine[] {
  const lines: DebugLine[] = []
  text.split('\n').forEach((raw, index) => {
    const command = raw.trim()
    if (command !== '' && !command.startsWith('#')) {
      lines.push({ line: index + 1, command })
    }
  })
  return lines
}

/** Why an answer is a failure (its text without markup), or null when it is not. */
export function failureReason(answer: string): string | null {
  const match = /\[failure\]([\s\S]*?)\[\/failure\]/.exec(answer)
  if (match === null) return null
  return match[1].replace(/\[\/?[a-z_]+\]/g, '').trim()
}

const ACT_SCRIPT_PATTERN = /^act([1-9]\d*)$/

/**
 * The lines of `debug act<N>`: an act's golden path, numbered by their 1-based
 * position in it. The path itself stops before the act's completing step
 * (Act I's `use map`), which is left to the player.
 */
export function goldenPathLines(path: string[]): DebugLine[] {
  return path.map((command, index) => ({ line: index + 1, command }))
}

/** What a running script needs from the game. */
export interface DebugScriptHost {
  /** Play one command as the player typed it; returns the game's answer. */
  play(command: string): string
  /** True while the act runs; a script stops when its act has ended. */
  running(): boolean
  /** Add a message of the debug command itself to the story. */
  show(text: string): void
  /** The golden path of act `actNumber`; empty when the act has none. */
  goldenPath(actNumber: number): string[]
}

/**
 * Play the script `name` in order: `act<N>` plays the golden path of act N
 * (the same list `cheat act N` plays); any other name
 * is fetched from `debug-scripts/<name>.txt` on the dev server. The run stops at the first line the game answers with a failure
 * and says which line it was and why.
 */
export async function playDebugScript(
  name: string,
  host: DebugScriptHost,
): Promise<void> {
  const notFound = `[failure]Debug script '${name}' not found.[/failure]`
  if (!isDebugScriptName(name)) {
    host.show(notFound)
    return
  }
  const act = ACT_SCRIPT_PATTERN.exec(name)
  if (act !== null) {
    const lines = goldenPathLines(host.goldenPath(Number(act[1])))
    if (lines.length === 0) host.show(notFound)
    else await playLines(name, lines, host)
    return
  }
  let text: string | null = null
  try {
    const response = await fetch(`/debug-scripts/${name}.txt`)
    if (response.ok) text = await response.text()
  } catch {
    text = null
  }
  if (text === null) {
    host.show(notFound)
    return
  }
  await playLines(name, parseDebugScript(text), host)
}

/** Play `lines` in order, stopping at the first failure or when the act ends. */
async function playLines(
  name: string,
  lines: DebugLine[],
  host: DebugScriptHost,
): Promise<void> {
  for (const { line, command } of lines) {
    const reason = failureReason(host.play(command))
    if (reason !== null) {
      host.show(
        `[failure]Debug script '${name}' stopped at line ${line}: ` +
          `'${command}'. ${reason}[/failure]`,
      )
      return
    }
    if (!host.running()) {
      host.show(
        `Debug script '${name}' stopped at line ${line}: the act ended.`,
      )
      return
    }
  }
  host.show(`Debug script '${name}' played ${lines.length} commands.`)
}
