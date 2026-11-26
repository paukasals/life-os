import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BaseAgent } from '../../shared/base-agent.js';
import { probe, extractThumbnail, makeReviewProxy, renderCut, renderMulticamCut } from '../../shared/ffmpeg.js';
import {
  analyzeMedia,
  transcribeAndDecideCuts,
  decideMulticamEdit,
  decideBestOfRetakes,
  translateSegments,
  selectCoverFrame,
} from '../../shared/gemini.js';
import { buildSrtForCut } from '../../shared/srt.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STUDIO_DIR = path.resolve(__dirname, '../../../creative-studio');
const ORIGINALS_DIR = path.join(STUDIO_DIR, 'originals');
const TAKES_DIR = path.join(ORIGINALS_DIR, 'takes');
const RETAKES_DIR = path.join(ORIGINALS_DIR, 'retakes');
const ANALYZED_DIR = path.join(STUDIO_DIR, 'analyzed');
const PROJECTS_DIR = path.join(STUDIO_DIR, 'projects');
const FINISHED_DIR = path.join(STUDIO_DIR, 'finished');

// Subfolder name -> source tag passed to Gemini (QC bar differs: glasses
// footage has no framing/zoom control, that's the format, not a defect).
// These are for SINGLE-camera clips. Two other folder types handle
// multi-file groups — see originals/takes/ and originals/retakes/ below.
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
const WEAK_HOOK_PATTERNS = ['weak', 'needs re-cut', 'needs re_cut'];
const MAX_HOOK_RETRIES = 1;

// Optional environment knobs — none of this requires a paid service, all
// are no-ops if unset. MUSIC_BED_PATH: a royalty-free track file Pau
// supplies; BRAND_FONT_PATH: the real Lobsteria brand font, falls back to
// a system font if unset; COLOR_LUT_PATH: a real .cube LUT for pro-stage
// grading (see camera-course-reference.md "PRO: Apple Log 2"), falls back
// to the FFmpeg quick-look preset if unset.
const MUSIC_BED_PATH = process.env.CREATIVE_STUDIO_MUSIC_PATH || null;
const BRAND_FONT_PATH = process.env.CREATIVE_STUDIO_FONT_PATH || null;
// Defaults to the generated Lobsteria LUT (creative-studio/luts/) so the
// "pro" grade is on by default — no setup needed. Override with
// CREATIVE_STUDIO_LUT_PATH, or set it to the literal string "none" to fall
// back to the plain FFmpeg quick-look preset instead.
const DEFAULT_LUT_PATH = path.join(STUDIO_DIR, 'luts', 'lobsteria-warm.cube');
const COLOR_LUT_PATH = process.env.CREATIVE_STUDIO_LUT_PATH === 'none'
  ? null
  : (process.env.CREATIVE_STUDIO_LUT_PATH || DEFAULT_LUT_PATH);

function extractField(analysisText, fieldName) {
  const re = new RegExp(`^${fieldName}:\\s*(.*)$`, 'im');
  const match = analysisText.match(re);
  return match ? match[1].trim() : '';
}

// A grouped-take file is named "<role>.<ext>" or "<role>_<anything>.<ext>" —
// role is whatever comes before the first "." or "_". e.g. "camA.mp4",
// "camB_take2.mov", "take1.mp4", "take2_redo.mov".
function roleFromFileName(fileName) {
  return fileName.split(/[._]/)[0];
}

