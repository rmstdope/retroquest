/**
 * Plays an act's golden path the way the interface does and reports every
 * word the path says to a person that Say… would not have offered at that
 * moment, so a word the story never puts in front of Elior is found by a test.
 */
import { GameController, type Act, Game } from '@/engine'

/** A word the path says that Say… did not offer when it was said. */
export interface MissingWord {
  command: string
  word: string
}

/** The words of the act's vocabulary that no step of `path` puts in front of Elior. */
export function wordsNeverMetOnPath(act: Act, path: string[]): string[] {
  const controller = new GameController(new Game([act]))
  controller.advanceToRunning()
  controller.openRoom()
  const met = new Set<string>()
  for (const command of path) {
    controller.takeTurn(command)
    controller.game.state.settleQuests()
    for (const entry of controller.getSayWords()) met.add(entry.word)
  }
  return act.words.filter((word) => !met.has(word))
}

/** The words of `say <word> to <person>` commands of `path` that were not on offer when said. */
export function wordsMissingOnPath(act: Act, path: string[]): MissingWord[] {
  const controller = new GameController(new Game([act]))
  controller.advanceToRunning()
  controller.openRoom()
  const missing: MissingWord[] = []
  for (const command of path) {
    const said = /^say (.+) to .+$/i.exec(command)
    if (said) {
      const offered = controller
        .getSayWords()
        .map((entry) => entry.word.toLowerCase())
      if (!offered.includes(said[1].toLowerCase())) {
        missing.push({ command, word: said[1] })
      }
    }
    controller.takeTurn(command)
    controller.game.state.settleQuests()
  }
  return missing
}
