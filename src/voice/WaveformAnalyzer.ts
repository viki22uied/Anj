export class WaveformAnalyzer {
  private analyser: AnalyserNode | null = null;
  private dataArray!: Uint8Array;
  private animFrameId: number = 0;
  private onData: (bars: number[]) => void;
  private BAR_COUNT = 7;

  constructor(onData: (bars: number[]) => void) {
    this.onData = onData;
  }

  attach(stream: MediaStream, audioContext: AudioContext): void {
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 64;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(this.analyser);

    this.tick();
  }

  private tick(): void {
    if (!this.analyser || !this.dataArray) return;
    
    // Use type assertion to bypass the ArrayBufferLike issue
    const dataArray = this.dataArray as Uint8Array;
    this.analyser.getByteFrequencyData(dataArray as any);

    // Downsample to BAR_COUNT bars
    const barSize = Math.floor(dataArray.length / this.BAR_COUNT);
    const bars = Array.from({ length: this.BAR_COUNT }, (_, i) => {
      const start = i * barSize;
      const end = (i + 1) * barSize;
      let sum = 0;
      for (let j = start; j < end && j < dataArray.length; j++) {
        sum += dataArray[j];
      }
      const avg = sum / (end - start);
      return avg / 255;
    });

    this.onData(bars);
    this.animFrameId = requestAnimationFrame(() => this.tick());
  }

  detach(): void {
    cancelAnimationFrame(this.animFrameId);
    this.analyser = null;
  }
}
