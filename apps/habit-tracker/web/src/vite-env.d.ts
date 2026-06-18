/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_HABIT_TRACKER_URL?: string;
  readonly VITE_PORTFOLIO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
