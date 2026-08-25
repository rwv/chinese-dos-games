import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchGame } from '../api'
import EmularityPlayer from '../components/EmularityPlayer'
import JsDosPlayer from '../components/JsDosPlayer'
import type { GameInfo } from '../types'

type Engine = 'emularity' | 'js-dos'

function initialEngine(): Engine {
  return localStorage.getItem('dos-engine') === 'js-dos' ? 'js-dos' : 'emularity'
}

export default function GamePage() {
  const { identifier } = useParams<{ identifier: string }>()
  const [game, setGame] = useState<GameInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [engine, setEngine] = useState<Engine>(initialEngine)

  useEffect(() => {
    if (!identifier) return
    fetchGame(decodeURIComponent(identifier))
      .then(setGame)
      .catch((reason) => setError(reason instanceof Error ? reason.message : String(reason)))
      .finally(() => setLoading(false))
  }, [identifier])

  function selectEngine(next: Engine) {
    localStorage.setItem('dos-engine', next)
    setEngine(next)
  }

  if (loading) return <div className="p-8 text-center text-gray-500">加载中…</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
  if (!game) return null

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="mr-auto text-lg font-semibold text-gray-800">{game.name['zh-Hans']}</h3>
            <span className="text-sm text-gray-500">模拟器：</span>
            <button
              onClick={() => selectEngine('emularity')}
              className={`rounded border px-3 py-1 text-sm ${engine === 'emularity' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-100'}`}
            >
              emularity（稳定）
            </button>
            <button
              onClick={() => selectEngine('js-dos')}
              className={`rounded border px-3 py-1 text-sm ${engine === 'js-dos' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:bg-gray-100'}`}
            >
              js-dos（试用）
            </button>
          </div>

          {engine === 'js-dos'
            ? <JsDosPlayer key={`js-dos-${game.identifier}`} game={game} />
            : <EmularityPlayer key={`emularity-${game.identifier}`} game={game} />}
        </div>

        <div className="w-full space-y-4 lg:w-80">
          {game.keymaps && (
            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="mb-2 font-semibold text-gray-800">操作</h4>
              {Object.entries(game.keymaps).map(([key, value]) => (
                <div key={key} className="mb-1 text-sm">
                  <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">{key}</kbd>{' '}
                  <span className="text-gray-600">{value}</span>
                </div>
              ))}
            </div>
          )}

          {game.notes && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h4 className="mb-2 font-semibold text-gray-800">备注</h4>
              <p className="text-sm text-gray-600">{game.notes}</p>
            </div>
          )}

          {game.cheats && (
            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="mb-2 font-semibold text-gray-800">作弊</h4>
              {Object.entries(game.cheats).map(([key, value]) => (
                <div key={key} className="mb-1 text-sm">
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">{key}</code>{' '}
                  <span className="text-gray-600">{value}</span>
                </div>
              ))}
            </div>
          )}

          {game.links && (
            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="mb-2 font-semibold text-gray-800">链接</h4>
              {Object.entries(game.links).map(([key, value]) => (
                <div key={key} className="mb-1">
                  <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                    {key}
                  </a>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-500">
            {engine === 'js-dos' ? (
              <>
                <p>js-dos 每 30 秒保存一次文件系统变更，并在下次启动时自动恢复。</p>
                <p className="mt-2">支持软键盘、手柄、光盘镜像、加速和存档管理。</p>
              </>
            ) : (
              <>
                <p>游戏存档保存在浏览器本地（IndexedDB），清除浏览器数据会导致存档丢失。</p>
                <p className="mt-2">加速：<kbd className="rounded bg-gray-100 px-1 font-mono text-xs">Ctrl+F12</kbd> 加速 / <kbd className="rounded bg-gray-100 px-1 font-mono text-xs">Ctrl+F11</kbd> 减速</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
