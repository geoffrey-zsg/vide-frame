# VibeFrame 完整开发设计文档

> 本文档为 VibeFrame 项目的完整技术设计方案，供后续 AI Coding 工作作为项目指引使用。

## 一、项目概述

**VibeFrame** 是一款基于大模型多模态能力的"交互式线框图即时生成器"。用户上传手绘草图或输入自然语言描述，系统实时将其转换为可交互的现代前端 UI 页面。定位为团队内部需求评审阶段的沟通工具，无需登录，开箱即用。

## 二、技术栈

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

**选型理由：**
- Next.js 将前端页面和 API 代理层合为一个项目，无需 Monorepo，结构简单
- API Routes 原生支持 streaming，适合 LLM 流式输出
- TypeScript 全栈统一，类型定义天然共享
- 本质上是单页应用，页面用 `'use client'` 纯客户端渲染

## 三、支持的 LLM 模型

> **实际实现更新：** 采用统一 OpenAI Compatible API 接口，而非独立适配器。详见下文"模型抽象层设计"。

通过统一抽象层支持多模型切换：

| 模型 | 用途 | 接入方式 |
|------|------|---------|
| OpenAI GPT-4o | 多模态（图像+文字）代码生成 | OpenAI API |
| DeepSeek V3 | 国内网络友好的高质量代码生成 | OpenAI Compatible API |
| OpenRouter | 统一网关，支持多种模型 | OpenAI Compatible API |
| 自定义模型 | 用户自定义 OpenAI Compatible 服务 | 用户配置 Base URL |

API Key 管理策略：用户在设置面板中配置自己的 API Key 和可选的 Base URL。

## 四、项目结构

> **实际实现更新：** 以下为最新项目结构，已包含会话管理等功能。

```
vibe-frame/
├── app/
│   ├── layout.tsx              # 根布局
│   ├── page.tsx                # 主页面
│   ├── api/
│   │   ├── generate/route.ts   # LLM 代码生成接口（流式 SSE）
│   │   └── export/route.ts    # 导出 HTML 接口
│   └── globals.css             # 全局样式 + Tailwind
├── components/
│   ├── InputPanel/             # 左侧面板（图片上传 + 文字输入 + 对话历史）
│   ├── PreviewPanel/           # 右侧预览沙箱（iframe + 骨架屏 + 全屏）
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
│   ├── sanitizer.ts             # HTML 清洗器（安全）
│   ├── sandbox-template.ts     # iframe 沙箱模板
│   ├── session-storage.ts      # 会话持久化
│   ├── model-config.ts         # 模型配置
│   ├── styles.ts               # 风格预设配置
│   └── types.ts                # 类型定义
├── public/
├── .env.local                  # 本地环境变量（API Keys）
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── package.json
```

## 五、核心数据流

```
用户输入（图片 + 文字 + 风格选择）
  → 前端组装请求
  → POST /api/generate（流式 SSE）
  → Prompt 组装器拼接完整 Prompt（系统指令 + 风格 + 技术约束 + 用户输入 + 历史）
  → 模型适配器调用对应 LLM API
  → 流式返回生成的 HTML 代码
  → 前端接收流 → 代码清洗 → postMessage 注入 iframe → 渐进渲染
```

## 六、页面布局设计

整体为左右分栏布局，中间可拖拽分割线，默认比例左 1 : 右 2。

### 左侧面板（InputPanel）

从上到下三个区域：

1. **图片上传区**
   - 支持拖拽上传和点击选择
   - 上传后显示缩略图预览，可删除重新上传
   - 图片在前端转为 base64 传给 API

2. **风格选择器**
   - 一排可点击的风格卡片
   - 四种预设：极简白 / 暗黑模式 / 毛玻璃风 / 商务蓝
   - 选中状态高亮，默认选中"极简白"

3. **文字输入 + 对话区**
   - 输入框带发送按钮和麦克风按钮（语音输入）
   - 上方显示对话历史（用户指令 + 系统反馈），滚动查看
   - 快捷键：Enter 发送，Shift+Enter 换行
   - 语音输入使用浏览器原生 Web Speech API（MVP 方案，后续可替换）

### 右侧面板（PreviewPanel）

1. **顶部工具栏**
   - 刷新按钮：手动重新渲染
   - 导出 HTML 按钮
   - 状态指示器：生成中 / 已完成 / 错误

2. **iframe 沙箱主体**
   - 通过 `srcdoc` 注入生成的 HTML
   - `sandbox` 属性控制权限

3. **骨架屏**
   - 流式渲染出错时自动切换
   - 显示友好的错误提示

