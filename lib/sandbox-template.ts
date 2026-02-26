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
      /* 防止内容变化时的布局抖动 */
      overflow-x: hidden;
    }
    /* 加载动画 - 居中显示 */
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
    /* 平滑过渡效果 */
    #vf-root {
      opacity: 1;
      transition: opacity 0.15s ease-out;
    }
    #vf-root.vf-rendering {
      opacity: 0.7;
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
    var lastRenderedHTML = '';
    // 使用 requestAnimationFrame 进行渲染节流
    var renderScheduled = false;
    var RENDER_INTERVAL = 200;
    var MIN_RENDER_INTERVAL = 100;

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
        // 避免 HTML 相同时重复渲染
        if (content === lastRenderedHTML) {
          return true;
        }
        // 添加渲染中状态
        root.classList.add('vf-rendering');
        root.innerHTML = content;
        lastRenderedHTML = content;
        // 移除渲染中状态
        requestAnimationFrame(function() {
          root.classList.remove('vf-rendering');
        });
        return true;
      } catch (err) {
        console.error('Render error:', err);
        parent.postMessage({ type: 'render-error', error: String(err) }, '*');
        return false;
      }
    }

    function renderNow() {
      renderScheduled = false;
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
      // 使用 requestAnimationFrame 进行节流，确保在浏览器重绘前渲染
      if (!renderScheduled) {
        renderScheduled = true;
        requestAnimationFrame(renderNow);
      }
    }

    function scheduleDebouncedRender() {
      if (renderTimer) {
        clearTimeout(renderTimer);
      }
      renderTimer = setTimeout(function() {
        renderTimer = null;
        if (renderScheduled) return;
        scheduleRender();
      }, RENDER_INTERVAL);
    }

    window.addEventListener('message', function(e) {
      var msg = e.data;
      if (!msg || !msg.type) return;

      switch (msg.type) {
        case 'render':
          chunks = msg.html || '';
          lastRenderedHTML = '';
          isFirstChunk = true;
          renderNow();
          break;

        case 'render-chunk':
          chunks += msg.chunk;
          if (isFirstChunk) {
            isFirstChunk = false;
            // 首块立即渲染
            renderNow();
          } else {
            // 后续块使用防抖 + requestAnimationFrame
            scheduleDebouncedRender();
          }
          break;

        case 'render-complete':
          isFirstChunk = true;
          // 最终渲染确保完整内容
          renderNow();
          break;
      }
    });

    parent.postMessage({ type: 'ready' }, '*');
  <\/script>
</body>
</html>`;
}