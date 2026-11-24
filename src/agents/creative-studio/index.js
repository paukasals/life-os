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
const KNOWLEDGE_DIR = path.resolve(__dirname, '../../knowledge/marketing');

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

    const brandRules = await this.loadBrandRules();
    const pending = await this.findUnanalyzed();

    if (pending.length === 0) {
      this.log('No new originals to process.');
      return null;
    }

    const results = [];
    for (const fileName of pending) {
      try {
        const result = await this.processOne(fileName, brandRules);
        results.push(result);
      } catch (err) {
        this.error(`Failed processing ${fileName}`, err);
        results.push({ fileName, error: err.message });
      }
    }

    const okCount = results.filter((r) => !r.error).length;
    const failCount = results.length - okCount;
    const message = `🎬 *Creative Studio*\nProcessed ${okCount} new item(s)${failCount ? `, ${failCount} failed` : ''}.\nReview in creative-studio/analyzed/ and creative-studio/projects/ — nothing is approved or published automatically.`;
    await this.notify(message, 'telegram');
    return results;
  }

  async ensureDirs() {
    for (const dir of [ORIGINALS_DIR, ANALYZED_DIR, PROJECTS_DIR]) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async loadBrandRules() {
    try {
      return await fs.readFile(path.join(KNOWLEDGE_DIR, 'brand-rules.md'), 'utf-8');
    } catch {
      return '';
    }
  }

  async findUnanalyzed() {
    const entries = await fs.readdir(ORIGINALS_DIR, { withFileTypes: true });
    const mediaFiles = entries
      .filter((e) => e.isFile() && MIME_BY_EXT[path.extname(e.name).toLowerCase()])
      .map((e) => e.name);

    const unanalyzed = [];
    for (const fileName of mediaFiles) {
      const analyzedPath = path.join(ANALYZED_DIR, `${fileName}.json`);
      try {
        await fs.access(analyzedPath);
      } catch {
        unanalyzed.push(fileName);
      }
    }
    return unanalyzed;
  }

  async processOne(fileName, brandRules) {
    const filePath = path.join(ORIGINALS_DIR, fileName);
    const ext = path.extname(fileName).toLowerCase();
    const mimeType = MIME_BY_EXT[ext];
    const isVideo = mimeType.startsWith('video/');

    this.log(`Probing ${fileName}...`);
    const metadata = await probe(filePath);

    this.log(`Analyzing ${fileName} with Gemini...`);
    const analysisText = await analyzeMedia(filePath, mimeType, { brandRules });

    const analyzedPath = path.join(ANALYZED_DIR, `${fileName}.json`);
    await fs.writeFile(
      analyzedPath,
      JSON.stringify({ fileName, mimeType, metadata, analysis: analysisText, analyzedAt: new Date().toISOString() }, null, 2)
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
    return { fileName, metadata, analyzedPath, proxyPath, thumbnailPath };
  }
}
