import { POLL_ARTISTS } from "@/lib/poll-artists";
import { Redis } from "@upstash/redis";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export type VoteCounts = Record<string, number>;

const DEFAULT_LIMIT_MAX = 0; // 0 means unlimited votes per window
const DEFAULT_LIMIT_WINDOW_SECONDS = 6 * 60 * 60;
const DEFAULT_STORAGE_FILE = "/tmp/qcs-poll-votes.json";
const DEFAULT_AUDIT_FILE = "/tmp/qcs-poll-reset-audit.log";
const DEFAULT_KV_PREFIX = "qcs:poll";
const DEFAULT_CAMPAIGN_ID = "default";

const rateLimitMaxVotes = Number(process.env.POLL_RATE_LIMIT_MAX_VOTES ?? DEFAULT_LIMIT_MAX);
const rateLimitWindowSeconds = Number(process.env.POLL_RATE_LIMIT_WINDOW_SECONDS ?? DEFAULT_LIMIT_WINDOW_SECONDS);
const storageFile = process.env.POLL_STORAGE_FILE || DEFAULT_STORAGE_FILE;
const auditFile = process.env.POLL_RESET_AUDIT_FILE || DEFAULT_AUDIT_FILE;
const kvPrefix = process.env.POLL_KV_PREFIX || DEFAULT_KV_PREFIX;
const campaignId = process.env.POLL_CAMPAIGN_ID || DEFAULT_CAMPAIGN_ID;
const storageAdapter = (process.env.POLL_STORAGE_ADAPTER || "auto").toLowerCase();
const hasKvEnv = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const voteCounts = initializeCounts();
const ipVotes = new Map<string, number[]>();
const redis = hasKvEnv
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

hydrateFromDisk();

function initializeCounts(artists: string[] = [...POLL_ARTISTS]): VoteCounts {
  return artists.reduce((acc, artist) => {
    acc[artist] = 0;
    return acc;
  }, {} as VoteCounts);
}

function normalizeIp(ip: string): string {
  return ip.trim() || "unknown";
}

