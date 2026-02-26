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

### 案例：从 "乱码草图" 到 "标准控件" 的 Prompt 工程

**背景：** 用户上传的手绘草图往往潦草、模糊，如何让 LLM 正确识别其中的 UI 元素？

**Claude Code 实践：**

```typescript
// lib/prompt/templates.ts
export const BASE_SYSTEM_TEMPLATE = `你是一名前端 UI 专家，擅长使用 HTML 和 TailwindCSS 构建精美的网页界面。

核心设计准则：
1. **视觉层次 (Visual Hierarchy)**：使用不同的字号、字重、颜色深浅和留白来区分内容优先级。
2. **现代美学 (Modern Aesthetics)**：
   - 优先使用大圆角（如 rounded-2xl, rounded-3xl）。
   - 使用柔和的阴影（shadow-sm, shadow-md, shadow-lg）和细边框（border-slate-100）。
...`;
```

**关键洞察：** Claude Code 帮助我将模糊的需求（"生成好看的 UI"）拆解为可执行的规则，直接编码到 System Prompt 中，确保生成结果的一致性。

**Git 提交：** `b5b5d67 feat: add StyleSelector component with 4 style presets`

---

## 二、架构设计领域

### 案例：iframe 沙箱隔离方案

**背景：** 直接在主 DOM 中渲染 AI 生成的 HTML 会导致样式污染、脚本冲突。

**Claude Code 提出的方案对比：**

| 方案 | 优点 | 缺点 |
|------|------|------|
| 直接 innerHTML | 简单 | 样式污染、脚本执行风险 |
| Shadow DOM | 样式隔离 | 脚本仍可访问主 DOM |
| **iframe 沙箱** | 完全隔离 | 通信复杂度增加 |

**最终实现：**

```typescript
<iframe
  sandbox="allow-scripts"
  srcDoc={getSandboxTemplate()}
/>
```

**安全设计要点：**
- `sandbox="allow-scripts"` 只允许脚本执行，禁止弹窗、表单提交、导航跳转
- 服务端 `sanitizeHTML()` 在注入前剥离危险代码
- 白名单机制只允许 `cdn.tailwindcss.com`、`unpkg.com`、`cdn.jsdelivr.net`

**Git 提交：** `ede625a feat: add PreviewPanel with iframe sandbox, skeleton screen, and element selection`

---

## 三、编码领域

### 案例：LLM Provider 工厂模式的演进

**背景：** 最初计划为 OpenAI、Claude、通义千问分别编写适配器。

**Claude Code 建议：** 多数模型都支持 OpenAI Compatible API，可以统一实现。

```typescript
// lib/llm/provider.ts
export function getLLMProvider(provider, model, apiKey, baseUrl?) {
  const providerBaseUrls = {
    openai: undefined,
    deepseek: 'https://api.deepseek.com/v1',
    openrouter: 'https://openrouter.ai/api/v1',
  };
  return new OpenAIProvider(apiKey, baseUrl || providerBaseUrls[provider], model);
}
```

**收益：** 单一适配器实现，维护成本 O(n) → O(1)，用户可自定义任意 OpenAI Compatible 服务。

**Git 提交：** `b1da049 feat: 重构配置系统支持自定义 OpenAI Compatible API`

---

## 四、Code Review 领域

### 案例：Markdown 代码块标记的自动处理

