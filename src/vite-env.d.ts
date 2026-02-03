/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_HF_TOKEN: string
    readonly VITE_HF_MODEL: string
    readonly VITE_GEMINI_API_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
