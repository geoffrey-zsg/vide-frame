'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { getSandboxTemplate } from '@/lib/sandbox-template';
import { Skeleton } from './Skeleton';

// 全屏图标
function FullscreenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

// 退出全屏图标
function ExitFullscreenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  );
}

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if ((container as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
        // Safari 兼容
        (container as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as unknown as { webkitExitFullscreen?: () => void }).webkitExitFullscreen) {
        (document as unknown as { webkitExitFullscreen: () => void }).webkitExitFullscreen();
      }
    }
  }, [isFullscreen]);

  // 监听全屏状态变化
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    // Safari 兼容
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

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

  // 判断是否显示骨架屏（初始空状态或错误状态）
  const showSkeleton = !currentHTML && !isGenerating;
  // 是否显示错误覆盖层
  const showError = !!renderError;
  // 是否正在生成中（用于显示过渡效果）
  const isStreamRendering = isGenerating && currentHTML;

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-slate-50/50">
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
          <button
            onClick={toggleFullscreen}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all duration-200 cursor-pointer flex items-center gap-1.5"
            title={isFullscreen ? '退出全屏' : '全屏查看'}
          >
            {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
            {isFullscreen ? '退出' : '全屏'}
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="relative flex-1 overflow-hidden">
        {/* 初始骨架屏 - 仅在无内容且非生成中时显示 */}
        {showSkeleton && (
          <div className="absolute inset-0 z-10 bg-white transition-opacity duration-300">
            <Skeleton />
          </div>
        )}
        {/* 错误覆盖层 - 半透明背景，不影响 iframe 布局 */}
        {showError && (
          <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm transition-opacity duration-200">
            <Skeleton error={renderError ?? undefined} />
          </div>
        )}
        {/* 流式渲染指示器 - 小型悬浮提示，不遮挡内容 */}
        {isStreamRendering && (
          <div className="absolute top-3 right-3 z-10 px-2.5 py-1.5 rounded-lg bg-indigo-500/90 text-white text-xs font-medium shadow-lg animate-pulse backdrop-blur-sm">
            渲染中...
          </div>
        )}
        <iframe
          ref={iframeRef}
          srcDoc={getSandboxTemplate()}
          sandbox="allow-scripts"
          className="w-full h-full border-0 bg-white"
          title="预览"
        />
      </div>
    </div>
  );
}