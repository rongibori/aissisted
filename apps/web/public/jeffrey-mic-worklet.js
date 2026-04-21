/**
 * Jeffrey mic AudioWorkletProcessor.
 *
 * Runs in the AudioWorkletGlobalScope (not the main thread). Receives mono
 * float32 frames from the microphone graph and converts them to little-endian
 * int16 PCM, bundling into ~100ms chunks before posting to the main thread.
 *
 * The AudioContext upstream is constructed with `{ sampleRate: 24000 }`, so
 * the browser handles resampling for us. We just quantise to int16.
 *
 * Posted messages: ArrayBuffer containing int16 little-endian PCM samples.
 */

const TARGET_CHUNK_SAMPLES = 2400; // 100 ms @ 24 kHz

class JeffreyMicProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Int16Array(TARGET_CHUNK_SAMPLES);
    this._writeIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    // When the upstream node has nothing (e.g. suspended), skip but stay alive.
    if (!input || input.length === 0 || !input[0]) return true;

    const channel = input[0]; // mono — we merge or pick channel 0 upstream
    for (let i = 0; i < channel.length; i++) {
      // Clamp to [-1, 1] and scale to int16 range.
      const sample = Math.max(-1, Math.min(1, channel[i]));
      this._buffer[this._writeIndex++] =
        sample < 0 ? Math.round(sample * 0x8000) : Math.round(sample * 0x7fff);

      if (this._writeIndex >= this._buffer.length) {
        // Transfer ownership to keep GC pressure low.
        const transferBuffer = this._buffer.buffer;
        this.port.postMessage(transferBuffer, [transferBuffer]);
        this._buffer = new Int16Array(TARGET_CHUNK_SAMPLES);
        this._writeIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor("jeffrey-mic-processor", JeffreyMicProcessor);
