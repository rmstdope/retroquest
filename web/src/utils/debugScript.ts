/**
 * Helpers for the dev-only `debug <name>` command, which plays a file of game
 * commands (`web/debug-scripts/<name>.txt`) as if the player had typed them.
 */

/** One command of a debug script and the line of the file it came from. */
export interface DebugLine {
  /** 1-based line number in the script file. */
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

/** What a running script needs from the game. */
export interface DebugScriptHost {
  /** Play one command as the player typed it; returns the game's answer. */
  play(command: string): string
  /** True while the act runs; a script stops when its act has ended. */
  running(): boolean
  /** Add a message of the debug command itself to the story. */
  show(text: string): void
}

/**
 * Fetch `debug-scripts/<name>.txt` from the dev server and play its commands
 * in order. The run stops at the first line the game answers with a failure
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
  const lines = parseDebugScript(text)
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
