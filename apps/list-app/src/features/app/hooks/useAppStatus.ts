import { useState } from "react";

export function useAppStatus() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  return {
    setStatusMessage,
    statusMessage,
  };
}
