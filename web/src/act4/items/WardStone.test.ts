import { describe, it, expect } from 'vitest'
import { WardStone } from './WardStone'

describe('WardStone', () => {
  it('answers to its side with or without "ward"', () => {
    const stone = new WardStone('middle')
    expect(stone.name).toBe('Middle Stone')
    expect(stone.answersTo('middle stone')).toBe(true)
    expect(stone.answersTo('Middle Ward Stone')).toBe(true)
    expect(stone.answersTo('left stone')).toBe(false)
    expect(stone.canBeCarried).toBe(false)
  })
})
