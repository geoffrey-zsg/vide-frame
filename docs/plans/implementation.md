# VibeFrame 实施计划

> **状态：** ✅ 已完成（2026-02-26）
>
> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 构建一个交互式线框图生成器，通过 LLM 多模态能力将草图/文字描述转换为可交互的 Web 页面。

**架构：** Next.js 全栈单页应用。左侧输入面板 + 右侧 iframe 预览沙箱。API Routes 做 LLM 流式代理。统一使用 OpenAI Compatible Provider 接口。生成的 HTML 经清洗后通过 postMessage 注入 iframe 渲染。

**技术栈：** Next.js 16 (App Router)、React 19、TypeScript 5、Tailwind CSS 4、Vitest 4

**设计文档：** `docs/plans/design.md`

**实施变更说明：**
- LLM Provider 从多适配器改为统一 OpenAI Compatible API
- 新增会话管理功能（localStorage 持久化）
- 新增全屏预览功能

---

## 阶段一：项目初始化

### 任务 1：初始化 Next.js 项目

**涉及文件：** `package.json`、`tsconfig.json`、`next.config.ts`、`tailwind.config.ts`、`app/layout.tsx`、`app/page.tsx`、`app/globals.css`、`.env.local.example`、`vitest.config.ts`

**步骤 1：创建项目**

```bash
cd C:\workspace\vibecoding\claude\vibe-frame
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack
```

**步骤 2：安装依赖**

```bash
pnpm add openai @anthropic-ai/sdk
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**步骤 3：配置 Vitest**

创建 `vitest.config.ts`：配置 jsdom 环境、React 插件、`@/` 路径别名。
创建 `vitest.setup.ts`：引入 `@testing-library/jest-dom/vitest`。
在 `package.json` 中添加 `"test": "vitest"` 和 `"test:run": "vitest run"`。

**步骤 4：创建环境变量示例**

创建 `.env.local.example`，包含三个 Key：`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`QWEN_API_KEY`。
`.gitignore` 中追加 `.env.local` 和 `.env.production`。

**步骤 5：验证**

运行 `pnpm dev` 确认启动正常，运行 `pnpm test:run` 确认 Vitest 可用。

**步骤 6：提交**

```bash
git init && git add . && git commit -m "chore: initialize Next.js project with TypeScript, TailwindCSS, Vitest"
```

---

## 阶段二：核心类型与配置

### 任务 2：定义核心 TypeScript 类型

**涉及文件：** 创建 `lib/types.ts`，测试 `lib/__tests__/types.test.ts`

定义以下类型（TDD：先写类型验证测试，再写类型定义）：

```typescript
// 对话消息
interface Message { role: 'user' | 'assistant'; content: string; image?: string }

// LLM 生成参数
interface GenerateParams { image?: string; prompt: string; systemPrompt: string; history: Message[] }

// LLM Provider 接口
interface LLMProvider {
  name: string
  supportsVision: boolean
  generate(params: GenerateParams): AsyncIterable<string>
}

// 风格预设
type StyleId = 'minimal' | 'dark' | 'glass' | 'corporate'
interface StylePreset { id: StyleId; name: string; description: string; promptInstruction: string; previewColors: { bg: string; fg: string; accent: string } }

// API 请求
interface GenerateRequest { image?: string; prompt: string; style: StyleId; history: Message[]; model: string; apiKey?: string; elementContext?: string }
interface ModelInfo { id: string; name: string; available: boolean }

// iframe 通信协议
type HostMessage = { type: 'render'; html: string } | { type: 'render-chunk'; chunk: string } | { type: 'render-complete' } | { type: 'highlight'; selector: string } | { type: 'clear-highlight' }
interface ElementInfo { tagName: string; textContent: string; className: string; positionDescription: string }
type SandboxMessage = { type: 'element-clicked'; info: ElementInfo } | { type: 'render-error'; error: string } | { type: 'ready' }
```

---

### 任务 3：风格预设配置

**涉及文件：** 创建 `lib/styles.ts`，测试 `lib/__tests__/styles.test.ts`

TDD 流程：先写测试验证 4 个预设存在、字段完整、`getStyleById` 查询正确。

实现 `stylePresets` 数组和 `getStyleById()` 函数，包含 4 种风格：

| ID | 名称 | 核心特征 |
|----|------|---------|
| `minimal` | 极简白 | 白色背景、大留白、细线条、无阴影 |
| `dark` | 暗黑模式 | 深色渐变背景、柔和高亮、蓝色主色 |
| `glass` | 毛玻璃风 | 半透明磨砂、backdrop-blur、渐变底色 |
| `corporate` | 商务蓝 | 蓝白主色调、清晰层级、专业排版 |

