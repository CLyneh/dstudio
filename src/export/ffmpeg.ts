import { FFmpeg } from '@ffmpeg/ffmpeg';
import { encoderArgs, INPUT_PATTERN } from './encoderArgs';
import type { Codec } from './targets';

let loading: Promise<FFmpeg> | null = null;

/** Loads ffmpeg.wasm once. The core files are served by the site itself (public/ffmpeg/). */
export function loadFFmpeg(): Promise<FFmpeg> {
  if (!loading) {
    loading = (async () => {
      const ffmpeg = new FFmpeg();
      const base = new URL('ffmpeg/', document.baseURI).href;
      await ffmpeg.load({ coreURL: `${base}ffmpeg-core.js`, wasmURL: `${base}ffmpeg-core.wasm` });
      return ffmpeg;
    })().catch((error: unknown) => {
      loading = null;
      throw error;
    });
  }
  return loading;
}

/** Stops a running encode. The next export reloads ffmpeg. */
export async function resetFFmpeg(): Promise<void> {
  const current = loading;
  loading = null;
  if (current) {
    try {
      (await current).terminate();
    } catch {
      /* already gone */
    }
  }
}

export async function encodeFrames(
  frames: Uint8Array[],
  codec: Exclude<Codec, 'png'>,
  fps: number,
  extension: string,
  onProgress: (ratio: number) => void,
): Promise<Uint8Array> {
  const ffmpeg = await loadFFmpeg();
  const names = frames.map((_, i) => INPUT_PATTERN.replace('%05d', String(i + 1).padStart(5, '0')));
  for (let i = 0; i < frames.length; i++) {
    await ffmpeg.writeFile(names[i] as string, frames[i] as Uint8Array);
  }
  const output = `out.${extension}`;
  const handler = ({ progress }: { progress: number }) => onProgress(Math.min(1, Math.max(0, progress)));
  ffmpeg.on('progress', handler);
  try {
    const code = await ffmpeg.exec(encoderArgs(codec, fps, output));
    if (code !== 0) throw new Error(`ffmpeg exited with code ${code}`);
    const data = await ffmpeg.readFile(output);
    if (typeof data === 'string') throw new Error('Unexpected text output from ffmpeg');
    return data;
  } finally {
    ffmpeg.off('progress', handler);
    await Promise.all(names.map((n) => ffmpeg.deleteFile(n).catch(() => undefined)));
    await ffmpeg.deleteFile(output).catch(() => undefined);
  }
}
