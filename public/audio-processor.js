// AudioWorkletProcessor para procesar audio en tiempo real
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    
    if (input.length > 0) {
      const inputChannel = input[0];
      
      // Copiar datos de entrada al buffer
      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[this.bufferIndex] = inputChannel[i];
        this.bufferIndex++;
        
        // Cuando el buffer está lleno, enviarlo al main thread
        if (this.bufferIndex >= this.bufferSize) {
          // Convertir Float32Array a Array para enviarlo
          const audioData = Array.from(this.buffer);
          this.port.postMessage({
            type: 'audioData',
            data: audioData,
            sampleRate: sampleRate
          });
          this.bufferIndex = 0;
        }
      }
    }
    
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);

