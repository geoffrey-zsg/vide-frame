import { describe, it, expect } from 'vitest';
import { sanitizeHTML } from '../sanitizer';

describe('sanitizeHTML', () => {
  it('should allow basic HTML with TailwindCSS class names', () => {
    const input = '<div class="flex items-center justify-between p-4 bg-blue-500 text-white rounded-lg"><h1 class="text-2xl font-bold">Hello</h1></div>';
    const result = sanitizeHTML(input);
    expect(result).toBe(input);
  });

  it('should allow inline style attributes', () => {
    const input = '<div style="color: red; background: linear-gradient(to right, #000, #fff);">Styled</div>';
    const result = sanitizeHTML(input);
    expect(result).toBe(input);
  });

  // 内部自用版本：允许所有外部脚本（放宽限制）
  it('should allow external script tags from any source', () => {
    const input = '<script src="https://any-cdn.com/lib.js"></script><p>Content</p>';
    const result = sanitizeHTML(input);
    expect(result).toContain('<script src="https://any-cdn.com/lib.js">');
    expect(result).toContain('<p>Content</p>');
  });

  it('should allow inline onclick and simple interaction events', () => {
    const input = `<button onclick="alert('hello')" onmouseover="this.style.color='red'">Click me</button>`;
    const result = sanitizeHTML(input);
    expect(result).toBe(input);
  });

  // 内部自用版本：允许所有内联脚本（放宽限制）
  it('should allow fetch calls inside inline script', () => {
    const input = '<script>fetch("https://api.example.com/data")</script>';
    const result = sanitizeHTML(input);
    expect(result).toContain('fetch(');
  });

  it('should allow eval()', () => {
    const input = '<script>eval("alert(1)")</script>';
    const result = sanitizeHTML(input);
    expect(result).toContain('eval(');
  });

  it('should allow document.cookie access', () => {
    const input = '<script>var x = document.cookie;</script>';
    const result = sanitizeHTML(input);
    expect(result).toContain('document.cookie');
  });

  it('should allow window.location manipulation', () => {
    const input = '<script>window.location = "https://example.com";</script>';
    const result = sanitizeHTML(input);
    expect(result).toContain('window.location');
  });

  it('should allow TailwindCSS CDN script tag', () => {
    const input = '<script src="https://cdn.tailwindcss.com"></script><div class="p-4">Content</div>';
    const result = sanitizeHTML(input);
    expect(result).toContain('<script src="https://cdn.tailwindcss.com"></script>');
    expect(result).toContain('<div class="p-4">Content</div>');
  });

  it('should allow img tags', () => {
    const input = '<img src="https://example.com/photo.jpg" alt="A photo" class="w-full rounded-md" />';
    const result = sanitizeHTML(input);
    expect(result).toBe(input);
  });

  // 内部自用版本：允许 WebSocket（放宽限制）
  it('should allow WebSocket usage inside inline script', () => {
    const input = '<script>const ws = new WebSocket("wss://example.com/ws");</script>';
    const result = sanitizeHTML(input);
    expect(result).toContain('WebSocket');
  });

  // Markdown code block stripping tests
  it('should strip leading ```html code block marker', () => {
    const input = '```html\n<!DOCTYPE html><html><body>Hello</body></html>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('```');
    expect(result).toContain('<!DOCTYPE html>');
  });

  it('should strip leading ```HTML code block marker (uppercase)', () => {
    const input = '```HTML\n<!DOCTYPE html><html><body>Hello</body></html>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('```');
    expect(result).toContain('<!DOCTYPE html>');
  });

  it('should strip trailing ``` code block marker', () => {
    const input = '<!DOCTYPE html><html><body>Hello</body></html>\n```';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('```');
    expect(result).toContain('</html>');
  });

  it('should strip both leading and trailing code block markers', () => {
    const input = '```html\n<!DOCTYPE html><html><body>Hello</body></html>\n```';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('```');
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('</html>');
  });

  it('should handle code block without language identifier', () => {
    const input = '```\n<!DOCTYPE html><html><body>Hello</body></html>\n```';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('```');
    expect(result).toContain('<!DOCTYPE html>');
  });
});