每个预设包含：`promptInstruction`（给 LLM 的英文样式指令）、`previewColors`（预览色块的 bg/fg/accent）。

---

### 任务 4：代码清洗器

**涉及文件：** 创建 `lib/sanitizer.ts`，测试 `lib/__tests__/sanitizer.test.ts`

TDD 流程：先写 11 个测试用例覆盖所有规则，再实现。

**清洗规则：**

| 规则 | 处理方式 |
|------|---------|
| 外部 `<script src="...">` | 非白名单域名则移除 |
| 白名单 CDN（tailwindcss.com、unpkg.com、jsdelivr.net） | 保留 |
| 内联 `<script>` 中的危险 API | 正则替换为 `/* blocked */` |
| 危险 API 列表 | `fetch`、`XMLHttpRequest`、`WebSocket`、`eval`、`new Function`、`document.cookie`、`window.location`、`localStorage`、`sessionStorage`、`window.open` |
| 普通 HTML + CSS + `<img>` | 保留 |
| 内联事件（onclick 等） | 保留（允许简单交互） |

---

### 任务 5：Prompt 组装器

**涉及文件：** 创建 `lib/prompt/templates.ts`、`lib/prompt/assembler.ts`，测试 `lib/__tests__/prompt.test.ts`

TDD 流程：先写 6 个测试，再实现。

**`templates.ts`** 包含：
- `BASE_SYSTEM_TEMPLATE`：系统角色（前端 UI 专家）、8 条核心规则（只输出 HTML、使用 TailwindCSS CDN、完整文档结构、响应式、中文内容等）、`{styleInstruction}` 占位符
- `ITERATION_SYSTEM_ADDENDUM`：迭代修改时的追加指令（只改用户要求的部分，输出完整 HTML）

**`assembler.ts`** 导出：
- `buildSystemPrompt(styleId, isIteration?)`：拼接基础模板 + 风格指令 + 迭代追加
- `buildUserPrompt({ prompt, elementContext? })`：拼接用户文字，如有元素上下文则附加

---

## 阶段三：LLM 适配器

### 任务 6：Provider 工厂与 Stub 适配器

**涉及文件：** 创建 `lib/llm/provider.ts`、`lib/llm/openai.ts`、`lib/llm/claude.ts`、`lib/llm/qwen.ts`，测试 `lib/__tests__/llm-provider.test.ts`

TDD 流程：先写工厂测试（未知模型抛错、有效模型返回实例、`getAvailableModels` 返回列表），再实现。

**`provider.ts`** 核心逻辑：
- `MODEL_DEFINITIONS` 数组：每个模型的 `id`、`name`、`envKey`（环境变量名）、`factory` 函数
- `getLLMProvider(modelId, userApiKey?)`：查找模型定义，优先使用 userApiKey，否则读环境变量
- `getAvailableModels()`：遍历定义，通过 `process.env[envKey]` 判断 available

三个适配器先写 stub（`throw new Error('Not implemented')`），后续任务逐一实现。

---

### 任务 7：OpenAI GPT-4o 适配器

**涉及文件：** 修改 `lib/llm/openai.ts`，测试 `lib/__tests__/openai.test.ts`

使用 `openai` 包。实现要点：
- 构造 messages 数组：system prompt → 历史消息 → 当前用户消息
- 图片以 `data:image/png;base64,{base64}` 格式作为 `image_url` 传入
- 调用 `client.chat.completions.create({ model: 'gpt-4o', stream: true, max_tokens: 16384 })`
- 用 `async *generate()` 逐块 yield `chunk.choices[0].delta.content`

---

### 任务 8：Claude Sonnet 适配器

**涉及文件：** 修改 `lib/llm/claude.ts`

使用 `@anthropic-ai/sdk`。实现要点：
- system prompt 通过 `system` 参数传入（不在 messages 中）
- 图片以 `{ type: 'image', source: { type: 'base64', media_type: 'image/png', data } }` 格式传入
- 调用 `client.messages.stream({ model: 'claude-sonnet-4-20250514', max_tokens: 16384 })`
- 监听 `content_block_delta` 事件中 `text_delta` 类型，yield 文本

---

### 任务 9：通义千问 VL 适配器

**涉及文件：** 修改 `lib/llm/qwen.ts`

通义千问使用 OpenAI 兼容 API，复用 `openai` 包：
- `baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'`
- `model: 'qwen-vl-max'`
- 消息格式与 OpenAI 适配器相同

---

