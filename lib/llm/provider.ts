import type { LLMProvider } from '../types'
import { OpenAIProvider } from './openai'

/**
 * 根据 provider 类型 + baseUrl + model + apiKey 创建 LLM Provider 实例。
 * 支持任意 OpenAI Compatible API 服务。
 */
export function getLLMProvider(
  provider: string,
  model: string,
  apiKey: string,
  baseUrl?: string,
): LLMProvider {
  if (!apiKey) {
    throw new Error('API Key 是必填项，请在设置中配置。')
  }

  if (!model) {
    throw new Error('模型 ID 是必填项，请在设置中配置。')
  }

  // 所有 provider 都使用 OpenAI Compatible API
  // 预设 provider 的 baseUrl
  const providerBaseUrls: Record<string, string | undefined> = {
    openai: undefined, // 使用默认 https://api.openai.com/v1
    deepseek: 'https://api.deepseek.com/v1',
    openrouter: 'https://openrouter.ai/api/v1',
  }

  // 优先使用用户自定义的 baseUrl，否则使用预设
  const effectiveBaseUrl = baseUrl || providerBaseUrls[provider]

  const displayName = provider === 'openai-compatible' ? 'Custom' : provider

  return new OpenAIProvider(apiKey, effectiveBaseUrl, model, displayName)
}