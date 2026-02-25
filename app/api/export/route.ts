import { NextResponse } from 'next/server'
import { sanitizeHTML } from '@/lib/sanitizer'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.html || typeof body.html !== 'string') {
      return NextResponse.json(
        { error: 'html field is required and must be a string' },
        { status: 400 }
      )
    }

    const sanitized = sanitizeHTML(body.html)

    return new Response(sanitized, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'attachment; filename="vibeframe-export.html"',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
