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
