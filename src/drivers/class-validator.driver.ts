import {
  DecoratorStructure,
  OptionalKind,
  PropertyDeclaration,
  ts,
} from 'ts-morph'
import { AbstractDriver } from './abstract.driver'

export class ClassValidatorDriver extends AbstractDriver {
  readonly #moduleSpecifier = 'class-validator'

  readonly #namedImports: Set<string> = new Set()

  public execute(): void {
    const classes = this.source.getClasses()
    for (const cls of classes) {
      const properties = cls.getProperties()
      for (const property of properties) {
        this.#addValidationDecorator(property)
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
  #addValidationDecorator(property: PropertyDeclaration): void {
    const decorators = this.#getValidationDecorators(property)
    for (const decorator of decorators) {
      const added = this.addDecorator(property, decorator)
      if (added) {
        this.#namedImports.add(decorator.name)
      }
    }
  }

  /**
   * Get validation decorators based on property's type
   */
  #getValidationDecorators(
    property: PropertyDeclaration,
  ): OptionalKind<DecoratorStructure>[] {
    let type = property.getType()
    // Makes import(<path>). disappear from string
    let typeText = type.getText(undefined, ts.TypeFormatFlags.None)
    const decorators: OptionalKind<DecoratorStructure>[] = []
    const isArray = type.isArray()
    if (isArray) {
      const arrayType = type.getArrayElementType()
      if (arrayType) {
        type = arrayType
        typeText = arrayType.getText(undefined, ts.TypeFormatFlags.None)
      }
      decorators.push({
        name: 'IsArray',
        arguments: [],
      })
    }

    const isOptional = type.isNullable()
    if (isOptional) {
      decorators.push({
        name: 'IsOptional',
        arguments: [],
      })
    }

    const isEnum = type.isEnum() || type.isEnumLiteral()
    if (isEnum) {
      const args = isArray ? [typeText, '{ each: true }'] : []
      decorators.push({
        name: 'IsEnum',
        arguments: args,
      })
    }

    const isNumber = type.isNumber() || type.isNumberLiteral()
    if (isNumber) {
      const args = isArray ? ['{}', '{ each: true }'] : []
      decorators.push({
        name: 'IsNumber',
        arguments: args,
      })
    }

    const isString = type.isString() || type.isStringLiteral()
    if (isString) {
      const args = isArray ? ['{ each: true }'] : []
      decorators.push({
        name: 'IsString',
        arguments: args,
      })
    }

    const isClass = type.isClass()
    if (isClass) {
      const args = isArray ? ['{ each: true }'] : []
      decorators.push({
        name: 'ValidateNested',
        arguments: args,
      })
      // Class should not be empty
      decorators.push({
        name: 'IsNotEmpty',
        arguments: args,
      })
    }

    const isBoolean = type.isBoolean() || type.isBooleanLiteral()
    if (isBoolean) {
      const args = isArray ? ['{ each: true }'] : []
      decorators.push({
        name: 'IsBoolean',
        arguments: args,
      })
    }
    return decorators
  }
}
