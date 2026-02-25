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
    id: 'qwen',
    name: '通义千问',
    models: [
      { id: 'qwen-vl-max', name: '千问 VL Max', supportsVision: true },
      { id: 'qwen-vl-plus', name: '千问 VL Plus', supportsVision: true },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', supportsVision: false },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', supportsVision: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', supportsVision: true },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', supportsVision: true },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    models: [
      { id: 'qwen/qwen-2.5-vl-72b-instruct', name: 'Qwen VL 72B', supportsVision: true },
      { id: 'openai/gpt-4o', name: 'GPT-4o', supportsVision: true },
      { id: 'anthropic/claude-sonnet-4-20250514', name: 'Claude Sonnet 4', supportsVision: true },
      { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3', supportsVision: false },
    ],
  },
]
