export const getMutationErrorMessage = (
  error: unknown,
  fallback = "Une erreur est survenue.",
) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};
