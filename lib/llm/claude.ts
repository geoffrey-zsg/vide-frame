import type { LLMProvider, GenerateParams } from '../types'

export class ClaudeProvider implements LLMProvider {
  name = 'Claude Sonnet'
  supportsVision = true

  constructor(private apiKey: string) {}

  async *generate(params: GenerateParams): AsyncIterable<string> {
    throw new Error('Not implemented')
  }
}
