# VibeFrame 安全策略文档

## 一、安全架构概览

VibeFrame 采用**多层防御（Defense in Depth）**策略，确保用户输入和 AI 生成的代码不会对应用造成安全威胁。

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

## 二、Layer 1: 服务端 HTML 清洗

### 清洗规则

| 规则 | 处理方式 | 示例 |
|------|---------|------|
| 外部 `<script src>` | 白名单域名保留，否则移除 | `cdn.tailwindcss.com` 保留 |
| 内联 `<script>` 中的危险 API | 替换为 `/* blocked */` | `fetch()` → `/* blocked */` |
| Markdown 代码块标记 | 自动去除 | ` ```html ` 和 ` ``` ` |
| 普通 HTML/CSS/事件 | 保留 | `onclick`, `style` 等允许 |

### 危险 API 黑名单

```typescript
const DANGEROUS_PATTERNS: RegExp[] = [
  /\bfetch\s*\(/g,           // 网络请求
  /\bXMLHttpRequest\b/g,     // XHR
  /\bWebSocket\b/g,          // WebSocket
  /\beval\s*\(/g,            // 代码执行
  /\bnew\s+Function\s*\(/g,  // 动态函数
  /\bdocument\.cookie\b/g,   // Cookie 访问
  /\bwindow\.location\b/g,   // 导航控制
  /\blocalStorage\b/g,       // 本地存储
  /\bsessionStorage\b/g,     // 会话存储
  /\bwindow\.open\s*\(/g,    // 弹窗
];
```

### 白名单 CDN

```typescript
const WHITELISTED_CDNS = [
  'cdn.tailwindcss.com',
  'unpkg.com',
  'cdn.jsdelivr.net',
];
```

## 三、Layer 2: iframe 沙箱隔离

### Sandbox 属性配置

```tsx
<iframe
  sandbox="allow-scripts"
  srcDoc={getSandboxTemplate()}
/>
```

**权限限制：**

| 权限 | 状态 | 说明 |
|------|------|------|
| `allow-scripts` | ✅ 允许 | Tailwind CSS 需要 |
| `allow-same-origin` | ❌ 禁止 | 阻止访问主应用 DOM/Cookie |
| `allow-forms` | ❌ 禁止 | 阻止表单提交 |
| `allow-popups` | ❌ 禁止 | 阻止弹窗 |
| `allow-top-navigation` | ❌ 禁止 | 阻止导航跳转 |

### 同源策略隔离

iframe 内的代码：
- 无法访问主应用的 `localStorage`、`sessionStorage`
- 无法读取或设置 `document.cookie`
- 无法访问主应用的 DOM
- 无法进行 `postMessage` 以外的通信

## 四、Layer 3: 白名单 CDN

### 允许的外部脚本

只允许以下 CDN 域名的脚本加载：

1. **cdn.tailwindcss.com** - Tailwind CSS 运行时
2. **unpkg.com** - npm 包 CDN
3. **cdn.jsdelivr.net** - jsDelivr CDN

### 验证逻辑

```typescript
function isWhitelistedSrc(src: string): boolean {
  try {
    const url = new URL(src);
    return WHITELISTED_CDNS.some(
      (cdn) => url.hostname === cdn || url.hostname.endsWith('.' + cdn)
    );
  } catch {
    return false;
  }
}
```

## 五、安全测试覆盖

共 16 个测试用例覆盖各种攻击向量：

```typescript
describe('sanitizeHTML', () => {
  // 基础功能
  it('should allow basic HTML with TailwindCSS class names');
  it('should allow inline style attributes');
  it('should allow img tags');
  it('should allow inline onclick and simple interaction events');

  // 外部脚本
  it('should strip external script tags with non-whitelisted src');
  it('should allow TailwindCSS CDN script tag');

  // 危险 API
  it('should strip fetch calls inside inline script');
  it('should strip eval()');
  it('should strip document.cookie access');
  it('should strip window.location manipulation');
  it('should strip WebSocket usage inside inline script');

  // Markdown 清洗
  it('should strip leading ```html code block marker');
  it('should strip trailing ``` code block marker');
  it('should strip both leading and trailing code block markers');
  it('should handle code block without language identifier');
});
```

## 六、最佳实践建议

1. **永远不要信任用户输入** - 所有 HTML 都经过 `sanitizeHTML()` 清洗
2. **最小权限原则** - iframe 只授予 `allow-scripts` 权限
3. **防御深度** - 多层防护确保单点失效不会导致系统崩溃
4. **持续测试** - 每次修改清洗器都运行完整测试套件