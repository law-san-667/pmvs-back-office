/** Supervision types, shared by the tRPC router and the page (client-safe). */

export type MonitoringAlert = {
  id: string;
  rule: string;
  severity: "WARNING" | "CRITICAL";
  status: "OPEN" | "RESOLVED";
  title: string;
  details: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  lastNotifiedAt: string | null;
  resolvedAt: string | null;
};

export type MonitoredJob = {
  name: string;
  label: string;
  everyMinutes: number | null;
  lastStatus: "RUNNING" | "SUCCEEDED" | "FAILED" | null;
  lastStartedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  failures24h: number;
  late: boolean;
};

export type SystemStatus = {
  checkedAt: string;
  uptimeSeconds: number;
  database: {
    latencyMs: number;
    sizeBytes: number;
    connections: number;
    largestTables: { name: string; sizeBytes: number; rows: number }[];
  };
  services: {
    whatsapp: { configured: boolean; state: string | null };
    sms: { configured: boolean };
    email: { configured: boolean };
  };
  messages24h: { channel: string; status: string; count: number }[];
  requests15m: { serverErrors: number; recorded: number; p95Ms: number };
  jobs: MonitoredJob[];
  openAlerts: MonitoringAlert[];
};

export type JobRun = {
  id: string;
  name: string;
  status: "RUNNING" | "SUCCEEDED" | "FAILED";
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  result: unknown;
  error: string | null;
};

export type MonitoringSettings = {
  emails: string[];
  phones: string[];
  serverErrorsPer15Min: number;
  slowP95Ms: number;
  databaseSizeMb: number;
  checkWhatsapp: boolean;
  repeatHours: number;
};

export const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
  return `${(bytes / 1024 ** 3).toFixed(2)} Go`;
};

export const formatEvery = (minutes: number | null) => {
  if (!minutes) return "—";
  if (minutes < 60) return `toutes les ${minutes} min`;
  if (minutes === 24 * 60) return "chaque jour";
  return `toutes les ${Math.round(minutes / 60)} h`;
};

export const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days) return `${days} j ${hours} h`;
  if (hours) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
};
