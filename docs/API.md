# VibeFrame API 文档

## API 端点

### POST /api/generate

生成 UI 代码（流式 SSE）。

**请求体：**

```typescript
interface GenerateRequest {
  prompt: string;              // 用户描述
  image?: string;             // Base64 编码的图片（可选）
  model: string;              // 模型 ID
  provider: string;           // 提供商名称
  apiKey: string;             // API Key
  baseUrl?: string;           // 自定义 API Base URL（可选）
  style: StylePreset;         // 风格预设
  history: HistoryMessage[];  // 对话历史
  elementContext?: ElementContext; // 元素上下文（可选）
}
```

**响应：**

返回 `text/event-stream` 格式的 SSE 流：

```
data: {"chunk":"<div class=\"..."}

data: {"chunk":"<p>Hello"}

data: {"done":true,"html":"<!DOCTYPE html>..."}
```

**事件类型：**

| 事件 | 字段 | 说明 |
|------|------|------|
| chunk | `chunk: string` | 流式输出片段 |
| done | `done: true, html: string` | 生成完成，返回完整清洗后的 HTML |
| error | `error: string` | 发生错误 |

**示例：**

```typescript
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: '创建一个登录表单',
    model: 'gpt-4o',
    provider: 'openai',
    apiKey: 'sk-...',
    style: 'minimal-light',
    history: [],
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  const lines = text.split('\n').filter(line => line.startsWith('data: '));

  for (const line of lines) {
    const data = JSON.parse(line.slice(6));
    if (data.chunk) {
      // 处理流式片段
    } else if (data.done) {
      // 生成完成
      console.log(data.html);
    } else if (data.error) {
      // 处理错误
    }
  }
}
```

---

### POST /api/export

导出完整的 HTML 文件。

**请求体：**

```typescript
interface ExportRequest {
  html: string;  // 要导出的 HTML 内容
}
```

**响应：**

返回 `text/html` 格式的完整 HTML 文件，包含必要的样式和脚本。

---

## 类型定义

### StylePreset

```typescript
type StyleId =
  | 'minimal-light'   // 极简白
  | 'dark-mode'       // 暗黑模式
  | 'glassmorphism'   // 毛玻璃风
  | 'professional';   // 商务蓝
```

### HistoryMessage

```typescript
interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}
```

### ElementContext

```typescript
interface ElementContext {
  tagName: string;
  className: string;
  textContent: string;
}
```

## 错误处理

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误（缺少 prompt 或 apiKey） |
| 500 | 服务器内部错误 |