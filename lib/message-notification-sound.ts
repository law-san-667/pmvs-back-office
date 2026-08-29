let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  audioContext ??= new AudioContext();
  return audioContext;
};

export const prepareMessageNotificationSound = () => {
  const context = getAudioContext();
  if (context.state === "suspended") {
    void context.resume().catch(() => undefined);
  }
};

export const playMessageNotificationSound = async () => {
  try {
    const context = getAudioContext();
    if (context.state === "suspended") await context.resume();
    if (context.state !== "running") return;

    const start = context.currentTime;
    const playTone = (frequency: number, delay: number) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const toneStart = start + delay;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, toneStart);
      gain.gain.setValueAtTime(0.0001, toneStart);
      gain.gain.exponentialRampToValueAtTime(0.2, toneStart + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, toneStart + 0.3);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(toneStart);
      oscillator.stop(toneStart + 0.31);
    };

    playTone(659.25, 0);
    playTone(523.25, 0.28);
  } catch {
    // Browsers can block audio until the user interacts with the page.
  }
};
