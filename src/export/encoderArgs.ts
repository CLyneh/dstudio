import type { Codec } from './targets';

export const INPUT_PATTERN = 'frame_%05d.png';

/** ffmpeg arguments turning the PNG sequence into one video file. */
export function encoderArgs(codec: Exclude<Codec, 'png'>, fps: number, output: string): string[] {
  const input = ['-framerate', String(fps), '-i', INPUT_PATTERN];
  switch (codec) {
    case 'prores':
      // ProRes 4444 with 10-bit alpha: what Premiere, Resolve, Final Cut and CapCut desktop read.
      return [
        ...input,
        '-c:v',
        'prores_ks',
        '-profile:v',
        '4444',
        '-pix_fmt',
        'yuva444p10le',
        '-vendor',
        'apl0',
        '-qscale:v',
        '11',
        output,
      ];
    case 'webm':
      // VP8 + alpha. (VP9 runs out of memory in ffmpeg.wasm at 1080p and crashes the tab.)
      return [
        ...input,
        '-c:v',
        'libvpx',
        '-pix_fmt',
        'yuva420p',
        '-b:v',
        '6M',
        '-deadline',
        'realtime',
        '-cpu-used',
        '8',
        '-auto-alt-ref',
        '0',
        output,
      ];
    case 'mp4':
      return [
        ...input,
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-preset',
        'veryfast',
        '-crf',
        '18',
        '-movflags',
        '+faststart',
        output,
      ];
  }
}
