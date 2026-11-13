/**
 * What is in a room's picture is named (rq-ezpg.10): a name follows the mouse
 * on a laptop, one button shows a mark and a name for every placed thing, S and
 * Escape do the same, and on a small sideways phone every name stays inside
 * the picture.
 */
import { test, expect, type Page } from './fixtures'

/** A placed area, in fractions of the picture. */
interface AreaFractions {
  x: number
  y: number
  width: number
  height: number
}

/** A one-pixel transparent PNG, standing for a picture the studio made. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

/** Where the things of the cottage are placed on its picture, by default. */
const COTTAGE_AREAS: Record<string, AreaFractions> = {
  hearth: { x: 0.1, y: 0.4, width: 0.15, height: 0.3 },
  bread: { x: 0.5, y: 0.6, width: 0.1, height: 0.1 },
  grandmother: { x: 0.8, y: 0.3, width: 0.1, height: 0.3 },
}

/** Open the game in the cottage with its picture up and a few things placed on it. */
async function toTheCottage(
  page: Page,
  areas: Record<string, AreaFractions> = COTTAGE_AREAS,
): Promise<void> {
  await page.route('**/images/generated/manifest.json', (route) =>
    route.fulfill({
      json: {
        'act1-eliors-cottage': {
          file: 'act1-eliors-cottage.png',
          width: 1920,
          height: 1080,
          areas,
        },
      },
    }),
  )
  await page.route('**/images/generated/*.png', (route) =>
    route.fulfill({ contentType: 'image/png', body: PIXEL }),
  )
  await page.goto('/')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await page.locator('.lq-chapter-button').click()
  // The dream is told a few lines at a time on a small screen.
  const arrival = page.getByTestId('arrival-on-picture')
  for (let turn = 0; turn < 8 && (await arrival.isVisible()); turn++)
    await page.keyboard.press('Enter')
  // The voice wakes Elior in his cottage.
  await page
    .getByRole('region', { name: /^Action/ })
    .getByRole('button', { name: /^(Type|Type a command)$/ })
    .click()
  const input = page.getByLabel('Command', { exact: true })
  await input.fill('say hello to voice')
  await input.press('Enter')
  await page.keyboard.press('Escape')
  await expect(page.locator('.lq-stage-picture.lq-scene-idle')).toHaveCount(1)
  await expect(page.locator('.lq-room-name')).toHaveText("Elior's Cottage")
}

test('the button, S and Escape show and take away the marks and names on a laptop', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page)
  const button = page.getByRole('button', { name: /Show what's here/ })
  await expect(button).toBeVisible()
  await expect(page.locator('[data-area-mark]')).toHaveCount(0)
  await button.click()
  await expect(page.getByRole('button', { name: '◎ Showing' })).toBeFocused()
  await expect(page.locator('[data-area-mark]')).toHaveCount(3)
  await expect(page.locator('[data-area-name="bread"]')).toHaveText('Bread')
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-area-mark]')).toHaveCount(0)
  await page.keyboard.press('s')
  await expect(page.locator('[data-area-mark]')).toHaveCount(3)
  await page.keyboard.press('s')
  await expect(page.locator('[data-area-mark]')).toHaveCount(0)
})

test('the name follows the mouse over a thing, and no name shows over nothing', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page)
  const stage = await page.locator('.lq-stage').boundingBox()
  // The bread sits at 55% across and 65% down of the 16:9 picture trimmed to the stage.
  const scale = Math.max(stage!.width / 1920, stage!.height / 1080)
  const x = stage!.x + stage!.width / 2 + (0.55 - 0.5) * 1920 * scale
  const y = stage!.y + stage!.height / 2 + (0.65 - 0.5) * 1080 * scale
  await page.mouse.move(x, y)
  await expect(page.locator('[data-area-pointer]')).toHaveText('Bread')
  await page.mouse.move(stage!.x + 5, stage!.y + stage!.height / 2 + 100)
  await expect(page.locator('[data-area-pointer]')).toHaveCount(0)
})

