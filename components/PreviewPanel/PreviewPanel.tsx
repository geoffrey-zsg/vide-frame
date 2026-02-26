'use client';

import { useRef, useState, useEffect } from 'react';
import { getSandboxTemplate } from '@/lib/sandbox-template';
import { Skeleton } from './Skeleton';

interface PreviewPanelProps {
  isGenerating: boolean;
  currentHTML: string | null;
  onExport: () => void;
  onRefresh: () => void;
  providerName: string;
  modelName: string;
  onOpenSettings: () => void;
}

export function PreviewPanel({
  isGenerating,
  currentHTML,
  onExport,
  onRefresh,
  providerName,
  modelName,
  onOpenSettings,
}: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // 监听来自 iframe 的消息
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      const msg = e.data;
      if (!msg || !msg.type) return;

      if (msg.type === 'ready') {
        setIframeReady(true);
      } else if (msg.type === 'render-error') {
        setRenderError(msg.error);
      } else if (msg.type === 'render-success') {
        // 渲染成功时清除错误
        setRenderError(null);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 发送 HTML 到 iframe
  useEffect(() => {
    if (!iframeReady) return;

    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage(
      { type: 'render', html: currentHTML || '' },
      '*'
    );
  }, [currentHTML, iframeReady]);

  const showSkeleton = !!renderError || (!currentHTML && !isGenerating);

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white/80 backdrop-blur shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3 text-sm min-w-0">
          {renderError ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 font-medium shrink-0 shadow-sm border border-red-100">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              错误
            </span>
          ) : isGenerating ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-medium shrink-0 shadow-sm border border-indigo-100">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              生成中...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium shrink-0 shadow-sm border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              已完成
            </span>
          )}
          {/* 当前模型信息 */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 truncate max-w-[200px] border border-slate-200 bg-white rounded-md px-2.5 py-1.5 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            title="点击修改模型配置"
          >
            {providerName} / {modelName}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all duration-200 cursor-pointer"
            title="刷新预览"
          >
            刷新
          </button>
          <button
            onClick={onExport}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all duration-200 cursor-pointer"
            title="导出 HTML"
          >
            导出 HTML
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="relative flex-1 overflow-hidden">
        {showSkeleton && (
          <div className="absolute inset-0 z-10 bg-white">
            <Skeleton error={renderError ?? undefined} />
          </div>
        )}
        <iframe
          ref={iframeRef}
          srcDoc={getSandboxTemplate()}
          sandbox="allow-scripts"
          className="w-full h-full border-0"
          title="预览"
        />
      </div>
    </div>
  );
}