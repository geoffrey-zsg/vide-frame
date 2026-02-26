'use client';

import { useState, useCallback } from 'react';

interface CollapsibleCodeProps {
  code: string;
  onPreview: (code: string) => void;
}

/**
 * 可折叠代码块组件
 * 默认折叠状态，显示摘要信息；可展开查看完整代码；支持一键复制。
 */
export function CollapsibleCode({ code, onPreview }: CollapsibleCodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* 折叠头部 */}
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900"
        >
          <span
            className={`inline-block transition-transform duration-150 ${
              expanded ? 'rotate-90' : ''
            }`}
          >
            ▶
          </span>
          <span>生成了 HTML 代码</span>
          <span className="text-gray-400">({code.length} 字符)</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPreview(code)}
            className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors border border-indigo-100"
          >
            预览
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors"
          >
            {copied ? '已复制' : '复制代码'}
          </button>
        </div>
      </div>

      {/* 代码内容（展开时显示） */}
      {expanded && (
        <pre className="px-3 pb-3 text-xs text-gray-700 overflow-x-auto max-h-[400px] overflow-y-auto border-t border-gray-100">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
