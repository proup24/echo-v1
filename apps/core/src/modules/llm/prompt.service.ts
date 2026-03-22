import { Injectable, Logger } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'
import * as Handlebars from 'handlebars'
import type { PromptResult } from './prompt.types'

interface CompiledPrompt {
  system: Handlebars.TemplateDelegate
  user: Handlebars.TemplateDelegate
}

@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name)
  private readonly cache = new Map<string, CompiledPrompt>()

  render(promptName: string, vars: Record<string, unknown>): PromptResult {
    const compiled = this.getCompiled(promptName)

    return {
      system: compiled.system(vars).trim(),
      user: compiled.user(vars).trim()
    }
  }

  private getCompiled(promptName: string): CompiledPrompt {
    const cached = this.cache.get(promptName)
    if (cached) return cached

    const filePath = path.join(__dirname, 'prompts', `${promptName}.hbs`)
    const raw = fs.readFileSync(filePath, 'utf-8')

    const systemMatch = raw.match(/---system---\s*([\s\S]*?)\s*---user---/)
    const userMatch = raw.match(/---user---\s*([\s\S]*)$/)

    if (!systemMatch || !userMatch) {
      throw new Error(
        `Prompt file "${promptName}.hbs" must contain ---system--- and ---user--- sections`
      )
    }

    const compiled: CompiledPrompt = {
      system: Handlebars.compile(systemMatch[1].trim()),
      user: Handlebars.compile(userMatch[1].trim())
    }

    this.cache.set(promptName, compiled)
    this.logger.log(`Compiled and cached prompt: ${promptName}`)

    return compiled
  }
}
