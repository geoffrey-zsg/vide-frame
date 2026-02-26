# VibeFrame 架构设计文档

## 一、技术栈

| 层级 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| 框架 | Next.js (App Router) | 16.x | 前后端合一，API Routes 替代独立 BFF |
| UI 框架 | React | 19.x | 最新版本，支持 Ref 简化等特性 |
| 语言 | TypeScript | 5.x (strict) | 全栈统一，类型安全 |
| 样式 | Tailwind CSS | 4.x | 主应用样式 + iframe 沙箱内生成代码样式 |
| 测试 | Vitest + Testing Library | 4.x | 单元测试 + 组件测试 |
| Lint | ESLint | 9.x (flat config) | 代码质量检查 |
| 包管理 | pnpm | 10.x | 快速、节省磁盘空间 |
| LLM SDK | openai | 6.x | 支持 OpenAI Compatible API |
| 部署 | Docker + Nginx | - | 容器化部署，Nginx 反向代理 |

## 二、项目结构

```
vibe-frame/
├── app/
│   ├── layout.tsx              # 根布局
│   ├── page.tsx                # 主页面
│   ├── api/
│   │   ├── generate/route.ts  # LLM 代码生成接口（流式 SSE）
│   │   └── export/route.ts    # 导出 HTML 接口
│   └── globals.css             # 全局样式 + Tailwind
├── components/
│   ├── InputPanel/             # 左侧面板（图片上传 + 文字输入 + 对话历史）
│   ├── PreviewPanel/           # 右侧预览沙箱（iframe + 骨架屏）
│   ├── SplitPane/              # 可拖拽分割线容器
│   ├── StyleSelector/          # 风格预设选择器
│   ├── SessionList/            # 会话历史列表
│   └── SettingsDialog/         # API Key 设置弹窗
├── lib/
│   ├── llm/
│   │   ├── provider.ts         # LLM Provider 工厂函数
│   │   └── openai.ts           # OpenAI Compatible 适配器（统一实现）
│   ├── prompt/
│   │   ├── assembler.ts        # Prompt 组装器
│   │   └── templates.ts        # 各风格的 Prompt 模板
│   ├── sanitizer.ts            # HTML 清洗器（安全）
│   ├── sandbox-template.ts     # iframe 沙箱模板
│   ├── session-storage.ts      # 会话持久化
│   ├── model-config.ts         # 模型配置
│   ├── styles.ts               # 风格预设配置
│   └── types.ts                # 类型定义
└── docs/                       # 文档目录
```

## 三、LLM Provider 架构

### 设计演进

**原设计（多适配器）：**
```
OpenAI Provider ─────┐
Claude Provider  ─────┼──→ 统一 LLMProvider 接口
Qwen Provider    ─────┘
```

**实际实现（统一接口）：**
```
┌─────────────────────────────────────────────────────┐
│                   OpenAI Compatible API             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ OpenAI  │ │DeepSeek │ │OpenRouter│ │ Custom  │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘  │
│       │           │           │           │        │
│       └───────────┴───────────┴───────────┘        │
│                           │                         │
│                    OpenAIProvider                   │
│                    (统一实现)                        │
└─────────────────────────────────────────────────────┘
```

### 代码实现

```typescript
// lib/llm/provider.ts
export function getLLMProvider(
  provider: string,
  model: string,
  apiKey: string,
  baseUrl?: string,
): LLMProvider {
  // 预设 provider 的 baseUrl
  const providerBaseUrls: Record<string, string | undefined> = {
    openai: undefined,
    deepseek: 'https://api.deepseek.com/v1',
    openrouter: 'https://openrouter.ai/api/v1',
  };

  const effectiveBaseUrl = baseUrl || providerBaseUrls[provider];
  return new OpenAIProvider(apiKey, effectiveBaseUrl, model, displayName);
}
```

**优势：**
- 单一适配器实现，维护成本 O(n) → O(1)
- 用户可自定义任意 OpenAI Compatible 服务
- 预设配置简化常见场景

## 四、核心数据流

```
用户输入（图片 + 文字 + 风格选择）
  → 前端组装请求
  → POST /api/generate（流式 SSE）
  → Prompt 组装器拼接完整 Prompt
  → OpenAIProvider 调用 LLM API
  → 流式返回生成的 HTML 代码
  → sanitizeHTML() 清洗危险代码
  → postMessage 注入 iframe
  → 渐进渲染
```

## 五、iframe 沙箱通信协议

### 主应用 → iframe

```typescript
type HostMessage =
  | { type: 'render'; html: string }           // 完整渲染
  | { type: 'render-chunk'; chunk: string }   // 流式追加
  | { type: 'render-complete' }               // 渲染完成信号
  | { type: 'highlight'; selector: string }   // 高亮元素
  | { type: 'clear-highlight' };              // 清除高亮
```

### iframe → 主应用

```typescript
type SandboxMessage =
  | { type: 'ready' }                          // 加载就绪
  | { type: 'render-error'; error: string }   // 渲染错误
  | { type: 'render-success' }                // 渲染成功
  | { type: 'element-clicked'; elementInfo: ElementInfo }; // 元素点击
```

## 六、会话管理

### 数据结构

```typescript
interface Session {
  id: string;
  title: string;
  messages: Message[];
  currentHTML: string | null;
  style: StyleId;
  createdAt: number;
  updatedAt: number;
}
```

### 持久化

- 使用 localStorage 存储会话列表
- 支持会话创建、更新、删除、切换
- 自动从消息生成标题