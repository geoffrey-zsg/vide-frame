// VibeFrame 核心类型定义

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

/** 用户设置（持久化到 localStorage） */
export interface UserSettings {
  /** API Provider 类型 */
  provider: string;
  /** 自定义 Base URL（可选，用于 OpenAI Compatible 服务） */
  baseUrl: string;
  /** API Key */
  apiKey: string;
  /** 模型 ID */
  model: string;
}

/** 前端 → /api/generate 的请求体 */
export interface GenerateRequest {
  image?: string;
  prompt: string;
  style: StyleId;
  history: Message[];
  provider: string;
  baseUrl?: string;
  model: string;
  apiKey: string;
  elementContext?: string;
}

/** 会话记录（持久化到 localStorage） */
export interface Session {
  id: string;
  title: string;
  messages: Message[];
  currentHTML: string | null;
  style: StyleId;
  createdAt: number;
  updatedAt: number;
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
