'use client';

import type { Message, StyleId, Session } from '@/lib/types';
import { ImageUpload } from './ImageUpload';
import { StyleSelector } from '@/components/StyleSelector';
import { ChatArea } from './ChatArea';
import { SessionList } from '@/components/SessionList';

interface InputPanelProps {
  image: string | null;
  onImageChange: (base64: string | null) => void;
  style: StyleId;
  onStyleChange: (style: StyleId) => void;
  messages: Message[];
  isGenerating: boolean;
  onSend: (text: string) => void;
  sessions: Session[];
  currentSessionId: string | null;
  onSelectSession: (session: Session) => void;
  onDeleteSession: (id: string) => void;
  onNewSession: () => void;
}

export function InputPanel({
  image,
  onImageChange,
  style,
  onStyleChange,
  messages,
  isGenerating,
  onSend,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onNewSession,
}: InputPanelProps) {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 shadow-sm flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">VibeFrame</h1>
            <p className="text-xs font-medium text-slate-500">草图即刻化境引擎</p>
          </div>
        </div>
        <SessionList
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelect={onSelectSession}
          onDelete={onDeleteSession}
          onNewSession={onNewSession}
        />
      </div>

      {/* 图片上传 */}
      <div className="px-4 pt-4">
        <ImageUpload image={image} onImageChange={onImageChange} />
      </div>

      {/* 风格选择 */}
      <StyleSelector value={style} onChange={onStyleChange} />

      {/* 聊天区域 */}
      <ChatArea
        messages={messages}
        isGenerating={isGenerating}
        onSend={onSend}
      />
    </div>
  );
}
