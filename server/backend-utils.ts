import "server-only";

import {
  BackendResponseError,
  FALLBACK_ERRORS,
  getBackendResponseError,
  type BackendDataForMode,
  type BackendResponse,
  type BackendResponseMode,
  type PaginatedBackendData,
  unwrapBackendResponse,
} from "@/lib/backend-utils";
import { TRPCError } from "@trpc/server";
import { isAxiosError } from "axios";

type BackendAxiosResponse<T> = {
  data: BackendResponse<T>;
  status: number;
};

type CallBackendOptions<Mode extends BackendResponseMode> = {
  mode?: Mode;
};

const isPaginatedData = <T>(data: unknown): data is PaginatedBackendData<T> =>
  typeof data === "object" &&
  data !== null &&
  Array.isArray((data as PaginatedBackendData<T>).items) &&
  typeof (data as PaginatedBackendData<T>).total === "number" &&
  typeof (data as PaginatedBackendData<T>).totalPages === "number" &&
  typeof (data as PaginatedBackendData<T>).page === "number" &&
  typeof (data as PaginatedBackendData<T>).limit === "number";

const getTRPCCode = (statusCode?: number): TRPCError["code"] => {
  if (statusCode === 401) {
    return "UNAUTHORIZED";
  }

  if (statusCode === 403) {
    return "FORBIDDEN";
  }

  if (statusCode === 404) {
    return "NOT_FOUND";
  }

  if (statusCode === 409) {
    return "CONFLICT";
  }

  if (statusCode && statusCode >= 500) {
    return "INTERNAL_SERVER_ERROR";
  }

  return "BAD_REQUEST";
};

export const asTRPCError = (error: unknown): TRPCError => {
  if (error instanceof TRPCError) {
    return error;
  }

  if (isAxiosError<BackendResponse<unknown>>(error)) {
    const statusCode = error.response?.status;
    const message =
      (error.response?.data
        ? getBackendResponseError(error.response.data)
        : null) ??
      FALLBACK_ERRORS.backendFailed;
    if (!error.response) {
      // The API was not reached: say why in the logs, not to the visitor.
      console.error(`API unreachable: ${error.code ?? ""} ${error.message}`);
    }

    return new TRPCError({
      code: getTRPCCode(statusCode),
      message,
    });
  }

  if (error instanceof BackendResponseError) {
    return new TRPCError({
      code: getTRPCCode(error.statusCode),
      message: error.message,
    });
  }

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message:
      error instanceof Error && error.message
        ? error.message
        : FALLBACK_ERRORS.unexpected,
  });
};

export const callBackend = async <
  T,
  Mode extends BackendResponseMode = "simple",
>(
  request: Promise<BackendAxiosResponse<BackendDataForMode<T, Mode>>>,
  options: CallBackendOptions<Mode> = {},
) => {
  try {
    const response = await request;
    const data = unwrapBackendResponse(response.data, response.status);

    if (options.mode === "paginated" && !isPaginatedData<T>(data)) {
      console.error("Expected a paginated backend response.");
      throw new BackendResponseError(
        FALLBACK_ERRORS.backendFailed,
        response.status,
      );
    }

    return data;
  } catch (error) {
    throw asTRPCError(error);
  }
};
