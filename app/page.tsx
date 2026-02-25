'use client';

import { useState, useEffect, useCallback } from 'react';
import { SplitPane } from '@/components/SplitPane';
import { InputPanel } from '@/components/InputPanel';
import { PreviewPanel } from '@/components/PreviewPanel';
import { SettingsDialog } from '@/components/SettingsDialog';
import { PROVIDER_CONFIGS } from '@/lib/model-config';
import {
  loadSessions,
  saveSession,
  deleteSession as removeSession,
  getCurrentSessionId,
  setCurrentSessionId,
  generateSessionTitle,
} from '@/lib/session-storage';
import type { StyleId, Message, ElementInfo, UserSettings, Session } from '@/lib/types';

declare global {
  interface Window {
    __vibeframe_sendChunk?: (chunk: string) => void;
    __vibeframe_sendComplete?: () => void;
  }
}

const SETTINGS_KEY = 'vibeframe_settings';

// 默认设置：第一个 provider 的第一个 model
const DEFAULT_SETTINGS: UserSettings = {
  provider: PROVIDER_CONFIGS[0].id,
  model: PROVIDER_CONFIGS[0].models[0].id,
  apiKey: '',
};

/** 根据 provider/model ID 获取显示名称 */
function getDisplayNames(settings: UserSettings) {
  const provider = PROVIDER_CONFIGS.find((p) => p.id === settings.provider);
  const model = provider?.models.find((m) => m.id === settings.model);
  return {
    providerName: provider?.name ?? settings.provider,
    modelName: model?.name ?? settings.model,
  };
}

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [style, setStyle] = useState<StyleId>('minimal');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentHTML, setCurrentHTML] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionIdState] = useState<string | null>(null);

  // 初始化：从 localStorage 恢复设置和会话
  useEffect(() => {
    // 恢复用户设置
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserSettings;
        if (parsed.provider && parsed.model) {
          setSettings(parsed);
        }
      }
    } catch {
      // 使用默认值
    }

    // 恢复会话列表与当前会话
    const allSessions = loadSessions();
    setSessions(allSessions);

    const lastSessionId = getCurrentSessionId();
    if (lastSessionId) {
      const found = allSessions.find((s) => s.id === lastSessionId);
      if (found) {
        setMessages(found.messages);
        setCurrentHTML(found.currentHTML);
        setStyle(found.style);
        setCurrentSessionIdState(found.id);
      }
    }
  }, []);

  // 设置变化时持久化到 localStorage
  const handleSaveSettings = useCallback((newSettings: UserSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch {
      // 静默忽略
    }
  }, []);

  // 如果尚未配置 API Key，首次打开时自动弹出设置
  useEffect(() => {
    if (!settings.apiKey) {
      setShowSettings(true);
    }
  }, [settings.apiKey]);

  /** 保存当前会话到 localStorage */
  const autoSaveSession = useCallback(
    (msgs: Message[], html: string | null, sessionId: string | null, currentStyle: StyleId) => {
      // 没有消息就不保存
      if (msgs.length === 0) return sessionId;

      const firstUserMsg = msgs.find((m) => m.role === 'user');
      const title = firstUserMsg
        ? generateSessionTitle(firstUserMsg.content)
        : '新会话';

      const now = Date.now();
      const id = sessionId || crypto.randomUUID();

      const session: Session = {
        id,
        title,
        // 保存时剔除 image 字段防止 localStorage 膨胀
        messages: msgs.map((m) => ({ ...m, image: undefined })),
        currentHTML: html,
        style: currentStyle,
        createdAt: sessionId ? (sessions.find((s) => s.id === id)?.createdAt ?? now) : now,
        updatedAt: now,
      };

      saveSession(session);
      setCurrentSessionId(id);
      setCurrentSessionIdState(id);
      setSessions(loadSessions());
      return id;
    },
    [sessions],
  );

  /** 选择历史会话 */
  const handleSelectSession = useCallback((session: Session) => {
    setMessages(session.messages);
    setCurrentHTML(session.currentHTML);
    setStyle(session.style);
    setImage(null);
    setCurrentSessionIdState(session.id);
    setCurrentSessionId(session.id);
  }, []);

  /** 删除会话 */
  const handleDeleteSession = useCallback(
    (id: string) => {
      removeSession(id);
      const updated = loadSessions();
      setSessions(updated);
      // 如果删的是当前会话，清空页面状态
      if (id === currentSessionId) {
        setMessages([]);
        setCurrentHTML(null);
        setImage(null);
        setCurrentSessionIdState(null);
        setCurrentSessionId(null);
      }
    },
    [currentSessionId],
  );

  /** 新建会话 */
  const handleNewSession = useCallback(() => {
    setMessages([]);
    setCurrentHTML(null);
    setImage(null);
    setCurrentSessionIdState(null);
    setCurrentSessionId(null);
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      if (isGenerating) return;

      if (!settings.apiKey) {
        setShowSettings(true);
        return;
      }

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
            provider: settings.provider,
            model: settings.model,
            apiKey: settings.apiKey,
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

        const finalMessages = [...updatedMessages, { role: 'assistant' as const, content: fullHTML }];
        setMessages(finalMessages);
        sendComplete?.();

        // 自动保存会话
        autoSaveSession(finalMessages, fullHTML, currentSessionId, style);

        if (image) {
          setImage(null);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        const finalMessages = [
          ...updatedMessages,
          { role: 'assistant' as const, content: `Error: ${errorMsg}` },
        ];
        setMessages(finalMessages);
        // 出错也保存会话
        autoSaveSession(finalMessages, currentHTML, currentSessionId, style);
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating, image, messages, style, settings, currentSessionId, currentHTML, autoSaveSession],
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
      // 静默忽略导出错误
    }
  }, [currentHTML]);

  const handleRefresh = useCallback(() => {
    if (!currentHTML) return;
    const iframe = document.querySelector('iframe');
    iframe?.contentWindow?.postMessage({ type: 'render', html: currentHTML }, '*');
  }, [currentHTML]);

  const { providerName, modelName } = getDisplayNames(settings);

  return (
    <main className="h-screen">
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
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            onNewSession={handleNewSession}
          />
        }
        right={
          <PreviewPanel
            isGenerating={isGenerating}
            currentHTML={currentHTML}
            onElementClick={handleElementClick}
            onExport={handleExport}
            onRefresh={handleRefresh}
            providerName={providerName}
            modelName={modelName}
            onOpenSettings={() => setShowSettings(true)}
          />
        }
      />
      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </main>
  );
}
