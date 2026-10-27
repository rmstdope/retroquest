/**
 * The narration hint ("Space to hurry · Esc to skip", "Tap to hurry ·
 * double-tap to skip") floats over the bottom of the story. While a paragraph
 * at the bottom of the story is read aloud, none of its words may sit under
 * it, on desktop or on a phone, and making room for it must not make the story
 * jump when the reading lets it go (rq-7juz).
 */
import { test, expect, type Page } from '@playwright/test'

// Narration on, as for a new player (the config turns it off for the other specs).
test.use({ storageState: { cookies: [], origins: [] } })

/** Narrated clips end shortly after they start (CI has no audio device). */
async function quickNarrationClips(page: Page): Promise<void> {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      if (this.src.includes('/audio/narration/'))
        setTimeout(() => this.dispatchEvent(new Event('ended')), 1200)
      return Promise.resolve()
    }
  })
}

/** What one reading showed, frame by frame. */
interface Reading {
  /** Words of a paragraph being read that showed under the hint. */
  covered: string[]
  /** Whether a paragraph of the newest turn was seen being read at all. */
  seen: boolean
  /** Whether the hint was up on some frame of the reading. */
  hintSeen: boolean
  /** How far the last paragraph read moved down once the reading let go, in px. */
  drop: number
}

/**
 * Watch the reading of the newest turn frame by frame until it ends, collect
 * every word of a paragraph being read that showed under the hint (only the
 * part of a line inside the story counts: the rest is clipped), then see
 * whether the last paragraph read moves down as the story is let go.
 */
async function watchReading(page: Page): Promise<Reading> {
  return page.evaluate(
    () =>
      new Promise<Reading>((resolve) => {
        const covered = new Set<string>()
        const started = performance.now()
        let seen = false
        let hintSeen = false
        let last: Element | null = null
        let lastTop = 0
        const overlaps = (
          a: DOMRect,
          b: { left: number; right: number; top: number; bottom: number },
        ): boolean =>
          a.left < b.right &&
          a.right > b.left &&
          a.top < b.bottom &&
          a.bottom > b.top
        const settle = (frames: number): void => {
          if (frames > 0) {
            requestAnimationFrame(() => settle(frames - 1))
            return
          }
          const top = last?.getBoundingClientRect().top ?? lastTop
          resolve({
            covered: [...covered],
            seen,
            hintSeen,
            drop: Math.max(0, top - lastTop),
          })
        }
        const check = (): void => {
          const story = document.querySelector('.lq-story')
          const hint = document.querySelector('.lq-narration-hint')
          const turns = document.querySelectorAll('[data-testid="turn"]')
          const speaking =
            turns[turns.length - 1]?.querySelector('.lq-speaking')
          if (speaking) {
            seen = true
            last = speaking
            lastTop = speaking.getBoundingClientRect().top
          }
          if (hint) hintSeen = true
          if (story && hint && speaking) {
            const pane = story.getBoundingClientRect()
            const pill = hint.getBoundingClientRect()
            const area = {
              left: Math.max(pane.left, pill.left),
              right: Math.min(pane.right, pill.right),
              top: Math.max(pane.top, pill.top),
              bottom: Math.min(pane.bottom, pill.bottom),
            }
            const walker = document.createTreeWalker(
              speaking,
              NodeFilter.SHOW_TEXT,
            )
            for (let n = walker.nextNode(); n; n = walker.nextNode()) {
              const text = n.textContent ?? ''
              for (const match of text.matchAll(/\S+/g)) {
                const range = document.createRange()
                range.setStart(n, match.index)
                range.setEnd(n, match.index + match[0].length)
                for (const r of Array.from(range.getClientRects()))
                  if (overlaps(r, area)) covered.add(match[0])
              }
            }
          }
          if ((seen && !speaking) || performance.now() - started > 20_000)
            settle(20)
          else requestAnimationFrame(check)
        }
        requestAnimationFrame(check)
      }),
  )
}

/** The reading was measured, nothing read sat under the hint, and the story did not drop when let go. */
function expectClear(reading: Reading, what: string): void {
  expect(reading.seen, `${what}: a paragraph was read`).toBe(true)
  expect(reading.hintSeen, `${what}: the hint showed`).toBe(true)
  expect(reading.covered, `${what}: words under the hint`).toEqual([])
  expect(reading.drop, `${what}: drop when let go`).toBeLessThan(1)
}

for (const { name, width, height } of [
  { name: 'desktop', width: 1512, height: 862 },
  { name: 'phone', width: 390, height: 720 },
]) {
  test(`no word being read sits under the narration hint, and the story stays put after, on ${name}`, async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width, height })
    await quickNarrationClips(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await page.locator('.lq-chapter-button').click()
    // The dream is read first; the voice wakes the hero in the cottage,
    // whose arrival is read; then the lantern. Each is checked to its end.
    expectClear(await watchReading(page), 'the dream')
    await page
      .getByRole('button', { name: /^Type( a command)?$/ })
      .first()
      .click()
    const input = page.getByLabel('Command')
    for (const command of ['talk to voice', 'examine lantern']) {
      await input.fill(command)
      await input.press('Enter')
      await expect(page.locator('.lq-narration-hint')).toBeVisible()
      expectClear(await watchReading(page), command)
    }
  })
}
