import { PropertyDeclaration, SourceFile } from 'ts-morph'

export abstract class AbstractDriver {
  constructor(protected readonly source: SourceFile) {}

  public abstract execute(): void

  protected hasNamedImport(
    moduleSpecifier: string,
    namedImport: string,
  ): boolean {
    return !!this.source.getImportDeclarations().find(
      (importDeclaration) =>
        importDeclaration.getModuleSpecifier().getLiteralText() ===
          moduleSpecifier &&
        importDeclaration
          .getNamedImports()
          .map((n) => n.getName())
          .includes(namedImport),
    )
  }

  protected addImportDeclaration(
    structure: Parameters<SourceFile['addImportDeclaration']>[0],
  ): boolean {
    if (Array.isArray(structure.namedImports)) {
      structure.namedImports = structure.namedImports.filter((i) => {
        if (typeof i === 'string') {
          return !this.hasNamedImport(structure.moduleSpecifier, i)
        }

        if ('name' in i) {
          return !this.hasNamedImport(structure.moduleSpecifier, i.name)
        }

        return true
      })
      if (structure.namedImports.length === 0) {
        return false
      }
    }

    return !!this.source.addImportDeclaration(structure)
  }

  protected hasDecorator(property: PropertyDeclaration, name: string): boolean {
    return !!property
      .getDecorators()
      .find((decorator) => decorator.getName() === name)
  }

  protected addDecorator(
    property: PropertyDeclaration,
    structure: Parameters<PropertyDeclaration['addDecorator']>[0],
  ): boolean {
    if (this.hasDecorator(property, structure.name)) {
      return false
    }

    return !!property.addDecorator(structure)
  }

  protected replaceEverydayTypes(type: string): string {
    switch (type) {
      case 'string':
        return 'String'
      case 'number':
        return 'Number'
      case 'boolean':
        return 'Boolean'
      default:
        return type
    }
  }
}