test.describe('at the edges of a laptop picture (rq-5hs1)', () => {
  /**
   * On a 1428×650 laptop the 16:9 picture is trimmed to the stage under the
   * header and the action bar lies over the stage's foot: the bread runs under
   * the bar, the grandmother's middle is behind it and her name has to move
   * away from the bread's, and the hearth hugs the left edge.
   */
  const AT_THE_EDGES: Record<string, AreaFractions> = {
    hearth: { x: 0, y: 0.4, width: 0.03, height: 0.2 },
    bread: { x: 0.1, y: 0.72, width: 0.1, height: 0.1 },
    grandmother: { x: 0.13, y: 0.7, width: 0.06, height: 0.2 },
  }
  /** What the browser may round a position by. */
  const ROUNDING = 0.5

  /** Hold the drift at its peak, where the picture is largest and furthest over. */
  async function holdDriftAtPeak(page: Page): Promise<void> {
    await page.addStyleTag({
      content:
        // !important: the picture's own scoped animation shorthand outranks this.
        '.lq-drift-on { animation-delay: -26s !important; animation-play-state: paused !important; }',
    })
  }

  test('the name of what the pointer is over, just above the bar, goes above the pointer', async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width: 1428, height: 650 })
    await toTheCottage(page, AT_THE_EDGES)
    const bar = await page.locator('.lq-composer').boundingBox()
    const stage = await page.locator('.lq-stage').boundingBox()
    await page.mouse.move(stage!.x + 0.115 * stage!.width, bar!.y - 15)
    const name = page.locator('[data-area-pointer]')
    await expect(name).toHaveText('Bread')
    const box = await name.boundingBox()
    expect(box!.y + box!.height).toBeLessThanOrEqual(bar!.y)
  })

  test('every mark and name stays on the visible picture with the drift at its peak', async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width: 1428, height: 650 })
    await toTheCottage(page, AT_THE_EDGES)
    // The belt covers the very foot of the picture while it is up (belt.spec.ts); put away, the action row is the floor.
    await page.getByRole('button', { name: 'Put the belt away' }).click()
    await holdDriftAtPeak(page)
    await page.getByRole('button', { name: /Show what's here/ }).click()
    const marks = page.locator('[data-area-mark]')
    await expect(marks).toHaveCount(3)
    const bar = await page.locator('.lq-composer').boundingBox()
    const stage = await page.locator('.lq-stage').boundingBox()
    const spots = [
      ...(await marks.all()),
      ...(await page.locator('[data-area-name]').all()),
    ]
    expect(spots).toHaveLength(6)
    for (const spot of spots) {
      const box = await spot.boundingBox()
      expect.soft(box!.x).toBeGreaterThanOrEqual(stage!.x - ROUNDING)
      expect
        .soft(box!.x + box!.width)
        .toBeLessThanOrEqual(stage!.x + stage!.width + ROUNDING)
      expect.soft(box!.y).toBeGreaterThanOrEqual(stage!.y - ROUNDING)
      expect.soft(box!.y + box!.height).toBeLessThanOrEqual(bar!.y + ROUNDING)
    }
    const lines = page.locator('.lq-area-lines line')
    await expect(lines).not.toHaveCount(0)
    for (const line of await lines.all()) {
      const bottom = await line.evaluate(
        (el) => el.getBoundingClientRect().bottom,
      )
      expect.soft(bottom).toBeLessThanOrEqual(bar!.y + ROUNDING)
    }
  })
})

test.describe('on the smallest sideways phone', () => {
  test.use({ hasTouch: true, isMobile: true })

  test('every name stays inside the picture', async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width: 568, height: 320 })
    await toTheCottage(page)
    const button = page.getByRole('button', { name: /Show what's here/ })
    await expect(button).toBeVisible()
    await button.click()
    await expect(page.locator('[data-area-name]')).toHaveCount(3)
    const stage = await page.locator('.lq-stage').boundingBox()
    for (const name of await page.locator('[data-area-name]').all()) {
      const box = await name.boundingBox()
      expect(box!.x).toBeGreaterThanOrEqual(stage!.x - 1)
      expect(box!.x + box!.width).toBeLessThanOrEqual(
        stage!.x + stage!.width + 1,
      )
      expect(box!.y).toBeGreaterThanOrEqual(stage!.y - 1)
      expect(box!.y + box!.height).toBeLessThanOrEqual(
        stage!.y + stage!.height + 1,
      )
    }
  })
})

test('the marks and names come back with the picture after a layout without one (rq-fy44)', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1000, height: 700 })
  await toTheCottage(page)
  await page.getByRole('button', { name: /Show what's here/ }).click()
  await expect(page.locator('[data-area-mark]')).toHaveCount(3)
  // A short window has no picture: the text page.
  await page.setViewportSize({ width: 568, height: 320 })
  await expect(page.locator('.lq-stage')).toHaveCount(0)
  await page.setViewportSize({ width: 1000, height: 700 })
  await expect(page.getByRole('button', { name: '◎ Showing' })).toBeVisible()
  await expect(page.locator('[data-area-mark]')).toHaveCount(3)
  await expect(page.locator('[data-area-name]')).toHaveCount(3)
})

