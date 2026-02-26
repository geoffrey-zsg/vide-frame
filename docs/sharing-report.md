# VibeFrame 项目复盘：Claude Code 实战经验分享

> **分享人：** 项目开发者
> **时间：** 2026-02-26
> **主题：** 七大领域的 Agentic Coding 实践案例

---

## 项目背景

**VibeFrame** 是一款基于 LLM 多模态能力的交互式线框图即时生成器。用户上传手绘草图或输入自然语言描述，系统实时生成可交互的前端 UI 页面。

**技术栈：** Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + OpenAI Compatible API

---

## 一、需求理解领域

### 案例从 "乱码草图" 到 "标准控件" 的 Prompt 设计

**背景：** 用户上传的手绘草图往往潦草、模糊，如何让 LLM 正确识别其中的 UI 元素？

**Claude Code 实践：**

在设计 Prompt 模板时，我没有泛泛地说"识别 UI 组件"，而是与 Claude 协作明确了具体的识别策略：

```typescript
// lib/prompt/templates.ts
export const BASE_SYSTEM_TEMPLATE = `你是一名前端 UI 专家，擅长使用 HTML 和 TailwindCSS 构建精美的网页界面。

核心设计准则：
1. **视觉层次 (Visual Hierarchy)**：使用不同的字号、字重、颜色深浅和留白来区分内容优先级。
2. **现代美学 (Modern Aesthetics)**：
   - 优先使用大圆角（如 rounded-2xl, rounded-3xl）。
   - 使用柔和的阴影（shadow-sm, shadow-md, shadow-lg）和细边框（border-slate-100）。
   - 确保充足的内边距（Padding）和外边距（Margin），让内容有"呼吸感"。
...`;
```

**关键洞察：** Claude Code 帮助我将模糊的需求（"生成好看的 UI"）拆解为可执行的规则（圆角尺寸、阴影级别、间距规范），这些规则直接编码到 System Prompt 中，确保生成结果的一致性。

**Git 提交：** `b5b5d67 feat: add StyleSelector component with 4 style presets`

---

## 二、架构设计领域

### 案例：iframe 沙箱隔离方案

**背景：** 用户输入和 LLM 输出都需要在页面上渲染，但直接在主 DOM 中渲染 AI 生成的 HTML 会导致样式污染、脚本冲突甚至应用崩溃。

**决策过程：**

Claude Code 提出了三种方案的对比分析：

| 方案 | 优点 | 缺点 |
|------|------|------|
| 直接 innerHTML | 简单 | 样式污染、脚本执行风险 |
| Shadow DOM | 样式隔离 | 脚本仍可访问主 DOM |
| **iframe 沙箱** | 完全隔离 | 通信复杂度增加 |

**最终实现：**

```typescript
// lib/sandbox-template.ts
<iframe
  sandbox="allow-scripts"
  srcDoc={getSandboxTemplate()}
/>
```

关键设计：
1. `sandbox="allow-scripts"` 限制权限，禁止弹窗、表单提交、导航跳转
2. 通过 `postMessage` 实现主应用与 iframe 的双向通信
3. 服务端清洗器（`sanitizeHTML`）在注入前剥离危险代码

**Git 提交：** `ede625a feat: add PreviewPanel with iframe sandbox, skeleton screen, and element selection`

**收获：** Claude Code 不是简单地给出方案，而是帮助我理解了每种方案的权衡，最终选择了安全性最高的 iframe 方案。

---

## 三、编码领域

### 案例LLM Provider 工厂模式的演进

**背景：** 最初设计时，计划为 OpenAI、Claude、通义千问分别编写适配器。

**第一版设计（按文档）：**
```
lib/llm/
├── provider.ts    # 工厂函数
├── openai.ts      # OpenAI 适配器
├── claude.ts      # Claude 适配器
└── qwen.ts        # 通义千问适配器
```

**Claude Code 建议：** 多数国内模型和 OpenRouter 都支持 OpenAI Compatible API，可以统一实现。

**最终实现：**

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
- 单一适配器实现，维护成本降低
- 用户可自定义任意 OpenAI Compatible 服务
- 预设配置简化常见场景

**Git 提交：** `b1da049 feat: 重构配置系统支持自定义 OpenAI Compatible API，修复流式渲染问题`

---

## 四、Code Review 领域

### 案例：Markdown 代码块标记的自动处理

**问题发现：** LLM 有时会在输出前后添加 Markdown 代码块标记（` ```html ` 和 ` ``` `），导致渲染失败。

**Claude Code 的 Review 发现：**

```
问题：生成的 HTML 被 markdown 代码块标记包裹
原因：LLM 有时会"顺便"输出代码块格式
影响：iframe 无法正确解析 HTML
```

