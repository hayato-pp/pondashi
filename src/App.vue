
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SoundPad from './components/SoundPad.vue'
import type { PadConfig } from './types'
import { defaultKeyMap } from './stores/keys'
import { useAudioEngine } from './composables/useAudioEngine'

const engine = useAudioEngine()
const globalGain = ref(1)

// Edit this mapping to your file names:
const pads = ref<PadConfig[]>([
  { id:'pad1', label:'オープニング', key: 'Q', url:'/sounds/opening.mp3', gain:1, loop:false, attackMs:10, releaseMs:120 },
  { id:'pad2', label:'効果音1', key: 'W', url:'/sounds/effect1.mp3', gain:1, loop:false, attackMs:10, releaseMs:120 },
  { id:'pad3', label:'BGMループ', key: 'E', url:'/sounds/bgm.mp3', gain:0.8, loop:true, attackMs:30, releaseMs:500 },
  { id:'pad4', label:'ジングル', key: 'A', url:'/sounds/jingle.mp3', gain:1, loop:false, attackMs:10, releaseMs:200 },
])

function updatePad(idx: number, patch: Partial<PadConfig>) {
  pads.value[idx] = { ...pads.value[idx], ...patch }
}

// Space: Resume audio context if needed (first gesture unlock on Safari/iOS)
function onKey(e: KeyboardEvent) {
  if (e.code === 'Space') {
    engine.resumeContext()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
</script>

<template>
  <div class="container">
    <h1>ポン出しくん (Vue 3 + Web Audio)</h1>
    <p>public/sounds に音源ファイルを入れて、下のパッドにファイル名を合わせてください。</p>

    <div class="row" style="margin-bottom: 12px;">
      <label style="flex:1">
        マスター音量 {{ (globalGain*100)|0 }}%
        <input type="range" min="0" max="1" step="0.01" v-model.number="globalGain" />
      </label>
      <button @click="engine.ensureCtx()">AudioContext開始</button>
    </div>

    <div class="grid">
      <SoundPad v-for="(p, i) in pads" :key="p.id" :pad="p" :globalGain="globalGain"
        @update="patch => updatePad(i, patch)" />
    </div>

    <p class="footer">
      ⌨️ キーボード: Q W E A ... を押すと再生/停止。SpaceでAudioContextを復帰（iOS/Safari対策）。
    </p>
  </div>
</template>
