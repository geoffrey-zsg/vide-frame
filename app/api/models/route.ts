import { NextResponse } from 'next/server'
import { getAvailableModels } from '@/lib/llm/provider'

export async function GET() {
  const models = getAvailableModels()
  return NextResponse.json({ models })
}
