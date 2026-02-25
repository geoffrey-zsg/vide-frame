import type { LLMProvider, GenerateParams } from '../types'

export class QwenProvider implements LLMProvider {
  name = '通义千问 VL'
  supportsVision = true

  constructor(private apiKey: string) {}

  async *generate(params: GenerateParams): AsyncIterable<string> {
    throw new Error('Not implemented')
  }
}
