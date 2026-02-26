'use client';

import { useState, useEffect } from 'react';
import { PROVIDER_PRESETS } from '@/lib/model-config';
import type { ProviderType } from '@/lib/model-config';
import type { UserSettings } from '@/lib/types';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

export function SettingsDialog({
  isOpen,
  onClose,
  settings,
  onSave,
}: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  // 是否需要显示 Base URL 输入框
  const showBaseUrlInput = localSettings.provider === 'openai-compatible';

  const handleProviderChange = (providerId: string) => {
    const preset = PROVIDER_PRESETS.find((p) => p.id === providerId);
    setLocalSettings({
      ...localSettings,
      provider: providerId as ProviderType,
      // 如果是预设 provider，自动填充默认 baseUrl
      baseUrl: preset?.defaultBaseUrl ?? '',
    });
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const isValid = localSettings.apiKey.trim() && localSettings.model.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">模型配置</h2>

        {/* Provider 选择 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Provider
          </label>
          <select
            value={localSettings.provider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {PROVIDER_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        {/* Base URL（仅 OpenAI Compatible 需要填写） */}
        {showBaseUrlInput && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base URL
            </label>
            <input
              type="url"
              value={localSettings.baseUrl}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, baseUrl: e.target.value })
              }
              placeholder="https://api.example.com/v1"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              输入兼容 OpenAI API 的服务端点地址
            </p>
          </div>
        )}

        {/* API Key 输入 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <input
            type="password"
            value={localSettings.apiKey}
            onChange={(e) =>
              setLocalSettings({ ...localSettings, apiKey: e.target.value })
            }
            placeholder="sk-..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Model ID 输入 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model ID
          </label>
          <input
            type="text"
            value={localSettings.model}
            onChange={(e) =>
              setLocalSettings({ ...localSettings, model: e.target.value })
            }
            placeholder="gpt-4o、qwen3-coder-plus 等"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            输入模型标识符，如 gpt-4o、claude-3-5-sonnet、qwen3-coder-plus
          </p>
        </div>

        {/* 提示信息 */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            API Key 仅存储在浏览器本地，不会上传至服务端。
          </p>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}