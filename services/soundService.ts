// This service uses the Web Audio API to generate sounds programmatically.
// It ensures that an AudioContext is created and resumed upon user interaction.

let audioContext: AudioContext | null = null;

/**
 * Initializes and resumes the AudioContext.
 * Must be called in response to a user gesture (e.g., a click).
 * Modern browsers block audio until a user interacts with the page.
 */
const initAudio = async () => {
    if (audioContext && audioContext.state === 'running') {
        return; // Already initialized and running.
    }
    
    if (!audioContext) {
        // Check for browser compatibility
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
            console.error("Web Audio API is not supported in this browser.");
            return;
        }
        audioContext = new AudioContext();
    }

    // If context is suspended, it needs to be resumed.
    if (audioContext.state === 'suspended') {
        try {
            await audioContext.resume();
        } catch (e) {
            console.error("Error resuming AudioContext:", e);
        }
    }
};

/**
 * A generic wrapper function to play a sound. It ensures the audio context
 * is running and then executes the provided function to create the sound graph.
 * @param createSoundGraph A function that receives the AudioContext and creates/plays the sound.
 */
const play = (createSoundGraph: (ctx: AudioContext) => void) => {
    // initAudio must be called first. We call it here, hoping it's part of a user gesture chain.
    initAudio().then(() => {
        if (!audioContext || audioContext.state !== 'running') {
            // Silently fail if the context isn't ready. This prevents console spam
            // if the user hasn't interacted with the page yet.
            return;
        }
        try {
            createSoundGraph(audioContext);
        } catch(e) {
            console.error("Error playing sound:", e);
        }
    });
};

export const playTick = () => {
    play(ctx => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.05);
    });
}

export const playStart = () => {
    play(ctx => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
    });
}

export const playPause = () => {
    play(ctx => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
    });
}

export const playTimeUp = () => {
     play(ctx => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
        oscillator.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
    });
}

export const playFlip = () => {
    play(ctx => {
        const duration = 0.15;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1; // White noise
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 15;
        filter.frequency.setValueAtTime(300, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + duration * 0.8);
        
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        noise.start(ctx.currentTime);
        noise.stop(ctx.currentTime + duration);
    });
};
