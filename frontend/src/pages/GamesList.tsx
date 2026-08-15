import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchGames } from '../api'
import type { GameInfo } from '../types'

export default function GamesList() {
  const [games, setGames] = useState<GameInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      <h2 className="mb-4 text-xl font-semibold text-gray-800">游戏列表</h2>
      <ul className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {games.map((game) => (
          <li key={game.identifier} className="truncate">
            <Link
              to={`/games/${encodeURIComponent(game.identifier)}`}
              className="text-sm text-blue-600 hover:underline"
            >
              {game.name['zh-Hans']}
            </Link>
            {game.name.en && (
              <span className="ml-1 text-xs text-gray-400">{game.name.en}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
