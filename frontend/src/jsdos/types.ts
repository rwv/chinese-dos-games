export type DosEvent = 'emu-ready' | 'ci-ready' | 'bnd-play' | 'open-key' | 'fullscreen-change'

export interface CommandInterface {
  persist(onlyChanges?: boolean): Promise<Uint8Array | null>
  exit(): Promise<void>
  events(): {
    onMessage(consumer: (type: string, ...args: unknown[]) => void): void
  }
}

export interface DosProps {
  setFullScreen(fullScreen: boolean): void
  stop(): Promise<void>
}

export interface DosOptions {
  dosboxConf: string
  initFs: Uint8Array | Uint8Array[]
  pathPrefix: string
  lang: 'zhs' | 'en'
  backend: 'dosbox' | 'dosboxX'
  workerThread: boolean
  autoStart: boolean
  autoSave: boolean
  kiosk: boolean
  thinSidebar: boolean
  renderAspect: 'AsIs' | '1/1' | '5/4' | '4/3' | '16/10' | '16/9' | 'Fit'
  imageRendering: 'pixelated' | 'smooth'
  theme: 'dark' | 'light'
  onEvent(event: DosEvent, arg?: CommandInterface | boolean): void
}

export type DosFn = (element: HTMLDivElement, options: Partial<DosOptions>) => DosProps

declare global {
  interface Window {
    Dos?: DosFn
  }
}
