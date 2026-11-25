function formatTimestamp(seconds) {
  const ms = Math.round(seconds * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const msRem = ms % 1000;
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(msRem, 3)}`;
}

/**
 * Build an SRT file from kept segments, re-timed onto the OUTPUT timeline
 * (after cuts are removed, not the original source timestamps).
 * `keptSegments` = [{ start, end, text }, ...] in original-source time,
 * already filtered to keep:true and in source order.
 * Returns { srtContent, outputSegments } where outputSegments carries the
 * recomputed [outStart, outEnd] per segment — the render step needs these
 * to know the final cut points too.
 */
export function buildSrtForCut(keptSegments) {
  let cursor = 0;
  const lines = [];
  const outputSegments = [];

  keptSegments.forEach((seg, i) => {
    const duration = Math.max(0, seg.end - seg.start);
    const outStart = cursor;
    const outEnd = cursor + duration;
    outputSegments.push({ ...seg, outStart, outEnd });

    const text = (seg.text ?? '').trim();
    if (text) {
      lines.push(
        `${i + 1}`,
        `${formatTimestamp(outStart)} --> ${formatTimestamp(outEnd)}`,
        text,
        ''
      );
    }
    cursor = outEnd;
  });

  return { srtContent: lines.join('\n'), outputSegments, totalDuration: cursor };
}
