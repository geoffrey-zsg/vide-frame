export function getSandboxTemplate(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com" async><\/script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"><\/script>
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
      /* 默认最小高度，支持 body 背景色 */
      min-height: 100vh;
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

      // 如果是完整 HTML 文档，提取 head 和 body 内容
      if (content.includes('<!DOCTYPE') || content.includes('<html')) {
        try {
          var parser = new DOMParser();
          var doc = parser.parseFromString(content, 'text/html');

          // 提取 head 内容（样式、脚本等）
          var headContent = doc.head.innerHTML || '';

          // 提取 body 内容和属性
          var bodyContent = doc.body.innerHTML || '';
          var bodyMatch = content.match(/<body[^>]*>/i);
          var bodyAttrs = {};
          if (bodyMatch) {
            var styleMatch = bodyMatch[0].match(/style\s*=\s*["']([^"']*)["']/i);
            var classMatch = bodyMatch[0].match(/class\s*=\s*["']([^"']*)["']/i);
            if (styleMatch) bodyAttrs.style = styleMatch[1];
            if (classMatch) bodyAttrs.className = classMatch[1];
          }

          return {
            type: 'full',
            headContent: headContent,
            bodyContent: bodyContent,
            bodyAttrs: bodyAttrs
          };
        } catch (e) {
          return { type: 'simple', content: content };
        }
      }

      // 如果只有 body 标签
      if (content.includes('<body')) {
        try {
          var parser2 = new DOMParser();
          var doc2 = parser2.parseFromString(content, 'text/html');
          var bodyMatch2 = content.match(/<body[^>]*>/i);
          var bodyAttrs2 = {};
          if (bodyMatch2) {
            var styleMatch2 = bodyMatch2[0].match(/style\s*=\s*["']([^"']*)["']/i);
            var classMatch2 = bodyMatch2[0].match(/class\s*=\s*["']([^"']*)["']/i);
            if (styleMatch2) bodyAttrs2.style = styleMatch2[1];
            if (classMatch2) bodyAttrs2.className = classMatch2[1];
          }
          return {
            type: 'simple',
            content: doc2.body.innerHTML || content,
            bodyAttrs: bodyAttrs2
          };
        } catch (e) {
          return { type: 'simple', content: content };
        }
      }

      return { type: 'simple', content: content };
    }

    function safeRender(html) {
      if (!html || !html.trim()) {
        return false;
      }
      try {
        var parsed = parseAndExtract(html);
        var contentToRender = '';
        var bodyAttrs = {};

        if (parsed.type === 'full') {
          // 完整 HTML：注入 head 内容，提取 body 内容和属性
          contentToRender = parsed.bodyContent;
          bodyAttrs = parsed.bodyAttrs || {};

          // 将用户的 head 内容（样式、字体等）注入到沙箱 head
          if (parsed.headContent) {
            var existingUserHead = document.getElementById('vf-user-head');
            if (existingUserHead) {
              existingUserHead.innerHTML = parsed.headContent;
            } else {
              var userHead = document.createElement('div');
              userHead.id = 'vf-user-head';
              userHead.style.display = 'none';
              userHead.innerHTML = parsed.headContent;
              document.head.appendChild(userHead);
              // 提取并移动样式标签到 head，确保生效
              var styles = userHead.querySelectorAll('style, link[rel="stylesheet"]');
              styles.forEach(function(el) {
                document.head.appendChild(el);
              });
            }
          }
        } else {
          // 简单内容
          contentToRender = parsed.content || html;
          bodyAttrs = parsed.bodyAttrs || {};
        }

        if (!contentToRender || !contentToRender.trim()) {
          return false;
        }

        // 避免 HTML 相同时重复渲染
        if (contentToRender === lastRenderedHTML) {
          return true;
        }

        // 添加渲染中状态
        root.classList.add('vf-rendering');

        // 应用 body 的样式属性到 vf-root
        if (bodyAttrs.style) {
          root.style.cssText = bodyAttrs.style;
        } else {
          root.style.cssText = '';
        }

        if (bodyAttrs.className) {
          root.className = 'vf-rendering ' + bodyAttrs.className;
        } else {
          root.className = 'vf-rendering';
        }

        root.innerHTML = contentToRender;
        lastRenderedHTML = contentToRender;

        // 执行内联脚本（innerHTML 插入的脚本不会自动执行）
        function executeScripts(element) {
          var scripts = element.querySelectorAll('script');
          scripts.forEach(function(oldScript) {
            var newScript = document.createElement('script');
            // 复制属性
            Array.from(oldScript.attributes).forEach(function(attr) {
              newScript.setAttribute(attr.name, attr.value);
            });
            // 复制内容
            newScript.textContent = oldScript.textContent;
            // 替换执行
            oldScript.parentNode.replaceChild(newScript, oldScript);
          });
        }
        executeScripts(root);

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
          if (chunks) {
            renderNow();
          } else {
            // 空内容时显示加载动画
            root.innerHTML = '<div class="vf-loading"><div class="vf-loading-spinner"></div></div>';
          }
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

        case 'ping':
          // 响应父组件的 ping，重新发送 ready 状态
          parent.postMessage({ type: 'ready' }, '*');
          break;
      }
    });

    // 延迟发送 ready 消息，确保父组件有机会先注册监听器
    setTimeout(function() {
      parent.postMessage({ type: 'ready' }, '*');
    }, 0);

    // 处理链接点击 - 阻止所有导航，通知父页面
    document.addEventListener('click', function(e) {
      var target = e.target;
      // 向上查找最近的 A 标签
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }
      if (target && target.tagName === 'A') {
        var href = target.getAttribute('href') || '';
        // 阻止所有链接的默认行为
        e.preventDefault();
        e.stopPropagation();
        // 通知父页面用户点击了链接
        parent.postMessage({
          type: 'link-clicked',
          href: href,
          text: target.textContent || ''
        }, '*');
        // 外部链接提示用户可在新标签页打开
        if (href && (href.startsWith('http') || href.startsWith('//'))) {
          // 询问用户是否在新标签页打开
          if (confirm('是否在新标签页打开此链接？ ' + href)) {
            window.open(href, '_blank', 'noopener,noreferrer');
          }
        }
      }
    }, true);
  <\/script>
</body>
</html>`;
}