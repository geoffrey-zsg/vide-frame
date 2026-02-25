import { describe, it, expect } from 'vitest';
import type {
  Message,
  GenerateParams,
  LLMProvider,
  StyleId,
  StylePreset,
  GenerateRequest,
  UserSettings,
  Session,
  HostMessage,
  ElementInfo,
  SandboxMessage,
} from '../types';

describe('Core type definitions', () => {
  it('should allow creating valid Message and GenerateParams objects', () => {
    const userMessage: Message = {
      role: 'user',
      content: 'Hello',
    };

    const assistantMessage: Message = {
      role: 'assistant',
      content: 'Hi there',
      image: 'data:image/png;base64,abc',
    };

    const params: GenerateParams = {
      prompt: 'Build a landing page',
      systemPrompt: 'You are a helpful assistant.',
      history: [userMessage, assistantMessage],
    };

    expect(userMessage.role).toBe('user');
    expect(assistantMessage.role).toBe('assistant');
    expect(assistantMessage.image).toBeDefined();
    expect(params.history).toHaveLength(2);
    expect(params.image).toBeUndefined();
  });

  it('should allow creating valid GenerateRequest and style-related objects', () => {
    const style: StyleId = 'dark';

    const preset: StylePreset = {
      id: 'glass',
      name: 'Glassmorphism',
      description: 'Frosted glass effect',
      promptInstruction: 'Use glassmorphism design',
      previewColors: { bg: '#ffffff', fg: '#000000', accent: '#0070f3' },
    };

    const request: GenerateRequest = {
      prompt: 'Create a navbar',
      style: 'minimal',
      history: [],
      provider: 'openai',
      model: 'gpt-4o',
      apiKey: 'sk-test',
      elementContext: '<nav>...</nav>',
    };

    expect(style).toBe('dark');
    expect(preset.id).toBe('glass');
    expect(preset.previewColors.accent).toBe('#0070f3');
    expect(request.model).toBe('gpt-4o');
    expect(request.provider).toBe('openai');
    expect(request.history).toHaveLength(0);
  });

  it('should allow creating valid HostMessage, SandboxMessage, and model objects', () => {
    const renderMsg: HostMessage = { type: 'render', html: '<div>Hello</div>' };
    const chunkMsg: HostMessage = { type: 'render-chunk', chunk: '<p>' };
    const completeMsg: HostMessage = { type: 'render-complete' };
    const highlightMsg: HostMessage = { type: 'highlight', selector: '.btn' };
    const clearMsg: HostMessage = { type: 'clear-highlight' };

    const elementInfo: ElementInfo = {
      tagName: 'button',
      textContent: 'Click me',
      className: 'btn primary',
      positionDescription: 'top-right corner',
    };

    const clickMsg: SandboxMessage = { type: 'element-clicked', elementInfo };
    const errorMsg: SandboxMessage = { type: 'render-error', error: 'Syntax error' };
    const readyMsg: SandboxMessage = { type: 'ready' };

    const userSettings: UserSettings = {
      provider: 'openai',
      model: 'gpt-4o',
      apiKey: 'sk-test',
    };

    const session: Session = {
      id: 'test-id',
      title: '测试会话',
      messages: [],
      currentHTML: null,
      style: 'minimal',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(renderMsg.type).toBe('render');
    expect(chunkMsg.type).toBe('render-chunk');
    expect(completeMsg.type).toBe('render-complete');
    expect(highlightMsg.type).toBe('highlight');
    expect(clearMsg.type).toBe('clear-highlight');
    expect(clickMsg.type).toBe('element-clicked');
    expect(errorMsg.type).toBe('render-error');
    expect(readyMsg.type).toBe('ready');
    expect(elementInfo.tagName).toBe('button');
    expect(userSettings.provider).toBe('openai');
    expect(session.title).toBe('测试会话');
  });
});
