'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { stylePresets } from '@/lib/styles';
import type { StyleId } from '@/lib/types';

interface StyleSelectorProps {
  value: StyleId;
  onChange: (style: StyleId) => void;
}

export function StyleSelector({ value, onChange }: StyleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = stylePresets.find((s) => s.id === value) ?? stylePresets[0];

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = useCallback((id: StyleId) => {
    onChange(id);
    setIsOpen(false);
  }, [onChange]);

  return (
    <div className="px-4 py-2 border-b border-gray-100" ref={containerRef}>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        设计风格
      </label>
      {/* 触发按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:border-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
      >
        <div className="flex items-center gap-2">
          {/* 色彩预览点 */}
          <div className="flex gap-1">
            <span
              className="w-3 h-3 rounded-full border border-black/10"
              style={{ backgroundColor: selected.previewColors.bg }}
            />
            <span
              className="w-3 h-3 rounded-full border border-black/10"
              style={{ backgroundColor: selected.previewColors.fg }}
            />
            <span
              className="w-3 h-3 rounded-full border border-black/10"
              style={{ backgroundColor: selected.previewColors.accent }}
            />
          </div>
          <span className="text-gray-800">{selected.name}</span>
          <span className="text-gray-400 text-xs hidden sm:inline">{selected.description}</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 下拉选项 */}
      {isOpen && (
        <div className="mt-1 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          {stylePresets.map((style) => {
            const isSelected = value === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => handleSelect(style.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                {/* 色彩预览点 */}
                <div className="flex gap-1 shrink-0">
                  <span
                    className="w-3 h-3 rounded-full border border-black/10"
                    style={{ backgroundColor: style.previewColors.bg }}
                  />
                  <span
                    className="w-3 h-3 rounded-full border border-black/10"
                    style={{ backgroundColor: style.previewColors.fg }}
                  />
                  <span
                    className="w-3 h-3 rounded-full border border-black/10"
                    style={{ backgroundColor: style.previewColors.accent }}
                  />
                </div>
                <div className="min-w-0">
                  <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                    {style.name}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">{style.description}</span>
                </div>
                {/* 选中标记 */}
                {isSelected && (
                  <svg className="w-4 h-4 text-blue-500 ml-auto shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
