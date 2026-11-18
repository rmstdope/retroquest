/**
 * Vite plugin that writes a small copy of every generated picture into the
 * production build. The room pictures are up to about 5MB each, and the
 * snapshots of Save, Load and the Continue card show them at 112px wide, so
 * `SaveThumb` asks for the small copy first (`pictureThumbUrl` in
 * `src/lantern/roomPicture.ts` is the other half of the naming). The copies
 * are the navigator's pictures scaled down, never drawn or chosen here; the
 * full pictures are untouched. The dev server makes none, and the snapshots
 * then use the full pictures.
 */
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import type { Plugin } from 'vite'

/** The width of a small copy: enough for a 112px snapshot at 2x. */
const THUMB_WIDTH = 224

/** Where the small copy of picture file `name` (`x.png`) is served from, relative to the site root. */
export function thumbFileName(name: string): string {
  return `images/generated/thumbs/${name.replace(/\.png$/, '.webp')}`
}

/** A build plugin emitting the small copy of each `.png` in `dir` (webp, transparency kept, never enlarged). */
export function thumbnailsPlugin(dir: string): Plugin {
  return {
    name: 'retroquest-thumbnails',
    apply: 'build',
    async generateBundle() {
      const names = readdirSync(dir)
        .filter((name) => name.endsWith('.png'))
        .sort()
      for (const name of names) {
        const source = await sharp(join(dir, name))
          .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer()
        this.emitFile({ type: 'asset', fileName: thumbFileName(name), source })
      }
    },
  }
}
