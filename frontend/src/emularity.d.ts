// emularity 是无类型声明的全局库，这里声明用到的接口
declare global {
  interface Window {
    Emulator?: new (
      canvas: HTMLCanvasElement,
      setStatus?: ((e: unknown) => void) | null,
      loader: unknown
    ) => EmulatorInstance
    DosBoxLoader?: new (...args: unknown[]) => unknown
  }
}

interface EmulatorInstance {
  start: (opts?: { waitAfterDownloading?: boolean }) => void
  requestFullScreen: () => void
  quit?: () => void
}

export {}
