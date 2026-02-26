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
  </style>
</head>
<body>
  <div id="vf-root"></div>
  <script>
    const root = document.getElementById('vf-root');
    let chunks = '';
    let highlightedEl = null;
    let renderTimer = null;
    let isFirstChunk = true;
    const RENDER_INTERVAL = 2000; // 节流间隔：2 秒

    // 立即渲染当前累积的 chunks
    function renderNow() {
      if (renderTimer) {
        clearTimeout(renderTimer);
        renderTimer = null;
      }
      try {
        root.innerHTML = chunks;
      } catch (err) {
        parent.postMessage({ type: 'render-error', error: String(err) }, '*');
      }
    }

    // 延迟渲染：若已有计时器则跳过，否则启动新计时器
    function scheduleRender() {
      if (renderTimer) return;
      renderTimer = setTimeout(renderNow, RENDER_INTERVAL);
    }

    function clearHighlight() {
      if (highlightedEl) {
        highlightedEl.classList.remove('vf-highlight');
        highlightedEl = null;
      }
    }

    window.addEventListener('message', (e) => {
      const msg = e.data;
      if (!msg || !msg.type) return;

      switch (msg.type) {
        case 'render':
          chunks = msg.html;
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
