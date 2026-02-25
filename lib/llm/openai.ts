import type { LLMProvider, GenerateParams } from '../types'

export class OpenAIProvider implements LLMProvider {
  name = 'GPT-4o'
  supportsVision = true

  constructor(private apiKey: string) {}

  async *generate(params: GenerateParams): AsyncIterable<string> {
    throw new Error('Not implemented')
  }
}
