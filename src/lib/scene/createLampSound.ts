export function createLampSound() {
	let context: AudioContext | undefined;

	return {
		play(turningOn: boolean) {
			try {
				context ??= new AudioContext();
				void context.resume();
				const start = context.currentTime;
				const length = Math.ceil(context.sampleRate * 0.065);
				const buffer = context.createBuffer(1, length, context.sampleRate);
				const samples = buffer.getChannelData(0);
				for (let index = 0; index < length; index++) {
					const fade = 1 - index / length;
					samples[index] = (Math.random() * 2 - 1) * fade * fade;
				}
				const source = context.createBufferSource();
				const filter = context.createBiquadFilter();
				const volume = context.createGain();
				source.buffer = buffer;
				filter.type = 'lowpass';
				filter.frequency.value = turningOn ? 1700 : 1100;
				volume.gain.setValueAtTime(0.045, start);
				volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.065);
				source.connect(filter).connect(volume).connect(context.destination);
				source.start(start);
			} catch {
				// The lamp still works if audio is blocked or unavailable.
			}
		},
		dispose() {
			void context?.close();
			context = undefined;
		}
	};
}
