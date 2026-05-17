/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly GATEWAY_URL?: string;
  readonly AGENT_PROVIDER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
