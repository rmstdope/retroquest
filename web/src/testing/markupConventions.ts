/**
 * The markup conventions every answer of Acts II to IV follows, shared by the
 * per-act sweeps (`act<N>/markupConventions.test.ts`): the markup is
 * well-formed and every dialogue block is attributed (the engine's
 * `findMarkupProblems`), the speaker of each block is one of the act's cast, no quoted speech is left in the
 * narration (unless the command is listed as quoting a written text). A sweep plays a path and reports every mismatch at once, so a
 * failure names each command and answer at fault.
 */
import { findMarkupProblems, type Game } from '@/engine'

const NAMED_SPANS = /\[character_name\]([\s\S]*?)\[\/character_name\]/g
const DIALOGUE_BLOCK = /\[dialogue\]([\s\S]*?)\[\/dialogue\]/g
const QUOTED_SPEECH = /(?<![A-Za-z])'[A-Z]/

/** One command played and the answer the game gave. */
export interface PlayedAnswer {
  command: string
  answer: string
}

/** Play the commands on the game, settling quests after each, and return every answer. */
export function playAnswers(game: Game, commands: string[]): PlayedAnswer[] {
  return commands.map((command) => {
    const answer = game.commandParser.parse(command)
    game.state.settleQuests()
    return { command, answer }
  })
}

/** The path with every talk made twice, so each character's later answer is played too. */
export function talkedTwice(commands: string[]): string[] {
  return commands.flatMap((command) =>
    command.startsWith('talk to ') ? [command, command] : [command],
  )
}

/** The path with a wrong word tried before every `say <word> to <someone>`, so each character's answer to a wrong word is played too. */
export function wordsTriedWrongFirst(commands: string[]): string[] {
  return commands.flatMap((command) => {
    const spoken = /^say .+ to (.+)$/.exec(command)
    return spoken ? [`say hello to ${spoken[1]}`, command] : [command]
  })
}

/** The names of every character standing in a room of the game, for the cast of a sweep. */
export function castOf(game: Game): string[] {
  return Object.values(game.state.allRooms).flatMap((room) =>
    room.characters.map((character) => character.name),
  )
}

/**
 * Every way the answers break the conventions, one line each, naming the
 * command. `cast` lists the names a dialogue block may be attributed to
 * (compared without case, a single word such as "Lyria" matching "Master Healer Lyria"); an empty name is a written text, signed by nobody.
 */
export function markupConventionProblems(
  played: PlayedAnswer[],
  cast: string[],
  quotingCommands: string[] = [],
): string[] {
  const names = cast.map((name) => name.toLowerCase())
  const known = (speaker: string): boolean =>
    speaker === '' ||
    names.some(
      (name) => name === speaker || name.split(/\W+/).includes(speaker),
    )
  const problems: string[] = []
  for (const { command, answer } of played) {
    const at = `after "${command}": ${answer}`
    for (const problem of findMarkupProblems(answer))
      problems.push(`malformed markup ${at} (${problem})`)
    for (const block of answer.matchAll(DIALOGUE_BLOCK)) {
      const spans = [...answer.slice(0, block.index).matchAll(NAMED_SPANS)]
      const speaker = spans.at(-1)?.[1].trim().toLowerCase() ?? ''
      if (!known(speaker)) problems.push(`unknown speaker "${speaker}" ${at}`)
    }
    if (
      !quotingCommands.includes(command) &&
      QUOTED_SPEECH.test(answer.replace(DIALOGUE_BLOCK, ''))
    )
      problems.push(`speech outside dialogue ${at}`)
  }
  return problems
}
