'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Session } from '@/lib/types';
import { formatRelativeTime } from '@/lib/session-storage';

interface SessionListProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSelect: (session: Session) => void;
  onDelete: (id: string) => void;
  onNewSession: () => void;
}

export function SessionList({
  sessions,
  currentSessionId,
  onSelect,
  onDelete,
  onNewSession,
}: SessionListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  // 计算下拉框定位（基于按钮位置，使用 fixed 避免被祖先 overflow 裁切）
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
  }, []);

  // 打开时计算位置
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }
  }, [isOpen, updatePosition]);

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <>
      {/* 触发按钮 */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
        title="历史会话"
      >
        <svg className="w-4 h-4 inline-block mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        历史
      </button>

      {/* 下拉面板 — fixed 定位，不受祖先 overflow 影响 */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-[100] max-h-[400px] flex flex-col"
          style={{ top: pos.top, right: pos.right }}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 shrink-0">
            <span className="text-sm font-medium text-gray-700">历史会话</span>
            <button
              type="button"
              onClick={() => {
                onNewSession();
                setIsOpen(false);
              }}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              + 新会话
            </button>
          </div>

          {/* 会话列表 */}
          <div className="overflow-y-auto flex-1">
            {sessions.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-gray-400">
                暂无历史会话
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer group ${
                    session.id === currentSessionId ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    onSelect(session);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800 truncate">
                      {session.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatRelativeTime(session.updatedAt)}
                    </div>
                  </div>
                  {/* 删除按钮 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity shrink-0"
                    title="删除会话"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
