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
          root.innerHTML = msg.html;
          chunks = msg.html;
          break;

        case 'render-chunk':
          chunks += msg.chunk;
          try {
            root.innerHTML = chunks;
          } catch (err) {
            parent.postMessage({ type: 'render-error', error: String(err) }, '*');
          }
          break;

        case 'render-complete':
          try {
            root.innerHTML = chunks;
          } catch (err) {
            parent.postMessage({ type: 'render-error', error: String(err) }, '*');
          }
          break;

        case 'highlight':
          clearHighlight();
          const target = document.querySelector(msg.selector);
          if (target) {
            target.classList.add('vf-highlight');
            highlightedEl = target;
          }
          break;

        case 'clear-highlight':
          clearHighlight();
          break;
      }
    });

    document.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const el = e.target;
      if (!el || el === root) return;

      const tagName = el.tagName.toLowerCase();
      const textContent = (el.textContent || '').trim().slice(0, 50);
      const className = el.className
        .toString()
        .replace(/vf-highlight/g, '')
        .trim();

      let positionDescription = tagName;
      const parentEl = el.parentElement;
      if (parentEl) {
        const parentTag = parentEl.tagName.toLowerCase();
        const siblings = Array.from(parentEl.children).filter(
          (c) => c.tagName.toLowerCase() === tagName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(el) + 1;
          positionDescription = parentTag + ' 中的第 ' + index + ' 个 ' + tagName;
        } else {
          positionDescription = parentTag + ' 中的 ' + tagName;
        }
      }

      parent.postMessage({
        type: 'element-clicked',
        elementInfo: { tagName, textContent, className, positionDescription }
      }, '*');
    }, true);

    parent.postMessage({ type: 'ready' }, '*');
  <\/script>
</body>
</html>`;
}
