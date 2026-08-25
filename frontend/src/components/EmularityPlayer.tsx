import { useEffect, useRef, useState } from 'react'
import type { GameInfo } from '../types'

const SCRIPTS = [
  '/static/emularity/es6-promise.js',
  '/static/emularity/browserfs.min.js',
  '/static/emularity/loader.js',
]
const scriptPromises = new Map<string, Promise<void>>()

function loadScript(src: string): Promise<void> {
  const existing = scriptPromises.get(src)
  if (existing) return existing

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => {
      script.remove()
      scriptPromises.delete(src)
      reject(new Error(`Failed to load ${src}`))
    }
    document.head.appendChild(script)
  })
  scriptPromises.set(src, promise)
  return promise
}

export default function EmularityPlayer({ game }: { game: GameInfo }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const emulatorRef = useRef<unknown>(null)
  const [error, setError] = useState<string | null>(null)
  const [htmlFullscreen, setHtmlFullscreen] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    let cancelled = false

    async function start(): Promise<void> {
      for (const src of SCRIPTS) await loadScript(src)
      if (cancelled || !window.Emulator || !window.DosBoxLoader) return

      const gameUrl = `/files/bin/${encodeURIComponent(game.identifier)}.zip`
      function locateAdditionalFiles(filename: string) {
        const memUrl = '/static/emularity/dosbox/dosbox-sync.mem'
        return filename === 'dosbox.html.mem' ? memUrl : memUrl + filename
      }

      const DL = window.DosBoxLoader as unknown as {
        emulatorJS: (s: string) => unknown
        locateAdditionalEmulatorJS: (f: typeof locateAdditionalFiles) => unknown
        nativeResolution: (w: number, h: number) => unknown
        fileSystemKey: (s: string) => unknown
        mountZip: (drive: string, config: unknown, type: string) => unknown
        mountImage: (drive: string, filepath: string, driveType: string, fs: string) => unknown
        fetchFile: (label: string, url: string) => unknown
        startExe: (s: string) => unknown
        extraArgs: (args: string[]) => unknown
      }

      const loaderArgs: unknown[] = [
        DL.emulatorJS('/static/emularity/dosbox/dosbox-sync.js'),
        DL.locateAdditionalEmulatorJS(locateAdditionalFiles),
        DL.nativeResolution(640, 480),
        DL.fileSystemKey(game.identifier),
      ]

      const extraArgs = [...(game.dosboxArgs ?? [])]
      const cdImages = game.cdImages && game.cdImages.length > 0
        ? game.cdImages
        : (game.cdImage ?? game.img ? [game.cdImage ?? game.img!] : null)
      if (game.bootImage) {
        loaderArgs.push(DL.mountZip('c', DL.fetchFile('Game File', gameUrl), 'hdd'))
        loaderArgs.push(DL.mountImage('c', `/c/${game.bootImage}`, 'hdd', 'none'))
        extraArgs.push('-c', 'boot -l c')
        loaderArgs.push(DL.startExe(game.executable))
      } else if (cdImages) {
        loaderArgs.push(DL.mountZip('c', DL.fetchFile('Game File', gameUrl), 'hdd'))
        cdImages.forEach((img) => {
          loaderArgs.push(DL.mountImage('d', `/c/${img}`, 'iso', 'iso'))
        })
        loaderArgs.push(DL.startExe(game.executable))
      } else if (game.cdrom) {
        loaderArgs.push(DL.mountZip('c', DL.fetchFile('Game File', gameUrl), 'hdd'))
        const cdromPath = game.cdromPath ? `/emulator/c/${game.cdromPath}` : '/emulator/c'
        extraArgs.push('-c', `mount d "${cdromPath}" -t cdrom`)
        loaderArgs.push(DL.startExe(game.executable))
      } else if (game.floppy) {
        loaderArgs.push(DL.mountZip(game.floppy, DL.fetchFile('Game File', gameUrl), 'floppy'))
        loaderArgs.push(DL.startExe(`${game.floppy}:\\${game.executable}`))
      } else {
        loaderArgs.push(DL.mountZip('c', DL.fetchFile('Game File', gameUrl), 'hdd'))
        loaderArgs.push(DL.startExe(game.executable))
      }

      if (extraArgs.length > 0) loaderArgs.push(DL.extraArgs(extraArgs))

      const loader = new window.DosBoxLoader(...loaderArgs)
      const emulator = new window.Emulator(canvas, null, loader)
      emulatorRef.current = emulator
      emulator.start({ waitAfterDownloading: true })
    }

    start().catch((reason) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason))
    })

    return () => {
      cancelled = true
      const emulator = emulatorRef.current as { quit?: () => void } | null
      emulator?.quit?.()
      emulatorRef.current = null
    }
  }, [game])

  function requestFullscreen() {
    const emulator = emulatorRef.current as { requestFullScreen?: () => void } | null
    emulator?.requestFullScreen?.()
  }

  // 向 canvas 派发合成键盘事件, 触发 dosbox 内置快捷键
  // Ctrl+F11 减速 / Ctrl+F12 加速 (dosbox cycles 调节)
  function sendDosboxKey(key: string, code: string): void {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.focus()
    for (const type of ['keydown', 'keyup'] as const) {
      canvas.dispatchEvent(new KeyboardEvent(type, {
        key, code, ctrlKey: true, bubbles: true, cancelable: true,
      }))
    }
  }

  return (
    <div>
      <div className="rounded-lg border border-gray-200 bg-black">
        <div className={htmlFullscreen ? 'fixed inset-0 z-[2000]' : ''}>
          <canvas
            ref={canvasRef}
            className="emscripten mx-auto block"
            style={htmlFullscreen
              ? { width: '100%', height: '100%', objectFit: 'contain' }
              : { width: '100%' }}
            onContextMenu={(event) => event.preventDefault()}
          />
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setHtmlFullscreen((value) => !value)}
          className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
        >
          网页全屏
        </button>
        <button
          onClick={requestFullscreen}
          className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
        >
          全屏游戏
        </button>
        <button
          onClick={() => sendDosboxKey('F11', 'F11')}
          className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
          title="降低 CPU 速度 (Ctrl+F11)"
        >
          减速
        </button>
        <button
          onClick={() => sendDosboxKey('F12', 'F12')}
          className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
          title="提高 CPU 速度 (Ctrl+F12)"
        >
          加速
        </button>
      </div>
      {htmlFullscreen && (
        <button
          onClick={() => setHtmlFullscreen(false)}
          className="fixed bottom-4 right-4 z-[3000] rounded bg-white/80 px-3 py-1 text-sm opacity-30 hover:opacity-100"
        >
          退出
        </button>
      )}
    </div>
  )
}
