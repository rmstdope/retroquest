import { describe, it, expect } from 'vitest'
import { PhoenixFeather } from './PhoenixFeather'

describe('PhoenixFeather', () => {
  it('is described by how it looks and feels, not as wise', () => {
    expect(new PhoenixFeather().description).toBe(
      'A single feather shed by the Phoenix, warm as a heartbeat, red at the ' +
        'quill and gold at the tip. It hums faintly in your hand.',
    )
  })
})
