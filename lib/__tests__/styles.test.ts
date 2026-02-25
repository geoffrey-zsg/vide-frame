import { describe, it, expect } from 'vitest';
import { stylePresets, getStyleById } from '../styles';

describe('Style presets', () => {
  it('should have exactly 4 style presets', () => {
    expect(stylePresets).toHaveLength(4);
  });

  it('every preset should have all required fields', () => {
    for (const preset of stylePresets) {
      expect(preset.id).toBeDefined();
      expect(typeof preset.id).toBe('string');

      expect(preset.name).toBeDefined();
      expect(typeof preset.name).toBe('string');

      expect(preset.description).toBeDefined();
      expect(typeof preset.description).toBe('string');

      expect(preset.promptInstruction).toBeDefined();
      expect(typeof preset.promptInstruction).toBe('string');

      expect(preset.previewColors).toBeDefined();
      expect(preset.previewColors.bg).toBeDefined();
      expect(typeof preset.previewColors.bg).toBe('string');
      expect(preset.previewColors.fg).toBeDefined();
      expect(typeof preset.previewColors.fg).toBe('string');
      expect(preset.previewColors.accent).toBeDefined();
      expect(typeof preset.previewColors.accent).toBe('string');
    }
  });

  it('getStyleById("dark") should return the dark preset', () => {
    const dark = getStyleById('dark');
    expect(dark).toBeDefined();
    expect(dark!.id).toBe('dark');
    expect(dark!.name).toBeTruthy();
    expect(dark!.promptInstruction).toBeTruthy();
  });

  it('getStyleById("nonexistent") should return undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = getStyleById('nonexistent' as any);
    expect(result).toBeUndefined();
  });
});