function canVote(ip: string, now: number): { allowed: boolean; retryAfterSeconds: number } {
  const key = normalizeIp(ip);
  const windowMs = Math.max(1, rateLimitWindowSeconds) * 1000;
  const maxVotes = rateLimitMaxVotes <= 0 ? Infinity : Math.max(1, rateLimitMaxVotes);
  const oldestAllowedTs = now - windowMs;
  const attempts = (ipVotes.get(key) ?? []).filter((ts) => ts >= oldestAllowedTs);

  if (attempts.length >= maxVotes) {
    const oldest = attempts[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    ipVotes.set(key, attempts);
    return { allowed: false, retryAfterSeconds };
  }

  attempts.push(now);
  ipVotes.set(key, attempts);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function getVoteTotals(artists: string[] = [...POLL_ARTISTS]): VoteCounts {
  const result: VoteCounts = {};
  artists.forEach((artist) => {
    result[artist] = voteCounts[artist] ?? 0;
  });
  return result;
}

function shouldUseKvAdapter() {
  if (storageAdapter === "kv") {
    return hasKvEnv;
  }
  if (storageAdapter === "local") {
    return false;
  }
  return hasKvEnv;
}

function getResolvedStorageMode(): "kv" | "local" {
  return shouldUseKvAdapter() ? "kv" : "local";
}

function getWindowMeta(now: number) {
  const windowMs = Math.max(1, rateLimitWindowSeconds) * 1000;
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const windowEnd = windowStart + windowMs;
  return { windowMs, windowStart, windowEnd };
}

function getVoteKey(artist: string): string {
  return `${kvPrefix}:campaign:${campaignId}:votes:${artist}`;
}

function getRateLimitKey(ipAddress: string, windowStart: number): string {
  return `${kvPrefix}:campaign:${campaignId}:rate:${normalizeIp(ipAddress)}:${windowStart}`;
}

function getResetAuditKey(): string {
  return `${kvPrefix}:campaign:${campaignId}:audit:resets`;
}

function hydrateFromDisk() {
  if (!existsSync(storageFile)) {
    return;
  }

  try {
    const raw = readFileSync(storageFile, "utf8");
    const payload = JSON.parse(raw) as { counts?: Record<string, unknown> };
    const persistedCounts = payload.counts ?? {};

    Object.entries(persistedCounts).forEach(([artist, rawValue]) => {
      const value = Number(rawValue);
      voteCounts[artist] = Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
    });
  } catch (error) {
    console.error("[votes-store] Failed to hydrate vote counts from disk", error);
  }
}

function persistToDisk() {
  try {
    mkdirSync(dirname(storageFile), { recursive: true });
    writeFileSync(storageFile, JSON.stringify({ counts: voteCounts, savedAt: new Date().toISOString() }), "utf8");
  } catch (error) {
    console.error("[votes-store] Failed to persist vote counts", error);
  }
}

function persistResetAuditToDisk(event: Record<string, unknown>) {
  try {
    mkdirSync(dirname(auditFile), { recursive: true });
    writeFileSync(auditFile, `${JSON.stringify(event)}\n`, { encoding: "utf8", flag: "a" });
  } catch (error) {
    console.error("[votes-store] Failed to persist reset audit log", error);
  }
}

async function getVoteTotalsFromKv(artists: string[] = [...POLL_ARTISTS]): Promise<VoteCounts> {
  const next = initializeCounts(artists);
  if (!redis) {
    return next;
  }

  const keys = artists.map(getVoteKey);
  const mgetCapable = redis as { mget?: (...keys: string[]) => Promise<Array<string | null>> };
  if (typeof mgetCapable.mget === "function") {
    const values = await mgetCapable.mget(...keys);
    values.forEach((value, index) => {
      const artist = artists[index];
      const numeric = Number(value);
      next[artist] = Number.isFinite(numeric) && numeric >= 0 ? Math.floor(numeric) : 0;
    });
    return next;
  }

  await Promise.all(
    keys.map(async (key, index) => {
      const value = Number(await redis.get<number>(key));
      const artist = artists[index];
      next[artist] = Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
    }),
  );

  return next;
}

async function submitVoteToKv(input: { artist: string; ipAddress: string; now: number; artists: string[] }): Promise<
  | { ok: true; totals: VoteCounts }
  | { ok: false; reason: "rate_limited"; retryAfterSeconds: number }
> {
  if (!redis) {
    return { ok: true, totals: getVoteTotals(input.artists) };
  }

  const { windowEnd, windowStart } = getWindowMeta(input.now);
  const maxVotes = rateLimitMaxVotes <= 0 ? Infinity : Math.max(1, rateLimitMaxVotes);
  const rateKey = getRateLimitKey(input.ipAddress, windowStart);
  const attempts = await redis.incr(rateKey);
  if (attempts === 1) {
    await redis.expire(rateKey, Math.max(1, rateLimitWindowSeconds));
  }

  if (attempts > maxVotes) {
    const retryAfterSeconds = Math.max(1, Math.ceil((windowEnd - input.now) / 1000));
    return { ok: false, reason: "rate_limited", retryAfterSeconds };
  }

  await redis.incr(getVoteKey(input.artist));
  const totals = await getVoteTotalsFromKv(input.artists);
  return { ok: true, totals };
}

async function resetVotesInKv(artists: string[] = [...POLL_ARTISTS]): Promise<VoteCounts> {
  if (!redis) {
    return initializeCounts(artists);
  }

  await Promise.all(artists.map((artist) => redis.del(getVoteKey(artist))));
  return initializeCounts(artists);
}

async function submitVoteToLocal(input: { artist: string; ipAddress: string; now: number; artists: string[] }): Promise<
  | { ok: true; totals: VoteCounts }
  | { ok: false; reason: "rate_limited"; retryAfterSeconds: number }
> {
  const gate = canVote(input.ipAddress, input.now);
  if (!gate.allowed) {
    return { ok: false, reason: "rate_limited", retryAfterSeconds: gate.retryAfterSeconds };
  }

  voteCounts[input.artist] = (voteCounts[input.artist] ?? 0) + 1;
  persistToDisk();
  return { ok: true, totals: getVoteTotals(input.artists) };
}

function resetVotesInLocal(artists: string[] = [...POLL_ARTISTS]): VoteCounts {
  artists.forEach((artist) => {
    voteCounts[artist] = 0;
  });
  persistToDisk();
  return getVoteTotals(artists);
}

export async function getVoteTotalsForApi(artists: string[] = [...POLL_ARTISTS]): Promise<VoteCounts> {
  if (shouldUseKvAdapter()) {
    return getVoteTotalsFromKv(artists);
  }

  return getVoteTotals(artists);
}

export function getVoteStorageStatusForApi(): {
  mode: "kv" | "local";
  configuredAdapter: string;
  kvConfigured: boolean;
  campaignId: string;
} {
  return {
    mode: getResolvedStorageMode(),
    configuredAdapter: storageAdapter,
    kvConfigured: hasKvEnv,
    campaignId,
  };
}

export async function recordResetAuditForApi(event: {
  outcome: "success" | "unauthorized" | "not_configured";
  ipAddress: string;
  userAgent: string;
  totals?: VoteCounts;
}) {
  const payload = {
    at: new Date().toISOString(),
    campaignId,
    mode: getResolvedStorageMode(),
    outcome: event.outcome,
    ipAddress: normalizeIp(event.ipAddress),
    userAgent: event.userAgent,
    totals: event.totals,
  };

  if (shouldUseKvAdapter() && redis) {
    try {
      await redis.lpush(getResetAuditKey(), JSON.stringify(payload));
      await redis.ltrim(getResetAuditKey(), 0, 199);
    } catch (error) {
      console.error("[votes-store] Failed to persist reset audit log in KV", error);
    }
  }

  persistResetAuditToDisk(payload);
}

export async function resetVoteTotalsForApi(artists: string[] = [...POLL_ARTISTS]): Promise<VoteCounts> {
  if (shouldUseKvAdapter()) {
    return resetVotesInKv(artists);
  }

  return resetVotesInLocal(artists);
}

export async function submitVote(input: {
  artist: string;
  ipAddress: string;
  now?: number;
  validArtists?: string[];
}): Promise<
  | { ok: true; totals: VoteCounts }
  | { ok: false; reason: "invalid_artist" }
  | { ok: false; reason: "rate_limited"; retryAfterSeconds: number }
> {
  const now = input.now ?? Date.now();
  const artists = input.validArtists ?? [...POLL_ARTISTS];
  if (!artists.includes(input.artist)) {
    return { ok: false, reason: "invalid_artist" };
  }

  if (shouldUseKvAdapter()) {
    return submitVoteToKv({ artist: input.artist, ipAddress: input.ipAddress, now, artists });
  }

  return submitVoteToLocal({ artist: input.artist, ipAddress: input.ipAddress, now, artists });
}