4. **元素点选交互层**
   - 透明覆盖层捕获点击事件
   - 点击后高亮该元素
   - 自动将元素描述填入对话输入框

### SplitPane 可拖拽分割线

- 默认左 1 : 右 2
- 最小宽度限制，防止拖到极端位置
- 拖拽时对 iframe 加透明遮罩层（防止 iframe 吞掉鼠标事件）

## 七、模型抽象层设计

> **实际实现更新：** 采用统一 OpenAI Compatible API 接口，而非独立适配器。

### 统一接口设计

```typescript
interface LLMProvider {
  name: string;
  supportsVision: boolean;
  generate(params: {
    image?: string;       // base64 图片
    prompt: string;       // 用户文字描述
    systemPrompt: string; // 系统 Prompt（含风格指令）
    history: Message[];   // 多轮对话历史
  }): AsyncIterable<string>;  // 流式返回
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}
```

### 工厂函数实现

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

### 架构示意

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

**优势：**
- 单一适配器实现，维护成本 O(n) → O(1)
- 用户可自定义任意 OpenAI Compatible 服务
- 预设配置简化常见场景

### Prompt 组装器

组装器根据用户输入拼接最终发给 LLM 的 Prompt，包含以下要素：

1. **系统角色设定** — "你是一个前端 UI 生成专家，只输出完整的 HTML 代码"
2. **风格指令** — 根据用户选择的风格预设注入对应描述
3. **技术约束** — "使用 TailwindCSS CDN，代码必须是自包含的单文件 HTML，响应式布局"
4. **用户输入** — 图片（作为 vision 输入）+ 文字描述
5. **对话历史** — 多轮迭代时，携带之前的对话记录和已生成的代码
6. **元素上下文** — 如果用户通过点选定位了元素，附加元素描述信息

### 四种风格预设

| 风格 ID | 名称 | 描述 |
|---------|------|------|
| minimal | 极简白 | 白色背景、大量留白、细线条、无阴影 |
| dark | 暗黑模式 | 深色背景、柔和高亮、微妙渐变 |
| glass | 毛玻璃风 | 半透明磨砂效果、模糊背景、柔和边框 |
| corporate | 商务蓝 | 蓝白主色调、专业感、清晰的信息层级 |

风格定义为配置化数据，后续新增风格只需加配置，不改代码。

## 八、iframe 沙箱通信机制

主应用与 iframe 通过 `postMessage` 通信，定义统一消息协议：

### 主应用 → iframe

```typescript
type HostMessage =
  | { type: 'render'; html: string }           // 注入/更新完整 HTML
  | { type: 'render-chunk'; chunk: string }     // 流式追加 HTML 片段
  | { type: 'render-complete' }                 // 流式结束信号
  | { type: 'highlight'; selector: string }     // 高亮某个元素
  | { type: 'clear-highlight' }                 // 清除高亮
```

### iframe → 主应用

```typescript
type SandboxMessage =
  | { type: 'element-clicked'; info: ElementInfo }  // 用户点击了某元素
  | { type: 'render-error'; error: string }          // 渲染出错
  | { type: 'ready' }                                // iframe 加载就绪
```

### 流式渲染实现

1. iframe 内预加载基础 HTML 模板（含 TailwindCSS CDN 引用）
2. 主应用收到 LLM 流式输出后，逐块通过 `render-chunk` 发给 iframe
3. iframe 内部容器 div 每收到 chunk 就追加 innerHTML
4. 收到 `render-complete` 后做一次完整的 DOM 修正（处理未闭合标签等）
5. 过程中如果 iframe 内 JS 报错，捕获后通过 `render-error` 通知主应用切换骨架屏

### 元素点选实现

1. iframe 内注入监听脚本，捕获所有元素的 click 事件
2. 点击时收集元素信息：标签名、文本内容、CSS 类名、DOM 位置描述
3. 通过 `element-clicked` 回传给主应用
4. 主应用生成自然语言描述（如"页面顶部导航栏中的第二个按钮"）自动填入输入框

## 九、安全策略

> **详细文档：** 参见 [SECURITY.md](./SECURITY.md)

整体原则：多层防御，允许基本交互能力，防住明显危险行为。

### 三层防御架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Layer 1: 服务端清洗                       │
│  sanitizeHTML() 剥离危险代码、白名单过滤外部脚本              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Layer 2: iframe 沙箱隔离                   │
│  sandbox="allow-scripts" 禁止导航、表单、弹窗                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Layer 3: 白名单 CDN                        │
│  只允许 tailwindcss.com、unpkg.com、jsdelivr.net            │
└─────────────────────────────────────────────────────────────┘
```

### 代码清洗器规则

**禁止的内容：**
- 外部脚本引入（`<script src="...">`）— 白名单除外
- 网络请求类 API（`fetch`、`XMLHttpRequest`、`WebSocket`）
- 危险 DOM 操作（`document.cookie`、`localStorage`、`window.location`）
- `eval()`、`Function()` 等动态执行
- Markdown 代码块标记（` ```html `）

