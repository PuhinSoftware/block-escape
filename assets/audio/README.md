# Crystal Mines audio — v0.6.3

User-provided BGM/SFX packs, organized without duplicate compressed tracks.
`music/crystal-mines.ogg` is the supplied Vorbis web track;
`music/crystal-mines.mp3` is a 128 kbps fallback derived from the WAV master.
The untouched large master in `sources/bgm/` is archival only and is never
referenced by runtime code. Original archive READMEs remain in `sources/`.

All audio is 32 kHz. Music is stereo; effects are mono PCM16 WAV. All files
passed full ffmpeg decoding and archive CRC checks during preparation.
The source READMEs describe original synthesized music/effects; no separate
license text was supplied. These files were explicitly supplied for this game.

Playback is owned by `audio-manager.js`. The original SFX README's progress
milestone wording is historical metadata: stars now play only for **earned
performance rewards**, never completion-progress milestones.

The original 260 ms reveal cadence is preserved. Intermediate star cues use 220 ms windows with a short tail fade. The final
earned star always uses its full decoded duration (0.58 / 0.64 / 1.00 s).
Victory waits for that native ended event, then plays its complete 1.4 s sample
without an extra full-file envelope. Music restores on victory ended. Collision also supplies the life-loss
warning; no separate life-loss file exists. Missing effects fall back to short
synthesized cues on the same context. There is no invented asset reference.

MP3 generation from the lossless master:

```sh
ffmpeg -hide_banner -loglevel error -n -i assets/audio/sources/bgm/crystal_mines_ambient_loop.wav -codec:a libmp3lame -b:a 128k assets/audio/music/crystal-mines.mp3
```

The MP3 container is 64.044 s including encoder delay/padding, versus 64.000 s
for OGG/WAV. Chromium loop behavior and fallback source selection were tested;
seamless acoustic playback and real iOS Safari need device listening tests.

| Path | Format / codec | Bytes | Seconds |
| --- | --- | ---: | ---: |
| `music/crystal-mines.mp3` | mp3 / mp3 | 1,025,324 | 64.044 |
| `music/crystal-mines.ogg` | ogg / vorbis | 755,584 | 64.000 |
| `sfx/blocks/block_exit.wav` | wav / pcm_s16le | 32,684 | 0.510 |
| `sfx/blocks/collision.wav` | wav / pcm_s16le | 21,164 | 0.330 |
| `sfx/results/level_failed.wav` | wav / pcm_s16le | 89,644 | 1.400 |
| `sfx/results/level_win.wav` | wav / pcm_s16le | 89,644 | 1.400 |
| `sfx/results/time_up.wav` | wav / pcm_s16le | 70,444 | 1.100 |
| `sfx/rewards/star_1.wav` | wav / pcm_s16le | 37,164 | 0.580 |
| `sfx/rewards/star_2.wav` | wav / pcm_s16le | 41,004 | 0.640 |
| `sfx/rewards/star_3.wav` | wav / pcm_s16le | 64,044 | 1.000 |
| `sources/bgm/crystal_mines_ambient_loop.wav` | wav / pcm_s16le | 8,192,044 | 64.000 |

`inventory.csv` contains the complete metadata and SHA-256 checksums.
