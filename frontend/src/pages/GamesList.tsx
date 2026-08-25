import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchGames } from '../api'
import type { GameInfo } from '../types'
import { useNameLocale } from '../hooks/useNameLocale'

export default function GamesList() {
  const [games, setGames] = useState<GameInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [locale, setLocale] = useNameLocale()

  useEffect(() => {
    fetchGames()
      .then((data) => setGames(data.games))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-gray-500">加载中…</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800">游戏列表</h2>
        <div className="flex gap-1 rounded border border-gray-300 p-0.5 text-xs">
          <button
            onClick={() => setLocale('zh-Hans')}
            className={`rounded px-2 py-1 ${locale === 'zh-Hans' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            中文
          </button>
          <button
            onClick={() => setLocale('en')}
            className={`rounded px-2 py-1 ${locale === 'en' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            EN
          </button>
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {games.map((game) => {
          const name = locale === 'en' && game.name.en ? game.name.en : game.name['zh-Hans']
          return (
            <li key={game.identifier} className="truncate">
              <Link
                to={`/games/${encodeURIComponent(game.identifier)}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {name}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
