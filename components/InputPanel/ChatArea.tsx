'use client';

import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
} from 'react';
import type { Message } from '@/lib/types';
import { CollapsibleCode } from './CollapsibleCode';

// 判断 assistant 消息是否为 HTML 代码
function isHTMLContent(msg: Message): boolean {
  if (msg.role !== 'assistant') return false;
  const trimmed = msg.content.trim();
  return trimmed.startsWith('<') || trimmed.startsWith('<!DOCTYPE');
}

interface ChatAreaProps {
  messages: Message[];
  isGenerating: boolean;
  onSend: (text: string) => void;
  onPreviewHTML: (html: string) => void;
}

export function ChatArea({ messages, isGenerating, onSend, onPreviewHTML }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;
    onSend(trimmed);
    setInput('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Message history */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">上传草图或输入描述开始生成</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`rounded-lg px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-50 text-blue-900 ml-6'
                  : 'bg-gray-50 text-gray-700 mr-6'
              }`}
            >
              {isHTMLContent(msg) ? (
                <CollapsibleCode code={msg.content} onPreview={onPreviewHTML} />
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 bg-slate-50/80 backdrop-blur">
        <div className="relative flex items-end gap-2 p-2 bg-white border border-slate-200 rounded-2xl shadow-sm focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all duration-200">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="描述你想要的界面..."
            rows={1}
            className="flex-1 max-h-32 min-h-[40px] resize-none bg-transparent px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            style={{
              height: 'auto',
              maxHeight: '8rem',
            }}
          />
          <div className="flex items-center gap-1.5 pb-1 pr-1">
            {/* Send button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-500 text-white shadow-sm hover:bg-indigo-600 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              aria-label="Send message"
            >
              <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
