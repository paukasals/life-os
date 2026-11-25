import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BaseAgent } from '../../shared/base-agent.js';
import { probe, extractThumbnail, makeReviewProxy, renderCut } from '../../shared/ffmpeg.js';
import { analyzeMedia, transcribeAndDecideCuts } from '../../shared/gemini.js';
import { buildSrtForCut } from '../../shared/srt.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STUDIO_DIR = path.resolve(__dirname, '../../../creative-studio');
const ORIGINALS_DIR = path.join(STUDIO_DIR, 'originals');
const ANALYZED_DIR = path.join(STUDIO_DIR, 'analyzed');
const PROJECTS_DIR = path.join(STUDIO_DIR, 'projects');
const FINISHED_DIR = path.join(STUDIO_DIR, 'finished');

// Subfolder name -> source tag passed to Gemini (QC bar differs: glasses
// footage has no framing/zoom control, that's the format, not a defect).
const SOURCE_DIRS = {
  iphone: path.join(ORIGINALS_DIR, 'iphone'),
  glasses: path.join(ORIGINALS_DIR, 'glasses'),
};

const MIME_BY_EXT = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.heic': 'image/heic',
};

// Recommendations that mean "don't spend a transcription+render call on this" —
// the clip either isn't usable or needs to be reshot, not auto-cut.
const SKIP_AUTOCUT_RECOMMENDATIONS = ['do-not-post', 'needs reshoot', 'needs_reshoot'];

function extractField(analysisText, fieldName) {
  const re = new RegExp(`^${fieldName}:\\s*(.*)$`, 'im');
  const match = analysisText.match(re);
  return match ? match[1].trim() : '';
}

export class CreativeStudioAgent extends BaseAgent {
  constructor() {
    super(
      'CreativeStudio',
      `You help Pau turn raw Lobsteria footage/photos into on-brand social content.
Never approve or publish anything yourself — every piece stops at "finished" for Pau's manual approval, per brand-rules.md.`
    );
  }

  async run() {
    this.log('Scanning creative-studio/originals for new media...');
    await this.ensureDirs();

    const qcChecklist = await this.loadQcChecklist();
    const pending = await this.findUnanalyzed();

    if (pending.length === 0) {
      this.log('No new originals to process.');
      return null;
    }

    const results = [];
    for (const item of pending) {
      try {
        const result = await this.processOne(item, qcChecklist);
        results.push(result);
      } catch (err) {
        this.error(`Failed processing ${item.fileName}`, err);
        results.push({ fileName: item.fileName, error: err.message });
      }
    }

    const okCount = results.filter((r) => !r.error).length;
    const cutCount = results.filter((r) => r.cutPath).length;
    const failCount = results.length - okCount;
    const message = `🎬 *Creative Studio*\nProcessed ${okCount} new item(s)${failCount ? `, ${failCount} failed` : ''}.${cutCount ? `\n${cutCount} auto-cut into creative-studio/finished/ — ready for your review.` : ''}\nNothing is approved or published automatically.`;
    await this.notify(message, 'telegram');
    return results;
  }

  async ensureDirs() {
    for (const dir of [ANALYZED_DIR, PROJECTS_DIR, FINISHED_DIR, ...Object.values(SOURCE_DIRS)]) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async loadQcChecklist() {
    try {
      return await fs.readFile(path.join(STUDIO_DIR, 'qc-checklist.md'), 'utf-8');
    } catch {
      return '';
    }
  }

  async findUnanalyzed() {
    const unanalyzed = [];
    for (const [source, dir] of Object.entries(SOURCE_DIRS)) {
      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        continue;
      }
      const mediaFiles = entries
        .filter((e) => e.isFile() && MIME_BY_EXT[path.extname(e.name).toLowerCase()])
        .map((e) => e.name);

      for (const fileName of mediaFiles) {
        const analyzedPath = path.join(ANALYZED_DIR, `${fileName}.json`);
        try {
          await fs.access(analyzedPath);
        } catch {
          unanalyzed.push({ fileName, source, dir });
        }
      }
    }
    return unanalyzed;
  }

  async processOne({ fileName, source, dir }, qcChecklist) {
    const filePath = path.join(dir, fileName);
    const ext = path.extname(fileName).toLowerCase();
    const mimeType = MIME_BY_EXT[ext];
    const isVideo = mimeType.startsWith('video/');

    this.log(`Probing ${fileName} (${source})...`);
    const metadata = await probe(filePath);

    this.log(`Analyzing ${fileName} with Gemini...`);
    const analysisText = await analyzeMedia(filePath, mimeType, { qcChecklist, source });
    const recommendation = extractField(analysisText, 'RECOMMENDATION').toLowerCase();

    const analyzedPath = path.join(ANALYZED_DIR, `${fileName}.json`);
    await fs.writeFile(
      analyzedPath,
      JSON.stringify({ fileName, source, mimeType, metadata, analysis: analysisText, recommendation, analyzedAt: new Date().toISOString() }, null, 2)
    );

    let proxyPath = null;
    if (isVideo) {
      proxyPath = await makeReviewProxy(filePath, PROJECTS_DIR);
    } else {
      proxyPath = path.join(PROJECTS_DIR, fileName);
      await fs.copyFile(filePath, proxyPath);
    }

    let thumbnailPath = null;
    if (isVideo) {
      thumbnailPath = path.join(PROJECTS_DIR, `${path.basename(fileName, ext)}.thumb.jpg`);
      await extractThumbnail(filePath, thumbnailPath, Math.min(1, (metadata.durationSeconds ?? 2) / 2));
    }

    let cutPath = null;
    let srtPath = null;
    if (isVideo && !SKIP_AUTOCUT_RECOMMENDATIONS.some((r) => recommendation.includes(r))) {
      try {
        this.log(`Transcribing + deciding cuts for ${fileName}...`);
        const transcript = await transcribeAndDecideCuts(filePath, mimeType);
        const kept = (transcript.segments ?? []).filter((s) => s.keep);

        if (kept.length === 0) {
          this.log(`Gemini kept zero segments for ${fileName} — skipping auto-cut, needs a human look.`);
        } else {
          const base = path.basename(fileName, ext);
          srtPath = path.join(FINISHED_DIR, `${base}.srt`);
          const { srtContent } = buildSrtForCut(kept);
          await fs.writeFile(srtPath, srtContent);

          cutPath = path.join(FINISHED_DIR, `${base}.cut.mp4`);
          await renderCut(filePath, kept, cutPath, { grade: true, srtPath });

          await fs.writeFile(
            path.join(FINISHED_DIR, `${base}.transcript.json`),
            JSON.stringify(transcript, null, 2)
          );
        }
      } catch (err) {
        this.error(`Auto-cut failed for ${fileName}`, err);
      }
    }

    this.log(`Done: ${fileName}`);
    return { fileName, source, metadata, analyzedPath, proxyPath, thumbnailPath, cutPath, srtPath, recommendation };
  }
}
