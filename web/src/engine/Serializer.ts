/**
 * Saves an object graph as plain JSON and restores it, keeping shared
 * references and cycles. Every object (plain or class instance) gets an entry
 * in the graph's object table; fields hold primitives, arrays or references
 * into that table. Class instances are named through a ClassRegistry and
 * restored with their prototype, so their fields and methods work again
 * without running constructors. Functions and undefined fields are dropped.
 */
import type { ClassRegistry } from './ClassRegistry'

/** A reference to an entry in the object table. */
interface Ref {
  $ref: number
}

type Encoded = null | boolean | number | string | Encoded[] | Ref

interface EncodedObject {
  /** The registered class name, or null for a plain object. */
  c: string | null
  f: Record<string, Encoded>
}

export interface SerializedGraph {
  objects: EncodedObject[]
  /** The root's index in `objects`, or the root itself when it is not an object. */
  root: Encoded
}

export function serialize(
  root: unknown,
  registry: ClassRegistry,
): SerializedGraph {
  const objects: EncodedObject[] = []
  const indices = new Map<object, number>()

  const encode = (value: unknown): Encoded => {
    if (value === null || typeof value !== 'object') return value as Encoded
    if (Array.isArray(value)) return value.map(encode)
    let index = indices.get(value)
    if (index === undefined) {
      index = objects.length
      indices.set(value, index)
      const entry: EncodedObject = { c: classNameOf(value, registry), f: {} }
      objects.push(entry)
      for (const [key, field] of Object.entries(value)) {
        if (field !== undefined && typeof field !== 'function')
          entry.f[key] = encode(field)
      }
    }
    return { $ref: index }
  }

  return { objects, root: encode(root) }
}

export function deserialize(
  graph: SerializedGraph,
  registry: ClassRegistry,
): unknown {
  const instances = graph.objects.map((entry) => {
    if (entry.c === null) return {} as Record<string, unknown>
    const cls = registry.classOf(entry.c)
    if (!cls) throw new Error(`The save contains an unknown class: ${entry.c}`)
    return Object.create(cls.prototype) as Record<string, unknown>
  })

  const decode = (value: Encoded): unknown => {
    if (value === null || typeof value !== 'object') return value
    if (Array.isArray(value)) return value.map(decode)
    return instances[value.$ref]
  }

  graph.objects.forEach((entry, index) => {
    for (const [key, field] of Object.entries(entry.f))
      instances[index][key] = decode(field)
  })
  return decode(graph.root)
}

function classNameOf(value: object, registry: ClassRegistry): string | null {
  const proto: unknown = Object.getPrototypeOf(value)
  if (proto === Object.prototype || proto === null) return null
  const name = registry.nameOf(value)
  if (name === undefined) {
    throw new Error(
      `Cannot save an object of the unregistered class ${value.constructor.name}`,
    )
  }
  return name
}
