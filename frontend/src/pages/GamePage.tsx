import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchGame } from '../api'
import type { GameInfo } from '../types'

const EMULARITY_SCRIPTS = [
  '/static/emularity/es6-promise.js',
  '/static/emularity/browserfs.min.js',
  '/static/emularity/loader.js',
]

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

export default function GamePage() {
  const { identifier } = useParams<{ identifier: string }>()
  const [game, setGame] = useState<GameInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [htmlFullscreen, setHtmlFullscreen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const emulatorRef = useRef<unknown>(null)

  useEffect(() => {
    if (!identifier) return
    const decoded = decodeURIComponent(identifier)
    fetchGame(decoded)
      .then((data) => setGame(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [identifier])

  useEffect(() => {
    if (!game || !canvasRef.current) return
    const canvas = canvasRef.current
    let cancelled = false
    const scripts: HTMLScriptElement[] = []

    async function initEmulator() {
      // 顺序加载三个 emularity 脚本
      for (const src of EMULARITY_SCRIPTS) {
        await loadScript(src)
      }
      if (cancelled || !window.Emulator || !window.DosBoxLoader) return

      const gameUrl = `/files/bin/${encodeURIComponent(game!.identifier)}.zip`

      function locateAdditionalFiles(filename: string) {
        const memUrl = '/static/emularity/dosbox/dosbox-sync.mem'
        if (filename === 'dosbox.html.mem') return memUrl
        return memUrl + filename
      }

      const DL = window.DosBoxLoader as unknown as {
        emulatorJS: (s: string) => unknown
        locateAdditionalEmulatorJS: (f: typeof locateAdditionalFiles) => unknown
        nativeResolution: (w: number, h: number) => unknown
        fileSystemKey: (s: string) => unknown
        mountZip: (drive: string, config: unknown, type: string) => unknown
        fetchFile: (label: string, url: string) => unknown
        startExe: (s: string) => unknown
      }

      // 挂载策略（与 dos.lol 线上已验证的配置一致）：
      // - cdImage 游戏：zip 挂载到 C:（hdd），再用 imgmount 将 ISO 挂载到 D:（cdrom）
      // - cdrom 游戏：zip 挂载到 C:（可写）+ D:（cdrom），解决存档和光盘检测问题
      // - floppy 游戏：zip 挂载到 A: 或 B:（由 floppy 字段指定盘符），executable 加盘符前缀
      // - 普通游戏：zip 挂载到 C:（hdd）
      const loaderArgs: unknown[] = [
        DL.emulatorJS('/static/emularity/dosbox/dosbox-sync.js'),
        DL.locateAdditionalEmulatorJS(locateAdditionalFiles),
        DL.nativeResolution(640, 480),
        DL.fileSystemKey(game!.identifier),
      ]

      if (game!.cdImage) {
        // 游戏 zip 内含 CD 镜像（iso），需要 imgmount 挂载为光盘
        loaderArgs.push(DL.mountZip('c', DL.fetchFile('Game File', gameUrl), 'hdd'))
        loaderArgs.push(
          (DL as unknown as { mountImage: (drive: string, filepath: string, driveType: string, fs: string) => unknown })
            .mountImage('d', `/c/${game!.cdImage}`, 'iso', 'iso')
        )
        loaderArgs.push(DL.startExe(game!.executable))
      } else if (game!.cdrom) {
        loaderArgs.push(DL.mountZip('c', DL.fetchFile('Game File', gameUrl), 'hdd'))
        loaderArgs.push(DL.mountZip('d', DL.fetchFile('Game File (CD)', gameUrl), 'cdrom'))
        loaderArgs.push(DL.startExe(game!.executable))
      } else if (game!.floppy) {
        // floppy 字段是盘符：'a' 或 'b'
        const drive = game!.floppy === 'b' ? 'b' : 'a'
        loaderArgs.push(DL.mountZip(drive, DL.fetchFile('Game File', gameUrl), 'floppy'))
        loaderArgs.push(DL.startExe(`${drive}:\\${game!.executable}`))
      } else {
        loaderArgs.push(DL.mountZip('c', DL.fetchFile('Game File', gameUrl), 'hdd'))
        loaderArgs.push(DL.startExe(game!.executable))
      }

      const loader = new window.DosBoxLoader(...loaderArgs)

      const emulator = new window.Emulator(canvas, null, loader)
      emulatorRef.current = emulator
      emulator.start({ waitAfterDownloading: true })
    }

    initEmulator().catch((e) => setError(e.message))

    return () => {
      cancelled = true
      const emulator = emulatorRef.current as { quit?: () => void } | null
      if (emulator?.quit) {
        emulator.quit()
      }
      emulatorRef.current = null
      // 清理本组件插入的 script 标签
      for (const src of EMULARITY_SCRIPTS) {
        const el = document.querySelector(`script[src="${src}"]`)
        if (el && scripts.includes(el as HTMLScriptElement)) {
          el.remove()
        }
      }
    }
  }, [game])

  function toggleHtmlFullscreen() {
    setHtmlFullscreen((prev) => !prev)
  }

  function requestFullscreen() {
    const emulator = emulatorRef.current as { requestFullScreen?: () => void } | null
    if (emulator?.requestFullScreen) {
      emulator.requestFullScreen()
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">加载中…</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
  if (!game) return null

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* 模拟器区域 */}
        <div className="flex-1">
          <div className="rounded-lg border border-gray-200 bg-black">
            <div id="screen_container" className={htmlFullscreen ? 'fixed inset-0 z-[2000]' : ''}>
              <canvas
                ref={canvasRef}
                className="emscripten block mx-auto"
                style={htmlFullscreen
                  ? { width: '100%', height: '100%', objectFit: 'contain' }
                  : { width: '100%' }}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">{game.name['zh-Hans']}</h3>
            <div className="ml-auto flex gap-2">
              <button
                onClick={toggleHtmlFullscreen}
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
            </div>
          </div>
        </div>

        {/* 信息侧栏 */}
        <div className="w-full lg:w-80 space-y-4">
          {game.keymaps && (
            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="mb-2 font-semibold text-gray-800">操作</h4>
              {Object.entries(game.keymaps).map(([k, v]) => (
                <div key={k} className="mb-1 text-sm">
                  <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">{k}</kbd>{' '}
                  <span className="text-gray-600">{v}</span>
                </div>
              ))}
            </div>
          )}

          {game.cheats && (
            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="mb-2 font-semibold text-gray-800">作弊</h4>
              {Object.entries(game.cheats).map(([k, v]) => (
                <div key={k} className="mb-1 text-sm">
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">{k}</code>{' '}
                  <span className="text-gray-600">{v}</span>
                </div>
              ))}
            </div>
          )}

          {game.links && (
            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="mb-2 font-semibold text-gray-800">链接</h4>
              {Object.entries(game.links).map(([k, v]) => (
                <div key={k} className="mb-1">
                  <a href={v} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                    {k}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 网页全屏时的退出按钮 */}
      {htmlFullscreen && (
        <button
          onClick={toggleHtmlFullscreen}
          className="fixed bottom-4 right-4 z-[3000] rounded bg-white/80 px-3 py-1 text-sm opacity-30 hover:opacity-100"
        >
          退出
        </button>
      )}
    </div>
  )
}
