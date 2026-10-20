/** A class whose instances the serializer may save. */
export type SerializableClass = abstract new (...args: never[]) => object

/**
 * Names the classes a save may contain. Saves refer to classes by these
 * names, never by `constructor.name`, which minified builds change.
 */
export class ClassRegistry {
  private readonly byName = new Map<string, SerializableClass>()
  private readonly byClass = new Map<SerializableClass, string>()

  register(name: string, cls: SerializableClass): this {
    if (this.byName.has(name))
      throw new Error(`Class name registered twice: ${name}`)
    const existing = this.byClass.get(cls)
    if (existing !== undefined)
      throw new Error(`Class already registered as ${existing}: ${name}`)
    this.byName.set(name, cls)
    this.byClass.set(cls, name)
    return this
  }

  /** Register every entry, named by its key: `registerAll({ Lantern, Bread })`. */
  registerAll(classes: Record<string, SerializableClass>): this {
    for (const [name, cls] of Object.entries(classes)) this.register(name, cls)
    return this
  }

  classOf(name: string): SerializableClass | undefined {
    return this.byName.get(name)
  }

  /** The registered name of the object's exact class (not a parent class). */
  nameOf(instance: object): string | undefined {
    return this.byClass.get(instance.constructor as SerializableClass)
  }

  names(): string[] {
    return [...this.byName.keys()]
  }
}