**问题发现：** LLM 有时会在输出前后添加 ` ```html ` 标记，导致渲染失败。

**Claude Code 的 Review 发现并修复：**

```typescript
// lib/sanitizer.ts
function stripMarkdownCodeBlocks(html: string): string {
  let result = html.trim();
  result = result.replace(/^```(?:html|HTML)?\s*\n?/i, '');
  result = result.replace(/\n?```\s*$/i, '');
  return result.trim();
}
```

**收获：** Claude Code 在 Review 阶段不仅发现问题，还主动提供了测试用例，确保修复可验证。

---

## 五、测试领域

### 案例：TDD 驱动的安全清洗器开发

**Claude Code 实践：** 先写测试，再写实现。

```typescript
// lib/__tests__/sanitizer.test.ts
describe('sanitizeHTML', () => {
  it('should strip fetch calls inside inline script', () => {...});
  it('should strip eval()', () => {...});
  it('should strip document.cookie access', () => {...});
  it('should allow TailwindCSS CDN script tag', () => {...});
  // 共 16 个测试用例，覆盖 OWASP XSS 攻击向量
});
```

**实现对应测试：**

```typescript
const DANGEROUS_PATTERNS: RegExp[] = [
  /\bfetch\s*\(/g, /\bXMLHttpRequest\b/g, /\bWebSocket\b/g,
  /\beval\s*\(/g, /\bdocument\.cookie\b/g, /\blocalStorage\b/g,
  // ...
];
```

**Git 提交：** `14430ba feat: add POST /api/generate streaming SSE route`

---

## 六、安全领域

### 案例：三层防御的 XSS 防护体系

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

**安全测试覆盖：** 16 个测试用例覆盖各种攻击向量

---

## 七、版本管理领域

### 案例：语义化提交与功能迭代

```bash
$ git log --oneline -10
11fd068 feat: 为预览面板添加全屏查看功能
f3db67e fix: 优化预览面板流式渲染时的页面抖动问题
85ea953 fix: 修复 ESLint 错误，优化 iframe 消息通信
b1da049 feat: 重构配置系统支持自定义 OpenAI Compatible API
...
```

**收获：** 每个提交都是独立可验证的功能单元，便于审查和回滚。

---

## 八、加分项：SKILL 工程实践

### 案例 1：`superpowers:systematic-debugging` 系统化调试

**场景：** 流式渲染时，首屏内容不显示。

**调试过程：**

1. **问题定位：** 分析 iframe 通信协议，发现 `render-chunk` 消息发送了但没立即渲染
2. **根因分析：** 首个 chunk 也被 300ms 节流，导致用户感知延迟
3. **修复方案：**

```typescript
case 'render-chunk':
  chunks += msg.chunk;
  if (isFirstChunk) {
    isFirstChunk = false;
    renderNow();  // 首块立即渲染
  } else {
    scheduleRender();  // 后续块节流
  }
  break;
```

**Git 提交：** `f3db67e fix: 优化预览面板流式渲染时的页面抖动问题`

---

### 案例 2：`superpowers:test-driven-development` 测试驱动开发

**流程：**

1. **Red**：先写失败的测试
2. **Green**：写最小实现使测试通过
3. **Refactor**：优化实现，保持测试通过

**收益：** 安全模块测试覆盖率 100%，每次修改都有回归保护。

---

### 案例 3：`superpowers:verification-before-completion` 完成前验证

**验证清单：**

```bash
$ pnpm build  && pnpm lint && pnpm test:run
✓ Compiled successfully
✓ No ESLint errors
✓ 16 tests passed
```

**收益：** 问题在本地发现，而非 CI 环境中。

---

## 九、加分项：自动浏览器测试与问题修复

### 案例：agent-browser + 截屏分析自动发现并修复 UI 问题

**场景：** 实现全屏功能后，需要验证实际效果。

**AI 自动化流程：**

```
┌──────────────────────────────────────────────────────────────┐
│  1. 启动开发服务器 (pnpm dev)                                  │
│                        ↓                                      │
│  2. agent-browser 打开页面                                     │
│                        ↓                                      │
│  3. 执行 take-screenshots 脚本截屏                             │
│                        ↓                                      │
│  4. AI 视觉分析截图，发现 Safari 全屏按钮不兼容                 │
│                        ↓                                      │
│  5. 自动定位代码：PreviewPanel.tsx 缺少 webkit 前缀           │
│                        ↓                                      │
│  6. 修复并重新截屏验证                                         │
└──────────────────────────────────────────────────────────────┘
```

**截屏分析的价值：**

传统 UI 测试依赖人工肉眼检查，AI 编程模式下：

```bash
# AI 自动执行的测试脚本
pnpm take-screenshots

# AI 分析截屏结果
screenshots/
├── homepage.png        # AI 发现：布局正常
├── fullscreen.png      # AI 发现：Safari 下全屏按钮无响应
└── responsive.png      # AI 发现：移动端导航遮挡内容
```

AI 通过视觉分析截图，能够发现：
- 跨浏览器兼容性问题（如 Safari 的 `webkitRequestFullscreen`）
- 响应式布局问题
- 样式渲染异常
- 交互功能失效

**修复代码：**

```typescript
// components/PreviewPanel/PreviewPanel.tsx
const toggleFullscreen = useCallback(() => {
  if (!isFullscreen) {
    if (container.requestFullscreen) {
      container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) {
      // Safari 兼容
      container.webkitRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}, [isFullscreen]);
```

**AI 编程范式亮点：**
- **无需人工介入**：AI 自动启动浏览器、导航、测试、发现问题
- **视觉分析能力**：通过截屏脚本获取页面截图，AI 进行视觉分析发现 UI 问题
- **闭环修复**：从发现问题到修复验证，全程自动化
- **跨浏览器兼容**：自动识别并处理浏览器差异

---

## 十、加分项：CLAUDE.md 协作宪法

### 项目定制化 AI 协作规范

```markdown
## 核心原则
- **KISS**：优先清晰可维护，避免过度工程化
- **第一性原理**：先拆需求与约束再实现
- **事实为本**：不臆测，信息不足则标注假设或提关键问题

## 红线（必须遵守）
- 禁止 copy-paste 造成重复代码
- 禁止破坏现有功能（改动必须可验证）
- 关键路径必须有错误处理

## 开工前三问
1. 这是真问题还是臆想？
2. 有现成代码/库/组件可复用吗？
3. 会破坏什么调用关系/接口契约吗？
```

**效果：** Claude Code 的输出更符合项目风格，减少无效沟通和返工。

---

## 十一、加分项：人机结对编程模式

### 分工明确，效率翻倍

| 角色 | 职责 |
|------|------|
| **人类开发者** | 产品需求定义、审美把控、架构决策、验收测试 |
| **Claude Code** | 代码实现、测试编写、文档生成、问题诊断 |

**协作流程：**

```
人类描述意图 → Claude 提出澄清问题
      ↓
Claude 实现方案 → 人类 Review 并反馈
      ↓
Claude 迭代优化 → 人类验收确认
```

**实际案例：**

> **人类：** "风格选择器需要下拉菜单，不要用原生 select"
>
> **Claude Code：** 实现了自定义下拉组件，包含键盘导航、焦点管理、点击外部关闭
>
> **Git 提交：** `5daf594 fix: beautify StyleSelector with custom dropdown`

---

## 总结：AI 编程新范式

### 传统开发 vs AI 辅助开发

| 环节 | 传统开发 | AI 辅助开发 |
|------|---------|------------|
| 需求分析 | 人工拆解 | AI 协助细化规则 |
| 架构设计 | 人工调研 | AI 提供方案对比 |
| 编码实现 | 人工编写 | AI 生成 + 人工审核 |
| 测试 | 人工设计用例 | AI 生成测试 + 自动验证 |
| 调试 | 人工定位 | AI 系统化诊断 |
| Code Review | 人工检查 | AI 自动发现问题 |

### 核心收益

1. **先写测试再写代码**：Claude Code 在 TDD 模式下表现最佳
2. **明确约束条件**：CLAUDE.md 让 AI 输出更可控
3. **小步快跑**：每次提交一个独立功能，便于 Review 和回滚
4. **自动化验证**：`verification-before-completion` 在提交前自动验证
5. **视觉分析 UI**：`agent-browser` + `take-screenshots` 截屏分析，自动发现 UI 问题
6. **保持人机分工清晰**：人类做决策，AI 做执行

---

**项目仓库：** https://github.com/your-org/vibe-frame

**在线演示：** https://vibeframe.demo.com