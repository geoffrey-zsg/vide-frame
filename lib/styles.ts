import type { StylePreset, StyleId } from './types';

export const stylePresets: StylePreset[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean white background with generous whitespace, thin lines, and no shadows',
    promptInstruction:
      'Use a minimal, clean design style. Background must be pure white (#FFFFFF). ' +
      'Text color is near-black (#1A1A1A). Use generous whitespace and padding (at least 2rem). ' +
      'Borders should be 1px solid #E5E5E5 — no box-shadows at all. ' +
      'Use a sans-serif font stack: Inter, system-ui, sans-serif. ' +
      'Accent color is #111111 for links and interactive elements. ' +
      'Keep the layout airy with max-width 720px centered. ' +
      'Buttons should have 1px borders, no background fill, and subtle hover states.',
    previewColors: {
      bg: '#FFFFFF',
      fg: '#1A1A1A',
      accent: '#111111',
    },
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Deep dark gradient background with soft highlights and blue accent color',
    promptInstruction:
      'Use a dark mode design. Background is a linear gradient from #0F0F1A to #1A1A2E. ' +
      'Primary text color is #E0E0E0, secondary text is #9CA3AF. ' +
      'Accent color is #3B82F6 (bright blue) for links, buttons, and highlights. ' +
      'Use subtle soft glows: box-shadow 0 0 20px rgba(59,130,246,0.15) on cards. ' +
      'Card backgrounds are rgba(255,255,255,0.05) with 1px border of rgba(255,255,255,0.1). ' +
      'Font stack: Inter, system-ui, sans-serif. ' +
      'Ensure high contrast ratios for accessibility. Buttons use solid #3B82F6 background with white text.',
    previewColors: {
      bg: '#0F0F1A',
      fg: '#E0E0E0',
      accent: '#3B82F6',
    },
  },
  {
    id: 'glass',
    name: 'Glassmorphism',
    description: 'Frosted glass effect with semi-transparent layers and backdrop blur',
    promptInstruction:
      'Use a glassmorphism design style. Page background is a vivid gradient from #667EEA to #764BA2. ' +
      'Card and container backgrounds use rgba(255,255,255,0.15) with backdrop-filter: blur(12px). ' +
      'Borders are 1px solid rgba(255,255,255,0.25). ' +
      'Text color is #FFFFFF with text-shadow 0 1px 2px rgba(0,0,0,0.1) for readability. ' +
      'Accent color is #F9FAFB (near-white) for interactive elements. ' +
      'Use rounded corners (border-radius: 16px) on all cards. ' +
      'Add subtle box-shadow: 0 8px 32px rgba(0,0,0,0.2). ' +
      'Font stack: Inter, system-ui, sans-serif. Keep layout elegant with layered depth.',
    previewColors: {
      bg: '#667EEA',
      fg: '#FFFFFF',
      accent: '#F9FAFB',
    },
  },
  {
    id: 'corporate',
    name: 'Corporate Blue',
    description: 'Professional blue and white color scheme with clear hierarchy and clean typography',
    promptInstruction:
      'Use a professional corporate design. Background is #F8FAFC (light blue-gray). ' +
      'Primary text is #1E293B (dark slate). Secondary text is #64748B. ' +
      'Primary accent is #2563EB (strong blue) for headings, buttons, and key actions. ' +
      'Cards use #FFFFFF background with box-shadow: 0 1px 3px rgba(0,0,0,0.1), border-radius: 8px. ' +
      'Use a clear visual hierarchy: h1 is 2.25rem bold, h2 is 1.5rem semibold, body is 1rem regular. ' +
      'Font stack: Inter, system-ui, sans-serif. ' +
      'Buttons are #2563EB with white text, hover is #1D4ED8. ' +
      'Maintain structured grid layouts and consistent 1rem spacing.',
    previewColors: {
      bg: '#F8FAFC',
      fg: '#1E293B',
      accent: '#2563EB',
    },
  },
];

export function getStyleById(id: StyleId): StylePreset | undefined {
  return stylePresets.find((preset) => preset.id === id);
}