**解决方案：**

```typescript
// lib/sanitizer.ts
function stripMarkdownCodeBlocks(html: string): string {
  let result = html.trim();
  // Remove leading code block markers (```html, ```HTML, ```)
  result = result.replace(/^```(?:html|HTML)?\s*\n?/i, '');
  // Remove trailing code block markers
  result = result.replace(/\n?```\s*$/i, '');
  return result.trim();
}
```

**测试覆盖：**

```typescript
// lib/__tests__/sanitizer.test.ts
it('should strip leading ```html code block marker', () => {
  const input = '```html\n<!DOCTYPE html><html><body>Hello</body></html>';
  const result = sanitizeHTML(input);
  expect(result).not.toContain('```');
  expect(result).toContain('<!DOCTYPE html>');
});
```

**收获：** Claude Code 在 Review 阶段不仅发现问题，还主动提供了测试用例，确保修复可验证。

---

## 五、测试领域

### 案例：TDD 驱动的安全清洗器开发

**背景：** 清洗器是安全核心模块，必须确保所有危险模式被正确处理。

**Claude Code 实践：** 先写测试，再写实现。

```typescript
// lib/__tests__/sanitizer.test.ts
describe('sanitizeHTML', () => {
  it('should strip external script tags with non-whitelisted src', () => {...});
  it('should allow TailwindCSS CDN script tag', () => {...});
  it('should strip fetch calls inside inline script', () => {...});
  it('should strip eval()', () => {...});
  it('should strip document.cookie access', () => {...});
  it('should strip window.location manipulation', () => {...});
  it('should strip WebSocket usage inside inline script', () => {...});
  // ... 共 15 个测试用例
});
```

**实现对应测试：**

```typescript
// lib/sanitizer.ts
const DANGEROUS_PATTERNS: RegExp[] = [
  /\bfetch\s*\(/g,
  /\bXMLHttpRequest\b/g,
  /\bWebSocket\b/g,
  /\beval\s*\(/g,
  /\bnew\s+Function\s*\(/g,
  /\bdocument\.cookie\b/g,
  /\bwindow\.location\b/g,
  /\blocalStorage\b/g,
  /\bsessionStorage\b/g,
  /\bwindow\.open\s*\(/g,
];
```

**Git 提交：** `14430ba feat: add POST /api/generate streaming SSE route`（包含清洗器和测试）

**验证命令：** `pnpm test:run`

---

## 六、安全领域

### 案例：多层防御的 XSS 防护体系

**安全威胁：** 用户可以通过 AI 生成的代码注入恶意脚本。

**Claude Code 设计的三层防御：**

```
┌─────────────────────────────────────────────────────────────┐
│                     Layer 1: 服务端清洗                       │
│  sanitizeHTML() 在 API Route 中执行，剥离危险代码              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Layer 2: iframe 沙箱隔离                   │
│  sandbox="allow-scripts" 限制权限，禁止导航、表单、弹窗         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     Layer 3: 白名单 CDN                        │
│  只允许 tailwindcss.com、unpkg.com、jsdelivr.net 的外部脚本   │
└─────────────────────────────────────────────────────────────┘
```

**关键代码：**

```typescript
// Layer 1: 服务端清洗
const sanitized = sanitizeHTML(fullHTML);
const doneEvent = `data: ${JSON.stringify({ done: true, html: sanitized })}\n\n`;

// Layer 2: iframe 沙箱
<iframe sandbox="allow-scripts" srcDoc={getSandboxTemplate()} />

// Layer 3: 白名单 CDN
const WHITELISTED_CDNS = [
  'cdn.tailwindcss.com',
  'unpkg.com',
  'cdn.jsdelivr.net',
];
```

**安全测试覆盖：** 15 个测试用例覆盖各种攻击向量

---

## 七、版本管理领域

### 案例：语义化提交与功能迭代

**Claude Code 实践：** 每个功能模块完成后自动生成语义化提交信息。

**提交历史分析：**

```bash
$ git log --oneline -10
b1da049 feat: 重构配置系统支持自定义 OpenAI Compatible API，修复流式渲染问题
6c5accc feat: 进一步优化交互体验与生成效果
75f46c1 style: 按照 UI/UX 优化文档完成全站样式深度重构
5daf594 fix: beautify StyleSelector with custom dropdown, fix session history clipping
4307b0f fix: localize style names to Chinese, fix session dropdown clipping
d67c16a feat: add session history, UI improvements
8621c6b chore: add screenshots and Windows nul artifact to .gitignore
c016d3a feat: add DeepSeek V3 model support and refine LLM provider architecture
84390dc feat: add OpenRouter support as unified LLM gateway
...
```

**提交规范：**
- `feat:` 新功能
- `fix:` Bug 修复
- `style:` 样式调整
- `chore:` 杂项

**收获：** 清晰的提交历史使得代码审查和问题追溯变得简单。每个提交都是一个独立可验证的功能单元。

---

## 八、加分项：SKILL 工程实践

### 案例：`superpowers:systematic-debugging` 的应用

**场景：** 流式渲染时，首屏内容不显示，需要刷新才能看到。

**使用 SKILL：** `superpowers:systematic-debugging`

**调试过程：**

1. **问题定位：**
   - Claude Code 分析了 iframe 通信协议
   - 发现 `render-chunk` 消息发送了，但 iframe 没有立即渲染

2. **根因分析：**
   - iframe 内的渲染逻辑使用了 300ms 节流
   - 首个 chunk 也被节流，导致用户感知延迟

3. **修复方案：**
```typescript
// lib/sandbox-template.ts
case 'render-chunk':
  chunks += msg.chunk;
  if (isFirstChunk) {
    // 首个 chunk 立即渲染，避免用户感觉卡顿
    isFirstChunk = false;
    renderNow();  // 改为立即渲染
  } else {
    scheduleRender();  // 后续 chunk 节流
  }
  break;
```

**Git 提交：** `b1da049` 中包含此修复

---

## 九、加分项：CLAUDE.md 协作宪法

### 项目定制化 AI 协作规范

**CLAUDE.md 核心内容：**

```markdown
## 身份
你是 VibeFrame（草图即刻化境引擎）项目的核心开发者。每次回复时叫我 **长官**。

## 核心原则
- **KISS**：优先清晰可维护，避免过度工程化与无意义防御
- **第一性原理**：先拆需求与约束再实现
- **事实为本**：不臆测，信息不足则标注假设或提关键问题

## 红线（必须遵守）
- 禁止 copy-paste 造成重复代码（优先抽函数/模块/复用组件）
- 禁止破坏现有功能（改动必须可验证，必要时补回归点）
- 关键路径必须有错误处理

## 开工前三问
1. 这是真问题还是臆想？（拒绝过度设计）
2. 有现成代码/库/组件可复用吗？（优先复用）
3. 会破坏什么调用关系/接口契约吗？（保护依赖链）
```

**效果：**
- Claude Code 的输出更符合项目风格
- 减少了无效沟通和返工
- 形成了可复用的协作模式

---

## 十、加分项：人机结对编程模式

### 分工明确，效率翻倍

| 角色 | 职责 |
|------|------|
| **人类开发者** | 产品需求定义、审美把控、架构决策、验收测试 |
| **Claude Code** | 代码实现、测试编写、文档生成、问题诊断 |

**实际案例：**

> **人类：** "风格选择器需要一个下拉菜单，但是要自定义样式，不要用原生 select"
>
> **Claude Code：** 实现了完全自定义的下拉组件，包含键盘导航、焦点管理、点击外部关闭等功能
>
> **Git 提交：** `5daf594 fix: beautify StyleSelector with custom dropdown, fix session history clipping`

**协作流程：**
1. 人类描述意图 → Claude Code 提出澄清问题
2. Claude Code 实现方案 → 人类 Review 并反馈
3. Claude Code 迭代优化 → 人类验收确认

---

## 总结与心得

### 七大领域实践对照表

| 领域 | 关键实践 | 核心收益 |
|------|---------|---------|
| 需求理解 | Prompt 模板工程 | 将模糊需求转化为可执行规则 |
| 架构设计 | iframe 沙箱隔离 | 安全性与可维护性的平衡 |
| 编码 | Provider 工厂模式演进 | 降低维护成本，提升扩展性 |
| Code Review | Markdown 标记处理 | 发现并修复隐蔽问题 |
| 测试 | TDD 驱动清洗器 | 安全模块的可靠性保障 |
| 安全 | 三层防御体系 | 多维度防护 XSS 攻击 |
| 版本管理 | 语义化提交 | 清晰的变更追溯 |

### 最佳实践建议

1. **先写测试再写代码**：Claude Code 在 TDD 模式下表现最佳
2. **明确约束条件**：CLAUDE.md 让 AI 输出更可控
3. **小步快跑**：每次提交一个独立功能，便于 Review 和回滚
4. **善用 SKILL**：`systematic-debugging`、`test-driven-development` 等 Skill 能显著提升效率
5. **保持人机分工清晰**：人类做决策，AI 做执行

---

**项目仓库：** https://github.com/your-org/vibe-frame

**在线演示：** https://vibeframe.demo.com

**联系方式：** your-email@example.com