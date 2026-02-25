import OpenAI from 'openai'
import type { LLMProvider, GenerateParams } from '../types'

export class OpenAIProvider implements LLMProvider {
  name = 'GPT-4o'
  supportsVision = true

  constructor(private apiKey: string) {}

  async *generate(params: GenerateParams): AsyncIterable<string> {
    const { image, prompt, systemPrompt, history } = params
    const client = new OpenAI({ apiKey: this.apiKey })

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
      model: 'gpt-4o',
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
