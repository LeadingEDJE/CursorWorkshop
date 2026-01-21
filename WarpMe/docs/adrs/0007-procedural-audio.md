# ADR-007: Use Procedural Audio Generation

## Status
Accepted

## Context
The game needs sound effects but we wanted to avoid managing audio files and keep the project lightweight. Web Audio API allows generating sounds programmatically.

Key considerations:
- Need various sci-fi sound effects (phasers, torpedoes, alerts, etc.)
- Want to avoid managing audio asset files
- Web Audio API supports procedural sound generation
- Sounds should be lightweight and load instantly

## Decision
We will use Web Audio API to generate all sound effects procedurally using oscillators and noise generators instead of loading audio files.

Implementation:
- `AudioManager` class manages Web Audio API context
- Sounds generated using oscillators (tones, sweeps)
- Noise generators for explosions
- Envelope shaping for realistic sound decay
- Master gain node for volume control and muting

## Consequences

### Positive
- **No Asset Files**: No audio files to manage or load
- **Instant Loading**: Sounds available immediately
- **Small Footprint**: No audio file downloads
- **Flexible**: Easy to adjust frequency, duration, volume programmatically
- **Unique**: Procedural sounds can be distinctive

### Negative
- **Limited Quality**: Generated sounds may sound less realistic than recorded audio
- **Browser Compatibility**: Web Audio API requires modern browsers
- **User Interaction Required**: Must initialize after user interaction (browser security)
- **CPU Usage**: Sound generation uses CPU (minimal impact for this project)

### Mitigations
- Initialize audio context on first user interaction (click/keydown)
- Use appropriate oscillator types and envelopes for better sound quality
- Provide mute functionality for users who prefer silence
- Document browser requirements
