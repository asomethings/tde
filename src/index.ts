#!/usr/bin/env node
import { Project, SourceFile } from 'ts-morph'
import * as drivers from './drivers'
import { Command } from 'commander'
import globby from 'globby'

const program = new Command()
const project = new Project()
program
  .argument('<paths...>', 'paths to typescript class')
  .action(async (paths: string) => {
    const globPaths = await globby(paths, {
      onlyFiles: true,
    })
    const sources = globPaths
      .filter((path) => path.endsWith('ts'))
      .map((path) => project.addSourceFileAtPathIfExists(path))
      .filter((source): source is SourceFile => typeof source !== 'undefined')
    // TODO: Make it async
    for (const source of sources) {
      for (const driverCls of Object.values(drivers)) {
        new driverCls(source).execute()
      }
      source.formatText({
        ensureNewLineAtEndOfFile: true,
      })
    }

    await project.save()
  })
  .parseAsync()
