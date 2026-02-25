import type { LLMProvider, ModelInfo } from '../types'
import { OpenAIProvider } from './openai'
import { ClaudeProvider } from './claude'
import { QwenProvider } from './qwen'

interface ModelDefinition {
  id: string
  name: string
  envKey: string
  factory: (apiKey: string) => LLMProvider
}

const MODEL_DEFINITIONS: ModelDefinition[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    envKey: 'OPENAI_API_KEY',
    factory: (apiKey) => new OpenAIProvider(apiKey),
  },
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet',
    envKey: 'ANTHROPIC_API_KEY',
    factory: (apiKey) => new ClaudeProvider(apiKey),
  },
  {
    id: 'qwen-vl',
    name: '通义千问 VL',
    envKey: 'QWEN_API_KEY',
    factory: (apiKey) => new QwenProvider(apiKey),
  },
]

export function getLLMProvider(modelId: string, userApiKey?: string): LLMProvider {
  const definition = MODEL_DEFINITIONS.find((d) => d.id === modelId)
  if (!definition) {
    throw new Error(`Unknown model: ${modelId}`)
  }

  const apiKey = userApiKey ?? process.env[definition.envKey]
  if (!apiKey) {
    throw new Error(
      `No API key provided for model ${modelId}. Set ${definition.envKey} or pass an API key.`
    )
  }

  return definition.factory(apiKey)
}

export function getAvailableModels(): ModelInfo[] {
  return MODEL_DEFINITIONS.map((d) => ({
    id: d.id,
    name: d.name,
    available: !!process.env[d.envKey],
  }))
}
