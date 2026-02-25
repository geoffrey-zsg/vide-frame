// Core TypeScript type definitions for vibe-frame

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

export interface GenerateParams {
  image?: string;
  prompt: string;
  systemPrompt: string;
  history: Message[];
}

export interface LLMProvider {
  name: string;
  supportsVision: boolean;
  generate(params: GenerateParams): AsyncIterable<string>;
}

export type StyleId = 'minimal' | 'dark' | 'glass' | 'corporate';

export interface StylePreset {
  id: StyleId;
  name: string;
  description: string;
  promptInstruction: string;
  previewColors: {
    bg: string;
    fg: string;
    accent: string;
  };
}

export interface GenerateRequest {
  image?: string;
  prompt: string;
  style: StyleId;
  history: Message[];
  model: string;
  apiKey?: string;
  elementContext?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  available: boolean;
}

export interface ModelsResponse {
  models: ModelInfo[];
}

export type HostMessage =
  | { type: 'render'; html: string }
  | { type: 'render-chunk'; chunk: string }
  | { type: 'render-complete' }
  | { type: 'highlight'; selector: string }
  | { type: 'clear-highlight' };

export interface ElementInfo {
  tagName: string;
  textContent: string;
  className: string;
  positionDescription: string;
}

export type SandboxMessage =
  | { type: 'element-clicked'; elementInfo: ElementInfo }
  | { type: 'render-error'; error: string }
  | { type: 'ready' };
