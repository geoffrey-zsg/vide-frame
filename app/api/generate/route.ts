import { NextResponse } from 'next/server'
import type { GenerateRequest } from '@/lib/types'
import { getLLMProvider } from '@/lib/llm/provider'
import { buildSystemPrompt, buildUserPrompt } from '@/lib/prompt/assembler'
import { sanitizeHTML } from '@/lib/sanitizer'

export async function POST(request: Request) {
  try {
    const body: GenerateRequest = await request.json()

    if (!body.prompt && !body.image) {
      return NextResponse.json(
        { error: 'Either prompt or image is required' },
        { status: 400 }
      )
    }

    const provider = getLLMProvider(body.model, body.apiKey)

    const isIteration = body.history.length > 0
    const systemPrompt = buildSystemPrompt(body.style, isIteration)
    const userPrompt = buildUserPrompt({
      prompt: body.prompt,
      elementContext: body.elementContext,
    })

    const stream = provider.generate({
      image: body.image,
      prompt: userPrompt,
      systemPrompt,
      history: body.history,
    })

    const encoder = new TextEncoder()
    let fullHTML = ''

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            fullHTML += chunk
            const event = `data: ${JSON.stringify({ chunk })}\n\n`
            controller.enqueue(encoder.encode(event))
          }

          const sanitized = sanitizeHTML(fullHTML)
          const doneEvent = `data: ${JSON.stringify({ done: true, html: sanitized })}\n\n`
          controller.enqueue(encoder.encode(doneEvent))
          controller.close()
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Stream generation failed'
          const errorEvent = `data: ${JSON.stringify({ error: message })}\n\n`
          controller.enqueue(encoder.encode(errorEvent))
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