**允许的内容：**
- 内联 `<script>` 中的简单交互逻辑（tab 切换、下拉菜单等）
- CSS 动画和过渡效果
- TailwindCSS CDN 引用（白名单域名）
- 图片引用（`<img>` 标签）

### iframe 沙箱配置

```tsx
<iframe sandbox="allow-scripts" srcDoc={getSandboxTemplate()} />
```

**权限设置：**
- ✅ `allow-scripts`：Tailwind CSS 需要
- ❌ `allow-same-origin`：阻止访问主应用 DOM/Cookie
- ❌ `allow-forms`：阻止表单提交
- ❌ `allow-popups`：阻止弹窗

### 错误处理策略

| 场景 | 处理方式 |
|------|---------|
| LLM API 调用失败 | 前端提示错误信息 + 重试按钮 |
| LLM 返回非 HTML 内容 | Prompt 强约束输出格式，后端格式校验，不合格自动重试一次 |
| 流式渲染中途断开 | 保留已渲染内容，显示"生成中断"提示 + 刷新按钮 |

## 十、API 接口设计

### 1. POST /api/generate — 核心生成接口（流式 SSE）

**请求体：**

```typescript
{
  image?: string;          // base64 编码的草图图片
  prompt: string;          // 用户文字描述
  style: string;           // 风格预设 ID（minimal / dark / glass / corporate）
  history: Message[];      // 对话历史
  model: string;           // 模型标识（gpt-4o / claude-sonnet / qwen-vl）
  apiKey?: string;         // 用户自定义 API Key（可选，覆盖服务端配置）
  elementContext?: string; // 点选元素的上下文描述（可选）
}
```

**响应：** SSE 流，每个事件为一段 HTML 代码片段。流结束后发送 `[DONE]` 信号。

### 2. GET /api/models — 获取可用模型列表

**响应：**

```typescript
{
  models: [
    { id: 'gpt-4o', name: 'GPT-4o', available: boolean },
    { id: 'claude-sonnet', name: 'Claude Sonnet', available: boolean },
    { id: 'qwen-vl', name: '通义千问 VL', available: boolean }
  ]
}
```

通过检测环境变量中是否配置了对应 Key 来判断 `available` 状态。

### 3. POST /api/export — 导出 HTML

**请求体：** 当前 iframe 中的完整 HTML 代码。

**响应：** 经过最终清洗和格式化的 `.html` 文件下载。

## 十一、部署方案

### 本地开发

```bash
pnpm install
pnpm dev          # Next.js 开发服务器，默认 3000 端口
```

环境变量通过 `.env.local` 管理：

```env
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
QWEN_API_KEY=sk-xxx
```

### Docker 部署

**Dockerfile（多阶段构建）：**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

**docker-compose.yml：**

```yaml
services:
  vibe-frame:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.production
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - vibe-frame
```

一条命令部署：`docker compose up -d`

**Nginx 职责：** 反向代理到 Next.js 服务、静态资源缓存、后续可加 HTTPS 和限流。

## 十二、后续考虑项（MVP 之外）

以下功能 MVP 阶段不实现，但设计时预留扩展空间：

### 1. 版本回滚 / 时间机器
- 每次用户确认满意的结果，存储快照（HTML + 对话上下文）
- 可视化版本列表，点击切回任意历史版本
- 实现思路：前端状态数组保存，或后端持久化到文件/数据库

### 2. 元素点选属性面板
- 点选元素后弹出属性编辑面板（颜色、字号、边距、圆角等）
- 直接调参数，系统翻译为 CSS 变更注入 iframe，无需走 LLM

### 3. 更多风格预设
- 风格配置化存储，新增风格只需加配置文件
- 可考虑：赛博朋克、新拟态、渐变彩色等

### 4. 更多导出格式
- React / Vue 组件代码导出
- 截图导出（PNG / PDF）
- Figma 插件联动

### 5. 多人协作
- WebSocket 实时同步
- 评论标注功能

### 6. 登录与权限
- 用户认证（如需对外开放）
- API 调用量限制

### 7. 语音识别升级
- 替换浏览器原生 Web Speech API 为 OpenAI Whisper 或讯飞等第三方服务
- 提升识别准确率
