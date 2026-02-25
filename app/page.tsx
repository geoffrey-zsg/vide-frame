'use client';

import { useState, useEffect, useCallback } from 'react';
import { SplitPane } from '@/components/SplitPane';
import { InputPanel } from '@/components/InputPanel';
import { PreviewPanel } from '@/components/PreviewPanel';
import { SettingsDialog } from '@/components/SettingsDialog';
import type { StyleId, Message, ModelInfo, ElementInfo } from '@/lib/types';

declare global {
  interface Window {
    __vibeframe_sendChunk?: (chunk: string) => void;
    __vibeframe_sendComplete?: () => void;
  }
}

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [style, setStyle] = useState<StyleId>('minimal');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentHTML, setCurrentHTML] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({ model: 'gpt-4o', customApiKey: '' });
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);

  useEffect(() => {
    fetch('/api/models')
      .then((res) => res.json())
      .then((data: { models: ModelInfo[] }) => {
        setAvailableModels(data.models);
        const firstAvailable = data.models.find((m) => m.available);
        if (firstAvailable) {
          setSettings((prev) => ({ ...prev, model: firstAvailable.id }));
        }
      })
      .catch(() => {
        // silently ignore – models endpoint may not be ready
      });
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      if (isGenerating) return;
      setIsGenerating(true);

      const userMessage: Message = {
        role: 'user',
        content: text,
        image: image ?? undefined,
      };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      const sendChunk = window.__vibeframe_sendChunk;
      const sendComplete = window.__vibeframe_sendComplete;
      let fullHTML = '';

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image,
            prompt: text,
            style,
            history: messages,
            model: settings.model,
            apiKey: settings.customApiKey || undefined,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.chunk) {
                fullHTML += data.chunk;
                sendChunk?.(data.chunk);
              }
              if (data.done && data.html) {
                fullHTML = data.html;
                setCurrentHTML(data.html);
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }

        setMessages([...updatedMessages, { role: 'assistant', content: fullHTML }]);
        sendComplete?.();

        if (image) {
          setImage(null);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setMessages([
          ...updatedMessages,
          { role: 'assistant', content: `Error: ${errorMsg}` },
        ]);
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating, image, messages, style, settings],
  );

  const handleElementClick = useCallback((info: ElementInfo) => {
    const desc = `[${info.positionDescription}] "${info.textContent}"`;
    window.dispatchEvent(new CustomEvent('fill-input', { detail: desc }));
  }, []);

  const handleExport = useCallback(async () => {
    if (!currentHTML) return;
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: currentHTML }),
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vibeframe-export.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silently ignore export errors
    }
  }, [currentHTML]);

  const handleRefresh = useCallback(() => {
    if (!currentHTML) return;
    const iframe = document.querySelector('iframe');
    iframe?.contentWindow?.postMessage({ type: 'render', html: currentHTML }, '*');
  }, [currentHTML]);

  return (
    <main className="h-screen">
      <button
        onClick={() => setShowSettings(true)}
        className="fixed top-3 right-3 z-40 rounded-full bg-white/80 p-2 shadow backdrop-blur hover:bg-white"
        title="设置"
      >
        ⚙
      </button>
      <SplitPane
        left={
          <InputPanel
            image={image}
            onImageChange={setImage}
            style={style}
            onStyleChange={setStyle}
            messages={messages}
            isGenerating={isGenerating}
            onSend={handleSend}
          />
        }
        right={
          <PreviewPanel
            isGenerating={isGenerating}
            currentHTML={currentHTML}
            onElementClick={handleElementClick}
            onExport={handleExport}
            onRefresh={handleRefresh}
          />
        }
      />
      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={setSettings}
        availableModels={availableModels}
      />
    </main>
  );
}
