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
      margin:0;
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
    var root = document.getElementById('vf-root');
    var chunks = '';
    var renderTimer = null;
    var isFirstChunk = true;
    var RENDER_INTERVAL = 300;

    // 检测 markdown 代码块标记
    var CODE_BLOCK_START = String.fromCharCode(96, 96, 96);
    var CODE_BLOCK_HTML = String.fromCharCode(96, 96, 96, 104, 116, 109, 108);

    function parseAndExtract(html) {
      var content = html.trim();
      if (content.startsWith(CODE_BLOCK_HTML)) {
        content = content.slice(CODE_BLOCK_HTML.length).trim();
      } else if (content.startsWith(CODE_BLOCK_START)) {
        content = content.slice(CODE_BLOCK_START.length).trim();
      }
      if (content.endsWith(CODE_BLOCK_START)) {
        content = content.slice(0, -CODE_BLOCK_START.length).trim();
      }
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

    function safeRender(html) {
      if (!html || !html.trim()) {
        return false;
      }
      try {
        var content = parseAndExtract(html);
        if (!content || !content.trim()) {
          return false;
        }
        root.innerHTML = content;
        return true;
      } catch (err) {
        console.error('Render error:', err);
        parent.postMessage({ type: 'render-error', error: String(err) }, '*');
        return false;
      }
    }

    function renderNow() {
      if (renderTimer) {
        clearTimeout(renderTimer);
        renderTimer = null;
      }
      var success = safeRender(chunks);
      if (success) {
        parent.postMessage({ type: 'render-success' }, '*');
      }
    }

    function scheduleRender() {
      if (renderTimer) return;
      renderTimer = setTimeout(renderNow, RENDER_INTERVAL);
    }

    window.addEventListener('message', function(e) {
      var msg = e.data;
      if (!msg || !msg.type) return;

      switch (msg.type) {
        case 'render':
          chunks = msg.html || '';
          isFirstChunk = true;
          renderNow();
          break;

        case 'render-chunk':
          chunks += msg.chunk;
          if (isFirstChunk) {
            isFirstChunk = false;
            renderNow();
          } else {
            scheduleRender();
          }
          break;

        case 'render-complete':
          isFirstChunk = true;
          renderNow();
          break;
      }
    });

    parent.postMessage({ type: 'ready' }, '*');
  <\/script>
</body>
</html>`;
}