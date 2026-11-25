import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BaseAgent } from '../../shared/base-agent.js';
import { probe, extractThumbnail, makeReviewProxy } from '../../shared/ffmpeg.js';
import { analyzeMedia } from '../../shared/gemini.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STUDIO_DIR = path.resolve(__dirname, '../../../creative-studio');
const ORIGINALS_DIR = path.join(STUDIO_DIR, 'originals');
const ANALYZED_DIR = path.join(STUDIO_DIR, 'analyzed');
const PROJECTS_DIR = path.join(STUDIO_DIR, 'projects');

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
    const failCount = results.length - okCount;
    const message = `🎬 *Creative Studio*\nProcessed ${okCount} new item(s)${failCount ? `, ${failCount} failed` : ''}.\nReview in creative-studio/analyzed/ and creative-studio/projects/ — nothing is approved or published automatically.`;
    await this.notify(message, 'telegram');
    return results;
  }

  async ensureDirs() {
    for (const dir of [ANALYZED_DIR, PROJECTS_DIR, ...Object.values(SOURCE_DIRS)]) {
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

    const analyzedPath = path.join(ANALYZED_DIR, `${fileName}.json`);
    await fs.writeFile(
      analyzedPath,
      JSON.stringify({ fileName, source, mimeType, metadata, analysis: analysisText, analyzedAt: new Date().toISOString() }, null, 2)
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

    this.log(`Done: ${fileName}`);
    return { fileName, source, metadata, analyzedPath, proxyPath, thumbnailPath };
  }
}
