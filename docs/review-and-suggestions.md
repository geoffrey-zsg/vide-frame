# VibeFrame 技术文档 Review 与完善建议

> **审查时间：** 2026-02-26
> **审查人：** Claude Code

## 一、现有文档评估

### 1. README.md（参赛作品说明）

**优点：**
- 清晰阐述了项目定位和核心价值
- 明确了 MVP 边界和功能范围
- 列出了 7 大 Agentic Coding 领域的得分点

**需完善：**
- 技术栈版本过时（文档写 Next.js 14+，实际是 Next.js 16 + React 19）
- 未反映最新架构改动（统一使用 OpenAI Compatible API）
- 缺少快速启动命令和在线演示链接

### 2. docs/plans/2026-02-14-vibeframe-design.md（设计文档）

**优点：**
- 架构设计详尽，数据流清晰
- API 接口定义完整
- 安全策略考虑周全

**需完善：**
| 章节 | 文档描述 | 实际实现 | 建议 |
|------|---------|---------|------|
| LLM 适配器 | 三个独立适配器（OpenAI/Claude/Qwen） | 统一 OpenAI Compatible Provider + 预设配置 | 更新适配器章节，说明统一接口设计 |
| 模型配置 | 环境变量直连 | 用户可在 UI 配置 API Key、Base URL、模型 | 补充用户自定义配置章节 |
| 会话历史 | MVP 之外 | 已实现 localStorage 会话持久化 | 补充会话管理章节 |

### 3. docs/plans/2026-02-25-vibeframe-implementation.md（实施计划）

**优点：**
- 任务拆解细致（20 个任务）
- 遵循 TDD 流程
- 验收标准清晰

**状态更新：** 所有 20 个任务已完成，commit 历史证明：

```
b1da049 feat: 重构配置系统支持自定义 OpenAI Compatible API，修复流式渲染问题
6c5accc feat: 进一步优化交互体验与生成效果
75f46c1 style: 按照 UI/UX 优化文档完成全站样式深度重构
...
```

---

## 二、技术文档完善方案

### 1. 更新技术栈版本

```markdown
| 层面 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) + React 19 |
| 语言 | TypeScript 5 (strict) |
| 样式 | Tailwind CSS 4 (`@import "tailwindcss"`) |
| 测试 | Vitest 4 + Testing Library + jsdom |
| Lint | ESLint 9 (flat config, eslint-config-next) |
| 包管理 | pnpm 10 |
| LLM SDK | openai, @anthropic-ai/sdk |
| 部署 | Docker 多阶段构建 + Nginx 反向代理 |
```

### 2. 补充 LLM Provider 架构演进

**原设计：**
```
OpenAI Provider ─────┐
Claude Provider  ─────┼──→ 统一 LLMProvider 接口
Qwen Provider    ─────┘
```

**实际实现（更优雅）：**
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

**代码实现：** `lib/llm/provider.ts`

```typescript
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

### 3. 补充会话管理功能

**数据结构：** `lib/types.ts`

```typescript
export interface Session {
  id: string;
  title: string;
  messages: Message[];
  currentHTML: string | null;
  style: StyleId;
  createdAt: number;
  updatedAt: number;
}
```

**持久化：** `lib/session-storage.ts`

- 使用 localStorage 存储会话列表
- 支持会话创建、更新、删除、切换
- 自动从消息生成标题

### 4. 补充 iframe 沙箱通信协议

**主应用 → iframe：**

```typescript
type HostMessage =
  | { type: 'render'; html: string }           // 完整渲染
  | { type: 'render-chunk'; chunk: string }     // 流式追加
  | { type: 'render-complete' }                 // 渲染完成信号
  | { type: 'highlight'; selector: string }     // 高亮元素
  | { type: 'clear-highlight' };                // 清除高亮
```

**iframe → 主应用：**

```typescript
type SandboxMessage =
  | { type: 'ready' }                           // 加载就绪
  | { type: 'render-error'; error: string }     // 渲染错误
  | { type: 'element-clicked'; elementInfo: ElementInfo }; // 元素点击
```

### 5. 补充安全清洗器规则

**规则表：**

| 规则 | 处理方式 | 示例 |
|------|---------|------|
| 外部 `<script src>` | 白名单域名保留，否则移除 | `cdn.tailwindcss.com` 保留 |
| 内联 `<script>` 中的危险 API | 替换为 `/* blocked */` | `fetch()` → `/* blocked */` |
| 危险 API 列表 | 正则匹配 | `eval`, `fetch`, `XMLHttpRequest`, `WebSocket`, `document.cookie`, `window.location`, `localStorage`, `sessionStorage`, `window.open` |
| Markdown 代码块标记 | 自动去除 | ` ```html ` 和 ` ``` ` |
| 普通 HTML/CSS/事件 | 保留 | `onclick`, `style` 等允许 |

---

## 三、文档结构建议

### 推荐的新文档结构

```
docs/
├── README.md                    # 项目概览（精简版）
├── ARCHITECTURE.md              # 架构设计文档
├── API.md                       # API 接口文档
├── SECURITY.md                  # 安全策略文档
├── CONTRIBUTING.md             # 贡献指南
└── plans/
    ├── 2026-02-14-vibeframe-design.md          # 保留原始设计
    └── 2026-02-25-vibeframe-implementation.md   # 保留实施计划
```

### README.md 精简版建议

```markdown
# VibeFrame - 草图即刻化境引擎

> 让想象力即刻变为可交互的现实

## 快速开始

```bash
pnpm install
pnpm dev
```

## 核心功能

- 📸 手绘草图 → 可交互 UI
- 💬 自然语言描述 → 实时生成
- 🎨 四种风格预设（极简白/暗夜模式/毛玻璃/商务蓝）
- 🔄 多轮对话迭代
- 📦 一键导出 HTML

## 技术栈

Next.js 16 | React 19 | TypeScript | Tailwind CSS 4 | OpenAI Compatible API

## 文档

- [架构设计](./docs/ARCHITECTURE.md)
- [API 文档](./docs/API.md)
- [安全策略](./docs/SECURITY.md)
```

---

## 四、总结

| 文档 | 当前状态 | 建议操作 |
|------|---------|---------|
| README.md | 参赛说明完整 | 拆分为项目 README + 技术文档 |
| 设计文档 | 架构详尽 | 更新技术栈版本、补充实际实现的差异 |
| 实施计划 | 已完成 | 可归档或标记为完成状态 |

**优先级：**
1. 高：更新技术栈版本（避免误导新开发者）
2. 中：补充 LLM Provider 统一接口文档
3. 低：重新组织文档结构