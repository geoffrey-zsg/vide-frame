'use client';

import { useState, useEffect } from 'react';
import { PROVIDER_CONFIGS } from '@/lib/model-config';
import type { ProviderId } from '@/lib/model-config';
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

  // 当前选中的 provider 配置
  const currentProvider = PROVIDER_CONFIGS.find(
    (p) => p.id === localSettings.provider,
  );

  const handleProviderChange = (providerId: string) => {
    const provider = PROVIDER_CONFIGS.find((p) => p.id === providerId);
    if (!provider) return;
    // 切换 provider 时自动选中该 provider 的第一个 model
    setLocalSettings({
      ...localSettings,
      provider: providerId as ProviderId,
      model: provider.models[0]?.id ?? '',
    });
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

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
            Provider
          </label>
          <select
            value={localSettings.provider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {PROVIDER_CONFIGS.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </div>

        {/* Model 选择（联动 Provider） */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            模型
          </label>
          <select
            value={localSettings.model}
            onChange={(e) =>
              setLocalSettings({ ...localSettings, model: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {currentProvider?.models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
                {model.supportsVision ? '' : ' (不支持图片)'}
              </option>
            ))}
          </select>
        </div>

        {/* API Key 输入 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <input
            type="password"
            value={localSettings.apiKey}
            onChange={(e) =>
              setLocalSettings({ ...localSettings, apiKey: e.target.value })
            }
            placeholder="输入对应 Provider 的 API Key"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            API Key 仅存储在浏览器本地，不会上传至服务端存储。
          </p>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!localSettings.apiKey.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
