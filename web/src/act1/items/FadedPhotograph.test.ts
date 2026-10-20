import { describe, it, expect } from 'vitest'
import { findMarkupProblems } from '@/engine'
import { FadedPhotograph } from './FadedPhotograph'

describe('FadedPhotograph', () => {
  it('writes the message on its back as deliberately unsigned words', () => {
    expect(findMarkupProblems(new FadedPhotograph().description)).toEqual([])
  })
})
