import { describe, it, expect } from 'vitest'
import { TheHermitsWarningQuest } from './TheHermitsWarning'

describe("The Hermit's Warning quest", () => {
  it('opens with the new first two sentences and keeps the rest', () => {
    const quest = new TheHermitsWarningQuest()

    expect(quest.description).toBe(
      'A forest hermit at the edge of the Enchanted Forest has warned you ' +
        "that the forest moves its paths and keeps old things that don't " +
        'care for strangers. The hermit has given you a protective charm to ' +
        'help safeguard your journey through the magical wilderness, but you ' +
        'need to prepare yourself before venturing further into the ' +
        'Enchanted Forest.',
    )
    expect(quest.completion).toBe(
      "You have heeded the hermit's warning and are now prepared to face " +
        'the challenges of the Enchanted Forest.',
    )
  })
})