## 阶段四：API 路由

### 任务 10：GET /api/models

**涉及文件：** 创建 `app/api/models/route.ts`

调用 `getAvailableModels()` 返回 JSON `{ models: [...] }`。

---

### 任务 11：POST /api/generate（流式 SSE）

**涉及文件：** 创建 `app/api/generate/route.ts`

核心流程：
1. 解析请求体（`GenerateRequest` 类型）
2. 校验：`prompt` 或 `image` 至少有一个
3. 根据 `model` 获取 Provider，根据 `style` 和 `history.length > 0` 构建 system prompt
4. 调用 `provider.generate()` 获取流
5. 创建 `ReadableStream`，逐块发送 SSE 事件 `data: {"chunk":"..."}`
6. 流结束后发送最终事件 `data: {"done":true,"html":"<sanitized full html>"}`
7. 出错发送 `data: {"error":"..."}`
8. 响应头：`Content-Type: text/event-stream`、`Cache-Control: no-cache`

---

### 任务 12：POST /api/export

**涉及文件：** 创建 `app/api/export/route.ts`

接收 `{ html: string }`，经 `sanitizeHTML()` 清洗后返回 `.html` 文件下载（`Content-Disposition: attachment`）。

---

## 阶段五：前端组件

### 任务 13：SplitPane 可拖拽分割组件

**涉及文件：** 创建 `components/SplitPane/SplitPane.tsx`、`components/SplitPane/index.ts`

Props：`left`、`right`（ReactNode）、`defaultRatio`（默认 0.33）、`minLeftWidth`（320px）、`minRightWidth`（400px）。

实现要点：
- 用 `useRef` 获取容器宽度，`useState` 管理当前比例
- mousedown 在分割线上开始拖拽，mousemove 计算新比例（限制在 min/max 范围内），mouseup 停止
- 拖拽时右侧面板加透明遮罩，防止 iframe 吞掉鼠标事件
- 分割线 hover 变蓝色，拖拽中保持高亮

---

### 任务 14：StyleSelector 风格选择组件

**涉及文件：** 创建 `components/StyleSelector/StyleSelector.tsx`、`components/StyleSelector/index.ts`

Props：`value: StyleId`、`onChange: (style: StyleId) => void`。

渲染一排横向排列的风格卡片按钮，每个展示 3 个色块预览圆点 + 风格名称。选中状态蓝色边框高亮。

---

### 任务 15：InputPanel 左侧输入面板

**涉及文件：** 创建 `components/InputPanel/` 目录下的 `InputPanel.tsx`、`ImageUpload.tsx`、`ChatArea.tsx`、`index.ts`

**ImageUpload 组件：**
- 支持拖拽上传和点击选择，`accept="image/*"`
- 用 FileReader 转 base64
- 已上传时显示缩略图 + 删除按钮

**ChatArea 组件：**
- 上方消息历史列表（用户消息蓝底靠右、助手消息灰底靠左），自动滚动到底
- 下方输入区：textarea + 麦克风按钮 + 发送按钮
- Enter 发送、Shift+Enter 换行
- 语音输入用浏览器原生 `webkitSpeechRecognition`（`lang: 'zh-CN'`）
- 监听 `fill-input` 自定义事件，用于元素点选时自动填入文字

**InputPanel 容器：**
- 从上到下：标题栏 → ImageUpload → StyleSelector → ChatArea

---

### 任务 16：PreviewPanel 右侧预览面板

**涉及文件：** 创建 `components/PreviewPanel/` 目录、创建 `lib/sandbox-template.ts`

**`lib/sandbox-template.ts`：**
`getSandboxTemplate()` 返回 iframe 内的基础 HTML 模板，包含：
- TailwindCSS CDN 引用
- `.vf-highlight` 高亮样式
- `postMessage` 监听器：处理 `render`、`render-chunk`、`render-complete`、`highlight`、`clear-highlight`
- 元素点击捕获：收集 tagName、textContent、className、位置描述，回传 `element-clicked`
- 加载完成后发送 `ready` 消息

**Skeleton 组件：**
- 无内容时显示脉冲动画骨架屏
- 有错误时显示红色错误提示

**PreviewPanel 组件：**
- 顶部工具栏：状态指示器（生成中/已完成/错误）、刷新按钮、导出 HTML 按钮
- 主体：iframe（`sandbox="allow-scripts"`，`srcDoc` 为沙箱模板）
- 通过 `window.__vibeframe_sendChunk` / `__vibeframe_sendComplete` 暴露流式控制方法给主页面
- 监听 iframe 的 postMessage：ready / render-error / element-clicked

