'use client';

import { stylePresets } from '@/lib/styles';
import type { StyleId } from '@/lib/types';

interface StyleSelectorProps {
  value: StyleId;
  onChange: (style: StyleId) => void;
}

export function StyleSelector({ value, onChange }: StyleSelectorProps) {
  return (
    <div className="px-4 py-2 border-b border-gray-100">
      <label className="block text-xs font-medium text-gray-500 mb-1">
        设计风格
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as StyleId)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm
                   focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
      >
        {stylePresets.map((style) => (
          <option key={style.id} value={style.id}>
            {style.name} — {style.description}
          </option>
        ))}
      </select>
    </div>
  );
}
