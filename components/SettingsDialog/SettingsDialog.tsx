'use client';

import { useState, useEffect } from 'react';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: { model: string; customApiKey: string };
  onSave: (settings: { model: string; customApiKey: string }) => void;
  availableModels: { id: string; name: string; available: boolean }[];
}

export function SettingsDialog({
  isOpen,
  onClose,
  settings,
  onSave,
  availableModels,
}: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

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
        <h2 className="text-lg font-semibold mb-4">设置</h2>

        {/* 模型选择 */}
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
            {availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
                {!model.available ? ' (未配置)' : ''}
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
            value={localSettings.customApiKey}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings,
                customApiKey: e.target.value,
              })
            }
            placeholder="留空则使用服务端默认配置"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            输入自定义 API Key 以使用您自己的配额，留空将使用服务端默认配置。
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
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
