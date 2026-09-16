import type { RequestLogDetail } from "@/lib/diagnostics-types";

export const RANGE_PRESETS = [
  { key: "15m", label: "15 min", ms: 15 * 60_000 },
  { key: "1h", label: "1 h", ms: 60 * 60_000 },
  { key: "6h", label: "6 h", ms: 6 * 60 * 60_000 },
  { key: "24h", label: "24 h", ms: 24 * 60 * 60_000 },
  { key: "7d", label: "7 j", ms: 7 * 24 * 60 * 60_000 },
  { key: "30d", label: "30 j", ms: 30 * 24 * 60 * 60_000 },
] as const;

export type RangeKey = (typeof RANGE_PRESETS)[number]["key"];

/** Freezes "now" so the query key stays stable until the next refresh. */
export const computeRange = (key: RangeKey) => {
  const preset = RANGE_PRESETS.find((item) => item.key === key)!;
  const to = new Date();
  return {
    from: new Date(to.getTime() - preset.ms).toISOString(),
    to: to.toISOString(),
  };
};

export const statusClasses = (status: number) => {
  if (status >= 500) return "border-red-300 bg-red-50 text-red-700";
  if (status >= 400) return "border-amber-300 bg-amber-50 text-amber-800";
  if (status >= 300) return "border-slate-300 bg-slate-50 text-slate-700";
  return "border-green-300 bg-green-50 text-green-700";
};

export const METHOD_CLASSES: Record<string, string> = {
  GET: "bg-sky-100 text-sky-800",
  POST: "bg-emerald-100 text-emerald-800",
  PUT: "bg-violet-100 text-violet-800",
  PATCH: "bg-orange-100 text-orange-800",
  DELETE: "bg-red-100 text-red-800",
};

export const formatDuration = (ms: number) =>
  ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;

export const formatTime = (value: string, withSeconds = true) =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: withSeconds ? "medium" : "short",
  }).format(new Date(value));

export const formatPercent = (ratio: number) =>
  `${(ratio * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export const prettyJson = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
};

const shellQuote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;

/** Headers curl sets itself, or that only describe the original connection. */
const SKIPPED_CURL_HEADERS = new Set([
  "host",
  "content-length",
  "connection",
  "accept-encoding",
  "x-forwarded-for",
  "x-forwarded-proto",
  "x-real-ip",
]);

/**
 * Replays a stored request. Redacted secrets stay as placeholders: the admin
 * swaps in a fresh token or a test password before running it.
 */
export const buildCurl = (log: RequestLogDetail) => {
  // The stored Host header is the API the client actually reached.
  const host = log.requestHeaders?.host ?? "localhost:8080";
  const protocol =
    host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const url = new URL(log.path, `${protocol}://${host}`);
  for (const [key, value] of Object.entries(log.query ?? {})) {
    url.searchParams.set(key, String(value));
  }

  const parts = [`curl -X ${log.method} ${shellQuote(url.toString())}`];
  for (const [key, value] of Object.entries(log.requestHeaders ?? {})) {
    if (SKIPPED_CURL_HEADERS.has(key.toLowerCase())) continue;
    parts.push(`-H ${shellQuote(`${key}: ${value}`)}`);
  }
  if (log.requestBody !== null && log.requestBody !== undefined) {
    const body =
      typeof log.requestBody === "string"
        ? log.requestBody
        : JSON.stringify(log.requestBody);
    parts.push(`--data-raw ${shellQuote(body)}`);
  }

  return parts.join(" \\\n  ");
};

export const describeUser = (user: RequestLogDetail["user"]) =>
  user
    ? `${user.firstName} ${user.lastName}`.trim() ||
      user.email ||
      user.phoneNumber ||
      user.id
    : null;
