
export type PadConfig = {
  id: string
  label: string
  key?: string // Keyboard hotkey like "Q"
  url: string  // public path e.g. /sounds/drum.wav
  gain?: number // 0.0 - 1.0 default 1.0
  loop?: boolean
  attackMs?: number // fade in ms
  releaseMs?: number // fade out ms
}
