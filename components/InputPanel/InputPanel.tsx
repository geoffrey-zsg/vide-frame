'use client';

import type { Message, StyleId } from '@/lib/types';
import { ImageUpload } from './ImageUpload';
import { StyleSelector } from '@/components/StyleSelector';
import { ChatArea } from './ChatArea';

interface InputPanelProps {
  image: string | null;
  onImageChange: (base64: string | null) => void;
  style: StyleId;
  onStyleChange: (style: StyleId) => void;
  messages: Message[];
  isGenerating: boolean;
  onSend: (text: string) => void;
}

export function InputPanel({
  image,
  onImageChange,
  style,
  onStyleChange,
  messages,
  isGenerating,
  onSend,
}: InputPanelProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Title bar */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">VibeFrame</h1>
        <p className="text-xs text-gray-500">草图即刻化境引擎</p>
      </div>

      {/* Image upload */}
      <ImageUpload image={image} onImageChange={onImageChange} />

      {/* Style selector */}
      <StyleSelector value={style} onChange={onStyleChange} />

      {/* Chat area */}
      <ChatArea
        messages={messages}
        isGenerating={isGenerating}
        onSend={onSend}
      />
    </div>
  );
}
