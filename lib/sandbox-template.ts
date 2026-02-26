export function getSandboxTemplate(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    .vf-highlight {
      outline: 2px solid #3b82f6 !important;
      outline-offset: 2px;
      cursor: pointer;
    }
    body {
      margin: 0;
    }
    /* 加载动画 */
    .vf-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: #64748b;
      font-family: system-ui, sans-serif;
    }
    .vf-loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="vf-root">
    <div class="vf-loading">
      <div class="vf-loading-spinner"></div>
    </div>
  </div>
  <script>
    const root = document.getElementById('vf-root');
    let chunks = '';
    let renderTimer = null;
    let isFirstChunk = true;
    const RENDER_INTERVAL = 300; // 节流间隔：300ms

    // 检测 markdown 代码块标记（使用 Unicode 编码避免模板字符串转义问题）
    const CODE_BLOCK_START = String.fromCharCode(96, 96, 96); // \`\`\`
    const CODE_BLOCK_HTML = String.fromCharCode(96, 96, 96, 104, 116, 109, 108); // \`\`\`html

    // 解析 HTML 并提取 body 内容，容错处理不完整的 HTML
    function parseAndExtract(html) {
      // 去除开头的 markdown 代码块标记
      let content = html.trim();
      if (content.startsWith(CODE_BLOCK_HTML)) {
        content = content.slice(CODE_BLOCK_HTML.length).trim();
      } else if (content.startsWith(CODE_BLOCK_START)) {
        content = content.slice(CODE_BLOCK_START.length).trim();
      }

      // 去除结尾的代码块标记
      if (content.endsWith(CODE_BLOCK_START)) {
        content = content.slice(0, -CODE_BLOCK_START.length).trim();
      }

      // 如果已经是完整的 HTML 文档，提取 body 内容
      if (content.includes('<body') || content.includes('<!DOCTYPE')) {
        try {
          var parser = new DOMParser();
          var doc = parser.parseFromString(content, 'text/html');
          return doc.body.innerHTML || content;
        } catch (e) {
          return content;
        }
      }
      return content;
    }

    // 安全地渲染 HTML，处理不完整片段
    function safeRender(html) {
      if (!html || !html.trim()) {
        return;
      }

      try {
        var content = parseAndExtract(html);

        if (!content || !content.trim()) {
          return;
        }

        root.innerHTML = content;
      } catch (err) {
        console.error('Render error:', err);
        parent.postMessage({ type: 'render-error', error: String(err) }, '*');
      }
    }

    // 立即渲染当前累积的 chunks
    function renderNow() {
      if (renderTimer) {
        clearTimeout(renderTimer);
        renderTimer = null;
      }
      safeRender(chunks);
    }

    // 延迟渲染：若已有计时器则跳过，否则启动新计时器
    function scheduleRender() {
      if (renderTimer) return;
      renderTimer = setTimeout(renderNow, RENDER_INTERVAL);
    }

    window.addEventListener('message', function(e) {
      var msg = e.data;
      if (!msg || !msg.type) return;

      switch (msg.type) {
        case 'render':
          // 完整渲染：重置状态
          chunks = msg.html || '';
          isFirstChunk = true;
          renderNow();
          break;

        case 'render-chunk':
          chunks += msg.chunk;
          if (isFirstChunk) {
            // 首个 chunk 立即渲染，避免用户感觉卡顿
            isFirstChunk = false;
            renderNow();
          } else {
            scheduleRender();
          }
          break;

        case 'render-complete':
          // 渲染完成：重置状态并确保最终渲染
          isFirstChunk = true;
          renderNow();
          break;
      }
    });

    // 通知父窗口 iframe 已准备好
    parent.postMessage({ type: 'ready' }, '*');
  <\/script>
</body>
</html>`;
}