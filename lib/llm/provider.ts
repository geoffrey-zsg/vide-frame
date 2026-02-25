import type { LLMProvider, ModelInfo } from '../types'
import { OpenAIProvider } from './openai'
import { ClaudeProvider } from './claude'
import { QwenProvider } from './qwen'
import { OpenRouterProvider } from './openrouter'

interface ModelDefinition {
  id: string
  name: string
  envKey: string
  openRouterModel: string
  factory: (apiKey: string) => LLMProvider
}

const MODEL_DEFINITIONS: ModelDefinition[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    envKey: 'OPENAI_API_KEY',
    openRouterModel: 'openai/gpt-4o',
    factory: (apiKey) => new OpenAIProvider(apiKey),
  },
  {
    id: 'claude-sonnet',
    name: 'Claude Sonnet',
    envKey: 'ANTHROPIC_API_KEY',
    openRouterModel: 'anthropic/claude-sonnet-4-20250514',
    factory: (apiKey) => new ClaudeProvider(apiKey),
  },
  {
    id: 'qwen-vl',
    name: '通义千问 VL',
    envKey: 'QWEN_API_KEY',
    openRouterModel: 'qwen/qwen-2.5-vl-72b-instruct',
    factory: (apiKey) => new QwenProvider(apiKey),
  },
]

function getOpenRouterKey(): string | undefined {
  return process.env.OPENROUTER_API_KEY
}

export function getLLMProvider(modelId: string, userApiKey?: string): LLMProvider {
  const definition = MODEL_DEFINITIONS.find((d) => d.id === modelId)
  if (!definition) {
    throw new Error(`Unknown model: ${modelId}`)
  }

  // Priority: user-provided key > direct API key > OpenRouter
  const directKey = userApiKey ?? process.env[definition.envKey]
  if (directKey) {
    return definition.factory(directKey)
  }

  const openRouterKey = getOpenRouterKey()
  if (openRouterKey) {
    return new OpenRouterProvider(openRouterKey, definition.openRouterModel, definition.name)
  }

  throw new Error(
    `No API key for model ${modelId}. Set ${definition.envKey} or OPENROUTER_API_KEY.`
  )
}

export function getAvailableModels(): ModelInfo[] {
  const openRouterKey = getOpenRouterKey()
  return MODEL_DEFINITIONS.map((d) => ({
    id: d.id,
    name: d.name,
    available: !!process.env[d.envKey] || !!openRouterKey,
  }))
}
