import { describe, it, expect } from 'vitest'
import { findMarkupProblems, writing } from '@/engine'
import { FadedPhotograph } from './FadedPhotograph'

describe('FadedPhotograph', () => {
  it('writes the message on its back as deliberately unsigned words', () => {
    const description = new FadedPhotograph().description
    expect(findMarkupProblems(description)).toEqual([])
    expect(description).toContain(
      writing('Seek the truth where the river bends.'),
    )
  })
})
