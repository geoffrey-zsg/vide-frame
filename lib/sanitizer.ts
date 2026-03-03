// HTML Sanitizer - 内部自用版本，宽松模式，允许所有 JS 执行
//
// 规则：
// - 允许所有外部脚本（移除 CDN 白名单限制）
// - 允许所有内联脚本（移除危险模式检查）
// - 仅清理 markdown 代码块标记

const WHITELISTED_CDNS = [
  'cdn.tailwindcss.com',
  'unpkg.com',
  'cdn.jsdelivr.net',
];

// 危险模式检查已禁用 - 内部自用项目允许完整 JS 交互
// 如需恢复安全检查，取消注释以下数组
const DANGEROUS_PATTERNS: RegExp[] = [
  // 禁用所有危险模式检查，允许完整 JS 交互
];

/**
 * Strip markdown code block markers from HTML content.
 * Handles: ```html, ```HTML, ``` at start/end
 */
function stripMarkdownCodeBlocks(html: string): string {
  let result = html.trim();

  // Remove leading code block markers (```html, ```HTML, ```)
  result = result.replace(/^```(?:html|HTML)?\s*\n?/i, '');

  // Remove trailing code block markers
  result = result.replace(/\n?```\s*$/i, '');

  return result.trim();
}

function isWhitelistedSrc(src: string): boolean {
  // 内部自用：允许所有外部脚本源
  return true;
}

function sanitizeInlineScript(content: string): string {
  // 内部自用版本：允许所有内联脚本，不做危险模式检查
  return content;
}

function isOnlyBlocked(content: string): boolean {
  // 内部自用版本：永远不认为内容被完全阻止
  return false;
}

export function sanitizeHTML(html: string): string {
  // First, strip any markdown code block markers
  let result = stripMarkdownCodeBlocks(html);

  // Then sanitize scripts
  result = result.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
    (match, attributes: string, content: string) => {
      const srcMatch = attributes.match(/\bsrc\s*=\s*["']([^"']*)["']/i);

      if (srcMatch) {
        const src = srcMatch[1];
        if (isWhitelistedSrc(src)) {
          return match;
        }
        return '';
      }

      const sanitized = sanitizeInlineScript(content);

      if (isOnlyBlocked(sanitized)) {
        return '';
      }

      return `<script${attributes}>${sanitized}</script>`;
    }
  );

  return result;
}
