import { PropertyDeclaration, ts } from 'ts-morph'
import { AbstractDriver } from './abstract.driver'

export class NestjsSwaggerDriver extends AbstractDriver {
  readonly #moduleSpecifier = '@nestjs/swagger'

  readonly #namedImports: Set<string> = new Set()

  public execute(): void {
    const classes = this.source.getClasses()
    for (const cls of classes) {
      const properties = cls.getProperties()
      for (const property of properties) {
        if (property.getType().isNullable()) {
          this.#addApiPropertyOptionalDecorator(property)
        } else {
          this.#addApiPropertyDecorator(property)
        }
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
   * Adds an validation decorator based on type to property
   */
  #addApiPropertyDecorator(property: PropertyDeclaration): void {
    const name = 'ApiProperty'
    const args = this.#getArguments(property)
    const added = this.addDecorator(property, { name, arguments: [args] })
    if (added) {
      this.#namedImports.add(name)
    }
  }

  /**
   * Adds an validation decorator based on type to property
   */
  #addApiPropertyOptionalDecorator(property: PropertyDeclaration): void {
    const name = 'ApiPropertyOptional'
    const args = this.#getArguments(property)
    const added = this.addDecorator(property, { name, arguments: [args] })
    if (added) {
      this.#namedImports.add(name)
    }
  }

  /**
   * Get validation decorators based on property's type
   */
  #getArguments(property: PropertyDeclaration): string {
    let type = property.getType()
    // Makes import(<path>). disappear from string
    let typeText = type.getText(undefined, ts.TypeFormatFlags.None)
    const args: string[] = []
    const isArray = type.isArray()
    if (isArray) {
      const arrayType = type.getArrayElementType()
      if (arrayType) {
        type = arrayType
        typeText = arrayType.getText(undefined, ts.TypeFormatFlags.None)
      }
      args.push('isArray: true')
    }

    const isEnum = type.isEnum() || type.isEnumLiteral()
    if (isEnum) {
      args.push(`enum: ${typeText}`)
    }
    return args.length > 0 ? `{ ${args.join(',')} }` : ''
  }
}
