import { spawn } from 'child_process';
import path from 'path';

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d; });
    proc.stderr.on('data', (d) => { stderr += d; });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${cmd} exited ${code}: ${stderr.slice(-2000)}`));
    });
  });
}

/** Probe a media file: duration, resolution, codec, type (video/image/audio). */
export async function probe(filePath) {
  const { stdout } = await run('ffprobe', [
    '-v', 'error',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    filePath,
  ]);
  const data = JSON.parse(stdout);
  const videoStream = data.streams?.find((s) => s.codec_type === 'video');
  const audioStream = data.streams?.find((s) => s.codec_type === 'audio');
  return {
    durationSeconds: data.format?.duration ? parseFloat(data.format.duration) : null,
    sizeBytes: data.format?.size ? parseInt(data.format.size, 10) : null,
    width: videoStream?.width ?? null,
    height: videoStream?.height ?? null,
    videoCodec: videoStream?.codec_name ?? null,
    hasAudio: Boolean(audioStream),
    formatName: data.format?.format_name ?? null,
  };
}

/** Extract a single thumbnail frame at a given timestamp (seconds) into outPath. */
export async function extractThumbnail(filePath, outPath, atSeconds = 1) {
  await run('ffmpeg', [
    '-y',
    '-ss', String(atSeconds),
    '-i', filePath,
    '-frames:v', '1',
    '-q:v', '3',
    outPath,
  ]);
  return outPath;
}

/** Make a lightweight proxy (small, fast-loading) copy for review — not a final edit. */
export async function makeReviewProxy(filePath, outDir) {
  const base = path.basename(filePath, path.extname(filePath));
  const outPath = path.join(outDir, `${base}.proxy.mp4`);
  await run('ffmpeg', [
    '-y',
    '-i', filePath,
    '-vf', 'scale=640:-2',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '28',
    '-c:a', 'aac',
    '-b:a', '96k',
    outPath,
  ]);
  return outPath;
}
