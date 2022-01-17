import { AbstractDriver } from './abstract.driver'

export class SortDriver extends AbstractDriver {
  public execute(): void {
    const classes = this.source.getClasses()
    for (const cls of classes) {
      const properties = cls.getProperties()
      for (const property of properties) {
        const decorators = property.getDecorators()
        const sortedDecorators = decorators
          .sort((a, b) => a.getText(false).length - b.getText(false).length)
          .map((decorator) => ({
            name: decorator.getName(),
            arguments: decorator
              .getArguments()
              .map((node) => node.getText(false)),
          }))
        decorators.forEach((decorator) => decorator.remove())
        property.addDecorators(sortedDecorators)
      }
    }
  }
}
