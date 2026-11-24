const sounds = {
	'lamp-on': { duration: 0.065, cutoff: 1700, volume: 0.045, pitch: 0 },
	'lamp-off': { duration: 0.065, cutoff: 1100, volume: 0.045, pitch: 0 },
	sip: { duration: 0.43, cutoff: 950, volume: 0.1, pitch: 155 },
	'cup-down': { duration: 0.13, cutoff: 1800, volume: 0.055, pitch: 350 },
	'paper-down': { duration: 0.14, cutoff: 2400, volume: 0.025, pitch: 0 },
	'card-down': { duration: 0.09, cutoff: 2000, volume: 0.032, pitch: 220 }
} as const;

type DeskSound = keyof typeof sounds;

export function createDeskSound(isEnabled: () => boolean) {
	let context: AudioContext | undefined;
	const buffers = new Map<DeskSound, AudioBuffer>();
	const playing = new Set<AudioBufferSourceNode>();

	async function unlock() {
		if (!isEnabled()) return;
		try {
			context ??= new AudioContext();
			if (context.state !== 'running') await context.resume();
		} catch {
			// Desk interactions still work when audio is blocked.
		}
	}

	function bufferFor(audio: AudioContext, sound: DeskSound) {
		const existing = buffers.get(sound);
		if (existing) return existing;
		const { duration, pitch } = sounds[sound];
		const length = Math.ceil(audio.sampleRate * duration);
		const buffer = audio.createBuffer(1, length, audio.sampleRate);
		const samples = buffer.getChannelData(0);
		for (let index = 0; index < length; index++) {
			const progress = index / length;
			const seconds = index / audio.sampleRate;
			const noise = Math.random() * 2 - 1;
			const ring = pitch ? Math.sin(2 * Math.PI * pitch * seconds) : 0;
			const envelope = (1 - progress) ** 2;
			if (sound === 'sip') {
				const bubbles = 0.5 + 0.5 * Math.sin(2 * Math.PI * seconds * (15 + progress * 11));
				const attack = Math.min(progress * 14, 1);
				samples[index] = attack * envelope * bubbles * (0.85 * noise + 0.15 * ring);
			} else {
				samples[index] = envelope * (0.75 * noise + 0.25 * ring);
			}
		}
		buffers.set(sound, buffer);
		return buffer;
	}

	function stop() {
		for (const source of playing) source.stop();
		playing.clear();
	}

	return {
		unlock,
		stop,
		async play(sound: DeskSound, fromGesture = false) {
			if (!isEnabled()) return;
			if (fromGesture && context?.state !== 'running') await unlock();
			const audio = context;
			if (!isEnabled() || audio?.state !== 'running') return;
			const source = audio.createBufferSource();
			const filter = audio.createBiquadFilter();
			const volume = audio.createGain();
			source.buffer = bufferFor(audio, sound);
			filter.type = sound === 'sip' ? 'bandpass' : 'lowpass';
			filter.frequency.value = sounds[sound].cutoff;
			volume.gain.value = sounds[sound].volume;
			source.connect(filter).connect(volume).connect(audio.destination);
			playing.add(source);
			source.onended = () => playing.delete(source);
			source.start();
		},
		dispose() {
			stop();
			void context?.close().catch(() => undefined);
			context = undefined;
			buffers.clear();
		}
	};
}
