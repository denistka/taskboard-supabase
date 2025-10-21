/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_URL: string
  // Supabase credentials no longer needed on client
  // All database access goes through WebSocket server
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