// Heuristic for the B2 "Process Reel" export spec (24fps, per
// camera-course-reference.md) vs. the default 30fps: a silent, no-dialogue
// clip reads as a process shot; anything with real spoken content is a
// talking video and stays at 30fps.
function chooseExportFps(keptSegments) {
  const hasDialogue = keptSegments.some((s) => s.text && s.text.trim().length > 0);
  return hasDialogue ? 30 : 24;
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
    const pendingSingle = await this.findUnanalyzed();
    const pendingTakes = await this.findUnprocessedGroup(TAKES_DIR);
    const pendingRetakes = await this.findUnprocessedGroup(RETAKES_DIR);

    if (pendingSingle.length === 0 && pendingTakes.length === 0 && pendingRetakes.length === 0) {
      this.log('No new originals to process.');
      return null;
    }

    const results = [];
    for (const item of pendingSingle) {
      try {
        results.push(await this.processOne(item, qcChecklist));
      } catch (err) {
        this.error(`Failed processing ${item.fileName}`, err);
        results.push({ fileName: item.fileName, error: err.message });
      }
    }
    for (const take of pendingTakes) {
      try {
        results.push(await this.processTake(take, qcChecklist));
      } catch (err) {
        this.error(`Failed processing take ${take.groupId}`, err);
        results.push({ fileName: take.groupId, error: err.message });
      }
    }
    for (const retake of pendingRetakes) {
      try {
        results.push(await this.processRetake(retake, qcChecklist));
      } catch (err) {
        this.error(`Failed processing retake group ${retake.groupId}`, err);
        results.push({ fileName: retake.groupId, error: err.message });
      }
    }

    const okCount = results.filter((r) => !r.error).length;
    const cutCount = results.filter((r) => r.cutPath).length;
    const needsReviewCount = results.filter((r) => r.recommendation?.includes('needs human review')).length;
    const failCount = results.length - okCount;
    const message = `🎬 *Creative Studio*\nProcessed ${okCount} new item(s)${failCount ? `, ${failCount} failed` : ''}.${cutCount ? `\n${cutCount} auto-cut into creative-studio/finished/ — ready for your review.` : ''}${needsReviewCount ? `\n⚠️ ${needsReviewCount} flagged for a human look before any cut was made.` : ''}\nNothing is approved or published automatically.`;
    await this.notify(message, 'telegram');
    return results;
  }

  async ensureDirs() {
    for (const dir of [ANALYZED_DIR, PROJECTS_DIR, FINISHED_DIR, TAKES_DIR, RETAKES_DIR, ...Object.values(SOURCE_DIRS)]) {
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

  // ---- single-camera clips (originals/iphone/, originals/glasses/) ----

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
    const base = path.basename(fileName, ext);

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
      thumbnailPath = path.join(PROJECTS_DIR, `${base}.thumb.jpg`);
      await extractThumbnail(filePath, thumbnailPath, Math.min(1, (metadata.durationSeconds ?? 2) / 2));
    }

    let finalResult = { cutPath: null, srtPath: null };
    if (isVideo && !SKIP_AUTOCUT_RECOMMENDATIONS.some((r) => recommendation.includes(r))) {
      try {
        finalResult = await this.decideAndRender({
          groupId: base,
          inputs: [{ role: 'source', filePath }],
          decide: (strengthenHook) => transcribeAndDecideCuts(filePath, mimeType, { strengthenHook }).then((t) => ({ segments: t.segments })),
        });
      } catch (err) {
        this.error(`Auto-cut failed for ${fileName}`, err);
      }
    }

    this.log(`Done: ${fileName}`);
    return { fileName, source, metadata, analyzedPath, proxyPath, thumbnailPath, recommendation, ...finalResult };
  }

  // ---- shared scanning for multi-file groups (takes/ and retakes/) ----

  async findUnprocessedGroup(baseDir) {
    let groupDirs;
    try {
      groupDirs = (await fs.readdir(baseDir, { withFileTypes: true })).filter((e) => e.isDirectory());
    } catch {
      return [];
    }

    const groups = [];
    for (const { name: groupId } of groupDirs) {
      const groupDir = path.join(baseDir, groupId);
      const outPath = path.join(FINISHED_DIR, `${groupId}.cut.mp4`);
      try {
        await fs.access(outPath);
        continue; // already processed
      } catch {
        // not processed yet, fall through
      }

      const entries = await fs.readdir(groupDir, { withFileTypes: true });
      const files = entries
        .filter((e) => e.isFile() && MIME_BY_EXT[path.extname(e.name).toLowerCase()])
        .map((e) => ({
          fileName: e.name,
          role: roleFromFileName(e.name),
          filePath: path.join(groupDir, e.name),
          mimeType: MIME_BY_EXT[path.extname(e.name).toLowerCase()],
        }));

      if (files.length < 2) {
        this.log(`Group "${groupId}" in ${path.basename(baseDir)}/ has fewer than 2 files — move it to iphone/ or glasses/ for single-clip processing instead.`);
        continue;
      }
      groups.push({ groupId, files });
    }
    return groups;
  }

  // Shared QC step for both takes/ and retakes/ — runs the SAME brand-
  // rule/food-safety/legal/technical checklist used for single clips, on
  // EVERY file in the group, before any cut decision is made.
  async qcGroupFiles(groupId, files, qcChecklist) {
    const qcResults = [];
    let anyBlocking = false;

    for (const { fileName, role, filePath, mimeType } of files) {
      const source = role === 'glasses' || /glasses/i.test(fileName) ? 'glasses' : 'iphone';
      this.log(`QC-checking ${groupId}/${fileName} (${role})...`);
      const analysisText = await analyzeMedia(filePath, mimeType, { qcChecklist, source });
      const recommendation = extractField(analysisText, 'RECOMMENDATION').toLowerCase();

      await fs.writeFile(
        path.join(ANALYZED_DIR, `${groupId}__${fileName}.json`),
        JSON.stringify({ groupId, fileName, role, source, mimeType, analysis: analysisText, recommendation, analyzedAt: new Date().toISOString() }, null, 2)
      );

      qcResults.push({ fileName, role, recommendation });
      if (SKIP_AUTOCUT_RECOMMENDATIONS.some((r) => recommendation.includes(r))) {
        anyBlocking = true;
      }
    }

    return { qcResults, anyBlocking };
  }

  /**
   * The shared core of the pipeline, used by single clips AND both group
   * types: run (or re-run) a cut decision, translate the kept text into
   * the opposite language for captions (brand-rules.md's bilingual rule),
   * render, QC the FINISHED render (not just the raw footage), retry once
   * with a hook-strengthening instruction if flagged weak, then pick a
   * real cover frame instead of a naive midpoint grab.
   *
   * `decide(strengthenHook)` must return `{ segments }` in the
   * role/start/end/text/reason shape shared by all three Gemini decision
   * functions.
   */
  async decideAndRender({ groupId, inputs, decide }) {
    let edit = await decide(false);
    let segments = edit.segments ?? [];

    if (segments.length === 0) {
      this.log(`Gemini returned zero segments for "${groupId}" — needs a human look.`);
      return { recommendation: 'needs human review (empty edit decision)' };
    }

    let attempt = 0;
    let cutPath = null;
    let srtPath = null;
    let finalQcText = '';
    let finalRecommendation = '';

    for (;;) {
      const translated = await translateSegments(segments);
      srtPath = path.join(FINISHED_DIR, `${groupId}.srt`);
      const { srtContent } = buildSrtForCut(translated);
      await fs.writeFile(srtPath, srtContent);

      const fps = chooseExportFps(segments);
      cutPath = path.join(FINISHED_DIR, `${groupId}.cut.mp4`);

      if (inputs.length === 1) {
        await renderCut(inputs[0].filePath, segments, cutPath, {
          grade: true,
          srtPath,
          fps,
          lutPath: COLOR_LUT_PATH,
          musicPath: MUSIC_BED_PATH,
          fontPath: BRAND_FONT_PATH,
        });
      } else {
        await renderMulticamCut(inputs, segments, cutPath, {
          grade: true,
          srtPath,
          fps,
          lutPath: COLOR_LUT_PATH,
          musicPath: MUSIC_BED_PATH,
          fontPath: BRAND_FONT_PATH,
        });
      }

      this.log(`Final QC on rendered "${groupId}"...`);
      const videoMime = 'video/mp4'; // renders are always mp4 regardless of source container
      finalQcText = await analyzeMedia(cutPath, videoMime, { source: 'rendered' });
      finalRecommendation = extractField(finalQcText, 'RECOMMENDATION').toLowerCase();

      const isWeakHook = WEAK_HOOK_PATTERNS.some((p) => finalRecommendation.includes(p));
      if (isWeakHook && attempt < MAX_HOOK_RETRIES) {
        this.log(`"${groupId}" final QC flagged a weak hook — retrying with a hook-focused re-cut (attempt ${attempt + 1}/${MAX_HOOK_RETRIES})...`);
        attempt += 1;
        edit = await decide(true);
        segments = edit.segments ?? segments;
        continue;
      }
      break;
    }

    await fs.writeFile(
      path.join(FINISHED_DIR, `${groupId}.edit-decision.json`),
      JSON.stringify(edit, null, 2)
    );
    await fs.writeFile(
      path.join(FINISHED_DIR, `${groupId}.final-qc.json`),
      JSON.stringify({ analysis: finalQcText, recommendation: finalRecommendation, retries: attempt }, null, 2)
    );

    let coverPath = null;
    try {
      const cover = await selectCoverFrame(cutPath, 'video/mp4');
      coverPath = path.join(FINISHED_DIR, `${groupId}.cover.jpg`);
      await extractThumbnail(cutPath, coverPath, cover.timestampSeconds);
    } catch (err) {
      this.error(`Cover-frame selection failed for "${groupId}", falling back to a midpoint frame`, err);
      coverPath = path.join(FINISHED_DIR, `${groupId}.cover.jpg`);
      await extractThumbnail(cutPath, coverPath, 1);
    }

    return {
      cutPath,
      srtPath,
      coverPath,
      recommendation: finalRecommendation || 'auto-cut, rendered',
      hookRetries: attempt,
    };
  }

  // ---- multicam takes: SIMULTANEOUS recordings of the same real moment ----
  // originals/takes/<take-id>/{camA,camB,glasses}.*

  async processTake({ groupId, files }, qcChecklist) {
    this.log(`Processing multicam take "${groupId}" (${files.map((f) => f.role).join(', ')})...`);

    const { qcResults, anyBlocking } = await this.qcGroupFiles(groupId, files, qcChecklist);
    if (anyBlocking) {
      this.log(`Take "${groupId}" has a file flagged do-not-post/needs-reshoot — skipping auto-cut, needs a human look.`);
      return { fileName: groupId, qcResults, recommendation: 'needs human review (QC flagged a source file)' };
    }

    const inputs = files.map(({ role, filePath }) => ({ role, filePath }));
    const sources = files.map(({ role, filePath, mimeType }) => ({ role, filePath, mimeType }));
    const result = await this.decideAndRender({
      groupId,
      inputs,
      decide: (strengthenHook) => decideMulticamEdit(sources, { strengthenHook }),
    });
    return { fileName: groupId, qcResults, ...result };
  }

  // ---- retakes: SEPARATE, non-simultaneous full attempts at the same video ----
  // originals/retakes/<video-id>/{take1,take2,take3}.*

  async processRetake({ groupId, files }, qcChecklist) {
    this.log(`Processing retake group "${groupId}" (${files.map((f) => f.role).join(', ')})...`);

    const { qcResults, anyBlocking } = await this.qcGroupFiles(groupId, files, qcChecklist);
    if (anyBlocking) {
      this.log(`Retake group "${groupId}" has a file flagged do-not-post/needs-reshoot — skipping auto-cut, needs a human look.`);
      return { fileName: groupId, qcResults, recommendation: 'needs human review (QC flagged a source file)' };
    }

    const inputs = files.map(({ role, filePath }) => ({ role, filePath }));
    const sources = files.map(({ role, filePath, mimeType }) => ({ role, filePath, mimeType }));
    const result = await this.decideAndRender({
      groupId,
      inputs,
      decide: (strengthenHook) => decideBestOfRetakes(sources, { strengthenHook }),
    });
    return { fileName: groupId, qcResults, ...result };
  }
}
