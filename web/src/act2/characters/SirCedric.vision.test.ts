/** After the vision Elior can answer Sir Cedric before the act ends (rq-cum). */
import { describe, it, expect } from 'vitest'
import { Game, characterName, dialogue, event } from '@/engine'
import type { GameState } from '@/engine'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'
import { Act2 } from '../Act2'
import {
  FLAG_GATHERING_STORM_COMPLETED,
  FLAG_VISION_SHARED,
} from '../Act2StoryFlags'
import { PropheticVision } from '../spells/PropheticVision'
import { SirCedric, VISION_CLOSING } from './SirCedric'

const CEDRIC = characterName('Sir Cedric')
const BELIEF =
  'The missing page in the birth roll. The stranger asking after a family ' +
  'that left. You hear yourself say it before you have thought it: ' +
  '[italic]“He took them. That is why they vanished, and that is why he ' +
  `wants me.”[/italic] ${CEDRIC} does not correct you. He does not know ` +
  'either.'
const HINT =
  "And yet the voice did not sound like a hunter's. " +
  `${CEDRIC} waits, watching you, as if he can see you have something to ` +
  'say.'
const TELLING =
  `You tell ${CEDRIC} the part you would rather keep to yourself: the voice ` +
  'did not sound like a hunter. It sounded glad to see you.'
const REPLY = dialogue(
  'Sir Cedric',
  'Then it is worse, not better. A thing that wants you to come to it.',
)
const WAITING_LINE = `${CEDRIC} is still waiting for you, his hand on his sword.`
const REMINDER = event(
  `You have already shared the vision. ${CEDRIC} is waiting for you to speak.`,
)

/** An Act II game in the courtyard with every side quest done and the vision cast. */
function waitingGame(): { game: Game; cedric: SirCedric } {
  const game = new Game([new Act2()])
  const state = game.state
  state.currentRoom = state.allRooms.CastleCourtyard
  const cedric = state.currentRoom.characters.find(
    (c): c is SirCedric => c instanceof SirCedric,
  )!
  const sideQuests = [
    ...state.nonActivatedQuests,
    ...state.activatedQuests,
    ...state.completedQuests,
  ].filter((quest) => !quest.isMain())
  state.completedQuests.push(...sideQuests)
  new PropheticVision().castSpell(state)
  return { game, cedric }
}

/** Whether the act's completion flag is set. */
function completed(state: GameState): boolean {
  return state.getStoryFlag(FLAG_GATHERING_STORM_COMPLETED)
}

describe('the vision leaves Cedric waiting', () => {
  it('ends the cast on the hint and does not complete the act', () => {
    const { game } = waitingGame()
    const state = game.state
    expect(state.getStoryFlag(FLAG_VISION_SHARED)).toBe(true)
    expect(completed(state)).toBe(false)
    const again = new Game([new Act2()])
    again.state.currentRoom = again.state.allRooms.CastleCourtyard
    const sideQuests = [
      ...again.state.nonActivatedQuests,
      ...again.state.activatedQuests,
    ].filter((quest) => !quest.isMain())
    again.state.completedQuests.push(...sideQuests)
    const cast = new PropheticVision().castSpell(again.state)
    expect(
      cast.endsWith('hunting.' + '[/dialogue]\n\n' + BELIEF + '\n\n' + HINT),
    ).toBe(true)
    expect(cast).not.toContain('Act II is complete')
    expect(cast).not.toContain('All your life')
    expectMarkupWellFormed(cast)
  })

  it('answers a second cast with the reminder and does not replay the vision', () => {
    const { game } = waitingGame()
    const again = new PropheticVision().castSpell(game.state)
    expect(again).toBe(REMINDER)
    expect(completed(game.state)).toBe(false)
  })

  it('shows the waiting line in the courtyard while he waits', () => {
    const { game } = waitingGame()
    const room = game.state.currentRoom
    const before = new Game([new Act2()])
    expect(
      before.state.allRooms.CastleCourtyard.descriptionFor(before.state),
    ).not.toContain(WAITING_LINE)
    expect(room.descriptionFor(game.state)).toContain(WAITING_LINE)
    game.state.setStoryFlag(FLAG_GATHERING_STORM_COMPLETED, true)
    expect(room.descriptionFor(game.state)).not.toContain(WAITING_LINE)
  })

  it('keeps waiting when other words are said to him', () => {
    const { game, cedric } = waitingGame()
    const reply = cedric.sayTo(game.state, 'hello')
    expect(reply).toContain("don't seem to understand")
    expect(completed(game.state)).toBe(false)
  })
})

describe('Elior answers Cedric', () => {
  it('ends the act with the telling, his reply and the closing lines on say truth', () => {
    const { game, cedric } = waitingGame()
    const reply = cedric.sayTo(game.state, 'truth')
    expect(reply).toBe(`${TELLING}\n\n${REPLY}\n\n${VISION_CLOSING}`)
    expect(completed(game.state)).toBe(true)
    expect(game.state.virtues).toEqual([])
    expectMarkupWellFormed(reply)
  })

  it('ends the act with the closing lines on any talk', () => {
    const { game, cedric } = waitingGame()
    const reply = cedric.talkTo(game.state)
    expect(reply).toBe(VISION_CLOSING)
    expect(completed(game.state)).toBe(true)
    expect(game.state.virtues).toEqual([])
  })

  it('keeps the closing lines word for word', () => {
    expect(VISION_CLOSING.startsWith('All your life, Malakar has been')).toBe(
      true,
    )
    expect(
      VISION_CLOSING.endsWith(
        '[bold]Act II is complete.[/bold] The storm has a name now.',
      ),
    ).toBe(true)
    expect(VISION_CLOSING).toContain('"Wherever this road leads')
  })

  it('gives the usual reply to say truth before the vision', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.CastleCourtyard
    const cedric = game.state.currentRoom.characters.find(
      (c): c is SirCedric => c instanceof SirCedric,
    )!
    const reply = cedric.sayTo(game.state, 'truth')
    expect(reply).toContain("don't seem to understand")
    expect(completed(game.state)).toBe(false)
  })
})
