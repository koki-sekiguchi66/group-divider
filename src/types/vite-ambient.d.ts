declare module 'vite' {
  export function defineConfig(config: any): any
  export type Plugin = any
}

declare module '@vitejs/plugin-react' {
  const plugin: any
  export default function pluginReact(options?: any): any
}

declare module 'vite-plugin-pwa' {
  type VitePWAOptions = Record<string, any>
  export function VitePWA(options?: VitePWAOptions): any
  const _default: any
  export default _default
}

// Minimal NodeJS environment shims to avoid requiring @types/node locally.
declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined
  }
}

declare const process: any

// Vite import meta types used in app code (avoid installing @types locally)
declare module 'vite/client' {
  interface ImportMetaEnv {
    readonly VITE_APP?: string
    [key: string]: any
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}
