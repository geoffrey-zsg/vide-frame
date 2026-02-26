import { describe, it, expect } from 'vitest'
import { getLLMProvider } from '../llm/provider'

describe('LLM Provider Factory', () => {
  it('getLLMProvider throws when apiKey is empty', () => {
    expect(() => getLLMProvider('openai', 'gpt-4o', '')).toThrow(
      'API Key 是必填项',
    )
  })

  it('getLLMProvider throws when model is empty', () => {
    expect(() => getLLMProvider('openai', '', 'test-key')).toThrow(
      '模型 ID 是必填项',
    )
  })

  it('getLLMProvider returns provider with correct name for openai', () => {
    const provider = getLLMProvider('openai', 'gpt-4o', 'test-key')
    expect(provider.name).toBe('openai')
    expect(provider.supportsVision).toBe(true)
  })

  it('getLLMProvider returns provider with correct name for deepseek', () => {
    const provider = getLLMProvider('deepseek', 'deepseek-chat', 'test-key')
    expect(provider.name).toBe('deepseek')
    expect(provider.supportsVision).toBe(true)
  })

  it('getLLMProvider returns provider with correct name for openrouter', () => {
    const provider = getLLMProvider('openrouter', 'openai/gpt-4o', 'test-key')
    expect(provider.name).toBe('openrouter')
    expect(provider.supportsVision).toBe(true)
  })

  it('getLLMProvider returns provider with Custom name for openai-compatible', () => {
    const provider = getLLMProvider('openai-compatible', 'qwen-plus', 'test-key', 'https://api.example.com/v1')
    expect(provider.name).toBe('Custom')
    expect(provider.supportsVision).toBe(true)
  })

  it('getLLMProvider supports custom baseUrl', () => {
    const provider = getLLMProvider('openai-compatible', 'qwen-plus', 'test-key', 'https://custom.api.com/v1')
    expect(provider.name).toBe('Custom')
    expect(provider.supportsVision).toBe(true)
  })
})