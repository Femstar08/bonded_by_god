export type EditorFont = 'dm-serif' | 'lora' | 'merriweather' | 'eb-garamond' | 'geist'

export interface FontOption {
  value: EditorFont
  label: string
  className: string
}

export const FONT_OPTIONS: FontOption[] = [
  { value: 'dm-serif', label: 'DM Serif', className: 'editor-font-dm-serif' },
  { value: 'lora', label: 'Lora', className: 'editor-font-lora' },
  { value: 'merriweather', label: 'Merriweather', className: 'editor-font-merriweather' },
  { value: 'eb-garamond', label: 'EB Garamond', className: 'editor-font-eb-garamond' },
  { value: 'geist', label: 'Geist', className: 'editor-font-geist' },
]

export function getFontClass(font: EditorFont): string {
  return FONT_OPTIONS.find((f) => f.value === font)?.className ?? 'editor-font-dm-serif'
}
