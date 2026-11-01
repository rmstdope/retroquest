import { describe, expect, it } from 'vitest'
import { paperHeight } from './paperHeight'

describe('paperHeight', () => {
  it('fits a short turn: its content plus the paper around it', () => {
    expect(paperHeight(120, 40, 800)).toBe(160)
  })

  it('stops at half the play area', () => {
    expect(paperHeight(900, 40, 800)).toBe(400)
    expect(paperHeight(360, 40, 800)).toBe(400)
  })
})
