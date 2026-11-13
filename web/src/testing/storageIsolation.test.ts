import { describe, expect, it } from 'vitest'
import { appStorage } from '@/storage/appStorage'

const KEY = 'retroquest_isolation_probe'

/**
 * The two tests run in order: the first leaves a value behind, the second
 * proves `domSetup.ts` gave it a fresh storage. Deleting that setup turns the
 * second red on every machine.
 */
describe('storage isolation between tests', () => {
  it('writes a value', () => {
    appStorage.setItem(KEY, 'left behind')
    expect(appStorage.getItem(KEY)).toBe('left behind')
  })

  it('does not see the value of the test before it', () => {
    expect(appStorage.getItem(KEY)).toBeNull()
  })
})
