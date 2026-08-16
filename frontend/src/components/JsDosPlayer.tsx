import { useEffect, useRef, useState } from 'react'
import type { GameInfo } from '../types'
import { buildDosboxConf } from '../jsdos/config'
import { loadJsDos } from '../jsdos/runtime'
import { loadSave, storeSave } from '../jsdos/saves'
import type { CommandInterface, DosProps } from '../jsdos/types'

interface Props {
  game: GameInfo
}

export default function JsDosPlayer({ game }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<DosProps | null>(null)
  const commandRef = useRef<CommandInterface | null>(null)
  const [status, setStatus] = useState('准备 js-dos…')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const host = containerRef.current
    const container = document.createElement('div')
    container.className = 'h-full w-full'
    host.replaceChildren(container)

    const controller = new AbortController()
    let disposed = false
    let saveTimer: number | null = null
    let player: DosProps | null = null
    let command: CommandInterface | null = null

    async function persist(): Promise<void> {
      const changes = await command?.persist(true)
      if (changes) await storeSave(game.identifier, changes)
    }

    async function start(): Promise<void> {
      setError(null)
      setStatus('下载游戏文件…')

      const [Dos, response, savedChanges] = await Promise.all([
        loadJsDos(),
        fetch(`/files/bin/${encodeURIComponent(game.identifier)}.zip`, { signal: controller.signal }),
        loadSave(game.identifier),
      ])
      if (!response.ok) throw new Error(`下载游戏失败：${response.status}`)

      const gameBundle = new Uint8Array(await response.arrayBuffer())
      if (disposed) return

      setStatus('启动模拟器…')
      const initFs = savedChanges ? [gameBundle, savedChanges] : gameBundle
      player = Dos(container, {
        dosboxConf: buildDosboxConf(game),
        initFs,
        pathPrefix: '/js-dos/emulators/',
        lang: 'zhs',
        backend: 'dosbox',
        workerThread: true,
        autoStart: true,
        autoSave: false,
        kiosk: false,
        thinSidebar: true,
        renderAspect: 'Fit',
        imageRendering: 'pixelated',
        theme: 'dark',
        onEvent: (event, arg) => {
          if (event !== 'ci-ready') return
          if (disposed) {
            ;(arg as CommandInterface).exit().catch(console.error)
            return
          }

          command = arg as CommandInterface
          commandRef.current = command
          command.events().onMessage((type, ...args) => {
            if (type === 'error' && String(args[0]).includes('[panic]')) {
              console.error('[js-dos]', ...args)
            }
          })
          setStatus('')
          saveTimer = window.setInterval(() => {
            persist().catch(console.error)
          }, 30_000)
        },
      })
      playerRef.current = player
    }

    start().catch((reason) => {
      if (!controller.signal.aborted) {
        setError(reason instanceof Error ? reason.message : String(reason))
      }
    })

    return () => {
      disposed = true
      controller.abort()
      if (saveTimer !== null) window.clearInterval(saveTimer)
      persist().catch(console.error).finally(() => {
        player?.stop().catch(console.error)
        container.remove()
        if (playerRef.current === player) playerRef.current = null
        if (commandRef.current === command) commandRef.current = null
      })
    }
  }, [game])

  async function saveNow() {
    const changes = await commandRef.current?.persist(true)
    if (changes) {
      await storeSave(game.identifier, changes)
      setStatus('已保存')
      window.setTimeout(() => setStatus(''), 1000)
    }
  }

  function requestFullscreen() {
    playerRef.current?.setFullScreen(true)
  }

  return (
    <div>
      <div className="relative h-[min(70vh,720px)] min-h-96 overflow-hidden rounded-lg bg-black">
        <div ref={containerRef} className="h-full w-full" />
        {status && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/70 text-sm text-white">
            {status}
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black p-6 text-center text-sm text-red-400">
            {error}
          </div>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => saveNow().catch(console.error)}
          className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
        >
          保存进度
        </button>
        <button
          onClick={requestFullscreen}
          className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
        >
          全屏游戏
        </button>
      </div>
    </div>
  )
}