---

### 任务 17：SettingsDialog 设置弹窗

**涉及文件：** 创建 `components/SettingsDialog/SettingsDialog.tsx`、`components/SettingsDialog/index.ts`

模态弹窗，包含：
- 模型选择下拉框（从 `availableModels` 渲染，未配置的标注"(未配置)"）
- 自定义 API Key 输入框（`type="password"`，placeholder 提示留空使用服务端默认）
- 取消 / 保存按钮

---

## 阶段六：主页面集成

### 任务 18：串联所有组件

**涉及文件：** 修改 `app/page.tsx`、`app/layout.tsx`、`app/globals.css`

**`globals.css`：** 只保留 Tailwind 三行指令 + `html, body { height: 100%; margin: 0; overflow: hidden; }`

**`layout.tsx`：** 设置 `<html lang="zh-CN">`、metadata title/description

**`page.tsx` 核心状态：**
- `image`、`style`、`messages`、`currentHTML`、`isGenerating`
- `settings`（model + customApiKey）、`availableModels`

**核心逻辑：**
1. mount 时 `fetch('/api/models')` 获取可用模型，自动选第一个可用的
2. `handleSend(text)`: 拼装请求 → `fetch('/api/generate')` → 读取 SSE 流 → 逐块调用 `__vibeframe_sendChunk` → 完成后更新 `currentHTML` 和 `messages` → 调用 `__vibeframe_sendComplete`
3. `handleElementClick(info)`: 将元素位置描述通过 `CustomEvent('fill-input')` 填入输入框
4. `handleExport()`: `fetch('/api/export')` 下载文件
5. `handleRefresh()`: 重新向 iframe postMessage render 当前 HTML

**页面结构：** 设置齿轮按钮（固定右上角） + `SplitPane(left=InputPanel, right=PreviewPanel)` + `SettingsDialog`

**验证：** `pnpm dev` 启动正常 + `pnpm test:run` 全部通过

---

## 阶段七：部署配置

### 任务 19：Docker + Nginx

**涉及文件：** 创建 `Dockerfile`、`docker-compose.yml`、`nginx.conf`、`.env.production.example`，修改 `next.config.ts`

**`next.config.ts`：** 添加 `output: 'standalone'`

**`Dockerfile`：** 四阶段构建
1. `base`：node:20-alpine + corepack enable
2. `deps`：安装依赖（pnpm install --frozen-lockfile）
3. `builder`：构建（pnpm build）
4. `runner`：只拷贝 standalone 产物 + static + public，以 nextjs 用户运行

**`docker-compose.yml`：** 两个服务
- `vibe-frame`：构建应用，端口 3000，读取 `.env.production`
- `nginx`：alpine 镜像，端口 80，挂载 `nginx.conf`

**`nginx.conf`：** 反向代理到 `vibe-frame:3000`，开启 gzip，关闭 proxy_buffering（SSE 支持），read_timeout 300s

部署命令：`docker compose up -d`

---

## 阶段八：最终验证

### 任务 20：完整冒烟测试

1. 运行 `pnpm test:run`，全部通过
2. 运行 `pnpm dev`，浏览器访问 http://localhost:3000
3. 人工检查清单：
   - [ ] 可拖拽分割线正常工作
   - [ ] 图片上传（拖拽 + 点击）
   - [ ] 四种风格选择高亮切换
   - [ ] 设置弹窗打开/保存
   - [ ] 输入文字后发送，右侧流式渲染
   - [ ] 渲染完成后导出 HTML 下载
   - [ ] 刷新按钮重新渲染
4. 运行 `pnpm lint`，无错误

---

## 任务总览

| 阶段 | 任务 | 内容 |
|------|------|------|
| 一：初始化 | 任务 1 | 创建 Next.js 项目 + 依赖 + Vitest |
| 二：核心模块 | 任务 2-5 | 类型定义、风格预设、代码清洗器、Prompt 组装器 |
| 三：LLM 适配器 | 任务 6-9 | Provider 工厂 + OpenAI / Claude / 通义千问适配器 |
| 四：API 路由 | 任务 10-12 | /api/models、/api/generate（SSE）、/api/export |
| 五：前端组件 | 任务 13-17 | SplitPane、StyleSelector、InputPanel、PreviewPanel、SettingsDialog |
| 六：集成 | 任务 18 | 主页面串联所有组件 |
| 七：部署 | 任务 19 | Docker + Nginx 配置 |
| 八：验证 | 任务 20 | 全量测试 + 冒烟测试 |

共 **20 个任务**，遵循 TDD 流程，频繁提交。
