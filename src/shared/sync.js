/**
 * Pure math for multicam sync — no I/O, easy to test without Gemini or
 * ffmpeg. A "common timeline" has its zero point at the shared sync clap.
 * Each source file has its own `clapTime` (where the clap falls in THAT
 * file's own local timeline). To go from a common-timeline instant to a
 * file-local instant: fileLocalTime = commonTime + clapTime.
 */

/** Convert one common-timeline segment to a source file's local timeline. */
export function toLocalSegment(commonSegment, clapTimesByRole) {
  const clapTime = clapTimesByRole[commonSegment.role];
  if (clapTime === undefined) {
    throw new Error(`toLocalSegment: no clap time known for role "${commonSegment.role}"`);
  }
  return {
    ...commonSegment,
    start: commonSegment.start + clapTime,
    end: commonSegment.end + clapTime,
  };
}

/** Convert a full list of common-timeline segments to local-timeline segments. */
export function toLocalSegments(commonSegments, clapTimesByRole) {
  return commonSegments.map((seg) => toLocalSegment(seg, clapTimesByRole));
}

/**
 * Validate that no segment references a role outside the known clap-time
 * map, and that start < end for every segment (catches a bad Gemini
 * decision before it reaches ffmpeg).
 */
export function validateCommonSegments(commonSegments, clapTimesByRole) {
  const problems = [];
  commonSegments.forEach((seg, i) => {
    if (clapTimesByRole[seg.role] === undefined) {
      problems.push(`segment ${i}: unknown role "${seg.role}"`);
    }
    if (!(seg.end > seg.start)) {
      problems.push(`segment ${i}: end (${seg.end}) must be after start (${seg.start})`);
    }
  });
  return problems;
}
