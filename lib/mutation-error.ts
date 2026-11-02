import { errorText } from "@/lib/backend-utils";

export const getMutationErrorMessage = (
  error: unknown,
  fallback: string = errorText("generic"),
) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
