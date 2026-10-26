import { describe, expect, it } from 'vitest'
import { retireOrphans } from '../../../tts/retire-orphans'

const MANIFEST =
  '{\n' +
  ' "aa": {\n  "file": "aa.mp3",\n  "duration": 1.0\n },\n' +
  ' "bb": {\n  "file": "bb.mp3",\n  "duration": 2.0\n },\n' +
  ' "cc": {\n  "file": "cc.mp3",\n  "duration": 3.0\n }\n' +
  '}\n'
const LOCK = '{\n "aa": {"fp":"1"},\n "bb": {"fp":"2"},\n "cc": {"fp":"3"}\n}\n'

describe('retireOrphans', () => {
  it('changes nothing when every clip has its line', () => {
    const result = retireOrphans(['aa', 'bb', 'cc'], MANIFEST, LOCK)
    expect(result).toEqual({ manifest: MANIFEST, lock: LOCK, retired: [] })
  })

  it('drops a middle clip from the manifest and the lock, leaving the rest byte for byte', () => {
    const result = retireOrphans(['aa', 'cc'], MANIFEST, LOCK)
    expect(result.manifest).toBe(
      MANIFEST.replace(
        ' "bb": {\n  "file": "bb.mp3",\n  "duration": 2.0\n },\n',
        '',
      ),
    )
    expect(result.lock).toBe(LOCK.replace(' "bb": {"fp":"2"},\n', ''))
    expect(result.retired).toEqual([{ key: 'bb', file: 'bb.mp3' }])
  })

  it('moves the closing comma off the last entry when it goes', () => {
    const result = retireOrphans(['aa', 'bb'], MANIFEST, LOCK)
    expect(JSON.parse(result.manifest)).toHaveProperty('bb')
    expect(Object.keys(JSON.parse(result.manifest))).toEqual(['aa', 'bb'])
    expect(Object.keys(JSON.parse(result.lock))).toEqual(['aa', 'bb'])
    expect(result.manifest).toContain('"duration": 2.0\n }\n}')
  })

  it('leaves a lock entry that has no clip alone', () => {
    const result = retireOrphans(
      ['aa', 'bb', 'cc'],
      MANIFEST,
      LOCK.replace('"cc"', '"dd"'),
    )
    expect(result).toEqual({
      manifest: MANIFEST,
      lock: LOCK.replace('"cc"', '"dd"'),
      retired: [],
    })
  })

  it('leaves empty objects when every clip goes', () => {
    const result = retireOrphans([], MANIFEST, LOCK)
    expect(JSON.parse(result.manifest)).toEqual({})
    expect(JSON.parse(result.lock)).toEqual({})
  })
})
