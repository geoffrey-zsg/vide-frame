// 静态 Provider/Model 配置
// 此文件由用户维护，定义前端可选的 Provider 和 Model 列表。

export type ProviderId = 'openai' | 'anthropic' | 'qwen' | 'deepseek' | 'openrouter'

export interface ModelConfig {
  /** 模型 ID，即实际传给 API 的 model 参数 */
  id: string
  /** 前端显示名称 */
  name: string
  /** 是否支持图像输入 */
  supportsVision: boolean
}

export interface ProviderConfig {
  id: ProviderId
  name: string
  models: ModelConfig[]
}

export const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    models: [
      { id: 'google/gemini-3.1-pro-preview', name: 'gemini-3.1-pro-preview', supportsVision: true },
      { id: 'minimax/minimax-m2.5', name: 'minimax-m2.5', supportsVision: true },
      { id: 'moonshotai/kimi-k2.5', name: 'kimi-k2.5', supportsVision: true },
      { id: 'anthropic/claude-opus-4.6', name: 'claude-opus-4.6', supportsVision: true },
    ],
  },
]
