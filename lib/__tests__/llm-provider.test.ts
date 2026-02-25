import { describe, it, expect } from 'vitest'
import { getLLMProvider } from '../llm/provider'

describe('LLM Provider Factory', () => {
  it('getLLMProvider throws for unknown provider', () => {
    expect(() =>
      getLLMProvider('unknown' as never, 'model', 'key'),
    ).toThrow('未知的 Provider')
  })

  it('getLLMProvider throws when apiKey is empty', () => {
    expect(() => getLLMProvider('openai', 'gpt-4o', '')).toThrow(
      'API Key 是必填项',
    )
  })

  it('getLLMProvider returns correct provider for openai', () => {
    const provider = getLLMProvider('openai', 'gpt-4o', 'test-key')
    expect(provider.name).toBe('OpenAI')
    expect(provider.supportsVision).toBe(true)
  })

  it('getLLMProvider returns correct provider for anthropic', () => {
    const provider = getLLMProvider('anthropic', 'claude-sonnet-4-20250514', 'test-key')
    expect(provider.name).toBe('Claude Sonnet')
    expect(provider.supportsVision).toBe(true)
  })

  it('getLLMProvider returns correct provider for qwen', () => {
    const provider = getLLMProvider('qwen', 'qwen-vl-max', 'test-key')
    expect(provider.name).toBe('通义千问 VL')
    expect(provider.supportsVision).toBe(true)
  })

  it('getLLMProvider returns correct provider for deepseek', () => {
    const provider = getLLMProvider('deepseek', 'deepseek-chat', 'test-key')
    expect(provider.name).toBe('DeepSeek')
    expect(provider.supportsVision).toBe(true)
  })

  it('getLLMProvider returns correct provider for openrouter', () => {
    const provider = getLLMProvider('openrouter', 'openai/gpt-4o', 'test-key')
    expect(provider.supportsVision).toBe(true)
  })
})
