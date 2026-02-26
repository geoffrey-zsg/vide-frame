// HTML Sanitizer with whitelist-based CDN filtering and dangerous pattern blocking.
//
// Rules:
// - Whitelisted CDN domains for external scripts: cdn.tailwindcss.com, unpkg.com, cdn.jsdelivr.net
// - External <script src="...">: keep if src matches whitelist, remove otherwise
// - Inline <script>: replace dangerous API calls with blocked comments, remove tag if nothing remains
// - Strip markdown code block markers (```html, ```)
// - All other HTML (tags, attributes, inline events, CSS) is preserved as-is

const WHITELISTED_CDNS = [
  'cdn.tailwindcss.com',
  'unpkg.com',
  'cdn.jsdelivr.net',
];

const DANGEROUS_PATTERNS: RegExp[] = [
  /\bfetch\s*\(/g,
  /\bXMLHttpRequest\b/g,
  /\bWebSocket\b/g,
  /\beval\s*\(/g,
  /\bnew\s+Function\s*\(/g,
  /\bdocument\.cookie\b/g,
  /\bwindow\.location\b/g,
  /\blocalStorage\b/g,
  /\bsessionStorage\b/g,
  /\bwindow\.open\s*\(/g,
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
  try {
    const url = new URL(src);
    return WHITELISTED_CDNS.some(
      (cdn) => url.hostname === cdn || url.hostname.endsWith('.' + cdn)
    );
  } catch {
    return false;
  }
}

function sanitizeInlineScript(content: string): string {
  let sanitized = content;
  for (const pattern of DANGEROUS_PATTERNS) {
    pattern.lastIndex = 0;
    sanitized = sanitized.replace(pattern, '/* blocked */');
  }
  return sanitized;
}

function isOnlyBlocked(content: string): boolean {
  const stripped = content.replace(/\/\*\s*blocked\s*\*\//g, '').trim();
  const cleaned = stripped.replace(/["'();,\s]|var\s+\w+\s*=|const\s+\w+\s*=|let\s+\w+\s*=|new\s+/g, '').trim();
  return cleaned.length === 0;
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
