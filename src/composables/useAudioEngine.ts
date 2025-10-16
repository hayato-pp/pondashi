
import { ref } from 'vue'

export type LoadedBuffer = {
  url: string
  buffer: AudioBuffer
}

type ActiveNode = {
  source: AudioBufferSourceNode
  gain: GainNode
  startedAt: number
  pausedAt: number | null
}

export function useAudioEngine() {
  const audioCtx = ref<AudioContext | null>(null)
  const decoded = new Map<string, AudioBuffer>()
  const actives = new Map<string, ActiveNode>()

  function ensureCtx() {
    if (!audioCtx.value) {
      audioCtx.value = new AudioContext({ latencyHint: 'interactive' })
    }
    return audioCtx.value!
  }

  async function load(url: string): Promise<AudioBuffer> {
    if (decoded.has(url)) return decoded.get(url)!
    const ctx = ensureCtx()
    const res = await fetch(url)
    const arr = await res.arrayBuffer()
    const buf = await ctx.decodeAudioData(arr)
    decoded.set(url, buf)
    return buf
  }

  // simple linear ramp helper
  function rampGain(g: GainNode, target: number, ms: number) {
    const ctx = ensureCtx()
    const now = ctx.currentTime
    g.gain.cancelScheduledValues(now)
    g.gain.setValueAtTime(g.gain.value, now)
    g.gain.linearRampToValueAtTime(target, now + ms/1000)
  }

  async function play(id: string, url: string, {
    loop=false, gain=1, attackMs=10
  }: { loop?: boolean, gain?: number, attackMs?: number } = {}) {
    const ctx = ensureCtx()
    const buf = await load(url)
    // stop existing
    if (actives.has(id)) stop(id, { releaseMs: 0 })

    const source = ctx.createBufferSource()
    const g = ctx.createGain()
    g.gain.value = 0.0001

    source.buffer = buf
    source.loop = loop
    source.connect(g).connect(ctx.destination)

    source.start()
    rampGain(g, gain, attackMs ?? 10)

    actives.set(id, { source, gain: g, startedAt: ctx.currentTime, pausedAt: null })
  }

  function stop(id: string, { releaseMs=60 }: { releaseMs?: number } = {}) {
    const node = actives.get(id)
    if (!node) return
    const ctx = ensureCtx()
    rampGain(node.gain, 0.0001, releaseMs)
    const stopAt = ctx.currentTime + (releaseMs/1000) + 0.01
    node.source.stop(stopAt)
    actives.delete(id)
  }

  function setGain(id: string, value: number) {
    const node = actives.get(id)
    if (!node) return
    const g = Math.max(0, Math.min(1, value))
    node.gain.gain.setTargetAtTime(g, ensureCtx().currentTime, 0.01)
  }

  function isPlaying(id: string): boolean {
    return actives.has(id)
  }

  async function resumeContext() {
    if (!audioCtx.value) return
    if (audioCtx.value.state === 'suspended') await audioCtx.value.resume()
  }

  return { ensureCtx, load, play, stop, setGain, isPlaying, resumeContext }
}
