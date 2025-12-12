/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FMP_API_KEY?: string
  readonly VITE_IEX_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
