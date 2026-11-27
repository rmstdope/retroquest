import { test, expect, enterCommand, toTheCottage } from './fixtures'

/**
 * The picture keeps up with the story (rq-ezpg.3): once Elior takes the bread
 * in the cottage, the patch the studio made for it is laid over the room's
 * picture. The studio's files are stood in for by a manifest that lists the
 * patch and one-pixel pictures.
 */
test('the bread taken in the cottage is laid over its picture as a patch', async ({
  page,
}): Promise<void> => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await toTheCottage(page, {
    patches: {
      'bread-taken': {
        file: 'act1-eliors-cottage.bread-taken.png',
        width: 1,
        height: 1,
      },
    },
  })
  await expect(page.locator('img.lq-patch')).toHaveCount(0)

  await enterCommand(page, 'take bread')
  await expect(page.locator('img.lq-patch')).toHaveCount(1)
  await expect(page.locator('img.lq-patch')).toHaveAttribute(
    'src',
    /act1-eliors-cottage\.bread-taken\.png$/,
  )
})
