/**
 * Saves an object graph as plain JSON and restores it, keeping shared
 * references and cycles. Every object and array gets an entry in the graph's
 * table; fields hold primitives or references into that table. Class
 * instances are named through a ClassRegistry and restored with their
 * prototype, so their fields and methods work again without running
 * constructors (ES `#private` fields would not survive this; use TS
 * `private`). Functions and undefined fields are dropped, and so are
 * Date/Map/Set values, which fail loudly as unregistered classes. Plain
 * objects with a null prototype come back as ordinary objects.
 */
import type { ClassRegistry } from './ClassRegistry'

/** A reference to an entry in the table. */
interface Ref {
  $ref: number
}

type Encoded = null | boolean | number | string | Ref

type Entry =
  /** A plain object (`c: null`) or a class instance named in the registry. */
  | { c: string | null; f: Record<string, Encoded> }
  /** An array. */
  | { a: Encoded[] }

export interface SerializedGraph {
  /** Format version of the graph itself. */
  v: 1
  objects: Entry[]
  /** The root: a reference into `objects`, or the root itself when primitive. */
  root: Encoded
}

export function serialize(
  root: unknown,
  registry: ClassRegistry,
): SerializedGraph {
  const objects: Entry[] = []
  const indices = new Map<object, number>()

  const encode = (value: unknown): Encoded => {
    if (value === null || value === undefined) return null
    if (typeof value === 'number') return Number.isFinite(value) ? value : null
    if (typeof value !== 'object') return value as Encoded
    let index = indices.get(value)
    if (index === undefined) {
      index = objects.length
      indices.set(value, index)
      if (Array.isArray(value)) {
        const entry: Entry = { a: [] }
        objects.push(entry)
        entry.a = value.map(encode)
      } else {
        const entry: Entry = { c: classNameOf(value, registry), f: {} }
        objects.push(entry)
        for (const [key, field] of Object.entries(value)) {
          if (field !== undefined && typeof field !== 'function')
            entry.f[key] = encode(field)
        }
      }
    }
    return { $ref: index }
  }

  return { v: 1, objects, root: encode(root) }
}

export function deserialize(
  graph: SerializedGraph,
  registry: ClassRegistry,
): unknown {
  const instances: unknown[] = graph.objects.map((entry) => {
    if ('a' in entry) return []
    if (entry.c === null) return {}
    const cls = registry.classOf(entry.c)
    if (!cls) throw new Error(`The save contains an unknown class: ${entry.c}`)
    return Object.create(cls.prototype as object)
  })

  const decode = (value: Encoded): unknown => {
    if (value === null || typeof value !== 'object') return value
    if (!(value.$ref in instances)) {
      throw new Error(`The save refers to a missing object: ${value.$ref}`)
    }
    return instances[value.$ref]
  }

  graph.objects.forEach((entry, index) => {
    if ('a' in entry) {
      ;(instances[index] as unknown[]).push(...entry.a.map(decode))
      return
    }
    const target = instances[index] as object
    for (const [key, field] of Object.entries(entry.f)) {
      // defineProperty keeps a "__proto__" key from rewiring the prototype.
      Object.defineProperty(target, key, {
        value: decode(field),
        writable: true,
        enumerable: true,
        configurable: true,
      })
    }
  })
  return decode(graph.root)
}

function classNameOf(value: object, registry: ClassRegistry): string | null {
  const proto: unknown = Object.getPrototypeOf(value)
  if (proto === Object.prototype || proto === null) return null
  const name = registry.nameOf(value)
  if (name === undefined) {
    const fields = Object.keys(value).join(', ')
    throw new Error(
      `Cannot save an object of the unregistered class ` +
        `${value.constructor.name} (fields: ${fields})`,
    )
  }
  return name
}