test.describe('a dot under the faded edge of a card (rq-riv9)', () => {
  /** Where the studio placed the cottage's things when the bug was found. */
  const PLACED: Record<string, AreaFractions> = {
    hearth: { x: 0.211458, y: 0.388889, width: 0.145833, height: 0.376852 },
    lantern: { x: 0.825, y: 0.47037, width: 0.046875, height: 0.107407 },
    bread: { x: 0.452083, y: 0.585185, width: 0.099479, height: 0.112037 },
    'scenery-eliors-cottage-table': {
      x: 0.295833,
      y: 0.594444,
      width: 0.38125,
      height: 0.27963,
    },
    'scenery-eliors-cottage-shelves': {
      x: 0.385417,
      y: 0.101852,
      width: 0.140104,
      height: 0.449074,
    },
    'scenery-eliors-cottage-books': {
      x: 0.414583,
      y: 0.165741,
      width: 0.092708,
      height: 0.115741,
    },
    grandmother: {
      x: 0.623958,
      y: 0.180556,
      width: 0.177083,
      height: 0.698148,
    },
    'exit-east': {
      x: 0.915104,
      y: 0.184259,
      width: 0.082292,
      height: 0.609259,
    },
  }
  /** What each placed thing is called on the picture. */
  const LABELS: Record<string, string> = {
    hearth: 'Hearth',
    lantern: 'Lantern',
    bread: 'Bread',
    'scenery-eliors-cottage-table': 'Table',
    'scenery-eliors-cottage-shelves': 'Shelves',
    'scenery-eliors-cottage-books': 'Books',
    grandmother: 'Grandmother',
  }

  /** Type one command into the action bar. */
  async function command(page: Page, text: string): Promise<void> {
    const type = page
      .getByRole('region', { name: /^Action/ })
      .getByRole('button', { name: /^(Type|Type a command)$/ })
    if (await type.isVisible()) await type.click()
    const input = page.getByLabel('Command', { exact: true })
    await input.fill(text)
    await input.press('Enter')
  }

  /**
   * Talk to Grandmother twice with the dots showing, and lay a clear card edge of the test's own over a dot whose
   * name is left off: it shows the dot but takes the pointer. Returns that dot.
   */
  async function dotUnderCardEdge(
    page: Page,
  ): Promise<{ id: string; x: number; y: number }> {
    await page.setViewportSize({ width: 1000, height: 700 })
    await toTheCottage(page, PLACED)
    await command(page, 'talk to grandmother')
    await command(page, 'talk to grandmother')
    await page.getByRole('button', { name: /Show what's here/ }).click()
    await page.getByRole('button', { name: /Show$/ }).click()
    await expect(page.locator('.lq-story-wrap .lq-cl')).not.toHaveCount(0)
    // Scroll the words up a few pixels at a time to the first spot where a thing's dot shows with its name left off.
    const dot = await page
      .locator('.lq-story-wrap .lq-story')
      .evaluate(async (story) => {
        for (
          let top = story.scrollHeight - story.clientHeight;
          top >= 0;
          top -= 3
        ) {
          story.scrollTop = top
          for (let i = 0; i < 3; i++)
            await new Promise((done) => requestAnimationFrame(done))
          for (const mark of document.querySelectorAll<HTMLElement>(
            '[data-area-mark]:not([data-way])',
          )) {
            const id = mark.dataset.areaMark!
            if (document.querySelector(`[data-area-name="${id}"]`)) continue
            const box = mark.getBoundingClientRect()
            return {
              id,
              x: Math.round(box.x + box.width / 2),
              y: Math.round(box.y + box.height / 2),
            }
          }
        }
        return null
      })
    expect(dot).not.toBeNull()
    // Where such a dot lies under a card's faded top edge depends on the story's text, the fonts and the cards'
    // padding, so the test lays a clear card of its own over the dot in the words, as that edge does: it shows the
    // dot but takes the pointer.
    await page.locator('.lq-story-wrap').evaluate((wrap, { x, y }) => {
      const at = wrap.getBoundingClientRect()
      const edge = document.createElement('div')
      edge.dataset.fadedEdge = ''
      edge.style.cssText =
        `position: absolute; left: ${x - 40 - at.left}px; top: ${y - 20 - at.top}px; ` +
        'width: 80px; height: 40px; pointer-events: auto;'
      wrap.append(edge)
    }, dot!)
    return dot as { id: string; x: number; y: number }
  }

  test('resting on a dot that a card takes the pointer from names it', async ({
    page,
  }): Promise<void> => {
    const dot = await dotUnderCardEdge(page)
    await page.mouse.move(5, 300)
    await page.mouse.move(dot.x, dot.y, { steps: 5 })
    expect(
      await page.evaluate(
        ({ x, y }) =>
          document.elementFromPoint(x, y)?.matches('[data-faded-edge]'),
        dot,
      ),
    ).toBe(true)
    await expect(page.locator('[data-area-pointer]')).toHaveText(LABELS[dot.id])
  })

  test('pressing a dot that shows through a card’s edge presses its thing, not the card (rq-njoa)', async ({
    page,
  }): Promise<void> => {
    const dot = await dotUnderCardEdge(page)
    await page.mouse.move(5, 300)
    await page.mouse.move(dot.x, dot.y, { steps: 5 })
    expect(
      await page
        .locator('.lq-story-wrap')
        .evaluate((wrap) => getComputedStyle(wrap).cursor),
    ).toBe('pointer')
    await page.mouse.click(dot.x, dot.y)
    await expect(page.locator('.lq-press-ring')).toBeVisible()
  })
})
