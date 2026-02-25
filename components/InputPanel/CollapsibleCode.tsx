'use client';

import { useState, useCallback } from 'react';

interface CollapsibleCodeProps {
  code: string;
}

/**
 * 可折叠代码块组件
 * 默认折叠状态，显示摘要信息；可展开查看完整代码；支持一键复制。
 */
export function CollapsibleCode({ code }: CollapsibleCodeProps) {
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
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors"
        >
          {copied ? '已复制' : '复制代码'}
        </button>
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
