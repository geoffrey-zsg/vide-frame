import { describe, it, expect } from 'vitest'
import { getLLMProvider, getAvailableModels } from '../llm/provider'

describe('LLM Provider Factory', () => {
  it('getLLMProvider throws for unknown model', () => {
    expect(() => getLLMProvider('unknown-model')).toThrow()
  })

  it('getLLMProvider returns correct provider for gpt-4o', () => {
    const provider = getLLMProvider('gpt-4o', 'test-api-key')
    expect(provider.name).toBe('GPT-4o')
    expect(provider.supportsVision).toBe(true)
  })

  it('getAvailableModels returns at least 3 models with correct shape', () => {
    const models = getAvailableModels()
    expect(models.length).toBeGreaterThanOrEqual(3)
    for (const model of models) {
      expect(model).toHaveProperty('id')
      expect(model).toHaveProperty('name')
      expect(typeof model.available).toBe('boolean')
    }
  })
})
