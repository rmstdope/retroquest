/**
 * Vite plugin that serves Python source files from the project's
 * src/ directory at the /python-src/ URL path, and optionally
 * serves a static icons directory at the /icons/ URL path.
 */
import { type Plugin } from 'vite'
import type { ServerResponse } from 'node:http'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, relative, extname } from 'node:path'

interface PythonSourcePluginOptions {
  /** Absolute path to the project src/ directory. */
  srcDir: string
  /** Optional absolute path to a directory served at /icons/. */
  iconsDir?: string
}

/**
 * Recursively collect all .py files under a directory,
 * returning sorted paths relative to the base directory.
 */
export function collectPythonFiles(dir: string, base: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    const fullPath = resolve(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...collectPythonFiles(fullPath, base))
    } else if (entry.endsWith('.py')) {
      files.push(relative(base, fullPath))
    }
  }
  return files.sort()
}

/** Remove query string and fragment from a URL. */
function stripQueryAndFragment(url: string): string {
  return url.split('?')[0].split('#')[0]
}

/** Map a file path extension to an HTTP Content-Type value. */
export function getMimeType(filePath: string): string {
  if (filePath.endsWith('.py')) return 'text/plain'
  if (filePath.endsWith('.mp3')) return 'audio/mpeg'
  if (filePath.endsWith('.ogg')) return 'audio/ogg'
  if (filePath.endsWith('.wav')) return 'audio/wav'
  return 'application/octet-stream'
}

const AUDIO_EXTENSIONS = new Set(['.mp3', '.ogg', '.wav'])

/**
 * Recursively collect all audio files under a directory,
 * returning sorted paths relative to the base directory.
 */
export function collectAudioFiles(dir: string, base: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    const fullPath = resolve(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...collectAudioFiles(fullPath, base))
    } else if (AUDIO_EXTENSIONS.has(extname(entry))) {
      files.push(relative(base, fullPath))
    }
  }
  return files.sort()
}

/**
 * Recursively collect all files under a directory,
 * returning sorted paths relative to the base directory.
 */
export function collectStaticFiles(dir: string, base: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    const fullPath = resolve(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...collectStaticFiles(fullPath, base))
    } else {
      files.push(relative(base, fullPath))
    }
  }
  return files.sort()
}

/** Respond with the JSON manifest of all Python source files. */
function serveManifest(srcDir: string, res: ServerResponse): void {
  const manifest = collectPythonFiles(srcDir, srcDir)
  const body = JSON.stringify(manifest)
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Length', Buffer.byteLength(body))
  res.end(body)
}

/** URL prefix used to serve Python source files. */
const PYTHON_SRC_PREFIX = '/python-src/'
/** URL prefix used to serve static icons. */
const ICONS_PREFIX = '/icons/'

/** Respond with a single file from the source directory. */
function serveSourceFile(
  srcDir: string,
  urlPath: string,
  res: ServerResponse,
): void {
  const relativePath = decodeURIComponent(
    urlPath.slice(PYTHON_SRC_PREFIX.length),
  )
  const filePath = resolve(srcDir, relativePath)

  if (!filePath.startsWith(resolve(srcDir))) {
    res.statusCode = 403
    res.end('Forbidden')
    return
  }

  try {
    const content = readFileSync(filePath)
    const contentType = getMimeType(filePath)
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', content.length)
    res.end(content)
  } catch {
    res.statusCode = 404
    res.end('Not found')
  }
}

/** Respond with a single file from a static directory. */
function serveStaticFile(
  dir: string,
  urlPath: string,
  urlPrefix: string,
  res: ServerResponse,
): void {
  const relativePath = decodeURIComponent(urlPath.slice(urlPrefix.length))
  const filePath = resolve(dir, relativePath)

  if (!filePath.startsWith(resolve(dir))) {
    res.statusCode = 403
    res.end('Forbidden')
    return
  }

  try {
    const content = readFileSync(filePath)
    res.setHeader('Content-Type', getMimeType(filePath))
    res.setHeader('Content-Length', content.length)
    res.end(content)
  } catch {
    res.statusCode = 404
    res.end('Not found')
  }
}

/**
 * Vite plugin that mounts the Python source tree at /python-src/
 * and provides a /python-src/manifest.json endpoint listing all
 * .py files.
 */
export function pythonSourcePlugin(options: PythonSourcePluginOptions): Plugin {
  const { srcDir, iconsDir } = options

  let isBuild = false

  return {
    name: 'retroquest-python-source',
    configResolved(config) {
      isBuild = config.command === 'build'
    },
    buildStart() {
      if (!isBuild) return

      const pythonFiles = collectPythonFiles(srcDir, srcDir)
      for (const filePath of pythonFiles) {
        const content = readFileSync(resolve(srcDir, filePath))
        this.emitFile({
          type: 'asset',
          fileName: `python-src/${filePath}`,
          source: content,
        })
      }

      const manifest = JSON.stringify(pythonFiles)
      this.emitFile({
        type: 'asset',
        fileName: 'python-src/manifest.json',
        source: manifest,
      })

      const audioFiles = collectAudioFiles(srcDir, srcDir)
      for (const filePath of audioFiles) {
        const content = readFileSync(resolve(srcDir, filePath))
        this.emitFile({
          type: 'asset',
          fileName: `python-src/${filePath}`,
          source: content,
        })
      }
      if (iconsDir) {
        const iconFiles = collectStaticFiles(iconsDir, iconsDir)
        for (const filePath of iconFiles) {
          const content = readFileSync(resolve(iconsDir, filePath))
          this.emitFile({
            type: 'asset',
            fileName: `icons/${filePath}`,
            source: content,
          })
        }
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlPath = stripQueryAndFragment(req.url ?? '')

        if (urlPath === '/python-src/manifest.json') {
          serveManifest(srcDir, res)
          return
        }

        if (urlPath.startsWith(PYTHON_SRC_PREFIX)) {
          serveSourceFile(srcDir, urlPath, res)
          return
        }

        if (iconsDir && urlPath.startsWith(ICONS_PREFIX)) {
          serveStaticFile(iconsDir, urlPath, ICONS_PREFIX, res)
          return
        }

        next()
      })
    },
  }
}
