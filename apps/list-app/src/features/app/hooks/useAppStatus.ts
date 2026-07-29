import { useCallback, useState } from "react";
import { getErrorMessage } from "../../../lib/errors";

export function useAppStatus() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const setError = useCallback((error: unknown) => {
    setStatusMessage(getErrorMessage(error));
  }, []);

  const clearStatus = useCallback(() => {
    setStatusMessage(null);
  }, []);

  return {
    clearStatus,
    setError,
    setStatusMessage,
    statusMessage,
  };
}
