import OpenAI from 'openai'
import { HttpsProxyAgent } from 'https-proxy-agent'
import type { LLMProvider, GenerateParams } from '../types'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

export class OpenRouterProvider implements LLMProvider {
  name: string
  supportsVision = true

  constructor(
    private apiKey: string,
    private model: string,
    displayName: string
  ) {
    this.name = displayName
  }

  async *generate(params: GenerateParams): AsyncIterable<string> {
    const { image, prompt, systemPrompt, history } = params
    
    // 配置代理
    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
    const httpAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined

    const client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: OPENROUTER_BASE_URL,
      httpAgent, // 注入代理 Agent
      defaultHeaders: {
        'HTTP-Referer': 'https://vibeframe.dev',
        'X-Title': 'VibeFrame',
      },
    })

    const messages: OpenAI.ChatCompletionMessageParam[] = []

    // System message
    messages.push({ role: 'system', content: systemPrompt })

    // History messages
    for (const msg of history) {
      if (msg.role === 'user' && msg.image) {
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: msg.content },
            {
              type: 'image_url',
              image_url: { url: `data:image/png;base64,${msg.image}` },
            },
          ],
        })
      } else {
        messages.push({ role: msg.role, content: msg.content })
      }
    }

    // Current user message
    if (image) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${image}` },
          },
        ],
      })
    } else {
      messages.push({ role: 'user', content: prompt })
    }

    const stream = await client.chat.completions.create({
      model: this.model,
      messages,
      stream: true,
      max_tokens: 16384,
    })

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        yield content
      }
    }
  }
}
