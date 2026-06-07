import "server-only";

import { env } from "@/config/env/client";
import Axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosInstance,
  type AxiosResponseHeaders,
  type InternalAxiosRequestConfig,
  type RawAxiosResponseHeaders,
} from "axios";
import { cookies, headers } from "next/headers";

const backendUrls = {
  development: "http://localhost:8080/v1",
  production:
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    "https://pmvs-backend-production.up.railway.app/v1",
};

const defaultRequestHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
  "Cache-Control": "no-cache",
} as const;

export type CreateApiClientOptions = {
  req?: Request | null;
  resHeaders?: Headers | null;
};

const authCookieNames = ["token", "access_token", "refresh_token"] as const;
const refreshTokenEndpoint = "/refresh-token";

type RefreshTokenData = {
  accessToken: string;
  refreshToken: string;
  tokenType?: "Bearer";
  expiresIn: number;
  refreshExpiresIn: number;
};

type BackendRefreshResponse = {
  data?: RefreshTokenData | null;
  error?: string | null;
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const cookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "Lax",
  secure: process.env.NODE_ENV === "production",
} as const;

const serializeCookie = (name: string, value: string, maxAge: number) => {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAge}`,
    `Path=${cookieOptions.path}`,
    `SameSite=${cookieOptions.sameSite}`,
    "HttpOnly",
  ];

  if (cookieOptions.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
};

const decodeCookieValue = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const getBackendBaseUrl = () => {
  const baseUrl =
    backendUrls[env.NEXT_PUBLIC_ENV as keyof typeof backendUrls] ??
    backendUrls.development;

  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

const parseCookieHeader = (cookieHeader: string | null) => {
  if (!cookieHeader) {
    return new Map<string, string>();
  }

  return new Map(
    cookieHeader
      .split(";")
      .map((part) => {
        const separatorIndex = part.indexOf("=");

        if (separatorIndex === -1) {
          return [part.trim(), ""] as const;
        }

        const name = part.slice(0, separatorIndex).trim();
        const value = part.slice(separatorIndex + 1).trim();

        return [name, decodeCookieValue(value)] as const;
      })
      .filter(([name]) => name.length > 0),
  );
};

const serializeCookieHeader = (cookieMap: Map<string, string>) =>
  Array.from(cookieMap.entries())
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join("; ");

const updateAuthCookieHeader = (
  cookieHeader: string | null,
  tokens: RefreshTokenData,
) => {
  const cookieMap = parseCookieHeader(cookieHeader);

  cookieMap.set("access_token", tokens.accessToken);
  cookieMap.set("refresh_token", tokens.refreshToken);

  return serializeCookieHeader(cookieMap);
};

const splitSetCookieHeader = (headerValue: string) => {
  const values: string[] = [];
  let current = "";
  let inExpiresAttribute = false;

  for (let index = 0; index < headerValue.length; index += 1) {
    const char = headerValue[index];
    const lowerCaseSlice = headerValue.slice(index).toLowerCase();

    if (!inExpiresAttribute && lowerCaseSlice.startsWith("expires=")) {
      inExpiresAttribute = true;
    }

    if (char === "," && !inExpiresAttribute) {
      if (current.trim().length > 0) {
        values.push(current.trim());
      }
      current = "";
      continue;
    }

    if (char === ";" && inExpiresAttribute) {
      inExpiresAttribute = false;
    }

    current += char;
  }

  if (current.trim().length > 0) {
    values.push(current.trim());
  }

  return values;
};

const getSetCookieHeaders = (
  responseHeaders?: RawAxiosResponseHeaders | AxiosResponseHeaders,
) => {
  const headerValue =
    responseHeaders?.["set-cookie"] ?? responseHeaders?.["Set-Cookie"];

  if (Array.isArray(headerValue)) {
    return headerValue.filter((value): value is string => Boolean(value));
  }

  if (typeof headerValue === "string" && headerValue.length > 0) {
    return splitSetCookieHeader(headerValue);
  }

  return [];
};

const appendSetCookieHeaders = (
  resHeaders: Headers | null | undefined,
  responseHeaders?: RawAxiosResponseHeaders | AxiosResponseHeaders,
) => {
  if (!resHeaders) {
    return;
  }

  for (const cookieValue of getSetCookieHeaders(responseHeaders)) {
    resHeaders.append("set-cookie", cookieValue);
  }
};

const appendAuthSetCookieHeaders = (
  resHeaders: Headers | null | undefined,
  tokens: RefreshTokenData,
) => {
  if (!resHeaders) {
    return;
  }

  resHeaders.append(
    "set-cookie",
    serializeCookie("access_token", tokens.accessToken, tokens.expiresIn),
  );
  resHeaders.append(
    "set-cookie",
    serializeCookie(
      "refresh_token",
      tokens.refreshToken,
      tokens.refreshExpiresIn,
    ),
  );
};

const getRefreshTokenData = (payload: unknown): RefreshTokenData | null => {
  const data =
    typeof payload === "object" && payload !== null && "data" in payload
      ? (payload as BackendRefreshResponse).data
      : payload;

  if (
    typeof data === "object" &&
    data !== null &&
    typeof (data as RefreshTokenData).accessToken === "string" &&
    typeof (data as RefreshTokenData).refreshToken === "string" &&
    typeof (data as RefreshTokenData).expiresIn === "number" &&
    typeof (data as RefreshTokenData).refreshExpiresIn === "number"
  ) {
    return data as RefreshTokenData;
  }

  return null;
};

const isRefreshTokenRequest = (config?: InternalAxiosRequestConfig) => {
  if (!config?.url) {
    return false;
  }

  const url = config.url.startsWith("http")
    ? new URL(config.url).pathname
    : config.url;

  return url === refreshTokenEndpoint;
};

const getRequestHeaders = async (req?: Request | null) => {
  if (req) {
    return new Headers(req.headers);
  }

  try {
    return new Headers(await headers());
  } catch {
    return new Headers();
  }
};

const getCookieHeader = async (req?: Request | null) => {
  const requestHeaders = await getRequestHeaders(req);
  const cookieHeader = requestHeaders.get("cookie");

  if (cookieHeader) {
    return cookieHeader;
  }

  try {
    return (await cookies()).toString();
  } catch {
    return "";
  }
};

export const getRequestAuthState = async (req?: Request | null) => {
  const requestHeaders = await getRequestHeaders(req);
  const cookieHeader = (await getCookieHeader(req)) || null;
  const authorizationHeader = requestHeaders.get("authorization");
  const cookieMap = parseCookieHeader(cookieHeader);

  const authTokenFromCookie = authCookieNames
    .map((name) => cookieMap.get(name))
    .find((value) => Boolean(value));

  const bearerToken =
    authorizationHeader?.toLowerCase().startsWith("bearer ") === true
      ? authorizationHeader.slice(7).trim()
      : null;

  const token = bearerToken ?? authTokenFromCookie ?? null;

  return {
    authorizationHeader,
    bearerToken,
    cookieHeader,
    hasAuthCookie: authCookieNames.some((name) => cookieMap.has(name)),
    isAuthenticated: Boolean(token),
    token,
  };
};

export const createApiClient = async (
  options: CreateApiClientOptions = {},
): Promise<AxiosInstance> => {
  const [requestHeaders, authState] = await Promise.all([
    getRequestHeaders(options.req),
    getRequestAuthState(options.req),
  ]);

  const api = Axios.create({
    baseURL: getBackendBaseUrl(),
    headers: defaultRequestHeaders,
    withCredentials: true,
  });
  const refreshClient = Axios.create({
    baseURL: getBackendBaseUrl(),
    headers: defaultRequestHeaders,
    withCredentials: true,
  });
  let refreshPromise: Promise<RefreshTokenData | null> | null = null;
  let currentCookieHeader = authState.cookieHeader;
  let currentAuthorizationHeader =
    authState.authorizationHeader ?? requestHeaders.get("authorization");

  const refreshAccessToken = async () => {
    if (refreshPromise) {
      return refreshPromise;
    }

    const cookieMap = parseCookieHeader(currentCookieHeader || null);
    const refreshToken = cookieMap.get("refresh_token");

    if (!refreshToken) {
      return null;
    }

    refreshPromise = refreshClient
      .post(
        refreshTokenEndpoint,
        { refreshToken },
        {
          headers: {
            cookie: currentCookieHeader,
          },
        },
      )
      .then((response) => {
        appendSetCookieHeaders(options.resHeaders, response.headers);

        const tokens = getRefreshTokenData(response.data);

        if (tokens) {
          currentCookieHeader = updateAuthCookieHeader(
            currentCookieHeader ?? null,
            tokens,
          );
          currentAuthorizationHeader = `Bearer ${tokens.accessToken}`;
          appendAuthSetCookieHeaders(options.resHeaders, tokens);
        }

        return tokens;
      })
      .catch((error: AxiosError) => {
        appendSetCookieHeaders(options.resHeaders, error.response?.headers);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });

    return refreshPromise;
  };

  api.interceptors.request.use((config) => {
    const configHeaders = AxiosHeaders.from(config.headers ?? {});

    if (currentCookieHeader && !configHeaders.has("cookie")) {
      configHeaders.set("cookie", currentCookieHeader);
    }

    if (currentAuthorizationHeader && !configHeaders.has("authorization")) {
      configHeaders.set("authorization", currentAuthorizationHeader);
    }

    config.headers = configHeaders;

    return config;
  });

  api.interceptors.response.use(
    (response) => {
      appendSetCookieHeaders(options.resHeaders, response.headers);
      return response;
    },
    async (error) => {
      appendSetCookieHeaders(options.resHeaders, error?.response?.headers);

      const originalRequest = error?.config as
        | RetriableRequestConfig
        | undefined;

      if (
        error?.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !isRefreshTokenRequest(originalRequest)
      ) {
        originalRequest._retry = true;

        const tokens = await refreshAccessToken();

        if (tokens) {
          const retryHeaders = AxiosHeaders.from(originalRequest.headers ?? {});
          const cookieHeader = updateAuthCookieHeader(
            retryHeaders.get("cookie")?.toString() ??
              currentCookieHeader ??
              null,
            tokens,
          );

          retryHeaders.set("cookie", cookieHeader);
          retryHeaders.set("authorization", `Bearer ${tokens.accessToken}`);
          originalRequest.headers = retryHeaders;

          return api.request(originalRequest);
        }
      }

      return Promise.reject(error);
    },
  );

  return api;
};

export const api = {
  async delete<T = unknown>(...args: Parameters<AxiosInstance["delete"]>) {
    const client = await createApiClient();
    return client.delete<T>(...args);
  },
  async get<T = unknown>(...args: Parameters<AxiosInstance["get"]>) {
    const client = await createApiClient();
    return client.get<T>(...args);
  },
  async patch<T = unknown>(...args: Parameters<AxiosInstance["patch"]>) {
    const client = await createApiClient();
    return client.patch<T>(...args);
  },
  async post<T = unknown>(...args: Parameters<AxiosInstance["post"]>) {
    const client = await createApiClient();
    return client.post<T>(...args);
  },
  async put<T = unknown>(...args: Parameters<AxiosInstance["put"]>) {
    const client = await createApiClient();
    return client.put<T>(...args);
  },
  async request<T = unknown>(...args: Parameters<AxiosInstance["request"]>) {
    const client = await createApiClient();
    return client.request<T>(...args);
  },
};

export default api;
