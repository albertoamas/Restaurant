let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/**
 * Tick de ruleta — suena cada vez que cambia el nombre.
 * progress 0→1: el tono baja de agudo a grave conforme el ánfora frena.
 */
export function playDrawTick(progress: number): void {
  try {
    const ac = getCtx();
    const now = ac.currentTime;

    // Tono principal
    const osc = ac.createOscillator();
    const oscGain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1100 - 500 * progress; // agudo → grave
    oscGain.gain.setValueAtTime(0.14, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(oscGain);
    oscGain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.07);

    // Capa de ruido para textura de "bolilla"
    const bufLen = Math.floor(ac.sampleRate * 0.045);
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const noise = ac.createBufferSource();
    noise.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2800;
    filter.Q.value = 3;
    const noiseGain = ac.createGain();
    noiseGain.gain.setValueAtTime(0.06, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ac.destination);
    noise.start(now);
    noise.stop(now + 0.045);
  } catch {
    // Silencio si el navegador bloquea audio
  }
}

/**
 * Fanfarria ganadora — redoble + explosión + acorde sostenido tipo estadio.
 */
export function playWinnerFanfare(): void {
  try {
    const ac = getCtx();
    const now = ac.currentTime;

    // 1) Redoble de tambor (8 golpes acelerando en 0.7 s)
    for (let i = 0; i < 8; i++) {
      const t = now + i * i * 0.012; // acelera exponencialmente
      const bLen = Math.floor(ac.sampleRate * 0.055);
      const b = ac.createBuffer(1, bLen, ac.sampleRate);
      const d = b.getChannelData(0);
      for (let j = 0; j < bLen; j++) d[j] = Math.random() * 2 - 1;
      const src = ac.createBufferSource();
      src.buffer = b;
      const lpf = ac.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 180 + i * 15;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.5 + i * 0.04, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
      src.connect(lpf); lpf.connect(g); g.connect(ac.destination);
      src.start(t); src.stop(t + 0.06);
    }

    // 2) Explosión de impacto en t=0.72 s (bombo + chasquido)
    const boom = now + 0.72;

    // Bombo profundo
    const kick = ac.createOscillator();
    const kickGain = ac.createGain();
    kick.type = 'sine';
    kick.frequency.setValueAtTime(140, boom);
    kick.frequency.exponentialRampToValueAtTime(40, boom + 0.25);
    kickGain.gain.setValueAtTime(0.9, boom);
    kickGain.gain.exponentialRampToValueAtTime(0.001, boom + 0.35);
    kick.connect(kickGain); kickGain.connect(ac.destination);
    kick.start(boom); kick.stop(boom + 0.36);

    // Chasquido de impacto
    const snapLen = Math.floor(ac.sampleRate * 0.08);
    const snapBuf = ac.createBuffer(1, snapLen, ac.sampleRate);
    const snapData = snapBuf.getChannelData(0);
    for (let i = 0; i < snapLen; i++) snapData[i] = Math.random() * 2 - 1;
    const snapSrc = ac.createBufferSource();
    snapSrc.buffer = snapBuf;
    const snapHpf = ac.createBiquadFilter();
    snapHpf.type = 'highpass';
    snapHpf.frequency.value = 3000;
    const snapGain = ac.createGain();
    snapGain.gain.setValueAtTime(0.6, boom);
    snapGain.gain.exponentialRampToValueAtTime(0.001, boom + 0.08);
    snapSrc.connect(snapHpf); snapHpf.connect(snapGain); snapGain.connect(ac.destination);
    snapSrc.start(boom); snapSrc.stop(boom + 0.09);

    // 3) Fanfarria de trompeta (Do5-Mi5-Sol5-Do6) con timbre metálico
    const fanfare: Array<[number, number, number]> = [
      [523.25, boom + 0.02, 0.18],
      [659.25, boom + 0.17, 0.18],
      [783.99, boom + 0.32, 0.18],
      [1046.5, boom + 0.47, 0.55],
    ];
    fanfare.forEach(([freq, t, dur]) => {
      // Oscilador principal
      const o1 = ac.createOscillator();
      const o2 = ac.createOscillator(); // armónico para timbre metálico
      const g = ac.createGain();
      o1.type = 'sawtooth'; o1.frequency.value = freq;
      o2.type = 'sawtooth'; o2.frequency.value = freq * 2.01; // leve detune
      const o2g = ac.createGain(); o2g.gain.value = 0.3;
      o2.connect(o2g); o2g.connect(g);
      o1.connect(g); g.connect(ac.destination);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.22, t + 0.025);
      g.gain.setValueAtTime(0.18, t + dur - 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o1.start(t); o1.stop(t + dur + 0.01);
      o2.start(t); o2.stop(t + dur + 0.01);
    });

    // 4) Acorde sostenido (Do Mayor: Do4-Mi4-Sol4-Do5) que resuena
    const sustain = boom + 0.47 + 0.1;
    [261.63, 329.63, 392.0, 523.25].forEach((freq) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, sustain);
      g.gain.linearRampToValueAtTime(0.18, sustain + 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, sustain + 1.6);
      o.connect(g); g.connect(ac.destination);
      o.start(sustain); o.stop(sustain + 1.65);
    });
  } catch {
    // Silencio si el navegador bloquea audio
  }
}
