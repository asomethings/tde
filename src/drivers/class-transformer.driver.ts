import { PropertyDeclaration, ts, Type } from 'ts-morph'
import { AbstractDriver } from './abstract.driver'

export class ClassTransformerDriver extends AbstractDriver {
  readonly #moduleSpecifier = 'class-transformer'

  readonly #namedImports: Set<string> = new Set()

  public execute(): void {
    const classes = this.source.getClasses()
    for (const cls of classes) {
      const properties = cls.getProperties()
      for (const property of properties) {
        this.#addExposeDecorator(property)
        this.#addTypeDecorator(property)
      }
    }
    this.addImportDeclaration({
      moduleSpecifier: this.#moduleSpecifier,
      namedImports: Array.from(this.#namedImports).map((name) => ({
        name,
      })),
    })
  }

  /**
   * Adds an @Expose() decorator to property
   */
  #addExposeDecorator(property: PropertyDeclaration): void {
    const added = this.addDecorator(property, { name: 'Expose', arguments: [] })
    if (added) {
      this.#namedImports.add('Expose')
    }
  }

  /**
   * Adds an @Type(() => <T>) decorator to property
   */
  #addTypeDecorator(property: PropertyDeclaration): void {
    const type = this.#getType(property)
    if (!type) {
      return
    }
    const typeText = this.replaceEverydayTypes(
      type.getText(undefined, ts.TypeFormatFlags.None),
    )
    const added = this.addDecorator(property, {
      name: 'Type',
      arguments: [`() => ${typeText}`],
    })
    if (added) {
      this.#namedImports.add('Type')
    }
  }

  #getType(property: PropertyDeclaration): Type<ts.Type> | undefined {
    let type = property.getType()
    if (type.isArray()) {
      const arrayElementType = type.getArrayElementType()
      if (!arrayElementType) {
        return undefined
      }

      type = arrayElementType
    }

    const availableTypes = [
      type.isString(),
      type.isBoolean(),
      type.isNumber(),
      type.isClass(),
    ]
    return availableTypes.includes(true) ? type : undefined
  }
}
