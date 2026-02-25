import { describe, it, expect } from 'vitest';
import { BASE_SYSTEM_TEMPLATE } from '../prompt/templates';
import { buildSystemPrompt, buildUserPrompt } from '../prompt/assembler';

describe('Prompt Templates & Assembler', () => {
  it('BASE_SYSTEM_TEMPLATE contains HTML and TailwindCSS', () => {
    expect(BASE_SYSTEM_TEMPLATE).toContain('HTML');
    expect(BASE_SYSTEM_TEMPLATE).toContain('TailwindCSS');
  });

  it('buildSystemPrompt("minimal") contains TailwindCSS related instructions', () => {
    const prompt = buildSystemPrompt('minimal');
    expect(prompt).toContain('TailwindCSS');
  });

  it('buildSystemPrompt("dark") contains dark related instructions', () => {
    const prompt = buildSystemPrompt('dark');
    expect(prompt.toLowerCase()).toContain('dark');
  });

  it('buildUserPrompt with only prompt contains user text', () => {
    const result = buildUserPrompt({ prompt: 'a login page' });
    expect(result).toContain('a login page');
  });

  it('buildUserPrompt with elementContext contains element context', () => {
    const result = buildUserPrompt({ prompt: 'change color', elementContext: '页面顶部的导航栏' });
    expect(result).toContain('页面顶部的导航栏');
    expect(result).toContain('change color');
  });

  it('buildUserPrompt without elementContext does not contain element context marker', () => {
    const result = buildUserPrompt({ prompt: 'a dashboard' });
    expect(result).not.toContain('用户选中的元素');
  });
});
