import type { StyleId } from '../types';
import { getStyleById } from '../styles';
import { BASE_SYSTEM_TEMPLATE, ITERATION_SYSTEM_ADDENDUM } from './templates';

/**
 * Build the full system prompt for a given style.
 * Replaces the {styleInstruction} placeholder with the style's promptInstruction,
 * and optionally appends the iteration addendum.
 */
export function buildSystemPrompt(styleId: StyleId, isIteration?: boolean): string {
  const style = getStyleById(styleId);
  const styleInstruction = style
    ? `设计风格要求：\n${style.promptInstruction}`
    : '';

  let prompt = BASE_SYSTEM_TEMPLATE.replace('{styleInstruction}', styleInstruction);

  if (isIteration) {
    prompt += ITERATION_SYSTEM_ADDENDUM;
  }

  return prompt;
}

/**
 * Build the user prompt from user input text and optional element context.
 * When elementContext is provided, formats as:
 *   "用户选中的元素：<context>\n\n修改要求：<prompt>"
 * Otherwise, returns the prompt text directly.
 */
export function buildUserPrompt({
  prompt,
  elementContext,
}: {
  prompt: string;
  elementContext?: string;
}): string {
  if (elementContext) {
    return `用户选中的元素：${elementContext}\n\n修改要求：${prompt}`;
  }
  return prompt;
}
