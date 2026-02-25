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
    <div className="flex flex-col h-full bg-white">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">VibeFrame</h1>
          <p className="text-xs text-gray-500">草图即刻化境引擎</p>
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
      <ImageUpload image={image} onImageChange={onImageChange} />

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
