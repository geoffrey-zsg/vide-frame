'use client';

import { stylePresets } from '@/lib/styles';
import type { StyleId } from '@/lib/types';

interface StyleSelectorProps {
  value: StyleId;
  onChange: (style: StyleId) => void;
}

export function StyleSelector({ value, onChange }: StyleSelectorProps) {
  return (
    <div className="flex gap-2 p-3">
      {stylePresets.map((style) => {
        const isSelected = value === style.id;
        return (
          <button
            key={style.id}
            type="button"
            title={style.description}
            onClick={() => onChange(style.id)}
            className={`flex-1 flex flex-col items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              isSelected
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex gap-1.5">
              <span
                className="w-4 h-4 rounded-full border border-black/10"
                style={{ backgroundColor: style.previewColors.bg }}
              />
              <span
                className="w-4 h-4 rounded-full border border-black/10"
                style={{ backgroundColor: style.previewColors.fg }}
              />
              <span
                className="w-4 h-4 rounded-full border border-black/10"
                style={{ backgroundColor: style.previewColors.accent }}
              />
            </div>
            <span>{style.name}</span>
          </button>
        );
      })}
    </div>
  );
}
