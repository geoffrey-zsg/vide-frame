import type { LLMProvider } from '../types'
import type { ProviderId } from '../model-config'
import { OpenAIProvider } from './openai'
import { ClaudeProvider } from './claude'
import { QwenProvider } from './qwen'
import { OpenRouterProvider } from './openrouter'

/**
 * 根据 provider 类型 + model + apiKey 创建 LLM Provider 实例。
 * 不再依赖服务端环境变量，完全由客户端传入参数驱动。
 */
export function getLLMProvider(
  provider: ProviderId,
  model: string,
  apiKey: string,
): LLMProvider {
  if (!apiKey) {
    throw new Error('API Key 是必填项，请在设置中配置。')
  }

  switch (provider) {
    case 'openai':
      return new OpenAIProvider(apiKey, undefined, model, 'OpenAI')
    case 'anthropic':
      return new ClaudeProvider(apiKey, model)
    case 'qwen':
      return new QwenProvider(apiKey, model)
    case 'deepseek':
      return new OpenAIProvider(apiKey, 'https://api.deepseek.com/v1', model, 'DeepSeek')
    case 'openrouter':
      return new OpenRouterProvider(apiKey, model, model)
    default:
      throw new Error(`未知的 Provider: ${provider}`)
  }
}
