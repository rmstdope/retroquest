/**
 * Vite plugin that serves Python source files from the project's
 * src/ directory at the /src/ URL path, replacing serve.py.
 */
import { type Plugin } from 'vite'
import type { ServerResponse } from 'node:http'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, relative } from 'node:path'

interface PythonSourcePluginOptions {
  /** Absolute path to the project src/ directory. */
  srcDir: string
}

/**
 * Recursively collect all .py files under a directory,
 * returning sorted paths relative to the base directory.
 */
export function collectPythonFiles(
  dir: string,
  base: string
): string[] {
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

/** Respond with the JSON manifest of all Python source files. */
function serveManifest(
  srcDir: string,
  res: ServerResponse
): void {
  const manifest = collectPythonFiles(srcDir, srcDir)
  const body = JSON.stringify(manifest)
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Length', Buffer.byteLength(body))
  res.end(body)
}

/** Respond with a single file from the source directory. */
function serveSourceFile(
  srcDir: string,
  urlPath: string,
  res: ServerResponse
): void {
  const relativePath = decodeURIComponent(
    urlPath.slice('/src/'.length)
  )
  const filePath = resolve(srcDir, relativePath)

  if (!filePath.startsWith(resolve(srcDir))) {
    res.statusCode = 403
    res.end('Forbidden')
    return
  }

  try {
    const content = readFileSync(filePath)
    const contentType = filePath.endsWith('.py')
      ? 'text/plain'
      : 'application/octet-stream'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', content.length)
    res.end(content)
  } catch {
    res.statusCode = 404
    res.end('Not found')
  }
}

/**
 * Vite plugin that mounts the Python source tree at /src/ and
 * provides a /src/manifest.json endpoint listing all .py files.
 */
export function pythonSourcePlugin(
  options: PythonSourcePluginOptions
): Plugin {
  const { srcDir } = options

  return {
    name: 'retroquest-python-source',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlPath = stripQueryAndFragment(req.url ?? '')

        if (urlPath === '/src/manifest.json') {
          serveManifest(srcDir, res)
          return
        }

        if (urlPath.startsWith('/src/')) {
          serveSourceFile(srcDir, urlPath, res)
          return
        }

        next()
      })
    },
  }
}
