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
export async function renderCut(filePath, segments, outPath, opts = {}) {
  if (!segments || segments.length === 0) {
    throw new Error('renderCut: no segments to keep — nothing to render');
  }
  // Single-file cut is just a multicam cut with one input/one role —
  // delegate so the two code paths can't drift apart.
  const inputs = [{ role: 'source', filePath }];
  const taggedSegments = segments.map((seg) => ({ ...seg, role: 'source' }));
  return renderMulticamCut(inputs, taggedSegments, outPath, opts);
}

const DEFAULT_FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

function escapeFfmpegPath(p) {
  return p.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'");
}

function buildGradeAndCaptionFilters(baseLabel, { grade, srtPath, lutPath, brandTexts, fontPath }) {
  let videoLabel = baseLabel;
  const filters = [];

  if (lutPath) {
    // Pro-stage color: a real 3D LUT (.cube), the FFmpeg-only path toward
    // the Apple Log + LUT look from camera-course-reference.md without
    // requiring DaVinci. Takes precedence over the quick-look preset below
    // (apply one or the other, not both — a LUT already does the warm/
    // contrast work the quick-look preset approximates).
    const escaped = escapeFfmpegPath(lutPath);
    filters.push(`[${videoLabel}]lut3d=file='${escaped}'[vgraded]`);
    videoLabel = 'vgraded';
  } else if (grade) {
    filters.push(
      `[${videoLabel}]eq=contrast=1.05:brightness=0.02:saturation=0.92,` +
      `colorbalance=rs=0.08:gs=0.0:bs=-0.08,` +
      `vignette=PI/6,` +
      `noise=alls=6:allf=t+u[vgraded]`
    );
    videoLabel = 'vgraded';
  }

  if (brandTexts && brandTexts.length > 0) {
    // Styled on-screen brand text (hook/end text, e.g. "Every roll starts
    // here.") — DISTINCT from dialogue captions below. Per
    // camera-course-reference.md: cream/white, centered, safe middle band.
    const font = escapeFfmpegPath(fontPath || DEFAULT_FONT);
    brandTexts.forEach((bt, i) => {
      const text = bt.text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/:/g, '\\:').replace(/,/g, '\\,');
      const nextLabel = `vbrand${i}`;
      filters.push(
        `[${videoLabel}]drawtext=fontfile='${font}':text='${text}':` +
        `fontsize=54:fontcolor=white:borderw=2:bordercolor=black@0.6:` +
        `x=(w-text_w)/2:y=h*0.72:` +
        `enable='between(t,${bt.start},${bt.end})'[${nextLabel}]`
      );
      videoLabel = nextLabel;
    });
  }

  if (srtPath) {
    const escaped = escapeFfmpegPath(srtPath);
    filters.push(
      `[${videoLabel}]subtitles='${escaped}':force_style='FontSize=18,PrimaryColour=&H00FFFFFF,Outline=1,Shadow=1,Alignment=2,MarginV=120'[vcaptioned]`
    );
    videoLabel = 'vcaptioned';
  }
  return { filters, videoLabel };
}

/**
 * Build the audio half of the trim filters with a short in/out fade on
 * EVERY segment (default 30ms) — not a true crossfade (which would shift
 * timing and risk A/V desync across many segments), just enough to kill
 * the click/pop a hard cut leaves on a non-zero-crossing waveform. Cheap,
 * safe, always-on correctness improvement; serves the same goal as
 * "room tone under cuts" without needing an actual room-tone track.
 */
function audioTrimWithFade(inputIndex, seg, label, fadeSeconds) {
  const duration = seg.end - seg.start;
  const fade = Math.min(fadeSeconds, duration / 2.5); // never fade more than ~40% of a very short segment
  return (
    `[${inputIndex}:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS,` +
    `afade=t=in:st=0:d=${fade},afade=t=out:st=${Math.max(0, duration - fade)}:d=${fade}[${label}]`
  );
}

/**
 * Multicam version of renderCut: cuts segments from MULTIPLE synchronized
 * source files and concatenates them, picking whichever camera each
 * segment calls for — the "cut between Cam A and Cam B" editing grammar
 * from shot-cards.md, not just trimming one file.
 *
 * `inputs`: [{ role, filePath }, ...] — role must match the `role` field
 * used in `segments`. Order here fixes the ffmpeg -i index per role.
 * `segments`: [{ role, start, end }, ...] in EACH FILE'S OWN LOCAL
 * timeline (already converted from the common/synced timeline via
 * sync.js's toLocalSegments — this function does no sync math itself).
 */
export async function renderMulticamCut(inputs, segments, outPath, {
  grade = true,
  srtPath = null,
  fps = 30,
  lutPath = null,
  brandTexts = null,
  fontPath = null,
  musicPath = null,
  musicVolumeDb = -22,
  clickFadeSeconds = 0.03,
} = {}) {
  if (!inputs || inputs.length === 0) throw new Error('renderMulticamCut: no inputs given');
  if (!segments || segments.length === 0) throw new Error('renderMulticamCut: no segments to render');

  const roleToIndex = {};
  inputs.forEach((inp, i) => { roleToIndex[inp.role] = i; });

  const trimFilters = [];
  const concatInputs = [];
  segments.forEach((seg, i) => {
    const idx = roleToIndex[seg.role];
    if (idx === undefined) {
      throw new Error(`renderMulticamCut: segment ${i} references unknown role "${seg.role}" — inputs were [${inputs.map((x) => x.role).join(', ')}]`);
    }
    trimFilters.push(`[${idx}:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v${i}]`);
    trimFilters.push(audioTrimWithFade(idx, seg, `a${i}`, clickFadeSeconds));
    concatInputs.push(`[v${i}][a${i}]`);
  });

  const concatFilter = `${concatInputs.join('')}concat=n=${segments.length}:v=1:a=1[vcat][acatvoice]`;
  const { filters: postFilters, videoLabel } = buildGradeAndCaptionFilters('vcat', { grade, srtPath, lutPath, brandTexts, fontPath });

  // Music input, if any, is appended AFTER all the role inputs — its index
  // is simply inputs.length (no filter_complex math needed to find it).
  let audioLabel = 'acatvoice';
  const musicFilters = [];
  if (musicPath) {
    const musicIdx = inputs.length;
    musicFilters.push(
      `[${musicIdx}:a]volume=${musicVolumeDb}dB[musicvol]`,
      `[acatvoice][musicvol]amix=inputs=2:duration=first:dropout_transition=0[acat]`
    );
    audioLabel = 'acat';
  }

  const filterComplex = [...trimFilters, concatFilter, ...postFilters, ...musicFilters].join(';');

  const args = ['-y'];
  inputs.forEach((inp) => { args.push('-i', inp.filePath); });
  if (musicPath) args.push('-stream_loop', '-1', '-i', musicPath);
  args.push(
    '-filter_complex', filterComplex,
    '-map', `[${videoLabel}]`,
    '-map', `[${audioLabel}]`,
    '-r', String(fps),
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '18',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    outPath
  );

  await run('ffmpeg', args);
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
