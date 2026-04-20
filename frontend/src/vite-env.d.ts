/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_ADMIN_EMAIL: string;
  readonly VITE_BACKEND_URL: string;
  readonly REACT_APP_BACKEND_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
