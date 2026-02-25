import Anthropic from '@anthropic-ai/sdk'
import type { LLMProvider, GenerateParams } from '../types'

export class ClaudeProvider implements LLMProvider {
  name = 'Claude Sonnet'
  supportsVision = true

  constructor(private apiKey: string, private model: string = 'claude-sonnet-4-20250514') {}

  async *generate(params: GenerateParams): AsyncIterable<string> {
    const { image, prompt, systemPrompt, history } = params
    const client = new Anthropic({ apiKey: this.apiKey })

    const messages: Anthropic.MessageParam[] = []

    // History messages
    for (const msg of history) {
      if (msg.role === 'user' && msg.image) {
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: msg.content },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: msg.image,
              },
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
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: image,
            },
          },
        ],
      })
    } else {
      messages.push({ role: 'user', content: prompt })
    }

    const stream = client.messages.stream({
      model: this.model,
      system: systemPrompt,
      messages,
      max_tokens: 16384,
    })

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text
      }
    }
  }
}
