
<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useAudioEngine } from '../composables/useAudioEngine'
import type { PadConfig } from '../types'

const props = defineProps<{
  pad: PadConfig
  globalGain: number
}>()

const emit = defineEmits<{ (e:'update', value: Partial<PadConfig>): void }>()

const engine = useAudioEngine()
const gainLocal = ref(props.pad.gain ?? 1)
const loopLocal = ref(!!props.pad.loop)
const attackMsLocal = ref(props.pad.attackMs ?? 10)
const releaseMsLocal = ref(props.pad.releaseMs ?? 60)

const playing = computed(() => engine.isPlaying(props.pad.id))

function onPlay() {
  engine.play(props.pad.id, props.pad.url, {
    loop: loopLocal.value,
    gain: gainLocal.value * props.globalGain,
    attackMs: attackMsLocal.value
  })
}
function onStop() {
  engine.stop(props.pad.id, { releaseMs: releaseMsLocal.value })
}
function onGain(v: number) {
  gainLocal.value = v
  engine.setGain(props.pad.id, v * props.globalGain)
  emit('update', { gain: v })
}
function onLoop(v: boolean) {
  loopLocal.value = v
  emit('update', { loop: v })
}
function onAttack(v: number) { attackMsLocal.value = v; emit('update', { attackMs: v }) }
function onRelease(v: number) { releaseMsLocal.value = v; emit('update', { releaseMs: v }) }

const keyLabel = computed(() => props.pad.key ?? '')

// Keyboard hotkey
function onKey(e: KeyboardEvent) {
  if (!props.pad.key) return
  if (e.key.toUpperCase() === props.pad.key.toUpperCase()) {
    e.preventDefault()
    if (playing.value) {
      onStop()
    } else {
      onPlay()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="pad" :class="{ playing }">
    <header>
      <h3 :title="pad.label">{{ pad.label }}</h3>
      <span v-if="keyLabel" class="kbd">{{ keyLabel }}</span>
    </header>
    <div class="row">
      <button class="play" @click="onPlay">再生</button>
      <button class="stop" @click="onStop">停止</button>
      <label><input type="checkbox" v-model="loopLocal" @change="onLoop(loopLocal)"> ループ</label>
    </div>
    <div class="row">
      <label style="width:100%">
        音量 {{ (gainLocal*100)|0 }}%
        <input type="range" min="0" max="1" step="0.01" v-model.number="gainLocal" @input="onGain(gainLocal)" />
      </label>
    </div>
    <div class="row">
      <label style="flex:1">
        Attack {{ attackMsLocal }}ms
        <input type="range" min="0" max="500" step="5" v-model.number="attackMsLocal" @input="onAttack(attackMsLocal)" />
      </label>
      <label style="flex:1">
        Release {{ releaseMsLocal }}ms
        <input type="range" min="0" max="2000" step="10" v-model.number="releaseMsLocal" @input="onRelease(releaseMsLocal)" />
      </label>
    </div>
  </div>
</template>
