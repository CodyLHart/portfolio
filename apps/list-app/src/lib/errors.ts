export const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  const maybeError = error as { message?: unknown };
  if (typeof maybeError?.message === "string") {
    return maybeError.message;
  }

  return "Something went wrong.";
};
