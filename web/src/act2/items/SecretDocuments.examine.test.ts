import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import { FLAG_READ_SQUIRES_DIARY } from '../Act2StoryFlags'
import { SecretDocuments } from './SecretDocuments'

describe('the secret documents name where the king was carried', () => {
  it('give the place once the diary has made sense of them', () => {
    const game = new Game([new Act2()])
    game.state.setStoryFlag(FLAG_READ_SQUIRES_DIARY, true)

    const read = new SecretDocuments().examine(game.state)

    expect(read).toContain(
      'It names where the king was to be carried: the bastion on the ' +
        'shattered ridge, north of the hills.',
    )
    expect(read.indexOf('shattered ridge')).toBeLessThan(
      read.indexOf('It ends with a name'),
    )
  })

  it('give nothing of the place before the diary', () => {
    const game = new Game([new Act2()])

    expect(new SecretDocuments().examine(game.state)).not.toContain(
      'shattered ridge',
    )
  })
})
