// Provider 类型定义

export type ProviderType = 'openai-compatible' | 'openai' | 'deepseek' | 'openrouter'

export interface ProviderPreset {
  id: ProviderType
  name: string
  defaultBaseUrl?: string
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'openai-compatible',
    name: 'OpenAI Compatible',
    // 无默认 baseUrl，用户需要自行填写
  },
  {
    id: 'openai',
    name: 'OpenAI',
    // 使用官方 API，无需自定义 baseUrl
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
  },
]