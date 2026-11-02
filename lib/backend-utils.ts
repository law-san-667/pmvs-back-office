import { defaultLocale, isLocale } from "@/i18n/config";
import arErrors from "@/i18n/messages/ar/errors.json";
import enErrors from "@/i18n/messages/en/errors.json";
import frErrors from "@/i18n/messages/fr/errors.json";
import ptErrors from "@/i18n/messages/pt/errors.json";

export type BackendResponse<T> = {
  data: T | null;
  error: unknown;
};

export type BackendResponseMode = "simple" | "paginated";

export type PaginatedBackendData<T> = {
  items: T[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
};

export type BackendDataForMode<
  T,
  Mode extends BackendResponseMode,
> = Mode extends "paginated" ? PaginatedBackendData<T> : T;

export type AuthDevice = "WEB" | "MOBILE";
export type UserRole = "CLIENT" | "SELLER" | "MODERATOR" | "ADMIN" | "OPERATOR";
export type UserStatus =
  | "PENDING_VERIFICATION"
  | "ACTIVE"
  | "SUSPENDED"
  | "DELETED";
export type OtpPurpose =
  | "LOGIN"
  | "REGISTER"
  | "PASSWORD_RESET"
  | "VERIFY_EMAIL"
  | "VERIFY_PHONE";

export type PublicUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  mfaEnabled?: boolean;
  /** fr, en, pt or ar: the language of e-mails and notifications. */
  language?: string;
  mfaRequired?: boolean;
};

/** The password was right; a code was sent. */
export type LoginChallenge = {
  mfaRequired: true;
  challengeId: string;
  channel: "WHATSAPP" | "SMS" | "EMAIL";
  destination: string;
  codeLength: number;
  expiresAt: string;
  debugCode: string | null;
};

export type OtpDelivery = {
  channel: "EMAIL" | "PHONE";
  identifier: string;
  expiresAt: string;
  debugCode: string | null;
};

export type AuthOtpActionData = {
  message: string;
  nextAction: "VALIDATE_OTP";
  otp: OtpDelivery | null;
};

export type SignUpData = {
  user: PublicUser;
  nextAction: "VALIDATE_OTP";
  otp: OtpDelivery;
};

export type AuthSuccessData = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshExpiresIn: number;
};

export type ValidateOtpActionData = {
  message: string;
  nextAction: "LOGIN" | "RESET_PASSWORD_COMPLETED" | null;
};

export type ValidateOtpData = AuthSuccessData | ValidateOtpActionData;

export class BackendResponseError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = "BackendResponseError";
  }
}

/**
 * This site's own error texts, when the API gives none. They are the French
 * "errors" messages: the tRPC error formatter (server/trpc/init.ts) puts them
 * in the visitor's language.
 */
export const FALLBACK_ERRORS = frErrors;

const errorMessages = { fr: frErrors, en: enErrors, pt: ptErrors, ar: arErrors };

/**
 * One of the "errors" messages in the page's language (<html lang>), for code
 * outside React; French on the server.
 */
export const errorText = (key: keyof typeof FALLBACK_ERRORS) => {
  const lang =
    typeof document === "undefined" ? undefined : document.documentElement.lang;
  return errorMessages[isLocale(lang) ? lang : defaultLocale][key];
};

type BackendErrorIssue = {
  code?: unknown;
  errors?: unknown;
  message?: unknown;
  path?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const formatIssuePath = (path: unknown) => {
  if (!Array.isArray(path) || path.length === 0) {
    return "";
  }

  return `${path.map(String).join(".")}: `;
};

const getIssueMessages = (
  issue: Record<string, unknown>,
  parentPath: unknown[] = [],
): string[] => {
  const { errors, message, path } = issue as BackendErrorIssue;
  const issuePath = Array.isArray(path) ? [...parentPath, ...path] : parentPath;

  if (Array.isArray(errors)) {
    const nestedMessages = errors.flatMap((nestedError) =>
      Array.isArray(nestedError)
        ? nestedError.flatMap((nestedIssue) =>
            isRecord(nestedIssue)
              ? getIssueMessages(nestedIssue, issuePath)
              : [],
          )
        : isRecord(nestedError)
          ? getIssueMessages(nestedError, issuePath)
          : [],
    );

    if (nestedMessages.length) {
      return nestedMessages;
    }
  }

  return typeof message === "string" && message.trim()
    ? [`${formatIssuePath(issuePath)}${message.trim()}`]
    : [];
};

export const getBackendErrorMessages = (
  error: unknown,
  fallbackMessage: string = FALLBACK_ERRORS.backendFailed,
): string[] => {
  if (typeof error === "string") {
    const message = error.trim();
    return message ? [message] : [];
  }

  if (Array.isArray(error)) {
    return error.flatMap((item) => getBackendErrorMessages(item, ""));
  }

  if (isRecord(error)) {
    if (Array.isArray(error.issues)) {
      const issueMessages = error.issues
        .flatMap((issue) => (isRecord(issue) ? getIssueMessages(issue) : []))
        .filter(Boolean);

      if (issueMessages.length) {
        return issueMessages;
      }
    }

    if ("error" in error) {
      const nestedMessages = getBackendErrorMessages(error.error, "");

      if (nestedMessages.length) {
        return nestedMessages;
      }
    }

    if (typeof error.message === "string" && error.message.trim()) {
      return [error.message.trim()];
    }
  }

  return fallbackMessage ? [fallbackMessage] : [];
};

export const getBackendResponseError = <T>(
  response: BackendResponse<T>,
  fallbackMessage: string = FALLBACK_ERRORS.backendFailed,
) =>
  getBackendErrorMessages(
    response.error,
    response.data === null ? fallbackMessage : "",
  ).at(0) ?? null;

export const normalizeBackendResponse = <T>(
  response: BackendResponse<T>,
  fallbackMessage: string = FALLBACK_ERRORS.backendFailed,
): BackendResponse<T> & { error: string | null } => ({
  data: response.data,
  error: getBackendResponseError(response, fallbackMessage),
});

export const unwrapBackendResponse = <T>(
  response: BackendResponse<T>,
  statusCode?: number,
) => {
  const error = getBackendResponseError(response);

  if (error) {
    throw new BackendResponseError(error, statusCode);
  }

  return response.data as T;
};

export const isAuthSuccessData = (
  data: ValidateOtpData,
): data is AuthSuccessData => "accessToken" in data && "refreshToken" in data;
