/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  Pi?: {
    authenticate: (
      scopes: string[],
      options: { onIncompletePaymentFound: (payment: any) => Promise<void> }
    ) => Promise<{ accessToken: string; user: { uid: string } }>;
  }
}
