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

/**
 * Cut a single source file down to a list of kept segments and concatenate
 * them into one render — the actual "auto-cut" step (removes filler words/
 * pauses per the segments decided by transcribeAndDecideCuts), with an
 * optional warm color grade (the "quick-look" preset from
 * camera-course-reference.md, used until DaVinci grading is wired up) and
 * optional burned-in captions from an SRT file.
 *
 * `segments`: [{ start, end }, ...] in the SOURCE file's timeline, in
 * order — NOT the recomputed output timeline from srt.js (this function
 * recomputes its own cut points internally via the trim/concat filter
 * graph; srt.js's outputSegments are for caption timing, which must match
 * this function's output, so call buildSrtForCut with the same segments
 * passed here).
 */
export async function renderCut(filePath, segments, outPath, {
  grade = true,
  srtPath = null,
  fps = 30,
} = {}) {
  if (!segments || segments.length === 0) {
    throw new Error('renderCut: no segments to keep — nothing to render');
  }

  const trimFilters = [];
  const concatInputs = [];
  segments.forEach((seg, i) => {
    trimFilters.push(
      `[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v${i}]`,
      `[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}]`
    );
    concatInputs.push(`[v${i}][a${i}]`);
  });

  const concatFilter = `${concatInputs.join('')}concat=n=${segments.length}:v=1:a=1[vcat][acat]`;

  let videoLabel = 'vcat';
  const postFilters = [];
  if (grade) {
    postFilters.push(
      `[vcat]eq=contrast=1.05:brightness=0.02:saturation=0.92,` +
      `colorbalance=rs=0.08:gs=0.0:bs=-0.08,` +
      `vignette=PI/6,` +
      `noise=alls=6:allf=t+u[vgraded]`
    );
    videoLabel = 'vgraded';
  }

  if (srtPath) {
    // Escape for the ffmpeg filter-argument parser: backslashes, then colons.
    const escaped = srtPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
    postFilters.push(
      `[${videoLabel}]subtitles='${escaped}':force_style='FontSize=18,PrimaryColour=&H00FFFFFF,Outline=1,Shadow=1,Alignment=2,MarginV=120'[vcaptioned]`
    );
    videoLabel = 'vcaptioned';
  }

  const filterComplex = [...trimFilters, concatFilter, ...postFilters].join(';');

  await run('ffmpeg', [
    '-y',
    '-i', filePath,
    '-filter_complex', filterComplex,
    '-map', `[${videoLabel}]`,
    '-map', '[acat]',
    '-r', String(fps),
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '18',
    '-c:a', 'aac',
    '-b:a', '192k',
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
