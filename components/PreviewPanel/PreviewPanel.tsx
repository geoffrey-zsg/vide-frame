'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import type { ElementInfo, SandboxMessage } from '@/lib/types';
import { getSandboxTemplate } from '@/lib/sandbox-template';
import { Skeleton } from './Skeleton';

declare global {
  interface Window {
    __vibeframe_sendChunk?: (chunk: string) => void;
    __vibeframe_sendComplete?: () => void;
  }
}

interface PreviewPanelProps {
  isGenerating: boolean;
  currentHTML: string | null;
  onElementClick: (info: ElementInfo) => void;
  onExport: () => void;
  onRefresh: () => void;
  providerName: string;
  modelName: string;
  onOpenSettings: () => void;
}

export function PreviewPanel({
  isGenerating,
  currentHTML,
  onElementClick,
  onExport,
  onRefresh,
  providerName,
  modelName,
  onOpenSettings,
}: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Listen for messages from the sandbox iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent<SandboxMessage>) {
      const msg = e.data;
      if (!msg || !msg.type) return;

      switch (msg.type) {
        case 'ready':
          setIframeReady(true);
          break;
        case 'render-error':
          setRenderError(msg.error);
          break;
        case 'element-clicked':
          onElementClick(msg.elementInfo);
          break;
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onElementClick]);

  // Send full HTML to iframe when currentHTML changes, and clear any previous error
  useEffect(() => {
    if (!iframeReady || !currentHTML) return;
    // Clearing previous render error before posting new HTML is intentional;
    // this is not a cascading render but a coordinated state reset.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRenderError(null);
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'render', html: currentHTML },
      '*'
    );
  }, [currentHTML, iframeReady]);

  // Chunk streaming helpers
  const sendChunk = useCallback(
    (chunk: string) => {
      if (!iframeReady) return;
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'render-chunk', chunk },
        '*'
      );
    },
    [iframeReady]
  );

  const sendComplete = useCallback(() => {
    if (!iframeReady) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'render-complete' },
      '*'
    );
  }, [iframeReady]);

  // Expose chunk helpers on window for the main page to call
  useEffect(() => {
    window.__vibeframe_sendChunk = sendChunk;
    window.__vibeframe_sendComplete = sendComplete;
    return () => {
      delete window.__vibeframe_sendChunk;
      delete window.__vibeframe_sendComplete;
    };
  }, [sendChunk, sendComplete]);

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
