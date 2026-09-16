export type StatusClass = "2xx" | "3xx" | "4xx" | "5xx";
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type LogUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string | null;
} | null;

export type RequestLogSummary = {
  id: string;
  reqId: string | null;
  method: string;
  path: string;
  route: string | null;
  status: number;
  errorMessage: string | null;
  durationMs: number;
  userId: string | null;
  userRole: string | null;
  ip: string | null;
  createdAt: string;
  user: LogUser;
};

export type RequestLogDetail = RequestLogSummary & {
  query: Record<string, string> | null;
  requestHeaders: Record<string, string> | null;
  requestBody: unknown;
  responseBody: unknown;
  errorStack: string | null;
  userAgent: string | null;
};

export type DiagnosticsOverview = {
  from: string;
  to: string;
  bucketSeconds: number;
  totals: {
    recorded: number;
    writes: number;
    failedWrites: number;
    writeErrorRate: number;
    clientErrors: number;
    serverErrors: number;
    affectedUsers: number;
    avgDurationMs: number;
    p95DurationMs: number;
  };
  timeline: Array<{
    bucket: string;
    success: number;
    clientErrors: number;
    serverErrors: number;
  }>;
  statusCodes: Array<{ status: number; count: number }>;
  topRoutes: Array<{
    method: string;
    route: string;
    total: number;
    failures: number;
    avgDurationMs: number;
    lastSeenAt: string;
    lastError: string | null;
  }>;
  topErrors: Array<{
    status: number;
    errorMessage: string;
    count: number;
    lastSeenAt: string;
    sampleId: string;
  }>;
};
