// Safety switch for agents that can take real-world action (post content,
// reply to customers publicly, spend ad budget). Defaults to 'dry-run' so a
// fresh deploy never acts live by accident — flip MARKETING_AUTOPILOT (or a
// per-channel override) to 'live' once credentials are verified.
const VALID_MODES = new Set(['dry-run', 'live']);

function normalize(mode) {
  const lower = (mode || '').toLowerCase();
  return VALID_MODES.has(lower) ? lower : 'dry-run';
}

export function autopilotMode(channel) {
  const channelOverride = channel ? process.env[`MARKETING_AUTOPILOT_${channel.toUpperCase()}`] : null;
  if (channelOverride) return normalize(channelOverride);
  return normalize(process.env.MARKETING_AUTOPILOT);
}

export function isLive(channel) {
  return autopilotMode(channel) === 'live';
}
